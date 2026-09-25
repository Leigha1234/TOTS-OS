import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  Resend,
} from "resend";

import {
  createCampaignUnsubscribeToken,
} from "@/lib/campaign-unsubscribe-token";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ==================================================
// ENVIRONMENT
// ==================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey =
  process.env
    .RESEND_API_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL"
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY"
  );
}

if (!resendApiKey) {
  throw new Error(
    "Missing RESEND_API_KEY"
  );
}

// ==================================================
// CLIENTS
// ==================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

const resend =
  new Resend(
    resendApiKey
  );

// ==================================================
// SETTINGS
// ==================================================

const MAX_EMAILS_PER_RUN =
  20;

const MAX_ATTEMPTS =
  5;

const SEND_DELAY_MS =
  200;

const STALE_SENDING_MINUTES =
  3;

// ==================================================
// TYPES
// ==================================================

type RecipientSource =
  | "profile"
  | "manual";

type Delivery = {
  id: string;

  campaign_id: string;

  organisation_id: string;

  recipient_id:
    | string
    | null;

  recipient_source:
    | RecipientSource
    | null;

  email: string;

  status: string;

  attempts: number;

  resend_id:
    | string
    | null;

  last_error:
    | string
    | null;

  sent_at:
    | string
    | null;

  created_at: string;

  updated_at: string;
};

// ==================================================
// QUEUE TYPES
// ==================================================

type CampaignRecipient = {
  id: string;
  email: string;
  source: RecipientSource;
};

type ExistingDelivery = {
  id: string;
  email: string;
  status: string;
  attempts: number;
};

// ==================================================
// HELPERS
// ==================================================

function cleanEmail(
  value: unknown
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .toLowerCase();
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function escapeHtml(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function normaliseBaseUrl(
  value: string
): string {
  const trimmed =
    value
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  if (
    trimmed.startsWith(
      "http://"
    ) ||
    trimmed.startsWith(
      "https://"
    )
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error
    );
  } catch {
    return "Unknown error";
  }
}

function sleep(
  ms: number
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

// ==================================================
// VALIDATE RECIPIENT SOURCE
// ==================================================

function getRecipientSource(
  value: unknown
): RecipientSource | null {
  if (
    value === "profile" ||
    value === "manual"
  ) {
    return value;
  }

  return null;
}

// ==================================================
// BUILD UNSUBSCRIBE URL
// ==================================================

function buildUnsubscribeUrl({
  campaign,
  delivery,
  trackingBaseUrl,
}: {
  campaign: any;
  delivery: Delivery;
  trackingBaseUrl: string;
}) {
  const email =
    cleanEmail(
      delivery.email
    );

  const source =
    getRecipientSource(
      delivery.recipient_source
    );

  const recipientId =
    String(
      delivery.recipient_id ||
        ""
    ).trim();

  const campaignId =
    String(
      campaign.id ||
        ""
    ).trim();

  const organisationId =
    String(
      campaign.organisation_id ||
        delivery.organisation_id ||
        ""
    ).trim();

  const listId =
    String(
      campaign.list_id ||
        ""
    ).trim();

  if (!campaignId) {
    throw new Error(
      "Cannot generate unsubscribe link: campaign ID is missing"
    );
  }

  if (!organisationId) {
    throw new Error(
      "Cannot generate unsubscribe link: organisation ID is missing"
    );
  }

  if (!listId) {
    throw new Error(
      "Cannot generate unsubscribe link: list ID is missing"
    );
  }

  if (
    !email ||
    !isValidEmail(email)
  ) {
    throw new Error(
      "Cannot generate unsubscribe link: recipient email is invalid"
    );
  }

  if (!source) {
    throw new Error(
      "Cannot generate unsubscribe link: recipient source is missing or invalid"
    );
  }

  if (!recipientId) {
    throw new Error(
      "Cannot generate unsubscribe link: recipient ID is missing"
    );
  }

  const token =
    createCampaignUnsubscribeToken({
      campaignId,
      organisationId,
      listId,
      email,
      source,
      recipientId,
    });

  return (
    `${trackingBaseUrl}/unsubscribe` +
    `?token=${encodeURIComponent(
      token
    )}`
  );
}

// ==================================================
// EMAIL HTML
// ==================================================

function buildEmailHtml({
  campaign,
  delivery,
  trackingBaseUrl,
  unsubscribeUrl,
}: {
  campaign: any;
  delivery: Delivery;
  trackingBaseUrl: string;
  unsubscribeUrl: string;
}) {
  const source =
    getRecipientSource(
      delivery.recipient_source
    );

  const recipientId =
    String(
      delivery.recipient_id ||
        delivery.id
    );

  // ==================================================
  // OPEN TRACKING
  // ==================================================

  const trackingUrl =
    `${trackingBaseUrl}/api/campaigns/open` +
    `?campaignId=${encodeURIComponent(
      campaign.id
    )}` +
    `&profileId=${encodeURIComponent(
      recipientId
    )}` +
    `&source=${encodeURIComponent(
      source || "manual"
    )}`;

  // ==================================================
  // PREVIEW TEXT
  // ==================================================

  const previewText =
    campaign.preview_text
      ? `
        <div
          style="
            display:none;
            max-height:0;
            max-width:0;
            overflow:hidden;
            opacity:0;
            color:transparent;
            mso-hide:all;
          "
        >
          ${escapeHtml(
            campaign.preview_text
          )}

          &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
          &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>
      `
      : "";

  // ==================================================
  // UNSUBSCRIBE FOOTER
  // ==================================================

  const unsubscribeFooter =
    `
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
          width:100%;
          margin:0;
          padding:0;
          border-collapse:collapse;
        "
      >
        <tr>
          <td
            align="center"
            style="
              padding:
                24px
                20px
                30px;

              font-family:
                Arial,
                Helvetica,
                sans-serif;

              font-size:
                11px;

              line-height:
                1.6;

              color:
                #938d87;
            "
          >
            <p
              style="
                margin:
                  0
                  0
                  6px;
              "
            >
              You are receiving this email
              because your email address is
              included in this organisation's
              mailing list.
            </p>

            <p
              style="
                margin:0;
              "
            >
              Don't want to receive these
              emails?

              <a
                href="${escapeHtml(
                  unsubscribeUrl
                )}"
                target="_blank"
                style="
                  color:#68785e;
                  text-decoration:underline;
                  text-underline-offset:2px;
                "
              >
                Unsubscribe
              </a>
            </p>
          </td>
        </tr>
      </table>
    `;

  // ==================================================
  // TRACKING PIXEL
  // ==================================================

  const trackingPixel =
    `
      <img
        src="${escapeHtml(
          trackingUrl
        )}"
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

  // ==================================================
  // FINAL EMAIL
  // ==================================================

  return `
    ${previewText}

    ${campaign.content || ""}

    ${unsubscribeFooter}

    ${trackingPixel}
  `;
}

// ==================================================
// SECURITY
// ==================================================

function isAuthorisedCron(
  req: NextRequest
): boolean {
  const cronSecret =
    process.env
      .CRON_SECRET;

  if (!cronSecret) {
    console.error(
      "CRON_SECRET is not configured"
    );

    return false;
  }

  const authorization =
    req.headers.get(
      "authorization"
    );

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
    new Date()
      .toISOString();

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
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .update({
        status:
          "pending",

        updated_at:
          now,
      })
      .eq(
        "status",
        "sending"
      )
      .lt(
        "updated_at",
        staleBefore
      )
      .select(
        "id"
      );

  if (error) {
    throw new Error(
      `Failed to recover stale deliveries: ${error.message}`
    );
  }

  if (
    data?.length
  ) {
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
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .select(
        "*"
      )
      .eq(
        "status",
        "processing"
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        1
      )
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
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "*"
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
      )
      .order(
        "created_at",
        {
          ascending:
            true,
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

  return (
    data || []
  ) as Delivery[];
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
    new Date()
      .toISOString();

  const nextAttempts =
    Number(
      delivery.attempts ||
        0
    ) + 1;

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .update({
        status:
          "sending",

        attempts:
          nextAttempts,

        updated_at:
          now,
      })
      .eq(
        "id",
        delivery.id
      )
      .eq(
        "status",
        "pending"
      )
      .select(
        "id"
      );

  if (error) {
    throw new Error(
      `Failed to claim ${delivery.email}: ${error.message}`
    );
  }

  return {
    claimed:
      Boolean(
        data &&
          data.length ===
            1
      ),

    attempts:
      nextAttempts,
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
    new Date()
      .toISOString();

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .update({
        status:
          "sent",

        resend_id:
          resendId,

        last_error:
          null,

        sent_at:
          now,

        updated_at:
          now,
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
    new Date()
      .toISOString();

  const exhausted =
    attempts >=
    MAX_ATTEMPTS;

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .update({
        status:
          exhausted
            ? "failed"
            : "pending",

        last_error:
          errorMessage,

        updated_at:
          now,
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
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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

  const {
    count:
      retryablePending,

    error:
      retryablePendingError,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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

  if (
    retryablePendingError
  ) {
    throw new Error(
      retryablePendingError.message
    );
  }

  const {
    count:
      sending,

    error:
      sendingError,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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

  if (
    sendingError
  ) {
    throw new Error(
      sendingError.message
    );
  }

  const {
    count:
      failed,

    error:
      failedError,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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

  if (
    failedError
  ) {
    throw new Error(
      failedError.message
    );
  }

  const {
    count:
      exhaustedPending,

    error:
      exhaustedPendingError,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
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

  if (
    exhaustedPendingError
  ) {
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
    total:
      total || 0,

    sent:
      sent || 0,

    pending:
      active,

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
    new Date()
      .toISOString();

  // ==================================================
  // ZERO DELIVERY SAFETY
  // ==================================================

  if (
    counts.total === 0
  ) {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .update({
          status:
            "failed",

          sent_count:
            0,
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
      .from(
        "campaign_jobs"
      )
      .update({
        status:
          "failed",
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
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .update({
          status:
            "sent",

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
      .from(
        "campaign_jobs"
      )
      .update({
        status:
          "completed",
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
  // NOTHING LEFT + FAILURES
  // ==================================================

  if (
    counts.pending === 0 &&
    counts.exhausted > 0
  ) {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .update({
          status:
            "failed",

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
      .from(
        "campaign_jobs"
      )
      .update({
        status:
          "failed",
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
  // STILL PROCESSING
  // ==================================================

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .update({
        status:
          "processing",

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
      success:
        true,

      message:
        "No campaigns waiting to process.",

      processed:
        0,
    };
  }

  // ==================================================
  // VALIDATE CAMPAIGN
  // ==================================================

  if (
    !campaign.id
  ) {
    throw new Error(
      "Campaign is missing ID"
    );
  }

  if (
    !campaign.organisation_id
  ) {
    throw new Error(
      "Campaign is missing organisation_id"
    );
  }

  if (
    !campaign.list_id
  ) {
    throw new Error(
      "Campaign is missing list_id"
    );
  }

  // ==================================================
  // FROM EMAIL
  // ==================================================

  const fromEmail =
    process.env
      .RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error(
      "Missing RESEND_FROM_EMAIL"
    );
  }

  // ==================================================
  // BASE URL
  // ==================================================

  const trackingBaseUrl =
    normaliseBaseUrl(
      process.env
        .NEXT_PUBLIC_SITE_URL ||
        process.env
          .NEXT_PUBLIC_APP_URL ||
        "https://tots-os.co.uk"
    );

  // ==================================================
  // DELIVERIES
  // ==================================================

  const deliveries =
    await loadNextDeliveries(
      campaign.id
    );

  if (
    deliveries.length ===
    0
  ) {
    const progress =
      await updateCampaignProgress(
        campaign
      );

    return {
      success:
        true,

      campaignId:
        campaign.id,

      processed:
        0,

      ...progress,
    };
  }

  let sentThisRun =
    0;

  let failedThisRun =
    0;

  let skippedThisRun =
    0;

  // ==================================================
  // SEND MAXIMUM 20
  // ==================================================

  for (
    let index = 0;
    index <
    deliveries.length;
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

    if (!claimed) {
      skippedThisRun++;

      continue;
    }

    const email =
      cleanEmail(
        delivery.email
      );

    // ==================================================
    // VALIDATE EMAIL
    // ==================================================

    if (
      !email ||
      !isValidEmail(
        email
      )
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

    // ==================================================
    // VALIDATE RECIPIENT METADATA
    // ==================================================

    const recipientSource =
      getRecipientSource(
        delivery.recipient_source
      );

    const recipientId =
      String(
        delivery.recipient_id ||
          ""
      ).trim();

    if (
      !recipientSource ||
      !recipientId
    ) {
      await markDeliveryFailed({
        deliveryId:
          delivery.id,

        errorMessage:
          "Delivery is missing recipient_id or recipient_source",

        attempts,
      });

      failedThisRun++;

      continue;
    }

    // ==================================================
    // UNIQUE UNSUBSCRIBE URL
    // ==================================================

    let unsubscribeUrl:
      string;

    try {
      unsubscribeUrl =
        buildUnsubscribeUrl({
          campaign,
          delivery,
          trackingBaseUrl,
        });
    } catch (error) {
      const message =
        getErrorMessage(
          error
        );

      console.error(
        `Campaign ${campaign.id}: could not generate unsubscribe URL for ${email}:`,
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

      continue;
    }

    // ==================================================
    // FINAL EMAIL HTML
    // ==================================================

    const html =
      buildEmailHtml({
        campaign,
        delivery,
        trackingBaseUrl,
        unsubscribeUrl,
      });

    // ==================================================
    // IDEMPOTENCY
    // ==================================================

    const idempotencyKey =
      `campaign/${campaign.id}/delivery/${delivery.id}`;

    // ==================================================
    // SEND
    // ==================================================

    try {
      const {
        data,
        error,
      } =
        await resend.emails.send(
          {
            from:
              fromEmail,

            to: [
              email,
            ],

            subject:
              campaign.subject ||
              campaign.title ||
              "Campaign",

            html,

            replyTo:
              campaign.reply_to ||
              fromEmail,

            headers: {
              "List-Unsubscribe":
                `<${unsubscribeUrl}>`,
            },
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

    // ==================================================
    // RATE LIMIT
    // ==================================================

    if (
      index <
      deliveries.length -
        1
    ) {
      await sleep(
        SEND_DELAY_MS
      );
    }
  }

  // ==================================================
  // UPDATE COUNTS
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
    success:
      true,

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
// AUTHENTICATE DASHBOARD REQUEST
// ==================================================

async function getAuthenticatedUser(
  req: NextRequest
) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const accessToken =
    authorization
      .slice(
        "Bearer ".length
      )
      .trim();

  if (!accessToken) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin.auth
      .getUser(
        accessToken
      );

  if (
    error ||
    !data.user
  ) {
    return null;
  }

  return data.user;
}

// ==================================================
// LOAD SUPPRESSED EMAILS
// ==================================================

async function loadSuppressedEmails(
  organisationId: string
): Promise<Set<string>> {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_unsubscribes"
      )
      .select(
        "email"
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (error) {
    // Keep queueing compatible with deployments where
    // the suppression table has not yet been created.
    console.warn(
      "Could not load campaign_unsubscribes:",
      error.message
    );

    return new Set<string>();
  }

  return new Set(
    (data || [])
      .map(
        (row: any) =>
          cleanEmail(
            row.email
          )
      )
      .filter(Boolean)
  );
}

// ==================================================
// LOAD CAMPAIGN RECIPIENTS
// ==================================================

async function loadCampaignRecipients(
  campaign: any
): Promise<CampaignRecipient[]> {
  if (
    !campaign.list_id
  ) {
    return [];
  }

  if (
    !campaign.organisation_id
  ) {
    throw new Error(
      "Campaign missing organisation_id"
    );
  }

  const recipients:
    CampaignRecipient[] =
    [];

  const suppressedEmails =
    await loadSuppressedEmails(
      campaign.organisation_id
    );

  // ----------------------------------------------
  // Profile subscribers
  // ----------------------------------------------

  const {
    data: profileLinks,
    error: profileError,
  } =
    await supabaseAdmin
      .from(
        "profile_subscriber_lists"
      )
      .select(`
        profile_id,
        profiles (
          id,
          email,
          is_subscribed
        )
      `)
      .eq(
        "list_id",
        campaign.list_id
      )
      .eq(
        "organisation_id",
        campaign.organisation_id
      );

  if (profileError) {
    throw new Error(
      `Failed to load profile recipients: ${profileError.message}`
    );
  }

  for (
    const row of
    profileLinks || []
  ) {
    const profile =
      Array.isArray(
        row.profiles
      )
        ? row.profiles[0]
        : row.profiles;

    if (!profile) {
      continue;
    }

    if (
      profile.is_subscribed ===
      false
    ) {
      continue;
    }

    const email =
      cleanEmail(
        profile.email
      );

    if (
      !email ||
      !isValidEmail(
        email
      ) ||
      suppressedEmails.has(
        email
      )
    ) {
      continue;
    }

    recipients.push({
      id: String(
        profile.id ||
          row.profile_id
      ),

      email,

      source:
        "profile",
    });
  }

  // ----------------------------------------------
  // Manually entered subscribers
  // ----------------------------------------------

  const {
    data: manualRows,
    error: manualError,
  } =
    await supabaseAdmin
      .from(
        "campaign_list_emails"
      )
      .select(
        "id,email,organisation_id"
      )
      .eq(
        "list_id",
        campaign.list_id
      )
      .eq(
        "organisation_id",
        campaign.organisation_id
      );

  if (manualError) {
    throw new Error(
      `Failed to load manual recipients: ${manualError.message}`
    );
  }

  for (
    const row of
    manualRows || []
  ) {
    const email =
      cleanEmail(
        row.email
      );

    if (
      !email ||
      !isValidEmail(
        email
      ) ||
      suppressedEmails.has(
        email
      )
    ) {
      continue;
    }

    recipients.push({
      id: String(
        row.id
      ),

      email,

      source:
        "manual",
    });
  }

  // ----------------------------------------------
  // Dedupe by email
  // ----------------------------------------------

  const seen =
    new Set<string>();

  return recipients.filter(
    (recipient) => {
      if (
        seen.has(
          recipient.email
        )
      ) {
        return false;
      }

      seen.add(
        recipient.email
      );

      return true;
    }
  );
}

// ==================================================
// POST — QUEUE "SEND CAMPAIGN NOW"
// ==================================================

export async function POST(
  req: NextRequest
) {
  try {
    const user =
      await getAuthenticatedUser(
        req
      );

    if (!user) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Unauthorized",
        },
        {
          status:
            401,
        }
      );
    }

    const body =
      await req
        .json()
        .catch(
          () => null
        );

    const campaignId =
      typeof body?.campaignId ===
      "string"
        ? body.campaignId.trim()
        : "";

    if (!campaignId) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Missing campaignId",
        },
        {
          status:
            400,
        }
      );
    }

    // ----------------------------------------------
    // Resolve the signed-in user's organisation.
    // ----------------------------------------------

    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "id,organisation_id"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (profileError) {
      throw new Error(
        `Could not load your profile: ${profileError.message}`
      );
    }

    const userOrganisationId =
      String(
        profile?.organisation_id ||
          ""
      ).trim();

    if (!userOrganisationId) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "No active organisation found for your account.",
        },
        {
          status:
            403,
        }
      );
    }

    // ----------------------------------------------
    // Load the exact campaign requested.
    // ----------------------------------------------

    const {
      data: campaign,
      error: campaignError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .select(
          "*"
        )
        .eq(
          "id",
          campaignId
        )
        .maybeSingle();

    if (
      campaignError ||
      !campaign
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            campaignError?.message ||
            "Campaign not found",
        },
        {
          status:
            404,
        }
      );
    }

    if (
      campaign.organisation_id !==
      userOrganisationId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "You do not have access to this campaign.",
        },
        {
          status:
            403,
        }
      );
    }

    if (
      !campaign.list_id
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Choose an audience before sending this campaign.",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      campaign.status ===
        "processing" ||
      campaign.status ===
        "sending"
    ) {
      return NextResponse.json(
        {
          success:
            true,

          message:
            "Campaign is already queued and processing.",

          campaignId,

          status:
            campaign.status,
        }
      );
    }

    // ----------------------------------------------
    // Resolve current subscribed recipients.
    // ----------------------------------------------

    const recipients =
      await loadCampaignRecipients(
        campaign
      );

    if (
      recipients.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "No subscribed recipients were found in this audience.",
        },
        {
          status:
            400,
        }
      );
    }

    // ----------------------------------------------
    // Preserve rows that were already sent.
    // ----------------------------------------------

    const {
      data: existingRows,
      error: existingError,
    } =
      await supabaseAdmin
        .from(
          "campaign_deliveries"
        )
        .select(
          "id,email,status,attempts"
        )
        .eq(
          "campaign_id",
          campaignId
        );

    if (existingError) {
      throw new Error(
        `Failed to load existing deliveries: ${existingError.message}`
      );
    }

    const existingMap =
      new Map<
        string,
        ExistingDelivery
      >();

    for (
      const row of
      existingRows || []
    ) {
      const email =
        cleanEmail(
          row.email
        );

      if (!email) {
        continue;
      }

      existingMap.set(
        email,
        {
          id:
            String(
              row.id
            ),

          email,

          status:
            String(
              row.status ||
                ""
            ),

          attempts:
            Number(
              row.attempts ||
                0
            ),
        }
      );
    }

    const alreadySent =
      recipients.filter(
        (recipient) =>
          existingMap.get(
            recipient.email
          )?.status ===
          "sent"
      );

    const needsSending =
      recipients.filter(
        (recipient) =>
          existingMap.get(
            recipient.email
          )?.status !==
          "sent"
      );

    if (
      needsSending.length ===
      0
    ) {
      const now =
        new Date()
          .toISOString();

      const {
        error,
      } =
        await supabaseAdmin
          .from(
            "campaigns"
          )
          .update({
            status:
              "sent",

            sent_count:
              alreadySent.length,

            sent_at:
              campaign.sent_at ||
              now,
          })
          .eq(
            "id",
            campaignId
          );

      if (error) {
        throw new Error(
          `Failed to finalise campaign: ${error.message}`
        );
      }

      return NextResponse.json({
        success:
          true,

        message:
          "All recipients for this campaign have already been sent.",

        campaignId,

        totalRecipients:
          recipients.length,

        alreadySent:
          alreadySent.length,

        queued:
          0,
      });
    }

    const now =
      new Date()
        .toISOString();

    const queueRows =
      needsSending.map(
        (recipient) => ({
          campaign_id:
            campaignId,

          organisation_id:
            campaign.organisation_id,

          recipient_id:
            recipient.id,

          recipient_source:
            recipient.source,

          email:
            recipient.email,

          status:
            "pending",

          attempts:
            0,

          resend_id:
            null,

          last_error:
            null,

          sent_at:
            null,

          updated_at:
            now,
        })
      );

    const {
      error: queueError,
    } =
      await supabaseAdmin
        .from(
          "campaign_deliveries"
        )
        .upsert(
          queueRows,
          {
            onConflict:
              "campaign_id,email",
          }
        );

    if (queueError) {
      throw new Error(
        `Failed to queue recipients: ${queueError.message}`
      );
    }

    const {
      error:
        campaignUpdateError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .update({
          status:
            "processing",

          scheduled_for:
            null,

          sent_count:
            alreadySent.length,
        })
        .eq(
          "id",
          campaignId
        );

    if (
      campaignUpdateError
    ) {
      throw new Error(
        `Failed to update campaign: ${campaignUpdateError.message}`
      );
    }

    // Keep campaign_jobs in sync when the table is present.
    // The sender itself works from campaigns + campaign_deliveries.
    const {
      error: jobError,
    } =
      await supabaseAdmin
        .from(
          "campaign_jobs"
        )
        .insert({
          campaign_id:
            campaignId,

          status:
            "processing",

          created_at:
            now,
        });

    if (jobError) {
      console.warn(
        "Could not create campaign job:",
        jobError.message
      );
    }

    console.log(
      "CAMPAIGN QUEUED:",
      {
        campaignId,

        userId:
          user.id,

        organisationId:
          campaign.organisation_id,

        totalRecipients:
          recipients.length,

        alreadySent:
          alreadySent.length,

        queued:
          needsSending.length,
      }
    );

    return NextResponse.json({
      success:
        true,

      message:
        "Campaign queued successfully.",

      campaignId,

      totalRecipients:
        recipients.length,

      alreadySent:
        alreadySent.length,

      queued:
        needsSending.length,
    });
  } catch (error) {
    console.error(
      "CAMPAIGN QUEUE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          getErrorMessage(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}

// ==================================================
// GET — SUPABASE / VERCEL CRON
// ==================================================

export async function GET(
  req: NextRequest
) {
  try {
    if (
      !isAuthorisedCron(
        req
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "Unauthorized",
        },
        {
          status:
            401,
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
        success:
          false,

        error:
          getErrorMessage(
            error
          ),
      },
      {
        status:
          500,
      }
    );
  }
}