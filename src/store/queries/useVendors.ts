import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Vendor } from '../../types';

export const VENDORS_KEY = ['vendors'] as const;

export function useVendorsQuery() {
  return useQuery({
    queryKey: VENDORS_KEY,
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase.from('vendors').select('*').order('code');
      if (error) throw error;
      return data as Vendor[];
    },
  });
}

export async function insertVendor(input: Omit<Vendor, 'id'>): Promise<void> {
  const { error } = await supabase.from('vendors').insert(input);
  if (error) throw error;
}

export async function updateVendorRow(id: string, patch: Partial<Omit<Vendor, 'id'>>): Promise<void> {
  const { error } = await supabase.from('vendors').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteVendorRow(id: string): Promise<void> {
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) throw error;
}
