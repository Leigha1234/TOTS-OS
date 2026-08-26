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
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY
    ?.trim();

const storePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID
    ?.trim() || "";

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (!storePriceId) {
  throw new Error(
    "STRIPE_STORE_ADDON_PRICE_ID is missing"
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
// TYPES
// ============================================================

type OrganisationContext = {
  userId: string;
  email: string | null;
  organisationId: string;
  organisationName: string;
};

type OrganisationBillingRow = {
  id: string;

  name?:
    string | null;

  store_enabled?:
    boolean | null;

  store_subscription_status?:
    string | null;

  store_stripe_subscription_id?:
    string | null;

  store_stripe_customer_id?:
    string | null;

  store_price_id?:
    string | null;

  store_current_period_end?:
    string | null;

  store_cancel_at_period_end?:
    boolean | null;

  store_enabled_at?:
    string | null;
};

// ============================================================
// HELPERS
// ============================================================

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

// ============================================================
// AUTH TOKEN
// ============================================================

function getBearerToken(
  req: Request
) {
  const header =
    req.headers.get(
      "authorization"
    );

  if (
    !header
  ) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    header.split(
      " "
    );

  if (
    scheme
      ?.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token.trim();
}

// ============================================================
// BASE URL
// ============================================================

function getBaseUrl(
  req: Request
) {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ||
    process.env
      .SITE_URL
      ?.trim();

  if (
    configuredUrl
  ) {
    return configuredUrl.replace(
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

  const forwardedHost =
    req.headers.get(
      "x-forwarded-host"
    );

  const host =
    forwardedHost ||
    req.headers.get(
      "host"
    );

  const forwardedProto =
    req.headers.get(
      "x-forwarded-proto"
    );

  if (
    host
  ) {
    const protocol =
      forwardedProto ||
      (
        host.includes(
          "localhost"
        )
          ? "http"
          : "https"
      );

    return `${protocol}://${host}`;
  }

  return "https://tots-os.co.uk";
}

// ============================================================
// AUTH + ORGANISATION CONTEXT
// ============================================================

async function getContext(
  req: Request
): Promise<OrganisationContext> {
  const bearerToken =
    getBearerToken(
      req
    );

  if (
    !bearerToken
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  // ----------------------------------------------------------
  // VERIFY USER TOKEN
  // ----------------------------------------------------------

  const {
    data:
      userData,
    error:
      userError,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        bearerToken
      );

  if (
    userError ||
    !userData.user
  ) {
    console.error(
      "[STORE CHECKOUT] Invalid Supabase access token:",
      userError
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const user =
    userData.user;

  // ----------------------------------------------------------
  // PRIMARY ORGANISATION LOOKUP: profiles
  // ----------------------------------------------------------

  let organisationId =
    "";

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
        user.id
      )
      .maybeSingle();

  if (
    profileError
  ) {
    console.warn(
      "[STORE CHECKOUT] Profile organisation lookup failed:",
      profileError
    );
  }

  organisationId =
    cleanString(
      profile
        ?.organisation_id
    );

  // ----------------------------------------------------------
  // FALLBACK: team_members
  //
  // Your existing system already uses team_members heavily.
  // This is a much more useful fallback than assuming a table
  // such as organisation_members exists.
  // ----------------------------------------------------------

  if (
    !organisationId
  ) {
    const {
      data:
        teamMembership,
      error:
        teamMembershipError,
    } =
      await supabaseAdmin
        .from(
          "team_members"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          user.id
        )
        .not(
          "organisation_id",
          "is",
          null
        )
        .limit(
          1
        )
        .maybeSingle();

    if (
      teamMembershipError
    ) {
      console.warn(
        "[STORE CHECKOUT] team_members organisation lookup failed:",
        teamMembershipError
      );
    }

    organisationId =
      cleanString(
        teamMembership
          ?.organisation_id
      );
  }

  if (
    !organisationId
  ) {
    throw new Error(
      "NO_ORGANISATION"
    );
  }

  // ----------------------------------------------------------
  // ORGANISATION RECORD
  // ----------------------------------------------------------

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
        "id, name, name"
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
      "[STORE CHECKOUT] Organisation lookup failed:",
      organisationError
    );

    throw organisationError;
  }

  if (
    !organisation
  ) {
    throw new Error(
      "ORGANISATION_NOT_FOUND"
    );
  }

  const organisationName =
    cleanString(
      organisation.name
    ) ||
    cleanString(
      organisation.name
    ) ||
    "TOTS-OS Business";

  return {
    userId:
      user.id,

    email:
      user.email ||
      null,

    organisationId,

    organisationName,
  };
}

// ============================================================
// LOAD STORE BILLING DETAILS
// ============================================================

async function getOrganisationBilling(
  organisationId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .select(
        `
          id,
          name,
          store_enabled,
          store_subscription_status,
          store_stripe_subscription_id,
          store_stripe_customer_id,
          store_price_id,
          store_current_period_end,
          store_cancel_at_period_end,
          store_enabled_at
        `
      )
      .eq(
        "id",
        organisationId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | OrganisationBillingRow
    | null;
}

// ============================================================
// RETRIEVE STRIPE CUSTOMER
// ============================================================

async function retrieveCustomer(
  customerId: string
): Promise<
  Stripe.Customer |
  null
> {
  try {
    const customer =
      await stripe.customers.retrieve(
        customerId
      );

    if (
      "deleted" in
        customer &&
      customer.deleted
    ) {
      return null;
    }

    return customer as
      Stripe.Customer;
  } catch (
    error: unknown
  ) {
    const stripeError =
      error as {
        code?:
          string;
        statusCode?:
          number;
      };

    if (
      stripeError.code ===
        "resource_missing" ||
      stripeError.statusCode ===
        404
    ) {
      return null;
    }

    throw error;
  }
}

// ============================================================
// PLATFORM STRIPE CUSTOMER
//
// This customer pays TOTS-OS for the Store add-on.
//
// This is NOT the same Stripe account that receives payments
// from products sold through the user's own storefront.
// ============================================================

async function getOrCreateStripeCustomer({
  organisation,
  context,
}: {
  organisation:
    OrganisationBillingRow;

  context:
    OrganisationContext;
}) {
  const existingCustomerId =
    cleanString(
      organisation
        .store_stripe_customer_id
    );

  // ----------------------------------------------------------
  // REUSE EXISTING CUSTOMER
  // ----------------------------------------------------------

  if (
    existingCustomerId
  ) {
    const existingCustomer =
      await retrieveCustomer(
        existingCustomerId
      );

    if (
      existingCustomer
    ) {
      return existingCustomer;
    }

    console.warn(
      `[STORE CHECKOUT] Stripe customer ${existingCustomerId} no longer exists.`
    );
  }

  // ----------------------------------------------------------
  // CREATE CUSTOMER
  // ----------------------------------------------------------

  const customer =
    await stripe.customers.create({
      email:
        context.email ||
        undefined,

      name:
        context.organisationName,

      metadata: {
        organisation_id:
          context.organisationId,

        tots_user_id:
          context.userId,

        platform:
          "tots-os",

        subscription_type:
          "store_addon",
      },
    });

  // ----------------------------------------------------------
  // SAVE CUSTOMER ID
  // ----------------------------------------------------------

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
          customer.id,
      })
      .eq(
        "id",
        context.organisationId
      );

  if (
    saveCustomerError
  ) {
    throw saveCustomerError;
  }

  return customer;
}

// ============================================================
// EXISTING SUBSCRIPTION
// ============================================================

async function getExistingSubscription(
  subscriptionId: string
) {
  try {
    return await stripe.subscriptions.retrieve(
      subscriptionId
    );
  } catch (
    error: unknown
  ) {
    const stripeError =
      error as {
        code?:
          string;
        statusCode?:
          number;
      };

    if (
      stripeError.code ===
        "resource_missing" ||
      stripeError.statusCode ===
        404
    ) {
      return null;
    }

    throw error;
  }
}

// ============================================================
// SAVE CHECKOUT REFERENCES
// ============================================================

async function saveCheckoutReferences({
  organisationId,
  customerId,
}: {
  organisationId:
    string;

  customerId:
    string;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update({
        store_stripe_customer_id:
          customerId,

        store_price_id:
          storePriceId,
      })
      .eq(
        "id",
        organisationId
      );

  if (
    error
  ) {
    console.warn(
      "[STORE CHECKOUT] Could not save checkout references:",
      error
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  try {
    // ========================================================
    // AUTH + ORGANISATION
    // ========================================================

    const context =
      await getContext(
        req
      );

    // ========================================================
    // BILLING RECORD
    // ========================================================

    const organisation =
      await getOrganisationBilling(
        context.organisationId
      );

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

    // ========================================================
    // STORE ALREADY ENABLED
    // ========================================================

    if (
      organisation.store_enabled ===
      true
    ) {
      return NextResponse.json(
        {
          error:
            "The Store add-on is already active for this organisation.",

          alreadySubscribed:
            true,

          storeEnabled:
            true,
        },
        {
          status:
            409,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // CHECK EXISTING STRIPE SUBSCRIPTION
    // ========================================================

    const existingSubscriptionId =
      cleanString(
        organisation
          .store_stripe_subscription_id
      );

    if (
      existingSubscriptionId
    ) {
      const existingSubscription =
        await getExistingSubscription(
          existingSubscriptionId
        );

      if (
        existingSubscription
      ) {
        const blockingStatuses:
          Stripe.Subscription.Status[] =
          [
            "active",
            "trialing",
            "past_due",
            "unpaid",
            "incomplete",
            "paused",
          ];

        if (
          blockingStatuses.includes(
            existingSubscription.status
          )
        ) {
          const active =
            existingSubscription.status ===
              "active" ||
            existingSubscription.status ===
              "trialing";

          return NextResponse.json(
            {
              error:
                active
                  ? "The Store add-on is already subscribed."
                  : "A Store subscription already exists. Please manage the existing subscription instead of creating another one.",

              alreadySubscribed:
                active,

              existingSubscription:
                true,

              subscriptionId:
                existingSubscription.id,

              status:
                existingSubscription.status,

              storeEnabled:
                active,
            },
            {
              status:
                409,

              headers: {
                "Cache-Control":
                  "no-store",
              },
            }
          );
        }
      }
    }

    // ========================================================
    // STRIPE CUSTOMER
    // ========================================================

    const customer =
      await getOrCreateStripeCustomer({
        organisation,
        context,
      });

    // ========================================================
    // SITE URL
    // ========================================================

    const baseUrl =
      getBaseUrl(
        req
      );

    // ========================================================
    // CREATE CHECKOUT
    // ========================================================

    const checkoutParams:
      Stripe.Checkout.SessionCreateParams =
      {
        mode:
          "subscription",

        customer:
          customer.id,

        line_items: [
          {
            price:
              storePriceId,

            quantity:
              1,
          },
        ],

        success_url:
          `${baseUrl}/store?store_subscription=success&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${baseUrl}/store?store_subscription=cancelled`,

        billing_address_collection:
          "auto",

        allow_promotion_codes:
          true,

        client_reference_id:
          context.organisationId,

        metadata: {
          organisation_id:
            context.organisationId,

          tots_user_id:
            context.userId,

          subscription_type:
            "store_addon",

          store_price_id:
            storePriceId,
        },

        subscription_data: {
          metadata: {
            organisation_id:
              context.organisationId,

            tots_user_id:
              context.userId,

            subscription_type:
              "store_addon",

            store_price_id:
              storePriceId,
          },
        },
      };

    const checkoutSession =
      await stripe.checkout.sessions.create(
        checkoutParams
      );

    if (
      !checkoutSession.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ========================================================
    // SAVE CHECKOUT REFERENCES
    // ========================================================

    await saveCheckoutReferences({
      organisationId:
        context.organisationId,

      customerId:
        customer.id,
    });

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[STORE CHECKOUT] Checkout session created:",
      {
        organisationId:
          context.organisationId,

        userId:
          context.userId,

        checkoutSessionId:
          checkoutSession.id,

        customerId:
          customer.id,

        priceId:
          storePriceId,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        checkoutUrl:
          checkoutSession.url,

        url:
          checkoutSession.url,

        sessionId:
          checkoutSession.id,

        customerId:
          customer.id,

        priceId:
          storePriceId,
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
      "[STORE CHECKOUT] Checkout failed:",
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
    // ORGANISATION
    // ========================================================

    if (
      error instanceof
        Error &&
      error.message ===
        "NO_ORGANISATION"
    ) {
      return NextResponse.json(
        {
          error:
            "No organisation is linked to this account.",
        },
        {
          status:
            403,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      error instanceof
        Error &&
      error.message ===
        "ORGANISATION_NOT_FOUND"
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
            "Store checkout could not be started.",

          stripeError:
            true,

          type:
            error.type,

          code:
            error.code ||
            null,

          requestId:
            error.requestId ||
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
            : "Store checkout could not be started.",
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