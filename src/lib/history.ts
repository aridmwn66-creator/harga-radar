// Mock price-history series for the Price Report trend chart.
//
// TODO(PROMPT 2 / backend): replace this with real historical data from the
// backend (e.g. GET /v1/prices/history?modelId=...&range=6m). For now we
// synthesize a believable series: phones depreciate slowly, so the line drifts
// gently downward over time and lands on the model's current median. The series
// is deterministic per model (seeded by modelId) so it does not jump on rerender.

export type HistoryPoint = {
  index: number;
  priceIdr: number;
  /** Sparse x-axis label ("6 bln", "now"), empty for unlabeled points. */
  label: string;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A ~6 month weekly series ending at `currentMedianIdr`. `points` samples.
 * Older points sit a bit higher (the phone was newer/pricier), with small noise.
 */
export function getPriceHistory(
  modelId: string,
  currentMedianIdr: number,
  points = 26,
): HistoryPoint[] {
  if (currentMedianIdr <= 0 || points < 2) return [];
  const rnd = mulberry32(seedFromId(modelId));
  // Total decline across the window (older -> ~18-28% higher than now).
  const decline = 0.18 + rnd() * 0.1;

  const series: HistoryPoint[] = [];
  for (let i = 0; i < points; i += 1) {
    const ageFrac = (points - 1 - i) / (points - 1); // 1 at oldest, 0 at newest
    const trend = 1 + ageFrac * decline;
    const noise = 1 + (rnd() - 0.5) * 0.05; // +/- 2.5%
    const raw = currentMedianIdr * trend * noise;
    const priceIdr = Math.max(0, Math.round(raw / 10_000) * 10_000);
    let label = '';
    if (i === 0) label = '6 bln';
    else if (i === Math.floor((points - 1) / 2)) label = '3 bln';
    else if (i === points - 1) label = 'now';
    series.push({ index: i, priceIdr, label });
  }
  // Anchor the last point exactly to the current median.
  const last = series[points - 1];
  if (last) last.priceIdr = Math.round(currentMedianIdr);
  return series;
}
