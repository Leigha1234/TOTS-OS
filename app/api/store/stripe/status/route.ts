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

type BalanceItem = {
  currency:
    string;

  amount:
    number;

  formatted:
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
    console.error(
      "[TOTS STRIPE] Authentication failed:",
      error
    );

    throw new Error(
      "UNAUTHENTICATED"
    );
  }

  return data.user;
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
        membershipRows,

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
        "[TOTS STRIPE] user_organisations lookup failed:",
        membershipError
      );
    } else {
      organisationId =
        cleanString(
          membershipRows?.[0]
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
        memberRows,

      error:
        memberError,
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
      memberError
    ) {
      console.warn(
        "[TOTS STRIPE] organisation_members lookup failed:",
        memberError
      );
    } else {
      organisationId =
        cleanString(
          memberRows?.[0]
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
// MONEY
// ============================================================

function normaliseBalance(
  balance:
    Stripe.Balance
) {
  const normaliseItems =
    (
      items:
        Stripe.Balance.Available[]
    ): BalanceItem[] =>
      items.map(
        (
          item
        ) => ({
          currency:
            item.currency,

          amount:
            item.amount,

          formatted:
            (
              item.amount /
              100
            ).toFixed(
              2
            ),
        })
      );

  return {
    available:
      normaliseItems(
        balance.available
      ),

    pending:
      normaliseItems(
        balance.pending
      ),
  };
}

// ============================================================
// EMPTY STATUS RESPONSE
// ============================================================

function emptyStatus({
  accountId =
    null,
  accountUnavailable =
    false,
}: {
  accountId?:
    string | null;

  accountUnavailable?:
    boolean;
} = {}) {
  return {
    connected:
      false,

    accountId,

    accountUnavailable,

    accountType:
      null,

    country:
      null,

    defaultCurrency:
      "gbp",

    email:
      null,

    chargesEnabled:
      false,

    payoutsEnabled:
      false,

    detailsSubmitted:
      false,

    onboardingComplete:
      false,

    requirements: {
      currentlyDue:
        [],

      eventuallyDue:
        [],

      pastDue:
        [],

      disabledReason:
        null,
    },

    balance: {
      available:
        [],

      pending:
        [],
    },
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
    // USER
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
    // LOAD TOTS STRIPE CONNECTION
    // ========================================================

    const {
      data:
        storedConnection,

      error:
        connectionError,
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
      connectionError
    ) {
      throw connectionError;
    }

    // ========================================================
    // NOT CONNECTED
    // ========================================================

    if (
      !storedConnection
    ) {
      return NextResponse.json(
        emptyStatus(),
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

    const connection =
      storedConnection as
        StoreStripeAccountRow;

    const stripeAccountId =
      cleanString(
        connection
          .stripe_account_id
      );

    if (
      !stripeAccountId
    ) {
      return NextResponse.json(
        emptyStatus(),
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
    // STRIPE ACCOUNT
    // ========================================================

    let account:
      Stripe.Account;

    try {
      const result =
        await stripe
          .accounts
          .retrieve(
            stripeAccountId
          );

      if (
        result.deleted
      ) {
        // ====================================================
        // REMOVE INVALID DATABASE CONNECTION
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
            );

        if (
          deleteError
        ) {
          console.error(
            "[TOTS STRIPE] Could not clear deleted Stripe account:",
            deleteError
          );
        }

        return NextResponse.json(
          emptyStatus({
            accountId:
              stripeAccountId,

            accountUnavailable:
              true,
          }),
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

      account =
        result as
          Stripe.Account;
    } catch (
      accountError:
        unknown
    ) {
      console.error(
        "[TOTS STRIPE] Connected account lookup failed:",
        accountError
      );

      const stripeError =
        accountError as {
          code?:
            string;

          statusCode?:
            number;
        };

      // ======================================================
      // ACCOUNT NO LONGER EXISTS
      // ======================================================

      if (
        stripeError
          ?.code ===
          "resource_missing" ||
        stripeError
          ?.statusCode ===
          404
      ) {
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
            );

        if (
          deleteError
        ) {
          console.error(
            "[TOTS STRIPE] Could not clear missing Stripe account:",
            deleteError
          );
        }

        return NextResponse.json(
          emptyStatus({
            accountId:
              stripeAccountId,

            accountUnavailable:
              true,
          }),
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

      throw accountError;
    }

    // ========================================================
    // BALANCE
    // ========================================================

    let balance:
      Stripe.Balance | null =
      null;

    try {
      balance =
        await stripe
          .balance
          .retrieve(
            {},
            {
              stripeAccount:
                stripeAccountId,
            }
          );
    } catch (
      balanceError
    ) {
      /*
       * Don't fail the entire account status just because
       * balance retrieval isn't available yet.
       */

      console.warn(
        "[TOTS STRIPE] Balance lookup failed:",
        balanceError
      );
    }

    // ========================================================
    // REQUIREMENTS
    // ========================================================

    const requirements =
      account.requirements;

    const currentlyDue =
      requirements
        ?.currently_due ||
      [];

    const eventuallyDue =
      requirements
        ?.eventually_due ||
      [];

    const pastDue =
      requirements
        ?.past_due ||
      [];

    // ========================================================
    // ONBOARDING STATUS
    //
    // For TOTS Commerce we consider the payment setup fully
    // operational when:
    //
    // 1. Stripe details have been submitted
    // 2. charges are enabled
    // 3. payouts are enabled
    // ========================================================

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

    const defaultCurrency =
      cleanString(
        account
          .default_currency
      ) ||
      cleanString(
        connection
          .default_currency
      ) ||
      "gbp";

    // ========================================================
    // SYNC DATABASE WITH LIVE STRIPE STATE
    // ========================================================

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
            defaultCurrency,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "organisation_id",
          organisationId
        )
        .eq(
          "stripe_account_id",
          stripeAccountId
        );

    if (
      syncError
    ) {
      /*
       * The Stripe data itself is valid, so don't fail the
       * request merely because our cached status couldn't sync.
       */

      console.error(
        "[TOTS STRIPE] Database status sync failed:",
        syncError
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        connected:
          true,

        accountId:
          stripeAccountId,

        accountUnavailable:
          false,

        accountType:
          account.type ||
          "express",

        country:
          account.country ||
          null,

        defaultCurrency,

        email:
          account.email ||
          null,

        chargesEnabled:
          account
            .charges_enabled ===
          true,

        payoutsEnabled:
          account
            .payouts_enabled ===
          true,

        detailsSubmitted:
          account
            .details_submitted ===
          true,

        onboardingComplete,

        requirements: {
          currentlyDue,

          eventuallyDue,

          pastDue,

          disabledReason:
            requirements
              ?.disabled_reason ||
            null,
        },

        balance:
          balance
            ? normaliseBalance(
                balance
              )
            : {
                available:
                  [],

                pending:
                  [],
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
      "[TOTS STRIPE] Status failed:",
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
            "Stripe status could not be loaded.",

          type:
            error.type,

          code:
            error.code ||
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
            : "Stripe status could not be loaded.",
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