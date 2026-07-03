import type { DataSource } from '@/data/config';
import type { ReportParams } from '@/types';

// Centralized query keys so caches invalidate consistently. The active data
// source is part of every key: switching mock <-> live yields separate caches.

export const queryKeys = {
  search: (source: DataSource, query: string) =>
    ['search', source, query.trim().toLowerCase()] as const,
  report: (source: DataSource, params: ReportParams) =>
    [
      'report',
      source,
      params.modelId,
      params.storageGb ?? 'any',
      params.condition ?? 'any',
      params.location ?? 'any',
    ] as const,
};
