import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PERMISSION_KEYS, ROLE_NAMES } from '../../data/seed';
import { supabase } from '../../lib/supabaseClient';
import type { RoleName, RolePermissions } from '../../types';

export const ROLE_PERMISSIONS_KEY = ['role_permissions'] as const;

interface RolePermissionRow {
  role: RoleName;
  permission_key: string;
  allowed: boolean;
}

function emptyMatrix(): RolePermissions {
  return {
    Owner: PERMISSION_KEYS.map(() => false),
    Manager: PERMISSION_KEYS.map(() => false),
    Cashier: PERMISSION_KEYS.map(() => false),
    Viewer: PERMISSION_KEYS.map(() => false),
  };
}

function fromRows(rows: RolePermissionRow[]): RolePermissions {
  const matrix = emptyMatrix();
  for (const row of rows) {
    const idx = PERMISSION_KEYS.indexOf(row.permission_key as (typeof PERMISSION_KEYS)[number]);
    if (idx >= 0 && ROLE_NAMES.includes(row.role)) matrix[row.role][idx] = row.allowed;
  }
  return matrix;
}

export function useRolePermissionsQuery() {
  return useQuery({
    queryKey: ROLE_PERMISSIONS_KEY,
    queryFn: async (): Promise<RolePermissions> => {
      const { data, error } = await supabase.from('role_permissions').select('role, permission_key, allowed');
      if (error) throw error;
      return fromRows(data as RolePermissionRow[]);
    },
  });
}

/** Optimistic: this is a toggle switch, so the flip must feel instant. */
export function useToggleRolePermMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storeId,
      role,
      idx,
      allowed,
    }: {
      storeId: string;
      role: RoleName;
      idx: number;
      allowed: boolean;
    }) => {
      // store_id has no column default on this table (it predates the
      // default-current_store_id() pattern the Phase 2 tables use), so it
      // must be supplied explicitly or the upsert's insert path sends NULL
      // and RLS rejects it.
      const { error } = await supabase
        .from('role_permissions')
        .upsert(
          { store_id: storeId, role, permission_key: PERMISSION_KEYS[idx], allowed },
          { onConflict: 'store_id,role,permission_key' },
        );
      if (error) throw error;
    },
    onMutate: async ({ role, idx, allowed }) => {
      await qc.cancelQueries({ queryKey: ROLE_PERMISSIONS_KEY });
      qc.setQueryData<RolePermissions>(ROLE_PERMISSIONS_KEY, (prev) => {
        if (!prev) return prev;
        const next = { ...prev, [role]: [...prev[role]] };
        next[role][idx] = allowed;
        return next;
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ROLE_PERMISSIONS_KEY }),
  });
}
