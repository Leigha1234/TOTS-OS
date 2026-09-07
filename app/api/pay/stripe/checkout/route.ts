import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  cookies,
} from "next/headers";

// ======================================================
// RUNTIME
// ======================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ======================================================
// STRIPE
// ======================================================

const stripe =
  new Stripe(
    process.env
      .STRIPE_SECRET_KEY!,
    {
      apiVersion:
        "2025-02-24.acacia",
    }
  );

// ======================================================
// TYPES
// ======================================================

type SubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

// ======================================================
// PLAN MAPPING
// ======================================================

function resolvePlan(
  rawTier: unknown
): {
  tier: SubscriptionTier;
  priceId: string;
} {
  const tier =
    String(
      rawTier || ""
    )
      .trim()
      .toLowerCase();

  // ==================================================
  // STANDARD
  // ==================================================

  if (
    tier ===
    "standard"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_STANDARD;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_STANDARD is missing."
      );
    }

    return {
      tier:
        "standard",

      priceId,
    };
  }

  // ==================================================
  // PROFESSIONAL
  // ==================================================

  if (
    tier ===
      "professional" ||
    tier ===
      "premium"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_PROFESSIONAL;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_PROFESSIONAL is missing."
      );
    }

    return {
      tier:
        "professional",

      priceId,
    };
  }

  // ==================================================
  // ELITE
  // ==================================================

  if (
    tier ===
    "elite"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_ELITE;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_ELITE is missing."
      );
    }

    return {
      tier:
        "elite",

      priceId,
    };
  }

  throw new Error(
    "Invalid subscription tier."
  );
}

// ======================================================
// POST
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ==================================================
    // CREATE AUTHENTICATED SUPABASE CLIENT
    // ==================================================

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
              return cookieStore
                .getAll();
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
                /*
                 * Safe to ignore in contexts
                 * where cookies cannot be written.
                 */
              }
            },
          },
        }
      );

    // ==================================================
    // GET LOGGED-IN USER
    // ==================================================

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
            "You must be logged in to manage your subscription.",
        },
        {
          status:
            401,
        }
      );
    }

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body =
      await request.json();

    const {
      tier,
      priceId,
    } =
      resolvePlan(
        body.tier
      );

    const additionalSeats =
      Math.max(
        0,
        Number(
          body.additionalSeats ||
            0
        ) || 0
      );

    // ==================================================
    // FIND ORGANISATION ID
    // ==================================================

    let organisationId:
      string | null =
      null;

    // ==================================================
    // PRIMARY LOOKUP:
    // profiles.organisation_id
    // ==================================================

    const {
      data:
        profile,
      error:
        profileError,
    } =
      await supabase
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
      profileError
    ) {
      console.error(
        "Profile organisation lookup error:",
        profileError
      );
    }

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        profile
          .organisation_id;
    }

    // ==================================================
    // FALLBACK 1:
    // organisation_members
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          membership,
        error:
          membershipError,
      } =
        await supabase
          .from(
            "organisation_members"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        membershipError
      ) {
        console.error(
          "Organisation membership lookup error:",
          membershipError
        );
      }

      if (
        membership
          ?.organisation_id
      ) {
        organisationId =
          membership
            .organisation_id;
      }
    }

    // ==================================================
    // FALLBACK 2:
    // user_organisations
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          userOrganisation,
        error:
          userOrganisationError,
      } =
        await supabase
          .from(
            "user_organisations"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        userOrganisationError
      ) {
        console.error(
          "User organisation lookup error:",
          userOrganisationError
        );
      }

      if (
        userOrganisation
          ?.organisation_id
      ) {
        organisationId =
          userOrganisation
            .organisation_id;
      }
    }

    // ==================================================
    // FALLBACK 3:
    // organisations.created_by
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          createdOrganisation,
        error:
          createdOrganisationError,
      } =
        await supabase
          .from(
            "organisations"
          )
          .select(
            "id"
          )
          .eq(
            "created_by",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        createdOrganisationError
      ) {
        console.error(
          "Created organisation lookup error:",
          createdOrganisationError
        );
      }

      if (
        createdOrganisation
          ?.id
      ) {
        organisationId =
          createdOrganisation
            .id;
      }
    }

    // ==================================================
    // NO ORGANISATION FOUND
    // ==================================================

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "No organisation is connected to this account.",
        },
        {
          status:
            404,
        }
      );
    }

    // ==================================================
    // LOAD ORGANISATION
    // ==================================================

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
            created_by,
            subscription_status,
            access_status
          `
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.error(
        "Organisation lookup error:",
        organisationError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load your organisation.",
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
            "Your organisation record could not be found.",
        },
        {
          status:
            404,
        }
      );
    }

    // ==================================================
    // APP URL
    // ==================================================

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL;

    if (
      !appUrl
    ) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is missing."
      );
    }

    // ==================================================
    // STRIPE LINE ITEMS
    // ==================================================

    const lineItems:
      Stripe.Checkout.SessionCreateParams.LineItem[] =
      [
        {
          price:
            priceId,

          quantity:
            1,
        },
      ];

    // ==================================================
    // OPTIONAL TEAM SEATS
    // ==================================================

    if (
      additionalSeats >
      0
    ) {
      const teamSeatPriceId =
        process.env
          .STRIPE_PRICE_TEAM_SEAT;

      if (
        !teamSeatPriceId
      ) {
        return NextResponse.json(
          {
            error:
              "Team seat billing has not been configured yet.",
          },
          {
            status:
              400,
          }
        );
      }

      lineItems.push(
        {
          price:
            teamSeatPriceId,

          quantity:
            additionalSeats,
        }
      );
    }

    // ==================================================
    // CREATE STRIPE CHECKOUT SESSION
    // ==================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode:
            "subscription",

          /*
           * Existing beta users are
           * moving onto a paid plan.
           *
           * No extra Stripe trial here.
           */

          line_items:
            lineItems,

          customer_email:
            user.email,

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/billing?cancelled=true`,

          // ==================================================
          // CHECKOUT METADATA
          // ==================================================

          metadata: {
            user_id:
              user.id,

            organisation_id:
              organisation.id,

            organisation_name:
              organisation.name,

            subscription_tier:
              tier,

            checkout_type:
              "existing_account",

            additional_seats:
              String(
                additionalSeats
              ),
          },

          // ==================================================
          // SUBSCRIPTION METADATA
          // ==================================================

          subscription_data: {
            metadata: {
              user_id:
                user.id,

              organisation_id:
                organisation.id,

              subscription_tier:
                tier,

              checkout_type:
                "existing_account",

              additional_seats:
                String(
                  additionalSeats
                ),
            },
          },
        });

    // ==================================================
    // CHECK STRIPE URL
    // ==================================================

    if (
      !session.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        url:
          session.url,

        sessionId:
          session.id,

        tier,

        organisationId:
          organisation.id,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Existing subscription checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      },
      {
        status:
          500,
      }
    );
  }
}