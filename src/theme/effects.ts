import { Platform, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from './colors';

// Glow presets. Deliberately subtle: soft, low-opacity colored shadows, never a
// bright halo. Colored shadows render best on iOS; Android approximates them via
// elevation. Use these instead of hardcoding shadow props so glow stays uniform.

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
  /** Faint lime halo for active/deal panels + primary buttons. */
  lime: viewGlow(colors.up, 0.28, 14),
  /** A touch stronger, for the single most important element on a screen. */
  limeStrong: viewGlow(colors.up, 0.4, 18),
  /** Faint cyan halo for secondary highlights. */
  cyan: viewGlow(colors.cyan, 0.26, 13),
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
