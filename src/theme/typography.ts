import { Platform, type TextStyle } from 'react-native';

// Font families. The actual font files are loaded in app/_layout.tsx via the
// @expo-google-fonts packages. These string keys must match the names passed to
// useFonts(). Space Grotesk is used for ALL display text and ALL numbers;
// Inter is used for body and secondary text.
export const fonts = {
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

/**
 * Tabular figures so every price digit occupies the same width and columns of
 * numbers align. Applied to all monetary and numeric display text.
 */
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
  // Some Android font stacks ignore fontVariant; the monospaced Space Grotesk
  // digits still line up acceptably, and iOS honours the variant fully.
  ...Platform.select({ default: {} }),
};

// Reusable text style presets. Large headers use tight letter spacing.
export const textStyles = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -1.5,
    ...tabularNums,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  numberLg: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
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
