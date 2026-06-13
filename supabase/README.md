# Supabase Setup Notes

Apply migrations in order from `supabase/migrations`.

Required Vercel environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Admin access model:

- `super_admin` can manage all clinics, users, event albums, OJT trainees, and certificates.
- `clinic_admin` and `staff` are scoped to one clinic through `user_profiles.clinic_id`.
- Event photos use the public Supabase storage bucket `event-photos`.

After creating an auth user in Supabase, insert a matching row in `public.user_profiles`.

First super admin bootstrap example:

```sql
insert into public.user_profiles (id, full_name, role, clinic_id, is_active)
values ('AUTH_USER_UUID_HERE', 'Super Admin', 'super_admin', null, true);
```

Browser-safe user management:

- The admin UI manages `public.user_profiles`.
- Create the actual login account in Supabase Auth first.
- Paste the Auth user UUID into the admin user's `Auth User ID` field.
- Do not expose a Supabase service-role key in Vercel or browser code.
