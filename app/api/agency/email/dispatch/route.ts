import { NextRequest, NextResponse } from "next/server";
import { requireAgencyEmailAccess, isUuid } from "@/lib/agency-email-access";
import { POST as queueCampaign } from "@/app/api/campaigns/send/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const org = body?.organisationId;
  const access = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "send");
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (body?.mode !== "send" && body?.mode !== "schedule") return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  const listId = body?.listId;
  if (!isUuid(listId)) return NextResponse.json({ error: "Choose an audience" }, { status: 400 });
  const { data: list, error: listError } = await access.db.from("subscriber_lists")
    .select("id").eq("id", listId).eq("organisation_id", org).maybeSingle();
  if (listError || !list) return NextResponse.json({ error: "Audience does not belong to this organisation" }, { status: 400 });
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";
  if (!title || !subject || !content || content.length > 500000) return NextResponse.json({ error: "Campaign name, subject and content are required" }, { status: 400 });
  const scheduledFor = body.mode === "schedule" ? body.scheduledFor : null;
  if (body.mode === "schedule" && (typeof scheduledFor !== "string" || !Number.isFinite(Date.parse(scheduledFor)) || Date.parse(scheduledFor) <= Date.now()))
    return NextResponse.json({ error: "Choose a future schedule time" }, { status: 400 });
  const patch = { title: title.slice(0,200), subject: subject.slice(0,300), content,
    list_id: listId, preview_text: typeof body.preview_text === "string" ? body.preview_text.slice(0,1000) : null,
    sender_name: typeof body.sender_name === "string" ? body.sender_name.slice(0,200) : null,
    reply_to: typeof body.reply_to === "string" ? body.reply_to.slice(0,320) : null,
    editor_mode: typeof body.editor_mode === "string" ? body.editor_mode : "html",
    custom_html: typeof body.custom_html === "string" ? body.custom_html.slice(0,500000) : null,
    scheduled_for: scheduledFor, status: body.mode === "schedule" ? "queued" : "draft" };
  let campaignId: string;
  if (body.campaignId) {
    if (!isUuid(body.campaignId)) return NextResponse.json({ error: "Invalid campaign" }, { status: 400 });
    const { data, error } = await access.db.from("campaigns").update(patch)
      .eq("id", body.campaignId).eq("organisation_id", org).eq("status", "draft")
      .select("id").maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Draft is no longer editable" }, { status: 409 });
    campaignId = data.id;
  } else {
    const { data, error } = await access.db.from("campaigns")
      .insert({ ...patch, organisation_id: org, user_id: access.user.id })
      .select("id").single();
    if (error || !data) return NextResponse.json({ error: error?.message || "Unable to save campaign" }, { status: 500 });
    campaignId = data.id;
  }
  if (body.mode === "schedule") return NextResponse.json({ success: true, campaignId, scheduledFor });
  const internal = new NextRequest(new URL("/api/campaigns/send", req.url), {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: req.headers.get("authorization") || "" },
    body: JSON.stringify({ campaignId, organisationId: org }) });
  const response = await queueCampaign(internal);
  const result = await response.json().catch(() => ({}));
  return NextResponse.json(result, { status: response.status });
}
