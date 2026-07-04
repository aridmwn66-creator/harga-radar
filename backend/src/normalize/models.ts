import type { ModelDef, ModelSummary } from '../types.js';

// Model catalog. Ids/names/brands/storages mirror the app's catalog exactly, so
// the backend returns the same modelIds the app already knows.

export const MODELS: ModelDef[] = [
  { id: 'iphone-11', name: 'iPhone 11', brand: 'Apple', storages: [64, 128, 256] },
  { id: 'iphone-12', name: 'iPhone 12', brand: 'Apple', storages: [64, 128, 256] },
  { id: 'iphone-13', name: 'iPhone 13', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-14', name: 'iPhone 14', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-15', name: 'iPhone 15', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'samsung-galaxy-s23', name: 'Galaxy S23', brand: 'Samsung', storages: [128, 256, 512] },
  { id: 'samsung-galaxy-a54', name: 'Galaxy A54 5G', brand: 'Samsung', storages: [128, 256], aliases: ['galaxy a54', 'samsung a54'] },
  { id: 'samsung-galaxy-a35', name: 'Galaxy A35 5G', brand: 'Samsung', storages: [128, 256], aliases: ['galaxy a35', 'samsung a35'] },
  { id: 'xiaomi-redmi-note-13', name: 'Redmi Note 13', brand: 'Xiaomi', storages: [128, 256] },
  { id: 'poco-x6-pro', name: 'POCO X6 Pro', brand: 'POCO', storages: [256, 512] },
  { id: 'google-pixel-7', name: 'Pixel 7', brand: 'Google', storages: [128, 256] },
  { id: 'oppo-reno-11', name: 'Reno 11 5G', brand: 'OPPO', storages: [256], aliases: ['oppo reno 11', 'reno 11'] },
  { id: 'vivo-v29', name: 'V29 5G', brand: 'vivo', storages: [256], aliases: ['vivo v29'] },
  { id: 'iphone-x', name: 'iPhone X', brand: 'Apple', storages: [64, 256] },
  { id: 'iphone-xr', name: 'iPhone XR', brand: 'Apple', storages: [64, 128, 256] },
  { id: 'iphone-se-2022', name: 'iPhone SE (2022)', brand: 'Apple', storages: [64, 128, 256], aliases: ['iphone se', 'iphone se 2022', 'iphone se 3'] },
  { id: 'iphone-13-pro', name: 'iPhone 13 Pro', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-16', name: 'iPhone 16', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-16-plus', name: 'iPhone 16 Plus', brand: 'Apple', storages: [128, 256, 512] },
  { id: 'iphone-16e', name: 'iPhone 16e', brand: 'Apple', storages: [128, 256] },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', brand: 'Apple', storages: [128, 256, 512, 1024] },
  { id: 'iphone-16-pro-max', name: 'iPhone 16 Pro Max', brand: 'Apple', storages: [256, 512, 1024] },
  { id: 'iphone-17', name: 'iPhone 17', brand: 'Apple', storages: [256, 512] },
  { id: 'iphone-17-plus', name: 'iPhone 17 Plus', brand: 'Apple', storages: [256, 512] },
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', brand: 'Apple', storages: [256, 512, 1024] },
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', brand: 'Apple', storages: [256, 512, 1024] },
  { id: 'samsung-galaxy-s22', name: 'Galaxy S22', brand: 'Samsung', storages: [128, 256] },
  { id: 'samsung-galaxy-s24', name: 'Galaxy S24', brand: 'Samsung', storages: [256, 512] },
  { id: 'samsung-galaxy-s24-ultra', name: 'Galaxy S24 Ultra', brand: 'Samsung', storages: [256, 512, 1024] },
  { id: 'samsung-galaxy-a34', name: 'Galaxy A34 5G', brand: 'Samsung', storages: [128, 256], aliases: ['galaxy a34', 'samsung a34'] },
  { id: 'samsung-galaxy-a15', name: 'Galaxy A15', brand: 'Samsung', storages: [128, 256], aliases: ['samsung a15'] },
  { id: 'samsung-galaxy-m14', name: 'Galaxy M14 5G', brand: 'Samsung', storages: [128], aliases: ['galaxy m14', 'samsung m14'] },
  { id: 'xiaomi-redmi-note-12', name: 'Redmi Note 12', brand: 'Xiaomi', storages: [128, 256] },
  { id: 'xiaomi-14', name: 'Xiaomi 14', brand: 'Xiaomi', storages: [256, 512] },
  { id: 'poco-x6', name: 'POCO X6', brand: 'POCO', storages: [256, 512] },
  { id: 'xiaomi-redmi-13c', name: 'Redmi 13C', brand: 'Xiaomi', storages: [128, 256] },
  { id: 'oppo-a78', name: 'A78 5G', brand: 'OPPO', storages: [128, 256], aliases: ['oppo a78'] },
  { id: 'oppo-a58', name: 'A58', brand: 'OPPO', storages: [128], aliases: ['oppo a58'] },
  { id: 'vivo-v30', name: 'V30 5G', brand: 'vivo', storages: [256, 512], aliases: ['vivo v30'] },
  { id: 'vivo-y36', name: 'Y36', brand: 'vivo', storages: [128, 256], aliases: ['vivo y36'] },
  { id: 'realme-12', name: 'Realme 12', brand: 'Realme', storages: [128, 256] },
  { id: 'realme-c55', name: 'Realme C55', brand: 'Realme', storages: [128, 256] },
  { id: 'realme-11', name: 'Realme 11', brand: 'Realme', storages: [128, 256] },
  { id: 'infinix-note-40', name: 'Infinix Note 40', brand: 'Infinix', storages: [128, 256] },
  { id: 'tecno-spark-20', name: 'Tecno Spark 20', brand: 'Tecno', storages: [128, 256] },
];

const BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export function getModel(id: string): ModelDef | undefined {
  return BY_ID.get(id);
}

export function toModelSummary(m: ModelDef): ModelSummary {
  return { id: m.id, name: m.name, brand: m.brand, availableStorageGb: m.storages };
}

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Match keys per model, longest first, so the MOST specific model wins (e.g.
// "iPhone 16 Pro Max" beats "iPhone 16"). Each key is a normalized substring we
// look for inside a listing title.
type MatchKey = { key: string; modelId: string };

const MATCH_KEYS: MatchKey[] = (() => {
  const keys: MatchKey[] = [];
  for (const m of MODELS) {
    const raw = new Set<string>([m.name, ...(m.aliases ?? [])]);
    // Also a "5G"-stripped variant, since sellers often drop the 5G suffix.
    raw.add(m.name.replace(/\b5g\b/gi, '').trim());
    for (const r of raw) {
      const k = norm(r);
      if (k.length >= 4) keys.push({ key: k, modelId: m.id });
    }
  }
  return keys.sort((a, b) => b.key.length - a.key.length);
})();

/**
 * Map a listing title to a modelId, choosing the most specific match. Returns
 * null if nothing plausible matches.
 */
export function matchModelId(title: string): string | null {
  const t = norm(title);
  for (const { key, modelId } of MATCH_KEYS) {
    if (t.includes(key)) return modelId;
  }
  return null;
}

// Aliases for the search endpoint (user queries like "ip 11").
const QUERY_ALIASES: Record<string, string> = { ip: 'iphone', hp: '', samsung: 'samsung galaxy' };

function expandQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/\bip(?=\d)/g, 'ip ')
    .split(/\s+/)
    .map((tok) => (tok in QUERY_ALIASES ? QUERY_ALIASES[tok] : tok))
    .join(' ')
    .trim();
}

function scoreModel(m: ModelDef, q: string): number {
  const nq = norm(expandQuery(q));
  if (nq.length === 0) return 0;
  const hay = norm(`${m.brand} ${m.name}`);
  if (hay === nq) return 100;
  if (hay.startsWith(nq)) return 80;
  if (hay.includes(nq)) return 60;
  const tokens = expandQuery(q).split(/\s+/).map(norm).filter(Boolean);
  if (tokens.length > 0 && tokens.every((tk) => hay.includes(tk))) return 40;
  return 0;
}

/** Search the catalog for models matching a free-text query. */
export function searchModels(q: string): ModelSummary[] {
  const trimmed = q.trim();
  if (trimmed.length === 0) return [];
  return MODELS.map((m) => ({ m, s: scoreModel(m, trimmed) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => toModelSummary(r.m));
}

/** The human search term a scraper should type into a marketplace. */
export function searchTermFor(m: ModelDef): string {
  const brandFirst = m.brand.toLowerCase().split(' ')[0] ?? '';
  const nameHasBrand = norm(m.name).includes(norm(brandFirst));
  return nameHasBrand ? m.name : `${m.brand} ${m.name}`;
}
