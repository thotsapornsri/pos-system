import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Owner-only: invites a new staff member by email (they set their own
 * password via the emailed link) and creates the matching `profiles` row.
 *
 * This function is the actual trust boundary for account creation — it holds
 * the Supabase service-role key (server-only env var, never shipped to the
 * client bundle) and re-derives "is this caller really an Owner?" from their
 * own JWT + profiles row on every call, rather than trusting anything the
 * client claims about itself.
 */

const VALID_ROLES = ['Owner', 'Manager', 'Cashier', 'Viewer'] as const;
type RoleName = (typeof VALID_ROLES)[number];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('invite-user: missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    res.status(500).json({ error: 'Server is not configured for invites yet.' });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header.' });
    return;
  }

  const { email, name, phone, role } = (req.body ?? {}) as {
    email?: string;
    name?: string;
    phone?: string;
    role?: string;
  };
  if (!email || !name || !role) {
    res.status(400).json({ error: 'email, name, and role are required.' });
    return;
  }
  if (!VALID_ROLES.includes(role as RoleName)) {
    res.status(400).json({ error: `role must be one of ${VALID_ROLES.join(', ')}.` });
    return;
  }

  // Service-role client: bypasses RLS entirely, so every check below is done
  // explicitly in code rather than relying on the database to reject bad calls.
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerData, error: callerErr } = await supabase.auth.getUser(token);
  if (callerErr || !callerData.user) {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }

  const { data: callerProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('role, store_id')
    .eq('id', callerData.user.id)
    .maybeSingle();
  if (profileErr || !callerProfile || callerProfile.role !== 'Owner') {
    res.status(403).json({ error: 'Only the Owner can invite new users.' });
    return;
  }

  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email);
  if (inviteErr || !invited.user) {
    res.status(400).json({ error: inviteErr?.message ?? 'Could not send the invite.' });
    return;
  }

  const { error: insertErr } = await supabase.from('profiles').insert({
    id: invited.user.id,
    store_id: callerProfile.store_id,
    name,
    email,
    phone: phone ?? '',
    role,
    initials: initialsOf(name),
    grad: 'linear-gradient(135deg,#8a8a9a,#5a5a6b)',
  });
  if (insertErr) {
    // Don't leave an auth.users row with no matching profile — that's the
    // exact broken "signed in but no profile" state PosContext already
    // handles for other cases, but better to just not create it here.
    await supabase.auth.admin.deleteUser(invited.user.id);
    res.status(500).json({ error: `Invite sent but failed to save the profile: ${insertErr.message}` });
    return;
  }

  res.status(200).json({ id: invited.user.id, email, name, role });
}
