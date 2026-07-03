import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Button } from './ui/Button';
import { AppText } from './ui/AppText';
import { Icon, type IconName } from './ui/Icon';

// Neutral empty state. Used when a search or report returns nothing.

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'search',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={26} color="textMuted" />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" muted center style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant="secondary" fullWidth={false} onPress={onAction} />
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
    backgroundColor: colors.surface,
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
