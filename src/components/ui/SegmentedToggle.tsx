import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme';
import { hapticSelection } from '@/lib/haptics';
import { AppText } from './AppText';

// A compact segmented control with a sliding acid-lime indicator. Generic over
// the option value type. Used for the Baru / Bekas condition toggle.

export type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedToggleProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const count = options.length;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const segmentWidth = count > 0 ? trackWidth / count : 0;

  const translateX = useDerivedValue(() =>
    withTiming(activeIndex * segmentWidth, { duration: 220 }),
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.track} onLayout={onLayout}>
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      ) : null}
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segment}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                hapticSelection();
                onChange(opt.value);
              }
            }}
          >
            <AppText
              variant="label"
              style={{ color: selected ? colors.background : colors.textMuted }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    backgroundColor: colors.up,
    borderRadius: radius.pill,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    zIndex: 1,
  },
});
