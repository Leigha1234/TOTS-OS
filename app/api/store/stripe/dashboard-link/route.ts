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
  stripe_account_id:
    string;

  onboarding_complete:
    boolean;

  details_submitted:
    boolean;

  charges_enabled:
    boolean;

  payouts_enabled:
    boolean;

  default_currency?:
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
      "[TOTS STRIPE] Dashboard authentication failed:",
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
        "[TOTS STRIPE] user_organisations dashboard lookup failed:",
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
        "[TOTS STRIPE] organisation_members dashboard lookup failed:",
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
//
// Stripe Express Dashboard gives access to sensitive financial
// information and payout management.
//
// Only owners/admins should be able to generate a login link.
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
        "[TOTS STRIPE] team_members dashboard permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] team_members dashboard permission check failed:",
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
        "[TOTS STRIPE] organisation_members dashboard permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation_members dashboard permission check failed:",
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
        "[TOTS STRIPE] user_organisations dashboard permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] user_organisations dashboard permission check failed:",
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
        "[TOTS STRIPE] profiles dashboard permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] profiles dashboard permission check failed:",
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
            organisation.user_id
          ),

          cleanString(
            organisation.owner_id
          ),

          cleanString(
            organisation.created_by
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
        "[TOTS STRIPE] organisation owner dashboard lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation owner dashboard permission check failed:",
      error
    );
  }

  // ==========================================================
  // FAIL CLOSED
  // ==========================================================

  throw new Error(
    "STRIPE_MANAGEMENT_FORBIDDEN"
  );
}

// ============================================================
// GET STRIPE CONNECTION
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
          stripe_account_id,
          onboarding_complete,
          details_submitted,
          charges_enabled,
          payouts_enabled,
          default_currency
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
      "[TOTS STRIPE] Could not clear stale Stripe connection:",
      error
    );
  }
}

// ============================================================
// SYNC LIVE STRIPE ACCOUNT
// ============================================================

async function syncStripeAccount({
  organisationId,
  accountId,
  account,
}: {
  organisationId:
    string;

  accountId:
    string;

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
          "gbp",

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
        accountId
      );

  if (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] Account status sync failed:",
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
    // Do not rely on hiding the button in the frontend.
    // The API route itself must enforce this.
    // ========================================================

    await assertStripeManagementPermission({
      userId:
        user.id,

      organisationId,
    });

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

    // ========================================================
    // NOT CONNECTED
    // ========================================================

    if (
      !accountId
    ) {
      return NextResponse.json(
        {
          error:
            "Connect Stripe first.",

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
    // VERIFY ACCOUNT STILL EXISTS
    // ========================================================

    let account:
      Stripe.Account;

    try {
      const result =
        await stripe
          .accounts
          .retrieve(
            accountId
          );

      if (
        "deleted" in
          result &&
        result.deleted
      ) {
        throw new Error(
          "STRIPE_ACCOUNT_MISSING"
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
        "[TOTS STRIPE] Dashboard account lookup failed:",
        accountError
      );

      const stripeError =
        accountError as {
          code?:
            string;

          statusCode?:
            number;
        };

      const accountMissing =
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
        accountMissing
      ) {
        await clearStaleStripeConnection({
          organisationId,

          accountId,
        });

        return NextResponse.json(
          {
            error:
              "This Stripe account is no longer available. Please reconnect Stripe.",

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
    // SYNC LIVE ACCOUNT STATUS
    // ========================================================

    const onboardingComplete =
      await syncStripeAccount({
        organisationId,

        accountId,

        account,
      });

    // ========================================================
    // ONBOARDING NOT COMPLETE
    //
    // Express dashboard access should not replace onboarding.
    // If Stripe still needs identity/business information,
    // send the user back through the Connect onboarding route.
    // ========================================================

    if (
      account
        .details_submitted !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe onboarding is not complete yet.",

          onboardingRequired:
            true,

          accountId,

          onboardingComplete:
            false,

          chargesEnabled:
            account
              .charges_enabled ===
            true,

          payoutsEnabled:
            account
              .payouts_enabled ===
            true,

          requirements: {
            currentlyDue:
              account
                .requirements
                ?.currently_due ||
              [],

            eventuallyDue:
              account
                .requirements
                ?.eventually_due ||
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
            409,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    // ========================================================
    // CREATE EXPRESS DASHBOARD LOGIN LINK
    //
    // Login links are temporary. Generate a fresh one each time
    // the owner/admin presses "Open Stripe".
    // ========================================================

    const loginLink =
      await stripe
        .accounts
        .createLoginLink(
          accountId
        );

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STRIPE] Express dashboard login link created:",
      {
        organisationId,

        userId:
          user.id,

        accountId,

        onboardingComplete,

        chargesEnabled:
          account
            .charges_enabled,

        payoutsEnabled:
          account
            .payouts_enabled,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        accountId,

        onboardingComplete,

        detailsSubmitted:
          account
            .details_submitted ===
          true,

        chargesEnabled:
          account
            .charges_enabled ===
          true,

        payoutsEnabled:
          account
            .payouts_enabled ===
          true,

        defaultCurrency:
          cleanString(
            account
              .default_currency
          ).toLowerCase() ||
          "gbp",

        url:
          loginLink.url,
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
      "[TOTS STRIPE] Dashboard link failed:",
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
            "Only organisation owners and administrators can open the store Stripe dashboard.",

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
      return NextResponse.json(
        {
          error:
            error.message ||
            "Stripe dashboard could not be opened.",

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
            : "Stripe dashboard could not be opened.",
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