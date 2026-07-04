import { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import type { SheetHandle } from './ui/sheet';
import { FilterSheetContent, type FilterSheetContentProps } from './FilterSheetContent';

// Web fallback for the filter panel. @gorhom/bottom-sheet relies on
// gesture-handler drag that is janky in the browser, so on web the same filter
// body (FilterSheetContent) is shown in a plain modal overlay. Same props, same
// imperative handle (expand/close), so the screens do not change.

export type FilterSheetProps = FilterSheetContentProps;

export const FilterSheet = forwardRef<SheetHandle, FilterSheetProps>(function FilterSheet(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false);
  useImperativeHandle(
    ref,
    () => ({
      expand: () => setVisible(true),
      close: () => setVisible(false),
    }),
    [],
  );

  const close = () => setVisible(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Tutup filter" />
        <View style={styles.panel}>
          <View style={styles.handle} />
          <ScrollView>
            <FilterSheetContent {...props} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.hairline,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
    marginBottom: 8,
  },
});
