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
    ?.trim();

const storeSubscriptionWebhookSecret =
  process.env
    .STRIPE_STORE_SUBSCRIPTION_WEBHOOK_SECRET
    ?.trim();

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

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

if (
  !stripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (
  !storePriceId
) {
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

function timestampToIso(
  timestamp:
    number |
    null |
    undefined
) {
  if (
    !timestamp
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
    string |
    Stripe.Customer |
    Stripe.DeletedCustomer |
    null
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in value
  ) {
    return value.id;
  }

  return null;
}

// ============================================================
// SUBSCRIPTION ID
// ============================================================

function getSubscriptionId(
  value:
    string |
    Stripe.Subscription |
    null
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    value &&
    typeof value ===
      "object" &&
    "id" in value
  ) {
    return value.id;
  }

  return null;
}

// ============================================================
// PRICE CHECK
//
// We never enable Store simply because an organisation has
// some Stripe subscription.
//
// The subscription MUST contain the exact Store £39 price.
// ============================================================

function subscriptionHasStorePrice(
  subscription:
    Stripe.Subscription
) {
  return subscription
    .items
    .data
    .some(
      (
        item
      ) =>
        item.price.id ===
        storePriceId
    );
}

// ============================================================
// ACTIVE ACCESS STATUS
// ============================================================

function subscriptionAllowsStoreAccess(
  subscription:
    Stripe.Subscription
) {
  if (
    !subscriptionHasStorePrice(
      subscription
    )
  ) {
    return false;
  }

  return [
    "active",
    "trialing",
  ].includes(
    subscription.status
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
  return cleanString(
    metadata
      ?.organisation_id
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

  return data;
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

  return data;
}

// ============================================================
// RESOLVE ORGANISATION
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
  // 2. SUBSCRIPTION ID
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
  // 3. CUSTOMER ID
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
// GET SUBSCRIPTION CURRENT PERIOD END
//
// Depending on Stripe typings/API version this property can
// live on the subscription itself.
//
// We keep this isolated so it is easy to adjust later.
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const subscriptionLike =
    subscription as
      Stripe.Subscription & {
        current_period_end?:
          number |
          null;
      };

  return timestampToIso(
    subscriptionLike
      .current_period_end
  );
}

// ============================================================
// SYNC SUBSCRIPTION
// ============================================================

async function syncSubscription(
  subscription:
    Stripe.Subscription
) {
  const subscriptionId =
    subscription.id;

  const customerId =
    getCustomerId(
      subscription.customer
    );

  const metadataOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  const organisationId =
    await resolveOrganisationId({
      metadataOrganisationId:
        metadataOrganisationId ||
        null,

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
  // CRITICAL SECURITY CHECK
  // ==========================================================

  const hasCorrectPrice =
    subscriptionHasStorePrice(
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

        actualPriceIds:
          subscription.items.data.map(
            (
              item
            ) =>
              item.price.id
          ),
      }
    );
  }

  const enabled =
    subscriptionAllowsStoreAccess(
      subscription
    );

  const actualPrice =
    subscription.items.data.find(
      (
        item
      ) =>
        item.price.id ===
        storePriceId
    )?.price.id ||
    null;

  await updateStoreAccess({
    organisationId,

    enabled,

    status:
      subscription.status,

    customerId,

    subscriptionId:
      subscription.id,

    priceId:
      actualPrice,

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
  // ONLY STORE ADD-ON CHECKOUT
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
  // EXPECTED PRICE METADATA
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

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  // ==========================================================
  // VERIFY PRICE FROM STRIPE ITSELF
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

  const metadataOrganisationId =
    getOrganisationIdFromMetadata(
      session.metadata
    );

  const subscriptionOrganisationId =
    getOrganisationIdFromMetadata(
      subscription.metadata
    );

  // ==========================================================
  // CHECK METADATA MATCHES
  // ==========================================================

  if (
    metadataOrganisationId &&
    subscriptionOrganisationId &&
    metadataOrganisationId !==
      subscriptionOrganisationId
  ) {
    throw new Error(
      `Organisation metadata mismatch for Store checkout ${session.id}.`
    );
  }

  await syncSubscription(
    subscription
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

  let subscriptionId:
    string |
    null =
    null;

  const invoiceLike =
    invoice as
      Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;
      };

  subscriptionId =
    getSubscriptionId(
      invoiceLike.subscription ??
      null
    );

  // ==========================================================
  // IF WE CAN RETRIEVE SUBSCRIPTION, STRIPE STATUS REMAINS
  // THE SOURCE OF TRUTH.
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

      if (
        subscriptionHasStorePrice(
          subscription
        )
      ) {
        await syncSubscription(
          subscription
        );
      }

      return;
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

    priceId:
      storePriceId,

    currentPeriodEnd:
      null,

    cancelAtPeriodEnd:
      false,
  });
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
          "Invalid webhook signature.",
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
  // HANDLE EVENTS
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

        if (
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
      // SUBSCRIPTION UPDATED
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event.data.object as
            Stripe.Subscription;

        /*
         * If this is the known Store subscription OR contains
         * the Store price, sync it.
         */

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
      // SUBSCRIPTION DELETED
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
      // Useful for recovering from past_due when Stripe later
      // successfully collects payment.
      // ======================================================

      case "invoice.paid": {
        const invoice =
          event.data.object as
            Stripe.Invoice;

        const invoiceLike =
          invoice as
            Stripe.Invoice & {
              subscription?:
                | string
                | Stripe.Subscription
                | null;
            };

        const subscriptionId =
          getSubscriptionId(
            invoiceLike
              .subscription ??
            null
          );

        if (
          subscriptionId
        ) {
          const subscription =
            await stripe
              .subscriptions
              .retrieve(
                subscriptionId
              );

          if (
            subscriptionHasStorePrice(
              subscription
            )
          ) {
            await syncSubscription(
              subscription
            );
          }
        }

        break;
      }

      // ======================================================
      // IGNORE EVERYTHING ELSE
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
     * Return 500 so Stripe retries the event.
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