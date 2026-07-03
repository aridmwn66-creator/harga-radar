// Per-brand accent color + monogram used by the model thumbnail placeholder.
// Kept deterministic so the same brand always renders the same tile.

const BRAND_COLORS: Record<string, string> = {
  Apple: '#D7DBE0',
  Samsung: '#5B8CFF',
  Xiaomi: '#FF9761',
  POCO: '#FFD23C',
  Google: '#5FD39B',
  OPPO: '#4FD8A6',
  vivo: '#7EA8FF',
};

const FALLBACK = '#8A9099';

export function brandAccent(brand: string): string {
  return BRAND_COLORS[brand] ?? FALLBACK;
}

/** Short monogram for the thumbnail tile, e.g. "Apple" -> "A", "POCO" -> "PO". */
export function brandMonogram(brand: string): string {
  if (brand.length <= 2) return brand.toUpperCase();
  return brand.slice(0, 1).toUpperCase();
}
