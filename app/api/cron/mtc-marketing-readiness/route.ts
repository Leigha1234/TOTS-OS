import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(req: NextRequest, secret: string) {
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Read-only launch checklist: never sends emails or changes database records.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET missing' }, { status: 503 });
  if (!authorised(req, secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const settings = {
    organisation_id_configured: Boolean(org),
    supabase_configured: Boolean(url && key),
    mtc_integration_secret_configured: Boolean(process.env.TOTS_MTC_INTEGRATION_SECRET),
    eligibility_endpoint_configured: Boolean(process.env.MTC_MARKETING_ELIGIBILITY_URL),
    cron_secret_configured: true,
    course_contact_sync_enabled: process.env.MTC_COURSE_CONTACT_SYNC_ENABLED === 'true',
    trial_email_sending_enabled: process.env.MTC_TRIAL_EMAIL_SENDING_ENABLED === 'true',
    trial_test_recipient_allowlist_configured: Boolean(process.env.MTC_TRIAL_TEST_RECIPIENTS),
  };
  const checks: Record<string, { ok: boolean; count?: number }> = {};
  if (org && url && key) {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const [label, table] of [
      ['course_purchase_staging', 'mtc_course_purchase_events'],
      ['trial_email_deliveries', 'mtc_trial_email_deliveries'],
      ['contact_links', 'mtc_marketing_contact_links'],
    ] as const) {
      const { count, error } = await db.from(table).select('id', { head: true, count: 'exact' })
        .eq('organisation_id', org);
      checks[label] = { ok: !error, ...(!error ? { count: count ?? 0 } : {}) };
    }
  }
  const prerequisites = settings.organisation_id_configured && settings.supabase_configured &&
    settings.mtc_integration_secret_configured && settings.eligibility_endpoint_configured &&
    Object.values(checks).length === 3 && Object.values(checks).every(check => check.ok);
  return NextResponse.json({
    checked_at: new Date().toISOString(),
    read_only: true,
    prerequisites_passed: prerequisites,
    settings,
    tables: checks,
    outstanding_manual_verification: [
      'Confirm ORBI shop paid-order webhook posts verified beginner-course purchases to the Stage 6 receiver.',
      'Verify purchaser identity and explicit marketing opt-in are captured at checkout.',
      'Course emails have preview templates only; production scheduling and delivery are not implemented.',
      'Verify membership eligibility and unsubscribe suppression using test accounts before any live sends.',
    ],
    live_marketing_ready: false,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
