import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import type { User } from '../../types';

export const PROFILES_KEY = ['profiles'] as const;

const SELECT = 'id, name, email, phone, role, initials, grad, status, locked, last_active';

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  initials: string;
  grad: string;
  status: User['status'];
  locked: boolean;
  last_active: string;
}

function fromRow(r: ProfileRow): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    initials: r.initials,
    grad: r.grad,
    status: r.status,
    locked: r.locked,
    // Real timestamp now (was a static demo string like "12m ago" before);
    // shown as a plain locale date/time rather than a relative string.
    lastActive: new Date(r.last_active).toLocaleString(),
  };
}

export function useProfilesQuery() {
  return useQuery({
    queryKey: PROFILES_KEY,
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select(SELECT).order('name');
      if (error) throw error;
      return (data as unknown as ProfileRow[]).map(fromRow);
    },
  });
}

/** name/phone/role only — email isn't editable here (see CrudModal), and
 * "Add User" isn't wired at all: a profiles row's id must reference an
 * existing auth.users row, which only Supabase's admin API can create. */
export async function updateProfileRow(id: string, patch: Partial<Pick<User, 'name' | 'phone' | 'role'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

/** Removes the profiles row only — the underlying auth.users login isn't
 * touched (deleting that needs the same admin API); signing in afterward
 * hits PosContext's "no profile found" path and is auto signed out. */
export async function deleteProfileRow(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
}
