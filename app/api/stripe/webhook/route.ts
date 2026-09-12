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

const storePriceId =
  process.env
    .STRIPE_STORE_ADDON_PRICE_ID;

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

type StoreOrganisationRow = {
  id:
    string;

  store_enabled?:
    boolean |
    null;

  store_subscription_status?:
    string |
    null;

  store_stripe_customer_id?:
    string |
    null;

  store_stripe_subscription_id?:
    string |
    null;

  store_price_id?:
    string |
    null;

  store_current_period_end?:
    string |
    null;

  store_cancel_at_period_end?:
    boolean |
    null;

  store_enabled_at?:
    string |
    null;
};

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
// NORMALISE MODULES
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
// NORMALISE AI TIER
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
// STORE SUBSCRIPTION?
// ============================================================

function isStoreSubscriptionMetadata(
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
// EXISTING ACCOUNT SUBSCRIPTION?
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
// NEW REGISTRATION METADATA?
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
// STORE ACCESS ENABLED
// ============================================================

function storeAccessEnabled(
  status:
    Stripe.Subscription.Status,
) {
  return [
    "active",
    "trialing",
  ].includes(
    status,
  );
}

// ============================================================
// NORMAL TOTS ACCESS ENABLED
// ============================================================

function totsAccessEnabled(
  status:
    Stripe.Subscription.Status,
) {
  return [
    "active",
    "trialing",
  ].includes(
    status,
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
// PRICE ID
// ============================================================

function getSubscriptionPriceId(
  subscription:
    Stripe.Subscription,
) {
  const item =
    subscription
      .items
      ?.data?.[0];

  return (
    cleanString(
      item
        ?.price
        ?.id,
    ) ||
    cleanString(
      storePriceId,
    ) ||
    null
  );
}

// ============================================================
// CUSTOMER ID
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
// FIND ORGANISATION BY STORE REFERENCES
// ============================================================

async function findStoreOrganisation({
  organisationId,
  subscriptionId,
  customerId,
}: {
  organisationId?:
    string |
    null;

  subscriptionId?:
    string |
    null;

  customerId?:
    string |
    null;
}) {
  const cleanOrganisationId =
    cleanString(
      organisationId,
    );

  // ==========================================================
  // ORGANISATION ID
  // ==========================================================

  if (
    cleanOrganisationId
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "organisations",
        )
        .select(
          `
            id,
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `,
        )
        .eq(
          "id",
          cleanOrganisationId,
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  // ==========================================================
  // SUBSCRIPTION ID
  // ==========================================================

  const cleanSubscriptionId =
    cleanString(
      subscriptionId,
    );

  if (
    cleanSubscriptionId
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "organisations",
        )
        .select(
          `
            id,
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `,
        )
        .eq(
          "store_stripe_subscription_id",
          cleanSubscriptionId,
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  // ==========================================================
  // CUSTOMER ID
  // ==========================================================

  const cleanCustomerId =
    cleanString(
      customerId,
    );

  if (
    cleanCustomerId
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "organisations",
        )
        .select(
          `
            id,
            store_enabled,
            store_subscription_status,
            store_stripe_customer_id,
            store_stripe_subscription_id,
            store_price_id,
            store_current_period_end,
            store_cancel_at_period_end,
            store_enabled_at
          `,
        )
        .eq(
          "store_stripe_customer_id",
          cleanCustomerId,
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      data
    ) {
      return data as
        StoreOrganisationRow;
    }
  }

  return null;
}

// ============================================================
// STORE PRODUCT?
// ============================================================

function isStoreSubscription(
  subscription:
    Stripe.Subscription,
) {
  if (
    isStoreSubscriptionMetadata(
      subscription.metadata,
    )
  ) {
    return true;
  }

  const priceId =
    getSubscriptionPriceId(
      subscription,
    );

  if (
    storePriceId &&
    priceId ===
      storePriceId
  ) {
    return true;
  }

  return false;
}

// ============================================================
// SYNC STORE SUBSCRIPTION
// ============================================================

async function syncStoreSubscription(
  subscription:
    Stripe.Subscription,
) {
  if (
    !isStoreSubscription(
      subscription,
    )
  ) {
    return;
  }

  const metadataOrganisationId =
    cleanString(
      subscription
        .metadata
        ?.organisation_id,
    );

  const customerId =
    getSubscriptionCustomerId(
      subscription,
    );

  const organisation =
    await findStoreOrganisation({
      organisationId:
        metadataOrganisationId,

      subscriptionId:
        subscription.id,

      customerId,
    });

  if (
    !organisation
  ) {
    throw new Error(
      `Organisation could not be found for Store subscription ${subscription.id}.`,
    );
  }

  const enabled =
    storeAccessEnabled(
      subscription.status,
    );

  const periodEnd =
    getCurrentPeriodEnd(
      subscription,
    );

  const priceId =
    getSubscriptionPriceId(
      subscription,
    );

  const payload: Record<
    string,
    unknown
  > = {
    store_enabled:
      enabled,

    store_subscription_status:
      subscription.status,

    store_stripe_subscription_id:
      subscription.id,

    store_stripe_customer_id:
      customerId,

    store_price_id:
      priceId,

    store_current_period_end:
      periodEnd,

    store_cancel_at_period_end:
      subscription
        .cancel_at_period_end ===
      true,
  };

  if (
    enabled &&
    !organisation
      .store_enabled_at
  ) {
    payload
      .store_enabled_at =
      new Date()
        .toISOString();
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update(
        payload,
      )
      .eq(
        "id",
        organisation.id,
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    "[STORE SUBSCRIPTION] Organisation updated:",
    {
      organisationId:
        organisation.id,

      subscriptionId:
        subscription.id,

      status:
        subscription.status,

      storeEnabled:
        enabled,
    },
  );
}

// ============================================================
// SYNC MODULAR MODULE ENTITLEMENTS
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
// FIND NORMAL SUBSCRIPTION RECORD
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
        "id, organisation_id",
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
// SYNC REGISTERED TOTS-OS SUBSCRIPTION
// ============================================================

async function syncRegisteredTotsSubscription(
  subscription:
    Stripe.Subscription,
) {
  const subscriptionRecord =
    await findTotsSubscriptionRecord(
      subscription.id,
    );

  // During customer.subscription.created, Checkout may not
  // have finished creating the TOTS-OS organisation yet.
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
  // LOAD ORGANISATION BILLING MODEL
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

      status:
        hasAccess
          ? "active"
          : "inactive",
  };

  // ==========================================================
  // MODULAR STORE COMPATIBILITY
  // ==========================================================

  if (
    cleanString(
      organisation
        .billing_model,
    ) ===
    "modular"
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
          "id, status",
        )
        .eq(
          "organisation_id",
          organisationId,
        )
        .eq(
          "module_key",
          "store",
        )
        .maybeSingle();

    if (
      storeModuleError
    ) {
      throw storeModuleError;
    }

    organisationPayload
      .store_enabled =
      Boolean(
        hasAccess &&
        storeModule &&
        storeModule.status ===
          "active",
      );
  }

  const {
    error:
      organisationUpdateError,
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
    organisationUpdateError
  ) {
    throw organisationUpdateError;
  }

  // ==========================================================
  // MODULAR ENTITLEMENT STATUS
  // ==========================================================

  if (
    cleanString(
      organisation
        .billing_model,
    ) ===
    "modular"
  ) {
    await syncOrganisationModuleStatuses(
      organisationId,
      hasAccess,
    );

    // Re-evaluate Store after module status was updated.
    const {
      data:
        storeModule,
      error:
        storeModuleLookupError,
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
      storeModuleLookupError
    ) {
      throw storeModuleLookupError;
    }

    const {
      error:
        storeCompatibilityError,
    } =
      await supabaseAdmin
        .from(
          "organisations",
        )
        .update({
          store_enabled:
            Boolean(
              hasAccess &&
              storeModule,
            ),
        })
        .eq(
          "id",
          organisationId,
        );

    if (
      storeCompatibilityError
    ) {
      throw storeCompatibilityError;
    }
  }

  // ==========================================================
  // UPDATE SUBSCRIPTION RECORD
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
    },
  );
}

// ============================================================
// SYNC EXISTING TOTS-OS SUBSCRIPTION
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

  const effectiveAiTier =
    normaliseAiTier(
      subscription
        .metadata
        ?.effective_ai_tier,
    );

  const modules =
    normaliseModules(
      subscription
        .metadata
        ?.modules,
    );

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
  // MODULAR EXISTING ACCOUNT
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
      effectiveAiTier;

    organisationPayload
      .billing_version =
      cleanString(
        subscription
          .metadata
          ?.billing_version,
      ) ||
      "v2";
  }

  // ==========================================================
  // LEGACY EXISTING ACCOUNT
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
      .subscription_tier =
      subscriptionTier;
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
      "modular" &&
    modules.length >
      0
  ) {
    const now =
      new Date()
        .toISOString();

    // Existing module rows that are not selected become
    // cancelled.
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
          "id, module_key, status",
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

          activated_at:
            now,

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
          },
        );

    if (
      upsertError
    ) {
      throw upsertError;
    }

    const {
      error:
        storeCompatibilityError,
    } =
      await supabaseAdmin
        .from(
          "organisations",
        )
        .update({
          store_enabled:
            Boolean(
              hasAccess &&
              modules.includes(
                "store",
              ),
            ),
        })
        .eq(
          "id",
          organisationId,
        );

    if (
      storeCompatibilityError
    ) {
      throw storeCompatibilityError;
    }
  }

  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  if (
    userId
  ) {
    const profilePayload:
      Record<
        string,
        unknown
      > = {};

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

    profilePayload
      .team_seats_allocated =
      additionalSeats;

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

      effectiveAiTier,

      additionalSeats,
    },
  );
}

// ============================================================
// HANDLE EXISTING ACCOUNT CHECKOUT
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

  const tier =
    cleanString(
      session
        .metadata
        ?.subscription_tier,
    ).toLowerCase();

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

      tier,

      subscriptionId,
    },
  );
}

// ============================================================
// DELETE STORE SUBSCRIPTION
// ============================================================

async function handleStoreSubscriptionDeleted(
  subscription:
    Stripe.Subscription,
) {
  if (
    !isStoreSubscription(
      subscription,
    )
  ) {
    return;
  }

  const organisation =
    await findStoreOrganisation({
      organisationId:
        cleanString(
          subscription
            .metadata
            ?.organisation_id,
        ),

      subscriptionId:
        subscription.id,

      customerId:
        getSubscriptionCustomerId(
          subscription,
        ),
    });

  if (
    !organisation
  ) {
    console.warn(
      `[STORE SUBSCRIPTION] Organisation not found for deleted subscription ${subscription.id}.`,
    );

    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update({
        store_enabled:
          false,

        store_subscription_status:
          "canceled",

        store_stripe_subscription_id:
          subscription.id,

        store_stripe_customer_id:
          getSubscriptionCustomerId(
            subscription,
          ),

        store_price_id:
          getSubscriptionPriceId(
            subscription,
          ),

        store_current_period_end:
          getCurrentPeriodEnd(
            subscription,
          ),

        store_cancel_at_period_end:
          false,
      })
      .eq(
        "id",
        organisation.id,
      );

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// STORE CHECKOUT COMPLETED
// ============================================================

async function handleStoreCheckoutCompleted(
  session:
    Stripe.Checkout.Session,
) {
  const organisationId =
    cleanString(
      session
        .metadata
        ?.organisation_id,
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

  if (
    !organisationId
  ) {
    throw new Error(
      "Store checkout is missing organisation_id metadata.",
    );
  }

  if (
    !subscriptionId
  ) {
    throw new Error(
      "Store checkout did not contain a Stripe subscription.",
    );
  }

  const {
    error:
      referenceError,
  } =
    await supabaseAdmin
      .from(
        "organisations",
      )
      .update({
        store_stripe_customer_id:
          customerId,

        store_stripe_subscription_id:
          subscriptionId,

        store_price_id:
          cleanString(
            session
              .metadata
              ?.store_price_id,
          ) ||
          storePriceId ||
          null,
      })
      .eq(
        "id",
        organisationId,
      );

  if (
    referenceError
  ) {
    throw referenceError;
  }

  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        subscriptionId,
      );

  await syncStoreSubscription(
    subscription,
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
  //
  // A 14-day trial with no card required can complete with:
  //
  // payment_status = "no_payment_required"
  //
  // so "paid" must NOT be the only accepted state.
  //
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
  // PASS ALL BILLING METADATA TO REGISTRATION
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
  // OLD STORE ADD-ON
  // ==========================================================

  if (
    isStoreSubscription(
      subscription,
    )
  ) {
    await syncStoreSubscription(
      subscription,
    );

    return;
  }

  // ==========================================================
  // EXISTING ACCOUNT CHECKOUT
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
  // NORMAL REGISTERED CUSTOMER
  // ==========================================================

  await syncRegisteredTotsSubscription(
    subscription,
  );
}

// ============================================================
// HANDLE NORMAL SUBSCRIPTION EVENT
// ============================================================

async function handleNormalSubscriptionEvent(
  subscription:
    Stripe.Subscription,
) {
  // ==========================================================
  // OLD STORE ADD-ON
  // ==========================================================

  if (
    isStoreSubscription(
      subscription,
    )
  ) {
    await syncStoreSubscription(
      subscription,
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
  // NEW / REGISTERED ACCOUNT
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
    // SIGNATURE
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
    // HANDLE EVENT
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
        // OLD STORE ADD-ON
        // ====================================================

        if (
          isStoreSubscriptionMetadata(
            session.metadata,
          )
        ) {
          await handleStoreCheckoutCompleted(
            session,
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
          `[STRIPE WEBHOOK] Checkout ${session.id} did not match a known checkout type.`,
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

        await handleNormalSubscriptionEvent(
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

        await handleNormalSubscriptionEvent(
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

        if (
          isStoreSubscription(
            subscription,
          )
        ) {
          await handleStoreSubscriptionDeleted(
            subscription,
          );

          break;
        }

        await handleNormalSubscriptionEvent(
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