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

type OrganisationResult = {
  organisationId:
    string;

  organisationName:
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
// BASE URL
// ============================================================

function getBaseUrl(
  req:
    Request
) {
  const configured =
    process.env
      .NEXT_PUBLIC_SITE_URL ||
    process.env
      .SITE_URL;

  if (
    configured
  ) {
    return configured.replace(
      /\/$/,
      ""
    );
  }

  const origin =
    req.headers.get(
      "origin"
    );

  if (
    origin
  ) {
    return origin.replace(
      /\/$/,
      ""
    );
  }

  const host =
    req.headers.get(
      "host"
    );

  if (
    host
  ) {
    const protocol =
      host.includes(
        "localhost"
      )
        ? "http"
        : "https";

    return `${protocol}://${host}`;
  }

  return "https://www.tots-os.co.uk";
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

async function getOrganisation(
  userId:
    string
): Promise<OrganisationResult> {
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

  // ==========================================================
  // LOAD ORGANISATION
  // ==========================================================

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
        "*"
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

  const organisationName =
    cleanString(
      organisation
        ?.name
    ) ||
    cleanString(
      organisation
        ?.company_name
    ) ||
    "TOTS-OS Business";

  return {
    organisationId,

    organisationName,
  };
}

// ============================================================
// STRIPE MANAGEMENT PERMISSION
//
// Only owners/admins should be able to connect or replace the
// Stripe account receiving store funds.
//
// This is enforced server-side.
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

  let recognisedMembership =
    false;

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
      recognisedMembership =
        true;

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
        "[TOTS STRIPE] team_members permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] team_members permission check failed:",
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
      recognisedMembership =
        true;

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
        "[TOTS STRIPE] organisation_members permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation_members permission check failed:",
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
      recognisedMembership =
        true;

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
        "[TOTS STRIPE] user_organisations permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] user_organisations permission check failed:",
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
      recognisedMembership =
        true;

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
        "[TOTS STRIPE] profiles permission lookup failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] profiles permission check failed:",
      error
    );
  }

  // ==========================================================
  // ORGANISATION OWNER FALLBACK
  //
  // Some older organisations may store their owner directly
  // on organisations rather than in a membership table.
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
        "[TOTS STRIPE] organisation owner fallback failed:",
        error
      );
    }
  } catch (
    error
  ) {
    console.warn(
      "[TOTS STRIPE] organisation owner permission check failed:",
      error
    );
  }

  // ==========================================================
  // DENY
  // ==========================================================

  if (
    recognisedMembership
  ) {
    throw new Error(
      "STRIPE_MANAGEMENT_FORBIDDEN"
    );
  }

  /*
   * Fail closed.
   *
   * If we cannot prove this user is an owner/admin, do not let
   * them choose the account that receives business money.
   */

  throw new Error(
    "STRIPE_MANAGEMENT_FORBIDDEN"
  );
}

// ============================================================
// LOAD EXISTING STRIPE CONNECTION
// ============================================================

async function getExistingStripeConnection(
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
      | StoreStripeAccountRow
      | null
  );
}

// ============================================================
// SAVE STRIPE CONNECTION
// ============================================================

async function saveStripeConnection({
  organisationId,
  account,
}: {
  organisationId:
    string;

  account:
    Stripe.Account;
}) {
  const now =
    new Date()
      .toISOString();

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
      account.default_currency
    ).toLowerCase() ||
    "gbp";

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_stripe_accounts"
      )
      .upsert(
        {
          organisation_id:
            organisationId,

          stripe_account_id:
            account.id,

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
            now,
        },
        {
          onConflict:
            "organisation_id",
        }
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
      .single();

  if (
    error
  ) {
    console.error(
      "[TOTS STRIPE] Could not save Stripe connection:",
      error
    );

    throw error;
  }

  return data as
    StoreStripeAccountRow;
}

// ============================================================
// CREATE CONNECTED ACCOUNT
// ============================================================

async function createConnectedAccount({
  organisationId,
  organisationName,
  email,
  userId,
}: {
  organisationId:
    string;

  organisationName:
    string;

  email:
    string | null;

  userId:
    string;
}) {
  const account =
    await stripe
      .accounts
      .create({
        type:
          "express",

        country:
          "GB",

        email:
          email ||
          undefined,

        business_profile: {
          name:
            organisationName,
        },

        capabilities: {
          card_payments: {
            requested:
              true,
          },

          transfers: {
            requested:
              true,
          },
        },

        metadata: {
          organisation_id:
            organisationId,

          tots_user_id:
            userId,

          platform:
            "tots-os",

          module:
            "store",
        },
      });

  await saveStripeConnection({
    organisationId,

    account,
  });

  return account;
}

// ============================================================
// RETRIEVE CONNECTED ACCOUNT
// ============================================================

async function retrieveConnectedAccount(
  accountId:
    string
) {
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
      return null;
    }

    return accountResult as
      Stripe.Account;
  } catch (
    error:
      unknown
  ) {
    const stripeError =
      error as {
        code?:
          string;

        statusCode?:
          number;
      };

    if (
      stripeError
        ?.code ===
        "resource_missing" ||
      stripeError
        ?.statusCode ===
        404
    ) {
      return null;
    }

    throw error;
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

    const {
      organisationId,
      organisationName,
    } =
      await getOrganisation(
        user.id
      );

    // ========================================================
    // AUTHORISATION
    //
    // Connecting Stripe determines where customer payments go,
    // therefore only an owner/admin may perform this action.
    // ========================================================

    await assertStripeManagementPermission({
      userId:
        user.id,

      organisationId,
    });

    // ========================================================
    // MAKE SURE STORE EXISTS
    // ========================================================

    const {
      data:
        storeSettings,

      error:
        storeSettingsError,
    } =
      await supabaseAdmin
        .from(
          "store_settings"
        )
        .select(
          "id, organisation_id, slug, store_name"
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
      storeSettingsError
    ) {
      throw storeSettingsError;
    }

    if (
      !storeSettings
    ) {
      return NextResponse.json(
        {
          error:
            "Create your store settings before connecting Stripe.",
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
    // EXISTING STRIPE CONNECTION
    // ========================================================

    const existingConnection =
      await getExistingStripeConnection(
        organisationId
      );

    let account:
      Stripe.Account | null =
      null;

    // ========================================================
    // RETRIEVE EXISTING ACCOUNT
    // ========================================================

    if (
      existingConnection
        ?.stripe_account_id
    ) {
      account =
        await retrieveConnectedAccount(
          existingConnection
            .stripe_account_id
        );

      // ======================================================
      // ACCOUNT EXISTS IN STRIPE
      // ======================================================

      if (
        account
      ) {
        await saveStripeConnection({
          organisationId,

          account,
        });
      }

      // ======================================================
      // DATABASE REFERENCES AN ACCOUNT THAT NO LONGER EXISTS
      // ======================================================

      if (
        !account
      ) {
        console.warn(
          `[TOTS STRIPE] Connected account ${existingConnection.stripe_account_id} no longer exists in Stripe. Creating a replacement.`
        );

        const {
          error:
            deleteConnectionError,
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
          deleteConnectionError
        ) {
          throw deleteConnectionError;
        }
      }
    }

    // ========================================================
    // CREATE ACCOUNT IF REQUIRED
    // ========================================================

    if (
      !account
    ) {
      account =
        await createConnectedAccount({
          organisationId,

          organisationName,

          email:
            user.email ||
            null,

          userId:
            user.id,
        });
    }

    // ========================================================
    // ACCOUNT STATUS
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

    // ========================================================
    // BASE URL
    // ========================================================

    const baseUrl =
      getBaseUrl(
        req
      );

    // ========================================================
    // ACCOUNT LINK
    //
    // Account Links are single-use, so a fresh one is created
    // each time the user presses Connect / Continue setup.
    // ========================================================

    const accountLink =
      await stripe
        .accountLinks
        .create({
          account:
            account.id,

          refresh_url:
            `${baseUrl}/store?stripe=refresh`,

          return_url:
            `${baseUrl}/store?stripe=connected`,

          type:
            "account_onboarding",
        });

    // ========================================================
    // FINAL DATABASE SYNC
    // ========================================================

    const savedConnection =
      await saveStripeConnection({
        organisationId,

        account,
      });

    // ========================================================
    // LOG
    // ========================================================

    console.log(
      "[TOTS STRIPE] Connect onboarding link created:",
      {
        organisationId,

        userId:
          user.id,

        accountId:
          account.id,

        chargesEnabled:
          account
            .charges_enabled,

        payoutsEnabled:
          account
            .payouts_enabled,

        detailsSubmitted:
          account
            .details_submitted,

        onboardingComplete,
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success:
          true,

        connected:
          true,

        accountId:
          account.id,

        onboardingUrl:
          accountLink.url,

        /*
         * Keep url as well because your current Store page can
         * continue reading result.url.
         */
        url:
          accountLink.url,

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

        defaultCurrency:
          savedConnection
            .default_currency ||
          "gbp",

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
      "[TOTS STRIPE] Connect failed:",
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
            "Only organisation owners and administrators can connect or manage the store Stripe account.",

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
            "Stripe could not start account onboarding.",

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
            : "Stripe could not be connected.",
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