import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ModelSummary, ReportParams, WatchlistItem } from '@/types';
import { colors, spacing } from '@/theme';
import { hapticLight } from '@/lib/haptics';
import { useSearch, useReports } from '@/query/hooks';
import { queryClient } from '@/query/client';
import { useRecentSearchesStore } from '@/store/recentSearches';
import { useWatchlistStore } from '@/store/watchlist';
import { TRENDING_MODEL_IDS, getModel } from '@/data/fixtures/models';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import { SearchBar } from '@/components/SearchBar';
import { ModelRow } from '@/components/ModelRow';
import { WatchlistCard } from '@/components/WatchlistCard';
import { EmptyState } from '@/components/EmptyState';

const TRENDING_MODELS: ModelSummary[] = TRENDING_MODEL_IDS.map(getModel).filter(
  (m): m is ModelSummary => m != null,
);

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const recent = useRecentSearchesStore((s) => s.recent);
  const addSearch = useRecentSearchesStore((s) => s.addSearch);
  const clearRecent = useRecentSearchesStore((s) => s.clear);
  const watchlist = useWatchlistStore((s) => s.items);

  const searching = query.trim().length > 0;
  const searchResults = useSearch(query);

  // Watchlist snapshot (first few) needs live medians.
  const snapshotItems = useMemo(() => watchlist.slice(0, 3), [watchlist]);
  const snapshotParams: ReportParams[] = useMemo(
    () =>
      snapshotItems.map((i) => ({
        modelId: i.modelId,
        storageGb: i.storageGb,
        condition: i.condition,
      })),
    [snapshotItems],
  );
  const snapshotReports = useReports(snapshotParams);

  // Open a report from search / trending: default to the first storage variant
  // and used condition (the common case for browsing).
  const openReport = useCallback(
    (model: ModelSummary, opts?: { storageGb?: number }) => {
      hapticLight();
      const storageGb = opts?.storageGb ?? model.availableStorageGb[0];
      router.push({
        pathname: '/report/[modelId]',
        params: {
          modelId: model.id,
          name: model.name,
          storageGb: storageGb != null ? String(storageGb) : '',
          condition: 'used',
        },
      });
    },
    [router],
  );

  // Open a report for a saved watchlist entry, preserving its EXACT variant
  // (including "any" storage) and condition so the report resolves back to the
  // same watchlist key and shows the tracked prices.
  const openWatchItem = useCallback(
    (item: WatchlistItem) => {
      hapticLight();
      router.push({
        pathname: '/report/[modelId]',
        params: {
          modelId: item.modelId,
          name: getModel(item.modelId)?.name ?? item.modelName,
          storageGb: item.storageGb != null ? String(item.storageGb) : '',
          condition: item.condition,
        },
      });
    },
    [router],
  );

  const onSubmit = useCallback(() => {
    if (query.trim().length > 0) {
      addSearch(query);
      hapticLight();
    }
  }, [query, addSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
        }
      >
        <View style={styles.brand}>
          <Icon name="radar" size={22} color="up" />
          <AppText variant="heading">HargaRadar</AppText>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={onSubmit}
        />

        {searching ? (
          <SearchResultsSection
            isLoading={searchResults.isLoading}
            isError={searchResults.isError}
            models={searchResults.data ?? []}
            onSelect={openReport}
            onRetry={searchResults.refetch}
          />
        ) : (
          <>
            {recent.length > 0 ? (
              <Section
                title="Pencarian terakhir"
                action={
                  <Chip label="Hapus" onPress={clearRecent} />
                }
              >
                <View style={styles.chips}>
                  {recent.map((q) => (
                    <Chip key={q} label={q} onPress={() => setQuery(q)} />
                  ))}
                </View>
              </Section>
            ) : null}

            <Section title="Trending">
              <Card padded={false} style={styles.listCard}>
                {TRENDING_MODELS.map((model, i) => (
                  <View key={model.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.rowPad}>
                      <ModelRow model={model} onPress={() => openReport(model)} />
                    </View>
                  </View>
                ))}
              </Card>
            </Section>

            <Section
              title="Watchlist"
              action={
                watchlist.length > 3 ? (
                  <Chip label="Lihat semua" onPress={() => router.push('/watchlist')} />
                ) : undefined
              }
            >
              {snapshotItems.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="bookmark"
                    title="Belum ada watchlist"
                    subtitle="Simpan model favoritmu buat pantau harga pasarannya di sini."
                  />
                </Card>
              ) : (
                <View style={styles.snapshot}>
                  {snapshotItems.map((item, i) => {
                    const result = snapshotReports[i];
                    return (
                      <WatchlistCard
                        key={`${item.modelId}:${item.storageGb ?? 'any'}:${item.condition}`}
                        item={item}
                        report={result?.data}
                        isLoading={result?.isLoading}
                        isError={result?.isError}
                        onPress={() => openWatchItem(item)}
                      />
                    );
                  })}
                </View>
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SearchResultsSection({
  isLoading,
  isError,
  models,
  onSelect,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  models: ModelSummary[];
  onSelect: (m: ModelSummary) => void;
  onRetry: () => void;
}) {
  if (isError) {
    return (
      <Card>
        <EmptyState
          icon="refresh"
          title="Gagal ambil data, coba lagi"
          actionLabel="Coba lagi"
          onAction={onRetry}
        />
      </Card>
    );
  }
  if (isLoading && models.length === 0) {
    return (
      <Card padded={false} style={styles.listCard}>
        {[0, 1, 2].map((i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.searchSkeletonRow}>
              <Skeleton width={46} height={46} borderRadius={12} />
              <View style={styles.searchSkeletonBody}>
                <Skeleton width="70%" height={15} />
                <Skeleton width="45%" height={11} />
              </View>
            </View>
          </View>
        ))}
      </Card>
    );
  }
  if (models.length === 0) {
    return (
      <Card>
        <EmptyState title="Model tidak ditemukan" subtitle="Coba kata kunci lain, misalnya 'iPhone 11' atau 'Galaxy S23'." />
      </Card>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Card padded={false} style={styles.listCard}>
        {models.map((model, i) => (
          <View key={model.id}>
            {i > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.rowPad}>
              <ModelRow model={model} onPress={() => onSelect(model)} />
            </View>
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="overline" muted>
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.huge,
    gap: spacing.xxl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  listCard: {
    paddingHorizontal: spacing.lg,
  },
  rowPad: {
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  snapshot: {
    gap: spacing.md,
  },
  searchSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  searchSkeletonBody: {
    flex: 1,
    gap: spacing.sm,
  },
});
