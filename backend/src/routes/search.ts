import type { FastifyInstance } from 'fastify';
import { searchQuerySchema } from '../schemas.js';
import { searchModels } from '../normalize/models.js';

// GET /v1/search?q=iphone+11 -> ModelSummary[]
// Catalog lookup only (no scraping), so it is instant.
export function registerSearchRoute(app: FastifyInstance): void {
  app.get('/v1/search', async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_query', details: parsed.error.flatten() });
    }
    return searchModels(parsed.data.q);
  });
}
