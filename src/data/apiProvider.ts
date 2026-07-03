import type {
  ModelSummary,
  PriceProvider,
  PriceReport,
  ReportParams,
} from '@/types';
import { API_BASE_URL } from './config';

// Live provider. Talks to the HargaRadar backend (PROMPT 2). The backend returns
// exactly the shapes the app expects, so this is a thin fetch + validate layer.
// Selected by flipping DEFAULT_DATA_SOURCE to 'live' (see config.ts) or via the
// Settings screen toggle.

class ApiError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'EXPO_PUBLIC_API_URL is not set. Set it to your backend URL or use the mock provider.',
    );
  }
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status}) for ${path}`);
  }
  return (await res.json()) as T;
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
    const qs = buildQuery({ q: query });
    return getJson<ModelSummary[]>(`/v1/search${qs}`);
  },

  async getReport(params: ReportParams): Promise<PriceReport> {
    const qs = buildQuery({
      modelId: params.modelId,
      storageGb: params.storageGb,
      condition: params.condition,
      location: params.location,
    });
    return getJson<PriceReport>(`/v1/prices${qs}`);
  },
};
