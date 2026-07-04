import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, glow } from '@/theme';

// A custom dual-thumb range slider. Built on gesture-handler + Reanimated (no
// extra dependency) and styled to the HUD theme. Thumbs move on the UI thread
// for smoothness; the committed value is reported on release so downstream
// recomputation (list + aggregate) happens once, not every frame.
//
// activeOffsetX lets a mostly-horizontal drag grab a thumb while vertical drags
// still pass through to a parent bottom sheet.

const THUMB = 24;

type RangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  onChange: (low: number, high: number) => void;
};

export function RangeSlider({ min, max, low, high, step = 50_000, onChange }: RangeSliderProps) {
  const [trackW, setTrackW] = useState(0);
  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const startLowX = useSharedValue(0);
  const startHighX = useSharedValue(0);

  const span = Math.max(1, max - min);
  const usable = Math.max(1, trackW - THUMB);

  const valToX = useMemo(
    () => (v: number) => ((v - min) / span) * usable,
    [min, span, usable],
  );

  // Keep thumbs in sync with incoming values (and once the width is known).
  useEffect(() => {
    if (trackW > 0) {
      lowX.value = valToX(low);
      highX.value = valToX(high);
    }
  }, [low, high, trackW, valToX, lowX, highX]);

  const commit = (which: 'low' | 'high', x: number) => {
    const raw = min + (x / usable) * span;
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.min(max, Math.max(min, snapped));
    if (which === 'low') onChange(Math.min(clamped, high), high);
    else onChange(low, Math.max(clamped, low));
  };

  const panLow = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onBegin(() => {
          startLowX.value = lowX.value;
        })
        .onUpdate((e) => {
          const x = Math.min(highX.value, Math.max(0, startLowX.value + e.translationX));
          lowX.value = x;
        })
        .onEnd(() => {
          runOnJS(commit)('low', lowX.value);
        }),
    // Recreate only on layout/domain change, never mid-drag on value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usable, min, max, step, low, high],
  );

  const panHigh = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onBegin(() => {
          startHighX.value = highX.value;
        })
        .onUpdate((e) => {
          const x = Math.max(lowX.value, Math.min(usable, startHighX.value + e.translationX));
          highX.value = x;
        })
        .onEnd(() => {
          runOnJS(commit)('high', highX.value);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usable, min, max, step, low, high],
  );

  const lowThumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: lowX.value }] }));
  const highThumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: highX.value }] }));
  const activeStyle = useAnimatedStyle(() => ({
    left: lowX.value + THUMB / 2,
    width: Math.max(0, highX.value - lowX.value),
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.rail} />
      <Animated.View style={[styles.active, activeStyle]} />
      <GestureDetector gesture={panLow}>
        <Animated.View style={[styles.thumb, lowThumbStyle]} hitSlop={12} />
      </GestureDetector>
      <GestureDetector gesture={panHigh}>
        <Animated.View style={[styles.thumb, highThumbStyle]} hitSlop={12} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB,
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceRaised,
  },
  active: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.up,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: colors.up,
    ...glow.lime,
  },
});
