import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

// Small L-shaped corner brackets, HUD-style. Rendered as an absolute overlay
// inside an important panel (hero, active watchlist card). Used sparingly.

type HudCornersProps = {
  color?: string;
  size?: number;
  inset?: number;
  thickness?: number;
  opacity?: number;
};

export function HudCorners({
  color = colors.cyan,
  size = 12,
  inset = 7,
  thickness = 1.5,
  opacity = 0.55,
}: HudCornersProps) {
  const base = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <View style={[base, { top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[base, { top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[base, { bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[base, { bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </View>
  );
}
