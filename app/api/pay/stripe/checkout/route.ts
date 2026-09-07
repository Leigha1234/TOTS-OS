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
              cookiesToSet
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
                // Can be ignored when
                // cookies cannot be written.
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
    // REQUEST
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
        )
      );

    // ==================================================
    // FIND ORGANISATION
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
          "created_by",
          user.id
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
            "Unable to find your organisation.",
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
            "No organisation is connected to this account.",
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
    //
    // Your UI currently allows
    // additional team seats.
    //
    // If you already have a Stripe
    // recurring Price for those seats,
    // set:
    //
    // STRIPE_PRICE_TEAM_SEAT
    //
    // in Vercel.
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
    // CREATE CHECKOUT SESSION
    // ==================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode:
            "subscription",

          // Beta tester is now
          // choosing to become
          // a paying customer.
          //
          // DO NOT add another
          // 14-day Stripe trial here.

          line_items:
            lineItems,

          customer_email:
            user.email,

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            `${appUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/settings/billing?cancelled=true`,

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
    // CHECK URL
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