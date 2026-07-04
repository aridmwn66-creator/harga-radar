import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { withPage } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';

// ===========================================================================
// SHOPEE SOURCE  (EXPERIMENTAL, DISABLED BY DEFAULT)
// ---------------------------------------------------------------------------
// Aggressive anti-bot (often a captcha / login wall). Treat results as
// best-effort. Like Tokopedia, most listings are shops selling NEW units, so
// this is useful mainly as a "harga baru" baseline. Fails gracefully if
// blocked. Respect Shopee's ToS and keep volume low.
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
