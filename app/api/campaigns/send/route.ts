import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
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

// ==================================================
// TYPES
// ==================================================

type RecipientSource = "profile" | "manual";

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

function cleanEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

// ==================================================
// LOAD CAMPAIGN RECIPIENTS
// ==================================================

async function loadCampaignRecipients(
  campaign: any
): Promise<CampaignRecipient[]> {
  if (!campaign.list_id) {
    return [];
  }

  if (!campaign.organisation_id) {
    throw new Error("Campaign missing organisation_id");
  }

  const recipients: CampaignRecipient[] = [];

  // ==================================================
  // PROFILE RECIPIENTS
  // ==================================================

  const {
    data: profileLinks,
    error: profileError,
  } = await supabaseAdmin
    .from("profile_subscriber_lists")
    .select(`
      profile_id,
      profiles (
        id,
        email,
        is_subscribed
      )
    `)
    .eq("list_id", campaign.list_id);

  if (profileError) {
    throw new Error(
      `Failed to load profile recipients: ${profileError.message}`
    );
  }

  for (const row of profileLinks || []) {
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

    if (!profile) {
      continue;
    }

    if (profile.is_subscribed === false) {
      continue;
    }

    const email = cleanEmail(profile.email);

    if (!email || !isValidEmail(email)) {
      continue;
    }

    recipients.push({
      id: String(profile.id || row.profile_id),
      email,
      source: "profile",
    });
  }

  // ==================================================
  // MANUAL RECIPIENTS
  // ==================================================

  const {
    data: manualRows,
    error: manualError,
  } = await supabaseAdmin
    .from("campaign_list_emails")
    .select("id,email,organisation_id")
    .eq("list_id", campaign.list_id)
    .eq("organisation_id", campaign.organisation_id);

  if (manualError) {
    throw new Error(
      `Failed to load manual recipients: ${manualError.message}`
    );
  }

  for (const row of manualRows || []) {
    const email = cleanEmail(row.email);

    if (!email || !isValidEmail(email)) {
      console.warn(
        "Skipping invalid campaign email:",
        row.email
      );

      continue;
    }

    recipients.push({
      id: String(row.id),
      email,
      source: "manual",
    });
  }

  // ==================================================
  // DEDUPE
  // ==================================================

  const seen = new Set<string>();
  const uniqueRecipients: CampaignRecipient[] = [];

  for (const recipient of recipients) {
    if (seen.has(recipient.email)) {
      continue;
    }

    seen.add(recipient.email);
    uniqueRecipients.push(recipient);
  }

  return uniqueRecipients;
}

// ==================================================
// POST
// ==================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const campaignId =
      typeof body?.campaignId === "string"
        ? body.campaignId
        : null;

    if (!campaignId) {
      return NextResponse.json(
        {
          error: "Missing campaignId",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // LOAD CAMPAIGN
    // ==================================================

    const {
      data: campaign,
      error: campaignError,
    } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        {
          error:
            campaignError?.message ||
            "Campaign not found",
        },
        {
          status: 404,
        }
      );
    }

    if (!campaign.organisation_id) {
      return NextResponse.json(
        {
          error: "Campaign missing organisation_id",
        },
        {
          status: 400,
        }
      );
    }

    if (!campaign.list_id) {
      return NextResponse.json(
        {
          error: "Campaign missing list_id",
        },
        {
          status: 400,
        }
      );
    }

    // Prevent duplicate queueing while already active.
    if (
      campaign.status === "processing" ||
      campaign.status === "sending"
    ) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Campaign is already queued and processing.",
          campaignId,
          status: campaign.status,
        },
        {
          status: 200,
        }
      );
    }

    // ==================================================
    // LOAD AUDIENCE
    // ==================================================

    const recipients =
      await loadCampaignRecipients(
        campaign
      );

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          error:
            "No recipients found for this campaign",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // EXISTING DELIVERIES
    // ==================================================

    const {
      data: existingRows,
      error: existingError,
    } = await supabaseAdmin
      .from("campaign_deliveries")
      .select(`
        id,
        email,
        status,
        attempts
      `)
      .eq(
        "campaign_id",
        campaignId
      );

    if (existingError) {
      throw new Error(
        `Failed to load deliveries: ${existingError.message}`
      );
    }

    const existingMap = new Map<
      string,
      ExistingDelivery
    >();

    for (const row of existingRows || []) {
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
          id: String(row.id),
          email,
          status:
            String(
              row.status || ""
            ),
          attempts:
            Number(
              row.attempts || 0
            ),
        }
      );
    }

    // ==================================================
    // DETERMINE WHAT STILL NEEDS SENDING
    // ==================================================

    const alreadySent =
      recipients.filter(
        recipient =>
          existingMap.get(
            recipient.email
          )?.status ===
          "sent"
      );

    const needsSending =
      recipients.filter(
        recipient =>
          existingMap.get(
            recipient.email
          )?.status !==
          "sent"
      );

    // ==================================================
    // EVERYTHING ALREADY SENT
    // ==================================================

    if (
      needsSending.length === 0
    ) {
      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabaseAdmin
        .from("campaigns")
        .update({
          status: "sent",
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
        success: true,
        message:
          "All campaign recipients have already been sent.",
        campaignId,
        totalRecipients:
          recipients.length,
        alreadySent:
          alreadySent.length,
        queued: 0,
      });
    }

    // ==================================================
    // CREATE / RESET UNSENT DELIVERY ROWS
    // ==================================================

    const now =
      new Date().toISOString();

    const queueRows =
      needsSending.map(
        recipient => ({
          campaign_id:
            campaignId,

          organisation_id:
            campaign.organisation_id,

          email:
            recipient.email,

          // Delivery states are:
          // pending -> sending -> sent / failed
          status:
            "pending",

          // IMPORTANT:
          // A deliberate queue/requeue starts a fresh
          // retry cycle.
          //
          // This prevents historical rate-limit failures
          // from causing the new worker to immediately
          // skip recipients because attempts >= 5.
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
    } = await supabaseAdmin
      .from("campaign_deliveries")
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

    // ==================================================
    // MARK CAMPAIGN PROCESSING
    // ==================================================

    const {
      error:
        campaignUpdateError,
    } = await supabaseAdmin
      .from("campaigns")
      .update({
        status:
          "processing",

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

    // ==================================================
    // CAMPAIGN JOB
    // ==================================================
    //
    // campaign_jobs is useful for tracking but is not
    // the source of truth. A job insert failure should
    // therefore not stop the campaign itself.

    const {
      error: jobError,
    } = await supabaseAdmin
      .from("campaign_jobs")
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

        totalRecipients:
          recipients.length,

        alreadySent:
          alreadySent.length,

        queued:
          needsSending.length,
      }
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      message:
        "Campaign queued successfully.",

      campaignId,

      totalRecipients:
        recipients.length,

      alreadySent:
        alreadySent.length,

      queued:
        needsSending.length,

      rate:
        "20 emails per minute",
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "QUEUE CAMPAIGN ERROR:",
      error
    );

    return NextResponse.json(
      {
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