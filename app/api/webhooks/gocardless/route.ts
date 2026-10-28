import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database, env, type Event } from './renewal';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get('webhook-signature') || '';
  const expected = createHmac('sha256', env('GOCARDLESS_WEBHOOK_SECRET')).update(raw).digest('hex');
  if (!/^[a-f0-9]{64}$/i.test(signature)
    || !timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex')))
    return new NextResponse('Invalid signature', { status: 498 });
  let payload: { events: Event[] };
  try {
    payload = JSON.parse(raw);
    if (!Array.isArray(payload.events) || payload.events.length > 1000
      || payload.events.some(e => !e || typeof e.id !== 'string' || !e.id
        || typeof e.resource_type !== 'string' || typeof e.action !== 'string')) throw new Error();
  } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }
  const events = payload.events.filter(e => ['payments', 'subscriptions', 'mandates'].includes(e.resource_type));
  if (!events.length) return new NextResponse(null, { status: 204 });
  // Durable inbox. Acknowledge only after storage; no external API calls here.
  const { error } = await database().from('mtc_gc_inbox').upsert(
    events.map(e => ({ event_id: e.id, payload: e })),
    { onConflict: 'event_id', ignoreDuplicates: true },
  );
  if (error) {
    console.error('[GC inbox]', error.code);
    return NextResponse.json({ error: 'Could not store webhook' }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
export async function GET() {
  return NextResponse.json({ ok: true, service: 'gocardless-webhook', mode: 'durable-inbox' });
}
