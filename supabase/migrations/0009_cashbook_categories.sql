-- Managed categories for cashbook entries (income and expense have their
-- own separate lists), replacing the free-text category field with a
-- proper add/edit/delete list — same idea as the product categories table
-- from 0004_categories.sql. Run in the Supabase SQL editor after
-- 0008_cashbook.sql. Safe to re-run from scratch.

drop table if exists cash_categories cascade;

create table cash_categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  unique (store_id, type, name)
);

-- Backfill from whatever category text already exists on cash_entries, so
-- entries logged before this migration keep a matching category row.
insert into cash_categories (store_id, name, type)
select distinct store_id, category, type from cash_entries
where category <> ''
on conflict (store_id, type, name) do nothing;

alter table cash_categories enable row level security;

create policy cash_categories_select on cash_categories for select using (store_id = current_store_id());
create policy cash_categories_write on cash_categories for all
  using (store_id = current_store_id() and has_perm('cashbook'))
  with check (store_id = current_store_id() and has_perm('cashbook'));
