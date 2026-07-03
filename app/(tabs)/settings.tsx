import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { API_BASE_URL, type DataSource } from '@/data/config';
import { useSettingsStore } from '@/store/settings';
import { useRecentSearchesStore } from '@/store/recentSearches';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function SettingsScreen() {
  const dataSource = useSettingsStore((s) => s.dataSource);
  const setDataSource = useSettingsStore((s) => s.setDataSource);
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding);
  const clearRecent = useRecentSearchesStore((s) => s.clear);

  const liveConfigured = API_BASE_URL.length > 0;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <ScreenHeader title="Setelan" eyebrow="Preferensi & data" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <AppText variant="overline" muted>
            Sumber data
          </AppText>
          <SegmentedToggle<DataSource>
            options={[
              { value: 'mock', label: 'Contoh' },
              { value: 'live', label: 'Live' },
            ]}
            value={dataSource}
            onChange={setDataSource}
          />
          <AppText variant="caption" muted>
            {dataSource === 'mock'
              ? 'Pakai data contoh yang sudah termuat. Cocok buat coba-coba tanpa backend.'
              : liveConfigured
                ? `Ambil harga live dari ${API_BASE_URL}.`
                : 'Mode live perlu EXPO_PUBLIC_API_URL. Set dulu URL backend-nya, lalu pilih Live.'}
          </AppText>
          {dataSource === 'live' && !liveConfigured ? (
            <View style={styles.warn}>
              <AppText variant="caption" color="down">
                EXPO_PUBLIC_API_URL belum di-set. Data live tidak akan termuat.
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <AppText variant="overline" muted>
            Tampilan
          </AppText>
          <SettingLine label="Tema" value="Gelap (bawaan)" />
          <AppText variant="caption" faint>
            HargaRadar didesain gelap, gaya terminal pasar. Tema terang menyusul.
          </AppText>
        </Card>

        <Card style={styles.card}>
          <AppText variant="overline" muted>
            Data lokal
          </AppText>
          <Button
            label="Hapus pencarian terakhir"
            variant="secondary"
            onPress={clearRecent}
            haptics={false}
          />
          <Button
            label="Lihat onboarding lagi"
            variant="ghost"
            onPress={resetOnboarding}
            haptics={false}
          />
        </Card>

        <Card style={styles.card}>
          <AppText variant="overline" muted>
            Tentang
          </AppText>
          <SettingLine label="Aplikasi" value="HargaRadar" />
          <SettingLine label="Versi" value={version} />
          <AppText variant="caption" faint style={styles.about}>
            Harga pasaran dihitung dari median listing lintas marketplace. Angka
            bersifat perkiraan, bukan patokan resmi. Sumber seperti Facebook
            Marketplace butuh scraping dan tidak aktif secara bawaan.
          </AppText>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <AppText variant="body" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warn: {
    paddingTop: spacing.xs,
  },
  about: {
    lineHeight: 18,
  },
});
