alter table public.ojt_trainees
add column if not exists photo_storage_path text,
add column if not exists photo_public_url text;

insert into storage.buckets (id, name, public)
values ('ojt-photos', 'ojt-photos', true)
on conflict (id) do nothing;

drop policy if exists "Clinic users can read ojt photos" on storage.objects;
create policy "Clinic users can read ojt photos"
on storage.objects for select
to authenticated
using (bucket_id = 'ojt-photos');

drop policy if exists "Clinic users can upload ojt photos" on storage.objects;
create policy "Clinic users can upload ojt photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'ojt-photos');

drop policy if exists "Clinic users can update ojt photos" on storage.objects;
create policy "Clinic users can update ojt photos"
on storage.objects for update
to authenticated
using (bucket_id = 'ojt-photos')
with check (bucket_id = 'ojt-photos');

drop policy if exists "Clinic users can delete ojt photos" on storage.objects;
create policy "Clinic users can delete ojt photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'ojt-photos');
