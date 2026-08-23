import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { CashEntry } from '../../types';

export const CASH_ENTRIES_KEY = ['cashEntries'] as const;

const SELECT = 'id, date, type, category, note, amount, createdBy:created_by';

// Newest first, no date-range filter yet — same tradeoff as useSales.ts:
// PostgREST's default row cap (1000) is far beyond what a single café's
// manual cashbook needs for the foreseeable future.
export function useCashEntriesQuery() {
  return useQuery({
    queryKey: CASH_ENTRIES_KEY,
    queryFn: async (): Promise<CashEntry[]> => {
      const { data, error } = await supabase.from('cash_entries').select(SELECT).order('date', { ascending: false });
      if (error) throw error;
      return data as CashEntry[];
    },
  });
}

export async function insertCashEntry(input: {
  date: string;
  type: 'income' | 'expense';
  category: string;
  note: string;
  amount: number;
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase.from('cash_entries').insert({
    date: input.date,
    type: input.type,
    category: input.category,
    note: input.note,
    amount: input.amount,
    created_by: input.createdBy,
  });
  if (error) throw error;
}

export async function deleteCashEntryRow(id: string): Promise<void> {
  const { error } = await supabase.from('cash_entries').delete().eq('id', id);
  if (error) throw error;
}
