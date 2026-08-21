import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { GoodsReceipt, GrLine } from '../../types';

export const GOODS_RECEIPTS_KEY = ['goodsReceipts'] as const;

interface GrRow {
  id: string;
  no: string;
  date: string;
  poId: string | null;
  gr_lines: GrLine[];
}

const SELECT = 'id, no, date, poId:po_id, gr_lines(materialCode:material_code, ordered, received)';

function fromRow(r: GrRow): GoodsReceipt {
  return { id: r.id, no: r.no, date: r.date, poId: r.poId ?? '', lines: r.gr_lines };
}

export function useGoodsReceiptsQuery() {
  return useQuery({
    queryKey: GOODS_RECEIPTS_KEY,
    queryFn: async (): Promise<GoodsReceipt[]> => {
      const { data, error } = await supabase.from('goods_receipts').select(SELECT).order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as GrRow[]).map(fromRow);
    },
  });
}

/** Only mutation path for goods receipts — everything (numbering, stock
 * bump, movement log, marking the PO received) happens atomically inside
 * the complete_goods_receipt() RPC. */
export async function completeGoodsReceiptRpc(poId: string, lines: GrLine[]): Promise<void> {
  const { error } = await supabase.rpc('complete_goods_receipt', {
    p_po_id: poId,
    p_lines: lines.map((l) => ({ materialCode: l.materialCode, ordered: l.ordered, received: l.received })),
  });
  if (error) throw error;
}
