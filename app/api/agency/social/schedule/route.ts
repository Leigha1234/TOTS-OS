import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const VIDEO_EXT = /\.(mp4|mov|m4v)(?:$|[?#])/i;

/** Organisation-authorised queueing. The existing cron worker publishes the post. */
export async function POST(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json();
    const organisationId = typeof body.organisationId === "string" ? body.organisationId : "";
    const access = await requireAgencySocialAccess(request.headers.get("authorization"), organisationId, "publish");
    if (!access.ok) return fail(access.error, access.status);

    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const platform = body.platform;
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const scheduledFor = typeof body.scheduledFor === "string" ? body.scheduledFor : "";
    const scheduled = new Date(scheduledFor);
    if (!caption || caption.length > 10000 || !["facebook", "instagram"].includes(String(platform)) ||
        !UUID.test(accountId) || !Number.isFinite(scheduled.getTime()) || scheduled.getTime() < Date.now() + 60_000) {
      return fail("Invalid caption, platform, account or future schedule", 400);
    }

    const supplied = body.mediaUrls;
    if (supplied !== undefined && (!Array.isArray(supplied) || supplied.some((url) => typeof url !== "string"))) {
      return fail("mediaUrls must be an array of URLs", 400);
    }
    const mediaUrls = Array.isArray(supplied)
      ? supplied.map((url: string) => url.trim()).filter(Boolean)
      : [];
    const single = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    if (single && !mediaUrls.includes(single)) mediaUrls.unshift(single);
    if (new Set(mediaUrls).size !== mediaUrls.length) return fail("Duplicate media URLs", 400);
    if (mediaUrls.length > 10) return fail("A carousel can contain at most 10 media items", 400);
    if (platform === "instagram" && mediaUrls.length === 0) return fail("Instagram requires at least one image or video", 400);
    if (platform === "facebook" && mediaUrls.length > 1 && mediaUrls.some((url) => VIDEO_EXT.test(url))) {
      return fail("Facebook multi-image posts support images only; publish videos separately", 400);
    }

    const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!storageBase) return fail("Storage is not configured", 500);
    const origin = new URL(storageBase).origin;
    const expectedPrefix = `/storage/v1/object/public/social-assets/organisations/${organisationId}/`;
    for (const mediaUrl of mediaUrls) {
      let parsed: URL;
      try { parsed = new URL(mediaUrl); } catch { return fail("Invalid media URL", 400); }
      if (parsed.origin !== origin || !parsed.pathname.startsWith(expectedPrefix) ||
          parsed.pathname.slice(expectedPrefix.length).includes("/") || !parsed.pathname.slice(expectedPrefix.length)) {
        return fail("All media must be uploaded to the selected organisation", 400);
      }
    }

    const { data: account, error: accountError } = await access.db.from("social_accounts")
      .select("id,platform,instagram_business_account_id,page_id")
      .eq("id", accountId).eq("organisation_id", organisationId).maybeSingle();
    if (accountError) return fail("Unable to verify social connection", 500);
    if (!account || !["meta", "facebook", "instagram"].includes(account.platform)) return fail("Connected Meta account not found", 404);

    // The current worker resolves the organisation's Meta connection. Do not allow ambiguous selection.
    const { data: accounts, error: accountsError } = await access.db.from("social_accounts")
      .select("id").eq("organisation_id", organisationId).in("platform", ["meta", "facebook", "instagram"]);
    if (accountsError) return fail("Unable to verify connected accounts", 500);
    if (accounts?.length !== 1 || accounts[0]?.id !== accountId) {
      return fail("This organisation must have exactly one Meta connection for safe publishing", 409);
    }
    if (platform === "instagram" && !account.instagram_business_account_id) return fail("Instagram business account not connected", 409);
    if (platform === "facebook" && !account.page_id) return fail("Facebook page not connected", 409);

    const format = mediaUrls.length > 1 ? "carousel" : (typeof body.format === "string" ? body.format : "post");
    const { data, error } = await access.db.from("socials").insert({
      organisation_id: organisationId,
      user_id: access.user.id,
      platform,
      caption,
      format,
      media_url: mediaUrls[0] || null,
      media_urls: mediaUrls,
      scheduled_for: scheduled.toISOString(),
      status: "scheduled",
    }).select("id,organisation_id,platform,scheduled_for,status").single();
    if (error) {
      console.error("[AGENCY SOCIAL SCHEDULE]", error.message);
      return fail("Unable to schedule post", 500);
    }
    return NextResponse.json({ post: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Invalid schedule request", 400);
  }
}

/** Edit a pending organisation post without changing its owner or platform. */
export async function PATCH(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json();
    const organisationId = typeof body.organisationId === "string" ? body.organisationId : "";
    const access = await requireAgencySocialAccess(request.headers.get("authorization"), organisationId, "edit");
    if (!access.ok) return fail(access.error, access.status);
    const postId = typeof body.postId === "string" ? body.postId : "";
    const platform = typeof body.platform === "string" ? body.platform : "";
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const hashtags = typeof body.hashtags === "string" ? body.hashtags.trim() : "";
    const when = typeof body.scheduledFor === "string" ? new Date(body.scheduledFor) : new Date(NaN);
    if (!UUID.test(postId) || !["facebook", "instagram"].includes(platform) || !caption || caption.length > 10000 ||
        !Number.isFinite(when.getTime()) || when.getTime() < Date.now() + 120_000) {
      return fail("Invalid post, caption or future schedule", 400);
    }
    if (!Array.isArray(body.mediaUrls) || body.mediaUrls.length > 10 ||
        body.mediaUrls.some((url) => typeof url !== "string")) return fail("Invalid media list", 400);
    const mediaUrls = (body.mediaUrls as string[]).map((url) => url.trim()).filter(Boolean);
    if (new Set(mediaUrls).size !== mediaUrls.length) return fail("Duplicate media URLs", 400);
    if (platform === "instagram" && !mediaUrls.length) return fail("Instagram requires media", 400);
    if (platform === "facebook" && mediaUrls.length > 1 && mediaUrls.some((url) => VIDEO_EXT.test(url))) {
      return fail("Facebook multi-image posts cannot include videos", 400);
    }
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!storageUrl) return fail("Storage is not configured", 500);
    const origin = new URL(storageUrl).origin;
    const prefix = `/storage/v1/object/public/social-assets/organisations/${organisationId}/`;
    for (const url of mediaUrls) {
      let parsed: URL;
      try { parsed = new URL(url); } catch { return fail("Invalid media URL", 400); }
      if (parsed.origin !== origin || !parsed.pathname.startsWith(prefix) ||
          !parsed.pathname.slice(prefix.length) || parsed.pathname.slice(prefix.length).includes("/")) {
        return fail("Media must belong to the selected organisation", 400);
      }
    }
    // Do not update a post that the worker has already claimed or attempted.
    const { data: existing, error: lookupError } = await access.db.from("socials")
      .select("id,status,attempts,last_attempt_at")
      .eq("id", postId).eq("organisation_id", organisationId).eq("platform", platform).maybeSingle();
    if (lookupError) return fail("Unable to load post", 500);
    if (!existing) return fail("Post not found", 404);
    if (existing.status !== "scheduled" || Number(existing.attempts || 0) > 0 || existing.last_attempt_at) {
      return fail("This post has already started publishing and cannot be edited", 409);
    }
    const format = mediaUrls.length > 1 ? "carousel" : (typeof body.format === "string" ? body.format : "Post");
    const { data, error } = await access.db.from("socials").update({
      caption, hashtags: hashtags || null, media_url: mediaUrls[0] || null,
      media_urls: mediaUrls, scheduled_for: when.toISOString(), format,
    }).eq("id", postId).eq("organisation_id", organisationId).eq("platform", platform)
      .eq("status", "scheduled").is("last_attempt_at", null)
      .select("id,platform,status,scheduled_for").maybeSingle();
    if (error) return fail("Unable to update post", 500);
    if (!data) return fail("Post is no longer editable", 409);
    return NextResponse.json({ post: data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail("Invalid edit request", 400);
  }
}
