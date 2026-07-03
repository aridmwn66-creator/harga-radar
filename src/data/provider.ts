import type { PriceProvider } from '@/types';
import { DEFAULT_DATA_SOURCE, type DataSource } from './config';
import { mockProvider } from './mockProvider';
import { apiProvider } from './apiProvider';

// Provider registry. The query hooks call getProvider() with the currently
// selected data source (from the settings store, defaulting to DEFAULT_DATA_SOURCE).

export function getProvider(source: DataSource = DEFAULT_DATA_SOURCE): PriceProvider {
  return source === 'live' ? apiProvider : mockProvider;
}

export { DEFAULT_DATA_SOURCE, type DataSource };
