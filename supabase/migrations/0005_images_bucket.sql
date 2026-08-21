-- Product photos and the store logo move off per-browser localStorage into
-- a real Supabase Storage bucket, so an image uploaded on one device shows
-- up on every device. Run in the Supabase SQL editor after
-- 0004_categories.sql. Safe to re-run from scratch.
--
-- Objects are stored at "<store_id>/<slot id>" (no file extension — the
-- browser renders from the Content-Type set on upload, not the filename),
-- e.g. "3f2c.../store-logo" or "3f2c.../prod-img-12". The bucket is public
-- so <img src> works with a plain URL; RLS on storage.objects still gates
-- who can list/upload/replace within their own store's folder.

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists images_select on storage.objects;
drop policy if exists images_write on storage.objects;

create policy images_select on storage.objects for select
  using (bucket_id = 'images' and (storage.foldername(name))[1] = current_store_id()::text);

-- Both product photos (ProductsView, has_perm('inventory')) and the store
-- logo (SettingsView, has_perm('settings')) live in the same bucket/folder,
-- so either permission is enough to write here.
create policy images_write on storage.objects for all
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = current_store_id()::text
    and (has_perm('inventory') or has_perm('settings'))
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = current_store_id()::text
    and (has_perm('inventory') or has_perm('settings'))
  );
