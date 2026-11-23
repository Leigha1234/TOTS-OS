import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

// Deliberately NOT scheduled in Vercel yet. Run manually with CRON_SECRET while testing.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !org || !url || !key) return json({ error: 'Not configured' }, 503);
  const supplied = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(supplied), b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: 'Unauthorized' }, 401);
  if (process.env.MTC_COURSE_CONTACT_SYNC_ENABLED !== 'true') {
    return json({ enabled: false, processed: 0, note: 'Set MTC_COURSE_CONTACT_SYNC_ENABLED=true to process staged events.' });
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: events, error: readError } = await db.from('mtc_course_purchase_events')
    .select('id,mtc_user_id,email,name,marketing_opt_in,order_id,course_type')
    .eq('organisation_id', org).eq('processing_status', 'staged')
    .order('created_at', { ascending: true }).limit(50);
  if (readError) return json({ error: 'Could not read purchase events' }, 503);
  const counts = { processed: 0, suppressed: 0, failed: 0 };
  const failures: { order_id: string; reason: string }[] = [];
  for (const event of events ?? []) {
    let status: 'processed' | 'suppressed' | 'failed' = 'failed';
    let reason = '';
    try {
      const email = String(event.email ?? '').trim().toLowerCase();
      if (event.marketing_opt_in !== true || !validEmail(email)) {
        status = 'suppressed';
      } else {
        const { data: blocked, error: blockError } = await db.from('campaign_unsubscribes')
          .select('email').eq('organisation_id', org).ilike('email', email).limit(1);
        if (blockError) throw new Error('Suppression lookup failed');
        if (blocked?.length) {
          status = 'suppressed';
        } else {
          const { data: link, error: linkError } = await db.from('mtc_marketing_contact_links')
            .select('contact_id').eq('organisation_id', org).eq('mtc_user_id', event.mtc_user_id).maybeSingle();
          if (linkError) throw new Error('Contact link lookup failed');
          let contactId: string | undefined = link?.contact_id;
          if (contactId) {
            const { data: linkedContact, error: linkedError } = await db.from('contacts')
              .select('id,email').eq('organisation_id', org).eq('id', contactId).maybeSingle();
            if (linkedError || !linkedContact) throw new Error('Broken contact link');
            // Never silently overwrite an existing contact's email or merge identities.
            if (String(linkedContact.email).trim().toLowerCase() !== email) throw new Error('Linked contact email mismatch');
          } else {
            const { data: matches, error: matchError } = await db.from('contacts')
              .select('id').eq('organisation_id', org).ilike('email', email).limit(2);
            if (matchError) throw new Error('Contact lookup failed');
            if ((matches ?? []).length > 1) throw new Error('Ambiguous duplicate contacts');
            if (matches?.length === 1) {
              contactId = matches[0].id;
            } else {
              const { data: created, error: createError } = await db.from('contacts')
                .insert({ organisation_id: org, email, name: String(event.name ?? '').slice(0, 200) || null })
                .select('id').single();
              if (createError || !created) throw new Error('Contact creation failed');
              contactId = created.id;
            }
            const { error: mappingError } = await db.from('mtc_marketing_contact_links').upsert(
              { organisation_id: org, mtc_user_id: event.mtc_user_id, contact_id: contactId },
              { onConflict: 'organisation_id,mtc_user_id', ignoreDuplicates: true },
            );
            if (mappingError) throw new Error('Contact mapping failed');
            const { data: confirmed, error: confirmError } = await db.from('mtc_marketing_contact_links')
              .select('contact_id').eq('organisation_id', org).eq('mtc_user_id', event.mtc_user_id).maybeSingle();
            if (confirmError || confirmed?.contact_id !== contactId) throw new Error('Concurrent mapping conflict');
          }
          status = 'processed';
        }
      }
    } catch (e) {
      reason = e instanceof Error ? e.message : 'Unknown error';
      failures.push({ order_id: String(event.order_id), reason });
      status = 'failed';
    }
    const { error: saveError } = await db.from('mtc_course_purchase_events')
      .update({ processing_status: status }).eq('id', event.id).eq('organisation_id', org).eq('processing_status', 'staged');
    if (saveError) {
      counts.failed++;
      failures.push({ order_id: String(event.order_id), reason: 'Status update failed' });
    } else {
      counts[status]++;
    }
  }
  return json({ enabled: true, examined: (events ?? []).length, ...counts, failures,
    note: 'Contact sync only. No email campaigns are enrolled or sent.' });
}
