import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { withPage } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';

// ===========================================================================
// SHOPEE SOURCE  (EXPERIMENTAL, DISABLED BY DEFAULT - KEEP OFF)
// ---------------------------------------------------------------------------
// Shopee blocks headless scraping outright. From a plain server IP it returns
// an empty page (no anchors, no products), so this source realistically needs a
// residential/mobile PROXY or a paid scraping API to work at all. Without one it
// will simply find zero listings and log "empty page ... likely blocked".
//
// This source is kept in the codebase for completeness and for anyone who DOES
// have a proxy, but it is recommended to leave SOURCE_SHOPEE=off unless you have
// that infrastructure. It fails gracefully and in isolation either way: a
// blocked run returns [] (and, at worst, a navigation error caught by the
// registry), and never affects the other sources.
//
// To use it with a proxy, point PLAYWRIGHT_EXECUTABLE_PATH / your own launch
// setup at a proxied Chromium, or route this backend through an upstream proxy.
//
// Like Tokopedia, most Shopee listings are shops selling NEW units, so this is
// only ever a "harga baru" baseline. Respect Shopee's ToS and keep volume low.
// ===========================================================================

const ORIGIN = 'https://shopee.co.id';

export const shopeeSource: Source = {
  id: 'shopee',
  name: 'Shopee Indonesia',
  enabled: config.sources.shopee,
  tier: 'experimental',
  async fetchListings(query: NormalizedQuery): Promise<RawListing[]> {
    const url = `${ORIGIN}/search?keyword=${encodeURIComponent(query.searchTerm)}`;
    return withPage((page) =>
      scrapeSearch({
        page,
        url,
        origin: ORIGIN,
        source: 'shopee',
        defaultCondition: 'new',
        waitForSelector: '[data-sqe="item"], .shopee-search-item-result__item, a[href*="-i."]',
        extract: {
          cardSelector: '[data-sqe="item"]',
          linkSelector: 'a',
          imageSelector: 'img',
          limit: query.limit,
        },
      }),
    );
  },
};
