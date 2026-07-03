import { useId } from 'react';
import type { ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@/theme';

// A hairline divider whose neon color fades out at both ends, HUD-style. Cheap
// SVG gradient, no extra dependency. Use in place of a flat hairline where a bit
// of technical flourish belongs (under headers, key section breaks).

type NeonDividerProps = {
  color?: string;
  height?: number;
  maxOpacity?: number;
  style?: ViewStyle;
};

export function NeonDivider({
  color = colors.cyan,
  height = 1,
  maxOpacity = 0.5,
  style,
}: NeonDividerProps) {
  // Unique gradient id per instance so multiple dividers never clash.
  const id = `nd-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width="100%" height={height} style={style}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.5" stopColor={color} stopOpacity={maxOpacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height={height} fill={`url(#${id})`} />
    </Svg>
  );
}
