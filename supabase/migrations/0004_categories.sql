-- Product categories become dynamic (create/rename/hide), replacing the four
-- hardcoded values products.cat used to be locked to. Run in the Supabase
-- SQL editor after 0003_sales.sql. Safe to re-run from scratch (drops its
-- own objects first).
--
-- Categories are soft-linked to products by name (same pattern PR/PO line
-- items already use for materialCode) rather than a foreign key, so renaming
-- a category is a two-step client operation: update the category row, then
-- cascade the new name onto every product still tagged with the old one.

drop table if exists categories cascade;

create table categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  name text not null,
  visible boolean not null default true,
  position integer not null default 0,
  unique (store_id, name)
);

-- Backfill from whatever category names already exist on products, so
-- existing catalogs keep working (as visible filter chips) immediately
-- after this migration runs, with no manual re-entry required.
insert into categories (store_id, name, visible, position)
select distinct store_id, cat, true, 0 from products
on conflict (store_id, name) do nothing;

alter table products drop constraint if exists products_cat_check;

alter table categories enable row level security;

create policy categories_select on categories for select using (store_id = current_store_id());
create policy categories_write on categories for all
  using (store_id = current_store_id() and has_perm('inventory'))
  with check (store_id = current_store_id() and has_perm('inventory'));
