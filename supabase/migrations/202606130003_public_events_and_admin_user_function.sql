drop policy if exists "Public can read published event albums" on public.event_albums;
create policy "Public can read published event albums"
on public.event_albums for select
to anon
using (is_public = true);

drop policy if exists "Public can read published event photos" on public.event_photos;
create policy "Public can read published event photos"
on public.event_photos for select
to anon
using (
  exists (
    select 1
    from public.event_albums albums
    where albums.id = event_photos.album_id
      and albums.is_public = true
  )
);

drop policy if exists "Clinic users can update event photos" on storage.objects;
create policy "Clinic users can update event photos"
on storage.objects for update
to authenticated
using (bucket_id = 'event-photos')
with check (bucket_id = 'event-photos');

drop policy if exists "Clinic users can delete event photos" on storage.objects;
create policy "Clinic users can delete event photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'event-photos');
