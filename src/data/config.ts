// ============================================================================
// DATA SOURCE CONFIG
// ----------------------------------------------------------------------------
// This is the SINGLE place to flip the app from bundled mock data to the live
// backend (PROMPT 2). Change DEFAULT_DATA_SOURCE from 'mock' to 'live' and set
// EXPO_PUBLIC_API_URL in your environment. The Settings screen can also toggle
// this at runtime, but this constant is the default the app boots with.
// ============================================================================

export type DataSource = 'mock' | 'live';

/** DEFAULT provider. Change to 'live' to use the ApiProvider backend. */
export const DEFAULT_DATA_SOURCE: DataSource = 'mock';

/** Base URL of the HargaRadar backend (PROMPT 2). Read from Expo public env. */
export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Simulated network latency (ms) for the mock provider, so skeletons show. */
export const MOCK_LATENCY_MS = 420;
