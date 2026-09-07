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

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const token =
      String(
        body.token || ""
      ).trim();

    if (
      !token
    ) {
      return NextResponse.json(
        {
          error:
            "Missing beta exit token.",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      data:
        organisation,
      error:
        organisationError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .select(
          `
            id,
            name,
            subscription_status,
            access_status,
            beta_exit_token,
            retention_trial_claimed,
            retention_trial_ends_at
          `
        )
        .eq(
          "beta_exit_token",
          token
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.error(
        "Beta organisation lookup failed:",
        organisationError
      );

      return NextResponse.json(
        {
          error:
            "Unable to process this link.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          error:
            "This beta link is invalid.",
        },
        {
          status:
            404,
        }
      );
    }

    // Already paying
    if (
      organisation
        .subscription_status ===
      "active"
    ) {
      return NextResponse.json({
        success:
          true,

        alreadySubscribed:
          true,
      });
    }

    // Already claimed
    if (
      organisation
        .retention_trial_claimed
    ) {
      return NextResponse.json({
        success:
          true,

        alreadyClaimed:
          true,

        endsAt:
          organisation
            .retention_trial_ends_at,

        organisationName:
          organisation.name,
      });
    }

    const now =
      new Date();

    const trialEndsAt =
      new Date(
        now.getTime() +
          7 *
            24 *
            60 *
            60 *
            1000
      );

    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .update({
          subscription_status:
            "trial",

          retention_trial_claimed:
            true,

          retention_trial_ends_at:
            trialEndsAt.toISOString(),

          access_status:
            "active",
        })
        .eq(
          "id",
          organisation.id
        );

    if (
      updateError
    ) {
      console.error(
        "Beta extension update failed:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to extend your access.",
        },
        {
          status:
            500,
        }
      );
    }

    return NextResponse.json({
      success:
        true,

      endsAt:
        trialEndsAt.toISOString(),

      organisationName:
        organisation.name,
    });
  } catch (
    error
  ) {
    console.error(
      "Beta extension error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      {
        status:
          500,
      }
    );
  }
}