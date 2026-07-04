import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ModelSummary } from '@/types';
import { colors, fonts, spacing, textGlow } from '@/theme';
import { formatIdr, groupDigits } from '@/lib/format';
import { hapticLight } from '@/lib/haptics';
import { getModelMedians } from '@/lib/medians';
import { getModel } from '@/data/fixtures/models';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ModelRow } from '@/components/ModelRow';
import { EmptyState } from '@/components/EmptyState';
import { TechBackground } from '@/components/TechBackground';

// Budget calculator: enter a budget, get the models whose used "harga pasaran"
// fits, ranked most-value-first (the priciest phone still within budget).

type Match = { model: ModelSummary; medianIdr: number; underPct: number };

export default function BudgetScreen() {
  const router = useRouter();
  const [raw, setRaw] = useState('5000000');
  const budget = raw.length > 0 ? Number(raw) : 0;

  const matches = useMemo<Match[]>(() => {
    if (budget <= 0) return [];
    return getModelMedians('used')
      .filter((m) => m.medianIdr <= budget)
      .map((m) => {
        const model = getModel(m.modelId);
        return model
          ? { model, medianIdr: m.medianIdr, underPct: Math.round(((budget - m.medianIdr) / budget) * 100) }
          : null;
      })
      .filter((x): x is Match => x != null)
      // Most value first: the most expensive phone still within budget.
      .sort((a, b) => b.medianIdr - a.medianIdr);
  }, [budget]);

  const openReport = (model: ModelSummary) => {
    hapticLight();
    const storageGb = model.availableStorageGb[0];
    router.push({
      pathname: '/report/[modelId]',
      params: {
        modelId: model.id,
        name: model.name,
        storageGb: storageGb != null ? String(storageGb) : '',
        condition: 'used',
      },
    });
  };

  const header = (
    <View style={styles.headerContent}>
      <Card>
        <AppText variant="overline" muted>
          Budget kamu
        </AppText>
        <View style={styles.inputWrap}>
          <AppText variant="numberLg" muted>
            Rp
          </AppText>
          <TextInput
            value={budget > 0 ? groupDigits(budget) : ''}
            onChangeText={(t) => setRaw(t.replace(/[^0-9]/g, '').slice(0, 12))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.up}
            style={styles.input}
            accessibilityLabel="Budget dalam rupiah"
          />
        </View>
        <AppText variant="caption" faint>
          {budget > 0
            ? `${matches.length} model dengan harga pasaran di bawah ${formatIdr(budget)}.`
            : 'Masukkan budget buat lihat rekomendasi.'}
        </AppText>
      </Card>
      {matches.length > 0 ? (
        <View style={styles.listHead}>
          <AppText variant="overline" muted>
            Paling worth it
          </AppText>
          <NeonDivider color={colors.cyan} maxOpacity={0.3} style={styles.rule} />
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.head}>
        <ScreenHeader title="Rekomendasi Budget" eyebrow="Cari yang pas" onBack={() => router.back()} />
      </View>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.model.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ModelRow
            model={item.model}
            subtitle={`${item.model.brand} · ${item.underPct}% di bawah budget`}
            onPress={() => openReport(item.model)}
            trailing={
              <AppText style={styles.price}>{formatIdr(item.medianIdr)}</AppText>
            }
          />
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          budget > 0 ? (
            <EmptyState
              icon="wallet"
              title="Belum ada yang cocok"
              subtitle="Coba naikkan budget sedikit buat lihat pilihan."
            />
          ) : null
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  head: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  headerContent: {
    gap: spacing.xl,
    paddingBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    paddingBottom: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.displayBold,
    fontSize: 30,
    letterSpacing: -0.5,
    padding: 0,
    ...textGlow.limeSoft,
  },
  listHead: {
    gap: spacing.sm,
  },
  rule: { marginTop: spacing.xs },
  price: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.up,
    ...textGlow.limeSoft,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
});
