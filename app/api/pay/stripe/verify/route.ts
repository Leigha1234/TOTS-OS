import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

// ============================================================
// RUNTIME
// ============================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// STRIPE
// ============================================================

const stripe =
  new Stripe(
    process.env
      .STRIPE_SECRET_KEY!,
    {
      apiVersion:
        "2025-02-24.acacia",
    }
  );

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // ========================================================
    // AUTHENTICATED SUPABASE CLIENT
    // ========================================================

    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },

            setAll(
              cookiesToSet: {
                name: string;
                value: string;
                options?: Parameters<
                  typeof cookieStore.set
                >[2];
              }[]
            ) {
              try {
                cookiesToSet.forEach(
                  ({
                    name,
                    value,
                    options,
                  }) => {
                    cookieStore.set(
                      name,
                      value,
                      options
                    );
                  }
                );
              } catch {
                // Safe to ignore when cookies cannot be mutated.
              }
            },
          },
        }
      );

    // ========================================================
    // LOGGED-IN USER
    // ========================================================

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "You must be logged in.",
        },
        {
          status:
            401,
        }
      );
    }

    // ========================================================
    // REQUEST
    // ========================================================

    const body =
      await request.json();

    const sessionId =
      cleanString(
        body.sessionId
      );

    if (
      !sessionId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // RETRIEVE CHECKOUT SESSION
    // ========================================================

    const session =
      await stripe
        .checkout
        .sessions
        .retrieve(
          sessionId
        );

    // ========================================================
    // VERIFY CHECKOUT TYPE
    // ========================================================

    if (
      cleanString(
        session
          .metadata
          ?.checkout_type
      ) !==
      "existing_account"
    ) {
      return NextResponse.json(
        {
          error:
            "This is not an existing-account checkout.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // VERIFY USER
    // ========================================================

    const metadataUserId =
      cleanString(
        session
          .metadata
          ?.user_id
      );

    if (
      !metadataUserId ||
      metadataUserId !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This checkout does not belong to the logged-in account.",
        },
        {
          status:
            403,
        }
      );
    }

    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisationId =
      cleanString(
        session
          .metadata
          ?.organisation_id
      );

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "Organisation metadata is missing.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // SUBSCRIPTION
    // ========================================================

    const subscriptionId =
      typeof session
        .subscription ===
      "string"
        ? session.subscription
        : session
            .subscription
            ?.id ||
          null;

    if (
      !subscriptionId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe subscription was not found.",
        },
        {
          status:
            400,
        }
      );
    }

    const subscription =
      await stripe
        .subscriptions
        .retrieve(
          subscriptionId
        );

    // ========================================================
    // VERIFY SUBSCRIPTION STATUS
    // ========================================================

    const active =
      subscription
        .status ===
        "active" ||
      subscription
        .status ===
        "trialing";

    if (
      !active
    ) {
      return NextResponse.json(
        {
          error:
            `Stripe subscription is ${subscription.status}.`,
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // TIER
    // ========================================================

    const tier =
      cleanString(
        subscription
          .metadata
          ?.subscription_tier
      ).toLowerCase() ||
      cleanString(
        session
          .metadata
          ?.subscription_tier
      ).toLowerCase();

    if (
      ![
        "standard",
        "professional",
        "elite",
      ].includes(
        tier
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Subscription tier is invalid.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // ADDITIONAL SEATS
    // ========================================================

    const additionalSeats =
      Math.max(
        0,
        Number(
          cleanString(
            subscription
              .metadata
              ?.additional_seats
          ) ||
            cleanString(
              session
                .metadata
                ?.additional_seats
            ) ||
            0
        ) || 0
      );

    // ========================================================
    // ADMIN SUPABASE
    // ========================================================

    const admin =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    // ========================================================
    // VERIFY ORGANISATION OWNERSHIP
    // ========================================================

    const {
      data:
        organisation,
      error:
        organisationLookupError,
    } =
      await admin
        .from(
          "organisations"
        )
        .select(
          `
            id,
            name,
            created_by
          `
        )
        .eq(
          "id",
          organisationId
        )
        .eq(
          "created_by",
          user.id
        )
        .maybeSingle();

    if (
      organisationLookupError
    ) {
      console.error(
        "Organisation verification failed:",
        organisationLookupError
      );

      throw organisationLookupError;
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          error:
            "Organisation could not be verified.",
        },
        {
          status:
            403,
        }
      );
    }

    // ========================================================
    // ACTIVATE ORGANISATION
    // ========================================================

    const {
      error:
        organisationUpdateError,
    } =
      await admin
        .from(
          "organisations"
        )
        .update({
          subscription_status:
            "active",

          access_status:
            "active",
        })
        .eq(
          "id",
          organisation.id
        );

    if (
      organisationUpdateError
    ) {
      console.error(
        "Organisation activation failed:",
        organisationUpdateError
      );

      throw organisationUpdateError;
    }

    // ========================================================
    // UPDATE PROFILE
    // ========================================================

    const {
      error:
        profileUpdateError,
    } =
      await admin
        .from(
          "profiles"
        )
        .update({
          subscription_tier:
            tier,

          team_seats_allocated:
            additionalSeats,
        })
        .eq(
          "id",
          user.id
        );

    if (
      profileUpdateError
    ) {
      console.error(
        "Profile subscription update failed:",
        profileUpdateError
      );

      // Do NOT revoke paid access just because profile sync failed.
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    console.log(
      "[STRIPE VERIFY] Existing account activated:",
      {
        userId:
          user.id,

        organisationId:
          organisation.id,

        subscriptionId,

        tier,
      }
    );

    return NextResponse.json({
      success:
        true,

      organisationId:
        organisation.id,

      organisationName:
        organisation.name,

      subscriptionId,

      tier,

      subscriptionStatus:
        subscription.status,
    });
  } catch (
    error
  ) {
    console.error(
      "[STRIPE VERIFY] Failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Unable to verify your subscription.",
      },
      {
        status:
          500,
      }
    );
  }
}