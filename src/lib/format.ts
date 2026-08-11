import type { StoreSettings } from '../types';

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€' };

/** Formats a number as currency using the store's configured currency. */
export function formatMoney(n: number, currency: StoreSettings['currency']): string {
  const formatted = Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (currency === 'THB') return `${formatted} บาท`;
  return (CURRENCY_SYMBOLS[currency] ?? '') + formatted;
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
