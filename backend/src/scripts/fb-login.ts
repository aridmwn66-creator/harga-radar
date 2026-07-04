import readline from 'node:readline';
import { chromium } from 'playwright';
import { config } from '../config.js';

// ===========================================================================
// FACEBOOK MANUAL LOGIN  (run once before enabling the Facebook source)
//   npm run fb-login
// ---------------------------------------------------------------------------
// Opens a VISIBLE Chromium with a persistent profile. Log in MANUALLY, then come
// back to this terminal and press Enter to save the session.
//
// WARNINGS:
//  - Scraping Facebook Marketplace violates Facebook's Terms of Service.
//  - Use a THROWAWAY / backup account, NEVER your main account: it can be
//    rate-limited, checkpointed, or banned.
//  - The saved session lives in config.fb.userDataDir (default .fb-userdata).
// ===========================================================================

function prompt(question: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, () => {
      rl.close();
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const execPath = config.scraping.executablePath.length > 0 ? config.scraping.executablePath : undefined;

  console.log('\n=========================================================');
  console.log(' Facebook login (throwaway account ONLY - not your main!)');
  console.log(` Profile dir: ${config.fb.userDataDir}`);
  console.log('=========================================================\n');

  const context = await chromium.launchPersistentContext(config.fb.userDataDir, {
    headless: false,
    executablePath: execPath,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' }).catch(() => {});

  console.log('A browser window opened. Log in with your THROWAWAY Facebook account.');
  await prompt('\nWhen you are fully logged in, press Enter here to save the session... ');

  await context.close();
  console.log('\nSession saved. You can now set SOURCE_FACEBOOK=on and start the server.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('fb-login failed:', err);
  process.exit(1);
});
