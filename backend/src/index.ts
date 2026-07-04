import { config } from './config.js';
import { buildServer } from './server.js';
import { closeBrowser } from './browser/browser.js';
import { enabledSources } from './sources/registry.js';
import { createLogger } from './lib/logger.js';

const log = createLogger('server');

async function main(): Promise<void> {
  const app = await buildServer();

  const shutdown = async (signal: string): Promise<void> => {
    log.info(`received ${signal}, shutting down`);
    try {
      await app.close();
      await closeBrowser();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.port, host: config.host });
  log.info(
    `HargaRadar backend on http://${config.host}:${config.port} | sources: ${enabledSources()
      .map((s) => s.id)
      .join(', ') || 'none'}`,
  );
}

main().catch((err) => {
  log.error('failed to start', err);
  process.exit(1);
});
