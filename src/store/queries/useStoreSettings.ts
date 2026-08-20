import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { FeatureKey, StoreSettings } from '../../types';

export const STORE_SETTINGS_KEY = ['stores'] as const;

export interface StoreRow {
  id: string;
  storeSettings: StoreSettings;
  accent: string;
  featureFlags: Record<FeatureKey, boolean>;
}

interface RawStoreRow {
  id: string;
  name: string;
  business_type: string;
  currency: StoreSettings['currency'];
  tax_rate: number;
  accent: string;
  feature_flags: Record<FeatureKey, boolean>;
}

function fromRow(r: RawStoreRow): StoreRow {
  return {
    id: r.id,
    storeSettings: { name: r.name, businessType: r.business_type, currency: r.currency, taxRate: r.tax_rate },
    accent: r.accent,
    featureFlags: r.feature_flags,
  };
}

export function useStoreSettingsQuery() {
  return useQuery({
    queryKey: STORE_SETTINGS_KEY,
    queryFn: async (): Promise<StoreRow> => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, business_type, currency, tax_rate, accent, feature_flags')
        .single();
      if (error) throw error;
      return fromRow(data as RawStoreRow);
    },
  });
}

export async function updateStoreSettingsRow(id: string, patch: StoreSettings): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ name: patch.name, business_type: patch.businessType, currency: patch.currency, tax_rate: patch.taxRate })
    .eq('id', id);
  if (error) throw error;
}

/** Optimistic: the accent swatch click should feel instant. */
export function useUpdateAccentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accent }: { id: string; accent: string }) => {
      const { error } = await supabase.from('stores').update({ accent }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ accent }) => {
      await qc.cancelQueries({ queryKey: STORE_SETTINGS_KEY });
      qc.setQueryData<StoreRow>(STORE_SETTINGS_KEY, (prev) => (prev ? { ...prev, accent } : prev));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: STORE_SETTINGS_KEY }),
  });
}

/** Optimistic: each feature is a toggle switch. */
export function useToggleFeatureMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, key, value, flags }: { id: string; key: FeatureKey; value: boolean; flags: Record<FeatureKey, boolean> }) => {
      const { error } = await supabase.from('stores').update({ feature_flags: { ...flags, [key]: value } }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      await qc.cancelQueries({ queryKey: STORE_SETTINGS_KEY });
      qc.setQueryData<StoreRow>(STORE_SETTINGS_KEY, (prev) =>
        prev ? { ...prev, featureFlags: { ...prev.featureFlags, [key]: value } } : prev,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: STORE_SETTINGS_KEY }),
  });
}
