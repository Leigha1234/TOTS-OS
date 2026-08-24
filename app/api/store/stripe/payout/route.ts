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

type PayoutRequest = {
  amount?:
    number |
    string;

  currency?:
    string;
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
// TO MINOR CURRENCY UNIT
//
// For GBP this converts:
//
// £12.34 -> 1234 pence
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
// FORMAT MONEY
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
    return (
      `${(
        amountMinor /
        100
      ).toFixed(
        2
      )} ${normalisedCurrency}`
    );
  }
}

// ============================================================
// AUTH + ORGANISATION CONTEXT
// ============================================================

async function getContext(
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
      "[TOTS STRIPE] Payout auth failed:",
      userError
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  // ==========================================================
  // PRIMARY ORGANISATION LOOKUP
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
        userData.user.id
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
          userData.user.id
        )
        .limit(
          1
        );

    if (
      membershipError
    ) {
      console.warn(
        "[TOTS STRIPE] user_organisations payout lookup failed:",
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
          userData.user.id
        )
        .limit(
          1
        );

    if (
      membershipError
    ) {
      console.warn(
        "[TOTS STRIPE] organisation_members payout lookup failed:",
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

  return {
    user:
      userData.user,

    organisationId,
  };
}

// ============================================================
// PAYOUT PERMISSION
//
// Withdrawals are deliberately restricted to elevated users.
//
// We support the membership structures TOTS-OS currently uses
// so the check remains compatible with older workspaces.
//
// IMPORTANT:
// This is the server-side security check. Hiding the button in
// the UI is useful UX, but this is what actually protects funds.
// ============================================================

async function assertPayoutPermission({
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
        teamMember,

      error:
        teamMemberError,
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
      !teamMemberError &&
      teamMember
    ) {
      const role =
        cleanString(
          teamMember.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }

      throw new Error(
        "PAYOUT_FORBIDDEN"
      );
    }

    if (
      teamMemberError
    ) {
      console.warn(
        "[TOTS STRIPE] team_members payout permission lookup failed:",
        teamMemberError
      );
    }
  } catch (
    error:
      unknown
  ) {
    if (
      error instanceof
        Error &&
      error.message ===
        "PAYOUT_FORBIDDEN"
    ) {
      throw error;
    }

    console.warn(
      "[TOTS STRIPE] team_members payout permission check failed:",
      error
    );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  try {
    const {
      data:
        organisationMember,

      error:
        organisationMemberError,
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
      !organisationMemberError &&
      organisationMember
    ) {
      const role =
        cleanString(
          organisationMember.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }

      throw new Error(
        "PAYOUT_FORBIDDEN"
      );
    }

    if (
      organisationMemberError
    ) {
      console.warn(
        "[TOTS STRIPE] organisation_members payout permission lookup failed:",
        organisationMemberError
      );
    }
  } catch (
    error:
      unknown
  ) {
    if (
      error instanceof
        Error &&
      error.message ===
        "PAYOUT_FORBIDDEN"
    ) {
      throw error;
    }

    console.warn(
      "[TOTS STRIPE] organisation_members payout permission check failed:",
      error
    );
  }

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  try {
    const {
      data:
        userOrganisation,

      error:
        userOrganisationError,
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
      !userOrganisationError &&
      userOrganisation
    ) {
      const role =
        cleanString(
          userOrganisation.role
        ).toLowerCase();

      if (
        allowedRoles.has(
          role
        )
      ) {
        return;
      }

      throw new Error(
        "PAYOUT_FORBIDDEN"
      );
    }

    if (
      userOrganisationError
    ) {
      console.warn(
        "[TOTS STRIPE] user_organisations payout permission lookup failed:",
        userOrganisationError
      );
    }
  } catch (
    error:
      unknown
  ) {
    if (
      error instanceof
        Error &&
      error.message ===
        "PAYOUT_FORBIDDEN"
    ) {
      throw error;
    }

    console.warn(
      "[TOTS STRIPE] user_organisations payout permission check failed:",
      error
    );
  }

  // ==========================================================
  // PROFILE FALLBACK
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
      !profileError &&
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

      throw new Error(
        "PAYOUT_FORBIDDEN"
      );
    }

    if (
      profileError
    ) {
      console.warn(
        "[TOTS STRIPE] profiles payout permission lookup failed:",
        profileError
      );
    }
  } catch (
    error:
      unknown
  ) {
    if (
      error instanceof
        Error &&
      error.message ===
        "PAYOUT_FORBIDDEN"
    ) {
      throw error;
    }

    console.warn(
      "[TOTS STRIPE] profiles payout permission check failed:",
      error
    );
  }

  // ==========================================================
  // NO ELEVATED ROLE FOUND
  // ==========================================================

  throw new Error(
    "PAYOUT_FORBIDDEN"
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

  return (
    data as
      StoreStripeAccountRow |
      null
  );
}

// ============================================================
// SYNC LIVE STRIPE ACCOUNT STATUS
// ============================================================

async function syncStripeAccount({
  connection,
  account,
}: {
  connection:
    StoreStripeAccountRow;

  account:
    Stripe.Account;
}) {
  const onboardingComplete =
    account
      .details_submitted ===
      true &&
    account
      .charges_enabled ===
      true &&
    account
      .payouts_enabled ===
      true;

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_stripe_accounts"
      )
      .update({
        charges_enabled:
          account
            .charges_enabled ===
          true,

        payouts_enabled:
          account
            .payouts_enabled ===
          true,

        details_submitted:
          account
            .details_submitted ===
          true,

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
    error
  ) {
    console.warn(
      "[TOTS STRIPE] Stripe account status sync failed during payout:",
      error
    );
  }

  return onboardingComplete;
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

    const {
      user,
      organisationId,
    } =
      await getContext(
        req
      );

    // ========================================================
    // PAYOUT AUTHORISATION
    // ========================================================

    await assertPayoutPermission({
      userId:
        user.id,

      organisationId,
    });

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      (
        await req
          .json()
          .catch(
            () => ({})
          )
      ) as PayoutRequest;

    const amount =
      Number(
        body?.amount
      );

    // ========================================================
    // VALIDATE AMOUNT
    // ========================================================

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <=
        0
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid payout amount.",
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
    // LIMIT TO TWO DECIMAL PLACES
    // ========================================================

    const roundedAmount =
      Math.round(
        amount *
          100
      ) /
      100;

    if (
      Math.abs(
        amount -
          roundedAmount
      ) >
      0.000001
    ) {
      return NextResponse.json(
        {
          error:
            "Payout amounts can have a maximum of two decimal places.",
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

    const amountMinor =
      toMinorUnit(
        roundedAmount
      );

    if (
      amountMinor <
      1
    ) {
      return NextResponse.json(
        {
          error:
            "Payout amount is too small.",
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

    if (
      !connection
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

    const accountId =
      cleanString(
        connection
          .stripe_account_id
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
    // LOAD LIVE STRIPE ACCOUNT
    // ========================================================

    let account:
      Stripe.Account;

    try {
      const accountResult =
        await stripe
          .accounts
          .retrieve(
            accountId
          );

      if (
        "deleted" in
          accountResult &&
        accountResult.deleted
      ) {
        throw new Error(
          "STRIPE_ACCOUNT_MISSING"
        );
      }

      account =
        accountResult as
          Stripe.Account;
    } catch (
      accountError:
        unknown
    ) {
      console.error(
        "[TOTS STRIPE] Payout account lookup failed:",
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
        // ====================================================
        // CLEAR STALE CONNECTION
        // ====================================================

        const {
          error:
            deleteError,
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
          deleteError
        ) {
          console.error(
            "[TOTS STRIPE] Unable to remove stale Stripe account:",
            deleteError
          );
        }

        return NextResponse.json(
          {
            error:
              "The connected Stripe account is no longer available. Reconnect Stripe before requesting a payout.",

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
    // SYNC ACCOUNT STATE
    // ========================================================

    const onboardingComplete =
      await syncStripeAccount({
        connection,
        account,
      });

    // ========================================================
    // ONBOARDING
    // ========================================================

    if (
      account
        .details_submitted !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "Complete your Stripe onboarding before withdrawing money.",

          onboardingRequired:
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
    // PAYOUTS ENABLED
    // ========================================================

    if (
      account
        .payouts_enabled !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe payouts are not enabled for this account yet. Check your Stripe account requirements.",

          onboardingComplete,

          payoutsEnabled:
            false,

          requirements: {
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

            disabledReason:
              account
                .requirements
                ?.disabled_reason ||
              null,
          },
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
    // CURRENCY
    // ========================================================

    const currency =
      cleanString(
        body.currency
      ).toLowerCase() ||
      cleanString(
        account
          .default_currency
      ).toLowerCase() ||
      cleanString(
        connection
          .default_currency
      ).toLowerCase() ||
      "gbp";

    // ========================================================
    // AVAILABLE BALANCE
    // ========================================================

    const balance =
      await stripe
        .balance
        .retrieve(
          {},
          {
            stripeAccount:
              accountId,
          }
        );

    const availableBalance =
      balance
        .available
        .find(
          (
            item
          ) =>
            item
              .currency
              .toLowerCase() ===
            currency
        );

    const availableMinor =
      availableBalance
        ?.amount ||
      0;

    // ========================================================
    // NO AVAILABLE BALANCE
    // ========================================================

    if (
      availableMinor <=
      0
    ) {
      return NextResponse.json(
        {
          error:
            `There is currently no ${currency.toUpperCase()} balance available to withdraw.`,

          available:
            0,

          availableFormatted:
            formatMoney(
              0,
              currency
            ),

          currency,
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
    // CHECK AVAILABLE BALANCE
    // ========================================================

    if (
      amountMinor >
      availableMinor
    ) {
      return NextResponse.json(
        {
          error:
            `You only have ${formatMoney(
              availableMinor,
              currency
            )} available to withdraw.`,

          available:
            availableMinor,

          availableFormatted:
            formatMoney(
              availableMinor,
              currency
            ),

          requested:
            amountMinor,

          requestedFormatted:
            formatMoney(
              amountMinor,
              currency
            ),

          currency,
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
    // CREATE PAYOUT
    // ========================================================

    const payout =
      await stripe
        .payouts
        .create(
          {
            amount:
              amountMinor,

            currency,

            metadata: {
              organisation_id:
                organisationId,

              tots_user_id:
                user.id,

              source:
                "tots_os_store",

              requested_amount:
                roundedAmount
                  .toFixed(
                    2
                  ),

              requested_currency:
                currency,
            },
          },
          {
            stripeAccount:
              accountId,
          }
        );

    // ========================================================
    // GET UPDATED BALANCE
    // ========================================================

    let remainingAvailable:
      number |
      null =
      null;

    try {
      const refreshedBalance =
        await stripe
          .balance
          .retrieve(
            {},
            {
              stripeAccount:
                accountId,
            }
          );

      const remaining =
        refreshedBalance
          .available
          .find(
            (
              item
            ) =>
              item
                .currency
                .toLowerCase() ===
              currency
          );

      remainingAvailable =
        remaining
          ?.amount ??
        0;
    } catch (
      balanceRefreshError
    ) {
      console.warn(
        "[TOTS STRIPE] Balance refresh after payout failed:",
        balanceRefreshError
      );
    }

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STRIPE] Payout created:",
      {
        organisationId,

        userId:
          user.id,

        accountId,

        payoutId:
          payout.id,

        amount:
          payout.amount,

        currency:
          payout.currency,

        status:
          payout.status,
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
          `${formatMoney(
            payout.amount,
            payout.currency
          )} payout requested successfully.`,

        payout: {
          id:
            payout.id,

          amount:
            payout.amount,

          amountFormatted:
            formatMoney(
              payout.amount,
              payout.currency
            ),

          currency:
            payout.currency,

          status:
            payout.status,

          arrivalDate:
            payout
              .arrival_date,

          arrivalDateIso:
            payout
              .arrival_date
              ? new Date(
                  payout
                    .arrival_date *
                    1000
                )
                  .toISOString()
              : null,

          destination:
            typeof payout
                .destination ===
              "string"
              ? payout
                  .destination
              : null,

          method:
            payout.method,

          type:
            payout.type,

          created:
            payout.created,

          createdAt:
            new Date(
              payout.created *
                1000
            ).toISOString(),
        },

        balance: {
          before:
            availableMinor,

          beforeFormatted:
            formatMoney(
              availableMinor,
              currency
            ),

          remaining:
            remainingAvailable,

          remainingFormatted:
            remainingAvailable !==
            null
              ? formatMoney(
                  remainingAvailable,
                  currency
                )
              : null,

          currency,
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
      "[TOTS STRIPE] Payout failed:",
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
    // PAYOUT PERMISSION ERROR
    // ========================================================

    if (
      error instanceof
        Error &&
      error.message ===
        "PAYOUT_FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only organisation owners and administrators can withdraw store funds.",

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
        "The payout could not be created.";

      // ======================================================
      // FRIENDLIER STRIPE MESSAGES
      // ======================================================

      if (
        error.code ===
        "balance_insufficient"
      ) {
        message =
          "Your Stripe available balance is too low for this payout.";
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
            : "The payout could not be created.",
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