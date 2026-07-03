import { Platform, View, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

// A small status dot with a soft neon glow. Static (no blinking) so it reads as
// a steady indicator, not an alarm.

type StatusDotProps = {
  color?: string;
  size?: number;
  glow?: boolean;
  style?: ViewStyle;
};

export function StatusDot({
  color = colors.up,
  size = 7,
  glow = true,
  style,
}: StatusDotProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        glow && {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 5,
          elevation: Platform.select({ android: 3, default: 0 }),
        },
        style,
      ]}
    />
  );
}
