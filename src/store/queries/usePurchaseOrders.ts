import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { PoItem, PoScheduleLine, PurchaseOrder } from '../../types';

export const PURCHASE_ORDERS_KEY = ['purchaseOrders'] as const;

interface PoItemRow extends PoItem {
  id: string;
}
interface PoScheduleRow extends PoScheduleLine {
  id: string;
}

interface PoRow {
  id: string;
  no: string;
  date: string;
  poType: PurchaseOrder['poType'];
  refPrNo: string;
  vendorCode: string;
  status: PurchaseOrder['status'];
  po_items: PoItemRow[];
  po_schedule: PoScheduleRow[];
}

// itemIds/scheduleIds carry the real row ids alongside the public
// PurchaseOrder shape, same idx→id resolution pattern useRecipes.ts uses —
// PoTab.tsx's update/remove actions operate by array index.
export type PurchaseOrderWithIds = PurchaseOrder & { itemIds: string[]; scheduleIds: string[] };

const SELECT =
  'id, no, date, poType:po_type, refPrNo:ref_pr_no, vendorCode:vendor_code, status, ' +
  'po_items(id, materialCode:material_code, qty, price), ' +
  'po_schedule(id, materialCode:material_code, startDate:start_date, deliveryDate:delivery_date, scheduleQty:schedule_qty)';

function fromRow(r: PoRow): PurchaseOrderWithIds {
  return {
    id: r.id,
    no: r.no,
    date: r.date,
    poType: r.poType,
    refPrNo: r.refPrNo,
    vendorCode: r.vendorCode,
    status: r.status,
    items: r.po_items.map((it) => ({ materialCode: it.materialCode, qty: it.qty, price: it.price })),
    schedule: r.po_schedule.map((sc) => ({
      materialCode: sc.materialCode,
      startDate: sc.startDate,
      deliveryDate: sc.deliveryDate,
      scheduleQty: sc.scheduleQty,
    })),
    itemIds: r.po_items.map((it) => it.id),
    scheduleIds: r.po_schedule.map((sc) => sc.id),
  };
}

export function usePurchaseOrdersQuery() {
  return useQuery({
    queryKey: PURCHASE_ORDERS_KEY,
    queryFn: async (): Promise<PurchaseOrderWithIds[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(SELECT)
        .order('position', { referencedTable: 'po_items' })
        .order('position', { referencedTable: 'po_schedule' })
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as PoRow[]).map(fromRow);
    },
  });
}

export async function insertPurchaseOrder(vendorCode: string, materialCode: string, price: number): Promise<string> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({ po_type: 'noPr', vendor_code: vendorCode })
    .select('id')
    .single();
  if (error) throw error;
  const { error: itemErr } = await supabase
    .from('po_items')
    .insert({ po_id: data.id, material_code: materialCode, qty: 1, price, position: 0 });
  if (itemErr) throw itemErr;
  return data.id as string;
}

export async function updatePurchaseOrderRow(
  id: string,
  patch: Partial<Pick<PurchaseOrder, 'date' | 'no' | 'poType' | 'refPrNo' | 'vendorCode' | 'status'>>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.no !== undefined) row.no = patch.no;
  if (patch.poType !== undefined) row.po_type = patch.poType;
  if (patch.refPrNo !== undefined) row.ref_pr_no = patch.refPrNo;
  if (patch.vendorCode !== undefined) row.vendor_code = patch.vendorCode;
  if (patch.status !== undefined) row.status = patch.status;
  const { error } = await supabase.from('purchase_orders').update(row).eq('id', id);
  if (error) throw error;
}

export async function insertPoItem(poId: string, materialCode: string, price: number, position: number): Promise<void> {
  const { error } = await supabase.from('po_items').insert({ po_id: poId, material_code: materialCode, qty: 1, price, position });
  if (error) throw error;
}

export async function updatePoItemRow(itemId: string, patch: Partial<PoItem>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.materialCode !== undefined) row.material_code = patch.materialCode;
  if (patch.qty !== undefined) row.qty = patch.qty;
  if (patch.price !== undefined) row.price = patch.price;
  const { error } = await supabase.from('po_items').update(row).eq('id', itemId);
  if (error) throw error;
}

export async function deletePoItemRow(itemId: string): Promise<void> {
  const { error } = await supabase.from('po_items').delete().eq('id', itemId);
  if (error) throw error;
}

export async function insertPoSchedule(poId: string, materialCode: string, position: number): Promise<void> {
  const { error } = await supabase.from('po_schedule').insert({ po_id: poId, material_code: materialCode, position });
  if (error) throw error;
}

export async function updatePoScheduleRow(scheduleId: string, patch: Partial<PoScheduleLine>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.materialCode !== undefined) row.material_code = patch.materialCode;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.deliveryDate !== undefined) row.delivery_date = patch.deliveryDate;
  if (patch.scheduleQty !== undefined) row.schedule_qty = patch.scheduleQty;
  const { error } = await supabase.from('po_schedule').update(row).eq('id', scheduleId);
  if (error) throw error;
}

export async function deletePoScheduleRow(scheduleId: string): Promise<void> {
  const { error } = await supabase.from('po_schedule').delete().eq('id', scheduleId);
  if (error) throw error;
}
