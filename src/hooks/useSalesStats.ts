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

/** Dashboard/Reports numbers computed from real `sales` rows — see
 * salesStats.ts for what's exact (revenue, orders, best/worst sellers) vs.
 * approximate (gross profit — only BOM-recipe products have known cost). */
export function useSalesStats() {
  const { sales, bomRecipes, materials, products } = usePos();

  return useMemo(() => {
    const costMap = buildCostMap(bomRecipes, materials);
    return {
      day: dayStats(sales, costMap),
      month: monthStats(sales, costMap),
      year: yearStats(sales, costMap),
      bestSellers: bestSellers(sales),
      worstSellers: worstSellers(sales, products),
      dailyRows: dailyRows(sales),
      monthlyRows: monthlyRows(sales),
      yearlyRows: yearlyRows(sales),
    };
  }, [sales, bomRecipes, materials, products]);
}
