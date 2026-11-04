import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function equal(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// READ-ONLY DRY RUN. No scheduling, status changes, or email sending.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const integrationSecret = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const endpoint = process.env.MTC_MARKETING_ELIGIBILITY_URL;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cronSecret || !integrationSecret || !endpoint || !org || !dbUrl || !dbKey) return json({ error: 'Missing server configuration' }, 503);
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!equal(bearer, cronSecret)) return json({ error: 'Unauthorized' }, 401);
  let url: URL;
  try { url = new URL(endpoint); } catch { return json({ error: 'Invalid eligibility URL' }, 503); }
  if (url.protocol !== 'https:') return json({ error: 'Eligibility URL must use HTTPS' }, 503);
  const db = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from('mtc_trial_marketing_lifecycle')
    .select('mtc_user_id,trial_started_at,sending_enabled,status')
    .eq('organisation_id', org).order('trial_started_at', { ascending: false }).limit(20);
  if (error) return json({ error: 'Lifecycle lookup failed' }, 500);
  const counts = { inspected: 0, eligible: 0, blocked: 0, unavailable: 0, disabled: 0, historical: 0 };
  const cutoff = Date.now() - 14 * 86400_000;
  for (const row of data ?? []) {
    counts.inspected++;
    if (!row.sending_enabled || row.status !== 'staged') { counts.disabled++; continue; }
    if (Date.parse(row.trial_started_at) < cutoff) { counts.historical++; continue; }
    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${integrationSecret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mtc_user_id: row.mtc_user_id }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) { counts.unavailable++; continue; }
      const result: unknown = await response.json();
      if (result && typeof result === 'object' && 'eligible' in result && (result as { eligible: unknown }).eligible === true) counts.eligible++;
      else counts.blocked++;
    } catch { counts.unavailable++; }
  }
  return json({ dry_run: true, emails_sent: 0, sample_limit: 20, ...counts });
}
