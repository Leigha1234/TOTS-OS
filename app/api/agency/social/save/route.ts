import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS = new Set(["facebook", "instagram"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function response(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Save a draft for an organisation the signed-in user is authorised to manage.
 * This route NEVER schedules or publishes content.
 * POST creates a draft; PATCH edits an existing draft.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return response("Invalid request", 400);
    const input = body as Record<string, unknown>;
    const organisationId = typeof input.organisationId === "string" ? input.organisationId : "";
    const access = await requireAgencySocialAccess(req.headers.get("authorization"), organisationId, "create");
    if (!access.ok) return response(access.error, access.status);

    const caption = typeof input.caption === "string" ? input.caption.trim() : "";
    const platform = typeof input.platform === "string" ? input.platform.toLowerCase() : "";
    const hashtags = typeof input.hashtags === "string" ? input.hashtags.trim() : "";
    if (!caption || caption.length > 10000 || !PLATFORMS.has(platform) || hashtags.length > 2000) {
      return response("Choose Facebook or Instagram and provide a caption (up to 10,000 characters)", 400);
    }

    const { data, error } = await access.db.from("socials").insert({
      organisation_id: organisationId,
      user_id: access.user.id,
      platform,
      caption,
      hashtags: hashtags || null,
      status: "draft",
    }).select("id,organisation_id,platform,caption,hashtags,status,created_at").single();
    if (error) {
      console.error("Agency draft creation failed", error.message);
      return response("Unable to save draft", 500);
    }
    return NextResponse.json({ post: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return response("Invalid request", 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return response("Invalid request", 400);
    const input = body as Record<string, unknown>;
    const organisationId = typeof input.organisationId === "string" ? input.organisationId : "";
    const postId = typeof input.postId === "string" ? input.postId : "";
    if (!UUID.test(postId)) return response("Invalid post", 400);
    const access = await requireAgencySocialAccess(req.headers.get("authorization"), organisationId, "edit");
    if (!access.ok) return response(access.error, access.status);

    const caption = typeof input.caption === "string" ? input.caption.trim() : "";
    const hashtags = typeof input.hashtags === "string" ? input.hashtags.trim() : "";
    if (!caption || caption.length > 10000 || hashtags.length > 2000) return response("Invalid caption or hashtags", 400);

    const { data, error } = await access.db.from("socials")
      .update({ caption, hashtags: hashtags || null })
      .eq("id", postId)
      .eq("organisation_id", organisationId)
      .eq("status", "draft")
      .select("id,organisation_id,platform,caption,hashtags,status,created_at")
      .maybeSingle();
    if (error) {
      console.error("Agency draft update failed", error.message);
      return response("Unable to update draft", 500);
    }
    if (!data) return response("Draft not found or not editable", 404);
    return NextResponse.json({ post: data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return response("Invalid request", 400);
  }
}
