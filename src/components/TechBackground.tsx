import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { colors } from '@/theme';

// An extremely faint HUD grid, tiled across the whole screen behind the content.
// Opacity is intentionally near the threshold of visibility: it should read as
// texture, never as decoration. Rendered as a fixed, absolute layer so it does
// not scroll with content.

const CELL = 46;

export function TechBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="hud-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <Path
              d={`M ${CELL} 0 L 0 0 L 0 ${CELL}`}
              stroke={colors.grid}
              strokeWidth={1}
              fill="none"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#hud-grid)" />
      </Svg>
    </View>
  );
}
