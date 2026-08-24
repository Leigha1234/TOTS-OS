import {
  NextRequest,
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

const rawSupabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const rawSupabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

const rawStripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY
    ?.trim();

const rawStorePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID
    ?.trim();

const rawStoreSubscriptionWebhookSecret =
  process.env
    .STRIPE_STORE_SUBSCRIPTION_WEBHOOK_SECRET
    ?.trim();

// ============================================================
// VALIDATE REQUIRED ENVIRONMENT
//
// Explicit string assignments after validation stop TypeScript
// treating these as string | undefined later in the file.
// ============================================================

if (
  !rawSupabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !rawSupabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (
  !rawStripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (
  !rawStorePriceId
) {
  throw new Error(
    "STRIPE_STORE_ADDON_PRICE_ID is missing"
  );
}

const supabaseUrl:
  string =
  rawSupabaseUrl;

const supabaseServiceRoleKey:
  string =
  rawSupabaseServiceRoleKey;

const stripeSecretKey:
  string =
  rawStripeSecretKey;

const storePriceId:
  string =
  rawStorePriceId;

// ============================================================
// WEBHOOK SECRET
//
// This deliberately remains nullable here.
//
// Unlike the core environment values, we handle a missing
// webhook secret inside POST() so the route can return a
// controlled error rather than crashing module initialisation.
// ============================================================

const storeSubscriptionWebhookSecret:
  string | null =
  rawStoreSubscriptionWebhookSecret ||
  null;

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

type OrganisationLookupRow = {
  id:
    string;

  name?:
    string | null;

  store_stripe_customer_id?:
    string | null;

  store_stripe_subscription_id?:
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
// TIMESTAMP -> ISO
// ============================================================

function timestampToIso(
  timestamp:
    number |
    null |
    undefined
) {
  if (
    typeof timestamp !==
      "number" ||
    !Number.isFinite(
      timestamp
    ) ||
    timestamp <=
      0
  ) {
    return null;
  }

  return new Date(
    timestamp *
      1000
  ).toISOString();
}

// ============================================================
// CUSTOMER ID
// ============================================================

function getCustomerId(
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined
) {
  if (
    typeof value ===
    "string"
  ) {
    return (
      cleanString(
        value
      ) ||
      null
    );
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in
      value
  ) {
    return (
      cleanString(
        value.id
      ) ||
      null
    );
  }

  return null;
}

// ============================================================
// SUBSCRIPTION ID
// ============================================================

function getSubscriptionId(
  value:
    | string
    | Stripe.Subscription
    | null
    | undefined
) {
  if (
    typeof value ===
    "string"
  ) {
    return (
      cleanString(
        value
      ) ||
      null
    );
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in
      value
  ) {
    return (
      cleanString(
        value.id
      ) ||
      null
    );
  }

  return null;
}

// ============================================================
// SUBSCRIPTION PRICE IDS
// ============================================================

function getSubscriptionPriceIds(
  subscription:
    Stripe.Subscription
) {
  return subscription
    .items
    .data
    .map(
      (
        item
      ) =>
        cleanString(
          item
            .price
            ?.id
        )
    )
    .filter(
      (
        priceId
      ):
        priceId is string =>
          Boolean(
            priceId
          )
    );
}

// ============================================================
// PRICE CHECK
//
// SECURITY CRITICAL:
//
// We NEVER enable Store because an organisation simply has a
// Stripe subscription.
//
// The LIVE Stripe subscription must contain the exact:
//
// STRIPE_STORE_ADDON_PRICE_ID
// ============================================================

function subscriptionHasStorePrice(
  subscription:
    Stripe.Subscription
) {
  return getSubscriptionPriceIds(
    subscription
  ).includes(
    storePriceId
  );
}

// ============================================================
// ACTUAL STORE PRICE
// ============================================================

function getStorePriceId(
  subscription:
    Stripe.Subscription
) {
  const item =
    subscription
      .items
      .data
      .find(
        (
          subscriptionItem
        ) =>
          cleanString(
            subscriptionItem
              .price
              ?.id
          ) ===
          storePriceId
      );

  return (
    cleanString(
      item
        ?.price
        ?.id
    ) ||
    null
  );
}

// ============================================================
// ACTIVE ACCESS STATUS
//
// ONLY:
//
// active + correct price
//
// OR:
//
// trialing + correct price
//
// unlocks Store.
// ============================================================

function subscriptionAllowsStoreAccess(
  subscription:
    Stripe.Subscription
) {
  const validStatus =
    [
      "active",
      "trialing",
    ].includes(
      subscription.status
    );

  return (
    validStatus &&
    subscriptionHasStorePrice(
      subscription
    )
  );
}

// ============================================================
// ORGANISATION FROM METADATA
// ============================================================

function getOrganisationIdFromMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined
) {
  return (
    cleanString(
      metadata
        ?.organisation_id
    ) ||
    null
  );
}

// ============================================================
// FIND ORGANISATION BY CUSTOMER
// ============================================================

async function findOrganisationByCustomerId(
  customerId:
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
          store_stripe_customer_id,
          store_stripe_subscription_id
        `
      )
      .eq(
        "store_stripe_customer_id",
        customerId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | OrganisationLookupRow
    | null;
}

// ============================================================
// FIND ORGANISATION BY SUBSCRIPTION
// ============================================================

async function findOrganisationBySubscriptionId(
  subscriptionId:
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
          store_stripe_customer_id,
          store_stripe_subscription_id
        `
      )
      .eq(
        "store_stripe_subscription_id",
        subscriptionId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | OrganisationLookupRow
    | null;
}

// ============================================================
// RESOLVE ORGANISATION
//
// Priority:
//
// 1. Stripe metadata
// 2. Known subscription ID
// 3. Known Stripe customer ID
// ============================================================

async function resolveOrganisationId({
  metadataOrganisationId,
  customerId,
  subscriptionId,
}: {
  metadataOrganisationId?:
    string |
    null;

  customerId?:
    string |
    null;

  subscriptionId?:
    string |
    null;
}) {
  // ==========================================================
  // 1. METADATA
  // ==========================================================

  if (
    metadataOrganisationId
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
          "id"
        )
        .eq(
          "id",
          metadataOrganisationId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data?.id
    ) {
      return String(
        data.id
      );
    }
  }

  // ==========================================================
  // 2. SUBSCRIPTION
  // ==========================================================

  if (
    subscriptionId
  ) {
    const organisation =
      await findOrganisationBySubscriptionId(
        subscriptionId
      );

    if (
      organisation?.id
    ) {
      return String(
        organisation.id
      );
    }
  }

  // ==========================================================
  // 3. CUSTOMER
  // ==========================================================

  if (
    customerId
  ) {
    const organisation =
      await findOrganisationByCustomerId(
        customerId
      );

    if (
      organisation?.id
    ) {
      return String(
        organisation.id
      );
    }
  }

  return null;
}

// ============================================================
// UPDATE STORE ACCESS
// ============================================================

async function updateStoreAccess({
  organisationId,
  enabled,
  status,
  customerId,
  subscriptionId,
  priceId,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: {
  organisationId:
    string;

  enabled:
    boolean;

  status:
    string |
    null;

  customerId:
    string |
    null;

  subscriptionId:
    string |
    null;

  priceId:
    string |
    null;

  currentPeriodEnd:
    string |
    null;

  cancelAtPeriodEnd:
    boolean;
}) {
  const now =
    new Date()
      .toISOString();

  const payload:
    Record<
      string,
      unknown
    > =
    {
      store_enabled:
        enabled,

      store_subscription_status:
        status,

      store_stripe_customer_id:
        customerId,

      store_stripe_subscription_id:
        subscriptionId,

      store_price_id:
        priceId,

      store_current_period_end:
        currentPeriodEnd,

      store_cancel_at_period_end:
        cancelAtPeriodEnd,
    };

  // ==========================================================
  // ENABLED AT
  //
  // Only set when access is actually being enabled.
  // ==========================================================

  if (
    enabled
  ) {
    payload.store_enabled_at =
      now;
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
        organisationId
      );

  if (
    error
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Organisation update failed:",
      {
        organisationId,
        error,
      }
    );

    throw error;
  }

  console.log(
    "[STORE SUBSCRIPTION WEBHOOK] Access updated:",
    {
      organisationId,
      enabled,
      status,
      customerId,
      subscriptionId,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }
  );
}

// ============================================================
// CURRENT PERIOD END
//
// IMPORTANT:
//
// Do NOT access current_period_end on SubscriptionItem.
//
// The Stripe package currently used by the project does not
// type that property on SubscriptionItem.
//
// Some Stripe API versions still expose current_period_end on
// Subscription itself at runtime, so we safely narrow ONLY the
// subscription object.
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const subscriptionWithPeriod =
    subscription as
      Stripe.Subscription & {
        current_period_end?:
          number |
          null;
      };

  return timestampToIso(
    subscriptionWithPeriod
      .current_period_end
  );
}

// ============================================================
// SYNC SUBSCRIPTION
//
// This is the central source of truth.
//
// Every subscription event eventually comes through here.
// ============================================================

async function syncSubscription(
  subscription:
    Stripe.Subscription
) {
  // ==========================================================
  // REFERENCES
  // ==========================================================

  const subscriptionId:
    string =
    subscription.id;

  const customerId =
    getCustomerId(
      subscription.customer
    );

  const metadataOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  // ==========================================================
  // FIND TOTS ORGANISATION
  // ==========================================================

  const organisationId =
    await resolveOrganisationId({
      metadataOrganisationId,

      customerId,

      subscriptionId,
    });

  if (
    !organisationId
  ) {
    throw new Error(
      `Could not find TOTS organisation for Store subscription ${subscription.id}.`
    );
  }

  // ==========================================================
  // VERIFY CORRECT STORE PRODUCT
  // ==========================================================

  const hasCorrectPrice =
    subscriptionHasStorePrice(
      subscription
    );

  const actualPriceIds =
    getSubscriptionPriceIds(
      subscription
    );

  if (
    !hasCorrectPrice
  ) {
    console.warn(
      "[STORE SUBSCRIPTION WEBHOOK] Subscription does not contain Store price:",
      {
        organisationId,

        subscriptionId:
          subscription.id,

        expectedPriceId:
          storePriceId,

        actualPriceIds,
      }
    );
  }

  // ==========================================================
  // ACCESS
  // ==========================================================

  const enabled =
    subscriptionAllowsStoreAccess(
      subscription
    );

  // ==========================================================
  // EXACT PRICE
  // ==========================================================

  const actualPriceId =
    getStorePriceId(
      subscription
    );

  // ==========================================================
  // UPDATE ORGANISATION
  //
  // Wrong product = enabled false and priceId null.
  // ==========================================================

  await updateStoreAccess({
    organisationId,

    enabled,

    status:
      subscription.status,

    customerId,

    subscriptionId,

    priceId:
      hasCorrectPrice
        ? actualPriceId
        : null,

    currentPeriodEnd:
      getCurrentPeriodEnd(
        subscription
      ),

    cancelAtPeriodEnd:
      subscription
        .cancel_at_period_end ===
      true,
  });

  return {
    organisationId,

    enabled,

    correctProduct:
      hasCorrectPrice,
  };
}

// ============================================================
// CHECKOUT COMPLETED
// ============================================================

async function handleCheckoutCompleted(
  session:
    Stripe.Checkout.Session
) {
  // ==========================================================
  // ONLY HANDLE STORE ADD-ON CHECKOUT
  // ==========================================================

  const subscriptionType =
    cleanString(
      session.metadata
        ?.subscription_type
    );

  if (
    subscriptionType !==
    "store_addon"
  ) {
    console.log(
      "[STORE SUBSCRIPTION WEBHOOK] Checkout ignored because it is not Store add-on:",
      session.id
    );

    return;
  }

  // ==========================================================
  // VERIFY PRICE METADATA
  // ==========================================================

  const metadataPriceId =
    cleanString(
      session.metadata
        ?.store_price_id
    );

  if (
    metadataPriceId &&
    metadataPriceId !==
      storePriceId
  ) {
    throw new Error(
      `Store checkout price mismatch for session ${session.id}.`
    );
  }

  // ==========================================================
  // SUBSCRIPTION
  // ==========================================================

  const subscriptionId =
    getSubscriptionId(
      session.subscription
    );

  if (
    !subscriptionId
  ) {
    throw new Error(
      `Checkout ${session.id} did not contain a subscription ID.`
    );
  }

  // ==========================================================
  // LOAD LIVE SUBSCRIPTION
  // ==========================================================

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  // ==========================================================
  // VERIFY PRODUCT FROM STRIPE
  //
  // Metadata alone is NOT enough.
  // ==========================================================

  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    throw new Error(
      `Subscription ${subscription.id} does not contain the configured Store price.`
    );
  }

  // ==========================================================
  // ORGANISATION METADATA
  // ==========================================================

  const checkoutOrganisationId =
    getOrganisationIdFromMetadata(
      session.metadata
    );

  const subscriptionOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  // ==========================================================
  // VERIFY METADATA MATCH
  // ==========================================================

  if (
    checkoutOrganisationId &&
    subscriptionOrganisationId &&
    checkoutOrganisationId !==
      subscriptionOrganisationId
  ) {
    throw new Error(
      `Organisation metadata mismatch for Store checkout ${session.id}.`
    );
  }

  // ==========================================================
  // SYNC
  // ==========================================================

  await syncSubscription(
    subscription
  );
}

// ============================================================
// INVOICE SUBSCRIPTION ID
//
// Stripe Invoice typings differ across SDK/API combinations.
// Isolate the compatibility cast here.
// ============================================================

function getInvoiceSubscriptionId(
  invoice:
    Stripe.Invoice
) {
  const invoiceWithSubscription =
    invoice as
      Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;
      };

  return getSubscriptionId(
    invoiceWithSubscription
      .subscription
  );
}

// ============================================================
// INVOICE PAYMENT FAILED
// ============================================================

async function handleInvoicePaymentFailed(
  invoice:
    Stripe.Invoice
) {
  const customerId =
    getCustomerId(
      invoice.customer
    );

  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice
    );

  // ==========================================================
  // IF SUBSCRIPTION EXISTS, LIVE STRIPE STATUS WINS
  // ==========================================================

  if (
    subscriptionId
  ) {
    try {
      const subscription =
        await stripe
          .subscriptions
          .retrieve(
            subscriptionId
          );

      // ======================================================
      // ONLY STORE SUBSCRIPTIONS
      // ======================================================

      if (
        subscriptionHasStorePrice(
          subscription
        )
      ) {
        await syncSubscription(
          subscription
        );

        return;
      }
    } catch (
      error
    ) {
      console.warn(
        "[STORE SUBSCRIPTION WEBHOOK] Could not retrieve failed invoice subscription:",
        error
      );
    }
  }

  // ==========================================================
  // FALLBACK CUSTOMER LOOKUP
  // ==========================================================

  if (
    !customerId
  ) {
    return;
  }

  const organisation =
    await findOrganisationByCustomerId(
      customerId
    );

  if (
    !organisation?.id
  ) {
    return;
  }

  // ==========================================================
  // FAIL CLOSED
  //
  // We cannot confirm a healthy subscription, therefore Store
  // access stays disabled.
  // ==========================================================

  await updateStoreAccess({
    organisationId:
      String(
        organisation.id
      ),

    enabled:
      false,

    status:
      "past_due",

    customerId,

    subscriptionId:
      cleanString(
        organisation
          .store_stripe_subscription_id
      ) ||
      null,

    /*
     * This is the important TypeScript fix.
     *
     * storePriceId is now guaranteed to be `string`, not
     * `string | undefined`.
     */
    priceId:
      storePriceId,

    currentPeriodEnd:
      null,

    cancelAtPeriodEnd:
      false,
  });
}

// ============================================================
// INVOICE PAID
// ============================================================

async function handleInvoicePaid(
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

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  // ==========================================================
  // ONLY STORE PRODUCT
  // ==========================================================

  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    return;
  }

  await syncSubscription(
    subscription
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    NextRequest
) {
  // ==========================================================
  // WEBHOOK SECRET
  // ==========================================================

  if (
    !storeSubscriptionWebhookSecret
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] STRIPE_STORE_SUBSCRIPTION_WEBHOOK_SECRET is missing"
    );

    return NextResponse.json(
      {
        error:
          "Store subscription webhook secret is not configured.",
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

  // ==========================================================
  // SIGNATURE
  // ==========================================================

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (
    !signature
  ) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
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

  // ==========================================================
  // RAW BODY
  // ==========================================================

  let rawBody:
    string;

  try {
    rawBody =
      await req.text();
  } catch (
    error
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Could not read request body:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read webhook body.",
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

  // ==========================================================
  // VERIFY STRIPE SIGNATURE
  // ==========================================================

  let event:
    Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        storeSubscriptionWebhookSecret
      );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[STORE SUBSCRIPTION WEBHOOK] Signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? `Invalid webhook signature: ${error.message}`
            : "Invalid webhook signature.",
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
    "[STORE SUBSCRIPTION WEBHOOK] Event received:",
    {
      id:
        event.id,

      type:
        event.type,
    }
  );

  // ==========================================================
  // HANDLE EVENT
  // ==========================================================

  try {
    switch (
      event.type
    ) {
      // ======================================================
      // CHECKOUT COMPLETED
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await handleCheckoutCompleted(
          session
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION CREATED
      // ======================================================

      case "customer.subscription.created": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        /*
         * Only a real Store price subscription is allowed to
         * create Store access.
         */

        if (
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          await syncSubscription(
            subscription
          );
        } else {
          console.log(
            `[STORE SUBSCRIPTION WEBHOOK] Ignoring non-Store subscription ${subscription.id}.`
          );
        }

        break;
      }

      // ======================================================
      // SUBSCRIPTION UPDATED
      //
      // Handles:
      //
      // active
      // trialing
      // past_due
      // unpaid
      // paused
      // cancel_at_period_end
      // etc.
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        const organisation =
          await findOrganisationBySubscriptionId(
            subscription.id
          );

        /*
         * Sync if:
         *
         * - we already know this as an organisation's Store
         *   subscription
         *
         * OR
         *
         * - the live Stripe subscription contains the Store
         *   product.
         */

        if (
          organisation ||
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          await syncSubscription(
            subscription
          );
        }

        break;
      }

      // ======================================================
      // SUBSCRIPTION DELETED
      //
      // syncSubscription sees status=canceled and therefore
      // disables Store.
      // ======================================================

      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        const organisation =
          await findOrganisationBySubscriptionId(
            subscription.id
          );

        if (
          organisation ||
          subscriptionHasStorePrice(
            subscription
          )
        ) {
          await syncSubscription(
            subscription
          );
        }

        break;
      }

      // ======================================================
      // INVOICE PAYMENT FAILED
      // ======================================================

      case "invoice.payment_failed": {
        const invoice =
          event.data.object as
            Stripe.Invoice;

        await handleInvoicePaymentFailed(
          invoice
        );

        break;
      }

      // ======================================================
      // INVOICE PAID
      //
      // Important for recovering Store access after a failed
      // renewal is later paid.
      // ======================================================

      case "invoice.paid": {
        const invoice =
          event.data.object as
            Stripe.Invoice;

        await handleInvoicePaid(
          invoice
        );

        break;
      }

      // ======================================================
      // OTHER EVENTS
      // ======================================================

      default: {
        console.log(
          `[STORE SUBSCRIPTION WEBHOOK] Ignoring ${event.type}`
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

        eventId:
          event.id,

        type:
          event.type,
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
      "[STORE SUBSCRIPTION WEBHOOK] Processing failed:",
      {
        eventId:
          event.id,

        type:
          event.type,

        error,
      }
    );

    /*
     * Return a 500 deliberately.
     *
     * Stripe will then retry the webhook instead of assuming
     * the subscription update was successfully processed.
     */

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Store subscription webhook failed.",

        eventId:
          event.id,

        type:
          event.type,
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