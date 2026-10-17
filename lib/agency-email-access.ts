import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type EmailAction = "view" | "create" | "edit" | "delete" | "send";
type Access = { ok: true; db: SupabaseClient; user: User; organisationId: string } | { ok: false; status: number; error: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export async function requireAgencyEmailAccess(header: string | null, organisationId: string, action: EmailAction): Promise<Access> {
  if (!isUuid(organisationId)) return { ok: false, status: 400, error: "Invalid organisation" };
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false, status: 401, error: "Sign in required" };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return { ok: false, status: 500, error: "Server configuration missing" };
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return { ok: false, status: 401, error: "Unauthorised" };
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [owner, member, profile, grants] = await Promise.all([
    db.from("organisations").select("id").eq("id", organisationId).eq("created_by", user.id).maybeSingle(),
    db.from("organisation_members").select("id").eq("organisation_id", organisationId).eq("user_id", user.id).maybeSingle(),
    db.from("profiles").select("organisation_id").eq("id", user.id).maybeSingle(),
    db.from("agency_access_grants").select("grantee_type,grantee_email,grantee_organisation_id,permissions").eq("client_organisation_id", organisationId).eq("status", "active"),
  ]);
  if (owner.error || member.error || profile.error || grants.error) return { ok: false, status: 500, error: "Access lookup failed" };
  let allowed = Boolean(owner.data || member.data || profile.data?.organisation_id === organisationId);
  if (!allowed) {
    const eligible = (grants.data || []).filter(g => {
      const p = g.permissions as Record<string, Record<string, boolean>> | null;
      return p?.email?.[action] === true;
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
        if (owned.error || joined.error) return { ok: false, status: 500, error: "Agency membership lookup failed" };
        const membership = new Set([...(owned.data || []).map(x => x.id), ...(joined.data || []).map(x => x.organisation_id)]);
        allowed = ids.some(id => membership.has(id));
      }
    }
  }
  if (!allowed) return { ok: false, status: 403, error: `Email ${action} permission not granted` };
  return { ok: true, db, user, organisationId };
}
