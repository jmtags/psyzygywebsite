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
