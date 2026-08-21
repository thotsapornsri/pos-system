import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Category } from '../../types';

export const CATEGORIES_KEY = ['categories'] as const;

export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*').order('position').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export async function insertCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
}

export async function updateCategoryRow(id: string, patch: Partial<Pick<Category, 'name' | 'visible' | 'position'>>): Promise<void> {
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategoryRow(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

/** Optimistic: CategoriesView flips this on every toggle click. */
export function useToggleCategoryVisibleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from('categories').update({ visible }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, visible }) => {
      await qc.cancelQueries({ queryKey: CATEGORIES_KEY });
      qc.setQueryData<Category[]>(CATEGORIES_KEY, (prev) => prev?.map((c) => (c.id === id ? { ...c, visible } : c)));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
}
