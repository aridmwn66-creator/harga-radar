import type { Page } from 'playwright';
import type { Condition, RawListing, SourceId } from '../types.js';
import { absoluteUrl, parsePriceIdr } from '../lib/text.js';
import { politeDelay } from '../lib/delay.js';

// Shared scraping helper. A source configures selectors (best-effort) and this
// runs a resilient DOM extractor with a price-anchored heuristic fallback, so a
// selector change degrades to "fewer/no results" rather than a crash.

export type ExtractConfig = {
  /** Card container selector. If it matches nothing, a heuristic fallback runs. */
  cardSelector?: string;
  titleSelector?: string;
  priceSelector?: string;
  locationSelector?: string;
  timeSelector?: string;
  linkSelector?: string;
  imageSelector?: string;
  limit: number;
};

type RawCard = {
  title: string;
  priceText: string;
  url: string;
  location: string;
  imageUrl: string;
  timeText: string;
};

// Runs INSIDE the page. Must be self-contained (no outside references).
function extractCards(cfg: ExtractConfig): RawCard[] {
  const priceRe = /Rp\s?[\d.,]+\s?(jt|juta|rb|ribu)?/i;
  const text = (n: Element | null): string =>
    n ? ((n as HTMLElement).innerText || n.textContent || '').trim() : '';

  const pickTitle = (el: Element): string => {
    if (cfg.titleSelector) {
      const t = text(el.querySelector(cfg.titleSelector));
      if (t) return t;
    }
    const img = el.querySelector('img[alt]');
    const alt = img?.getAttribute('alt')?.trim();
    if (alt) return alt;
    const lines = ((el as HTMLElement).innerText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter((l) => l.length > 0 && /[a-z]/i.test(l) && !/^rp/i.test(l));
    lines.sort((a, b) => b.length - a.length);
    return lines[0] ?? '';
  };

  const build = (el: Element, out: RawCard[], seen: Set<string>): void => {
    let priceText = cfg.priceSelector ? text(el.querySelector(cfg.priceSelector)) : '';
    if (!priceText) {
      const m = ((el as HTMLElement).innerText || '').match(priceRe);
      priceText = m ? m[0] : '';
    }
    if (!priceText) return;

    const linkEl = cfg.linkSelector
      ? el.querySelector(cfg.linkSelector)
      : el.matches('a[href]')
        ? el
        : el.querySelector('a[href]') ?? el.closest('a[href]');
    const url = linkEl?.getAttribute('href') ?? '';

    const title = pickTitle(el);
    if (!title) return;

    const location = cfg.locationSelector ? text(el.querySelector(cfg.locationSelector)) : '';
    const timeText = cfg.timeSelector ? text(el.querySelector(cfg.timeSelector)) : '';
    const imgEl = cfg.imageSelector ? el.querySelector(cfg.imageSelector) : el.querySelector('img');
    const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';

    const key = `${url}|${priceText}|${title.slice(0, 40)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ title, priceText, url, location, imageUrl, timeText });
  };

  const seen = new Set<string>();
  const out: RawCard[] = [];

  let cards: Element[] = cfg.cardSelector
    ? Array.from(document.querySelectorAll(cfg.cardSelector))
    : [];
  if (cards.length === 0) {
    // Heuristic fallback: any anchor whose text contains a price.
    cards = Array.from(document.querySelectorAll('a[href]')).filter((a) =>
      priceRe.test((a as HTMLElement).innerText || ''),
    );
  }
  for (const c of cards) {
    if (out.length >= cfg.limit) break;
    build(c, out, seen);
  }
  return out;
}

export type ScrapeOptions = {
  page: Page;
  url: string;
  origin: string;
  source: SourceId;
  defaultCondition: Condition;
  extract: ExtractConfig;
  /** Optional selector to wait for before extracting (JS-rendered results). */
  waitForSelector?: string;
};

/** Navigate to a search URL and extract normalized-ish raw listings. */
export async function scrapeSearch(opts: ScrapeOptions): Promise<RawListing[]> {
  const { page, url } = opts;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  if (opts.waitForSelector) {
    await page.waitForSelector(opts.waitForSelector, { timeout: 9000 }).catch(() => {});
  }
  // Let client-rendered results settle, politely.
  await politeDelay(1500, 3000);

  const cards = await page.evaluate(extractCards, opts.extract);

  const listings: RawListing[] = [];
  for (const c of cards) {
    const priceIdr = parsePriceIdr(c.priceText);
    if (!priceIdr || !c.title) continue;
    listings.push({
      source: opts.source,
      title: c.title,
      priceIdr,
      url: c.url ? absoluteUrl(c.url, opts.origin) : opts.url,
      location: c.location || undefined,
      imageUrl: c.imageUrl ? absoluteUrl(c.imageUrl, opts.origin) : undefined,
      postedAtRaw: c.timeText || undefined,
      conditionHint: opts.defaultCondition,
    });
  }
  return listings;
}
