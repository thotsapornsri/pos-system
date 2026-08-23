import type { Product } from '../types';

/** Next sequential "PRD-NNN" code, continuing from the highest existing
 * numeric suffix — not products.length, which repeats/skips numbers once
 * a product has been deleted. Codes that don't match the pattern (custom
 * or imported codes) are ignored when finding the max. */
export function nextProductCode(products: Product[]): string {
  const nums = products
    .map((p) => /^PRD-(\d+)$/.exec(p.code)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `PRD-${String(next).padStart(3, '0')}`;
}
