import type { Condition, NormalizedQuery, RawListing, SourceRun } from '../types.js';
import { getModel, searchTermFor, matchModelId } from '../normalize/models.js';
import { normalizeListings } from '../normalize/normalize.js';
import { buildReport } from '../normalize/aggregate.js';
import { extractStorageGb, inferCondition, isJunk, parsePriceIdr } from '../lib/text.js';

// Offline unit test of the normalization + aggregation pipeline (no scraping).
// Run: npm run test:normalize

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures += 1;
}

// --- unit checks on the parsers -------------------------------------------
check('parsePrice full', parsePriceIdr('Rp 3.850.000') === 3_850_000);
check('parsePrice commas', parsePriceIdr('Rp3,850,000') === 3_850_000);
check('parsePrice juta', parsePriceIdr('Rp 3,85 jt') === 3_850_000);
check('parsePrice ribu', parsePriceIdr('850 rb') === 850_000);
check('storage 128', extractStorageGb('iPhone 11 128GB Bekas') === 128);
check('storage 1tb', extractStorageGb('iPhone 16 Pro 1TB') === 1024);
check('condition used', inferCondition('iPhone 11 Bekas Mulus', 'new') === 'used');
check('condition new', inferCondition('iPhone 11 BNIB Segel', 'used') === 'new');
check('junk case', isJunk('Case iPhone 11 Silikon') === true);
check('junk wtb', isJunk('Dicari iPhone 11 second') === true);
check('not junk', isJunk('iPhone 11 128GB Bekas Fullset') === false);
check('match iphone-11', matchModelId('iPhone 11 128GB Bekas') === 'iphone-11');
check('match 11 pro max specificity', matchModelId('iPhone 16 Pro Max 256GB') === 'iphone-16-pro-max');
check('match a54 no 5g', matchModelId('Samsung Galaxy A54 128GB') === 'samsung-galaxy-a54');

// --- pipeline check: mixed raw listings for iPhone 11 ----------------------
const model = getModel('iphone-11');
if (!model) throw new Error('iphone-11 missing from catalog');
const query: NormalizedQuery = {
  modelId: 'iphone-11',
  model,
  searchTerm: searchTermFor(model),
  storageGb: 128,
  condition: 'used',
  location: undefined,
  limit: 40,
};

const raw = (title: string, priceIdr: number, source: RawListing['source']): RawListing => ({
  source,
  title,
  priceIdr,
  url: `https://example.com/${encodeURIComponent(title)}`,
  location: 'Jakarta',
});

const runs: SourceRun[] = [
  {
    source: 'olx',
    ok: true,
    durationMs: 10,
    listings: [
      raw('iPhone 11 128GB Bekas Mulus Fullset', 3_800_000, 'olx'),
      raw('iPhone 11 128GB Second Normal', 3_950_000, 'olx'),
      raw('iPhone 11 128GB Bekas iBox', 4_100_000, 'olx'),
      raw('iPhone 11 256GB Bekas', 4_500_000, 'olx'), // wrong storage -> filtered
      raw('iPhone 13 128GB Bekas', 7_500_000, 'olx'), // wrong model -> filtered
      raw('Case iPhone 11 Silikon Murah', 45_000, 'olx'), // junk + cheap -> filtered
      raw('Dicari iPhone 11 second cod', 3_000_000, 'olx'), // wanted-to-buy -> filtered
      raw('iPhone 11 128GB Baru Segel', 5_700_000, 'olx'), // wrong condition -> filtered
      raw('iPhone 11 128GB Bekas Nego', 3_700_000, 'olx'),
    ],
  },
  {
    source: 'carousell',
    ok: true,
    durationMs: 12,
    listings: [
      raw('iPhone 11 128GB Bekas Like New', 3_900_000, 'carousell'),
      raw('iPhone 11 128 gb bekas mint', 4_050_000, 'carousell'),
      raw('iPhone 11 128GB Bekas outlier', 99_000_000, 'carousell'), // extreme -> IQR drop
    ],
  },
  { source: 'facebook', ok: false, durationMs: 5, listings: [], error: 'not logged in' },
];

const listings = normalizeListings(runs, query, Date.UTC(2026, 6, 4));
const report = buildReport('iphone-11', model.name, listings);

console.log('\nnormalized listings:', listings.map((l) => `${l.priceIdr} (${l.source})`).join(', '));
console.log('aggregate:', JSON.stringify(report.aggregate, null, 0));

check('only iphone-11 128 used kept', listings.every((l) => l.modelId === 'iphone-11' && l.storageGb === 128 && l.condition === 'used'));
check('junk + wanted removed', !listings.some((l) => /case|dicari/i.test(l.title)));
check('extreme outlier removed', !listings.some((l) => l.priceIdr >= 90_000_000));
check('has both sources', report.aggregate.bySource.length === 2);
check('median plausible', report.aggregate.median > 3_500_000 && report.aggregate.median < 4_300_000);
check('count matches listings', report.aggregate.count === listings.length);
check('sorted ascending', listings.every((l, i) => i === 0 || (listings[i - 1] as { priceIdr: number }).priceIdr <= l.priceIdr));

// --- condition split: Tokopedia (NEW) must not vanish -----------------------
// Tokopedia sells NEW units. When "new" is requested it must appear (in the
// listings and in bySource); when "used" is requested it is correctly excluded
// (its units are the other market), and OLX/Carousell keep working.
const NOW = Date.UTC(2026, 6, 4);
const rawH = (
  title: string,
  priceIdr: number,
  source: RawListing['source'],
  conditionHint?: Condition,
): RawListing => ({
  source,
  title,
  priceIdr,
  url: `https://example.com/${encodeURIComponent(title)}`,
  location: 'Jakarta',
  conditionHint,
});

const mixedRuns: SourceRun[] = [
  {
    source: 'olx',
    ok: true,
    durationMs: 10,
    listings: [
      rawH('iPhone 11 128GB Bekas Mulus', 3_800_000, 'olx'),
      rawH('iPhone 11 128GB Second Fullset', 3_950_000, 'olx'),
      rawH('iPhone 11 128GB Bekas Nego', 4_100_000, 'olx'),
    ],
  },
  {
    source: 'tokopedia',
    ok: true,
    durationMs: 20,
    listings: [
      rawH('Apple iPhone 11 128GB Garansi Resmi iBox', 5_999_000, 'tokopedia', 'new'),
      rawH('iPhone 11 128GB New Segel BNIB', 5_799_000, 'tokopedia', 'new'),
      rawH('Apple iPhone 11 128GB Resmi Ready Stock', 6_199_000, 'tokopedia', 'new'),
      rawH('Case iPhone 11 Premium Anti Gores', 89_000, 'tokopedia', 'new'), // junk
    ],
  },
];

const makeQuery = (condition?: Condition): NormalizedQuery => ({
  modelId: 'iphone-11',
  model,
  searchTerm: searchTermFor(model),
  condition,
  limit: 40,
});

const newListings = normalizeListings(mixedRuns, makeQuery('new'), NOW);
const newReport = buildReport('iphone-11', model.name, newListings);
check('new: tokopedia appears in bySource', newReport.aggregate.bySource.some((s) => s.source === 'tokopedia'));
check('new: tokopedia listings shown', newListings.some((l) => l.source === 'tokopedia'));
check('new: all classified new', newListings.every((l) => l.condition === 'new'));
check('new: used sources excluded', !newListings.some((l) => l.source === 'olx'));
check('new: junk case dropped', !newListings.some((l) => /case/i.test(l.title)));
check('new: median in new range', newReport.aggregate.median > 5_000_000 && newReport.aggregate.median < 7_000_000);

const usedListings = normalizeListings(mixedRuns, makeQuery('used'), NOW);
const usedReport = buildReport('iphone-11', model.name, usedListings);
check('used: olx kept', usedReport.aggregate.bySource.some((s) => s.source === 'olx'));
check('used: tokopedia excluded (new units)', !usedReport.aggregate.bySource.some((s) => s.source === 'tokopedia'));
check('used: median stays in used range', usedReport.aggregate.median > 3_500_000 && usedReport.aggregate.median < 4_300_000);

const anyListings = normalizeListings(mixedRuns, makeQuery(undefined), NOW);
check('any: both markets present', anyListings.some((l) => l.condition === 'used') && anyListings.some((l) => l.condition === 'new'));
check('any: new prices not culled by used market', anyListings.some((l) => l.priceIdr >= 5_700_000));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
