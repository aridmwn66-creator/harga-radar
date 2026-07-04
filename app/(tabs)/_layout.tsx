import { Platform, StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { colors, fonts } from '@/theme';
import { Icon, type IconName } from '@/components/ui/Icon';

// Bottom tab bar: a lifted, floating bar (top hairline + soft upward shadow).
// The active tab gets a cyan icon/label plus a small cyan indicator line with a
// faint glow. Custom SVG icons keep it off the default Material/iOS look.

function tabIcon(name: IconName) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <View style={styles.iconWrap}>
      <View style={[styles.indicator, focused ? styles.indicatorActive : null]} />
      <Icon name={name} color={color as string} size={size - 2} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, default: 66 }),
          paddingTop: 8,
          // Soft upward shadow so the bar reads as floating above the content.
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 12,
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
        name="tools"
        options={{ title: 'Alat', tabBarIcon: tabIcon('grid') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Setelan', tabBarIcon: tabIcon('sliders') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: Platform.select({ android: 4, default: 0 }),
  },
});
