import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, glow, radius, spacing } from '@/theme';
import { Icon } from './ui/Icon';

// The prominent search field. Controlled input with a leading radar/search icon
// and a trailing clear button. Submitting fires onSubmit (used to record the
// query into recent searches + light haptic).

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Cari HP...',
  autoFocus,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Icon name="search" size={20} color={focused ? 'accent' : 'textMuted'} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        selectionColor={colors.accent}
        style={styles.input}
        accessibilityLabel="Cari model HP"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Hapus pencarian"
        >
          <Icon name="x" size={18} color="textMuted" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 54,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  wrapFocused: {
    borderColor: colors.panelBorderActive,
    ...glow.cyan,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.displayMedium,
    fontSize: 17,
    letterSpacing: -0.1,
    padding: 0,
  },
});
