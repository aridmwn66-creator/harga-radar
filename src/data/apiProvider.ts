import type {
  ModelSummary,
  PriceProvider,
  PriceReport,
  ReportParams,
} from '@/types';
import { API_BASE_URL } from './config';
import { mockProvider } from './mockProvider';

// Live provider. Talks to the HargaRadar backend (PROMPT 2). The backend returns
// exactly the shapes the app expects, so this is a thin fetch + validate layer.
// Selected by flipping DEFAULT_DATA_SOURCE to 'live' (see config.ts) or via the
// Settings screen toggle.
//
// If the backend is unreachable (not hosted yet, offline, CORS/timeout), every
// call falls back to the bundled mock data instead of throwing. This keeps the
// web build openable even before a backend is deployed: the site shows sample
// data rather than an error screen.

class ApiError extends Error {}

// Give up on a hung backend quickly so the UI is not stuck on a skeleton.
const REQUEST_TIMEOUT_MS = 8_000;

async function getJson<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'EXPO_PUBLIC_API_URL is not set. Set it to your backend URL or use the mock provider.',
    );
  }
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`Request failed (${res.status}) for ${path}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const apiProvider: PriceProvider = {
  async search(query: string): Promise<ModelSummary[]> {
    try {
      const qs = buildQuery({ q: query });
      return await getJson<ModelSummary[]>(`/v1/search${qs}`);
    } catch {
      // Backend unreachable: degrade to the bundled sample data.
      return mockProvider.search(query);
    }
  },

  async getReport(params: ReportParams): Promise<PriceReport> {
    try {
      const qs = buildQuery({
        modelId: params.modelId,
        storageGb: params.storageGb,
        condition: params.condition,
        location: params.location,
      });
      return await getJson<PriceReport>(`/v1/prices${qs}`);
    } catch {
      // Backend unreachable: degrade to the bundled sample data.
      return mockProvider.getReport(params);
    }
  },
};
