-- Recovery migration: current_store_id() (and likely app_role()/has_perm()
-- alongside it) failed to (re)create with "relation does not exist" even
-- though the app itself works fine — login, products, sales all intact.
-- That means the tables are fine and this was a search_path issue in the
-- SQL Editor session at CREATE-time, not missing data: `set search_path =
-- public` inside a function body only applies when the function *runs*,
-- not while Postgres is compiling/validating it, so an unqualified
-- `profiles` reference resolves against the *calling session's* search_path
-- at creation time. Every table reference below is now schema-qualified
-- (`public.profiles`, `public.role_permissions`) so this can't happen
-- regardless of the session's search_path.
--
-- `create or replace function` only touches these three functions — no
-- table is dropped or altered. Safe to run anytime, including now.

create or replace function current_store_id() returns uuid
language sql stable security definer
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid();
$$;

create or replace function app_role() returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function has_perm(p_key text) returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select allowed from public.role_permissions
      where store_id = current_store_id()
        and role = app_role()
        and permission_key = p_key),
    false
  );
$$;
