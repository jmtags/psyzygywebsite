type AnalyticsPayload = Record<string, unknown>;

const textHeader = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const nullableText = (value: unknown, maxLength: number) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, maxLength) : null;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Missing Supabase environment variables.' });
  }

  const body = (req.body ?? {}) as AnalyticsPayload;
  const geoPayload = {
    country: nullableText(textHeader(req.headers['x-vercel-ip-country']) ?? body.country, 120),
    region: nullableText(textHeader(req.headers['x-vercel-ip-country-region']) ?? body.region, 120),
    city: nullableText(textHeader(req.headers['x-vercel-ip-city']) ?? body.city, 120),
    latitude: nullableText(textHeader(req.headers['x-vercel-ip-latitude']) ?? body.latitude, 40),
    longitude: nullableText(textHeader(req.headers['x-vercel-ip-longitude']) ?? body.longitude, 40),
    postal_code: nullableText(textHeader(req.headers['x-vercel-ip-postal-code']) ?? body.postal_code, 40),
    geo_timezone: nullableText(textHeader(req.headers['x-vercel-ip-timezone']) ?? body.geo_timezone, 120),
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/track-page-view`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      'User-Agent': textHeader(req.headers['user-agent']) ?? String(body.user_agent ?? ''),
    },
    body: JSON.stringify({
      ...body,
      ...geoPayload,
      forwarded_for: textHeader(req.headers['x-forwarded-for']),
      user_agent: textHeader(req.headers['user-agent']) ?? body.user_agent,
    }),
  });

  const payload = await response.json().catch(() => ({ ok: response.ok }));
  return res.status(response.status).json(payload);
}
