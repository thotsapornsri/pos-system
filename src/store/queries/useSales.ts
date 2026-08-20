import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export const SALES_KEY = ['sales'] as const;

export interface SaleItem {
  productId: number | null;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  ref: string;
  cashierName: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  items: SaleItem[];
}

interface SaleRow {
  id: string;
  ref: string;
  cashierName: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  sale_items: SaleItem[];
}

const SELECT =
  'id, ref, cashierName:cashier_name, paymentMethod:payment_method, subtotal, tax, total, createdAt:created_at, ' +
  'sale_items(productId:product_id, productName:product_name, qty, unitPrice:unit_price, lineTotal:line_total)';

// Newest first, no extra range filter yet — PostgREST's own default row cap
// (1000) is far beyond what a single café POS needs for the foreseeable
// future. Revisit with a date-range filter if that ever changes.
export function useSalesQuery() {
  return useQuery({
    queryKey: SALES_KEY,
    queryFn: async (): Promise<Sale[]> => {
      const { data, error } = await supabase.from('sales').select(SELECT).order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as SaleRow[]).map((r) => ({
        id: r.id,
        ref: r.ref,
        cashierName: r.cashierName,
        paymentMethod: r.paymentMethod,
        subtotal: r.subtotal,
        tax: r.tax,
        total: r.total,
        createdAt: r.createdAt,
        items: r.sale_items,
      }));
    },
  });
}

export async function insertSale(input: {
  ref: string;
  cashierName: string;
  paymentMethod: 'cash' | 'card' | 'bank';
  subtotal: number;
  tax: number;
  total: number;
  items: { productId: number; productName: string; qty: number; unitPrice: number; lineTotal: number }[];
}): Promise<void> {
  const { data, error } = await supabase
    .from('sales')
    .insert({
      ref: input.ref,
      cashier_name: input.cashierName,
      payment_method: input.paymentMethod,
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.total,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: itemsErr } = await supabase.from('sale_items').insert(
    input.items.map((it) => ({
      sale_id: data.id,
      product_id: it.productId,
      product_name: it.productName,
      qty: it.qty,
      unit_price: it.unitPrice,
      line_total: it.lineTotal,
    })),
  );
  if (itemsErr) throw itemsErr;
}
