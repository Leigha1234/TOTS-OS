import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// CLIENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

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

// ============================================================
// POST
// ============================================================

export async function POST(
  request: NextRequest
) {
  try {
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

    // ========================================================
    // AUTH
    // ========================================================

    const authorization =
      request.headers.get(
        "authorization"
      );

    const accessToken =
      authorization
        ?.replace(
          /^Bearer\s+/i,
          ""
        )
        .trim();

    if (!accessToken) {
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

    const {
      data: userData,
      error: userError,
    } =
      await supabaseAdmin
        .auth
        .getUser(
          accessToken
        );

    const user =
      userData.user;

    if (
      userError ||
      !user
    ) {
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

    // ========================================================
    // INPUT
    // ========================================================

    const body =
      await request
        .json()
        .catch(
          () => ({})
        );

    const campaignId =
      String(
        body?.campaignId ||
          ""
      ).trim();

    if (!campaignId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "campaignId is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // USER ORGANISATION
    // ========================================================

    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      profileError ||
      !profile?.organisation_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not verify your organisation.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // CAMPAIGN
    // ========================================================

    const {
      data: campaign,
      error: campaignError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .select(
          "id,organisation_id,status,total_sent"
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
          success: false,
          error:
            "Campaign not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      campaign.organisation_id !==
      profile.organisation_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have access to this campaign.",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // FIND FAILED DELIVERIES
    // ========================================================

    const {
      data: failedRows,
      error: failedRowsError,
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
          campaignId
        )
        .eq(
          "organisation_id",
          profile.organisation_id
        )
        .eq(
          "status",
          "failed"
        );

    if (failedRowsError) {
      return NextResponse.json(
        {
          success: false,
          error:
            failedRowsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const failedCount =
      failedRows?.length ||
      0;

    if (
      failedCount === 0
    ) {
      return NextResponse.json(
        {
          success: true,
          queued: 0,
          message:
            "There are no failed emails to resend.",
        },
        {
          status: 200,
        }
      );
    }

    // ========================================================
    // RESET FAILED RECIPIENTS TO PENDING
    // ========================================================

    const failedIds =
      failedRows.map(
        (row) =>
          row.id
      );

    const now =
      new Date()
        .toISOString();

    const {
      error: resetError,
    } =
      await supabaseAdmin
        .from(
          "campaign_deliveries"
        )
        .update({
          status:
            "pending",

          attempts:
            0,

          last_error:
            null,

          updated_at:
            now,
        })
        .in(
          "id",
          failedIds
        );

    if (resetError) {
      return NextResponse.json(
        {
          success: false,
          error:
            resetError.message,
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // COUNT ALREADY SENT RECIPIENTS
    // ========================================================

    const {
      count: sentCount,
      error: sentCountError,
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

    if (sentCountError) {
      return NextResponse.json(
        {
          success: false,
          error:
            sentCountError.message,
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // REQUEUE CAMPAIGN
    //
    // scheduled_for is set to now so the cron can pick this up
    // even if the original campaign was an immediate send.
    // ========================================================

    const {
      error: campaignUpdateError,
    } =
      await supabaseAdmin
        .from(
          "campaigns"
        )
        .update({
          status:
            "queued",

          scheduled_for:
            now,

          sent_at:
            null,

          total_sent:
            sentCount ||
            0,

          worker_locked_until:
            null,

          worker_lock_token:
            null,

          last_worker_at:
            now,
        })
        .eq(
          "id",
          campaignId
        )
        .eq(
          "organisation_id",
          profile.organisation_id
        );

    if (
      campaignUpdateError
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            campaignUpdateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        queued:
          failedCount,

        alreadySent:
          sentCount ||
          0,

        message:
          `${failedCount} failed email${
            failedCount === 1
              ? ""
              : "s"
          } queued to resend.`,
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
    error: unknown
  ) {
    console.error(
      "[RESEND FAILED] Unexpected error:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Could not resend failed emails.",
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
