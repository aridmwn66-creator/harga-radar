import type { SourceId } from './types.js';

// Load .env into process.env if present (Node 20.12+ built-in, no dependency).
try {
  process.loadEnvFile();
} catch {
  // No .env file, or unsupported Node. Fall back to real environment + defaults.
}

function str(key: string, def: string): string {
  const v = process.env[key];
  return v != null && v.length > 0 ? v : def;
}

function bool(key: string, def: boolean): boolean {
  const v = process.env[key];
  if (v == null || v.length === 0) return def;
  return /^(on|true|1|yes)$/i.test(v.trim());
}

function num(key: string, def: number): number {
  const v = process.env[key];
  if (v == null) return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export type SourceToggles = Record<SourceId, boolean>;

export const config = {
  port: num('PORT', 8080),
  host: str('HOST', '0.0.0.0'),
  logLevel: str('LOG_LEVEL', 'info'),

  rateLimit: {
    max: num('RATE_LIMIT_MAX', 60),
    window: str('RATE_LIMIT_WINDOW', '1 minute'),
  },

  cache: {
    ttlSeconds: num('CACHE_TTL_SECONDS', 300),
    dir: str('CACHE_DIR', '.cache'),
  },

  // Default: only the reliable used-phone sources are enabled.
  sources: {
    olx: bool('SOURCE_OLX', true),
    carousell: bool('SOURCE_CAROUSELL', true),
    facebook: bool('SOURCE_FACEBOOK', false),
    tokopedia: bool('SOURCE_TOKOPEDIA', false),
    shopee: bool('SOURCE_SHOPEE', false),
  } satisfies SourceToggles,

  maxListingsPerSource: num('MAX_LISTINGS_PER_SOURCE', 40),

  scraping: {
    headless: bool('HEADLESS', true),
    navTimeoutMs: num('NAV_TIMEOUT_MS', 25000),
    executablePath: str('PLAYWRIGHT_EXECUTABLE_PATH', ''),
  },

  fb: {
    userDataDir: str('FB_USER_DATA_DIR', '.fb-userdata'),
    location: str('FB_LOCATION', 'jakarta'),
  },
} as const;
