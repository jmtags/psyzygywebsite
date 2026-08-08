drop function if exists public.ojt_coordinator_trainees(text, text);
create or replace function public.ojt_coordinator_trainees(p_email text, p_access_code text)
returns table (
  trainee_id uuid,
  full_name text,
  school_name text,
  course text,
  date_of_birth date,
  email text,
  batch_name text,
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
    trainees.school_name,
    trainees.course,
    trainees.date_of_birth,
    trainees.email,
    trainees.notes,
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

create or replace function public.ojt_coordinator_trainee_logs(
  p_email text,
  p_access_code text,
  p_trainee_id uuid
)
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
    logs.id,
    logs.log_date,
    logs.time_in,
    logs.time_out,
    logs.rendered_hours,
    logs.notes,
    logs.approval_status
  from public.ojt_time_logs logs
  join public.ojt_trainees trainees on trainees.id = logs.trainee_id
  where trainees.id = p_trainee_id
    and trainees.school_id = v_school_id
  order by logs.time_in desc
  limit 60;
end;
$$;

grant execute on function public.ojt_coordinator_trainees(text, text) to anon, authenticated;
grant execute on function public.ojt_coordinator_trainee_logs(text, text, uuid) to anon, authenticated;
