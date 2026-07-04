import { forwardRef, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import type { Condition, SourceId } from '@/types';
import { colors, spacing } from '@/theme';
import { formatIdrCompact, storageLabel } from '@/lib/format';
import { sourceLabel } from '@/lib/sources';
import type { ReportFilters } from '@/features/report/filters';
import { AppText } from './ui/AppText';
import { Chip } from './ui/Chip';
import { Button } from './ui/Button';
import { SegmentedToggle } from './ui/SegmentedToggle';
import { RangeSlider } from './ui/RangeSlider';

// Bottom-sheet filter panel. Contains every filter from the spec:
// kondisi, storage, lokasi, price range (min-max slider) and source.
// Storage / condition / location re-fetch the report; source + price range
// refine the visible list and the recomputed aggregate.

type FilterSheetProps = {
  storageOptions: number[];
  storageGb?: number;
  onStorageChange: (gb: number | undefined) => void;
  condition: Condition;
  onConditionChange: (c: Condition) => void;
  location: string | null;
  onLocationChange: (loc: string | null) => void;
  locations: string[];
  filters: ReportFilters;
  onFiltersChange: (f: ReportFilters) => void;
  sources: SourceId[];
  /** Price domain for the range slider (full min/max of the current report). */
  priceDomainMin: number;
  priceDomainMax: number;
  onReset: () => void;
  onClose: () => void;
};

export const FilterSheet = forwardRef<BottomSheet, FilterSheetProps>(function FilterSheet(
  {
    storageOptions,
    storageGb,
    onStorageChange,
    condition,
    onConditionChange,
    location,
    onLocationChange,
    locations,
    filters,
    onFiltersChange,
    sources,
    priceDomainMin,
    priceDomainMax,
    onReset,
    onClose,
  },
  ref,
) {
  const snapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
    ),
    [],
  );

  const low = filters.priceMin ?? priceDomainMin;
  const high = filters.priceMax ?? priceDomainMax;

  const onPriceChange = (nextLow: number, nextHigh: number) => {
    onFiltersChange({
      ...filters,
      priceMin: nextLow <= priceDomainMin ? null : nextLow,
      priceMax: nextHigh >= priceDomainMax ? null : nextHigh,
    });
  };

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
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">Filter</AppText>

        <Section title="Kondisi">
          <SegmentedToggle<Condition>
            options={[
              { value: 'used', label: 'Bekas' },
              { value: 'new', label: 'Baru' },
            ]}
            value={condition}
            onChange={onConditionChange}
          />
        </Section>

        <Section title="Storage">
          <View style={styles.chipRow}>
            <Chip
              label="Semua"
              selected={storageGb == null}
              onPress={() => onStorageChange(undefined)}
            />
            {storageOptions.map((gb) => (
              <Chip
                key={gb}
                label={storageLabel(gb)}
                selected={storageGb === gb}
                onPress={() => onStorageChange(gb)}
              />
            ))}
          </View>
        </Section>

        <Section title="Rentang harga">
          <View style={styles.priceHead}>
            <AppText variant="number" color="up">
              {formatIdrCompact(low)}
            </AppText>
            <AppText variant="number" color="up">
              {formatIdrCompact(high)}
            </AppText>
          </View>
          {priceDomainMax > priceDomainMin ? (
            <RangeSlider
              min={priceDomainMin}
              max={priceDomainMax}
              low={low}
              high={high}
              onChange={onPriceChange}
            />
          ) : null}
        </Section>

        <Section title="Lokasi">
          <View style={styles.chipRow}>
            <Chip
              label="Semua lokasi"
              selected={location == null}
              onPress={() => onLocationChange(null)}
            />
            {locations.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                selected={location === loc}
                onPress={() => onLocationChange(loc)}
              />
            ))}
          </View>
        </Section>

        <Section title="Marketplace">
          <View style={styles.chipRow}>
            <Chip
              label="Semua"
              selected={filters.source == null}
              onPress={() => onFiltersChange({ ...filters, source: null })}
            />
            {sources.map((s) => (
              <Chip
                key={s}
                label={sourceLabel(s)}
                selected={filters.source === s}
                onPress={() => onFiltersChange({ ...filters, source: s })}
              />
            ))}
          </View>
        </Section>

        <View style={styles.footer}>
          <Button label="Reset" variant="ghost" fullWidth={false} onPress={onReset} haptics={false} />
          <Button label="Terapkan" variant="primary" onPress={onClose} style={styles.apply} />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" muted>
        {title}
      </AppText>
      {children}
    </View>
  );
}

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
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priceHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  apply: {
    flex: 1,
  },
});
