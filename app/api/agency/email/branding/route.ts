import { NextRequest, NextResponse } from "next/server";
import { requireAgencyEmailAccess } from "@/lib/agency-email-access";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const org = req.nextUrl.searchParams.get("organisationId") || "";
  const access = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "view");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const [organisation, team] = await Promise.all([
    access.db.from("organisations").select("name").eq("id", org).maybeSingle(),
    access.db.from("team").select("*").eq("organisation_id", org).limit(1).maybeSingle(),
  ]);
  if (organisation.error || !organisation.data) return NextResponse.json({ error: "Unable to load client branding" }, { status: 500 });
  const branding = team.data;
  // Never default to the agency user's personal profile or email address.
  return NextResponse.json({
    company: {
      name: branding?.company_name || branding?.name || organisation.data.name,
      email: branding?.company_email || branding?.email || "",
      logoUrl: branding?.logo_url || "",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
