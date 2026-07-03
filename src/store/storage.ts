import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

// Shared persistence backend for all Zustand stores.
//
// NOTE: The original spec suggested MMKV. MMKV requires custom native code and
// does not run in Expo Go, which conflicts with the hard requirement that the
// app runs in Expo Go on first launch. AsyncStorage (allowed by the spec) is
// bundled in Expo Go and is used instead. Swapping to MMKV in a dev build is a
// one-file change here.
export const persistStorage = createJSONStorage(() => AsyncStorage);
