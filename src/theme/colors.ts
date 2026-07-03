// Color tokens. Dark, "terminal-editorial". Use these exact values everywhere;
// never hardcode a hex outside this file.

export const colors = {
  /** App background. */
  background: '#0A0B0D',
  /** Card / raised surface. */
  surface: '#131518',
  /** A slightly lifted surface for nested cards or pressed states. */
  surfaceRaised: '#1A1D21',
  /** 1px hairline borders (never drop shadows). */
  hairline: 'rgba(255,255,255,0.08)',
  /** Subtle inner top highlight on cards. */
  innerHighlight: 'rgba(255,255,255,0.06)',

  /** Primary text. */
  text: '#F2F3F5',
  /** Muted / secondary text. */
  textMuted: '#8A9099',
  /** Even quieter text (timestamps, fine print). */
  textFaint: '#5A6069',

  /** Deal / below market / up. Acid lime. */
  up: '#B6FF3C',
  /** Over market / down. */
  down: '#FF5C5C',
  /** Neutral highlight accent. */
  accent: '#5B8CFF',

  /** Translucent tints used for pills and badges. */
  upTint: 'rgba(182,255,60,0.12)',
  downTint: 'rgba(255,92,92,0.12)',
  accentTint: 'rgba(91,140,255,0.12)',

  /** Fully transparent, handy for animated fades. */
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
