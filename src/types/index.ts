// Core domain types for HargaRadar.
// These mirror the shape returned by the pluggable data layer (mock or live API)
// so the UI never has to know where the data came from.

/** Marketplaces we can aggregate listings from. */
export type SourceId =
  | 'olx'
  | 'facebook'
  | 'tokopedia'
  | 'shopee'
  | 'carousell';

/** Phone condition. "Baru" (new) vs "Bekas" (used). */
export type Condition = 'new' | 'used';

/** A single marketplace listing for a phone. */
export type Listing = {
  id: string;
  title: string;
  priceIdr: number;
  condition: Condition;
  storageGb?: number;
  modelId: string;
  location: string;
  source: SourceId;
  /** Deep link back to the original marketplace listing. */
  url: string;
  thumbnailUrl?: string;
  /** ISO 8601 timestamp of when the listing was posted. */
  postedAt: string;
};

/** Per-marketplace slice of an aggregate. */
export type SourceAggregate = {
  source: SourceId;
  count: number;
  median: number;
};

/** Summary statistics across all listings in a report. */
export type Aggregate = {
  median: number;
  mean: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  count: number;
  bySource: SourceAggregate[];
};

/** The full price report for a single model + variant + condition. */
export type PriceReport = {
  modelId: string;
  modelName: string;
  aggregate: Aggregate;
  listings: Listing[];
};

/** A searchable phone model shown in search results and trending rows. */
export type ModelSummary = {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  /** Storage variants commonly sold for this model, in GB. */
  availableStorageGb: number[];
};

/** Query parameters accepted by the data layer when building a report. */
export type ReportParams = {
  modelId: string;
  storageGb?: number;
  condition?: Condition;
  location?: string;
};

/**
 * The single interface both the mock and live data providers implement.
 * Swapping mock -> live is a one-line config change (see src/data/provider.ts).
 */
export interface PriceProvider {
  search(query: string): Promise<ModelSummary[]>;
  getReport(params: ReportParams): Promise<PriceReport>;
}

/** A saved watchlist entry: a model + a target price the user is waiting for. */
export type WatchlistItem = {
  modelId: string;
  modelName: string;
  storageGb?: number;
  condition: Condition;
  /** Target price in IDR. Any listing below this is an alert-worthy deal. */
  targetPriceIdr: number;
  addedAt: string;
};
