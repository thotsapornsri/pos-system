import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { CashCategory } from '../../types';

export const CASH_CATEGORIES_KEY = ['cashCategories'] as const;

export function useCashCategoriesQuery() {
  return useQuery({
    queryKey: CASH_CATEGORIES_KEY,
    queryFn: async (): Promise<CashCategory[]> => {
      const { data, error } = await supabase.from('cash_categories').select('*').order('type').order('name');
      if (error) throw error;
      return data as CashCategory[];
    },
  });
}

export async function insertCashCategory(name: string, type: 'income' | 'expense'): Promise<void> {
  const { error } = await supabase.from('cash_categories').insert({ name, type });
  if (error) throw error;
}

export async function updateCashCategoryRow(id: string, patch: Partial<Pick<CashCategory, 'name' | 'type'>>): Promise<void> {
  const { error } = await supabase.from('cash_categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCashCategoryRow(id: string): Promise<void> {
  const { error } = await supabase.from('cash_categories').delete().eq('id', id);
  if (error) throw error;
}
