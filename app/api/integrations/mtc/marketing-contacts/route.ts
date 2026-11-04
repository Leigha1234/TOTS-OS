import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function authorised(req: NextRequest, secret: string): boolean {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type ContactInput = {
  mtc_user_id?: unknown;
  email?: unknown;
  name?: unknown;
  marketing_opt_in?: unknown;
  trial_claimed_at?: unknown;
};

export async function POST(req: NextRequest) {
  const secret = process.env.TOTS_MTC_INTEGRATION_SECRET;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !org || !url || !key) return json({ error: "Integration not configured" }, 503);
  if (!authorised(req, secret)) return json({ error: "Unauthorized" }, 401);

  let payload: ContactInput;
  try { payload = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const userId = typeof payload.mtc_user_id === "string" ? payload.mtc_user_id.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 200) : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) || !validEmail(email) || email.length > 254) {
    return json({ error: "Invalid user ID or email" }, 400);
  }
  // Explicitly opted-in contacts only. Never treat missing/null consent as true.
  if (payload.marketing_opt_in !== true) return json({ skipped: "no_marketing_permission" });

  const trialClaimedAt = typeof payload.trial_claimed_at === 'string' && !Number.isNaN(Date.parse(payload.trial_claimed_at))
    ? new Date(payload.trial_claimed_at).toISOString() : null;
  if (!trialClaimedAt) return json({ error: 'Missing valid trial_claimed_at' }, 400);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  async function recordTrial(contactId: string) {
    const { error } = await db.from('mtc_trial_marketing_lifecycle').upsert({
      organisation_id: org, mtc_user_id: userId, contact_id: contactId,
      trial_started_at: trialClaimedAt,
      // Never enable sending implicitly. This is a staging record only.
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organisation_id,mtc_user_id' });
    return error;
  }
  // Mapping table makes repeated syncs idempotent without changing existing CRM contacts.
  const { data: mapped, error: mappingError } = await db.from("mtc_marketing_contact_links")
    .select("contact_id").eq("organisation_id", org).eq("mtc_user_id", userId).maybeSingle();
  if (mappingError) return json({ error: "Mapping lookup failed" }, 500);
  if (mapped?.contact_id) {
    const { error } = await db.from("contacts").update({ name: name || null, email })
      .eq("id", mapped.contact_id).eq("organisation_id", org);
    if (error) return json({ error: 'Contact update failed' }, 500);
    if (await recordTrial(mapped.contact_id)) return json({ error: 'Trial lifecycle save failed' }, 500);
    return json({ synced: true, action: 'updated' });
  }

  // Avoid duplicating an existing contact with the same email in this organisation.
  const { data: existing, error: findError } = await db.from("contacts")
    .select("id").eq("organisation_id", org).ilike("email", email).limit(2);
  if (findError) return json({ error: "Contact lookup failed" }, 500);
  if ((existing ?? []).length > 1) return json({ error: "Ambiguous existing contacts; manual reconciliation required" }, 409);

  let contactId: string;
  if (existing?.length === 1) {
    contactId = existing[0].id;
  } else {
    const { data: created, error } = await db.from("contacts")
      .insert({ organisation_id: org, name: name || null, email }).select("id").single();
    if (error || !created) return json({ error: "Contact creation failed" }, 500);
    contactId = created.id;
  }
  const { error: linkError } = await db.from("mtc_marketing_contact_links").upsert({
    organisation_id: org, mtc_user_id: userId, contact_id: contactId, last_synced_at: new Date().toISOString(),
  }, { onConflict: "organisation_id,mtc_user_id" });
  if (linkError) return json({ error: "Contact linked unsuccessfully; retry required" }, 500);
  if (await recordTrial(contactId)) return json({ error: 'Trial lifecycle save failed' }, 500);
  // Intentionally does not add the contact to campaign_list_emails or send email.
  return json({ synced: true, action: existing?.length ? "linked_existing" : "created" });
}
