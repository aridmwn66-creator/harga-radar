// Color tokens. Dark, "terminal-editorial" sharpened into a disciplined sci-fi
// HUD. Two neon accents ONLY: acid lime (primary) + electric cyan (secondary).
// Everything else is monochrome near-black. Never hardcode a hex outside here.

export const colors = {
  /** App background. */
  background: '#0A0B0D',
  /** Control surface: chips, tracks, badges, secondary buttons. */
  surface: '#131518',
  /** A slightly lifted surface for nested elements / pressed states. */
  surfaceRaised: '#1A1D21',
  /** Card / panel fill: a touch darker + cooler than the background (recessed glass). */
  panel: '#090B0E',
  /** A hair lighter panel tone, for the holographic top sheen gradient. */
  panelSheen: 'rgba(140,205,230,0.10)',

  /** 1px hairline borders (never drop shadows). */
  hairline: 'rgba(255,255,255,0.08)',
  /** Cool, faintly-neon panel border. */
  panelBorder: 'rgba(130,195,225,0.14)',
  /** Brighter panel border for active / highlighted panels. */
  panelBorderActive: 'rgba(182,255,60,0.35)',
  /** Subtle inner top highlight on cards. */
  innerHighlight: 'rgba(255,255,255,0.06)',
  /** Very faint HUD grid line for the background texture. */
  grid: 'rgba(150,205,230,0.04)',

  /** Primary text. */
  text: '#F2F3F5',
  /** Muted / secondary text. */
  textMuted: '#8A9099',
  /** Even quieter text (timestamps, fine print). */
  textFaint: '#5A6069',

  /** PRIMARY NEON. Deal / below market / up. Acid lime. */
  up: '#B6FF3C',
  /** Over market / down. Semantic alert only, used sparingly. */
  down: '#FF5C5C',
  /** SECONDARY NEON. Electric cyan. Also the neutral highlight accent. */
  cyan: '#3AE8FF',
  /** Alias kept so existing "accent" usages resolve to the cyan neon. */
  accent: '#3AE8FF',

  /** Translucent tints used for pills and badges. */
  upTint: 'rgba(182,255,60,0.12)',
  downTint: 'rgba(255,92,92,0.12)',
  cyanTint: 'rgba(58,232,255,0.12)',
  accentTint: 'rgba(58,232,255,0.10)',

  /** Glow colors (used for shadows + SVG halos). Kept low-alpha and subtle. */
  limeGlow: 'rgba(182,255,60,0.55)',
  cyanGlow: 'rgba(58,232,255,0.50)',

  /** Fully transparent, handy for animated fades. */
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
