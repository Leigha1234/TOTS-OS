import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// ============================================================
// ENVIRONMENT
// ============================================================

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is missing`);
  }

  return value.trim();
}

const supabaseUrl = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL"
);

const supabaseServiceRoleKey = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY"
);

const stripeSecretKey = requireEnv(
  "STRIPE_SECRET_KEY"
);

// ============================================================
// CLIENTS
// ============================================================

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const stripe = new Stripe(
  stripeSecretKey
);

// ============================================================
// TYPES
// ============================================================

type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

type BillingInterval =
  | "week"
  | "month"
  | "year";

type BeneficiaryType =
  | "adult"
  | "child";

type StoreOrderRow = {
  id: string;

  organisation_id: string;

  customer_id:
    | string
    | null;

  customer_name:
    | string
    | null;

  customer_email:
    | string
    | null;

  customer_phone:
    | string
    | null;

  stripe_account_id:
    | string
    | null;

  stripe_customer_id:
    | string
    | null;
};

type StoreOrderItemRow = {
  id: string;

  order_id: string;

  product_id:
    | string
    | null;

  quantity:
    | number
    | null;

  unit_price:
    | number
    | string
    | null;
};

type StoreOrderBeneficiaryRow = {
  id: string;

  organisation_id: string;

  order_id: string;

  product_id: string;

  slot_key: string;

  beneficiary_type:
    | BeneficiaryType
    | string;

  first_name: string;

  last_name: string;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  relationship_to_payer:
    | string
    | null;

  is_primary: boolean;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type StoreSubscriptionBeneficiaryRow = {
  id: string;

  organisation_id: string;

  subscription_id: string;

  customer_id:
    | string
    | null;

  beneficiary_type:
    | BeneficiaryType
    | string;

  first_name:
    | string
    | null;

  last_name:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  relationship_to_payer:
    | string
    | null;

  external_user_id:
    | string
    | null;

  is_primary: boolean;

  is_active: boolean;

  metadata:
    | Record<string, unknown>
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

// ============================================================
// STRING
// ============================================================

function asString(
  value:
    | string
    | null
    | undefined
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

// ============================================================
// UNIX -> ISO
// ============================================================

function unixToIso(
  value:
    | number
    | null
    | undefined
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return new Date(
    value * 1000
  ).toISOString();
}

// ============================================================
// STATUS
// ============================================================

function normaliseStatus(
  value:
    | string
    | null
    | undefined
): SubscriptionStatus {
  switch (value) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return value;

    default:
      return "incomplete";
  }
}

// ============================================================
// BENEFICIARY TYPE
// ============================================================

function normaliseBeneficiaryType(
  value:
    | string
    | null
    | undefined
): BeneficiaryType {
  return value === "child"
    ? "child"
    : "adult";
}

// ============================================================
// CUSTOMER ID
// ============================================================

function getStripeCustomerId(
  subscription:
    Stripe.Subscription
) {
  if (
    typeof subscription.customer ===
    "string"
  ) {
    return subscription.customer;
  }

  if (
    subscription.customer &&
    typeof subscription.customer ===
      "object"
  ) {
    return subscription.customer.id;
  }

  return null;
}

// ============================================================
// PERIOD
//
// Stripe API versions differ here. Newer Stripe subscription
// objects expose the billing period on the subscription item,
// while older typings/API versions may also expose it directly
// on the subscription object.
// ============================================================

function getSubscriptionPeriod(
  subscription:
    Stripe.Subscription
) {
  type PeriodCarrier = {
    current_period_start?:
      number | null;

    current_period_end?:
      number | null;

    canceled_at?:
      number | null;
  };

  const subscriptionRaw =
    subscription as unknown as
      PeriodCarrier;

  const itemRaw =
    subscription.items
      ?.data?.[0] as unknown as
      | PeriodCarrier
      | undefined;

  return {
    currentPeriodStart:
      unixToIso(
        itemRaw
          ?.current_period_start ??
        subscriptionRaw
          .current_period_start
      ),

    currentPeriodEnd:
      unixToIso(
        itemRaw
          ?.current_period_end ??
        subscriptionRaw
          .current_period_end
      ),

    cancelledAt:
      unixToIso(
        subscriptionRaw
          .canceled_at
      ),
  };
}

// ============================================================
// FIRST SUBSCRIPTION ITEM
//
// One Stripe subscription represents one Store membership.
// The checkout route already prevents multiple subscription
// products / quantities in a single subscription checkout.
// ============================================================

function getPrimarySubscriptionItem(
  subscription:
    Stripe.Subscription
) {
  const item =
    subscription.items
      ?.data?.[0];

  if (!item) {
    return null;
  }

  const price =
    item.price;

  const quantity =
    typeof item.quantity ===
      "number" &&
    item.quantity > 0
      ? item.quantity
      : 1;

  const unitAmount =
    typeof price.unit_amount ===
      "number"
      ? price.unit_amount
      : null;

  const interval =
    price.recurring
      ?.interval;

  const billingInterval:
    BillingInterval | null =
    interval === "week" ||
    interval === "month" ||
    interval === "year"
      ? interval
      : null;

  return {
    stripePriceId:
      price.id,

    quantity,

    currency:
      (
        price.currency ||
        "gbp"
      ).toLowerCase(),

    unitAmountPence:
      unitAmount,

    billingInterval,
  };
}

// ============================================================
// GET ORDER
// ============================================================

async function getOrder(
  orderId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .select(
        `
          id,
          organisation_id,
          customer_id,
          customer_name,
          customer_email,
          customer_phone,
          stripe_account_id,
          stripe_customer_id
        `
      )
      .eq(
        "id",
        orderId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    | StoreOrderRow
    | null;
}

// ============================================================
// GET PRIMARY ORDER ITEM
// ============================================================

async function getPrimaryOrderItem(
  orderId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_order_items"
      )
      .select(
        `
          id,
          order_id,
          product_id,
          quantity,
          unit_price
        `
      )
      .eq(
        "order_id",
        orderId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      )
      .limit(
        1
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    | StoreOrderItemRow
    | null;
}

// ============================================================
// GET ORDER BENEFICIARIES
// ============================================================

async function getOrderBeneficiaries(
  orderId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_order_beneficiaries"
      )
      .select(
        `
          id,
          organisation_id,
          order_id,
          product_id,
          slot_key,
          beneficiary_type,
          first_name,
          last_name,
          email,
          phone,
          relationship_to_payer,
          is_primary,
          created_at,
          updated_at
        `
      )
      .eq(
        "order_id",
        orderId
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ||
    []
  ) as
    StoreOrderBeneficiaryRow[];
}

// ============================================================
// GET EXISTING PERMANENT BENEFICIARIES
// ============================================================

async function getExistingSubscriptionBeneficiaries(
  subscriptionId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_subscription_beneficiaries"
      )
      .select(
        `
          id,
          organisation_id,
          subscription_id,
          customer_id,
          beneficiary_type,
          first_name,
          last_name,
          email,
          phone,
          relationship_to_payer,
          external_user_id,
          is_primary,
          is_active,
          metadata,
          created_at,
          updated_at
        `
      )
      .eq(
        "subscription_id",
        subscriptionId
      );

  if (error) {
    throw error;
  }

  return (
    data ||
    []
  ) as
    StoreSubscriptionBeneficiaryRow[];
}

// ============================================================
// SYNC ORDER BENEFICIARIES -> SUBSCRIPTION BENEFICIARIES
//
// This is intentionally idempotent because Stripe can deliver
// the same webhook multiple times.
//
// Matching is done using source_order_beneficiary_id stored in
// metadata. Existing customer_id, external_user_id and active
// state are preserved so later MTC linking is not destroyed by
// another Stripe subscription.updated event.
// ============================================================

async function syncSubscriptionBeneficiaries({
  subscriptionId,
  orderId,
  organisationId,
  customerId,
}: {
  subscriptionId: string;

  orderId:
    | string
    | null;

  organisationId: string;

  customerId:
    | string
    | null;
}) {
  if (!orderId) {
    return [];
  }

  const staged =
    await getOrderBeneficiaries(
      orderId
    );

  if (
    staged.length ===
    0
  ) {
    return [];
  }

  for (
    const row of
    staged
  ) {
    if (
      row.organisation_id !==
      organisationId
    ) {
      throw new Error(
        `Organisation mismatch while syncing beneficiaries for Store subscription ${subscriptionId}.`
      );
    }
  }

  const existing =
    await getExistingSubscriptionBeneficiaries(
      subscriptionId
    );

  const existingBySourceId =
    new Map<
      string,
      StoreSubscriptionBeneficiaryRow
    >();

  for (
    const row of
    existing
  ) {
    const sourceId =
      asString(
        row.metadata
          ?.source_order_beneficiary_id as
          | string
          | undefined
      );

    if (sourceId) {
      existingBySourceId.set(
        sourceId,
        row
      );
    }
  }

  const syncedIds:
    string[] =
    [];

  for (
    const stagedRow of
    staged
  ) {
    const existingRow =
      existingBySourceId.get(
        stagedRow.id
      );

    const now =
      new Date()
        .toISOString();

    const metadata = {
      ...(existingRow
        ?.metadata &&
      typeof existingRow.metadata ===
        "object"
        ? existingRow.metadata
        : {}),

      source_order_id:
        stagedRow.order_id,

      source_order_beneficiary_id:
        stagedRow.id,

      source_product_id:
        stagedRow.product_id,

      slot_key:
        stagedRow.slot_key,

      synced_from_order_at:
        now,
    };

    if (
      existingRow
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "store_subscription_beneficiaries"
          )
          .update({
            organisation_id:
              organisationId,

            customer_id:
              existingRow.customer_id ||
              (
                stagedRow.is_primary
                  ? customerId
                  : null
              ),

            beneficiary_type:
              normaliseBeneficiaryType(
                stagedRow.beneficiary_type
              ),

            first_name:
              stagedRow.first_name,

            last_name:
              stagedRow.last_name,

            email:
              stagedRow.email,

            phone:
              stagedRow.phone,

            relationship_to_payer:
              stagedRow.relationship_to_payer,

            /*
             * Preserve the external MTC user link once one has
             * been assigned.
             */
            external_user_id:
              existingRow.external_user_id,

            is_primary:
              stagedRow.is_primary,

            /*
             * Do not accidentally reactivate a beneficiary that
             * an admin/integration deliberately disabled.
             */
            is_active:
              existingRow.is_active,

            metadata,

            updated_at:
              now,
          })
          .eq(
            "id",
            existingRow.id
          )
          .eq(
            "subscription_id",
            subscriptionId
          )
          .select(
            "id"
          )
          .single();

      if (error) {
        console.error(
          "[TOTS STORE SUBSCRIPTIONS] Beneficiary update failed:",
          {
            subscriptionId,
            orderBeneficiaryId:
              stagedRow.id,
            error,
          }
        );

        throw error;
      }

      syncedIds.push(
        data.id
      );

      continue;
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "store_subscription_beneficiaries"
        )
        .insert({
          organisation_id:
            organisationId,

          subscription_id:
            subscriptionId,

          customer_id:
            stagedRow.is_primary
              ? customerId
              : null,

          beneficiary_type:
            normaliseBeneficiaryType(
              stagedRow.beneficiary_type
            ),

          first_name:
            stagedRow.first_name,

          last_name:
            stagedRow.last_name,

          email:
            stagedRow.email,

          phone:
            stagedRow.phone,

          relationship_to_payer:
            stagedRow.relationship_to_payer,

          external_user_id:
            null,

          is_primary:
            stagedRow.is_primary,

          is_active:
            true,

          metadata,

          updated_at:
            now,
        })
        .select(
          "id"
        )
        .single();

    if (error) {
      console.error(
        "[TOTS STORE SUBSCRIPTIONS] Beneficiary insert failed:",
        {
          subscriptionId,
          orderBeneficiaryId:
            stagedRow.id,
          error,
        }
      );

      throw error;
    }

    syncedIds.push(
      data.id
    );
  }

  console.log(
    "[TOTS STORE SUBSCRIPTIONS] Beneficiaries synced:",
    {
      subscriptionId,
      orderId,
      count:
        syncedIds.length,
    }
  );

  return syncedIds;
}

// ============================================================
// FIND EXISTING SUBSCRIPTION
// ============================================================

async function getExistingSubscription({
  stripeAccountId,
  stripeSubscriptionId,
}: {
  stripeAccountId:
    string;

  stripeSubscriptionId:
    string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_subscriptions"
      )
      .select("*")
      .eq(
        "stripe_account_id",
        stripeAccountId
      )
      .eq(
        "stripe_subscription_id",
        stripeSubscriptionId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// ============================================================
// SUBSCRIPTION PRODUCT ID FROM METADATA
// ============================================================

function getMetadataProductId(
  metadata:
    Stripe.Metadata
) {
  const direct =
    asString(
      metadata.tots_product_id
    );

  if (direct) {
    return direct;
  }

  const list =
    asString(
      metadata.subscription_product_ids
    );

  if (!list) {
    return null;
  }

  return (
    list
      .split(",")
      .map(
        (
          value
        ) =>
          value.trim()
      )
      .find(
        Boolean
      ) ||
    null
  );
}

// ============================================================
// SYNC SUBSCRIPTION
// ============================================================

export async function syncStoreSubscription({
  subscription,
  stripeAccountId,
}: {
  subscription:
    Stripe.Subscription;

  stripeAccountId:
    string;
}) {
  if (
    !stripeAccountId
  ) {
    throw new Error(
      "Stripe connected account ID is required to sync a Store subscription."
    );
  }

  const metadata =
    subscription.metadata ||
    {};

  const metadataOrderId =
    asString(
      metadata.order_id
    );

  const metadataOrganisationId =
    asString(
      metadata.organisation_id
    );

  const metadataProductId =
    getMetadataProductId(
      metadata
    );

  const existing =
    await getExistingSubscription({
      stripeAccountId,

      stripeSubscriptionId:
        subscription.id,
    });

  const existingOrderId =
    asString(
      existing?.order_id
    );

  const orderId =
    metadataOrderId ||
    existingOrderId;

  let order:
    StoreOrderRow | null =
    null;

  if (orderId) {
    order =
      await getOrder(
        orderId
      );
  }

  const organisationId =
    metadataOrganisationId ||
    asString(
      order?.organisation_id
    ) ||
    asString(
      existing?.organisation_id
    );

  if (
    !organisationId
  ) {
    throw new Error(
      `Could not identify the TOTS-OS organisation for Stripe subscription ${subscription.id}.`
    );
  }

  if (
    order &&
    order.organisation_id !==
      organisationId
  ) {
    throw new Error(
      `Organisation mismatch while syncing Stripe subscription ${subscription.id}.`
    );
  }

  let primaryOrderItem:
    StoreOrderItemRow | null =
    null;

  if (orderId) {
    primaryOrderItem =
      await getPrimaryOrderItem(
        orderId
      );
  }

  const subscriptionItem =
    getPrimarySubscriptionItem(
      subscription
    );

  const productId =
    metadataProductId ||
    asString(
      primaryOrderItem
        ?.product_id
    ) ||
    asString(
      existing?.product_id
    );

  const stripeCustomerId =
    getStripeCustomerId(
      subscription
    ) ||
    asString(
      order
        ?.stripe_customer_id
    ) ||
    asString(
      existing
        ?.stripe_customer_id
    );

  const period =
    getSubscriptionPeriod(
      subscription
    );

  const now =
    new Date()
      .toISOString();

  const payload = {
    organisation_id:
      organisationId,

    order_id:
      orderId ||
      existing?.order_id ||
      null,

    product_id:
      productId ||
      existing?.product_id ||
      null,

    customer_id:
      order?.customer_id ||
      existing?.customer_id ||
      null,

    customer_name:
      order?.customer_name ||
      existing?.customer_name ||
      null,

    customer_email:
      order?.customer_email ||
      existing?.customer_email ||
      null,

    customer_phone:
      order?.customer_phone ||
      existing?.customer_phone ||
      null,

    stripe_account_id:
      stripeAccountId,

    stripe_customer_id:
      stripeCustomerId,

    stripe_subscription_id:
      subscription.id,

    stripe_price_id:
      subscriptionItem
        ?.stripePriceId ||
      existing?.stripe_price_id ||
      null,

    status:
      normaliseStatus(
        subscription.status
      ),

    quantity:
      subscriptionItem
        ?.quantity ||
      existing?.quantity ||
      1,

    currency:
      subscriptionItem
        ?.currency ||
      existing?.currency ||
      "gbp",

    unit_amount_pence:
      subscriptionItem
        ?.unitAmountPence ??
      existing
        ?.unit_amount_pence ??
      null,

    billing_interval:
      subscriptionItem
        ?.billingInterval ||
      existing
        ?.billing_interval ||
      null,

    current_period_start:
      period.currentPeriodStart ||
      existing
        ?.current_period_start ||
      null,

    current_period_end:
      period.currentPeriodEnd ||
      existing
        ?.current_period_end ||
      null,

    cancel_at_period_end:
      subscription
        .cancel_at_period_end ===
      true,

    cancelled_at:
      period.cancelledAt ||
      existing
        ?.cancelled_at ||
      null,

    metadata: {
      ...(existing?.metadata &&
      typeof existing.metadata ===
        "object"
        ? existing.metadata
        : {}),

      ...metadata,

      stripe_status:
        subscription.status,

      stripe_subscription_id:
        subscription.id,

      stripe_account_id:
        stripeAccountId,

      synced_from_stripe_at:
        now,
    },

    updated_at:
      now,
  };

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_subscriptions"
      )
      .upsert(
        payload,
        {
          onConflict:
            "stripe_account_id,stripe_subscription_id",
        }
      )
      .select("*")
      .single();

  if (error) {
    console.error(
      "[TOTS STORE SUBSCRIPTIONS] Subscription sync failed:",
      {
        stripeSubscriptionId:
          subscription.id,

        stripeAccountId,

        error,
      }
    );

    throw error;
  }

  /*
   * Once the permanent Store subscription exists, copy the
   * beneficiary staging rows created during checkout into the
   * permanent beneficiary table.
   */
  await syncSubscriptionBeneficiaries({
    subscriptionId:
      data.id,

    orderId:
      asString(
        data.order_id
      ),

    organisationId:
      data.organisation_id,

    customerId:
      asString(
        data.customer_id
      ),
  });

  console.log(
    "[TOTS STORE SUBSCRIPTIONS] Subscription synced:",
    {
      id:
        data.id,

      organisationId,

      productId:
        data.product_id,

      customerId:
        data.customer_id,

      stripeSubscriptionId:
        subscription.id,

      status:
        data.status,

      currentPeriodEnd:
        data.current_period_end,
    }
  );

  return data;
}

// ============================================================
// RETRIEVE + SYNC SUBSCRIPTION
// ============================================================

export async function retrieveAndSyncStoreSubscription({
  stripeSubscriptionId,
  stripeAccountId,
}: {
  stripeSubscriptionId:
    string;

  stripeAccountId:
    string;
}) {
  /*
   * Stripe's retrieve params and request options are separate
   * arguments. The connected account belongs in RequestOptions.
   */
  const subscription =
    await stripe
      .subscriptions
      .retrieve(
        stripeSubscriptionId,
        {},
        {
          stripeAccount:
            stripeAccountId,
        }
      );

  return syncStoreSubscription({
    subscription,

    stripeAccountId,
  });
}

// ============================================================
// CHECKOUT SESSION -> SUBSCRIPTION
// ============================================================

export async function syncStoreSubscriptionFromCheckout({
  session,
  stripeAccountId,
}: {
  session:
    Stripe.Checkout.Session;

  stripeAccountId:
    string;
}) {
  if (
    session.mode !==
    "subscription"
  ) {
    return null;
  }

  let subscriptionId:
    string | null =
    null;

  if (
    typeof session.subscription ===
    "string"
  ) {
    subscriptionId =
      session.subscription;
  } else if (
    session.subscription &&
    typeof session.subscription ===
      "object"
  ) {
    subscriptionId =
      session.subscription.id;
  }

  if (
    !subscriptionId
  ) {
    console.warn(
      `[TOTS STORE SUBSCRIPTIONS] Checkout ${session.id} is subscription mode but has no subscription ID yet.`
    );

    return null;
  }

  return retrieveAndSyncStoreSubscription({
    stripeSubscriptionId:
      subscriptionId,

    stripeAccountId,
  });
}

// ============================================================
// INVOICE -> SUBSCRIPTION ID
//
// Stripe changed parts of the Invoice object structure across
// API versions, so support both the older subscription field
// and the newer parent.subscription_details structure.
// ============================================================

export function getInvoiceSubscriptionId(
  invoice:
    Stripe.Invoice
) {
  const raw =
    invoice as Stripe.Invoice & {
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
        } | null;
      } | null;
    };

  const direct =
    raw.subscription;

  if (
    typeof direct ===
    "string"
  ) {
    return direct;
  }

  if (
    direct &&
    typeof direct ===
      "object"
  ) {
    return direct.id;
  }

  const parentSubscription =
    raw.parent
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
// INVOICE -> SYNC
// ============================================================

export async function syncStoreSubscriptionFromInvoice({
  invoice,
  stripeAccountId,
}: {
  invoice:
    Stripe.Invoice;

  stripeAccountId:
    string;
}) {
  const subscriptionId =
    getInvoiceSubscriptionId(
      invoice
    );

  if (
    !subscriptionId
  ) {
    return null;
  }

  return retrieveAndSyncStoreSubscription({
    stripeSubscriptionId:
      subscriptionId,

    stripeAccountId,
  });
}
