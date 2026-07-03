import type { Aggregate, Listing, SourceAggregate, SourceId } from '@/types';

// Statistics used to turn a bag of listings into a "harga pasaran" report.
// Pure functions, no side effects, fully typed.

/**
 * Linear-interpolated percentile of a numeric sample.
 * `p` is in [0, 1]. Returns 0 for an empty sample.
 */
export function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0] as number;
  const clamped = Math.min(1, Math.max(0, p));
  const idx = clamped * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const loVal = sortedAsc[lo] as number;
  const hiVal = sortedAsc[hi] as number;
  if (lo === hi) return loVal;
  const weight = idx - lo;
  return loVal + (hiVal - loVal) * weight;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Drop extreme outliers using the IQR fence (Tukey). This keeps a mistyped
 * "Rp 1.000.000.000" or a Rp 0 "nego" post from wrecking the median.
 * Returns the input unchanged when there are too few points to be meaningful.
 */
export function removeOutliersIqr(values: number[]): number[] {
  if (values.length < 8) return [...values];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter((v) => v >= lower && v <= upper);
}

/** Compute the full aggregate for a set of listings (median = harga pasaran). */
export function computeAggregate(listings: Listing[]): Aggregate {
  const prices = listings.map((l) => l.priceIdr);
  const cleaned = removeOutliersIqr(prices).sort((a, b) => a - b);
  const effective = cleaned.length > 0 ? cleaned : [...prices].sort((a, b) => a - b);

  const bySource = aggregateBySource(listings);

  if (effective.length === 0) {
    return {
      median: 0,
      mean: 0,
      p25: 0,
      p75: 0,
      min: 0,
      max: 0,
      count: 0,
      bySource,
    };
  }

  return {
    median: Math.round(percentile(effective, 0.5)),
    mean: Math.round(mean(effective)),
    p25: Math.round(percentile(effective, 0.25)),
    p75: Math.round(percentile(effective, 0.75)),
    min: Math.round(effective[0] as number),
    max: Math.round(effective[effective.length - 1] as number),
    count: listings.length,
    bySource,
  };
}

function aggregateBySource(listings: Listing[]): SourceAggregate[] {
  const groups = new Map<SourceId, number[]>();
  for (const l of listings) {
    const arr = groups.get(l.source) ?? [];
    arr.push(l.priceIdr);
    groups.set(l.source, arr);
  }
  return [...groups.entries()]
    .map(([source, prices]) => ({
      source,
      count: prices.length,
      median: Math.round(median(prices)),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * How far below the median a price sits, as a positive fraction.
 * 0.18 means "18% below median". Returns 0 for prices at or above median.
 */
export function dealScore(priceIdr: number, medianIdr: number): number {
  if (medianIdr <= 0 || priceIdr >= medianIdr) return 0;
  return (medianIdr - priceIdr) / medianIdr;
}

/** A listing counts as a deal ("di bawah pasaran") when meaningfully below median. */
export const DEAL_THRESHOLD = 0.03;

export function isDeal(priceIdr: number, medianIdr: number): boolean {
  return dealScore(priceIdr, medianIdr) >= DEAL_THRESHOLD;
}

/** Count how many listings sit below the median (used for watchlist snapshots). */
export function countBelowMedian(listings: Listing[], medianIdr: number): number {
  return listings.filter((l) => l.priceIdr < medianIdr).length;
}

/** Count how many listings sit at or below a target price. */
export function countBelowTarget(listings: Listing[], targetIdr: number): number {
  return listings.filter((l) => l.priceIdr <= targetIdr).length;
}
