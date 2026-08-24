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
// ENABLED SUBSCRIPTION STATUS
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

  const itemPeriodEnd =
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
    typeof itemPeriodEnd
      ?.current_period_end ===
      "number"
  ) {
    return new Date(
      itemPeriodEnd
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
  // ==========================================================
  // METADATA ORGANISATION ID
  // ==========================================================

  const cleanOrganisationId =
    cleanString(
      organisationId
    );

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
// IS THIS ACTUALLY THE STORE PRODUCT?
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
  // ==========================================================
  // IGNORE NORMAL TOTS SUBSCRIPTION
  // ==========================================================

  if (
    !isStoreSubscription(
      subscription
    )
  ) {
    console.log(
      `[STORE SUBSCRIPTION] Ignoring non-store subscription ${subscription.id}.`
    );

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
    console.error(
      "[STORE SUBSCRIPTION] Could not find organisation for subscription:",
      {
        subscriptionId:
          subscription.id,

        customerId,

        metadataOrganisationId,
      }
    );

    throw new Error(
      `Organisation could not be found for Store subscription ${subscription.id}.`
    );
  }

  // ==========================================================
  // ACCESS
  // ==========================================================

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

  // ==========================================================
  // UPDATE PAYLOAD
  // ==========================================================

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

  // ==========================================================
  // FIRST ACTIVATION DATE
  // ==========================================================

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
    console.error(
      "[STORE SUBSCRIPTION] Organisation sync failed:",
      error
    );

    throw error;
  }

  console.log(
    "[STORE SUBSCRIPTION] Organisation updated:",
    {
      organisationId:
        organisation.id,

      subscriptionId:
        subscription.id,

      customerId,

      status:
        subscription.status,

      storeEnabled:
        enabled,

      cancelAtPeriodEnd:
        subscription
          .cancel_at_period_end,
    }
  );
}

// ============================================================
// DISABLE DELETED STORE SUBSCRIPTION
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

  console.log(
    `[STORE SUBSCRIPTION] Store disabled for organisation ${organisation.id}.`
  );
}

// ============================================================
// HANDLE STORE CHECKOUT
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

  // ==========================================================
  // SAVE REFERENCES IMMEDIATELY
  // ==========================================================

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

  // ==========================================================
  // RETRIEVE SUBSCRIPTION
  // ==========================================================

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId
      );

  // ==========================================================
  // SYNC LIVE STATUS
  // ==========================================================

  await syncStoreSubscription(
    subscription
  );

  console.log(
    "[STORE SUBSCRIPTION] Checkout completed:",
    {
      organisationId,

      sessionId:
        session.id,

      subscriptionId,

      customerId,
    }
  );
}

// ============================================================
// HANDLE NORMAL TOTS REGISTRATION
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

  // ==========================================================
  // NOT A REGISTRATION CHECKOUT
  // ==========================================================

  if (
    !registrationId
  ) {
    console.log(
      `[REGISTRATION] Checkout ${session.id} has no registration_id. Ignoring as registration.`
    );

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

  // ==========================================================
  // PAYMENT
  // ==========================================================

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

  // ==========================================================
  // CREATE ACCOUNT
  // ==========================================================

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
// GET INVOICE SUBSCRIPTION ID
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
// HANDLE INVOICE EVENT
// ============================================================

async function handleStoreInvoice(
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
    console.log(
      `[STORE SUBSCRIPTION] Invoice ${invoice.id} has no subscription.`
    );

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
        `[STORE SUBSCRIPTION] Subscription ${subscriptionId} no longer exists.`
      );

      return;
    }

    throw error;
  }

  if (
    !isStoreSubscription(
      subscription
    )
  ) {
    return;
  }

  await syncStoreSubscription(
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
        // STORE ADD-ON
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
        // NORMAL TOTS-OS REGISTRATION
        // ====================================================

        if (
          cleanString(
            session
              .metadata
              ?.registration_id
          )
        ) {
          try {
            await handleRegistrationCheckout(
              session
            );
          } catch (
            registrationError
          ) {
            console.error(
              "[REGISTRATION] Failed to complete registration after payment:",
              registrationError
            );

            throw registrationError;
          }
        } else {
          console.log(
            `[STRIPE WEBHOOK] Checkout ${session.id} is neither a Store add-on nor registration checkout.`
          );
        }

        break;
      }

      // ======================================================
      // STORE SUBSCRIPTION CREATED
      // ======================================================

      case "customer.subscription.created": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await syncStoreSubscription(
          subscription
        );

        break;
      }

      // ======================================================
      // STORE SUBSCRIPTION UPDATED
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await syncStoreSubscription(
          subscription
        );

        break;
      }

      // ======================================================
      // STORE SUBSCRIPTION DELETED
      // ======================================================

      case "customer.subscription.deleted": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await handleStoreSubscriptionDeleted(
          subscription
        );

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

        await handleStoreInvoice(
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

        await handleStoreInvoice(
          invoice
        );

        break;
      }

      // ======================================================
      // OTHER STRIPE EVENTS
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

    /*
     * Returning 500 here is deliberate.
     *
     * If a database update fails after Stripe has successfully
     * charged somebody, Stripe will retry the webhook.
     */

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