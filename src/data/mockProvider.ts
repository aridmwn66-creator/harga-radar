import type {
  ModelSummary,
  PriceProvider,
  PriceReport,
  ReportParams,
} from '@/types';
import { computeAggregate } from '@/lib/stats';
import { MOCK_LATENCY_MS } from './config';
import { LISTINGS } from './fixtures/listings';
import { MODELS, getModel } from './fixtures/models';

// The default provider. Reads bundled fixtures, applies the same filtering and
// aggregation the real backend would, and simulates a little latency so the
// loading skeletons are visible on first launch.

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    const jitter = ms * (0.6 + Math.random() * 0.8);
    setTimeout(() => resolve(value), jitter);
  });
}

/** Normalize a search token: lowercase, strip everything but a-z0-9. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Lightweight aliases so "ip11", "iphone11", "ip 11" all resolve to iPhone 11.
const ALIASES: Record<string, string> = {
  ip: 'iphone',
  hp: '',
  samsung: 'samsung galaxy',
};

function expandAliases(query: string): string {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((tok) => (tok in ALIASES ? ALIASES[tok] : tok))
    .join(' ')
    .trim();
}

function scoreModel(model: ModelSummary, query: string): number {
  const q = normalize(expandAliases(query));
  if (q.length === 0) return 0;
  const haystack = normalize(`${model.brand} ${model.name}`);
  if (haystack === q) return 100;
  if (haystack.startsWith(q)) return 80;
  if (haystack.includes(q)) return 60;
  // Token subset match: every query token appears somewhere in the haystack.
  const tokens = expandAliases(query)
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  const allPresent = tokens.every((t) => haystack.includes(t));
  if (allPresent && tokens.length > 0) return 40;
  return 0;
}

export const mockProvider: PriceProvider = {
  async search(query: string): Promise<ModelSummary[]> {
    const trimmed = query.trim();
    if (trimmed.length === 0) return delay([]);
    const ranked = MODELS.map((m) => ({ m, score: scoreModel(m, trimmed) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.m);
    return delay(ranked);
  },

  async getReport(params: ReportParams): Promise<PriceReport> {
    const { modelId, storageGb, condition, location } = params;
    const model = getModel(modelId);

    const listings = LISTINGS.filter((l) => {
      if (l.modelId !== modelId) return false;
      if (storageGb != null && l.storageGb !== storageGb) return false;
      if (condition != null && l.condition !== condition) return false;
      if (location != null && location.length > 0) {
        if (!l.location.toLowerCase().includes(location.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => a.priceIdr - b.priceIdr);

    const report: PriceReport = {
      modelId,
      modelName: model?.name ?? modelId,
      aggregate: computeAggregate(listings),
      listings,
    };
    return delay(report);
  },
};
