// Deterministic fixture generator for HargaRadar mock data.
// Run: node scripts/generate-fixtures.mjs
//   (emits models.ts + listings.ts into src/data/fixtures)
// Uses a seeded RNG and a fixed reference date so output is 100% reproducible.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'fixtures');

// ---- seeded RNG (mulberry32) -------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260703);
const rnd = () => rand();
const between = (lo, hi) => lo + (hi - lo) * rnd();
const intBetween = (lo, hi) => Math.floor(between(lo, hi + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function weightedPick(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [val, w] of pairs) {
    r -= w;
    if (r <= 0) return val;
  }
  return pairs[pairs.length - 1][0];
}

// Fixed "now" so relative timestamps are stable: 2026-07-03T09:00:00Z.
const REFERENCE_MS = Date.UTC(2026, 6, 3, 9, 0, 0);

// ---- catalog -----------------------------------------------------------------
// usedBase / newBase are median used/new prices (IDR) per storage variant.
const CATALOG = [
  { id: 'iphone-11', brand: 'Apple', name: 'iPhone 11', pop: 10,
    variants: { 64: [3_200_000, 5_100_000], 128: [3_850_000, 5_700_000], 256: [4_450_000, 6_400_000] } },
  { id: 'iphone-12', brand: 'Apple', name: 'iPhone 12', pop: 8,
    variants: { 64: [4_600_000, 6_500_000], 128: [5_300_000, 7_200_000], 256: [6_100_000, 8_100_000] } },
  { id: 'iphone-13', brand: 'Apple', name: 'iPhone 13', pop: 10,
    variants: { 128: [7_300_000, 9_600_000], 256: [8_200_000, 10_600_000], 512: [9_600_000, 12_400_000] } },
  { id: 'iphone-14', brand: 'Apple', name: 'iPhone 14', pop: 9,
    variants: { 128: [9_400_000, 12_200_000], 256: [10_500_000, 13_400_000], 512: [12_200_000, 15_500_000] } },
  { id: 'iphone-15', brand: 'Apple', name: 'iPhone 15', pop: 8,
    variants: { 128: [12_500_000, 15_400_000], 256: [13_800_000, 16_900_000], 512: [15_900_000, 19_200_000] } },
  { id: 'samsung-galaxy-s23', brand: 'Samsung', name: 'Galaxy S23', pop: 8,
    variants: { 128: [7_200_000, 9_800_000], 256: [8_000_000, 10_700_000], 512: [9_300_000, 12_100_000] } },
  { id: 'samsung-galaxy-a54', brand: 'Samsung', name: 'Galaxy A54 5G', pop: 7,
    variants: { 128: [3_600_000, 5_200_000], 256: [4_200_000, 5_900_000] } },
  { id: 'samsung-galaxy-a35', brand: 'Samsung', name: 'Galaxy A35 5G', pop: 6,
    variants: { 128: [3_100_000, 4_500_000], 256: [3_600_000, 5_000_000] } },
  { id: 'xiaomi-redmi-note-13', brand: 'Xiaomi', name: 'Redmi Note 13', pop: 6,
    variants: { 128: [1_900_000, 2_800_000], 256: [2_300_000, 3_200_000] } },
  { id: 'poco-x6-pro', brand: 'POCO', name: 'POCO X6 Pro', pop: 5,
    variants: { 256: [3_600_000, 4_700_000], 512: [4_300_000, 5_400_000] } },
  { id: 'google-pixel-7', brand: 'Google', name: 'Pixel 7', pop: 5,
    variants: { 128: [5_200_000, 7_100_000], 256: [5_900_000, 7_900_000] } },
  { id: 'oppo-reno-11', brand: 'OPPO', name: 'Reno 11 5G', pop: 5,
    variants: { 256: [4_200_000, 5_500_000] } },
  { id: 'vivo-v29', brand: 'vivo', name: 'V29 5G', pop: 4,
    variants: { 256: [4_000_000, 5_300_000] } },

  // ---- added models -----------------------------------------------------------
  // New entries give a bare number per variant (the used-price median, IDR); the
  // "new" price is derived via newFactor below (default 1.35). Prices reflect the
  // 2026 Indonesian second-hand market: newest flagships cost the most, older
  // generations taper down.

  // Apple - older generations
  { id: 'iphone-x', brand: 'Apple', name: 'iPhone X', pop: 5, newFactor: 1.4,
    variants: { 64: 2_500_000, 256: 3_100_000 } },
  { id: 'iphone-xr', brand: 'Apple', name: 'iPhone XR', pop: 7, newFactor: 1.4,
    variants: { 64: 2_900_000, 128: 3_400_000, 256: 3_900_000 } },
  { id: 'iphone-se-2022', brand: 'Apple', name: 'iPhone SE (2022)', pop: 5, newFactor: 1.35,
    variants: { 64: 3_800_000, 128: 4_400_000, 256: 5_000_000 } },
  { id: 'iphone-13-pro', brand: 'Apple', name: 'iPhone 13 Pro', pop: 6, newFactor: 1.3,
    variants: { 128: 8_500_000, 256: 9_500_000, 512: 11_000_000 } },
  { id: 'iphone-14-pro', brand: 'Apple', name: 'iPhone 14 Pro', pop: 6, newFactor: 1.28,
    variants: { 128: 11_000_000, 256: 12_500_000, 512: 14_500_000 } },
  { id: 'iphone-15-pro', brand: 'Apple', name: 'iPhone 15 Pro', pop: 6, newFactor: 1.25,
    variants: { 128: 13_500_000, 256: 15_000_000, 512: 17_500_000 } },

  // Apple - iPhone 16 family
  { id: 'iphone-16', brand: 'Apple', name: 'iPhone 16', pop: 7, newFactor: 1.2,
    variants: { 128: 13_500_000, 256: 15_000_000, 512: 17_500_000 } },
  { id: 'iphone-16-plus', brand: 'Apple', name: 'iPhone 16 Plus', pop: 5, newFactor: 1.2,
    variants: { 128: 15_000_000, 256: 16_500_000, 512: 19_000_000 } },
  { id: 'iphone-16e', brand: 'Apple', name: 'iPhone 16e', pop: 5, newFactor: 1.15,
    variants: { 128: 9_000_000, 256: 10_500_000 } },
  { id: 'iphone-16-pro', brand: 'Apple', name: 'iPhone 16 Pro', pop: 6, newFactor: 1.18,
    variants: { 128: 16_000_000, 256: 17_500_000, 512: 20_000_000, 1024: 23_000_000 } },
  { id: 'iphone-16-pro-max', brand: 'Apple', name: 'iPhone 16 Pro Max', pop: 6, newFactor: 1.18,
    variants: { 256: 19_000_000, 512: 22_000_000, 1024: 25_000_000 } },

  // Apple - iPhone 17 family (newest, most expensive)
  { id: 'iphone-17', brand: 'Apple', name: 'iPhone 17', pop: 6, newFactor: 1.12,
    variants: { 256: 16_000_000, 512: 18_500_000 } },
  { id: 'iphone-17-plus', brand: 'Apple', name: 'iPhone 17 Plus', pop: 4, newFactor: 1.12,
    variants: { 256: 17_500_000, 512: 20_000_000 } },
  { id: 'iphone-17-pro', brand: 'Apple', name: 'iPhone 17 Pro', pop: 5, newFactor: 1.1,
    variants: { 256: 19_500_000, 512: 22_000_000, 1024: 26_000_000 } },
  { id: 'iphone-17-pro-max', brand: 'Apple', name: 'iPhone 17 Pro Max', pop: 6, newFactor: 1.1,
    variants: { 256: 22_000_000, 512: 25_000_000, 1024: 29_000_000 } },

  // Samsung
  { id: 'samsung-galaxy-s22', brand: 'Samsung', name: 'Galaxy S22', pop: 6, newFactor: 1.35,
    variants: { 128: 4_500_000, 256: 5_200_000 } },
  { id: 'samsung-galaxy-s24', brand: 'Samsung', name: 'Galaxy S24', pop: 6, newFactor: 1.25,
    variants: { 256: 9_500_000, 512: 11_000_000 } },
  { id: 'samsung-galaxy-s24-ultra', brand: 'Samsung', name: 'Galaxy S24 Ultra', pop: 5, newFactor: 1.22,
    variants: { 256: 15_000_000, 512: 17_000_000, 1024: 19_500_000 } },
  { id: 'samsung-galaxy-a34', brand: 'Samsung', name: 'Galaxy A34 5G', pop: 6, newFactor: 1.35,
    variants: { 128: 2_800_000, 256: 3_300_000 } },
  { id: 'samsung-galaxy-a15', brand: 'Samsung', name: 'Galaxy A15', pop: 8, newFactor: 1.35,
    variants: { 128: 1_600_000, 256: 1_900_000 } },
  { id: 'samsung-galaxy-m14', brand: 'Samsung', name: 'Galaxy M14 5G', pop: 6, newFactor: 1.35,
    variants: { 128: 1_500_000 } },

  // Xiaomi / POCO
  { id: 'xiaomi-redmi-note-12', brand: 'Xiaomi', name: 'Redmi Note 12', pop: 7, newFactor: 1.35,
    variants: { 128: 1_600_000, 256: 1_900_000 } },
  { id: 'xiaomi-14', brand: 'Xiaomi', name: 'Xiaomi 14', pop: 5, newFactor: 1.25,
    variants: { 256: 7_000_000, 512: 8_000_000 } },
  { id: 'poco-x6', brand: 'POCO', name: 'POCO X6', pop: 6, newFactor: 1.3,
    variants: { 256: 3_000_000, 512: 3_500_000 } },
  { id: 'xiaomi-redmi-13c', brand: 'Xiaomi', name: 'Redmi 13C', pop: 7, newFactor: 1.35,
    variants: { 128: 1_200_000, 256: 1_500_000 } },

  // OPPO
  { id: 'oppo-a78', brand: 'OPPO', name: 'A78 5G', pop: 5, newFactor: 1.35,
    variants: { 128: 2_400_000, 256: 2_800_000 } },
  { id: 'oppo-a58', brand: 'OPPO', name: 'A58', pop: 5, newFactor: 1.35,
    variants: { 128: 1_900_000 } },

  // vivo
  { id: 'vivo-v30', brand: 'vivo', name: 'V30 5G', pop: 5, newFactor: 1.3,
    variants: { 256: 4_500_000, 512: 5_200_000 } },
  { id: 'vivo-y36', brand: 'vivo', name: 'Y36', pop: 5, newFactor: 1.35,
    variants: { 128: 2_200_000, 256: 2_600_000 } },

  // Realme
  { id: 'realme-12', brand: 'Realme', name: 'Realme 12', pop: 7, newFactor: 1.3,
    variants: { 128: 2_400_000, 256: 2_800_000 } },
  { id: 'realme-c55', brand: 'Realme', name: 'Realme C55', pop: 7, newFactor: 1.35,
    variants: { 128: 1_500_000, 256: 1_800_000 } },
  { id: 'realme-11', brand: 'Realme', name: 'Realme 11', pop: 6, newFactor: 1.35,
    variants: { 128: 2_100_000, 256: 2_500_000 } },

  // Infinix / Tecno
  { id: 'infinix-note-40', brand: 'Infinix', name: 'Infinix Note 40', pop: 6, newFactor: 1.3,
    variants: { 128: 1_900_000, 256: 2_200_000 } },
  { id: 'tecno-spark-20', brand: 'Tecno', name: 'Tecno Spark 20', pop: 6, newFactor: 1.35,
    variants: { 128: 1_300_000, 256: 1_500_000 } },
];

// Normalize variant values: a bare number is a used-price base; derive the "new"
// price from it via the model's newFactor. Existing entries already use explicit
// [used, new] tuples and are left untouched.
for (const model of CATALOG) {
  const factor = model.newFactor ?? 1.35;
  for (const key of Object.keys(model.variants)) {
    const v = model.variants[key];
    if (!Array.isArray(v)) {
      model.variants[key] = [v, Math.round((v * factor) / 50_000) * 50_000];
    }
  }
}

const LOCATIONS = [
  ['Jakarta Selatan', 20], ['Jakarta Barat', 12], ['Jakarta Timur', 10],
  ['Bandung', 12], ['Bekasi', 10], ['Depok', 9], ['Tangerang', 9],
  ['Surabaya', 11], ['Bogor', 7], ['Semarang', 6], ['Yogyakarta', 6],
  ['Medan', 5], ['Makassar', 4], ['Denpasar', 4], ['Malang', 4],
];

const SOURCES = [
  ['olx', 42], ['facebook', 22], ['tokopedia', 16], ['shopee', 14], ['carousell', 6],
];

const USED_QUALIFIERS = ['Mulus', 'Fullset', 'Like New', 'Second Normal', 'iBox', 'Ex Inter', 'Mint', 'Nego Tipis', 'Batangan', 'Fullset Ori'];
const NEW_QUALIFIERS = ['BNIB Segel', 'Resmi iBox', 'Garansi Resmi', 'New Segel', 'BNIB Garansi TAM', 'Ready Stock'];

function searchUrl(source, name, storageGb) {
  const q = encodeURIComponent(storageGb ? `${name} ${storageGb}GB` : name);
  const slug = `${name}${storageGb ? ' ' + storageGb + 'gb' : ''}`
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  switch (source) {
    case 'olx': return `https://www.olx.co.id/items/q-${slug}`;
    case 'facebook': return `https://www.facebook.com/marketplace/search/?query=${q}`;
    case 'tokopedia': return `https://www.tokopedia.com/search?q=${q}`;
    case 'shopee': return `https://shopee.co.id/search?keyword=${q}`;
    case 'carousell': return `https://www.carousell.co.id/search/${q}`;
    default: return `https://www.google.com/search?q=${q}`;
  }
}

function priceFor(base, condition) {
  const [used, neu] = base;
  const center = condition === 'used' ? used : neu;
  // Noise buckets: mostly near-market, some deals, some overpriced, rare junk outlier.
  const bucket = weightedPick([
    ['near', 62], ['deal', 16], ['over', 16], ['bargain', 4], ['inflated', 2],
  ]);
  let factor;
  switch (bucket) {
    case 'near': factor = between(0.94, 1.08); break;
    case 'deal': factor = between(0.82, 0.92); break;
    case 'over': factor = between(1.1, 1.24); break;
    case 'bargain': factor = between(0.68, 0.8); break; // strong outlier low
    case 'inflated': factor = between(1.3, 1.55); break; // strong outlier high
    default: factor = 1;
  }
  const raw = center * factor;
  // Round to a believable price granularity (nearest 50k).
  return Math.round(raw / 50_000) * 50_000;
}

let seq = 0;
function makeListing(model, storageGb, base) {
  const condition = weightedPick([['used', 78], ['new', 22]]);
  const source = weightedPick(SOURCES);
  const location = weightedPick(LOCATIONS);
  const qualifier = condition === 'used' ? pick(USED_QUALIFIERS) : pick(NEW_QUALIFIERS);
  const priceIdr = priceFor(base, condition);
  // Posted within the last ~21 days, weighted toward recent.
  const ageDays = Math.pow(rnd(), 1.7) * 21;
  const postedAt = new Date(REFERENCE_MS - ageDays * 86_400_000).toISOString();
  seq += 1;
  const id = `${model.id}-${String(seq).padStart(4, '0')}`;
  const title = `${model.name} ${storageGb}GB ${condition === 'used' ? 'Bekas' : 'Baru'} ${qualifier}`;
  return {
    id,
    title,
    priceIdr,
    condition,
    storageGb,
    modelId: model.id,
    location,
    source,
    url: searchUrl(source, model.name, storageGb),
    postedAt,
  };
}

// Generate listings. Count scales with popularity so hero models feel dense.
const listings = [];
for (const model of CATALOG) {
  const storages = Object.keys(model.variants).map(Number);
  const count = 10 + model.pop * 3; // ~19..44 listings per model, scaled by popularity
  // Storage weighting: 128 is most common, larger less so, 64 least.
  const storageWeights = storages.map((s) => {
    if (s === 128) return 5;
    if (s === 256) return 4;
    if (s === 64) return 2;
    return 2; // 512
  });
  const storagePairs = storages.map((s, i) => [s, storageWeights[i]]);
  for (let i = 0; i < count; i += 1) {
    const storageGb = weightedPick(storagePairs);
    listings.push(makeListing(model, storageGb, model.variants[storageGb]));
  }
}

// Sort newest first for stable, pleasant default ordering.
listings.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

// ---- model summaries + trending ---------------------------------------------
const models = CATALOG.map((m) => ({
  id: m.id,
  name: m.name,
  brand: m.brand,
  availableStorageGb: Object.keys(m.variants).map(Number).sort((a, b) => a - b),
}));

// Curated trending: a brand-diverse mix (not all iPhone at the top) so it reads
// like the real Indonesian market. Only ids present in the catalog are kept.
const TRENDING = [
  'iphone-16',
  'samsung-galaxy-a54',
  'xiaomi-redmi-note-13',
  'realme-12',
  'iphone-15',
  'poco-x6',
  'samsung-galaxy-s24',
  'oppo-reno-11',
  'iphone-17-pro-max',
  'vivo-v30',
  'samsung-galaxy-a15',
  'infinix-note-40',
  'iphone-14',
  'tecno-spark-20',
];
const catalogIds = new Set(CATALOG.map((m) => m.id));
const trending = TRENDING.filter((id) => catalogIds.has(id));

// ---- emit --------------------------------------------------------------------
const header = `// AUTO-GENERATED by scripts/generate-fixtures.mjs. Do not edit by hand.
// Reproducible: seeded RNG + fixed reference date (2026-07-03). Re-run the
// generator to regenerate. Realistic Indonesian second-hand phone data in IDR.\n`;

const modelsTs = `${header}import type { ModelSummary } from '@/types';

export const MODELS: ModelSummary[] = ${JSON.stringify(models, null, 2)};

/** Model ids to surface in the "trending" row, most popular first. */
export const TRENDING_MODEL_IDS: string[] = ${JSON.stringify(trending, null, 2)};

const BY_ID: Record<string, ModelSummary> = Object.fromEntries(
  MODELS.map((m) => [m.id, m]),
);

export function getModel(id: string): ModelSummary | undefined {
  return BY_ID[id];
}
`;

const listingsTs = `${header}import type { Listing } from '@/types';

export const LISTINGS: Listing[] = ${JSON.stringify(listings, null, 2)};
`;

writeFileSync(join(OUT_DIR, 'models.ts'), modelsTs);
writeFileSync(join(OUT_DIR, 'listings.ts'), listingsTs);

console.log(`Wrote ${models.length} models, ${listings.length} listings to ${OUT_DIR}`);
