create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('super_admin', 'clinic_admin', 'staff');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ojt_status as enum ('active', 'completed', 'withdrawn');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

insert into public.clinics (name, slug, address, phone, email)
values
  ('Mabalacat', 'mabalacat', 'Bldg 1, Unit 16, Xevera Plaza, Mabalacat City', '0931 203 7963', 'psyzygymabalacat@psyzygyclinic.com'),
  ('Tarlac', 'tarlac', '2nd Floor MAQS Business Center, San Rafael, Tarlac City', '0931 203 7962', 'psyzygytarlac@psyzygyclinic.com'),
  ('Calapan', 'calapan', 'Mahogany St., Brgy. Sto. Nino, Calapan City, Philippines', '0949 869 2264', 'psyzygycalapan@psyzygyclinic.com')
on conflict (slug) do update set
  name = excluded.name,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'staff',
  clinic_id uuid references public.clinics(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint super_admin_has_no_required_clinic check (
    role = 'super_admin' or clinic_id is not null
  )
);

create table if not exists public.event_albums (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  title text not null,
  event_date date,
  description text,
  is_public boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.event_albums(id) on delete cascade,
  storage_path text not null,
  public_url text,
  caption text,
  sort_order integer not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ojt_batches (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  batch_name text not null,
  school_name text,
  supervisor_name text,
  start_date date,
  end_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ojt_trainees (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  batch_id uuid references public.ojt_batches(id) on delete set null,
  full_name text not null,
  school_name text,
  course text,
  total_hours integer,
  start_date date,
  end_date date,
  status public.ojt_status not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificate_logs (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid references public.ojt_trainees(id) on delete cascade,
  batch_id uuid references public.ojt_batches(id) on delete set null,
  certificate_number text not null unique,
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_profiles_updated_at on public.user_profiles;
create trigger touch_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_event_albums_updated_at on public.event_albums;
create trigger touch_event_albums_updated_at
before update on public.event_albums
for each row execute function public.touch_updated_at();

drop trigger if exists touch_ojt_batches_updated_at on public.ojt_batches;
create trigger touch_ojt_batches_updated_at
before update on public.ojt_batches
for each row execute function public.touch_updated_at();

drop trigger if exists touch_ojt_trainees_updated_at on public.ojt_trainees;
create trigger touch_ojt_trainees_updated_at
before update on public.ojt_trainees
for each row execute function public.touch_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.current_user_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.user_profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false);
$$;

create or replace function public.can_access_clinic(target_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      public.current_user_role() in ('clinic_admin', 'staff')
      and public.current_user_clinic_id() = target_clinic_id
    );
$$;

alter table public.clinics enable row level security;
alter table public.user_profiles enable row level security;
alter table public.event_albums enable row level security;
alter table public.event_photos enable row level security;
alter table public.ojt_batches enable row level security;
alter table public.ojt_trainees enable row level security;
alter table public.certificate_logs enable row level security;

drop policy if exists "Authenticated users can read clinics" on public.clinics;
create policy "Authenticated users can read clinics"
on public.clinics for select
to authenticated
using (true);

drop policy if exists "Super admins manage profiles" on public.user_profiles;
create policy "Super admins manage profiles"
on public.user_profiles for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles for select
to authenticated
using (id = auth.uid() or public.is_super_admin());

drop policy if exists "Clinic scoped album access" on public.event_albums;
create policy "Clinic scoped album access"
on public.event_albums for all
to authenticated
using (clinic_id is null or public.can_access_clinic(clinic_id))
with check (clinic_id is null or public.can_access_clinic(clinic_id));

drop policy if exists "Clinic scoped photo access" on public.event_photos;
create policy "Clinic scoped photo access"
on public.event_photos for all
to authenticated
using (
  exists (
    select 1 from public.event_albums albums
    where albums.id = event_photos.album_id
      and (albums.clinic_id is null or public.can_access_clinic(albums.clinic_id))
  )
)
with check (
  exists (
    select 1 from public.event_albums albums
    where albums.id = event_photos.album_id
      and (albums.clinic_id is null or public.can_access_clinic(albums.clinic_id))
  )
);

drop policy if exists "Clinic scoped batch access" on public.ojt_batches;
create policy "Clinic scoped batch access"
on public.ojt_batches for all
to authenticated
using (public.can_access_clinic(clinic_id))
with check (public.can_access_clinic(clinic_id));

drop policy if exists "Clinic scoped trainee access" on public.ojt_trainees;
create policy "Clinic scoped trainee access"
on public.ojt_trainees for all
to authenticated
using (public.can_access_clinic(clinic_id))
with check (public.can_access_clinic(clinic_id));

drop policy if exists "Clinic scoped certificate access" on public.certificate_logs;
create policy "Clinic scoped certificate access"
on public.certificate_logs for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1 from public.ojt_trainees trainees
    where trainees.id = certificate_logs.trainee_id
      and public.can_access_clinic(trainees.clinic_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1 from public.ojt_trainees trainees
    where trainees.id = certificate_logs.trainee_id
      and public.can_access_clinic(trainees.clinic_id)
  )
);

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

drop policy if exists "Clinic users can read event photos" on storage.objects;
create policy "Clinic users can read event photos"
on storage.objects for select
to authenticated
using (bucket_id = 'event-photos');

drop policy if exists "Clinic users can upload event photos" on storage.objects;
create policy "Clinic users can upload event photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'event-photos');

create index if not exists idx_user_profiles_clinic_id on public.user_profiles(clinic_id);
create index if not exists idx_event_albums_clinic_id on public.event_albums(clinic_id);
create index if not exists idx_event_photos_album_id on public.event_photos(album_id);
create index if not exists idx_ojt_batches_clinic_id on public.ojt_batches(clinic_id);
create index if not exists idx_ojt_trainees_clinic_id on public.ojt_trainees(clinic_id);
create index if not exists idx_ojt_trainees_batch_id on public.ojt_trainees(batch_id);
