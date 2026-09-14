import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import {
  syncStoreSubscription,
} from "@/lib/storeSubscriptions";

import {
  syncMtcMembershipsSafely,
} from "@/lib/integrations/mtc/mtc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENV
// ============================================================

function requireEnv(
  name: string
) {
  const value =
    process.env[
      name
    ]?.trim();

  if (
    !value
  ) {
    throw new Error(
      `${name} is missing`
    );
  }

  return value;
}

const supabaseUrl =
  requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL"
  );

const supabaseServiceRoleKey =
  requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

const stripeSecretKey =
  requireEnv(
    "STRIPE_SECRET_KEY"
  );

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

type CancelRequest = {
  organisationId?:
    string;

  subscriptionId?:
    string;

  cancelAtPeriodEnd?:
    boolean;
};

type StoreSubscriptionRow = {
  id:
    string;

  organisation_id:
    string;

  stripe_account_id:
    string;

  stripe_subscription_id:
    string;

  status:
    string;

  cancel_at_period_end:
    boolean;

  metadata?:
    Record<
      string,
      unknown
    > | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function unixToIso(
  value:
    number | null | undefined
) {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value
    )
  ) {
    return null;
  }

  return new Date(
    value *
      1000
  ).toISOString();
}

function stripePeriodStart(
  subscription:
    Stripe.Subscription
) {
  const value =
    (
      subscription as
        Stripe.Subscription & {
          current_period_start?:
            number;
        }
    )
      .current_period_start;

  return unixToIso(
    value
  );
}

function stripePeriodEnd(
  subscription:
    Stripe.Subscription
) {
  const value =
    (
      subscription as
        Stripe.Subscription & {
          current_period_end?:
            number;
        }
    )
      .current_period_end;

  return unixToIso(
    value
  );
}

function stripeCancelledAt(
  subscription:
    Stripe.Subscription
) {
  return unixToIso(
    subscription
      .canceled_at
  );
}

// ============================================================
// AUTH
// ============================================================

async function getAuthenticatedUser(
  req:
    Request
) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization
      .toLowerCase()
      .startsWith(
        "bearer "
      )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(
        7
      )
      .trim();

  if (
    !token
  ) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .auth
      .getUser(
        token
      );

  if (
    error ||
    !data.user
  ) {
    return null;
  }

  return data.user;
}

// ============================================================
// ORGANISATION ACCESS
// ============================================================

async function userCanManageOrganisation({
  userId,
  organisationId,
}: {
  userId:
    string;

  organisationId:
    string;
}) {
  const {
    data:
      membership,
    error:
      membershipError,
  } =
    await supabaseAdmin
      .from(
        "user_organisations"
      )
      .select(
        "user_id, organisation_id"
      )
      .eq(
        "user_id",
        userId
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    !membershipError &&
    membership
  ) {
    return true;
  }

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
        "id, organisation_id"
      )
      .eq(
        "id",
        userId
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .maybeSingle();

  if (
    !profileError &&
    profile
  ) {
    return true;
  }

  return false;
}

// ============================================================
// RESPONSE
// ============================================================

function json(
  body:
    Record<
      string,
      unknown
    >,
  status =
    200
) {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    Request
) {
  try {
    const user =
      await getAuthenticatedUser(
        req
      );

    if (
      !user
    ) {
      return json(
        {
          error:
            "You need to be signed in to manage subscriptions.",
        },
        401
      );
    }

    let body:
      CancelRequest;

    try {
      body =
        await req.json() as
          CancelRequest;
    } catch {
      return json(
        {
          error:
            "Invalid request body.",
        },
        400
      );
    }

    const organisationId =
      cleanString(
        body.organisationId
      );

    const subscriptionId =
      cleanString(
        body.subscriptionId
      );

    const cancelAtPeriodEnd =
      body.cancelAtPeriodEnd !==
      false;

    if (
      !organisationId ||
      !subscriptionId
    ) {
      return json(
        {
          error:
            "organisationId and subscriptionId are required.",
        },
        400
      );
    }

    const canManage =
      await userCanManageOrganisation({
        userId:
          user.id,

        organisationId,
      });

    if (
      !canManage
    ) {
      return json(
        {
          error:
            "You do not have access to manage this organisation.",
        },
        403
      );
    }

    const {
      data:
        subscriptionData,
      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          "store_subscriptions"
        )
        .select(
          `
            id,
            organisation_id,
            stripe_account_id,
            stripe_subscription_id,
            status,
            cancel_at_period_end,
            metadata
          `
        )
        .eq(
          "id",
          subscriptionId
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (
      subscriptionError
    ) {
      throw subscriptionError;
    }

    if (
      !subscriptionData
    ) {
      return json(
        {
          error:
            "Subscription not found.",
        },
        404
      );
    }

    const storeSubscription =
      subscriptionData as
        StoreSubscriptionRow;

    const stripeSubscriptionId =
      cleanString(
        storeSubscription
          .stripe_subscription_id
      );

    const stripeAccountId =
      cleanString(
        storeSubscription
          .stripe_account_id
      );

    if (
      !stripeSubscriptionId
    ) {
      return json(
        {
          error:
            "This membership is not linked to a Stripe subscription.",
        },
        409
      );
    }

    const importedFromMtc =
      storeSubscription
        .metadata
        ?.imported_from_mtc ===
        true;

    const markedNotRealStripe =
      storeSubscription
        .metadata
        ?.real_stripe_subscription ===
        false;

    const legacyMtcId =
      stripeSubscriptionId
        .startsWith(
          "mtc_admin_"
        );

    if (
      importedFromMtc ||
      markedNotRealStripe ||
      legacyMtcId
    ) {
      return json(
        {
          error:
            "This is a legacy imported MTC membership and is not backed by a live Stripe subscription. It cannot be cancelled through Stripe yet.",
        },
        409
      );
    }

    if (
      !stripeAccountId
    ) {
      return json(
        {
          error:
            "This subscription is missing its connected Stripe account.",
        },
        409
      );
    }

    const updatedSubscription =
      await stripe
        .subscriptions
        .update(
          stripeSubscriptionId,
          {
            cancel_at_period_end:
              cancelAtPeriodEnd,
          },
          {
            stripeAccount:
              stripeAccountId,
          }
        );

    /*
     * Persist Stripe's returned state immediately.
     * The Stripe webhook will also receive this change and run the
     * same sync again, which is safe and gives us reconciliation.
     */
    await syncStoreSubscription({
      subscription:
        updatedSubscription,

      stripeAccountId,
    });

    /*
     * Update MTC immediately instead of waiting for webhook delivery.
     * Because cancellation is at period end, the canonical TOTS feed
     * should keep access active until the effective end date.
     */
    await syncMtcMembershipsSafely(
      cancelAtPeriodEnd
        ? "membership_cancelled"
        : "membership_updated"
    );

    return json({
      success:
        true,

      message:
        cancelAtPeriodEnd
          ? "Membership will cancel at the end of the current billing period."
          : "Membership cancellation has been removed and renewals will continue.",

      subscription: {
        id:
          storeSubscription.id,

        stripe_subscription_id:
          updatedSubscription.id,

        status:
          updatedSubscription.status,

        cancel_at_period_end:
          updatedSubscription.cancel_at_period_end,

        cancelled_at:
          stripeCancelledAt(
            updatedSubscription
          ),

        current_period_start:
          stripePeriodStart(
            updatedSubscription
          ),

        current_period_end:
          stripePeriodEnd(
            updatedSubscription
          ),
      },
    });
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS STORE SUBSCRIPTIONS] Cancellation update failed:",
      error
    );

    return json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "The membership could not be updated.",
      },
      500
    );
  }
}
