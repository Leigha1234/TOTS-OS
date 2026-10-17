import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
const validUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anon || !service) return fail('Server configuration missing', 500);
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return fail('Unauthorised', 401);
    const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return fail('Unauthorised', 401);
    const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const [owners, members, profile, orgLinks] = await Promise.all([
      db.from('organisations').select('id,name,created_by').eq('created_by', user.id),
      db.from('organisation_members').select('organisation_id').eq('user_id', user.id),
      db.from('profiles').select('organisation_id').eq('id', user.id).maybeSingle(),
      db.from('user_organisations').select('organisation_id').eq('user_id', user.id),
    ]);
    for (const r of [owners, members, profile, orgLinks]) if (r.error) throw r.error;
    const directIds = new Set<string>((owners.data || []).map(o => o.id));
    for (const row of members.data || []) directIds.add(row.organisation_id);
    for (const row of orgLinks.data || []) directIds.add(row.organisation_id);
    if (profile.data?.organisation_id) directIds.add(profile.data.organisation_id);
    const orgIds = [...directIds].filter(validUuid);
    const email = user.email?.trim().toLowerCase() || '';
    const [individual, agency] = await Promise.all([
      email && user.email_confirmed_at
        ? db.from('agency_access_grants').select('client_organisation_id,permissions,grantee_type').eq('grantee_type', 'individual').ilike('grantee_email', email).eq('status', 'active')
        : Promise.resolve({ data: [], error: null }),
      orgIds.length
        ? db.from('agency_access_grants').select('client_organisation_id,permissions,grantee_type,grantee_organisation_id').eq('grantee_type', 'organisation').in('grantee_organisation_id', orgIds).eq('status', 'active')
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (individual.error || agency.error) throw individual.error || agency.error;
    // Agency grants require an actual owner or organisation_members record.
    // user_organisations and profiles alone are NOT proof of agency membership.
    const agencyMembership = new Set<string>((owners.data || []).map(o => o.id));
    for (const m of members.data || []) agencyMembership.add(m.organisation_id);
    const grants = [...(individual.data || []), ...(agency.data || []).filter(g => agencyMembership.has(g.grantee_organisation_id))];
    const delegated = new Map<string, Record<string, Record<string, boolean>>>();
    for (const g of grants) {
      const map = delegated.get(g.client_organisation_id) || {};
      for (const [module, actions] of Object.entries(g.permissions || {})) {
        if (!actions || typeof actions !== 'object' || Array.isArray(actions)) continue;
        map[module] ||= {};
        for (const [action, enabled] of Object.entries(actions as Record<string, unknown>)) {
          if (enabled === true) map[module][action] = true;
        }
      }
      delegated.set(g.client_organisation_id, map);
    }
    const allIds = [...new Set([...orgIds, ...delegated.keys()])];
    if (!allIds.length) return NextResponse.json({ contexts: [] });
    const { data: orgs, error: orgError } = await db.from('organisations').select('id,name,created_by').in('id', allIds);
    if (orgError) throw orgError;
    const contexts = (orgs || []).map(o => ({
      id: o.id,
      name: o.name,
      kind: directIds.has(o.id) ? 'direct' : 'delegated',
      owner: o.created_by === user.id,
      permissions: directIds.has(o.id) ? null : delegated.get(o.id) || {},
    }));
    return NextResponse.json({ contexts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('Agency contexts error', e);
    return fail('Could not load organisation contexts', 500);
  }
}
