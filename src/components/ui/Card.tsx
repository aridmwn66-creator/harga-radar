import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

// Card surface: 1px hairline border + a very subtle inner top highlight instead
// of a drop shadow. Rounded-2xl, generous padding. This is the core container of
// the whole UI, so it is deliberately understated.

type CardProps = ViewProps & {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function Card({ children, padded = true, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {/* Inner top highlight: a 1px brighter line hugging the top edge. */}
      <View pointerEvents="none" style={styles.highlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.xl,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
    backgroundColor: colors.innerHighlight,
  },
});
