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

  store_name:
    | string
    | null;

  is_live:
    | boolean
    | null;
};

type StoreStripeAccountRow = {
  id: string;

  organisation_id: string;

  stripe_account_id: string;

  charges_enabled: boolean;

  payouts_enabled: boolean;

  details_submitted: boolean;

  onboarding_complete: boolean;

  default_currency: string;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type StoreProductRow = {
  id: string;

  organisation_id: string;

  name: string;

  slug: string;

  description:
    | string
    | null;

  sku:
    | string
    | null;

  category:
    | string
    | null;

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

  image_url:
    | string
    | null;
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
// BASE URL
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
      "[TOTS STORE] Discount lookup failed:",
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

  const now =
    new Date();

  // ==========================================================
  // START DATE
  // ==========================================================

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

  let discountAmount =
    0;

  // ==========================================================
  // PERCENTAGE
  // ==========================================================

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
  }

  // ==========================================================
  // FIXED
  // ==========================================================

  else if (
    isFixedDiscount(
      discount.discount_type
    )
  ) {
    discountAmount =
      value;
  }

  // ==========================================================
  // UNKNOWN
  // ==========================================================

  else {
    console.error(
      "[TOTS STORE] Unknown discount type:",
      discount.discount_type
    );

    throw new Error(
      "This discount code has an unsupported discount type."
    );
  }

  // ==========================================================
  // MAXIMUM CAP
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
  // NEVER BELOW ZERO
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
// LOAD CONNECTED STRIPE ACCOUNT
// ============================================================

async function getConnectedStripeAccount(
  organisationId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_stripe_accounts"
      )
      .select(
        `
          id,
          organisation_id,
          stripe_account_id,
          charges_enabled,
          payouts_enabled,
          details_submitted,
          onboarding_complete,
          default_currency,
          created_at,
          updated_at
        `
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .maybeSingle();

  if (
    error
  ) {
    console.error(
      "[TOTS STORE] Stripe connection lookup failed:",
      error
    );

    throw error;
  }

  return (
    data as
      | StoreStripeAccountRow
      | null
  );
}

// ============================================================
// VALIDATE CONNECTED STRIPE ACCOUNT
// ============================================================

async function validateConnectedStripeAccount(
  connection:
    StoreStripeAccountRow
) {
  const accountId =
    cleanString(
      connection
        .stripe_account_id
    );

  if (
    !accountId
  ) {
    throw new Error(
      "This store has not connected Stripe yet."
    );
  }

  let account:
    Stripe.Account;

  try {
    const result =
      await stripe
        .accounts
        .retrieve(
          accountId
        );

    if (
      "deleted" in
        result &&
      result.deleted
    ) {
      throw new Error(
        "STRIPE_ACCOUNT_MISSING"
      );
    }

    account =
      result as
        Stripe.Account;
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS STORE] Stripe account lookup failed:",
      error
    );

    const stripeError =
      error as {
        code?: string;
        statusCode?: number;
      };

    const missing =
      (
        error instanceof
          Error &&
        error.message ===
          "STRIPE_ACCOUNT_MISSING"
      ) ||
      stripeError
        ?.code ===
        "resource_missing" ||
      stripeError
        ?.statusCode ===
        404;

    if (
      missing
    ) {
      const {
        error:
          staleDeleteError,
      } =
        await supabaseAdmin
          .from(
            "store_stripe_accounts"
          )
          .delete()
          .eq(
            "organisation_id",
            connection.organisation_id
          )
          .eq(
            "stripe_account_id",
            accountId
          );

      if (
        staleDeleteError
      ) {
        console.error(
          "[TOTS STORE] Could not remove stale Stripe connection:",
          staleDeleteError
        );
      }

      throw new Error(
        "This store's Stripe connection is no longer available. The business needs to reconnect Stripe."
      );
    }

    throw new Error(
      "The store's connected Stripe account could not be verified."
    );
  }

  // ==========================================================
  // LIVE ACCOUNT STATUS
  // ==========================================================

  const detailsSubmitted =
    account
      .details_submitted ===
    true;

  const chargesEnabled =
    account
      .charges_enabled ===
    true;

  const payoutsEnabled =
    account
      .payouts_enabled ===
    true;

  const onboardingComplete =
    detailsSubmitted &&
    chargesEnabled &&
    payoutsEnabled;

  // ==========================================================
  // SYNC DATABASE
  // ==========================================================

  const {
    error:
      syncError,
  } =
    await supabaseAdmin
      .from(
        "store_stripe_accounts"
      )
      .update({
        charges_enabled:
          chargesEnabled,

        payouts_enabled:
          payoutsEnabled,

        details_submitted:
          detailsSubmitted,

        onboarding_complete:
          onboardingComplete,

        default_currency:
          cleanString(
            account
              .default_currency
          ).toLowerCase() ||
          connection
            .default_currency ||
          "gbp",

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        connection.id
      )
      .eq(
        "organisation_id",
        connection.organisation_id
      );

  if (
    syncError
  ) {
    console.warn(
      "[TOTS STORE] Stripe account state sync failed:",
      syncError
    );
  }

  // ==========================================================
  // DETAILS SUBMITTED
  // ==========================================================

  if (
    !detailsSubmitted
  ) {
    throw new Error(
      "This store has not finished setting up Stripe yet."
    );
  }

  // ==========================================================
  // CHARGES ENABLED
  // ==========================================================

  if (
    !chargesEnabled
  ) {
    const reason =
      account
        .requirements
        ?.disabled_reason;

    console.warn(
      "[TOTS STORE] Stripe charges disabled:",
      {
        accountId,

        reason,

        currentlyDue:
          account
            .requirements
            ?.currently_due ||
          [],

        pastDue:
          account
            .requirements
            ?.past_due ||
          [],
      }
    );

    throw new Error(
      "This store cannot currently accept Stripe payments. The business needs to check its Stripe account requirements."
    );
  }

  return account;
}

// ============================================================
// DELETE CONNECTED ACCOUNT COUPON
// ============================================================

async function deleteConnectedCoupon(
  couponId:
    | string
    | null,

  stripeAccountId:
    | string
    | null
) {
  if (
    !couponId ||
    !stripeAccountId
  ) {
    return;
  }

  try {
    await stripe
      .coupons
      .del(
        couponId,
        {
          stripeAccount:
            stripeAccountId,
        }
      );
  } catch (
    error
  ) {
    console.error(
      "[TOTS STORE] Connected Stripe coupon cleanup failed:",
      error
    );
  }
}

// ============================================================
// DELETE PENDING ORDER
// ============================================================

async function deletePendingOrder(
  orderId:
    | string
    | null
) {
  if (
    !orderId
  ) {
    return;
  }

  try {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .delete()
        .eq(
          "id",
          orderId
        )
        .eq(
          "payment_status",
          "pending"
        );

    if (
      error
    ) {
      console.error(
        "[TOTS STORE] Pending order cleanup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.error(
      "[TOTS STORE] Pending order cleanup failed:",
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
  let createdOrderId:
    | string
    | null =
    null;

  let createdCouponId:
    | string
    | null =
    null;

  let connectedStripeAccountId:
    | string
    | null =
    null;

  /*
   * Once Stripe Checkout has actually been created, we must
   * never blindly delete the order in the outer catch block.
   *
   * The Checkout Session could still be paid even if a later
   * Supabase update failed.
   */
  let stripeCheckoutCreated =
    false;

  try {
    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      (
        await req.json()
      ) as CheckoutRequest;

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
    // STORE SLUG
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
    // BASKET
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
        "[TOTS STORE] Store lookup failed:",
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
      storeData as
        StoreSettingsRow;

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
    // LOAD CONNECTED STRIPE ACCOUNT
    // ========================================================

    const stripeConnection =
      await getConnectedStripeAccount(
        organisationId
      );

    if (
      !stripeConnection
    ) {
      return NextResponse.json(
        {
          error:
            "This store has not connected Stripe yet and cannot currently accept payments.",

          stripeRequired:
            true,
        },
        {
          status:
            400,
        }
      );
    }

    connectedStripeAccountId =
      cleanString(
        stripeConnection
          .stripe_account_id
      ) ||
      null;

    if (
      !connectedStripeAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "This store has not connected Stripe yet and cannot currently accept payments.",

          stripeRequired:
            true,
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // VERIFY ACCOUNT CAN TAKE PAYMENTS
    // ========================================================

    let connectedAccount:
      Stripe.Account;

    try {
      connectedAccount =
        await validateConnectedStripeAccount(
          stripeConnection
        );
    } catch (
      accountError
    ) {
      return NextResponse.json(
        {
          error:
            accountError instanceof
              Error
              ? accountError.message
              : "This store cannot currently accept Stripe payments.",
        },
        {
          status:
            400,
        }
      );
    }

    // ========================================================
    // CURRENCY
    // ========================================================

    const currency =
      cleanString(
        connectedAccount
          .default_currency
      ).toLowerCase() ||
      cleanString(
        stripeConnection
          .default_currency
      ).toLowerCase() ||
      "gbp";

    /*
     * Your current storefront and pricing are GBP based.
     *
     * Prevent a connected account with a different default
     * currency from accidentally changing the currency of
     * existing product prices.
     */
    const checkoutCurrency =
      "gbp";

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
        "[TOTS STORE] Product checkout lookup failed:",
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

    if (
      total <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            "The order total must be greater than £0 to use Stripe checkout.",
        },
        {
          status:
            400,
        }
      );
    }

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

          currency:
            checkoutCurrency,

          payment_status:
            "pending",

          fulfilment_status:
            "new",

          shipping_address:
            null,

          discount_code:
            appliedDiscount?.code ||
            null,

          discount_id:
            appliedDiscount?.id ||
            null,

          stripe_account_id:
            connectedStripeAccountId,

          stripe_checkout_session_id:
            null,

          stripe_payment_intent_id:
            null,

          stripe_customer_id:
            null,

          checkout_completed_at:
            null,

          paid_at:
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .select(
          `
            id,
            order_number
          `
        )
        .single();

    if (
      orderError ||
      !orderData
    ) {
      console.error(
        "[TOTS STORE] Order creation failed:",
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
        "[TOTS STORE] Order item creation failed:",
        orderItemsError
      );

      await deletePendingOrder(
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
                checkoutCurrency,

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
    // SHIPPING REQUIRED
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
    // URLS
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
    // STRIPE SESSION PARAMS
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

          stripe_account_id:
            connectedStripeAccountId,

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

          tots_source:
            "store",
        },

        payment_intent_data: {
          metadata: {
            order_id:
              orderData.id,

            order_number:
              orderData.order_number,

            organisation_id:
              organisationId,

            stripe_account_id:
              connectedStripeAccountId,

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

            tots_source:
              "store",
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
    // CUSTOMER EMAIL
    // ========================================================

    if (
      customerEmail
    ) {
      sessionParams.customer_email =
        customerEmail;
    }

    // ========================================================
    // SHIPPING
    // ========================================================

    if (
      requiresShipping
    ) {
      sessionParams
        .shipping_address_collection =
        {
          allowed_countries: [
            "GB",
          ],
        };
    }

    // ========================================================
    // CREATE DISCOUNT INSIDE CONNECTED STRIPE ACCOUNT
    // ========================================================

    if (
      appliedDiscount &&
      discountAmount >
        0
    ) {
      const coupon =
        await stripe
          .coupons
          .create(
            {
              amount_off:
                priceToPence(
                  discountAmount
                ),

              currency:
                checkoutCurrency,

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

                tots_source:
                  "store",
              },
            },
            {
              stripeAccount:
                connectedStripeAccountId,
            }
          );

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
    // CREATE CHECKOUT SESSION
    //
    // IMPORTANT:
    //
    // stripeAccount here means the payment is created directly
    // inside the STORE OWNER'S connected Stripe account.
    //
    // TOTS-OS is acting as the Stripe Connect platform.
    //
    // The payment does not land in the TOTS-OS platform balance.
    // ========================================================

    let session:
      Stripe.Checkout.Session;

    try {
      session =
        await stripe
          .checkout
          .sessions
          .create(
            sessionParams,
            {
              stripeAccount:
                connectedStripeAccountId,
            }
          );

      stripeCheckoutCreated =
        true;
    } catch (
      stripeError
    ) {
      console.error(
        "[TOTS STORE] Connected Stripe session creation failed:",
        stripeError
      );

      await deletePendingOrder(
        orderData.id
      );

      createdOrderId =
        null;

      await deleteConnectedCoupon(
        createdCouponId,
        connectedStripeAccountId
      );

      createdCouponId =
        null;

      throw stripeError;
    }

    // ========================================================
    // CHECKOUT URL
    // ========================================================

    if (
      !session.url
    ) {
      console.error(
        "[TOTS STORE] Stripe created a checkout session without a URL:",
        session.id
      );

      /*
       * Do NOT delete the TOTS order here.
       *
       * Stripe already created the Checkout Session.
       */

      throw new Error(
        "Stripe created the checkout but did not return a checkout URL."
      );
    }

    // ========================================================
    // INITIAL PAYMENT INTENT
    //
    // Stripe Checkout may not assign the PaymentIntent until
    // later in the lifecycle, so the webhook must also update
    // this field after checkout.session.completed.
    // ========================================================

    const initialPaymentIntentId =
      typeof session
        .payment_intent ===
      "string"
        ? session
            .payment_intent
        : null;

    // ========================================================
    // STRIPE CUSTOMER
    // ========================================================

    const initialStripeCustomerId =
      typeof session
        .customer ===
      "string"
        ? session
            .customer
        : null;

    // ========================================================
    // SAVE STRIPE REFERENCES
    // ========================================================

    const {
      error:
        stripeReferenceError,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .update({
          stripe_account_id:
            connectedStripeAccountId,

          stripe_checkout_session_id:
            session.id,

          stripe_payment_intent_id:
            initialPaymentIntentId,

          stripe_customer_id:
            initialStripeCustomerId,

          currency:
            checkoutCurrency,

          discount_id:
            appliedDiscount?.id ||
            null,

          discount_code:
            appliedDiscount?.code ||
            null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          orderData.id
        )
        .eq(
          "organisation_id",
          organisationId
        );

    if (
      stripeReferenceError
    ) {
      /*
       * This is important:
       *
       * Stripe Checkout DOES exist at this point.
       *
       * We must not delete the store order, otherwise the buyer
       * could still pay an orphaned Checkout Session.
       *
       * The Stripe session metadata contains order_id and
       * organisation_id, so the webhook can still recover.
       */

      console.error(
        "[TOTS STORE] Stripe references could not be saved:",
        stripeReferenceError
      );

      console.warn(
        "[TOTS STORE] Continuing checkout because Stripe metadata can recover the order relationship."
      );
    }

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STORE] Connected checkout created:",
      {
        organisationId,

        stripeAccountId:
          connectedStripeAccountId,

        sessionId:
          session.id,

        paymentIntentId:
          initialPaymentIntentId,

        orderId:
          orderData.id,

        orderNumber:
          orderData.order_number,

        total,

        currency:
          checkoutCurrency,

        connectedAccountCurrency:
          currency,
      }
    );

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

        paymentIntentId:
          initialPaymentIntentId,

        stripeAccountId:
          connectedStripeAccountId,

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

        currency:
          checkoutCurrency,

        stripeReferencesSaved:
          !stripeReferenceError,
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
      "[TOTS STORE] Store checkout error:",
      error
    );

    // ========================================================
    // CLEAN UP ORDER
    //
    // ONLY delete it if Stripe Checkout has NOT been created.
    //
    // Once Stripe has created a session, the order must remain
    // because that session may still be payable.
    // ========================================================

    if (
      createdOrderId &&
      !stripeCheckoutCreated
    ) {
      await deletePendingOrder(
        createdOrderId
      );
    }

    // ========================================================
    // CLEAN UP COUPON
    //
    // Only remove the coupon when checkout itself wasn't
    // successfully created.
    //
    // A successfully-created Checkout Session may reference it.
    // ========================================================

    if (
      createdCouponId &&
      connectedStripeAccountId &&
      !stripeCheckoutCreated
    ) {
      await deleteConnectedCoupon(
        createdCouponId,
        connectedStripeAccountId
      );
    }

    // ========================================================
    // STRIPE ERROR
    // ========================================================

    if (
      error instanceof
      Stripe.errors.StripeError
    ) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "Stripe checkout could not be started.",

          stripeError:
            true,

          type:
            error.type,

          code:
            error.code ||
            null,

          declineCode:
            error.decline_code ||
            null,

          requestId:
            error.requestId ||
            null,
        },
        {
          status:
            error.statusCode &&
            error.statusCode >=
              400 &&
            error.statusCode <
              600
              ? error.statusCode
              : 500,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
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