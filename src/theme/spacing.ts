// Spacing scale (4pt grid) and radii. Generous negative space is part of the
// visual identity, so lean on the larger steps for screen padding.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  /** rounded-2xl equivalent used by cards. */
  xxl: 24,
  pill: 999,
} as const;

/** Minimum comfortable tap target per platform guidance. */
export const MIN_TAP_TARGET = 44;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
