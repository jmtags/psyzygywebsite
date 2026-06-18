import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = getSecretKey();
    const anonKey = getPublishableKey();

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Missing Supabase function secrets.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header.' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: requesterData, error: requesterError } = await userClient.auth.getUser();
    if (requesterError || !requesterData.user) {
      return json({ error: 'Invalid session.' }, 401);
    }

    const { data: requesterProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', requesterData.user.id)
      .maybeSingle();

    if (profileError || requesterProfile?.role !== 'super_admin' || requesterProfile?.is_active !== true) {
      return json({ error: 'Only active super admins can create users.' }, 403);
    }

    const body = await req.json();
    const action = String(body.action ?? 'create');
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const fullName = String(body.full_name ?? '').trim();
    const role = body.role;
    const clinicId = body.clinic_id || null;
    const isActive = body.is_active !== false;

    if (action === 'update-password') {
      const userId = String(body.user_id ?? '').trim();

      if (!userId || password.length < 6) {
        return json({ error: 'Auth user ID and a password with at least 6 characters are required.' }, 400);
      }

      const { error: updatePasswordError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updatePasswordError) {
        return json({ error: updatePasswordError.message }, 400);
      }

      return json({ user_id: userId });
    }

    if (!email || !password || !fullName || !['super_admin', 'clinic_admin', 'staff'].includes(role)) {
      return json({ error: 'Email, password, full name, and valid role are required.' }, 400);
    }

    if (password.length < 6) {
      return json({ error: 'Password must be at least 6 characters.' }, 400);
    }

    if (role !== 'super_admin' && !clinicId) {
      return json({ error: 'Clinic is required for clinic users.' }, 400);
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (createError || !createdUser.user) {
      return json({ error: createError?.message ?? 'Unable to create auth user.' }, 400);
    }

    const { error: insertError } = await adminClient.from('user_profiles').insert({
      id: createdUser.user.id,
      full_name: fullName,
      role,
      clinic_id: role === 'super_admin' ? null : clinicId,
      is_active: isActive,
    });

    if (insertError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id);
      return json({ error: insertError.message }, 400);
    }

    return json({ user_id: createdUser.user.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getPublishableKey() {
  const legacyKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyKey) return legacyKey;

  const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (!publishableKeys) return null;

  try {
    const parsed = JSON.parse(publishableKeys);
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

function getSecretKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!secretKeys) return null;

  try {
    const parsed = JSON.parse(secretKeys);
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}
