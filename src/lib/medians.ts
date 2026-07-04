import type { Condition } from '@/types';
import { median } from './stats';
import { LISTINGS } from '@/data/fixtures/listings';
import { MODELS } from '@/data/fixtures/models';

// Per-model "harga pasaran" (median) used by the Budget calculator, which needs
// every model's price at once.
//
// TODO(PROMPT 2 / backend): the live backend should expose a bulk endpoint
// (e.g. GET /v1/medians?condition=used) so this does not require pulling all
// listings client-side. For now we compute it directly from the bundled mock
// listings, which is exactly what the mock provider is built on.

export type ModelMedian = {
  modelId: string;
  modelName: string;
  brand: string;
  medianIdr: number;
  count: number;
};

let cache: ModelMedian[] | null = null;

export function getModelMedians(condition: Condition = 'used'): ModelMedian[] {
  // Condition is part of the cache key only implicitly; recompute if it differs.
  if (cache && cache.length > 0 && condition === 'used') return cache;

  const byModel = new Map<string, number[]>();
  for (const l of LISTINGS) {
    if (l.condition !== condition) continue;
    const arr = byModel.get(l.modelId) ?? [];
    arr.push(l.priceIdr);
    byModel.set(l.modelId, arr);
  }

  const result: ModelMedian[] = [];
  for (const m of MODELS) {
    const prices = byModel.get(m.id) ?? [];
    if (prices.length === 0) continue;
    result.push({
      modelId: m.id,
      modelName: m.name,
      brand: m.brand,
      medianIdr: Math.round(median(prices)),
      count: prices.length,
    });
  }
  result.sort((a, b) => a.medianIdr - b.medianIdr);
  if (condition === 'used') cache = result;
  return result;
}
