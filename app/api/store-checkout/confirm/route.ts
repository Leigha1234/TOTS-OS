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

// ============================================================
// CLIENTS
// ============================================================

const supabaseAdmin =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return fallback;
  }

  return parsed;
}

function normalisePaymentStatus(
  session: Stripe.Checkout.Session
) {
  if (
    session.payment_status ===
    "paid"
  ) {
    return "paid";
  }

  if (
    session.payment_status ===
    "unpaid"
  ) {
    return "pending";
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
          status: 400,

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
        await stripe.checkout.sessions.retrieve(
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
        "Stripe session lookup failed:",
        stripeError
      );

      return NextResponse.json(
        {
          error:
            "The checkout session could not be found.",
        },
        {
          status: 404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // ORDER ID FROM STRIPE METADATA
    // ========================================================

    const orderId =
      cleanString(
        session.metadata
          ?.order_id
      );

    const orderNumberFromStripe =
      cleanString(
        session.metadata
          ?.order_number
      );

    const organisationId =
      cleanString(
        session.metadata
          ?.organisation_id
      );

    const storeSlug =
      cleanString(
        session.metadata
          ?.store_slug
      );

    if (
      !orderId
    ) {
      return NextResponse.json(
        {
          error:
            "This checkout session is not linked to a TOTS order.",
        },
        {
          status: 400,

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
        .select("*")
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (
      orderError
    ) {
      console.error(
        "Order lookup failed:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "The order could not be loaded.",
        },
        {
          status: 500,

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
          status: 404,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // SECURITY CHECK
    // ========================================================

    if (
      organisationId &&
      String(
        orderData.organisation_id
      ) !==
        organisationId
    ) {
      console.error(
        "Checkout organisation mismatch:",
        {
          stripeOrganisationId:
            organisationId,

          orderOrganisationId:
            orderData.organisation_id,

          orderId,
        }
      );

      return NextResponse.json(
        {
          error:
            "This checkout session does not match the order.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // STRIPE VALUES
    // ========================================================

    const stripeSubtotal =
      typeof session.amount_subtotal ===
      "number"
        ? session.amount_subtotal /
          100
        : null;

    const stripeTotal =
      typeof session.amount_total ===
      "number"
        ? session.amount_total /
          100
        : null;

    const stripeDiscountAmount =
      typeof session.total_details
        ?.amount_discount ===
      "number"
        ? session.total_details
            .amount_discount /
          100
        : 0;

    const stripeShippingAmount =
      typeof session.total_details
        ?.amount_shipping ===
      "number"
        ? session.total_details
            .amount_shipping /
          100
        : 0;

    const paymentStatus =
      normalisePaymentStatus(
        session
      );

    // ========================================================
    // CUSTOMER DETAILS FROM STRIPE
    // ========================================================

    const customerName =
      cleanString(
        session.customer_details
          ?.name
      ) ||
      cleanString(
        orderData.customer_name
      ) ||
      null;

    const customerEmail =
      cleanString(
        session.customer_details
          ?.email
      ) ||
      cleanString(
        orderData.customer_email
      ) ||
      null;

    const customerPhone =
      cleanString(
        session.customer_details
          ?.phone
      ) ||
      cleanString(
        orderData.customer_phone
      ) ||
      null;

    // ========================================================
    // SHIPPING ADDRESS
    // ========================================================

    const shippingDetails =
      session.collected_information
        ?.shipping_details;

    const shippingAddress =
      shippingDetails?.address
        ? {
            name:
              shippingDetails.name ||
              null,

            line1:
              shippingDetails.address
                .line1 ||
              null,

            line2:
              shippingDetails.address
                .line2 ||
              null,

            city:
              shippingDetails.address
                .city ||
              null,

            state:
              shippingDetails.address
                .state ||
              null,

            postal_code:
              shippingDetails.address
                .postal_code ||
              null,

            country:
              shippingDetails.address
                .country ||
              null,
          }
        : null;

    // ========================================================
    // UPDATE ORDER FROM STRIPE
    //
    // This makes the success page accurate even if the webhook
    // has not finished processing yet.
    //
    // The webhook should still remain the main source for
    // asynchronous payment updates.
    // ========================================================

    const updatePayload:
      Record<
        string,
        unknown
      > = {
      customer_name:
        customerName,

      customer_email:
        customerEmail,

      customer_phone:
        customerPhone,

      payment_status:
        paymentStatus,

      updated_at:
        new Date().toISOString(),
    };

    if (
      stripeSubtotal !==
      null
    ) {
      updatePayload.subtotal =
        stripeSubtotal;
    }

    if (
      stripeTotal !==
      null
    ) {
      updatePayload.total =
        stripeTotal;
    }

    updatePayload.discount_amount =
      stripeDiscountAmount;

    updatePayload.shipping_amount =
      stripeShippingAmount;

    if (
      shippingAddress
    ) {
      updatePayload.shipping_address =
        shippingAddress;
    }

    const {
      data:
        updatedOrder,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .update(
          updatePayload
        )
        .eq(
          "id",
          orderId
        )
        .select("*")
        .maybeSingle();

    if (
      updateError
    ) {
      console.error(
        "Order confirmation update failed:",
        updateError
      );
    }

    const finalOrder =
      updatedOrder ||
      orderData;

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
        "Order item confirmation lookup failed:",
        itemError
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        session: {
          id:
            session.id,

          paymentStatus:
            session.payment_status,

          status:
            session.status,

          customerEmail:
            session.customer_details
              ?.email ||
            null,

          storeSlug:
            storeSlug ||
            null,
        },

        order: {
          id:
            finalOrder.id,

          orderNumber:
            cleanString(
              finalOrder.order_number
            ) ||
            orderNumberFromStripe ||
            null,

          customerName:
            cleanString(
              finalOrder.customer_name
            ) ||
            null,

          customerEmail:
            cleanString(
              finalOrder.customer_email
            ) ||
            null,

          customerPhone:
            cleanString(
              finalOrder.customer_phone
            ) ||
            null,

          subtotal:
            safeNumber(
              finalOrder.subtotal
            ),

          discountAmount:
            safeNumber(
              finalOrder.discount_amount
            ),

          shippingAmount:
            safeNumber(
              finalOrder.shipping_amount
            ),

          total:
            safeNumber(
              finalOrder.total
            ),

          paymentStatus:
            cleanString(
              finalOrder.payment_status
            ) ||
            paymentStatus,

          fulfilmentStatus:
            cleanString(
              finalOrder.fulfilment_status
            ) ||
            "new",

          items:
            orderItems ||
            [],
        },
      },
      {
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
      "Store checkout confirmation error:",
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
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}