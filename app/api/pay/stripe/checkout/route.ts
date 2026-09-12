import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createServerClient,
} from "@supabase/ssr";

import {
  cookies,
} from "next/headers";

import {
  BILLING_PRODUCTS,
  MODULE_BUNDLE_PRICES,
  type BillingProductKey,
} from "@/lib/billing-config";

// ======================================================
// RUNTIME
// ======================================================

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ======================================================
// ENVIRONMENT
// ======================================================

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

if (
  !stripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing."
  );
}

if (
  !process.env
    .NEXT_PUBLIC_SUPABASE_URL
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing."
  );
}

if (
  !process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
  );
}

// ======================================================
// STRIPE
// ======================================================

const stripe =
  new Stripe(
    stripeSecretKey,
    {
      apiVersion:
        "2025-02-24.acacia",
    }
  );

// ======================================================
// TYPES
// ======================================================

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
    BillingProductKey | null;

  bundleVariant:
    string;

  aiUpgradeSuggested:
    boolean;

  billingVersion:
    "v2";
};

// ======================================================
// CONFIG
// ======================================================

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

// ======================================================
// HELPERS
// ======================================================

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

// ======================================================
// MODULE VALIDATION
// ======================================================

function isModuleKey(
  value:
    unknown
): value is ModuleKey {
  return (
    typeof value ===
      "string" &&
    MODULE_ORDER.includes(
      value as ModuleKey
    )
  );
}

// ======================================================
// AI VALIDATION
// ======================================================

function isAiTierKey(
  value:
    unknown
): value is AiTierKey {
  return (
    value === "none" ||
    value === "starter" ||
    value === "plus" ||
    value === "pro"
  );
}

// ======================================================
// UNIQUE MODULES
// ======================================================

function normaliseModules(
  value:
    unknown
): ModuleKey[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return MODULE_ORDER.filter(
    (
      moduleKey
    ) =>
      value.some(
        (
          valueItem
        ) =>
          isModuleKey(
            valueItem
          ) &&
          valueItem ===
            moduleKey
      )
  );
}

// ======================================================
// PRICE FROM LOOKUP KEY
// ======================================================

async function getPriceByLookupKey(
  lookupKey:
    string
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

  if (
    !price
  ) {
    throw new Error(
      `Stripe price "${lookupKey}" could not be found.`
    );
  }

  return price;
}

// ======================================================
// AI PRODUCT KEY
// ======================================================

function getAiProductKey(
  tier:
    Exclude<
      AiTierKey,
      "none"
    >
):
  BillingProductKey {
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

// ======================================================
// RESOLVE MODULAR BILLING
// ======================================================

function resolveBillingSelection(
  body:
    Record<
      string,
      unknown
    >
):
  BillingSelection {
  const modules =
    normaliseModules(
      body.modules
    );

  if (
    modules.length ===
    0
  ) {
    throw new Error(
      "Choose at least one TOTS-OS module."
    );
  }

  const requestedAiTier:
    AiTierKey =
      isAiTierKey(
        body.aiTier
      )
        ? body.aiTier
        : "none";

  const requestedPackage =
    cleanString(
      body.package
    )
      .toLowerCase();

  const allModulesSelected =
    MODULE_ORDER.every(
      (
        key
      ) =>
        modules.includes(
          key
        )
    );

  const isComplete =
    requestedPackage ===
      "complete" ||
    allModulesSelected;

  // ====================================================
  // COMPLETE
  // ====================================================

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

  // ====================================================
  // MODULAR 1–5
  // ====================================================

  const moduleCount =
    modules.length;

  let modulePrice =
    0;

  let modulePriceKey:
    BillingProductKey;

  let bundleVariant =
    "";

  // ====================================================
  // ONE MODULE
  // ====================================================

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

  // ====================================================
  // TWO MODULES
  // ====================================================

  else if (
    moduleCount ===
    2
  ) {
    modulePrice =
      MODULE_BUNDLE_PRICES[
        2
      ];

    modulePriceKey =
      "core";

    bundleVariant =
      "bundle_2";
  }

  // ====================================================
  // THREE MODULES
  // ====================================================

  else if (
    moduleCount ===
    3
  ) {
    modulePrice =
      MODULE_BUNDLE_PRICES[
        3
      ];

    modulePriceKey =
      "core";

    bundleVariant =
      "bundle_3";
  }

  // ====================================================
  // FOUR MODULES
  // ====================================================

  else if (
    moduleCount ===
    4
  ) {
    modulePrice =
      MODULE_BUNDLE_PRICES[
        4
      ];

    modulePriceKey =
      "core";

    bundleVariant =
      "bundle_4";
  }

  // ====================================================
  // FIVE MODULES
  // ====================================================

  else {
    modulePrice =
      MODULE_BUNDLE_PRICES[
        5
      ];

    modulePriceKey =
      "core";

    bundleVariant =
      "bundle_5";
  }

  // ====================================================
  // AI
  // ====================================================

  let aiPrice =
    0;

  let aiPriceKey:
    BillingProductKey |
    null =
      null;

  if (
    requestedAiTier !==
    "none"
  ) {
    aiPriceKey =
      getAiProductKey(
        requestedAiTier
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

// ======================================================
// GET MODULE STRIPE PRICE
// ======================================================

async function getModuleStripePrice(
  selection:
    BillingSelection
) {
  // ====================================================
  // COMPLETE
  // ====================================================

  if (
    selection.packageType ===
    "complete"
  ) {
    return getPriceByLookupKey(
      COMPLETE_LOOKUP_KEY
    );
  }

  const moduleCount =
    selection.modules.length;

  // ====================================================
  // ONE MODULE
  // ====================================================

  if (
    moduleCount ===
    1
  ) {
    return getPriceByLookupKey(
      MODULE_LOOKUP_KEYS[
        selection.modules[0]
      ]
    );
  }

  // ====================================================
  // BUNDLE
  // ====================================================

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
      "Unable to resolve module bundle price."
    );
  }

  return getPriceByLookupKey(
    bundleLookupKey
  );
}

// ======================================================
// POST
// ======================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // ==================================================
    // AUTHENTICATED SUPABASE CLIENT
    // ==================================================

    const cookieStore =
      await cookies();

    const supabase =
      createServerClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              }[]
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
                      options
                    );
                  }
                );
              } catch {
                // Safe to ignore
              }
            },
          },
        }
      );

    // ==================================================
    // USER
    // ==================================================

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
        }
      );
    }

    // ==================================================
    // REQUEST
    // ==================================================

    const body =
      (
        await request
          .json()
      ) as Record<
        string,
        unknown
      >;

    const selection =
      resolveBillingSelection(
        body
      );

    const additionalSeats =
      Math.max(
        0,
        Math.floor(
          Number(
            body.additionalSeats ||
              0
          ) || 0
        )
      );

    // ==================================================
    // FIND ORGANISATION
    // ==================================================

    let organisationId:
      string | null =
      null;

    // ==================================================
    // PROFILE
    // ==================================================

    const {
      data:
        profile,

      error:
        profileError,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select(
          "organisation_id"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      profileError
    ) {
      console.error(
        "Profile organisation lookup error:",
        profileError
      );
    }

    if (
      profile
        ?.organisation_id
    ) {
      organisationId =
        profile
          .organisation_id;
    }

    // ==================================================
    // ORGANISATION MEMBERS
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          membership,

        error:
          membershipError,
      } =
        await supabase
          .from(
            "organisation_members"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        membershipError
      ) {
        console.error(
          "Organisation membership lookup error:",
          membershipError
        );
      }

      if (
        membership
          ?.organisation_id
      ) {
        organisationId =
          membership
            .organisation_id;
      }
    }

    // ==================================================
    // USER ORGANISATIONS
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          userOrganisation,

        error:
          userOrganisationError,
      } =
        await supabase
          .from(
            "user_organisations"
          )
          .select(
            "organisation_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        userOrganisationError
      ) {
        console.error(
          "User organisation lookup error:",
          userOrganisationError
        );
      }

      if (
        userOrganisation
          ?.organisation_id
      ) {
        organisationId =
          userOrganisation
            .organisation_id;
      }
    }

    // ==================================================
    // CREATED BY
    // ==================================================

    if (
      !organisationId
    ) {
      const {
        data:
          createdOrganisation,

        error:
          createdOrganisationError,
      } =
        await supabase
          .from(
            "organisations"
          )
          .select(
            "id"
          )
          .eq(
            "created_by",
            user.id
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        createdOrganisationError
      ) {
        console.error(
          "Created organisation lookup error:",
          createdOrganisationError
        );
      }

      if (
        createdOrganisation
          ?.id
      ) {
        organisationId =
          createdOrganisation
            .id;
      }
    }

    // ==================================================
    // NOT FOUND
    // ==================================================

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
        }
      );
    }

    // ==================================================
    // LOAD ORGANISATION
    // ==================================================

    const {
      data:
        organisation,

      error:
        organisationError,
    } =
      await supabase
        .from(
          "organisations"
        )
        .select(
          `
            id,
            name,
            created_by,
            subscription_status,
            access_status,
            billing_model,
            billing_package,
            clarity_ai_tier,
            billing_version
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
      console.error(
        "Organisation lookup error:",
        organisationError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load your organisation.",
        },
        {
          status:
            500,
        }
      );
    }

    if (
      !organisation
    ) {
      return NextResponse.json(
        {
          error:
            "Your organisation record could not be found.",
        },
        {
          status:
            404,
        }
      );
    }

    // ==================================================
    // APP URL
    // ==================================================

    const appUrl =
      process.env
        .NEXT_PUBLIC_APP_URL;

    if (
      !appUrl
    ) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is missing."
      );
    }

    // ==================================================
    // STRIPE MODULE / BUNDLE PRICE
    // ==================================================

    const moduleStripePrice =
      await getModuleStripePrice(
        selection
      );

    if (
      moduleStripePrice
        .unit_amount !==
      selection.modulePrice
    ) {
      throw new Error(
        `Stripe module price does not match TOTS-OS billing configuration. Expected ${selection.modulePrice}p but Stripe returned ${moduleStripePrice.unit_amount ?? "no amount"}p.`
      );
    }

    // ==================================================
    // LINE ITEMS
    // ==================================================

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

    // ==================================================
    // CLARITY AI
    // ==================================================

    if (
      selection.packageType ===
        "modular" &&
      selection.effectiveAiTier !==
        "none"
    ) {
      const aiTier =
        selection
          .effectiveAiTier as
          Exclude<
            AiTierKey,
            "none"
          >;

      const aiLookupKey =
        AI_LOOKUP_KEYS[
          aiTier
        ];

      const aiStripePrice =
        await getPriceByLookupKey(
          aiLookupKey
        );

      if (
        aiStripePrice
          .unit_amount !==
        selection.aiPrice
      ) {
        throw new Error(
          `Stripe Clarity AI price does not match TOTS-OS billing configuration. Expected ${selection.aiPrice}p but Stripe returned ${aiStripePrice.unit_amount ?? "no amount"}p.`
        );
      }

      lineItems.push({
        price:
          aiStripePrice.id,

        quantity:
          1,
      });
    }

    // ==================================================
    // TEAM SEATS
    // ==================================================

    if (
      additionalSeats >
      0
    ) {
      const teamSeatPriceId =
        process.env
          .STRIPE_PRICE_TEAM_SEAT;

      if (
        !teamSeatPriceId
      ) {
        return NextResponse.json(
          {
            error:
              "Team seat billing has not been configured yet.",
          },
          {
            status:
              400,
          }
        );
      }

      lineItems.push({
        price:
          teamSeatPriceId,

        quantity:
          additionalSeats,
      });
    }

    // ==================================================
    // METADATA
    // ==================================================

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
          organisation.id,

        organisation_name:
          cleanString(
            organisation.name
          ),

        checkout_type:
          "existing_account",

        subscription_tier:
          selection.packageType ===
            "complete"
            ? "complete"
            : "modular",

        billing_model:
          selection.billingModel,

        billing_package:
          selection.packageType,

        modules:
          modulesMetadata,

        requested_ai_tier:
          selection.requestedAiTier,

        effective_ai_tier:
          selection.effectiveAiTier,

        ai_upgrade_suggested:
          String(
            selection
              .aiUpgradeSuggested
          ),

        bundle_variant:
          selection.bundleVariant,

        monthly_total_pence:
          String(
            selection
              .monthlyTotal
          ),

        billing_version:
          selection.billingVersion,

        additional_seats:
          String(
            additionalSeats
          ),
      };

    // ==================================================
    // CREATE CHECKOUT SESSION
    // ==================================================

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

    // ==================================================
    // URL CHECK
    // ==================================================

    if (
      !session.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL."
      );
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
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

      additionalSeats,

      organisationId:
        organisation.id,
    });
  } catch (
    error:
      unknown
  ) {
    console.error(
      "Existing modular subscription checkout error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Unable to create checkout session.",
      },
      {
        status:
          500,
      }
    );
  }
}