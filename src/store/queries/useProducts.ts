import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Product } from '../../types';

export const PRODUCTS_KEY = ['products'] as const;

export function useProductsQuery() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.from('products').select('*').order('id');
      if (error) throw error;
      return data as Product[];
    },
  });
}

export async function insertProduct(input: Omit<Product, 'id'>): Promise<void> {
  const { error } = await supabase.from('products').insert(input);
  if (error) throw error;
}

export async function updateProductRow(id: number, patch: Partial<Omit<Product, 'id'>>): Promise<void> {
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProductRow(id: number): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/** Sets absolute stock (caller computes the new value from cached data — see completeSale/processRecipe). */
export async function setProductStock(id: number, stock: number): Promise<void> {
  const { error } = await supabase.from('products').update({ stock }).eq('id', id);
  if (error) throw error;
}
