import { NextRequest, NextResponse } from "next/server";
import { isUuid, requireAgencyEmailAccess } from "@/lib/agency-email-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (status: number, error: string) => NextResponse.json({ error }, { status });
export async function GET(req: NextRequest) {
  const org = req.nextUrl.searchParams.get("organisationId") || "";
  const a = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "view"); if (!a.ok) return fail(a.status, a.error);
  const { data, error } = await a.db.from("subscriber_lists").select("id,name,description,created_at,updated_at").eq("organisation_id", org).order("name").limit(200);
  return error ? fail(500, "Unable to load audiences") : NextResponse.json({ lists: data || [] });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null); const org = body?.organisationId;
  const a = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "create"); if (!a.ok) return fail(a.status, a.error);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 150) : "";
  if (!name) return fail(400, "Audience name required");
  const { data, error } = await a.db.from("subscriber_lists").insert({ organisation_id: org, user_id: a.user.id, name, description: typeof body.description === "string" ? body.description.slice(0, 2000) : "" }).select("id,name,description").single();
  return error ? fail(500, "Unable to create audience") : NextResponse.json({ list: data }, { status: 201 });
}
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null); const org = body?.organisationId;
  const a = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "edit"); if (!a.ok) return fail(a.status, a.error);
  if (!isUuid(body?.id) || typeof body?.name !== "string" || !body.name.trim()) return fail(400, "Invalid audience");
  const { data, error } = await a.db.from("subscriber_lists").update({ name: body.name.trim().slice(0, 150) }).eq("organisation_id", org).eq("id", body.id).select("id,name").maybeSingle();
  return error ? fail(500, "Unable to update audience") : !data ? fail(404, "Audience not found") : NextResponse.json({ list: data });
}
