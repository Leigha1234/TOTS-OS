import { NextRequest, NextResponse } from "next/server";
import { isUuid, requireAgencyEmailAccess } from "@/lib/agency-email-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const fail = (status: number, error: string) => NextResponse.json({ error }, { status });
export async function GET(req: NextRequest) {
  const org = req.nextUrl.searchParams.get("organisationId") || "";
  const a = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "view"); if (!a.ok) return fail(a.status, a.error);
  const listId = req.nextUrl.searchParams.get("listId");
  if (!isUuid(listId)) return fail(400, "Valid audience required");
  const { data: list } = await a.db.from("subscriber_lists").select("id").eq("organisation_id", org).eq("id", listId).maybeSingle();
  if (!list) return fail(404, "Audience not found");
  const { data, error } = await a.db.from("subscribers").select("id,email,name,status,unsubscribed,created_at").eq("organisation_id", org).eq("list_id", listId).order("created_at", { ascending: false }).limit(500);
  return error ? fail(500, "Unable to load subscribers") : NextResponse.json({ subscribers: data || [] });
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null); const org = body?.organisationId;
  const a = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "create"); if (!a.ok) return fail(a.status, a.error);
  if (!isUuid(body?.listId)) return fail(400, "Valid audience required");
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "Valid email required");
  if (body.consent !== true) return fail(400, "Documented marketing consent required");
  const { data: list } = await a.db.from("subscriber_lists").select("id").eq("organisation_id", org).eq("id", body.listId).maybeSingle();
  if (!list) return fail(404, "Audience not found");
  const { data: existing } = await a.db.from("subscribers").select("id,unsubscribed").eq("organisation_id", org).eq("list_id", body.listId).eq("email", email).maybeSingle();
  if (existing) return fail(409, existing.unsubscribed ? "Previously unsubscribed; obtain new consent before re-subscribing" : "Subscriber already exists");
  const { data, error } = await a.db.from("subscribers").insert({ organisation_id: org, list_id: body.listId, email, name: typeof body.name === "string" ? body.name.trim().slice(0, 200) : "", unsubscribed: false, status: "active" }).select("id,email,name,status").single();
  return error ? fail(500, "Unable to add subscriber") : NextResponse.json({ subscriber: data }, { status: 201 });
}
