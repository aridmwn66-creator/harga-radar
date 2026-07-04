import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { withPage } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';

// OLX Indonesia. The primary source for used phones. OLX exposes stable
// data-aut-id attributes which we target first, with a heuristic fallback.
//
// ToS note: keep request volume low and cache heavily (see cache + rate limit).

const ORIGIN = 'https://www.olx.co.id';

function slug(term: string): string {
  return term.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const olxSource: Source = {
  id: 'olx',
  name: 'OLX Indonesia',
  enabled: config.sources.olx,
  tier: 'reliable',
  async fetchListings(query: NormalizedQuery): Promise<RawListing[]> {
    const url = `${ORIGIN}/items/q-${slug(query.searchTerm)}`;
    return withPage((page) =>
      scrapeSearch({
        page,
        url,
        origin: ORIGIN,
        source: 'olx',
        defaultCondition: 'used',
        waitForSelector: '[data-aut-id="itemBox"]',
        extract: {
          cardSelector: '[data-aut-id="itemBox"]',
          titleSelector: '[data-aut-id="itemTitle"]',
          priceSelector: '[data-aut-id="itemPrice"]',
          locationSelector: '[data-aut-id="item-location"]',
          linkSelector: 'a',
          imageSelector: 'img',
          limit: query.limit,
        },
      }),
    );
  },
};
