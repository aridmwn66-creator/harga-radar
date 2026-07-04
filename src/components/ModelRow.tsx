import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ModelSummary } from '@/types';
import { colors, elevation, radius, spacing } from '@/theme';
import { storageLabel } from '@/lib/format';
import { Thumbnail } from './Thumbnail';
import { AppText } from './ui/AppText';
import { Icon } from './ui/Icon';

// Model list item, reused for search results, the trending list and the catalog.
// It is a self-contained elevated card (blue-black fill, hairline border, soft
// shadow) that lifts to a brighter surface with a faint accent border on press.

type ModelRowProps = {
  model: ModelSummary;
  onPress: () => void;
  subtitle?: string;
  trailing?: ReactNode;
};

export function ModelRow({ model, onPress, subtitle, trailing }: ModelRowProps) {
  const storages = model.availableStorageGb.map(storageLabel).join(' / ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${model.name}, lihat harga pasaran`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Thumbnail brand={model.brand} size={46} />
      <View style={styles.middle}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {model.name}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {subtitle ?? `${model.brand} · ${storages}`}
        </AppText>
      </View>
      {trailing ?? <Icon name="chevron-right" size={20} color="textFaint" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...elevation.card,
  },
  pressed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.panelBorderActive,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
});
