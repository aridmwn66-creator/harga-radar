# HargaRadar

A markets-terminal style mobile app that aggregates used and new phone listings
from Indonesian marketplaces and shows the fair market price ("harga pasaran")
for any model, variant and condition, so you never have to browse each
marketplace by hand.

Every phone is treated like a tradeable asset:

- The median listing price is the harga pasaran (fair value).
- Listings below the median are "di bawah pasaran" (a deal, acid lime).
- Listings above the median are "di atas pasaran" (over market, red).

The app runs in Expo Go on first launch using bundled mock data. No backend
required to see the full design and every flow.

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a
simulator. Everything works offline against the bundled fixtures.

Handy scripts:

- `npm run typecheck` - `tsc --noEmit`, strict, no `any`.
- `npx expo export --platform ios` - produce a production JS bundle (used here
  as a headless smoke test that the whole app bundles and transforms).

## Switching from mock data to a live backend

This is a single config change. Open `src/data/config.ts` and set:

```ts
export const DEFAULT_DATA_SOURCE: DataSource = 'live';
```

then provide the backend URL (PROMPT 2) via an environment variable:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.example.com npx expo start
```

You can also flip the source at runtime from the in-app Settings screen. The
`ApiProvider` calls `GET /v1/search` and `GET /v1/prices` and expects exactly the
`PriceReport` shape the app already uses, so nothing else changes.

## Architecture

Feature-based, strongly typed, no `any`.

```
app/                         Expo Router routes (file-based)
  _layout.tsx                fonts + providers (Query, Gesture, SafeArea) + splash gate
  index.tsx                  entry gate -> onboarding or home
  onboarding.tsx             single skippable intro
  (tabs)/                    Beranda / Watchlist / Setelan tab bar
    home.tsx                 search, recent, trending, watchlist snapshot
    watchlist.tsx            saved models + target-price editor
    settings.tsx             data source toggle, about
  report/[modelId].tsx       the hero Price Report screen
src/
  types/                     domain + PriceProvider interface
  theme/                     color, typography, spacing tokens (the design system)
  lib/                       stats (median/IQR/deal), formatting, haptics, sources
  data/                      PriceProvider: MockProvider (default) + ApiProvider
    fixtures/                generated, realistic IDR mock data (611 listings)
  store/                     Zustand + AsyncStorage (watchlist, recent, settings)
  query/                     TanStack Query client + hooks
  components/                UI primitives, MarketBand, OdometerNumber, cards, sheets
  features/report/           report-specific client filters
```

### Data layer

`PriceProvider` is the single seam between UI and data:

```ts
interface PriceProvider {
  search(query: string): Promise<ModelSummary[]>;
  getReport(params: ReportParams): Promise<PriceReport>;
}
```

- `MockProvider` (default): reads bundled fixtures, applies the same IQR outlier
  removal and median/percentile aggregation the backend would, and simulates a
  little latency so loading skeletons are visible.
- `ApiProvider`: thin fetch + validate layer over the backend.

Every data screen handles loading (skeletons), empty and error states, and
pull-to-refresh. A failing source never crashes a screen.

### Signature visualization: the market band

Custom-drawn distribution (not a stock chart): a min-to-max axis, a shaded
p25-p75 zone, every listing as a dot (lime below median, red above), a labeled
"Pasaran" median line, and a dashed target marker when the model is on your
watchlist. It reveals left-to-right on load. See `src/components/MarketBand.tsx`.

## Deliberate deviations from the original spec

Two libraries in the brief require custom native code and are NOT bundled in
Expo Go, which directly conflicts with the hard requirement "MUST run in Expo Go
on first launch". Both were swapped for Expo-Go-compatible equivalents, each
isolated so it can be swapped back in a development build:

- `@shopify/react-native-skia` -> `react-native-svg` + Reanimated for the market
  band. The intent (custom-drawn, animated, not a default chart) is preserved.
  Isolated in `MarketBand.tsx`.
- `react-native-mmkv` -> `@react-native-async-storage/async-storage` for
  persistence (explicitly allowed by the brief). Isolated in
  `src/store/storage.ts`.

Everything else follows the spec: Expo Router, Zustand, TanStack Query,
Reanimated, expo-haptics, Space Grotesk + Inter, and the exact color tokens.

## Notes

- Listing thumbnails are brand-tinted placeholder tiles rather than remote
  images, so the app is fully offline in Expo Go with no broken images. Listing
  links open the relevant marketplace search for that model.
- Harga pasaran is an estimate from median listing prices, not an official
  figure. Sources like Facebook Marketplace require scraping (see PROMPT 2) and
  are intentionally out of scope for this mock-data app.
- Regenerate the mock fixtures with the deterministic generator if you want to
  tweak the dataset: it lives in the project scratchpad and writes to
  `src/data/fixtures/`.
