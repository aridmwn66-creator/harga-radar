import type { PriceProvider } from '@/types';
import { API_BASE_URL, DEFAULT_DATA_SOURCE, type DataSource } from './config';
import { mockProvider } from './mockProvider';
import { apiProvider } from './apiProvider';

// Provider registry. The query hooks call getProvider() with the currently
// selected data source (from the settings store, defaulting to DEFAULT_DATA_SOURCE).

export function getProvider(source: DataSource = DEFAULT_DATA_SOURCE): PriceProvider {
  // "Live" needs a configured backend URL. If live is selected but no
  // EXPO_PUBLIC_API_URL is set, fall back to the bundled mock data instead of
  // failing every request with a network error. This guarantees the app always
  // has valid, loadable data (the mock data is local and never fails).
  if (source === 'live' && API_BASE_URL.length > 0) return apiProvider;
  return mockProvider;
}

export { DEFAULT_DATA_SOURCE, type DataSource };
