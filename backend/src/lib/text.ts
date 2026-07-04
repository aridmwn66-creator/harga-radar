import type { Condition } from '../types.js';

// Text parsing helpers: prices, storage, condition, and junk detection. These
// are the messy heart of turning marketplace listing titles into structured data.

/**
 * Parse an IDR price from free text. Handles "Rp 3.850.000", "Rp3,850,000",
 * "3.850.000", and shorthand like "Rp 3,85 jt" / "850 rb". Returns null if no
 * plausible price is found.
 */
export function parsePriceIdr(text: string | null | undefined): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Shorthand: "3,85 jt" / "3.85 juta" / "850 rb" / "850 ribu".
  const jt = lower.match(/(\d+[.,]?\d*)\s*(jt|juta)/);
  if (jt && jt[1]) {
    const n = Number(jt[1].replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 1_000_000);
  }
  const rb = lower.match(/(\d+[.,]?\d*)\s*(rb|ribu|k)\b/);
  if (rb && rb[1]) {
    const n = Number(rb[1].replace(',', '.'));
    if (Number.isFinite(n)) return Math.round(n * 1_000);
  }

  // Full number: take the longest run of digits+separators, strip separators.
  const runs = lower.match(/[\d][\d.,]*\d|\d/g);
  if (!runs) return null;
  let best = 0;
  for (const run of runs) {
    const digits = run.replace(/[.,]/g, '');
    const n = Number(digits);
    if (Number.isFinite(n) && n > best) best = n;
  }
  return best > 0 ? best : null;
}

/** Extract storage in GB from a title, e.g. "128gb" -> 128, "1tb" -> 1024. */
export function extractStorageGb(title: string): number | undefined {
  const m = title.toLowerCase().match(/(\d+)\s*(tb|gb|g)\b/);
  if (!m || !m[1]) return undefined;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return undefined;
  const unit = m[2];
  const gb = unit === 'tb' ? value * 1024 : value;
  // Reject implausible storage (RAM mentions, typos).
  const common = [16, 32, 64, 128, 256, 512, 1024, 2048];
  if (common.includes(gb)) return gb;
  return undefined;
}

const USED_KEYWORDS = [
  'bekas', 'second', '2nd', 'seken', 'sekend', 'mulus', 'ex ', 'ex-', 'preloved',
  'like new', 'likenew', 'batangan', 'minus', 'normal', 'nego',
];
const NEW_KEYWORDS = [
  'baru', 'brand new', 'bnib', 'segel', 'sealed', 'new unit', 'garansi resmi',
  'resmi ibox', 'ibox', 'inter', 'international', 'ready stock', 'ready',
];

/**
 * Infer condition from a title. Falls back to `fallback` (a per-source default:
 * OLX/Carousell/FB lean used, Tokopedia/Shopee lean new).
 */
export function inferCondition(title: string, fallback: Condition): Condition {
  const t = ` ${title.toLowerCase()} `;
  const used = USED_KEYWORDS.some((k) => t.includes(k));
  const isNew = NEW_KEYWORDS.some((k) => t.includes(k));
  if (used && !isNew) return 'used';
  if (isNew && !used) return 'new';
  return fallback;
}

const JUNK_KEYWORDS = [
  // Accessories / parts
  'case', 'casing', 'softcase', 'hardcase', 'silikon', 'silicone', 'tempered',
  'anti gores', 'antigores', 'garskin', 'skin', 'sticker', 'charger', 'kabel',
  'cable', 'adaptor', 'adapter', 'headset', 'earphone', 'earpods', 'airpods',
  'powerbank', 'holder', 'tripod', 'stand', 'lcd', 'touchscreen', 'baterai',
  'battery', 'batre', 'mesin', 'flexible', 'connector', 'konektor', 'sparepart',
  'spare part', 'dus only', 'box only', 'kotak only', 'strap', 'lanyard',
  'tempered glass', 'screen guard', 'screenguard',
  // Wanted-to-buy / not a sale
  'dicari', 'wtb', 'want to buy', 'cari ', 'nyari', 'butuh ', 'terima jual',
];

/** Detect obviously non-phone listings (accessories, parts, wanted-to-buy). */
export function isJunk(title: string): boolean {
  const t = ` ${title.toLowerCase()} `;
  return JUNK_KEYWORDS.some((k) => t.includes(k));
}

/** Resolve a possibly-relative href against a base origin. */
export function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/**
 * Best-effort parse of Indonesian relative time ("3 hari lalu", "kemarin") into
 * an ISO timestamp. Returns now when it cannot tell (better than a wrong date).
 */
export function parsePostedAt(raw: string | undefined, nowMs: number): string {
  if (!raw) return new Date(nowMs).toISOString();
  const t = raw.toLowerCase();
  const units: { re: RegExp; ms: number }[] = [
    { re: /(\d+)\s*(menit|min)/, ms: 60_000 },
    { re: /(\d+)\s*(jam|hour)/, ms: 3_600_000 },
    { re: /(\d+)\s*(hari|day)/, ms: 86_400_000 },
    { re: /(\d+)\s*(minggu|week|mggu|mgg)/, ms: 604_800_000 },
    { re: /(\d+)\s*(bulan|month|bln)/, ms: 2_629_800_000 },
  ];
  for (const { re, ms } of units) {
    const m = t.match(re);
    if (m && m[1]) return new Date(nowMs - Number(m[1]) * ms).toISOString();
  }
  if (/kemarin|yesterday/.test(t)) return new Date(nowMs - 86_400_000).toISOString();
  if (/baru saja|just now|hari ini|today/.test(t)) return new Date(nowMs).toISOString();
  return new Date(nowMs).toISOString();
}
