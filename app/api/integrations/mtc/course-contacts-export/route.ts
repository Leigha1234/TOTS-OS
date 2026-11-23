import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const csv = (value: unknown) => {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};
function authorised(req: NextRequest, secret: string) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(token), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Private, POST-only export for operational use. No browser/public GET route.
// Export is restricted to explicit opt-in, processed course purchasers; current
// ORBI unsubscribe suppression is checked again at export time.
export async function POST(req: NextRequest) {
  const { CRON_SECRET: secret, TOTS_MTC_ORGANISATION_ID: org,
    NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
  if (!secret || !org || !url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  if (!authorised(req, secret)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const unique = new Map<string, { email: string; name: string; course_type: string; paid_at: string }>();
  // Paginate rather than silently exporting only the first 1,000 rows.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('mtc_course_purchase_events')
      .select('email,name,course_type,paid_at')
      .eq('organisation_id', org).eq('marketing_opt_in', true).eq('processing_status', 'processed')
      .order('paid_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 499);
    if (error) return NextResponse.json({ error: 'Could not read course contacts' }, { status: 503 });
    for (const row of data ?? []) {
      const email = String(row.email ?? '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || unique.has(email)) continue;
      unique.set(email, { email, name: String(row.name ?? ''), course_type: String(row.course_type ?? ''), paid_at: String(row.paid_at ?? '') });
    }
    if ((data ?? []).length < 500) break;
  }
  const eligible: Array<{ email: string; name: string; course_type: string; paid_at: string }> = [];
  // Recheck current suppressions and contact links. A past opt-in is not enough.
  for (const row of unique.values()) {
    const { data: suppressed, error: suppressionError } = await db.from('campaign_unsubscribes')
      .select('email').eq('organisation_id', org).ilike('email', row.email).limit(1);
    if (suppressionError) return NextResponse.json({ error: 'Suppression check failed' }, { status: 503 });
    if (suppressed?.length) continue;
    eligible.push(row);
  }
  const lines = [
    ['email', 'name', 'course_type', 'paid_at'].map(csv).join(','),
    ...eligible.map(row => [row.email, row.name, row.course_type, row.paid_at].map(csv).join(',')),
  ];
  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mtc-beginner-course-opted-in.csv"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
