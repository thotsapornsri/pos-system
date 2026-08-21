import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Movement } from '../../types';

export const MOVEMENTS_KEY = ['movements'] as const;

export function useMovementsQuery() {
  return useQuery({
    queryKey: MOVEMENTS_KEY,
    queryFn: async (): Promise<Movement[]> => {
      const { data, error } = await supabase
        .from('movements')
        .select('ts, type, item, qty, unit')
        .order('ts', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Movement[];
    },
  });
}

export async function insertMovement(m: Omit<Movement, 'ts'>): Promise<void> {
  const { error } = await supabase.from('movements').insert({ type: m.type, item: m.item, qty: m.qty, unit: m.unit });
  if (error) throw error;
}
