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
    coalesce(sum(logs.rendered_hours), 0)::numeric(8,2),
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

grant execute on function public.ojt_portal_profile(text, date) to anon, authenticated;
