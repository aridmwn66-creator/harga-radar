import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, type ColorToken, textStyles, type TextStyleName } from '@/theme';

// The single text primitive. Enforces the type scale + color tokens so no screen
// ever hardcodes a font or hex. Dynamic-type friendly (scales, but capped so the
// terminal layout never breaks).

type AppTextProps = TextProps & {
  variant?: TextStyleName;
  color?: ColorToken;
  muted?: boolean;
  faint?: boolean;
  center?: boolean;
  style?: TextStyle | TextStyle[];
};

export function AppText({
  variant = 'body',
  color,
  muted,
  faint,
  center,
  style,
  maxFontSizeMultiplier = 1.4,
  ...rest
}: AppTextProps) {
  const resolvedColor: ColorToken = color ?? (faint ? 'textFaint' : muted ? 'textMuted' : 'text');
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        textStyles[variant],
        { color: colors[resolvedColor] },
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}
