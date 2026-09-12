import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  BILLING_PRODUCTS,
  type BillingProductKey,
} from "@/lib/billing-config";

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

export async function POST() {
  try {
    const results: Array<{
      key: BillingProductKey;
      name: string;
      productId: string;
      priceId: string;
      createdProduct: boolean;
      createdPrice: boolean;
    }> = [];

    const productKeys =
      Object.keys(
        BILLING_PRODUCTS,
      ) as BillingProductKey[];

    for (
      const key of productKeys
    ) {
      const config =
        BILLING_PRODUCTS[
          key
        ];

      let product:
        Stripe.Product | null =
        null;

      let createdProduct =
        false;

      let createdPrice =
        false;

      // ============================================
      // 1. LOOK FOR EXISTING PRODUCT
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

              active: true,

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
      // 3. LOOK FOR MATCHING MONTHLY PRICE
      // ============================================

      const prices =
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

      let matchingPrice =
        prices.data.find(
          (
            price,
          ) =>
            price.currency ===
              "gbp" &&
            price.unit_amount ===
              config.amount &&
            price.recurring
              ?.interval ===
              "month",
        );

      // ============================================
      // 4. CREATE PRICE IF MISSING
      // ============================================

      if (
        !matchingPrice
      ) {
        matchingPrice =
          await stripe.prices.create(
            {
              product:
                product.id,

              currency:
                "gbp",

              unit_amount:
                config.amount,

              recurring: {
                interval:
                  "month",
              },

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

        createdPrice =
          true;
      }

      // ============================================
      // 5. SAVE RESULT
      // ============================================

      results.push({
        key,

        name:
          config.name,

        productId:
          product.id,

        priceId:
          matchingPrice.id,

        createdProduct,

        createdPrice,
      });
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Stripe billing products synced successfully.",

        results,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "[BILLING SYNC] Failed:",
      error,
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error instanceof
            Error
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