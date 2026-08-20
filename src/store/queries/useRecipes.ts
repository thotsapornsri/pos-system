import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { Ingredient, Recipe } from '../../types';

export const RECIPES_KEY = ['recipes'] as const;

interface IngredientRow {
  id: string;
  materialId: string;
  qty: number;
}

interface RecipeRow {
  id: string;
  outputProductId: number;
  batchQty: number;
  recipe_ingredients: IngredientRow[];
}

// recipe_ingredients(...) is a nested/embedded select (PostgREST follows the
// FK to recipes automatically); ordering it needs `foreignTable`, not a
// plain .order() call. `ingredientId` is carried through for
// add/remove/update-by-id but stripped before handing Ingredient[] to views.
const SELECT = 'id, outputProductId:output_product_id, batchQty:batch_qty, recipe_ingredients(id, materialId:material_id, qty)';

function fromRow(r: RecipeRow): Recipe & { ingredientIds: string[] } {
  return {
    id: r.id,
    outputProductId: r.outputProductId,
    batchQty: r.batchQty,
    ingredients: r.recipe_ingredients.map((i): Ingredient => ({ materialId: i.materialId, qty: i.qty })),
    ingredientIds: r.recipe_ingredients.map((i) => i.id),
  };
}

export function useRecipesQuery() {
  return useQuery({
    queryKey: RECIPES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(SELECT)
        .order('position', { referencedTable: 'recipe_ingredients' });
      if (error) throw error;
      return (data as unknown as RecipeRow[]).map(fromRow);
    },
  });
}

export async function insertRecipe(outputProductId: number, materialId: string): Promise<void> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({ output_product_id: outputProductId, batch_qty: 1 })
    .select('id')
    .single();
  if (error) throw error;
  const { error: ingErr } = await supabase
    .from('recipe_ingredients')
    .insert({ recipe_id: data.id, material_id: materialId, qty: 1, position: 0 });
  if (ingErr) throw ingErr;
}

export async function deleteRecipeRow(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function insertIngredient(recipeId: string, materialId: string, position: number): Promise<void> {
  const { error } = await supabase
    .from('recipe_ingredients')
    .insert({ recipe_id: recipeId, material_id: materialId, qty: 1, position });
  if (error) throw error;
}

export async function deleteIngredientRow(ingredientId: string): Promise<void> {
  const { error } = await supabase.from('recipe_ingredients').delete().eq('id', ingredientId);
  if (error) throw error;
}

/** Optimistic: BomView calls this on every batchQty/outputProductId keystroke, so the cache is patched immediately. */
export function useUpdateRecipeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Recipe, 'outputProductId' | 'batchQty'>> }) => {
      const row: Record<string, unknown> = {};
      if (patch.outputProductId !== undefined) row.output_product_id = patch.outputProductId;
      if (patch.batchQty !== undefined) row.batch_qty = patch.batchQty;
      const { error } = await supabase.from('recipes').update(row).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: RECIPES_KEY });
      qc.setQueryData<ReturnType<typeof fromRow>[]>(RECIPES_KEY, (prev) =>
        prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RECIPES_KEY }),
  });
}

/** Optimistic: BomView calls this on every ingredient materialId/qty keystroke. */
export function useUpdateIngredientMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipeId,
      idx,
      patch,
    }: {
      recipeId: string;
      idx: number;
      patch: Partial<Ingredient>;
    }) => {
      const recipes = qc.getQueryData<ReturnType<typeof fromRow>[]>(RECIPES_KEY);
      const ingredientId = recipes?.find((r) => r.id === recipeId)?.ingredientIds[idx];
      if (!ingredientId) return;
      const row: Record<string, unknown> = {};
      if (patch.materialId !== undefined) row.material_id = patch.materialId;
      if (patch.qty !== undefined) row.qty = patch.qty;
      const { error } = await supabase.from('recipe_ingredients').update(row).eq('id', ingredientId);
      if (error) throw error;
    },
    onMutate: async ({ recipeId, idx, patch }) => {
      await qc.cancelQueries({ queryKey: RECIPES_KEY });
      qc.setQueryData<ReturnType<typeof fromRow>[]>(RECIPES_KEY, (prev) =>
        prev?.map((r) =>
          r.id === recipeId
            ? { ...r, ingredients: r.ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)) }
            : r,
        ),
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RECIPES_KEY }),
  });
}
