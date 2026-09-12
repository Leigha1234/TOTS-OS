import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  headers,
} from "next/headers";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  completeRegistration,
} from "@/lib/auth/completeRegistration";

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

const stripeWebhookSecret =
  process.env
    .STRIPE_WEBHOOK_SECRET;

const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

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
    "STRIPE_SECRET_KEY is missing",
  );
}

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

// ============================================================
// CLIENTS
// ============================================================

const stripe =
  new Stripe(
    stripeSecretKey,
    {
      apiVersion:
        "2025-02-24.acacia",
    },
  );

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

type StripeSubscriptionLike =
  Stripe.Subscription & {
    current_period_end?:
      number;

    current_period_start?:
      number;

    items:
      Stripe.ApiList<
        Stripe.SubscriptionItem
      >;
  };

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
// MODULE NORMALISATION
// ============================================================

function normaliseModules(
  value:
    unknown,
): ModuleKey[] {
  let rawValues:
    unknown[] = [];

  if (
    Array.isArray(
      value,
    )
  ) {
    rawValues =
      value;
  } else if (
    typeof value ===
    "string"
  ) {
    rawValues =
      value
        .split(",")
        .map(
          (item) =>
            item.trim(),
        );
  }

  const valid =
    rawValues
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

// ============================================================
// AI NORMALISATION
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
// HISTORICAL STORE ADD-ON
// ============================================================
//
// The old standalone Store subscription no longer controls
// access.
//
// We still recognise old Stripe objects so they can be safely
// ignored instead of being mistaken for a normal TOTS-OS
// subscription.
//
// IMPORTANT:
// An old Stripe subscription may still need cancelling manually
// in Stripe. Ignoring it here does NOT cancel billing.
// ============================================================

function isHistoricalStoreAddon(
  metadata:
    Stripe.Metadata |
    null |
    undefined,
) {
  return (
    cleanString(
      metadata
        ?.subscription_type,
    ) ===
    "store_addon"
  );
}

// ============================================================
// EXISTING ACCOUNT SUBSCRIPTION
// ============================================================

function isExistingAccountMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined,
) {
  return (
    cleanString(
      metadata
        ?.checkout_type,
    ) ===
    "existing_account"
  );
}

// ============================================================
// REGISTRATION METADATA
// ============================================================

function isRegistrationMetadata(
  metadata:
    Stripe.Metadata |
    null |
    undefined,
) {
  return Boolean(
    cleanString(
      metadata
        ?.registration_id,
    ),
  );
}

// ============================================================
// ACCESS ENABLED
// ============================================================

function totsAccessEnabled(
  status:
    Stripe.Subscription.Status,
) {
  return (
    status ===
      "active" ||
    status ===
      "trialing"
  );
}

// ============================================================
// MAP STRIPE STATUS
// ============================================================

function mapTotsSubscriptionStatus(
  status:
    Stripe.Subscription.Status,
):
  | "active"
  | "cancelled"
  | "expired" {
  if (
    status ===
      "active" ||
    status ===
      "trialing"
  ) {
    return "active";
  }

  if (
    status ===
    "canceled"
  ) {
    return "cancelled";
  }

  return "expired";
}

// ============================================================
// SUBSCRIPTION CUSTOMER ID
// ============================================================

function getSubscriptionCustomerId(
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
// CURRENT PERIOD END
// ============================================================

function getCurrentPeriodEnd(
  subscription:
    Stripe.Subscription,
) {
  const typed =
    subscription as
      StripeSubscriptionLike;

  const rootPeriodEnd =
    typed
      .current_period_end;

  if (
    typeof rootPeriodEnd ===
      "number" &&
    rootPeriodEnd >
      0
  ) {
    return new Date(
      rootPeriodEnd *
        1000,
    ).toISOString();
  }

  const item =
    typed
      .items
      ?.data?.[0] as
      | (
          Stripe.SubscriptionItem & {
            current_period_end?:
              number;
          }
        )
      | undefined;

  if (
    typeof item
      ?.current_period_end ===
    "number"
  ) {
    return new Date(
      item
        .current_period_end *
        1000,
    ).toISOString();
  }

  return null;
}

// ============================================================
// SYNC ALL EXISTING MODULAR MODULE ROW STATUSES
// ============================================================
//
// This is used when the overall Stripe subscription changes
// state.
//
// Example:
//
// trialing → active
// active → past_due
// active → canceled
//
// It does NOT decide which modules were purchased.
// It only changes the status of module rows which already exist.
// ============================================================

async function syncOrganisationModuleStatuses(
  organisationId:
    string,

  enabled:
    boolean,
) {
  const now =
    new Date()
      .toISOString();

  if (
    enabled
  ) {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "organisation_modules",
        )
        .update({
          status:
            "active",

          cancelled_at:
            null,

          updated_at:
            now,
        })
        .eq(
          "organisation_id",
          organisationId,
        );

    if (
      error
    ) {
      throw error;
    }

    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
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
      .eq(
        "organisation_id",
        organisationId,
      );

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// STORE COMPATIBILITY FLAG
// ============================================================
//
// organisation_modules is now authoritative.
//
// store_enabled is maintained only as a compatibility field for
// any older Store code which has not yet been migrated.
// ============================================================

async function syncStoreCompatibilityFlag(
  organisationId:
    string,

  accountHasAccess:
    boolean,
) {
  const {
    data:
      storeModule,

    error:
      storeModuleError,
  } =
    await supabaseAdmin
      .from(
        "organisation_modules",
      )
      .select(
        "id",
      )
      .eq(
        "organisation_id",
        organisationId,
      )
      .eq(
        "module_key",
        "store",
      )
      .eq(
        "status",
        "active",
      )
      .maybeSingle();

  if (
    storeModuleError
  ) {
    throw storeModuleError;
  }

  const {
    error:
      organisationError,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update({
        store_enabled:
          Boolean(
            accountHasAccess &&
            storeModule,
          ),
      })
      .eq(
        "id",
        organisationId,
      );

  if (
    organisationError
  ) {
    throw organisationError;
  }
}

// ============================================================
// FIND REGISTERED TOTS SUBSCRIPTION
// ============================================================

async function findTotsSubscriptionRecord(
  stripeSubscriptionId:
    string,
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "subscriptions",
      )
      .select(
        `
          id,
          organisation_id,
          stripe_subscription_id
        `,
      )
      .eq(
        "stripe_subscription_id",
        stripeSubscriptionId,
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// SYNC REGISTERED TOTS SUBSCRIPTION
// ============================================================
//
// Used for subscriptions belonging to users who registered
// through the public signup flow.
//
// completeRegistration() creates the organisation and links
// the Stripe subscription into public.subscriptions.
// ============================================================

async function syncRegisteredTotsSubscription(
  subscription:
    Stripe.Subscription,
) {
  // ==========================================================
  // NEVER LET OLD STORE ADD-ON EVENTS MODIFY NEW ENTITLEMENTS
  // ==========================================================

  if (
    isHistoricalStoreAddon(
      subscription.metadata,
    )
  ) {
    console.log(
      "[STRIPE WEBHOOK] Ignoring historical Store add-on subscription:",
      subscription.id,
    );

    return;
  }

  const subscriptionRecord =
    await findTotsSubscriptionRecord(
      subscription.id,
    );

  // ==========================================================
  // CREATED EVENT MAY ARRIVE BEFORE CHECKOUT COMPLETION
  // ==========================================================

  if (
    !subscriptionRecord
      ?.organisation_id
  ) {
    console.log(
      "[TOTS SUBSCRIPTION] Subscription is not linked to an organisation yet:",
      {
        subscriptionId:
          subscription.id,

        status:
          subscription.status,
      },
    );

    return;
  }

  const organisationId =
    subscriptionRecord
      .organisation_id;

  const hasAccess =
    totsAccessEnabled(
      subscription.status,
    );

  const mappedStatus =
    mapTotsSubscriptionStatus(
      subscription.status,
    );

  // ==========================================================
  // LOAD ORGANISATION
  // ==========================================================

  const {
    data:
      organisation,

    error:
      organisationLookupError,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .select(
        `
          id,
          billing_model,
          billing_package,
          store_enabled
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
    throw organisationLookupError;
  }

  if (
    !organisation
  ) {
    console.warn(
      `[TOTS SUBSCRIPTION] Organisation ${organisationId} could not be found.`,
    );

    return;
  }

  // ==========================================================
  // ORGANISATION STATUS
  // ==========================================================

  const {
    error:
      organisationUpdateError,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update({
        subscription_status:
          mappedStatus,

        access_status:
          hasAccess
            ? "active"
            : "restricted",
      })
      .eq(
        "id",
        organisationId,
      );

  if (
    organisationUpdateError
  ) {
    throw organisationUpdateError;
  }

  // ==========================================================
  // MODULAR MODULE STATUS
  // ==========================================================

  if (
    cleanString(
      organisation
        .billing_model,
    ).toLowerCase() ===
    "modular"
  ) {
    await syncOrganisationModuleStatuses(
      organisationId,
      hasAccess,
    );

    await syncStoreCompatibilityFlag(
      organisationId,
      hasAccess,
    );
  }

  // ==========================================================
  // SUBSCRIPTIONS TABLE
  // ==========================================================

  const {
    error:
      subscriptionUpdateError,
  } =
    await supabaseAdmin
      .from(
        "subscriptions",
      )
      .update({
        active:
          hasAccess,

        status:
          mappedStatus,
      })
      .eq(
        "id",
        subscriptionRecord.id,
      );

  if (
    subscriptionUpdateError
  ) {
    throw subscriptionUpdateError;
  }

  console.log(
    "[TOTS SUBSCRIPTION] Registered subscription synced:",
    {
      organisationId,

      subscriptionId:
        subscription.id,

      stripeStatus:
        subscription.status,

      totsStatus:
        mappedStatus,

      access:
        hasAccess
          ? "active"
          : "restricted",

      billingModel:
        organisation
          .billing_model,

      currentPeriodEnd:
        getCurrentPeriodEnd(
          subscription,
        ),
    },
  );
}

// ============================================================
// UPSERT EXISTING ACCOUNT MODULE SELECTION
// ============================================================

async function syncExistingAccountModules({
  organisationId,
  modules,
  hasAccess,
}: {
  organisationId:
    string;

  modules:
    ModuleKey[];

  hasAccess:
    boolean;
}) {
  const now =
    new Date()
      .toISOString();

  // ==========================================================
  // LOAD CURRENT ROWS
  // ==========================================================

  const {
    data:
      existingModules,

    error:
      existingModulesError,
  } =
    await supabaseAdmin
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
        organisationId,
      );

  if (
    existingModulesError
  ) {
    throw existingModulesError;
  }

  // ==========================================================
  // CANCEL MODULES WHICH ARE NO LONGER SELECTED
  // ==========================================================

  const idsToCancel =
    (
      existingModules ||
      []
    )
      .filter(
        (row) =>
          !modules.includes(
            row
              .module_key as
              ModuleKey,
          ),
      )
      .map(
        (row) =>
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
      await supabaseAdmin
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
      throw cancelError;
    }
  }

  // ==========================================================
  // UPSERT SELECTED MODULES
  // ==========================================================

  if (
    modules.length >
    0
  ) {
    const rows =
      modules.map(
        (moduleKey) => ({
          organisation_id:
            organisationId,

          module_key:
            moduleKey,

          status:
            hasAccess
              ? "active"
              : "cancelled",

          cancelled_at:
            hasAccess
              ? null
              : now,

          updated_at:
            now,
        }),
      );

    const {
      error:
        upsertError,
    } =
      await supabaseAdmin
        .from(
          "organisation_modules",
        )
        .upsert(
          rows,
          {
            onConflict:
              "organisation_id,module_key",

            ignoreDuplicates:
              false,
          },
        );

    if (
      upsertError
    ) {
      throw upsertError;
    }
  }

  // ==========================================================
  // STORE COMPATIBILITY
  // ==========================================================

  await syncStoreCompatibilityFlag(
    organisationId,
    hasAccess,
  );
}

// ============================================================
// SYNC EXISTING ACCOUNT SUBSCRIPTION
// ============================================================

async function syncExistingAccountSubscription(
  subscription:
    Stripe.Subscription,
) {
  if (
    !isExistingAccountMetadata(
      subscription.metadata,
    )
  ) {
    return;
  }

  const organisationId =
    cleanString(
      subscription
        .metadata
        ?.organisation_id,
    );

  const userId =
    cleanString(
      subscription
        .metadata
        ?.user_id,
    );

  const subscriptionTier =
    cleanString(
      subscription
        .metadata
        ?.subscription_tier,
    ).toLowerCase();

  const billingModel =
    cleanString(
      subscription
        .metadata
        ?.billing_model,
    ).toLowerCase();

  const billingPackage =
    cleanString(
      subscription
        .metadata
        ?.billing_package,
    ).toLowerCase();

  const billingVersion =
    cleanString(
      subscription
        .metadata
        ?.billing_version,
    ) ||
    (
      billingModel ===
      "modular"
        ? "v2"
        : "legacy"
    );

  const effectiveAiTier =
    normaliseAiTier(
      subscription
        .metadata
        ?.effective_ai_tier,
    );

  let modules =
    normaliseModules(
      subscription
        .metadata
        ?.modules,
    );

  // ==========================================================
  // COMPLETE = ALL MODULES + STARTER AI
  // ==========================================================

  if (
    billingModel ===
      "modular" &&
    billingPackage ===
      "complete"
  ) {
    modules =
      [
        ...MAIN_MODULE_KEYS,
      ];
  }

  const additionalSeatsRaw =
    cleanString(
      subscription
        .metadata
        ?.additional_seats,
    );

  const additionalSeats =
    Math.max(
      0,
      Number(
        additionalSeatsRaw ||
          0,
      ) || 0,
    );

  if (
    !organisationId
  ) {
    throw new Error(
      `Existing account subscription ${subscription.id} is missing organisation_id metadata.`,
    );
  }

  const hasAccess =
    totsAccessEnabled(
      subscription.status,
    );

  const mappedStatus =
    mapTotsSubscriptionStatus(
      subscription.status,
    );

  // ==========================================================
  // ORGANISATION PAYLOAD
  // ==========================================================

  const organisationPayload:
    Record<
      string,
      unknown
    > = {
      subscription_status:
        mappedStatus,

      access_status:
        hasAccess
          ? "active"
          : "restricted",
  };

  // ==========================================================
  // MODULAR
  // ==========================================================

  if (
    billingModel ===
    "modular"
  ) {
    organisationPayload
      .billing_model =
      "modular";

    organisationPayload
      .billing_package =
      billingPackage ===
      "complete"
        ? "complete"
        : "modular";

    organisationPayload
      .clarity_ai_tier =
      billingPackage ===
      "complete"
        ? "starter"
        : effectiveAiTier;

    organisationPayload
      .billing_version =
      billingVersion;
  }

  // ==========================================================
  // LEGACY
  // ==========================================================

  if (
    [
      "standard",
      "professional",
      "elite",
    ].includes(
      subscriptionTier,
    )
  ) {
    organisationPayload
      .billing_model =
      "legacy_tier";

    organisationPayload
      .billing_package =
      "legacy";

    organisationPayload
      .subscription_tier =
      subscriptionTier;

    organisationPayload
      .billing_version =
      billingVersion;
  }

  const {
    error:
      organisationError,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update(
        organisationPayload,
      )
      .eq(
        "id",
        organisationId,
      );

  if (
    organisationError
  ) {
    console.error(
      "[TOTS SUBSCRIPTION] Organisation update failed:",
      organisationError,
    );

    throw organisationError;
  }

  // ==========================================================
  // MODULAR MODULE ENTITLEMENTS
  // ==========================================================

  if (
    billingModel ===
    "modular"
  ) {
    if (
      modules.length ===
      0
    ) {
      console.warn(
        "[TOTS SUBSCRIPTION] Modular existing-account subscription has no module metadata:",
        {
          organisationId,
          subscriptionId:
            subscription.id,
        },
      );
    } else {
      await syncExistingAccountModules({
        organisationId,
        modules,
        hasAccess,
      });
    }
  }

  // ==========================================================
  // PROFILE
  // ==========================================================

  if (
    userId
  ) {
    const profilePayload:
      Record<
        string,
        unknown
      > = {
      team_seats_allocated:
        additionalSeats,
    };

    if (
      [
        "standard",
        "professional",
        "elite",
      ].includes(
        subscriptionTier,
      )
    ) {
      profilePayload
        .subscription_tier =
        subscriptionTier;
    }

    const {
      error:
        profileError,
    } =
      await supabaseAdmin
        .from(
          "profiles",
        )
        .update(
          profilePayload,
        )
        .eq(
          "id",
          userId,
        );

    if (
      profileError
    ) {
      console.error(
        "[TOTS SUBSCRIPTION] Profile update failed:",
        profileError,
      );

      throw profileError;
    }
  }

  // ==========================================================
  // EXISTING SUBSCRIPTIONS TABLE RECORD
  // ==========================================================

  const {
    data:
      existingSubscriptionRow,

    error:
      existingSubscriptionLookupError,
  } =
    await supabaseAdmin
      .from(
        "subscriptions",
      )
      .select(
        "id",
      )
      .eq(
        "stripe_subscription_id",
        subscription.id,
      )
      .maybeSingle();

  if (
    existingSubscriptionLookupError
  ) {
    throw existingSubscriptionLookupError;
  }

  if (
    existingSubscriptionRow
  ) {
    const {
      error:
        subscriptionUpdateError,
    } =
      await supabaseAdmin
        .from(
          "subscriptions",
        )
        .update({
          active:
            hasAccess,

          status:
            mappedStatus,
        })
        .eq(
          "id",
          existingSubscriptionRow.id,
        );

    if (
      subscriptionUpdateError
    ) {
      throw subscriptionUpdateError;
    }
  }

  console.log(
    "[TOTS SUBSCRIPTION] Existing account synced:",
    {
      organisationId,

      userId,

      subscriptionId:
        subscription.id,

      stripeStatus:
        subscription.status,

      totsStatus:
        mappedStatus,

      access:
        hasAccess
          ? "active"
          : "restricted",

      subscriptionTier,

      billingModel,

      billingPackage,

      modules,

      effectiveAiTier:
        billingPackage ===
        "complete"
          ? "starter"
          : effectiveAiTier,

      additionalSeats,
    },
  );
}

// ============================================================
// EXISTING ACCOUNT CHECKOUT COMPLETED
// ============================================================

async function handleExistingAccountCheckout(
  session:
    Stripe.Checkout.Session,
) {
  const organisationId =
    cleanString(
      session
        .metadata
        ?.organisation_id,
    );

  const userId =
    cleanString(
      session
        .metadata
        ?.user_id,
    );

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
    !organisationId
  ) {
    throw new Error(
      "Existing-account checkout is missing organisation_id metadata.",
    );
  }

  if (
    !userId
  ) {
    throw new Error(
      "Existing-account checkout is missing user_id metadata.",
    );
  }

  if (
    !subscriptionId
  ) {
    throw new Error(
      "Existing-account checkout did not contain a Stripe subscription.",
    );
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId,
      );

  await syncExistingAccountSubscription(
    subscription,
  );

  console.log(
    "[TOTS SUBSCRIPTION] Existing account checkout completed:",
    {
      sessionId:
        session.id,

      organisationId,

      userId,

      subscriptionId,
    },
  );
}

// ============================================================
// NEW REGISTRATION CHECKOUT
// ============================================================

async function handleRegistrationCheckout(
  session:
    Stripe.Checkout.Session,
) {
  const registrationId =
    cleanString(
      session
        .metadata
        ?.registration_id,
    );

  if (
    !registrationId
  ) {
    return;
  }

  if (
    !session.metadata
  ) {
    throw new Error(
      "Missing Stripe metadata.",
    );
  }

  const customerEmail =
    session
      .customer_details
      ?.email ||
    session
      .customer_email;

  if (
    !customerEmail
  ) {
    throw new Error(
      "Missing customer email from Stripe session.",
    );
  }

  // ==========================================================
  // TRIAL CHECKOUT STATUS
  // ==========================================================

  const checkoutIsValid =
    session
      .payment_status ===
      "paid" ||
    session
      .payment_status ===
      "no_payment_required";

  if (
    !checkoutIsValid
  ) {
    console.log(
      "[REGISTRATION] Checkout completed but subscription setup was not confirmed:",
      {
        sessionId:
          session.id,

        registrationId,

        paymentStatus:
          session
            .payment_status,
      },
    );

    return;
  }

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

  const customerId =
    typeof session
      .customer ===
    "string"
      ? session
          .customer
      : session
          .customer
          ?.id ||
        null;

  // ==========================================================
  // COMPLETE REGISTRATION
  // ==========================================================

  await completeRegistration(
    registrationId,
    {
      stripe_session_id:
        session.id,

      stripe_customer_id:
        customerId,

      stripe_subscription_id:
        subscriptionId,

      customer_email:
        customerEmail,

      payment_status:
        session
          .payment_status,

      billing_model:
        cleanString(
          session
            .metadata
            ?.billing_model,
        ) ||
        null,

      billing_package:
        cleanString(
          session
            .metadata
            ?.billing_package,
        ) ||
        null,

      modules:
        cleanString(
          session
            .metadata
            ?.modules,
        ) ||
        null,

      requested_ai_tier:
        cleanString(
          session
            .metadata
            ?.requested_ai_tier,
        ) ||
        null,

      effective_ai_tier:
        cleanString(
          session
            .metadata
            ?.effective_ai_tier,
        ) ||
        null,

      monthly_total_pence:
        cleanString(
          session
            .metadata
            ?.monthly_total_pence,
        ) ||
        null,

      billing_version:
        cleanString(
          session
            .metadata
            ?.billing_version,
        ) ||
        null,
    },
  );

  // ==========================================================
  // ENRICH STRIPE SUBSCRIPTION METADATA
  // ==========================================================
  //
  // completeRegistration() has now created the organisation.
  //
  // Read the completed registration so later Stripe lifecycle
  // events have organisation/user references directly on the
  // subscription as well.
  // ==========================================================

  if (
    subscriptionId
  ) {
    try {
      const {
        data:
          completedRegistration,

        error:
          completedRegistrationError,
      } =
        await supabaseAdmin
          .from(
            "pending_registrations",
          )
          .select(
            `
              user_id,
              organisation_id,
              billing_model,
              billing_package,
              selected_modules,
              requested_ai_tier,
              effective_ai_tier,
              monthly_total_pence,
              billing_version
            `,
          )
          .eq(
            "id",
            registrationId,
          )
          .maybeSingle();

      if (
        completedRegistrationError
      ) {
        console.warn(
          "[REGISTRATION] Could not load completed registration for Stripe metadata enrichment:",
          completedRegistrationError,
        );
      } else if (
        completedRegistration
      ) {
        const metadata:
          Stripe.MetadataParam = {
          registration_id:
            registrationId,

          checkout_type:
            "registration",

          organisation_id:
            cleanString(
              completedRegistration
                .organisation_id,
            ),

          user_id:
            cleanString(
              completedRegistration
                .user_id,
            ),

          billing_model:
            cleanString(
              completedRegistration
                .billing_model,
            ),

          billing_package:
            cleanString(
              completedRegistration
                .billing_package,
            ),

          modules:
            Array.isArray(
              completedRegistration
                .selected_modules,
            )
              ? completedRegistration
                  .selected_modules
                  .join(",")
              : "",

          requested_ai_tier:
            cleanString(
              completedRegistration
                .requested_ai_tier,
            ),

          effective_ai_tier:
            cleanString(
              completedRegistration
                .effective_ai_tier,
            ),

          monthly_total_pence:
            String(
              completedRegistration
                .monthly_total_pence ??
                "",
            ),

          billing_version:
            cleanString(
              completedRegistration
                .billing_version,
            ),
        };

        await stripe
          .subscriptions
          .update(
            subscriptionId,
            {
              metadata,
            },
          );
      }
    } catch (
      metadataError
    ) {
      // Registration has already succeeded.
      // Metadata enrichment is helpful but should not turn a
      // successful signup into a failed webhook.
      console.warn(
        "[REGISTRATION] Stripe subscription metadata enrichment failed:",
        metadataError,
      );
    }
  }

  console.log(
    "[REGISTRATION] Registration completed successfully:",
    {
      registrationId,

      stripeSessionId:
        session.id,

      stripeSubscriptionId:
        subscriptionId,

      customerEmail,

      paymentStatus:
        session
          .payment_status,

      billingModel:
        session
          .metadata
          ?.billing_model,

      billingPackage:
        session
          .metadata
          ?.billing_package,

      modules:
        session
          .metadata
          ?.modules,

      effectiveAiTier:
        session
          .metadata
          ?.effective_ai_tier,
    },
  );
}

// ============================================================
// INVOICE SUBSCRIPTION ID
// ============================================================

function getInvoiceSubscriptionId(
  invoice:
    Stripe.Invoice,
) {
  const invoiceLike =
    invoice as
      Stripe.Invoice & {
        subscription?:
          | string
          | Stripe.Subscription
          | null;

        parent?: {
          subscription_details?: {
            subscription?:
              | string
              | Stripe.Subscription
              | null;
          };
        } | null;
      };

  const legacySubscription =
    invoiceLike.subscription;

  if (
    typeof legacySubscription ===
    "string"
  ) {
    return legacySubscription;
  }

  if (
    legacySubscription &&
    typeof legacySubscription ===
      "object"
  ) {
    return legacySubscription.id;
  }

  const parentSubscription =
    invoiceLike
      .parent
      ?.subscription_details
      ?.subscription;

  if (
    typeof parentSubscription ===
    "string"
  ) {
    return parentSubscription;
  }

  if (
    parentSubscription &&
    typeof parentSubscription ===
      "object"
  ) {
    return parentSubscription.id;
  }

  return null;
}

// ============================================================
// HANDLE INVOICE
// ============================================================

async function handleInvoice(
  invoice:
    Stripe.Invoice,
) {
  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice,
    );

  if (
    !subscriptionId
  ) {
    return;
  }

  let subscription:
    Stripe.Subscription;

  try {
    subscription =
      await stripe
        .subscriptions
        .retrieve(
          subscriptionId,
        );
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
      console.warn(
        `[STRIPE WEBHOOK] Subscription ${subscriptionId} no longer exists.`,
      );

      return;
    }

    throw error;
  }

  // ==========================================================
  // HISTORICAL STORE ADD-ON
  // ==========================================================

  if (
    isHistoricalStoreAddon(
      subscription.metadata,
    )
  ) {
    console.log(
      "[STRIPE WEBHOOK] Ignoring historical Store add-on invoice:",
      {
        invoiceId:
          invoice.id,

        subscriptionId:
          subscription.id,
      },
    );

    return;
  }

  // ==========================================================
  // EXISTING ACCOUNT
  // ==========================================================

  if (
    isExistingAccountMetadata(
      subscription.metadata,
    )
  ) {
    await syncExistingAccountSubscription(
      subscription,
    );

    return;
  }

  // ==========================================================
  // REGISTERED CUSTOMER
  // ==========================================================

  await syncRegisteredTotsSubscription(
    subscription,
  );
}

// ============================================================
// HANDLE SUBSCRIPTION LIFECYCLE
// ============================================================

async function handleSubscriptionEvent(
  subscription:
    Stripe.Subscription,
) {
  // ==========================================================
  // OLD STORE ADD-ON
  // ==========================================================

  if (
    isHistoricalStoreAddon(
      subscription.metadata,
    )
  ) {
    console.log(
      "[STRIPE WEBHOOK] Ignoring historical Store add-on subscription event:",
      {
        subscriptionId:
          subscription.id,

        status:
          subscription.status,
      },
    );

    return;
  }

  // ==========================================================
  // EXISTING ACCOUNT
  // ==========================================================

  if (
    isExistingAccountMetadata(
      subscription.metadata,
    )
  ) {
    await syncExistingAccountSubscription(
      subscription,
    );

    return;
  }

  // ==========================================================
  // REGISTERED ACCOUNT
  // ==========================================================

  await syncRegisteredTotsSubscription(
    subscription,
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req:
    NextRequest,
) {
  try {
    // ========================================================
    // WEBHOOK SECRET
    // ========================================================

    if (
      !stripeWebhookSecret
    ) {
      console.error(
        "[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET is missing.",
      );

      return NextResponse.json(
        {
          error:
            "Stripe webhook secret is not configured.",
        },
        {
          status:
            500,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // ========================================================
    // RAW BODY
    // ========================================================

    const body =
      await req.text();

    // ========================================================
    // STRIPE SIGNATURE
    // ========================================================

    const signature =
      (
        await headers()
      ).get(
        "stripe-signature",
      );

    if (
      !signature
    ) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe signature",
        },
        {
          status:
            400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    // ========================================================
    // VERIFY EVENT
    // ========================================================

    let event:
      Stripe.Event;

    try {
      event =
        stripe
          .webhooks
          .constructEvent(
            body,
            signature,
            stripeWebhookSecret,
          );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "[STRIPE WEBHOOK] Signature verification failed:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature",
        },
        {
          status:
            400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    console.log(
      `[STRIPE WEBHOOK] Event received: ${event.type} (${event.id})`,
    );

    // ========================================================
    // EVENT HANDLING
    // ========================================================

    switch (
      event.type
    ) {
      // ======================================================
      // CHECKOUT COMPLETED
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event
            .data
            .object as
            Stripe.Checkout.Session;

        // ====================================================
        // HISTORICAL STORE ADD-ON
        // ====================================================

        if (
          isHistoricalStoreAddon(
            session.metadata,
          )
        ) {
          console.log(
            "[STRIPE WEBHOOK] Ignoring historical Store add-on checkout:",
            session.id,
          );

          break;
        }

        // ====================================================
        // EXISTING ACCOUNT
        // ====================================================

        if (
          isExistingAccountMetadata(
            session.metadata,
          )
        ) {
          await handleExistingAccountCheckout(
            session,
          );

          break;
        }

        // ====================================================
        // NEW REGISTRATION
        // ====================================================

        if (
          isRegistrationMetadata(
            session.metadata,
          )
        ) {
          await handleRegistrationCheckout(
            session,
          );

          break;
        }

        console.log(
          `[STRIPE WEBHOOK] Checkout ${session.id} did not match a known TOTS-OS checkout type.`,
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION CREATED
      // ======================================================

      case "customer.subscription.created": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await handleSubscriptionEvent(
          subscription,
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION UPDATED
      // ======================================================

      case "customer.subscription.updated": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await handleSubscriptionEvent(
          subscription,
        );

        break;
      }

      // ======================================================
      // SUBSCRIPTION DELETED
      // ======================================================

      case "customer.subscription.deleted": {
        const subscription =
          event
            .data
            .object as
            Stripe.Subscription;

        await handleSubscriptionEvent(
          subscription,
        );

        break;
      }

      // ======================================================
      // INVOICE PAID
      // ======================================================

      case "invoice.paid": {
        const invoice =
          event
            .data
            .object as
            Stripe.Invoice;

        await handleInvoice(
          invoice,
        );

        break;
      }

      // ======================================================
      // INVOICE PAYMENT FAILED
      // ======================================================

      case "invoice.payment_failed": {
        const invoice =
          event
            .data
            .object as
            Stripe.Invoice;

        await handleInvoice(
          invoice,
        );

        break;
      }

      // ======================================================
      // OTHER EVENTS
      // ======================================================

      default: {
        console.log(
          `[STRIPE WEBHOOK] Ignoring unhandled event: ${event.type}`,
        );

        break;
      }
    }

    // ========================================================
    // SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        received:
          true,

        event:
          event.type,

        eventId:
          event.id,
      },
      {
        status:
          200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[STRIPE WEBHOOK] Processing error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Internal server error",
      },
      {
        status:
          500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  }
}