import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { withPage } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';

// ===========================================================================
// TOKOPEDIA SOURCE  (EXPERIMENTAL, DISABLED BY DEFAULT)
// ---------------------------------------------------------------------------
// Heavy client-side JS + anti-bot, so treat results as best-effort. Most
// listings are shops selling NEW units, which makes this useful mainly as a
// "harga baru" (new price) baseline rather than for used prices. Fails
// gracefully if blocked. Respect Tokopedia's ToS and keep volume low.
// ===========================================================================

const ORIGIN = 'https://www.tokopedia.com';

export const tokopediaSource: Source = {
  id: 'tokopedia',
  name: 'Tokopedia',
  enabled: config.sources.tokopedia,
  tier: 'experimental',
  async fetchListings(query: NormalizedQuery): Promise<RawListing[]> {
    const url = `${ORIGIN}/search?st=product&q=${encodeURIComponent(query.searchTerm)}`;
    return withPage((page) =>
      scrapeSearch({
        page,
        url,
        origin: ORIGIN,
        source: 'tokopedia',
        // Mostly shops selling new units.
        defaultCondition: 'new',
        waitForSelector:
          '[data-testid="divProductWrapper"], [data-testid="master-product-card"], a[href*="/product/"]',
        extract: {
          cardSelector: '[data-testid="divProductWrapper"]',
          titleSelector: '[data-testid="linkProductName"]',
          priceSelector: '[data-testid="linkProductPrice"]',
          linkSelector: 'a',
          imageSelector: 'img',
          limit: query.limit,
        },
      }),
    );
  },
};
