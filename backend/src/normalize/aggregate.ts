import type { Aggregate, Listing, PriceReport, SourceAggregate, SourceId } from '../types.js';

// Statistics for turning a bag of listings into a price report. Mirrors the
// aggregation the app already uses so the numbers line up.

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
  return loVal + (hiVal - loVal) * (idx - lo);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** Drop extreme outliers using the Tukey IQR fence. */
export function removeOutliersIqr<T>(items: T[], value: (t: T) => number): T[] {
  if (items.length < 8) return [...items];
  const sorted = [...items].sort((a, b) => value(a) - value(b));
  const vals = sorted.map(value);
  const q1 = percentile(vals, 0.25);
  const q3 = percentile(vals, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter((t) => {
    const v = value(t);
    return v >= lower && v <= upper;
  });
}

function bySource(listings: Listing[]): SourceAggregate[] {
  const groups = new Map<SourceId, number[]>();
  for (const l of listings) {
    const arr = groups.get(l.source) ?? [];
    arr.push(l.priceIdr);
    groups.set(l.source, arr);
  }
  return [...groups.entries()]
    .map(([source, prices]) => ({ source, count: prices.length, median: Math.round(median(prices)) }))
    .sort((a, b) => b.count - a.count);
}

export function buildAggregate(listings: Listing[]): Aggregate {
  const prices = listings.map((l) => l.priceIdr).sort((a, b) => a - b);
  const sources = bySource(listings);
  if (prices.length === 0) {
    return { median: 0, mean: 0, p25: 0, p75: 0, min: 0, max: 0, count: 0, bySource: sources };
  }
  return {
    median: Math.round(percentile(prices, 0.5)),
    mean: Math.round(mean(prices)),
    p25: Math.round(percentile(prices, 0.25)),
    p75: Math.round(percentile(prices, 0.75)),
    min: Math.round(prices[0] as number),
    max: Math.round(prices[prices.length - 1] as number),
    count: listings.length,
    bySource: sources,
  };
}

export function buildReport(modelId: string, modelName: string, listings: Listing[]): PriceReport {
  return { modelId, modelName, aggregate: buildAggregate(listings), listings };
}
