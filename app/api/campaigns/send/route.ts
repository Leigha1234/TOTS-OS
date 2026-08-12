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
): Promise<
  CampaignRecipient[]
> {
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
      profileError
    );

    throw new Error(
      "Failed to fetch profile subscribers"
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
      manualError
    );

    throw new Error(
      "Failed to fetch manual subscribers"
    );
  }

  // ==================================================
  // NORMALISE PROFILES
  // ==================================================

 const profileRecipients: CampaignRecipient[] = [];

for (const row of profileLinks || []) {
  const profile =
    Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

  if (!profile) {
    continue;
  }

  if (
    profile.is_subscribed === false
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
    id: String(
      profile.id ||
        row.profile_id
    ),

    email,

    source:
      "profile",
  });
}
  // ==================================================
  // NORMALISE MANUAL EMAILS
  // ==================================================

  const manualRecipients: CampaignRecipient[] =
    (
      manualRows ||
      []
    )
      .map(
        (
          row: any
        ) => {
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
            return null;
          }

          return {
            id:
              String(
                row.id
              ),

            email,

            source:
              "manual" as const,
          };
        }
      )
      .filter(
        (
          recipient
        ): recipient is CampaignRecipient =>
          Boolean(
            recipient
          )
      );

  // ==================================================
  // COMBINE + DEDUPE
  // ==================================================

  const combined = [
    ...profileRecipients,
    ...manualRecipients,
  ];

  const seen =
    new Set<string>();

  const unique =
    combined.filter(
      (
        recipient
      ) => {
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
// PROCESS CAMPAIGN
// ==================================================

async function processCampaign({
  campaignId,
  subscribers,
  campaign,
  resend,
  fromEmail,
  trackingBaseUrl,
}: ProcessCampaignArgs) {
  const batchSize =
    50;

  let sentCount =
    0;

  let failedCount =
    0;

  // ==================================================
  // MARK PROCESSING
  // ==================================================

  const {
    error:
      processingError,
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .update({
        status:
          "processing",
      })
      .eq(
        "id",
        campaignId
      );

  if (
    processingError
  ) {
    console.error(
      "Failed to mark campaign processing:",
      processingError
    );
  }

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

            const {
              data,
              error,
            } =
              await resend.emails.send(
                {
                  from:
                    fromEmail,

                  to:
                    subscriber.email,

                  subject:
                    campaign.subject ||
                    campaign.title ||
                    "Campaign",

                  html: `
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
                        "
                      />
                    </div>
                  `,
                }
              );

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

    results.forEach(
      (
        result
      ) => {
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
    );
  }

  // ==================================================
  // FINAL STATUS
  // ==================================================

  /*
   * If at least one email sends successfully,
   * treat the campaign as sent.
   *
   * If every email fails, mark the campaign failed.
   */
  const finalStatus =
    sentCount > 0
      ? "sent"
      : "failed";

  const {
    error:
      updateError,
  } =
    await supabaseAdmin
      .from(
        "campaigns"
      )
      .update({
        status:
          finalStatus,

        sent_at:
          sentCount > 0
            ? new Date().toISOString()
            : null,

        sent_count:
          sentCount,

        open_count:
          0,
      })
      .eq(
        "id",
        campaignId
      );

  if (
    updateError
  ) {
    console.error(
      "Failed to update campaign after send:",
      updateError
    );
  }

  return {
    sentCount,
    failedCount,
    total:
      subscribers.length,
    status:
      finalStatus,
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

  try {
    // ==================================================
    // ENV
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
    // BODY
    // ==================================================

    const body =
      await req.json();

    campaignId =
      body?.campaignId;

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
        campaignError
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
    // CHECK LIST
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
    // PREVENT DOUBLE SEND
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
    // LOAD BOTH RECIPIENT TYPES
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
        "No campaign recipients found",
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
       * A campaign job logging failure should
       * not prevent the actual campaign send.
       */
      console.warn(
        "Could not create campaign job:",
        jobError
      );
    }

    // ==================================================
    // SEND
    // ==================================================
    //
    // IMPORTANT:
    //
    // We AWAIT this.
    //
    // Your old version used:
    //
    // void processCampaign(...)
    //
    // and returned immediately.
    //
    // On Vercel/serverless environments,
    // work that continues after the response
    // is returned is not reliable.
    //
    // ==================================================

    const result =
      await processCampaign({
        campaignId,

        subscribers,

        campaign,

        resend,

        fromEmail,

        trackingBaseUrl,
      });

    // ==================================================
    // RESPONSE
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
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Campaign sent successfully",

        total:
          result.total,

        sent:
          result.sentCount,

        failed:
          result.failedCount,
      },
      {
        status:
          200,
      }
    );
  } catch (
    err: unknown
  ) {
    console.error(
      "Campaign send error:",
      err
    );

    if (
      campaignId
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
          failedUpdateError
        );
      }
    }

    const message =
      err instanceof
      Error
        ? err.message
        : "Campaign send failed";

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