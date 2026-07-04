import type { Listing, SourceId } from '@/types';

// Client-side listing filters for the Price Report. These refine the visible
// listings AND (in the report screen) the displayed aggregate is recomputed over
// the filtered set, so every filter affects both the list and "harga pasaran".
//
// Variant (storageGb), condition and location remain query-level filters (they
// re-fetch the report); source + price range are applied on top, client-side.

export type ReportFilters = {
  source: SourceId | null;
  /** Inclusive price bounds (IDR). null means unbounded on that side. */
  priceMin: number | null;
  priceMax: number | null;
};

export const DEFAULT_FILTERS: ReportFilters = {
  source: null,
  priceMin: null,
  priceMax: null,
};

/** How many client filters (plus location) are currently narrowing the report. */
export function activeFilterCount(filters: ReportFilters, location: string | null): number {
  let n = 0;
  if (filters.source) n += 1;
  if (filters.priceMin != null || filters.priceMax != null) n += 1;
  if (location) n += 1;
  return n;
}

/** Apply source + price-range filters to a list of listings. */
export function applyClientFilters(listings: Listing[], filters: ReportFilters): Listing[] {
  return listings.filter((l) => {
    if (filters.source && l.source !== filters.source) return false;
    if (filters.priceMin != null && l.priceIdr < filters.priceMin) return false;
    if (filters.priceMax != null && l.priceIdr > filters.priceMax) return false;
    return true;
  });
}
