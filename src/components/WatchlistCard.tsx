import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { PriceReport, WatchlistItem } from '@/types';
import { colors, enterFade, radius, spacing, textGlow, textStyles } from '@/theme';
import {
  conditionLabel,
  formatIdr,
  formatIdrCompact,
  storageLabel,
} from '@/lib/format';
import { countBelowMedian, countBelowTarget } from '@/lib/stats';
import { Card } from './ui/Card';
import { AppText } from './ui/AppText';
import { Pill } from './ui/Pill';
import { Skeleton } from './ui/Skeleton';
import { Icon } from './ui/Icon';
import { StatusDot } from './ui/StatusDot';

// A watchlist entry card: model, variant/condition, current harga pasaran, and
// whether any listing is currently below the user's target. Used on Home
// (snapshot, tappable) and on the Watchlist screen (with edit/remove controls).

type WatchlistCardProps = {
  item: WatchlistItem;
  report?: PriceReport;
  isLoading?: boolean;
  isError?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
};

export function WatchlistCard({
  item,
  report,
  isLoading,
  isError,
  onPress,
  onEdit,
  onRemove,
}: WatchlistCardProps) {
  const median = report?.aggregate.median ?? 0;
  const listings = report?.listings ?? [];
  const belowTarget = countBelowTarget(listings, item.targetPriceIdr);
  const belowMedian = countBelowMedian(listings, median);
  const hasControls = !!onEdit || !!onRemove;
  const alerting = belowTarget > 0;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {/* An armed alert (a listing under target) makes the whole panel glow. */}
      <Card glow={alerting ? 'lime' : undefined} corners={alerting}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <AppText variant="heading" numberOfLines={1}>
              {item.modelName}
            </AppText>
            <View style={styles.pills}>
              {item.storageGb != null ? (
                <Pill label={storageLabel(item.storageGb)} />
              ) : null}
              <Pill label={conditionLabel(item.condition)} />
            </View>
          </View>
          {hasControls ? (
            <View style={styles.controls}>
              {onEdit ? (
                <Pressable onPress={onEdit} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Ubah target">
                  <Icon name="edit" size={16} color="textMuted" />
                </Pressable>
              ) : null}
              {onRemove ? (
                <Pressable onPress={onRemove} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Hapus dari watchlist">
                  <Icon name="trash" size={16} color="textMuted" />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Icon name="chevron-right" size={20} color="textFaint" />
          )}
        </View>

        <View style={styles.body}>
          <AppText variant="overline" muted>
            Harga Pasaran
          </AppText>
          {isLoading ? (
            <Skeleton width={160} height={26} style={{ marginTop: 4 }} />
          ) : isError ? (
            <AppText variant="numberLg" color="down">
              Gagal memuat
            </AppText>
          ) : (
            <Animated.View entering={enterFade}>
              <AppText style={[textStyles.numberLg, styles.price]}>
                {formatIdr(median)}
              </AppText>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          {isLoading ? (
            <Skeleton width={120} height={14} />
          ) : (
            <View
              style={[
                styles.indicator,
                { backgroundColor: alerting ? colors.upTint : colors.surfaceRaised },
              ]}
            >
              <StatusDot
                color={alerting ? colors.up : colors.textFaint}
                size={6}
                glow={alerting}
              />
              <AppText
                variant="label"
                style={{ color: alerting ? colors.up : colors.textMuted }}
              >
                {alerting
                  ? `${belowTarget} di bawah target`
                  : `${belowMedian} di bawah pasaran`}
              </AppText>
            </View>
          )}
          <AppText variant="caption" muted>
            Target {formatIdrCompact(item.targetPriceIdr)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  body: {
    marginTop: spacing.lg,
    gap: 2,
  },
  price: {
    fontSize: 26,
    lineHeight: 30,
    ...textGlow.limeSoft,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
});
