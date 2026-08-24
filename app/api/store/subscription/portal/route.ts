import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import Stripe from "stripe";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !supabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

// ============================================================
// CLIENTS
// ============================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken:
          false,

        persistSession:
          false,
      },
    }
  );

const stripe =
  new Stripe(
    stripeSecretKey
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

function getBearerToken(
  req:
    Request
) {
  const header =
    req.headers.get(
      "authorization"
    );

  if (
    !header ||
    !header
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  return (
    header
      .slice(
        7
      )
      .trim() ||
    null
  );
}

// ============================================================
// BASE URL
// ============================================================

function getBaseUrl(
  req:
    Request
) {
  const configured =
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .SITE_URL;

  if (
    configured
  ) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  const origin =
    req.headers.get(
      "origin"
    );

  if (
    origin
  ) {
    return origin.replace(
      /\/$/,
      ""
    );
  }

  const host =
    req.headers.get(
      "host"
    );

  if (
    host
  ) {
    const protocol =
      host.includes(
        "localhost"
      )
        ? "http"
        : "https";

    return `${protocol}://${host}`;
  }

  return "https://www.tots-os.co.uk";
}

// ============================================================
// AUTH + ORGANISATION
// ============================================================

async function getOrganisationId(
  req:
    Request
) {
  const token =
    getBearerToken(
      req
    );

  if (
    !token
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const {
    data:
      userData,

    error:
      userError,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        token
      );

  if (
    userError ||
    !userData.user
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const userId =
    userData.user.id;

  // ==========================================================
  // PROFILE
  // ==========================================================

  const {
    data:
      profile,

    error:
      profileError,
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
        userId
      )
      .maybeSingle();

  if (
    profileError
  ) {
    console.warn(
      "[STORE SUBSCRIPTION] Portal profile lookup failed:",
      profileError
    );
  }

  let organisationId =
    cleanString(
      profile
        ?.organisation_id
    );

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  if (
    !organisationId
  ) {
    const {
      data:
        memberships,
    } =
      await supabaseAdmin
        .from(
          "user_organisations"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          userId
        )
        .limit(
          1
        );

    organisationId =
      cleanString(
        memberships?.[0]
          ?.organisation_id
      );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  if (
    !organisationId
  ) {
    const {
      data:
        memberships,
    } =
      await supabaseAdmin
        .from(
          "organisation_members"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          userId
        )
        .limit(
          1
        );

    organisationId =
      cleanString(
        memberships?.[0]
          ?.organisation_id
      );
  }

  if (
    !organisationId
  ) {
    throw new Error(
      "No organisation is linked to this account."
    );
  }

  return organisationId;
}

// ============================================================
// VERIFY CUSTOMER
// ============================================================

async function customerExists(
  customerId:
    string
) {
  try {
    const customer =
      await stripe
        .customers
        .retrieve(
          customerId
        );

    return !customer.deleted;
  } catch (
    error:
      unknown
  ) {
    const stripeError =
      error as {
        code?:
          string;

        statusCode?:
          number;
      };

    if (
      stripeError
        ?.code ===
        "resource_missing" ||
      stripeError
        ?.statusCode ===
        404
    ) {
      return false;
    }

    throw error;
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    Request
) {
  try {
    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisationId =
      await getOrganisationId(
        req
      );

    // ========================================================
    // BILLING REFERENCES
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .select(
          `
            id,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_subscription_status
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
      throw organisationError;
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          error:
            "Organisation could not be found.",
        },
        {
          status:
            404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    let customerId =
      cleanString(
        organisation
          .store_stripe_customer_id
      );

    const subscriptionId =
      cleanString(
        organisation
          .store_stripe_subscription_id
      );

    // ========================================================
    // FALLBACK TO SUBSCRIPTION CUSTOMER
    // ========================================================

    if (
      !customerId &&
      subscriptionId
    ) {
      try {
        const subscription =
          await stripe
            .subscriptions
            .retrieve(
              subscriptionId
            );

        customerId =
          typeof subscription
            .customer ===
          "string"
            ? subscription
                .customer
            : subscription
                .customer
                ?.id ||
              "";

        if (
          customerId
        ) {
          const {
            error:
              saveCustomerError,
          } =
            await supabaseAdmin
              .from(
                "organisations"
              )
              .update({
                store_stripe_customer_id:
                  customerId,
              })
              .eq(
                "id",
                organisationId
              );

          if (
            saveCustomerError
          ) {
            console.warn(
              "[STORE SUBSCRIPTION] Recovered customer ID could not be saved:",
              saveCustomerError
            );
          }
        }
      } catch (
        error
      ) {
        console.warn(
          "[STORE SUBSCRIPTION] Could not recover customer from subscription:",
          error
        );
      }
    }

    // ========================================================
    // NO CUSTOMER
    // ========================================================

    if (
      !customerId
    ) {
      return NextResponse.json(
        {
          error:
            "No Store billing account exists yet. Purchase the Store add-on first.",

          purchaseRequired:
            true,
        },
        {
          status:
            400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // VERIFY CUSTOMER EXISTS
    // ========================================================

    const exists =
      await customerExists(
        customerId
      );

    if (
      !exists
    ) {
      return NextResponse.json(
        {
          error:
            "Your Store billing account could not be found in Stripe. Please contact support.",

          customerMissing:
            true,
        },
        {
          status:
            410,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // CREATE PORTAL SESSION
    // ========================================================

    const baseUrl =
      getBaseUrl(
        req
      );

    const portalSession =
      await stripe
        .billingPortal
        .sessions
        .create({
          customer:
            customerId,

          return_url:
            `${baseUrl}/store`,
        });

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        customerId,

        url:
          portalSession.url,
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
    error:
      unknown
  ) {
    console.error(
      "[STORE SUBSCRIPTION] Billing portal failed:",
      error
    );

    // ========================================================
    // AUTH
    // ========================================================

    if (
      error instanceof
        Error &&
      error.message ===
        "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        {
          error:
            "You need to sign in again.",
        },
        {
          status:
            401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // STRIPE
    // ========================================================

    if (
      error instanceof
      Stripe.errors.StripeError
    ) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "Store billing could not be opened.",

          stripeError:
            true,

          type:
            error.type,

          code:
            error.code ||
            null,
        },
        {
          status:
            error.statusCode &&
            error.statusCode >=
              400 &&
            error.statusCode <
              600
              ? error.statusCode
              : 500,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // GENERAL
    // ========================================================

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Store billing could not be opened.",
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