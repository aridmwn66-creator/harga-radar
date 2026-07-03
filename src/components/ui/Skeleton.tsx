import { useEffect } from 'react';
import { StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius } from '@/theme';

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
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.9, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

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
