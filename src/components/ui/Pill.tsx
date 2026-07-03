import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, type ColorToken, radius, spacing } from '@/theme';
import { AppText } from './AppText';

// Small rounded label. The tint/color can be a theme token or a raw color string
// (source badges pass per-source colors).

type PillProps = {
  label: string;
  /** Background tint. Raw color string or theme token. */
  tint?: string;
  /** Text/label color. Raw color string or theme token. */
  color?: string;
  leading?: ReactNode;
  style?: ViewStyle;
};

function token(value: string | undefined, fallback: ColorToken): string {
  if (!value) return colors[fallback];
  return value in colors ? colors[value as ColorToken] : value;
}

export function Pill({ label, tint, color, leading, style }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: token(tint, 'surfaceRaised') }, style]}>
      {leading}
      <AppText variant="overline" style={{ color: token(color, 'textMuted') }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
