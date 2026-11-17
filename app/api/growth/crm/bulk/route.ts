import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

type Lead = { id: string; name: string; email: string | null; phone: string | null };
type Contact = { id: string; email: string | null };

async function access(req: NextRequest, organisationId: string) {
  if (!uuid.test(organisationId)) return { error: 'Invalid organisation', status: 400 } as const;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return { error: 'Server configuration missing', status: 500 } as const;
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return { error: 'Sign in required', status: 401 } as const;
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return { error: 'Invalid session', status: 401 } as const;
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [owner, member] = await Promise.all([
    db.from('organisations').select('id').eq('id', organisationId).eq('created_by', user.id).maybeSingle(),
    db.from('organisation_members').select('organisation_id').eq('organisation_id', organisationId).eq('user_id', user.id).maybeSingle(),
  ]);
  if (owner.error || member.error) return { error: 'Access check failed', status: 500 } as const;
  if (!owner.data && !member.data) return { error: 'Access denied', status: 403 } as const;
  return { db, user } as const;
}

async function processBatch(req: NextRequest, execute: boolean) {
  let body: { organisationId?: string; leadIds?: string[] };
  try { body = await req.json(); } catch { return fail('Invalid JSON'); }
  const organisationId = body.organisationId || '';
  const ctx = await access(req, organisationId);
  if (ctx.error) return fail(ctx.error, ctx.status);
  const ids = body.leadIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50 || ids.some(id => typeof id !== 'string' || !uuid.test(id)) || new Set(ids).size !== ids.length) {
    return fail('Supply 1–50 unique valid lead IDs');
  }
  const [leadResult, linkResult] = await Promise.all([
    ctx.db.from('growth_leads').select('id,name,email,phone').eq('organisation_id', organisationId).in('id', ids),
    ctx.db.from('growth_crm_links').select('lead_id,contact_id').eq('organisation_id', organisationId).in('lead_id', ids),
  ]);
  if (leadResult.error || linkResult.error) return fail('Unable to load leads or CRM links', 500);
  const leads = (leadResult.data || []) as Lead[];
  if (leads.length !== ids.length) return fail('Some leads were not found in this organisation', 404);
  const linked = new Set((linkResult.data || []).map(row => row.lead_id));
  const results: { leadId: string; status: string; contactId?: string; error?: string }[] = [];
  for (const lead of leads) {
    if (linked.has(lead.id)) { results.push({ leadId: lead.id, status: 'already_linked' }); continue; }
    const email = lead.email?.trim();
    if (!email) { results.push({ leadId: lead.id, status: 'needs_review', error: 'Missing email; manual CRM review required' }); continue; }
    const matches = await ctx.db.from('contacts').select('id,email').eq('organisation_id', organisationId).ilike('email', email).limit(2);
    if (matches.error) { results.push({ leadId: lead.id, status: 'error', error: 'Contact lookup failed' }); continue; }
    if ((matches.data || []).length > 1) { results.push({ leadId: lead.id, status: 'needs_review', error: 'Duplicate contacts with same email' }); continue; }
    const match = (matches.data || [])[0] as Contact | undefined;
    if (!execute) { results.push({ leadId: lead.id, status: match ? 'would_link' : 'would_create', ...(match ? { contactId: match.id } : {}) }); continue; }
    let contactId = match?.id;
    let created = false;
    if (!contactId) {
      const createdContact = await ctx.db.from('contacts').insert({ organisation_id: organisationId, name: lead.name, email, phone: lead.phone || null }).select('id').single();
      if (createdContact.error || !createdContact.data) { results.push({ leadId: lead.id, status: 'error', error: 'Contact creation failed' }); continue; }
      contactId = createdContact.data.id;
      created = true;
    }
    const saved = await ctx.db.from('growth_crm_links').upsert({ organisation_id: organisationId, lead_id: lead.id, contact_id: contactId, linked_by: ctx.user.id }, { onConflict: 'lead_id', ignoreDuplicates: true });
    if (saved.error) { results.push({ leadId: lead.id, status: 'error', error: 'Contact exists but linking failed; retry' }); continue; }
    await ctx.db.from('growth_activities').insert({ organisation_id: organisationId, lead_id: lead.id, event_type: 'crm_linked', details: { contact_id: contactId, created, source: 'bulk_sync' }, actor_id: ctx.user.id });
    results.push({ leadId: lead.id, status: created ? 'created' : 'linked', contactId });
  }
  return NextResponse.json({ executed: execute, results }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST only previews. PUT performs writes after explicit confirmation in the UI.
export async function POST(req: NextRequest) { return processBatch(req, false); }
export async function PUT(req: NextRequest) { return processBatch(req, true); }
