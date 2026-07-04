import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { registerSearchRoute } from './routes/search.js';
import { registerPricesRoute } from './routes/prices.js';
import { enabledSources, ALL_SOURCES } from './sources/registry.js';

// Build the Fastify app: CORS (so the app can call it), inbound rate limiting,
// and the two v1 routes.
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    trustProxy: true,
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
  });

  app.get('/', async () => ({
    name: 'hargaradar-backend',
    endpoints: ['/v1/search?q=...', '/v1/prices?modelId=...&condition=used'],
  }));

  app.get('/health', async () => ({
    ok: true,
    sources: ALL_SOURCES.map((s) => ({
      id: s.id,
      tier: s.tier,
      enabled: s.enabled,
    })),
    enabled: enabledSources().map((s) => s.id),
  }));

  registerSearchRoute(app);
  registerPricesRoute(app);

  return app;
}
