import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';

const DIST = path.resolve('../dist');
const MIME = {'.html':'text/html','.js':'text/javascript','.ttf':'font/ttf','.png':'image/png','.ico':'image/x-icon','.json':'application/json'};
const server = http.createServer((req,res)=>{
  let f = path.join(DIST, decodeURIComponent((req.url||'/').split('?')[0]));
  if (!f.startsWith(DIST)) f = path.join(DIST,'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST,'index.html');
  res.setHeader('content-type', MIME[path.extname(f)] ?? 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r=>server.listen(0,r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless:true, executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox'] });

let failures = 0;
const check = (name, cond, extra) => { console.log(`${cond?'PASS':'FAIL'}  ${name}${extra?`  [${extra}]`:''}`); if(!cond) failures++; };

// Rendered-font probe: tag a target element, then ask CDP what font ACTUALLY
// rendered its glyphs (CSS.getPlatformFontsForNode = DevTools "Rendered Fonts").
async function renderedFonts(page, tagFnBody, probeId) {
  await page.evaluate(tagFnBody);
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const { root } = await client.send('DOM.getDocument');
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#${probeId}` });
  const { fonts } = await client.send('CSS.getPlatformFontsForNode', { nodeId });
  await client.detach();
  return fonts; // [{ familyName, postScriptName, isCustomFont, glyphCount }]
}

// --- 1. Title element on /home -------------------------------------------
{
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  await page.goto(`${base}/home`, { waitUntil:'networkidle' });
  await page.waitForTimeout(2000);
  const fonts = await renderedFonts(page, `(() => {
    const el = Array.from(document.body.querySelectorAll('*')).find(n =>
      n.textContent?.trim() === 'HargaRadar' && n.children.length === 0 && n.getBoundingClientRect().width > 0);
    if (el) el.id = 'font-probe-title';
  })()`, 'font-probe-title');
  console.log('TITLE rendered fonts:', JSON.stringify(fonts));
  check('title rendered with Inter', fonts.length > 0 && fonts.every(f => /Inter/i.test(f.familyName)), fonts.map(f=>f.familyName).join(','));
  check('title NOT Times New Roman/serif', !fonts.some(f => /Times|serif/i.test(f.familyName)));
  check('title font is a custom webfont (not local fallback)', fonts.every(f => f.isCustomFont === true));

  // Body text probe (a muted caption on home)
  const bodyFonts = await renderedFonts(page, `(() => {
    const el = Array.from(document.body.querySelectorAll('*')).find(n =>
      /Indeks Harga/i.test(n.textContent||'') && n.children.length === 0);
    if (el) el.id = 'font-probe-body';
  })()`, 'font-probe-body').catch(()=>[]);
  console.log('BODY rendered fonts:', JSON.stringify(bodyFonts));
  check('body text rendered with Inter', bodyFonts.length > 0 && bodyFonts.every(f => /Inter/i.test(f.familyName)), bodyFonts.map(f=>f.familyName).join(','));
  await page.close();
}

// --- 2. Price/number element on /report ----------------------------------
{
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  await page.goto(`${base}/report/iphone-11`, { waitUntil:'networkidle' });
  await page.waitForTimeout(2500);
  const fonts = await renderedFonts(page, `(() => {
    const els = Array.from(document.body.querySelectorAll('*')).filter(n =>
      /^Rp\\s?3\\.9/.test(n.textContent?.trim()||'') && n.children.length === 0);
    els.sort((a,b)=>parseFloat(getComputedStyle(b).fontSize)-parseFloat(getComputedStyle(a).fontSize));
    if (els[0]) els[0].id = 'font-probe-price';
  })()`, 'font-probe-price');
  console.log('PRICE (hero) rendered fonts:', JSON.stringify(fonts));
  check('hero price rendered with Inter', fonts.length > 0 && fonts.every(f => /Inter/i.test(f.familyName)), fonts.map(f=>f.familyName).join(','));
  check('hero price NOT Times New Roman/serif', !fonts.some(f => /Times|serif/i.test(f.familyName)));

  const synth = await page.evaluate(() => getComputedStyle(document.documentElement).fontSynthesis || getComputedStyle(document.documentElement).webkitFontSynthesis || '');
  check('font-synthesis none still holds', /none/.test(synth), synth);
  await page.close();
}

// --- 3. Static-CSS-only proof: block ALL JS, faces must still exist -------
{
  const page = await browser.newPage({ viewport:{width:1280,height:900} });
  await page.route('**/*.js', r => r.abort());
  await page.goto(`${base}/`, { waitUntil:'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(800);
  const result = await page.evaluate(async () => {
    const fams = ['Inter_400Regular','Inter_500Medium','Inter_600SemiBold','Inter_700Bold'];
    const out = {};
    for (const f of fams) {
      try { const loaded = await document.fonts.load(`16px "${f}"`); out[f] = loaded.length > 0; }
      catch { out[f] = false; }
    }
    return out;
  });
  console.log('JS-BLOCKED static @font-face availability:', JSON.stringify(result));
  check('all 4 faces load from static CSS alone (no JS at all)', Object.values(result).every(Boolean), JSON.stringify(result));
  await page.close();
}

// --- 4. No-FOUT: faces settled and used at first paint --------------------
{
  const page = await browser.newPage({ viewport:{width:390,height:844} });
  await page.goto(`${base}/home`, { waitUntil:'networkidle' });
  await page.waitForTimeout(1500);
  const faces = await page.evaluate(async () => {
    await document.fonts.ready;
    const list = []; document.fonts.forEach(f => list.push(`${f.family}:${f.status}`));
    return list;
  });
  console.log('Registered faces:', JSON.stringify(faces));
  const interLoaded = ['Inter_400Regular','Inter_500Medium','Inter_600SemiBold','Inter_700Bold']
    .every(n => faces.includes(`${n}:loaded`));
  check('all four Inter faces loaded (no-FOUT gate intact)', interLoaded);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-harga-radar/d172178f-e585-5520-9ba3-4549dd016a98/scratchpad/fontfix-home.png' });
  await page.close();
}

await browser.close(); server.close();
console.log(`\n${failures===0?'ALL RENDERED-FONT CHECKS PASSED':failures+' CHECK(S) FAILED'}`);
process.exit(failures===0?0:1);
