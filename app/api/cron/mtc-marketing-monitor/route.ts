import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(req: NextRequest, secret: string) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(token), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Read-only operational summary. Does not reveal contact PII or enable sending.
export async function GET(req: NextRequest) {
  const { CRON_SECRET: secret, TOTS_MTC_ORGANISATION_ID: org,
    NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!secret || !org || !url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  if (!authorised(req, secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const courseStatuses = ['staged', 'processed', 'suppressed', 'failed'] as const;
  const deliveryStatuses = ['pending', 'sending', 'sent', 'failed'] as const;
  const results = await Promise.all([
    ...courseStatuses.map(async status => {
      const { count, error } = await db.from('mtc_course_purchase_events').select('id', { count: 'exact', head: true })
        .eq('organisation_id', org).eq('processing_status', status);
      if (error) throw new Error(`Course status ${status} unavailable`);
      return [status, count ?? 0] as const;
    }),
    ...deliveryStatuses.map(async status => {
      const { count, error } = await db.from('mtc_trial_email_deliveries').select('id', { count: 'exact', head: true })
        .eq('organisation_id', org).eq('status', status);
      if (error) throw new Error(`Trial delivery status ${status} unavailable`);
      return [status, count ?? 0] as const;
    }),
  ]).catch(() => null);
  if (!results) return NextResponse.json({ error: 'Monitoring tables unavailable; check migrations' }, { status: 503 });
  return NextResponse.json({
    read_only: true,
    checked_at: new Date().toISOString(),
    course_purchases: Object.fromEntries(results.slice(0, courseStatuses.length)),
    trial_email_deliveries: Object.fromEntries(results.slice(courseStatuses.length)),
    course_sync_enabled: process.env.MTC_COURSE_CONTACT_SYNC_ENABLED === 'true',
    trial_email_sending_enabled: process.env.MTC_TRIAL_EMAIL_SENDING_ENABLED === 'true',
    note: 'Counts only. This endpoint does not run sync jobs or send emails.',
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
