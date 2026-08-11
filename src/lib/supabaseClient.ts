import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False until `.env` is filled in with real Supabase project values. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// Falls back to placeholder values when unconfigured so createClient itself
// never throws — App.tsx gates the whole app on `isSupabaseConfigured` and
// shows a setup screen instead, so nothing ever actually calls this client
// in that state.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);
