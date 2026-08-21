import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const registrationEncryptionKey =
  process.env.REGISTRATION_ENCRYPTION_KEY || "";

if (!registrationEncryptionKey) {
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
// STRIPE PLAN MAPPING
// ======================================================

function resolvePlan(
  rawTier: unknown
): {
  tier: SubscriptionTier;
  priceId: string;
} {
  const tier = String(rawTier || "")
    .trim()
    .toLowerCase();

  if (tier === "standard") {
    const priceId =
      process.env.STRIPE_PRICE_STANDARD;

    if (!priceId) {
      throw new Error(
        "STRIPE_PRICE_STANDARD is missing."
      );
    }

    return {
      tier: "standard",
      priceId,
    };
  }

  if (tier === "professional") {
    const priceId =
      process.env.STRIPE_PRICE_PROFESSIONAL;

    if (!priceId) {
      throw new Error(
        "STRIPE_PRICE_PROFESSIONAL is missing."
      );
    }

    return {
      tier: "professional",
      priceId,
    };
  }

  if (tier === "elite") {
    const priceId =
      process.env.STRIPE_PRICE_ELITE;

    if (!priceId) {
      throw new Error(
        "STRIPE_PRICE_ELITE is missing."
      );
    }

    return {
      tier: "elite",
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
    crypto.randomBytes(16);

  const key = crypto
    .createHash("sha256")
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
  )}:${encrypted.toString("hex")}`;
}

// ======================================================
// EMAIL NORMALISATION
// ======================================================

function normaliseEmail(
  value: unknown
) {
  return String(value || "")
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
    const body =
      await request.json();

    const email =
      normaliseEmail(
        body.email
      );

    const password =
      String(
        body.password || ""
      );

    const fullName =
      String(
        body.fullName || ""
      ).trim();

    const companyName =
      String(
        body.companyName || ""
      ).trim();

    const jobTitle =
      body.jobTitle
        ? String(
            body.jobTitle
          ).trim()
        : null;

    /*
     * IMPORTANT:
     *
     * We deliberately DO NOT trust a priceId
     * supplied by the browser.
     *
     * The browser only sends the plan name:
     *
     * Standard
     * Professional
     * Elite
     *
     * The server then chooses the correct
     * Stripe Price ID.
     */
    const {
      tier,
      priceId,
    } = resolvePlan(
      body.tier
    );

    // ==================================================
    // VALIDATION
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
          status: 400,
        }
      );
    }

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );

    if (!emailIsValid) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // REMOVE EXISTING INCOMPLETE REGISTRATION
    // ==================================================

    const {
      data: existingPending,
      error: existingPendingError,
    } = await supabase
      .from(
        "pending_registrations"
      )
      .select("id")
      .eq(
        "email",
        email
      )
      .eq(
        "completed",
        false
      )
      .maybeSingle();

    if (existingPendingError) {
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
          status: 500,
        }
      );
    }

    if (
      existingPending
    ) {
      const {
        error:
          deletePendingError,
      } = await supabase
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
            status: 500,
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
    } = await supabase
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
         * CRITICAL:
         *
         * Store the selected plan before
         * sending the customer to Stripe.
         *
         * completeRegistration() later reads
         * this and assigns the organisation
         * the same subscription tier.
         */
        subscription_tier:
          tier,

        completed:
          false,
      })
      .select("id")
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
            registrationError?.message ||
            "Unable to save registration details.",
        },
        {
          status: 500,
        }
      );
    }

    // ==================================================
    // APP URL
    // ==================================================

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
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
          mode:
            "subscription",

          allow_promotion_codes:
            true,

          payment_method_types:
            ["card"],

          line_items: [
            {
              /*
               * Price is selected SERVER-SIDE.
               */
              price:
                priceId,

              quantity: 1,
            },
          ],

          customer_email:
            email,

          billing_address_collection:
            "required",

          success_url:
            `${appUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/billing?cancelled=true`,

          /*
           * Metadata gives us another
           * trusted record of the plan.
           *
           * The registration ID remains
           * the source used by the webhook.
           */
          metadata: {
            registration_id:
              pendingRegistration.id,

            subscription_tier:
              tier,
          },

          /*
           * Also copy metadata onto the
           * Stripe Subscription itself.
           *
           * This is useful later for
           * subscription.updated and other
           * lifecycle webhooks.
           */
          subscription_data: {
            metadata: {
              registration_id:
                pendingRegistration.id,

              subscription_tier:
                tier,
            },
          },
        });

    if (!session.url) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ==================================================
    // SAVE STRIPE SESSION ID
    // ==================================================

    const {
      error:
        sessionUpdateError,
    } = await supabase
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
            "Unable to link payment session.",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "Stripe checkout session created:",
      {
        sessionId:
          session.id,

        registrationId:
          pendingRegistration.id,

        tier,

        priceId,
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
      }
    );
  } catch (error) {
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
        status: 500,
      }
    );
  }
}