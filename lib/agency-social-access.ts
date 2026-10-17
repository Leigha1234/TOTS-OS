import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type SocialPermission = "view" | "create" | "edit" | "delete" | "publish";

type AccessResult =
  | { ok: true; db: SupabaseClient; user: User; organisationId: string }
  | { ok: false; status: number; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authorise an individual Social Studio action for a requested organisation.
 * Intended for server-only API routes; never import this into client components.
 * A browser-provided organisation ID is never proof of access.
 */
export async function requireAgencySocialAccess(
  bearerToken: string | null | undefined,
  organisationId: string,
  action: SocialPermission,
): Promise<AccessResult> {
  if (!UUID.test(organisationId)) return { ok: false, status: 400, error: "Invalid organisation" };
  const token = bearerToken?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false, status: 401, error: "Unauthorised" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return { ok: false, status: 500, error: "Server configuration missing" };

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return { ok: false, status: 401, error: "Unauthorised" };

  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [owner, member, profile, grants] = await Promise.all([
    db.from("organisations").select("id").eq("id", organisationId).eq("created_by", user.id).maybeSingle(),
    db.from("organisation_members").select("id").eq("organisation_id", organisationId).eq("user_id", user.id).maybeSingle(),
    db.from("profiles").select("organisation_id").eq("id", user.id).maybeSingle(),
    db.from("agency_access_grants").select("grantee_type,grantee_email,grantee_organisation_id,permissions")
      .eq("client_organisation_id", organisationId).eq("status", "active"),
  ]);
  if (owner.error || member.error || profile.error || grants.error) {
    return { ok: false, status: 500, error: "Access lookup failed" };
  }

  let allowed = Boolean(owner.data || member.data || profile.data?.organisation_id === organisationId);
  if (!allowed) {
    const eligible = (grants.data ?? []).filter((grant) => {
      const permissions = grant.permissions as Record<string, Record<string, boolean>> | null;
      return permissions?.social?.[action] === true;
    });
    const email = user.email_confirmed_at ? user.email?.trim().toLowerCase() : null;
    if (email) {
      allowed = eligible.some((grant) => grant.grantee_type === "individual" && grant.grantee_email?.trim().toLowerCase() === email);
    }
    if (!allowed) {
      const agencyIds = [...new Set(eligible
        .filter((grant) => grant.grantee_type === "organisation" && grant.grantee_organisation_id)
        .map((grant) => grant.grantee_organisation_id as string))];
      if (agencyIds.length) {
        const [owned, joined] = await Promise.all([
          db.from("organisations").select("id").in("id", agencyIds).eq("created_by", user.id),
          db.from("organisation_members").select("organisation_id").in("organisation_id", agencyIds).eq("user_id", user.id),
        ]);
        if (owned.error || joined.error) return { ok: false, status: 500, error: "Agency membership lookup failed" };
        const memberOf = new Set([...(owned.data ?? []).map((x) => x.id), ...(joined.data ?? []).map((x) => x.organisation_id)]);
        allowed = agencyIds.some((id) => memberOf.has(id));
      }
    }
  }
  if (!allowed) return { ok: false, status: 403, error: `Social ${action} permission not granted` };
  return { ok: true, db, user, organisationId };
}
