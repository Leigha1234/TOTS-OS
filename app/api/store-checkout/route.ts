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
// CLIENTS
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
// TYPES
// ============================================================

type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

type CheckoutRequest = {
  storeSlug: string;

  items: CheckoutCartItem[];

  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type StoreSettingsRow = {
  id: string;
  organisation_id: string;
  slug: string;
  store_name: string | null;
  is_live: boolean | null;
};

type StoreProductRow = {
  id: string;
  organisation_id: string;

  name: string;
  slug: string;

  description: string | null;

  sku: string | null;
  category: string | null;

  price:
    | number
    | string;

  compare_at_price:
    | number
    | string
    | null;

  stock: number;

  inventory_quantity: number;

  track_inventory: boolean;

  is_active: boolean;

  status: string;

  image_url: string | null;
};

type ValidatedLine = {
  product: StoreProductRow;
  quantity: number;
  unitPrice: number;
  total: number;
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

function cleanEmail(
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

function safeQuantity(
  value: unknown
) {
  const quantity =
    Number(value);

  if (
    !Number.isFinite(
      quantity
    )
  ) {
    return 0;
  }

  return Math.floor(
    quantity
  );
}

function priceToPence(
  value: number
) {
  return Math.round(
    value * 100
  );
}

function generateOrderNumber() {
  const timestamp =
    Date.now()
      .toString()
      .slice(-8);

  const random =
    Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();

  return `TOTS-${timestamp}-${random}`;
}

function getBaseUrl(
  req: Request
) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

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

function getAvailableQuantity(
  product: StoreProductRow
) {
  if (
    product.track_inventory ===
    false
  ) {
    return null;
  }

  if (
    typeof product.inventory_quantity ===
    "number"
  ) {
    return product.inventory_quantity;
  }

  if (
    typeof product.stock ===
    "number"
  ) {
    return product.stock;
  }

  return null;
}

function isPhysicalProduct(
  product: StoreProductRow
) {
  if (
    product.track_inventory ===
    false
  ) {
    return false;
  }

  const category =
    String(
      product.category ||
        ""
    )
      .trim()
      .toLowerCase();

  const nonPhysicalCategories =
    [
      "websites",
      "website",
      "website add-ons",
      "website add ons",
      "website maintenance",
      "branding",
      "business coaching",
      "coaching",
      "services",
      "service",
      "social media",
      "business support",
      "digital",
      "digital product",
      "templates",
      "template",
      "resources",
      "resource",
    ];

  return !nonPhysicalCategories.includes(
    category
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  let createdOrderId:
    | string
    | null =
    null;

  try {
    // ========================================================
    // REQUEST
    // ========================================================

    const body =
      (await req.json()) as CheckoutRequest;

    const storeSlug =
      cleanString(
        body.storeSlug
      ).toLowerCase();

    const requestedItems =
      Array.isArray(
        body.items
      )
        ? body.items
        : [];

    if (
      !storeSlug
    ) {
      return NextResponse.json(
        {
          error:
            "Store slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      requestedItems.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Your basket is empty.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // STORE
    // ========================================================

    const {
      data:
        storeData,
      error:
        storeError,
    } =
      await supabaseAdmin
        .from(
          "store_settings"
        )
        .select(
          `
            id,
            organisation_id,
            slug,
            store_name,
            is_live
          `
        )
        .eq(
          "slug",
          storeSlug
        )
        .maybeSingle();

    if (
      storeError
    ) {
      console.error(
        "Store lookup failed:",
        storeError
      );

      return NextResponse.json(
        {
          error:
            "The store could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !storeData
    ) {
      return NextResponse.json(
        {
          error:
            "Store not found.",
        },
        {
          status: 404,
        }
      );
    }

    const store =
      storeData as StoreSettingsRow;

    if (
      store.is_live !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "This store is not currently accepting orders.",
        },
        {
          status: 400,
        }
      );
    }

    const organisationId =
      store.organisation_id;

    // ========================================================
    // NORMALISE BASKET
    //
    // If somehow the same product is sent twice, combine it.
    // ========================================================

    const quantityByProduct =
      new Map<
        string,
        number
      >();

    for (
      const item of
      requestedItems
    ) {
      const productId =
        cleanString(
          item?.productId
        );

      const quantity =
        safeQuantity(
          item?.quantity
        );

      if (
        !productId ||
        quantity <= 0
      ) {
        continue;
      }

      quantityByProduct.set(
        productId,
        (
          quantityByProduct.get(
            productId
          ) || 0
        ) + quantity
      );
    }

    const productIds =
      Array.from(
        quantityByProduct.keys()
      );

    if (
      productIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Your basket contains no valid items.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // LOAD PRODUCTS FROM DATABASE
    //
    // This is the source of truth.
    // Never trust prices sent by the browser.
    // ========================================================

    const {
      data:
        productRows,
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
            slug,
            description,
            sku,
            category,
            price,
            compare_at_price,
            stock,
            inventory_quantity,
            track_inventory,
            is_active,
            status,
            image_url
          `
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .in(
          "id",
          productIds
        );

    if (
      productError
    ) {
      console.error(
        "Product checkout lookup failed:",
        productError
      );

      return NextResponse.json(
        {
          error:
            "The products in your basket could not be verified.",
        },
        {
          status: 500,
        }
      );
    }

    const products =
      (
        productRows ||
        []
      ) as StoreProductRow[];

    // ========================================================
    // VALIDATE EVERY PRODUCT
    // ========================================================

    const validatedLines:
      ValidatedLine[] =
      [];

    for (
      const productId of
      productIds
    ) {
      const product =
        products.find(
          (
            row
          ) =>
            row.id ===
            productId
        );

      if (
        !product
      ) {
        return NextResponse.json(
          {
            error:
              "One of the products in your basket is no longer available.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        product.organisation_id !==
        organisationId
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid product.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        product.is_active ===
        false ||
        product.status !==
          "active"
      ) {
        return NextResponse.json(
          {
            error: `${product.name} is no longer available.`,
          },
          {
            status: 400,
          }
        );
      }

      const quantity =
        quantityByProduct.get(
          product.id
        ) || 0;

      if (
        quantity <= 0
      ) {
        continue;
      }

      const available =
        getAvailableQuantity(
          product
        );

      if (
        available !==
          null &&
        available <
          quantity
      ) {
        if (
          available <=
          0
        ) {
          return NextResponse.json(
            {
              error: `${product.name} is sold out.`,
            },
            {
              status: 400,
            }
          );
        }

        return NextResponse.json(
          {
            error: `Only ${available} of ${product.name} ${
              available === 1
                ? "is"
                : "are"
            } currently available.`,
          },
          {
            status: 400,
          }
        );
      }

      const unitPrice =
        Number(
          product.price
        );

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice <= 0
      ) {
        return NextResponse.json(
          {
            error: `${product.name} does not currently have a valid checkout price.`,
          },
          {
            status: 400,
          }
        );
      }

      const lineTotal =
        Number(
          (
            unitPrice *
            quantity
          ).toFixed(2)
        );

      validatedLines.push(
        {
          product,
          quantity,
          unitPrice,
          total:
            lineTotal,
        }
      );
    }

    if (
      validatedLines.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "Your basket contains no available products.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // TOTALS
    // ========================================================

    const subtotal =
      Number(
        validatedLines
          .reduce(
            (
              total,
              line
            ) =>
              total +
              line.total,
            0
          )
          .toFixed(2)
      );

    // Discounts and shipping will slot into this later.
    const discountAmount =
      0;

    const shippingAmount =
      0;

    const total =
      Number(
        (
          subtotal -
          discountAmount +
          shippingAmount
        ).toFixed(2)
      );

    // ========================================================
    // CUSTOMER
    // ========================================================

    const customerName =
      cleanString(
        body.customer?.name
      ) ||
      null;

    const customerEmail =
      cleanEmail(
        body.customer?.email
      ) ||
      null;

    const customerPhone =
      cleanString(
        body.customer?.phone
      ) ||
      null;

    // ========================================================
    // CREATE ORDER
    // ========================================================

    const orderNumber =
      generateOrderNumber();

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
        .insert({
          organisation_id:
            organisationId,

          order_number:
            orderNumber,

          customer_name:
            customerName,

          customer_email:
            customerEmail,

          customer_phone:
            customerPhone,

          subtotal,

          discount_amount:
            discountAmount,

          shipping_amount:
            shippingAmount,

          total,

          payment_status:
            "pending",

          fulfilment_status:
            "new",

          shipping_address:
            null,
        })
        .select(
          "id, order_number"
        )
        .single();

    if (
      orderError ||
      !orderData
    ) {
      console.error(
        "Order creation failed:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "Your order could not be created.",
        },
        {
          status: 500,
        }
      );
    }

    createdOrderId =
      orderData.id;

    // ========================================================
    // CREATE ORDER ITEMS
    // ========================================================

    const orderItems =
      validatedLines.map(
        (
          line
        ) => ({
          order_id:
            orderData.id,

          product_id:
            line.product.id,

          product_name:
            line.product.name,

          sku:
            line.product.sku,

          quantity:
            line.quantity,

          unit_price:
            line.unitPrice,

          total:
            line.total,
        })
      );

    const {
      error:
        orderItemsError,
    } =
      await supabaseAdmin
        .from(
          "store_order_items"
        )
        .insert(
          orderItems
        );

    if (
      orderItemsError
    ) {
      console.error(
        "Order item creation failed:",
        orderItemsError
      );

      // Because store_order_items uses
      // ON DELETE CASCADE, deleting the order
      // safely clears anything attached to it.
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .delete()
        .eq(
          "id",
          orderData.id
        );

      createdOrderId =
        null;

      return NextResponse.json(
        {
          error:
            "Your order items could not be created.",
        },
        {
          status: 500,
        }
      );
    }

    // ========================================================
    // STRIPE LINE ITEMS
    // ========================================================

    const stripeLineItems:
      Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedLines.map(
        (
          line
        ) => {
          const productData:
            Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData =
            {
              name:
                line.product.name,
            };

          if (
            line.product.description
          ) {
            productData.description =
              line.product.description.slice(
                0,
                500
              );
          }

          /*
           * Only pass an image if it is a valid HTTPS URL.
           */
          if (
            line.product.image_url?.startsWith(
              "https://"
            )
          ) {
            productData.images =
              [
                line.product.image_url,
              ];
          }

          return {
            quantity:
              line.quantity,

            price_data: {
              currency:
                "gbp",

              unit_amount:
                priceToPence(
                  line.unitPrice
                ),

              product_data:
                productData,
            },
          };
        }
      );

    // ========================================================
    // SHIPPING REQUIRED?
    // ========================================================

    const requiresShipping =
      validatedLines.some(
        (
          line
        ) =>
          isPhysicalProduct(
            line.product
          )
      );

    // ========================================================
    // SITE URLS
    // ========================================================

    const baseUrl =
      getBaseUrl(
        req
      );

    const successUrl =
      `${baseUrl}/shop/${encodeURIComponent(
        storeSlug
      )}/success?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      `${baseUrl}/shop/${encodeURIComponent(
        storeSlug
      )}?checkout=cancelled`;

    // ========================================================
    // CREATE STRIPE CHECKOUT
    // ========================================================

    const sessionParams:
      Stripe.Checkout.SessionCreateParams =
      {
        mode:
          "payment",

        line_items:
          stripeLineItems,

        success_url:
          successUrl,

        cancel_url:
          cancelUrl,

        metadata: {
          order_id:
            orderData.id,

          order_number:
            orderData.order_number,

          organisation_id:
            organisationId,

          store_slug:
            storeSlug,
        },

        payment_intent_data: {
          metadata: {
            order_id:
              orderData.id,

            order_number:
              orderData.order_number,

            organisation_id:
              organisationId,

            store_slug:
              storeSlug,
          },
        },

        billing_address_collection:
          "auto",

        phone_number_collection: {
          enabled:
            true,
        },

        allow_promotion_codes:
          false,
      };

    // ========================================================
    // CUSTOMER EMAIL
    // ========================================================

    if (
      customerEmail
    ) {
      sessionParams.customer_email =
        customerEmail;
    }

    // ========================================================
    // SHIPPING ADDRESS
    // ========================================================

    if (
      requiresShipping
    ) {
      sessionParams.shipping_address_collection =
        {
          allowed_countries:
            [
              "GB",
            ],
        };
    }

    // ========================================================
    // STRIPE SESSION
    // ========================================================

    let session:
      Stripe.Checkout.Session;

    try {
      session =
        await stripe.checkout.sessions.create(
          sessionParams
        );
    } catch (
      stripeError
    ) {
      console.error(
        "Stripe session creation failed:",
        stripeError
      );

      /*
       * Don't leave a ghost pending order behind
       * when Stripe checkout itself couldn't start.
       */
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .delete()
        .eq(
          "id",
          orderData.id
        );

      createdOrderId =
        null;

      throw stripeError;
    }

    // ========================================================
    // VALIDATE STRIPE URL
    // ========================================================

    if (
      !session.url
    ) {
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .delete()
        .eq(
          "id",
          orderData.id
        );

      createdOrderId =
        null;

      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        checkoutUrl:
          session.url,

        sessionId:
          session.id,

        orderId:
          orderData.id,

        orderNumber:
          orderData.order_number,

        subtotal,

        total,
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
      "Store checkout error:",
      error
    );

    /*
     * Last-resort cleanup if an unexpected failure occurs
     * after an order was created.
     */
    if (
      createdOrderId
    ) {
      try {
        await supabaseAdmin
          .from(
            "store_orders"
          )
          .delete()
          .eq(
            "id",
            createdOrderId
          );
      } catch (
        cleanupError
      ) {
        console.error(
          "Checkout order cleanup failed:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Checkout could not be started.",
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