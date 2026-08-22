import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT HELPER
// ============================================================

function requireEnv(
  name: string
): string {
  const value =
    process.env[name];

  if (
    !value ||
    !value.trim()
  ) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value.trim();
}

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  );

const supabaseServiceRoleKey =
  requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

const stripeSecretKey =
  requireEnv(
    "STRIPE_SECRET_KEY"
  );

const stripeWebhookSecret =
  requireEnv(
    "STRIPE_STORE_WEBHOOK_SECRET"
  );

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

type StoreOrderRow = {
  id: string;

  organisation_id:
    string;

  order_number:
    string;

  customer_name:
    string | null;

  customer_email:
    string | null;

  customer_phone:
    string | null;

  subtotal:
    number | string;

  discount_amount:
    number | string;

  shipping_amount:
    number | string;

  total:
    number | string;

  payment_status:
    string;

  fulfilment_status:
    string;

  shipping_address:
    Record<
      string,
      unknown
    > | null;

  created_at:
    string;

  updated_at:
    string;
};

type StoreOrderItemRow = {
  id: string;

  order_id:
    string;

  product_id:
    string | null;

  product_name:
    string;

  sku:
    string | null;

  quantity:
    number;

  unit_price:
    number | string;

  total:
    number | string;

  created_at:
    string;
};

type StoreProductRow = {
  id: string;

  organisation_id:
    string;

  name:
    string;

  stock:
    number;

  inventory_quantity:
    number;

  track_inventory:
    boolean;

  is_active:
    boolean;

  status:
    string;
};

// ============================================================
// HELPERS
// ============================================================

function asString(
  value:
    | string
    | null
    | undefined
) {
  return typeof value ===
      "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function safeInteger(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.floor(
    number
  );
}

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return number;
}

// ============================================================
// SHIPPING ADDRESS
// ============================================================

function getShippingAddress(
  session:
    Stripe.Checkout.Session
):
  | Record<
      string,
      unknown
    >
  | null {
  const collectedShipping =
    session
      .collected_information
      ?.shipping_details ??
    null;

  /*
   * Stripe's Checkout Session typings have changed across
   * API versions. Use collected_information first and then
   * safely check the older shipping_details property.
   */
  const legacyShipping =
    (
      session as Stripe.Checkout.Session & {
        shipping_details?:
          Stripe.Checkout.Session.ShippingDetails | null;
      }
    ).shipping_details ??
    null;

  const shipping =
    collectedShipping ??
    legacyShipping;

  if (
    !shipping
  ) {
    return null;
  }

  return {
    name:
      shipping.name ??
      null,

    address:
      shipping.address
        ? {
            line1:
              shipping.address
                .line1 ??
              null,

            line2:
              shipping.address
                .line2 ??
              null,

            city:
              shipping.address
                .city ??
              null,

            state:
              shipping.address
                .state ??
              null,

            postal_code:
              shipping.address
                .postal_code ??
              null,

            country:
              shipping.address
                .country ??
              null,
          }
        : null,
  };
}

// ============================================================
// CUSTOMER DETAILS
// ============================================================

function getCustomerName(
  session:
    Stripe.Checkout.Session
) {
  const legacyShipping =
    (
      session as Stripe.Checkout.Session & {
        shipping_details?:
          Stripe.Checkout.Session.ShippingDetails | null;
      }
    ).shipping_details;

  return (
    asString(
      session
        .customer_details
        ?.name
    ) ||
    asString(
      session
        .collected_information
        ?.shipping_details
        ?.name
    ) ||
    asString(
      legacyShipping
        ?.name
    )
  );
}

function getCustomerEmail(
  session:
    Stripe.Checkout.Session
) {
  return (
    asString(
      session
        .customer_details
        ?.email
    ) ||
    asString(
      session
        .customer_email
    )
  );
}

function getCustomerPhone(
  session:
    Stripe.Checkout.Session
) {
  return asString(
    session
      .customer_details
      ?.phone
  );
}

// ============================================================
// GET ORDER
// ============================================================

async function getOrder(
  orderId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .select("*")
      .eq(
        "id",
        orderId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | StoreOrderRow
    | null;
}

// ============================================================
// GET ORDER ITEMS
// ============================================================

async function getOrderItems(
  orderId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_order_items"
      )
      .select("*")
      .eq(
        "order_id",
        orderId
      );

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    []
  ) as StoreOrderItemRow[];
}

// ============================================================
// REDUCE STOCK
// ============================================================

async function reduceOrderStock(
  order:
    StoreOrderRow
) {
  const items =
    await getOrderItems(
      order.id
    );

  for (
    const item of items
  ) {
    // Product may have been deleted after ordering.
    if (
      !item.product_id
    ) {
      continue;
    }

    const {
      data:
        productData,
      error:
        productError,
    } =
      await supabaseAdmin
        .from(
          "store_products"
        )
        .select(
          `
            id,
            organisation_id,
            name,
            stock,
            inventory_quantity,
            track_inventory,
            is_active,
            status
          `
        )
        .eq(
          "id",
          item.product_id
        )
        .eq(
          "organisation_id",
          order.organisation_id
        )
        .maybeSingle();

    if (
      productError
    ) {
      console.error(
        `Could not load product ${item.product_id} for stock adjustment:`,
        productError
      );

      throw productError;
    }

    if (
      !productData
    ) {
      console.warn(
        `Product ${item.product_id} no longer exists.`
      );

      continue;
    }

    const product =
      productData as StoreProductRow;

    // Services / digital products / unlimited inventory.
    if (
      product.track_inventory ===
      false
    ) {
      console.log(
        `Skipping stock reduction for ${product.name} because inventory tracking is disabled.`
      );

      continue;
    }

    const quantityPurchased =
      Math.max(
        0,
        safeInteger(
          item.quantity,
          0
        )
      );

    if (
      quantityPurchased <=
      0
    ) {
      continue;
    }

    const currentInventory =
      Math.max(
        0,
        safeInteger(
          product.inventory_quantity,
          0
        )
      );

    const currentStock =
      Math.max(
        0,
        safeInteger(
          product.stock,
          currentInventory
        )
      );

    const newInventory =
      Math.max(
        0,
        currentInventory -
          quantityPurchased
      );

    const newStock =
      Math.max(
        0,
        currentStock -
          quantityPurchased
      );

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "store_products"
        )
        .update({
          inventory_quantity:
            newInventory,

          stock:
            newStock,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          product.id
        )
        .eq(
          "organisation_id",
          order.organisation_id
        );

    if (
      updateError
    ) {
      console.error(
        `Stock reduction failed for ${product.name}:`,
        updateError
      );

      throw updateError;
    }

    console.log(
      `Reduced ${product.name} inventory by ${quantityPurchased}. New inventory: ${newInventory}`
    );
  }
}

// ============================================================
// COMPLETE ORDER
// ============================================================

async function completeStoreOrder(
  session:
    Stripe.Checkout.Session
) {
  // ==========================================================
  // ORDER ID
  // ==========================================================

  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    console.warn(
      "Stripe Checkout session has no TOTS order_id metadata:",
      session.id
    );

    return;
  }

  // ==========================================================
  // LOAD ORDER
  // ==========================================================

  const order =
    await getOrder(
      orderId
    );

  if (
    !order
  ) {
    console.error(
      "TOTS store order not found:",
      orderId
    );

    return;
  }

  // ==========================================================
  // IDEMPOTENCY
  //
  // Stripe retries webhook events.
  //
  // Never reduce stock twice for the same paid order.
  // ==========================================================

  if (
    order.payment_status ===
    "paid"
  ) {
    console.log(
      `Order ${order.order_number} is already paid. Duplicate webhook ignored.`
    );

    return;
  }

  // ==========================================================
  // CHECK PAYMENT
  // ==========================================================

  if (
    session.payment_status !==
    "paid"
  ) {
    console.log(
      `Checkout session ${session.id} completed but payment status is ${session.payment_status}.`
    );

    return;
  }

  // ==========================================================
  // CUSTOMER DETAILS
  // ==========================================================

  const customerName =
    getCustomerName(
      session
    ) ||
    order.customer_name;

  const customerEmail =
    getCustomerEmail(
      session
    ) ||
    order.customer_email;

  const customerPhone =
    getCustomerPhone(
      session
    ) ||
    order.customer_phone;

  const shippingAddress =
    getShippingAddress(
      session
    ) ||
    order.shipping_address;

  // ==========================================================
  // STRIPE TOTAL
  //
  // Stripe amount_total is in pence.
  // ==========================================================

  const stripeTotal =
    typeof session.amount_total ===
      "number"
      ? session.amount_total /
        100
      : safeNumber(
          order.total,
          0
        );

  // ==========================================================
  // REDUCE STOCK FIRST
  //
  // We only mark the order paid after inventory succeeds.
  //
  // This means if Supabase fails while reducing inventory,
  // Stripe can retry the webhook instead of leaving us with
  // a paid order whose stock was never changed.
  // ==========================================================

  await reduceOrderStock(
    order
  );

  // ==========================================================
  // UPDATE ORDER
  // ==========================================================

  const {
    error:
      updateOrderError,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        customer_name:
          customerName,

        customer_email:
          customerEmail,

        customer_phone:
          customerPhone,

        shipping_address:
          shippingAddress,

        total:
          stripeTotal,

        payment_status:
          "paid",

        fulfilment_status:
          order.fulfilment_status ||
          "new",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (
    updateOrderError
  ) {
    throw updateOrderError;
  }

  console.log(
    `TOTS store order ${order.order_number} marked paid and inventory updated.`
  );
}

// ============================================================
// ASYNC PAYMENT FAILURE
// ============================================================

async function markOrderPaymentFailed(
  session:
    Stripe.Checkout.Session
) {
  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "pending",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    `Store order ${orderId} async payment failed.`
  );
}

// ============================================================
// PAYMENT INTENT CANCELLED
// ============================================================

async function handlePaymentIntentCancelled(
  paymentIntent:
    Stripe.PaymentIntent
) {
  const orderId =
    asString(
      paymentIntent
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "pending",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    `PaymentIntent cancelled for store order ${orderId}.`
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  // ==========================================================
  // STRIPE SIGNATURE
  // ==========================================================

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (
    !signature
  ) {
    console.error(
      "Stripe webhook received without stripe-signature header."
    );

    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
      },
      {
        status: 400,
      }
    );
  }

  // ==========================================================
  // RAW BODY
  //
  // IMPORTANT:
  // Do NOT use req.json().
  //
  // Stripe requires the untouched request body in order to
  // validate the webhook signature.
  // ==========================================================

  let body:
    string;

  try {
    body =
      await req.text();
  } catch (
    error: unknown
  ) {
    console.error(
      "Could not read Stripe webhook body:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read webhook body.",
      },
      {
        status: 400,
      }
    );
  }

  // ==========================================================
  // VERIFY STRIPE EVENT
  // ==========================================================

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
    error: unknown
  ) {
    console.error(
      "Store Stripe webhook signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? `Webhook signature verification failed: ${error.message}`
            : "Invalid webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

  console.log(
    `[TOTS STORE WEBHOOK] Received ${event.type} (${event.id})`
  );

  // ==========================================================
  // HANDLE EVENT
  // ==========================================================

  try {
    switch (
      event.type
    ) {
      // ======================================================
      // SUCCESSFUL CHECKOUT
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event
            .data
            .object as Stripe.Checkout.Session;

        await completeStoreOrder(
          session
        );

        break;
      }

      // ======================================================
      // ASYNC PAYMENT SUCCESS
      //
      // Useful for payment methods that confirm after
      // checkout.session.completed.
      // ======================================================

      case "checkout.session.async_payment_succeeded": {
        const session =
          event
            .data
            .object as Stripe.Checkout.Session;

        await completeStoreOrder(
          session
        );

        break;
      }

      // ======================================================
      // ASYNC PAYMENT FAILURE
      // ======================================================

      case "checkout.session.async_payment_failed": {
        const session =
          event
            .data
            .object as Stripe.Checkout.Session;

        await markOrderPaymentFailed(
          session
        );

        break;
      }

      // ======================================================
      // PAYMENT INTENT CANCELLED
      // ======================================================

      case "payment_intent.canceled": {
        const paymentIntent =
          event
            .data
            .object as Stripe.PaymentIntent;

        await handlePaymentIntentCancelled(
          paymentIntent
        );

        break;
      }

      // ======================================================
      // EVERYTHING ELSE
      // ======================================================

      default: {
        console.log(
          `[TOTS STORE WEBHOOK] Ignoring unhandled event: ${event.type}`
        );

        break;
      }
    }

    // ========================================================
    // SUCCESS RESPONSE
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
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    /*
     * Returning HTTP 500 tells Stripe that processing failed.
     *
     * Stripe will then retry delivery, which is useful if
     * Supabase or another dependency temporarily fails.
     */

    console.error(
      `[TOTS STORE WEBHOOK] Processing failed for ${event.type} (${event.id}):`,
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Webhook processing failed.",

        event:
          event.type,

        eventId:
          event.id,
      },
      {
        status: 500,
      }
    );
  }
}