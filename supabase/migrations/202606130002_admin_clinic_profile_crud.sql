alter table public.clinics
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_clinics_updated_at on public.clinics;
create trigger touch_clinics_updated_at
before update on public.clinics
for each row execute function public.touch_updated_at();

drop policy if exists "Super admins manage clinics" on public.clinics;
create policy "Super admins manage clinics"
on public.clinics for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Clinic users read assigned clinic" on public.clinics;
create policy "Clinic users read assigned clinic"
on public.clinics for select
to authenticated
using (public.is_super_admin() or id = public.current_user_clinic_id());
