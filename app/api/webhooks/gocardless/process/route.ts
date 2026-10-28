import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { database, env, reconcile } from '../renewal';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${env('CRON_SECRET')}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Do not start a new job near the execution limit. A slow job may need
  // processor requests plus a 15-second MTC request after it is claimed.
  const admin = database(), until = Date.now() + 10000;
  let done = 0, failed = 0;
  while (Date.now() < until) {
    const { data, error } = await admin.rpc('mtc_claim_gc_job');
    if (error) return NextResponse.json({ error: 'Queue claim failed' }, { status: 500 });
    const job = data?.[0];
    if (!job) break;
    try {
      await reconcile(job.payload);
      const { error: finishError } = await admin.from('mtc_gc_inbox').update({
        completed_at: new Date().toISOString(), locked_until: null, last_error: null,
      }).eq('event_id', job.event_id).eq('lease_token', job.lease_token);
      if (finishError) throw finishError;
      done++;
    } catch (error) {
      failed++;
      console.error('[GC reconciliation]', job.event_id, error instanceof Error ? error.message : 'Failed');
      const { error: retryError } = await admin.from('mtc_gc_inbox').update({
        locked_until: null, last_error: 'Reconciliation failed; inspect server logs',
        next_attempt_at: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** Math.min(job.attempts, 6))).toISOString(),
      }).eq('event_id', job.event_id).eq('lease_token', job.lease_token);
      if (retryError) return NextResponse.json({ error: 'Queue retry update failed' }, { status: 500 });
    }
  }
  return NextResponse.json({ success: failed === 0, done, failed }, {
    status: failed ? 503 : 200, headers: { 'Cache-Control': 'no-store' },
  });
}
