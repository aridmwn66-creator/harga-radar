import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ModelSummary, PriceReport } from '@/types';
import { colors, radius, spacing, textGlow, textStyles } from '@/theme';
import { formatIdr, formatIdrCompact } from '@/lib/format';
import { useReports } from '@/query/hooks';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Thumbnail } from '@/components/Thumbnail';
import { ModelPickerSheet } from '@/components/ModelPickerSheet';
import type { SheetHandle } from '@/components/ui/sheet';
import { TechBackground } from '@/components/TechBackground';

// Compare two models side by side: harga pasaran, price range, listing count,
// and the price gap between them.

export default function CompareScreen() {
  const router = useRouter();
  const pickerRef = useRef<SheetHandle>(null);
  const [slot, setSlot] = useState<'a' | 'b'>('a');
  const [modelA, setModelA] = useState<ModelSummary | null>(null);
  const [modelB, setModelB] = useState<ModelSummary | null>(null);

  const reports = useReports([
    { modelId: modelA?.id ?? '', condition: 'used' },
    { modelId: modelB?.id ?? '', condition: 'used' },
  ]);
  const reportA = reports[0]?.data;
  const reportB = reports[1]?.data;

  const openPicker = (which: 'a' | 'b') => {
    setSlot(which);
    pickerRef.current?.expand();
  };

  const onSelect = (model: ModelSummary) => {
    if (slot === 'a') setModelA(model);
    else setModelB(model);
    pickerRef.current?.close();
  };

  const medianA = reportA?.aggregate.median ?? 0;
  const medianB = reportB?.aggregate.median ?? 0;
  const bothReady = medianA > 0 && medianB > 0;
  const diff = Math.abs(medianA - medianB);
  const cheaper = medianA <= medianB ? modelA : modelB;

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.header}>
        <ScreenHeader title="Bandingkan" eyebrow="Adu 2 HP" onBack={() => router.back()} />
        <NeonDivider color={colors.cyan} maxOpacity={0.35} style={styles.rule} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.columns}>
          <PhoneColumn
            model={modelA}
            report={reportA}
            isLoading={!!modelA && reports[0]?.isLoading}
            onPick={() => openPicker('a')}
          />
          <PhoneColumn
            model={modelB}
            report={reportB}
            isLoading={!!modelB && reports[1]?.isLoading}
            onPick={() => openPicker('b')}
          />
        </View>

        {bothReady ? (
          <Card glow="lime" corners>
            <AppText variant="overline" muted>
              Selisih harga pasaran
            </AppText>
            <AppText style={[textStyles.hero, styles.diff, textGlow.lime]}>{formatIdr(diff)}</AppText>
            <AppText variant="body" muted>
              {cheaper?.name} lebih murah{' '}
              {medianA === medianB ? '(harga sama)' : `sekitar ${formatIdrCompact(diff)}`}.
            </AppText>
          </Card>
        ) : (
          <Card>
            <AppText variant="body" muted center style={styles.hint}>
              Pilih dua model untuk lihat perbandingan harga pasarannya.
            </AppText>
          </Card>
        )}
      </ScrollView>

      <ModelPickerSheet
        ref={pickerRef}
        title="Pilih model"
        excludeIds={[modelA?.id, modelB?.id].filter((x): x is string => !!x)}
        onSelect={onSelect}
      />
    </SafeAreaView>
  );
}

function PhoneColumn({
  model,
  report,
  isLoading,
  onPick,
}: {
  model: ModelSummary | null;
  report?: PriceReport;
  isLoading?: boolean;
  onPick: () => void;
}) {
  return (
    <View style={styles.column}>
      <Card style={styles.columnCard}>
        {model ? (
          <>
            <Pressable onPress={onPick} style={styles.columnHead} accessibilityRole="button">
              <Thumbnail brand={model.brand} size={44} />
              <View style={styles.columnTitle}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {model.name}
                </AppText>
                <AppText variant="caption" muted>
                  {model.brand}
                </AppText>
              </View>
            </Pressable>

            <View style={styles.stat}>
              <AppText variant="overline" muted>
                Harga Pasaran
              </AppText>
              {isLoading || !report ? (
                <Skeleton width={120} height={22} style={{ marginTop: 4 }} />
              ) : (
                <AppText style={[textStyles.numberLg, styles.statValue]}>
                  {formatIdr(report.aggregate.median)}
                </AppText>
              )}
            </View>

            <StatLine label="Rentang" value={report ? `${formatIdrCompact(report.aggregate.min)} - ${formatIdrCompact(report.aggregate.max)}` : '-'} loading={isLoading || !report} />
            <StatLine label="Listing" value={report ? `${report.aggregate.count}` : '-'} loading={isLoading || !report} />
            <Pressable onPress={onPick} hitSlop={6} style={styles.changeBtn} accessibilityRole="button">
              <Icon name="refresh" size={13} color="textMuted" />
              <AppText variant="caption" muted>
                Ganti
              </AppText>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={onPick} style={styles.empty} accessibilityRole="button" accessibilityLabel="Pilih model">
            <View style={styles.plus}>
              <Icon name="plus" size={22} color="cyan" />
            </View>
            <AppText variant="label" muted>
              Pilih model
            </AppText>
          </Pressable>
        )}
      </Card>
    </View>
  );
}

function StatLine({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <View style={styles.statLine}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      {loading ? (
        <Skeleton width={60} height={12} />
      ) : (
        <AppText variant="label">{value}</AppText>
      )}
    </View>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: { flex: 1 },
  columnCard: { gap: spacing.md, minHeight: 240 },
  columnHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  columnTitle: { flex: 1, gap: 1 },
  stat: { gap: 2 },
  statValue: { fontSize: 22, lineHeight: 26, ...textGlow.limeSoft },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 'auto',
  },
  empty: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  plus: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyanTint,
    borderWidth: 1,
    borderColor: colors.cyan,
  },
  diff: {
    ...textStyles.hero,
    fontSize: 40,
    lineHeight: 44,
    marginVertical: spacing.xs,
  },
  hint: { paddingVertical: spacing.lg },
});
