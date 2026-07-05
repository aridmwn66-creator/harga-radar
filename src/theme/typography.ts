import { Platform, type TextStyle } from 'react-native';

// Font families. The actual font files are loaded in app/_layout.tsx via the
// @expo-google-fonts/inter package. These string keys must match the names
// passed to useFonts(). The whole app is set in Inter: it is engineered for UI
// at small sizes, and its tabular figures keep the price columns aligned. The
// display/body split is kept as WEIGHT tiers (display = heavier Inter), so
// every existing style keeps resolving through these tokens.
export const fonts = {
  display: 'Inter_600SemiBold',
  displayBold: 'Inter_700Bold',
  displayMedium: 'Inter_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/**
 * Tabular figures so every price digit occupies the same width and columns of
 * numbers align. Applied to all monetary and numeric display text. Inter ships
 * a proper tnum feature; react-native-web maps fontVariant to the equivalent
 * font-variant CSS, so this works on native and web alike.
 */
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
  // Some Android font stacks ignore fontVariant; Inter's near-uniform digit
  // widths still line up acceptably, and iOS/web honour the variant fully.
  ...Platform.select({ default: {} }),
};

// Reusable text style presets. Large display text carries a LIGHT negative
// tracking: Inter needs roughly half of what the previous display face used
// (copying the old values reads cramped, none at all reads airy).
export const textStyles = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.75,
    ...tabularNums,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  numberLg: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.15,
    ...tabularNums,
  },
  number: {
    fontFamily: fonts.displayMedium,
    fontSize: 15,
    lineHeight: 20,
    ...tabularNums,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TextStyleName = keyof typeof textStyles;
