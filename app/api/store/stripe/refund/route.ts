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

type RefundRequest = {
  orderId?:
    string;

  amount?:
    number |
    string |
    null;
};

type StoreStripeAccountRow = {
  id:
    string;

  organisation_id:
    string;

  stripe_account_id:
    string;

  charges_enabled:
    boolean;

  payouts_enabled:
    boolean;

  details_submitted:
    boolean;

  onboarding_complete:
    boolean;

  default_currency:
    string;

  created_at:
    string;

  updated_at:
    string;
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

function firstString(
  ...values:
    unknown[]
) {
  for (
    const value of
    values
  ) {
    const cleaned =
      cleanString(
        value
      );

    if (
      cleaned
    ) {
      return cleaned;
    }
  }

  return "";
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
// MONEY
// ============================================================

function toMinorUnit(
  value:
    number
) {
  return Math.round(
    value *
      100
  );
}

// ============================================================

function formatMoney(
  amountMinor:
    number,

  currency:
    string
) {
  const normalisedCurrency =
    cleanString(
      currency
    ).toUpperCase() ||
    "GBP";

  try {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          normalisedCurrency,
      }
    ).format(
      amountMinor /
        100
    );
  } catch {
    return `${(
      amountMinor /
      100
    ).toFixed(
      2
    )} ${normalisedCurrency}`;
  }
}

// ============================================================
// AUTHENTICATED USER
// ============================================================

async function getAuthenticatedUser(
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
    console.error(
      "[TOTS STRIPE] Refund authentication failed:",
      userError
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  return userData.user;
}

// ============================================================
// ORGANISATION
// ============================================================

async function getOrganisationId(
  userId:
    string
) {
  // ==========================================================
  // PRIMARY: PROFILE
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
    throw profileError;
  }

  let organisationId =
    cleanString(
      profile
        ?.organisation_id
    );

  // ==========================================================
  // FALLBACK: USER ORGANISATIONS
  // ==========================================================

  if (
    !organisationId
  ) {
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
        "[TOTS STRIPE] user_organisations refund lookup failed:",
        membershipError
      );
    } else {
      organisationId =
        cleanString(
          memberships?.[0]
            ?.organisation_id
        );
    }
  }

  // ==========================================================
  // FALLBACK: ORGANISATION MEMBERS
  // ==========================================================

  if (
    !organisationId
  ) {
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
        "[TOTS STRIPE] organisation_members refund lookup failed:",
        membershipError
      );
    } else {
      organisationId =
        cleanString(
          memberships?.[0]
            ?.organisation_id
        );
    }
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
// STRIPE MANAGEMENT PERMISSION
// ============================================================

async function assertStripeManagementPermission({
  userId,
  organisationId,
}: {
  userId:
    string;

  organisationId:
    string;
}) {
  const allowedRoles =
    new Set([
      "owner",
      "admin",
      "administrator",
    ]);

  // ==========================================================
  // TEAM MEMBERS
  // ==========================================================

  try {
    const {
      data:
        member,

      error,
    } =
      await supabaseAdmin
        .from(
          "team_members"
        )
        .select(
          "role"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "user_id",
          userId
        )
        .maybeSingle();

    if (
      !error &&
      member
    ) {
      const role =
        cleanString(
          member.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }
    }

    if (
      error
    ) {
      console.warn(
        "[TOTS STRIPE] team_members refund permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] team_members refund permission check failed:",
      error
    );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  try {
    const {
      data:
        member,

      error,
    } =
      await supabaseAdmin
        .from(
          "organisation_members"
        )
        .select(
          "role"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "user_id",
          userId
        )
        .maybeSingle();

    if (
      !error &&
      member
    ) {
      const role =
        cleanString(
          member.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }
    }

    if (
      error
    ) {
      console.warn(
        "[TOTS STRIPE] organisation_members refund permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation_members refund permission check failed:",
      error
    );
  }

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  try {
    const {
      data:
        member,

      error,
    } =
      await supabaseAdmin
        .from(
          "user_organisations"
        )
        .select(
          "role"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "user_id",
          userId
        )
        .maybeSingle();

    if (
      !error &&
      member
    ) {
      const role =
        cleanString(
          member.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }
    }

    if (
      error
    ) {
      console.warn(
        "[TOTS STRIPE] user_organisations refund permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] user_organisations refund permission check failed:",
      error
    );
  }

  // ==========================================================
  // PROFILE ROLE
  // ==========================================================

  try {
    const {
      data:
        profile,

      error,
    } =
      await supabaseAdmin
        .from(
          "profiles"
        )
        .select(
          "role"
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
      !error &&
      profile
    ) {
      const role =
        cleanString(
          profile.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }
    }

    if (
      error
    ) {
      console.warn(
        "[TOTS STRIPE] profiles refund permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] profiles refund permission check failed:",
      error
    );
  }

  // ==========================================================
  // ORGANISATION OWNER FALLBACK
  // ==========================================================

  try {
    const {
      data:
        organisation,

      error,
    } =
      await supabaseAdmin
        .from(
          "organisations"
        )
        .select(
          "*"
        )
        .eq(
          "id",
          organisationId
        )
        .maybeSingle();

    if (
      !error &&
      organisation
    ) {
      const possibleOwnerIds =
        [
          cleanString(
            organisation
              .user_id
          ),

          cleanString(
            organisation
              .owner_id
          ),

          cleanString(
            organisation
              .created_by
          ),
        ].filter(
          Boolean
        );

      if (
        possibleOwnerIds.includes(
          userId
        )
      ) {
        return;
      }
    }

    if (
      error
    ) {
      console.warn(
        "[TOTS STRIPE] organisation refund owner lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation refund owner check failed:",
      error
    );
  }

  throw new Error(
    "STRIPE_MANAGEMENT_FORBIDDEN"
  );
}

// ============================================================
// GET CONNECTED STRIPE ACCOUNT
// ============================================================

async function getStripeConnection(
  organisationId:
    string
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
    throw error;
  }

  return data as
    | StoreStripeAccountRow
    | null;
}

// ============================================================
// CLEAR STALE STRIPE CONNECTION
// ============================================================

async function clearStaleStripeConnection({
  organisationId,
  accountId,
}: {
  organisationId:
    string;

  accountId:
    string;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_stripe_accounts"
      )
      .delete()
      .eq(
        "organisation_id",
        organisationId
      )
      .eq(
        "stripe_account_id",
        accountId
      );

  if (
    error
  ) {
    console.error(
      "[TOTS STRIPE] Could not remove stale Stripe account:",
      error
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    Request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user =
      await getAuthenticatedUser(
        req
      );

    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisationId =
      await getOrganisationId(
        user.id
      );

    // ========================================================
    // PERMISSION
    //
    // Refunds move money. This must be enforced on the server,
    // not just by hiding the refund button in the UI.
    // ========================================================

    await assertStripeManagementPermission({
      userId:
        user.id,

      organisationId,
    });

    // ========================================================
    // BODY
    // ========================================================

    const body =
      (
        await req
          .json()
          .catch(
            () => ({})
          )
      ) as RefundRequest;

    const orderId =
      cleanString(
        body.orderId
      );

    if (
      !orderId
    ) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
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
    // CONNECTED STRIPE ACCOUNT
    // ========================================================

    const connection =
      await getStripeConnection(
        organisationId
      );

    const accountId =
      cleanString(
        connection
          ?.stripe_account_id
      );

    if (
      !accountId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe is not connected.",

          connectRequired:
            true,
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
    // VERIFY CONNECTED ACCOUNT
    // ========================================================

    try {
      const account =
        await stripe
          .accounts
          .retrieve(
            accountId
          );

      if (
        "deleted" in
          account &&
        account.deleted
      ) {
        throw new Error(
          "STRIPE_ACCOUNT_MISSING"
        );
      }
    } catch (
      accountError:
        unknown
    ) {
      console.error(
        "[TOTS STRIPE] Refund account lookup failed:",
        accountError
      );

      const stripeError =
        accountError as {
          code?:
            string;

          statusCode?:
            number;
        };

      const missing =
        (
          accountError instanceof
            Error &&
          accountError.message ===
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
        await clearStaleStripeConnection({
          organisationId,

          accountId,
        });

        return NextResponse.json(
          {
            error:
              "The connected Stripe account is no longer available. Reconnect Stripe before issuing a refund.",

            reconnectRequired:
              true,
          },
          {
            status:
              410,

            headers: {
              "Cache-Control":
                "no-store",
            },
          }
        );
      }

      throw accountError;
    }

    // ========================================================
    // ORDER
    // ========================================================

    const {
      data:
        order,

      error:
        orderError,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .select(
          "*"
        )
        .eq(
          "id",
          orderId
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (
      orderError
    ) {
      throw orderError;
    }

    if (
      !order
    ) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
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

    // ========================================================
    // VERIFY ORDER BELONGS TO SAME STRIPE ACCOUNT
    //
    // Your store_orders table now contains stripe_account_id.
    // This prevents accidentally refunding against a different
    // connected account after reconnection.
    // ========================================================

    const orderStripeAccountId =
      cleanString(
        order
          .stripe_account_id
      );

    if (
      orderStripeAccountId &&
      orderStripeAccountId !==
        accountId
    ) {
      return NextResponse.json(
        {
          error:
            "This order belongs to a different Stripe account and cannot be refunded from the currently connected account.",

          accountMismatch:
            true,
        },
        {
          status:
            409,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // ALREADY FULLY REFUNDED
    // ========================================================

    const currentPaymentStatus =
      cleanString(
        order
          .payment_status
      ).toLowerCase();

    if (
      currentPaymentStatus ===
      "refunded"
    ) {
      return NextResponse.json(
        {
          error:
            "This order has already been fully refunded.",
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
    // FIND PAYMENT INTENT
    // ========================================================

    let paymentIntentId =
      firstString(
        order
          .stripe_payment_intent_id,

        order
          .payment_intent_id,

        order
          .stripe_payment_intent
      );

    // ========================================================
    // FALLBACK: CHECKOUT SESSION
    // ========================================================

    const checkoutSessionId =
      firstString(
        order
          .stripe_checkout_session_id,

        order
          .stripe_session_id,

        order
          .checkout_session_id
      );

    if (
      !paymentIntentId &&
      checkoutSessionId
    ) {
      const session =
        await stripe
          .checkout
          .sessions
          .retrieve(
            checkoutSessionId,
            {},
            {
              stripeAccount:
                accountId,
            }
          );

      if (
        typeof session
          .payment_intent ===
        "string"
      ) {
        paymentIntentId =
          session
            .payment_intent;
      } else if (
        session
          .payment_intent &&
        typeof session
          .payment_intent ===
          "object"
      ) {
        paymentIntentId =
          session
            .payment_intent
            .id;
      }
    }

    if (
      !paymentIntentId
    ) {
      return NextResponse.json(
        {
          error:
            "No Stripe payment could be found for this order. Make sure the checkout webhook stores the Stripe payment intent ID.",
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
    // PAYMENT INTENT
    // ========================================================

    const paymentIntent =
      await stripe
        .paymentIntents
        .retrieve(
          paymentIntentId,
          {
            expand: [
              "latest_charge",
            ],
          },
          {
            stripeAccount:
              accountId,
          }
        );

    // ========================================================
    // MAKE SURE PAYMENT SUCCEEDED
    // ========================================================

    if (
      paymentIntent.status !==
        "succeeded"
    ) {
      return NextResponse.json(
        {
          error:
            "This payment has not completed successfully and cannot be refunded.",
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

    const paidAmount =
      paymentIntent
        .amount_received ||
      paymentIntent
        .amount ||
      0;

    if (
      paidAmount <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            "This payment has no refundable amount.",
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

    const currency =
      cleanString(
        paymentIntent
          .currency
      ).toLowerCase() ||
      "gbp";

    // ========================================================
    // FIND CHARGE
    // ========================================================

    let charge:
      Stripe.Charge |
      null =
      null;

    if (
      paymentIntent
        .latest_charge
    ) {
      if (
        typeof paymentIntent
          .latest_charge ===
        "string"
      ) {
        charge =
          await stripe
            .charges
            .retrieve(
              paymentIntent
                .latest_charge,
              {},
              {
                stripeAccount:
                  accountId,
              }
            );
      } else {
        charge =
          paymentIntent
            .latest_charge as
            Stripe.Charge;
      }
    }

    // ========================================================
    // EXISTING REFUNDS
    //
    // Stripe is the source of truth here.
    // ========================================================

    let alreadyRefunded =
      charge
        ?.amount_refunded ||
      0;

    // ========================================================
    // FALLBACK: LIST REFUNDS
    //
    // This also handles cases where latest_charge wasn't
    // expanded or isn't available for an older order.
    // ========================================================

    if (
      !charge
    ) {
      try {
        const refunds =
          await stripe
            .refunds
            .list(
              {
                payment_intent:
                  paymentIntentId,

                limit:
                  100,
              },
              {
                stripeAccount:
                  accountId,
              }
            );

        alreadyRefunded =
          refunds.data.reduce(
            (
              total,
              refund
            ) => {
              if (
                refund.status ===
                  "failed" ||
                refund.status ===
                  "canceled"
              ) {
                return total;
              }

              return (
                total +
                refund.amount
              );
            },
            0
          );
      } catch (
        refundLookupError
      ) {
        console.warn(
          "[TOTS STRIPE] Existing refund lookup failed:",
          refundLookupError
        );
      }
    }

    // ========================================================
    // REMAINING REFUNDABLE AMOUNT
    // ========================================================

    const refundableAmount =
      Math.max(
        0,
        paidAmount -
          alreadyRefunded
      );

    if (
      refundableAmount <=
      0
    ) {
      // ======================================================
      // STRIPE SAYS IT IS ALREADY FULLY REFUNDED.
      // KEEP LOCAL ORDER IN SYNC.
      // ======================================================

      const {
        error:
          syncError,
      } =
        await supabaseAdmin
          .from(
            "store_orders"
          )
          .update({
            payment_status:
              "refunded",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            orderId
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        syncError
      ) {
        console.warn(
          "[TOTS STRIPE] Could not sync already-refunded order:",
          syncError
        );
      }

      return NextResponse.json(
        {
          error:
            "This payment has already been fully refunded.",

          alreadyRefunded:
            true,
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
    // REQUESTED REFUND AMOUNT
    //
    // No amount = refund all remaining refundable money.
    // ========================================================

    const rawAmount =
      body.amount;

    const requestedAmount =
      rawAmount ===
        undefined ||
      rawAmount ===
        null ||
      rawAmount ===
        ""
        ? null
        : Number(
            rawAmount
          );

    let refundAmount:
      number;

    // ========================================================
    // FULL REMAINING REFUND
    // ========================================================

    if (
      requestedAmount ===
      null
    ) {
      refundAmount =
        refundableAmount;
    } else {
      // ======================================================
      // VALIDATE NUMBER
      // ======================================================

      if (
        !Number.isFinite(
          requestedAmount
        ) ||
        requestedAmount <=
          0
      ) {
        return NextResponse.json(
          {
            error:
              "Enter a valid refund amount.",
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

      // ======================================================
      // MAXIMUM TWO DECIMAL PLACES
      // ======================================================

      const roundedAmount =
        Math.round(
          requestedAmount *
            100
        ) /
        100;

      if (
        Math.abs(
          requestedAmount -
            roundedAmount
        ) >
        0.000001
      ) {
        return NextResponse.json(
          {
            error:
              "Refund amounts can have a maximum of two decimal places.",
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

      refundAmount =
        toMinorUnit(
          roundedAmount
        );

      if (
        refundAmount <
        1
      ) {
        return NextResponse.json(
          {
            error:
              "Refund amount is too small.",
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

      // ======================================================
      // DO NOT ALLOW OVER-REFUNDING
      // ======================================================

      if (
        refundAmount >
        refundableAmount
      ) {
        return NextResponse.json(
          {
            error:
              `You can refund a maximum of ${formatMoney(
                refundableAmount,
                currency
              )}.`,

            paid:
              paidAmount,

            paidFormatted:
              formatMoney(
                paidAmount,
                currency
              ),

            alreadyRefunded,

            alreadyRefundedFormatted:
              formatMoney(
                alreadyRefunded,
                currency
              ),

            refundable:
              refundableAmount,

            refundableFormatted:
              formatMoney(
                refundableAmount,
                currency
              ),
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
    }

    // ========================================================
    // DETERMINE WHETHER THIS WILL FULLY REFUND PAYMENT
    // ========================================================

    const totalAfterRefund =
      alreadyRefunded +
      refundAmount;

    const isFullRefund =
      totalAfterRefund >=
      paidAmount;

    // ========================================================
    // IDEMPOTENCY KEY
    //
    // Include the amount already refunded so separate legitimate
    // partial refunds of the same amount aren't incorrectly
    // treated as the same request.
    // ========================================================

    const idempotencyKey =
      [
        "tots-refund",
        orderId,
        paymentIntentId,
        alreadyRefunded,
        refundAmount,
      ].join(
        "-"
      );

    // ========================================================
    // CREATE REFUND
    // ========================================================

    const refund =
      await stripe
        .refunds
        .create(
          {
            payment_intent:
              paymentIntentId,

            amount:
              refundAmount,

            metadata: {
              organisation_id:
                organisationId,

              order_id:
                orderId,

              tots_user_id:
                user.id,

              source:
                "tots_os_store",

              previous_refunded_amount:
                String(
                  alreadyRefunded
                ),

              refund_amount:
                String(
                  refundAmount
                ),
            },
          },
          {
            stripeAccount:
              accountId,

            idempotencyKey,
          }
        );

    // ========================================================
    // CALCULATE ACTUAL TOTAL REFUNDED
    // ========================================================

    const totalRefunded =
      Math.min(
        paidAmount,
        alreadyRefunded +
          refund.amount
      );

    const remainingRefundable =
      Math.max(
        0,
        paidAmount -
          totalRefunded
      );

    const fullyRefunded =
      totalRefunded >=
      paidAmount;

    // ========================================================
    // UPDATE ORDER STATUS
    //
    // paid
    // partial_refund
    // refunded
    // ========================================================

    const newPaymentStatus =
      fullyRefunded
        ? "refunded"
        : "partially_refunded";

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "store_orders"
        )
        .update({
          payment_status:
            newPaymentStatus,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          orderId
        )
        .eq(
          "organisation_id",
          organisationId
        );

    if (
      updateError
    ) {
      console.error(
        "[TOTS STRIPE] Refund succeeded but order status update failed:",
        updateError
      );
    }

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STRIPE] Refund created:",
      {
        organisationId,

        userId:
          user.id,

        orderId,

        accountId,

        paymentIntentId,

        refundId:
          refund.id,

        refundAmount:
          refund.amount,

        alreadyRefunded,

        totalRefunded,

        remainingRefundable,

        fullyRefunded,

        status:
          refund.status,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          fullyRefunded
            ? `${formatMoney(
                refund.amount,
                currency
              )} refunded. The order is now fully refunded.`
            : `${formatMoney(
                refund.amount,
                currency
              )} refunded successfully.`,

        fullRefund:
          fullyRefunded,

        partialRefund:
          !fullyRefunded,

        paymentStatus:
          newPaymentStatus,

        refund: {
          id:
            refund.id,

          paymentIntentId,

          amount:
            refund.amount,

          amountFormatted:
            formatMoney(
              refund.amount,
              currency
            ),

          currency:
            refund.currency,

          status:
            refund.status,

          created:
            refund.created,

          createdAt:
            new Date(
              refund.created *
                1000
            ).toISOString(),
        },

        payment: {
          originalAmount:
            paidAmount,

          originalAmountFormatted:
            formatMoney(
              paidAmount,
              currency
            ),

          previouslyRefunded:
            alreadyRefunded,

          previouslyRefundedFormatted:
            formatMoney(
              alreadyRefunded,
              currency
            ),

          totalRefunded,

          totalRefundedFormatted:
            formatMoney(
              totalRefunded,
              currency
            ),

          remainingRefundable,

          remainingRefundableFormatted:
            formatMoney(
              remainingRefundable,
              currency
            ),

          currency,
        },

        order: {
          id:
            orderId,

          paymentStatus:
            newPaymentStatus,
        },
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
      "[TOTS STRIPE] Refund failed:",
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
    // PERMISSION ERROR
    // ========================================================

    if (
      error instanceof
        Error &&
      error.message ===
        "STRIPE_MANAGEMENT_FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only organisation owners and administrators can refund store payments.",

          forbidden:
            true,
        },
        {
          status:
            403,

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
      let message =
        error.message ||
        "The refund could not be processed.";

      if (
        error.code ===
        "charge_already_refunded"
      ) {
        message =
          "This payment has already been fully refunded.";
      }

      return NextResponse.json(
        {
          error:
            message,

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
              : 400,

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
            : "The refund could not be processed.",
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