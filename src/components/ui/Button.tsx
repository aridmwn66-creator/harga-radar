import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, glow, MIN_TAP_TARGET, radius, spacing } from '@/theme';
import { hapticLight } from '@/lib/haptics';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  leading?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  haptics?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  leading,
  disabled,
  loading,
  haptics = true,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary'
      ? colors.background
      : variant === 'danger'
        ? colors.down
        : colors.text;

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        if (haptics) hapticLight();
        onPress?.();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLES[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {leading}
          <AppText variant="bodyStrong" style={{ color: textColor }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TAP_TARGET,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
});

const VARIANT_STYLES: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: colors.up,
    // Soft lime bloom around the primary action.
    ...glow.lime,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },
  danger: {
    backgroundColor: colors.downTint,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
};
