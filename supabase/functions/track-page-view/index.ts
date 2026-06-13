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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase function secrets.');
    }

    const body = await req.json();
    const userAgent = req.headers.get('user-agent') ?? String(body.user_agent ?? '');
    const deviceType = getDeviceType(userAgent);
    const location = getLocation(req, body);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from('page_visits').insert({
      path: String(body.path ?? '/').slice(0, 500),
      page_title: nullableText(body.page_title, 250),
      referrer: nullableText(body.referrer, 1000),
      device_type: deviceType,
      browser: getBrowser(userAgent),
      os: getOs(userAgent),
      country: location.country,
      region: location.region,
      city: location.city,
      timezone: nullableText(body.timezone, 120),
      locale: nullableText(body.locale, 120),
      user_agent: userAgent.slice(0, 1000),
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    return json({ ok: true });
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

function nullableText(value: unknown, maxLength: number) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, maxLength) : null;
}

function getDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod/.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(userAgent: string) {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  return 'Other';
}

function getOs(userAgent: string) {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Other';
}

function getLocation(req: Request, body: Record<string, unknown>) {
  return {
    country: nullableText(
      req.headers.get('cf-ipcountry') ||
        req.headers.get('x-vercel-ip-country') ||
        body.country,
      120,
    ),
    region: nullableText(req.headers.get('x-vercel-ip-country-region') || body.region, 120),
    city: nullableText(req.headers.get('x-vercel-ip-city') || body.city, 120),
  };
}
