import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// ==================================================
// TRACKING PIXEL
// ==================================================

const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

// ==================================================
// PIXEL RESPONSE
// ==================================================

function pixelResponse() {
  return new NextResponse(
    TRACKING_PIXEL,
    {
      status: 200,

      headers: {
        "Content-Type":
          "image/gif",

        "Content-Length":
          String(
            TRACKING_PIXEL.length
          ),

        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "Surrogate-Control":
          "no-store",
      },
    }
  );
}

// ==================================================
// HELPERS
// ==================================================

function cleanParam(
  value:
    | string
    | null
) {
  if (!value) {
    return null;
  }

  const trimmed =
    value.trim();

  return (
    trimmed ||
    null
  );
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

// ==================================================
// GET
// ==================================================

export async function GET(
  req: Request
) {
  try {
    // ==================================================
    // REQUEST PARAMETERS
    // ==================================================

    const url =
      new URL(
        req.url
      );

    const campaignId =
      cleanParam(
        url.searchParams.get(
          "campaignId"
        )
      );

    /*
     * The send route uses profileId for both:
     *
     * - profiles.id
     * - campaign_list_emails.id
     *
     * This is intentional.
     *
     * It gives every recipient a stable identifier
     * that we can use for unique-open tracking.
     */
    const recipientId =
      cleanParam(
        url.searchParams.get(
          "profileId"
        )
      );

    const sourceParam =
      cleanParam(
        url.searchParams.get(
          "source"
        )
      );

    const source:
      | "profile"
      | "manual"
      | null =
      sourceParam ===
        "profile" ||
      sourceParam ===
        "manual"
        ? sourceParam
        : null;

    // ==================================================
    // ALWAYS RETURN A PIXEL
    // ==================================================

    if (
      !campaignId
    ) {
      console.warn(
        "Open tracking request missing campaignId"
      );

      return pixelResponse();
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
    // VERIFY CAMPAIGN EXISTS
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
          "id,status,sent_at,sent_count,open_count"
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
        "Open tracking campaign lookup failed:",
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

      return pixelResponse();
    }

    if (
      !campaign
    ) {
      console.warn(
        "Open tracking campaign not found:",
        {
          campaignId,
        }
      );

      return pixelResponse();
    }

    // ==================================================
    // UNIQUE OPEN CHECK
    // ==================================================

    /*
     * An email client may request the same pixel several
     * times.
     *
     * We only want one primary "open" for the recipient
     * in the campaign analytics.
     */

    let alreadyRecorded =
      false;

    if (
      recipientId
    ) {
      const {
        data:
          existingOpen,
        error:
          existingOpenError,
      } =
        await (
          supabaseAdmin as any
        )
          .from(
            "campaign_opens"
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
          .limit(1)
          .maybeSingle();

      if (
        existingOpenError
      ) {
        console.error(
          "Open tracking duplicate check failed:",
          {
            campaignId,

            recipientId,

            source,

            message:
              existingOpenError.message,

            details:
              existingOpenError.details,

            hint:
              existingOpenError.hint,

            code:
              existingOpenError.code,
          }
        );
      } else {
        alreadyRecorded =
          Boolean(
            existingOpen
          );
      }
    }

    // ==================================================
    // INSERT OPEN
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
            "campaign_opens"
          )
          .insert({
            campaign_id:
              campaignId,

            /*
             * Despite the legacy column name "profile_id",
             * this stores the stable recipient ID passed
             * from the send route.
             *
             * For TOTS contacts:
             * profiles.id
             *
             * For manually-added emails:
             * campaign_list_emails.id
             */
            profile_id:
              recipientId,

            user_agent:
              userAgent,

            ip,
          });

      if (
        insertError
      ) {
        console.error(
          "campaign_opens insert failed:",
          {
            campaignId,

            recipientId,

            source,

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
          "Unique campaign open recorded:",
          {
            campaignId,

            recipientId,

            source,
          }
        );
      }
    } else {
      console.log(
        "Duplicate campaign open ignored:",
        {
          campaignId,

          recipientId,

          source,
        }
      );
    }

    // ==================================================
    // RECALCULATE UNIQUE OPEN COUNT
    // ==================================================

    const {
      data:
        openRows,
      error:
        countError,
    } =
      await (
        supabaseAdmin as any
      )
        .from(
          "campaign_opens"
        )
        .select(
          "id,profile_id"
        )
        .eq(
          "campaign_id",
          campaignId
        );

    if (
      countError
    ) {
      console.error(
        "Open count lookup failed:",
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

      return pixelResponse();
    }

    // ==================================================
    // BUILD UNIQUE RECIPIENT SET
    // ==================================================

    const uniqueRecipients =
      new Set<string>();

    for (
      const row of
        openRows ||
        []
    ) {
      /*
       * Every properly generated email should have
       * profile_id/recipientId.
       *
       * The id fallback keeps old tracking rows without
       * a profile_id from simply disappearing from stats.
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

    const uniqueOpenCount =
      uniqueRecipients.size;

    // ==================================================
    // UPDATE CAMPAIGN COUNTER
    // ==================================================

    /*
     * IMPORTANT:
     *
     * Only update open_count.
     *
     * Do NOT touch:
     *
     * status
     * sent_at
     * sent_count
     * click_count
     *
     * The send route owns delivery status.
     */

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
          open_count:
            uniqueOpenCount,
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
        "Campaign open_count update failed:",
        {
          campaignId,

          uniqueOpenCount,

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
    } else {
      console.log(
        "Campaign analytics updated after open:",
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
    // PIXEL
    // ==================================================

    return pixelResponse();
  } catch (
    err: unknown
  ) {
    /*
     * Tracking must never break the email image request.
     *
     * Even if Supabase fails we still return the
     * transparent GIF.
     */

    console.error(
      "Open tracking error:",
      err
    );

    return pixelResponse();
  }
}