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
   * If no secret has been configured yet, allow the route.
   *
   * Once CRON_SECRET exists, require the matching bearer token.
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
      new Date()
        .toISOString();

    console.log(
      "[CAMPAIGN CRON] Checking for due campaigns:",
      now
    );

    // ========================================================
    // GET DUE CAMPAIGNS
    //
    // IMPORTANT:
    // Your UI currently stores campaigns as "queued".
    //
    // Older/newer areas may use "scheduled", so accept both.
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
        }
      );
    }

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

          sent:
            0,

          failed:
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

    const campaignResults:
      Array<{
        id:
          string;

        status:
          string;

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

      try {
        console.log(
          "[CAMPAIGN CRON] Processing campaign:",
          {
            id:
              campaign.id,

            title:
              campaign.title,

            status:
              campaign.status,

            scheduledFor:
              campaign.scheduled_for,
          }
        );

        // ====================================================
        // CLAIM CAMPAIGN
        //
        // We only update it if it is still queued/scheduled.
        // This reduces the chance of duplicate sends.
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
         * Another worker may have claimed it first.
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
        // VALIDATE AUDIENCE
        // ====================================================

        if (
          !campaign.list_id
        ) {
          throw new Error(
            "Campaign has no subscriber list."
          );
        }

        // ====================================================
        // GET SUBSCRIBERS
        // ====================================================

        const {
          data:
            subscribers,

          error:
            subscriberError,
        } =
          await supabaseAdmin
            .from(
              "subscribers"
            )
            .select(
              "email"
            )
            .eq(
              "list_id",
              campaign.list_id
            )
            .eq(
              "is_subscribed",
              true
            );

        if (
          subscriberError
        ) {
          throw new Error(
            `Could not load subscribers: ${subscriberError.message}`
          );
        }

        // ====================================================
        // NO SUBSCRIBERS
        // ====================================================

        if (
          !subscribers?.length
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

            status:
              "sent",

            sent:
              0,

            failed:
              0,
          });

          console.log(
            "[CAMPAIGN CRON] Campaign had no subscribers:",
            campaign.id
          );

          continue;
        }

        // ====================================================
        // SEND EMAILS
        // ====================================================

        for (
          const subscriber of
          subscribers
        ) {
          const email =
            String(
              subscriber.email ||
              ""
            ).trim();

          if (
            !email
          ) {
            failed +=
              1;

            continue;
          }

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

                  subject:
                    String(
                      campaign.subject ||
                      campaign.title ||
                      "Newsletter"
                    ),

                  /*
                   * Keep your campaign HTML intact.
                   *
                   * If campaign.content already contains the
                   * complete email design, do not wrap it in a
                   * second generic template.
                   */
                  html:
                    String(
                      campaign.content ||
                      ""
                    ),
                });

            if (
              resendError
            ) {
              failed +=
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

            if (
              !resendData?.id
            ) {
              failed +=
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

            sent +=
              1;

            totalEmailsSent +=
              1;

            console.log(
              "[CAMPAIGN CRON] Email sent:",
              {
                campaignId:
                  campaign.id,

                email,

                resendId:
                  resendData.id,
              }
            );
          } catch (
            sendError
          ) {
            failed +=
              1;

            console.error(
              "[CAMPAIGN CRON] Email failed:",
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
        // CAMPAIGN COMPLETED
        // ====================================================

        const sentAt =
          new Date()
            .toISOString();

        /*
         * We still consider the campaign sent if at least one
         * email succeeded.
         *
         * If every email failed, mark the campaign failed.
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

          status:
            finalStatus,

          sent,

          failed,
        });

        console.log(
          "[CAMPAIGN CRON] Campaign completed:",
          {
            id:
              campaign.id,

            finalStatus,

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
        // MARK FAILED
        // ====================================================

        await supabaseAdmin
          .from(
            "campaigns"
          )
          .update({
            status:
              "failed",

            total_sent:
              sent,
          })
          .eq(
            "id",
            campaign.id
          );

        campaignResults.push({
          id:
            campaign.id,

          status:
            "failed",

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
      }
    );

    return NextResponse.json(
      {
        success:
          true,

        processed,

        sent:
          successfulCampaigns,

        failed:
          failedCampaigns,

        totalEmailsSent,

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