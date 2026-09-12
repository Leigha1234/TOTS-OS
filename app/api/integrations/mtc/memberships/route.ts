import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is missing`);
  }

  return value.trim();
}

const supabaseUrl =
  requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  );

const supabaseServiceRoleKey =
  requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

const integrationSecret =
  requireEnv(
    "TOTS_MTC_INTEGRATION_SECRET"
  );

const mtcOrganisationId =
  requireEnv(
    "TOTS_MTC_ORGANISATION_ID"
  );

// ============================================================
// CLIENT
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

// ============================================================
// TYPES
// ============================================================

type StoreSubscriptionRow = {
  id: string;

  organisation_id: string;

  order_id:
    | string
    | null;

  product_id:
    | string
    | null;

  customer_id:
    | string
    | null;

  customer_name:
    | string
    | null;

  customer_email:
    | string
    | null;

  customer_phone:
    | string
    | null;

  stripe_subscription_id: string;

  status: string;

  quantity:
    | number
    | null;

  currency:
    | string
    | null;

  unit_amount_pence:
    | number
    | null;

  billing_interval:
    | string
    | null;

  current_period_start:
    | string
    | null;

  current_period_end:
    | string
    | null;

  cancel_at_period_end:
    | boolean
    | null;

  cancelled_at:
    | string
    | null;

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

  purchase_type:
    | string
    | null;

  external_system:
    | string
    | null;

  external_plan_code:
    | string
    | null;

  beneficiary_mode:
    | string
    | null;
};

type StoreSubscriptionBeneficiaryRow = {
  id: string;

  organisation_id: string;

  subscription_id: string;

  customer_id:
    | string
    | null;

  beneficiary_type:
    | string
    | null;

  first_name:
    | string
    | null;

  last_name:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  relationship_to_payer:
    | string
    | null;

  external_user_id:
    | string
    | null;

  is_primary:
    | boolean
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

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

// ============================================================
// CONSTANT-TIME SECRET CHECK
// ============================================================

function secretsMatch(
  supplied: string,
  expected: string
) {
  const suppliedBuffer =
    Buffer.from(
      supplied
    );

  const expectedBuffer =
    Buffer.from(
      expected
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );
}

// ============================================================
// AUTH
// ============================================================

function isAuthorised(
  req: Request
) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    !authorization
  ) {
    return false;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );

  if (
    !match
  ) {
    return false;
  }

  const suppliedSecret =
    cleanString(
      match[1]
    );

  if (
    !suppliedSecret
  ) {
    return false;
  }

  return secretsMatch(
    suppliedSecret,
    integrationSecret
  );
}

// ============================================================
// UPDATED SINCE
// ============================================================

function parseUpdatedSince(
  req: Request
) {
  const url =
    new URL(
      req.url
    );

  const raw =
    cleanString(
      url.searchParams.get(
        "updated_since"
      )
    );

  if (
    !raw
  ) {
    return null;
  }

  const parsed =
    new Date(
      raw
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      "updated_since must be a valid ISO date."
    );
  }

  return parsed.toISOString();
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req: Request
) {
  try {
    // ========================================================
    // AUTHORISE
    // ========================================================

    if (
      !isAuthorised(
        req
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorised.",
        },
        {
          status:
            401,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // OPTIONAL INCREMENTAL SYNC
    // ========================================================

    let updatedSince:
      string | null =
      null;

    try {
      updatedSince =
        parseUpdatedSince(
          req
        );
    } catch (
      error
    ) {
      return NextResponse.json(
        {
          error:
            error instanceof
              Error
              ? error.message
              : "Invalid updated_since value.",
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
    // LOAD MTC-MAPPED PRODUCTS
    // ========================================================

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
            purchase_type,
            external_system,
            external_plan_code,
            beneficiary_mode
          `
        )
        .eq(
          "organisation_id",
          mtcOrganisationId
        )
        .eq(
          "external_system",
          "mtc"
        );

    if (
      productError
    ) {
      console.error(
        "[TOTS MTC INTEGRATION] Product lookup failed:",
        productError
      );

      throw new Error(
        "MTC membership products could not be loaded."
      );
    }

    const products =
      (
        productData ||
        []
      ) as StoreProductRow[];

    const mappedProducts =
      products.filter(
        (
          product
        ) =>
          cleanString(
            product.external_plan_code
          )
      );

    const productIds =
      mappedProducts.map(
        (
          product
        ) =>
          product.id
      );

    if (
      productIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            true,

          organisationId:
            mtcOrganisationId,

          generatedAt:
            new Date()
              .toISOString(),

          updatedSince,

          memberships:
            [],
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
    }

    const productById =
      new Map(
        mappedProducts.map(
          (
            product
          ) => [
            product.id,
            product,
          ]
        )
      );

    // ========================================================
    // LOAD SUBSCRIPTIONS
    // ========================================================

    let subscriptionQuery =
      supabaseAdmin
        .from(
          "store_subscriptions"
        )
        .select(
          `
            id,
            organisation_id,
            order_id,
            product_id,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            stripe_subscription_id,
            status,
            quantity,
            currency,
            unit_amount_pence,
            billing_interval,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            cancelled_at,
            created_at,
            updated_at
          `
        )
        .eq(
          "organisation_id",
          mtcOrganisationId
        )
        .in(
          "product_id",
          productIds
        )
        .order(
          "updated_at",
          {
            ascending:
              true,
          }
        );

    if (
      updatedSince
    ) {
      subscriptionQuery =
        subscriptionQuery.gte(
          "updated_at",
          updatedSince
        );
    }

    const {
      data:
        subscriptionData,

      error:
        subscriptionError,
    } =
      await subscriptionQuery;

    if (
      subscriptionError
    ) {
      console.error(
        "[TOTS MTC INTEGRATION] Subscription lookup failed:",
        subscriptionError
      );

      throw new Error(
        "MTC subscriptions could not be loaded."
      );
    }

    const subscriptions =
      (
        subscriptionData ||
        []
      ) as StoreSubscriptionRow[];

    const subscriptionIds =
      subscriptions.map(
        (
          subscription
        ) =>
          subscription.id
      );

    // ========================================================
    // LOAD BENEFICIARIES
    // ========================================================

    let beneficiaries:
      StoreSubscriptionBeneficiaryRow[] =
      [];

    if (
      subscriptionIds.length >
      0
    ) {
      const {
        data:
          beneficiaryData,

        error:
          beneficiaryError,
      } =
        await supabaseAdmin
          .from(
            "store_subscription_beneficiaries"
          )
          .select(
            `
              id,
              organisation_id,
              subscription_id,
              customer_id,
              beneficiary_type,
              first_name,
              last_name,
              email,
              phone,
              relationship_to_payer,
              external_user_id,
              is_primary,
              is_active,
              created_at,
              updated_at
            `
          )
          .eq(
            "organisation_id",
            mtcOrganisationId
          )
          .in(
            "subscription_id",
            subscriptionIds
          )
          .order(
            "created_at",
            {
              ascending:
                true,
            }
          );

      if (
        beneficiaryError
      ) {
        console.error(
          "[TOTS MTC INTEGRATION] Beneficiary lookup failed:",
          beneficiaryError
        );

        throw new Error(
          "MTC membership beneficiaries could not be loaded."
        );
      }

      beneficiaries =
        (
          beneficiaryData ||
          []
        ) as
          StoreSubscriptionBeneficiaryRow[];
    }

    const beneficiariesBySubscription =
      new Map<
        string,
        StoreSubscriptionBeneficiaryRow[]
      >();

    for (
      const beneficiary of
      beneficiaries
    ) {
      const current =
        beneficiariesBySubscription.get(
          beneficiary
            .subscription_id
        ) ||
        [];

      current.push(
        beneficiary
      );

      beneficiariesBySubscription.set(
        beneficiary
          .subscription_id,
        current
      );
    }

    // ========================================================
    // RESPONSE SHAPE
    // ========================================================

    const memberships =
      subscriptions.map(
        (
          subscription
        ) => {
          const product =
            subscription.product_id
              ? productById.get(
                  subscription.product_id
                )
              : null;

          if (
            !product
          ) {
            return null;
          }

          return {
            subscriptionId:
              subscription.id,

            stripeSubscriptionId:
              subscription
                .stripe_subscription_id,

            customerId:
              subscription
                .customer_id,

            payer: {
              name:
                subscription
                  .customer_name,

              email:
                subscription
                  .customer_email,

              phone:
                subscription
                  .customer_phone,
            },

            product: {
              id:
                product.id,

              name:
                product.name,

              planCode:
                product
                  .external_plan_code,

              beneficiaryMode:
                product
                  .beneficiary_mode,
            },

            subscription: {
              status:
                subscription.status,

              quantity:
                subscription
                  .quantity,

              currency:
                subscription
                  .currency,

              unitAmountPence:
                subscription
                  .unit_amount_pence,

              billingInterval:
                subscription
                  .billing_interval,

              currentPeriodStart:
                subscription
                  .current_period_start,

              currentPeriodEnd:
                subscription
                  .current_period_end,

              cancelAtPeriodEnd:
                subscription
                  .cancel_at_period_end ===
                true,

              cancelledAt:
                subscription
                  .cancelled_at,
            },

            beneficiaries:
              (
                beneficiariesBySubscription.get(
                  subscription.id
                ) ||
                []
              ).map(
                (
                  beneficiary
                ) => ({
                  id:
                    beneficiary.id,

                  customerId:
                    beneficiary
                      .customer_id,

                  type:
                    beneficiary
                      .beneficiary_type,

                  firstName:
                    beneficiary
                      .first_name,

                  lastName:
                    beneficiary
                      .last_name,

                  email:
                    beneficiary
                      .email,

                  phone:
                    beneficiary
                      .phone,

                  relationshipToPayer:
                    beneficiary
                      .relationship_to_payer,

                  externalUserId:
                    beneficiary
                      .external_user_id,

                  isPrimary:
                    beneficiary
                      .is_primary ===
                    true,

                  isActive:
                    beneficiary
                      .is_active !==
                    false,

                  updatedAt:
                    beneficiary
                      .updated_at,
                })
              ),

            createdAt:
              subscription
                .created_at,

            updatedAt:
              subscription
                .updated_at,
          };
        }
      )
      .filter(
        (
          membership
        ) =>
          membership !==
          null
      );

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        organisationId:
          mtcOrganisationId,

        generatedAt:
          new Date()
            .toISOString(),

        updatedSince,

        memberships,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",

          /*
           * This endpoint is server-to-server only.
           * Do not add permissive CORS headers.
           */
        },
      }
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS MTC INTEGRATION] Membership feed failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "The MTC membership feed could not be loaded.",
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
