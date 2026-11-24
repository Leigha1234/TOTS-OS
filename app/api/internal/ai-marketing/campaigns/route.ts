import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStore });
const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const statuses = ["draft", "in_review", "approved"] as const;
type Status = typeof statuses[number];

async function authenticate(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowed = (process.env.ORBI_AI_MARKETING_ALLOWED_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!url || !anon || !allowed.length) throw new Error("CONFIG");
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("AUTH");
  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user?.email_confirmed_at || !allowed.includes((user.email || "").trim().toLowerCase())) throw new Error("AUTH");
  return { db, user };
}
async function handle(req: NextRequest, method: "GET" | "POST" | "PATCH" | "DELETE") {
  try {
    const { db, user } = await authenticate(req);
    const table = db.from("orbi_ai_marketing_campaigns");
    if (method === "GET") {
      const { data, error } = await table.select("id,business,channel,goal,content,status,scheduled_for,created_at,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(250);
      if (error) throw error;
      return json({ campaigns: data });
    }
    let body: Record<string, unknown>;
    try { body = await req.json(); if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid JSON object" }, 400); }
    catch { return json({ error: "Invalid JSON" }, 400); }
    if (method === "DELETE") {
      if (!uuid(body.id)) return json({ error: "Invalid campaign ID" }, 400);
      const { error } = await table.delete().eq("id", body.id).eq("owner_id", user.id);
      if (error) throw error;
      return json({ success: true });
    }
    const payload: Record<string, unknown> = {};
    for (const [field, max] of Object.entries({ business: 100, channel: 30, goal: 1200, content: 20000 })) {
      if (method === "POST" || field in body) {
        if (typeof body[field] !== "string" || !body[field].trim() || body[field].length > max) return json({ error: `Invalid ${field}` }, 400);
        payload[field] = body[field].trim();
      }
    }
    if (payload.channel && !["Email", "Social", "Meta Ads"].includes(payload.channel as string)) return json({ error: "Invalid channel" }, 400);
    if ("scheduled_for" in body) {
      if (body.scheduled_for !== null && (typeof body.scheduled_for !== "string" || !/^\d{4}-\d\d-\d\dT/.test(body.scheduled_for) || !Number.isFinite(Date.parse(body.scheduled_for)))) return json({ error: "Invalid planning date" }, 400);
      payload.scheduled_for = body.scheduled_for;
    }
    if (method === "POST") {
      payload.owner_id = user.id;
      payload.status = "draft";
      const { data, error } = await table.insert(payload).select("id").single();
      if (error) throw error;
      return json({ success: true, id: data.id }, 201);
    }
    if (!uuid(body.id)) return json({ error: "Invalid campaign ID" }, 400);
    if ("status" in body) {
      if (!statuses.includes(body.status as Status)) return json({ error: "Invalid review status" }, 400);
      payload.status = body.status;
    }
    if (!Object.keys(payload).length) return json({ error: "No changes supplied" }, 400);
    // Editing approved content invalidates the previous review marker.
    if ("content" in payload || "goal" in payload || "channel" in payload || "business" in payload) payload.status = "draft";
    const { data, error } = await table.update(payload).eq("id", body.id).eq("owner_id", user.id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Campaign not found" }, 404);
    return json({ success: true, id: data.id });
  } catch (e) {
    if (e instanceof Error && e.message === "AUTH") return json({ error: "Unauthorised" }, 401);
    if (e instanceof Error && e.message === "CONFIG") return json({ error: "Marketing engine not configured" }, 503);
    console.error("ORBI marketing campaign storage failed", e);
    return json({ error: "Campaign database unavailable. Check that the V4 SQL migration was applied." }, 503);
  }
}
export const GET = (req: NextRequest) => handle(req, "GET");
export const POST = (req: NextRequest) => handle(req, "POST");
export const PATCH = (req: NextRequest) => handle(req, "PATCH");
export const DELETE = (req: NextRequest) => handle(req, "DELETE");
