// Color tokens. Premium dark with a calm techno feel, like a high-end financial
// terminal. The single accent is cyan/blue, used sparingly for focus, active and
// interactive things. Backgrounds are layered blue-blacks (never pure black) so
// surfaces have depth. Deal semantics use a refined emerald (good price) and a
// soft rose (over market). Never hardcode a hex outside this file.
//
// Token map (name kept stable so every consumer keeps working):
//   background    = bg.base        surface     = bg.elevated
//   surfaceRaised = bg.elevatedHi  panel       = card fill (elevated)
//   hairline      = border.subtle  panelBorder = border.default
//   panelBorderActive = border.accent
//   up / cyan / accent = the cyan accent       dealGood = below-market (emerald)
//   down = over-market (rose)

export const colors = {
  /** App background, deepest layer (bg.base). */
  background: '#080B11',
  /** Control surface: chips, inputs, tracks, secondary buttons (bg.elevated). */
  surface: '#151C27',
  /** A lifted surface for pressed / nested elements (bg.elevatedHi). */
  surfaceRaised: '#1B2431',
  /** Card / panel fill. Elevated (lighter than the base) so cards read as raised. */
  panel: '#151C27',
  /** Faint cool sheen used for the holographic top edge on cards. */
  panelSheen: 'rgba(125,211,252,0.10)',

  /** 1px hairline borders (border.subtle). */
  hairline: 'rgba(255,255,255,0.06)',
  /** Default panel border (border.default). */
  panelBorder: 'rgba(255,255,255,0.10)',
  /** Accent border for active / focused / highlighted panels (border.accent). */
  panelBorderActive: 'rgba(56,189,248,0.35)',
  /** Subtle inner top highlight on cards. */
  innerHighlight: 'rgba(255,255,255,0.05)',
  /** Very faint cyan HUD grid line for the background texture. */
  grid: 'rgba(56,189,248,0.05)',

  /** Primary text (high contrast). */
  text: '#EAF0F7',
  /** Muted / secondary text. */
  textMuted: '#9AA7B8',
  /** Even quieter text (timestamps, fine print). */
  textFaint: '#5E6B7D',

  /**
   * ACCENT (cyan). Focus, active, interactive, the median line. Used sparingly.
   * `up` is kept as the accent alias so existing accent usages resolve to cyan.
   */
  up: '#38BDF8',
  cyan: '#38BDF8',
  accent: '#38BDF8',
  accentBright: '#7DD3FC',
  accentDeep: '#0EA5E9',

  /** Below market / good price (refined emerald, NOT the accent). */
  dealGood: '#34D399',
  dealGoodTint: 'rgba(52,211,153,0.12)',
  /** Over market / down (soft rose). Semantic only, used sparingly. */
  down: '#FB7185',

  /** Translucent tints for pills and badges. */
  upTint: 'rgba(56,189,248,0.12)',
  downTint: 'rgba(251,113,133,0.12)',
  cyanTint: 'rgba(56,189,248,0.12)',
  accentTint: 'rgba(56,189,248,0.10)',

  /** Glow colors (used for shadows + SVG halos). Kept low-alpha and subtle. */
  limeGlow: 'rgba(56,189,248,0.28)',
  cyanGlow: 'rgba(56,189,248,0.30)',
  accentGlow: 'rgba(56,189,248,0.28)',

  /** Fully transparent, handy for animated fades. */
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
