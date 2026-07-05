import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts, spacing } from '@/theme';
import { formatIdr, groupDigits } from '@/lib/format';
import { Card } from './ui/Card';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';

// A shared modal for entering a target price. Digits only, formatted with
// thousands separators as the user types. Used both when saving a model to the
// watchlist (Price Report) and when editing an existing target (Watchlist).

type TargetPriceEditorProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialValue: number;
  onCancel: () => void;
  onSave: (value: number) => void;
};

export function TargetPriceEditor({
  visible,
  title,
  subtitle,
  initialValue,
  onCancel,
  onSave,
}: TargetPriceEditorProps) {
  const [raw, setRaw] = useState(String(Math.round(initialValue)));

  // Reset the field to the initial value each time the editor opens.
  useEffect(() => {
    if (visible) setRaw(String(Math.round(initialValue)));
  }, [visible, initialValue]);

  const value = raw.length > 0 ? Number(raw) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })}>
          {/* Inner press swallows taps so they do not dismiss the modal. */}
          <Pressable onPress={() => {}}>
            <Card style={styles.card}>
              <AppText variant="overline" muted>
                Target harga
              </AppText>
              <AppText variant="heading">{title}</AppText>
              {subtitle ? (
                <AppText variant="caption" muted>
                  {subtitle}
                </AppText>
              ) : null}

              <View style={styles.inputWrap}>
                <AppText variant="numberLg" muted>
                  Rp
                </AppText>
                <TextInput
                  value={value > 0 ? groupDigits(value) : ''}
                  onChangeText={(t) => setRaw(t.replace(/[^0-9]/g, '').slice(0, 12))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textFaint}
                  autoFocus
                  selectionColor={colors.up}
                  style={styles.input}
                  accessibilityLabel="Target harga dalam rupiah"
                />
              </View>
              <AppText variant="caption" faint>
                Alert nyala kalau ada listing di bawah {formatIdr(value)}.
              </AppText>

              <View style={styles.actions}>
                <Button label="Batal" variant="ghost" fullWidth={false} onPress={onCancel} haptics={false} />
                <Button
                  label="Simpan"
                  variant="primary"
                  style={styles.save}
                  disabled={value <= 0}
                  onPress={() => onSave(value)}
                />
              </View>
            </Card>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    gap: spacing.sm,
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
    fontSize: 28,
    letterSpacing: -0.25,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  save: {
    flex: 1,
  },
});
