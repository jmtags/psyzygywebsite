alter table public.page_visits
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists postal_code text;
