import { forwardRef, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { ModelSummary } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';
import { MODELS } from '@/data/fixtures/models';
import { AppText } from './ui/AppText';
import { ModelRow } from './ModelRow';
import { Icon } from './ui/Icon';

// A reusable bottom sheet for picking a model from the full catalog. Used by the
// Compare and Alerts screens. Parent owns the ref (present/dismiss) and handles
// selection.

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

type ModelPickerSheetProps = {
  title?: string;
  excludeIds?: string[];
  onSelect: (model: ModelSummary) => void;
};

export const ModelPickerSheet = forwardRef<BottomSheet, ModelPickerSheetProps>(
  function ModelPickerSheet({ title = 'Pilih model', excludeIds = [], onSelect }, ref) {
    const [query, setQuery] = useState('');
    const snapPoints = useMemo(() => ['85%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
      ),
      [],
    );

    const results = useMemo(() => {
      const q = normalize(query);
      return MODELS.filter((m) => {
        if (excludeIds.includes(m.id)) return false;
        if (!q) return true;
        return normalize(`${m.brand} ${m.name}`).includes(q);
      });
    }, [query, excludeIds]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.header}>
          <AppText variant="title">{title}</AppText>
          <View style={styles.search}>
            <Icon name="search" size={18} color="textMuted" />
            <BottomSheetTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari model..."
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        </View>
        <BottomSheetScrollView contentContainerStyle={styles.list}>
          {results.length === 0 ? (
            <AppText variant="body" muted center style={styles.empty}>
              Model tidak ditemukan
            </AppText>
          ) : (
            results.map((model, i) => (
              <View key={model.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <ModelRow model={model} onPress={() => onSelect(model)} />
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.hairline,
  },
  handle: {
    backgroundColor: colors.textFaint,
    width: 40,
  },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  empty: {
    paddingVertical: spacing.huge,
  },
});
