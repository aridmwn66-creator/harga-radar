import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from '../config.js';
import { createLogger } from '../lib/logger.js';

// Central Playwright manager. One shared browser for the reliable sources, and a
// separate PERSISTENT context for Facebook so its logged-in session is kept.

const log = createLogger('browser');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-blink-features=AutomationControlled',
];

function executablePath(): string | undefined {
  return config.scraping.executablePath.length > 0 ? config.scraping.executablePath : undefined;
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: config.scraping.headless,
      args: LAUNCH_ARGS,
      executablePath: executablePath(),
    });
  }
  return browserPromise;
}

// Block heavy resources (images/media/fonts) for speed and a smaller footprint.
// Image URLs still live in the DOM as attributes, so thumbnails are unaffected.
async function blockHeavy(context: BrowserContext): Promise<void> {
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'media' || type === 'font') route.abort();
    else route.continue();
  });
}

// esbuild/tsx (keepNames) rewrites functions to call a `__name` helper. When we
// pass an extractor function to page.evaluate it is serialized and run in the
// browser, where `__name` does not exist. Define it as a no-op in every page.
async function addNameShim(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const g = globalThis as unknown as { __name?: (fn: unknown) => unknown };
    if (!g.__name) g.__name = (fn) => fn;
  });
}

async function configureContext(context: BrowserContext): Promise<void> {
  context.setDefaultNavigationTimeout(config.scraping.navTimeoutMs);
  context.setDefaultTimeout(config.scraping.navTimeoutMs);
  await addNameShim(context);
  await blockHeavy(context);
}

/** Run a scrape with a fresh, isolated page (used by the reliable sources). */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    viewport: { width: 1280, height: 900 },
  });
  await configureContext(context);
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close().catch(() => {});
  }
}

let fbContextPromise: Promise<BrowserContext> | null = null;

/**
 * A persistent browser context for Facebook. The logged-in session lives in
 * config.fb.userDataDir (populated by `npm run fb-login`). Reused across
 * requests so we do not re-login every time.
 */
export function getFacebookContext(headless = config.scraping.headless): Promise<BrowserContext> {
  if (!fbContextPromise) {
    fbContextPromise = chromium
      .launchPersistentContext(config.fb.userDataDir, {
        headless,
        args: LAUNCH_ARGS,
        executablePath: executablePath(),
        userAgent: UA,
        locale: 'id-ID',
        timezoneId: 'Asia/Jakarta',
        viewport: { width: 1280, height: 900 },
      })
      .then(async (ctx) => {
        ctx.setDefaultNavigationTimeout(config.scraping.navTimeoutMs);
        ctx.setDefaultTimeout(config.scraping.navTimeoutMs);
        await addNameShim(ctx);
        return ctx;
      });
  }
  return fbContextPromise;
}

/** Close everything on shutdown. */
export async function closeBrowser(): Promise<void> {
  try {
    if (fbContextPromise) await (await fbContextPromise).close();
  } catch (err) {
    log.warn('error closing facebook context', err);
  }
  try {
    if (browserPromise) await (await browserPromise).close();
  } catch (err) {
    log.warn('error closing browser', err);
  }
  browserPromise = null;
  fbContextPromise = null;
}
