import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DAY = 86_400_000;
const steps = [
  { email_step: 'welcome', day: 0 },
  { email_step: 'day_5', day: 5 },
  { email_step: 'day_7', day: 7 },
  { email_step: 'day_10', day: 10 },
] as const;
function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Scheduling only. NEVER sends email. Defaults to a read-only preview.
// To write schedules, configure MTC_TRIAL_SCHEDULE_TEST_USER_ID (UUID) and
// MTC_TRIAL_SCHEDULE_WRITE_TEST=true. No other contacts can be scheduled.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const integration = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const endpoint = process.env.MTC_MARKETING_ELIGIBILITY_URL;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !integration || !endpoint || !org || !dbUrl || !dbKey) return respond({ error: 'Missing configuration' }, 503);
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!same(bearer, secret)) return respond({ error: 'Unauthorized' }, 401);
  let url: URL;
  try { url = new URL(endpoint); } catch { return respond({ error: 'Invalid endpoint' }, 503); }
  if (url.protocol !== 'https:') return respond({ error: 'HTTPS required' }, 503);

  const testId = process.env.MTC_TRIAL_SCHEDULE_TEST_USER_ID ?? '';
  const writeTest = process.env.MTC_TRIAL_SCHEDULE_WRITE_TEST === 'true';
  if (writeTest && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testId)) {
    return respond({ error: 'A valid test user ID is required for writes' }, 503);
  }
  const db = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let query = db.from('mtc_trial_marketing_lifecycle')
    .select('mtc_user_id,trial_started_at,sending_enabled,status,paid_membership_confirmed')
    .eq('organisation_id', org)
    .eq('status', 'staged')
    .eq('sending_enabled', true)
    .eq('paid_membership_confirmed', false)
    .gte('trial_started_at', new Date(Date.now() - 14 * DAY).toISOString())
    .order('trial_started_at', { ascending: false })
    .limit(1000);
  if (writeTest) query = query.eq('mtc_user_id', testId);
  const { data, error } = await query;
  if (error) return respond({ error: 'Lifecycle query failed' }, 500);
  const now = Date.now();
  const counts = { inspected: 0, disabled: 0, historical: 0, blocked: 0, unavailable: 0, eligible: 0, steps_due: 0, scheduled: 0, already_scheduled: 0, failed: 0 };
  for (const row of data ?? []) {
    counts.inspected++;
    if (!row.sending_enabled || row.status !== 'staged' || row.paid_membership_confirmed) { counts.disabled++; continue; }
    const start = Date.parse(row.trial_started_at);
    // New trials only; no retroactive backlog. Existing contacts need separate campaign.
    if (!Number.isFinite(start) || start < now - 14 * DAY || start > now + DAY) { counts.historical++; continue; }
    let eligible = false;
    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${integration}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mtc_user_id: row.mtc_user_id }),
        cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) { counts.unavailable++; continue; }
      const result: unknown = await res.json();
      eligible = !!result && typeof result === 'object' && 'eligible' in result && (result as { eligible: unknown }).eligible === true;
    } catch { counts.unavailable++; continue; }
    if (!eligible) { counts.blocked++; continue; }
    counts.eligible++;
    for (const step of steps) {
      const scheduledAt = new Date(start + step.day * DAY);
      // Never queue past-due steps, even for a new trial.
      // Allow the welcome email to be queued during the first 24 hours.
// Other steps must not be scheduled retroactively.
if (scheduledAt.getTime() < now && step.email_step !== 'welcome') continue;
      counts.steps_due++;
      if (!writeTest) continue;
      const { data: inserted, error: insertError } = await db.from('mtc_trial_email_deliveries')
        .upsert({ organisation_id: org, mtc_user_id: row.mtc_user_id, email_step: step.email_step, scheduled_at: scheduledAt.toISOString(), status: 'pending' }, {
          onConflict: 'organisation_id,mtc_user_id,email_step', ignoreDuplicates: true,
        }).select('id');
      if (insertError) counts.failed++;
      else if ((inserted ?? []).length) counts.scheduled++;
      else counts.already_scheduled++;
    }
  }
  return respond({ dry_run: !writeTest, emails_sent: 0, write_scope: writeTest ? 'single_test_user' : 'none', ...counts }, counts.failed ? 207 : 200);
}
