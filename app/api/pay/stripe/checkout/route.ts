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
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  cookies,
} from "next/headers";

import {
  BILLING_PRODUCTS,
  MODULE_BUNDLE_PRICES,
  type BillingProductKey,
} from "@/lib/billing-config";

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

if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing.",
  );
}

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
  );
}

if (!supabaseServiceRoleKey) {
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

type BillingPackage =
  | "modular"
  | "complete";

type BillingSelection = {
  billingModel:
    "modular";

  packageType:
    BillingPackage;

  modules:
    ModuleKey[];

  requestedAiTier:
    AiTierKey;

  effectiveAiTier:
    AiTierKey;

  monthlyTotal:
    number;

  modulePrice:
    number;

  aiPrice:
    number;

  modulePriceKey:
    BillingProductKey;

  aiPriceKey:
    | BillingProductKey
    | null;

  bundleVariant:
    string;

  aiUpgradeSuggested:
    boolean;

  billingVersion:
    "v2";
};

type ExistingSubscriptionRow = {
  id:
    string;

  stripe_subscription_id:
    | string
    | null;

  active:
    | boolean
    | null;

  status:
    | string
    | null;
};

type OrganisationModuleRow = {
  id:
    string;

  module_key:
    string;
};

// ============================================================
// UNTYPED ADMIN CLIENT
// ============================================================

/*
 * IMPORTANT
 * ------------------------------------------------------------
 * Your generated Supabase Database types are currently behind
 * your live schema.
 *
 * In particular, the new modular billing fields/tables are
 * resolving to `never` for writes.
 *
 * The service-role client in THIS SERVER ROUTE is deliberately
 * left untyped until your generated database types are refreshed.
 *
 * This does not expose the service-role key to the browser.
 */

type AdminSupabaseClient =
  SupabaseClient<any, any, any>;

// ============================================================
// CONSTANTS
// ============================================================

const COMPLETE_PRICE =
  13900;

const MODULE_ORDER:
  ModuleKey[] = [
    "core",
    "clientsProjects",
    "finance",
    "social",
    "email",
    "store",
  ];

const MODULE_LOOKUP_KEYS:
  Record<
    ModuleKey,
    string
  > = {
    core:
      "tots_v2_core_monthly",

    clientsProjects:
      "tots_v2_clientsProjects_monthly",

    finance:
      "tots_v2_finance_monthly",

    social:
      "tots_v2_social_monthly",

    email:
      "tots_v2_email_monthly",

    store:
      "tots_v2_store_monthly",
  };

const AI_LOOKUP_KEYS:
  Record<
    Exclude<
      AiTierKey,
      "none"
    >,
    string
  > = {
    starter:
      "tots_v2_aiStarter_monthly",

    plus:
      "tots_v2_aiPlus_monthly",

    pro:
      "tots_v2_aiPro_monthly",
  };

const BUNDLE_LOOKUP_KEYS = {
  2:
    "tots_v2_bundle_2_monthly",

  3:
    "tots_v2_bundle_3_monthly",

  4:
    "tots_v2_bundle_4_monthly",

  5:
    "tots_v2_bundle_5_monthly",
} as const;

const COMPLETE_LOOKUP_KEY =
  "tots_v2_complete_monthly";

// ============================================================
// STRING HELPER
// ============================================================

function cleanString(
  value:
    unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

// ============================================================
// MODULE HELPERS
// ============================================================

function isModuleKey(
  value:
    unknown,
): value is ModuleKey {
  return (
    typeof value ===
      "string" &&
    MODULE_ORDER.includes(
      value as
        ModuleKey,
    )
  );
}

function normaliseModules(
  value:
    unknown,
): ModuleKey[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return MODULE_ORDER.filter(
    (
      moduleKey,
    ) =>
      value.some(
        (
          valueItem,
        ) =>
          isModuleKey(
            valueItem,
          ) &&
          valueItem ===
            moduleKey,
      ),
  );
}

// ============================================================
// AI HELPERS
// ============================================================

function isAiTierKey(
  value:
    unknown,
): value is AiTierKey {
  return (
    value ===
      "none" ||
    value ===
      "starter" ||
    value ===
      "plus" ||
    value ===
      "pro"
  );
}

function getAiProductKey(
  tier:
    Exclude<
      AiTierKey,
      "none"
    >,
): BillingProductKey {
  if (
    tier ===
    "starter"
  ) {
    return "aiStarter";
  }

  if (
    tier ===
    "plus"
  ) {
    return "aiPlus";
  }

  return "aiPro";
}

// ============================================================
// STRIPE PRICE LOOKUP
// ============================================================

async function getPriceByLookupKey(
  lookupKey:
    string,
) {
  const prices =
    await stripe
      .prices
      .list({
        lookup_keys: [
          lookupKey,
        ],

        active:
          true,

        limit:
          1,
      });

  const price =
    prices.data[0];

  if (!price) {
    throw new Error(
      `Stripe price "${lookupKey}" could not be found.`,
    );
  }

  return price;
}

// ============================================================
// BILLING SELECTION
// ============================================================

function resolveBillingSelection(
  body:
    Record<
      string,
      unknown
    >,
): BillingSelection {
  const modules =
    normaliseModules(
      body.modules,
    );

  if (
    modules.length ===
    0
  ) {
    throw new Error(
      "Choose at least one TOTS-OS module.",
    );
  }

  const requestedAiTier:
    AiTierKey =
      isAiTierKey(
        body.aiTier,
      )
        ? body.aiTier
        : "none";

  const requestedPackage =
    cleanString(
      body.package,
    ).toLowerCase();

  const allModulesSelected =
    MODULE_ORDER.every(
      (
        moduleKey,
      ) =>
        modules.includes(
          moduleKey,
        ),
    );

  const isComplete =
    requestedPackage ===
      "complete" ||
    allModulesSelected;

  // ==========================================================
  // COMPLETE
  // ==========================================================

  if (
    isComplete
  ) {
    return {
      billingModel:
        "modular",

      packageType:
        "complete",

      modules:
        [...MODULE_ORDER],

      requestedAiTier,

      /*
       * Complete currently includes Starter.
       *
       * Plus/Pro are not charged on top in this flow.
       */
      effectiveAiTier:
        "starter",

      monthlyTotal:
        COMPLETE_PRICE,

      modulePrice:
        COMPLETE_PRICE,

      aiPrice:
        0,

      modulePriceKey:
        "complete",

      aiPriceKey:
        null,

      bundleVariant:
        "complete",

      aiUpgradeSuggested:
        requestedAiTier ===
          "plus" ||
        requestedAiTier ===
          "pro",

      billingVersion:
        "v2",
    };
  }

  // ==========================================================
  // MODULE PRICE
  // ==========================================================

  const moduleCount =
    modules.length;

  let modulePrice =
    0;

  let modulePriceKey:
    BillingProductKey;

  let bundleVariant =
    "";

  // ----------------------------------------------------------
  // SINGLE MODULE
  // ----------------------------------------------------------

  if (
    moduleCount ===
    1
  ) {
    const moduleKey =
      modules[0];

    modulePrice =
      BILLING_PRODUCTS[
        moduleKey
      ].amount;

    modulePriceKey =
      moduleKey;

    bundleVariant =
      "single";
  }

  // ----------------------------------------------------------
  // 2-5 MODULE BUNDLE
  // ----------------------------------------------------------

  else if (
    moduleCount >= 2 &&
    moduleCount <= 5
  ) {
    modulePrice =
      MODULE_BUNDLE_PRICES[
        moduleCount as
          | 2
          | 3
          | 4
          | 5
      ];

    /*
     * Placeholder BillingProductKey only.
     *
     * Stripe bundle lookup is handled independently below.
     */
    modulePriceKey =
      "core";

    bundleVariant =
      `bundle_${moduleCount}`;
  }

  // ----------------------------------------------------------
  // INVALID
  // ----------------------------------------------------------

  else {
    throw new Error(
      "Unable to resolve module bundle price.",
    );
  }

  // ==========================================================
  // AI PRICE
  // ==========================================================

  let aiPrice =
    0;

  let aiPriceKey:
    | BillingProductKey
    | null =
      null;

  if (
    requestedAiTier !==
    "none"
  ) {
    aiPriceKey =
      getAiProductKey(
        requestedAiTier,
      );

    aiPrice =
      BILLING_PRODUCTS[
        aiPriceKey
      ].amount;
  }

  return {
    billingModel:
      "modular",

    packageType:
      "modular",

    modules,

    requestedAiTier,

    effectiveAiTier:
      requestedAiTier,

    monthlyTotal:
      modulePrice +
      aiPrice,

    modulePrice,

    aiPrice,

    modulePriceKey,

    aiPriceKey,

    bundleVariant,

    aiUpgradeSuggested:
      false,

    billingVersion:
      "v2",
  };
}

// ============================================================
// MODULE STRIPE PRICE
// ============================================================

async function getModuleStripePrice(
  selection:
    BillingSelection,
) {
  // ----------------------------------------------------------
  // COMPLETE
  // ----------------------------------------------------------

  if (
    selection
      .packageType ===
    "complete"
  ) {
    return getPriceByLookupKey(
      COMPLETE_LOOKUP_KEY,
    );
  }

  const moduleCount =
    selection
      .modules
      .length;

  // ----------------------------------------------------------
  // SINGLE MODULE
  // ----------------------------------------------------------

  if (
    moduleCount ===
    1
  ) {
    return getPriceByLookupKey(
      MODULE_LOOKUP_KEYS[
        selection
          .modules[0]
      ],
    );
  }

  // ----------------------------------------------------------
  // BUNDLE
  // ----------------------------------------------------------

  const bundleLookupKey =
    BUNDLE_LOOKUP_KEYS[
      moduleCount as
        | 2
        | 3
        | 4
        | 5
    ];

  if (
    !bundleLookupKey
  ) {
    throw new Error(
      "Unable to resolve module bundle price.",
    );
  }

  return getPriceByLookupKey(
    bundleLookupKey,
  );
}

// ============================================================
// FIND ORGANISATION
// ============================================================

async function findOrganisationId(
  supabase:
    ReturnType<
      typeof createServerClient
    >,

  userId:
    string,
) {
  // ==========================================================
  // PROFILE
  // ==========================================================

  const {
    data:
      profile,
  } =
    await supabase
      .from(
        "profiles",
      )
      .select(
        "organisation_id",
      )
      .eq(
        "id",
        userId,
      )
      .maybeSingle();

  if (
    profile
      ?.organisation_id
  ) {
    return String(
      profile
        .organisation_id,
    );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  const {
    data:
      membership,
  } =
    await supabase
      .from(
        "organisation_members",
      )
      .select(
        "organisation_id",
      )
      .eq(
        "user_id",
        userId,
      )
      .limit(
        1,
      )
      .maybeSingle();

  if (
    membership
      ?.organisation_id
  ) {
    return String(
      membership
        .organisation_id,
    );
  }

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  const {
    data:
      userOrganisation,
  } =
    await supabase
      .from(
        "user_organisations",
      )
      .select(
        "organisation_id",
      )
      .eq(
        "user_id",
        userId,
      )
      .limit(
        1,
      )
      .maybeSingle();

  if (
    userOrganisation
      ?.organisation_id
  ) {
    return String(
      userOrganisation
        .organisation_id,
    );
  }

  // ==========================================================
  // LEGACY CREATED_BY
  // ==========================================================

  const {
    data:
      createdOrganisation,
  } =
    await supabase
      .from(
        "organisations",
      )
      .select(
        "id",
      )
      .eq(
        "created_by",
        userId,
      )
      .limit(
        1,
      )
      .maybeSingle();

  if (
    createdOrganisation
      ?.id
  ) {
    return String(
      createdOrganisation
        .id,
    );
  }

  return null;
}

// ============================================================
// EXISTING SUBSCRIPTION
// ============================================================

async function getExistingSubscription(
  admin:
    AdminSupabaseClient,

  organisationId:
    string,

  userEmail:
    | string
    | undefined,
) {
  // ==========================================================
  // DATABASE SUBSCRIPTIONS
  // ==========================================================

  const {
    data:
      rawRows,

    error:
      rowsError,
  } =
    await admin
      .from(
        "subscriptions",
      )
      .select(
        `
          id,
          stripe_subscription_id,
          active,
          status
        `,
      )
      .eq(
        "organisation_id",
        organisationId,
      )
      .not(
        "stripe_subscription_id",
        "is",
        null,
      )
      .limit(
        10,
      );

  if (
    rowsError
  ) {
    console.error(
      "Existing subscription lookup failed:",
      rowsError,
    );
  }

  /*
   * Explicit runtime-safe result shape.
   *
   * The admin client is deliberately untyped until generated
   * Supabase types are refreshed.
   */
  const rows =
    (
      rawRows ??
      []
    ) as
      ExistingSubscriptionRow[];

  // ==========================================================
  // TRY STORED STRIPE SUBSCRIPTIONS
  // ==========================================================

  for (
    const row of
    rows
  ) {
    const id =
      cleanString(
        row
          .stripe_subscription_id,
      );

    if (!id) {
      continue;
    }

    try {
      const subscription =
        await stripe
          .subscriptions
          .retrieve(
            id,
          );

      if (
        subscription
          .status ===
          "active" ||
        subscription
          .status ===
          "trialing"
      ) {
        return subscription;
      }
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Stored Stripe subscription could not be loaded:",
        error,
      );
    }
  }

  // ==========================================================
  // NO EMAIL FALLBACK POSSIBLE
  // ==========================================================

  if (
    !userEmail
  ) {
    return null;
  }

  // ==========================================================
  // STRIPE CUSTOMER FALLBACK
  // ==========================================================

  const customers =
    await stripe
      .customers
      .list({
        email:
          userEmail,

        limit:
          10,
      });

  for (
    const customer of
    customers.data
  ) {
    const subscriptions =
      await stripe
        .subscriptions
        .list({
          customer:
            customer.id,

          status:
            "all",

          limit:
            100,
        });

    const matching =
      subscriptions
        .data
        .find(
          (
            subscription,
          ) => {
            // --------------------------------------------------
            // ONLY ACTIVE/TRIALING
            // --------------------------------------------------

            if (
              subscription
                .status !==
                "active" &&
              subscription
                .status !==
                "trialing"
            ) {
              return false;
            }

            // --------------------------------------------------
            // STRONGEST MATCH:
            // ORGANISATION METADATA
            // --------------------------------------------------

            const metadataOrg =
              cleanString(
                subscription
                  .metadata
                  ?.organisation_id,
              );

            if (
              metadataOrg ===
              organisationId
            ) {
              return true;
            }

            // --------------------------------------------------
            // COMPATIBILITY FALLBACK:
            // EARLY V2 SUBSCRIPTION
            // --------------------------------------------------

            return subscription
              .items
              .data
              .some(
                (
                  item,
                ) =>
                  (
                    item
                      .price
                      .lookup_key ||
                    ""
                  ).startsWith(
                    "tots_v2_",
                  ),
              );
          },
        );

    if (
      matching
    ) {
      return matching;
    }
  }

  return null;
}

// ============================================================
// SYNC ORGANISATION MODULES
// ============================================================

async function syncOrganisationModules(
  admin:
    AdminSupabaseClient,

  organisationId:
    string,

  selection:
    BillingSelection,
) {
  const now =
    new Date()
      .toISOString();

  // ==========================================================
  // ORGANISATION
  // ==========================================================

  const {
    error:
      organisationUpdateError,
  } =
    await admin
      .from(
        "organisations",
      )
      .update({
        billing_model:
          "modular",

        billing_package:
          selection
            .packageType,

        billing_version:
          selection
            .billingVersion,

        clarity_ai_tier:
          selection
            .effectiveAiTier,

        subscription_status:
          "active",

        access_status:
          "active",

        store_enabled:
          selection
            .modules
            .includes(
              "store",
            ),
      })
      .eq(
        "id",
        organisationId,
      );

  if (
    organisationUpdateError
  ) {
    console.error(
      "Organisation billing update failed:",
      organisationUpdateError,
    );

    throw organisationUpdateError;
  }

  // ==========================================================
  // LOAD CURRENT MODULE ROWS
  // ==========================================================

  const {
    data:
      rawCurrentRows,

    error:
      lookupError,
  } =
    await admin
      .from(
        "organisation_modules",
      )
      .select(
        "id,module_key",
      )
      .eq(
        "organisation_id",
        organisationId,
      );

  if (
    lookupError
  ) {
    console.error(
      "Organisation module lookup failed:",
      lookupError,
    );

    throw lookupError;
  }

  const currentRows =
    (
      rawCurrentRows ??
      []
    ) as
      OrganisationModuleRow[];

  // ==========================================================
  // CANCEL MODULES NO LONGER SELECTED
  // ==========================================================

  const idsToCancel =
    currentRows
      .filter(
        (
          row,
        ) =>
          !selection
            .modules
            .includes(
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
    idsToCancel.length >
    0
  ) {
    const {
      error:
        cancelError,
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
          idsToCancel,
        );

    if (
      cancelError
    ) {
      console.error(
        "Organisation module cancellation failed:",
        cancelError,
      );

      throw cancelError;
    }
  }

  // ==========================================================
  // ACTIVATE SELECTED MODULES
  // ==========================================================

  const moduleRows =
    selection
      .modules
      .map(
        (
          moduleKey,
        ) => ({
          organisation_id:
            organisationId,

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
      upsertError,
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
    upsertError
  ) {
    console.error(
      "Organisation module activation failed:",
      upsertError,
    );

    throw upsertError;
  }
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
    // COOKIE STORE
    // ========================================================

    const cookieStore =
      await cookies();

    // ========================================================
    // AUTHENTICATED SUPABASE CLIENT
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
                /*
                 * Safe to ignore when cookies cannot be
                 * mutated from the current server context.
                 */
              }
            },
          },
        },
      );

    // ========================================================
    // USER
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
            "You must be logged in to manage your subscription.",
        },
        {
          status:
            401,
        },
      );
    }

    // ========================================================
    // REQUEST BODY
    // ========================================================

    const body =
      (
        await request
          .json()
      ) as Record<
        string,
        unknown
      >;

    // ========================================================
    // BILLING SELECTION
    // ========================================================

    const selection =
      resolveBillingSelection(
        body,
      );

    // ========================================================
    // ORGANISATION ID
    // ========================================================

    const organisationId =
      await findOrganisationId(
        supabase,
        user.id,
      );

    if (
      !organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "No organisation is connected to this account.",
        },
        {
          status:
            404,
        },
      );
    }

    // ========================================================
    // ORGANISATION
    // ========================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabase
        .from(
          "organisations",
        )
        .select(
          "id,name",
        )
        .eq(
          "id",
          organisationId,
        )
        .maybeSingle();

    if (
      organisationError ||
      !organisation
    ) {
      console.error(
        "Organisation lookup failed:",
        organisationError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load your organisation.",
        },
        {
          status:
            500,
        },
      );
    }

    // ========================================================
    // APP URL
    // ========================================================

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL;

    if (
      !appUrl
    ) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is missing.",
      );
    }

    // ========================================================
    // MODULE STRIPE PRICE
    // ========================================================

    const moduleStripePrice =
      await getModuleStripePrice(
        selection,
      );

    // ========================================================
    // VERIFY MODULE PRICE
    // ========================================================

    if (
      moduleStripePrice
        .unit_amount !==
      selection
        .modulePrice
    ) {
      throw new Error(
        `Stripe module price does not match TOTS-OS billing configuration. Expected ${selection.modulePrice}p but Stripe returned ${moduleStripePrice.unit_amount ?? "no amount"}p.`,
      );
    }

    // ========================================================
    // AI STRIPE PRICE
    // ========================================================

    let aiStripePrice:
      | Stripe.Price
      | null =
        null;

    if (
      selection
        .packageType ===
        "modular" &&
      selection
        .effectiveAiTier !==
        "none"
    ) {
      const aiTier =
        selection
          .effectiveAiTier as
          Exclude<
            AiTierKey,
            "none"
          >;

      aiStripePrice =
        await getPriceByLookupKey(
          AI_LOOKUP_KEYS[
            aiTier
          ],
        );

      // ======================================================
      // VERIFY AI PRICE
      // ======================================================

      if (
        aiStripePrice
          .unit_amount !==
        selection
          .aiPrice
      ) {
        throw new Error(
          `Stripe Clarity AI price does not match TOTS-OS billing configuration. Expected ${selection.aiPrice}p but Stripe returned ${aiStripePrice.unit_amount ?? "no amount"}p.`,
        );
      }
    }

    // ========================================================
    // METADATA
    // ========================================================

    const modulesMetadata =
      selection
        .modules
        .join(",");

    const metadata:
      Record<
        string,
        string
      > = {
        user_id:
          user.id,

        organisation_id:
          String(
            organisation.id,
          ),

        organisation_name:
          cleanString(
            organisation.name,
          ),

        checkout_type:
          "existing_account",

        /*
         * Compatibility metadata only.
         *
         * This value must NOT be written to legacy constrained
         * subscription_tier database columns.
         */
        subscription_tier:
          selection
            .packageType ===
            "complete"
            ? "complete"
            : "modular",

        billing_model:
          selection
            .billingModel,

        billing_package:
          selection
            .packageType,

        modules:
          modulesMetadata,

        requested_ai_tier:
          selection
            .requestedAiTier,

        effective_ai_tier:
          selection
            .effectiveAiTier,

        ai_upgrade_suggested:
          String(
            selection
              .aiUpgradeSuggested,
          ),

        bundle_variant:
          selection
            .bundleVariant,

        monthly_total_pence:
          String(
            selection
              .monthlyTotal,
          ),

        billing_version:
          selection
            .billingVersion,
      };

    // ========================================================
    // SERVICE-ROLE ADMIN CLIENT
    // ========================================================

    /*
     * IMPORTANT:
     *
     * Do not attach your stale generated Database type to this
     * client yet.
     *
     * This route is server-only and the service-role key never
     * leaves the server.
     */

    const admin:
      AdminSupabaseClient =
        createClient(
          supabaseUrl!,
          supabaseServiceRoleKey!,
          {
            auth: {
              persistSession:
                false,

              autoRefreshToken:
                false,

              detectSessionInUrl:
                false,
            },
          },
        );

    // ========================================================
    // FIND EXISTING SUBSCRIPTION
    // ========================================================

    const existingSubscription =
      await getExistingSubscription(
        admin,
        String(
          organisation.id,
        ),
        user.email,
      );

    // ========================================================
    // EXISTING SUBSCRIPTION
    // ========================================================

    if (
      existingSubscription
    ) {
      const teamSeatPriceId =
        process.env
          .STRIPE_PRICE_TEAM_SEAT;

      // ======================================================
      // PRESERVE TEAM-SEAT ITEM
      // ======================================================

      const oldBillingItems =
        existingSubscription
          .items
          .data
          .filter(
            (
              item,
            ) =>
              !teamSeatPriceId ||
              item
                .price
                .id !==
                teamSeatPriceId,
          );

      // ======================================================
      // DELETE OLD TOTS BILLING ITEMS
      // ======================================================

      const updateItems:
        Stripe.SubscriptionUpdateParams.Item[] =
        oldBillingItems
          .map(
            (
              item,
            ) => ({
              id:
                item.id,

              deleted:
                true,
            }),
          );

      // ======================================================
      // ADD NEW MODULE/BUNDLE ITEM
      // ======================================================

      updateItems.push({
        price:
          moduleStripePrice.id,

        quantity:
          1,
      });

      // ======================================================
      // ADD AI ITEM
      // ======================================================

      if (
        aiStripePrice
      ) {
        updateItems.push({
          price:
            aiStripePrice.id,

          quantity:
            1,
        });
      }

      // ======================================================
      // UPDATE STRIPE SUBSCRIPTION
      // ======================================================

      const updatedSubscription =
        await stripe
          .subscriptions
          .update(
            existingSubscription.id,
            {
              items:
                updateItems,

              metadata,

              /*
               * Trialing subscriptions keep their existing
               * trial period.
               *
               * Active paid subscriptions receive normal
               * Stripe prorations.
               */
              proration_behavior:
                "create_prorations",
            },
          );

      // ======================================================
      // VERIFY STATUS
      // ======================================================

      if (
        updatedSubscription
          .status !==
          "active" &&
        updatedSubscription
          .status !==
          "trialing"
      ) {
        throw new Error(
          `Stripe subscription changed to ${updatedSubscription.status}.`,
        );
      }

      // ======================================================
      // SYNC MODULE ENTITLEMENTS
      // ======================================================

      await syncOrganisationModules(
        admin,
        String(
          organisation.id,
        ),
        selection,
      );

      // ======================================================
      // STRIPE CUSTOMER ID
      // ======================================================

      const stripeCustomerId =
        typeof updatedSubscription
          .customer ===
        "string"
          ? updatedSubscription
              .customer
          : updatedSubscription
              .customer
              .id;

      // ======================================================
      // SYNC LOCAL SUBSCRIPTION RECORD
      // ======================================================

      const {
        error:
          localSubscriptionUpdateError,
      } =
        await admin
          .from(
            "subscriptions",
          )
          .update({
            organisation_id:
              String(
                organisation.id,
              ),

            stripe_subscription_id:
              updatedSubscription.id,

            stripe_customer_id:
              stripeCustomerId,

            active:
              true,

            status:
              updatedSubscription
                .status,
          })
          .eq(
            "stripe_subscription_id",
            updatedSubscription.id,
          );

      if (
        localSubscriptionUpdateError
      ) {
        /*
         * Stripe is already updated, so don't attempt to undo
         * paid access just because this compatibility table
         * failed to sync.
         */
        console.error(
          "Local subscription record update failed:",
          localSubscriptionUpdateError,
        );
      }

      // ======================================================
      // SUCCESS
      // ======================================================

      console.log(
        "[BILLING] Existing subscription updated:",
        {
          userId:
            user.id,

          organisationId:
            organisation.id,

          subscriptionId:
            updatedSubscription.id,

          stripeStatus:
            updatedSubscription
              .status,

          package:
            selection
              .packageType,

          modules:
            selection
              .modules,

          aiTier:
            selection
              .effectiveAiTier,

          monthlyTotalPence:
            selection
              .monthlyTotal,
        },
      );

      return NextResponse.json({
        success:
          true,

        updated:
          true,

        checkoutRequired:
          false,

        subscriptionId:
          updatedSubscription.id,

        subscriptionStatus:
          updatedSubscription
            .status,

        billingModel:
          selection
            .billingModel,

        package:
          selection
            .packageType,

        modules:
          selection
            .modules,

        requestedAiTier:
          selection
            .requestedAiTier,

        effectiveAiTier:
          selection
            .effectiveAiTier,

        monthlyTotalPence:
          selection
            .monthlyTotal,

        organisationId:
          organisation.id,

        redirectUrl:
          `${appUrl}/dashboard`,
      });
    }

    // ========================================================
    // NO EXISTING SUBSCRIPTION
    // ========================================================
    //
    // This is for an existing TOTS account which does not yet
    // have an active/trialing Stripe subscription.
    //
    // In this case we DO need Stripe Checkout.
    // ========================================================

    const lineItems:
      Stripe.Checkout.SessionCreateParams.LineItem[] =
        [
          {
            price:
              moduleStripePrice.id,

            quantity:
              1,
          },
        ];

    if (
      aiStripePrice
    ) {
      lineItems.push({
        price:
          aiStripePrice.id,

        quantity:
          1,
      });
    }

    // ========================================================
    // CHECKOUT SESSION
    // ========================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode:
            "subscription",

          line_items:
            lineItems,

          customer_email:
            user.email,

          allow_promotion_codes:
            true,

          billing_address_collection:
            "auto",

          success_url:
            `${appUrl}/billing?success=true&existing=true&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/billing?cancelled=true&existing=true`,

          metadata,

          subscription_data: {
            metadata,
          },
        });

    // ========================================================
    // CHECKOUT URL VALIDATION
    // ========================================================

    if (
      !session.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL.",
      );
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success:
        true,

      updated:
        false,

      checkoutRequired:
        true,

      url:
        session.url,

      sessionId:
        session.id,

      billingModel:
        selection
          .billingModel,

      package:
        selection
          .packageType,

      modules:
        selection
          .modules,

      requestedAiTier:
        selection
          .requestedAiTier,

      effectiveAiTier:
        selection
          .effectiveAiTier,

      monthlyTotalPence:
        selection
          .monthlyTotal,

      organisationId:
        organisation.id,
    });
  } catch (
    error:
      unknown
  ) {
    console.error(
      "Existing modular subscription checkout error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Unable to update subscription.",
      },
      {
        status:
          500,
      },
    );
  }
}