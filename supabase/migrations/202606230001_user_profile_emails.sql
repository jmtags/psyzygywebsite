alter table public.user_profiles
add column if not exists email text;

update public.user_profiles as profiles
set email = lower(auth_users.email)
from auth.users as auth_users
where profiles.id = auth_users.id
  and profiles.email is null;

create unique index if not exists user_profiles_email_lower_idx
on public.user_profiles (lower(email))
where email is not null;
