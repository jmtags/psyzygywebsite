create table if not exists public.ojt_time_log_audit_logs (
  id uuid primary key default gen_random_uuid(),
  time_log_id uuid references public.ojt_time_logs(id) on delete set null,
  trainee_id uuid not null references public.ojt_trainees(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'approved', 'rejected', 'adjusted')),
  changed_by uuid references public.user_profiles(id) on delete set null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

alter table public.ojt_time_log_audit_logs enable row level security;

drop policy if exists "Clinic scoped OJT time log audit access" on public.ojt_time_log_audit_logs;
create policy "Clinic scoped OJT time log audit access"
on public.ojt_time_log_audit_logs for select
to authenticated
using (public.can_access_clinic(clinic_id));

create index if not exists idx_ojt_time_log_audit_logs_time_log_id on public.ojt_time_log_audit_logs(time_log_id);
create index if not exists idx_ojt_time_log_audit_logs_clinic_created_at on public.ojt_time_log_audit_logs(clinic_id, created_at desc);

create or replace function public.log_ojt_time_log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_old_values jsonb;
  v_new_values jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
    v_new_values := jsonb_build_object(
      'log_date', new.log_date,
      'time_in', new.time_in,
      'time_out', new.time_out,
      'rendered_hours', new.rendered_hours,
      'approval_status', new.approval_status,
      'notes', new.notes
    );
  else
    if old.approval_status is distinct from new.approval_status then
      v_action := case new.approval_status
        when 'approved' then 'approved'
        when 'rejected' then 'rejected'
        else 'updated'
      end;
    elsif old.rendered_hours is distinct from new.rendered_hours then
      v_action := 'adjusted';
    else
      v_action := 'updated';
    end if;

    v_old_values := jsonb_build_object(
      'log_date', old.log_date,
      'time_in', old.time_in,
      'time_out', old.time_out,
      'rendered_hours', old.rendered_hours,
      'approval_status', old.approval_status,
      'notes', old.notes
    );
    v_new_values := jsonb_build_object(
      'log_date', new.log_date,
      'time_in', new.time_in,
      'time_out', new.time_out,
      'rendered_hours', new.rendered_hours,
      'approval_status', new.approval_status,
      'notes', new.notes
    );
  end if;

  insert into public.ojt_time_log_audit_logs (
    time_log_id,
    trainee_id,
    clinic_id,
    action,
    changed_by,
    old_values,
    new_values
  )
  values (
    new.id,
    new.trainee_id,
    new.clinic_id,
    v_action,
    auth.uid(),
    v_old_values,
    v_new_values
  );

  return new;
end;
$$;

drop trigger if exists audit_ojt_time_logs on public.ojt_time_logs;
create trigger audit_ojt_time_logs
after insert or update on public.ojt_time_logs
for each row execute function public.log_ojt_time_log_audit();

create or replace function public.admin_add_ojt_manual_time_log(
  p_trainee_id uuid,
  p_time_in timestamptz,
  p_time_out timestamptz,
  p_notes text default null,
  p_approval_status text default 'approved'
)
returns table (
  id uuid,
  trainee_id uuid,
  clinic_id uuid,
  log_date date,
  time_in timestamptz,
  time_out timestamptz,
  rendered_hours numeric,
  notes text,
  approval_status text,
  approved_by uuid,
  approved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainee public.ojt_trainees%rowtype;
  v_status text := coalesce(nullif(trim(p_approval_status), ''), 'approved');
begin
  if auth.uid() is null then
    raise exception 'Admin login is required.';
  end if;

  if v_status not in ('pending', 'approved') then
    raise exception 'Manual time logs can only be saved as pending or approved.';
  end if;

  if p_time_out <= p_time_in then
    raise exception 'Time out must be after time in.';
  end if;

  if extract(epoch from (p_time_out - p_time_in)) / 3600 > 24 then
    raise exception 'Manual time logs cannot exceed 24 hours.';
  end if;

  select * into v_trainee
  from public.ojt_trainees trainees
  where trainees.id = p_trainee_id
  limit 1;

  if v_trainee.id is null then
    raise exception 'OJT trainee was not found.';
  end if;

  if not public.can_access_clinic(v_trainee.clinic_id) then
    raise exception 'You do not have access to this OJT trainee.';
  end if;

  return query
  insert into public.ojt_time_logs (
    trainee_id,
    clinic_id,
    log_date,
    time_in,
    time_out,
    rendered_hours,
    notes,
    approval_status,
    approved_by,
    approved_at
  )
  values (
    v_trainee.id,
    v_trainee.clinic_id,
    (p_time_in at time zone 'Asia/Manila')::date,
    p_time_in,
    p_time_out,
    round((extract(epoch from (p_time_out - p_time_in)) / 3600)::numeric, 2),
    nullif(trim(p_notes), ''),
    v_status,
    case when v_status = 'approved' then auth.uid() else null end,
    case when v_status = 'approved' then now() else null end
  )
  returning
    ojt_time_logs.id,
    ojt_time_logs.trainee_id,
    ojt_time_logs.clinic_id,
    ojt_time_logs.log_date,
    ojt_time_logs.time_in,
    ojt_time_logs.time_out,
    ojt_time_logs.rendered_hours,
    ojt_time_logs.notes,
    ojt_time_logs.approval_status,
    ojt_time_logs.approved_by,
    ojt_time_logs.approved_at;
end;
$$;

grant execute on function public.admin_add_ojt_manual_time_log(uuid, timestamptz, timestamptz, text, text) to authenticated;
