create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  page_title text,
  referrer text,
  device_type text not null check (device_type in ('mobile', 'tablet', 'desktop')),
  browser text,
  os text,
  country text,
  region text,
  city text,
  latitude double precision,
  longitude double precision,
  postal_code text,
  timezone text,
  locale text,
  user_agent text,
  visited_at timestamptz not null default now()
);

alter table public.page_visits enable row level security;

drop policy if exists "Super admins can read page visits" on public.page_visits;
create policy "Super admins can read page visits"
on public.page_visits for select
to authenticated
using (public.is_super_admin());

create index if not exists idx_page_visits_visited_at on public.page_visits(visited_at desc);
create index if not exists idx_page_visits_device_type on public.page_visits(device_type);
create index if not exists idx_page_visits_country on public.page_visits(country);
create index if not exists idx_page_visits_path on public.page_visits(path);
