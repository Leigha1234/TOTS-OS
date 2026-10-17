import { NextRequest, NextResponse } from "next/server";
import { isUuid, requireAgencyEmailAccess, type EmailAction } from "@/lib/agency-email-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (a: { status: number; error: string }) => NextResponse.json({ error: a.error }, { status: a.status });
const fields = "id,organisation_id,title,subject,content,custom_html,editor_mode,preview_text,template_id,list_id,status,scheduled_for,created_at,sent_at,sent_count,open_count,click_count,brand_color,brand_font,cta_text,cta_url,header_image_url,reply_to,sender_name,social_links";

const editableFields = ["content", "custom_html", "editor_mode", "preview_text", "template_id", "brand_color", "brand_font", "cta_text", "cta_url", "header_image_url", "reply_to", "sender_name"] as const;
function draftFields(body: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const key of editableFields) {
    const value = body[key];
    if (typeof value === "string") output[key] = value.slice(0, ["content", "custom_html"].includes(key) ? 500000 : 2000);
  }
  return output;
}
async function access(req: NextRequest, org: string, action: EmailAction) { return requireAgencyEmailAccess(req.headers.get("authorization"), org, action); }
export async function GET(req: NextRequest) {
  const org = req.nextUrl.searchParams.get("organisationId") || "";
  const a = await access(req, org, "view"); if (!a.ok) return fail(a);
  const id = req.nextUrl.searchParams.get("id");
  if (id && !isUuid(id)) return fail({ status: 400, error: "Invalid campaign" });
  let q = a.db.from("campaigns").select(fields).eq("organisation_id", org);
  if (id) q = q.eq("id", id);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(id ? 1 : 100);
  return error ? fail({ status: 500, error: "Could not load campaigns" }) : NextResponse.json({ campaigns: data || [] }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const org = body?.organisationId;
  const a = await access(req, org, "create"); if (!a.ok) return fail(a);
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 300) : "";
  if (!title || !subject) return fail({ status: 400, error: "Title and subject are required" });
  const listId = body?.listId;
  if (listId != null) {
    if (!isUuid(listId)) return fail({ status: 400, error: "Invalid audience" });
    const { data } = await a.db.from("subscriber_lists").select("id").eq("organisation_id", org).eq("id", listId).maybeSingle();
    if (!data) return fail({ status: 400, error: "Audience does not belong to this organisation" });
  }
  const { data, error } = await a.db.from("campaigns").insert({ organisation_id: org, user_id: a.user.id, title, subject, ...draftFields(body), content: typeof body.content === "string" ? body.content.slice(0, 500000) : "", list_id: listId || null, status: "draft" }).select(fields).single();
  return error ? fail({ status: 500, error: "Unable to create campaign" }) : NextResponse.json({ campaign: data }, { status: 201 });
}
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null); const org = body?.organisationId;
  const a = await access(req, org, "edit"); if (!a.ok) return fail(a);
  if (!isUuid(body?.id)) return fail({ status: 400, error: "Invalid campaign" });
  const { data: existing } = await a.db.from("campaigns").select("id,status").eq("id", body.id).eq("organisation_id", org).maybeSingle();
  if (!existing) return fail({ status: 404, error: "Campaign not found" });
  if (existing.status !== "draft") return fail({ status: 409, error: "Only draft campaigns can be edited through this endpoint" });
  const patch: Record<string, unknown> = draftFields(body);
  for (const key of ["title", "subject", "content", "custom_html", "preview_text", "sender_name", "reply_to", "cta_text", "cta_url", "header_image_url", "brand_color", "brand_font", "editor_mode"] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "string") return fail({ status: 400, error: `Invalid ${key}` });
      patch[key] = body[key].slice(0, ["content", "custom_html"].includes(key) ? 500000 : 2000);
    }
  }
  if (body.listId !== undefined) {
    if (body.listId !== null && !isUuid(body.listId)) return fail({ status: 400, error: "Invalid audience" });
    if (body.listId) {
      const { data } = await a.db.from("subscriber_lists").select("id").eq("organisation_id", org).eq("id", body.listId).maybeSingle();
      if (!data) return fail({ status: 400, error: "Audience does not belong to this organisation" });
    }
    patch.list_id = body.listId;
  }
  if (!Object.keys(patch).length) return fail({ status: 400, error: "No changes provided" });
  const { data, error } = await a.db.from("campaigns").update(patch).eq("id", body.id).eq("organisation_id", org).eq("status", "draft").select(fields).maybeSingle();
  return error ? fail({ status: 500, error: "Could not update campaign" }) : !data ? fail({ status: 409, error: "Campaign is no longer editable" }) : NextResponse.json({ campaign: data });
}
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null); const org = body?.organisationId;
  const a = await access(req, org, "delete"); if (!a.ok) return fail(a);
  if (!isUuid(body?.id)) return fail({ status: 400, error: "Invalid campaign" });
  const { data, error } = await a.db.from("campaigns").delete().eq("organisation_id", org).eq("id", body.id).eq("status", "draft").select("id").maybeSingle();
  return error ? fail({ status: 500, error: "Unable to delete campaign" }) : !data ? fail({ status: 409, error: "Only draft campaigns can be deleted" }) : NextResponse.json({ deleted: true });
}
