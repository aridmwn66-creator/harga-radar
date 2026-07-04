import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NormalizedQuery, SourceRun } from '../types.js';
import { withPage, closeBrowser } from '../browser/browser.js';
import { scrapeSearch } from '../sources/scrape.js';
import { normalizeListings } from '../normalize/normalize.js';
import { buildReport } from '../normalize/aggregate.js';
import { getModel, searchTermFor } from '../normalize/models.js';

// Integration test: serve realistic fake marketplace HTML locally, run the real
// scraper + extractor against it, and check the normalize/aggregate output.
// This exercises everything EXCEPT the live-site selectors (which can only be
// tested against the real sites, on a machine with network access).
// Run: npm run test:scrape

let failures = 0;
function check(name: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures += 1;
}

// An OLX-style search results page (data-aut-id attributes).
function olxCard(title: string, price: string, location: string): string {
  return `<li data-aut-id="itemBox"><a href="/item/${encodeURIComponent(title)}">
    <img alt="${title}" src="/img.jpg"/>
    <span data-aut-id="itemTitle">${title}</span>
    <span data-aut-id="itemPrice">${price}</span>
    <span data-aut-id="item-location">${location}</span>
  </a></li>`;
}
const olxHtml = `<html><body><ul>
  ${olxCard('iPhone 11 128GB Bekas Mulus', 'Rp 3.850.000', 'Jakarta Selatan')}
  ${olxCard('iPhone 11 128GB Second Fullset', 'Rp 3.950.000', 'Bandung')}
  ${olxCard('iPhone 11 256GB Bekas iBox', 'Rp 4.400.000', 'Surabaya')}
  ${olxCard('iPhone 11 64GB Bekas Nego', 'Rp 3.300.000', 'Bekasi')}
  ${olxCard('Case iPhone 11 Silikon', 'Rp 45.000', 'Depok')}
  ${olxCard('iPhone 13 128GB Bekas', 'Rp 7.500.000', 'Jakarta Barat')}
  ${olxCard('iPhone 11 128GB Bekas Like New', 'Rp 4.050.000', 'Medan')}
</ul></body></html>`;

// A Carousell-style page: product links with price text inside.
function crCard(title: string, price: string): string {
  return `<a href="/p/${encodeURIComponent(title)}-123"><div><img alt="${title}"/><p>${title}</p><p>${price}</p></div></a>`;
}
const carousellHtml = `<html><body><main>
  ${crCard('iPhone 11 128GB bekas mulus', 'Rp 3.900.000')}
  ${crCard('iPhone 11 128 gb second mint', 'Rp 4.000.000')}
  ${crCard('iPhone 11 256GB bekas', 'Rp 4.500.000')}
</main></body></html>`;

async function main(): Promise<void> {
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'text/html');
    if (req.url?.startsWith('/olx')) res.end(olxHtml);
    else if (req.url?.startsWith('/carousell')) res.end(carousellHtml);
    else res.end('<html><body>not found</body></html>');
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  const origin = `http://127.0.0.1:${port}`;

  const model = getModel('iphone-11');
  if (!model) throw new Error('missing model');
  const query: NormalizedQuery = {
    modelId: 'iphone-11',
    model,
    searchTerm: searchTermFor(model),
    condition: 'used',
    limit: 40,
  };

  const olxRaw = await withPage((page) =>
    scrapeSearch({
      page,
      url: `${origin}/olx`,
      origin,
      source: 'olx',
      defaultCondition: 'used',
      extract: {
        cardSelector: '[data-aut-id="itemBox"]',
        titleSelector: '[data-aut-id="itemTitle"]',
        priceSelector: '[data-aut-id="itemPrice"]',
        locationSelector: '[data-aut-id="item-location"]',
        linkSelector: 'a',
        imageSelector: 'img',
        limit: 40,
      },
    }),
  );
  const crRaw = await withPage((page) =>
    scrapeSearch({
      page,
      url: `${origin}/carousell`,
      origin,
      source: 'carousell',
      defaultCondition: 'used',
      extract: { cardSelector: 'a[href*="/p/"]', limit: 40 },
    }),
  );

  console.log(`olx raw: ${olxRaw.length}, carousell raw: ${crRaw.length}`);
  check('olx extracted cards', olxRaw.length >= 6);
  check('carousell extracted cards', crRaw.length >= 3);
  check('olx price parsed', olxRaw.some((r) => r.priceIdr === 3_850_000));
  check('olx location parsed', olxRaw.some((r) => r.location === 'Jakarta Selatan'));
  check('olx image absolute url', olxRaw.some((r) => (r.imageUrl ?? '').startsWith('http')));

  const runs: SourceRun[] = [
    { source: 'olx', ok: true, durationMs: 1, listings: olxRaw },
    { source: 'carousell', ok: true, durationMs: 1, listings: crRaw },
  ];
  const listings = normalizeListings(runs, query, Date.UTC(2026, 6, 4));
  const report = buildReport('iphone-11', model.name, listings);
  console.log('report:', JSON.stringify(report.aggregate));

  check('all iphone-11 used', listings.every((l) => l.modelId === 'iphone-11' && l.condition === 'used'));
  check('junk case dropped', !listings.some((l) => /case/i.test(l.title)));
  check('wrong model dropped', !listings.some((l) => /iphone 13/i.test(l.title)));
  check('two sources aggregated', report.aggregate.bySource.length === 2);
  check('median in used iphone-11 range', report.aggregate.median > 3_000_000 && report.aggregate.median < 5_000_000);
  check('count > 0', report.aggregate.count > 0);

  server.close();
  await closeBrowser();
  console.log(`\n${failures === 0 ? 'ALL SCRAPE CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
