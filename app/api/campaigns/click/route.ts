import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// ==================================================
// TYPES
// ==================================================

type ClickSource =
  | "profile"
  | "manual"
  | null;

// ==================================================
// HELPERS
// ==================================================

function cleanString(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function getClientIp(
  req: Request
) {
  const forwarded =
    req.headers.get(
      "x-forwarded-for"
    );

  if (forwarded) {
    const firstIp =
      forwarded
        .split(",")[0]
        ?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp =
    req.headers.get(
      "x-real-ip"
    );

  return (
    realIp?.trim() ||
    null
  );
}

function isSafeUrl(
  value: string
) {
  try {
    const parsed =
      new URL(value);

    return (
      parsed.protocol ===
        "http:" ||
      parsed.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

// ==================================================
// RECORD CLICK
// ==================================================

async function recordClick({
  campaignId,
  recipientId,
  source,
  url,
  userAgent,
  ip,
}: {
  campaignId: string;
  recipientId:
    | string
    | null;
  source: ClickSource;
  url: string;
  userAgent:
    | string
    | null;
  ip:
    | string
    | null;
}) {
  // ==================================================
  // DUPLICATE CHECK
  // ==================================================

  let alreadyRecorded =
    false;

  if (
    recipientId
  ) {
    const {
      data:
        existingClick,
      error:
        existingClickError,
    } =
      await (
        supabaseAdmin as any
      )
        .from(
          "campaign_clicks"
        )
        .select(
          "id"
        )
        .eq(
          "campaign_id",
          campaignId
        )
        .eq(
          "profile_id",
          recipientId
        )
        .eq(
          "url",
          url
        )
        .limit(1)
        .maybeSingle();

    if (
      existingClickError
    ) {
      console.error(
        "Click duplicate check failed:",
        {
          campaignId,
          recipientId,
          source,
          url,

          message:
            existingClickError.message,

          details:
            existingClickError.details,

          hint:
            existingClickError.hint,

          code:
            existingClickError.code,
        }
      );
    } else {
      alreadyRecorded =
        Boolean(
          existingClick
        );
    }
  }

  // ==================================================
  // INSERT UNIQUE CLICK
  // ==================================================

  if (
    !alreadyRecorded
  ) {
    const {
      error:
        insertError,
    } =
      await (
        supabaseAdmin as any
      )
        .from(
          "campaign_clicks"
        )
        .insert({
          campaign_id:
            campaignId,

          /*
           * Legacy column name.
           *
           * For profile recipients this is profiles.id.
           * For manual recipients this is campaign_list_emails.id.
           */
          profile_id:
            recipientId,

          url,

          user_agent:
            userAgent,

          ip,
        });

    if (
      insertError
    ) {
      console.error(
        "campaign_clicks insert failed:",
        {
          campaignId,
          recipientId,
          source,
          url,

          message:
            insertError.message,

          details:
            insertError.details,

          hint:
            insertError.hint,

          code:
            insertError.code,
        }
      );
    } else {
      console.log(
        "Unique campaign click recorded:",
        {
          campaignId,
          recipientId,
          source,
          url,
        }
      );
    }
  } else {
    console.log(
      "Duplicate campaign click ignored:",
      {
        campaignId,
        recipientId,
        source,
        url,
      }
    );
  }

  // ==================================================
  // RECALCULATE UNIQUE CLICK COUNT
  // ==================================================

  const {
    data:
      clickRows,
    error:
      countError,
  } =
    await (
      supabaseAdmin as any
    )
      .from(
        "campaign_clicks"
      )
      .select(
        "id,profile_id,url"
      )
      .eq(
        "campaign_id",
        campaignId
      );

  if (
    countError
  ) {
    console.error(
      "Click count lookup failed:",
      {
        campaignId,

        message:
          countError.message,

        details:
          countError.details,

        hint:
          countError.hint,

        code:
          countError.code,
      }
    );

    return;
  }

  // ==================================================
  // UNIQUE CLICKERS
  // ==================================================

  const uniqueRecipients =
    new Set<string>();

  for (
    const row of
      clickRows ||
      []
  ) {
    /*
     * Main dashboard analytics should count
     * unique recipients who clicked.
     *
     * If old rows have no recipient ID, retain
     * them using their row ID rather than silently
     * dropping them from analytics.
     */
    const key =
      row.profile_id
        ? `recipient-${String(
            row.profile_id
          )}`
        : `legacy-${String(
            row.id
          )}`;

    uniqueRecipients.add(
      key
    );
  }

  const uniqueClickCount =
    uniqueRecipients.size;

  // ==================================================
  // UPDATE CAMPAIGN COUNTER
  // ==================================================

  const {
    data:
      updatedCampaign,
    error:
      updateError,
  } =
    await (
      supabaseAdmin as any
    )
      .from(
        "campaigns"
      )
      .update({
        click_count:
          uniqueClickCount,
      })
      .eq(
        "id",
        campaignId
      )
      .select(
        "id,status,sent_at,sent_count,open_count,click_count"
      )
      .single();

  if (
    updateError
  ) {
    console.error(
      "Campaign click_count update failed:",
      {
        campaignId,
        uniqueClickCount,

        message:
          updateError.message,

        details:
          updateError.details,

        hint:
          updateError.hint,

        code:
          updateError.code,
      }
    );

    return;
  }

  console.log(
    "Campaign analytics updated after click:",
    {
      campaignId,

      status:
        updatedCampaign
          ?.status,

      sentCount:
        updatedCampaign
          ?.sent_count,

      openCount:
        updatedCampaign
          ?.open_count,

      clickCount:
        updatedCampaign
          ?.click_count,
    }
  );
}

// ==================================================
// POST
// ==================================================

export async function POST(
  req: Request
) {
  try {
    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const campaignId =
      cleanString(
        body?.campaignId
      );

    const destinationUrl =
      cleanString(
        body?.url
      );

    const recipientId =
      cleanString(
        body?.profileId
      ) ||
      null;

    const sourceRaw =
      cleanString(
        body?.source
      );

    const source: ClickSource =
      sourceRaw ===
        "profile" ||
      sourceRaw ===
        "manual"
        ? sourceRaw
        : null;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !campaignId ||
      !destinationUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Missing campaignId or url",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !isSafeUrl(
        destinationUrl
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid destination URL",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // VERIFY CAMPAIGN
    // ==================================================

    const {
      data:
        campaign,
      error:
        campaignError,
    } =
      await (
        supabaseAdmin as any
      )
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

    if (
      campaignError
    ) {
      console.error(
        "Click tracking campaign lookup failed:",
        {
          campaignId,

          message:
            campaignError.message,

          details:
            campaignError.details,

          hint:
            campaignError.hint,

          code:
            campaignError.code,
        }
      );

      return NextResponse.json(
        {
          error:
            "Could not verify campaign",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !campaign
    ) {
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
    // REQUEST METADATA
    // ==================================================

    const userAgent =
      req.headers.get(
        "user-agent"
      ) ||
      null;

    const ip =
      getClientIp(
        req
      );

    // ==================================================
    // RECORD CLICK
    // ==================================================

    await recordClick({
      campaignId,

      recipientId,

      source,

      url:
        destinationUrl,

      userAgent,

      ip,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        ok:
          true,

        campaignId,

        url:
          destinationUrl,
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
      "Click tracking error:",
      err
    );

    const message =
      err instanceof
      Error
        ? err.message
        : "Internal server error";

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

// ==================================================
// GET
// ==================================================

/*
 * GET is used by email links.
 *
 * This lets the email link point at:
 *
 * /api/campaigns/click
 * ?campaignId=...
 * &profileId=...
 * &source=...
 * &url=https%3A%2F%2Fexample.com
 *
 * We record the click first and then redirect
 * the reader to the actual destination.
 */

export async function GET(
  req: Request
) {
  try {
    const requestUrl =
      new URL(
        req.url
      );

    const campaignId =
      cleanString(
        requestUrl.searchParams.get(
          "campaignId"
        )
      );

    const recipientId =
      cleanString(
        requestUrl.searchParams.get(
          "profileId"
        )
      ) ||
      null;

    const sourceRaw =
      cleanString(
        requestUrl.searchParams.get(
          "source"
        )
      );

    const destinationUrl =
      cleanString(
        requestUrl.searchParams.get(
          "url"
        )
      );

    const source: ClickSource =
      sourceRaw ===
        "profile" ||
      sourceRaw ===
        "manual"
        ? sourceRaw
        : null;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !campaignId ||
      !destinationUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Missing campaignId or url",
        },
        {
          status:
            400,
        }
      );
    }

    if (
      !isSafeUrl(
        destinationUrl
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid destination URL",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // REQUEST METADATA
    // ==================================================

    const userAgent =
      req.headers.get(
        "user-agent"
      ) ||
      null;

    const ip =
      getClientIp(
        req
      );

    // ==================================================
    // RECORD CLICK
    // ==================================================

    try {
      await recordClick({
        campaignId,

        recipientId,

        source,

        url:
          destinationUrl,

        userAgent,

        ip,
      });
    } catch (
      trackingError
    ) {
      /*
       * Clicking the email should still take the
       * user to the destination even if analytics
       * temporarily fail.
       */

      console.error(
        "Click analytics failed before redirect:",
        trackingError
      );
    }

    // ==================================================
    // REDIRECT
    // ==================================================

    return NextResponse.redirect(
      destinationUrl,
      {
        status:
          302,
      }
    );
  } catch (
    err: unknown
  ) {
    console.error(
      "Click redirect tracking error:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Unable to process click",
      },
      {
        status:
          500,
      }
    );
  }
}