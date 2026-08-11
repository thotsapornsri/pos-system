-- Run this AFTER 0001_auth.sql, once, in the Supabase SQL editor.
-- The SQL editor runs as the postgres superuser, so these inserts bypass the
-- RLS policies from 0001_auth.sql — that's expected and is how you break the
-- chicken-and-egg problem of "no profile exists yet to grant itself access".

-- 1) One store row, matching the current storeSettings default in
--    src/store/PosContext.tsx (Brew & Co. / Café & Bakery / THB / 7%).
insert into stores (id, name, business_type, currency, tax_rate, accent)
values ('00000000-0000-0000-0000-000000000001', 'Brew & Co.', 'Café & Bakery', 'THB', 7, '#10b981');

-- 2) role_permissions, mirroring PERMISSION_KEYS / DEFAULT_ROLE_PERMS in
--    src/data/seed.ts exactly (same 12 keys, same per-role booleans).
insert into role_permissions (store_id, role, permission_key, allowed)
select '00000000-0000-0000-0000-000000000001', role, key, allowed
from (values
  -- Owner: everything on
  ('Owner', 'sales', true), ('Owner', 'orders', true), ('Owner', 'inventory', true),
  ('Owner', 'bom', true), ('Owner', 'dashboard', true), ('Owner', 'users', true),
  ('Owner', 'settings', true), ('Owner', 'reports', true), ('Owner', 'salesReport', true),
  ('Owner', 'procurement', true), ('Owner', 'vendor', true), ('Owner', 'prApprove', true),
  -- Manager: everything except users + settings
  ('Manager', 'sales', true), ('Manager', 'orders', true), ('Manager', 'inventory', true),
  ('Manager', 'bom', true), ('Manager', 'dashboard', true), ('Manager', 'users', false),
  ('Manager', 'settings', false), ('Manager', 'reports', true), ('Manager', 'salesReport', true),
  ('Manager', 'procurement', true), ('Manager', 'vendor', true), ('Manager', 'prApprove', true),
  -- Cashier: sales + orders + salesReport only
  ('Cashier', 'sales', true), ('Cashier', 'orders', true), ('Cashier', 'inventory', false),
  ('Cashier', 'bom', false), ('Cashier', 'dashboard', false), ('Cashier', 'users', false),
  ('Cashier', 'settings', false), ('Cashier', 'reports', false), ('Cashier', 'salesReport', true),
  ('Cashier', 'procurement', false), ('Cashier', 'vendor', false), ('Cashier', 'prApprove', false),
  -- Viewer: dashboard + reports only
  ('Viewer', 'sales', false), ('Viewer', 'orders', false), ('Viewer', 'inventory', false),
  ('Viewer', 'bom', false), ('Viewer', 'dashboard', true), ('Viewer', 'users', false),
  ('Viewer', 'settings', false), ('Viewer', 'reports', true), ('Viewer', 'salesReport', false),
  ('Viewer', 'procurement', false), ('Viewer', 'vendor', false), ('Viewer', 'prApprove', false)
) as v(role, key, allowed);

-- 3) The first Owner account. Two manual steps first, in the Supabase
--    dashboard (Authentication -> Users -> Add user):
--      a. Create a user with your email + a password. Untick "Auto confirm
--         email" only if you also plan to set up an SMTP provider; otherwise
--         leave it ticked so you can sign in immediately.
--      b. Copy the new user's UUID (shown in the users table).
--    Then replace <PASTE-AUTH-USER-UUID-HERE> and <YOUR-EMAIL> below (the
--    email must match what you typed in step a) and run just this insert.
--
-- insert into profiles (id, store_id, name, email, role, initials)
-- values ('<PASTE-AUTH-USER-UUID-HERE>', '00000000-0000-0000-0000-000000000001', 'Alex Rivera', '<YOUR-EMAIL>', 'Owner', 'AR');
