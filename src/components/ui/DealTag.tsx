import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { formatPercent } from '@/lib/format';
import { AppText } from './AppText';

// Acid-lime "di bawah pasaran" tag. `score` is a positive fraction below median
// (0.18 -> "-18%"). When compact, drops the words and shows just the percent.

type DealTagProps = {
  score: number;
  compact?: boolean;
};

export function DealTag({ score, compact = false }: DealTagProps) {
  const label = compact
    ? formatPercent(-score)
    : `Di bawah pasaran ${formatPercent(-score)}`;
  return (
    <View style={styles.tag}>
      <View style={styles.dot} />
      <AppText variant="overline" style={{ color: colors.up, letterSpacing: 0.4 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.upTint,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.up,
  },
});
