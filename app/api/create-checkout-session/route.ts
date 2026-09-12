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
  type BillingProductKey,
} from "@/lib/billing-config";

export const runtime =
  "nodejs";

// ======================================================
// STRIPE
// ======================================================

const stripe =
  new Stripe(
    process.env
      .STRIPE_SECRET_KEY!,
    {
      apiVersion:
        "2025-02-24.acacia",
    },
  );

// ======================================================
// SUPABASE ADMIN
// ======================================================

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!,
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

type PriceVariant =
  | "standard"
  | "bundle_10"
  | "bundle_20";

type PackageType =
  | "modular"
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
        PriceVariant | "complete";
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
// AI KEY MAPPING
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
// BUILD STRIPE LOOKUP KEY
// ======================================================

function buildLookupKey(
  billingKey: string,
  variant: PriceVariant,
) {
  return `tots_${billingKey}_monthly_${variant}`;
}

// ======================================================
// GET STRIPE PRICE FROM LOOKUP KEY
// ======================================================

async function getStripePrice(
  billingKey: BillingProductKey,
  variant: PriceVariant =
    "standard",
) {
  const lookupKey =
    buildLookupKey(
      billingKey,
      variant,
    );

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

  if (!price) {
    throw new Error(
      `Stripe price not found for ${billingKey} (${variant}). Run the Stripe billing sync first.`,
    );
  }

  return price;
}

// ======================================================
// BUNDLE VARIANT
// ======================================================

function getBundleVariant(
  moduleCount: number,
): PriceVariant {
  if (
    moduleCount === 5
  ) {
    return "bundle_20";
  }

  if (
    moduleCount === 3 ||
    moduleCount === 4
  ) {
    return "bundle_10";
  }

  return "standard";
}

// ======================================================
// DISCOUNTED MODULE AMOUNT
// ======================================================

function getModuleAmount(
  moduleKey: ModuleKey,
  variant: PriceVariant,
) {
  const standardAmount =
    BILLING_PRODUCTS[
      moduleKey
    ].amount;

  if (
    variant ===
    "bundle_10"
  ) {
    return Math.round(
      standardAmount *
        0.9,
    );
  }

  if (
    variant ===
    "bundle_20"
  ) {
    return Math.round(
      standardAmount *
        0.8,
    );
  }

  return standardAmount;
}

// ======================================================
// AI AMOUNT
// ======================================================

function getAiAmount(
  aiTier: AiTierKey,
) {
  if (
    aiTier ===
    "none"
  ) {
    return 0;
  }

  const key =
    AI_PRODUCT_KEYS[
      aiTier
    ];

  return BILLING_PRODUCTS[
    key
  ].amount;
}

// ======================================================
// LEGACY PLAN RESOLUTION
// ======================================================

function resolveLegacyPlan(
  rawTier: unknown,
): {
  tier: LegacySubscriptionTier;
  priceId: string;
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
  // COMPLETE WAS EXPLICITLY SELECTED
  // ==================================================

  if (
    requestedPackage ===
    "complete"
  ) {
    const completePrice =
      await getStripePrice(
        "complete",
        "standard",
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

      effectiveAiTier:
        "starter",

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
    };
  }

  // ==================================================
  // MUST HAVE AT LEAST ONE MAIN MODULE
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

  const bundleVariant =
    getBundleVariant(
      moduleCount,
    );

  // ==================================================
  // CALCULATE MODULE TOTAL
  // ==================================================

  const discountedModuleTotal =
    requestedModules.reduce(
      (
        total,
        moduleKey,
      ) =>
        total +
        getModuleAmount(
          moduleKey,
          bundleVariant,
        ),
      0,
    );

  // ==================================================
  // CALCULATE AI TOTAL
  // ==================================================

  const requestedAiAmount =
    getAiAmount(
      requestedAiTier,
    );

  const modularTotal =
    discountedModuleTotal +
    requestedAiAmount;

  // ==================================================
  // COMPLETE RULE
  //
  // Complete is used when:
  //
  // - all 6 modules are selected
  // - OR modular selection reaches £199
  // ==================================================

  const shouldUseComplete =
    moduleCount ===
      MAIN_MODULE_KEYS.length ||
    modularTotal >=
      COMPLETE_PRICE;

  if (
    shouldUseComplete
  ) {
    const completePrice =
      await getStripePrice(
        "complete",
        "standard",
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

      effectiveAiTier:
        "starter",

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
    };
  }

  // ==================================================
  // BUILD MODULE LINE ITEMS
  // ==================================================

  const moduleLineItems:
    Stripe.Checkout.SessionCreateParams.LineItem[] =
    [];

  for (
    const moduleKey of requestedModules
  ) {
    const price =
      await getStripePrice(
        moduleKey,
        bundleVariant,
      );

    moduleLineItems.push(
      {
        price:
          price.id,

        quantity:
          1,
      },
    );
  }

  // ==================================================
  // ADD AI LINE ITEM
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
      await getStripePrice(
        aiProductKey,
        "standard",
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

    monthlyTotal:
      modularTotal,

    bundleVariant,
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
  request: NextRequest,
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
    // VALIDATE REQUIRED FIELDS
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
    // VALIDATE EMAIL
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
    // VALIDATE PASSWORD
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
    // RESOLVE TRUSTED SERVER-SIDE BILLING
    // ==================================================

    /*
     * IMPORTANT:
     *
     * The browser NEVER sends a trusted Stripe Price ID.
     *
     * It only sends:
     *
     * package
     * modules
     * aiTier
     *
     * The server decides:
     *
     * - bundle discount
     * - Complete threshold
     * - Stripe lookup keys
     * - actual Stripe Price IDs
     */

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

    // ==================================================
    // DELETE OLD PENDING REGISTRATION
    // ==================================================

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

    /*
     * We keep using subscription_tier for compatibility
     * with your existing database for now.
     *
     * New registrations will contain:
     *
     * modular
     * complete
     *
     * Legacy registrations can still contain:
     *
     * standard
     * professional
     * elite
     *
     * The actual module selection is also placed into
     * Stripe Checkout + Subscription metadata below.
     */

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

          subscription_tier:
            selection
              .subscriptionTier,

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
          // ============================================
          // SUBSCRIPTION
          // ============================================

          mode:
            "subscription",

          // ============================================
          // PROMO CODES
          // ============================================

          allow_promotion_codes:
            true,

          // ============================================
          // NO CARD REQUIRED TO START TRIAL
          // ============================================

          payment_method_collection:
            "if_required",

          // ============================================
          // TRUSTED SERVER-GENERATED LINE ITEMS
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
          // SUBSCRIPTION CONFIG
          // ============================================

          subscription_data: {
            // ==========================================
            // 14-DAY FREE TRIAL
            // ==========================================

            trial_period_days:
              TRIAL_DAYS,

            // ==========================================
            // IF NO CARD IS ADDED BY DAY 14
            // ==========================================

            trial_settings: {
              end_behavior: {
                missing_payment_method:
                  "pause",
              },
            },

            // ==========================================
            // COPY BILLING METADATA TO SUBSCRIPTION
            // ==========================================

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
      "Stripe trial checkout session created:",
      {
        sessionId:
          session.id,

        registrationId:
          pendingRegistration.id,

        billingModel:
          selection
            .billingModel,

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