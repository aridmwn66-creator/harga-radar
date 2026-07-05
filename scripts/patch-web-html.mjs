import fs from 'node:fs';
import path from 'node:path';

// Post-export patch for the web build. Expo's "single" (SPA) output generates
// dist/index.html from a fixed template that cannot be customized via +html.tsx,
// so we inject a few things the premium web build needs, deterministically and
// idempotently:
//   - STATIC @font-face rules + preloads for every bundled Inter weight. The
//     exported site otherwise ships NO @font-face at all: expo-font only
//     injects one at RUNTIME from the JS bundle, and if that registration is
//     late or fails in a real browser the family names (Inter_600SemiBold,
//     ...) resolve to nothing and the browser silently falls back to a serif
//     (Times New Roman). Declaring the faces statically, with family names
//     derived from the bundled ttf filenames so they match the theme tokens
//     exactly, guarantees Inter actually renders. font-display: block keeps
//     the no-FOUT behavior.
//   - a dark page background on html/body/#root, so there is NO white flash
//     before the JS bundle loads and React mounts (matches the app theme);
//   - the mobile theme color (dark status bar tint on Safari/Chrome);
//   - viewport-fit=cover for iPhone safe areas;
//   - lang="id".
// Run automatically by `npm run build:web`.

const distDir = path.resolve('dist');
const file = path.join(distDir, 'index.html');
if (!fs.existsSync(file)) {
  console.error(`patch-web-html: ${file} not found. Run "expo export --platform web" first.`);
  process.exit(1);
}

let html = fs.readFileSync(file, 'utf8');

if (html.includes('id="hargaradar-web"')) {
  console.log('patch-web-html: dist/index.html already patched.');
  process.exit(0);
}

// Find every bundled font file under dist/assets. The family name each style
// references is exactly the filename prefix before the content hash
// (e.g. Inter_600SemiBold.<hash>.ttf -> "Inter_600SemiBold"), so deriving the
// name from the file keeps the CSS and the theme tokens matching
// character-for-character even when hashes change.
function findFonts(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFonts(full));
    else if (entry.name.endsWith('.ttf')) out.push(full);
  }
  return out;
}

const fontFiles = findFonts(path.join(distDir, 'assets'));
if (fontFiles.length === 0) {
  console.error('patch-web-html: no .ttf assets found under dist/assets; fonts would fall back to serif.');
  process.exit(1);
}

const faces = fontFiles.map((full) => {
  const family = path.basename(full).split('.')[0];
  const url = '/' + path.relative(distDir, full).split(path.sep).join('/');
  return { family, url };
});

const preloads = faces
  .map(
    (f) =>
      `    <link rel="preload" href="${f.url}" as="font" type="font/ttf" crossorigin="anonymous" />`,
  )
  .join('\n');

const fontFaceCss = faces
  .map(
    (f) =>
      `@font-face{font-family:"${f.family}";src:url("${f.url}") format("truetype");` +
      'font-weight:normal;font-style:normal;font-display:block;}',
  )
  .join('');

// Grayscale antialiasing (matching the native app) renders text as crisp, solid
// strokes on the dark theme, instead of the browser default subpixel AA which
// fringes and reads as thin/fuzzy. font-synthesis:none forbids faux bold. These
// are inherited, so declaring them on <html> covers everything.
const inject =
  '    <meta name="theme-color" content="#0A0B0D" />\n' +
  `${preloads}\n` +
  '    <style id="hargaradar-web">' +
  fontFaceCss +
  'html,body,#root{background-color:#0A0B0D;}' +
  'html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-synthesis:none;}' +
  'body{overscroll-behavior:none;}' +
  '</style>\n' +
  '  </head>';

html = html.replace('</head>', inject);
html = html.replace('lang="en"', 'lang="id"');
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"',
);

fs.writeFileSync(file, html);
const names = faces.map((f) => f.family).join(', ');
console.log(
  `patch-web-html: patched dist/index.html (static @font-face + preload for ${faces.length} faces: ${names}; dark background, theme-color, viewport-fit, lang).`,
);
