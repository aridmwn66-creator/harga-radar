import { useMemo } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import type { Listing } from '@/types';
import { colors, enterFade, radius, spacing, textGlow, textStyles } from '@/theme';
import {
  conditionLabel,
  formatIdr,
  formatIdrCompact,
  formatRelativeTime,
  storageLabel,
} from '@/lib/format';
import { dealScore } from '@/lib/stats';
import { hapticLight } from '@/lib/haptics';
import { getModel } from '@/data/fixtures/models';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { SourceBadge } from '@/components/ui/SourceBadge';
import { StatusDot } from '@/components/ui/StatusDot';
import { Icon } from '@/components/ui/Icon';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Thumbnail } from '@/components/Thumbnail';
import { EmptyState } from '@/components/EmptyState';
import { TechBackground } from '@/components/TechBackground';

// Full detail for a single listing. Self-contained: the listing is passed in as
// a route param (works for both mock and live data).

export default function ListingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data?: string; median?: string }>();

  const listing = useMemo<Listing | null>(() => {
    if (!params.data) return null;
    try {
      return JSON.parse(params.data) as Listing;
    } catch {
      return null;
    }
  }, [params.data]);

  const medianIdr = params.median ? Number(params.median) : 0;

  if (!listing) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <TechBackground />
        <View style={styles.header}>
          <ScreenHeader title="Listing" onBack={() => router.back()} />
        </View>
        <EmptyState title="Listing tidak ditemukan" subtitle="Coba buka lagi dari daftar harga." />
      </SafeAreaView>
    );
  }

  const brand = getModel(listing.modelId)?.brand ?? 'Apple';
  const score = dealScore(listing.priceIdr, medianIdr);
  const below = medianIdr > 0 && listing.priceIdr < medianIdr;
  const pct = medianIdr > 0 ? Math.round((Math.abs(listing.priceIdr - medianIdr) / medianIdr) * 100) : 0;
  const dealColor = below ? colors.up : colors.down;

  const openMarketplace = async () => {
    hapticLight();
    try {
      await Linking.openURL(listing.url);
    } catch {
      /* the marketplace link may not open in a simulator; ignore */
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.header}>
        <ScreenHeader eyebrow={brand} title={getModel(listing.modelId)?.name ?? listing.title} onBack={() => router.back()} />
      </View>

      <Animated.View style={styles.fill} entering={enterFade}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo (placeholder tile for mock; real image when the API provides one). */}
          {/* TODO(PROMPT 2 / backend): render listing.thumbnailUrl / gallery when available. */}
          <Card padded={false} style={styles.photoCard}>
            {listing.thumbnailUrl ? (
              <Image source={{ uri: listing.thumbnailUrl }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Thumbnail brand={brand} size={110} />
                <AppText variant="caption" faint>
                  Foto contoh
                </AppText>
              </View>
            )}
          </Card>

          {/* Price + deal position. */}
          <Card glow={below ? 'lime' : undefined} corners={below}>
            <AppText variant="overline" muted>
              Harga listing
            </AppText>
            <AppText style={[textStyles.hero, styles.price, below ? textGlow.lime : null]}>
              {formatIdr(listing.priceIdr)}
            </AppText>
            {medianIdr > 0 ? (
              <View style={styles.dealRow}>
                <View style={[styles.dealBadge, { backgroundColor: below ? colors.upTint : colors.downTint }]}>
                  <StatusDot color={dealColor} size={6} />
                  <AppText variant="label" style={{ color: dealColor }}>
                    {pct}% {below ? 'di bawah pasaran' : 'di atas pasaran'}
                  </AppText>
                </View>
                <AppText variant="caption" muted>
                  Pasaran {formatIdrCompact(medianIdr)}
                </AppText>
              </View>
            ) : null}
          </Card>

          {/* Details. */}
          <Card>
            <AppText variant="overline" muted>
              Detail
            </AppText>
            <View style={styles.detailList}>
              <DetailRow label="Judul" value={listing.title} />
              <DetailRow label="Kondisi" value={conditionLabel(listing.condition)} />
              {listing.storageGb != null ? (
                <DetailRow label="Storage" value={storageLabel(listing.storageGb)} />
              ) : null}
              <DetailRow label="Lokasi" value={listing.location} />
              <DetailRow
                label="Diposting"
                value={formatRelativeTime(listing.postedAt)}
              />
              <View style={styles.detailRow}>
                <AppText variant="body" muted>
                  Marketplace
                </AppText>
                <SourceBadge source={listing.source} labeled />
              </View>
            </View>
          </Card>

          <Button
            label="Buka di Marketplace"
            variant="primary"
            leading={<Icon name="external" size={16} color="background" />}
            onPress={openMarketplace}
          />
          <View style={styles.pillRow}>
            <Pill label={conditionLabel(listing.condition)} />
            {listing.storageGb != null ? <Pill label={storageLabel(listing.storageGb)} /> : null}
            <Pill label={listing.location} />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="body" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.detailValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  photoCard: {
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  photoPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  price: {
    ...textStyles.hero,
    fontSize: 40,
    lineHeight: 44,
    marginTop: spacing.xs,
  },
  dealRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  detailList: {
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
