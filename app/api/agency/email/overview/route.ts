import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const organisationId = request.nextUrl.searchParams.get("organisationId") || "";
  if (!UUID.test(organisationId)) return NextResponse.json({ error: "Invalid organisation" }, { status: 400 });
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [owner, member, profile, grants] = await Promise.all([
    db.from("organisations").select("id").eq("id", organisationId).eq("created_by", user.id).maybeSingle(),
    db.from("organisation_members").select("id").eq("organisation_id", organisationId).eq("user_id", user.id).maybeSingle(),
    db.from("profiles").select("organisation_id").eq("id", user.id).maybeSingle(),
    db.from("agency_access_grants").select("grantee_type,grantee_email,grantee_organisation_id,permissions").eq("client_organisation_id", organisationId).eq("status", "active"),
  ]);
  if (owner.error || member.error || profile.error || grants.error) return NextResponse.json({ error: "Access verification failed" }, { status: 500 });
  let allowed = Boolean(owner.data || member.data || profile.data?.organisation_id === organisationId);
  if (!allowed) {
    const eligible = (grants.data || []).filter(g => {
      const p = g.permissions as Record<string, Record<string, boolean>> | null;
      return p?.email?.view === true;
    });
    const email = user.email_confirmed_at ? user.email?.trim().toLowerCase() : null;
    allowed = Boolean(email && eligible.some(g => g.grantee_type === "individual" && g.grantee_email?.trim().toLowerCase() === email));
    if (!allowed) {
      const ids = [...new Set(eligible.filter(g => g.grantee_type === "organisation" && g.grantee_organisation_id).map(g => g.grantee_organisation_id as string))];
      if (ids.length) {
        const [owned, joined] = await Promise.all([
          db.from("organisations").select("id").in("id", ids).eq("created_by", user.id),
          db.from("organisation_members").select("organisation_id").in("organisation_id", ids).eq("user_id", user.id),
        ]);
        if (owned.error || joined.error) return NextResponse.json({ error: "Agency verification failed" }, { status: 500 });
        const memberIds = new Set([...(owned.data || []).map(x => x.id), ...(joined.data || []).map(x => x.organisation_id)]);
        allowed = ids.some(id => memberIds.has(id));
      }
    }
  }
  if (!allowed) return NextResponse.json({ error: "Email Marketing view permission not granted" }, { status: 403 });
  const [campaigns, lists] = await Promise.all([
    db.from("campaigns").select("id,title,subject,status,scheduled_for,sent_at,created_at,sent_count,open_count,click_count,list_id").eq("organisation_id", organisationId).order("created_at", { ascending: false }).limit(100),
    db.from("subscriber_lists").select("id,name").eq("organisation_id", organisationId).order("name").limit(100),
  ]);
  if (campaigns.error || lists.error) return NextResponse.json({ error: "Unable to load client campaigns" }, { status: 500 });
  return NextResponse.json({ campaigns: campaigns.data || [], lists: lists.data || [] }, { headers: { "Cache-Control": "no-store" } });
}
