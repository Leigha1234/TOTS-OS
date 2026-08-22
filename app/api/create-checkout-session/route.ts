import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createClient,
} from "@supabase/supabase-js";

import crypto from "crypto";

export const runtime =
  "nodejs";

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
// SUPABASE ADMIN
// ======================================================

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

// ======================================================
// REGISTRATION ENCRYPTION
// ======================================================

const registrationEncryptionKey =
  process.env
    .REGISTRATION_ENCRYPTION_KEY ||
  "";

if (
  !registrationEncryptionKey
) {
  throw new Error(
    "REGISTRATION_ENCRYPTION_KEY is missing"
  );
}

// ======================================================
// TYPES
// ======================================================

type SubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

// ======================================================
// TRIAL
// ======================================================

const TRIAL_DAYS =
  14;

// ======================================================
// STRIPE PLAN MAPPING
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
    "professional"
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
// PASSWORD ENCRYPTION
// ======================================================

function encryptPassword(
  password: string
) {
  const iv =
    crypto.randomBytes(
      16
    );

  const key =
    crypto
      .createHash(
        "sha256"
      )
      .update(
        registrationEncryptionKey
      )
      .digest();

  const cipher =
    crypto.createCipheriv(
      "aes-256-cbc",
      key,
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        password,
        "utf8"
      ),

      cipher.final(),
    ]);

  return `${iv.toString(
    "hex"
  )}:${encrypted.toString(
    "hex"
  )}`;
}

// ======================================================
// EMAIL NORMALISATION
// ======================================================

function normaliseEmail(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

// ======================================================
// POST
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body =
      await request.json();

    const email =
      normaliseEmail(
        body.email
      );

    const password =
      String(
        body.password ||
          ""
      );

    const fullName =
      String(
        body.fullName ||
          ""
      ).trim();

    const companyName =
      String(
        body.companyName ||
          ""
      ).trim();

    const jobTitle =
      body.jobTitle
        ? String(
            body.jobTitle
          ).trim()
        : null;

    /*
     * IMPORTANT
     *
     * Never accept a Stripe
     * price ID directly from
     * the browser.
     *
     * The browser sends:
     *
     * Standard
     * Professional
     * Elite
     *
     * The server maps that
     * to the trusted Stripe
     * Price ID.
     */

    const {
      tier,
      priceId,
    } =
      resolvePlan(
        body.tier
      );

    // ==================================================
    // VALIDATE REQUIRED FIELDS
    // ==================================================

    if (
      !email ||
      !password ||
      !fullName ||
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required registration details.",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // VALIDATE EMAIL
    // ==================================================

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );

    if (
      !emailIsValid
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // VALIDATE PASSWORD
    // ==================================================

    if (
      password.length <
      8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status:
            400,
        }
      );
    }

    // ==================================================
    // REMOVE OLD INCOMPLETE REGISTRATION
    // ==================================================

    const {
      data:
        existingPending,

      error:
        existingPendingError,
    } =
      await supabase
        .from(
          "pending_registrations"
        )
        .select(
          "id"
        )
        .eq(
          "email",
          email
        )
        .eq(
          "completed",
          false
        )
        .maybeSingle();

    if (
      existingPendingError
    ) {
      console.error(
        "Pending registration lookup error:",
        existingPendingError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check registration details.",
        },
        {
          status:
            500,
        }
      );
    }

    // ==================================================
    // DELETE OLD PENDING REGISTRATION
    // ==================================================

    if (
      existingPending
    ) {
      const {
        error:
          deletePendingError,
      } =
        await supabase
          .from(
            "pending_registrations"
          )
          .delete()
          .eq(
            "id",
            existingPending.id
          );

      if (
        deletePendingError
      ) {
        console.error(
          "Could not remove previous pending registration:",
          deletePendingError
        );

        return NextResponse.json(
          {
            error:
              "Unable to reset previous registration attempt.",
          },
          {
            status:
              500,
          }
        );
      }
    }

    // ==================================================
    // ENCRYPT PASSWORD
    // ==================================================

    const encryptedPassword =
      encryptPassword(
        password
      );

    // ==================================================
    // CREATE PENDING REGISTRATION
    // ==================================================

    const {
      data:
        pendingRegistration,

      error:
        registrationError,
    } =
      await supabase
        .from(
          "pending_registrations"
        )
        .insert({
          email,

          encrypted_password:
            encryptedPassword,

          full_name:
            fullName,

          company_name:
            companyName,

          job_title:
            jobTitle,

          /*
           * Store selected
           * subscription tier.
           */

          subscription_tier:
            tier,

          completed:
            false,
        })
        .select(
          "id"
        )
        .single();

    if (
      registrationError ||
      !pendingRegistration
    ) {
      console.error(
        "Pending registration error:",
        registrationError
      );

      return NextResponse.json(
        {
          error:
            registrationError
              ?.message ||
            "Unable to save registration details.",
        },
        {
          status:
            500,
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
    // CREATE STRIPE CHECKOUT SESSION
    // ==================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          // ============================================
          // SUBSCRIPTION
          // ============================================

          mode:
            "subscription",

          // ============================================
          // PROMO CODES
          // ============================================

          allow_promotion_codes:
            true,

          // ============================================
          // IMPORTANT:
          // NO CARD REQUIRED TO START TRIAL
          // ============================================
          //
          // Stripe will only ask for
          // payment details when they
          // are required.
          //
          // Because the subscription
          // begins with a 14-day trial,
          // £0 is due today.
          //

          payment_method_collection:
            "if_required",

          // ============================================
          // PLAN
          // ============================================

          line_items: [
            {
              price:
                priceId,

              quantity:
                1,
            },
          ],

          // ============================================
          // CUSTOMER
          // ============================================

          customer_email:
            email,

          /*
           * Keep this if you want
           * the customer's billing
           * address saved.
           *
           * It does NOT force them
           * to enter card details.
           */

          billing_address_collection:
            "required",

          // ============================================
          // REDIRECTS
          // ============================================

          success_url:
            `${appUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/billing?cancelled=true`,

          // ============================================
          // CHECKOUT METADATA
          // ============================================

          metadata: {
            registration_id:
              pendingRegistration.id,

            subscription_tier:
              tier,

            trial_days:
              String(
                TRIAL_DAYS
              ),

            registration_type:
              "free_trial",
          },

          // ============================================
          // SUBSCRIPTION CONFIG
          // ============================================

          subscription_data: {
            // ==========================================
            // 14 DAY FREE TRIAL
            // ==========================================

            trial_period_days:
              TRIAL_DAYS,

            // ==========================================
            // WHAT HAPPENS IF NO CARD
            // IS ADDED BY DAY 14
            // ==========================================
            //
            // Pause the subscription.
            //
            // This means:
            //
            // - they are NOT unexpectedly charged
            // - Stripe does not keep producing failed
            //   payments
            // - you can ask them to add a card before
            //   continuing
            //

            trial_settings: {
              end_behavior: {
                missing_payment_method:
                  "pause",
              },
            },

            // ==========================================
            // COPY METADATA TO SUBSCRIPTION
            // ==========================================

            metadata: {
              registration_id:
                pendingRegistration.id,

              subscription_tier:
                tier,

              trial_days:
                String(
                  TRIAL_DAYS
                ),

              registration_type:
                "free_trial",
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
    // SAVE STRIPE SESSION
    // ==================================================

    const {
      error:
        sessionUpdateError,
    } =
      await supabase
        .from(
          "pending_registrations"
        )
        .update({
          stripe_session_id:
            session.id,

          completed:
            false,
        })
        .eq(
          "id",
          pendingRegistration.id
        );

    if (
      sessionUpdateError
    ) {
      console.error(
        "Failed to save Stripe session:",
        sessionUpdateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to link trial session.",
        },
        {
          status:
            500,
        }
      );
    }

    // ==================================================
    // LOG
    // ==================================================

    console.log(
      "Stripe trial checkout session created:",
      {
        sessionId:
          session.id,

        registrationId:
          pendingRegistration.id,

        tier,

        priceId,

        trialDays:
          TRIAL_DAYS,

        paymentRequiredToday:
          false,
      }
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        url:
          session.url,

        tier,

        sessionId:
          session.id,

        trialDays:
          TRIAL_DAYS,

        paymentRequiredToday:
          false,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "Checkout session error:",
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