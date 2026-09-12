import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

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

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

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
// VALIDATE ENVIRONMENT
// ============================================================

if (
  !stripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing.",
  );
}

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
// STRIPE
// ============================================================

const stripe =
  new Stripe(
    stripeSecretKey,
    {
      apiVersion:
        "2025-02-24.acacia",
    },
  );

// ============================================================
// TYPES
// ============================================================

type LegacySubscriptionTier =
  | "standard"
  | "professional"
  | "elite";

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

type BillingModel =
  | "legacy_tier"
  | "modular";

type BillingPackage =
  | "legacy"
  | "modular"
  | "complete";

// ============================================================
// CONSTANTS
// ============================================================

const MAIN_MODULE_KEYS:
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
// LEGACY TIER
// ============================================================

function normaliseLegacyTier(
  value:
    unknown,
):
  | LegacySubscriptionTier
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

function normaliseBillingModel(
  value:
    unknown,

  legacyTier:
    LegacySubscriptionTier |
    null,
): BillingModel {
  const raw =
    cleanString(
      value,
    ).toLowerCase();

  if (
    raw ===
    "modular"
  ) {
    return "modular";
  }

  if (
    raw ===
    "legacy_tier"
  ) {
    return "legacy_tier";
  }

  if (
    legacyTier
  ) {
    return "legacy_tier";
  }

  return "modular";
}

// ============================================================
// BILLING PACKAGE
// ============================================================

function normaliseBillingPackage(
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

  const raw =
    cleanString(
      value,
    ).toLowerCase();

  if (
    raw ===
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
// MODULES
// ============================================================

function normaliseModules(
  value:
    unknown,
): ModuleKey[] {
  let raw:
    unknown[] = [];

  if (
    Array.isArray(
      value,
    )
  ) {
    raw =
      value;
  } else if (
    typeof value ===
    "string"
  ) {
    raw =
      value
        .split(",")
        .map(
          (
            item,
          ) =>
            item.trim(),
        );
  }

  return MAIN_MODULE_KEYS.filter(
    (
      moduleKey,
    ) =>
      raw.some(
        (
          valueItem,
        ) =>
          cleanString(
            valueItem,
          ) ===
          moduleKey,
      ),
  );
}

// ============================================================
// CUSTOMER ID
// ============================================================

function getStripeCustomerId(
  subscription:
    Stripe.Subscription,
) {
  if (
    typeof subscription
      .customer ===
    "string"
  ) {
    return subscription.customer;
  }

  return (
    subscription
      .customer
      ?.id ||
    null
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request:
    NextRequest,
) {
  try {
    // ========================================================
    // AUTHENTICATED SUPABASE CLIENT
    // ========================================================

    const cookieStore =
      await cookies();

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
                // Safe to ignore when
                // cookies cannot be mutated.
              }
            },
          },
        },
      );

    // ========================================================
    // LOGGED-IN USER
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
          error:
            "You must be logged in.",
        },
        {
          status:
            401,
        },
      );
    }

    // ========================================================
    // REQUEST
    // ========================================================

    const body =
      (
        await request
          .json()
      ) as Record<
        string,
        unknown
      >;

    const sessionId =
      cleanString(
        body.sessionId,
      );

    if (
      !sessionId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe session ID is required.",
        },
        {
          status:
            400,
        },
      );
    }

    // ========================================================
    // RETRIEVE CHECKOUT SESSION
    // ========================================================

    const session =
      await stripe
        .checkout
        .sessions
        .retrieve(
          sessionId,
        );

    // ========================================================
    // VERIFY CHECKOUT TYPE
    // ========================================================

    if (
      cleanString(
        session
          .metadata
          ?.checkout_type,
      ) !==
      "existing_account"
    ) {
      return NextResponse.json(
        {
          error:
            "This is not an existing-account checkout.",
        },
        {
          status:
            400,
        },
      );
    }

    // ========================================================
    // VERIFY USER
    // ========================================================

    const metadataUserId =
      cleanString(
        session
          .metadata
          ?.user_id,
      );

    if (
      !metadataUserId ||
      metadataUserId !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This checkout does not belong to the logged-in account.",
        },
        {
          status:
            403,
        },
      );
    }

    // ========================================================
    // ORGANISATION ID
    // ========================================================

    const organisationId =
      cleanString(
        session
          .metadata
          ?.organisation_id,
      );

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "Organisation metadata is missing.",
        },
        {
          status:
            400,
        },
      );
    }

    // ========================================================
    // SUBSCRIPTION
    // ========================================================

    const subscriptionId =
      typeof session
        .subscription ===
      "string"
        ? session
            .subscription
        : session
            .subscription
            ?.id ||
          null;

    if (
      !subscriptionId
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe subscription was not found.",
        },
        {
          status:
            400,
        },
      );
    }

    const subscription =
      await stripe
        .subscriptions
        .retrieve(
          subscriptionId,
        );

    // ========================================================
    // VERIFY SUBSCRIPTION STATUS
    // ========================================================

    const active =
      subscription
        .status ===
        "active" ||
      subscription
        .status ===
        "trialing";

    if (
      !active
    ) {
      return NextResponse.json(
        {
          error:
            `Stripe subscription is ${subscription.status}.`,
        },
        {
          status:
            400,
        },
      );
    }

    // ========================================================
    // METADATA SOURCE
    // ========================================================

    const subscriptionMetadata =
      subscription
        .metadata;

    const sessionMetadata =
      session
        .metadata;

    // ========================================================
    // LEGACY TIER
    // ========================================================

    const legacyTier =
      normaliseLegacyTier(
        cleanString(
          subscriptionMetadata
            ?.subscription_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.subscription_tier,
          ),
      );

    // ========================================================
    // BILLING MODEL
    // ========================================================

    const billingModel =
      normaliseBillingModel(
        cleanString(
          subscriptionMetadata
            ?.billing_model,
        ) ||
          cleanString(
            sessionMetadata
              ?.billing_model,
          ),
        legacyTier,
      );

    // ========================================================
    // BILLING PACKAGE
    // ========================================================

    const billingPackage =
      normaliseBillingPackage(
        cleanString(
          subscriptionMetadata
            ?.billing_package,
        ) ||
          cleanString(
            sessionMetadata
              ?.billing_package,
          ),
        billingModel,
      );

    // ========================================================
    // MODULES
    // ========================================================

    let modules =
      normaliseModules(
        cleanString(
          subscriptionMetadata
            ?.modules,
        ) ||
          cleanString(
            sessionMetadata
              ?.modules,
          ),
      );

    // ========================================================
    // REQUESTED AI
    // ========================================================

    const requestedAiTier =
      normaliseAiTier(
        cleanString(
          subscriptionMetadata
            ?.requested_ai_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.requested_ai_tier,
          ),
      );

    // ========================================================
    // EFFECTIVE AI
    // ========================================================

    let effectiveAiTier =
      normaliseAiTier(
        cleanString(
          subscriptionMetadata
            ?.effective_ai_tier,
        ) ||
          cleanString(
            sessionMetadata
              ?.effective_ai_tier,
          ),
      );

    // ========================================================
    // BILLING VERSION
    // ========================================================

    const billingVersion =
      cleanString(
        subscriptionMetadata
          ?.billing_version,
      ) ||
      cleanString(
        sessionMetadata
          ?.billing_version,
      ) ||
      (
        billingModel ===
        "modular"
          ? "v2"
          : "legacy"
      );

    // ========================================================
    // MONTHLY TOTAL
    // ========================================================

    const monthlyTotalPence =
      Math.max(
        0,
        Number(
          cleanString(
            subscriptionMetadata
              ?.monthly_total_pence,
          ) ||
            cleanString(
              sessionMetadata
                ?.monthly_total_pence,
            ) ||
            0,
        ) ||
          0,
      );

    // ========================================================
    // COMPLETE RULES
    // ========================================================

    if (
      billingModel ===
        "modular" &&
      billingPackage ===
        "complete"
    ) {
      modules =
        [...MAIN_MODULE_KEYS];

      effectiveAiTier =
        "starter";
    }

    // ========================================================
    // MODULAR VALIDATION
    // ========================================================

    if (
      billingModel ===
        "modular" &&
      modules.length ===
        0
    ) {
      return NextResponse.json(
        {
          error:
            "No TOTS-OS modules were found in the Stripe subscription.",
        },
        {
          status:
            400,
        },
      );
    }

    // ========================================================
    // ADDITIONAL SEATS
    // ========================================================

    const additionalSeats =
      Math.max(
        0,
        Math.floor(
          Number(
            cleanString(
              subscriptionMetadata
                ?.additional_seats,
            ) ||
              cleanString(
                sessionMetadata
                  ?.additional_seats,
              ) ||
              0,
          ) ||
            0,
        ),
      );

    // ========================================================
    // ADMIN SUPABASE CLIENT
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
    // LOAD ORGANISATION
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationLookupError,
    } =
      await admin
        .from(
          "organisations",
        )
        .select(
          `
            id,
            name,
            created_by,
            subscription_tier,
            subscription_status,
            access_status,
            billing_model,
            billing_package,
            clarity_ai_tier,
            billing_version
          `,
        )
        .eq(
          "id",
          organisationId,
        )
        .maybeSingle();

    if (
      organisationLookupError
    ) {
      console.error(
        "Organisation lookup failed:",
        organisationLookupError,
      );

      throw organisationLookupError;
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
        },
      );
    }

    // ========================================================
    // VERIFY USER BELONGS TO ORGANISATION
    // ========================================================

    let organisationVerified =
      false;

    // --------------------------------------------------------
    // METHOD 1:
    // profiles.organisation_id
    // --------------------------------------------------------

    const {
      data:
        profile,

      error:
        profileLookupError,
    } =
      await admin
        .from(
          "profiles",
        )
        .select(
          "organisation_id",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    if (
      profileLookupError
    ) {
      console.error(
        "Profile organisation verification error:",
        profileLookupError,
      );
    }

    if (
      profile
        ?.organisation_id ===
      organisationId
    ) {
      organisationVerified =
        true;
    }

    // --------------------------------------------------------
    // METHOD 2:
    // organisation_members
    // --------------------------------------------------------

    if (
      !organisationVerified
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
          .eq(
            "organisation_id",
            organisationId,
          )
          .limit(
            1,
          )
          .maybeSingle();

      if (
        membershipError
      ) {
        console.error(
          "Organisation membership verification error:",
          membershipError,
        );
      }

      if (
        membership
          ?.organisation_id ===
        organisationId
      ) {
        organisationVerified =
          true;
      }
    }

    // --------------------------------------------------------
    // METHOD 3:
    // user_organisations
    // --------------------------------------------------------

    if (
      !organisationVerified
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
          .eq(
            "organisation_id",
            organisationId,
          )
          .limit(
            1,
          )
          .maybeSingle();

      if (
        userOrganisationError
      ) {
        console.error(
          "User organisation verification error:",
          userOrganisationError,
        );
      }

      if (
        userOrganisation
          ?.organisation_id ===
        organisationId
      ) {
        organisationVerified =
          true;
      }
    }

    // --------------------------------------------------------
    // METHOD 4:
    // legacy created_by
    // --------------------------------------------------------

    if (
      !organisationVerified &&
      organisation
        .created_by ===
        user.id
    ) {
      organisationVerified =
        true;
    }

    // ========================================================
    // ORGANISATION VERIFICATION FAILED
    // ========================================================

    if (
      !organisationVerified
    ) {
      console.error(
        "[STRIPE VERIFY] User does not belong to organisation:",
        {
          userId:
            user.id,

          organisationId,
        },
      );

      return NextResponse.json(
        {
          error:
            "Organisation could not be verified.",
        },
        {
          status:
            403,
        },
      );
    }

    // ========================================================
    // BUILD ORGANISATION UPDATE
    // ========================================================

    const organisationPayload:
      Record<
        string,
        unknown
      > = {
        subscription_status:
          "active",

        access_status:
          "active",

        beta_ended_at:
          null,

        beta_grace_ends_at:
          null,

        retention_trial_ends_at:
          null,
      };

    // ========================================================
    // LEGACY BILLING
    // ========================================================

    if (
      billingModel ===
        "legacy_tier"
    ) {
      if (
        !legacyTier
      ) {
        return NextResponse.json(
          {
            error:
              "Legacy subscription tier is invalid.",
          },
          {
            status:
              400,
          },
        );
      }

      organisationPayload
        .subscription_tier =
        legacyTier;

      organisationPayload
        .billing_model =
        "legacy_tier";

      organisationPayload
        .billing_package =
        "legacy";

      organisationPayload
        .billing_version =
        "legacy";
    }

    // ========================================================
    // MODULAR BILLING
    // ========================================================

    if (
      billingModel ===
      "modular"
    ) {
      organisationPayload
        .billing_model =
        "modular";

      organisationPayload
        .billing_package =
        billingPackage;

      organisationPayload
        .clarity_ai_tier =
        effectiveAiTier;

      organisationPayload
        .billing_version =
        billingVersion;

      organisationPayload
        .store_enabled =
        modules.includes(
          "store",
        );
    }

    // ========================================================
    // ACTIVATE ORGANISATION
    // ========================================================

    const {
      error:
        organisationUpdateError,
    } =
      await admin
        .from(
          "organisations",
        )
        .update(
          organisationPayload,
        )
        .eq(
          "id",
          organisation.id,
        );

    if (
      organisationUpdateError
    ) {
      console.error(
        "Organisation activation failed:",
        organisationUpdateError,
      );

      throw organisationUpdateError;
    }

    // ========================================================
    // MODULAR ENTITLEMENTS
    // ========================================================

    if (
      billingModel ===
      "modular"
    ) {
      const now =
        new Date()
          .toISOString();

      // ======================================================
      // LOAD EXISTING MODULE ROWS
      // ======================================================

      const {
        data:
          existingModuleRows,

        error:
          existingModulesError,
      } =
        await admin
          .from(
            "organisation_modules",
          )
          .select(
            `
              id,
              module_key,
              status
            `,
          )
          .eq(
            "organisation_id",
            organisation.id,
          );

      if (
        existingModulesError
      ) {
        console.error(
          "Existing module lookup failed:",
          existingModulesError,
        );

        throw existingModulesError;
      }

      // ======================================================
      // CANCEL MODULES NO LONGER SELECTED
      // ======================================================

      const moduleIdsToCancel =
        (
          existingModuleRows ||
          []
        )
          .filter(
            (
              row,
            ) =>
              !modules.includes(
                row
                  .module_key as
                  ModuleKey,
              ),
          )
          .map(
            (
              row,
            ) =>
              row.id,
          );

      if (
        moduleIdsToCancel.length >
        0
      ) {
        const {
          error:
            cancellationError,
        } =
          await admin
            .from(
              "organisation_modules",
            )
            .update({
              status:
                "cancelled",

              cancelled_at:
                now,

              updated_at:
                now,
            })
            .in(
              "id",
              moduleIdsToCancel,
            );

        if (
          cancellationError
        ) {
          console.error(
            "Module cancellation failed:",
            cancellationError,
          );

          throw cancellationError;
        }
      }

      // ======================================================
      // UPSERT SELECTED MODULES
      // ======================================================

      const moduleRows =
        modules.map(
          (
            moduleKey,
          ) => ({
            organisation_id:
              organisation.id,

            module_key:
              moduleKey,

            status:
              "active",

            cancelled_at:
              null,

            updated_at:
              now,
          }),
        );

      const {
        error:
          moduleUpsertError,
      } =
        await admin
          .from(
            "organisation_modules",
          )
          .upsert(
            moduleRows,
            {
              onConflict:
                "organisation_id,module_key",
            },
          );

      if (
        moduleUpsertError
      ) {
        console.error(
          "Module entitlement update failed:",
          moduleUpsertError,
        );

        throw moduleUpsertError;
      }
    }

    // ========================================================
    // PROFILE UPDATE
    // ========================================================

    const profilePayload:
      Record<
        string,
        unknown
      > = {
        team_seats_allocated:
          additionalSeats,

        is_subscribed:
          true,
      };

    /*
     * IMPORTANT:
     *
     * Do NOT write "modular" or "complete"
     * into profiles.subscription_tier.
     *
     * That field remains legacy-compatible only.
     */

    if (
      billingModel ===
        "legacy_tier" &&
      legacyTier
    ) {
      profilePayload
        .subscription_tier =
        legacyTier;
    }

    const {
      error:
        profileUpdateError,
    } =
      await admin
        .from(
          "profiles",
        )
        .update(
          profilePayload,
        )
        .eq(
          "id",
          user.id,
        );

    if (
      profileUpdateError
    ) {
      console.error(
        "Profile subscription update failed:",
        profileUpdateError,
      );

      /*
       * Do not remove paid access just because
       * profile synchronisation failed.
       */
    }

    // ========================================================
    // SYNC SUBSCRIPTIONS TABLE IF RECORD EXISTS
    // ========================================================

    const {
      data:
        existingSubscriptionRecord,

      error:
        subscriptionLookupError,
    } =
      await admin
        .from(
          "subscriptions",
        )
        .select(
          "id",
        )
        .eq(
          "stripe_subscription_id",
          subscriptionId,
        )
        .maybeSingle();

    if (
      subscriptionLookupError
    ) {
      console.error(
        "Subscription record lookup failed:",
        subscriptionLookupError,
      );
    }

    if (
      existingSubscriptionRecord
        ?.id
    ) {
      const {
        error:
          subscriptionUpdateError,
      } =
        await admin
          .from(
            "subscriptions",
          )
          .update({
            organisation_id:
              organisation.id,

            stripe_customer_id:
              getStripeCustomerId(
                subscription,
              ),

            active:
              true,

            status:
              "active",
          })
          .eq(
            "id",
            existingSubscriptionRecord.id,
          );

      if (
        subscriptionUpdateError
      ) {
        console.error(
          "Subscription record sync failed:",
          subscriptionUpdateError,
        );
      }
    }

    // ========================================================
    // SUCCESS LOG
    // ========================================================

    console.log(
      "[STRIPE VERIFY] Existing account activated:",
      {
        userId:
          user.id,

        organisationId:
          organisation.id,

        subscriptionId,

        stripeStatus:
          subscription.status,

        billingModel,

        billingPackage,

        legacyTier,

        modules,

        requestedAiTier,

        effectiveAiTier,

        monthlyTotalPence,

        additionalSeats,
      },
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      organisationId:
        organisation.id,

      organisationName:
        organisation.name,

      subscriptionId,

      subscriptionStatus:
        subscription.status,

      billingModel,

      package:
        billingPackage,

      modules,

      aiTier:
        effectiveAiTier,

      requestedAiTier,

      monthlyTotalPence,

      additionalSeats,

      billingVersion,

      /*
       * Legacy compatibility.
       *
       * Your billing page can ignore this for modular accounts.
       */
      tier:
        legacyTier,
    });
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[STRIPE VERIFY] Failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Unable to verify your subscription.",
      },
      {
        status:
          500,
      },
    );
  }
}