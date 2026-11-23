import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const respond = (value: unknown, status = 200) => NextResponse.json(value, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export async function POST(req: NextRequest) {
  const secret = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const orgId = process.env.TOTS_MTC_ORGANISATION_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !orgId || !uuid(orgId) || !supabaseUrl || !serviceKey) {
    return respond({ error: 'Integration not configured' }, 503);
  }
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return respond({ error: 'Unauthorized' }, 401);

  // Bound input size before parsing. This endpoint only accepts server-to-server events.
  const raw = await req.text();
  if (raw.length > 8192) return respond({ error: 'Payload too large' }, 413);
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid');
    input = parsed as Record<string, unknown>;
  } catch { return respond({ error: 'Invalid JSON object' }, 400); }

  const orderId = typeof input.order_id === 'string' ? input.order_id.trim() : '';
  const userId = typeof input.mtc_user_id === 'string' ? input.mtc_user_id.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 200) : '';
  const course = typeof input.course_type === 'string' ? input.course_type.trim() : '';
  const paidAt = typeof input.paid_at === 'string' ? input.paid_at : '';
  const consent = input.marketing_opt_in;
  if (!uuid(orderId) || !uuid(userId) || !emailValid(email) ||
      !['beginner_hyrox', 'beginner_crossfit', 'mum_fit'].includes(course) ||
      !paidAt || !Number.isFinite(Date.parse(paidAt)) ||
      (consent !== true && consent !== false)) {
    return respond({ error: 'Invalid purchase details or consent' }, 400);
  }
  const date = new Date(paidAt);
  if (date.getTime() > Date.now() + 5 * 60_000) return respond({ error: 'Invalid purchase time' }, 400);

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // An order can only be associated with one MTC user and course. Never overwrite
  // existing purchase attribution on retries or conflicting requests.
  const { data: existing, error: lookupError } = await db.from('mtc_course_purchase_events')
    .select('mtc_user_id,course_type').eq('organisation_id', orgId).eq('order_id', orderId).maybeSingle();
  if (lookupError) return respond({ error: 'Purchase lookup failed' }, 503);
  if (existing) {
    if (existing.mtc_user_id !== userId || existing.course_type !== course) {
      return respond({ error: 'Conflicting order attribution' }, 409);
    }
    return respond({ accepted: true, duplicate: true, marketing_queued: false });
  }
  const { error } = await db.from('mtc_course_purchase_events').insert({
    organisation_id: orgId, order_id: orderId, mtc_user_id: userId,
    email, name, course_type: course, paid_at: date.toISOString(),
    marketing_opt_in: consent, processing_status: 'staged',
  });
  if (error) {
    if (error.code === '23505') return respond({ accepted: true, duplicate: true, marketing_queued: false });
    return respond({ error: 'Purchase could not be staged' }, 503);
  }
  // Stage 6 deliberately stages only. Stage 7 will implement consent-aware contact sync.
  return respond({ accepted: true, duplicate: false, marketing_queued: false }, 202);
}
