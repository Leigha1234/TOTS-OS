import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const resend = new Resend(resendApiKey);

// ==================================================
// SETTINGS
// ==================================================

const MAX_EMAILS_PER_RUN = 20;

// Maximum attempts before we stop automatically
// retrying a permanently failing address.
const MAX_ATTEMPTS = 5;

// Space individual Resend API calls apart.
// 200ms = max ~5 requests/sec.
const SEND_DELAY_MS = 200;

// If an invocation dies after claiming a delivery,
// recover it after this amount of time.
const STALE_SENDING_MINUTES = 3;

// ==================================================
// TYPES
// ==================================================

type Delivery = {
  id: string;
  campaign_id: string;
  organisation_id: string;
  email: string;
  status: string;
  attempts: number;
  resend_id: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

// ==================================================
// HELPERS
// ==================================================

function cleanEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
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
  const trimmed = value
    .trim()
    .replace(/\/+$/, "");

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function sleep(ms: number) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

// ==================================================
// EMAIL HTML
// ==================================================

function buildEmailHtml({
  campaign,
  delivery,
  trackingBaseUrl,
}: {
  campaign: any;
  delivery: Delivery;
  trackingBaseUrl: string;
}) {
  const trackingUrl =
    `${trackingBaseUrl}/api/campaigns/open` +
    `?campaignId=${encodeURIComponent(
      campaign.id
    )}` +
    `&profileId=${encodeURIComponent(
      delivery.id
    )}` +
    `&source=manual`;

  const previewText = campaign.preview_text
    ? `
      <div
        style="
          display:none;
          max-height:0;
          overflow:hidden;
          opacity:0;
          color:transparent;
          mso-hide:all;
        "
      >
        ${escapeHtml(campaign.preview_text)}
      </div>
    `
    : "";

  return `
    ${previewText}

    ${campaign.content || ""}

    <img
      src="${trackingUrl}"
      width="1"
      height="1"
      alt=""
      style="
        display:block;
        width:1px;
        height:1px;
        border:0;
        opacity:0;
      "
    />
  `;
}

// ==================================================
// SECURITY
// ==================================================

function isAuthorisedCron(
  req: NextRequest
): boolean {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "CRON_SECRET is not configured"
    );

    return false;
  }

  const authorization =
    req.headers.get("authorization");

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

// ==================================================
// RECOVER STALE SENDING ROWS
// ==================================================

async function recoverStaleDeliveries() {
  const now =
    new Date().toISOString();

  const staleBefore =
    new Date(
      Date.now() -
        STALE_SENDING_MINUTES *
          60 *
          1000
    ).toISOString();

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status: "pending",
      updated_at: now,
    })
    .eq("status", "sending")
    .lt("updated_at", staleBefore)
    .select("id");

  if (error) {
    throw new Error(
      `Failed to recover stale deliveries: ${error.message}`
    );
  }

  if (data?.length) {
    console.log(
      `Recovered ${data.length} stale campaign deliveries`
    );
  }
}

// ==================================================
// FIND CAMPAIGN
// ==================================================

async function findNextCampaign() {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("status", "processing")
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to find campaign: ${error.message}`
    );
  }

  return data;
}

// ==================================================
// LOAD NEXT DELIVERIES
// ==================================================

async function loadNextDeliveries(
  campaignId: string
): Promise<Delivery[]> {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select("*")
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "pending"
    )
    .lt(
      "attempts",
      MAX_ATTEMPTS
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    )
    .limit(
      MAX_EMAILS_PER_RUN
    );

  if (error) {
    throw new Error(
      `Failed to load deliveries: ${error.message}`
    );
  }

  return (data || []) as Delivery[];
}

// ==================================================
// CLAIM ONE DELIVERY
// ==================================================

async function claimDelivery(
  delivery: Delivery
): Promise<{
  claimed: boolean;
  attempts: number;
}> {
  const now =
    new Date().toISOString();

  const nextAttempts =
    Number(
      delivery.attempts || 0
    ) + 1;

  // Lightweight optimistic lock.
  //
  // DB delivery statuses are:
  // pending -> sending -> sent / failed
  //
  // Campaign status itself remains "processing".
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status: "sending",
      attempts: nextAttempts,
      updated_at: now,
    })
    .eq(
      "id",
      delivery.id
    )
    .eq(
      "status",
      "pending"
    )
    .select("id");

  if (error) {
    throw new Error(
      `Failed to claim ${delivery.email}: ${error.message}`
    );
  }

  return {
    claimed: Boolean(
      data &&
        data.length === 1
    ),
    attempts: nextAttempts,
  };
}

// ==================================================
// MARK SENT
// ==================================================

async function markDeliverySent({
  deliveryId,
  resendId,
}: {
  deliveryId: string;
  resendId: string | null;
}) {
  const now =
    new Date().toISOString();

  const {
    error,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status: "sent",
      resend_id: resendId,
      last_error: null,
      sent_at: now,
      updated_at: now,
    })
    .eq(
      "id",
      deliveryId
    );

  if (error) {
    throw new Error(
      `Email was accepted by Resend but delivery status could not be updated: ${error.message}`
    );
  }
}

// ==================================================
// MARK FAILED / RETRY
// ==================================================

async function markDeliveryFailed({
  deliveryId,
  errorMessage,
  attempts,
}: {
  deliveryId: string;
  errorMessage: string;
  attempts: number;
}) {
  const now =
    new Date().toISOString();

  const exhausted =
    attempts >= MAX_ATTEMPTS;

  const {
    error,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .update({
      status:
        exhausted
          ? "failed"
          : "pending",
      last_error: errorMessage,
      updated_at: now,
    })
    .eq(
      "id",
      deliveryId
    );

  if (error) {
    console.error(
      exhausted
        ? "Could not mark delivery as failed:"
        : "Could not mark delivery for retry:",
      deliveryId,
      error.message
    );
  }
}

// ==================================================
// COUNTS
// ==================================================

async function getCampaignCounts(
  campaignId: string
) {
  const {
    count: total,
    error: totalError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    );

  if (totalError) {
    throw new Error(
      totalError.message
    );
  }

  const {
    count: sent,
    error: sentError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "sent"
    );

  if (sentError) {
    throw new Error(
      sentError.message
    );
  }

  // Only genuinely retryable/in-flight rows count as active.
  const {
    count: retryablePending,
    error: retryablePendingError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "pending"
    )
    .lt(
      "attempts",
      MAX_ATTEMPTS
    );

  if (retryablePendingError) {
    throw new Error(
      retryablePendingError.message
    );
  }

  const {
    count: sending,
    error: sendingError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "sending"
    );

  if (sendingError) {
    throw new Error(
      sendingError.message
    );
  }

  const {
    count: failed,
    error: failedError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "failed"
    );

  if (failedError) {
    throw new Error(
      failedError.message
    );
  }

  const {
    count: exhaustedPending,
    error: exhaustedPendingError,
  } = await supabaseAdmin
    .from("campaign_deliveries")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "campaign_id",
      campaignId
    )
    .eq(
      "status",
      "pending"
    )
    .gte(
      "attempts",
      MAX_ATTEMPTS
    );

  if (exhaustedPendingError) {
    throw new Error(
      exhaustedPendingError.message
    );
  }

  const active =
    (retryablePending || 0) +
    (sending || 0);

  const exhausted =
    (failed || 0) +
    (exhaustedPending || 0);

  return {
    total: total || 0,
    sent: sent || 0,

    // Keep "pending" in response for compatibility
    // with your existing diagnostics/UI.
    pending: active,

    retryablePending:
      retryablePending || 0,

    sending:
      sending || 0,

    failed:
      failed || 0,

    exhausted,
  };
}

// ==================================================
// FINALISE CAMPAIGN
// ==================================================

async function updateCampaignProgress(
  campaign: any
) {
  const counts =
    await getCampaignCounts(
      campaign.id
    );

  const now =
    new Date().toISOString();

  // ==================================================
  // ZERO DELIVERY SAFETY
  // ==================================================
  //
  // An old/test campaign with no delivery rows must
  // never remain processing forever and block every
  // newer campaign behind it.

  if (counts.total === 0) {
    const {
      error,
    } = await supabaseAdmin
      .from("campaigns")
      .update({
        status: "failed",
        sent_count: 0,
      })
      .eq(
        "id",
        campaign.id
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    await supabaseAdmin
      .from("campaign_jobs")
      .update({
        status: "failed",
      })
      .eq(
        "campaign_id",
        campaign.id
      )
      .eq(
        "status",
        "processing"
      );

    return {
      ...counts,
      campaignStatus:
        "failed",
    };
  }

  // ==================================================
  // EVERYTHING SENT
  // ==================================================

  if (
    counts.sent ===
    counts.total
  ) {
    const {
      error,
    } = await supabaseAdmin
      .from("campaigns")
      .update({
        status: "sent",
        sent_count:
          counts.sent,
        sent_at:
          campaign.sent_at ||
          now,
      })
      .eq(
        "id",
        campaign.id
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    await supabaseAdmin
      .from("campaign_jobs")
      .update({
        status: "completed",
      })
      .eq(
        "campaign_id",
        campaign.id
      )
      .eq(
        "status",
        "processing"
      );

    return {
      ...counts,
      campaignStatus:
        "sent",
    };
  }

  // ==================================================
  // NOTHING LEFT TO PROCESS + FAILURES EXIST
  // ==================================================

  if (
    counts.pending === 0 &&
    counts.exhausted > 0
  ) {
    const {
      error,
    } = await supabaseAdmin
      .from("campaigns")
      .update({
        status: "failed",
        sent_count:
          counts.sent,
      })
      .eq(
        "id",
        campaign.id
      );

    if (error) {
      throw new Error(
        error.message
      );
    }

    await supabaseAdmin
      .from("campaign_jobs")
      .update({
        status: "failed",
      })
      .eq(
        "campaign_id",
        campaign.id
      )
      .eq(
        "status",
        "processing"
      );

    return {
      ...counts,
      campaignStatus:
        "failed",
    };
  }

  // ==================================================
  // STILL WORKING
  // ==================================================

  const {
    error,
  } = await supabaseAdmin
    .from("campaigns")
    .update({
      status: "processing",
      sent_count:
        counts.sent,
    })
    .eq(
      "id",
      campaign.id
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return {
    ...counts,
    campaignStatus:
      "processing",
  };
}

// ==================================================
// PROCESS
// ==================================================

async function processCampaign() {
  await recoverStaleDeliveries();

  const campaign =
    await findNextCampaign();

  if (!campaign) {
    return {
      success: true,
      message:
        "No campaigns waiting to process.",
      processed: 0,
    };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error(
      "Missing RESEND_FROM_EMAIL"
    );
  }

  const trackingBaseUrl =
    normaliseBaseUrl(
      process.env
        .NEXT_PUBLIC_SITE_URL ||
        process.env
          .NEXT_PUBLIC_APP_URL ||
        "https://www.tots-os.co.uk"
    );

  const deliveries =
    await loadNextDeliveries(
      campaign.id
    );

  // If there are no currently processable deliveries,
  // update/finalise the campaign.
  if (
    deliveries.length === 0
  ) {
    const progress =
      await updateCampaignProgress(
        campaign
      );

    return {
      success: true,
      campaignId:
        campaign.id,
      processed: 0,
      ...progress,
    };
  }

  let sentThisRun = 0;
  let failedThisRun = 0;
  let skippedThisRun = 0;

  // ==================================================
  // SEND MAXIMUM 20
  // ==================================================

  for (
    let index = 0;
    index < deliveries.length;
    index++
  ) {
    const delivery =
      deliveries[index];

    const {
      claimed,
      attempts,
    } =
      await claimDelivery(
        delivery
      );

    // Another invocation got this row first.
    if (!claimed) {
      skippedThisRun++;
      continue;
    }

    const email =
      cleanEmail(
        delivery.email
      );

    if (
      !email ||
      !isValidEmail(email)
    ) {
      await markDeliveryFailed({
        deliveryId:
          delivery.id,
        errorMessage:
          "Invalid recipient email",
        attempts,
      });

      failedThisRun++;

      continue;
    }

    const html =
      buildEmailHtml({
        campaign,
        delivery,
        trackingBaseUrl,
      });

    // ==================================================
    // IDEMPOTENCY
    // ==================================================
    //
    // Same campaign + delivery always uses the same
    // deterministic Resend idempotency key.

    const idempotencyKey =
      `campaign/${campaign.id}/delivery/${delivery.id}`;

    try {
      const {
        data,
        error,
      } =
        await resend.emails.send(
          {
            from: fromEmail,

            to: [email],

            subject:
              campaign.subject ||
              campaign.title ||
              "Campaign",

            html,

            replyTo:
              campaign.reply_to ||
              fromEmail,
          },
          {
            idempotencyKey,
          }
        );

      if (error) {
        throw new Error(
          error.message ||
            "Resend returned an error"
        );
      }

      if (!data?.id) {
        throw new Error(
          "Resend did not return an email ID"
        );
      }

      await markDeliverySent({
        deliveryId:
          delivery.id,
        resendId:
          data.id,
      });

      sentThisRun++;

      console.log(
        `Campaign ${campaign.id}: sent ${email}`
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error
        );

      console.error(
        `Campaign ${campaign.id}: failed ${email}:`,
        message
      );

      await markDeliveryFailed({
        deliveryId:
          delivery.id,
        errorMessage:
          message,
        attempts,
      });

      failedThisRun++;
    }

    if (
      index <
      deliveries.length - 1
    ) {
      await sleep(
        SEND_DELAY_MS
      );
    }
  }

  // ==================================================
  // UPDATE COUNTS / CAMPAIGN STATUS
  // ==================================================

  const progress =
    await updateCampaignProgress(
      campaign
    );

  console.log(
    "CAMPAIGN PROCESSOR RESULT:",
    {
      campaignId:
        campaign.id,
      sentThisRun,
      failedThisRun,
      skippedThisRun,
      ...progress,
    }
  );

  return {
    success: true,
    campaignId:
      campaign.id,

    processed:
      sentThisRun +
      failedThisRun,

    sentThisRun,
    failedThisRun,
    skippedThisRun,

    ...progress,
  };
}

// ==================================================
// GET — SUPABASE / VERCEL CRON
// ==================================================

export async function GET(
  req: NextRequest
) {
  try {
    if (!isAuthorisedCron(req)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const result =
      await processCampaign();

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(
      "CAMPAIGN CRON ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          getErrorMessage(
            error
          ),
      },
      {
        status: 500,
      }
    );
  }
}