import type { Condition, Listing, NormalizedQuery, RawListing, SourceId, SourceRun } from '../types.js';
import {
  extractStorageGb,
  inferCondition,
  isJunk,
  parsePostedAt,
} from '../lib/text.js';
import { matchModelId } from './models.js';
import { median, removeOutliersIqr } from './aggregate.js';
import { createLogger } from '../lib/logger.js';

const log = createLogger('normalize');

// Plausible price band for a phone (IDR). Anything outside is almost certainly
// an accessory, a typo, or a "nego" placeholder.
const MIN_PRICE = 150_000;
const MAX_PRICE = 150_000_000;

// Every way a raw listing can be dropped, so the funnel logging can say exactly
// which filter removed which source's listings (e.g. Tokopedia dropped entirely
// by "wrong_condition" because it sells NEW units while "used" was requested).
const DROP_REASONS = [
  'empty_title',
  'junk',
  'bad_price',
  'model_mismatch',
  'wrong_storage',
  'wrong_condition',
  'wrong_location',
  'duplicate',
  'outlier',
] as const;
type DropReason = (typeof DROP_REASONS)[number];

type SourceFunnel = { in: number; kept: number; drops: Record<DropReason, number> };

function emptyDrops(): Record<DropReason, number> {
  const d = {} as Record<DropReason, number>;
  for (const r of DROP_REASONS) d[r] = 0;
  return d;
}

/** Stable, deterministic id from a string (djb2). */
function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

type Outcome = { ok: true; listing: Listing } | { ok: false; reason: DropReason };

/** Evaluate one raw listing: accept it (as a clean Listing) or say why not. */
function evaluate(
  raw: RawListing,
  query: NormalizedQuery,
  nowMs: number,
  seen: Set<string>,
): Outcome {
  const title = raw.title.trim();
  if (title.length === 0) return { ok: false, reason: 'empty_title' };
  if (isJunk(title)) return { ok: false, reason: 'junk' };
  if (!Number.isFinite(raw.priceIdr) || raw.priceIdr < MIN_PRICE || raw.priceIdr > MAX_PRICE) {
    return { ok: false, reason: 'bad_price' };
  }

  // Only keep listings that actually match the requested model.
  const modelId = matchModelId(title);
  if (modelId !== query.modelId) return { ok: false, reason: 'model_mismatch' };

  // Classify condition from the title, falling back to the source default
  // (OLX/Carousell/FB lean used, Tokopedia/Shopee lean new). New listings are
  // NOT discarded as invalid: they are classified and, when the request asks
  // for "new", aggregated as the new-price ("harga baru") baseline.
  const condition = inferCondition(title, raw.conditionHint ?? 'used');
  const storageGb = extractStorageGb(title);

  if (query.storageGb != null && storageGb !== query.storageGb) {
    return { ok: false, reason: 'wrong_storage' };
  }
  if (query.condition != null && condition !== query.condition) {
    return { ok: false, reason: 'wrong_condition' };
  }

  const location = (raw.location ?? query.location ?? 'Indonesia').trim() || 'Indonesia';
  if (
    query.location != null &&
    query.location.length > 0 &&
    !location.toLowerCase().includes(query.location.toLowerCase())
  ) {
    return { ok: false, reason: 'wrong_location' };
  }

  const price = Math.round(raw.priceIdr);
  const key = raw.url || `${title.toLowerCase()}|${price}`;
  if (seen.has(key)) return { ok: false, reason: 'duplicate' };
  seen.add(key);

  return {
    ok: true,
    listing: {
      id: `${raw.source}-${hashId(raw.url || `${title}|${price}`)}`,
      title,
      priceIdr: price,
      condition,
      storageGb,
      modelId,
      location,
      source: raw.source,
      url: raw.url,
      thumbnailUrl: raw.imageUrl,
      postedAt: parsePostedAt(raw.postedAtRaw, nowMs),
    },
  };
}

/**
 * Turn the raw results of every source into a clean, filtered, deduped list of
 * listings for the requested model + variant + condition. Logs a per-source
 * funnel (in -> kept, with drop reasons) so a source that scrapes fine but
 * contributes nothing after filtering (for example, all its units are the other
 * condition) is diagnosable instead of silently vanishing.
 */
export function normalizeListings(
  runs: SourceRun[],
  query: NormalizedQuery,
  nowMs: number = Date.now(),
): Listing[] {
  const funnel = new Map<SourceId, SourceFunnel>();
  const track = (source: SourceId): SourceFunnel => {
    let f = funnel.get(source);
    if (!f) {
      f = { in: 0, kept: 0, drops: emptyDrops() };
      funnel.set(source, f);
    }
    return f;
  };

  const seen = new Set<string>();
  const accepted: Listing[] = [];

  for (const run of runs) {
    for (const raw of run.listings) {
      const f = track(raw.source);
      f.in += 1;
      const outcome = evaluate(raw, query, nowMs, seen);
      if (outcome.ok) accepted.push(outcome.listing);
      else f.drops[outcome.reason] += 1;
    }
  }

  // Outlier removal, PER CONDITION. New and used are different markets, so a
  // (higher) new price must not be treated as an outlier of a used-dominated
  // distribution, and vice versa. Keeps conditions cleanly separated even when
  // a request does not pin a single condition.
  const cleaned = removeOutliersByCondition(accepted);

  // Attribute the outlier drops back to each source (pre vs post) and record the
  // final kept count, for the funnel log.
  const postBySource = countBySource(cleaned);
  for (const [source, f] of funnel) {
    const before = accepted.reduce((n, l) => (l.source === source ? n + 1 : n), 0);
    const after = postBySource.get(source) ?? 0;
    f.drops.outlier += before - after;
    f.kept = after;
  }
  logFunnel(query, funnel, cleaned.length);

  return cleaned.sort((a, b) => a.priceIdr - b.priceIdr);
}

function countBySource(listings: Listing[]): Map<SourceId, number> {
  const m = new Map<SourceId, number>();
  for (const l of listings) m.set(l.source, (m.get(l.source) ?? 0) + 1);
  return m;
}

/** Two-stage outlier removal, applied independently within each condition. */
function removeOutliersByCondition(listings: Listing[]): Listing[] {
  const byCondition = new Map<Condition, Listing[]>();
  for (const l of listings) {
    const arr = byCondition.get(l.condition) ?? [];
    arr.push(l);
    byCondition.set(l.condition, arr);
  }
  const out: Listing[] = [];
  for (const group of byCondition.values()) {
    // 1) a median band that ALWAYS runs, to kill gross outliers (mistyped
    //    "Rp 99.000.000", accessory bundles) even when there are few listings;
    // 2) the finer IQR fence, which needs enough points to be meaningful.
    const banded = pruneByMedianBand(group);
    out.push(...removeOutliersIqr(banded, (l) => l.priceIdr));
  }
  return out;
}

/** Drop listings more than ~3x above or below the median price. */
function pruneByMedianBand(listings: Listing[]): Listing[] {
  if (listings.length < 4) return listings;
  const med = median(listings.map((l) => l.priceIdr));
  if (med <= 0) return listings;
  const low = med / 3;
  const high = med * 3;
  return listings.filter((l) => l.priceIdr >= low && l.priceIdr <= high);
}

function logFunnel(
  query: NormalizedQuery,
  funnel: Map<SourceId, SourceFunnel>,
  finalCount: number,
): void {
  const scope =
    `${query.modelId} cond=${query.condition ?? 'any'} ` +
    `store=${query.storageGb ?? 'any'} loc=${query.location ?? 'any'}`;
  const parts: string[] = [];
  for (const [source, f] of funnel) {
    const drops = DROP_REASONS.filter((r) => f.drops[r] > 0)
      .map((r) => `${r}=${f.drops[r]}`)
      .join(',');
    parts.push(`${source}: in=${f.in} kept=${f.kept}${drops ? ` drops{${drops}}` : ''}`);
  }
  const body = parts.length > 0 ? parts.join(' | ') : '(no sources returned listings)';
  log.info(`${scope} | ${body} | total kept=${finalCount}`);
}
