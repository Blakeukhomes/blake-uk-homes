-- Storage buckets for property documents and tenant fault media.
-- Run after the schema migration.

insert into storage.buckets (id, name, public)
values
  ('property-documents', 'property-documents', false),
  ('fault-media', 'fault-media', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Owners/managers can read everything in property-documents that they own.
create policy "documents read"  on storage.objects for select
  using (
    bucket_id = 'property-documents'
    and exists (
      select 1 from public.documents d
      where d.storage_path = name
        and public.is_owner_or_manager(d.property_id)
    )
  );

create policy "documents write" on storage.objects for insert
  with check (
    bucket_id = 'property-documents'
    and auth.role() = 'authenticated'
  );

-- Fault media: insert is open to anyone with a valid signed upload URL (server route handles auth).
create policy "fault media insert" on storage.objects for insert
  with check (bucket_id = 'fault-media');

create policy "fault media read"   on storage.objects for select
  using (bucket_id = 'fault-media' and auth.role() = 'authenticated');
