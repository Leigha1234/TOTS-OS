import {
  NextResponse,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

// ============================================================
// RUNTIME
// ============================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// ENVIRONMENT
// ============================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// ENV VALIDATION
// ============================================================

if (
  !supabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
}

if (
  !supabaseAnonKey
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
  );
}

if (
  !supabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
}

// ============================================================
// TYPES
// ============================================================

type LegacyPaidTier =
  | "standard"
  | "professional"
  | "elite";

type BillingModel =
  | "legacy_tier"
  | "modular"
  | "unknown";

type BillingPackage =
  | "legacy"
  | "modular"
  | "complete";

type ModuleKey =
  | "core"
  | "clientsProjects"
  | "finance"
  | "social"
  | "email"
  | "store";

type AiTierKey =
  | "none"
  | "starter"
  | "plus"
  | "pro";

// ============================================================
// CONSTANTS
// ============================================================

const MODULE_KEYS:
  ModuleKey[] = [
    "core",
    "clientsProjects",
    "finance",
    "social",
    "email",
    "store",
  ];

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value:
    unknown,
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
// LEGACY PAID TIER
// ============================================================

function normaliseLegacyTier(
  value:
    unknown,
):
  | LegacyPaidTier
  | null {
  const tier =
    cleanString(
      value,
    ).toLowerCase();

  if (
    tier ===
    "standard"
  ) {
    return "standard";
  }

  if (
    tier ===
      "professional" ||
    tier ===
      "premium"
  ) {
    return "professional";
  }

  if (
    tier ===
    "elite"
  ) {
    return "elite";
  }

  return null;
}

// ============================================================
// BILLING MODEL
// ============================================================

function resolveBillingModel(
  rawBillingModel:
    unknown,

  legacyTier:
    LegacyPaidTier |
    null,
): BillingModel {
  const billingModel =
    cleanString(
      rawBillingModel,
    ).toLowerCase();

  if (
    billingModel ===
    "modular"
  ) {
    return "modular";
  }

  if (
    billingModel ===
    "legacy_tier"
  ) {
    return "legacy_tier";
  }

  /*
   * Old organisations may not yet have billing_model
   * populated.
   *
   * If they still have a recognised legacy tier, treat
   * them as a grandfathered legacy customer.
   */
  if (
    legacyTier
  ) {
    return "legacy_tier";
  }

  return "unknown";
}

// ============================================================
// BILLING PACKAGE
// ============================================================

function resolveBillingPackage(
  value:
    unknown,

  billingModel:
    BillingModel,
): BillingPackage {
  if (
    billingModel ===
    "legacy_tier"
  ) {
    return "legacy";
  }

  const packageName =
    cleanString(
      value,
    ).toLowerCase();

  if (
    packageName ===
    "complete"
  ) {
    return "complete";
  }

  return "modular";
}

// ============================================================
// AI TIER
// ============================================================

function normaliseAiTier(
  value:
    unknown,
): AiTierKey {
  const tier =
    cleanString(
      value,
    ).toLowerCase();

  if (
    tier ===
      "starter" ||
    tier ===
      "plus" ||
    tier ===
      "pro"
  ) {
    return tier;
  }

  return "none";
}

// ============================================================
// MODULE KEY
// ============================================================

function isModuleKey(
  value:
    unknown,
): value is ModuleKey {
  return (
    typeof value ===
      "string" &&
    MODULE_KEYS.includes(
      value as ModuleKey,
    )
  );
}

// ============================================================
// DATE CHECK
// ============================================================

function isFutureDate(
  value:
    unknown,
) {
  const raw =
    cleanString(
      value,
    );

  if (
    !raw
  ) {
    return false;
  }

  const timestamp =
    new Date(
      raw,
    ).getTime();

  if (
    Number.isNaN(
      timestamp,
    )
  ) {
    return false;
  }

  return (
    timestamp >
    Date.now()
  );
}

// ============================================================
// SUBSCRIPTION STATUS
// ============================================================

function isPaidSubscriptionStatus(
  status:
    unknown,
) {
  const value =
    cleanString(
      status,
    ).toLowerCase();

  /*
   * "active" is what the existing TOTS webhook currently
   * writes into organisations.subscription_status.
   *
   * "trialing" is also accepted so the access endpoint remains
   * compatible if Stripe status syncing becomes more exact.
   */
  return (
    value ===
      "active" ||
    value ===
      "trialing"
  );
}

// ============================================================
// GET
// ============================================================

export async function GET() {
  try {
    const cookieStore =
      await cookies();

    // ========================================================
    // AUTH CLIENT
    // ========================================================

    const supabase =
      createServerClient(
        supabaseUrl!,
        supabaseAnonKey!,
        {
          cookies: {
            getAll() {
              return cookieStore
                .getAll();
            },

            setAll(
              cookiesToSet: {
                name:
                  string;

                value:
                  string;

                options?:
                  Parameters<
                    typeof cookieStore.set
                  >[2];
              }[],
            ) {
              try {
                cookiesToSet.forEach(
                  ({
                    name,
                    value,
                    options,
                  }) => {
                    cookieStore.set(
                      name,
                      value,
                      options,
                    );
                  },
                );
              } catch {
                // Cookies cannot always be mutated here.
              }
            },
          },
        },
      );

    // ========================================================
    // GET LOGGED-IN USER
    // ========================================================

    const {
      data: {
        user,
      },

      error:
        userError,
    } =
      await supabase
        .auth
        .getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "unauthenticated",
        },
        {
          status:
            401,
        },
      );
    }

    // ========================================================
    // ADMIN CLIENT
    // ========================================================

    const admin =
      createClient(
        supabaseUrl!,
        supabaseServiceRoleKey!,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        },
      );

    // ========================================================
    // RESOLVE ORGANISATION ID
    // ========================================================

    let organisationId:
      string |
      null =
      null;

    // ========================================================
    // PRIMARY:
    // profiles.organisation_id
    // ========================================================

    const {
      data:
        profile,

      error:
        profileError,
    } =
      await admin
        .from(
          "profiles",
        )
        .select(
          `
            organisation_id,
            subscription_tier,
            is_subscribed
          `,
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    if (
      profileError
    ) {
      console.error(
        "Access profile lookup failed:",
        profileError,
      );
    }

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        String(
          profile
            .organisation_id,
        );
    }

    // ========================================================
    // FALLBACK 1:
    // organisation_members
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          membership,

        error:
          membershipError,
      } =
        await admin
          .from(
            "organisation_members",
          )
          .select(
            "organisation_id",
          )
          .eq(
            "user_id",
            user.id,
          )
          .limit(
            1,
          )
          .maybeSingle();

      if (
        membershipError
      ) {
        console.error(
          "Access organisation_members lookup failed:",
          membershipError,
        );
      }

      if (
        membership
          ?.organisation_id
      ) {
        organisationId =
          String(
            membership
              .organisation_id,
          );
      }
    }

    // ========================================================
    // FALLBACK 2:
    // user_organisations
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          userOrganisation,

        error:
          userOrganisationError,
      } =
        await admin
          .from(
            "user_organisations",
          )
          .select(
            "organisation_id",
          )
          .eq(
            "user_id",
            user.id,
          )
          .limit(
            1,
          )
          .maybeSingle();

      if (
        userOrganisationError
      ) {
        console.error(
          "Access user_organisations lookup failed:",
          userOrganisationError,
        );
      }

      if (
        userOrganisation
          ?.organisation_id
      ) {
        organisationId =
          String(
            userOrganisation
              .organisation_id,
          );
      }
    }

    // ========================================================
    // FALLBACK 3:
    // LEGACY organisations.created_by
    // ========================================================

    if (
      !organisationId
    ) {
      const {
        data:
          createdOrganisation,

        error:
          createdOrganisationError,
      } =
        await admin
          .from(
            "organisations",
          )
          .select(
            "id",
          )
          .eq(
            "created_by",
            user.id,
          )
          .limit(
            1,
          )
          .maybeSingle();

      if (
        createdOrganisationError
      ) {
        console.error(
          "Access legacy organisation lookup failed:",
          createdOrganisationError,
        );
      }

      if (
        createdOrganisation
          ?.id
      ) {
        organisationId =
          String(
            createdOrganisation
              .id,
          );
      }
    }

    // ========================================================
    // NO ORGANISATION
    // ========================================================

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "organisation_not_found",
        },
        {
          status:
            403,
        },
      );
    }

    // ========================================================
    // LOAD ORGANISATION
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await admin
        .from(
          "organisations",
        )
        .select(
          `
            id,
            name,
            subscription_tier,
            subscription_status,
            access_status,
            billing_model,
            billing_package,
            clarity_ai_tier,
            billing_version,
            store_enabled,
            beta_grace_ends_at,
            retention_trial_ends_at
          `,
        )
        .eq(
          "id",
          organisationId,
        )
        .maybeSingle();

    if (
      organisationError
    ) {
      console.error(
        "Access organisation lookup failed:",
        organisationError,
      );

      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "lookup_failed",
        },
        {
          status:
            500,
        },
      );
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          allowed:
            false,

          reason:
            "organisation_not_found",
        },
        {
          status:
            403,
        },
      );
    }

    // ========================================================
    // BILLING MODEL
    // ========================================================

    const organisationLegacyTier =
      normaliseLegacyTier(
        organisation
          .subscription_tier,
      );

    const profileLegacyTier =
      normaliseLegacyTier(
        profile
          ?.subscription_tier,
      );

    const billingModel =
      resolveBillingModel(
        organisation
          .billing_model,
        organisationLegacyTier ||
          profileLegacyTier,
      );

    const billingPackage =
      resolveBillingPackage(
        organisation
          .billing_package,
        billingModel,
      );

    const clarityAiTier =
      normaliseAiTier(
        organisation
          .clarity_ai_tier,
      );

    const billingVersion =
      cleanString(
        organisation
          .billing_version,
      ) ||
      (
        billingModel ===
        "modular"
          ? "v2"
          : "legacy"
      );

    // ========================================================
    // ACTIVE MODULES
    // ========================================================

    let activeModules:
      ModuleKey[] =
      [];

    if (
      billingModel ===
      "modular"
    ) {
      const {
        data:
          moduleRows,

        error:
          moduleError,
      } =
        await admin
          .from(
            "organisation_modules",
          )
          .select(
            `
              module_key,
              status
            `,
          )
          .eq(
            "organisation_id",
            organisation.id,
          )
          .eq(
            "status",
            "active",
          );

      if (
        moduleError
      ) {
        console.error(
          "Access module entitlement lookup failed:",
          moduleError,
        );

        /*
         * Fail closed for modular entitlements.
         *
         * The organisation can still have account access,
         * but no paid module will be reported as available
         * unless its entitlement can be verified.
         */
        activeModules =
          [];
      } else {
        activeModules =
          Array.from(
            new Set(
              (
                moduleRows ||
                []
              )
                .map(
                  (
                    row,
                  ) =>
                    row
                      .module_key,
                )
                .filter(
                  isModuleKey,
                ),
            ),
          );
      }
    }

    // ========================================================
    // ACCESS CALCULATION
    // ========================================================

    // --------------------------------------------------------
    // LEGACY PAID SUBSCRIPTION
    // --------------------------------------------------------

    const legacyPaidActive =
      billingModel ===
        "legacy_tier" &&
      Boolean(
        organisationLegacyTier ||
          profileLegacyTier,
      ) &&
      isPaidSubscriptionStatus(
        organisation
          .subscription_status,
      );

    // --------------------------------------------------------
    // MODULAR PAID SUBSCRIPTION
    // --------------------------------------------------------

    const modularPaidActive =
      billingModel ===
        "modular" &&
      isPaidSubscriptionStatus(
        organisation
          .subscription_status,
      );

    // --------------------------------------------------------
    // PROFILE FALLBACK
    //
    // Legacy only.
    //
    // The new modular system intentionally does NOT use
    // profiles.subscription_tier as an entitlement source.
    // --------------------------------------------------------

    const legacyProfilePaidActive =
      billingModel ===
        "legacy_tier" &&
      profile
        ?.is_subscribed ===
        true &&
      Boolean(
        profileLegacyTier,
      );

    // --------------------------------------------------------
    // BETA GRACE PERIOD
    // --------------------------------------------------------

    const betaGraceActive =
      cleanString(
        organisation
          .subscription_status,
      ).toLowerCase() ===
        "beta" &&
      isFutureDate(
        organisation
          .beta_grace_ends_at,
      );

    // --------------------------------------------------------
    // RETENTION TRIAL
    // --------------------------------------------------------

    const retentionTrialActive =
      cleanString(
        organisation
          .subscription_status,
      ).toLowerCase() ===
        "trial" &&
      isFutureDate(
        organisation
          .retention_trial_ends_at,
      );

    // ========================================================
    // FINAL ACCESS DECISION
    // ========================================================

    const allowed =
      Boolean(
        legacyPaidActive ||
          modularPaidActive ||
          legacyProfilePaidActive ||
          betaGraceActive ||
          retentionTrialActive,
      );

    // ========================================================
    // ACCESS REASON
    // ========================================================

    let accessReason =
      "access_expired";

    if (
      modularPaidActive
    ) {
      accessReason =
        "modular_subscription_active";
    } else if (
      legacyPaidActive
    ) {
      accessReason =
        "legacy_subscription_active";
    } else if (
      legacyProfilePaidActive
    ) {
      accessReason =
        "legacy_profile_subscription_active";
    } else if (
      betaGraceActive
    ) {
      accessReason =
        "beta_grace_active";
    } else if (
      retentionTrialActive
    ) {
      accessReason =
        "retention_trial_active";
    }

    // ========================================================
    // KEEP ACCESS_STATUS IN SYNC
    // ========================================================

    const desiredAccessStatus =
      allowed
        ? "active"
        : "restricted";

    if (
      organisation
        .access_status !==
      desiredAccessStatus
    ) {
      const {
        error:
          updateError,
      } =
        await admin
          .from(
            "organisations",
          )
          .update({
            access_status:
              desiredAccessStatus,
          })
          .eq(
            "id",
            organisation.id,
          );

      if (
        updateError
      ) {
        console.error(
          "Unable to sync organisation access status:",
          updateError,
        );
      }
    }

    // ========================================================
    // DEBUG LOG
    // ========================================================

    console.log(
      "[ACCOUNT ACCESS]",
      {
        userId:
          user.id,

        organisationId:
          organisation.id,

        billingModel,

        billingPackage,

        organisationTier:
          organisation
            .subscription_tier,

        organisationStatus:
          organisation
            .subscription_status,

        profileTier:
          profile
            ?.subscription_tier,

        profileSubscribed:
          profile
            ?.is_subscribed,

        activeModules,

        clarityAiTier,

        legacyPaidActive,

        modularPaidActive,

        legacyProfilePaidActive,

        betaGraceActive,

        retentionTrialActive,

        allowed,

        accessReason,
      },
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        allowed,

        reason:
          accessReason,

        // ====================================================
        // USER
        // ====================================================

        userId:
          user.id,

        // ====================================================
        // ORGANISATION
        // ====================================================

        organisationId:
          organisation.id,

        organisationName:
          organisation.name,

        // ====================================================
        // BILLING
        // ====================================================

        billingModel,

        billingPackage,

        billingVersion,

        subscriptionTier:
          organisationLegacyTier,

        subscriptionStatus:
          organisation
            .subscription_status,

        accessStatus:
          desiredAccessStatus,

        // ====================================================
        // MODULE ENTITLEMENTS
        // ====================================================

        modules:
          activeModules,

        // Alias so either naming convention can be used.
        activeModules,

        hasCore:
          activeModules.includes(
            "core",
          ),

        hasClientsProjects:
          activeModules.includes(
            "clientsProjects",
          ),

        hasFinance:
          activeModules.includes(
            "finance",
          ),

        hasSocial:
          activeModules.includes(
            "social",
          ),

        hasEmail:
          activeModules.includes(
            "email",
          ),

        hasStore:
          activeModules.includes(
            "store",
          ),

        // ====================================================
        // CLARITY AI
        // ====================================================

        clarityAiTier,

        hasClarityAi:
          clarityAiTier !==
          "none",

        // ====================================================
        // LEGACY PROFILE COMPATIBILITY
        // ====================================================

        profileSubscriptionTier:
          profileLegacyTier,

        profileSubscribed:
          profile
            ?.is_subscribed ??
          false,

        // ====================================================
        // ACCESS BREAKDOWN
        // ====================================================

        legacyPaidActive,

        modularPaidActive,

        profilePaidActive:
          legacyProfilePaidActive,

        betaGraceActive,

        retentionTrialActive,

        betaGraceEndsAt:
          organisation
            .beta_grace_ends_at,

        retentionTrialEndsAt:
          organisation
            .retention_trial_ends_at,

        // ====================================================
        // COMPATIBILITY
        // ====================================================

        storeEnabled:
          Boolean(
            organisation
              .store_enabled,
          ),
      },
      {
        status:
          allowed
            ? 200
            : 403,
      },
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "Account access check failed:",
      error,
    );

    return NextResponse.json(
      {
        allowed:
          false,

        reason:
          "server_error",
      },
      {
        status:
          500,
      },
    );
  }
}