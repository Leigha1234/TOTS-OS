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
// TYPES
// ============================================================

type CheckoutCartItem = {
  productId: string;
  quantity: number;
};

type CheckoutRequest = {
  storeSlug: string;

  items: CheckoutCartItem[];

  discountCode?: string;

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

type StoreDiscountRow = {
  id: string;

  organisation_id: string;

  code: string;

  discount_type: string;

  value:
    | number
    | string;

  minimum_order_amount:
    | number
    | string
    | null;

  maximum_discount_amount:
    | number
    | string
    | null;

  usage_limit:
    | number
    | null;

  times_used:
    | number
    | null;

  starts_at:
    | string
    | null;

  expires_at:
    | string
    | null;

  is_active:
    | boolean
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type ValidatedLine = {
  product: StoreProductRow;

  quantity: number;

  unitPrice: number;

  total: number;
};

type ValidatedDiscount = {
  discount: StoreDiscountRow;

  amount: number;
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

function cleanEmail(
  value: unknown
) {
  return cleanString(
    value
  ).toLowerCase();
}

// ============================================================

function safeQuantity(
  value: unknown
) {
  const quantity =
    Number(
      value
    );

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

// ============================================================

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

function moneyRound(
  value: number
) {
  return Number(
    value.toFixed(
      2
    )
  );
}

// ============================================================

function priceToPence(
  value: number
) {
  return Math.round(
    value * 100
  );
}

// ============================================================

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

// ============================================================

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

// ============================================================
// INVENTORY
// ============================================================

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

// ============================================================
// PHYSICAL PRODUCT CHECK
// ============================================================

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
// DISCOUNT TYPE
// ============================================================

function isPercentageDiscount(
  value: string
) {
  const type =
    value
      .trim()
      .toLowerCase();

  return [
    "percentage",
    "percent",
    "percentage_off",
    "percent_off",
    "%",
  ].includes(
    type
  );
}

// ============================================================

function isFixedDiscount(
  value: string
) {
  const type =
    value
      .trim()
      .toLowerCase();

  return [
    "fixed",
    "fixed_amount",
    "fixed_value",
    "amount",
    "amount_off",
    "value",
  ].includes(
    type
  );
}

// ============================================================
// VALIDATE DISCOUNT
// ============================================================

async function validateDiscount({
  organisationId,
  code,
  subtotal,
}: {
  organisationId: string;

  code: string;

  subtotal: number;
}): Promise<ValidatedDiscount> {
  const normalisedCode =
    cleanString(
      code
    ).toUpperCase();

  if (
    !normalisedCode
  ) {
    throw new Error(
      "Enter a discount code."
    );
  }

  // ==========================================================
  // FIND CODE
  // ==========================================================

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_discounts"
      )
      .select(
        `
          id,
          organisation_id,
          code,
          discount_type,
          value,
          minimum_order_amount,
          maximum_discount_amount,
          usage_limit,
          times_used,
          starts_at,
          expires_at,
          is_active,
          created_at,
          updated_at
        `
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .ilike(
        "code",
        normalisedCode
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    console.error(
      "Discount lookup failed:",
      error
    );

    throw new Error(
      "The discount code could not be checked."
    );
  }

  if (
    !data
  ) {
    throw new Error(
      "This discount code is invalid."
    );
  }

  const discount =
    data as StoreDiscountRow;

  // ==========================================================
  // ACTIVE
  // ==========================================================

  if (
    discount.is_active !==
    true
  ) {
    throw new Error(
      "This discount code is no longer active."
    );
  }

  // ==========================================================
  // START DATE
  // ==========================================================

  const now =
    new Date();

  if (
    discount.starts_at
  ) {
    const startsAt =
      new Date(
        discount.starts_at
      );

    if (
      !Number.isNaN(
        startsAt.getTime()
      ) &&
      now <
        startsAt
    ) {
      throw new Error(
        "This discount code is not active yet."
      );
    }
  }

  // ==========================================================
  // EXPIRY
  // ==========================================================

  if (
    discount.expires_at
  ) {
    const expiresAt =
      new Date(
        discount.expires_at
      );

    if (
      !Number.isNaN(
        expiresAt.getTime()
      ) &&
      now >
        expiresAt
    ) {
      throw new Error(
        "This discount code has expired."
      );
    }
  }

  // ==========================================================
  // USAGE LIMIT
  // ==========================================================

  const usageLimit =
    discount.usage_limit;

  const timesUsed =
    discount.times_used ||
    0;

  if (
    usageLimit !==
      null &&
    usageLimit >
      0 &&
    timesUsed >=
      usageLimit
  ) {
    throw new Error(
      "This discount code has reached its usage limit."
    );
  }

  // ==========================================================
  // MINIMUM ORDER
  // ==========================================================

  const minimumOrder =
    safeNumber(
      discount.minimum_order_amount,
      0
    );

  if (
    minimumOrder >
      0 &&
    subtotal <
      minimumOrder
  ) {
    throw new Error(
      `This discount requires a minimum spend of £${minimumOrder.toFixed(
        2
      )}.`
    );
  }

  // ==========================================================
  // VALUE
  // ==========================================================

  const value =
    safeNumber(
      discount.value,
      0
    );

  if (
    value <=
    0
  ) {
    throw new Error(
      "This discount code has an invalid value."
    );
  }

  // ==========================================================
  // CALCULATE DISCOUNT
  // ==========================================================

  let discountAmount =
    0;

  if (
    isPercentageDiscount(
      discount.discount_type
    )
  ) {
    if (
      value >
      100
    ) {
      throw new Error(
        "This percentage discount has an invalid value."
      );
    }

    discountAmount =
      subtotal *
      (
        value /
        100
      );
  } else if (
    isFixedDiscount(
      discount.discount_type
    )
  ) {
    discountAmount =
      value;
  } else {
    console.error(
      "Unknown discount type:",
      discount.discount_type
    );

    throw new Error(
      "This discount code has an unsupported discount type."
    );
  }

  // ==========================================================
  // MAXIMUM DISCOUNT CAP
  // ==========================================================

  const maximumDiscount =
    safeNumber(
      discount.maximum_discount_amount,
      0
    );

  if (
    maximumDiscount >
      0
  ) {
    discountAmount =
      Math.min(
        discountAmount,
        maximumDiscount
      );
  }

  // ==========================================================
  // NEVER DISCOUNT BELOW £0
  // ==========================================================

  discountAmount =
    Math.min(
      discountAmount,
      subtotal
    );

  discountAmount =
    Math.max(
      0,
      moneyRound(
        discountAmount
      )
    );

  if (
    discountAmount <=
    0
  ) {
    throw new Error(
      "This discount code does not apply to this order."
    );
  }

  return {
    discount,

    amount:
      discountAmount,
  };
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

  let createdCouponId:
    | string
    | null =
    null;

  try {
    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      (await req.json()) as CheckoutRequest;

    const storeSlug =
      cleanString(
        body.storeSlug
      ).toLowerCase();

    const requestedDiscountCode =
      cleanString(
        body.discountCode
      ).toUpperCase();

    const requestedItems =
      Array.isArray(
        body.items
      )
        ? body.items
        : [];

    // ========================================================
    // VALIDATE STORE SLUG
    // ========================================================

    if (
      !storeSlug
    ) {
      return NextResponse.json(
        {
          error:
            "Store slug is required.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // VALIDATE BASKET
    // ========================================================

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
          status:
            400,
        }
      );
    }

    // ========================================================
    // LOAD STORE
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
          status:
            500,
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
          status:
            404,
        }
      );
    }

    const store =
      storeData as StoreSettingsRow;

    // ========================================================
    // STORE MUST BE LIVE
    // ========================================================

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
          status:
            400,
        }
      );
    }

    const organisationId =
      store.organisation_id;

    // ========================================================
    // NORMALISE BASKET
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
        quantity <=
          0
      ) {
        continue;
      }

      quantityByProduct.set(
        productId,
        (
          quantityByProduct.get(
            productId
          ) ||
          0
        ) +
          quantity
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
          status:
            400,
        }
      );
    }

    // ========================================================
    // LOAD PRODUCTS
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
          status:
            500,
        }
      );
    }

    const products =
      (
        productRows ||
        []
      ) as StoreProductRow[];

    // ========================================================
    // VALIDATE PRODUCTS
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
            status:
              400,
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
            status:
              400,
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
            error:
              `${product.name} is no longer available.`,
          },
          {
            status:
              400,
          }
        );
      }

      const quantity =
        quantityByProduct.get(
          product.id
        ) ||
        0;

      if (
        quantity <=
        0
      ) {
        continue;
      }

      // ======================================================
      // STOCK
      // ======================================================

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
              error:
                `${product.name} is sold out.`,
            },
            {
              status:
                400,
            }
          );
        }

        return NextResponse.json(
          {
            error:
              `Only ${available} of ${product.name} ${
                available ===
                1
                  ? "is"
                  : "are"
              } currently available.`,
          },
          {
            status:
              400,
          }
        );
      }

      // ======================================================
      // PRICE
      // ======================================================

      const unitPrice =
        Number(
          product.price
        );

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice <=
          0
      ) {
        return NextResponse.json(
          {
            error:
              `${product.name} does not currently have a valid checkout price.`,
          },
          {
            status:
              400,
          }
        );
      }

      const lineTotal =
        moneyRound(
          unitPrice *
          quantity
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
          status:
            400,
        }
      );
    }

    // ========================================================
    // SUBTOTAL
    // ========================================================

    const subtotal =
      moneyRound(
        validatedLines.reduce(
          (
            runningTotal,
            line
          ) =>
            runningTotal +
            line.total,
          0
        )
      );

    // ========================================================
    // VALIDATE TOTS DISCOUNT
    // ========================================================

    let appliedDiscount:
      StoreDiscountRow |
      null =
      null;

    let discountAmount =
      0;

    if (
      requestedDiscountCode
    ) {
      try {
        const result =
          await validateDiscount({
            organisationId,

            code:
              requestedDiscountCode,

            subtotal,
          });

        appliedDiscount =
          result.discount;

        discountAmount =
          result.amount;
      } catch (
        discountError
      ) {
        return NextResponse.json(
          {
            error:
              discountError instanceof
              Error
                ? discountError.message
                : "This discount code could not be applied.",
          },
          {
            status:
              400,
          }
        );
      }
    }

    // ========================================================
    // SHIPPING
    // ========================================================

    const shippingAmount =
      0;

    // ========================================================
    // FINAL TOTAL
    // ========================================================

    const total =
      moneyRound(
        Math.max(
          0,
          subtotal -
            discountAmount +
            shippingAmount
        )
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
    // ORDER NUMBER
    // ========================================================

    const orderNumber =
      generateOrderNumber();

    // ========================================================
    // CREATE STORE ORDER
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
          status:
            500,
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
          status:
            500,
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
    // SITE URL
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
    // STRIPE CHECKOUT SESSION
    //
    // IMPORTANT:
    //
    // DO NOT add allow_promotion_codes here.
    //
    // TOTS-OS validates its own discount codes and applies
    // them using sessionParams.discounts below.
    //
    // Stripe does not allow:
    //
    // allow_promotion_codes + discounts
    //
    // on the same Checkout Session.
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

          discount_id:
            appliedDiscount?.id ||
            "",

          discount_code:
            appliedDiscount?.code ||
            "",

          discount_amount:
            discountAmount.toFixed(
              2
            ),
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

            discount_id:
              appliedDiscount?.id ||
              "",

            discount_code:
              appliedDiscount?.code ||
              "",

            discount_amount:
              discountAmount.toFixed(
                2
              ),
          },
        },

        billing_address_collection:
          "auto",

        phone_number_collection: {
          enabled:
            true,
        },
      };

    // ========================================================
    // APPLY TOTS DISCOUNT TO STRIPE
    //
    // Example:
    //
    // £795 subtotal
    // WELCOME10 = 10%
    //
    // TOTS calculates £79.50.
    //
    // Stripe receives an exact £79.50 one-time coupon.
    //
    // Expected Stripe total:
    //
    // £795.00
    // - £79.50
    // = £715.50
    // ========================================================

    if (
      appliedDiscount &&
      discountAmount >
        0
    ) {
      const coupon =
        await stripe.coupons.create({
          amount_off:
            priceToPence(
              discountAmount
            ),

          currency:
            "gbp",

          duration:
            "once",

          name:
            appliedDiscount.code,

          metadata: {
            tots_discount_id:
              appliedDiscount.id,

            tots_discount_code:
              appliedDiscount.code,

            organisation_id:
              organisationId,

            order_id:
              orderData.id,
          },
        });

      createdCouponId =
        coupon.id;

      sessionParams.discounts =
        [
          {
            coupon:
              coupon.id,
          },
        ];
    }

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
    // CREATE STRIPE SESSION
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

      // ======================================================
      // CLEAN UP PENDING ORDER
      // ======================================================

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

      // ======================================================
      // CLEAN UP TEMPORARY STRIPE COUPON
      // ======================================================

      if (
        createdCouponId
      ) {
        try {
          await stripe.coupons.del(
            createdCouponId
          );
        } catch (
          couponCleanupError
        ) {
          console.error(
            "Stripe coupon cleanup failed:",
            couponCleanupError
          );
        }

        createdCouponId =
          null;
      }

      throw stripeError;
    }

    // ========================================================
    // CHECKOUT URL REQUIRED
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

      if (
        createdCouponId
      ) {
        try {
          await stripe.coupons.del(
            createdCouponId
          );
        } catch (
          couponCleanupError
        ) {
          console.error(
            "Stripe coupon cleanup failed:",
            couponCleanupError
          );
        }

        createdCouponId =
          null;
      }

      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        checkoutUrl:
          session.url,

        sessionId:
          session.id,

        orderId:
          orderData.id,

        orderNumber:
          orderData.order_number,

        subtotal,

        discountCode:
          appliedDiscount?.code ||
          null,

        discountAmount,

        shippingAmount,

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

    // ========================================================
    // LAST RESORT ORDER CLEANUP
    // ========================================================

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

    // ========================================================
    // LAST RESORT COUPON CLEANUP
    // ========================================================

    if (
      createdCouponId
    ) {
      try {
        await stripe.coupons.del(
          createdCouponId
        );
      } catch (
        couponCleanupError
      ) {
        console.error(
          "Stripe coupon cleanup failed:",
          couponCleanupError
        );
      }
    }

    // ========================================================
    // ERROR RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Checkout could not be started.",
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