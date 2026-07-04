import type { CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { AppText } from './AppText';

// Web fallback for the gesture-driven RangeSlider. gesture-handler + Reanimated
// drag does not translate cleanly to the browser, so on web we use two plain
// HTML <input type="range"> controls (min and max). Same props, same committed
// behavior; no design or feature change, just a control that works everywhere
// including Safari on iPhone.

type RangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  onChange: (low: number, high: number) => void;
};

const inputStyle: CSSProperties = {
  width: '100%',
  accentColor: colors.up,
  cursor: 'pointer',
};

export function RangeSlider({ min, max, low, high, step = 50_000, onChange }: RangeSliderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText variant="overline" muted>
          Min
        </AppText>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)}
          style={inputStyle}
          aria-label="Harga minimum"
        />
      </View>
      <View style={styles.row}>
        <AppText variant="overline" muted>
          Max
        </AppText>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))}
          style={inputStyle}
          aria-label="Harga maksimum"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 4,
  },
  row: {
    gap: 4,
  },
});
