import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  BILLING_PRODUCTS,
  MODULE_BUNDLE_PRICES,
  type BillingProductKey,
} from "@/lib/billing-config";

export const runtime = "nodejs";

// ======================================================
// STRIPE
// ======================================================

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY",
  );
}

const stripe =
  new Stripe(
    stripeSecretKey,
  );

// ======================================================
// TYPES
// ======================================================

type SyncedPrice = {
  lookupKey: string;
  priceId: string;
  amount: number;
  created: boolean;
};

type SyncResult = {
  key: string;
  name: string;
  productId: string;
  createdProduct: boolean;
  price: SyncedPrice;
};

// ======================================================
// BILLING VERSION
//
// We're deliberately using new lookup keys.
//
// The previous Stripe setup used:
//
// tots_core_monthly_standard
// tots_core_monthly_bundle_10
// tots_core_monthly_bundle_20
//
// We do NOT want checkout accidentally finding those.
//
// ======================================================

const BILLING_VERSION = "v2";

// ======================================================
// FIXED MODULE BUNDLES
// ======================================================
//
// 1 module = billed using the individual module product.
//
// 2 modules = £55
// 3 modules = £79
// 4 modules = £99
// 5 modules = £119
//
// 6 modules = TOTS-OS Complete £139
//
// Complete is already defined in BILLING_PRODUCTS.
//
// ======================================================

const FIXED_BUNDLES = {
  bundle2: {
    key: "bundle2",
    name: "TOTS-OS 2 Module Bundle",
    amount: MODULE_BUNDLE_PRICES[2],
    moduleCount: 2,
  },

  bundle3: {
    key: "bundle3",
    name: "TOTS-OS 3 Module Bundle",
    amount: MODULE_BUNDLE_PRICES[3],
    moduleCount: 3,
  },

  bundle4: {
    key: "bundle4",
    name: "TOTS-OS 4 Module Bundle",
    amount: MODULE_BUNDLE_PRICES[4],
    moduleCount: 4,
  },

  bundle5: {
    key: "bundle5",
    name: "TOTS-OS 5 Module Bundle",
    amount: MODULE_BUNDLE_PRICES[5],
    moduleCount: 5,
  },
} as const;

// ======================================================
// LOOKUP KEYS
// ======================================================

function buildProductLookupKey(
  billingKey: string,
) {
  return `tots_${BILLING_VERSION}_${billingKey}_monthly`;
}

function buildBundleLookupKey(
  moduleCount: number,
) {
  return `tots_${BILLING_VERSION}_bundle_${moduleCount}_monthly`;
}

// ======================================================
// FIND OR CREATE PRODUCT
// ======================================================

async function findOrCreateProduct({
  billingKey,
  name,
  type,
  moduleCount,
}: {
  billingKey: string;
  name: string;
  type:
    | "module"
    | "ai"
    | "complete"
    | "bundle";
  moduleCount?: number;
}) {
  const productSearch =
    await stripe.products.search(
      {
        query:
          `metadata['tots_billing_key']:'${billingKey}'`,
      },
    );

  const existingProduct =
    productSearch.data[0] ??
    null;

  if (existingProduct) {
    return {
      product:
        existingProduct,

      created:
        false,
    };
  }

  const product =
    await stripe.products.create(
      {
        name,

        active:
          true,

        metadata: {
          tots_billing_key:
            billingKey,

          tots_billing_model:
            "modular_v2",

          tots_product_type:
            type,

          tots_module_count:
            moduleCount
              ? String(moduleCount)
              : "",

          tots_source:
            "tots-os",
        },
      },
    );

  return {
    product,
    created:
      true,
  };
}

// ======================================================
// FIND OR CREATE PRICE
// ======================================================

async function findOrCreatePrice({
  productId,
  billingKey,
  lookupKey,
  amount,
  productType,
  moduleCount,
}: {
  productId: string;
  billingKey: string;
  lookupKey: string;
  amount: number;
  productType: string;
  moduleCount?: number;
}): Promise<SyncedPrice> {
  // ====================================================
  // 1. CHECK NEW V2 LOOKUP KEY
  // ====================================================

  const lookupPrices =
    await stripe.prices.list(
      {
        lookup_keys: [
          lookupKey,
        ],

        active:
          true,

        limit:
          10,
      },
    );

  const existingLookupPrice =
    lookupPrices.data[0];

  // ====================================================
  // 2. VALIDATE EXISTING V2 PRICE
  // ====================================================

  if (existingLookupPrice) {
    const correctProduct =
      typeof existingLookupPrice.product ===
      "string"
        ? existingLookupPrice.product ===
          productId
        : existingLookupPrice.product.id ===
          productId;

    const correctAmount =
      existingLookupPrice.unit_amount ===
      amount;

    const correctCurrency =
      existingLookupPrice.currency ===
      "gbp";

    const correctInterval =
      existingLookupPrice.recurring
        ?.interval ===
      "month";

    if (
      correctProduct &&
      correctAmount &&
      correctCurrency &&
      correctInterval
    ) {
      return {
        lookupKey,

        priceId:
          existingLookupPrice.id,

        amount,

        created:
          false,
      };
    }

    throw new Error(
      `Stripe lookup key ${lookupKey} already exists but does not match the expected £${(
        amount / 100
      ).toFixed(
        2,
      )} monthly price.`,
    );
  }

  // ====================================================
  // 3. CREATE NEW V2 PRICE
  // ====================================================

  const price =
    await stripe.prices.create(
      {
        product:
          productId,

        currency:
          "gbp",

        unit_amount:
          amount,

        recurring: {
          interval:
            "month",
        },

        lookup_key:
          lookupKey,

        metadata: {
          tots_billing_key:
            billingKey,

          tots_billing_model:
            "modular_v2",

          tots_product_type:
            productType,

          tots_module_count:
            moduleCount
              ? String(moduleCount)
              : "",

          tots_source:
            "tots-os",
        },
      },
    );

  return {
    lookupKey,

    priceId:
      price.id,

    amount,

    created:
      true,
  };
}

// ======================================================
// SYNC NORMAL BILLING PRODUCTS
// ======================================================

async function syncBillingProduct(
  key: BillingProductKey,
): Promise<SyncResult> {
  const config =
    BILLING_PRODUCTS[key];

  let productType:
    | "module"
    | "ai"
    | "complete" =
    "module";

  if (
    key === "aiStarter" ||
    key === "aiPlus" ||
    key === "aiPro"
  ) {
    productType =
      "ai";
  }

  if (key === "complete") {
    productType =
      "complete";
  }

  const {
    product,
    created:
      createdProduct,
  } =
    await findOrCreateProduct(
      {
        billingKey:
          key,

        name:
          config.name,

        type:
          productType,
      },
    );

  const lookupKey =
    buildProductLookupKey(
      key,
    );

  const price =
    await findOrCreatePrice(
      {
        productId:
          product.id,

        billingKey:
          key,

        lookupKey,

        amount:
          config.amount,

        productType,
      },
    );

  return {
    key,

    name:
      config.name,

    productId:
      product.id,

    createdProduct,

    price,
  };
}

// ======================================================
// SYNC FIXED BUNDLE
// ======================================================

async function syncFixedBundle(
  bundleKey:
    keyof typeof FIXED_BUNDLES,
): Promise<SyncResult> {
  const config =
    FIXED_BUNDLES[
      bundleKey
    ];

  const {
    product,
    created:
      createdProduct,
  } =
    await findOrCreateProduct(
      {
        billingKey:
          config.key,

        name:
          config.name,

        type:
          "bundle",

        moduleCount:
          config.moduleCount,
      },
    );

  const lookupKey =
    buildBundleLookupKey(
      config.moduleCount,
    );

  const price =
    await findOrCreatePrice(
      {
        productId:
          product.id,

        billingKey:
          config.key,

        lookupKey,

        amount:
          config.amount,

        productType:
          "bundle",

        moduleCount:
          config.moduleCount,
      },
    );

  return {
    key:
      config.key,

    name:
      config.name,

    productId:
      product.id,

    createdProduct,

    price,
  };
}

// ======================================================
// MAIN SYNC
// ======================================================

async function syncStripeProducts() {
  try {
    const results:
      SyncResult[] =
      [];

    // ==================================================
    // 1. MODULES + AI + COMPLETE
    // ==================================================

    const productKeys =
      Object.keys(
        BILLING_PRODUCTS,
      ) as BillingProductKey[];

    for (const key of productKeys) {
      const result =
        await syncBillingProduct(
          key,
        );

      results.push(
        result,
      );
    }

    // ==================================================
    // 2. FIXED MODULE BUNDLES
    // ==================================================

    const bundleKeys =
      Object.keys(
        FIXED_BUNDLES,
      ) as Array<
        keyof typeof FIXED_BUNDLES
      >;

    for (const bundleKey of bundleKeys) {
      const result =
        await syncFixedBundle(
          bundleKey,
        );

      results.push(
        result,
      );
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "TOTS-OS v2 Stripe pricing synced successfully.",

        pricing: {
          module:
            MODULE_BUNDLE_PRICES[1],

          bundle2:
            MODULE_BUNDLE_PRICES[2],

          bundle3:
            MODULE_BUNDLE_PRICES[3],

          bundle4:
            MODULE_BUNDLE_PRICES[4],

          bundle5:
            MODULE_BUNDLE_PRICES[5],

          complete:
            BILLING_PRODUCTS.complete
              .amount,

          aiStarter:
            BILLING_PRODUCTS.aiStarter
              .amount,

          aiPlus:
            BILLING_PRODUCTS.aiPlus
              .amount,

          aiPro:
            BILLING_PRODUCTS.aiPro
              .amount,
        },

        results,
      },
    );
  } catch (error) {
    console.error(
      "[BILLING SYNC] Failed:",
      error,
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to sync Stripe billing products.",
      },
      {
        status:
          500,
      },
    );
  }
}

// ======================================================
// POST
// ======================================================

export async function POST() {
  return syncStripeProducts();
}

// ======================================================
// TEMPORARY GET
//
// Lets you run this once by opening the URL.
//
// REMOVE THIS after Stripe pricing has been synced.
// ======================================================

export async function GET() {
  return syncStripeProducts();
}