import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

// ==================================================
// SUPABASE ADMIN
// ==================================================

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ==================================================
// TYPES
// ==================================================

type CampaignRecipient = {
  id: string;
  email: string;
  source: "profile" | "manual";
};

type ProcessCampaignArgs = {
  campaignId: string;
  subscribers: CampaignRecipient[];
  campaign: any;
  resend: Resend;
  fromEmail: string;
  trackingBaseUrl: string;
};

type ProcessCampaignResult = {
  sentCount: number;
  failedCount: number;
  total: number;
  status: "sent" | "failed";
  campaign: any;
};

// ==================================================
// HELPERS
// ==================================================

function cleanEmail(
  value: unknown
) {
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
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function escapeHtml(
  value: unknown
) {
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
) {
  const trimmed =
    value.trim();

  if (
    trimmed.startsWith(
      "http://"
    ) ||
    trimmed.startsWith(
      "https://"
    )
  ) {
    return trimmed.replace(
      /\/+$/,
      ""
    );
  }

  return `https://${trimmed.replace(
    /\/+$/,
    ""
  )}`;
}

// ==================================================
// LOAD RECIPIENTS
// ==================================================

async function loadCampaignRecipients(
  campaign: any
): Promise<CampaignRecipient[]> {
  if (
    !campaign?.list_id
  ) {
    return [];
  }

  // ==================================================
  // PROFILE SUBSCRIBERS
  // ==================================================

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
          name,
          full_name,
          is_subscribed
        )
      `)
      .eq(
        "list_id",
        campaign.list_id
      );

  if (
    profileError
  ) {
    console.error(
      "Profile subscriber lookup failed:",
      {
        message:
          profileError.message,

        details:
          profileError.details,

        hint:
          profileError.hint,

        code:
          profileError.code,
      }
    );

    throw new Error(
      `Failed to fetch profile subscribers: ${profileError.message}`
    );
  }

  // ==================================================
  // MANUAL EMAIL SUBSCRIBERS
  // ==================================================

  let manualQuery =
    supabaseAdmin
      .from(
        "campaign_list_emails"
      )
      .select(
        "id,email,list_id,organisation_id"
      )
      .eq(
        "list_id",
        campaign.list_id
      );

  if (
    campaign.organisation_id
  ) {
    manualQuery =
      manualQuery.eq(
        "organisation_id",
        campaign.organisation_id
      );
  }

  const {
    data:
      manualRows,
    error:
      manualError,
  } =
    await manualQuery;

  if (
    manualError
  ) {
    console.error(
      "Manual subscriber lookup failed:",
      {
        message:
          manualError.message,

        details:
          manualError.details,

        hint:
          manualError.hint,

        code:
          manualError.code,
      }
    );

    throw new Error(
      `Failed to fetch manual subscribers: ${manualError.message}`
    );
  }

  // ==================================================
  // NORMALISE PROFILE RECIPIENTS
  // ==================================================

  const profileRecipients: CampaignRecipient[] =
    [];

  for (
    const row of
      profileLinks ||
      []
  ) {
    const profile =
      Array.isArray(
        row.profiles
      )
        ? row.profiles[0]
        : row.profiles;

    if (
      !profile
    ) {
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
      )
    ) {
      continue;
    }

    profileRecipients.push({
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

  // ==================================================
  // NORMALISE MANUAL RECIPIENTS
  // ==================================================

  const manualRecipients: CampaignRecipient[] =
    [];

  for (
    const row of
      manualRows ||
      []
  ) {
    const email =
      cleanEmail(
        row.email
      );

    if (
      !email ||
      !isValidEmail(
        email
      )
    ) {
      continue;
    }

    manualRecipients.push({
      id:
        String(
          row.id
        ),

      email,

      source:
        "manual",
    });
  }

  // ==================================================
  // COMBINE + DEDUPE
  // ==================================================

  const combined: CampaignRecipient[] =
    [
      ...profileRecipients,
      ...manualRecipients,
    ];

  const seen =
    new Set<string>();

  const unique: CampaignRecipient[] =
    [];

  for (
    const recipient of
      combined
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

    unique.push(
      recipient
    );
  }

  console.log(
    "Campaign recipients loaded:",
    {
      campaignId:
        campaign.id,

      listId:
        campaign.list_id,

      profileRecipients:
        profileRecipients.length,

      manualRecipients:
        manualRecipients.length,

      uniqueRecipients:
        unique.length,
    }
  );

  return unique;
}

// ==================================================
// MARK CAMPAIGN STATUS
// ==================================================

async function markCampaignStatus(
  campaignId: string,
  payload: Record<
    string,
    unknown
  >
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .update(
        payload
      )
      .eq(
        "id",
        campaignId
      )
      .select(
        "id,status,sent_at,sent_count,open_count,click_count"
      )
      .single();

  if (
    error
  ) {
    console.error(
      "Campaign status update failed:",
      {
        campaignId,

        payload,

        message:
          error.message,

        details:
          error.details,

        hint:
          error.hint,

        code:
          error.code,
      }
    );

    throw new Error(
      `Campaign status update failed: ${error.message}`
    );
  }

  return data;
}

// ==================================================
// PROCESS CAMPAIGN
// ==================================================

async function processCampaign({
  campaignId,
  subscribers,
  campaign,
  resend,
  fromEmail,
  trackingBaseUrl,
}: ProcessCampaignArgs): Promise<ProcessCampaignResult> {
  const batchSize =
    50;

  let sentCount =
    0;

  let failedCount =
    0;

  // ==================================================
  // MARK PROCESSING
  // ==================================================

  const processingCampaign =
    await markCampaignStatus(
      campaignId,
      {
        status:
          "processing",
      }
    );

  console.log(
    "Campaign marked processing:",
    processingCampaign
  );

  // ==================================================
  // SEND IN BATCHES
  // ==================================================

  for (
    let i = 0;
    i <
    subscribers.length;
    i += batchSize
  ) {
    const batch =
      subscribers.slice(
        i,
        i +
          batchSize
      );

    const results =
      await Promise.allSettled(
        batch.map(
          async (
            subscriber
          ) => {
            // ==================================================
            // OPEN TRACKING URL
            // ==================================================

            const trackingUrl =
              `${trackingBaseUrl}/api/campaigns/open` +
              `?campaignId=${encodeURIComponent(
                campaignId
              )}` +
              `&profileId=${encodeURIComponent(
                subscriber.id
              )}` +
              `&source=${encodeURIComponent(
                subscriber.source
              )}`;

            // ==================================================
            // EMAIL HTML
            // ==================================================

            const html = `
              <div
                style="
                  font-family:Arial,Helvetica,sans-serif;
                  margin:0;
                  padding:0;
                  line-height:1.6;
                  color:#292524;
                "
              >
                ${
                  campaign.preview_text
                    ? `
                      <div
                        style="
                          display:none;
                          max-height:0;
                          overflow:hidden;
                          opacity:0;
                          color:transparent;
                        "
                      >
                        ${escapeHtml(
                          campaign.preview_text
                        )}
                      </div>
                    `
                    : ""
                }

                <div>
                  ${
                    campaign.content ||
                    ""
                  }
                </div>

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
                    overflow:hidden;
                  "
                />
              </div>
            `;

            // ==================================================
            // SEND WITH RESEND
            // ==================================================

            const {
              data,
              error,
            } =
              await resend.emails.send({
                from:
                  fromEmail,

                to:
                  subscriber.email,

                subject:
                  campaign.subject ||
                  campaign.title ||
                  "Campaign",

                html,

                ...(campaign.reply_to
                  ? {
                      replyTo:
                        campaign.reply_to,
                    }
                  : {}),
              });

            if (
              error
            ) {
              console.error(
                `Resend failed for ${subscriber.email}:`,
                error
              );

              throw new Error(
                error.message ||
                  `Failed to send to ${subscriber.email}`
              );
            }

            console.log(
              "Campaign email accepted by Resend:",
              {
                campaignId,

                email:
                  subscriber.email,

                source:
                  subscriber.source,

                resendId:
                  data?.id,
              }
            );

            return {
              email:
                subscriber.email,

              resendId:
                data?.id,

              source:
                subscriber.source,
            };
          }
        )
      );

    // ==================================================
    // COUNT RESULTS
    // ==================================================

    for (
      const result of
        results
    ) {
      if (
        result.status ===
        "fulfilled"
      ) {
        sentCount +=
          1;
      } else {
        failedCount +=
          1;

        console.error(
          "Individual campaign email failed:",
          result.reason
        );
      }
    }
  }

  // ==================================================
  // FINAL STATUS
  // ==================================================

  const finalStatus:
    | "sent"
    | "failed" =
    sentCount > 0
      ? "sent"
      : "failed";

  const sentAt =
    sentCount > 0
      ? new Date().toISOString()
      : null;

  /*
   * IMPORTANT:
   *
   * DO NOT reset open_count or click_count here.
   *
   * Email clients can request the tracking pixel almost
   * immediately after delivery. If an open has already
   * been recorded and we subsequently write open_count: 0,
   * we erase that analytics data.
   */

  const finalPayload = {
    status:
      finalStatus,

    sent_at:
      sentAt,

    sent_count:
      sentCount,
  };

  const updatedCampaign =
    await markCampaignStatus(
      campaignId,
      finalPayload
    );

  console.log(
    "Campaign successfully finalised:",
    {
      campaignId,

      status:
        updatedCampaign.status,

      sentAt:
        updatedCampaign.sent_at,

      sentCount:
        updatedCampaign.sent_count,

      openCount:
        updatedCampaign.open_count,

      clickCount:
        updatedCampaign.click_count,

      failedCount,
    }
  );

  // ==================================================
  // VERIFY FINAL STATUS
  // ==================================================

  if (
    sentCount > 0 &&
    updatedCampaign.status !==
      "sent"
  ) {
    throw new Error(
      `Campaign emails were sent but campaign status is "${updatedCampaign.status}" instead of "sent".`
    );
  }

  return {
    sentCount,

    failedCount,

    total:
      subscribers.length,

    status:
      finalStatus,

    campaign:
      updatedCampaign,
  };
}

// ==================================================
// POST
// ==================================================

export async function POST(
  req: Request
) {
  let campaignId:
    | string
    | undefined;

  /*
   * Tracks whether sending itself completed.
   *
   * This matters because if email sending succeeds but
   * the final status write fails, blindly marking the
   * campaign "failed" would imply the email was not sent.
   */
  let emailSendingStarted =
    false;

  let emailSendingCompleted =
    false;

  try {
    // ==================================================
    // ENVIRONMENT
    // ==================================================

    const resendKey =
      process.env
        .RESEND_API_KEY;

    const fromEmail =
      process.env
        .RESEND_FROM_EMAIL;

    const rawTrackingBaseUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      process.env
        .NEXT_PUBLIC_APP_URL ||
      process.env
        .VERCEL_PROJECT_PRODUCTION_URL ||
      "https://www.tots-os.co.uk";

    if (
      !resendKey ||
      !fromEmail
    ) {
      console.error(
        "Missing RESEND configuration",
        {
          hasResendKey:
            Boolean(
              resendKey
            ),

          hasFromEmail:
            Boolean(
              fromEmail
            ),
        }
      );

      return NextResponse.json(
        {
          error:
            "Email service not configured",
        },
        {
          status:
            500,
        }
      );
    }

    const trackingBaseUrl =
      normaliseBaseUrl(
        rawTrackingBaseUrl
      );

    const resend =
      new Resend(
        resendKey
      );

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body =
      await req.json();

    campaignId =
      typeof body?.campaignId ===
      "string"
        ? body.campaignId
        : undefined;

    if (
      !campaignId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing campaignId",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // FETCH CAMPAIGN
    // ==================================================

    const {
      data:
        campaign,
      error:
        campaignError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .select("*")
        .eq(
          "id",
          campaignId
        )
        .single();

    if (
      campaignError ||
      !campaign
    ) {
      console.error(
        "Campaign lookup failed:",
        {
          campaignId,

          message:
            campaignError
              ?.message,

          details:
            campaignError
              ?.details,

          hint:
            campaignError
              ?.hint,

          code:
            campaignError
              ?.code,
        }
      );

      return NextResponse.json(
        {
          error:
            "Campaign not found",
        },
        {
          status:
            404,
        }
      );
    }

    // ==================================================
    // VALIDATE LIST
    // ==================================================

    if (
      !campaign.list_id
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign missing list_id",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // PREVENT DUPLICATE SEND
    // ==================================================

    if (
      campaign.status ===
      "sent"
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign has already been sent",
        },
        {
          status:
            409,
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
          error:
            "Campaign is already being sent",
        },
        {
          status:
            409,
        }
      );
    }

    // ==================================================
    // LOAD RECIPIENTS
    // ==================================================

    const subscribers =
      await loadCampaignRecipients(
        campaign
      );

    if (
      subscribers.length ===
      0
    ) {
      console.error(
        "No campaign recipients found:",
        {
          campaignId,

          listId:
            campaign.list_id,

          organisationId:
            campaign.organisation_id,
        }
      );

      return NextResponse.json(
        {
          error:
            "No recipients found in this campaign list",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // OPTIONAL JOB RECORD
    // ==================================================

    const {
      error:
        jobError,
    } =
      await supabaseAdmin
        .from(
          "campaign_jobs"
        )
        .insert({
          campaign_id:
            campaignId,

          status:
            "queued",

          created_at:
            new Date().toISOString(),
        });

    if (
      jobError
    ) {
      /*
       * We don't block sending just because the optional
       * job record could not be created.
       */
      console.warn(
        "Could not create campaign job:",
        {
          message:
            jobError.message,

          details:
            jobError.details,

          hint:
            jobError.hint,

          code:
            jobError.code,
        }
      );
    }

    // ==================================================
    // SEND
    // ==================================================

    emailSendingStarted =
      true;

    const result =
      await processCampaign({
        campaignId,

        subscribers,

        campaign,

        resend,

        fromEmail,

        trackingBaseUrl,
      });

    emailSendingCompleted =
      true;

    // ==================================================
    // NO EMAILS SUCCEEDED
    // ==================================================

    if (
      result.sentCount ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign failed to send to all recipients",

          total:
            result.total,

          sent:
            result.sentCount,

          failed:
            result.failedCount,

          status:
            result.status,

          campaign:
            result.campaign,
        },
        {
          status:
            500,
        }
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          result.failedCount > 0
            ? "Campaign sent with some failed recipients"
            : "Campaign sent successfully",

        total:
          result.total,

        sent:
          result.sentCount,

        failed:
          result.failedCount,

        status:
          result.campaign
            ?.status,

        sentAt:
          result.campaign
            ?.sent_at,

        sentCount:
          result.campaign
            ?.sent_count,

        openCount:
          result.campaign
            ?.open_count,

        clickCount:
          result.campaign
            ?.click_count,

        campaign:
          result.campaign,
      },
      {
        status:
          200,
      }
    );
  } catch (
    err: unknown
  ) {
    const message =
      err instanceof
      Error
        ? err.message
        : "Campaign send failed";

    console.error(
      "Campaign send error:",
      {
        campaignId,

        message,

        emailSendingStarted,

        emailSendingCompleted,

        error:
          err,
      }
    );

    // ==================================================
    // MARK FAILED ONLY WHEN APPROPRIATE
    // ==================================================

    if (
      campaignId &&
      !emailSendingCompleted
    ) {
      const {
        data:
          currentCampaign,
      } =
        await supabaseAdmin
          .from(
            "campaigns"
          )
          .select(
            "id,status,sent_at,sent_count"
          )
          .eq(
            "id",
            campaignId
          )
          .maybeSingle();

      /*
       * If sent_at or sent_count already proves that delivery
       * occurred, do NOT overwrite the row with "failed".
       */
      const alreadySent =
        Boolean(
          currentCampaign
            ?.sent_at
        ) ||
        Number(
          currentCampaign
            ?.sent_count ||
            0
        ) > 0 ||
        currentCampaign
          ?.status ===
          "sent";

      if (
        !alreadySent
      ) {
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
            })
            .eq(
              "id",
              campaignId
            );

        if (
          failedUpdateError
        ) {
          console.error(
            "Failed to mark campaign failed:",
            {
              campaignId,

              message:
                failedUpdateError.message,

              details:
                failedUpdateError.details,

              hint:
                failedUpdateError.hint,

              code:
                failedUpdateError.code,
            }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error:
          message,
      },
      {
        status:
          500,
      }
    );
  }
}