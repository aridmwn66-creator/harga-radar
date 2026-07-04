import type { NormalizedQuery, Source, SourceRun } from '../types.js';
import { config } from '../config.js';
import { withTimeout } from '../lib/delay.js';
import { createLogger } from '../lib/logger.js';
import { olxSource } from './olx.js';
import { carousellSource } from './carousell.js';
import { facebookSource } from './facebook.js';
import { tokopediaSource } from './tokopedia.js';
import { shopeeSource } from './shopee.js';

const log = createLogger('sources');

// All sources, in priority order. Enable/disable via env (see config + README).
export const ALL_SOURCES: Source[] = [
  olxSource,
  carousellSource,
  facebookSource,
  tokopediaSource,
  shopeeSource,
];

export function enabledSources(): Source[] {
  return ALL_SOURCES.filter((s) => s.enabled);
}

// Generous per-source budget: navigation timeout + polite delays + overhead.
const SOURCE_TIMEOUT_MS = config.scraping.navTimeoutMs + 20_000;

/**
 * Run every enabled source in parallel. Each source is fully isolated: a
 * failure, block, or timeout in one NEVER affects the others, and this function
 * never throws. Returns one SourceRun per enabled source (partial results).
 */
export async function runSources(query: NormalizedQuery): Promise<SourceRun[]> {
  const sources = enabledSources();
  if (sources.length === 0) {
    log.warn('no sources enabled');
    return [];
  }

  return Promise.all(
    sources.map(async (source): Promise<SourceRun> => {
      const start = Date.now();
      try {
        const listings = await withTimeout(
          source.fetchListings(query),
          SOURCE_TIMEOUT_MS,
          source.name,
        );
        const durationMs = Date.now() - start;
        log.info(`${source.id}: ${listings.length} raw listings in ${durationMs}ms`);
        return { source: source.id, ok: true, listings, durationMs };
      } catch (err) {
        const durationMs = Date.now() - start;
        const message = err instanceof Error ? err.message : String(err);
        log.warn(`${source.id} failed after ${durationMs}ms: ${message}`);
        return { source: source.id, ok: false, listings: [], error: message, durationMs };
      }
    }),
  );
}
