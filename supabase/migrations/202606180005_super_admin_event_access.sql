drop policy if exists "Clinic scoped album access" on public.event_albums;
drop policy if exists "Super admins manage event albums" on public.event_albums;
create policy "Super admins manage event albums"
on public.event_albums for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Clinic scoped photo access" on public.event_photos;
drop policy if exists "Super admins manage event photos" on public.event_photos;
create policy "Super admins manage event photos"
on public.event_photos for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Public can read published event albums" on public.event_albums;
create policy "Public can read published event albums"
on public.event_albums for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Public can read published event photos" on public.event_photos;
create policy "Public can read published event photos"
on public.event_photos for select
to anon, authenticated
using (
  exists (
    select 1
    from public.event_albums albums
    where albums.id = event_photos.album_id
      and albums.is_public = true
  )
);

drop policy if exists "Clinic users can read event photos" on storage.objects;
drop policy if exists "Clinic users can upload event photos" on storage.objects;
drop policy if exists "Clinic users can update event photos" on storage.objects;
drop policy if exists "Clinic users can delete event photos" on storage.objects;

drop policy if exists "Super admins can read event photos" on storage.objects;
create policy "Super admins can read event photos"
on storage.objects for select
to authenticated
using (bucket_id = 'event-photos' and public.is_super_admin());

drop policy if exists "Super admins can upload event photos" on storage.objects;
create policy "Super admins can upload event photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'event-photos' and public.is_super_admin());

drop policy if exists "Super admins can update event photos" on storage.objects;
create policy "Super admins can update event photos"
on storage.objects for update
to authenticated
using (bucket_id = 'event-photos' and public.is_super_admin())
with check (bucket_id = 'event-photos' and public.is_super_admin());

drop policy if exists "Super admins can delete event photos" on storage.objects;
create policy "Super admins can delete event photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'event-photos' and public.is_super_admin());
