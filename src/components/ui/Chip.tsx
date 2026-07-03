import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, MIN_TAP_TARGET, radius, spacing } from '@/theme';
import { AppText } from './AppText';

// A tappable token used for recent searches, storage variants and filters.
// Selected state fills with a subtle accent tint and a brighter border.

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  leading?: ReactNode;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, onRemove, leading, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {leading}
      <AppText
        variant="label"
        style={{ color: selected ? colors.background : colors.text }}
      >
        {label}
      </AppText>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`Hapus ${label}`}>
          <View style={styles.remove}>
            <AppText
              variant="label"
              style={{ color: selected ? colors.background : colors.textMuted, lineHeight: 14 }}
            >
              {'×'}
            </AppText>
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.up,
    borderColor: colors.up,
  },
  pressed: {
    opacity: 0.7,
  },
  remove: {
    marginLeft: 2,
    minWidth: 16,
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { MIN_TAP_TARGET };
