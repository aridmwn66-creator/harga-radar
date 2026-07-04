import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Listing } from '@/types';
import { colors, spacing, textStyles } from '@/theme';
import { conditionLabel, formatIdr, formatRelativeTime } from '@/lib/format';
import { dealScore, isDeal } from '@/lib/stats';
import { hapticLight } from '@/lib/haptics';
import { Thumbnail } from './Thumbnail';
import { AppText } from './ui/AppText';
import { SourceBadge } from './ui/SourceBadge';
import { DealTag } from './ui/DealTag';
import { Icon } from './ui/Icon';
import { getModel } from '@/data/fixtures/models';

// A single marketplace listing. Tapping opens the full listing detail screen
// (which has the "Buka di Marketplace" link). Price is tinted acid-lime and
// flagged when it sits below the market median.

type ListingRowProps = {
  listing: Listing;
  medianIdr: number;
  nowMs?: number;
};

export function ListingRow({ listing, medianIdr, nowMs }: ListingRowProps) {
  const router = useRouter();
  const deal = isDeal(listing.priceIdr, medianIdr);
  const score = dealScore(listing.priceIdr, medianIdr);
  const brand = getModel(listing.modelId)?.brand ?? 'Apple';

  const openDetail = () => {
    hapticLight();
    // Pass the listing (and the market median for the deal score) as params so
    // the detail screen is self-contained and works for both mock and live data.
    router.push({
      pathname: '/listing/[id]',
      params: { id: listing.id, data: JSON.stringify(listing), median: String(medianIdr) },
    });
  };

  const meta = [
    conditionLabel(listing.condition),
    listing.location,
    formatRelativeTime(listing.postedAt, nowMs),
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <Pressable
      onPress={openDetail}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatIdr(listing.priceIdr)}, lihat detail`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Thumbnail brand={brand} size={52} />

      <View style={styles.middle}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {listing.title}
        </AppText>
        <View style={styles.metaRow}>
          <SourceBadge source={listing.source} />
          <AppText variant="caption" muted numberOfLines={1} style={styles.meta}>
            {meta}
          </AppText>
        </View>
        {deal ? <DealTag score={score} /> : null}
      </View>

      <View style={styles.right}>
        <AppText
          style={[textStyles.numberLg, { color: deal ? colors.up : colors.text }]}
        >
          {formatIdr(listing.priceIdr)}
        </AppText>
        <Icon name="chevron-right" size={18} color="textFaint" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  middle: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
