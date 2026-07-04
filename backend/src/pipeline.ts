import type { NormalizedQuery, PriceReport, SourceRun } from './types.js';
import { config } from './config.js';
import { runSources } from './sources/registry.js';
import { normalizeListings } from './normalize/normalize.js';
import { buildReport } from './normalize/aggregate.js';
import { getModel, searchTermFor } from './normalize/models.js';

// Orchestration: given a normalized query, run the sources, normalize + aggregate
// their raw listings, and build the PriceReport. Never throws on source failure;
// returns a valid (possibly empty) report.

export function buildQuery(params: {
  modelId: string;
  storageGb?: number;
  condition?: 'new' | 'used';
  location?: string;
}): NormalizedQuery | null {
  const model = getModel(params.modelId);
  if (!model) return null;
  return {
    modelId: model.id,
    model,
    searchTerm: searchTermFor(model),
    storageGb: params.storageGb,
    condition: params.condition,
    location: params.location,
    limit: config.maxListingsPerSource,
  };
}

export async function fetchPriceReport(
  query: NormalizedQuery,
): Promise<{ report: PriceReport; runs: SourceRun[] }> {
  const runs = await runSources(query);
  const listings = normalizeListings(runs, query);
  const report = buildReport(query.modelId, query.model.name, listings);
  return { report, runs };
}
