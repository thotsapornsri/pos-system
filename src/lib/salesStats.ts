import type { PeriodData } from '../data/seed';
import type { Sale } from '../store/queries/useSales';
import type { Material, Product, Recipe } from '../types';

/**
 * Derives Dashboard/Reports numbers from real `sales` rows instead of demo
 * data. Revenue/orders/best-&-worst-sellers are exact. Gross profit/COGS
 * are only as complete as the store's own data lets them be: cost is known
 * only for products with a BOM recipe (ingredient cost / batch qty) — a
 * plain retail product with no recipe contributes 0 cost, which understates
 * COGS (and so overstates gross profit) for that item. There is no
 * operating-expense tracking anywhere in the app, so `opex` is always 0 and
 * `net` is really "revenue minus known COGS", not a true net profit.
 */

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const YEAR_SPAN = 5;

export function buildCostMap(recipes: Recipe[], materials: Material[]): Map<number, number> {
  const materialById = new Map(materials.map((m) => [m.id, m]));
  const map = new Map<number, number>();
  for (const r of recipes) {
    const batchQty = r.batchQty || 1;
    const cost = r.ingredients.reduce((sum, ing) => sum + (materialById.get(ing.materialId)?.unitCost ?? 0) * ing.qty, 0);
    map.set(r.outputProductId, cost / batchQty);
  }
  return map;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function revenueOf(sales: Sale[]): number {
  return sales.reduce((sum, s) => sum + s.total, 0);
}

function cogsOf(sales: Sale[], costMap: Map<number, number>): number {
  return sales.reduce(
    (sum, s) => sum + s.items.reduce((isum, it) => isum + (it.productId != null ? (costMap.get(it.productId) ?? 0) * it.qty : 0), 0),
    0,
  );
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function kpisFor(current: Sale[], previous: Sale[], costMap: Map<number, number>): PeriodData['kpis'] {
  const revenue = revenueOf(current);
  const prevRevenue = revenueOf(previous);
  const orders = current.length;
  const prevOrders = previous.length;
  const avgOrder = orders > 0 ? revenue / orders : 0;
  const prevAvgOrder = prevOrders > 0 ? prevRevenue / prevOrders : 0;
  const grossProfit = revenue - cogsOf(current, costMap);
  const prevGrossProfit = prevRevenue - cogsOf(previous, costMap);

  return [
    ['revenue', revenue, pctChange(revenue, prevRevenue)],
    ['orders', String(orders), pctChange(orders, prevOrders)],
    ['avgOrder', avgOrder, pctChange(avgOrder, prevAvgOrder)],
    ['grossProfit', grossProfit, pctChange(grossProfit, prevGrossProfit)],
  ];
}

export function dayStats(sales: Sale[], costMap: Map<number, number>, now = new Date()): PeriodData {
  const today = sales.filter((s) => isSameDay(new Date(s.createdAt), now));
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdaySales = sales.filter((s) => isSameDay(new Date(s.createdAt), yesterday));

  const bars: number[] = [];
  const barLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    bars.push(revenueOf(sales.filter((s) => isSameDay(new Date(s.createdAt), d))));
    barLabels.push(WEEKDAY_LABELS[d.getDay()]);
  }

  const cogs = cogsOf(today, costMap);
  return { kpis: kpisFor(today, yesterdaySales, costMap), bars, barLabels, cogs, opex: 0, net: revenueOf(today) - cogs };
}

export function monthStats(sales: Sale[], costMap: Map<number, number>, now = new Date()): PeriodData {
  const y = now.getFullYear();
  const m = now.getMonth();
  const inMonth = (d: Date, yy: number, mm: number) => d.getFullYear() === yy && d.getMonth() === mm;
  const thisMonth = sales.filter((s) => inMonth(new Date(s.createdAt), y, m));
  const prev = new Date(y, m - 1, 1);
  const prevMonth = sales.filter((s) => inMonth(new Date(s.createdAt), prev.getFullYear(), prev.getMonth()));

  const bars = MONTH_LABELS.map((_, i) => revenueOf(sales.filter((s) => inMonth(new Date(s.createdAt), y, i))));
  const cogs = cogsOf(thisMonth, costMap);
  return { kpis: kpisFor(thisMonth, prevMonth, costMap), bars, barLabels: MONTH_LABELS, cogs, opex: 0, net: revenueOf(thisMonth) - cogs };
}

export function yearStats(sales: Sale[], costMap: Map<number, number>, now = new Date()): PeriodData {
  const y = now.getFullYear();
  const inYear = (d: Date, yy: number) => d.getFullYear() === yy;
  const thisYear = sales.filter((s) => inYear(new Date(s.createdAt), y));
  const prevYear = sales.filter((s) => inYear(new Date(s.createdAt), y - 1));

  const years = Array.from({ length: YEAR_SPAN }, (_, i) => y - YEAR_SPAN + 1 + i);
  const bars = years.map((yy) => revenueOf(sales.filter((s) => inYear(new Date(s.createdAt), yy))));
  const barLabels = years.map(String);
  const cogs = cogsOf(thisYear, costMap);
  return { kpis: kpisFor(thisYear, prevYear, costMap), bars, barLabels, cogs, opex: 0, net: revenueOf(thisYear) - cogs };
}

function qtySoldByProductName(sales: Sale[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sales) {
    for (const it of s.items) map.set(it.productName, (map.get(it.productName) ?? 0) + it.qty);
  }
  return map;
}

/** Only products that have actually sold at least once. */
export function bestSellers(sales: Sale[], n = 4): [string, number][] {
  return Array.from(qtySoldByProductName(sales).entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** Every catalog product, including ones with zero sales — that's the whole
 * point of a "needs attention" list. */
export function worstSellers(sales: Sale[], products: Product[], n = 4): [string, number][] {
  const qtyByName = qtySoldByProductName(sales);
  return products
    .map((p): [string, number] => [p.name, qtyByName.get(p.name) ?? 0])
    .sort((a, b) => a[1] - b[1])
    .slice(0, n);
}

export function dailyRows(sales: Sale[], now = new Date()): [string, number, number][] {
  const rows: [string, number, number][] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const day = sales.filter((s) => isSameDay(new Date(s.createdAt), d));
    rows.push([WEEKDAY_LABELS[d.getDay()], revenueOf(day), day.length]);
  }
  return rows;
}

export function monthlyRows(sales: Sale[], now = new Date()): [string, number][] {
  const y = now.getFullYear();
  return MONTH_LABELS.map((label, i) => [
    label,
    revenueOf(sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === y && d.getMonth() === i;
    })),
  ]);
}

export function yearlyRows(sales: Sale[], now = new Date()): [string, number][] {
  const y = now.getFullYear();
  const years = Array.from({ length: YEAR_SPAN }, (_, i) => y - YEAR_SPAN + 1 + i);
  return years.map((yy) => [
    String(yy),
    revenueOf(sales.filter((s) => new Date(s.createdAt).getFullYear() === yy)),
  ]);
}
