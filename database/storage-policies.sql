-- ============================================
-- Supabase Storage Bucket & Policies (Hardened)
-- Single-admin model + private media access
-- ============================================

-- IMPORTANT:
-- 1) Replace the email below with your real admin email if needed.
-- 2) This policy model assumes:
--    - Bucket stays PRIVATE (no public URL access)
--    - Backend service role can always access via server-side key
--    - Frontend user (single admin) can only READ own app media through signed URLs or direct SELECT policy
--
-- Admin email used by policy:
--   vortex.admin@gmail.com

-- --------------------------------------------
-- Ensure bucket exists and is private
-- --------------------------------------------
insert into storage.buckets (id, name, public)
values ('whatsapp-media', 'whatsapp-media', false)
on conflict (id) do update
set public = false;

-- --------------------------------------------
-- RLS note for storage.objects
-- --------------------------------------------
-- In Supabase, storage.objects already has RLS enabled by default.
-- On many projects you are not the owner of this system table from SQL Editor,
-- so ALTER TABLE can fail with: "must be owner of table objects".
-- Because of that, we intentionally do not run ALTER TABLE here.

-- --------------------------------------------
-- Cleanup old policies (idempotent)
-- --------------------------------------------
drop policy if exists "Public read access for whatsapp-media" on storage.objects;
drop policy if exists "Service role insert for whatsapp-media" on storage.objects;
drop policy if exists "Service role update for whatsapp-media" on storage.objects;
drop policy if exists "Service role delete for whatsapp-media" on storage.objects;

drop policy if exists "whatsapp_media_admin_read" on storage.objects;
drop policy if exists "whatsapp_media_admin_insert" on storage.objects;
drop policy if exists "whatsapp_media_admin_update" on storage.objects;
drop policy if exists "whatsapp_media_admin_delete" on storage.objects;

-- --------------------------------------------
-- Hardened policies: single-admin access only
-- --------------------------------------------

-- READ (SELECT): only authenticated admin user
create policy "whatsapp_media_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'whatsapp-media'
  and auth.jwt() ->> 'email' = 'vortex.admin@gmail.com'
);

-- INSERT: only authenticated admin user
create policy "whatsapp_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'whatsapp-media'
  and auth.jwt() ->> 'email' = 'vortex.admin@gmail.com'
);

-- UPDATE: only authenticated admin user
create policy "whatsapp_media_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'whatsapp-media'
  and auth.jwt() ->> 'email' = 'vortex.admin@gmail.com'
)
with check (
  bucket_id = 'whatsapp-media'
  and auth.jwt() ->> 'email' = 'vortex.admin@gmail.com'
);

-- DELETE: only authenticated admin user
create policy "whatsapp_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'whatsapp-media'
  and auth.jwt() ->> 'email' = 'vortex.admin@gmail.com'
);

-- ============================================
-- Notes:
-- - Service role key (backend) bypasses RLS by design.
-- - Keep service role key secret and backend-only.
-- - If admin email changes, update the policy email literal above.
-- ============================================
