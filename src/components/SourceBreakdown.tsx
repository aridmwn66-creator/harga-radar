import { StyleSheet, View } from 'react-native';
import type { SourceAggregate } from '@/types';
import { colors, radius, spacing, textStyles } from '@/theme';
import { formatIdr } from '@/lib/format';
import { AppText } from './ui/AppText';
import { SourceBadge } from './ui/SourceBadge';
import { sourceMeta } from '@/lib/sources';

// "Per marketplace" breakdown. For each source: a badge, its listing count with
// a proportional bar, and its own median price.

type SourceBreakdownProps = {
  bySource: SourceAggregate[];
};

export function SourceBreakdown({ bySource }: SourceBreakdownProps) {
  const maxCount = Math.max(1, ...bySource.map((s) => s.count));
  return (
    <View style={styles.wrap}>
      <AppText variant="overline" muted>
        Per marketplace
      </AppText>
      <View style={styles.list}>
        {bySource.map((s) => {
          const fraction = s.count / maxCount;
          return (
            <View key={s.source} style={styles.row}>
              <View style={styles.head}>
                <SourceBadge source={s.source} labeled />
                <AppText style={[textStyles.number, { color: colors.text }]}>
                  {formatIdr(s.median)}
                </AppText>
              </View>
              <View style={styles.barRow}>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(6, fraction * 100)}%`, backgroundColor: sourceMeta(s.source).color },
                    ]}
                  />
                </View>
                <AppText variant="caption" muted style={styles.count}>
                  {s.count} listing
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    opacity: 0.85,
  },
  count: {
    width: 76,
    textAlign: 'right',
  },
});
