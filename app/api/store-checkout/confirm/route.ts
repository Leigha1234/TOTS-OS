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

  customer_id?:
    string | null;

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
    | Record<
        string,
        unknown
      >
    | null;

  created_at:
    string;

  updated_at:
    string;
};

type StoreOrderItemRow = {
  id: string;

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

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(
      value
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return parsed;
}

// ============================================================
// STRIPE PAYMENT STATE
// ============================================================

function getStripePaymentState(
  session:
    Stripe.Checkout.Session
) {
  /*
   * IMPORTANT:
   *
   * This is ONLY the Stripe payment state.
   *
   * We do NOT write this to store_orders here.
   *
   * The webhook is the only place allowed to:
   *
   * - mark an order paid
   * - reduce stock
   * - create/link customers
   * - create/link CRM contacts
   */

  if (
    session.payment_status ===
    "paid"
  ) {
    return "paid";
  }

  if (
    session.payment_status ===
    "no_payment_required"
  ) {
    return "paid";
  }

  return "pending";
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: Request
) {
  try {
    // ========================================================
    // SESSION ID
    // ========================================================

    const url =
      new URL(
        req.url
      );

    const sessionId =
      cleanString(
        url.searchParams.get(
          "session_id"
        )
      );

    if (
      !sessionId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is required.",
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
    // LOAD STRIPE SESSION
    // ========================================================

    let session:
      Stripe.Checkout.Session;

    try {
      session =
        await stripe
          .checkout
          .sessions
          .retrieve(
            sessionId,
            {
              expand: [
                "payment_intent",
              ],
            }
          );
    } catch (
      stripeError
    ) {
      console.error(
        "[TOTS STORE CONFIRM] Stripe session lookup failed:",
        stripeError
      );

      return NextResponse.json(
        {
          error:
            "The checkout session could not be found.",
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
    // ORDER METADATA
    // ========================================================

    const orderId =
      cleanString(
        session
          .metadata
          ?.order_id
      );

    const orderNumberFromStripe =
      cleanString(
        session
          .metadata
          ?.order_number
      );

    const organisationId =
      cleanString(
        session
          .metadata
          ?.organisation_id
      );

    const storeSlug =
      cleanString(
        session
          .metadata
          ?.store_slug
      );

    if (
      !orderId
    ) {
      console.error(
        "[TOTS STORE CONFIRM] Checkout session missing order_id:",
        session.id
      );

      return NextResponse.json(
        {
          error:
            "This checkout session is not linked to a TOTS order.",
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
    // LOAD ORDER
    // ========================================================

    const {
      data:
        orderData,

      error:
        orderError,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .select(
          `
            id,
            organisation_id,
            customer_id,
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            subtotal,
            discount_amount,
            shipping_amount,
            total,
            payment_status,
            fulfilment_status,
            shipping_address,
            created_at,
            updated_at
          `
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (
      orderError
    ) {
      console.error(
        "[TOTS STORE CONFIRM] Order lookup failed:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "The order could not be loaded.",
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

    if (
      !orderData
    ) {
      return NextResponse.json(
        {
          error:
            "The order linked to this payment could not be found.",
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

    const order =
      orderData as
        StoreOrderRow;

    // ========================================================
    // SECURITY CHECK
    // ========================================================

    if (
      organisationId &&
      order.organisation_id !==
        organisationId
    ) {
      console.error(
        "[TOTS STORE CONFIRM] Organisation mismatch:",
        {
          stripeOrganisationId:
            organisationId,

          orderOrganisationId:
            order.organisation_id,

          orderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "This checkout session does not match the order.",
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
    // OPTIONAL ORDER NUMBER SECURITY CHECK
    // ========================================================

    if (
      orderNumberFromStripe &&
      cleanString(
        order.order_number
      ) &&
      orderNumberFromStripe !==
        cleanString(
          order.order_number
        )
    ) {
      console.error(
        "[TOTS STORE CONFIRM] Order number mismatch:",
        {
          stripeOrderNumber:
            orderNumberFromStripe,

          databaseOrderNumber:
            order.order_number,

          orderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "This checkout session does not match the order.",
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
    // STRIPE AMOUNTS
    //
    // These are returned to the success page for display.
    //
    // They are NOT written to Supabase here.
    // ========================================================

    const stripeSubtotal =
      typeof session
        .amount_subtotal ===
      "number"
        ? session
            .amount_subtotal /
          100
        : null;

    const stripeTotal =
      typeof session
        .amount_total ===
      "number"
        ? session
            .amount_total /
          100
        : null;

    const stripeDiscountAmount =
      typeof session
        .total_details
        ?.amount_discount ===
      "number"
        ? session
            .total_details!
            .amount_discount /
          100
        : null;

    const stripeShippingAmount =
      typeof session
        .total_details
        ?.amount_shipping ===
      "number"
        ? session
            .total_details!
            .amount_shipping /
          100
        : null;

    // ========================================================
    // STRIPE CUSTOMER DETAILS
    //
    // Again: display only here.
    //
    // The webhook persists these values.
    // ========================================================

    const stripeCustomerName =
      cleanString(
        session
          .customer_details
          ?.name
      ) ||
      null;

    const stripeCustomerEmail =
      cleanString(
        session
          .customer_details
          ?.email
      )
        .toLowerCase() ||
      null;

    const stripeCustomerPhone =
      cleanString(
        session
          .customer_details
          ?.phone
      ) ||
      null;

    // ========================================================
    // PAYMENT STATE
    // ========================================================

    const stripePaymentStatus =
      getStripePaymentState(
        session
      );

    const databasePaymentStatus =
      cleanString(
        order.payment_status
      ) ||
      "pending";

    /*
     * This gives the success page an immediately accurate
     * Stripe result even if the webhook is still processing.
     *
     * BUT we do not mutate store_orders.
     */

    const displayPaymentStatus =
      stripePaymentStatus ===
      "paid"
        ? "paid"
        : databasePaymentStatus;

    // ========================================================
    // LOAD ORDER ITEMS
    // ========================================================

    const {
      data:
        orderItems,

      error:
        itemError,
    } =
      await supabaseAdmin
        .from(
          "store_order_items"
        )
        .select(
          `
            id,
            product_id,
            product_name,
            sku,
            quantity,
            unit_price,
            total
          `
        )
        .eq(
          "order_id",
          orderId
        );

    if (
      itemError
    ) {
      console.warn(
        "[TOTS STORE CONFIRM] Order item lookup failed:",
        itemError
      );
    }

    const items =
      (
        orderItems ||
        []
      ) as StoreOrderItemRow[];

    // ========================================================
    // DISPLAY VALUES
    //
    // Prefer Stripe values because this endpoint is being
    // called immediately after Stripe checkout.
    //
    // The database will catch up via the webhook.
    // ========================================================

    const displaySubtotal =
      stripeSubtotal !==
      null
        ? stripeSubtotal
        : safeNumber(
            order.subtotal
          );

    const displayDiscountAmount =
      stripeDiscountAmount !==
      null
        ? stripeDiscountAmount
        : safeNumber(
            order.discount_amount
          );

    const displayShippingAmount =
      stripeShippingAmount !==
      null
        ? stripeShippingAmount
        : safeNumber(
            order.shipping_amount
          );

    const displayTotal =
      stripeTotal !==
      null
        ? stripeTotal
        : safeNumber(
            order.total
          );

    // ========================================================
    // CUSTOMER DISPLAY VALUES
    // ========================================================

    const displayCustomerName =
      stripeCustomerName ||
      cleanString(
        order.customer_name
      ) ||
      null;

    const displayCustomerEmail =
      stripeCustomerEmail ||
      cleanString(
        order.customer_email
      )
        .toLowerCase() ||
      null;

    const displayCustomerPhone =
      stripeCustomerPhone ||
      cleanString(
        order.customer_phone
      ) ||
      null;

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STORE CONFIRM] Checkout confirmed:",
      {
        sessionId:
          session.id,

        orderId:
          order.id,

        orderNumber:
          order.order_number,

        stripePaymentStatus:
          session.payment_status,

        databasePaymentStatus:
          order.payment_status,

        customerId:
          order.customer_id ||
          null,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        /*
         * processingComplete tells the frontend whether the
         * webhook has already finished updating Supabase.
         *
         * Stripe may report paid a fraction of a second before
         * store_orders.payment_status changes to paid.
         */

        processingComplete:
          databasePaymentStatus ===
          "paid",

        session: {
          id:
            session.id,

          paymentStatus:
            session.payment_status,

          status:
            session.status,

          customerEmail:
            stripeCustomerEmail,

          storeSlug:
            storeSlug ||
            null,

          amountSubtotal:
            stripeSubtotal,

          amountDiscount:
            stripeDiscountAmount,

          amountShipping:
            stripeShippingAmount,

          amountTotal:
            stripeTotal,
        },

        order: {
          id:
            order.id,

          customerId:
            order.customer_id ||
            null,

          orderNumber:
            cleanString(
              order.order_number
            ) ||
            orderNumberFromStripe ||
            null,

          customerName:
            displayCustomerName,

          customerEmail:
            displayCustomerEmail,

          customerPhone:
            displayCustomerPhone,

          subtotal:
            displaySubtotal,

          discountAmount:
            displayDiscountAmount,

          shippingAmount:
            displayShippingAmount,

          total:
            displayTotal,

          paymentStatus:
            displayPaymentStatus,

          storedPaymentStatus:
            databasePaymentStatus,

          fulfilmentStatus:
            cleanString(
              order.fulfilment_status
            ) ||
            "new",

          items,
        },
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "[TOTS STORE CONFIRM] Confirmation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "The order could not be confirmed.",
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