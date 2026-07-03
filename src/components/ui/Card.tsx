import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, glow as glowFx, radius, spacing } from '@/theme';
import { NeonDivider } from './NeonDivider';
import { HudCorners } from './HudCorners';

// Holographic panel: a recessed near-black fill, a cool faintly-neon hairline,
// and a fading cyan "sheen" along the top edge. Optional soft glow + HUD corner
// brackets mark the most important panels. No heavy Material elevation.

type GlowKind = 'lime' | 'cyan';

type CardProps = ViewProps & {
  children: ReactNode;
  padded?: boolean;
  /** Adds a subtle colored glow + a brighter border. Use only on key panels. */
  glow?: GlowKind;
  /** Adds HUD corner brackets. Use sparingly on the most important panels. */
  corners?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function Card({
  children,
  padded = true,
  glow,
  corners,
  style,
  ...rest
}: CardProps) {
  const glowStyle = glow === 'lime' ? glowFx.lime : glow === 'cyan' ? glowFx.cyan : null;
  const borderColor = glow === 'lime' ? colors.panelBorderActive : colors.panelBorder;
  const cornerColor = glow === 'lime' ? colors.up : colors.cyan;

  return (
    <View
      style={[
        styles.card,
        { borderColor },
        // Clip content to the rounded corners, except on glow panels where a
        // clip would also swallow the shadow (those panels are padded, so their
        // content never reaches the corners anyway).
        { overflow: glow ? 'visible' : 'hidden' },
        glowStyle,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {/* Holographic top sheen: a cyan hairline that fades out at both ends. */}
      <View pointerEvents="none" style={styles.sheen}>
        <NeonDivider color={colors.cyan} maxOpacity={0.3} />
      </View>
      {corners ? <HudCorners color={cornerColor} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  padded: {
    padding: spacing.xl,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
  },
});
