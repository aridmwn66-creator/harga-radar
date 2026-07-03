import { Platform, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, fonts } from '@/theme';
import { Icon, type IconName } from '@/components/ui/Icon';

// Bottom tab bar, dark and understated. Custom SVG icons keep the app off the
// default Material/iOS look.

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon name={name} color={color as string} size={size - 2} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.up,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: Platform.select({ ios: 86, default: 64 }),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 0.2,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Beranda', tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{ title: 'Watchlist', tabBarIcon: tabIcon('bookmark') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Setelan', tabBarIcon: tabIcon('sliders') }}
      />
    </Tabs>
  );
}
