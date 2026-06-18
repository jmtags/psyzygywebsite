alter table public.ojt_time_logs
add column if not exists approval_status text not null default 'pending'
  check (approval_status in ('pending', 'approved', 'rejected')),
add column if not exists approved_by uuid references public.user_profiles(id) on delete set null,
add column if not exists approved_at timestamptz;

update public.ojt_time_logs
set
  approval_status = 'approved',
  approved_at = coalesce(time_out, updated_at, created_at)
where time_out is not null
  and approval_status = 'pending';

create index if not exists idx_ojt_time_logs_approval_status on public.ojt_time_logs(approval_status);

drop function if exists public.ojt_portal_profile(text, date);
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
  clinic_name text,
  photo_public_url text
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
    coalesce(sum(logs.rendered_hours) filter (where logs.approval_status = 'approved'), 0)::numeric(8,2),
    trainees.status,
    clinics.name,
    trainees.photo_public_url
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

drop function if exists public.ojt_portal_logs(text, date);
create or replace function public.ojt_portal_logs(p_email text, p_date_of_birth date)
returns table (
  id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric,
  notes text,
  approval_status text
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
  select logs.id, logs.log_date, logs.time_in, logs.time_out, logs.rendered_hours, logs.notes, logs.approval_status
  from public.ojt_time_logs logs
  where logs.trainee_id = v_trainee_id
  order by logs.time_in desc
  limit 60;
end;
$$;

drop function if exists public.ojt_portal_time_out(text, date);
drop function if exists public.ojt_portal_time_out(text, date, text);
create or replace function public.ojt_portal_time_out(p_email text, p_date_of_birth date, p_notes text default null)
returns table (
  id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric,
  notes text,
  approval_status text
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
    rendered_hours = round((extract(epoch from (now() - logs.time_in)) / 3600)::numeric, 2),
    notes = nullif(trim(p_notes), ''),
    approval_status = 'pending',
    approved_by = null,
    approved_at = null
  where logs.id = v_log_id
  returning logs.id, logs.log_date, logs.time_in, logs.time_out, logs.rendered_hours, logs.notes, logs.approval_status;
end;
$$;

grant execute on function public.ojt_portal_profile(text, date) to anon, authenticated;
grant execute on function public.ojt_portal_logs(text, date) to anon, authenticated;
grant execute on function public.ojt_portal_time_out(text, date, text) to anon, authenticated;
