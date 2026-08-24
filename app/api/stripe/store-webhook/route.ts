import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ENVIRONMENT HELPER
// ============================================================

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is missing`);
  }

  return value.trim();
}

// ============================================================
// ENVIRONMENT
// ============================================================

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

type StoreOrderRow = {
  id: string;

  organisation_id: string;

  customer_id?:
    | string
    | null;

  order_number: string;

  customer_name:
    | string
    | null;

  customer_email:
    | string
    | null;

  customer_phone:
    | string
    | null;

  subtotal:
    | number
    | string;

  discount_amount:
    | number
    | string;

  shipping_amount:
    | number
    | string;

  total:
    | number
    | string;

  payment_status: string;

  fulfilment_status: string;

  shipping_address:
    | Record<string, unknown>
    | null;

  stripe_account_id?:
    | string
    | null;

  stripe_checkout_session_id?:
    | string
    | null;

  stripe_payment_intent_id?:
    | string
    | null;

  stripe_customer_id?:
    | string
    | null;

  currency?:
    | string
    | null;

  checkout_completed_at?:
    | string
    | null;

  paid_at?:
    | string
    | null;

  discount_code?:
    | string
    | null;

  discount_id?:
    | string
    | null;

  created_at: string;

  updated_at: string;
};

type StoreOrderItemRow = {
  id: string;

  order_id: string;

  product_id:
    | string
    | null;

  product_name: string;

  sku:
    | string
    | null;

  quantity: number;

  unit_price:
    | number
    | string;

  total:
    | number
    | string;

  created_at: string;
};

type StoreProductRow = {
  id: string;

  organisation_id: string;

  name: string;

  stock: number;

  inventory_quantity: number;

  track_inventory: boolean;

  is_active: boolean;

  status: string;
};

type CustomerRow = {
  id: string;

  organisation_id:
    | string
    | null;

  name:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  company:
    | string
    | null;

  notes:
    | string
    | null;

  stage:
    | string
    | null;

  address:
    | string
    | null;

  client_type:
    | string
    | null;

  status:
    | string
    | null;

  on_mailing_list?:
    | boolean
    | null;

  mailing_list_category?:
    | string
    | null;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
};

type CrmContactRow = {
  id: string;

  organisation_id?:
    | string
    | null;

  customer_id?:
    | string
    | null;

  name?:
    | string
    | null;

  email?:
    | string
    | null;

  phone?:
    | string
    | null;

  address?:
    | string
    | null;

  website?:
    | string
    | null;

  company_name?:
    | string
    | null;

  company_details?:
    | string
    | null;

  role?:
    | string
    | null;

  [key: string]:
    unknown;
};

type ShippingDetailsLike = {
  name?:
    | string
    | null;

  address?: {
    line1?:
      | string
      | null;

    line2?:
      | string
      | null;

    city?:
      | string
      | null;

    state?:
      | string
      | null;

    postal_code?:
      | string
      | null;

    country?:
      | string
      | null;
  } | null;
};

type NotificationRecipientRow = {
  user_id?:
    | string
    | null;

  id?:
    | string
    | null;

  role?:
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
  return typeof value ===
    "string" &&
    value.trim()
    ? value.trim()
    : null;
}

// ============================================================
// EMAIL
// ============================================================

function normaliseEmail(
  value:
    | string
    | null
    | undefined
) {
  const email =
    asString(
      value
    );

  return email
    ? email.toLowerCase()
    : null;
}

// ============================================================
// NUMBER
// ============================================================

function safeInteger(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.floor(
    number
  );
}

// ============================================================

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return number;
}

// ============================================================
// MONEY
// ============================================================

function formatMoney(
  value: unknown,
  currency = "GBP"
) {
  try {
    return safeNumber(
      value,
      0
    ).toLocaleString(
      "en-GB",
      {
        style:
          "currency",

        currency:
          currency.toUpperCase(),
      }
    );
  } catch {
    return `£${safeNumber(
      value,
      0
    ).toFixed(2)}`;
  }
}

// ============================================================
// EVENT CONNECTED ACCOUNT
// ============================================================

function getEventStripeAccountId(
  event: Stripe.Event
) {
  const account =
    event.account;

  return typeof account ===
    "string"
    ? account
    : null;
}

// ============================================================
// PAYMENT INTENT ID
// ============================================================

function getPaymentIntentId(
  session:
    Stripe.Checkout.Session
) {
  if (
    typeof session.payment_intent ===
    "string"
  ) {
    return session.payment_intent;
  }

  if (
    session.payment_intent &&
    typeof session.payment_intent ===
      "object"
  ) {
    return session.payment_intent.id;
  }

  return null;
}

// ============================================================
// STRIPE CUSTOMER ID
// ============================================================

function getStripeCustomerId(
  session:
    Stripe.Checkout.Session
) {
  if (
    typeof session.customer ===
    "string"
  ) {
    return session.customer;
  }

  if (
    session.customer &&
    typeof session.customer ===
      "object"
  ) {
    return session.customer.id;
  }

  return null;
}

// ============================================================
// SHIPPING DETAILS
// ============================================================

function getRawShippingDetails(
  session:
    Stripe.Checkout.Session
): ShippingDetailsLike | null {
  const collected =
    session
      .collected_information
      ?.shipping_details as
      | ShippingDetailsLike
      | null
      | undefined;

  if (
    collected
  ) {
    return collected;
  }

  const legacySession =
    session as
      Stripe.Checkout.Session & {
        shipping_details?:
          | ShippingDetailsLike
          | null;
      };

  return (
    legacySession
      .shipping_details ??
    null
  );
}

// ============================================================
// SHIPPING ADDRESS
// ============================================================

function getShippingAddress(
  session:
    Stripe.Checkout.Session
):
  | Record<string, unknown>
  | null {
  const shipping =
    getRawShippingDetails(
      session
    );

  if (
    !shipping
  ) {
    return null;
  }

  return {
    name:
      shipping.name ??
      null,

    address:
      shipping.address
        ? {
            line1:
              shipping.address
                .line1 ??
              null,

            line2:
              shipping.address
                .line2 ??
              null,

            city:
              shipping.address
                .city ??
              null,

            state:
              shipping.address
                .state ??
              null,

            postal_code:
              shipping.address
                .postal_code ??
              null,

            country:
              shipping.address
                .country ??
              null,
          }
        : null,
  };
}

// ============================================================
// SHIPPING ADDRESS TEXT
// ============================================================

function getShippingAddressText(
  session:
    Stripe.Checkout.Session
) {
  const shipping =
    getRawShippingDetails(
      session
    );

  if (
    !shipping?.address
  ) {
    return null;
  }

  return (
    [
      shipping.address.line1,
      shipping.address.line2,
      shipping.address.city,
      shipping.address.state,
      shipping.address.postal_code,
      shipping.address.country,
    ]
      .map(
        (
          value
        ) =>
          asString(
            value
          )
      )
      .filter(
        (
          value
        ): value is string =>
          Boolean(
            value
          )
      )
      .join(
        ", "
      ) ||
    null
  );
}

// ============================================================
// CUSTOMER NAME
// ============================================================

function getCustomerName(
  session:
    Stripe.Checkout.Session
) {
  const shipping =
    getRawShippingDetails(
      session
    );

  return (
    asString(
      session
        .customer_details
        ?.name
    ) ||
    asString(
      shipping?.name
    )
  );
}

// ============================================================
// CUSTOMER EMAIL
// ============================================================

function getCustomerEmail(
  session:
    Stripe.Checkout.Session
) {
  return normaliseEmail(
    session
      .customer_details
      ?.email ||
      session
        .customer_email
  );
}

// ============================================================
// CUSTOMER PHONE
// ============================================================

function getCustomerPhone(
  session:
    Stripe.Checkout.Session
) {
  return asString(
    session
      .customer_details
      ?.phone
  );
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
      .select("*")
      .eq(
        "id",
        orderId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | StoreOrderRow
    | null;
}

// ============================================================
// GET ORDER BY PAYMENT INTENT
// ============================================================

async function getOrderByPaymentIntent(
  paymentIntentId:
    string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .select("*")
      .eq(
        "stripe_payment_intent_id",
        paymentIntentId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | StoreOrderRow
    | null;
}

// ============================================================
// GET ORDER ITEMS
// ============================================================

async function getOrderItems(
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
      .select("*")
      .eq(
        "order_id",
        orderId
      );

  if (
    error
  ) {
    throw error;
  }

  return (
    data ||
    []
  ) as StoreOrderItemRow[];
}

// ============================================================
// VERIFY CONNECTED ACCOUNT OWNS ORDER
// ============================================================

async function verifyOrderStripeAccount({
  order,
  eventStripeAccountId,
}: {
  order:
    StoreOrderRow;

  eventStripeAccountId:
    string | null;
}) {
  const storedAccountId =
    asString(
      order
        .stripe_account_id
    );

  if (
    storedAccountId &&
    eventStripeAccountId &&
    storedAccountId !==
      eventStripeAccountId
  ) {
    throw new Error(
      `Stripe account mismatch for order ${order.order_number}.`
    );
  }

  if (
    eventStripeAccountId
  ) {
    const {
      data:
        connection,

      error,
    } =
      await supabaseAdmin
        .from(
          "store_stripe_accounts"
        )
        .select(
          "organisation_id, stripe_account_id"
        )
        .eq(
          "organisation_id",
          order.organisation_id
        )
        .eq(
          "stripe_account_id",
          eventStripeAccountId
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    if (
      !connection
    ) {
      throw new Error(
        `Stripe account ${eventStripeAccountId} is not connected to organisation ${order.organisation_id}.`
      );
    }
  }
}

// ============================================================
// SAVE STRIPE REFERENCES
// ============================================================

async function saveStripeReferences({
  order,
  session,
  eventStripeAccountId,
}: {
  order:
    StoreOrderRow;

  session:
    Stripe.Checkout.Session;

  eventStripeAccountId:
    string | null;
}) {
  const paymentIntentId =
    getPaymentIntentId(
      session
    );

  const stripeCustomerId =
    getStripeCustomerId(
      session
    );

  const accountId =
    eventStripeAccountId ||
    asString(
      session
        .metadata
        ?.stripe_account_id
    ) ||
    asString(
      order
        .stripe_account_id
    );

  const currency =
    asString(
      session.currency
    )?.toLowerCase() ||
    asString(
      order.currency
    )?.toLowerCase() ||
    "gbp";

  const payload: Record<
    string,
    unknown
  > = {
    stripe_checkout_session_id:
      session.id,

    currency,

    updated_at:
      new Date()
        .toISOString(),
  };

  if (
    accountId
  ) {
    payload.stripe_account_id =
      accountId;
  }

  if (
    paymentIntentId
  ) {
    payload.stripe_payment_intent_id =
      paymentIntentId;
  }

  if (
    stripeCustomerId
  ) {
    payload.stripe_customer_id =
      stripeCustomerId;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update(
        payload
      )
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      );

  if (
    error
  ) {
    console.error(
      `[TOTS STORE] Failed to save Stripe references for ${order.order_number}:`,
      error
    );

    throw error;
  }
}

// ============================================================
// NOTIFICATION RECIPIENTS
// ============================================================

async function getOrganisationNotificationRecipients(
  organisationId:
    string
) {
  const recipientIds =
    new Set<string>();

  // ==========================================================
  // TEAM MEMBERS
  // ==========================================================

  const {
    data:
      teamMembers,

    error:
      teamMembersError,
  } =
    await supabaseAdmin
      .from(
        "team_members"
      )
      .select(
        "user_id, role"
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (
    teamMembersError
  ) {
    console.warn(
      "[TOTS NOTIFICATIONS] Could not load team members:",
      teamMembersError
    );
  } else {
    for (
      const member of
      (
        teamMembers ||
        []
      ) as NotificationRecipientRow[]
    ) {
      const userId =
        asString(
          member.user_id
        );

      if (
        userId
      ) {
        recipientIds.add(
          userId
        );
      }
    }
  }

  // ==========================================================
  // PROFILE FALLBACK
  // ==========================================================

  const {
    data:
      profiles,

    error:
      profilesError,
  } =
    await supabaseAdmin
      .from(
        "profiles"
      )
      .select(
        "id, role"
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (
    profilesError
  ) {
    console.warn(
      "[TOTS NOTIFICATIONS] Profile fallback lookup failed:",
      profilesError
    );
  } else {
    for (
      const profile of
      (
        profiles ||
        []
      ) as NotificationRecipientRow[]
    ) {
      const userId =
        asString(
          profile.id
        );

      if (
        userId
      ) {
        recipientIds.add(
          userId
        );
      }
    }
  }

  return Array.from(
    recipientIds
  );
}

// ============================================================
// CREATE ORDER NOTIFICATIONS
// ============================================================

async function createOrderNotifications({
  order,
  customerName,
  customerEmail,
  total,
}: {
  order:
    StoreOrderRow;

  customerName:
    string | null;

  customerEmail:
    string | null;

  total:
    number;
}) {
  try {
    const recipients =
      await getOrganisationNotificationRecipients(
        order.organisation_id
      );

    if (
      recipients.length ===
      0
    ) {
      console.warn(
        `[TOTS NOTIFICATIONS] No users found for organisation ${order.organisation_id}.`
      );

      return;
    }

    const customerLabel =
      customerName ||
      customerEmail ||
      "A customer";

    const money =
      formatMoney(
        total,
        order.currency ||
          "GBP"
      );

    const message =
      `${customerLabel} placed order ${order.order_number} for ${money}.`;

    const now =
      new Date()
        .toISOString();

    let createdCount =
      0;

    for (
      const userId of
      recipients
    ) {
      const dedupeKey =
        `store-order-paid:${order.id}:${userId}`;

      const {
        data:
          existingNotification,

        error:
          existingError,
      } =
        await supabaseAdmin
          .from(
            "notifications"
          )
          .select(
            "id"
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "organisation_id",
            order.organisation_id
          )
          .eq(
            "dedupe_key",
            dedupeKey
          )
          .maybeSingle();

      if (
        existingError
      ) {
        console.error(
          `[TOTS NOTIFICATIONS] Duplicate check failed for user ${userId}:`,
          existingError
        );

        continue;
      }

      if (
        existingNotification
      ) {
        continue;
      }

      const {
        error:
          notificationError,
      } =
        await supabaseAdmin
          .from(
            "notifications"
          )
          .insert({
            user_id:
              userId,

            organisation_id:
              order.organisation_id,

            type:
              "order",

            title:
              "New store order",

            message,

            content:
              message,

            link:
              "/store",

            href:
              "/store",

            entity_type:
              "store_order",

            entity_id:
              order.id,

            is_read:
              false,

            read:
              false,

            read_at:
              null,

            dedupe_key:
              dedupeKey,

            metadata: {
              order_id:
                order.id,

              order_number:
                order.order_number,

              customer_name:
                customerName,

              customer_email:
                customerEmail,

              total,

              payment_status:
                "paid",

              fulfilment_status:
                order.fulfilment_status,

              stripe_account_id:
                order.stripe_account_id ||
                null,
            },

            created_at:
              now,

            updated_at:
              now,
          });

      if (
        notificationError
      ) {
        console.error(
          `[TOTS NOTIFICATIONS] Order notification insert failed for user ${userId}:`,
          notificationError
        );

        continue;
      }

      createdCount +=
        1;
    }

    console.log(
      `[TOTS NOTIFICATIONS] Created ${createdCount} order notification(s) for ${order.order_number}.`
    );
  } catch (
    notificationError
  ) {
    /*
     * Notification failures must not make Stripe retry a
     * successfully-processed payment.
     */

    console.error(
      `[TOTS NOTIFICATIONS] Unable to notify organisation about ${order.order_number}:`,
      notificationError
    );
  }
}

// ============================================================
// CREATE REFUND NOTIFICATIONS
// ============================================================

async function createRefundNotifications({
  order,
  refundId,
  amount,
}: {
  order:
    StoreOrderRow;

  refundId:
    string;

  amount:
    number;
}) {
  try {
    const recipients =
      await getOrganisationNotificationRecipients(
        order.organisation_id
      );

    if (
      recipients.length ===
      0
    ) {
      return;
    }

    const money =
      formatMoney(
        amount,
        order.currency ||
          "GBP"
      );

    const message =
      `${money} was refunded from order ${order.order_number}.`;

    const now =
      new Date()
        .toISOString();

    for (
      const userId of
      recipients
    ) {
      const dedupeKey =
        `store-refund:${refundId}:${userId}`;

      const {
        data:
          existing,

        error:
          lookupError,
      } =
        await supabaseAdmin
          .from(
            "notifications"
          )
          .select(
            "id"
          )
          .eq(
            "user_id",
            userId
          )
          .eq(
            "dedupe_key",
            dedupeKey
          )
          .maybeSingle();

      if (
        lookupError
      ) {
        console.error(
          "[TOTS NOTIFICATIONS] Refund duplicate lookup failed:",
          lookupError
        );

        continue;
      }

      if (
        existing
      ) {
        continue;
      }

      const {
        error,
      } =
        await supabaseAdmin
          .from(
            "notifications"
          )
          .insert({
            user_id:
              userId,

            organisation_id:
              order.organisation_id,

            type:
              "order",

            title:
              "Store refund processed",

            message,

            content:
              message,

            link:
              "/store",

            href:
              "/store",

            entity_type:
              "store_order",

            entity_id:
              order.id,

            is_read:
              false,

            read:
              false,

            read_at:
              null,

            dedupe_key:
              dedupeKey,

            metadata: {
              order_id:
                order.id,

              order_number:
                order.order_number,

              refund_id:
                refundId,

              refund_amount:
                amount,

              stripe_account_id:
                order.stripe_account_id ||
                null,
            },

            created_at:
              now,

            updated_at:
              now,
          });

      if (
        error
      ) {
        console.error(
          "[TOTS NOTIFICATIONS] Refund notification failed:",
          error
        );
      }
    }
  } catch (
    error
  ) {
    console.error(
      "[TOTS NOTIFICATIONS] Refund notification error:",
      error
    );
  }
}

// ============================================================
// FIND CUSTOMER BY ID
// ============================================================

async function findCustomerById({
  organisationId,
  customerId,
}: {
  organisationId:
    string;

  customerId:
    string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "customers"
      )
      .select("*")
      .eq(
        "id",
        customerId
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

  return data as
    | CustomerRow
    | null;
}

// ============================================================
// FIND CUSTOMER BY EMAIL
// ============================================================

async function findCustomerByEmail({
  organisationId,
  email,
}: {
  organisationId:
    string;

  email:
    string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "customers"
      )
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .ilike(
        "email",
        email
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    console.error(
      "[TOTS CRM] Customer lookup failed:",
      error
    );

    throw error;
  }

  return data as
    | CustomerRow
    | null;
}

// ============================================================
// CREATE CUSTOMER
// ============================================================

async function createCustomer({
  organisationId,
  name,
  email,
  phone,
  address,
}: {
  organisationId:
    string;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "customers"
      )
      .insert({
        organisation_id:
          organisationId,

        name,

        email,

        phone,

        address,

        company:
          null,

        notes:
          "Created automatically from a TOTS-OS storefront order.",

        stage:
          "client",

        status:
          "live",

        client_type:
          "store_customer",

        /*
         * Purchasing from a store does not automatically mean
         * the customer consented to marketing.
         */
        on_mailing_list:
          false,

        mailing_list_category:
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .select("*")
      .single();

  if (
    error
  ) {
    console.error(
      "[TOTS CRM] Customer creation failed:",
      error
    );

    throw error;
  }

  console.log(
    `[TOTS CRM] Created customer ${data.id}.`
  );

  return data as
    CustomerRow;
}

// ============================================================
// UPDATE CUSTOMER DETAILS
// ============================================================

async function updateCustomerDetails({
  customer,
  organisationId,
  name,
  email,
  phone,
  address,
}: {
  customer:
    CustomerRow;

  organisationId:
    string;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const payload: Record<
    string,
    unknown
  > = {
    stage:
      "client",

    status:
      "live",

    client_type:
      customer.client_type ||
      "store_customer",

    updated_at:
      new Date()
        .toISOString(),
  };

  if (
    !asString(
      customer.name
    ) &&
    name
  ) {
    payload.name =
      name;
  }

  if (
    !normaliseEmail(
      customer.email
    ) &&
    email
  ) {
    payload.email =
      email;
  }

  if (
    !asString(
      customer.phone
    ) &&
    phone
  ) {
    payload.phone =
      phone;
  }

  if (
    !asString(
      customer.address
    ) &&
    address
  ) {
    payload.address =
      address;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "customers"
      )
      .update(
        payload
      )
      .eq(
        "id",
        customer.id
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .select("*")
      .single();

  if (
    error
  ) {
    console.error(
      "[TOTS CRM] Customer update failed:",
      error
    );

    throw error;
  }

  return data as
    CustomerRow;
}

// ============================================================
// FIND OR CREATE CUSTOMER
// ============================================================

async function findOrCreateCustomer({
  order,
  name,
  email,
  phone,
  address,
}: {
  order:
    StoreOrderRow;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const existingOrderCustomerId =
    asString(
      order.customer_id
    );

  if (
    existingOrderCustomerId
  ) {
    const customer =
      await findCustomerById({
        organisationId:
          order.organisation_id,

        customerId:
          existingOrderCustomerId,
      });

    if (
      customer
    ) {
      return updateCustomerDetails({
        customer,

        organisationId:
          order.organisation_id,

        name,
        email,
        phone,
        address,
      });
    }
  }

  if (
    email
  ) {
    const customer =
      await findCustomerByEmail({
        organisationId:
          order.organisation_id,

        email,
      });

    if (
      customer
    ) {
      return updateCustomerDetails({
        customer,

        organisationId:
          order.organisation_id,

        name,
        email,
        phone,
        address,
      });
    }
  }

  return createCustomer({
    organisationId:
      order.organisation_id,

    name,
    email,
    phone,
    address,
  });
}

// ============================================================
// FIND CONTACT BY CUSTOMER ID
// ============================================================

async function findContactByCustomerId({
  organisationId,
  customerId,
}: {
  organisationId:
    string;

  customerId:
    string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "contacts"
      )
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .eq(
        "customer_id",
        customerId
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | CrmContactRow
    | null;
}

// ============================================================
// FIND CONTACT BY EMAIL
// ============================================================

async function findContactByEmail({
  organisationId,
  email,
}: {
  organisationId:
    string;

  email:
    string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "contacts"
      )
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .ilike(
        "email",
        email
      )
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data as
    | CrmContactRow
    | null;
}

// ============================================================
// UPDATE CRM CONTACT
// ============================================================

async function updateCrmContact({
  contact,
  customerId,
  organisationId,
  name,
  email,
  phone,
  address,
}: {
  contact:
    CrmContactRow;

  customerId:
    string;

  organisationId:
    string;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const payload: Record<
    string,
    unknown
  > = {
    customer_id:
      customerId,

    role:
      "client",

    updated_at:
      new Date()
        .toISOString(),
  };

  if (
    !asString(
      contact.name
    ) &&
    name
  ) {
    payload.name =
      name;
  }

  if (
    !normaliseEmail(
      contact.email
    ) &&
    email
  ) {
    payload.email =
      email;
  }

  if (
    !asString(
      contact.phone
    ) &&
    phone
  ) {
    payload.phone =
      phone;
  }

  if (
    !asString(
      contact.address
    ) &&
    address
  ) {
    payload.address =
      address;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "contacts"
      )
      .update(
        payload
      )
      .eq(
        "id",
        contact.id
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .select("*")
      .single();

  if (
    error
  ) {
    throw error;
  }

  return data as
    CrmContactRow;
}

// ============================================================
// CREATE CRM CONTACT
// ============================================================

async function createCrmContact({
  customerId,
  organisationId,
  name,
  email,
  phone,
  address,
}: {
  customerId:
    string;

  organisationId:
    string;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "contacts"
      )
      .insert({
        organisation_id:
          organisationId,

        customer_id:
          customerId,

        name,

        email,

        phone,

        address,

        role:
          "client",

        company_name:
          null,

        company_details:
          "Created automatically after a TOTS-OS storefront purchase.",

        updated_at:
          new Date()
            .toISOString(),
      })
      .select("*")
      .single();

  if (
    error
  ) {
    throw error;
  }

  return data as
    CrmContactRow;
}

// ============================================================
// FIND / CREATE CRM CONTACT
// ============================================================

async function findOrCreateCrmContact({
  customer,
  order,
  name,
  email,
  phone,
  address,
}: {
  customer:
    CustomerRow;

  order:
    StoreOrderRow;

  name:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  address:
    string | null;
}) {
  const customerContact =
    await findContactByCustomerId({
      organisationId:
        order.organisation_id,

      customerId:
        customer.id,
    });

  if (
    customerContact
  ) {
    return updateCrmContact({
      contact:
        customerContact,

      customerId:
        customer.id,

      organisationId:
        order.organisation_id,

      name,
      email,
      phone,
      address,
    });
  }

  if (
    email
  ) {
    const emailContact =
      await findContactByEmail({
        organisationId:
          order.organisation_id,

        email,
      });

    if (
      emailContact
    ) {
      return updateCrmContact({
        contact:
          emailContact,

        customerId:
          customer.id,

        organisationId:
          order.organisation_id,

        name,
        email,
        phone,
        address,
      });
    }
  }

  return createCrmContact({
    customerId:
      customer.id,

    organisationId:
      order.organisation_id,

    name,
    email,
    phone,
    address,
  });
}

// ============================================================
// LINK ORDER TO CUSTOMER
// ============================================================

async function linkOrderToCustomer({
  order,
  customerId,
}: {
  order:
    StoreOrderRow;

  customerId:
    string;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        customer_id:
          customerId,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      );

  if (
    error
  ) {
    throw error;
  }
}

// ============================================================
// SYNC ORDER TO CRM
// ============================================================

async function syncOrderToCrm({
  order,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
}: {
  order:
    StoreOrderRow;

  customerName:
    string | null;

  customerEmail:
    string | null;

  customerPhone:
    string | null;

  customerAddress:
    string | null;
}) {
  if (
    !customerEmail &&
    !customerName
  ) {
    console.warn(
      `[TOTS CRM] ${order.order_number} has no customer identity.`
    );

    return null;
  }

  const customer =
    await findOrCreateCustomer({
      order,

      name:
        customerName,

      email:
        customerEmail,

      phone:
        customerPhone,

      address:
        customerAddress,
    });

  await linkOrderToCustomer({
    order,

    customerId:
      customer.id,
  });

  const contact =
    await findOrCreateCrmContact({
      customer,

      order,

      name:
        customerName,

      email:
        customerEmail,

      phone:
        customerPhone,

      address:
        customerAddress,
    });

  console.log(
    `[TOTS CRM] ${order.order_number} synced to customer ${customer.id}.`
  );

  return {
    customer,
    contact,
  };
}

// ============================================================
// CLAIM PAYMENT FOR PROCESSING
//
// This stops two simultaneous Stripe webhook deliveries from
// both reducing inventory.
//
// pending -> processing
// ============================================================

async function claimOrderForPaymentProcessing(
  order:
    StoreOrderRow
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "processing",

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .eq(
        "payment_status",
        "pending"
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return Boolean(
    data
  );
}

// ============================================================
// RELEASE PROCESSING CLAIM
// ============================================================

async function releasePaymentProcessingClaim(
  order:
    StoreOrderRow
) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "pending",

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .eq(
        "payment_status",
        "processing"
      );

  if (
    error
  ) {
    console.error(
      `[TOTS STORE] Could not release processing state for ${order.order_number}:`,
      error
    );
  }
}

// ============================================================
// REDUCE STOCK
// ============================================================

async function reduceOrderStock(
  order:
    StoreOrderRow
) {
  const items =
    await getOrderItems(
      order.id
    );

  for (
    const item of
    items
  ) {
    if (
      !item.product_id
    ) {
      continue;
    }

    const {
      data:
        productData,

      error:
        productError,
    } =
      await supabaseAdmin
        .from(
          "store_products"
        )
        .select(
          `
            id,
            organisation_id,
            name,
            stock,
            inventory_quantity,
            track_inventory,
            is_active,
            status
          `
        )
        .eq(
          "id",
          item.product_id
        )
        .eq(
          "organisation_id",
          order.organisation_id
        )
        .maybeSingle();

    if (
      productError
    ) {
      throw productError;
    }

    if (
      !productData
    ) {
      console.warn(
        `[TOTS STORE] Product ${item.product_id} no longer exists.`
      );

      continue;
    }

    const product =
      productData as
        StoreProductRow;

    if (
      product.track_inventory ===
      false
    ) {
      continue;
    }

    const quantityPurchased =
      Math.max(
        0,
        safeInteger(
          item.quantity,
          0
        )
      );

    if (
      quantityPurchased <=
      0
    ) {
      continue;
    }

    const currentInventory =
      Math.max(
        0,
        safeInteger(
          product.inventory_quantity,
          0
        )
      );

    const currentStock =
      Math.max(
        0,
        safeInteger(
          product.stock,
          currentInventory
        )
      );

    const newInventory =
      Math.max(
        0,
        currentInventory -
          quantityPurchased
      );

    const newStock =
      Math.max(
        0,
        currentStock -
          quantityPurchased
      );

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "store_products"
        )
        .update({
          inventory_quantity:
            newInventory,

          stock:
            newStock,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          product.id
        )
        .eq(
          "organisation_id",
          order.organisation_id
        );

    if (
      updateError
    ) {
      throw updateError;
    }

    console.log(
      `[TOTS STORE] Reduced ${product.name} by ${quantityPurchased}. Inventory now ${newInventory}.`
    );
  }
}

// ============================================================
// INCREMENT DISCOUNT USAGE
// ============================================================

async function incrementDiscountUsage({
  session,
  organisationId,
}: {
  session:
    Stripe.Checkout.Session;

  organisationId:
    string;
}) {
  const discountId =
    asString(
      session
        .metadata
        ?.discount_id
    );

  if (
    !discountId
  ) {
    return;
  }

  const {
    data:
      discount,

    error:
      lookupError,
  } =
    await supabaseAdmin
      .from(
        "store_discounts"
      )
      .select(
        "id, times_used"
      )
      .eq(
        "id",
        discountId
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .maybeSingle();

  if (
    lookupError
  ) {
    throw lookupError;
  }

  if (
    !discount
  ) {
    console.warn(
      `[TOTS STORE] Discount ${discountId} no longer exists.`
    );

    return;
  }

  const timesUsed =
    Math.max(
      0,
      safeInteger(
        discount.times_used,
        0
      )
    );

  const {
    error:
      updateError,
  } =
    await supabaseAdmin
      .from(
        "store_discounts"
      )
      .update({
        times_used:
          timesUsed + 1,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        discountId
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (
    updateError
  ) {
    throw updateError;
  }
}

// ============================================================
// FINALISE PAID ORDER
// ============================================================

async function finaliseOrderPaid({
  order,
  session,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  stripeTotal,
  eventStripeAccountId,
}: {
  order:
    StoreOrderRow;

  session:
    Stripe.Checkout.Session;

  customerName:
    string | null;

  customerEmail:
    string | null;

  customerPhone:
    string | null;

  shippingAddress:
    | Record<string, unknown>
    | null;

  stripeTotal:
    number;

  eventStripeAccountId:
    string | null;
}) {
  const paymentIntentId =
    getPaymentIntentId(
      session
    );

  const stripeCustomerId =
    getStripeCustomerId(
      session
    );

  const accountId =
    eventStripeAccountId ||
    asString(
      session
        .metadata
        ?.stripe_account_id
    ) ||
    asString(
      order
        .stripe_account_id
    );

  const now =
    new Date()
      .toISOString();

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        customer_name:
          customerName,

        customer_email:
          customerEmail,

        customer_phone:
          customerPhone,

        shipping_address:
          shippingAddress,

        total:
          stripeTotal,

        currency:
          (
            session.currency ||
            order.currency ||
            "gbp"
          ).toLowerCase(),

        payment_status:
          "paid",

        fulfilment_status:
          order.fulfilment_status ||
          "new",

        stripe_account_id:
          accountId,

        stripe_checkout_session_id:
          session.id,

        stripe_payment_intent_id:
          paymentIntentId,

        stripe_customer_id:
          stripeCustomerId,

        checkout_completed_at:
          now,

        paid_at:
          now,

        updated_at:
          now,
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .eq(
        "payment_status",
        "processing"
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    !data
  ) {
    throw new Error(
      `Order ${order.order_number} could not be finalised as paid.`
    );
  }
}

// ============================================================
// COMPLETE ORDER
// ============================================================

async function completeStoreOrder({
  session,
  eventStripeAccountId,
}: {
  session:
    Stripe.Checkout.Session;

  eventStripeAccountId:
    string | null;
}) {
  // ==========================================================
  // ORDER ID
  // ==========================================================

  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    console.warn(
      `[TOTS STORE] Checkout ${session.id} has no order_id metadata.`
    );

    return;
  }

  // ==========================================================
  // ORDER
  // ==========================================================

  let order =
    await getOrder(
      orderId
    );

  if (
    !order
  ) {
    console.error(
      "[TOTS STORE] Store order not found:",
      orderId
    );

    return;
  }

  // ==========================================================
  // ORGANISATION METADATA
  // ==========================================================

  const metadataOrganisationId =
    asString(
      session
        .metadata
        ?.organisation_id
    );

  if (
    metadataOrganisationId &&
    metadataOrganisationId !==
      order.organisation_id
  ) {
    throw new Error(
      `Organisation mismatch for order ${order.order_number}.`
    );
  }

  // ==========================================================
  // CONNECTED ACCOUNT
  // ==========================================================

  await verifyOrderStripeAccount({
    order,

    eventStripeAccountId,
  });

  // ==========================================================
  // SAVE REFERENCES
  // ==========================================================

  await saveStripeReferences({
    order,

    session,

    eventStripeAccountId,
  });

  // ==========================================================
  // RELOAD AFTER REFERENCE UPDATE
  // ==========================================================

  order =
    (
      await getOrder(
        order.id
      )
    ) ||
    order;

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  const customerName =
    getCustomerName(
      session
    ) ||
    order.customer_name;

  const customerEmail =
    getCustomerEmail(
      session
    ) ||
    normaliseEmail(
      order.customer_email
    );

  const customerPhone =
    getCustomerPhone(
      session
    ) ||
    order.customer_phone;

  const shippingAddress =
    getShippingAddress(
      session
    ) ||
    order.shipping_address;

  const customerAddress =
    getShippingAddressText(
      session
    );

  // ==========================================================
  // TOTAL
  // ==========================================================

  const stripeTotal =
    typeof session.amount_total ===
      "number"
      ? session.amount_total /
        100
      : safeNumber(
          order.total,
          0
        );

  // ==========================================================
  // ALREADY PAID
  //
  // Repair CRM / notification state without touching inventory.
  // ==========================================================

  if (
    order.payment_status ===
    "paid"
  ) {
    console.log(
      `[TOTS STORE] ${order.order_number} already paid.`
    );

    try {
      await syncOrderToCrm({
        order,

        customerName,

        customerEmail,

        customerPhone,

        customerAddress,
      });
    } catch (
      crmError
    ) {
      console.error(
        `[TOTS CRM] Repair failed for ${order.order_number}:`,
        crmError
      );
    }

    await createOrderNotifications({
      order,

      customerName,

      customerEmail,

      total:
        safeNumber(
          order.total,
          stripeTotal
        ),
    });

    return;
  }

  // ==========================================================
  // PAYMENT MUST ACTUALLY BE PAID
  // ==========================================================

  if (
    session.payment_status !==
    "paid"
  ) {
    console.log(
      `[TOTS STORE] ${session.id} completed with payment_status=${session.payment_status}.`
    );

    return;
  }

  // ==========================================================
  // PROCESSING STATE
  //
  // Another webhook delivery may currently be processing this
  // exact order.
  // ==========================================================

  if (
    order.payment_status ===
    "processing"
  ) {
    console.log(
      `[TOTS STORE] ${order.order_number} is already being processed.`
    );

    return;
  }

  // ==========================================================
  // CLAIM ORDER
  // ==========================================================

  const claimed =
    await claimOrderForPaymentProcessing(
      order
    );

  if (
    !claimed
  ) {
    const latest =
      await getOrder(
        order.id
      );

    if (
      latest?.payment_status ===
      "paid"
    ) {
      await createOrderNotifications({
        order:
          latest,

        customerName,

        customerEmail,

        total:
          safeNumber(
            latest.total,
            stripeTotal
          ),
      });
    }

    return;
  }

  // ==========================================================
  // INVENTORY
  // ==========================================================

  try {
    await reduceOrderStock(
      order
    );
  } catch (
    inventoryError
  ) {
    console.error(
      `[TOTS STORE] Inventory failed for ${order.order_number}:`,
      inventoryError
    );

    /*
     * Release processing so Stripe can retry this event.
     */
    await releasePaymentProcessingClaim(
      order
    );

    throw inventoryError;
  }

  // ==========================================================
  // DISCOUNT USAGE
  // ==========================================================

  try {
    await incrementDiscountUsage({
      session,

      organisationId:
        order.organisation_id,
    });
  } catch (
    discountError
  ) {
    /*
     * Do not fail a paid order because discount analytics
     * couldn't increment.
     */

    console.error(
      `[TOTS STORE] Discount usage update failed for ${order.order_number}:`,
      discountError
    );
  }

  // ==========================================================
  // FINALISE ORDER
  // ==========================================================

  try {
    await finaliseOrderPaid({
      order,

      session,

      customerName,

      customerEmail,

      customerPhone,

      shippingAddress,

      stripeTotal,

      eventStripeAccountId,
    });
  } catch (
    finaliseError
  ) {
    /*
     * Do NOT reset to pending here.
     *
     * Stock has already been reduced.
     *
     * Resetting and retrying the whole operation would risk
     * reducing stock twice.
     */

    console.error(
      `[TOTS STORE] Final paid status failed for ${order.order_number}:`,
      finaliseError
    );

    throw finaliseError;
  }

  console.log(
    `[TOTS STORE] ${order.order_number} marked paid.`
  );

  // ==========================================================
  // UPDATED ORDER
  // ==========================================================

  const updatedOrder =
    await getOrder(
      order.id
    );

  if (
    !updatedOrder
  ) {
    return;
  }

  // ==========================================================
  // CRM
  // ==========================================================

  try {
    await syncOrderToCrm({
      order:
        updatedOrder,

      customerName,

      customerEmail,

      customerPhone,

      customerAddress,
    });
  } catch (
    crmError
  ) {
    /*
     * CRM sync is deliberately non-fatal.
     */

    console.error(
      `[TOTS CRM] CRM sync failed for ${updatedOrder.order_number}:`,
      crmError
    );
  }

  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  await createOrderNotifications({
    order:
      updatedOrder,

    customerName,

    customerEmail,

    total:
      safeNumber(
        updatedOrder.total,
        stripeTotal
      ),
  });
}

// ============================================================
// ASYNC PAYMENT FAILURE
// ============================================================

async function markOrderPaymentFailed({
  session,
  eventStripeAccountId,
}: {
  session:
    Stripe.Checkout.Session;

  eventStripeAccountId:
    string | null;
}) {
  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    return;
  }

  const order =
    await getOrder(
      orderId
    );

  if (
    !order
  ) {
    return;
  }

  await verifyOrderStripeAccount({
    order,

    eventStripeAccountId,
  });

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "pending",

        stripe_checkout_session_id:
          session.id,

        stripe_payment_intent_id:
          getPaymentIntentId(
            session
          ),

        stripe_customer_id:
          getStripeCustomerId(
            session
          ),

        stripe_account_id:
          eventStripeAccountId ||
          order.stripe_account_id ||
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    `[TOTS STORE] ${order.order_number} async payment failed.`
  );
}

// ============================================================
// PAYMENT INTENT CANCELLED
// ============================================================

async function handlePaymentIntentCancelled({
  paymentIntent,
  eventStripeAccountId,
}: {
  paymentIntent:
    Stripe.PaymentIntent;

  eventStripeAccountId:
    string | null;
}) {
  const orderId =
    asString(
      paymentIntent
        .metadata
        ?.order_id
    );

  if (
    !orderId
  ) {
    return;
  }

  const order =
    await getOrder(
      orderId
    );

  if (
    !order
  ) {
    return;
  }

  await verifyOrderStripeAccount({
    order,

    eventStripeAccountId,
  });

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          "pending",

        stripe_payment_intent_id:
          paymentIntent.id,

        stripe_account_id:
          eventStripeAccountId ||
          order.stripe_account_id ||
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    `[TOTS STORE] PaymentIntent ${paymentIntent.id} cancelled for ${order.order_number}.`
  );
}

// ============================================================
// SYNC REFUND STATUS FROM CHARGE
// ============================================================

async function syncChargeRefundStatus({
  charge,
  eventStripeAccountId,
}: {
  charge:
    Stripe.Charge;

  eventStripeAccountId:
    string | null;
}) {
  const paymentIntentId =
    typeof charge.payment_intent ===
    "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ||
        null;

  let orderId =
    asString(
      charge
        .metadata
        ?.order_id
    );

  let order:
    | StoreOrderRow
    | null =
    null;

  if (
    orderId
  ) {
    order =
      await getOrder(
        orderId
      );
  }

  if (
    !order &&
    paymentIntentId
  ) {
    order =
      await getOrderByPaymentIntent(
        paymentIntentId
      );
  }

  if (
    !order
  ) {
    console.warn(
      `[TOTS STORE] Could not find order for refunded charge ${charge.id}.`
    );

    return;
  }

  await verifyOrderStripeAccount({
    order,

    eventStripeAccountId,
  });

  const amountRefunded =
    safeNumber(
      charge.amount_refunded,
      0
    );

  const originalAmount =
    safeNumber(
      charge.amount,
      0
    );

  const fullyRefunded =
    charge.refunded ===
      true ||
    (
      originalAmount >
        0 &&
      amountRefunded >=
        originalAmount
    );

  const paymentStatus =
    fullyRefunded
      ? "refunded"
      : "partially_refunded";

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "store_orders"
      )
      .update({
        payment_status:
          paymentStatus,

        stripe_payment_intent_id:
          paymentIntentId ||
          order.stripe_payment_intent_id ||
          null,

        stripe_account_id:
          eventStripeAccountId ||
          order.stripe_account_id ||
          null,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      );

  if (
    error
  ) {
    throw error;
  }

  console.log(
    `[TOTS STORE] ${order.order_number} marked ${paymentStatus}.`
  );
}

// ============================================================
// REFUND CREATED
//
// This gives us the amount of THIS refund rather than the
// cumulative refunded amount on charge.refunded.
// ============================================================

async function handleRefundCreated({
  refund,
  eventStripeAccountId,
}: {
  refund:
    Stripe.Refund;

  eventStripeAccountId:
    string | null;
}) {
  const paymentIntentId =
    typeof refund.payment_intent ===
    "string"
      ? refund.payment_intent
      : refund.payment_intent?.id ||
        null;

  const metadataOrderId =
    asString(
      refund
        .metadata
        ?.order_id
    );

  let order:
    | StoreOrderRow
    | null =
    null;

  if (
    metadataOrderId
  ) {
    order =
      await getOrder(
        metadataOrderId
      );
  }

  if (
    !order &&
    paymentIntentId
  ) {
    order =
      await getOrderByPaymentIntent(
        paymentIntentId
      );
  }

  if (
    !order
  ) {
    console.warn(
      `[TOTS STORE] Could not identify order for refund ${refund.id}.`
    );

    return;
  }

  await verifyOrderStripeAccount({
    order,

    eventStripeAccountId,
  });

  /*
   * We use charge.refunded for authoritative full/partial
   * status synchronisation.
   *
   * refund.created is ideal for notifying the business of the
   * exact amount refunded.
   */

  await createRefundNotifications({
    order,

    refundId:
      refund.id,

    amount:
      refund.amount /
      100,
  });
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  // ==========================================================
  // WEBHOOK SECRET
  // ==========================================================

  const stripeWebhookSecret =
    process.env
      .STRIPE_STORE_WEBHOOK_SECRET
      ?.trim();

  if (
    !stripeWebhookSecret
  ) {
    console.error(
      "[TOTS STORE WEBHOOK] STRIPE_STORE_WEBHOOK_SECRET is not configured."
    );

    return NextResponse.json(
      {
        error:
          "Stripe store webhook secret is not configured.",
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

  // ==========================================================
  // SIGNATURE
  // ==========================================================

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (
    !signature
  ) {
    console.error(
      "[TOTS STORE WEBHOOK] Missing stripe-signature."
    );

    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
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

  // ==========================================================
  // RAW BODY
  //
  // Stripe signature validation requires the untouched body.
  // ==========================================================

  let body:
    string;

  try {
    body =
      await req.text();
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS STORE WEBHOOK] Could not read body:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read webhook body.",
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

  // ==========================================================
  // VERIFY WEBHOOK
  // ==========================================================

  let event:
    Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret
      );
  } catch (
    error:
      unknown
  ) {
    console.error(
      "[TOTS STORE WEBHOOK] Signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? `Webhook signature verification failed: ${error.message}`
            : "Invalid webhook signature.",
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

  // ==========================================================
  // CONNECTED STRIPE ACCOUNT
  //
  // For connected-account events Stripe supplies event.account.
  // ==========================================================

  const eventStripeAccountId =
    getEventStripeAccountId(
      event
    );

  console.log(
    `[TOTS STORE WEBHOOK] ${event.type} (${event.id}) account=${
      eventStripeAccountId ||
      "platform"
    }`
  );

  // ==========================================================
  // PROCESS EVENT
  // ==========================================================

  try {
    switch (
      event.type
    ) {
      // ======================================================
      // CHECKOUT COMPLETE
      // ======================================================

      case "checkout.session.completed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await completeStoreOrder({
          session,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // ASYNC PAYMENT SUCCEEDED
      // ======================================================

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await completeStoreOrder({
          session,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // ASYNC PAYMENT FAILED
      // ======================================================

      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await markOrderPaymentFailed({
          session,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // PAYMENT INTENT CANCELLED
      // ======================================================

      case "payment_intent.canceled": {
        const paymentIntent =
          event.data.object as
            Stripe.PaymentIntent;

        await handlePaymentIntentCancelled({
          paymentIntent,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // REFUND CREATED
      // ======================================================

      case "refund.created": {
        const refund =
          event.data.object as
            Stripe.Refund;

        await handleRefundCreated({
          refund,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // CHARGE REFUNDED
      //
      // Stripe Charge contains the cumulative refunded amount,
      // so this is used for authoritative order status.
      // ======================================================

      case "charge.refunded": {
        const charge =
          event.data.object as
            Stripe.Charge;

        await syncChargeRefundStatus({
          charge,

          eventStripeAccountId,
        });

        break;
      }

      // ======================================================
      // EVERYTHING ELSE
      // ======================================================

      default: {
        console.log(
          `[TOTS STORE WEBHOOK] Ignoring ${event.type}.`
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

        stripeAccountId:
          eventStripeAccountId,
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
      `[TOTS STORE WEBHOOK] Processing failed for ${event.type} (${event.id}):`,
      error
    );

    /*
     * 500 intentionally tells Stripe that processing failed and
     * that it should retry the webhook.
     */

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Webhook processing failed.",

        event:
          event.type,

        eventId:
          event.id,

        stripeAccountId:
          eventStripeAccountId,
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