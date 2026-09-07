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

type RecipientSource =
  | "profile"
  | "manual";

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
  resend_id: string | null;
  last_error: string | null;
  sent_at: string | null;
};

type SentRecipient = {
  id: string;
  email: string;
  source: RecipientSource;
  resendId: string | null;
};

type FailedRecipient = {
  id: string;
  email: string;
  source: RecipientSource;
  error: string;
};

type SkippedRecipient = {
  id: string;
  email: string;
  source: RecipientSource;
  reason: string;
};

type ProcessCampaignArgs = {
  campaignId: string;
  subscribers: CampaignRecipient[];
  campaign: any;
  resend: Resend;
  fromEmail: string;
  trackingBaseUrl: string;
  jobId?: string | null;
};

type ProcessCampaignResult = {
  total: number;

  attemptedCount: number;

  newlySentCount: number;

  totalSentCount: number;

  failedCount: number;

  skippedCount: number;

  remainingCount: number;

  status:
    | "sent"
    | "failed";

  campaign: any;

  sentRecipients: SentRecipient[];

  failedRecipients: FailedRecipient[];

  skippedRecipients: SkippedRecipient[];
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

// ==================================================

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

// ==================================================

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

// ==================================================

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

// ==================================================
// UPDATE CAMPAIGN JOB
// ==================================================

async function updateCampaignJob(
  jobId: string | null | undefined,
  status: string
) {
  if (
    !jobId
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_jobs"
      )
      .update({
        status,
      })
      .eq(
        "id",
        jobId
      );

  if (
    error
  ) {
    console.warn(
      "⚠️ Campaign job status update failed:",
      {
        jobId,
        status,

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
  }
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

  if (
    !campaign
      ?.organisation_id
  ) {
    throw new Error(
      "Campaign is missing organisation_id"
    );
  }

  console.log(
    "=================================================="
  );

  console.log(
    "LOADING CAMPAIGN RECIPIENTS"
  );

  console.log(
    "=================================================="
  );

  console.log({
    campaignId:
      campaign.id,

    campaignTitle:
      campaign.title,

    listId:
      campaign.list_id,

    organisationId:
      campaign.organisation_id,
  });

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
      "❌ Profile subscriber lookup failed:",
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

  console.log(
    "Profile list rows returned:",
    profileLinks?.length ||
      0
  );

  // ==================================================
  // MANUAL EMAIL SUBSCRIBERS
  // ==================================================
  //
  // IMPORTANT:
  //
  // We allow BOTH:
  //
  // organisation_id = campaign organisation
  //
  // OR
  //
  // organisation_id IS NULL
  //
  // This fixes the imported-recipient issue without allowing
  // rows belonging to another organisation to be included.
  // ==================================================

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
        "id,email,list_id,organisation_id"
      )
      .eq(
        "list_id",
        campaign.list_id
      )
      .or(
        `organisation_id.eq.${campaign.organisation_id},organisation_id.is.null`
      );

  if (
    manualError
  ) {
    console.error(
      "❌ Manual subscriber lookup failed:",
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

  console.log(
    "Manual list rows returned:",
    manualRows?.length ||
      0
  );

  // ==================================================
  // ORGANISATION BREAKDOWN
  // ==================================================

  const organisationBreakdown =
    new Map<
      string,
      number
    >();

  for (
    const row of
      manualRows ||
      []
  ) {
    const key =
      row.organisation_id ||
      "NULL";

    organisationBreakdown.set(
      key,
      (
        organisationBreakdown.get(
          key
        ) ||
        0
      ) + 1
    );
  }

  console.log(
    "Manual recipient organisation breakdown:",
    Object.fromEntries(
      organisationBreakdown.entries()
    )
  );

  // ==================================================
  // PROFILE RECIPIENTS
  // ==================================================

  const profileRecipients:
    CampaignRecipient[] =
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
        ? row
            .profiles[0]
        : row.profiles;

    if (
      !profile
    ) {
      console.warn(
        "⚠️ Profile relation missing:",
        row.profile_id
      );

      continue;
    }

    if (
      profile.is_subscribed ===
      false
    ) {
      console.log(
        "⏭️ Skipping unsubscribed profile:",
        profile.email
      );

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
      console.warn(
        "⚠️ Invalid profile email:",
        profile.email
      );

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
  // MANUAL RECIPIENTS
  // ==================================================

  const manualRecipients:
    CampaignRecipient[] =
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
      console.warn(
        "⚠️ Invalid manual email:",
        {
          id:
            row.id,

          email:
            row.email,
        }
      );

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

  const combined = [
    ...profileRecipients,
    ...manualRecipients,
  ];

  const seen =
    new Set<string>();

  const unique:
    CampaignRecipient[] =
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
      console.log(
        "⏭️ Duplicate email removed:",
        recipient.email
      );

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
    "=================================================="
  );

  console.log(
    "CAMPAIGN RECIPIENT SUMMARY"
  );

  console.log(
    "=================================================="
  );

  console.log({
    profileRows:
      profileLinks?.length ||
      0,

    profileRecipients:
      profileRecipients.length,

    manualRows:
      manualRows?.length ||
      0,

    manualRecipients:
      manualRecipients.length,

    combinedBeforeDedupe:
      combined.length,

    uniqueRecipients:
      unique.length,
  });

  console.log(
    "FINAL RECIPIENT LIST:"
  );

  unique.forEach(
    (
      recipient,
      index
    ) => {
      console.log(
        `${index + 1}. ${recipient.email} [${recipient.source}]`
      );
    }
  );

  return unique;
}

// ==================================================
// LOAD EXISTING DELIVERIES
// ==================================================

async function loadExistingDeliveries(
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
      .select(`
        id,
        email,
        status,
        attempts,
        resend_id,
        last_error,
        sent_at
      `)
      .eq(
        "campaign_id",
        campaignId
      );

  if (
    error
  ) {
    console.error(
      "❌ Existing delivery lookup failed:",
      error
    );

    throw new Error(
      `Failed to load campaign deliveries: ${error.message}`
    );
  }

  const map =
    new Map<
      string,
      ExistingDelivery
    >();

  for (
    const delivery of
      data ||
      []
  ) {
    map.set(
      cleanEmail(
        delivery.email
      ),
      delivery as ExistingDelivery
    );
  }

  console.log(
    "Existing campaign delivery records:",
    map.size
  );

  return map;
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
        `
          id,
          status,
          sent_at,
          sent_count,
          open_count,
          click_count
        `
      )
      .single();

  if (
    error
  ) {
    console.error(
      "❌ Campaign status update failed:",
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
// PREPARE DELIVERY ATTEMPT
// ==================================================

async function prepareDeliveryAttempt({
  campaignId,
  organisationId,
  subscriber,
  existingDelivery,
}: {
  campaignId: string;
  organisationId: string;
  subscriber: CampaignRecipient;
  existingDelivery?: ExistingDelivery;
}) {
  const now =
    new Date()
      .toISOString();

  const attempts =
    Number(
      existingDelivery
        ?.attempts ||
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
      .upsert(
        {
          campaign_id:
            campaignId,

          organisation_id:
            organisationId,

          email:
            subscriber.email,

          status:
            "pending",

          attempts,

          last_error:
            null,

          updated_at:
            now,
        },
        {
          onConflict:
            "campaign_id,email",
        }
      )
      .select(
        `
          id,
          email,
          status,
          attempts,
          resend_id,
          last_error,
          sent_at
        `
      )
      .single();

  if (
    error
  ) {
    throw new Error(
      `Could not create delivery record: ${error.message}`
    );
  }

  return data;
}

// ==================================================
// MARK DELIVERY SENT
// ==================================================

async function markDeliverySent({
  campaignId,
  email,
  resendId,
}: {
  campaignId: string;
  email: string;
  resendId:
    | string
    | null;
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
        "campaign_id",
        campaignId
      )
      .eq(
        "email",
        email
      );

  if (
    error
  ) {
    throw new Error(
      `Email was accepted by Resend but delivery record could not be marked sent: ${error.message}`
    );
  }
}

// ==================================================
// MARK DELIVERY FAILED
// ==================================================

async function markDeliveryFailed({
  campaignId,
  email,
  errorMessage,
}: {
  campaignId: string;
  email: string;
  errorMessage: string;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "campaign_deliveries"
      )
      .update({
        status:
          "failed",

        last_error:
          errorMessage,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "campaign_id",
        campaignId
      )
      .eq(
        "email",
        email
      );

  if (
    error
  ) {
    console.error(
      "❌ Could not mark delivery failed:",
      {
        campaignId,
        email,

        databaseError:
          error.message,

        originalError:
          errorMessage,
      }
    );
  }
}

// ==================================================
// COUNT TOTAL SENT DELIVERIES
// ==================================================

async function countSentDeliveries(
  campaignId: string
) {
  const {
    count,
    error,
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

  if (
    error
  ) {
    throw new Error(
      `Could not count sent deliveries: ${error.message}`
    );
  }

  return count || 0;
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
  jobId,
}: ProcessCampaignArgs): Promise<ProcessCampaignResult> {
  if (
    !campaign
      .organisation_id
  ) {
    throw new Error(
      "Campaign is missing organisation_id"
    );
  }

  const batchSize =
    50;

  const sentRecipients:
    SentRecipient[] =
    [];

  const failedRecipients:
    FailedRecipient[] =
    [];

  const skippedRecipients:
    SkippedRecipient[] =
    [];

  // ==================================================
  // EXISTING DELIVERIES
  // ==================================================

  const existingDeliveries =
    await loadExistingDeliveries(
      campaignId
    );

  // ==================================================
  // SKIP ALREADY-SENT RECIPIENTS
  // ==================================================

  const sendCandidates:
    CampaignRecipient[] =
    [];

  for (
    const subscriber of
      subscribers
  ) {
    const existing =
      existingDeliveries.get(
        subscriber.email
      );

    if (
      existing
        ?.status ===
      "sent"
    ) {
      skippedRecipients.push({
        id:
          subscriber.id,

        email:
          subscriber.email,

        source:
          subscriber.source,

        reason:
          "Already sent",
      });

      console.log(
        `⏭️ ALREADY SENT — SKIPPING: ${subscriber.email}`
      );

      continue;
    }

    sendCandidates.push(
      subscriber
    );
  }

  console.log(
    "=================================================="
  );

  console.log(
    "SAFE SEND SUMMARY"
  );

  console.log(
    "=================================================="
  );

  console.log({
    totalAudience:
      subscribers.length,

    alreadySent:
      skippedRecipients.length,

    remainingToAttempt:
      sendCandidates.length,
  });

  // ==================================================
  // NOTHING LEFT TO SEND
  // ==================================================

  if (
    sendCandidates.length ===
    0
  ) {
    const totalSent =
      await countSentDeliveries(
        campaignId
      );

    const updatedCampaign =
      await markCampaignStatus(
        campaignId,
        {
          status:
            "sent",

          sent_count:
            totalSent,

          sent_at:
            campaign.sent_at ||
            new Date()
              .toISOString(),
        }
      );

    await updateCampaignJob(
      jobId,
      "completed"
    );

    return {
      total:
        subscribers.length,

      attemptedCount:
        0,

      newlySentCount:
        0,

      totalSentCount:
        totalSent,

      failedCount:
        0,

      skippedCount:
        skippedRecipients.length,

      remainingCount:
        0,

      status:
        "sent",

      campaign:
        updatedCampaign,

      sentRecipients,

      failedRecipients,

      skippedRecipients,
    };
  }

  // ==================================================
  // MARK PROCESSING
  // ==================================================

  await markCampaignStatus(
    campaignId,
    {
      status:
        "processing",
    }
  );

  await updateCampaignJob(
    jobId,
    "processing"
  );

  console.log(
    "=================================================="
  );

  console.log(
    "STARTING CAMPAIGN SEND"
  );

  console.log(
    "=================================================="
  );

  console.log({
    campaignId,

    totalAudience:
      subscribers.length,

    sendCandidates:
      sendCandidates.length,

    skippedAlreadySent:
      skippedRecipients.length,

    batchSize,

    totalBatches:
      Math.ceil(
        sendCandidates.length /
          batchSize
      ),

    fromEmail,

    replyTo:
      campaign.reply_to ||
      fromEmail,
  });

  // ==================================================
  // SEND IN BATCHES
  // ==================================================

  for (
    let i = 0;
    i <
    sendCandidates.length;
    i += batchSize
  ) {
    const batch =
      sendCandidates.slice(
        i,
        i +
          batchSize
      );

    const batchNumber =
      Math.floor(
        i / batchSize
      ) + 1;

    const totalBatches =
      Math.ceil(
        sendCandidates.length /
          batchSize
      );

    console.log(
      "=================================================="
    );

    console.log(
      `SENDING BATCH ${batchNumber}/${totalBatches}`
    );

    console.log(
      "=================================================="
    );

    const results =
      await Promise.allSettled(
        batch.map(
          async (
            subscriber
          ) => {
            const existing =
              existingDeliveries.get(
                subscriber.email
              );

            console.log(
              `📤 ATTEMPTING: ${subscriber.email}`
            );

            // ==================================================
            // CREATE / UPDATE DELIVERY RECORD BEFORE SEND
            // ==================================================

            try {
              const prepared =
                await prepareDeliveryAttempt({
                  campaignId,

                  organisationId:
                    campaign.organisation_id,

                  subscriber,

                  existingDelivery:
                    existing,
                });

              console.log(
                `📝 DELIVERY ATTEMPT ${prepared.attempts}: ${subscriber.email}`
              );
            } catch (
              error: unknown
            ) {
              const message =
                getErrorMessage(
                  error
                );

              console.error(
                `❌ DELIVERY TRACKING PREPARATION FAILED: ${subscriber.email}`,
                message
              );

              throw new Error(
                message
              );
            }

            // ==================================================
            // TRACKING URL
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
            // SEND
            // ==================================================

            try {
              const {
                data,
                error,
              } =
                await resend
                  .emails
                  .send({
                    from:
                      fromEmail,

                    to:
                      subscriber.email,

                    subject:
                      campaign.subject ||
                      campaign.title ||
                      "Campaign",

                    html,

                    replyTo:
                      campaign.reply_to ||
                      fromEmail,
                  });

              if (
                error
              ) {
                throw new Error(
                  error.message ||
                    `Failed to send to ${subscriber.email}`
                );
              }

              const resendId =
                data?.id ||
                null;

              // ==================================================
              // MARK SENT
              // ==================================================

              await markDeliverySent({
                campaignId,

                email:
                  subscriber.email,

                resendId,
              });

              console.log(
                `✅ SENT: ${subscriber.email}`
              );

              console.log({
                campaignId,

                email:
                  subscriber.email,

                source:
                  subscriber.source,

                resendId,
              });

              return {
                id:
                  subscriber.id,

                email:
                  subscriber.email,

                source:
                  subscriber.source,

                resendId,
              } satisfies SentRecipient;
            } catch (
              error: unknown
            ) {
              const message =
                getErrorMessage(
                  error
                );

              await markDeliveryFailed({
                campaignId,

                email:
                  subscriber.email,

                errorMessage:
                  message,
              });

              console.error(
                `❌ FAILED: ${subscriber.email}`
              );

              console.error({
                campaignId,

                email:
                  subscriber.email,

                source:
                  subscriber.source,

                error:
                  message,
              });

              throw new Error(
                message
              );
            }
          }
        )
      );

    // ==================================================
    // PROCESS BATCH RESULTS
    // ==================================================

    for (
      let resultIndex = 0;
      resultIndex <
      results.length;
      resultIndex++
    ) {
      const result =
        results[
          resultIndex
        ];

      const subscriber =
        batch[
          resultIndex
        ];

      if (
        result.status ===
        "fulfilled"
      ) {
        sentRecipients.push(
          result.value
        );

        continue;
      }

      const errorMessage =
        getErrorMessage(
          result.reason
        );

      failedRecipients.push({
        id:
          subscriber.id,

        email:
          subscriber.email,

        source:
          subscriber.source,

        error:
          errorMessage,
      });
    }

    console.log(
      `BATCH ${batchNumber} COMPLETE`
    );

    console.log({
      batchSize:
        batch.length,

      successfulThisRun:
        sentRecipients.length,

      failedThisRun:
        failedRecipients.length,

      remaining:
        sendCandidates.length -
        (
          sentRecipients.length +
          failedRecipients.length
        ),
    });
  }

  // ==================================================
  // FINAL DATABASE COUNTS
  // ==================================================

  const totalSentCount =
    await countSentDeliveries(
      campaignId
    );

  const remainingCount =
    Math.max(
      subscribers.length -
        totalSentCount,
      0
    );

  // ==================================================
  // FINAL CAMPAIGN STATUS
  // ==================================================

  const finalStatus:
    | "sent"
    | "failed" =
    totalSentCount > 0
      ? "sent"
      : "failed";

  /*
   * Do NOT reset open_count / click_count.
   *
   * Some email clients open tracking pixels immediately.
   */

  const finalPayload = {
    status:
      finalStatus,

    sent_count:
      totalSentCount,

    ...(totalSentCount >
    0
      ? {
          sent_at:
            campaign.sent_at ||
            new Date()
              .toISOString(),
        }
      : {}),
  };

  const updatedCampaign =
    await markCampaignStatus(
      campaignId,
      finalPayload
    );

  // ==================================================
  // JOB FINAL STATUS
  // ==================================================

  await updateCampaignJob(
    jobId,
    failedRecipients.length >
      0
      ? "failed"
      : "completed"
  );

  // ==================================================
  // FINAL LOGGING
  // ==================================================

  console.log(
    "=================================================="
  );

  console.log(
    "CAMPAIGN SEND COMPLETE"
  );

  console.log(
    "=================================================="
  );

  console.log({
    campaignId,

    audience:
      subscribers.length,

    attempted:
      sendCandidates.length,

    newlySent:
      sentRecipients.length,

    alreadySent:
      skippedRecipients.length,

    failed:
      failedRecipients.length,

    totalSent:
      totalSentCount,

    remaining:
      remainingCount,

    status:
      updatedCampaign.status,

    sentAt:
      updatedCampaign.sent_at,

    openCount:
      updatedCampaign.open_count,

    clickCount:
      updatedCampaign.click_count,
  });

  // ==================================================
  // SUCCESS LIST
  // ==================================================

  console.log(
    "=================================================="
  );

  console.log(
    `✅ NEWLY SENT: ${sentRecipients.length}`
  );

  console.log(
    "=================================================="
  );

  sentRecipients.forEach(
    (
      recipient,
      index
    ) => {
      console.log(
        `${index + 1}. ${recipient.email}`
      );

      console.log({
        source:
          recipient.source,

        resendId:
          recipient.resendId,
      });
    }
  );

  // ==================================================
  // SKIPPED LIST
  // ==================================================

  if (
    skippedRecipients.length >
    0
  ) {
    console.log(
      "=================================================="
    );

    console.log(
      `⏭️ ALREADY SENT / SKIPPED: ${skippedRecipients.length}`
    );

    console.log(
      "=================================================="
    );

    skippedRecipients.forEach(
      (
        recipient,
        index
      ) => {
        console.log(
          `${index + 1}. ${recipient.email} — ${recipient.reason}`
        );
      }
    );
  }

  // ==================================================
  // FAILED LIST
  // ==================================================

  if (
    failedRecipients.length >
    0
  ) {
    console.log(
      "=================================================="
    );

    console.log(
      `❌ FAILED: ${failedRecipients.length}`
    );

    console.log(
      "=================================================="
    );

    failedRecipients.forEach(
      (
        recipient,
        index
      ) => {
        console.error(
          `${index + 1}. ${recipient.email}`
        );

        console.error({
          source:
            recipient.source,

          error:
            recipient.error,
        });
      }
    );
  } else {
    console.log(
      "✅ No recipient failures."
    );
  }

  return {
    total:
      subscribers.length,

    attemptedCount:
      sendCandidates.length,

    newlySentCount:
      sentRecipients.length,

    totalSentCount,

    failedCount:
      failedRecipients.length,

    skippedCount:
      skippedRecipients.length,

    remainingCount,

    status:
      finalStatus,

    campaign:
      updatedCampaign,

    sentRecipients,

    failedRecipients,

    skippedRecipients,
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

  let jobId:
    | string
    | null =
    null;

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
        "❌ Missing RESEND configuration:",
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
    // REQUEST
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

    console.log(
      "=================================================="
    );

    console.log(
      "CAMPAIGN SEND REQUEST RECEIVED"
    );

    console.log(
      "=================================================="
    );

    console.log({
      campaignId,
    });

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
        .select(
          "*"
        )
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
        "❌ Campaign lookup failed:",
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
    // REQUIRED CAMPAIGN DATA
    // ==================================================

    if (
      !campaign
        .organisation_id
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign is missing organisation_id",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !campaign.list_id
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign is missing list_id",
        },
        {
          status:
            400,
        }
      );
    }

    console.log(
      "Campaign loaded:",
      {
        id:
          campaign.id,

        title:
          campaign.title,

        subject:
          campaign.subject,

        listId:
          campaign.list_id,

        organisationId:
          campaign.organisation_id,

        status:
          campaign.status,

        previousSentCount:
          campaign.sent_count,

        fromEmail,

        replyTo:
          campaign.reply_to ||
          fromEmail,
      }
    );

    // ==================================================
    // PREVENT PARALLEL SENDS
    // ==================================================

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
    // LOAD FULL AUDIENCE
    // ==================================================

    const subscribers =
      await loadCampaignRecipients(
        campaign
      );

    if (
      subscribers.length ===
      0
    ) {
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

    console.log(
      `✅ ${subscribers.length} unique recipients loaded.`
    );

    // ==================================================
    // CHECK SENT CAMPAIGN
    // ==================================================
    //
    // A campaign marked sent can still be retried ONLY if
    // campaign_deliveries tells us exactly who is still unsent.
    //
    // This allows safe retries without duplicate emails.
    // ==================================================

    if (
      campaign.status ===
      "sent"
    ) {
      const deliveries =
        await loadExistingDeliveries(
          campaignId
        );

      const sentEmails =
        new Set(
          Array.from(
            deliveries.values()
          )
            .filter(
              (
                delivery
              ) =>
                delivery.status ===
                "sent"
            )
            .map(
              (
                delivery
              ) =>
                delivery.email
            )
        );

      const remaining =
        subscribers.filter(
          (
            subscriber
          ) =>
            !sentEmails.has(
              subscriber.email
            )
        );

      // ==================================================
      // LEGACY SAFETY
      // ==================================================
      //
      // Campaign says it was previously sent but there are no
      // recipient-level delivery records.
      //
      // We cannot safely know who got it.
      // ==================================================

      if (
        deliveries.size ===
          0 &&
        Number(
          campaign.sent_count ||
            0
        ) > 0
      ) {
        return NextResponse.json(
          {
            error:
              "This campaign was sent before recipient-level delivery tracking was enabled. It cannot be safely retried because TOTS-OS cannot determine which recipients already received it.",

            sentCount:
              campaign.sent_count,

            campaignId,
          },
          {
            status:
              409,
          }
        );
      }

      // ==================================================
      // EVERYONE ALREADY SENT
      // ==================================================

      if (
        remaining.length ===
        0
      ) {
        return NextResponse.json(
          {
            error:
              "Campaign has already been sent to every recipient.",

            total:
              subscribers.length,

            sent:
              sentEmails.size,
          },
          {
            status:
              409,
          }
        );
      }

      console.log(
        "♻️ SAFE RETRY DETECTED:"
      );

      console.log({
        totalAudience:
          subscribers.length,

        alreadySent:
          sentEmails.size,

        remaining:
          remaining.length,
      });
    }

    // ==================================================
    // CREATE JOB
    // ==================================================

    const {
      data:
        job,

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
            new Date()
              .toISOString(),
        })
        .select(
          "id"
        )
        .maybeSingle();

    if (
      jobError
    ) {
      console.warn(
        "⚠️ Could not create campaign job:",
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
    } else {
      jobId =
        job?.id ||
        null;
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

        jobId,
      });

    emailSendingCompleted =
      true;

    // ==================================================
    // ALL FAILED
    // ==================================================

    if (
      result.totalSentCount ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Campaign failed to send to all recipients",

          ...result,
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
          result.failedCount >
          0
            ? "Campaign processed with some failed recipients"
            : result.skippedCount >
                0
              ? "Campaign retry completed successfully"
              : "Campaign sent successfully",

        total:
          result.total,

        attempted:
          result.attemptedCount,

        newlySent:
          result.newlySentCount,

        totalSent:
          result.totalSentCount,

        failed:
          result.failedCount,

        skipped:
          result.skippedCount,

        remaining:
          result.remainingCount,

        sentRecipients:
          result.sentRecipients,

        failedRecipients:
          result.failedRecipients,

        skippedRecipients:
          result.skippedRecipients,

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
      getErrorMessage(
        err
      );

    console.error(
      "=================================================="
    );

    console.error(
      "❌ CAMPAIGN SEND ERROR"
    );

    console.error(
      "=================================================="
    );

    console.error({
      campaignId,

      message,

      emailSendingStarted,

      emailSendingCompleted,

      error:
        err,
    });

    // ==================================================
    // UPDATE JOB
    // ==================================================

    await updateCampaignJob(
      jobId,
      "failed"
    );

    // ==================================================
    // SAFE CAMPAIGN FAILURE STATUS
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
            `
              id,
              status,
              sent_at,
              sent_count
            `
          )
          .eq(
            "id",
            campaignId
          )
          .maybeSingle();

      const alreadySent =
        Boolean(
          currentCampaign
            ?.sent_at
        ) ||
        Number(
          currentCampaign
            ?.sent_count ||
            0
        ) > 0;

      /*
       * Do not overwrite a campaign as failed when
       * some emails have already been delivered.
       */
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
            "❌ Failed to mark campaign failed:",
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