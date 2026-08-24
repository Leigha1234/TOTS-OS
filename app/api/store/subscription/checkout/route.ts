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
  userId:
    string;

  email:
    string | null;

  organisationId:
    string;

  organisationName:
    string;
};

type OrganisationBillingRow = {
  id:
    string;

  name?:
    string | null;

  company_name?:
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
// BEARER TOKEN
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

  const token =
    header
      .slice(
        7
      )
      .trim();

  return (
    token ||
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
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ||
    process.env
      .SITE_URL
      ?.trim();

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

async function getContext(
  req:
    Request
): Promise<OrganisationContext> {
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
    console.error(
      "[STORE SUBSCRIPTION] Authentication failed:",
      userError
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const user =
    userData.user;

  let organisationId =
    "";

  // ==========================================================
  // PROFILE
  // ==========================================================

  try {
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
        "[STORE SUBSCRIPTION] Profile organisation lookup failed:",
        profileError
      );
    } else {
      organisationId =
        cleanString(
          profile
            ?.organisation_id
        );
    }
  } catch (
    profileLookupError
  ) {
    console.warn(
      "[STORE SUBSCRIPTION] Profile lookup exception:",
      profileLookupError
    );
  }

  // ==========================================================
  // USER ORGANISATIONS FALLBACK
  // ==========================================================

  if (
    !organisationId
  ) {
    try {
      const {
        data:
          memberships,

        error:
          membershipError,
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
            user.id
          )
          .limit(
            1
          );

      if (
        membershipError
      ) {
        console.warn(
          "[STORE SUBSCRIPTION] user_organisations lookup failed:",
          membershipError
        );
      } else {
        organisationId =
          cleanString(
            memberships?.[0]
              ?.organisation_id
          );
      }
    } catch (
      membershipLookupError
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] user_organisations exception:",
        membershipLookupError
      );
    }
  }

  // ==========================================================
  // ORGANISATION MEMBERS FALLBACK
  // ==========================================================

  if (
    !organisationId
  ) {
    try {
      const {
        data:
          memberships,

        error:
          membershipError,
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
            user.id
          )
          .limit(
            1
          );

      if (
        membershipError
      ) {
        console.warn(
          "[STORE SUBSCRIPTION] organisation_members lookup failed:",
          membershipError
        );
      } else {
        organisationId =
          cleanString(
            memberships?.[0]
              ?.organisation_id
          );
      }
    } catch (
      membershipLookupError
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] organisation_members exception:",
        membershipLookupError
      );
    }
  }

  if (
    !organisationId
  ) {
    throw new Error(
      "No organisation is linked to this account."
    );
  }

  // ==========================================================
  // ORGANISATION
  // ==========================================================

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
        "id, name, company_name"
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
    throw new Error(
      "Organisation could not be found."
    );
  }

  const organisationName =
    cleanString(
      organisation.name
    ) ||
    cleanString(
      organisation.company_name
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
// LOAD ORGANISATION BILLING
// ============================================================

async function getOrganisationBilling(
  organisationId:
    string
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
          company_name,
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
// RETRIEVE CUSTOMER
// ============================================================

async function retrieveCustomer(
  customerId:
    string
): Promise<
  Stripe.Customer |
  null
> {
  try {
    const customer =
      await stripe
        .customers
        .retrieve(
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
      return null;
    }

    throw error;
  }
}

// ============================================================
// CREATE / GET PLATFORM STRIPE CUSTOMER
//
// IMPORTANT:
//
// This Stripe customer belongs to the TOTS-OS platform Stripe
// account and pays TOTS-OS for the Store add-on.
//
// This is separate from store_stripe_accounts, which represents
// the business owner's Stripe Connect account that receives
// money from their own storefront customers.
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

  // ==========================================================
  // EXISTING CUSTOMER
  // ==========================================================

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
      `[STORE SUBSCRIPTION] Customer ${existingCustomerId} no longer exists. Creating replacement.`
    );
  }

  // ==========================================================
  // CREATE CUSTOMER
  // ==========================================================

  const customer =
    await stripe
      .customers
      .create({
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

  // ==========================================================
  // SAVE CUSTOMER
  // ==========================================================

  const {
    error:
      updateError,
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
    updateError
  ) {
    throw updateError;
  }

  return customer;
}

// ============================================================
// EXISTING SUBSCRIPTION CHECK
// ============================================================

async function checkExistingSubscription(
  subscriptionId:
    string
) {
  try {
    const subscription =
      await stripe
        .subscriptions
        .retrieve(
          subscriptionId
        );

    return subscription;
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
      "[STORE SUBSCRIPTION] Could not save checkout references:",
      error
    );
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
    // AUTH
    // ========================================================

    const context =
      await getContext(
        req
      );

    // ========================================================
    // ORGANISATION
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
    // EXISTING SUBSCRIPTION
    // ========================================================

    const existingSubscriptionId =
      cleanString(
        organisation
          .store_stripe_subscription_id
      );

    if (
      existingSubscriptionId
    ) {
      const subscription =
        await checkExistingSubscription(
          existingSubscriptionId
        );

      if (
        subscription
      ) {
        const reusableStatuses:
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
          reusableStatuses.includes(
            subscription.status
          )
        ) {
          const active =
            subscription.status ===
              "active" ||
            subscription.status ===
              "trialing";

          return NextResponse.json(
            {
              error:
                active
                  ? "Store is already subscribed."
                  : "A Store subscription already exists. Open billing to manage it.",

              alreadySubscribed:
                active,

              existingSubscription:
                true,

              subscriptionId:
                subscription.id,

              status:
                subscription.status,

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
    // PLATFORM STRIPE CUSTOMER
    // ========================================================

    const customer =
      await getOrCreateStripeCustomer({
        organisation,

        context,
      });

    // ========================================================
    // BASE URL
    // ========================================================

    const baseUrl =
      getBaseUrl(
        req
      );

    // ========================================================
    // CHECKOUT PARAMS
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
          false,

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

    // ========================================================
    // CREATE CHECKOUT SESSION
    // ========================================================

    const checkoutSession =
      await stripe
        .checkout
        .sessions
        .create(
          checkoutParams
        );

    // ========================================================
    // CHECKOUT URL
    // ========================================================

    if (
      !checkoutSession.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ========================================================
    // SAVE CUSTOMER + PRICE
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
      "[STORE SUBSCRIPTION] Checkout created:",
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
    error:
      unknown
  ) {
    console.error(
      "[STORE SUBSCRIPTION] Checkout failed:",
      error
    );

    // ========================================================
    // AUTH ERROR
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
    // STRIPE ERROR
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
    // GENERAL ERROR
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