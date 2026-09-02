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

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

/*
 * Give the worker enough time to process larger lists where the
 * deployment platform supports maxDuration.
 */
export const maxDuration =
  300;

// ============================================================
// CONFIG
// ============================================================

const SEND_DELAY_MS =
  130;

/*
 * 130ms between completed sends means a theoretical maximum
 * of about 7.7 sends/sec, safely below Resend's 10/sec limit.
 */
const MAX_429_RETRIES =
  5;

const MAX_TOTAL_RATE_LIMIT_ATTEMPTS =
  20;

const CAMPAIGN_LOCK_SECONDS =
  120;

// ============================================================
// CLIENTS
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const resendApiKey =
  process.env
    .RESEND_API_KEY;

const resendFromEmail =
  process.env
    .RESEND_FROM_EMAIL;

if (
  !supabaseUrl ||
  !serviceRoleKey
) {
  console.error(
    "[CAMPAIGN CRON] Missing Supabase environment variables."
  );
}

if (
  !resendApiKey
) {
  console.error(
    "[CAMPAIGN CRON] Missing RESEND_API_KEY."
  );
}

if (
  !resendFromEmail
) {
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
        persistSession:
          false,

        autoRefreshToken:
          false,
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

type Campaign = {
  id:
    string;

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

  worker_locked_until?:
    string | null;

  worker_lock_token?:
    string | null;

  [key: string]:
    unknown;
};

// ============================================================

type CampaignRecipient = {
  email:
    string;
};

// ============================================================

type CampaignDelivery = {
  id:
    string;

  campaign_id:
    string;

  organisation_id:
    string;

  email:
    string;

  status:
    "pending" |
    "sending" |
    "sent" |
    "failed";

  attempts:
    number;

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
  ms:
    number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      setTimeout(
        resolve,
        ms
      );
    }
  );
}

// ============================================================

function normaliseEmail(
  value:
    unknown
) {
  return String(
    value ||
      ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================

function getErrorMessage(
  error:
    unknown
) {
  if (
    error instanceof
    Error
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

// ============================================================

function isRateLimitError(
  error:
    unknown
) {
  const message =
    getErrorMessage(
      error
    )
      .toLowerCase();

  return (
    message.includes(
      "429"
    ) ||
    message.includes(
      "rate limit"
    ) ||
    message.includes(
      "too many requests"
    )
  );
}

// ============================================================
// AUTH
// ============================================================

function isAuthorised(
  request:
    NextRequest
) {
  const cronSecret =
    process.env
      .CRON_SECRET
      ?.trim();

  if (
    !cronSecret
  ) {
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
// COUNT DELIVERY STATUSES
// ============================================================

async function getDeliveryCounts(
  campaignId:
    string
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

  if (
    error
  ) {
    throw new Error(
      `Could not count campaign deliveries: ${error.message}`
    );
  }

  let sent =
    0;

  let failed =
    0;

  let pending =
    0;

  let sending =
    0;

  for (
    const row of
    data ||
    []
  ) {
    if (
      row.status ===
      "sent"
    ) {
      sent +=
        1;
    } else if (
      row.status ===
      "failed"
    ) {
      failed +=
        1;
    } else if (
      row.status ===
      "sending"
    ) {
      sending +=
        1;
    } else {
      pending +=
        1;
    }
  }

  return {
    total:
      (
        data ||
        []
      ).length,

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
  campaignId:
    string,

  lockToken:
    string
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

  if (
    error
  ) {
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
// GET
// ============================================================

export async function GET(
  request:
    NextRequest
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
          success:
            false,

          error:
            "Unauthorized",
        },
        {
          status:
            401,

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
          success:
            false,

          error:
            "Supabase is not configured correctly.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !resendApiKey
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "RESEND_API_KEY is missing.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !resendFromEmail
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "RESEND_FROM_EMAIL is missing.",
        },
        {
          status:
            500,
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
    // IMPORTANT:
    //
    // Include "sending" so a campaign can resume after a
    // serverless timeout / interrupted cron run.
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
        .select(
          "*"
        )
        .in(
          "status",
          [
            "queued",
            "scheduled",
            "sending",
          ]
        )
        .not(
          "scheduled_for",
          "is",
          null
        )
        .lte(
          "scheduled_for",
          nowIso
        )
        .order(
          "scheduled_for",
          {
            ascending:
              true,
          }
        )
        .limit(
          10
        );

    if (
      campaignError
    ) {
      console.error(
        "[CAMPAIGN CRON] Campaign query failed:",
        campaignError
      );

      return NextResponse.json(
        {
          success:
            false,

          error:
            campaignError.message,
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !campaigns?.length
    ) {
      return NextResponse.json(
        {
          success:
            true,

          processed:
            0,

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

    let processed =
      0;

    let totalEmailsSent =
      0;

    let totalEmailsFailed =
      0;

    const campaignResults:
      Array<{
        id:
          string;

        title:
          string;

        status:
          string;

        audience:
          number;

        sent:
          number;

        failed:
          number;

        pending:
          number;

        error?:
          string;
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

      processed +=
        1;

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
          )
            .toISOString();

        let claimQuery =
          supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                "sending",

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
                "sending",
              ]
            );

        /*
         * If the campaign had a lock when it was selected,
         * only reclaim it if that lock is still the same
         * expired value.
         *
         * Otherwise require no active lock.
         */
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
            .select(
              "id"
            );

        if (
          claimError
        ) {
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

        lockAcquired =
          true;

        console.log(
          "[CAMPAIGN CRON] Campaign claimed:",
          {
            campaignId:
              campaign.id,

            lockToken,

            lockUntil,
          }
        );

        // ====================================================
        // VALIDATE
        // ====================================================

        if (
          !campaign.list_id
        ) {
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

        // ====================================================
        // CAMPAIGN CONTENT
        // ====================================================

        const subject =
          String(
            campaign.subject ||
            campaign.title ||
            "Newsletter"
          )
            .trim();

        const html =
          String(
            campaign.content ||
            ""
          );

        if (
          !html.trim()
        ) {
          throw new Error(
            "Campaign has no email content."
          );
        }

        // ====================================================
        // GET AUDIENCE
        // ====================================================

        const {
          data:
            recipientRows,

          error:
            recipientError,
        } =
          await supabaseAdmin
            .from(
              "campaign_list_emails"
            )
            .select(
              "email"
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

        if (
          recipientError
        ) {
          throw new Error(
            `Could not load campaign recipients: ${recipientError.message}`
          );
        }

        // ====================================================
        // CLEAN / DEDUPLICATE
        // ====================================================

        const recipientMap =
          new Map<
            string,
            CampaignRecipient
          >();

        for (
          const row of
          recipientRows ||
          []
        ) {
          const email =
            normaliseEmail(
              row.email
            );

          if (
            !email
          ) {
            continue;
          }

          recipientMap.set(
            email,
            {
              email,
            }
          );
        }

        const recipients =
          Array.from(
            recipientMap.values()
          );

        const audienceSize =
          recipients.length;

        console.log(
          "[CAMPAIGN CRON] Audience:",
          {
            campaignId:
              campaign.id,

            audienceSize,
          }
        );

        // ====================================================
        // NO RECIPIENTS
        // ====================================================

        if (
          audienceSize ===
          0
        ) {
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                "sent",

              total_sent:
                0,

              sent_at:
                new Date()
                  .toISOString(),

              worker_locked_until:
                null,

              worker_lock_token:
                null,
            })
            .eq(
              "id",
              campaign.id
            )
            .eq(
              "worker_lock_token",
              lockToken
            );

          lockAcquired =
            false;

          campaignResults.push({
            id:
              campaign.id,

            title:
              String(
                campaign.title ||
                "Campaign"
              ),

            status:
              "sent",

            audience:
              0,

            sent:
              0,

            failed:
              0,

            pending:
              0,
          });

          continue;
        }

        // ====================================================
        // CREATE DELIVERY ROWS
        //
        // Existing rows are deliberately NOT overwritten.
        // This is what lets us safely resume.
        // ====================================================

        const deliveryRows =
          recipients.map(
            (
              recipient
            ) => ({
              campaign_id:
                campaign.id,

              organisation_id:
                campaign.organisation_id!,

              email:
                recipient.email,

              status:
                "pending",
            })
          );

        const {
          error:
            deliveryInsertError,
        } =
          await supabaseAdmin
            .from(
              "campaign_deliveries"
            )
            .upsert(
              deliveryRows,
              {
                onConflict:
                  "campaign_id,email",

                ignoreDuplicates:
                  true,
              }
            );

        if (
          deliveryInsertError
        ) {
          throw new Error(
            `Could not prepare campaign deliveries: ${deliveryInsertError.message}`
          );
        }

        // ====================================================
        // RESET STALE "SENDING" ROWS
        //
        // If a previous worker died after marking an address
        // sending, but before Resend replied, this makes the
        // address resumable.
        //
        // IMPORTANT:
        // There is a very small unavoidable ambiguity if the
        // worker died after Resend accepted the email but before
        // we saved resend_id/status=sent.
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
              status:
                "pending",

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

        if (
          staleResetError
        ) {
          throw new Error(
            `Could not reset stale deliveries: ${staleResetError.message}`
          );
        }

        // ====================================================
        // SYNC EXISTING SENT COUNT
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

        console.log(
          "[CAMPAIGN CRON] Existing delivery progress:",
          counts
        );

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
            .select(
              `
                id,
                campaign_id,
                organisation_id,
                email,
                status,
                attempts,
                resend_id,
                last_error,
                sent_at
              `
            )
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
                ascending:
                  true,
              }
            );

        if (
          pendingError
        ) {
          throw new Error(
            `Could not load pending deliveries: ${pendingError.message}`
          );
        }

        const pendingDeliveries =
          (
            pendingRows ||
            []
          ) as CampaignDelivery[];

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
            )
              .toISOString();

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
              .select(
                "id"
              );

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
                status:
                  "sending",

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
              .select(
                "id"
              );

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
            localAttempts +=
              1;

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
                      resendFromEmail,

                    to:
                      delivery.email,

                    subject,

                    html,
                  });

              // ==============================================
              // RESEND ERROR
              // ==============================================

              if (
                resendError
              ) {
                if (
                  isRateLimitError(
                    resendError
                  )
                ) {
                  rateLimited =
                    true;

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
                    /*
                     * 1.25s
                     * 2.5s
                     * 5s
                     * 10s
                     */
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

                // ============================================
                // NON-RATE-LIMIT ERROR
                // ============================================

                terminalError =
                  getErrorMessage(
                    resendError
                  );

                break;
              }

              // ==============================================
              // NO RESEND ID
              // ==============================================

              if (
                !resendData?.id
              ) {
                terminalError =
                  "Resend returned no email ID.";

                break;
              }

              // ==============================================
              // ACCEPTED
              // ==============================================

              accepted =
                true;

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
                rateLimited =
                  true;

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

          if (
            accepted
          ) {
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
                  status:
                    "sent",

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

            totalEmailsSent +=
              1;

            sendsSinceProgressUpdate +=
              1;

            console.log(
              "[CAMPAIGN CRON] Email sent:",
              {
                campaignId:
                  campaign.id,

                email:
                  delivery.email,

                resendId,

                attempts:
                  newAttempts,
              }
            );
          }

          // ==================================================
          // RATE LIMIT EXHAUSTED
          //
          // Keep it pending so the NEXT cron run can continue.
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
                  status:
                    "pending",

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

            console.warn(
              "[CAMPAIGN CRON] Recipient will retry next cron run:",
              delivery.email
            );
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
                  status:
                    "failed",

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

            totalEmailsFailed +=
              1;

            console.error(
              "[CAMPAIGN CRON] Delivery failed permanently:",
              {
                email:
                  delivery.email,

                error:
                  terminalError,
              }
            );
          }

          // ==================================================
          // UPDATE CAMPAIGN PROGRESS EVERY 10 SUCCESSFUL SENDS
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

            sendsSinceProgressUpdate =
              0;
          }

          // ==================================================
          // RATE LIMIT
          //
          // ~7.7 deliveries/sec maximum even if Resend responds
          // immediately.
          // ==================================================

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
        // WORK OUT FINAL STATUS
        // ====================================================

        let finalStatus:
          "sending" |
          "sent" |
          "failed";

        /*
         * Pending means we have rate-limited recipients that
         * must be continued on the next worker run.
         */
        if (
          counts.pending >
          0 ||
          counts.sending >
          0
        ) {
          finalStatus =
            "sending";
        } else if (
          counts.sent >
          0
        ) {
          /*
           * All recipients are terminal.
           *
           * Some may be failed because of invalid/rejected
           * addresses, but the campaign itself has completed.
           */
          finalStatus =
            "sent";
        } else {
          finalStatus =
            "failed";
        }

        const sentAt =
          finalStatus ===
          "sent"
            ? new Date()
                .toISOString()
            : null;

        // ====================================================
        // UPDATE CAMPAIGN
        // ====================================================

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

        lockAcquired =
          false;

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

        // ====================================================
        // GET CURRENT COUNTS IF POSSIBLE
        // ====================================================

        let counts = {
          total:
            0,

          sent:
            0,

          failed:
            0,

          pending:
            0,

          sending:
            0,
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

        /*
         * IMPORTANT:
         *
         * Do NOT blindly mark the campaign failed if there are
         * still pending deliveries.
         *
         * Keep it as "sending" so a future cron execution can
         * resume the campaign.
         */
        const recoveryStatus =
          counts.pending >
            0 ||
          counts.sending >
            0 ||
          counts.sent >
            0
            ? "sending"
            : "failed";

        if (
          lockAcquired
        ) {
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

          lockAcquired =
            false;
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
        if (
          lockAcquired
        ) {
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
        success:
          true,

        processed,

        totalEmailsSent,

        totalEmailsFailed,

        campaigns:
          campaignResults,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[CAMPAIGN CRON] Unexpected error:",
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

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}