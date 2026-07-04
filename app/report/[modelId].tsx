import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Condition, SourceId } from '@/types';
import { colors, enterFade, spacing, textGlow, textStyles } from '@/theme';
import { conditionLabel, formatIdr, formatIdrCompact, storageLabel } from '@/lib/format';
import { sourceLabel } from '@/lib/sources';
import { ALL_SOURCES } from '@/lib/sources';
import { computeAggregate } from '@/lib/stats';
import { getPriceHistory } from '@/lib/history';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import { useReport } from '@/query/hooks';
import { useWatchlistStore, watchlistKey } from '@/store/watchlist';
import { getModel } from '@/data/fixtures/models';
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  applyClientFilters,
  type ReportFilters,
} from '@/features/report/filters';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import { StatusDot } from '@/components/ui/StatusDot';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { ScreenHeader } from '@/components/ScreenHeader';
import { OdometerNumber } from '@/components/OdometerNumber';
import { MarketBand } from '@/components/MarketBand';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { SourceBreakdown } from '@/components/SourceBreakdown';
import { ListingRow } from '@/components/ListingRow';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { FilterSheet } from '@/components/FilterSheet';
import type { SheetHandle } from '@/components/ui/sheet';
import { TargetPriceEditor } from '@/components/TargetPriceEditor';
import { TechBackground } from '@/components/TechBackground';

export default function ReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    modelId: string;
    name?: string;
    storageGb?: string;
    condition?: string;
  }>();

  const modelId = params.modelId;
  const model = getModel(modelId);
  const modelName = model?.name ?? params.name ?? modelId;

  // Query-level controls (these re-fetch the report).
  const initialStorage =
    params.storageGb && params.storageGb.length > 0 ? Number(params.storageGb) : undefined;
  const [storageGb, setStorageGb] = useState<number | undefined>(initialStorage);
  const [condition, setCondition] = useState<Condition>(
    params.condition === 'new' ? 'new' : 'used',
  );
  const [location, setLocation] = useState<string | null>(null);

  // Client-side list filters.
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);

  const filterSheetRef = useRef<SheetHandle>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const query = useReport({
    modelId,
    storageGb,
    condition,
    location: location ?? undefined,
  });
  const report = query.data;
  const reportAggregate = report?.aggregate;
  const listings = useMemo(() => report?.listings ?? [], [report]);
  const hasData = (reportAggregate?.count ?? 0) > 0;

  // The full option universe for the filter sheet, WITHOUT the location filter,
  // so selecting one location never hides the others. When no location is
  // selected this shares a cache key with `query`, so it is not an extra fetch.
  const universe = useReport({ modelId, storageGb, condition });
  const universeListings = useMemo(
    () => universe.data?.listings ?? listings,
    [universe.data, listings],
  );

  // Source + price-range filters. The DISPLAYED aggregate is recomputed over the
  // filtered listings, so every filter also moves "harga pasaran". When a filter
  // empties the list we fall back to the full report so the hero still shows the
  // market context (the list itself then shows a "no match" state).
  const visible = useMemo(() => applyClientFilters(listings, filters), [listings, filters]);
  const displayAggregate = useMemo(() => {
    if (!reportAggregate) return undefined;
    return visible.length > 0 ? computeAggregate(visible) : reportAggregate;
  }, [reportAggregate, visible]);
  const aggregate = displayAggregate;
  const median = aggregate?.median ?? 0;
  const bandListings = visible.length > 0 ? visible : listings;

  // Price domain for the slider comes from the full (unfiltered) report.
  const priceDomainMin = reportAggregate?.min ?? 0;
  const priceDomainMax = reportAggregate?.max ?? 0;

  // A ~6 month mock price trend for the current model + variant + condition.
  // Anchored to the unfiltered report median so client filters do not churn it.
  const historyMedian = reportAggregate?.median ?? 0;
  const history = useMemo(
    () =>
      historyMedian > 0
        ? getPriceHistory(`${modelId}:${storageGb ?? 'any'}:${condition}`, historyMedian)
        : [],
    [modelId, storageGb, condition, historyMedian],
  );

  // Reset the price range when the query changes (the domain has moved). The
  // source filter is preserved.
  useEffect(() => {
    setFilters((f) =>
      f.priceMin == null && f.priceMax == null ? f : { ...f, priceMin: null, priceMax: null },
    );
  }, [storageGb, condition, location]);

  // Distinct locations + sources for the filter sheet, from the (unfiltered)
  // universe so the option lists stay stable as filters are applied.
  const locations = useMemo(
    () => Array.from(new Set(universeListings.map((l) => l.location))).sort(),
    [universeListings],
  );
  const sources = useMemo<SourceId[]>(
    () => ALL_SOURCES.filter((s) => universeListings.some((l) => l.source === s)),
    [universeListings],
  );

  // Watchlist state for this exact model + variant + condition.
  const wlKey = watchlistKey(modelId, storageGb, condition);
  const inWatch = useWatchlistStore((s) => s.items.some((i) => watchlistKey(i.modelId, i.storageGb, i.condition) === wlKey));
  const watchItem = useWatchlistStore((s) => s.items.find((i) => watchlistKey(i.modelId, i.storageGb, i.condition) === wlKey));
  const addWatch = useWatchlistStore((s) => s.add);
  const removeWatch = useWatchlistStore((s) => s.remove);
  const updateTarget = useWatchlistStore((s) => s.updateTarget);

  const defaultTarget =
    aggregate && aggregate.p25 > 0 ? aggregate.p25 : Math.round(median * 0.95);
  const targetPriceIdr = inWatch ? watchItem?.targetPriceIdr : undefined;

  const activeCount = activeFilterCount(filters, location);

  const onStorageChange = useCallback((gb: number | undefined) => {
    hapticLight();
    setStorageGb(gb);
  }, []);

  const toggleWatch = useCallback(() => {
    if (inWatch) {
      hapticMedium();
      removeWatch(wlKey);
    } else {
      setEditorOpen(true);
    }
  }, [inWatch, removeWatch, wlKey]);

  const onSaveTarget = useCallback(
    (value: number) => {
      if (inWatch) {
        updateTarget(wlKey, value);
      } else {
        addWatch({
          modelId,
          modelName,
          storageGb,
          condition,
          targetPriceIdr: value,
          addedAt: new Date().toISOString(),
        });
      }
      hapticSuccess();
      setEditorOpen(false);
    },
    [inWatch, updateTarget, wlKey, addWatch, modelId, modelName, storageGb, condition],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setLocation(null);
  }, []);

  const header = (
    <View style={styles.headerContent}>
      <ScreenHeader
        eyebrow={model?.brand ?? 'Model'}
        title={modelName}
        onBack={() => router.back()}
        right={
          <Chip
            label={inWatch ? 'Tersimpan' : 'Simpan'}
            selected={inWatch}
            onPress={toggleWatch}
            leading={<Icon name="bookmark" size={14} color={inWatch ? 'background' : 'text'} />}
          />
        }
      />

      <NeonDivider color={colors.cyan} maxOpacity={0.4} />

      {/* Variant (storage) selector. */}
      {model && model.availableStorageGb.length > 0 ? (
        <View style={styles.variantRow}>
          <Chip label="Semua" selected={storageGb == null} onPress={() => onStorageChange(undefined)} />
          {model.availableStorageGb.map((gb) => (
            <Chip
              key={gb}
              label={storageLabel(gb)}
              selected={storageGb === gb}
              onPress={() => onStorageChange(gb)}
            />
          ))}
        </View>
      ) : null}

      {/* Condition toggle. */}
      <SegmentedToggle<Condition>
        options={[
          { value: 'used', label: 'Bekas' },
          { value: 'new', label: 'Baru' },
        ]}
        value={condition}
        onChange={(c) => setCondition(c)}
      />

      {/* Hero block: the single most important panel, so it glows + has corners. */}
      <Card glow="lime" corners>
        <AppText variant="overline" muted>
          Harga Pasaran
        </AppText>
        {hasData && aggregate ? (
          <>
            <OdometerNumber value={median} style={styles.hero} />
            <View style={styles.heroMeta}>
              <AppText variant="body" muted>
                Rentang: {formatIdr(aggregate.min)} - {formatIdr(aggregate.max)}
              </AppText>
              <View style={styles.countRow}>
                <StatusDot color={colors.up} size={6} />
                <AppText variant="label" color="up">
                  {aggregate.count} listing ditemukan
                </AppText>
              </View>
            </View>
            <View style={styles.band}>
              <MarketBand aggregate={aggregate} listings={bandListings} targetPriceIdr={targetPriceIdr} />
            </View>
          </>
        ) : (
          <View style={styles.heroEmpty}>
            <AppText variant="title">-</AppText>
            <AppText variant="body" muted>
              Belum ada listing buat model ini
            </AppText>
          </View>
        )}
      </Card>

      {/* Price history trend (mock data; see src/lib/history.ts TODO). */}
      {hasData && history.length > 1 ? (
        <Card>
          <View style={styles.trendHead}>
            <AppText variant="overline" muted>
              Tren harga pasaran
            </AppText>
            <AppText variant="caption" faint>
              6 bulan terakhir
            </AppText>
          </View>
          <View style={styles.band}>
            <PriceHistoryChart data={history} />
          </View>
        </Card>
      ) : null}

      {/* Save-to-watchlist CTA. */}
      <View style={styles.ctaRow}>
        <Button
          label={inWatch ? 'Hapus dari Watchlist' : 'Simpan ke Watchlist'}
          variant={inWatch ? 'secondary' : 'primary'}
          leading={<Icon name={inWatch ? 'trash' : 'bookmark'} size={16} color={inWatch ? 'text' : 'background'} />}
          onPress={toggleWatch}
          style={styles.cta}
        />
        {inWatch ? (
          <Button label="Ubah target" variant="ghost" fullWidth={false} onPress={() => setEditorOpen(true)} haptics={false} />
        ) : null}
      </View>

      {/* Per-marketplace breakdown. */}
      {hasData && aggregate ? (
        <Card>
          <SourceBreakdown bySource={aggregate.bySource} />
        </Card>
      ) : null}

      {/* Filters row. */}
      {hasData ? (
        <View style={styles.filtersRow}>
          <Button
            label={activeCount > 0 ? `Filter · ${activeCount}` : 'Filter'}
            variant="secondary"
            fullWidth={false}
            leading={<Icon name="sliders" size={16} color="text" />}
            onPress={() => {
              hapticLight();
              filterSheetRef.current?.expand();
            }}
            haptics={false}
          />
          <View style={styles.activeChips}>
            {location ? (
              <Chip label={location} onRemove={() => setLocation(null)} onPress={() => setLocation(null)} />
            ) : null}
            {filters.source ? (
              <Chip
                label={sourceLabel(filters.source)}
                onRemove={() => setFilters((f) => ({ ...f, source: null }))}
                onPress={() => setFilters((f) => ({ ...f, source: null }))}
              />
            ) : null}
            {filters.priceMin != null || filters.priceMax != null ? (
              <Chip
                label={`${formatIdrCompact(filters.priceMin ?? priceDomainMin)} - ${formatIdrCompact(filters.priceMax ?? priceDomainMax)}`}
                onRemove={() => setFilters((f) => ({ ...f, priceMin: null, priceMax: null }))}
                onPress={() => setFilters((f) => ({ ...f, priceMin: null, priceMax: null }))}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Listing list heading. */}
      {hasData ? (
        <View style={styles.listHead}>
          <AppText variant="overline" muted>
            Listing
          </AppText>
          <AppText variant="caption" muted>
            {visible.length} dari {listings.length}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  // Full-screen loading / error only on the very first load (keepPreviousData
  // means variant/condition changes keep the old report visible while fetching).
  if (query.isLoading && !report) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.headerContent}>
          <ScreenHeader eyebrow={model?.brand ?? 'Model'} title={modelName} onBack={() => router.back()} />
        </View>
        <ReportSkeleton />
      </SafeAreaView>
    );
  }

  if (query.isError && !report) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <TechBackground />
        <View style={styles.headerContent}>
          <ScreenHeader eyebrow={model?.brand ?? 'Model'} title={modelName} onBack={() => router.back()} />
        </View>
        <ErrorState
          onRetry={() => {
            // Re-run both queries. refetch() re-invokes the query function and
            // clears the error state on success.
            query.refetch();
            universe.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      {/* Soft cross-fade from the loading skeleton into the real report. */}
      <Animated.View style={styles.fill} entering={enterFade}>
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingRow listing={item} medianIdr={median} />}
          ListHeaderComponent={header}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={
            hasData ? (
              <EmptyState
                icon="filter"
                title="Tidak ada listing yang cocok"
                subtitle="Coba longgarkan filter buat lihat lebih banyak listing."
                actionLabel="Reset filter"
                onAction={resetFilters}
              />
            ) : null
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.textMuted}
            />
          }
        />
      </Animated.View>

      <FilterSheet
        ref={filterSheetRef}
        storageOptions={model?.availableStorageGb ?? []}
        storageGb={storageGb}
        onStorageChange={onStorageChange}
        condition={condition}
        onConditionChange={setCondition}
        location={location}
        onLocationChange={setLocation}
        locations={locations}
        filters={filters}
        onFiltersChange={setFilters}
        sources={sources}
        priceDomainMin={priceDomainMin}
        priceDomainMax={priceDomainMax}
        onReset={resetFilters}
        onClose={() => filterSheetRef.current?.close()}
      />

      <TargetPriceEditor
        visible={editorOpen}
        title={modelName}
        subtitle={`${storageGb != null ? `${storageLabel(storageGb)} · ` : ''}${conditionLabel(condition)}`}
        initialValue={inWatch ? (watchItem?.targetPriceIdr ?? defaultTarget) : defaultTarget}
        onCancel={() => setEditorOpen(false)}
        onSave={onSaveTarget}
      />
    </SafeAreaView>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// Loading placeholder for the hero + first few listing rows.
function ReportSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton width={200} height={30} borderRadius={8} />
      <Card>
        <Skeleton width={120} height={12} />
        <Skeleton width={220} height={44} borderRadius={10} style={{ marginTop: 12 }} />
        <Skeleton width={180} height={14} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={130} borderRadius={12} style={{ marginTop: 16 }} />
      </Card>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton width={52} height={52} borderRadius={12} />
          <View style={styles.skeletonRowBody}>
            <Skeleton width="80%" height={16} />
            <Skeleton width="50%" height={12} />
          </View>
        </View>
      ))}
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  headerContent: {
    paddingTop: spacing.sm,
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hero: {
    ...textStyles.hero,
    ...textGlow.lime,
    marginTop: spacing.sm,
  },
  heroMeta: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  heroEmpty: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  band: {
    marginTop: spacing.xl,
  },
  trendHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cta: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  activeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flexShrink: 1,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  skeleton: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonRowBody: {
    flex: 1,
    gap: spacing.sm,
  },
});
