import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { getFacebookContext } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';
import { createLogger } from '../lib/logger.js';
import { politeDelay } from '../lib/delay.js';

// ===========================================================================
// FACEBOOK MARKETPLACE SOURCE  (EXPERIMENTAL, DISABLED BY DEFAULT)
// ---------------------------------------------------------------------------
// WARNINGS - read before enabling:
//  (a) Scraping Facebook Marketplace VIOLATES Facebook's Terms of Service.
//  (b) You MUST use a throwaway / backup Facebook account, NEVER your main one,
//      because the account can get rate-limited, checkpointed, or banned.
//  (c) It is fragile: FB changes its DOM often and shows checkpoints/captchas.
//
// This source uses a PERSISTENT browser context (config.fb.userDataDir) so the
// login done via `npm run fb-login` is reused. Rate limiting is deliberately
// strict: one scrape at a time (mutex), long randomized delays, and a small
// per-run cap. If FB is not logged in / shows a checkpoint / blocks us, this
// source logs clearly and returns [] without affecting the other sources.
// ===========================================================================

const log = createLogger('source:facebook');
const ORIGIN = 'https://www.facebook.com';

// Mutex: never run two Facebook scrapes at once (concurrency 1).
let fbChain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = fbChain.then(fn, fn);
  fbChain = run.catch(() => undefined);
  return run;
}

async function scrapeFacebook(query: NormalizedQuery): Promise<RawListing[]> {
  const location = config.fb.location || 'jakarta';
  const url = `${ORIGIN}/marketplace/${encodeURIComponent(location)}/search/?query=${encodeURIComponent(query.searchTerm)}`;

  const context = await getFacebookContext();
  const page = await context.newPage();
  try {
    // Extra-long polite delay before the request to look less bot-like.
    await politeDelay(3000, 7000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Detect not-logged-in / checkpoint states and bail gracefully.
    const current = page.url();
    if (/login|checkpoint|two_step|recover/.test(current)) {
      log.warn(`not logged in or checkpoint hit (${current}). Run "npm run fb-login" first.`);
      return [];
    }

    const listings = await scrapeSearch({
      page,
      url,
      origin: ORIGIN,
      source: 'facebook',
      defaultCondition: 'used',
      waitForSelector: 'a[href*="/marketplace/item/"], [role="main"] a[href*="/marketplace/"]',
      extract: {
        cardSelector: 'a[href*="/marketplace/item/"]',
        // Keep the per-run cap small to be gentle on the account.
        limit: Math.min(query.limit, 20),
      },
    });
    log.info(`collected ${listings.length} raw listings`);
    return listings;
  } catch (err) {
    log.warn('scrape failed (blocked / DOM changed / checkpoint)', err);
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

export const facebookSource: Source = {
  id: 'facebook',
  name: 'Facebook Marketplace',
  enabled: config.sources.facebook,
  tier: 'experimental',
  fetchListings(query: NormalizedQuery): Promise<RawListing[]> {
    // Serialize so only one FB scrape runs at a time.
    return serialize(() => scrapeFacebook(query));
  },
};
