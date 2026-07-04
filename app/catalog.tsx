import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ModelSummary } from '@/types';
import { colors, spacing } from '@/theme';
import { hapticLight } from '@/lib/haptics';
import { MODELS } from '@/data/fixtures/models';
import { Chip } from '@/components/ui/Chip';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ModelRow } from '@/components/ModelRow';
import { TechBackground } from '@/components/TechBackground';

// Full catalog of every model, with a simple per-brand filter.

const BRANDS = Array.from(new Set(MODELS.map((m) => m.brand)));

export default function CatalogScreen() {
  const router = useRouter();
  const [brand, setBrand] = useState<string | null>(null);

  const models = useMemo(
    () => (brand ? MODELS.filter((m) => m.brand === brand) : MODELS),
    [brand],
  );

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label="Semua" selected={brand == null} onPress={() => setBrand(null)} />
        {BRANDS.map((b) => (
          <Chip key={b} label={b} selected={brand === b} onPress={() => setBrand(b)} />
        ))}
      </ScrollView>
      <NeonDivider color={colors.cyan} maxOpacity={0.3} style={styles.rule} />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.head}>
        <ScreenHeader
          title="Semua Model"
          eyebrow={`${models.length} dari ${MODELS.length} model`}
          onBack={() => router.back()}
        />
      </View>
      <FlatList
        data={models}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ModelRow model={item} onPress={() => openReport(item)} />}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Divider}
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  rule: {
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
});
