import { useEffect } from 'react';
import { StyleSheet, TextInput, type TextInputProps, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, tabularNums } from '@/theme';
import { formatIdr } from '@/lib/format';

// Odometer-style rolling number. On mount (and whenever `value` changes) the
// displayed figure animates from its previous value up to the target, giving the
// "markets terminal ticking into place" feel. Driven entirely on the UI thread
// via an animated TextInput so it stays smooth.

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type Kind = 'idr' | 'plain';

type OdometerNumberProps = {
  value: number;
  kind?: Kind;
  duration?: number;
  style?: TextStyle | TextStyle[];
  /** Accessibility label; defaults to the formatted final value. */
  accessibilityLabel?: string;
};

// Worklet formatters so the text can be computed on the UI thread each frame.
function formatIdrWorklet(n: number): string {
  'worklet';
  const rounded = Math.round(n);
  const s = String(rounded);
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) out += '.';
    out += s[i];
  }
  return `Rp ${out}`;
}

function formatPlainWorklet(n: number): string {
  'worklet';
  return String(Math.round(n));
}

export function OdometerNumber({
  value,
  kind = 'idr',
  duration = 900,
  style,
  accessibilityLabel,
}: OdometerNumberProps) {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, shown]);

  const animatedProps = useAnimatedProps<TextInputProps & { text: string }>(() => {
    const v = shown.value;
    return { text: kind === 'idr' ? formatIdrWorklet(v) : formatPlainWorklet(v) };
  });

  const finalText = kind === 'idr' ? formatIdr(value) : String(Math.round(value));

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={finalText}
      animatedProps={animatedProps}
      accessible
      accessibilityLabel={accessibilityLabel ?? finalText}
      style={[styles.input, tabularNums, { color: colors.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    // TextInput adds vertical font padding on Android; kill it so the number
    // aligns with surrounding display text.
    includeFontPadding: false,
  },
});
