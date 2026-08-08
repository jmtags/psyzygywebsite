create table if not exists public.ojt_schools (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  coordinator_name text,
  coordinator_email text,
  coordinator_phone text,
  address text,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ojt_schools enable row level security;

drop trigger if exists touch_ojt_schools_updated_at on public.ojt_schools;
create trigger touch_ojt_schools_updated_at
before update on public.ojt_schools
for each row execute function public.touch_updated_at();

drop policy if exists "Clinic scoped OJT school access" on public.ojt_schools;
create policy "Clinic scoped OJT school access"
on public.ojt_schools for all
to authenticated
using (public.can_access_clinic(clinic_id))
with check (public.can_access_clinic(clinic_id));

create unique index if not exists ojt_schools_clinic_name_lower_idx
on public.ojt_schools (clinic_id, lower(name));

create index if not exists idx_ojt_schools_clinic_id on public.ojt_schools(clinic_id);

alter table public.ojt_trainees
add column if not exists school_id uuid references public.ojt_schools(id) on delete set null;

create index if not exists idx_ojt_trainees_school_id on public.ojt_trainees(school_id);

insert into public.ojt_schools (clinic_id, name)
select distinct trainees.clinic_id, trim(trainees.school_name)
from public.ojt_trainees trainees
where nullif(trim(trainees.school_name), '') is not null
on conflict do nothing;

update public.ojt_trainees trainees
set school_id = schools.id
from public.ojt_schools schools
where trainees.school_id is null
  and schools.clinic_id = trainees.clinic_id
  and lower(schools.name) = lower(trim(trainees.school_name));
