import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { pricesQuerySchema } from '../schemas.js';
import { getOrCompute } from '../cache/cache.js';
import { buildQuery, fetchPriceReport } from '../pipeline.js';
import type { PriceReport } from '../types.js';

// GET /v1/prices?modelId=...&storageGb=128&condition=used&location=jakarta
//   -> PriceReport (aggregate + listings), matching the app's shape exactly.
//
// Aggressively cached per (modelId, storageGb, condition, location). Even if
// some sources fail, a valid (possibly empty) report is returned - never a 500.
export function registerPricesRoute(app: FastifyInstance): void {
  app.get('/v1/prices', async (request, reply) => {
    const parsed = pricesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
    }
    const { modelId, storageGb, condition, location } = parsed.data;

    const query = buildQuery({ modelId, storageGb, condition, location });
    if (!query) {
      return reply.code(404).send({ error: 'unknown_model', modelId });
    }

    const cacheKey = [
      'prices',
      modelId,
      storageGb ?? 'any',
      condition ?? 'any',
      location ?? 'any',
    ].join(':');

    try {
      const { value } = await getOrCompute(cacheKey, config.cache.ttlSeconds, async () => {
        const { report, runs } = await fetchPriceReport(query);
        return {
          report,
          sources: runs.map((r) => ({ source: r.source, ok: r.ok, count: r.listings.length })),
        };
      });

      // Expose per-source status via headers (non-breaking; body is the report).
      reply.header('x-sources', JSON.stringify(value.sources));
      return value.report satisfies PriceReport;
    } catch (err) {
      // Should not happen (the pipeline swallows source errors), but never 500
      // the whole request: return a valid empty report.
      request.log.error({ err }, 'prices pipeline error');
      const empty: PriceReport = {
        modelId: query.modelId,
        modelName: query.model.name,
        aggregate: { median: 0, mean: 0, p25: 0, p75: 0, min: 0, max: 0, count: 0, bySource: [] },
        listings: [],
      };
      return empty;
    }
  });
}
