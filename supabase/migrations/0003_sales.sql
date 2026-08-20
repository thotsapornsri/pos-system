-- Phase: real sales history, so Dashboard/Reports can compute from actual
-- transactions instead of the hardcoded demo numbers in data/seed.ts. Run in
-- the Supabase SQL editor after 0002_master_data.sql. Safe to re-run from
-- scratch (drops its own objects first).
--
-- Sales are an append-only audit trail: no update policy, and delete is
-- intentionally left to the Owner only (correcting a mis-rung sale should be
-- rare and deliberate, not silently editable by any cashier).

drop table if exists sale_items cascade;
drop table if exists sales cascade;

create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  ref text not null,
  cashier_name text not null default '',
  payment_method text not null check (payment_method in ('cash', 'card', 'bank')),
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  created_at timestamptz not null default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id bigint references products (id) on delete set null,
  product_name text not null,
  qty numeric not null,
  unit_price numeric not null,
  line_total numeric not null
);

alter table sales enable row level security;
alter table sale_items enable row level security;

create policy sales_select on sales for select using (store_id = current_store_id());
create policy sales_insert on sales for insert
  with check (store_id = current_store_id() and has_perm('sales'));
create policy sales_delete on sales for delete
  using (store_id = current_store_id() and app_role() = 'Owner');

-- sale_items has no store_id of its own — scope through its parent sale.
create policy sale_items_select on sale_items for select
  using (exists (select 1 from sales s where s.id = sale_id and s.store_id = current_store_id()));
create policy sale_items_insert on sale_items for insert
  with check (
    has_perm('sales')
    and exists (select 1 from sales s where s.id = sale_id and s.store_id = current_store_id())
  );
create policy sale_items_delete on sale_items for delete
  using (
    app_role() = 'Owner'
    and exists (select 1 from sales s where s.id = sale_id and s.store_id = current_store_id())
  );
