import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { colors } from '@/theme';
import type { SheetHandle } from './ui/sheet';
import { FilterSheetContent, type FilterSheetContentProps } from './FilterSheetContent';

// Bottom-sheet filter panel (native). Contains every filter from the spec:
// kondisi, storage, lokasi, price range (min-max slider) and source. The panel
// body is shared with the web fallback (FilterSheet.web.tsx) via
// FilterSheetContent, so the two platforms stay identical.

export type FilterSheetProps = FilterSheetContentProps;

export const FilterSheet = forwardRef<SheetHandle, FilterSheetProps>(function FilterSheet(
  props,
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  useImperativeHandle(
    ref,
    () => ({
      expand: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
    }),
    [],
  );

  const snapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...backdropProps} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.6} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView>
        <FilterSheetContent {...props} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

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
});
