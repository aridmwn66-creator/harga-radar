import fs from 'node:fs';
import path from 'node:path';

// Post-export patch for the web build. Expo's "single" (SPA) output generates
// dist/index.html from a fixed template that cannot be customized via +html.tsx,
// so we inject a few things the premium web build needs, deterministically and
// idempotently:
//   - a dark page background on html/body/#root, so there is NO white flash
//     before the JS bundle loads and React mounts (matches the app theme);
//   - the mobile theme color (dark status bar tint on Safari/Chrome);
//   - viewport-fit=cover for iPhone safe areas;
//   - lang="id".
// Run automatically by `npm run build:web`.

const file = path.resolve('dist/index.html');
if (!fs.existsSync(file)) {
  console.error(`patch-web-html: ${file} not found. Run "expo export --platform web" first.`);
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

if (html.includes('id="hargaradar-web"')) {
  console.log('patch-web-html: dist/index.html already patched.');
  process.exit(0);
}

const inject =
  '    <meta name="theme-color" content="#0A0B0D" />\n' +
  '    <style id="hargaradar-web">html,body,#root{background-color:#0A0B0D;}body{overscroll-behavior:none;}</style>\n' +
  '  </head>';

html = html.replace('</head>', inject);
html = html.replace('lang="en"', 'lang="id"');
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"',
);

fs.writeFileSync(file, html);
console.log('patch-web-html: patched dist/index.html (dark background, theme-color, viewport-fit, lang).');
