import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors, durations, easing, radius, reduceMotion, spacing } from '@/theme';
import { hapticLight } from '@/lib/haptics';
import { useSettingsStore } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

// Single, skippable onboarding screen. One line explaining the app + "Mulai".

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const start = () => {
    hapticLight();
    completeOnboarding();
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={start} hitSlop={10} accessibilityRole="button">
          <AppText variant="label" muted>
            Lewati
          </AppText>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Animated.View
          entering={FadeIn.duration(durations.screen).easing(easing.out).reduceMotion(reduceMotion)}
          style={styles.badge}
        >
          <Icon name="radar" size={40} color="up" />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140)
            .duration(durations.screen)
            .easing(easing.out)
            .reduceMotion(reduceMotion)}
          style={styles.copy}
        >
          <AppText variant="overline" color="up">
            Harga Pasaran HP
          </AppText>
          <AppText variant="hero" style={styles.title}>
            HargaRadar
          </AppText>
          <AppText variant="body" muted style={styles.tagline}>
            Bandingkan harga HP bekas dan baru dari banyak marketplace, lalu lihat
            harga pasarannya dalam satu layar. Tanpa buka aplikasi satu per satu.
          </AppText>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(280)
          .duration(durations.screen)
          .easing(easing.out)
          .reduceMotion(reduceMotion)}
        style={styles.footer}
      >
        <Button label="Mulai" onPress={start} />
        <AppText variant="caption" faint center style={styles.disclaimer}>
          Data contoh sudah termuat. Sambungkan backend kapan saja untuk harga live.
        </AppText>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  copy: {
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.xs,
  },
  tagline: {
    maxWidth: 320,
    lineHeight: 23,
  },
  footer: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  disclaimer: {
    maxWidth: 320,
    alignSelf: 'center',
  },
});
