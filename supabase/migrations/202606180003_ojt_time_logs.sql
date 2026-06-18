create table if not exists public.ojt_time_logs (
  id uuid primary key default gen_random_uuid(),
  trainee_id uuid not null references public.ojt_trainees(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  log_date date not null default current_date,
  time_in timestamptz not null default now(),
  time_out timestamptz,
  rendered_hours numeric(6,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ojt_time_logs_time_order check (time_out is null or time_out >= time_in)
);

alter table public.ojt_time_logs enable row level security;

drop trigger if exists touch_ojt_time_logs_updated_at on public.ojt_time_logs;
create trigger touch_ojt_time_logs_updated_at
before update on public.ojt_time_logs
for each row execute function public.touch_updated_at();

drop policy if exists "Clinic scoped OJT time log access" on public.ojt_time_logs;
create policy "Clinic scoped OJT time log access"
on public.ojt_time_logs for all
to authenticated
using (public.can_access_clinic(clinic_id))
with check (public.can_access_clinic(clinic_id));

create index if not exists idx_ojt_time_logs_trainee_id on public.ojt_time_logs(trainee_id);
create index if not exists idx_ojt_time_logs_clinic_date on public.ojt_time_logs(clinic_id, log_date desc);

create or replace function public.ojt_portal_profile(p_email text, p_date_of_birth date)
returns table (
  trainee_id uuid,
  clinic_id uuid,
  full_name text,
  school_name text,
  course text,
  required_hours integer,
  rendered_hours numeric,
  status public.ojt_status,
  clinic_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    trainees.id,
    trainees.clinic_id,
    trainees.full_name,
    trainees.school_name,
    trainees.course,
    coalesce(trainees.total_hours, 0),
    coalesce(sum(logs.rendered_hours), 0)::numeric(8,2),
    trainees.status,
    clinics.name
  from public.ojt_trainees trainees
  join public.clinics clinics on clinics.id = trainees.clinic_id
  left join public.ojt_time_logs logs on logs.trainee_id = trainees.id
  where lower(trainees.email) = lower(trim(p_email))
    and trainees.date_of_birth = p_date_of_birth
    and trainees.status = 'active'
  group by trainees.id, clinics.name
  limit 1;
end;
$$;

create or replace function public.ojt_portal_logs(p_email text, p_date_of_birth date)
returns table (
  id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainee_id uuid;
begin
  select trainees.id into v_trainee_id
  from public.ojt_trainees trainees
  where lower(trainees.email) = lower(trim(p_email))
    and trainees.date_of_birth = p_date_of_birth
    and trainees.status = 'active'
  limit 1;

  if v_trainee_id is null then
    return;
  end if;

  return query
  select logs.id, logs.log_date, logs.time_in, logs.time_out, logs.rendered_hours
  from public.ojt_time_logs logs
  where logs.trainee_id = v_trainee_id
  order by logs.time_in desc
  limit 60;
end;
$$;

create or replace function public.ojt_portal_time_in(p_email text, p_date_of_birth date)
returns table (
  id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainee public.ojt_trainees%rowtype;
begin
  select * into v_trainee
  from public.ojt_trainees trainees
  where lower(trainees.email) = lower(trim(p_email))
    and trainees.date_of_birth = p_date_of_birth
    and trainees.status = 'active'
  limit 1;

  if v_trainee.id is null then
    raise exception 'No active OJT trainee found for those details.';
  end if;

  if exists (
    select 1 from public.ojt_time_logs logs
    where logs.trainee_id = v_trainee.id
      and logs.time_out is null
  ) then
    raise exception 'You already have an open time log.';
  end if;

  return query
  insert into public.ojt_time_logs (trainee_id, clinic_id)
  values (v_trainee.id, v_trainee.clinic_id)
  returning ojt_time_logs.id, ojt_time_logs.log_date, ojt_time_logs.time_in, ojt_time_logs.time_out, ojt_time_logs.rendered_hours;
end;
$$;

create or replace function public.ojt_portal_time_out(p_email text, p_date_of_birth date)
returns table (
  id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainee_id uuid;
  v_log_id uuid;
begin
  select trainees.id into v_trainee_id
  from public.ojt_trainees trainees
  where lower(trainees.email) = lower(trim(p_email))
    and trainees.date_of_birth = p_date_of_birth
    and trainees.status = 'active'
  limit 1;

  if v_trainee_id is null then
    raise exception 'No active OJT trainee found for those details.';
  end if;

  select logs.id into v_log_id
  from public.ojt_time_logs logs
  where logs.trainee_id = v_trainee_id
    and logs.time_out is null
  order by logs.time_in desc
  limit 1;

  if v_log_id is null then
    raise exception 'No open time log found.';
  end if;

  return query
  update public.ojt_time_logs logs
  set
    time_out = now(),
    rendered_hours = round((extract(epoch from (now() - logs.time_in)) / 3600)::numeric, 2)
  where logs.id = v_log_id
  returning logs.id, logs.log_date, logs.time_in, logs.time_out, logs.rendered_hours;
end;
$$;

grant execute on function public.ojt_portal_profile(text, date) to anon, authenticated;
grant execute on function public.ojt_portal_logs(text, date) to anon, authenticated;
grant execute on function public.ojt_portal_time_in(text, date) to anon, authenticated;
grant execute on function public.ojt_portal_time_out(text, date) to anon, authenticated;
