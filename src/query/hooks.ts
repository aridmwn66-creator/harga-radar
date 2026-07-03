import {
  keepPreviousData,
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import type { ModelSummary, PriceReport, ReportParams } from '@/types';
import { getProvider } from '@/data/provider';
import { useSettingsStore } from '@/store/settings';
import { queryKeys } from './keys';

// Data hooks. Every hook reads the currently selected data source from the
// settings store, so a mock <-> live toggle transparently re-runs queries.

/** Search phone models. Disabled until the query has at least one character. */
export function useSearch(query: string) {
  const source = useSettingsStore((s) => s.dataSource);
  const trimmed = query.trim();
  return useQuery<ModelSummary[]>({
    queryKey: queryKeys.search(source, trimmed),
    queryFn: () => getProvider(source).search(trimmed),
    enabled: trimmed.length >= 1,
    placeholderData: keepPreviousData,
  });
}

/** Full price report for a model + variant + condition. */
export function useReport(params: ReportParams, enabled = true) {
  const source = useSettingsStore((s) => s.dataSource);
  return useQuery<PriceReport>({
    queryKey: queryKeys.report(source, params),
    queryFn: () => getProvider(source).getReport(params),
    enabled: enabled && params.modelId.length > 0,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch reports for several models at once (used by the home + watchlist
 * snapshots). Returns the raw query results so callers can render per-item
 * loading state.
 */
export function useReports(paramsList: ReportParams[]) {
  const source = useSettingsStore((s) => s.dataSource);
  return useQueries({
    queries: paramsList.map((params) => ({
      queryKey: queryKeys.report(source, params),
      queryFn: () => getProvider(source).getReport(params),
      enabled: params.modelId.length > 0,
    })),
  });
}
