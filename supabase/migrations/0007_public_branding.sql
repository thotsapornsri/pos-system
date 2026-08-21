-- The Login page shows the store's own name and logo before anyone signs
-- in, but both reads were scoped by current_store_id() (derived from the
-- caller's own profile row) — which is null pre-auth, since there's no
-- session yet. So `stores_select`/`images_select` denied both reads
-- entirely, and the Login page silently fell back to a blank name and a
-- placeholder logo, which reappeared correctly only after logging in.
--
-- This app is single-tenant per Supabase project (exactly one `stores`
-- row in practice), and neither the store's name/settings nor its logo
-- file are sensitive — so open both reads up to the public (anon) role
-- instead of requiring auth. Run in the Supabase SQL editor after
-- 0006_purchasing.sql.
--
-- If multi-store support is ever added, this needs revisiting — a fully
-- public policy would then expose every store's settings/logo to anyone,
-- not just their own.

drop policy if exists stores_select on stores;
create policy stores_select on stores for select using (true);

drop policy if exists images_select on storage.objects;
create policy images_select on storage.objects for select using (bucket_id = 'images');
