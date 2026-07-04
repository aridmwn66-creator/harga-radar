import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type BottomSheet from '@gorhom/bottom-sheet';
import type { ModelSummary, ReportParams } from '@/types';
import { colors, radius, spacing } from '@/theme';
import { conditionLabel, formatIdr, formatIdrCompact } from '@/lib/format';
import { countBelowTarget } from '@/lib/stats';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { getModelMedians } from '@/lib/medians';
import { useReports } from '@/query/hooks';
import { useAlertsStore, type PriceAlert } from '@/store/alerts';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { Icon } from '@/components/ui/Icon';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { ModelPickerSheet } from '@/components/ModelPickerSheet';
import { TargetPriceEditor } from '@/components/TargetPriceEditor';
import { TechBackground } from '@/components/TechBackground';

// Price alerts. Alerts are stored locally and evaluated on-device against the
// (mock) report data. TODO(PROMPT 2 / backend): real push notifications need a
// backend watching prices server-side.

export default function AlertsScreen() {
  const router = useRouter();
  const pickerRef = useRef<BottomSheet>(null);
  const alerts = useAlertsStore((s) => s.alerts);
  const add = useAlertsStore((s) => s.add);
  const remove = useAlertsStore((s) => s.remove);
  const toggle = useAlertsStore((s) => s.toggle);
  const updateTarget = useAlertsStore((s) => s.updateTarget);

  const [addModel, setAddModel] = useState<ModelSummary | null>(null);
  const [editAlert, setEditAlert] = useState<PriceAlert | null>(null);

  const params = useMemo<ReportParams[]>(
    () => alerts.map((a) => ({ modelId: a.modelId, storageGb: a.storageGb, condition: a.condition })),
    [alerts],
  );
  const reports = useReports(params);

  const defaultTargetFor = (modelId: string): number => {
    const m = getModelMedians('used').find((x) => x.modelId === modelId);
    // Aim a little below the current pasaran as a sensible starting target.
    return m ? Math.round((m.medianIdr * 0.9) / 50_000) * 50_000 : 0;
  };

  const onSelectModel = (model: ModelSummary) => {
    pickerRef.current?.close();
    setAddModel(model);
  };

  const editorVisible = addModel != null || editAlert != null;
  const editorTitle = addModel?.name ?? editAlert?.modelName ?? '';
  const editorInitial = addModel ? defaultTargetFor(addModel.id) : (editAlert?.targetPriceIdr ?? 0);

  const onSaveTarget = (value: number) => {
    if (addModel) {
      add({ modelId: addModel.id, modelName: addModel.name, condition: 'used', targetPriceIdr: value });
    } else if (editAlert) {
      updateTarget(editAlert.id, value);
    }
    setAddModel(null);
    setEditAlert(null);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.header}>
        <ScreenHeader
          title="Alert Harga"
          eyebrow={`${alerts.length} alert`}
          onBack={() => router.back()}
          right={
            <Pressable
              onPress={() => {
                hapticLight();
                pickerRef.current?.expand();
              }}
              hitSlop={10}
              style={styles.addBtn}
              accessibilityLabel="Tambah alert"
            >
              <Icon name="plus" size={18} color="background" />
            </Pressable>
          }
        />
        <NeonDivider color={colors.cyan} maxOpacity={0.35} style={styles.rule} />
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="bell"
            title="Belum ada alert"
            subtitle="Pasang target harga buat model favoritmu. Kami kabari kalau ada listing di bawah target."
            actionLabel="Tambah alert"
            onAction={() => pickerRef.current?.expand()}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* TODO(PROMPT 2 / backend): this evaluates alerts locally against mock
              data; real alerts fire from a backend price watcher + push. */}
          {alerts.map((alert, i) => {
            const report = reports[i]?.data;
            const isLoading = reports[i]?.isLoading;
            const below = report ? countBelowTarget(report.listings, alert.targetPriceIdr) : 0;
            const triggered = alert.enabled && below > 0;
            return (
              <Card key={alert.id} glow={triggered ? 'lime' : undefined} corners={triggered}>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <AppText variant="heading" numberOfLines={1}>
                      {alert.modelName}
                    </AppText>
                    <AppText variant="caption" muted>
                      Target {formatIdr(alert.targetPriceIdr)} · {conditionLabel(alert.condition)}
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      toggle(alert.id);
                    }}
                    hitSlop={8}
                    style={styles.bellBtn}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: alert.enabled }}
                    accessibilityLabel={alert.enabled ? 'Matikan alert' : 'Nyalakan alert'}
                  >
                    <Icon name="bell" size={18} color={alert.enabled ? 'up' : 'textFaint'} />
                  </Pressable>
                </View>

                <View style={styles.status}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: triggered ? colors.upTint : colors.surfaceRaised },
                    ]}
                  >
                    <StatusDot
                      color={triggered ? colors.up : alert.enabled ? colors.cyan : colors.textFaint}
                      size={6}
                      glow={triggered}
                    />
                    <AppText
                      variant="label"
                      style={{ color: triggered ? colors.up : colors.textMuted }}
                    >
                      {isLoading
                        ? 'Mengecek...'
                        : !alert.enabled
                          ? 'Nonaktif'
                          : triggered
                            ? `${below} listing di bawah target`
                            : `Memantau · pasaran ${formatIdrCompact(report?.aggregate.median ?? 0)}`}
                    </AppText>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Button label="Ubah target" variant="ghost" fullWidth={false} haptics={false} onPress={() => setEditAlert(alert)} />
                  <Button
                    label="Lihat harga"
                    variant="secondary"
                    fullWidth={false}
                    haptics={false}
                    onPress={() =>
                      router.push({
                        pathname: '/report/[modelId]',
                        params: {
                          modelId: alert.modelId,
                          name: alert.modelName,
                          storageGb: alert.storageGb != null ? String(alert.storageGb) : '',
                          condition: alert.condition,
                        },
                      })
                    }
                  />
                  <Pressable
                    onPress={() => {
                      hapticMedium();
                      remove(alert.id);
                    }}
                    hitSlop={8}
                    style={styles.trashBtn}
                    accessibilityLabel="Hapus alert"
                  >
                    <Icon name="trash" size={16} color="textMuted" />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}

      <ModelPickerSheet ref={pickerRef} title="Pilih model buat alert" onSelect={onSelectModel} />

      <TargetPriceEditor
        visible={editorVisible}
        title={editorTitle}
        subtitle="Alert nyala kalau ada listing di bawah target"
        initialValue={editorInitial}
        onCancel={() => {
          setAddModel(null);
          setEditAlert(null);
        }}
        onSave={onSaveTarget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  rule: { marginTop: spacing.lg },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.up,
  },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  info: { flex: 1, gap: 2 },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  status: { marginTop: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginLeft: 'auto',
  },
});
