// Core types. The API response types (Listing, PriceReport, ModelSummary,
// Aggregate) match EXACTLY what the HargaRadar app expects, so the app can swap
// its mock provider for this backend with no code changes.

export type SourceId = 'olx' | 'facebook' | 'tokopedia' | 'shopee' | 'carousell';

export type Condition = 'new' | 'used';

/** A raw listing as returned by a source, before normalization. */
export type RawListing = {
  source: SourceId;
  title: string;
  priceIdr: number;
  url: string;
  location?: string;
  /** Condition guessed by the source (from keywords), refined later. */
  conditionHint?: Condition;
  imageUrl?: string;
  /** Raw posted-time text ("3 hari lalu"), parsed later if possible. */
  postedAtRaw?: string;
};

/** A normalized, app-facing listing. */
export type Listing = {
  id: string;
  title: string;
  priceIdr: number;
  condition: Condition;
  storageGb?: number;
  modelId: string;
  location: string;
  source: SourceId;
  url: string;
  thumbnailUrl?: string;
  /** ISO 8601 timestamp. */
  postedAt: string;
};

export type ModelSummary = {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  availableStorageGb: number[];
};

export type SourceAggregate = {
  source: SourceId;
  count: number;
  median: number;
};

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

export type PriceReport = {
  modelId: string;
  modelName: string;
  aggregate: Aggregate;
  listings: Listing[];
};

/** A catalog model definition used for search + title normalization. */
export type ModelDef = {
  id: string;
  name: string;
  brand: string;
  storages: number[];
  /** Extra normalized aliases beyond the auto-generated ones. */
  aliases?: string[];
};

/** The normalized query a source uses to build its search + filter results. */
export type NormalizedQuery = {
  modelId: string;
  model: ModelDef;
  /** Human search term, e.g. "iPhone 11". */
  searchTerm: string;
  storageGb?: number;
  condition?: Condition;
  location?: string;
  /** Max listings to collect per source. */
  limit: number;
};

/** The pluggable source contract. Each source is isolated and fails gracefully. */
export interface Source {
  id: SourceId;
  name: string;
  enabled: boolean;
  tier: 'reliable' | 'experimental';
  fetchListings(query: NormalizedQuery): Promise<RawListing[]>;
}

/** Result of running one source, so the pipeline can report partial failures. */
export type SourceRun = {
  source: SourceId;
  ok: boolean;
  listings: RawListing[];
  error?: string;
  durationMs: number;
};
