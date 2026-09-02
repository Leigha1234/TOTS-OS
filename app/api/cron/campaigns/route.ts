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

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

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

  [key: string]:
    unknown;
};

// ============================================================

type CampaignRecipient = {
  email:
    string;
};

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

  /*
   * If there is no secret configured, allow the request.
   *
   * Once CRON_SECRET exists, the cron/request must provide:
   *
   * Authorization: Bearer <CRON_SECRET>
   */
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
// EMAIL NORMALISER
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
    // CONFIG CHECK
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

          headers: {
            "Cache-Control":
              "no-store",
          },
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

          headers: {
            "Cache-Control":
              "no-store",
          },
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

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const now =
      new Date()
        .toISOString();

    console.log(
      "[CAMPAIGN CRON] Checking for due campaigns:",
      now
    );

    // ========================================================
    // GET DUE CAMPAIGNS
    //
    // Support both:
    //
    // queued
    // scheduled
    //
    // because the Campaign UI currently uses queued while
    // some older code used scheduled.
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
          ]
        )
        .not(
          "scheduled_for",
          "is",
          null
        )
        .lte(
          "scheduled_for",
          now
        )
        .order(
          "scheduled_for",
          {
            ascending:
              true,
          }
        )
        .limit(
          20
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

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // NOTHING DUE
    // ========================================================

    if (
      !campaigns?.length
    ) {
      console.log(
        "[CAMPAIGN CRON] No campaigns due."
      );

      return NextResponse.json(
        {
          success:
            true,

          processed:
            0,

          campaignsSent:
            0,

          campaignsFailed:
            0,

          totalEmailsSent:
            0,

          totalEmailsFailed:
            0,

          message:
            "No campaigns due",
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
    }

    // ========================================================
    // COUNTERS
    // ========================================================

    let processed =
      0;

    let successfulCampaigns =
      0;

    let failedCampaigns =
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

      let sent =
        0;

      let failed =
        0;

      let audienceSize =
        0;

      try {
        console.log(
          "[CAMPAIGN CRON] Processing campaign:",
          {
            id:
              campaign.id,

            title:
              campaign.title,

            organisationId:
              campaign.organisation_id,

            listId:
              campaign.list_id,

            status:
              campaign.status,

            scheduledFor:
              campaign.scheduled_for,
          }
        );

        // ====================================================
        // CLAIM CAMPAIGN
        //
        // Only change the row if it is still queued/scheduled.
        // This helps stop two workers sending it at once.
        // ====================================================

        const {
          data:
            claimedCampaigns,

          error:
            claimError,
        } =
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                "sending",
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
              ]
            )
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

        /*
         * If another worker claimed this campaign first,
         * there is nothing for this worker to do.
         */
        if (
          !claimedCampaigns?.length
        ) {
          console.log(
            "[CAMPAIGN CRON] Campaign already being processed:",
            campaign.id
          );

          continue;
        }

        // ====================================================
        // VALIDATE CAMPAIGN
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
        // GET CAMPAIGN RECIPIENTS
        //
        // IMPORTANT:
        //
        // The real list membership is stored in:
        //
        // public.campaign_list_emails
        //
        // NOT subscribers.
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
        // CLEAN + DEDUPLICATE RECIPIENTS
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

          if (
            !recipientMap.has(
              email
            )
          ) {
            recipientMap.set(
              email,
              {
                email,
              }
            );
          }
        }

        const recipients =
          Array.from(
            recipientMap.values()
          );

        audienceSize =
          recipients.length;

        console.log(
          "[CAMPAIGN CRON] Audience loaded:",
          {
            campaignId:
              campaign.id,

            rawRows:
              recipientRows
                ?.length ||
              0,

            uniqueRecipients:
              audienceSize,
          }
        );

        // ====================================================
        // NO RECIPIENTS
        // ====================================================

        if (
          recipients.length ===
          0
        ) {
          const sentAt =
            new Date()
              .toISOString();

          const {
            error:
              emptyUpdateError,
          } =
            await supabaseAdmin
              .from(
                "campaigns"
              )
              .update({
                status:
                  "sent",

                sent_at:
                  sentAt,

                total_sent:
                  0,
              })
              .eq(
                "id",
                campaign.id
              );

          if (
            emptyUpdateError
          ) {
            throw new Error(
              `Campaign completed but could not be updated: ${emptyUpdateError.message}`
            );
          }

          successfulCampaigns +=
            1;

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
          });

          console.log(
            "[CAMPAIGN CRON] Campaign had no recipients:",
            campaign.id
          );

          continue;
        }

        // ====================================================
        // CONTENT
        // ====================================================

        const subject =
          String(
            campaign.subject ||
            campaign.title ||
            "Newsletter"
          ).trim();

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
        // SEND EMAILS
        // ====================================================

        for (
          const recipient of
          recipients
        ) {
          const email =
            recipient.email;

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
                    email,

                  subject,

                  /*
                   * campaign.content already contains the
                   * complete campaign HTML.
                   *
                   * Do NOT wrap it in another generic template.
                   */
                  html,
                });

            // ==================================================
            // RESEND ERROR RESPONSE
            // ==================================================

            if (
              resendError
            ) {
              failed +=
                1;

              totalEmailsFailed +=
                1;

              console.error(
                "[CAMPAIGN CRON] Resend rejected email:",
                {
                  campaignId:
                    campaign.id,

                  email,

                  error:
                    resendError,
                }
              );

              continue;
            }

            // ==================================================
            // NO MESSAGE ID
            // ==================================================

            if (
              !resendData?.id
            ) {
              failed +=
                1;

              totalEmailsFailed +=
                1;

              console.error(
                "[CAMPAIGN CRON] Resend returned no email ID:",
                {
                  campaignId:
                    campaign.id,

                  email,

                  response:
                    resendData,
                }
              );

              continue;
            }

            // ==================================================
            // SUCCESS
            // ==================================================

            sent +=
              1;

            totalEmailsSent +=
              1;

            console.log(
              "[CAMPAIGN CRON] Email accepted by Resend:",
              {
                campaignId:
                  campaign.id,

                email,

                resendId:
                  resendData.id,

                progress:
                  `${sent + failed}/${audienceSize}`,
              }
            );
          } catch (
            sendError
          ) {
            failed +=
              1;

            totalEmailsFailed +=
              1;

            console.error(
              "[CAMPAIGN CRON] Email send exception:",
              {
                campaignId:
                  campaign.id,

                email,

                error:
                  sendError,
              }
            );
          }
        }

        // ====================================================
        // CAMPAIGN FINISHED
        // ====================================================

        const sentAt =
          new Date()
            .toISOString();

        /*
         * If at least one email succeeds, consider the campaign
         * sent.
         *
         * Any individual recipient failures are still logged
         * separately in the worker response.
         */
        const finalStatus =
          sent >
          0
            ? "sent"
            : "failed";

        const {
          error:
            finalUpdateError,
        } =
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                finalStatus,

              sent_at:
                sent >
                0
                  ? sentAt
                  : null,

              total_sent:
                sent,
            })
            .eq(
              "id",
              campaign.id
            );

        if (
          finalUpdateError
        ) {
          throw new Error(
            `Campaign emails were processed but the campaign could not be updated: ${finalUpdateError.message}`
          );
        }

        // ====================================================
        // CAMPAIGN COUNTER
        // ====================================================

        if (
          finalStatus ===
          "sent"
        ) {
          successfulCampaigns +=
            1;
        } else {
          failedCampaigns +=
            1;
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
            finalStatus,

          audience:
            audienceSize,

          sent,

          failed,
        });

        console.log(
          "[CAMPAIGN CRON] Campaign completed:",
          {
            id:
              campaign.id,

            title:
              campaign.title,

            finalStatus,

            audience:
              audienceSize,

            sent,

            failed,
          }
        );
      } catch (
        campaignProcessingError
      ) {
        failedCampaigns +=
          1;

        const message =
          campaignProcessingError instanceof
            Error
            ? campaignProcessingError.message
            : String(
                campaignProcessingError
              );

        console.error(
          "[CAMPAIGN CRON] Campaign failed:",
          {
            id:
              campaign.id,

            error:
              message,
          }
        );

        // ====================================================
        // MARK CAMPAIGN FAILED
        // ====================================================

        const {
          error:
            failedUpdateError,
        } =
          await supabaseAdmin
            .from(
              "campaigns"
            )
            .update({
              status:
                "failed",

              /*
               * If some messages were accepted before the
               * failure, preserve that number.
               */
              total_sent:
                sent,
            })
            .eq(
              "id",
              campaign.id
            );

        if (
          failedUpdateError
        ) {
          console.error(
            "[CAMPAIGN CRON] Could not mark campaign failed:",
            failedUpdateError
          );
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
            "failed",

          audience:
            audienceSize,

          sent,

          failed,

          error:
            message,
        });
      }
    }

    // ========================================================
    // DONE
    // ========================================================

    console.log(
      "[CAMPAIGN CRON] Worker completed:",
      {
        processed,

        successfulCampaigns,

        failedCampaigns,

        totalEmailsSent,

        totalEmailsFailed,
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        processed,

        campaignsSent:
          successfulCampaigns,

        campaignsFailed:
          failedCampaigns,

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
          error instanceof
            Error
            ? error.message
            : "Campaign cron failed.",
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