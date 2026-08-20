import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Material } from '../../types';

export const MATERIALS_KEY = ['materials'] as const;

// unitCost:unit_cost aliases the snake_case DB column to the camelCase
// field types.ts/the views expect, so no separate row-mapping step is needed.
const SELECT = 'id, code, name, stock, unit, unitCost:unit_cost';

export function useMaterialsQuery() {
  return useQuery({
    queryKey: MATERIALS_KEY,
    queryFn: async (): Promise<Material[]> => {
      const { data, error } = await supabase.from('materials').select(SELECT).order('code');
      if (error) throw error;
      return data as unknown as Material[];
    },
  });
}

export async function insertMaterial(input: Omit<Material, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .insert({ code: input.code, name: input.name, stock: input.stock, unit: input.unit, unit_cost: input.unitCost });
  if (error) throw error;
}

export async function updateMaterialRow(id: string, patch: Partial<Omit<Material, 'id'>>): Promise<void> {
  const row: Record<string, unknown> = { ...patch };
  if ('unitCost' in patch) {
    row.unit_cost = patch.unitCost;
    delete row.unitCost;
  }
  const { error } = await supabase.from('materials').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteMaterialRow(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

/** Sets absolute stock (caller computes the new value from cached data — see processRecipe). */
export async function setMaterialStock(id: string, stock: number): Promise<void> {
  const { error } = await supabase.from('materials').update({ stock }).eq('id', id);
  if (error) throw error;
}
