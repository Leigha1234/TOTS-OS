import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

const stripeWebhookSecret =
  process.env.STRIPE_STORE_WEBHOOK_SECRET;

// ============================================================
// VALIDATE ENV
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

if (!stripeWebhookSecret) {
  throw new Error(
    "STRIPE_STORE_WEBHOOK_SECRET is missing"
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

// ============================================================
// SHIPPING ADDRESS
// ============================================================

function getShippingAddress(
  session:
    Stripe.Checkout.Session
) {
  const shipping =
    session.collected_information
      ?.shipping_details ??
    session.shipping_details ??
    null;

  if (!shipping) {
    return null;
  }

  return {
    name:
      shipping.name ??
      null,

    address: shipping.address
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
  return (
    asString(
      session.customer_details
        ?.name
    ) ||
    asString(
      session.collected_information
        ?.shipping_details
        ?.name
    ) ||
    asString(
      session.shipping_details
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
      session.customer_details
        ?.email
    ) ||
    asString(
      session.customer_email
    )
  );
}

function getCustomerPhone(
  session:
    Stripe.Checkout.Session
) {
  return asString(
    session.customer_details
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

  if (error) {
    throw error;
  }

  return (
    data as
      | StoreOrderRow
      | null
  );
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

  if (error) {
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
    // Product may have been deleted later.
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

      continue;
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

    // Services / digital / unlimited inventory.
    if (
      product.track_inventory ===
      false
    ) {
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
    session.metadata
      ?.order_id;

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
  // IMPORTANT:
  // MAKE WEBHOOK IDEMPOTENT
  //
  // Stripe can retry webhook events.
  //
  // If we've already marked this order as paid,
  // DO NOT reduce stock a second time.
  // ==========================================================

  if (
    order.payment_status ===
    "paid"
  ) {
    console.log(
      `Order ${order.order_number} is already paid. Skipping duplicate completion.`
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
      `Checkout session ${session.id} completed but is not paid yet. Status: ${session.payment_status}`
    );

    return;
  }

  // ==========================================================
  // CUSTOMER
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
  // Stripe values are pence.
  // ==========================================================

  const stripeTotal =
    typeof session.amount_total ===
      "number"
      ? session.amount_total /
        100
      : Number(
          order.total
        );

  // ==========================================================
  // UPDATE ORDER AS PAID
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
      );

  if (
    updateOrderError
  ) {
    throw updateOrderError;
  }

  // ==========================================================
  // REDUCE STOCK
  // ==========================================================

  await reduceOrderStock(
    order
  );

  console.log(
    `TOTS store order ${order.order_number} marked paid and inventory updated.`
  );
}

// ============================================================
// PAYMENT FAILURE
// ============================================================

async function markOrderPaymentFailed(
  session:
    Stripe.Checkout.Session
) {
  const orderId =
    session.metadata
      ?.order_id;

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
    console.error(
      "Could not update failed store payment:",
      error
    );
  }
}

// ============================================================
// REFUND
// ============================================================

async function handleRefund(
  paymentIntent:
    Stripe.PaymentIntent
) {
  const orderId =
    paymentIntent.metadata
      ?.order_id;

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
          "refunded",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId
      );

  if (
    error
  ) {
    console.error(
      "Could not mark store order refunded:",
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
  // RAW REQUEST BODY
  //
  // IMPORTANT:
  // Do NOT call req.json() here.
  // Stripe signature verification needs the raw body.
  // ==========================================================

  const body =
    await req.text();

  let event:
    Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
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
            ? error.message
            : "Invalid webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

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
          event.data
            .object as Stripe.Checkout.Session;

        await completeStoreOrder(
          session
        );

        break;
      }

      // ======================================================
      // ASYNC PAYMENT SUCCESS
      //
      // Covers payment methods where Checkout completes
      // before funds are confirmed.
      // ======================================================

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data
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
          event.data
            .object as Stripe.Checkout.Session;

        await markOrderPaymentFailed(
          session
        );

        break;
      }

      // ======================================================
      // PAYMENT REFUNDED
      // ======================================================

      case "payment_intent.canceled": {
        const paymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        const orderId =
          paymentIntent.metadata
            ?.order_id;

        if (
          orderId
        ) {
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
        }

        break;
      }

      default: {
        console.log(
          `Unhandled store Stripe event: ${event.type}`
        );
      }
    }

    return NextResponse.json(
      {
        received:
          true,
      }
    );
  } catch (
    error: unknown
  ) {
    /*
     * Returning 500 causes Stripe to retry
     * the webhook later, which is what we want
     * if Supabase temporarily fails.
     */

    console.error(
      `Store Stripe webhook processing failed for ${event.type}:`,
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}