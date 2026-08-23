-- Recovery migration: current_store_id() (and likely app_role()/has_perm()
-- alongside it) went missing from the live database somehow, even though
-- 0001_auth.sql was run successfully months ago and every later migration
-- has depended on it since. Root cause unknown — but recovering it must NOT
-- re-run 0001_auth.sql's `drop table ... cascade` on stores/profiles/
-- role_permissions, which would destroy real production data (store
-- settings, staff accounts, the permission matrix).
--
-- `create or replace function` only touches these three functions — no
-- table is dropped or altered. Safe to run anytime, including now.

create or replace function current_store_id() returns uuid
language sql stable security definer
set search_path = public
as $$
  select store_id from profiles where id = auth.uid();
$$;

create or replace function app_role() returns text
language sql stable security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function has_perm(p_key text) returns boolean
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
