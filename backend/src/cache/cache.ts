import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.js';
import { createLogger } from '../lib/logger.js';

// Two-layer cache: fast in-memory + a file cache that survives restarts.
// Scraping is slow and risky, so we cache aggressively (minutes-old is fine).

const log = createLogger('cache');

type Entry<T> = { expiresAt: number; value: T };

const memory = new Map<string, Entry<unknown>>();

function fileFor(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
  return join(config.cache.dir, `${safe}.json`);
}

async function readFileCache<T>(key: string): Promise<Entry<T> | null> {
  try {
    const text = await readFile(fileFor(key), 'utf8');
    return JSON.parse(text) as Entry<T>;
  } catch {
    return null;
  }
}

async function writeFileCache<T>(key: string, entry: Entry<T>): Promise<void> {
  try {
    await mkdir(config.cache.dir, { recursive: true });
    await writeFile(fileFor(key), JSON.stringify(entry), 'utf8');
  } catch (err) {
    log.warn(`could not write file cache for ${key}`, err);
  }
}

/**
 * Return a cached value if fresh, otherwise compute it, cache it, and return it.
 * A compute() failure is never cached.
 */
export async function getOrCompute<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<{ value: T; cached: boolean }> {
  const now = Date.now();

  const mem = memory.get(key) as Entry<T> | undefined;
  if (mem && mem.expiresAt > now) return { value: mem.value, cached: true };

  const file = await readFileCache<T>(key);
  if (file && file.expiresAt > now) {
    memory.set(key, file);
    return { value: file.value, cached: true };
  }

  const value = await compute();
  const entry: Entry<T> = { expiresAt: now + ttlSeconds * 1000, value };
  memory.set(key, entry);
  await writeFileCache(key, entry);
  return { value, cached: false };
}
