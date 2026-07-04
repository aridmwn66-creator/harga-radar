import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { colors, radius, spacing } from '@/theme';
import { hapticLight } from '@/lib/haptics';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { NeonDivider } from '@/components/ui/NeonDivider';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TechBackground } from '@/components/TechBackground';

// "Alat" tab: a hub for the extra tools so they have clear, discoverable
// navigation without crowding the tab bar.

type Tool = {
  icon: IconName;
  title: string;
  subtitle: string;
  href: Href;
  accent: 'lime' | 'cyan';
};

const TOOLS: Tool[] = [
  {
    icon: 'columns',
    title: 'Bandingkan HP',
    subtitle: 'Adu 2 model berdampingan',
    href: '/compare',
    accent: 'lime',
  },
  {
    icon: 'wallet',
    title: 'Rekomendasi Budget',
    subtitle: 'Cari HP sesuai bujet kamu',
    href: '/budget',
    accent: 'cyan',
  },
  {
    icon: 'bell',
    title: 'Alert Harga',
    subtitle: 'Pasang target, dikabari saat turun',
    href: '/alerts',
    accent: 'lime',
  },
  {
    icon: 'search',
    title: 'Semua Model',
    subtitle: 'Jelajah seluruh katalog',
    href: '/catalog',
    accent: 'cyan',
  },
];

export default function ToolsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <TechBackground />
      <View style={styles.header}>
        <ScreenHeader title="Alat" eyebrow="Fitur & tools" />
        <NeonDivider color={colors.cyan} maxOpacity={0.35} style={styles.rule} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.title}
            accessibilityRole="button"
            onPress={() => {
              hapticLight();
              router.push(tool.href);
            }}
          >
            <Card>
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: tool.accent === 'lime' ? colors.upTint : colors.cyanTint,
                      borderColor: tool.accent === 'lime' ? colors.up : colors.cyan,
                    },
                  ]}
                >
                  <Icon name={tool.icon} size={22} color={tool.accent === 'lime' ? 'up' : 'cyan'} />
                </View>
                <View style={styles.textWrap}>
                  <AppText variant="heading">{tool.title}</AppText>
                  <AppText variant="caption" muted>
                    {tool.subtitle}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={20} color="textFaint" />
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
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
  rule: {
    marginTop: spacing.lg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
});
