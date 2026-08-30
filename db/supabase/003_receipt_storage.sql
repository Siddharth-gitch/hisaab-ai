-- Hisaab private receipt archive.
-- Run this file in the Supabase SQL Editor only, after 002_security_rls.sql.
-- The bucket is private. Files are stored under: user-id/workspace-id/file-name
-- and can only be accessed by the signed-in owner of the first folder.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

drop policy if exists "hisaab users upload own receipts" on storage.objects;
create policy "hisaab users upload own receipts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "hisaab users read own receipts" on storage.objects;
create policy "hisaab users read own receipts"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "hisaab users update own receipts" on storage.objects;
create policy "hisaab users update own receipts"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'receipts'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'receipts'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "hisaab users delete own receipts" on storage.objects;
create policy "hisaab users delete own receipts"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

revoke all on storage.objects from anon;
