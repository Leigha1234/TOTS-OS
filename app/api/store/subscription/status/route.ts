import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import Stripe from "stripe";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

const storePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID;

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !supabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (!storePriceId) {
  throw new Error(
    "STRIPE_STORE_ADDON_PRICE_ID is missing"
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

type OrganisationStoreRow = {
  id:
    string;

  store_enabled:
    boolean | null;

  store_subscription_status:
    string | null;

  store_stripe_subscription_id:
    string | null;

  store_stripe_customer_id:
    string | null;

  store_price_id:
    string | null;

  store_current_period_end:
    string | null;

  store_cancel_at_period_end:
    boolean | null;

  store_enabled_at:
    string | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
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

function getBearerToken(
  req:
    Request
) {
  const header =
    req.headers.get(
      "authorization"
    );

  if (
    !header ||
    !header
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  return (
    header
      .slice(
        7
      )
      .trim() ||
    null
  );
}

// ============================================================
// AUTH / ORGANISATION
// ============================================================

async function getOrganisationId(
  req:
    Request
) {
  const token =
    getBearerToken(
      req
    );

  if (
    !token
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const {
    data:
      userData,

    error:
      userError,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        token
      );

  if (
    userError ||
    !userData.user
  ) {
    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const userId =
    userData.user.id;

  // ==========================================================
  // PROFILE
  // ==========================================================

  const {
    data:
      profile,

    error:
      profileError,
  } =
    await supabaseAdmin
      .from(
        "profiles"
      )
      .select(
        "organisation_id"
      )
      .eq(
        "id",
        userId
      )
      .maybeSingle();

  if (
    profileError
  ) {
    console.warn(
      "[STORE SUBSCRIPTION] Profile lookup failed:",
      profileError
    );
  }

  let organisationId =
    cleanString(
      profile
        ?.organisation_id
    );

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  if (
    !organisationId
  ) {
    const {
      data:
        memberships,
    } =
      await supabaseAdmin
        .from(
          "user_organisations"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          userId
        )
        .limit(
          1
        );

    organisationId =
      cleanString(
        memberships?.[0]
          ?.organisation_id
      );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  if (
    !organisationId
  ) {
    const {
      data:
        memberships,
    } =
      await supabaseAdmin
        .from(
          "organisation_members"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "user_id",
          userId
        )
        .limit(
          1
        );

    organisationId =
      cleanString(
        memberships?.[0]
          ?.organisation_id
      );
  }

  if (
    !organisationId
  ) {
    throw new Error(
      "No organisation is linked to this account."
    );
  }

  return organisationId;
}

// ============================================================
// SUBSCRIPTION PERIOD END
//
// Stripe typings can vary depending on the Stripe SDK/API
// version, so this safely extracts the current period end.
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const subscriptionLike =
    subscription as Stripe.Subscription & {
      current_period_end?:
        number;

      items?: {
        data?: Array<{
          current_period_end?:
            number;
        }>;
      };
    };

  const value =
    subscriptionLike
      .current_period_end ||
    subscriptionLike
      .items
      ?.data?.[0]
      ?.current_period_end ||
    null;

  if (
    !value
  ) {
    return null;
  }

  return new Date(
    value *
      1000
  ).toISOString();
}

// ============================================================
// GET
// ============================================================

export async function GET(
  req:
    Request
) {
  try {
    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisationId =
      await getOrganisationId(
        req
      );

    // ========================================================
    // DATABASE STATUS
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .select(
          `
            id,
            store_enabled,
            store_subscription_status,
            store_stripe_subscription_id,
            store_stripe_customer_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      throw organisationError;
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          error:
            "Organisation could not be found.",
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

    const row =
      organisation as
        OrganisationStoreRow;

    const subscriptionId =
      cleanString(
        row
          .store_stripe_subscription_id
      );

    // ========================================================
    // NO SUBSCRIPTION
    // ========================================================

    if (
      !subscriptionId
    ) {
      return NextResponse.json(
        {
          subscribed:
            false,

          storeEnabled:
            false,

          status:
            null,

          subscriptionId:
            null,

          customerId:
            row
              .store_stripe_customer_id ||
            null,

          priceId:
            storePriceId,

          cancelAtPeriodEnd:
            false,

          currentPeriodEnd:
            null,

          needsPurchase:
            true,
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

    // ========================================================
    // LIVE STRIPE SUBSCRIPTION
    // ========================================================

    let subscription:
      Stripe.Subscription;

    try {
      subscription =
        await stripe
          .subscriptions
          .retrieve(
            subscriptionId
          );
    } catch (
      subscriptionError:
        unknown
    ) {
      const stripeError =
        subscriptionError as {
          code?:
            string;

          statusCode?:
            number;
        };

      const missing =
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
            cleanupError,
        } =
          await supabaseAdmin
            .from(
              "organisations"
            )
            .update({
              store_enabled:
                false,

              store_subscription_status:
                "missing",

              store_stripe_subscription_id:
                null,

              store_current_period_end:
                null,

              store_cancel_at_period_end:
                false,
            })
            .eq(
              "id",
              organisationId
            );

        if (
          cleanupError
        ) {
          console.error(
            "[STORE SUBSCRIPTION] Missing subscription cleanup failed:",
            cleanupError
          );
        }

        return NextResponse.json(
          {
            subscribed:
              false,

            storeEnabled:
              false,

            status:
              "missing",

            subscriptionId:
              null,

            customerId:
              row
                .store_stripe_customer_id ||
              null,

            priceId:
              storePriceId,

            cancelAtPeriodEnd:
              false,

            currentPeriodEnd:
              null,

            needsPurchase:
              true,
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

      throw subscriptionError;
    }

    // ========================================================
    // ACCESS STATUS
    // ========================================================

    const storeEnabled =
      [
        "active",
        "trialing",
      ].includes(
        subscription.status
      );

    const subscribed =
      ![
        "canceled",
        "incomplete_expired",
      ].includes(
        subscription.status
      );

    // ========================================================
    // PERIOD END
    // ========================================================

    const currentPeriodEnd =
      getCurrentPeriodEnd(
        subscription
      );

    // ========================================================
    // CUSTOMER
    // ========================================================

    const customerId =
      typeof subscription
        .customer ===
      "string"
        ? subscription
            .customer
        : subscription
            .customer
            ?.id ||
          row
            .store_stripe_customer_id ||
          null;

    // ========================================================
    // PRICE
    // ========================================================

    const actualPriceId =
      subscription
        .items
        .data?.[0]
        ?.price
        ?.id ||
      row.store_price_id ||
      storePriceId;

    // ========================================================
    // SAVE LIVE STATUS
    // ========================================================

    const updatePayload: Record<
      string,
      unknown
    > = {
      store_enabled:
        storeEnabled,

      store_subscription_status:
        subscription.status,

      store_stripe_subscription_id:
        subscription.id,

      store_stripe_customer_id:
        customerId,

      store_price_id:
        actualPriceId,

      store_current_period_end:
        currentPeriodEnd,

      store_cancel_at_period_end:
        subscription
          .cancel_at_period_end ===
        true,
    };

    if (
      storeEnabled &&
      !row.store_enabled_at
    ) {
      updatePayload.store_enabled_at =
        new Date()
          .toISOString();
    }

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .update(
          updatePayload
        )
        .eq(
          "id",
          organisationId
        );

    if (
      updateError
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] Status sync failed:",
        updateError
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        subscribed,

        storeEnabled,

        status:
          subscription.status,

        subscriptionId:
          subscription.id,

        customerId,

        priceId:
          actualPriceId,

        expectedPriceId:
          storePriceId,

        correctProduct:
          actualPriceId ===
          storePriceId,

        cancelAtPeriodEnd:
          subscription
            .cancel_at_period_end ===
          true,

        currentPeriodEnd,

        needsPurchase:
          !subscribed,

        needsPaymentAttention:
          [
            "past_due",
            "unpaid",
            "incomplete",
          ].includes(
            subscription.status
          ),
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
      "[STORE SUBSCRIPTION] Status failed:",
      error
    );

    if (
      error instanceof
        Error &&
      error.message ===
        "UNAUTHENTICATED"
    ) {
      return NextResponse.json(
        {
          error:
            "You need to sign in again.",
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

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Store subscription status could not be loaded.",
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