import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  headers,
} from "next/headers";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  completeRegistration,
} from "@/lib/auth/completeRegistration";

// ============================================================
// RUNTIME
// ============================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// ENVIRONMENT
// ============================================================

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

const stripeWebhookSecret =
  process.env
    .STRIPE_WEBHOOK_SECRET;

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const storePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID;

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (
  !stripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (
  !supabaseUrl
) {
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

// ============================================================
// CLIENTS
// ============================================================

const stripe =
  new Stripe(
    stripeSecretKey,
    {
      apiVersion:
        "2025-02-24.acacia",
    }
  );

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

// ============================================================
// TYPES
// ============================================================

type StoreOrganisationRow = {
  id:
    string;

  store_enabled?:
    boolean |
    null;

  store_subscription_status?:
    string |
    null;

  store_stripe_customer_id?:
    string |
    null;

  store_stripe_subscription_id?:
    string |
    null;

  store_price_id?:
    string |
    null;

  store_current_period_end?:
    string |
    null;

  store_cancel_at_period_end?:
    boolean |
    null;

  store_enabled_at?:
    string |
    null;
};

type StripeSubscriptionLike =
  Stripe.Subscription & {
    current_period_end?:
      number;

    current_period_start?:
      number;

    items: Stripe.ApiList<
      Stripe.SubscriptionItem
    >;
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
// STORE SUBSCRIPTION?
// ============================================================

function isStoreSubscriptionMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined
) {
  return (
    cleanString(
      metadata
        ?.subscription_type
    ) ===
    "store_addon"
  );
}

// ============================================================
// EXISTING ACCOUNT SUBSCRIPTION?
// ============================================================

function isExistingAccountMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined
) {
  return (
    cleanString(
      metadata
        ?.checkout_type
    ) ===
    "existing_account"
  );
}

// ============================================================
// STORE ACCESS ENABLED
// ============================================================

function storeAccessEnabled(
  status:
    Stripe.Subscription.Status
) {
  return [
    "active",
    "trialing",
  ].includes(
    status
  );
}

// ============================================================
// NORMAL TOTS ACCESS ENABLED
// ============================================================

function totsAccessEnabled(
  status:
    Stripe.Subscription.Status
) {
  return [
    "active",
    "trialing",
  ].includes(
    status
  );
}

// ============================================================
// MAP STRIPE STATUS TO OUR ORGANISATION STATUS
// ============================================================

function mapTotsSubscriptionStatus(
  status:
    Stripe.Subscription.Status
):
  | "active"
  | "cancelled"
  | "expired" {
  if (
    status ===
      "active" ||
    status ===
      "trialing"
  ) {
    return "active";
  }

  if (
    status ===
    "canceled"
  ) {
    return "cancelled";
  }

  return "expired";
}

// ============================================================
// CURRENT PERIOD END
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const typed =
    subscription as
      StripeSubscriptionLike;

  const rootPeriodEnd =
    typed
      .current_period_end;

  if (
    typeof rootPeriodEnd ===
      "number" &&
    rootPeriodEnd >
      0
  ) {
    return new Date(
      rootPeriodEnd *
        1000
    ).toISOString();
  }

  const item =
    typed
      .items
      ?.data?.[0] as
      | (
          Stripe.SubscriptionItem & {
            current_period_end?:
              number;
          }
        )
      | undefined;

  if (
    typeof item
      ?.current_period_end ===
    "number"
  ) {
    return new Date(
      item
        .current_period_end *
        1000
    ).toISOString();
  }

  return null;
}

// ============================================================
// PRICE ID
// ============================================================

function getSubscriptionPriceId(
  subscription:
    Stripe.Subscription
) {
  const item =
    subscription
      .items
      ?.data?.[0];

  return (
    cleanString(
      item
        ?.price
        ?.id
    ) ||
    cleanString(
      storePriceId
    ) ||
    null
  );
}

// ============================================================
// CUSTOMER ID
// ============================================================

function getSubscriptionCustomerId(
  subscription:
    Stripe.Subscription
) {
  if (
    typeof subscription
      .customer ===
    "string"
  ) {
    return subscription.customer;
  }

  return (
    subscription
      .customer
      ?.id ||
    null
  );
}

// ============================================================
// FIND ORGANISATION BY STORE REFERENCES
// ============================================================

async function findStoreOrganisation({
  organisationId,
  subscriptionId,
  customerId,
}: {
  organisationId?:
    string |
    null;

  subscriptionId?:
    string |
    null;

  customerId?:
    string |
    null;
}) {
  const cleanOrganisationId =
    cleanString(
      organisationId
    );

  // ==========================================================
  // ORGANISATION ID
  // ==========================================================

  if (
    cleanOrganisationId
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
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `
        )
        .eq(
          "id",
          cleanOrganisationId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  // ==========================================================
  // SUBSCRIPTION ID
  // ==========================================================

  const cleanSubscriptionId =
    cleanString(
      subscriptionId
    );

  if (
    cleanSubscriptionId
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
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `
        )
        .eq(
          "store_stripe_subscription_id",
          cleanSubscriptionId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  // ==========================================================
  // CUSTOMER ID
  // ==========================================================

  const cleanCustomerId =
    cleanString(
      customerId
    );

  if (
    cleanCustomerId
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
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `
        )
        .eq(
          "store_stripe_customer_id",
          cleanCustomerId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  return null;
}

// ============================================================
// STORE PRODUCT?
// ============================================================

function isStoreSubscription(
  subscription:
    Stripe.Subscription
) {
  if (
    isStoreSubscriptionMetadata(
      subscription.metadata
    )
  ) {
    return true;
  }

  const priceId =
    getSubscriptionPriceId(
      subscription
    );

  if (
    storePriceId &&
    priceId ===
      storePriceId
  ) {
    return true;
  }

  return false;
}

// ============================================================
// SYNC STORE SUBSCRIPTION
// ============================================================

async function syncStoreSubscription(
  subscription:
    Stripe.Subscription
) {
  if (
    !isStoreSubscription(
      subscription
    )
  ) {
    return;
  }

  const metadataOrganisationId =
    cleanString(
      subscription
        .metadata
        ?.organisation_id
    );

  const customerId =
    getSubscriptionCustomerId(
      subscription
    );

  const organisation =
    await findStoreOrganisation({
      organisationId:
        metadataOrganisationId,

      subscriptionId:
        subscription.id,

      customerId,
    });

  if (
    !organisation
  ) {
    throw new Error(
      `Organisation could not be found for Store subscription ${subscription.id}.`
    );
  }

  const enabled =
    storeAccessEnabled(
      subscription.status
    );

  const periodEnd =
    getCurrentPeriodEnd(
      subscription
    );

  const priceId =
    getSubscriptionPriceId(
      subscription
    );

  const payload: Record<
    string,
    unknown
  > = {
    store_enabled:
      enabled,

    store_subscription_status:
      subscription.status,

    store_stripe_subscription_id:
      subscription.id,

    store_stripe_customer_id:
      customerId,

    store_price_id:
      priceId,

    store_current_period_end:
      periodEnd,

    store_cancel_at_period_end:
      subscription
        .cancel_at_period_end ===
      true,
  };

  if (
    enabled &&
    !organisation
      .store_enabled_at
  ) {
    payload
      .store_enabled_at =
      new Date()
        .toISOString();
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update(
        payload
      )
      .eq(
        "id",
        organisation.id
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    "[STORE SUBSCRIPTION] Organisation updated:",
    {
      organisationId:
        organisation.id,

      subscriptionId:
        subscription.id,

      status:
        subscription.status,

      storeEnabled:
        enabled,
    }
  );
}

// ============================================================
// SYNC EXISTING TOTS-OS SUBSCRIPTION
// ============================================================

async function syncExistingAccountSubscription(
  subscription:
    Stripe.Subscription
) {
  if (
    !isExistingAccountMetadata(
      subscription.metadata
    )
  ) {
    return;
  }

  const organisationId =
    cleanString(
      subscription
        .metadata
        ?.organisation_id
    );

  const userId =
    cleanString(
      subscription
        .metadata
        ?.user_id
    );

  const subscriptionTier =
    cleanString(
      subscription
        .metadata
        ?.subscription_tier
    ).toLowerCase();

  const additionalSeatsRaw =
    cleanString(
      subscription
        .metadata
        ?.additional_seats
    );

  const additionalSeats =
    Math.max(
      0,
      Number(
        additionalSeatsRaw ||
          0
      ) || 0
    );

  if (
    !organisationId
  ) {
    throw new Error(
      `Existing account subscription ${subscription.id} is missing organisation_id metadata.`
    );
  }

  const hasAccess =
    totsAccessEnabled(
      subscription.status
    );

  const mappedStatus =
    mapTotsSubscriptionStatus(
      subscription.status
    );

  // ==========================================================
  // UPDATE ORGANISATION
  // ==========================================================

  const {
    error:
      organisationError,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update({
        subscription_status:
          mappedStatus,

        access_status:
          hasAccess
            ? "active"
            : "restricted",
      })
      .eq(
        "id",
        organisationId
      );

  if (
    organisationError
  ) {
    console.error(
      "[TOTS SUBSCRIPTION] Organisation update failed:",
      organisationError
    );

    throw organisationError;
  }

  // ==========================================================
  // UPDATE PROFILE PLAN
  // ==========================================================

  if (
    userId
  ) {
    const profilePayload:
      Record<
        string,
        unknown
      > = {};

    if (
      [
        "standard",
        "professional",
        "elite",
      ].includes(
        subscriptionTier
      )
    ) {
      profilePayload
        .subscription_tier =
        subscriptionTier;
    }

    profilePayload
      .team_seats_allocated =
      additionalSeats;

    const {
      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .update(
          profilePayload
        )
        .eq(
          "id",
          userId
        );

    if (
      profileError
    ) {
      console.error(
        "[TOTS SUBSCRIPTION] Profile update failed:",
        profileError
      );

      throw profileError;
    }
  }

  console.log(
    "[TOTS SUBSCRIPTION] Existing account synced:",
    {
      organisationId,

      userId,

      subscriptionId:
        subscription.id,

      stripeStatus:
        subscription.status,

      totsStatus:
        mappedStatus,

      access:
        hasAccess
          ? "active"
          : "restricted",

      subscriptionTier,

      additionalSeats,
    }
  );
}

// ============================================================
// HANDLE EXISTING ACCOUNT CHECKOUT
// ============================================================

async function handleExistingAccountCheckout(
  session:
    Stripe.Checkout.Session
) {
  const organisationId =
    cleanString(
      session
        .metadata
        ?.organisation_id
    );

  const userId =
    cleanString(
      session
        .metadata
        ?.user_id
    );

  const tier =
    cleanString(
      session
        .metadata
        ?.subscription_tier
    ).toLowerCase();

  const subscriptionId =
    typeof session
      .subscription ===
    "string"
      ? session
          .subscription
      : session
          .subscription
          ?.id ||
        null;

  if (
    !organisationId
  ) {
    throw new Error(
      "Existing-account checkout is missing organisation_id metadata."
    );
  }

  if (
    !userId
  ) {
    throw new Error(
      "Existing-account checkout is missing user_id metadata."
    );
  }

  if (
    !subscriptionId
  ) {
    throw new Error(
      "Existing-account checkout did not contain a Stripe subscription."
    );
  }

  // ==========================================================
  // RETRIEVE ACTUAL SUBSCRIPTION
  // ==========================================================

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  // ==========================================================
  // SYNC SUBSCRIPTION INTO TOTS-OS
  // ==========================================================

  await syncExistingAccountSubscription(
    subscription
  );

  console.log(
    "[TOTS SUBSCRIPTION] Existing beta/account checkout completed:",
    {
      sessionId:
        session.id,

      organisationId,

      userId,

      tier,

      subscriptionId,
    }
  );
}

// ============================================================
// DELETE STORE SUBSCRIPTION
// ============================================================

async function handleStoreSubscriptionDeleted(
  subscription:
    Stripe.Subscription
) {
  if (
    !isStoreSubscription(
      subscription
    )
  ) {
    return;
  }

  const organisation =
    await findStoreOrganisation({
      organisationId:
        cleanString(
          subscription
            .metadata
            ?.organisation_id
        ),

      subscriptionId:
        subscription.id,

      customerId:
        getSubscriptionCustomerId(
          subscription
        ),
    });

  if (
    !organisation
  ) {
    console.warn(
      `[STORE SUBSCRIPTION] Organisation not found for deleted subscription ${subscription.id}.`
    );

    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update({
        store_enabled:
          false,

        store_subscription_status:
          "canceled",

        store_stripe_subscription_id:
          subscription.id,

        store_stripe_customer_id:
          getSubscriptionCustomerId(
            subscription
          ),

        store_price_id:
          getSubscriptionPriceId(
            subscription
          ),

        store_current_period_end:
          getCurrentPeriodEnd(
            subscription
          ),

        store_cancel_at_period_end:
          false,
      })
      .eq(
        "id",
        organisation.id
      );

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// STORE CHECKOUT COMPLETED
// ============================================================

async function handleStoreCheckoutCompleted(
  session:
    Stripe.Checkout.Session
) {
  const organisationId =
    cleanString(
      session
        .metadata
        ?.organisation_id
    );

  const subscriptionId =
    typeof session
      .subscription ===
    "string"
      ? session
          .subscription
      : session
          .subscription
          ?.id ||
        null;

  const customerId =
    typeof session
      .customer ===
    "string"
      ? session
          .customer
      : session
          .customer
          ?.id ||
        null;

  if (
    !organisationId
  ) {
    throw new Error(
      "Store checkout is missing organisation_id metadata."
    );
  }

  if (
    !subscriptionId
  ) {
    throw new Error(
      "Store checkout did not contain a Stripe subscription."
    );
  }

  const {
    error:
      referenceError,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update({
        store_stripe_customer_id:
          customerId,

        store_stripe_subscription_id:
          subscriptionId,

        store_price_id:
          cleanString(
            session
              .metadata
              ?.store_price_id
          ) ||
          storePriceId ||
          null,
      })
      .eq(
        "id",
        organisationId
      );

  if (
    referenceError
  ) {
    throw referenceError;
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  await syncStoreSubscription(
    subscription
  );
}

// ============================================================
// NORMAL NEW REGISTRATION CHECKOUT
// ============================================================

async function handleRegistrationCheckout(
  session:
    Stripe.Checkout.Session
) {
  const registrationId =
    cleanString(
      session
        .metadata
        ?.registration_id
    );

  if (
    !registrationId
  ) {
    return;
  }

  if (
    !session.metadata
  ) {
    throw new Error(
      "Missing Stripe metadata."
    );
  }

  const customerEmail =
    session
      .customer_details
      ?.email ||
    session
      .customer_email;

  if (
    !customerEmail
  ) {
    throw new Error(
      "Missing customer email from Stripe session."
    );
  }

  if (
    session
      .payment_status !==
    "paid"
  ) {
    console.log(
      "[REGISTRATION] Checkout completed but payment not confirmed:",
      session.id
    );

    return;
  }

  await completeRegistration(
    registrationId,
    {
      stripe_session_id:
        session.id,

      stripe_customer_id:
        typeof session
          .customer ===
        "string"
          ? session
              .customer
          : null,

      stripe_subscription_id:
        typeof session
          .subscription ===
        "string"
          ? session
              .subscription
          : null,

      customer_email:
        customerEmail,

      payment_status:
        session
          .payment_status,
    }
  );

  console.log(
    "[REGISTRATION] Registration completed successfully:",
    {
      registrationId,

      stripeSessionId:
        session.id,

      customerEmail,
    }
  );
}

// ============================================================
// INVOICE SUBSCRIPTION ID
// ============================================================

function getInvoiceSubscriptionId(
  invoice:
    Stripe.Invoice
) {
  const invoiceLike =
    invoice as
      Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;

        parent?: {
          subscription_details?: {
            subscription?:
              | string
              | Stripe.Subscription
              | null;
          };
        } | null;
      };

  const legacySubscription =
    invoiceLike.subscription;

  if (
    typeof legacySubscription ===
    "string"
  ) {
    return legacySubscription;
  }

  if (
    legacySubscription &&
    typeof legacySubscription ===
      "object"
  ) {
    return legacySubscription.id;
  }

  const parentSubscription =
    invoiceLike
      .parent
      ?.subscription_details
      ?.subscription;

  if (
    typeof parentSubscription ===
    "string"
  ) {
    return parentSubscription;
  }

  if (
    parentSubscription &&
    typeof parentSubscription ===
      "object"
  ) {
    return parentSubscription.id;
  }

  return null;
}

// ============================================================
// HANDLE INVOICE
// ============================================================

async function handleInvoice(
  invoice:
    Stripe.Invoice
) {
  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice
    );

  if (
    !subscriptionId
  ) {
    return;
  }

  let subscription:
    Stripe.Subscription;

  try {
    subscription =
      await stripe
        .subscriptions
        .retrieve(
          subscriptionId
        );
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
      console.warn(
        `[STRIPE WEBHOOK] Subscription ${subscriptionId} no longer exists.`
      );

      return;
    }

    throw error;
  }

  // ==========================================================
  // STORE SUBSCRIPTION
  // ==========================================================

  if (
    isStoreSubscription(
      subscription
    )
  ) {
    await syncStoreSubscription(
      subscription
    );

    return;
  }

  // ==========================================================
  // EXISTING NORMAL TOTS SUBSCRIPTION
  // ==========================================================

  if (
    isExistingAccountMetadata(
      subscription.metadata
    )
  ) {
    await syncExistingAccountSubscription(
      subscription
    );

    return;
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    NextRequest
) {
  try {
    // ========================================================
    // WEBHOOK SECRET
    // ========================================================

    if (
      !stripeWebhookSecret
    ) {
      console.error(
        "[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET is missing."
      );

      return NextResponse.json(
        {
          error:
            "Stripe webhook secret is not configured.",
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

    // ========================================================
    // RAW BODY
    // ========================================================

    const body =
      await req.text();

    // ========================================================
    // SIGNATURE
    // ========================================================

    const signature =
      (
        await headers()
      ).get(
        "stripe-signature"
      );

    if (
      !signature
    ) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe signature",
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
    // VERIFY EVENT
    // ========================================================

    let event:
      Stripe.Event;

    try {
      event =
        stripe
          .webhooks
          .constructEvent(
            body,
            signature,
            stripeWebhookSecret
          );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "[STRIPE WEBHOOK] Signature verification failed:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature",
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

    console.log(
      `[STRIPE WEBHOOK] Event received: ${event.type} (${event.id})`
    );

    // ========================================================
    // HANDLE EVENT
    // ========================================================

    switch (
      event.type
    ) {
      // ======================================================
      // CHECKOUT COMPLETED
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event
            .data
            .object as
            Stripe.Checkout.Session;

        // ====================================================
        // STORE
        // ====================================================

        if (
          isStoreSubscriptionMetadata(
            session.metadata
          )
        ) {
          await handleStoreCheckoutCompleted(
            session
          );

          break;
        }

        // ====================================================
        // EXISTING / BETA ACCOUNT
        // ====================================================

        if (
          isExistingAccountMetadata(
            session.metadata
          )
        ) {
          await handleExistingAccountCheckout(
            session
          );

          break;
        }

        // ====================================================
        // NEW REGISTRATION
        // ====================================================

        if (
          cleanString(
            session
              .metadata
              ?.registration_id
          )
        ) {
          await handleRegistrationCheckout(
            session
          );

          break;
        }

        console.log(
          `[STRIPE WEBHOOK] Checkout ${session.id} did not match a known checkout type.`
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION CREATED
      // ======================================================

      case "customer.subscription.created": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        if (
          isStoreSubscription(
            subscription
          )
        ) {
          await syncStoreSubscription(
            subscription
          );

          break;
        }

        if (
          isExistingAccountMetadata(
            subscription.metadata
          )
        ) {
          await syncExistingAccountSubscription(
            subscription
          );
        }

        break;
      }

      // ======================================================
      // SUBSCRIPTION UPDATED
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        if (
          isStoreSubscription(
            subscription
          )
        ) {
          await syncStoreSubscription(
            subscription
          );

          break;
        }

        if (
          isExistingAccountMetadata(
            subscription.metadata
          )
        ) {
          await syncExistingAccountSubscription(
            subscription
          );
        }

        break;
      }

      // ======================================================
      // SUBSCRIPTION DELETED
      // ======================================================

      case "customer.subscription.deleted": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        if (
          isStoreSubscription(
            subscription
          )
        ) {
          await handleStoreSubscriptionDeleted(
            subscription
          );

          break;
        }

        if (
          isExistingAccountMetadata(
            subscription.metadata
          )
        ) {
          await syncExistingAccountSubscription(
            subscription
          );
        }

        break;
      }

      // ======================================================
      // INVOICE PAID
      // ======================================================

      case "invoice.paid": {
        const invoice =
          event
            .data
            .object as
            Stripe.Invoice;

        await handleInvoice(
          invoice
        );

        break;
      }

      // ======================================================
      // INVOICE PAYMENT FAILED
      // ======================================================

      case "invoice.payment_failed": {
        const invoice =
          event
            .data
            .object as
            Stripe.Invoice;

        await handleInvoice(
          invoice
        );

        break;
      }

      // ======================================================
      // OTHER EVENTS
      // ======================================================

      default: {
        console.log(
          `[STRIPE WEBHOOK] Ignoring unhandled event: ${event.type}`
        );

        break;
      }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        received:
          true,

        event:
          event.type,

        eventId:
          event.id,
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
      "[STRIPE WEBHOOK] Processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Internal server error",
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