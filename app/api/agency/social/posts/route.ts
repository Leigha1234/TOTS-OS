import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only, organisation-scoped post listing for the full editor. */
export async function GET(request: NextRequest) {
  const organisationId = request.nextUrl.searchParams.get("organisationId") ?? "";
  const access = await requireAgencySocialAccess(
    request.headers.get("authorization"),
    organisationId,
    "view"
  );
  if ("error" in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data, error } = await access.db
    .from("socials")
    .select("id,caption,platform,hashtags,media_url,media_urls,scheduled_for,status,format,created_at,posted_at,platform_post_id,error")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[AGENCY SOCIAL POSTS]", error.message);
    return NextResponse.json(
      { error: "Unable to load organisation posts" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { posts: data ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}
