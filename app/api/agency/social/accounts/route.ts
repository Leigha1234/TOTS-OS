import { NextRequest, NextResponse } from "next/server";
import { requireAgencySocialAccess } from "../../../../../lib/agency-social-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only, organisation-scoped account discovery for the full Social Studio.
 * Never sends Meta credentials or access tokens to the browser.
 */
export async function GET(request: NextRequest) {
  const organisationId = request.nextUrl.searchParams.get("organisationId") ?? "";
  const access = await requireAgencySocialAccess(
    request.headers.get("authorization"),
    organisationId,
    "view",
  );

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await access.db
    .from("social_accounts")
    .select("id,platform,display_name,page_name,avatar_url,page_id,instagram_business_account_id,updated_at")
    .eq("organisation_id", access.organisationId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[AGENCY SOCIAL ACCOUNTS]", error.message);
    return NextResponse.json(
      { error: "Unable to load connected social accounts" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { organisationId: access.organisationId, accounts: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
