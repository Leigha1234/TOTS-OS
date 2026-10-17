import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Queue an organisation's Meta post. The cron worker performs actual publishing. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const organisationId = typeof body.organisationId === "string" ? body.organisationId : "";
    const access = await requireAgencySocialAccess(request.headers.get("authorization"), organisationId, "publish");
    if (!access.ok) return fail(access.error, access.status);
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const platform = body.platform;
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const mediaUrl = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];
    if (mediaUrls.length > 1) return fail("Multiple media items are not supported by the agency scheduling endpoint yet", 400);
    const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : "";
    const scheduled = new Date(scheduledFor);
    if (!caption || caption.length > 10000 || !["facebook", "instagram"].includes(String(platform)) ||
        !UUID.test(accountId) || !Number.isFinite(scheduled.getTime()) || scheduled.getTime() < Date.now() + 60_000) {
      return fail("Invalid caption, platform, account or future schedule", 400);
    }
    if (platform === "instagram" && !mediaUrl) return fail("Instagram requires media", 400);
    if (mediaUrl) {
      let parsed: URL;
      try { parsed = new URL(mediaUrl); } catch { return fail("Invalid media URL", 400); }
      const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.example").origin;
      if (parsed.origin !== storageOrigin || !parsed.pathname.startsWith("/storage/v1/object/public/social-assets/organisations/" + organisationId + "/")) {
        return fail("Media must be uploaded to this organisation", 400);
      }
    }
    const { data: account, error: accountError } = await access.db.from("social_accounts")
      .select("id,platform,instagram_business_account_id,page_id")
      .eq("id", accountId).eq("organisation_id", organisationId).maybeSingle();
    if (accountError) return fail("Unable to verify social connection", 500);
    if (!account || !["meta", "facebook", "instagram"].includes(account.platform)) return fail("Connected Meta account not found", 404);
    // The existing cron worker selects the first organisation Meta account.
    // Refuse ambiguous setups rather than risk publishing to a different page.
    const { data: allAccounts, error: allAccountsError } = await access.db.from("social_accounts")
      .select("id,platform").eq("organisation_id", organisationId).in("platform", ["meta", "facebook", "instagram"]);
    if (allAccountsError) return fail("Unable to verify connected accounts", 500);
    if ((allAccounts || []).length !== 1 || allAccounts?.[0]?.id !== accountId) {
      return fail("This organisation must have exactly one Meta connection for safe publishing", 409);
    }
    if (platform === "instagram" && !account.instagram_business_account_id) return fail("Instagram business account not connected", 409);
    if (platform === "facebook" && !account.page_id) return fail("Facebook page not connected", 409);
    const { data, error } = await access.db.from("socials").insert({
      organisation_id: organisationId, user_id: access.user.id, platform,
      caption, media_url: mediaUrl || null, media_urls: mediaUrl ? [mediaUrl] : [],
      scheduled_for: scheduled.toISOString(), status: "scheduled",
    }).select("id,organisation_id,platform,scheduled_for,status").single();
    if (error) { console.error("[AGENCY SOCIAL SCHEDULE]", error.message); return fail("Unable to schedule post", 500); }
    return NextResponse.json({ post: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return fail("Invalid schedule request", 400); }
}
