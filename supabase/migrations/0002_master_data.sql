-- Phase 2: products, materials, vendors, recipes/recipe_ingredients, plus a
-- write policy on `stores` for Settings. Run in the Supabase SQL editor after
-- 0001_auth.sql. Safe to re-run from scratch (drops its own objects first).
--
-- Every store_id column defaults to current_store_id() (from 0001_auth.sql),
-- so the client never needs to know or pass its own store id on insert —
-- Postgres fills it in, and the write RLS policy's `with check` still
-- validates it matches the caller's store.

drop table if exists recipe_ingredients cascade;
drop table if exists recipes cascade;
drop table if exists vendors cascade;
drop table if exists materials cascade;
drop table if exists products cascade;
drop policy if exists stores_update on stores;

-- ---------------------------------------------------------------------------
-- products: numeric id (bigint identity) on purpose — the client keys the
-- cart (Cart = Record<number, number>) and sales-order items directly off
-- product ids, so a uuid pk would force changes across the view layer.
-- ---------------------------------------------------------------------------
create table products (
  id bigint generated always as identity primary key,
  store_id uuid not null references stores (id) default current_store_id(),
  code text not null,
  name text not null,
  price numeric not null default 0,
  cat text not null check (cat in ('Beverages', 'Bakery', 'Food', 'Retail')),
  grad text not null default 'linear-gradient(135deg,#8a8a9a,#5a5a6b)',
  initial text not null default '',
  stock numeric not null default 0,
  unit text not null default '',
  description text not null default '',
  unique (store_id, code)
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  code text not null,
  name text not null,
  stock numeric not null default 0,
  unit text not null default '',
  unit_cost numeric not null default 0,
  unique (store_id, code)
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  code text not null,
  name text not null,
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  unique (store_id, code)
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  output_product_id bigint not null references products (id) on delete cascade,
  batch_qty numeric not null default 1
);

-- `position` orders ingredients within a recipe — the client's
-- updateIngredient(recipeId, idx, patch)/removeIngredient operate by array
-- index, so a stable order has to come from the database, not row insertion
-- order (which isn't guaranteed on refetch).
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  material_id uuid not null references materials (id) on delete cascade,
  qty numeric not null default 1,
  position integer not null default 0
);

-- ---------------------------------------------------------------------------
-- RLS. Reads are broad (any signed-in profile in the same store); writes are
-- gated by the permission key the matching view actually checks client-side
-- — materials/recipes use has_perm('bom'), NOT 'inventory' (only products
-- does), matching BomView.tsx's MaterialsTable exactly.
-- ---------------------------------------------------------------------------
alter table products enable row level security;
alter table materials enable row level security;
alter table vendors enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

create policy products_select on products for select using (store_id = current_store_id());
create policy products_write on products for all
  using (store_id = current_store_id() and has_perm('inventory'))
  with check (store_id = current_store_id() and has_perm('inventory'));

create policy materials_select on materials for select using (store_id = current_store_id());
create policy materials_write on materials for all
  using (store_id = current_store_id() and has_perm('bom'))
  with check (store_id = current_store_id() and has_perm('bom'));

create policy vendors_select on vendors for select using (store_id = current_store_id());
create policy vendors_write on vendors for all
  using (store_id = current_store_id() and has_perm('vendor'))
  with check (store_id = current_store_id() and has_perm('vendor'));

create policy recipes_select on recipes for select using (store_id = current_store_id());
create policy recipes_write on recipes for all
  using (store_id = current_store_id() and has_perm('bom'))
  with check (store_id = current_store_id() and has_perm('bom'));

-- recipe_ingredients has no store_id of its own — scope through its parent
-- recipe instead.
create policy recipe_ingredients_select on recipe_ingredients for select
  using (exists (select 1 from recipes r where r.id = recipe_id and r.store_id = current_store_id()));
create policy recipe_ingredients_write on recipe_ingredients for all
  using (
    has_perm('bom')
    and exists (select 1 from recipes r where r.id = recipe_id and r.store_id = current_store_id())
  )
  with check (
    has_perm('bom')
    and exists (select 1 from recipes r where r.id = recipe_id and r.store_id = current_store_id())
  );

-- Phase 1 only added stores_select; Settings needs a write path too.
create policy stores_update on stores for update
  using (id = current_store_id() and has_perm('settings'))
  with check (id = current_store_id() and has_perm('settings'));
