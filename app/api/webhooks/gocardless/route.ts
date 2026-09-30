import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORGANISATION_ID = "2c96d537-2be4-4917-8982-e7491300f15f";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET!;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!webhookSecret) throw new Error("Missing GOCARDLESS_WEBHOOK_SECRET");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type GoCardlessEvent = {
  id: string;
  created_at?: string;
  action: string;
  resource_type: string;
  links?: {
    mandate?: string;
    payment?: string;
    subscription?: string;
    customer?: string;
    organisation?: string;
  };
  details?: Record<string, unknown>;
};

function validSignature(rawBody: string, supplied: string | null) {
  if (!supplied) return false;
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(supplied, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function findSubscription(event: GoCardlessEvent) {
  let query = admin
    .from("store_subscriptions")
    .select("*")
    .eq("organisation_id", ORGANISATION_ID);

  if (event.links?.subscription) {
    query = query.eq("external_subscription_id", event.links.subscription);
  } else if (event.links?.mandate) {
    query = query.eq("external_mandate_id", event.links.mandate);
  } else {
    return null;
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data as any;
}

async function processEvent(event: GoCardlessEvent) {
  const row = await findSubscription(event);
  if (!row) return;

  const now = new Date().toISOString();
  const currentMetadata =
    row.metadata && typeof row.metadata === "object" ? row.metadata : {};

  const patch: Record<string, unknown> = {
    metadata: {
      ...currentMetadata,
      mtc_gocardless_last_event_id: event.id,
      mtc_gocardless_last_event_type: event.resource_type,
      mtc_gocardless_last_event_action: event.action,
      mtc_gocardless_last_event_at: event.created_at ?? now,
      mtc_gocardless_last_event_details: event.details ?? null,
      mtc_gocardless_last_payment_id:
        event.links?.payment ?? currentMetadata.mtc_gocardless_last_payment_id ?? null,
    },
  };

  if (event.resource_type === "mandates") {
    if (["cancelled", "failed", "expired", "replaced"].includes(event.action)) {
      patch.processor_verification_status = "unverified";
      patch.collection_enabled = false;
    }
    if (["active", "submitted"].includes(event.action)) {
      patch.processor_verification_status = "verified";
      patch.processor_verified_at = now;
    }
  }

  if (event.resource_type === "subscriptions") {
    if (event.action === "cancelled" || event.action === "finished") {
      patch.collection_enabled = false;
      patch.status = event.action;
    }
    if (event.action === "created") {
      patch.status = "active";
    }
  }

  if (event.resource_type === "payments") {
    if (["confirmed", "paid_out"].includes(event.action)) {
      patch.last_payment_at = event.created_at ?? now;
      patch.status = "active";
    }
    if (["failed", "cancelled", "charged_back"].includes(event.action)) {
      patch.status = "payment_issue";
    }
  }

  const { error } = await admin
    .from("store_subscriptions")
    .update(patch)
    .eq("id", row.id)
    .eq("organisation_id", ORGANISATION_ID);

  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("webhook-signature");

  if (!validSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 498 });
  }

  let payload: { events?: GoCardlessEvent[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];

  try {
    for (const event of events) {
      await processEvent(event);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[GOCARDLESS WEBHOOK]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "gocardless-webhook" });
}
