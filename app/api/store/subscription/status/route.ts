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

const rawSupabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL
    ?.trim();

const rawSupabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY
    ?.trim();

const rawStripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY
    ?.trim();

const rawStorePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID
    ?.trim();

// ============================================================
// VALIDATE ENVIRONMENT
//
// Assigning the validated values below to explicit `string`
// variables also prevents TypeScript from continuing to treat
// them as `string | undefined` later in this file.
// ============================================================

if (
  !rawSupabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing"
  );
}

if (
  !rawSupabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing"
  );
}

if (
  !rawStripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing"
  );
}

if (
  !rawStorePriceId
) {
  throw new Error(
    "STRIPE_STORE_ADDON_PRICE_ID is missing"
  );
}

const supabaseUrl:
  string =
  rawSupabaseUrl;

const supabaseServiceRoleKey:
  string =
  rawSupabaseServiceRoleKey;

const stripeSecretKey:
  string =
  rawStripeSecretKey;

const storePriceId:
  string =
  rawStorePriceId;

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

type StoreStatusResponse = {
  subscribed:
    boolean;

  storeEnabled:
    boolean;

  status:
    string | null;

  subscriptionId:
    string | null;

  customerId:
    string | null;

  priceId:
    string | null;

  expectedPriceId:
    string;

  correctProduct:
    boolean;

  cancelAtPeriodEnd:
    boolean;

  currentPeriodEnd:
    string | null;

  needsPurchase:
    boolean;

  needsPaymentAttention:
    boolean;

  reason?:
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
// BEARER TOKEN
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

  const token =
    header
      .slice(
        7
      )
      .trim();

  return (
    token ||
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
  // ==========================================================
  // TOKEN
  // ==========================================================

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

  // ==========================================================
  // USER
  // ==========================================================

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
    console.error(
      "[STORE SUBSCRIPTION] Authentication failed:",
      userError
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  const userId =
    userData.user.id;

  let organisationId =
    "";

  // ==========================================================
  // PRIMARY:
  // PROFILES
  // ==========================================================

  try {
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
    } else {
      organisationId =
        cleanString(
          profile
            ?.organisation_id
        );
    }
  } catch (
    profileError
  ) {
    console.warn(
      "[STORE SUBSCRIPTION] Profile lookup exception:",
      profileError
    );
  }

  // ==========================================================
  // FALLBACK:
  // USER_ORGANISATIONS
  // ==========================================================

  if (
    !organisationId
  ) {
    try {
      const {
        data:
          memberships,

        error:
          membershipError,
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

      if (
        membershipError
      ) {
        console.warn(
          "[STORE SUBSCRIPTION] user_organisations lookup failed:",
          membershipError
        );
      } else {
        organisationId =
          cleanString(
            memberships?.[0]
              ?.organisation_id
          );
      }
    } catch (
      membershipError
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] user_organisations exception:",
        membershipError
      );
    }
  }

  // ==========================================================
  // FALLBACK:
  // ORGANISATION_MEMBERS
  // ==========================================================

  if (
    !organisationId
  ) {
    try {
      const {
        data:
          memberships,

        error:
          membershipError,
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

      if (
        membershipError
      ) {
        console.warn(
          "[STORE SUBSCRIPTION] organisation_members lookup failed:",
          membershipError
        );
      } else {
        organisationId =
          cleanString(
            memberships?.[0]
              ?.organisation_id
          );
      }
    } catch (
      membershipError
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] organisation_members exception:",
        membershipError
      );
    }
  }

  // ==========================================================
  // NO ORGANISATION
  // ==========================================================

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
// GET CUSTOMER ID
// ============================================================

function getCustomerId(
  subscription:
    Stripe.Subscription
) {
  if (
    typeof subscription
      .customer ===
    "string"
  ) {
    return subscription
      .customer;
  }

  if (
    subscription
      .customer &&
    typeof subscription
      .customer ===
      "object" &&
    "id" in
      subscription.customer
  ) {
    return subscription
      .customer
      .id;
  }

  return null;
}

// ============================================================
// SUBSCRIPTION PRICE IDS
// ============================================================

function getSubscriptionPriceIds(
  subscription:
    Stripe.Subscription
) {
  return subscription
    .items
    .data
    .map(
      (
        item
      ) =>
        cleanString(
          item
            .price
            ?.id
        )
    )
    .filter(
      (
        priceId
      ):
        priceId is string =>
          Boolean(
            priceId
          )
    );
}

// ============================================================
// HAS CORRECT STORE PRODUCT
//
// SECURITY CRITICAL.
//
// The organisation only gets Store access when its Stripe
// subscription actually contains STRIPE_STORE_ADDON_PRICE_ID.
// ============================================================

function subscriptionHasStorePrice(
  subscription:
    Stripe.Subscription
) {
  const priceIds =
    getSubscriptionPriceIds(
      subscription
    );

  return priceIds.includes(
    storePriceId
  );
}

// ============================================================
// GET STORE PRICE FROM SUBSCRIPTION
// ============================================================

function getStorePriceFromSubscription(
  subscription:
    Stripe.Subscription
) {
  const item =
    subscription
      .items
      .data
      .find(
        (
          subscriptionItem
        ) =>
          subscriptionItem
            .price
            ?.id ===
          storePriceId
      );

  return item
    ?.price
    ?.id ||
    null;
}

// ============================================================
// ACCESS STATUS
//
// Only active/trialing + the exact Store product unlocks
// access.
//
// past_due
// unpaid
// incomplete
// paused
// canceled
// etc.
//
// all remain locked.
// ============================================================

function subscriptionAllowsAccess(
  subscription:
    Stripe.Subscription
) {
  const validStatus =
    [
      "active",
      "trialing",
    ].includes(
      subscription.status
    );

  const correctProduct =
    subscriptionHasStorePrice(
      subscription
    );

  return (
    validStatus &&
    correctProduct
  );
}

// ============================================================
// DOES SUBSCRIPTION STILL EXIST?
//
// A subscription can exist without granting access.
//
// Example:
// past_due -> subscribed but locked
// canceled -> no longer subscribed
// ============================================================

function isExistingSubscription(
  subscription:
    Stripe.Subscription
) {
  return ![
    "canceled",
    "incomplete_expired",
  ].includes(
    subscription.status
  );
}

// ============================================================
// PAYMENT ATTENTION
// ============================================================

function requiresPaymentAttention(
  subscription:
    Stripe.Subscription
) {
  return [
    "past_due",
    "unpaid",
    "incomplete",
    "paused",
  ].includes(
    subscription.status
  );
}

// ============================================================
// SUBSCRIPTION PERIOD END
//
// Different Stripe API / SDK versions expose this slightly
// differently, so this safely checks both the subscription and
// first Store subscription item.
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const subscriptionLike =
    subscription as
      Stripe.Subscription & {
        current_period_end?:
          number |
          null;

        items?: {
          data?: Array<{
            current_period_end?:
              number |
              null;

            price?: {
              id?:
                string;
            };
          }>;
        };
      };

  // ==========================================================
  // SUBSCRIPTION LEVEL
  // ==========================================================

  const subscriptionPeriodEnd =
    subscriptionLike
      .current_period_end;

  if (
    typeof subscriptionPeriodEnd ===
      "number" &&
    subscriptionPeriodEnd >
      0
  ) {
    return new Date(
      subscriptionPeriodEnd *
        1000
    ).toISOString();
  }

  // ==========================================================
  // STORE ITEM
  // ==========================================================

  const storeItem =
    subscriptionLike
      .items
      ?.data
      ?.find(
        (
          item
        ) =>
          item
            .price
            ?.id ===
          storePriceId
      );

  if (
    typeof storeItem
      ?.current_period_end ===
      "number" &&
    storeItem
      .current_period_end >
      0
  ) {
    return new Date(
      storeItem
        .current_period_end *
        1000
    ).toISOString();
  }

  // ==========================================================
  // FIRST ITEM FALLBACK
  // ==========================================================

  const firstItemPeriodEnd =
    subscriptionLike
      .items
      ?.data
      ?.[0]
      ?.current_period_end;

  if (
    typeof firstItemPeriodEnd ===
      "number" &&
    firstItemPeriodEnd >
      0
  ) {
    return new Date(
      firstItemPeriodEnd *
        1000
    ).toISOString();
  }

  return null;
}

// ============================================================
// DISABLE STORE ACCESS
// ============================================================

async function disableStoreAccess({
  organisationId,
  status,
  subscriptionId,
  customerId,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  priceId,
}: {
  organisationId:
    string;

  status:
    string |
    null;

  subscriptionId:
    string |
    null;

  customerId:
    string |
    null;

  currentPeriodEnd:
    string |
    null;

  cancelAtPeriodEnd:
    boolean;

  priceId:
    string |
    null;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations"
      )
      .update({
        store_enabled:
          false,

        store_subscription_status:
          status,

        store_stripe_subscription_id:
          subscriptionId,

        store_stripe_customer_id:
          customerId,

        store_price_id:
          priceId,

        store_current_period_end:
          currentPeriodEnd,

        store_cancel_at_period_end:
          cancelAtPeriodEnd,
      })
      .eq(
        "id",
        organisationId
      );

  if (
    error
  ) {
    console.error(
      "[STORE SUBSCRIPTION] Could not disable Store access:",
      error
    );
  }
}

// ============================================================
// BUILD NO SUBSCRIPTION RESPONSE
// ============================================================

function createNoSubscriptionResponse({
  customerId,
  status = null,
  reason = null,
}: {
  customerId:
    string |
    null;

  status?:
    string |
    null;

  reason?:
    string |
    null;
}): StoreStatusResponse {
  return {
    subscribed:
      false,

    storeEnabled:
      false,

    status,

    subscriptionId:
      null,

    customerId,

    priceId:
      null,

    expectedPriceId:
      storePriceId,

    correctProduct:
      false,

    cancelAtPeriodEnd:
      false,

    currentPeriodEnd:
      null,

    needsPurchase:
      true,

    needsPaymentAttention:
      false,

    reason,
  };
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
    // LOAD DATABASE STATUS
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

    const storedCustomerId =
      cleanString(
        row
          .store_stripe_customer_id
      ) ||
      null;

    // ========================================================
    // NO STRIPE SUBSCRIPTION
    //
    // IMPORTANT:
    //
    // Even if store_enabled was somehow accidentally true in
    // Supabase, NO subscription means NO Store access.
    // ========================================================

    if (
      !subscriptionId
    ) {
      if (
        row.store_enabled ===
          true ||
        row
          .store_subscription_status !==
          null
      ) {
        const {
          error:
            resetError,
        } =
          await supabaseAdmin
            .from(
              "organisations"
            )
            .update({
              store_enabled:
                false,

              store_subscription_status:
                null,

              store_stripe_subscription_id:
                null,

              store_price_id:
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
          resetError
        ) {
          console.warn(
            "[STORE SUBSCRIPTION] No-subscription reset failed:",
            resetError
          );
        }
      }

      const response =
        createNoSubscriptionResponse({
          customerId:
            storedCustomerId,

          reason:
            "no_subscription",
        });

      return NextResponse.json(
        response,
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
    // LOAD LIVE STRIPE SUBSCRIPTION
    //
    // Stripe is the source of truth.
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

      // ======================================================
      // SUBSCRIPTION NO LONGER EXISTS
      // ======================================================

      if (
        missing
      ) {
        console.warn(
          `[STORE SUBSCRIPTION] Stripe subscription ${subscriptionId} no longer exists.`
        );

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

              store_price_id:
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

        const response =
          createNoSubscriptionResponse({
            customerId:
              storedCustomerId,

            status:
              "missing",

            reason:
              "subscription_missing",
          });

        return NextResponse.json(
          response,
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
    // VERIFY THIS IS ACTUALLY THE STORE PRODUCT
    //
    // CRITICAL:
    //
    // We do NOT trust:
    //
    // store_enabled
    // store_price_id
    // subscription status alone
    //
    // We inspect the live Stripe Subscription's actual items.
    // ========================================================

    const correctProduct =
      subscriptionHasStorePrice(
        subscription
      );

    const actualPriceIds =
      getSubscriptionPriceIds(
        subscription
      );

    const actualStorePriceId =
      getStorePriceFromSubscription(
        subscription
      );

    // ========================================================
    // CUSTOMER
    // ========================================================

    const liveCustomerId =
      getCustomerId(
        subscription
      ) ||
      storedCustomerId;

    // ========================================================
    // CURRENT PERIOD END
    // ========================================================

    const currentPeriodEnd =
      getCurrentPeriodEnd(
        subscription
      );

    // ========================================================
    // SUBSCRIPTION FLAGS
    // ========================================================

    const subscriptionExists =
      isExistingSubscription(
        subscription
      );

    const paymentAttention =
      requiresPaymentAttention(
        subscription
      );

    // ========================================================
    // ACCESS
    //
    // ONLY:
    //
    // correct Store product
    // +
    // active/trialing Stripe status
    //
    // can unlock Store.
    // ========================================================

    const storeEnabled =
      subscriptionAllowsAccess(
        subscription
      );

    // ========================================================
    // WRONG PRODUCT
    //
    // A subscription ID being stored against the organisation
    // is not enough.
    //
    // If this is another TOTS subscription/product, Store stays
    // completely locked.
    // ========================================================

    if (
      !correctProduct
    ) {
      console.warn(
        "[STORE SUBSCRIPTION] Organisation has a Stripe subscription but it is NOT the Store add-on:",
        {
          organisationId,

          subscriptionId:
            subscription.id,

          subscriptionStatus:
            subscription.status,

          expectedPriceId:
            storePriceId,

          actualPriceIds,
        }
      );

      await disableStoreAccess({
        organisationId,

        status:
          subscription.status,

        subscriptionId:
          subscription.id,

        customerId:
          liveCustomerId,

        currentPeriodEnd,

        cancelAtPeriodEnd:
          subscription
            .cancel_at_period_end ===
          true,

        /*
         * Do not pretend this is the Store price.
         */
        priceId:
          null,
      });

      const response:
        StoreStatusResponse =
        {
          subscribed:
            false,

          storeEnabled:
            false,

          status:
            subscription.status,

          subscriptionId:
            subscription.id,

          customerId:
            liveCustomerId,

          priceId:
            actualPriceIds[0] ||
            null,

          expectedPriceId:
            storePriceId,

          correctProduct:
            false,

          cancelAtPeriodEnd:
            subscription
              .cancel_at_period_end ===
            true,

          currentPeriodEnd,

          needsPurchase:
            true,

          needsPaymentAttention:
            false,

          reason:
            "wrong_product",
        };

      return NextResponse.json(
        response,
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
    // CORRECT PRODUCT - SYNC LIVE STATUS
    // ========================================================

    const updatePayload:
      Record<
        string,
        unknown
      > =
      {
        store_enabled:
          storeEnabled,

        store_subscription_status:
          subscription.status,

        store_stripe_subscription_id:
          subscription.id,

        store_stripe_customer_id:
          liveCustomerId,

        store_price_id:
          actualStorePriceId,

        store_current_period_end:
          currentPeriodEnd,

        store_cancel_at_period_end:
          subscription
            .cancel_at_period_end ===
          true,
      };

    // ========================================================
    // FIRST ENABLED TIME
    // ========================================================

    if (
      storeEnabled &&
      !row.store_enabled_at
    ) {
      updatePayload.store_enabled_at =
        new Date()
          .toISOString();
    }

    // ========================================================
    // SAVE LIVE STRIPE STATE
    // ========================================================

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
      /*
       * Do not incorrectly return Store access if our own
       * database couldn't be brought into sync.
       *
       * This endpoint is an access gate, so fail closed.
       */
      console.error(
        "[STORE SUBSCRIPTION] Status sync failed:",
        updateError
      );

      throw new Error(
        "Store subscription status could not be synchronised."
      );
    }

    // ========================================================
    // NEEDS PURCHASE
    //
    // If subscription still exists but is merely past_due, the
    // user should manage billing rather than buy a second Store
    // subscription.
    //
    // canceled/incomplete_expired -> buy again.
    // ========================================================

    const needsPurchase =
      !subscriptionExists;

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[STORE SUBSCRIPTION] Status verified:",
      {
        organisationId,

        subscriptionId:
          subscription.id,

        status:
          subscription.status,

        storeEnabled,

        correctProduct,

        expectedPriceId:
          storePriceId,

        actualPriceId:
          actualStorePriceId,

        cancelAtPeriodEnd:
          subscription
            .cancel_at_period_end ===
          true,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    const response:
      StoreStatusResponse =
      {
        subscribed:
          subscriptionExists &&
          correctProduct,

        storeEnabled,

        status:
          subscription.status,

        subscriptionId:
          subscription.id,

        customerId:
          liveCustomerId,

        priceId:
          actualStorePriceId,

        expectedPriceId:
          storePriceId,

        correctProduct,

        cancelAtPeriodEnd:
          subscription
            .cancel_at_period_end ===
          true,

        currentPeriodEnd,

        needsPurchase,

        needsPaymentAttention:
          paymentAttention,

        reason:
          storeEnabled
            ? "active"
            : paymentAttention
              ? "payment_attention"
              : subscription.status,
      };

    return NextResponse.json(
      response,
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

    // ========================================================
    // AUTH ERROR
    // ========================================================

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
            "Store subscription status could not be loaded.",

          stripeError:
            true,

          type:
            error.type,

          code:
            error.code ||
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
    // GENERAL ERROR
    // ========================================================

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