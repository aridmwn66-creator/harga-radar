import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from './colors';

// Glow presets. Deliberately subtle: soft, low-opacity colored shadows, never a
// bright halo. Colored shadows render best on iOS; Android approximates them via
// elevation. Use these instead of hardcoding shadow props so glow stays uniform.
// The accent is cyan now, so every glow reads cyan (the `lime` keys are kept as
// aliases so existing callers keep working).

function viewGlow(color: string, opacity: number, radius: number): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    // Android: elevation gives a (mostly monochrome) lift; keep it modest so it
    // does not turn into a heavy black drop shadow.
    elevation: Platform.select({ android: Math.round(radius / 3), default: 0 }),
  };
}

export const glow = {
  /** Faint cyan halo for active panels + primary buttons. */
  lime: viewGlow(colors.accent, 0.28, 16),
  /** A touch stronger, for the single most important element on a screen. */
  limeStrong: viewGlow(colors.accent, 0.4, 20),
  /** Faint cyan halo for secondary highlights. */
  cyan: viewGlow(colors.cyan, 0.26, 14),
} as const;

// Soft, layered card elevation: a gentle drop shadow (never a harsh single
// shadow). Paired in components with a hairline border + inner top highlight so
// cards read as raised surfaces on the layered blue-black background.
export const elevation = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: Platform.select({ android: 6, default: 0 }),
  } as ViewStyle,
} as const;

// Text glow (for big numbers). textShadow is cheap and reads as a soft neon
// bloom on the digits without hurting legibility.
export const textGlow = {
  lime: {
    textShadowColor: colors.limeGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 11,
  } as TextStyle,
  limeSoft: {
    textShadowColor: colors.limeGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  } as TextStyle,
  cyan: {
    textShadowColor: colors.cyanGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  } as TextStyle,
} as const;
