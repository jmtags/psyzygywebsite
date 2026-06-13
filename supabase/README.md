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

- The admin UI can create login users with passwords through the `admin-create-user` Edge Function.
- Editing users updates `public.user_profiles`.
- Do not expose a Supabase service-role key in Vercel or browser code.

Deploy the Edge Functions:

Edge Functions cannot be created by a Postgres migration; deploy them with the Supabase CLI.

```bash
supabase functions deploy admin-create-user
supabase functions deploy track-page-view
```

Or run one of the included scripts:

```powershell
.\supabase\deploy-functions.ps1
```

```bash
bash supabase/deploy-functions.sh
```

Do not manually add secrets that start with `SUPABASE_`. Supabase reserves that prefix and provides the required project URL and API keys to Edge Functions automatically.

The functions read Supabase's built-in defaults:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEYS` or legacy `SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEYS` or legacy `SUPABASE_SERVICE_ROLE_KEY`
