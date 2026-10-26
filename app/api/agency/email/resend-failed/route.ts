import { NextRequest, NextResponse } from "next/server";
import { isUuid, requireAgencyEmailAccess } from "@/lib/agency-email-access";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const access = await requireAgencyEmailAccess(req.headers.get("authorization"), body?.organisationId, "send");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!isUuid(body?.campaignId)) return NextResponse.json({ error: "Invalid campaign" }, { status: 400 });
  const campaign = await access.db.from("campaigns").select("id,status").eq("id", body.campaignId).eq("organisation_id", access.organisationId).maybeSingle();
  if (campaign.error || !campaign.data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (["processing", "sending", "queued"].includes(campaign.data.status)) return NextResponse.json({ error: "Campaign is already queued or processing" }, { status: 409 });
  // Sent deliveries are never reset. The existing worker applies suppression checks.
  const result = await access.db.from("campaign_deliveries").update({ status: "pending", attempts: 0, last_error: null, updated_at: new Date().toISOString() }).eq("campaign_id", body.campaignId).eq("organisation_id", access.organisationId).eq("status", "failed").select("id");
  if (result.error) return NextResponse.json({ error: "Could not retry failed deliveries" }, { status: 500 });
  const count = result.data?.length || 0;
  if (count) {
    const update = await access.db.from("campaigns").update({ status: "processing", scheduled_for: null }).eq("id", body.campaignId).eq("organisation_id", access.organisationId);
    if (update.error) return NextResponse.json({ error: "Could not restart campaign" }, { status: 500 });
  }
  return NextResponse.json({ success: true, queued: count, message: `${count} failed email(s) queued to resend.` });
}
