import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ReportParams, WatchlistItem } from '@/types';
import { colors, spacing } from '@/theme';
import { conditionLabel, storageLabel } from '@/lib/format';
import { hapticMedium } from '@/lib/haptics';
import { useReports } from '@/query/hooks';
import { queryClient } from '@/query/client';
import { useWatchlistStore, watchlistKey } from '@/store/watchlist';
import { getModel } from '@/data/fixtures/models';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WatchlistCard } from '@/components/WatchlistCard';
import { EmptyState } from '@/components/EmptyState';
import { TargetPriceEditor } from '@/components/TargetPriceEditor';

export default function WatchlistScreen() {
  const router = useRouter();
  const items = useWatchlistStore((s) => s.items);
  const remove = useWatchlistStore((s) => s.remove);
  const updateTarget = useWatchlistStore((s) => s.updateTarget);

  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<WatchlistItem | null>(null);

  const params: ReportParams[] = useMemo(
    () =>
      items.map((i) => ({
        modelId: i.modelId,
        storageGb: i.storageGb,
        condition: i.condition,
      })),
    [items],
  );
  const reports = useReports(params);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, []);

  const openReport = useCallback(
    (item: WatchlistItem) => {
      const model = getModel(item.modelId);
      router.push({
        pathname: '/report/[modelId]',
        params: {
          modelId: item.modelId,
          name: model?.name ?? item.modelName,
          storageGb: item.storageGb != null ? String(item.storageGb) : '',
          condition: item.condition,
        },
      });
    },
    [router],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <ScreenHeader title="Watchlist" eyebrow={`${items.length} model dipantau`} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="bookmark"
            title="Watchlist masih kosong"
            subtitle="Simpan model dari halaman harga buat pantau pasarannya dan pasang alert."
            actionLabel="Cari HP"
            onAction={() => router.push('/home')}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
          }
        >
          {items.map((item, i) => {
            const result = reports[i];
            const key = watchlistKey(item.modelId, item.storageGb, item.condition);
            return (
              <WatchlistCard
                key={key}
                item={item}
                report={result?.data}
                isLoading={result?.isLoading}
                isError={result?.isError}
                onPress={() => openReport(item)}
                onEdit={() => setEditing(item)}
                onRemove={() => {
                  hapticMedium();
                  remove(key);
                }}
              />
            );
          })}
        </ScrollView>
      )}

      <TargetPriceEditor
        visible={editing != null}
        title={editing?.modelName ?? ''}
        subtitle={
          editing
            ? `${editing.storageGb != null ? `${storageLabel(editing.storageGb)} · ` : ''}${conditionLabel(editing.condition)}`
            : undefined
        }
        initialValue={editing?.targetPriceIdr ?? 0}
        onCancel={() => setEditing(null)}
        onSave={(value) => {
          if (editing) {
            updateTarget(
              watchlistKey(editing.modelId, editing.storageGb, editing.condition),
              value,
            );
          }
          setEditing(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});
