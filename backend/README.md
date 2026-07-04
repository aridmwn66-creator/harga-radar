# HargaRadar backend

A small price-aggregation service that scrapes Indonesian marketplaces for used
and new phone prices, normalizes the listings, and exposes them to the
HargaRadar app in exactly the shape the app expects. The app can then swap its
bundled mock data for real prices with a single config change.

- Node + TypeScript + Fastify
- Scraping with Playwright (self-hosted, free, no paid proxy)
- Zod for request validation
- Two-layer cache (in-memory + file) with a TTL of a few minutes

## Endpoints

- `GET /v1/search?q=iphone+11` -> `ModelSummary[]` (catalog lookup, instant, no scraping)
- `GET /v1/prices?modelId=iphone-11&storageGb=128&condition=used&location=jakarta`
  -> `PriceReport` = `{ modelId, modelName, aggregate { median, mean, p25, p75, min, max, count, bySource[] }, listings[] }`
- `GET /health` -> service status + which sources are enabled
- `GET /` -> basic info

The `PriceReport` / `Listing` / `ModelSummary` shapes match the app's types
exactly, so nothing on the app side needs to change.

## Install and run

```bash
cd backend
npm install
npx playwright install chromium   # downloads the browser Playwright drives

cp .env.example .env               # optional: tweak config
npm start                          # or: npm run dev  (watch mode)
```

The server listens on `http://0.0.0.0:8080` by default. Quick test:

```bash
curl "http://localhost:8080/v1/search?q=iphone+11"
curl "http://localhost:8080/v1/prices?modelId=iphone-11&condition=used"
```

Useful scripts:

- `npm run typecheck` - `tsc --noEmit` (strict).
- `npm run test:normalize` - offline unit test of parsing + normalization + aggregation.
- `npm run test:scrape` - integration test: runs the real scraper against local
  fake HTML and checks the pipeline end to end (no network needed).
- `npm run fb-login` - one-time manual Facebook login (see below).

## Sources (pluggable, easy on/off)

Every source implements the same interface and is fully isolated. If one fails,
is blocked, or times out, it is logged and returns nothing while the others keep
working. A `/v1/prices` request never 500s; it returns a valid (possibly empty
or partial) report.

| Source     | Default | Tier         | Notes |
|------------|---------|--------------|-------|
| OLX        | on      | reliable     | Primary source for used phones. |
| Carousell  | on      | reliable     | Secondary source for used phones. |
| Facebook   | off     | experimental | Fragile, needs manual login, breaks ToS. See warnings. |
| Tokopedia  | off     | experimental | Heavy JS + anti-bot. Mostly NEW units (harga baru baseline). |
| Shopee     | off     | experimental | Aggressive anti-bot. Mostly NEW units (harga baru baseline). |

Turn sources on/off in `.env` (then restart):

```
SOURCE_OLX=on
SOURCE_CAROUSELL=on
SOURCE_FACEBOOK=off
SOURCE_TOKOPEDIA=off
SOURCE_SHOPEE=off
```

Default: only the reliable used-phone sources (OLX + Carousell) are on. Turn on
the experimental ones manually when you are ready.

Note on the scrapers: each source targets best-effort CSS selectors first, then
falls back to a price-anchored heuristic (find the price text, walk up to the
card, extract title/link/image). If a marketplace changes its markup, a source
degrades to fewer/no results rather than crashing. You may need to update the
selectors in `src/sources/*.ts` over time.

## Normalization + aggregation

- Model names are normalized to a `modelId` (e.g. "iphone 11", "ip 11",
  "iPhone11" all map to `iphone-11`); the most specific model wins
  ("iPhone 16 Pro Max" beats "iPhone 16"). Storage is extracted from the title
  ("128gb" -> 128, "1tb" -> 1024). Condition is inferred from keywords
  (bekas/second -> used, bnib/segel -> new), with a per-source default.
- Junk is dropped: accessories/cases/parts, "cari"/"dicari"/wanted-to-buy posts,
  wrong model, wrong storage/condition, and extreme price outliers (a median
  band that always runs, plus an IQR fence when there are enough points).
- Used vs new are separated by the `condition` query param, so OLX/Carousell/FB
  (mostly used) and Tokopedia/Shopee (mostly new) aggregate correctly.
- Aggregates: median (harga pasaran), mean, p25, p75, min, max, count, and a
  per-source median (`bySource`).

## Facebook Marketplace (read before enabling)

Facebook has no public API. Scraping it requires a logged-in headless browser
and anti-bot handling. Warnings:

- It VIOLATES Facebook's Terms of Service.
- Use a THROWAWAY / backup account, NEVER your main account. The account can be
  rate-limited, checkpointed, or banned.
- It is fragile and can hit checkpoints/captchas at any time.

The Facebook source uses a persistent browser profile so a manual login is
reused. To log in once:

```bash
npm run fb-login
```

This opens a VISIBLE browser. Log in with your throwaway account, then return to
the terminal and press Enter to save the session (stored in `.fb-userdata`).
After that, set `SOURCE_FACEBOOK=on` (and optionally `FB_LOCATION=jakarta`) and
restart the server. Facebook scraping is rate-limited hard on purpose:
concurrency 1 (a mutex), long randomized delays, and a small per-run cap.

## Configuration

All configuration is via `.env` (see `.env.example`): port/host, log level,
inbound rate limit, cache TTL + directory, source toggles, per-source listing
cap, headless mode, navigation timeout, an optional Chromium path, and the
Facebook profile dir + location.

## Operational notes

- Inbound requests are rate limited (`@fastify/rate-limit`, default 60/min/IP).
- Scraping uses polite randomized delays and low concurrency, and results are
  cached aggressively (default 5 minutes, in memory + on disk) because scraping
  is slow and risky.
- Keep request volume low and cache heavily; respect each marketplace's terms
  and robots policy. This project is fine as a personal experiment; running it
  as a public product is legally and operationally risky, especially Facebook.

## Connect the app to this backend

1. Find your computer's LAN IP (the phone must be on the SAME Wi-Fi):
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`
   - Windows: `ipconfig` (look for IPv4 Address)
   Say it is `192.168.1.20`. The backend is at `http://192.168.1.20:8080`.

2. Start the backend bound to all interfaces (the default `HOST=0.0.0.0`):
   ```bash
   npm start
   ```

3. Start the Expo app pointing at the backend, from the repo root:
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.20:8080 npx expo start
   ```

4. In the app, open Setelan and switch "Sumber data" to `Live`. (Or set
   `DEFAULT_DATA_SOURCE = 'live'` in the app's `src/data/config.ts`.) The app
   will now call `GET /v1/search` and `GET /v1/prices` on your backend.

Tips:
- `localhost` on the phone points at the phone, not your laptop. Use the LAN IP.
- Make sure your firewall allows inbound connections on the port (8080).
- If the phone cannot reach the laptop, a tunnel like `ngrok http 8080` and
  using the tunnel URL as `EXPO_PUBLIC_API_URL` also works.

No em dashes are used in this codebase; hyphens only.
