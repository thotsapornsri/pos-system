-- Daily income/expense ledger ("cashbook") — a manual log for money in/out
-- that isn't already captured by POS checkout (sales) or purchasing
-- (purchase_orders/goods_receipts), e.g. rent, utilities, wages, misc cash
-- income. Also gives Dashboard's "opex" a real number instead of always 0.
-- Run in the Supabase SQL editor after 0007_public_branding.sql. Safe to
-- re-run from scratch (drops its own objects first).
--
-- Gated by a new 'cashbook' permission key. Existing role_permissions rows
-- won't have this key yet, so every role (including Owner) starts denied
-- until the Owner explicitly turns it on for the relevant roles from
-- Users -> Roles — role_permissions is keyed by (store_id, role,
-- permission_key) text, not an array index, so adding a new key here is
-- additive and doesn't disturb any existing row.

drop table if exists cash_entries cascade;

create table cash_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  date date not null default current_date,
  type text not null check (type in ('income', 'expense')),
  category text not null default '',
  note text not null default '',
  amount numeric not null check (amount >= 0),
  created_by text not null default '',
  created_at timestamptz not null default now()
);

alter table cash_entries enable row level security;

create policy cash_entries_select on cash_entries for select using (store_id = current_store_id());
create policy cash_entries_write on cash_entries for all
  using (store_id = current_store_id() and has_perm('cashbook'))
  with check (store_id = current_store_id() and has_perm('cashbook'));
