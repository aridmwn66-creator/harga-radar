import { QueryClient } from '@tanstack/react-query';

// Single QueryClient for the app. Reports are fine to be a little stale (prices
// move slowly), so we cache generously and avoid noisy refetches.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min
      gcTime: 10 * 60_000, // 10 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
