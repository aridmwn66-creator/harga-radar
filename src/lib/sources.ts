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

// Monochrome, HUD-style badges: identity is carried by the label/short mark, not
// by color, so the palette stays disciplined (cool grays only). A uniform tint +
// muted text keeps them quiet next to the two neon accents.
const BADGE_TINT = 'rgba(255,255,255,0.05)';
const BADGE_COLOR = '#9CA3AC';

export const SOURCE_META: Record<SourceId, SourceMeta> = {
  olx: { id: 'olx', label: 'OLX', short: 'OLX', tint: BADGE_TINT, color: BADGE_COLOR },
  facebook: { id: 'facebook', label: 'FB Marketplace', short: 'FB', tint: BADGE_TINT, color: BADGE_COLOR },
  tokopedia: { id: 'tokopedia', label: 'Tokopedia', short: 'TP', tint: BADGE_TINT, color: BADGE_COLOR },
  shopee: { id: 'shopee', label: 'Shopee', short: 'SP', tint: BADGE_TINT, color: BADGE_COLOR },
  carousell: { id: 'carousell', label: 'Carousell', short: 'CR', tint: BADGE_TINT, color: BADGE_COLOR },
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
