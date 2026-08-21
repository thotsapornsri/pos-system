import { supabase } from '../../lib/supabaseClient';

/** Server-side sequence per (store, prefix) — a row lock inside the SQL
 * function serializes concurrent cashiers/managers, which a client-side
 * counter never could. */
export async function nextDocNo(prefix: 'PR' | 'PO' | 'SO' | 'GR'): Promise<string> {
  const { data, error } = await supabase.rpc('next_doc_no', { p_prefix: prefix });
  if (error) throw error;
  return data as string;
}
