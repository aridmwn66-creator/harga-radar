import type { Condition } from '@/types';

// Formatting helpers. All money is IDR. We avoid Intl in hot paths for
// predictable output across engines and instead group digits by hand.

/** Group an integer with dot thousands separators, e.g. 1250000 -> "1.250.000". */
export function groupDigits(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const s = String(rounded);
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) out += '.';
    out += s[i];
  }
  return value < 0 ? `-${out}` : out;
}

/** Full IDR price, e.g. "Rp 1.250.000". */
export function formatIdr(value: number): string {
  return `Rp ${groupDigits(value)}`;
}

/**
 * Compact IDR for tight spots (axis labels, chips), e.g.
 * 1_250_000 -> "Rp 1,25 jt", 850_000 -> "Rp 850 rb".
 * Uses Indonesian scale words: rb (ribu), jt (juta).
 */
export function formatIdrCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const jt = value / 1_000_000;
    const text = jt.toFixed(jt >= 10 ? 1 : 2).replace('.', ',');
    return `Rp ${trimTrailingZeros(text)} jt`;
  }
  if (abs >= 1_000) {
    const rb = Math.round(value / 1_000);
    return `Rp ${groupDigits(rb)} rb`;
  }
  return `Rp ${groupDigits(value)}`;
}

function trimTrailingZeros(numText: string): string {
  if (!numText.includes(',')) return numText;
  return numText.replace(/,?0+$/, '');
}

/** Indonesian condition label. */
export function conditionLabel(condition: Condition): string {
  return condition === 'new' ? 'Baru' : 'Bekas';
}

/** Storage label, e.g. 128 -> "128 GB", 1024 -> "1 TB". */
export function storageLabel(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) return `${gb / 1024} TB`;
  return `${gb} GB`;
}

const RELATIVE_UNITS: { limit: number; div: number; unit: string }[] = [
  { limit: 60, div: 1, unit: 'dtk' },
  { limit: 3600, div: 60, unit: 'mnt' },
  { limit: 86_400, div: 3600, unit: 'jam' },
  { limit: 604_800, div: 86_400, unit: 'hr' },
  { limit: 2_629_800, div: 604_800, unit: 'mgg' },
  { limit: 31_557_600, div: 2_629_800, unit: 'bln' },
];

/**
 * Relative time in casual Indonesian, e.g. "3 jam lalu", "2 hr lalu".
 * `nowMs` is injectable so callers can keep it stable/testable.
 */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (diffSec < 45) return 'baru saja';
  for (const { limit, div, unit } of RELATIVE_UNITS) {
    if (diffSec < limit) {
      const n = Math.max(1, Math.round(diffSec / div));
      return `${n} ${unit} lalu`;
    }
  }
  const years = Math.round(diffSec / 31_557_600);
  return `${years} thn lalu`;
}

/** Signed percentage label for deal scores, e.g. -0.18 -> "-18%". */
export function formatPercent(fraction: number): string {
  const pct = Math.round(fraction * 100);
  return `${pct > 0 ? '+' : ''}${pct}%`;
}
