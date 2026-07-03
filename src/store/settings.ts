import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DATA_SOURCE, type DataSource } from '@/data/config';
import { persistStorage } from './storage';

// App-level settings + first-run flags. Persisted so the data-source choice and
// onboarding state survive restarts.

type SettingsState = {
  dataSource: DataSource;
  hasSeenOnboarding: boolean;
  /** True once the persisted state has been loaded from disk. */
  hasHydrated: boolean;
  setDataSource: (source: DataSource) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataSource: DEFAULT_DATA_SOURCE,
      hasSeenOnboarding: false,
      hasHydrated: false,
      setDataSource: (dataSource) => set({ dataSource }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'hargaradar.settings',
      storage: persistStorage,
      partialize: (state) => ({
        dataSource: state.dataSource,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      // Flip the hydration flag no matter what: on success `state` is set, and
      // even if reading storage threw we still release the splash gate via the
      // store setter so the app can never get stuck on the splash screen.
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hasHydrated: true });
      },
    },
  ),
);
