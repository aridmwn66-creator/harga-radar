import type { CSSProperties, ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors } from '@/theme';

// Web-only "app in a phone frame" layout. On a wide screen (laptop) the app does
// NOT stretch full width: it is constrained to a centered phone-width column, and
// the gutters are filled with a themed futuristic backdrop (faint HUD grid + soft
// lime/cyan glows) so the empty space reads as deliberate and premium. On a
// narrow screen (phone) it is full width, identical to native.

const MAX_WIDTH = 460;
// Below this viewport width we keep the full-width phone layout (no gutters).
const FRAME_BREAKPOINT = 620;

const GRID = 46; // matches TechBackground's cell so the textures line up.

const gutterStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: colors.background,
  backgroundImage: [
    'radial-gradient(58% 46% at 15% 12%, rgba(56,189,248,0.12), transparent 70%)',
    'radial-gradient(54% 44% at 86% 88%, rgba(14,165,233,0.12), transparent 72%)',
    'linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: `100% 100%, 100% 100%, ${GRID}px ${GRID}px, ${GRID}px ${GRID}px`,
};

export function WebFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const framed = width > FRAME_BREAKPOINT;

  if (!framed) {
    // Phone / narrow: full width, no gutters (matches the native app).
    return <View style={styles.full}>{children}</View>;
  }

  return (
    <View style={styles.root}>
      <div style={gutterStyle} aria-hidden />
      <View style={styles.column}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.hairline,
    // react-native-web converts these shadow props into a soft box-shadow, so
    // the column appears to float above the gutter backdrop.
    shadowColor: colors.cyan,
    shadowOpacity: 0.13,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 0 },
  },
});
