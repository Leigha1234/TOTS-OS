import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

import {
  createCampaignUnsubscribeToken,
} from "@/lib/campaign-unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!resendApiKey) throw new Error("Missing RESEND_API_KEY");

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const resend = new Resend(resendApiKey);

const MAX_EMAILS_PER_RUN = 20;
const MAX_ATTEMPTS = 5;
const SEND_DELAY_MS = 200;
const STALE_SENDING_MINUTES = 3;

type RecipientSource = "profile" | "manual";

type Delivery = {
  id: string;
  campaign_id: string;
  organisation_id: string;
  recipient_id: string | null;
  recipient_source: RecipientSource | null;
  email: string;
  status: string;
  attempts: number;
  resend_id: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

function cleanEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normaliseBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try { return JSON.stringify(error); } catch { return "Unknown error"; }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRecipientSource(value: unknown): RecipientSource | null {
  return value === "profile" || value === "manual" ? value : null;
}

async function getRecipientFirstName(delivery: Delivery): Promise<string | null> {
  const source = getRecipientSource(delivery.recipient_source);
  const recipientId = String(delivery.recipient_id || "").trim();

  if (!source || !recipientId) return null;

  if (source === "profile") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("first_name")
      .eq("id", recipientId)
      .maybeSingle();

    if (error) {
      console.warn(`Could not load first name for profile ${recipientId}:`, error.message);
      return null;
    }

    const name = typeof data?.first_name === "string" ? data.first_name.trim() : "";
    return name || null;
  }

  const { data, error } = await supabaseAdmin
    .from("campaign_list_emails")
    .select("first_name")
    .eq("id", recipientId)
    .maybeSingle();

  if (error) {
    console.warn(`Could not load first name for manual recipient ${recipientId}:`, error.message);
    return null;
  }

  const name = typeof data?.first_name === "string" ? data.first_name.trim() : "";
  return name || null;
}

function personaliseCampaignContent(content: string, firstName: string | null): string {
  const safeName = firstName ? escapeHtml(firstName) : "there";
  return String(content || "")
    .replace(/\{\{\s*first_name\s*\}\}/gi, safeName)
    .replace(/\{\{\s*firstName\s*\}\}/gi, safeName);
}

function buildUnsubscribeUrl({
  campaign,
  delivery,
  trackingBaseUrl,
}: {
  campaign: any;
  delivery: Delivery;
  trackingBaseUrl: string;
}) {
  const email = cleanEmail(delivery.email);
  const source = getRecipientSource(delivery.recipient_source);
  const recipientId = String(delivery.recipient_id || "").trim();
  const campaignId = String(campaign.id || "").trim();
  const organisationId = String(
    campaign.organisation_id || delivery.organisation_id || ""
  ).trim();
  const listId = String(campaign.list_id || "").trim();

  if (!campaignId) throw new Error("Cannot generate unsubscribe link: campaign ID is missing");
  if (!organisationId) throw new Error("Cannot generate unsubscribe link: organisation ID is missing");
  if (!listId) throw new Error("Cannot generate unsubscribe link: list ID is missing");
  if (!email || !isValidEmail(email)) throw new Error("Cannot generate unsubscribe link: recipient email is invalid");
  if (!source) throw new Error("Cannot generate unsubscribe link: recipient source is missing or invalid");
  if (!recipientId) throw new Error("Cannot generate unsubscribe link: recipient ID is missing");

  const token = createCampaignUnsubscribeToken({
    campaignId,
    organisationId,
    listId,
    email,
    source,
    recipientId,
  });

  return `${trackingBaseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function buildEmailHtml({
  campaign,
  delivery,
  trackingBaseUrl,
  unsubscribeUrl,
  firstName,
}: {
  campaign: any;
  delivery: Delivery;
  trackingBaseUrl: string;
  unsubscribeUrl: string;
  firstName: string | null;
}) {
  const source = getRecipientSource(delivery.recipient_source);
  const recipientId = String(delivery.recipient_id || delivery.id);

  const trackingUrl =
    `${trackingBaseUrl}/api/campaigns/open` +
    `?campaignId=${encodeURIComponent(campaign.id)}` +
    `&profileId=${encodeURIComponent(recipientId)}` +
    `&source=${encodeURIComponent(source || "manual")}`;

  const previewText = campaign.preview_text
    ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(campaign.preview_text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : "";

  const personalisedContent = personaliseCampaignContent(
    campaign.content || "",
    firstName
  );

  const unsubscribeFooter = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="width:100%;margin:0;padding:0;border-collapse:collapse;">
      <tr>
        <td align="center"
          style="padding:24px 20px 30px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#938d87;">
          <p style="margin:0 0 6px;">
            You are receiving this email because your email address is included in this organisation's mailing list.
          </p>
          <p style="margin:0;">
            Don't want to receive these emails?
            <a href="${escapeHtml(unsubscribeUrl)}" target="_blank"
              style="color:#68785e;text-decoration:underline;text-underline-offset:2px;">
              Unsubscribe
            </a>
          </p>
        </td>
      </tr>
    </table>`;

  const trackingPixel = `<img src="${escapeHtml(trackingUrl)}" width="1" height="1" alt=""
    style="display:block;width:1px;height:1px;border:0;opacity:0;" />`;

  return `${previewText}${personalisedContent}${unsubscribeFooter}${trackingPixel}`;
}

function isAuthorisedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return false;
  }
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function recoverStaleDeliveries() {
  const now = new Date().toISOString();
  const staleBefore = new Date(
    Date.now() - STALE_SENDING_MINUTES * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({ status: "pending", updated_at: now })
    .eq("status", "sending")
    .lt("updated_at", staleBefore)
    .select("id");

  if (error) throw new Error(`Failed to recover stale deliveries: ${error.message}`);
  if (data?.length) console.log(`Recovered ${data.length} stale campaign deliveries`);
}

async function findNextCampaign() {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("status", "processing")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to find campaign: ${error.message}`);
  return data;
}

async function loadNextDeliveries(campaignId: string): Promise<Delivery[]> {
  const { data, error } = await supabaseAdmin
    .from("campaign_deliveries")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(MAX_EMAILS_PER_RUN);

  if (error) throw new Error(`Failed to load deliveries: ${error.message}`);
  return (data || []) as Delivery[];
}

async function claimDelivery(delivery: Delivery): Promise<{ claimed: boolean; attempts: number }> {
  const now = new Date().toISOString();
  const nextAttempts = Number(delivery.attempts || 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({ status: "sending", attempts: nextAttempts, updated_at: now })
    .eq("id", delivery.id)
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error(`Failed to claim ${delivery.email}: ${error.message}`);

  return {
    claimed: Boolean(data && data.length === 1),
    attempts: nextAttempts,
  };
}

async function markDeliverySent({
  deliveryId,
  resendId,
}: {
  deliveryId: string;
  resendId: string | null;
}) {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status: "sent",
      resend_id: resendId,
      last_error: null,
      sent_at: now,
      updated_at: now,
    })
    .eq("id", deliveryId);

  if (error) {
    throw new Error(
      `Email was accepted by Resend but delivery status could not be updated: ${error.message}`
    );
  }
}

async function markDeliveryFailed({
  deliveryId,
  errorMessage,
  attempts,
}: {
  deliveryId: string;
  errorMessage: string;
  attempts: number;
}) {
  const now = new Date().toISOString();
  const exhausted = attempts >= MAX_ATTEMPTS;

  const { error } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status: exhausted ? "failed" : "pending",
      last_error: errorMessage,
      updated_at: now,
    })
    .eq("id", deliveryId);

  if (error) {
    console.error(
      exhausted ? "Could not mark delivery as failed:" : "Could not mark delivery for retry:",
      deliveryId,
      error.message
    );
  }
}

async function countWhere(
  campaignId: string,
  configure?: (query: any) => any
): Promise<number> {
  let query: any = supabaseAdmin
    .from("campaign_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (configure) query = configure(query);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

async function getCampaignCounts(campaignId: string) {
  const total = await countWhere(campaignId);
  const sent = await countWhere(campaignId, q => q.eq("status", "sent"));
  const retryablePending = await countWhere(
    campaignId,
    q => q.eq("status", "pending").lt("attempts", MAX_ATTEMPTS)
  );
  const sending = await countWhere(campaignId, q => q.eq("status", "sending"));
  const failed = await countWhere(campaignId, q => q.eq("status", "failed"));
  const exhaustedPending = await countWhere(
    campaignId,
    q => q.eq("status", "pending").gte("attempts", MAX_ATTEMPTS)
  );

  const active = retryablePending + sending;
  const exhausted = failed + exhaustedPending;

  return {
    total,
    sent,
    pending: active,
    retryablePending,
    sending,
    failed,
    exhausted,
  };
}

async function updateCampaignProgress(campaign: any) {
  const counts = await getCampaignCounts(campaign.id);
  const now = new Date().toISOString();

  if (counts.total === 0) {
    const { error } = await supabaseAdmin
      .from("campaigns")
      .update({ status: "failed", sent_count: 0 })
      .eq("id", campaign.id);

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("campaign_jobs")
      .update({ status: "failed" })
      .eq("campaign_id", campaign.id)
      .eq("status", "processing");

    return { ...counts, campaignStatus: "failed" };
  }

  if (counts.sent === counts.total) {
    const { error } = await supabaseAdmin
      .from("campaigns")
      .update({
        status: "sent",
        sent_count: counts.sent,
        sent_at: campaign.sent_at || now,
      })
      .eq("id", campaign.id);

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("campaign_jobs")
      .update({ status: "completed" })
      .eq("campaign_id", campaign.id)
      .eq("status", "processing");

    return { ...counts, campaignStatus: "sent" };
  }

  if (counts.pending === 0 && counts.exhausted > 0) {
    const { error } = await supabaseAdmin
      .from("campaigns")
      .update({ status: "failed", sent_count: counts.sent })
      .eq("id", campaign.id);

    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("campaign_jobs")
      .update({ status: "failed" })
      .eq("campaign_id", campaign.id)
      .eq("status", "processing");

    return { ...counts, campaignStatus: "failed" };
  }

  const { error } = await supabaseAdmin
    .from("campaigns")
    .update({ status: "processing", sent_count: counts.sent })
    .eq("id", campaign.id);

  if (error) throw new Error(error.message);

  return { ...counts, campaignStatus: "processing" };
}

async function processCampaign() {
  await recoverStaleDeliveries();

  const campaign = await findNextCampaign();

  if (!campaign) {
    return {
      success: true,
      message: "No campaigns waiting to process.",
      processed: 0,
    };
  }

  if (!campaign.id) throw new Error("Campaign is missing ID");
  if (!campaign.organisation_id) throw new Error("Campaign is missing organisation_id");
  if (!campaign.list_id) throw new Error("Campaign is missing list_id");

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) throw new Error("Missing RESEND_FROM_EMAIL");

  const trackingBaseUrl = normaliseBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://tots-os.co.uk"
  );

  const deliveries = await loadNextDeliveries(campaign.id);

  if (deliveries.length === 0) {
    const progress = await updateCampaignProgress(campaign);
    return {
      success: true,
      campaignId: campaign.id,
      processed: 0,
      ...progress,
    };
  }

  let sentThisRun = 0;
  let failedThisRun = 0;
  let skippedThisRun = 0;

  for (let index = 0; index < deliveries.length; index++) {
    const delivery = deliveries[index];
    const { claimed, attempts } = await claimDelivery(delivery);

    if (!claimed) {
      skippedThisRun++;
      continue;
    }

    const email = cleanEmail(delivery.email);

    if (!email || !isValidEmail(email)) {
      await markDeliveryFailed({
        deliveryId: delivery.id,
        errorMessage: "Invalid recipient email",
        attempts,
      });
      failedThisRun++;
      continue;
    }

    const recipientSource = getRecipientSource(delivery.recipient_source);
    const recipientId = String(delivery.recipient_id || "").trim();

    if (!recipientSource || !recipientId) {
      await markDeliveryFailed({
        deliveryId: delivery.id,
        errorMessage: "Delivery is missing recipient_id or recipient_source",
        attempts,
      });
      failedThisRun++;
      continue;
    }

    let unsubscribeUrl: string;

    try {
      unsubscribeUrl = buildUnsubscribeUrl({
        campaign,
        delivery,
        trackingBaseUrl,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      await markDeliveryFailed({
        deliveryId: delivery.id,
        errorMessage: message,
        attempts,
      });
      failedThisRun++;
      continue;
    }

    const firstName = await getRecipientFirstName(delivery);

    const html = buildEmailHtml({
      campaign,
      delivery,
      trackingBaseUrl,
      unsubscribeUrl,
      firstName,
    });

    const idempotencyKey = `campaign/${campaign.id}/delivery/${delivery.id}`;

    try {
      const { data, error } = await resend.emails.send(
        {
          from: fromEmail,
          to: [email],
          subject: campaign.subject || campaign.title || "Campaign",
          html,
          replyTo: campaign.reply_to || fromEmail,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
          },
        },
        { idempotencyKey }
      );

      if (error) throw new Error(error.message || "Resend returned an error");
      if (!data?.id) throw new Error("Resend did not return an email ID");

      await markDeliverySent({
        deliveryId: delivery.id,
        resendId: data.id,
      });

      sentThisRun++;
      console.log(
        `Campaign ${campaign.id}: sent ${email}${firstName ? ` (${firstName})` : ""}`
      );
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(`Campaign ${campaign.id}: failed ${email}:`, message);

      await markDeliveryFailed({
        deliveryId: delivery.id,
        errorMessage: message,
        attempts,
      });

      failedThisRun++;
    }

    if (index < deliveries.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  const progress = await updateCampaignProgress(campaign);

  console.log("CAMPAIGN PROCESSOR RESULT:", {
    campaignId: campaign.id,
    sentThisRun,
    failedThisRun,
    skippedThisRun,
    ...progress,
  });

  return {
    success: true,
    campaignId: campaign.id,
    processed: sentThisRun + failedThisRun,
    sentThisRun,
    failedThisRun,
    skippedThisRun,
    ...progress,
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorisedCron(req)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await processCampaign();
    return NextResponse.json(result);
  } catch (error) {
    console.error("CAMPAIGN CRON ERROR:", error);

    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
