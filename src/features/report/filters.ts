import type { Listing, SourceId } from '@/types';

// Client-side listing filters for the Price Report list. These refine WHICH
// listings are shown; they do NOT change the "harga pasaran" (median), which
// always reflects the full market for the selected variant/condition/location.
//
// Variant (storageGb), condition and location are query-level filters (they
// re-fetch the report), handled separately in the Price Report screen.

export type PricePosition = 'all' | 'below' | 'above';

export type ReportFilters = {
  source: SourceId | null;
  pricePosition: PricePosition;
};

export const DEFAULT_FILTERS: ReportFilters = {
  source: null,
  pricePosition: 'all',
};

/** How many client filters are currently narrowing the list. */
export function activeFilterCount(filters: ReportFilters, location: string | null): number {
  let n = 0;
  if (filters.source) n += 1;
  if (filters.pricePosition !== 'all') n += 1;
  if (location) n += 1;
  return n;
}

/** Apply source + price-position filters relative to the market median. */
export function applyClientFilters(
  listings: Listing[],
  medianIdr: number,
  filters: ReportFilters,
): Listing[] {
  return listings.filter((l) => {
    if (filters.source && l.source !== filters.source) return false;
    if (filters.pricePosition === 'below' && l.priceIdr >= medianIdr) return false;
    if (filters.pricePosition === 'above' && l.priceIdr < medianIdr) return false;
    return true;
  });
}
