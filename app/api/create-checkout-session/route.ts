import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createClient,
} from "@supabase/supabase-js";

import crypto from "crypto";

import {
  BILLING_PRODUCTS,
  MODULE_BUNDLE_PRICES,
  type BillingProductKey,
} from "@/lib/billing-config";

export const runtime =
  "nodejs";

// ======================================================
// STRIPE
// ======================================================

const stripeSecretKey =
  process.env
    .STRIPE_SECRET_KEY;

if (
  !stripeSecretKey
) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing",
  );
}

const stripe =
  new Stripe(
    stripeSecretKey,
    {
      apiVersion:
        "2025-02-24.acacia",
    },
  );

// ======================================================
// SUPABASE ADMIN
// ======================================================

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing",
  );
}

if (
  !supabaseServiceRoleKey
) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing",
  );
}

const supabase =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
  );

// ======================================================
// REGISTRATION ENCRYPTION
// ======================================================

const registrationEncryptionKey =
  process.env
    .REGISTRATION_ENCRYPTION_KEY ||
  "";

if (
  !registrationEncryptionKey
) {
  throw new Error(
    "REGISTRATION_ENCRYPTION_KEY is missing",
  );
}

// ======================================================
// TYPES
// ======================================================

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

type PackageType =
  | "modular"
  | "complete";

type ModularBundle =
  | "single"
  | "bundle_2"
  | "bundle_3"
  | "bundle_4"
  | "bundle_5"
  | "complete";

type BillingSelection =
  | {
      billingModel:
        "legacy_tier";

      subscriptionTier:
        LegacySubscriptionTier;

      packageType:
        "legacy";

      modules:
        [];

      requestedAiTier:
        "none";

      effectiveAiTier:
        "none";

      aiUpgradeSuggested:
        false;

      lineItems:
        Stripe.Checkout.SessionCreateParams.LineItem[];

      monthlyTotal:
        number;

      bundleVariant:
        "legacy";

      billingVersion:
        "legacy";
    }
  | {
      billingModel:
        "modular";

      subscriptionTier:
        "modular" | "complete";

      packageType:
        PackageType;

      modules:
        ModuleKey[];

      requestedAiTier:
        AiTierKey;

      effectiveAiTier:
        AiTierKey;

      aiUpgradeSuggested:
        boolean;

      lineItems:
        Stripe.Checkout.SessionCreateParams.LineItem[];

      monthlyTotal:
        number;

      bundleVariant:
        ModularBundle;

      billingVersion:
        "v2";
    };

// ======================================================
// TRIAL
// ======================================================

const TRIAL_DAYS =
  14;

// ======================================================
// MAIN MODULES
// ======================================================

const MAIN_MODULE_KEYS:
  ModuleKey[] = [
    "core",
    "clientsProjects",
    "finance",
    "social",
    "email",
    "store",
  ];

// ======================================================
// COMPLETE PRICE
// ======================================================

const COMPLETE_PRICE =
  BILLING_PRODUCTS
    .complete
    .amount;

// ======================================================
// AI PRODUCT MAPPING
// ======================================================

const AI_PRODUCT_KEYS: Record<
  Exclude<
    AiTierKey,
    "none"
  >,
  BillingProductKey
> = {
  starter:
    "aiStarter",

  plus:
    "aiPlus",

  pro:
    "aiPro",
};

// ======================================================
// NORMALISE EMAIL
// ======================================================

function normaliseEmail(
  value: unknown,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase();
}

// ======================================================
// PASSWORD ENCRYPTION
// ======================================================

function encryptPassword(
  password: string,
) {
  const iv =
    crypto.randomBytes(
      16,
    );

  const key =
    crypto
      .createHash(
        "sha256",
      )
      .update(
        registrationEncryptionKey,
      )
      .digest();

  const cipher =
    crypto.createCipheriv(
      "aes-256-cbc",
      key,
      iv,
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        password,
        "utf8",
      ),

      cipher.final(),
    ]);

  return `${iv.toString(
    "hex",
  )}:${encrypted.toString(
    "hex",
  )}`;
}

// ======================================================
// MODULE VALIDATION
// ======================================================

function normaliseModules(
  value: unknown,
): ModuleKey[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  const valid =
    value
      .map(
        (item) =>
          String(
            item || "",
          ).trim(),
      )
      .filter(
        (
          item,
        ): item is ModuleKey =>
          MAIN_MODULE_KEYS.includes(
            item as ModuleKey,
          ),
      );

  return Array.from(
    new Set(
      valid,
    ),
  );
}

// ======================================================
// AI VALIDATION
// ======================================================

function normaliseAiTier(
  value: unknown,
): AiTierKey {
  const aiTier =
    String(
      value || "none",
    )
      .trim()
      .toLowerCase();

  if (
    aiTier ===
      "starter" ||
    aiTier ===
      "plus" ||
    aiTier ===
      "pro"
  ) {
    return aiTier;
  }

  return "none";
}

// ======================================================
// PACKAGE VALIDATION
// ======================================================

function normalisePackage(
  value: unknown,
): PackageType {
  const packageType =
    String(
      value || "modular",
    )
      .trim()
      .toLowerCase();

  if (
    packageType ===
    "complete"
  ) {
    return "complete";
  }

  return "modular";
}

// ======================================================
// V2 STRIPE LOOKUP KEYS
// ======================================================

function buildProductLookupKey(
  billingKey: string,
) {
  return `tots_v2_${billingKey}_monthly`;
}

function buildBundleLookupKey(
  moduleCount: number,
) {
  return `tots_v2_bundle_${moduleCount}_monthly`;
}

// ======================================================
// GET STRIPE PRICE
// ======================================================

async function getStripePriceByLookupKey(
  lookupKey: string,
) {
  const prices =
    await stripe.prices.list(
      {
        lookup_keys: [
          lookupKey,
        ],

        active:
          true,

        limit:
          10,
      },
    );

  const price =
    prices.data[0];

  if (
    !price
  ) {
    throw new Error(
      `Stripe price not found for ${lookupKey}. Run the TOTS-OS v2 Stripe sync first.`,
    );
  }

  return price;
}

// ======================================================
// GET NORMAL PRODUCT PRICE
// ======================================================

async function getProductPrice(
  billingKey:
    BillingProductKey,
) {
  return getStripePriceByLookupKey(
    buildProductLookupKey(
      billingKey,
    ),
  );
}

// ======================================================
// GET MODULE BUNDLE PRICE
// ======================================================

async function getModuleBundleStripePrice(
  moduleCount: number,
) {
  if (
    moduleCount < 2 ||
    moduleCount > 5
  ) {
    throw new Error(
      `Invalid module bundle size: ${moduleCount}`,
    );
  }

  return getStripePriceByLookupKey(
    buildBundleLookupKey(
      moduleCount,
    ),
  );
}

// ======================================================
// GET FIXED MODULE TOTAL
// ======================================================

function getModuleBundleAmount(
  moduleCount: number,
) {
  if (
    moduleCount <= 0
  ) {
    return 0;
  }

  if (
    moduleCount >= 6
  ) {
    return COMPLETE_PRICE;
  }

  return MODULE_BUNDLE_PRICES[
    moduleCount as
      | 1
      | 2
      | 3
      | 4
      | 5
  ];
}

// ======================================================
// GET BUNDLE NAME
// ======================================================

function getBundleVariant(
  moduleCount: number,
): ModularBundle {
  if (
    moduleCount >= 6
  ) {
    return "complete";
  }

  if (
    moduleCount === 5
  ) {
    return "bundle_5";
  }

  if (
    moduleCount === 4
  ) {
    return "bundle_4";
  }

  if (
    moduleCount === 3
  ) {
    return "bundle_3";
  }

  if (
    moduleCount === 2
  ) {
    return "bundle_2";
  }

  return "single";
}

// ======================================================
// AI AMOUNT
// ======================================================

function getAiAmount(
  aiTier:
    AiTierKey,
) {
  if (
    aiTier ===
    "none"
  ) {
    return 0;
  }

  const productKey =
    AI_PRODUCT_KEYS[
      aiTier
    ];

  return BILLING_PRODUCTS[
    productKey
  ].amount;
}

// ======================================================
// LEGACY PLAN RESOLUTION
// ======================================================

function resolveLegacyPlan(
  rawTier: unknown,
): {
  tier:
    LegacySubscriptionTier;

  priceId:
    string;
} {
  const tier =
    String(
      rawTier || "",
    )
      .trim()
      .toLowerCase();

  if (
    tier ===
    "standard"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_STANDARD;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_STANDARD is missing.",
      );
    }

    return {
      tier:
        "standard",

      priceId,
    };
  }

  if (
    tier ===
    "professional"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_PROFESSIONAL;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_PROFESSIONAL is missing.",
      );
    }

    return {
      tier:
        "professional",

      priceId,
    };
  }

  if (
    tier ===
    "elite"
  ) {
    const priceId =
      process.env
        .STRIPE_PRICE_ELITE;

    if (
      !priceId
    ) {
      throw new Error(
        "STRIPE_PRICE_ELITE is missing.",
      );
    }

    return {
      tier:
        "elite",

      priceId,
    };
  }

  throw new Error(
    "Invalid legacy subscription tier.",
  );
}

// ======================================================
// CHECK IF REQUEST IS LEGACY
// ======================================================

function isLegacyRequest(
  body: Record<
    string,
    unknown
  >,
) {
  const rawTier =
    String(
      body.tier || "",
    )
      .trim()
      .toLowerCase();

  const isLegacyTier =
    rawTier ===
      "standard" ||
    rawTier ===
      "professional" ||
    rawTier ===
      "elite";

  const hasModularSelection =
    Array.isArray(
      body.modules,
    ) ||
    body.package != null ||
    body.aiTier != null ||
    body.ai != null ||
    body.billingModel ===
      "modular";

  return (
    isLegacyTier &&
    !hasModularSelection
  );
}

// ======================================================
// RESOLVE LEGACY SELECTION
// ======================================================

async function resolveLegacySelection(
  body: Record<
    string,
    unknown
  >,
): Promise<BillingSelection> {
  const {
    tier,
    priceId,
  } =
    resolveLegacyPlan(
      body.tier,
    );

  const price =
    await stripe.prices.retrieve(
      priceId,
    );

  return {
    billingModel:
      "legacy_tier",

    subscriptionTier:
      tier,

    packageType:
      "legacy",

    modules:
      [],

    requestedAiTier:
      "none",

    effectiveAiTier:
      "none",

    aiUpgradeSuggested:
      false,

    lineItems: [
      {
        price:
          priceId,

        quantity:
          1,
      },
    ],

    monthlyTotal:
      price.unit_amount ??
      0,

    bundleVariant:
      "legacy",

    billingVersion:
      "legacy",
  };
}

// ======================================================
// COMPLETE SELECTION
// ======================================================

async function resolveCompleteSelection(
  requestedAiTier:
    AiTierKey,
): Promise<BillingSelection> {
  const completePrice =
    await getProductPrice(
      "complete",
    );

  return {
    billingModel:
      "modular",

    subscriptionTier:
      "complete",

    packageType:
      "complete",

    modules:
      [...MAIN_MODULE_KEYS],

    requestedAiTier,

    // Complete includes Clarity AI Starter.
    effectiveAiTier:
      "starter",

    // Plus or Pro can be offered as an upgrade later.
    aiUpgradeSuggested:
      requestedAiTier ===
        "plus" ||
      requestedAiTier ===
        "pro",

    lineItems: [
      {
        price:
          completePrice.id,

        quantity:
          1,
      },
    ],

    monthlyTotal:
      COMPLETE_PRICE,

    bundleVariant:
      "complete",

    billingVersion:
      "v2",
  };
}

// ======================================================
// RESOLVE MODULAR SELECTION
// ======================================================

async function resolveModularSelection(
  body: Record<
    string,
    unknown
  >,
): Promise<BillingSelection> {
  const requestedModules =
    normaliseModules(
      body.modules,
    );

  const requestedAiTier =
    normaliseAiTier(
      body.aiTier ??
        body.ai,
    );

  const requestedPackage =
    normalisePackage(
      body.package,
    );

  // ==================================================
  // EXPLICIT COMPLETE
  // ==================================================

  if (
    requestedPackage ===
    "complete"
  ) {
    return resolveCompleteSelection(
      requestedAiTier,
    );
  }

  // ==================================================
  // MUST SELECT AT LEAST ONE MODULE
  // ==================================================

  if (
    requestedModules.length ===
    0
  ) {
    throw new Error(
      "Please select at least one TOTS-OS module.",
    );
  }

  const moduleCount =
    requestedModules.length;

  // ==================================================
  // SIX MODULES = COMPLETE
  // ==================================================

  if (
    moduleCount ===
    MAIN_MODULE_KEYS.length
  ) {
    return resolveCompleteSelection(
      requestedAiTier,
    );
  }

  // ==================================================
  // FIXED MODULE BUNDLE TOTAL
  // ==================================================

  const moduleTotal =
    getModuleBundleAmount(
      moduleCount,
    );

  // ==================================================
  // OPTIONAL AI ADD-ON
  // ==================================================

  const aiTotal =
    getAiAmount(
      requestedAiTier,
    );

  const monthlyTotal =
    moduleTotal +
    aiTotal;

  // ==================================================
  // STRIPE MODULE LINE ITEM
  // ==================================================

  const moduleLineItems:
    Stripe.Checkout.SessionCreateParams.LineItem[] =
    [];

  // ==================================================
  // SINGLE MODULE
  // ==================================================

  if (
    moduleCount ===
    1
  ) {
    const moduleKey =
      requestedModules[0];

    if (
      !moduleKey
    ) {
      throw new Error(
        "Unable to resolve selected module.",
      );
    }

    const modulePrice =
      await getProductPrice(
        moduleKey,
      );

    moduleLineItems.push(
      {
        price:
          modulePrice.id,

        quantity:
          1,
      },
    );
  }

  // ==================================================
  // 2–5 MODULE FIXED BUNDLE
  // ==================================================

  if (
    moduleCount >= 2 &&
    moduleCount <= 5
  ) {
    const bundlePrice =
      await getModuleBundleStripePrice(
        moduleCount,
      );

    moduleLineItems.push(
      {
        price:
          bundlePrice.id,

        quantity:
          1,
      },
    );
  }

  // ==================================================
  // AI LINE ITEM
  // ==================================================

  const lineItems =
    [...moduleLineItems];

  if (
    requestedAiTier !==
    "none"
  ) {
    const aiProductKey =
      AI_PRODUCT_KEYS[
        requestedAiTier
      ];

    const aiPrice =
      await getProductPrice(
        aiProductKey,
      );

    lineItems.push(
      {
        price:
          aiPrice.id,

        quantity:
          1,
      },
    );
  }

  return {
    billingModel:
      "modular",

    subscriptionTier:
      "modular",

    packageType:
      "modular",

    modules:
      requestedModules,

    requestedAiTier,

    effectiveAiTier:
      requestedAiTier,

    aiUpgradeSuggested:
      false,

    lineItems,

    monthlyTotal,

    bundleVariant:
      getBundleVariant(
        moduleCount,
      ),

    billingVersion:
      "v2",
  };
}

// ======================================================
// RESOLVE BILLING SELECTION
// ======================================================

async function resolveBillingSelection(
  body: Record<
    string,
    unknown
  >,
): Promise<BillingSelection> {
  if (
    isLegacyRequest(
      body,
    )
  ) {
    return resolveLegacySelection(
      body,
    );
  }

  return resolveModularSelection(
    body,
  );
}

// ======================================================
// POST
// ======================================================

export async function POST(
  request:
    NextRequest,
) {
  try {
    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body =
      (
        await request.json()
      ) as Record<
        string,
        unknown
      >;

    const email =
      normaliseEmail(
        body.email,
      );

    const password =
      String(
        body.password ||
          "",
      );

    const fullName =
      String(
        body.fullName ||
          "",
      ).trim();

    const companyName =
      String(
        body.companyName ||
          "",
      ).trim();

    const jobTitle =
      body.jobTitle
        ? String(
            body.jobTitle,
          ).trim()
        : null;

    // ==================================================
    // REQUIRED FIELDS
    // ==================================================

    if (
      !email ||
      !password ||
      !fullName ||
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required registration details.",
        },
        {
          status:
            400,
        },
      );
    }

    // ==================================================
    // EMAIL VALIDATION
    // ==================================================

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
      );

    if (
      !emailIsValid
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status:
            400,
        },
      );
    }

    // ==================================================
    // PASSWORD VALIDATION
    // ==================================================

    if (
      password.length <
      8
    ) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        {
          status:
            400,
        },
      );
    }

    // ==================================================
    // SERVER-SIDE BILLING RESOLUTION
    // ==================================================

    const selection =
      await resolveBillingSelection(
        body,
      );

    // ==================================================
    // REMOVE OLD INCOMPLETE REGISTRATION
    // ==================================================

    const {
      data:
        existingPending,

      error:
        existingPendingError,
    } =
      await supabase
        .from(
          "pending_registrations",
        )
        .select(
          "id",
        )
        .eq(
          "email",
          email,
        )
        .eq(
          "completed",
          false,
        )
        .maybeSingle();

    if (
      existingPendingError
    ) {
      console.error(
        "Pending registration lookup error:",
        existingPendingError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check registration details.",
        },
        {
          status:
            500,
        },
      );
    }

    if (
      existingPending
    ) {
      const {
        error:
          deletePendingError,
      } =
        await supabase
          .from(
            "pending_registrations",
          )
          .delete()
          .eq(
            "id",
            existingPending.id,
          );

      if (
        deletePendingError
      ) {
        console.error(
          "Could not remove previous pending registration:",
          deletePendingError,
        );

        return NextResponse.json(
          {
            error:
              "Unable to reset previous registration attempt.",
          },
          {
            status:
              500,
          },
        );
      }
    }

    // ==================================================
    // ENCRYPT PASSWORD
    // ==================================================

    const encryptedPassword =
      encryptPassword(
        password,
      );

    // ==================================================
    // CREATE PENDING REGISTRATION
    // ==================================================
    //
    // IMPORTANT:
    //
    // subscription_tier remains ONLY for legacy plans.
    //
    // Modular registrations use the new billing fields.
    //
    // ==================================================

    const {
      data:
        pendingRegistration,

      error:
        registrationError,
    } =
      await supabase
        .from(
          "pending_registrations",
        )
        .insert({
          email,

          encrypted_password:
            encryptedPassword,

          full_name:
            fullName,

          company_name:
            companyName,

          job_title:
            jobTitle,

          // ============================================
          // LEGACY COMPATIBILITY
          // ============================================

          subscription_tier:
            selection.billingModel ===
            "legacy_tier"
              ? selection.subscriptionTier
              : null,

          // ============================================
          // BILLING V2
          // ============================================

          billing_model:
            selection
              .billingModel,

          billing_package:
            selection
              .packageType,

          selected_modules:
            selection
              .modules,

          requested_ai_tier:
            selection
              .requestedAiTier,

          effective_ai_tier:
            selection
              .effectiveAiTier,

          monthly_total_pence:
            selection
              .monthlyTotal,

          billing_version:
            selection
              .billingVersion,

          completed:
            false,
        })
        .select(
          "id",
        )
        .single();

    if (
      registrationError ||
      !pendingRegistration
    ) {
      console.error(
        "Pending registration error:",
        registrationError,
      );

      return NextResponse.json(
        {
          error:
            registrationError
              ?.message ||
            "Unable to save registration details.",
        },
        {
          status:
            500,
        },
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
        "NEXT_PUBLIC_APP_URL is missing.",
      );
    }

    // ==================================================
    // METADATA
    // ==================================================

    const modulesMetadata =
      selection.modules.length >
      0
        ? selection.modules.join(
            ",",
          )
        : "";

    const metadata: Record<
      string,
      string
    > = {
      registration_id:
        pendingRegistration.id,

      // Stripe metadata may safely use modular / complete.
      // We simply avoid storing those values in the old
      // database subscription_tier column.
      subscription_tier:
        selection
          .subscriptionTier,

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

      trial_days:
        String(
          TRIAL_DAYS,
        ),

      registration_type:
        "free_trial",
    };

    // ==================================================
    // CREATE STRIPE CHECKOUT SESSION
    // ==================================================

    const session =
      await stripe
        .checkout
        .sessions
        .create({
          mode:
            "subscription",

          allow_promotion_codes:
            true,

          // ============================================
          // FREE TRIAL CAN START WITHOUT CARD
          // ============================================

          payment_method_collection:
            "if_required",

          // ============================================
          // TRUSTED SERVER-GENERATED PRICES
          // ============================================

          line_items:
            selection
              .lineItems,

          // ============================================
          // CUSTOMER
          // ============================================

          customer_email:
            email,

          billing_address_collection:
            "required",

          // ============================================
          // REDIRECTS
          // ============================================

          success_url:
            `${appUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${appUrl}/billing?cancelled=true`,

          // ============================================
          // CHECKOUT METADATA
          // ============================================

          metadata,

          // ============================================
          // SUBSCRIPTION
          // ============================================

          subscription_data: {
            trial_period_days:
              TRIAL_DAYS,

            trial_settings: {
              end_behavior: {
                missing_payment_method:
                  "pause",
              },
            },

            metadata,
          },
        });

    // ==================================================
    // CHECK URL
    // ==================================================

    if (
      !session.url
    ) {
      throw new Error(
        "Stripe did not return a checkout URL.",
      );
    }

    // ==================================================
    // SAVE STRIPE SESSION
    // ==================================================

    const {
      error:
        sessionUpdateError,
    } =
      await supabase
        .from(
          "pending_registrations",
        )
        .update({
          stripe_session_id:
            session.id,

          completed:
            false,
        })
        .eq(
          "id",
          pendingRegistration.id,
        );

    if (
      sessionUpdateError
    ) {
      console.error(
        "Failed to save Stripe session:",
        sessionUpdateError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to link trial session.",
        },
        {
          status:
            500,
        },
      );
    }

    // ==================================================
    // LOG
    // ==================================================

    console.log(
      "Stripe checkout session created:",
      {
        sessionId:
          session.id,

        registrationId:
          pendingRegistration.id,

        billingModel:
          selection
            .billingModel,

        billingVersion:
          selection
            .billingVersion,

        packageType:
          selection
            .packageType,

        subscriptionTier:
          selection
            .subscriptionTier,

        modules:
          selection.modules,

        requestedAiTier:
          selection
            .requestedAiTier,

        effectiveAiTier:
          selection
            .effectiveAiTier,

        bundleVariant:
          selection
            .bundleVariant,

        monthlyTotal:
          selection
            .monthlyTotal,

        trialDays:
          TRIAL_DAYS,

        paymentRequiredToday:
          false,
      },
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        url:
          session.url,

        sessionId:
          session.id,

        billingModel:
          selection
            .billingModel,

        billingVersion:
          selection
            .billingVersion,

        package:
          selection
            .packageType,

        subscriptionTier:
          selection
            .subscriptionTier,

        modules:
          selection.modules,

        requestedAiTier:
          selection
            .requestedAiTier,

        effectiveAiTier:
          selection
            .effectiveAiTier,

        aiUpgradeSuggested:
          selection
            .aiUpgradeSuggested,

        bundleVariant:
          selection
            .bundleVariant,

        monthlyTotal:
          selection
            .monthlyTotal,

        monthlyTotalFormatted:
          `£${(
            selection
              .monthlyTotal /
            100
          ).toFixed(
            2,
          )}`,

        trialDays:
          TRIAL_DAYS,

        paymentRequiredToday:
          false,
      },
    );
  } catch (
    error
  ) {
    console.error(
      "Checkout session error:",
      error,
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
      },
    );
  }
}