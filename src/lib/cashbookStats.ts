import type { CashEntry } from '../types';

export type CashPeriodKey = 'day' | 'week' | 'month' | 'year';

export interface CashPeriodTotals {
  income: number;
  expense: number;
  net: number;
}

function startOfWeek(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7; // getDay(): 0=Sun..6=Sat
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d < end;
}

export function rangeFor(period: CashPeriodKey, now = new Date()): { start: Date; end: Date } {
  if (period === 'day') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }
  if (period === 'week') {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  if (period === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
}

export function totalsFor(entries: CashEntry[], period: CashPeriodKey, now = new Date()): CashPeriodTotals {
  const { start, end } = rangeFor(period, now);
  const inPeriod = entries.filter((e) => inRange(e.date, start, end));
  const income = inPeriod.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const expense = inPeriod.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  return { income, expense, net: income - expense };
}

/** Total expenses within [start, end) — feeds Dashboard's "opex" a real
 * number derived from the cashbook instead of a hardcoded 0. */
export function expensesInRange(entries: CashEntry[], start: Date, end: Date): number {
  return entries.filter((e) => e.type === 'expense' && inRange(e.date, start, end)).reduce((sum, e) => sum + e.amount, 0);
}
