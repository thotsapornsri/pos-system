import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { SalesOrder, SoItem } from '../../types';

export const SALES_ORDERS_KEY = ['salesOrders'] as const;

interface SoItemRow extends SoItem {
  id: string;
}

interface SoRow {
  id: string;
  no: string;
  date: string;
  customer: string;
  status: SalesOrder['status'];
  so_items: SoItemRow[];
}

// itemIds carries the real row ids alongside the public SalesOrder shape —
// SellingView.tsx's updateSoItem/removeSoItem operate by array index.
export type SalesOrderWithIds = SalesOrder & { itemIds: string[] };

const SELECT = 'id, no, date, customer, status, so_items(id, productId:product_id, qty)';

function fromRow(r: SoRow): SalesOrderWithIds {
  return {
    id: r.id,
    no: r.no,
    date: r.date,
    customer: r.customer,
    status: r.status,
    items: r.so_items.map((it) => ({ productId: it.productId, qty: it.qty })),
    itemIds: r.so_items.map((it) => it.id),
  };
}

export function useSalesOrdersQuery() {
  return useQuery({
    queryKey: SALES_ORDERS_KEY,
    queryFn: async (): Promise<SalesOrderWithIds[]> => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(SELECT)
        .order('position', { referencedTable: 'so_items' })
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as SoRow[]).map(fromRow);
    },
  });
}

export async function insertSalesOrder(no: string, customer: string, productId: number): Promise<string> {
  const { data, error } = await supabase.from('sales_orders').insert({ no, customer }).select('id').single();
  if (error) throw error;
  const { error: itemErr } = await supabase.from('so_items').insert({ so_id: data.id, product_id: productId, qty: 1, position: 0 });
  if (itemErr) throw itemErr;
  return data.id as string;
}

export async function updateSalesOrderStatus(id: string, status: SalesOrder['status']): Promise<void> {
  const { error } = await supabase.from('sales_orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function insertSoItem(soId: string, productId: number, position: number): Promise<void> {
  const { error } = await supabase.from('so_items').insert({ so_id: soId, product_id: productId, qty: 1, position });
  if (error) throw error;
}

export async function updateSoItemRow(itemId: string, patch: Partial<SoItem>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.productId !== undefined) row.product_id = patch.productId;
  if (patch.qty !== undefined) row.qty = patch.qty;
  const { error } = await supabase.from('so_items').update(row).eq('id', itemId);
  if (error) throw error;
}

export async function deleteSoItemRow(itemId: string): Promise<void> {
  const { error } = await supabase.from('so_items').delete().eq('id', itemId);
  if (error) throw error;
}
