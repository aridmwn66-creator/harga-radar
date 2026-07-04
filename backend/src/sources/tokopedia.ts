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
//
// Tokopedia rewrites its data-testid markup frequently (the old
// divProductWrapper / linkProductName / linkProductPrice attributes now match
// nothing). Rather than chase specific attributes, we let the shared extractor
// find product cards by their "Rp" price text and enclosing product link, which
// survives markup churn. scrapeSearch also waits for real price content to
// render before parsing, so the JS grid is actually loaded first.
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
        // Wait for a product tile to render; the price-content wait in
        // scrapeSearch is the real gate before extraction.
        waitForSelector: '[data-testid="divProductWrapper"], a[href] img',
        extract: {
          // No fragile card/title/price selectors: the price-anchored heuristic
          // (find "Rp ...", climb to the product card) does the extraction, with
          // pickTitle reading the product name from the image alt / longest line.
          limit: query.limit,
        },
      }),
    );
  },
};
