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
  randomUUID,
} from "crypto";

import {
  createCampaignUnsubscribeToken,
} from "@/lib/campaign-unsubscribe-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ============================================================
// CONFIG
// ============================================================

const SEND_DELAY_MS = 130;
const MAX_429_RETRIES = 5;
const MAX_TOTAL_RATE_LIMIT_ATTEMPTS = 20;
const CAMPAIGN_LOCK_SECONDS = 120;

const UNSUBSCRIBE_URL_TOKEN =
  "{{unsubscribe_url}}";

// ============================================================
// CLIENTS
// ============================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey =
  process.env.RESEND_API_KEY;

const resendFromEmail =
  process.env.RESEND_FROM_EMAIL;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "[CAMPAIGN CRON] Missing Supabase environment variables."
  );
}

if (!resendApiKey) {
  console.error(
    "[CAMPAIGN CRON] Missing RESEND_API_KEY."
  );
}

if (!resendFromEmail) {
  console.error(
    "[CAMPAIGN CRON] Missing RESEND_FROM_EMAIL."
  );
}

const supabaseAdmin =
  createClient(
    supabaseUrl || "",
    serviceRoleKey || "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

const resend =
  new Resend(
    resendApiKey || ""
  );

// ============================================================
// TYPES
// ============================================================

type RecipientSource =
  | "profile"
  | "manual";

type Campaign = {
  id: string;

  organisation_id?:
    string | null;

  title?:
    string | null;

  subject?:
    string | null;

  content?:
    string | null;

  status?:
    string | null;

  scheduled_for?:
    string | null;

  sent_at?:
    string | null;

  list_id?:
    string | null;

  total_sent?:
    number | null;

  sender_name?:
    string | null;

  reply_to?:
    string | null;

  worker_locked_until?:
    string | null;

  worker_lock_token?:
    string | null;

  [key: string]:
    unknown;
};

type CampaignRecipient = {
  id: string;
  email: string;
  source: RecipientSource;
};

type CampaignDelivery = {
  id: string;
  campaign_id: string;
  organisation_id: string;

  recipient_id?:
    string | null;

  recipient_source?:
    RecipientSource | null;

  email: string;

  status:
    | "pending"
    | "sending"
    | "sent"
    | "failed";

  attempts: number;

  resend_id?:
    string | null;

  last_error?:
    string | null;

  sent_at?:
    string | null;
};

// ============================================================
// HELPERS
// ============================================================

function sleep(
  ms: number
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        ms
      );
    }
  );
}

function normaliseEmail(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function getErrorMessage(
  error: unknown
) {
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

function isRateLimitError(
  error: unknown
) {
  const message =
    getErrorMessage(
      error
    ).toLowerCase();

  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeSenderName(
  value: unknown
) {
  return String(
    value || ""
  )
    .replace(/[<>]/g, "")
    .trim();
}

function buildFromAddress(
  campaign: Campaign
) {
  const base =
    String(
      resendFromEmail || ""
    ).trim();

  /*
   * RESEND_FROM_EMAIL can be either:
   *
   * hello@tots-os.co.uk
   *
   * OR:
   *
   * TOTS-OS <hello@tots-os.co.uk>
   *
   * If a campaign sender name is supplied, use that
   * display name while keeping the verified email.
   */
  const match =
    base.match(
      /<([^>]+)>/
    );

  const verifiedEmail =
    match?.[1]?.trim() ||
    base;

  const name =
    safeSenderName(
      campaign.sender_name
    );

  if (!name) {
    return base;
  }

  return `${name} <${verifiedEmail}>`;
}

function buildAppOrigin(
  request: NextRequest
) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL;

  if (configured) {
    return configured
      .trim()
      .replace(/\/+$/, "");
  }

  return new URL(
    request.url
  ).origin;
}

function addMandatoryUnsubscribeFooter(
  html: string,
  unsubscribeUrl: string
) {
  const escapedUrl =
    escapeHtml(
      unsubscribeUrl
    );

  /*
   * New campaign HTML from the campaign builder contains
   * {{unsubscribe_url}}. Replace every occurrence with the
   * recipient-specific URL.
   */
  if (
    html.includes(
      UNSUBSCRIBE_URL_TOKEN
    )
  ) {
    return html.replaceAll(
      UNSUBSCRIBE_URL_TOKEN,
      escapedUrl
    );
  }

  /*
   * Older/custom campaign HTML may not contain the token.
   * Append a mandatory unsubscribe footer server-side so an
   * email can never be sent without an unsubscribe link.
   */
  const footer = `
    <div
      data-tots-unsubscribe="true"
      style="
        margin:32px auto 0;
        padding:22px 20px;
        max-width:640px;
        box-sizing:border-box;
        border-top:1px solid #e7e5e4;
        text-align:center;
        font-family:Arial,Helvetica,sans-serif;
      "
    >
      <p
        style="
          margin:0 0 10px;
          color:#a8a29e;
          font-size:11px;
          line-height:1.5;
        "
      >
        Don't want to receive these emails?
      </p>

      <a
        href="${escapedUrl}"
        style="
          display:inline-block;
          color:#78716c;
          font-size:11px;
          font-weight:600;
          text-decoration:underline;
          text-underline-offset:3px;
        "
      >
        Unsubscribe
      </a>
    </div>
  `;

  if (
    /<\/body>/i.test(
      html
    )
  ) {
    return html.replace(
      /<\/body>/i,
      `${footer}</body>`
    );
  }

  return `${html}${footer}`;
}

function buildUnsubscribeUrl(
  request: NextRequest,
  campaign: Campaign,
  delivery: CampaignDelivery
) {
  if (
    !campaign.list_id ||
    !campaign.organisation_id
  ) {
    throw new Error(
      "Campaign is missing unsubscribe context."
    );
  }

  if (
    !delivery.recipient_id ||
    !delivery.recipient_source
  ) {
    throw new Error(
      `Delivery ${delivery.id} is missing recipient_id or recipient_source.`
    );
  }

  const token =
    createCampaignUnsubscribeToken({
      recipientId:
        delivery.recipient_id,

      email:
        normaliseEmail(
          delivery.email
        ),

      source:
        delivery.recipient_source,

      listId:
        campaign.list_id,

      organisationId:
        campaign.organisation_id,
    });

  const origin =
    buildAppOrigin(
      request
    );

  return (
    `${origin}/unsubscribe?token=` +
    encodeURIComponent(
      token
    )
  );
}

// ============================================================
// AUTH
// ============================================================

function isAuthorised(
  request: NextRequest
) {
  const cronSecret =
    process.env.CRONSECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  return (
    authorization ===
    `Bearer ${cronSecret}`
  );
}

// ============================================================
// DELIVERY COUNTS
// ============================================================

async function getDeliveryCounts(
  campaignId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .select(
        "status"
      )
      .eq(
        "campaign_id",
        campaignId
      );

  if (error) {
    throw new Error(
      `Could not count campaign deliveries: ${error.message}`
    );
  }

  let sent = 0;
  let failed = 0;
  let pending = 0;
  let sending = 0;

  for (
    const row of
    data || []
  ) {
    if (
      row.status === "sent"
    ) {
      sent += 1;
    } else if (
      row.status === "failed"
    ) {
      failed += 1;
    } else if (
      row.status === "sending"
    ) {
      sending += 1;
    } else {
      pending += 1;
    }
  }

  return {
    total:
      (data || []).length,
    sent,
    failed,
    pending,
    sending,
  };
}

// ============================================================
// RELEASE CAMPAIGN LOCK
// ============================================================

async function releaseCampaignLock(
  campaignId: string,
  lockToken: string
) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .update({
        worker_locked_until:
          null,

        worker_lock_token:
          null,

        last_worker_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        campaignId
      )
      .eq(
        "worker_lock_token",
        lockToken
      );

  if (error) {
    console.error(
      "[CAMPAIGN CRON] Could not release campaign lock:",
      {
        campaignId,
        error,
      }
    );
  }
}

// ============================================================
// SUPPRESSION LIST
// ============================================================

async function getSuppressedEmails(
  organisationId: string
) {
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
    throw new Error(
      `Could not load unsubscribe suppressions: ${error.message}`
    );
  }

  return new Set(
    (data || [])
      .map((row) =>
        normaliseEmail(
          row.email
        )
      )
      .filter(Boolean)
  );
}

// ============================================================
// LOAD AUDIENCE
// ============================================================

async function loadCampaignRecipients(
  campaign: Campaign
): Promise<CampaignRecipient[]> {
  if (
    !campaign.list_id ||
    !campaign.organisation_id
  ) {
    return [];
  }

  const suppressed =
    await getSuppressedEmails(
      campaign.organisation_id
    );

  const recipients:
    CampaignRecipient[] =
    [];

  // ----------------------------------------------------------
  // PROFILE SUBSCRIBERS
  // ----------------------------------------------------------

  const {
    data:
      profileLinks,

    error:
      profileError,
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
      );

  if (profileError) {
    throw new Error(
      `Could not load profile subscribers: ${profileError.message}`
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
      normaliseEmail(
        profile.email
      );

    if (
      !email ||
      !isValidEmail(email) ||
      suppressed.has(email)
    ) {
      continue;
    }

    recipients.push({
      id:
        String(
          profile.id ||
          row.profile_id
        ),

      email,

      source:
        "profile",
    });
  }

  // ----------------------------------------------------------
  // MANUAL SUBSCRIBERS
  // ----------------------------------------------------------

  const {
    data:
      manualRows,

    error:
      manualError,
  } =
    await supabaseAdmin
      .from(
        "campaign_list_emails"
      )
      .select(
        "id,email"
      )
      .eq(
        "list_id",
        campaign.list_id
      )
      .eq(
        "organisation_id",
        campaign.organisation_id
      )
      .not(
        "email",
        "is",
        null
      );

  if (manualError) {
    throw new Error(
      `Could not load manual subscribers: ${manualError.message}`
    );
  }

  for (
    const row of
    manualRows || []
  ) {
    const email =
      normaliseEmail(
        row.email
      );

    if (
      !email ||
      !isValidEmail(email) ||
      suppressed.has(email)
    ) {
      continue;
    }

    recipients.push({
      id:
        String(
          row.id
        ),

      email,

      source:
        "manual",
    });
  }

  // ----------------------------------------------------------
  // DEDUPE BY EMAIL
  // ----------------------------------------------------------

  const seen =
    new Set<string>();

  const deduped:
    CampaignRecipient[] =
    [];

  for (
    const recipient of
    recipients
  ) {
    if (
      seen.has(
        recipient.email
      )
    ) {
      continue;
    }

    seen.add(
      recipient.email
    );

    deduped.push(
      recipient
    );
  }

  return deduped;
}

// ============================================================
// ENSURE DELIVERY ROWS
// ============================================================
//
// This keeps scheduled campaigns working even if they reach
// the worker before /api/campaigns/send explicitly queued rows.
//

async function ensureDeliveryRows(
  campaign: Campaign
) {
  if (
    !campaign.organisation_id
  ) {
    throw new Error(
      "Campaign has no organisation_id."
    );
  }

  const recipients =
    await loadCampaignRecipients(
      campaign
    );

  if (
    recipients.length === 0
  ) {
    return 0;
  }

  const rows =
    recipients.map(
      (recipient) => ({
        campaign_id:
          campaign.id,

        organisation_id:
          campaign.organisation_id!,

        recipient_id:
          recipient.id,

        recipient_source:
          recipient.source,

        email:
          recipient.email,

        status:
          "pending",
      })
    );

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .upsert(
        rows,
        {
          onConflict:
            "campaign_id,email",

          ignoreDuplicates:
            true,
        }
      );

  if (error) {
    throw new Error(
      `Could not prepare campaign deliveries: ${error.message}`
    );
  }

  return recipients.length;
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ========================================================
    // SECURITY
    // ========================================================

    if (
      !isAuthorised(
        request
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // CONFIG
    // ========================================================

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Supabase is not configured correctly.",
        },
        {
          status: 500,
        }
      );
    }

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,

          error:
            "RESEND_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    if (!resendFromEmail) {
      return NextResponse.json(
        {
          success: false,

          error:
            "RESEND_FROM_EMAIL is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const now =
      new Date();

    const nowIso =
      now.toISOString();

    console.log(
      "[CAMPAIGN CRON] Starting worker:",
      nowIso
    );

    // ========================================================
    // GET CAMPAIGNS
    //
    // "processing" is included because /api/campaigns/send
    // marks newly queued campaigns as processing.
    // ========================================================

    const {
      data:
        campaigns,

      error:
        campaignError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .select("*")
        .in(
          "status",
          [
            "queued",
            "scheduled",
            "processing",
            "sending",
          ]
        )
        .or(
          `scheduled_for.is.null,scheduled_for.lte.${nowIso}`
        )
        .order(
          "scheduled_for",
          {
            ascending: true,
            nullsFirst: true,
          }
        )
        .limit(10);

    if (campaignError) {
      console.error(
        "[CAMPAIGN CRON] Campaign query failed:",
        campaignError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            campaignError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (
      !campaigns?.length
    ) {
      return NextResponse.json(
        {
          success: true,
          processed: 0,
          message:
            "No campaigns due",
        },
        {
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // GLOBAL COUNTERS
    // ========================================================

    let processed = 0;
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    const campaignResults:
      Array<{
        id: string;
        title: string;
        status: string;
        audience: number;
        sent: number;
        failed: number;
        pending: number;
        error?: string;
      }> =
      [];

    // ========================================================
    // PROCESS CAMPAIGNS
    // ========================================================

    for (
      const rawCampaign of
      campaigns
    ) {
      const campaign =
        rawCampaign as Campaign;

      processed += 1;

      const lockToken =
        randomUUID();

      let lockAcquired =
        false;

      try {
        // ====================================================
        // CHECK EXISTING LOCK
        // ====================================================

        if (
          campaign.worker_locked_until
        ) {
          const lockedUntil =
            new Date(
              campaign.worker_locked_until
            );

          if (
            lockedUntil >
            new Date()
          ) {
            console.log(
              "[CAMPAIGN CRON] Campaign is currently locked:",
              campaign.id
            );

            continue;
          }
        }

        // ====================================================
        // CLAIM CAMPAIGN
        // ====================================================

        const lockUntil =
          new Date(
            Date.now() +
            CAMPAIGN_LOCK_SECONDS *
              1000
          ).toISOString();

        let claimQuery =
          supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status: "sending",

              worker_locked_until:
                lockUntil,

              worker_lock_token:
                lockToken,

              last_worker_at:
                nowIso,
            })
            .eq(
              "id",
              campaign.id
            )
            .in(
              "status",
              [
                "queued",
                "scheduled",
                "processing",
                "sending",
              ]
            );

        if (
          campaign.worker_locked_until
        ) {
          claimQuery =
            claimQuery.eq(
              "worker_locked_until",
              campaign.worker_locked_until
            );
        } else {
          claimQuery =
            claimQuery.is(
              "worker_locked_until",
              null
            );
        }

        const {
          data:
            claimedRows,

          error:
            claimError,
        } =
          await claimQuery
            .select("id");

        if (claimError) {
          throw new Error(
            `Could not claim campaign: ${claimError.message}`
          );
        }

        if (
          !claimedRows?.length
        ) {
          console.log(
            "[CAMPAIGN CRON] Campaign was claimed by another worker:",
            campaign.id
          );

          continue;
        }

        lockAcquired = true;

        // ====================================================
        // VALIDATE
        // ====================================================

        if (!campaign.list_id) {
          throw new Error(
            "Campaign has no subscriber list."
          );
        }

        if (
          !campaign.organisation_id
        ) {
          throw new Error(
            "Campaign has no organisation_id."
          );
        }

        const subject =
          String(
            campaign.subject ||
              campaign.title ||
              "Newsletter"
          ).trim();

        const baseHtml =
          String(
            campaign.content ||
              ""
          );

        if (
          !baseHtml.trim()
        ) {
          throw new Error(
            "Campaign has no email content."
          );
        }

        // ====================================================
        // ENSURE AUDIENCE DELIVERY ROWS EXIST
        // ====================================================

        const audienceSize =
          await ensureDeliveryRows(
            campaign
          );

        console.log(
          "[CAMPAIGN CRON] Audience prepared:",
          {
            campaignId:
              campaign.id,

            audienceSize,
          }
        );

        // ====================================================
        // RESET STALE SENDING ROWS
        // ====================================================

        const {
          error:
            staleResetError,
        } =
          await supabaseAdmin
            .from(
              "campaign_deliveries"
            )
            .update({
              status: "pending",

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "campaign_id",
              campaign.id
            )
            .eq(
              "status",
              "sending"
            );

        if (staleResetError) {
          throw new Error(
            `Could not reset stale deliveries: ${staleResetError.message}`
          );
        }

        // ====================================================
        // REMOVE / SKIP ANY NEWLY UNSUBSCRIBED PENDING ROWS
        // ====================================================

        const suppressedEmails =
          await getSuppressedEmails(
            campaign.organisation_id
          );

        if (
          suppressedEmails.size >
          0
        ) {
          const {
            data:
              pendingForSuppression,

            error:
              suppressionLoadError,
          } =
            await supabaseAdmin
              .from(
                "campaign_deliveries"
              )
              .select(
                "id,email"
              )
              .eq(
                "campaign_id",
                campaign.id
              )
              .eq(
                "status",
                "pending"
              );

          if (
            suppressionLoadError
          ) {
            throw new Error(
              `Could not check pending suppressions: ${suppressionLoadError.message}`
            );
          }

          for (
            const row of
            pendingForSuppression ||
            []
          ) {
            const email =
              normaliseEmail(
                row.email
              );

            if (
              !suppressedEmails.has(
                email
              )
            ) {
              continue;
            }

            await supabaseAdmin
              .from(
                "campaign_deliveries"
              )
              .update({
                status: "failed",

                last_error:
                  "Recipient unsubscribed before send.",

                updated_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                row.id
              );
          }
        }

        // ====================================================
        // GET CURRENT COUNTS
        // ====================================================

        let counts =
          await getDeliveryCounts(
            campaign.id
          );

        await supabaseAdmin
          .from(
            "campaigns"
          )
          .update({
            total_sent:
              counts.sent,
          })
          .eq(
            "id",
            campaign.id
          );

        // ====================================================
        // NO DELIVERIES
        // ====================================================

        if (
          counts.total === 0
        ) {
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status: "sent",
              total_sent: 0,

              sent_at:
                new Date()
                  .toISOString(),

              worker_locked_until:
                null,

              worker_lock_token:
                null,

              last_worker_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              campaign.id
            )
            .eq(
              "worker_lock_token",
              lockToken
            );

          lockAcquired = false;

          campaignResults.push({
            id:
              campaign.id,

            title:
              String(
                campaign.title ||
                  "Campaign"
              ),

            status: "sent",
            audience: 0,
            sent: 0,
            failed: 0,
            pending: 0,
          });

          continue;
        }

        // ====================================================
        // GET PENDING DELIVERIES
        // ====================================================

        const {
          data:
            pendingRows,

          error:
            pendingError,
        } =
          await supabaseAdmin
            .from(
              "campaign_deliveries"
            )
            .select(`
              id,
              campaign_id,
              organisation_id,
              recipient_id,
              recipient_source,
              email,
              status,
              attempts,
              resend_id,
              last_error,
              sent_at
            `)
            .eq(
              "campaign_id",
              campaign.id
            )
            .eq(
              "status",
              "pending"
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

        if (pendingError) {
          throw new Error(
            `Could not load pending deliveries: ${pendingError.message}`
          );
        }

        const pendingDeliveries =
          (pendingRows ||
            []) as CampaignDelivery[];

        console.log(
          "[CAMPAIGN CRON] Remaining recipients:",
          pendingDeliveries.length
        );

        // ====================================================
        // SEND PENDING RECIPIENTS
        // ====================================================

        let sendsSinceProgressUpdate =
          0;

        for (
          const delivery of
          pendingDeliveries
        ) {
          // ==================================================
          // REFRESH CAMPAIGN LOCK
          // ==================================================

          const refreshedLockUntil =
            new Date(
              Date.now() +
              CAMPAIGN_LOCK_SECONDS *
                1000
            ).toISOString();

          const {
            data:
              lockRefreshRows,

            error:
              lockRefreshError,
          } =
            await supabaseAdmin
              .from(
                "campaigns"
              )
              .update({
                worker_locked_until:
                  refreshedLockUntil,

                last_worker_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                campaign.id
              )
              .eq(
                "worker_lock_token",
                lockToken
              )
              .select("id");

          if (
            lockRefreshError
          ) {
            throw new Error(
              `Could not refresh campaign lock: ${lockRefreshError.message}`
            );
          }

          if (
            !lockRefreshRows?.length
          ) {
            throw new Error(
              "Campaign worker lock was lost."
            );
          }

          // ==================================================
          // FINAL UNSUBSCRIBE CHECK
          // ==================================================
          //
          // Someone could unsubscribe after this worker loaded
          // the pending rows but before their specific send.
          // Check again immediately before sending.
          // ==================================================

          const normalisedDeliveryEmail =
            normaliseEmail(
              delivery.email
            );

          const {
            data:
              suppressionRow,

            error:
              finalSuppressionError,
          } =
            await supabaseAdmin
              .from(
                "campaign_unsubscribes"
              )
              .select("id")
              .eq(
                "organisation_id",
                campaign.organisation_id
              )
              .eq(
                "email",
                normalisedDeliveryEmail
              )
              .maybeSingle();

          if (
            finalSuppressionError
          ) {
            throw new Error(
              `Could not verify unsubscribe status: ${finalSuppressionError.message}`
            );
          }

          if (suppressionRow) {
            await supabaseAdmin
              .from(
                "campaign_deliveries"
              )
              .update({
                status: "failed",

                last_error:
                  "Recipient unsubscribed before send.",

                updated_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                delivery.id
              );

            continue;
          }

          // ==================================================
          // BUILD UNIQUE UNSUBSCRIBE URL + HTML
          // ==================================================

          let unsubscribeUrl:
            string;

          try {
            unsubscribeUrl =
              buildUnsubscribeUrl(
                request,
                campaign,
                delivery
              );
          } catch (
            unsubscribeError
          ) {
            await supabaseAdmin
              .from(
                "campaign_deliveries"
              )
              .update({
                status: "failed",

                last_error:
                  `Could not create unsubscribe link: ${getErrorMessage(
                    unsubscribeError
                  )}`,

                updated_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                delivery.id
              );

            totalEmailsFailed += 1;

            continue;
          }

          const recipientHtml =
            addMandatoryUnsubscribeFooter(
              baseHtml,
              unsubscribeUrl
            );

          // ==================================================
          // MARK RECIPIENT SENDING
          // ==================================================

          const currentAttempts =
            Number(
              delivery.attempts ||
                0
            );

          const {
            data:
              claimedDelivery,

            error:
              deliveryClaimError,
          } =
            await supabaseAdmin
              .from(
                "campaign_deliveries"
              )
              .update({
                status: "sending",

                updated_at:
                  new Date()
                    .toISOString(),
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

          if (
            deliveryClaimError
          ) {
            console.error(
              "[CAMPAIGN CRON] Could not claim recipient:",
              {
                email:
                  delivery.email,

                error:
                  deliveryClaimError,
              }
            );

            continue;
          }

          if (
            !claimedDelivery?.length
          ) {
            continue;
          }

          // ==================================================
          // SEND WITH 429 RETRIES
          // ==================================================

          let accepted =
            false;

          let rateLimited =
            false;

          let terminalError =
            "";

          let resendId =
            "";

          let localAttempts =
            0;

          while (
            !accepted &&
            localAttempts <
              MAX_429_RETRIES
          ) {
            localAttempts += 1;

            const totalAttemptNumber =
              currentAttempts +
              localAttempts;

            try {
              const {
                data:
                  resendData,

                error:
                  resendError,
              } =
                await resend
                  .emails
                  .send({
                    from:
                      buildFromAddress(
                        campaign
                      ),

                    to:
                      delivery.email,

                    ...(campaign.reply_to &&
                    isValidEmail(
                      normaliseEmail(
                        campaign.reply_to
                      )
                    )
                      ? {
                          replyTo:
                            normaliseEmail(
                              campaign.reply_to
                            ),
                        }
                      : {}),

                    subject,

                    html:
                      recipientHtml,
                  });

              if (
                resendError
              ) {
                if (
                  isRateLimitError(
                    resendError
                  )
                ) {
                  rateLimited = true;

                  terminalError =
                    getErrorMessage(
                      resendError
                    );

                  console.warn(
                    "[CAMPAIGN CRON] Resend 429:",
                    {
                      campaignId:
                        campaign.id,

                      email:
                        delivery.email,

                      retry:
                        localAttempts,

                      totalAttempt:
                        totalAttemptNumber,
                    }
                  );

                  if (
                    totalAttemptNumber >=
                    MAX_TOTAL_RATE_LIMIT_ATTEMPTS
                  ) {
                    break;
                  }

                  if (
                    localAttempts <
                    MAX_429_RETRIES
                  ) {
                    const retryDelay =
                      Math.min(
                        10000,
                        1250 *
                          Math.pow(
                            2,
                            localAttempts -
                              1
                          )
                      );

                    await sleep(
                      retryDelay
                    );

                    continue;
                  }

                  break;
                }

                terminalError =
                  getErrorMessage(
                    resendError
                  );

                break;
              }

              if (
                !resendData?.id
              ) {
                terminalError =
                  "Resend returned no email ID.";

                break;
              }

              accepted = true;

              resendId =
                resendData.id;

              rateLimited =
                false;
            } catch (
              sendError
            ) {
              if (
                isRateLimitError(
                  sendError
                )
              ) {
                rateLimited = true;

                terminalError =
                  getErrorMessage(
                    sendError
                  );

                if (
                  localAttempts <
                  MAX_429_RETRIES
                ) {
                  const retryDelay =
                    Math.min(
                      10000,
                      1250 *
                        Math.pow(
                          2,
                          localAttempts -
                            1
                        )
                    );

                  await sleep(
                    retryDelay
                  );

                  continue;
                }

                break;
              }

              terminalError =
                getErrorMessage(
                  sendError
                );

              break;
            }
          }

          const newAttempts =
            currentAttempts +
            localAttempts;

          // ==================================================
          // SUCCESS
          // ==================================================

          if (accepted) {
            const sentAt =
              new Date()
                .toISOString();

            const {
              error:
                deliverySentError,
            } =
              await supabaseAdmin
                .from(
                  "campaign_deliveries"
                )
                .update({
                  status: "sent",

                  attempts:
                    newAttempts,

                  resend_id:
                    resendId,

                  last_error:
                    null,

                  sent_at:
                    sentAt,

                  updated_at:
                    sentAt,
                })
                .eq(
                  "id",
                  delivery.id
                );

            if (
              deliverySentError
            ) {
              throw new Error(
                `Email was accepted by Resend but delivery tracking failed for ${delivery.email}: ${deliverySentError.message}`
              );
            }

            totalEmailsSent += 1;
            sendsSinceProgressUpdate += 1;
          }

          // ==================================================
          // RATE LIMITED — RETRY NEXT WORKER RUN
          // ==================================================

          else if (
            rateLimited &&
            newAttempts <
              MAX_TOTAL_RATE_LIMIT_ATTEMPTS
          ) {
            const {
              error:
                pendingAgainError,
            } =
              await supabaseAdmin
                .from(
                  "campaign_deliveries"
                )
                .update({
                  status: "pending",

                  attempts:
                    newAttempts,

                  last_error:
                    terminalError,

                  updated_at:
                    new Date()
                      .toISOString(),
                })
                .eq(
                  "id",
                  delivery.id
                );

            if (
              pendingAgainError
            ) {
              throw new Error(
                `Could not return rate-limited recipient to pending: ${pendingAgainError.message}`
              );
            }
          }

          // ==================================================
          // TERMINAL FAILURE
          // ==================================================

          else {
            const {
              error:
                failedDeliveryError,
            } =
              await supabaseAdmin
                .from(
                  "campaign_deliveries"
                )
                .update({
                  status: "failed",

                  attempts:
                    newAttempts,

                  last_error:
                    terminalError ||
                    "Email could not be sent.",

                  updated_at:
                    new Date()
                      .toISOString(),
                })
                .eq(
                  "id",
                  delivery.id
                );

            if (
              failedDeliveryError
            ) {
              throw new Error(
                `Could not record failed delivery: ${failedDeliveryError.message}`
              );
            }

            totalEmailsFailed += 1;
          }

          // ==================================================
          // UPDATE CAMPAIGN PROGRESS EVERY 10 SENDS
          // ==================================================

          if (
            sendsSinceProgressUpdate >=
            10
          ) {
            counts =
              await getDeliveryCounts(
                campaign.id
              );

            await supabaseAdmin
              .from(
                "campaigns"
              )
              .update({
                total_sent:
                  counts.sent,

                last_worker_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                campaign.id
              );

            sendsSinceProgressUpdate = 0;
          }

          await sleep(
            SEND_DELAY_MS
          );
        }

        // ====================================================
        // FINAL COUNTS
        // ====================================================

        counts =
          await getDeliveryCounts(
            campaign.id
          );

        // ====================================================
        // FINAL STATUS
        // ====================================================

        let finalStatus:
          | "sending"
          | "sent"
          | "failed";

        if (
          counts.pending > 0 ||
          counts.sending > 0
        ) {
          finalStatus =
            "sending";
        } else if (
          counts.sent > 0
        ) {
          finalStatus =
            "sent";
        } else {
          finalStatus =
            "failed";
        }

        const sentAt =
          finalStatus === "sent"
            ? new Date()
                .toISOString()
            : null;

        const {
          error:
            finalCampaignError,
        } =
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                finalStatus,

              total_sent:
                counts.sent,

              sent_at:
                sentAt,

              worker_locked_until:
                null,

              worker_lock_token:
                null,

              last_worker_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              campaign.id
            )
            .eq(
              "worker_lock_token",
              lockToken
            );

        if (
          finalCampaignError
        ) {
          throw new Error(
            `Could not finalise campaign: ${finalCampaignError.message}`
          );
        }

        lockAcquired = false;

        campaignResults.push({
          id:
            campaign.id,

          title:
            String(
              campaign.title ||
                "Campaign"
            ),

          status:
            finalStatus,

          audience:
            counts.total,

          sent:
            counts.sent,

          failed:
            counts.failed,

          pending:
            counts.pending +
            counts.sending,
        });

        console.log(
          "[CAMPAIGN CRON] Campaign progress complete:",
          {
            campaignId:
              campaign.id,

            finalStatus,
            ...counts,
          }
        );
      } catch (
        campaignProcessingError
      ) {
        const message =
          getErrorMessage(
            campaignProcessingError
          );

        console.error(
          "[CAMPAIGN CRON] Campaign worker error:",
          {
            campaignId:
              campaign.id,

            error:
              message,
          }
        );

        let counts = {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          sending: 0,
        };

        try {
          counts =
            await getDeliveryCounts(
              campaign.id
            );
        } catch (
          countError
        ) {
          console.error(
            "[CAMPAIGN CRON] Could not load counts after error:",
            countError
          );
        }

        const recoveryStatus =
          counts.pending > 0 ||
          counts.sending > 0 ||
          counts.sent > 0
            ? "sending"
            : "failed";

        if (lockAcquired) {
          const {
            error:
              recoveryError,
          } =
            await supabaseAdmin
              .from(
                "campaigns"
              )
              .update({
                status:
                  recoveryStatus,

                total_sent:
                  counts.sent,

                worker_locked_until:
                  null,

                worker_lock_token:
                  null,

                last_worker_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                campaign.id
              )
              .eq(
                "worker_lock_token",
                lockToken
              );

          if (
            recoveryError
          ) {
            console.error(
              "[CAMPAIGN CRON] Could not release campaign after error:",
              recoveryError
            );
          }

          lockAcquired = false;
        }

        campaignResults.push({
          id:
            campaign.id,

          title:
            String(
              campaign.title ||
                "Campaign"
            ),

          status:
            recoveryStatus,

          audience:
            counts.total,

          sent:
            counts.sent,

          failed:
            counts.failed,

          pending:
            counts.pending +
            counts.sending,

          error:
            message,
        });
      } finally {
        if (lockAcquired) {
          await releaseCampaignLock(
            campaign.id,
            lockToken
          );
        }
      }
    }

    // ========================================================
    // FINISHED
    // ========================================================

    console.log(
      "[CAMPAIGN CRON] Worker finished:",
      {
        processed,
        totalEmailsSent,
        totalEmailsFailed,
      }
    );

    return NextResponse.json(
      {
        success: true,
        processed,
        totalEmailsSent,
        totalEmailsFailed,
        campaigns:
          campaignResults,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "[CAMPAIGN CRON] Unexpected error:",
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

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
