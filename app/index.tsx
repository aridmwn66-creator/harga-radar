import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settings';

// Entry gate. The root layout has already waited for store hydration, so this
// read is accurate: send first-run users to onboarding, everyone else home.
export default function Index() {
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  return <Redirect href={hasSeenOnboarding ? '/home' : '/onboarding'} />;
}
