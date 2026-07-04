import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors, durations, tabularNums } from '@/theme';
import { formatIdr } from '@/lib/format';

// Web odometer. The native version animates a TextInput's `text` prop on the UI
// thread, which react-native-web does not drive, so on web the number would sit
// static. This variant rolls the value with a plain requestAnimationFrame loop
// and an ease-out curve (matching the native feel), formatting each frame. It is
// one value per component, so it stays smooth, and it honours reduced motion by
// snapping straight to the target.

type Kind = 'idr' | 'plain';

type OdometerNumberProps = {
  value: number;
  kind?: Kind;
  duration?: number;
  style?: TextStyle | TextStyle[];
  accessibilityLabel?: string;
};

// Ease-out cubic: quick to start, lands softly, like the native Easing curve.
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function format(n: number, kind: Kind): string {
  return kind === 'idr' ? formatIdr(Math.round(n)) : String(Math.round(n));
}

export function OdometerNumber({
  value,
  kind = 'idr',
  duration = durations.odometer,
  style,
  accessibilityLabel,
}: OdometerNumberProps) {
  // Start at 0 and roll up to the target on mount, matching the native odometer
  // (which animates from 0). Subsequent value changes roll from the last value.
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const from = currentRef.current;
    const to = value;
    const set = (v: number) => {
      currentRef.current = v;
      setDisplay(v);
    };

    if (reduced || from === to || duration <= 0) {
      set(to);
      return;
    }

    let raf = 0;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      set(from + (to - from) * easeOut(p));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  const finalText = format(value, kind);
  return (
    <Text
      accessibilityLabel={accessibilityLabel ?? finalText}
      style={[styles.text, tabularNums, { color: colors.text }, style]}
    >
      {format(display, kind)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
  },
});
