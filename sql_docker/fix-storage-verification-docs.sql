-- ============================================================
-- FIX #4 del audit QA: bucket "verification-docs" no existe
-- Crea el bucket (privado) + policies de storage.objects
-- scoped por carpeta de usuario (user.id/), igual que ya usa
-- EditProfessionalProfile.tsx (path = `${user.id}/${Date.now()}_${file.name}`)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-docs',
  'verification-docs',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists verification_docs_insert_own on storage.objects;
create policy verification_docs_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists verification_docs_select_own on storage.objects;
create policy verification_docs_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists verification_docs_delete_own on storage.objects;
create policy verification_docs_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'verification-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
