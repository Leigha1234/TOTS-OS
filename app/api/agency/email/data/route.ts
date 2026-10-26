import { NextRequest, NextResponse } from "next/server";
import { isUuid, requireAgencyEmailAccess, type EmailAction } from "@/lib/agency-email-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is deliberately not an arbitrary service-role database proxy.
// Exact projections, operations, writable fields and tenant filters are fixed here.
const projections: Record<string, string[]> = {
  campaigns: ["*", "*, subscriber_lists(name)", "id"],
  subscriber_lists: ["*"],
  profiles: ["id,name,full_name,email,is_subscribed"],
  profile_subscriber_lists: ["list_id,profile_id,profiles:profiles(email)", "profile_id,profiles:profiles(id,name,full_name,email)"],
  campaign_list_emails: ["list_id,id,email", "id,email,first_name", "email"],
  campaign_opens: ["id,campaign_id,profile_id"],
  campaign_clicks: ["id,campaign_id,profile_id"],
  campaign_deliveries: ["campaign_id,status"],
};
const writable: Record<string, string[]> = {
  campaigns: ["title", "subject", "preview_text", "content", "list_id", "scheduled_for", "sender_name", "reply_to", "header_image_url", "brand_color", "cta_text", "cta_url", "editor_mode", "custom_html"],
  subscriber_lists: ["name"],
  campaign_list_emails: ["list_id", "email", "first_name"],
  profile_subscriber_lists: ["list_id", "profile_id"],
};
const fail = (status: number, error: string) => NextResponse.json({ error }, { status });
type Filter = { op: "eq" | "in"; column: string; value: unknown };
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get("content-length") || 0) > 2_000_000) return fail(413, "Request too large");
    const body = await req.json();
    const { organisationId: org, table, operation = "select", columns = "*" } = body;
    if (!Object.hasOwn(projections, table) || (operation === "select" && !projections[table].includes(columns)) || (operation !== "select" && !["*", "id"].includes(columns))) return fail(400, "Unsupported email query");
    if (!["select", "insert", "update", "upsert", "delete"].includes(operation)) return fail(400, "Unsupported operation");
    const filters: Filter[] = body.filters ?? [];
    if (!Array.isArray(filters) || filters.length > 10) return fail(400, "Invalid filters");
    for (const filter of filters) {
      if (!filter || !["eq", "in"].includes(filter.op) || !["id", "organisation_id", "list_id", "profile_id", "campaign_id", "is_subscribed"].includes(filter.column)) return fail(400, "Invalid filter");
      if (filter.column === "organisation_id" && (filter.op !== "eq" || filter.value !== org)) return fail(403, "Organisation mismatch");
      if (filter.column === "is_subscribed") {
        if (filter.op !== "eq" || typeof filter.value !== "boolean") return fail(400, "Invalid subscription filter");
      } else {
        const values = filter.op === "in" ? filter.value : [filter.value];
        if (!Array.isArray(values) || values.length > 1000 || !values.every(isUuid)) return fail(400, "Invalid identifier filter");
      }
    }
    const mutation = operation !== "select";
    if (mutation && !Object.hasOwn(writable, table)) return fail(403, "This email data is read only");
    if (operation === "upsert" && table !== "profile_subscriber_lists") return fail(400, "Unsupported upsert");
    if (operation === "update" && table !== "campaigns") return fail(400, "Unsupported update");
    if (operation === "delete" && table === "subscriber_lists") return fail(400, "Audience deletion is not supported here");
    if (["update", "delete"].includes(operation) && !filters.some(f => ["id", "list_id"].includes(f.column) && f.op === "eq")) return fail(400, "An exact record filter is required");
    const action: EmailAction = operation === "select" ? "view" : operation === "delete" ? "delete" : operation === "update" ? "edit" : "create";
    const access = await requireAgencyEmailAccess(req.headers.get("authorization"), org, action);
    if (!access.ok) return fail(access.status, access.error);
    if (mutation) {
      const view = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "view");
      if (!view.ok) return fail(view.status, view.error);
    }
    const db = access.db;
    const input: Record<string, unknown>[] = Array.isArray(body.values) ? body.values : [body.values];
    if (operation === "update" && input.length !== 1) return fail(400, "Update one campaign at a time");
    if (body.single !== undefined && !["single", "maybeSingle"].includes(body.single)) return fail(400, "Invalid response mode");
    let rows: Record<string, unknown>[] = [];
    if (mutation && operation !== "delete") {
      if (!input.length || input.length > 1000 || input.some(row => !row || typeof row !== "object" || Array.isArray(row))) return fail(400, "Invalid records");
      rows = input.map(row => Object.fromEntries(writable[table].filter(k => Object.hasOwn(row, k)).map(k => [k, row[k]])));
      for (const row of rows) {
        for (const [key, value] of Object.entries(row)) {
          if (value !== null && typeof value !== "string") return fail(400, `Invalid ${key}`);
          if (typeof value === "string" && value.length > (["content", "custom_html"].includes(key) ? 500_000 : 2000)) return fail(400, `${key} is too long`);
        }
        // Cross-tenant foreign keys must be checked before using service-role writes.
        if (row.list_id) {
          if (!isUuid(row.list_id)) return fail(400, "Invalid audience");
          const list = await db.from("subscriber_lists").select("id").eq("id", row.list_id).eq("organisation_id", org).maybeSingle();
          if (list.error || !list.data) return fail(400, "Audience does not belong to this client");
        } else if (["profile_subscriber_lists", "campaign_list_emails"].includes(table)) return fail(400, "Audience required");
        if (table === "profile_subscriber_lists") {
          if (!isUuid(row.profile_id)) return fail(400, "Invalid contact");
          const profile = await db.from("profiles").select("id").eq("id", row.profile_id).eq("organisation_id", org).eq("is_subscribed", true).maybeSingle();
          if (profile.error || !profile.data) return fail(400, "Contact is not a subscribed contact of this client");
        }
        if (table === "campaign_list_emails") {
          const address = String(row.email || "").trim().toLowerCase();
          if (address.length > 254 || !email.test(address)) return fail(400, "Invalid email address");
          row.email = address;
          // Do not use audience import to restore suppressed recipients.
          const suppressed = await db.from("campaign_unsubscribes").select("email").eq("organisation_id", org).eq("email", address).limit(1);
          if (suppressed.error) return fail(500, "Unable to verify unsubscribe status");
          if (suppressed.data?.length) return fail(409, "An imported email has unsubscribed from this client");
        }
        if (table === "subscriber_lists" && !String(row.name || "").trim()) return fail(400, "Audience name required");
        if (table === "campaigns") {
          const requestedStatus = input[rows.indexOf(row)].status ?? "draft";
          if (typeof requestedStatus !== "string" || !["draft", "queued"].includes(requestedStatus)) return fail(400, "Invalid campaign state");
          if (requestedStatus === "queued") {
            const send = await requireAgencyEmailAccess(req.headers.get("authorization"), org, "send");
            if (!send.ok) return fail(send.status, send.error);
            if (!row.list_id || !String(row.title || "").trim() || !String(row.subject || "").trim() || !String(row.content || "").trim()) return fail(400, "Campaign needs a title, subject, audience and content");
          }
          if (row.scheduled_for && (!Number.isFinite(Date.parse(String(row.scheduled_for))) || Date.parse(String(row.scheduled_for)) <= Date.now())) return fail(400, "Choose a future schedule time");
          // Immediate sends stay drafts until the existing send API creates deliveries.
          row.status = requestedStatus === "queued" && row.scheduled_for ? "queued" : "draft";
          row.sent_at = null;
          if (row.reply_to && !email.test(String(row.reply_to))) return fail(400, "Invalid reply-to email");
          if (row.editor_mode && !["blocks", "html"].includes(String(row.editor_mode))) return fail(400, "Invalid editor mode");
        }
        row.organisation_id = org;
        if (table === "campaigns" && operation === "insert") row.user_id = access.user.id;
      }
    }
    // Fixed projections for tables that must never expose unrelated profile fields.
    const projection = table === "subscriber_lists" ? "id,name,organisation_id" : operation !== "select" && table !== "campaigns" ? (table === "profile_subscriber_lists" ? "list_id,profile_id" : "id,email,first_name") : columns;
    let query: any;
    if (operation === "select") query = db.from(table).select(projection);
    else if (operation === "insert") query = db.from(table).insert(Array.isArray(body.values) ? rows : rows[0]).select(projection);
    else if (operation === "upsert") query = db.from(table).upsert(rows, { onConflict: "profile_id,list_id", ignoreDuplicates: true }).select(projection);
    else if (operation === "update") query = db.from(table).update(rows[0]).select(projection);
    else query = db.from(table).delete().select(projection);
    if (["campaign_opens", "campaign_clicks"].includes(table)) {
      // Tracking tables need not have organisation_id. Scope via owned campaigns.
      const campaignFilter = filters.find(f => f.column === "campaign_id" && f.op === "in");
      if (!campaignFilter) return fail(400, "Campaign filter required");
      const owned = await db.from("campaigns").select("id").eq("organisation_id", org).in("id", campaignFilter.value as string[]);
      if (owned.error) return fail(500, "Unable to verify campaign ownership");
      query = query.in("campaign_id", (owned.data || []).map(c => c.id));
    } else query = query.eq("organisation_id", org);
    for (const filter of filters) query = filter.op === "in" ? query.in(filter.column, filter.value) : query.eq(filter.column, filter.value);
    // Once queued, freeze the campaign/audience snapshot. Concurrent schedule
    // edits during dispatch require a transactional reschedule operation.
    if (table === "campaigns" && ["update", "delete"].includes(operation)) query = query.eq("status", "draft");
    if (body.order) {
      if (!["name", "created_at"].includes(body.order.column)) return fail(400, "Invalid sort");
      query = query.order(body.order.column, { ascending: body.order.ascending !== false });
    } else if (operation === "select") query = query.order(table === "profile_subscriber_lists" ? "profile_id" : "id", { ascending: true });
    // Page reads to avoid Supabase's default 1,000-row truncation of audiences.
    let data: any;
    if (operation === "select" && !body.single) {
      const cap = body.limit === undefined ? 50_000 : Math.min(Math.max(Number(body.limit) || 1, 1), 50_000);
      const collected: unknown[] = [];
      for (let offset = 0; offset < cap; offset += 500) {
        const result = await query.range(offset, Math.min(offset + 499, cap - 1));
        if (result.error) return fail(500, "Unable to load client email data");
        collected.push(...(result.data || []));
        if ((result.data || []).length < Math.min(500, cap - offset)) break;
        if (offset + 500 >= cap && body.limit === undefined) return fail(413, "Audience is too large for this view; narrow the selection");
      }
      data = collected;
    } else {
      const result = await query;
      if (result.error) return fail(500, "Unable to save client email data");
      data = result.data || [];
      if (["update", "delete"].includes(operation) && !data.length) return fail(409, "Record is missing or no longer editable");
      if (body.single) {
        if (data.length > 1 || (body.single === "single" && data.length !== 1)) return fail(409, "Expected one record");
        data = data[0] || null;
      }
    }
    return NextResponse.json({ data, error: null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail(400, "Invalid email request");
  }
}
