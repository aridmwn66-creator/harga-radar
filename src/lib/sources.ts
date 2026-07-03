import type { SourceId } from '@/types';

// Presentation metadata for each marketplace: a short label and an accent tint
// used by the source badge. Keeping this in one place means adding a new source
// is a single edit.

export type SourceMeta = {
  id: SourceId;
  label: string;
  /** Short two/three letter mark shown inside compact badges. */
  short: string;
  /** Badge tint (translucent) and text color. */
  tint: string;
  color: string;
};

export const SOURCE_META: Record<SourceId, SourceMeta> = {
  olx: {
    id: 'olx',
    label: 'OLX',
    short: 'OLX',
    tint: 'rgba(0,163,224,0.14)',
    color: '#3FC5F0',
  },
  facebook: {
    id: 'facebook',
    label: 'FB Marketplace',
    short: 'FB',
    tint: 'rgba(91,140,255,0.14)',
    color: '#6E9BFF',
  },
  tokopedia: {
    id: 'tokopedia',
    label: 'Tokopedia',
    short: 'TP',
    tint: 'rgba(66,184,131,0.14)',
    color: '#5FD39B',
  },
  shopee: {
    id: 'shopee',
    label: 'Shopee',
    short: 'SP',
    tint: 'rgba(255,122,59,0.14)',
    color: '#FF9761',
  },
  carousell: {
    id: 'carousell',
    label: 'Carousell',
    short: 'CR',
    tint: 'rgba(255,72,72,0.14)',
    color: '#FF7A7A',
  },
};

export const ALL_SOURCES: SourceId[] = [
  'olx',
  'facebook',
  'tokopedia',
  'shopee',
  'carousell',
];

export function sourceMeta(id: SourceId): SourceMeta {
  return SOURCE_META[id];
}

export function sourceLabel(id: string): string {
  return (SOURCE_META as Record<string, SourceMeta | undefined>)[id]?.label ?? id;
}
