alter table public.ojt_schools
add column if not exists coordinator_access_code text;

create or replace function public.ojt_coordinator_profile(p_email text, p_access_code text)
returns table (
  school_id uuid,
  clinic_id uuid,
  school_name text,
  coordinator_name text,
  coordinator_email text,
  coordinator_phone text,
  clinic_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    schools.id,
    schools.clinic_id,
    schools.name,
    schools.coordinator_name,
    schools.coordinator_email,
    schools.coordinator_phone,
    clinics.name
  from public.ojt_schools schools
  join public.clinics clinics on clinics.id = schools.clinic_id
  where lower(trim(schools.coordinator_email)) = lower(trim(p_email))
    and nullif(trim(schools.coordinator_access_code), '') is not null
    and schools.coordinator_access_code = trim(p_access_code)
  limit 1;
end;
$$;

create or replace function public.ojt_coordinator_trainees(p_email text, p_access_code text)
returns table (
  trainee_id uuid,
  full_name text,
  course text,
  email text,
  required_hours integer,
  rendered_hours numeric,
  pending_hours numeric,
  pending_logs bigint,
  status public.ojt_status,
  start_date date,
  end_date date,
  last_log_at timestamptz,
  photo_public_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
begin
  select profile.school_id into v_school_id
  from public.ojt_coordinator_profile(p_email, p_access_code) profile
  limit 1;

  if v_school_id is null then
    return;
  end if;

  return query
  select
    trainees.id,
    trainees.full_name,
    trainees.course,
    trainees.email,
    coalesce(trainees.total_hours, 0),
    coalesce(sum(logs.rendered_hours) filter (where logs.approval_status = 'approved'), 0)::numeric(8,2),
    coalesce(sum(logs.rendered_hours) filter (where logs.approval_status = 'pending' and logs.time_out is not null), 0)::numeric(8,2),
    count(logs.id) filter (where logs.approval_status = 'pending' and logs.time_out is not null),
    trainees.status,
    trainees.start_date,
    trainees.end_date,
    max(coalesce(logs.time_out, logs.time_in)),
    trainees.photo_public_url
  from public.ojt_trainees trainees
  left join public.ojt_time_logs logs on logs.trainee_id = trainees.id
  where trainees.school_id = v_school_id
  group by trainees.id
  order by trainees.status, trainees.full_name;
end;
$$;

grant execute on function public.ojt_coordinator_profile(text, text) to anon, authenticated;
grant execute on function public.ojt_coordinator_trainees(text, text) to anon, authenticated;
