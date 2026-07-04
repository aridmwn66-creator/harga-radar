import type { Listing, NormalizedQuery, RawListing, SourceRun } from '../types.js';
import {
  extractStorageGb,
  inferCondition,
  isJunk,
  parsePostedAt,
} from '../lib/text.js';
import { matchModelId } from './models.js';
import { median, removeOutliersIqr } from './aggregate.js';

// Plausible price band for a phone (IDR). Anything outside is almost certainly
// an accessory, a typo, or a "nego" placeholder.
const MIN_PRICE = 150_000;
const MAX_PRICE = 150_000_000;

/** Stable, deterministic id from a string (djb2). */
function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function rawToListing(raw: RawListing, query: NormalizedQuery, nowMs: number): Listing | null {
  const title = raw.title.trim();
  if (title.length === 0) return null;
  if (isJunk(title)) return null;
  if (!Number.isFinite(raw.priceIdr) || raw.priceIdr < MIN_PRICE || raw.priceIdr > MAX_PRICE) {
    return null;
  }

  // Only keep listings that actually match the requested model.
  const modelId = matchModelId(title);
  if (modelId !== query.modelId) return null;

  const condition = inferCondition(title, raw.conditionHint ?? 'used');
  const storageGb = extractStorageGb(title);

  return {
    id: `${raw.source}-${hashId(raw.url || `${title}|${raw.priceIdr}`)}`,
    title,
    priceIdr: Math.round(raw.priceIdr),
    condition,
    storageGb,
    modelId,
    location: (raw.location ?? query.location ?? 'Indonesia').trim() || 'Indonesia',
    source: raw.source,
    url: raw.url,
    thumbnailUrl: raw.imageUrl,
    postedAt: parsePostedAt(raw.postedAtRaw, nowMs),
  };
}

/**
 * Turn the raw results of every source into a clean, filtered, deduped list of
 * listings for the requested model + variant + condition.
 */
export function normalizeListings(
  runs: SourceRun[],
  query: NormalizedQuery,
  nowMs: number = Date.now(),
): Listing[] {
  const seen = new Set<string>();
  const listings: Listing[] = [];

  for (const run of runs) {
    for (const raw of run.listings) {
      const listing = rawToListing(raw, query, nowMs);
      if (!listing) continue;

      // Filter by requested variant / condition.
      if (query.storageGb != null && listing.storageGb !== query.storageGb) continue;
      if (query.condition != null && listing.condition !== query.condition) continue;
      if (
        query.location != null &&
        query.location.length > 0 &&
        !listing.location.toLowerCase().includes(query.location.toLowerCase())
      ) {
        continue;
      }

      // Dedupe by url (or title+price when the url is missing).
      const key = listing.url || `${listing.title.toLowerCase()}|${listing.priceIdr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      listings.push(listing);
    }
  }

  // Two-stage outlier removal:
  //  1) a median band that ALWAYS runs, to kill gross outliers (mistyped
  //     "Rp 99.000.000", accessory bundles) even when there are few listings;
  //  2) the finer IQR fence, which needs enough points to be meaningful.
  const banded = pruneByMedianBand(listings);
  const cleaned = removeOutliersIqr(banded, (l) => l.priceIdr);
  return cleaned.sort((a, b) => a.priceIdr - b.priceIdr);
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
