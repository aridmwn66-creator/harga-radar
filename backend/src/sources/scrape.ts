import fs from 'node:fs/promises';
import path from 'node:path';
import type { Page, Response } from 'playwright';
import type { Condition, RawListing, SourceId } from '../types.js';
import { config } from '../config.js';
import { createLogger } from '../lib/logger.js';
import { absoluteUrl, parsePriceIdr } from '../lib/text.js';
import { politeDelay, sleep } from '../lib/delay.js';

const log = createLogger('scrape');

// How long to wait for JS-rendered results to appear before extracting anyway.
const WAIT_SELECTOR_TIMEOUT_MS = 12_000;
// Navigation retries with exponential backoff (helps flaky connections and the
// intermittent net::ERR_HTTP2_PROTOCOL_ERROR class of failures).
const NAV_ATTEMPTS = 3;
const NAV_BACKOFF_BASE_MS = 1_000;

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
  /**
   * Optional selector to wait for before extracting (JS-rendered results).
   * Accepts a comma-separated list, so a source can wait for any of several
   * candidate markups.
   */
  waitForSelector?: string;
};

// Diagnostics gathered in the page when a scrape yields nothing (or in debug
// mode), to explain WHY: is it blocked, empty, the wrong page, or stale
// selectors? Kept serializable so it survives page.evaluate.
type PageDiag = {
  title: string;
  bodyChars: number;
  anchorCount: number;
  priceAnchorCount: number;
  selectorCounts: Array<{ selector: string; count: number }>;
  blockHint: string;
};

/** Navigate with retries + exponential backoff. Returns the final response. */
async function gotoWithRetry(page: Page, url: string, source: SourceId): Promise<Response | null> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= NAV_ATTEMPTS; attempt += 1) {
    try {
      return await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.scraping.navTimeoutMs,
      });
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < NAV_ATTEMPTS) {
        const backoff = NAV_BACKOFF_BASE_MS * 2 ** (attempt - 1);
        log.warn(
          `[${source}] navigation attempt ${attempt}/${NAV_ATTEMPTS} failed (${message}); retrying in ${backoff}ms`,
        );
        await sleep(backoff);
      } else {
        log.warn(`[${source}] navigation failed after ${NAV_ATTEMPTS} attempts: ${message}`);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// Runs INSIDE the page. Scroll a few viewports to trigger lazy-loaded grids
// (Carousell/Tokopedia/Shopee/FB render listings on scroll), then return to top.
function lazyLoadScroll(): Promise<void> {
  return new Promise((resolve) => {
    let done = 0;
    const step = () => {
      window.scrollBy(0, window.innerHeight);
      done += 1;
      if (done >= 5) {
        window.scrollTo(0, 0);
        resolve();
        return;
      }
      setTimeout(step, 400);
    };
    step();
  });
}

// Runs INSIDE the page. Self-contained diagnostics for zero-result cases.
function collectDiag(selectors: string[]): PageDiag {
  const priceRe = /Rp\s?[\d.,]+/i;
  const anchors = Array.from(document.querySelectorAll('a[href]'));
  const priceAnchors = anchors.filter((a) => priceRe.test((a as HTMLElement).innerText || ''));
  const selectorCounts = selectors.map((selector) => {
    let count = -1;
    try {
      count = document.querySelectorAll(selector).length;
    } catch {
      count = -1;
    }
    return { selector, count };
  });
  const bodyText = ((document.body as HTMLElement | null)?.innerText || '').toLowerCase();
  const hints = [
    'captcha',
    'unusual traffic',
    'are you a robot',
    'cloudflare',
    'access denied',
    'akses ditolak',
    'verifikasi',
    'please verify',
    'log in',
    'masuk ke',
  ];
  const blockHint = hints.find((h) => bodyText.includes(h)) ?? '';
  return {
    title: document.title,
    bodyChars: bodyText.length,
    anchorCount: anchors.length,
    priceAnchorCount: priceAnchors.length,
    selectorCounts,
    blockHint,
  };
}

/** Every configured selector, de-duplicated, for the diagnostics counts. */
function configuredSelectors(opts: ScrapeOptions): string[] {
  const c = opts.extract;
  const list = [
    opts.waitForSelector,
    c.cardSelector,
    c.titleSelector,
    c.priceSelector,
    c.locationSelector,
    c.timeSelector,
    c.linkSelector,
    c.imageSelector,
  ].filter((s): s is string => typeof s === 'string' && s.length > 0);
  return Array.from(new Set(list));
}

/** Save a screenshot + HTML of the current page for offline inspection. */
async function saveDebugArtifacts(page: Page, source: SourceId): Promise<void> {
  try {
    await fs.mkdir(config.debug.dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = path.join(config.debug.dir, `${source}-${stamp}`);
    await page.screenshot({ path: `${base}.png` }).catch(() => {});
    const html = await page.content().catch(() => '');
    if (html) await fs.writeFile(`${base}.html`, html, 'utf8');
    log.info(`[${source}] saved debug artifacts: ${base}.png / ${base}.html`);
  } catch (err) {
    log.warn(`[${source}] failed to save debug artifacts`, err);
  }
}

/** Explain a zero-result (or debug) scrape and, in debug mode, dump the page. */
async function diagnose(page: Page, opts: ScrapeOptions, rawCount: number): Promise<void> {
  let diag: PageDiag | null = null;
  try {
    diag = await page.evaluate(collectDiag, configuredSelectors(opts));
  } catch (err) {
    log.warn(`[${opts.source}] diagnostics failed`, err);
  }
  if (diag) {
    const counts = diag.selectorCounts.map((s) => `${s.selector}=${s.count}`).join(' ');
    const reason =
      rawCount > 0
        ? 'debug (results found)'
        : diag.blockHint
          ? `possible block/wall (page mentions "${diag.blockHint}")`
          : diag.anchorCount === 0
            ? 'empty page: no links, likely blocked or not rendered'
            : diag.priceAnchorCount === 0
              ? 'links present but no prices: wrong page or no search results'
              : 'prices present but no cards extracted: selectors likely stale';
    log.warn(
      `[${opts.source}] diag reason="${reason}" title="${diag.title}" bodyChars=${diag.bodyChars} ` +
        `anchors=${diag.anchorCount} priceAnchors=${diag.priceAnchorCount} selectors[${counts}]`,
    );
  }
  if (config.debug.scrape) await saveDebugArtifacts(page, opts.source);
}

/** Navigate to a search URL and extract normalized-ish raw listings. */
export async function scrapeSearch(opts: ScrapeOptions): Promise<RawListing[]> {
  const { page, url, source } = opts;

  const response = await gotoWithRetry(page, url, source);
  const status = response?.status() ?? 0;

  // Wait for JS-rendered results, but extract anyway if they never show (the
  // page may use a different markup that the heuristic fallback still handles).
  let selectorMatched = false;
  if (opts.waitForSelector) {
    selectorMatched = await page
      .waitForSelector(opts.waitForSelector, { timeout: WAIT_SELECTOR_TIMEOUT_MS, state: 'attached' })
      .then(() => true)
      .catch(() => false);
  }

  // Nudge lazy-loaded grids into rendering, then let results settle politely.
  await page.evaluate(lazyLoadScroll).catch(() => {});
  await politeDelay(1200, 2500);

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

  log.info(
    `[${source}] status=${status} waited=${opts.waitForSelector ? selectorMatched : 'n/a'} ` +
      `raw=${listings.length} finalUrl=${page.url()}`,
  );

  // Explain (and, in debug mode, snapshot) anything that came back empty.
  if (listings.length === 0 || config.debug.scrape) {
    await diagnose(page, opts, listings.length);
  }

  return listings;
}
