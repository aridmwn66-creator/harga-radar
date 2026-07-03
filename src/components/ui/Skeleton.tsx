import { useEffect } from 'react';
import { StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, durations, easing, radius } from '@/theme';

// A pulsing placeholder block for loading states. Uses a single shared value so
// many skeletons pulse together cheaply.

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const reduced = useReducedMotion();
  // Rest at a clearly-visible opacity; when motion is allowed, pulse slowly
  // between that and near-solid. When reduced, hold a steady mid opacity.
  const pulse = useSharedValue(reduced ? 0.65 : 0.45);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withTiming(0.85, { duration: durations.shimmer, easing: easing.inOut }),
      -1,
      true,
    );
  }, [pulse, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius }, animatedStyle, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceRaised,
  },
});
