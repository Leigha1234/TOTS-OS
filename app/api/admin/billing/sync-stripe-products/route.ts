import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  BILLING_PRODUCTS,
  type BillingProductKey,
} from "@/lib/billing-config";

export const runtime = "nodejs";

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

type PriceVariant =
  | "standard"
  | "bundle_10"
  | "bundle_20";

type SyncedPrice = {
  variant: PriceVariant;
  priceId: string;
  amount: number;
  created: boolean;
};

// ======================================================
// MAIN MODULES
// ======================================================

const MAIN_MODULE_KEYS: BillingProductKey[] = [
  "core",
  "clientsProjects",
  "finance",
  "social",
  "email",
  "store",
];

// ======================================================
// PRICE HELPERS
// ======================================================

function getPriceVariants(
  key: BillingProductKey,
  standardAmount: number,
): Array<{
  variant: PriceVariant;
  amount: number;
}> {
  // AI + Complete do NOT get module bundle discounts
  if (!MAIN_MODULE_KEYS.includes(key)) {
    return [
      {
        variant: "standard",
        amount: standardAmount,
      },
    ];
  }

  return [
    {
      variant: "standard",
      amount: standardAmount,
    },
    {
      variant: "bundle_10",
      amount: Math.round(
        standardAmount * 0.9,
      ),
    },
    {
      variant: "bundle_20",
      amount: Math.round(
        standardAmount * 0.8,
      ),
    },
  ];
}

// ======================================================
// LOOKUP KEY
// ======================================================

function buildLookupKey(
  billingKey: string,
  variant: PriceVariant,
) {
  return `tots_${billingKey}_monthly_${variant}`;
}

// ======================================================
// SYNC
// ======================================================

async function syncStripeProducts() {
  try {
    const results: Array<{
      key: BillingProductKey;
      name: string;
      productId: string;
      createdProduct: boolean;
      prices: SyncedPrice[];
    }> = [];

    const productKeys =
      Object.keys(
        BILLING_PRODUCTS,
      ) as BillingProductKey[];

    for (const key of productKeys) {
      const config =
        BILLING_PRODUCTS[key];

      let product:
        Stripe.Product | null =
        null;

      let createdProduct =
        false;

      // ============================================
      // 1. FIND EXISTING PRODUCT
      // ============================================

      const productSearch =
        await stripe.products.search(
          {
            query:
              `metadata['tots_billing_key']:'${key}'`,
          },
        );

      product =
        productSearch.data[0] ??
        null;

      // ============================================
      // 2. CREATE PRODUCT IF MISSING
      // ============================================

      if (!product) {
        product =
          await stripe.products.create(
            {
              name:
                config.name,

              active:
                true,

              metadata: {
                tots_billing_key:
                  key,

                tots_billing_model:
                  "modular",

                tots_source:
                  "tots-os",
              },
            },
          );

        createdProduct =
          true;
      }

      // ============================================
      // 3. GET ACTIVE PRICES FOR PRODUCT
      // ============================================

      const existingPrices =
        await stripe.prices.list(
          {
            product:
              product.id,

            active:
              true,

            limit:
              100,
          },
        );

      const priceResults:
        SyncedPrice[] =
        [];

      const variants =
        getPriceVariants(
          key,
          config.amount,
        );

      // ============================================
      // 4. SYNC EACH PRICE VARIANT
      // ============================================

      for (const variantConfig of variants) {
        const {
          variant,
          amount,
        } =
          variantConfig;

        const lookupKey =
          buildLookupKey(
            key,
            variant,
          );

        // ==========================================
        // TRY LOOKUP KEY FIRST
        // ==========================================

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

        let matchingPrice:
          Stripe.Price | undefined =
          lookupPrices.data[0];

        // ==========================================
        // FALLBACK:
        // MATCH EXISTING PRODUCT PRICE
        // ==========================================

        if (!matchingPrice) {
          matchingPrice =
            existingPrices.data.find(
              (price) =>
                price.currency ===
                  "gbp" &&
                price.unit_amount ===
                  amount &&
                price.recurring
                  ?.interval ===
                  "month",
            );
        }

        // ==========================================
        // CREATE IF MISSING
        // ==========================================

        let created =
          false;

        if (!matchingPrice) {
          matchingPrice =
            await stripe.prices.create(
              {
                product:
                  product.id,

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
                    key,

                  tots_price_variant:
                    variant,

                  tots_billing_model:
                    "modular",

                  tots_source:
                    "tots-os",
                },
              },
            );

          created =
            true;
        }

        // ==========================================
        // SAVE PRICE RESULT
        // ==========================================

        priceResults.push(
          {
            variant,

            priceId:
              matchingPrice.id,

            amount,

            created,
          },
        );
      }

      // ============================================
      // 5. SAVE PRODUCT RESULT
      // ============================================

      results.push(
        {
          key,

          name:
            config.name,

          productId:
            product.id,

          createdProduct,

          prices:
            priceResults,
        },
      );
    }

    // ==============================================
    // SUCCESS
    // ==============================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Stripe billing products and bundle prices synced successfully.",

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
// This lets you run the sync by opening the URL
// in your browser.
//
// REMOVE THIS once Stripe setup is finished.
// ======================================================

export async function GET() {
  return syncStripeProducts();
}