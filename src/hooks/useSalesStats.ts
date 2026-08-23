import { useMemo } from 'react';
import { usePos } from '../store/PosContext';
import {
  bestSellers,
  buildCostMap,
  dailyRows,
  dayStats,
  monthStats,
  monthlyRows,
  worstSellers,
  yearStats,
  yearlyRows,
} from '../lib/salesStats';

/** Dashboard/Reports numbers computed from real `sales` rows (and the
 * cashbook's expense entries for opex) — see salesStats.ts for what's exact
 * (revenue, orders, best/worst sellers) vs. approximate (gross profit —
 * only BOM-recipe products have known cost; opex — only what's logged). */
export function useSalesStats() {
  const { sales, bomRecipes, materials, products, cashEntries } = usePos();

  return useMemo(() => {
    const costMap = buildCostMap(bomRecipes, materials);
    const expenses = cashEntries.filter((e) => e.type === 'expense');
    return {
      day: dayStats(sales, costMap, expenses),
      month: monthStats(sales, costMap, expenses),
      year: yearStats(sales, costMap, expenses),
      bestSellers: bestSellers(sales),
      worstSellers: worstSellers(sales, products),
      dailyRows: dailyRows(sales),
      monthlyRows: monthlyRows(sales),
      yearlyRows: yearlyRows(sales),
    };
  }, [sales, bomRecipes, materials, products, cashEntries]);
}
