-- Phase 3: purchase requests/orders, sales orders, goods receipts, and the
-- stock-movement ledger move off in-memory state into real tables. Run in
-- the Supabase SQL editor after 0005_images_bucket.sql. Safe to re-run from
-- scratch (drops its own objects first).
--
-- material_code / vendor_code stay plain TEXT columns rather than FKs to
-- materials/vendors: PrTab.tsx/PoTab.tsx bind these to free-text <input>s
-- (not <select>s), so a real FK would reject a save mid-typo instead of
-- just letting the client-side `materials.find(m => m.code === ...)` join
-- come up empty like it already does today. sales_orders.product_id stays a
-- real FK because SellingView.tsx's product field IS a <select> bound to
-- real product ids, so it can never hold an unresolvable value.

drop table if exists movements cascade;
drop table if exists gr_lines cascade;
drop table if exists goods_receipts cascade;
drop table if exists po_schedule cascade;
drop table if exists po_items cascade;
drop table if exists purchase_orders cascade;
drop table if exists so_items cascade;
drop table if exists sales_orders cascade;
drop table if exists pr_items cascade;
drop table if exists purchase_requests cascade;
drop table if exists doc_counters cascade;
drop function if exists next_doc_no(text);
drop function if exists convert_pr_to_po(uuid);
drop function if exists complete_goods_receipt(uuid, jsonb);

-- ---------------------------------------------------------------------------
-- Document numbering: one row per (store, prefix), incremented under a row
-- lock by next_doc_no() so concurrent cashiers/managers never collide.
-- ---------------------------------------------------------------------------
create table doc_counters (
  store_id uuid not null references stores (id) default current_store_id(),
  prefix text not null,
  next_seq integer not null default 1000,
  primary key (store_id, prefix)
);

insert into doc_counters (store_id, prefix, next_seq)
select s.id, d.prefix, d.seq
from stores s, (values ('PR', 1002), ('PO', 2002), ('SO', 3002), ('GR', 4001)) as d(prefix, seq)
on conflict (store_id, prefix) do nothing;

alter table doc_counters enable row level security;
create policy doc_counters_select on doc_counters for select using (store_id = current_store_id());
-- No write policy: only next_doc_no() (SECURITY DEFINER) ever writes here.

create or replace function next_doc_no(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := current_store_id();
  v_seq integer;
begin
  insert into doc_counters (store_id, prefix, next_seq)
  values (v_store_id, p_prefix, 1000)
  on conflict (store_id, prefix) do nothing;

  update doc_counters
  set next_seq = next_seq + 1
  where store_id = v_store_id and prefix = p_prefix
  returning next_seq - 1 into v_seq;

  return p_prefix || '-' || v_seq;
end;
$$;

-- ---------------------------------------------------------------------------
-- Purchase requests
-- ---------------------------------------------------------------------------
create table purchase_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  no text not null default '',
  date date not null default current_date,
  requester text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected', 'converted'))
);

create table pr_items (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid not null references purchase_requests (id) on delete cascade,
  material_code text not null default '',
  qty numeric not null default 1,
  position integer not null default 0
);

alter table purchase_requests enable row level security;
alter table pr_items enable row level security;

create policy purchase_requests_select on purchase_requests for select using (store_id = current_store_id());
-- prApprove alone (without procurement) can still write here — the only
-- writes that matters for that role are the approve/reject transition, and
-- splitting that into its own RPC just to deny it edit access to other
-- fields isn't worth the complexity for what the default role matrix never
-- actually needs (Owner/Manager always have both).
create policy purchase_requests_write on purchase_requests for all
  using (store_id = current_store_id() and (has_perm('procurement') or has_perm('prApprove')))
  with check (store_id = current_store_id() and (has_perm('procurement') or has_perm('prApprove')));

create policy pr_items_select on pr_items for select
  using (exists (select 1 from purchase_requests r where r.id = pr_id and r.store_id = current_store_id()));
create policy pr_items_write on pr_items for all
  using (
    (has_perm('procurement') or has_perm('prApprove'))
    and exists (select 1 from purchase_requests r where r.id = pr_id and r.store_id = current_store_id())
  )
  with check (
    (has_perm('procurement') or has_perm('prApprove'))
    and exists (select 1 from purchase_requests r where r.id = pr_id and r.store_id = current_store_id())
  );

-- ---------------------------------------------------------------------------
-- Purchase orders
-- ---------------------------------------------------------------------------
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  no text not null default '',
  date date not null default current_date,
  po_type text not null default 'noPr' check (po_type in ('fromPr', 'noPr')),
  ref_pr_no text not null default '',
  vendor_code text not null default '',
  status text not null default 'draft' check (status in ('draft', 'ordered', 'received'))
);

create table po_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders (id) on delete cascade,
  material_code text not null default '',
  qty numeric not null default 1,
  price numeric not null default 0,
  position integer not null default 0
);

create table po_schedule (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders (id) on delete cascade,
  material_code text not null default '',
  start_date date not null default current_date,
  delivery_date date not null default current_date,
  schedule_qty numeric not null default 1,
  position integer not null default 0
);

alter table purchase_orders enable row level security;
alter table po_items enable row level security;
alter table po_schedule enable row level security;

create policy purchase_orders_select on purchase_orders for select using (store_id = current_store_id());
create policy purchase_orders_write on purchase_orders for all
  using (store_id = current_store_id() and has_perm('procurement'))
  with check (store_id = current_store_id() and has_perm('procurement'));

create policy po_items_select on po_items for select
  using (exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()));
create policy po_items_write on po_items for all
  using (has_perm('procurement') and exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()))
  with check (has_perm('procurement') and exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()));

create policy po_schedule_select on po_schedule for select
  using (exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()));
create policy po_schedule_write on po_schedule for all
  using (has_perm('procurement') and exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()))
  with check (has_perm('procurement') and exists (select 1 from purchase_orders p where p.id = po_id and p.store_id = current_store_id()));

-- ---------------------------------------------------------------------------
-- Sales orders
-- ---------------------------------------------------------------------------
create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  no text not null default '',
  date date not null default current_date,
  customer text not null default '',
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'fulfilled'))
);

create table so_items (
  id uuid primary key default gen_random_uuid(),
  so_id uuid not null references sales_orders (id) on delete cascade,
  product_id bigint references products (id) on delete set null,
  qty numeric not null default 1,
  position integer not null default 0
);

alter table sales_orders enable row level security;
alter table so_items enable row level security;

create policy sales_orders_select on sales_orders for select using (store_id = current_store_id());
create policy sales_orders_write on sales_orders for all
  using (store_id = current_store_id() and has_perm('procurement'))
  with check (store_id = current_store_id() and has_perm('procurement'));

create policy so_items_select on so_items for select
  using (exists (select 1 from sales_orders s where s.id = so_id and s.store_id = current_store_id()));
create policy so_items_write on so_items for all
  using (has_perm('procurement') and exists (select 1 from sales_orders s where s.id = so_id and s.store_id = current_store_id()))
  with check (has_perm('procurement') and exists (select 1 from sales_orders s where s.id = so_id and s.store_id = current_store_id()));

-- ---------------------------------------------------------------------------
-- Goods receipts — only ever written by complete_goods_receipt() below
-- (SECURITY DEFINER, checks has_perm('procurement') itself), so there is no
-- direct client write policy on either table, only select.
-- ---------------------------------------------------------------------------
create table goods_receipts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  no text not null default '',
  date date not null default current_date,
  po_id uuid references purchase_orders (id) on delete set null
);

create table gr_lines (
  id uuid primary key default gen_random_uuid(),
  gr_id uuid not null references goods_receipts (id) on delete cascade,
  material_code text not null default '',
  ordered numeric not null default 0,
  received numeric not null default 0,
  position integer not null default 0
);

alter table goods_receipts enable row level security;
alter table gr_lines enable row level security;

create policy goods_receipts_select on goods_receipts for select using (store_id = current_store_id());
create policy gr_lines_select on gr_lines for select
  using (exists (select 1 from goods_receipts g where g.id = gr_id and g.store_id = current_store_id()));

-- ---------------------------------------------------------------------------
-- Stock movement ledger — written directly by the client for sales
-- (has_perm('sales')) and BOM processing (has_perm('bom')); goods-receipt
-- movements come from complete_goods_receipt() (SECURITY DEFINER, bypasses
-- this policy entirely).
-- ---------------------------------------------------------------------------
create table movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) default current_store_id(),
  ts timestamptz not null default now(),
  type text not null check (type in ('in', 'out')),
  item text not null,
  qty numeric not null,
  unit text not null default ''
);

alter table movements enable row level security;
create policy movements_select on movements for select using (store_id = current_store_id());
create policy movements_write on movements for insert
  with check (store_id = current_store_id() and (has_perm('sales') or has_perm('bom')));

-- ---------------------------------------------------------------------------
-- RPCs for the two genuinely atomic multi-table actions.
-- ---------------------------------------------------------------------------
create or replace function convert_pr_to_po(p_pr_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := current_store_id();
  v_pr purchase_requests%rowtype;
  v_po_id uuid;
  v_po_no text;
  v_vendor_code text;
begin
  if not has_perm('procurement') then
    raise exception 'not authorized';
  end if;

  select * into v_pr from purchase_requests where id = p_pr_id and store_id = v_store_id;
  if not found then
    raise exception 'purchase request not found';
  end if;

  select code into v_vendor_code from vendors where store_id = v_store_id order by code limit 1;
  v_po_no := next_doc_no('PO');

  insert into purchase_orders (store_id, no, date, po_type, ref_pr_no, vendor_code, status)
  values (v_store_id, v_po_no, current_date, 'fromPr', v_pr.no, coalesce(v_vendor_code, ''), 'ordered')
  returning id into v_po_id;

  insert into po_items (po_id, material_code, qty, price, position)
  select v_po_id, pi.material_code, pi.qty, coalesce(m.unit_cost, 0), pi.position
  from pr_items pi
  left join materials m on m.code = pi.material_code and m.store_id = v_store_id
  where pi.pr_id = p_pr_id;

  update purchase_requests set status = 'converted' where id = p_pr_id;

  return v_po_id;
end;
$$;

create or replace function complete_goods_receipt(p_po_id uuid, p_lines jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := current_store_id();
  v_gr_id uuid;
  v_gr_no text;
  v_line jsonb;
  v_material_code text;
  v_ordered numeric;
  v_received numeric;
  v_material_name text;
  v_material_unit text;
begin
  if not has_perm('procurement') then
    raise exception 'not authorized';
  end if;

  v_gr_no := next_doc_no('GR');

  insert into goods_receipts (store_id, no, date, po_id)
  values (v_store_id, v_gr_no, current_date, p_po_id)
  returning id into v_gr_id;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_material_code := v_line ->> 'materialCode';
    v_ordered := (v_line ->> 'ordered')::numeric;
    v_received := (v_line ->> 'received')::numeric;

    insert into gr_lines (gr_id, material_code, ordered, received)
    values (v_gr_id, v_material_code, v_ordered, v_received);

    if v_received > 0 then
      select name, unit into v_material_name, v_material_unit
      from materials where code = v_material_code and store_id = v_store_id;

      update materials set stock = stock + v_received where code = v_material_code and store_id = v_store_id;

      insert into movements (store_id, ts, type, item, qty, unit)
      values (v_store_id, now(), 'in', coalesce(v_material_name, v_material_code), v_received, coalesce(v_material_unit, ''));
    end if;
  end loop;

  update purchase_orders set status = 'received' where id = p_po_id and store_id = v_store_id;

  return v_gr_id;
end;
$$;
