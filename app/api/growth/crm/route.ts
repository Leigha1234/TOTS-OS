import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const respond = (error: string, status: number) => NextResponse.json({ error }, { status });

async function context(req: NextRequest, organisationId: string) {
  if (!uuid.test(organisationId)) return { error: 'Invalid organisation', status: 400 } as const;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return { error: 'Server configuration missing', status: 500 } as const;
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return { error: 'Unauthorised', status: 401 } as const;
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return { error: 'Unauthorised', status: 401 } as const;
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [owner, member] = await Promise.all([
    db.from('organisations').select('id').eq('id', organisationId).eq('created_by', user.id).maybeSingle(),
    db.from('organisation_members').select('organisation_id').eq('organisation_id', organisationId).eq('user_id', user.id).maybeSingle(),
  ]);
  if (owner.error || member.error) return { error: 'Unable to check access', status: 500 } as const;
  if (!owner.data && !member.data) return { error: 'Access denied', status: 403 } as const;
  return { db, user } as const;
}

async function resolve(req: NextRequest, organisationId: string, leadId: string) {
  const ctx = await context(req, organisationId);
  if (ctx.error) return { error: ctx.error, status: ctx.status } as const;
  if (!uuid.test(leadId)) return { error: 'Invalid lead', status: 400 } as const;
  const { data: lead, error } = await ctx.db.from('growth_leads')
    .select('id,name,email,phone,stage,source').eq('organisation_id', organisationId).eq('id', leadId).maybeSingle();
  if (error) return { error: 'Could not read lead', status: 500 } as const;
  if (!lead) return { error: 'Lead not found', status: 404 } as const;
  return { ...ctx, lead } as const;
}

async function lookup(db: any, organisationId: string, lead: {email: string | null; phone: string | null}) {
  // Email is the strongest match. Never automatically merge on name alone.
  if (lead.email) {
    const r = await db.from('contacts').select('id,name,email,phone').eq('organisation_id', organisationId)
      .ilike('email', lead.email.trim()).limit(2);
    if (r.error) throw new Error('CRM lookup failed');
    if (r.data.length > 1) return { state: 'ambiguous', matches: r.data };
    if (r.data.length === 1) return { state: 'matched', contact: r.data[0] };
  }
  // Phone matching is deliberately excluded: formatting differences and shared numbers
  // make automatic merges unsafe. The user can resolve these in CRM manually.
  return { state: 'new' };
}

export async function GET(req: NextRequest) {
  const organisationId = req.nextUrl.searchParams.get('organisationId') || '';
  const leadId = req.nextUrl.searchParams.get('leadId') || '';
  const ctx = await resolve(req, organisationId, leadId);
  if (ctx.error) return respond(ctx.error, ctx.status);
  const { data: link, error } = await ctx.db.from('growth_crm_links').select('contact_id,created_at')
    .eq('organisation_id', organisationId).eq('lead_id', leadId).maybeSingle();
  if (error) return respond('Apply the Part 1 CRM migration first', 500);
  if (link) return NextResponse.json({ state: 'linked', contactId: link.contact_id });
  try { return NextResponse.json(await lookup(ctx.db, organisationId, ctx.lead)); }
  catch { return respond('Could not check CRM contacts', 500); }
}

export async function POST(req: NextRequest) {
  let body: {organisationId?: string; leadId?: string};
  try { body = await req.json(); } catch { return respond('Invalid JSON', 400); }
  const organisationId = body.organisationId || '';
  const leadId = body.leadId || '';
  const ctx = await resolve(req, organisationId, leadId);
  if (ctx.error) return respond(ctx.error, ctx.status);
  const { data: existingLink, error: linkError } = await ctx.db.from('growth_crm_links').select('contact_id')
    .eq('organisation_id', organisationId).eq('lead_id', leadId).maybeSingle();
  if (linkError) return respond('Apply the Part 1 CRM migration first', 500);
  if (existingLink) return NextResponse.json({ state: 'linked', contactId: existingLink.contact_id });
  let result: Awaited<ReturnType<typeof lookup>>;
  try { result = await lookup(ctx.db, organisationId, ctx.lead); }
  catch { return respond('CRM lookup failed', 500); }
  if (result.state === 'ambiguous') return respond('Multiple matching CRM contacts. Resolve duplicates in Contacts first.', 409);
  let contactId: string;
  let created = false;
  if (result.state === 'matched' && result.contact) {
    contactId = result.contact.id;
  } else {
    // Explicit click only. No messaging, subscriptions, or marketing opt-in is created.
    const { data, error } = await ctx.db.from('contacts').insert({
      organisation_id: organisationId, name: ctx.lead.name,
      email: ctx.lead.email || null, phone: ctx.lead.phone || null,
    }).select('id').single();
    if (error || !data) return respond('Unable to create CRM contact; check required CRM fields', 500);
    contactId = data.id;
    created = true;
  }
  const { error: saveError } = await ctx.db.from('growth_crm_links').upsert({
    organisation_id: organisationId, lead_id: leadId, contact_id: contactId, linked_by: ctx.user.id,
  }, { onConflict: 'lead_id', ignoreDuplicates: true });
  if (saveError) return respond('CRM contact exists, but link could not be saved. Retry to link it.', 500);
  await ctx.db.from('growth_activities').insert({
    organisation_id: organisationId, lead_id: leadId, event_type: 'crm_linked',
    details: { contact_id: contactId, created }, actor_id: ctx.user.id,
  });
  return NextResponse.json({ state: 'linked', contactId, created });
}
