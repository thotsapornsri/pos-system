import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { PrItem, PurchaseRequest } from '../../types';

export const PURCHASE_REQUESTS_KEY = ['purchaseRequests'] as const;

interface PrItemRow extends PrItem {
  id: string;
}

interface PrRow {
  id: string;
  no: string;
  date: string;
  requester: string;
  status: PurchaseRequest['status'];
  pr_items: PrItemRow[];
}

// `itemIds` is carried alongside the public PurchaseRequest shape so
// PosContext can resolve an item's array index back to its real row id for
// update/delete — the same pattern useRecipes.ts uses for ingredients,
// needed because PrTab.tsx's updatePrItem/removePrItem operate by index.
export type PurchaseRequestWithIds = PurchaseRequest & { itemIds: string[] };

const SELECT = 'id, no, date, requester, status, pr_items(id, materialCode:material_code, qty)';

function fromRow(r: PrRow): PurchaseRequestWithIds {
  return {
    id: r.id,
    no: r.no,
    date: r.date,
    requester: r.requester,
    status: r.status,
    items: r.pr_items.map((it) => ({ materialCode: it.materialCode, qty: it.qty })),
    itemIds: r.pr_items.map((it) => it.id),
  };
}

export function usePurchaseRequestsQuery() {
  return useQuery({
    queryKey: PURCHASE_REQUESTS_KEY,
    queryFn: async (): Promise<PurchaseRequestWithIds[]> => {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(SELECT)
        .order('position', { referencedTable: 'pr_items' })
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as PrRow[]).map(fromRow);
    },
  });
}

export async function insertPurchaseRequest(requester: string, materialCode: string): Promise<string> {
  const { data, error } = await supabase.from('purchase_requests').insert({ requester }).select('id').single();
  if (error) throw error;
  const { error: itemErr } = await supabase.from('pr_items').insert({ pr_id: data.id, material_code: materialCode, qty: 1, position: 0 });
  if (itemErr) throw itemErr;
  return data.id as string;
}

export async function updatePurchaseRequestRow(id: string, patch: Partial<Pick<PurchaseRequest, 'date' | 'no' | 'status'>>): Promise<void> {
  const { error } = await supabase.from('purchase_requests').update(patch).eq('id', id);
  if (error) throw error;
}

export async function insertPrItem(prId: string, materialCode: string, position: number): Promise<void> {
  const { error } = await supabase.from('pr_items').insert({ pr_id: prId, material_code: materialCode, qty: 1, position });
  if (error) throw error;
}

export async function updatePrItemRow(itemId: string, patch: Partial<PrItem>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.materialCode !== undefined) row.material_code = patch.materialCode;
  if (patch.qty !== undefined) row.qty = patch.qty;
  const { error } = await supabase.from('pr_items').update(row).eq('id', itemId);
  if (error) throw error;
}

export async function deletePrItemRow(itemId: string): Promise<void> {
  const { error } = await supabase.from('pr_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function convertPrToPoRpc(prId: string): Promise<void> {
  const { error } = await supabase.rpc('convert_pr_to_po', { p_pr_id: prId });
  if (error) throw error;
}
