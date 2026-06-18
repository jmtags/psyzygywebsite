alter table public.ojt_trainees
add column if not exists date_of_birth date,
add column if not exists email text;
