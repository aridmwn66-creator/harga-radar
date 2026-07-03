import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './ui/AppText';
import { Icon } from './ui/Icon';

// Standard screen header: optional back button, an overline eyebrow, a title,
// and an optional right-side control.

type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, eyebrow, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.back} accessibilityRole="button" accessibilityLabel="Kembali">
          <Icon name="chevron-left" size={22} color="text" />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        {eyebrow ? (
          <AppText variant="overline" color="textMuted">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title" numberOfLines={1}>
          {title}
        </AppText>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  right: {
    marginLeft: 'auto',
  },
});
