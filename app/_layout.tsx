import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Per-weight subpath imports so Metro bundles only the 6 fonts we use, instead
// of every weight in the family (the barrel import pulls them all).
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { colors, durations } from '@/theme';
import { queryClient } from '@/query/client';
import { useSettingsStore } from '@/store/settings';
import { WebFrame } from '@/components/web/WebFrame';

// Root layout: load fonts, gate on store hydration, then mount the providers and
// the navigation stack. Keeping the splash up until both fonts and persisted
// state are ready avoids a flash of the wrong screen (onboarding vs home).

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore: splash may already be hidden on fast refresh */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);

  const ready = (fontsLoaded || !!fontError) && hasHydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Web: eagerly load every registered font face (some weights are otherwise
  // fetched lazily on first use, causing a brief fallback-font flash on the
  // screen that first needs them). Native ignores this (no document.fonts).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !document.fonts) return;
    document.fonts.forEach((face) => {
      if (face.status === 'unloaded') face.load().catch(() => {});
    });
  }, [fontsLoaded]);

  // Paint the themed dark background while fonts + persisted state load, so web
  // never flashes a white screen or the wrong (fallback) font before the app is
  // ready. On native the splash screen is still up over this.
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <WebFrame>
            <Stack
              screenOptions={{
                headerShown: false,
                // Soft fade + small vertical slide, unhurried and consistent.
                // animationDuration tunes the iOS timing; Android uses its own
                // matched fade-from-bottom curve.
                animation: 'fade_from_bottom',
                animationDuration: durations.screen,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="report/[modelId]" />
              <Stack.Screen name="listing/[id]" />
              <Stack.Screen name="catalog" />
              <Stack.Screen name="compare" />
              <Stack.Screen name="budget" />
              <Stack.Screen name="alerts" />
            </Stack>
          </WebFrame>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
