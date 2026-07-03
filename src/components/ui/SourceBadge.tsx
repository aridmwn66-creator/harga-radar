import { StyleSheet, View } from 'react-native';
import type { SourceId } from '@/types';
import { sourceMeta } from '@/lib/sources';
import { radius, spacing } from '@/theme';
import { AppText } from './AppText';

// Per-source pill with the source's accent tint. Two sizes: a compact mark for
// listing rows, and a labeled version for the per-marketplace breakdown.

type SourceBadgeProps = {
  source: SourceId;
  labeled?: boolean;
};

export function SourceBadge({ source, labeled = false }: SourceBadgeProps) {
  const meta = sourceMeta(source);
  return (
    <View style={[styles.badge, { backgroundColor: meta.tint }]}>
      <AppText variant="overline" style={{ color: meta.color, letterSpacing: 0.6 }}>
        {labeled ? meta.label : meta.short}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
});
