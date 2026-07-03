import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Button } from './ui/Button';
import { AppText } from './ui/AppText';
import { Icon } from './ui/Icon';

// Error state with a retry affordance. Default copy matches the app's tone.

type ErrorStateProps = {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Gagal ambil data, coba lagi',
  subtitle,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name="refresh" size={26} color="down" />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" muted center style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Coba lagi" variant="secondary" fullWidth={false} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.downTint,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.sm,
  },
  subtitle: {
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.md,
  },
});
