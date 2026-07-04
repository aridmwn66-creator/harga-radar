import type { NormalizedQuery, RawListing, Source } from '../types.js';
import { config } from '../config.js';
import { withPage } from '../browser/browser.js';
import { scrapeSearch } from './scrape.js';

// Carousell Indonesia. Reliable secondary source for used phones. Product URLs
// contain "/p/", so we use those anchors as cards (with a heuristic fallback).
//
// ToS note: keep volume low and cache heavily.

const ORIGIN = 'https://www.carousell.co.id';

export const carousellSource: Source = {
  id: 'carousell',
  name: 'Carousell Indonesia',
  enabled: config.sources.carousell,
  tier: 'reliable',
  async fetchListings(query: NormalizedQuery): Promise<RawListing[]> {
    const url = `${ORIGIN}/search/${encodeURIComponent(query.searchTerm)}?sort_by=3`;
    return withPage((page) =>
      scrapeSearch({
        page,
        url,
        origin: ORIGIN,
        source: 'carousell',
        defaultCondition: 'used',
        // Carousell renders results with JS. Wait for a product link or any
        // listing test-id before extracting; fall back to the heuristic if the
        // markup differs.
        waitForSelector: 'a[href*="/p/"], [data-testid*="listing"], main [data-testid]',
        extract: {
          // Each product link is a card; title + price come from its text.
          cardSelector: 'a[href*="/p/"]',
          limit: query.limit,
        },
      }),
    );
  },
};
