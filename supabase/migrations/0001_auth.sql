-- Phase 1: stores, profiles, role_permissions, and the RLS helper functions.
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- against your project. Safe to re-run from scratch (e.g. after an earlier
-- attempt failed partway through) — it drops its own objects first.

-- `drop table ... cascade` also drops that table's RLS policies (they're
-- owned by the table) — no need to drop policies separately. `if exists`
-- makes each line a no-op on a truly fresh project where nothing below has
-- been created yet.
drop table if exists role_permissions cascade;
drop table if exists profiles cascade;
drop table if exists stores cascade;
drop function if exists has_perm(text);
drop function if exists app_role();
drop function if exists current_store_id();

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- stores: one row today; store_id is carried on every table added in later
-- phases so multi-branch support (already anticipated by the app's
-- "Multi-Branch Support" feature flag) needs no schema change later.
-- ---------------------------------------------------------------------------
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Brew & Co.',
  business_type text not null default 'Café & Bakery',
  currency text not null default 'THB' check (currency in ('THB', 'USD', 'EUR')),
  tax_rate numeric not null default 7,
  accent text not null default '#10b981',
  feature_flags jsonb not null default '{"inventory":true,"dashboard":true,"payments":true,"loyalty":false,"multiBranch":false}'::jsonb
);

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, holding the app-specific fields that
-- don't belong in Supabase's own auth table (name, role, phone, etc.).
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  store_id uuid not null references stores (id),
  name text not null,
  email text not null,
  phone text not null default '',
  role text not null check (role in ('Owner', 'Manager', 'Cashier', 'Viewer')),
  initials text not null default '',
  grad text not null default 'linear-gradient(135deg,#8a8a9a,#5a5a6b)',
  status text not null default 'active' check (status in ('active', 'inactive')),
  locked boolean not null default false,
  last_active timestamptz not null default now()
);

-- email is duplicated from auth.users onto profiles (rather than joined via a
-- view) on purpose: Supabase does not grant the `authenticated` role SELECT
-- on auth.users, and a view here would run with its postgres-superuser
-- owner's privileges (bypassing RLS on profiles entirely) unless declared
-- `security_invoker` — simpler and safer to just store the email directly.

-- ---------------------------------------------------------------------------
-- role_permissions: one row per (role, permission key). Mirrors
-- PERMISSION_KEYS / DEFAULT_ROLE_PERMS in src/data/seed.ts, editable live from
-- the Users -> Roles screen once Phase 2 wires it up.
-- ---------------------------------------------------------------------------
create table role_permissions (
  store_id uuid not null references stores (id),
  role text not null check (role in ('Owner', 'Manager', 'Cashier', 'Viewer')),
  permission_key text not null,
  allowed boolean not null default false,
  primary key (store_id, role, permission_key)
);

-- ---------------------------------------------------------------------------
-- RLS helper functions. security definer so they can read profiles/
-- role_permissions regardless of the calling row's own RLS grants; kept
-- logically identical to hasPerm() in src/store/PosContext.tsx so the UI
-- never offers an action the API would then reject.
-- ---------------------------------------------------------------------------
create function current_store_id() returns uuid
language sql stable security definer
set search_path = public
as $$
  select store_id from profiles where id = auth.uid();
$$;

-- Named app_role(), not current_role() — that name collides with Postgres's
-- own reserved CURRENT_ROLE syntax and fails with a parse error.
create function app_role() returns text
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function has_perm(p_key text) returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select allowed from role_permissions
      where store_id = current_store_id()
        and role = app_role()
        and permission_key = p_key),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table stores enable row level security;
alter table profiles enable row level security;
alter table role_permissions enable row level security;

create policy stores_select on stores
  for select using (id = current_store_id());

create policy profiles_select on profiles
  for select using (store_id = current_store_id());

-- No self-update policy yet: `using (id = auth.uid())` alone can't stop a
-- user from changing their *own* `role`/`store_id` in the same statement, and
-- there's no self-service profile edit screen to require it for yet. Add a
-- column-scoped self-update policy in Phase 2 alongside that UI instead.
create policy profiles_write_by_owner on profiles
  for all using (store_id = current_store_id() and has_perm('users'))
  with check (store_id = current_store_id() and has_perm('users'));

create policy role_permissions_select on role_permissions
  for select using (store_id = current_store_id());

create policy role_permissions_write_by_owner on role_permissions
  for all using (store_id = current_store_id() and has_perm('users') and app_role() = 'Owner')
  with check (store_id = current_store_id() and has_perm('users') and app_role() = 'Owner');
