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
//
// These are required for the route itself to function.
//
// IMPORTANT:
// STRIPE_STORE_WEBHOOK_SECRET is intentionally NOT resolved
// here. Next.js imports route files during `next build`, so
// resolving that secret at module scope can break the entire
// build if the local environment does not contain it.
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

  customer_id?: string | null;

  order_number: string;

  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  subtotal: number | string;
  discount_amount: number | string;
  shipping_amount: number | string;
  total: number | string;

  payment_status: string;
  fulfilment_status: string;

  shipping_address:
    | Record<string, unknown>
    | null;

  created_at: string;
  updated_at: string;
};

type StoreOrderItemRow = {
  id: string;

  order_id: string;

  product_id: string | null;

  product_name: string;

  sku: string | null;

  quantity: number;

  unit_price: number | string;
  total: number | string;

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

// ============================================================
// HELPERS
// ============================================================

function asString(
  value:
    | string
    | null
    | undefined
) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function normaliseEmail(
  value:
    | string
    | null
    | undefined
) {
  const email =
    asString(value);

  return email
    ? email.toLowerCase()
    : null;
}

function safeInteger(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.floor(number);
}

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
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

  if (collected) {
    return collected;
  }

  const legacySession =
    session as Stripe.Checkout.Session & {
      shipping_details?:
        | ShippingDetailsLike
        | null;
    };

  return (
    legacySession.shipping_details ??
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

  if (!shipping) {
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
              shipping.address.line1 ??
              null,

            line2:
              shipping.address.line2 ??
              null,

            city:
              shipping.address.city ??
              null,

            state:
              shipping.address.state ??
              null,

            postal_code:
              shipping.address
                .postal_code ??
              null,

            country:
              shipping.address.country ??
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

  if (!shipping?.address) {
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
      .map((value) =>
        asString(value)
      )
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      )
      .join(", ") ||
    null
  );
}

// ============================================================
// CUSTOMER DETAILS
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
      .from("store_orders")
      .select("*")
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

  if (error) {
    throw error;
  }

  return (
    data || []
  ) as StoreOrderItemRow[];
}

// ============================================================
// FIND CUSTOMER BY ID
// ============================================================

async function findCustomerById({
  organisationId,
  customerId,
}: {
  organisationId: string;
  customerId: string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("customers")
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

  if (error) {
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
  organisationId: string;
  email: string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("customers")
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .ilike(
        "email",
        email
      )
      .limit(1)
      .maybeSingle();

  if (error) {
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
  organisationId: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("customers")
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

        on_mailing_list:
          true,

        mailing_list_category:
          "Customers",

        updated_at:
          new Date().toISOString(),
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "[TOTS CRM] Customer creation failed:",
      error
    );

    throw error;
  }

  console.log(
    `[TOTS CRM] Created customer ${data.id} for ${
      email ||
      name ||
      "store customer"
    }.`
  );

  return data as CustomerRow;
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
  customer: CustomerRow;

  organisationId: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
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
      new Date().toISOString(),
  };

  if (
    !asString(customer.name) &&
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
    !asString(customer.phone) &&
    phone
  ) {
    payload.phone =
      phone;
  }

  if (
    !asString(customer.address) &&
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
      .from("customers")
      .update(payload)
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

  if (error) {
    console.error(
      "[TOTS CRM] Customer update failed:",
      error
    );

    throw error;
  }

  return data as CustomerRow;
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
  order: StoreOrderRow;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
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

    if (customer) {
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

  if (email) {
    const customer =
      await findCustomerByEmail({
        organisationId:
          order.organisation_id,

        email,
      });

    if (customer) {
      console.log(
        `[TOTS CRM] Existing customer matched by email: ${email}`
      );

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
  organisationId: string;
  customerId: string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .eq(
        "customer_id",
        customerId
      )
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(
      "[TOTS CRM] Contact customer_id lookup failed:",
      error
    );

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
  organisationId: string;
  email: string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq(
        "organisation_id",
        organisationId
      )
      .ilike(
        "email",
        email
      )
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(
      "[TOTS CRM] Contact email lookup failed:",
      error
    );

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
  contact: CrmContactRow;

  customerId: string;
  organisationId: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
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
      new Date().toISOString(),
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
      .from("contacts")
      .update(payload)
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

  if (error) {
    console.error(
      "[TOTS CRM] Contact update failed:",
      error
    );

    throw error;
  }

  return data as CrmContactRow;
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
  customerId: string;
  organisationId: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("contacts")
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
          new Date().toISOString(),
      })
      .select("*")
      .single();

  if (error) {
    console.error(
      "[TOTS CRM] Contact creation failed:",
      error
    );

    throw error;
  }

  console.log(
    `[TOTS CRM] Created CRM contact ${data.id} linked to customer ${customerId}.`
  );

  return data as CrmContactRow;
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
  customer: CustomerRow;
  order: StoreOrderRow;

  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}) {
  const customerContact =
    await findContactByCustomerId({
      organisationId:
        order.organisation_id,

      customerId:
        customer.id,
    });

  if (customerContact) {
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

  if (email) {
    const emailContact =
      await findContactByEmail({
        organisationId:
          order.organisation_id,

        email,
      });

    if (emailContact) {
      console.log(
        `[TOTS CRM] Existing CRM contact matched by email: ${email}`
      );

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
  order: StoreOrderRow;
  customerId: string;
}) {
  const {
    error,
  } =
    await supabaseAdmin
      .from("store_orders")
      .update({
        customer_id:
          customerId,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      );

  if (error) {
    console.error(
      `[TOTS CRM] Order/customer link failed for ${order.order_number}:`,
      error
    );

    throw error;
  }

  console.log(
    `[TOTS CRM] Order ${order.order_number} linked to customer ${customerId}.`
  );
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
  order: StoreOrderRow;

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
      `[TOTS CRM] Order ${order.order_number} has no customer name or email. CRM sync skipped.`
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
    `[TOTS CRM] Store order ${order.order_number} synced. Customer: ${customer.id}. Contact: ${contact.id}.`
  );

  return {
    customer,
    contact,
  };
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
      console.error(
        `Could not load product ${item.product_id} for stock adjustment:`,
        productError
      );

      throw productError;
    }

    if (
      !productData
    ) {
      console.warn(
        `Product ${item.product_id} no longer exists.`
      );

      continue;
    }

    const product =
      productData as StoreProductRow;

    if (
      product.track_inventory ===
      false
    ) {
      console.log(
        `Skipping stock reduction for ${product.name} because inventory tracking is disabled.`
      );

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
            new Date().toISOString(),
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
      console.error(
        `Stock reduction failed for ${product.name}:`,
        updateError
      );

      throw updateError;
    }

    console.log(
      `[TOTS STORE] Reduced ${product.name} inventory by ${quantityPurchased}. New inventory: ${newInventory}.`
    );
  }
}

// ============================================================
// MARK ORDER PAID
// ============================================================

async function markOrderPaid({
  order,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  stripeTotal,
}: {
  order: StoreOrderRow;

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
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("store_orders")
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

        payment_status:
          "paid",

        fulfilment_status:
          order.fulfilment_status ||
          "new",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        order.id
      )
      .eq(
        "organisation_id",
        order.organisation_id
      )
      .neq(
        "payment_status",
        "paid"
      )
      .select(
        "id"
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// ============================================================
// COMPLETE ORDER
// ============================================================

async function completeStoreOrder(
  session:
    Stripe.Checkout.Session
) {
  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (!orderId) {
    console.warn(
      "[TOTS STORE] Stripe Checkout session has no order_id metadata:",
      session.id
    );

    return;
  }

  const order =
    await getOrder(
      orderId
    );

  if (!order) {
    console.error(
      "[TOTS STORE] Store order not found:",
      orderId
    );

    return;
  }

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
  // ALREADY PAID
  // ==========================================================

  if (
    order.payment_status ===
    "paid"
  ) {
    console.log(
      `[TOTS STORE] Order ${order.order_number} already paid. Inventory reduction skipped.`
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
        `[TOTS CRM] Existing paid order sync failed for ${order.order_number}:`,
        crmError
      );
    }

    return;
  }

  // ==========================================================
  // PAYMENT MUST BE PAID
  // ==========================================================

  if (
    session.payment_status !==
    "paid"
  ) {
    console.log(
      `[TOTS STORE] Checkout ${session.id} completed with payment status ${session.payment_status}.`
    );

    return;
  }

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
  // INVENTORY
  // ==========================================================

  await reduceOrderStock(
    order
  );

  // ==========================================================
  // MARK ORDER PAID
  // ==========================================================

  const markedPaid =
    await markOrderPaid({
      order,

      customerName,

      customerEmail,

      customerPhone,

      shippingAddress,

      stripeTotal,
    });

  if (!markedPaid) {
    console.log(
      `[TOTS STORE] Order ${order.order_number} was already processed by another webhook execution.`
    );

    return;
  }

  console.log(
    `[TOTS STORE] Order ${order.order_number} marked paid.`
  );

  const updatedOrder =
    await getOrder(
      order.id
    );

  if (!updatedOrder) {
    return;
  }

  // ==========================================================
  // CRM SYNC
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
    console.error(
      `[TOTS CRM] CRM sync failed for paid order ${updatedOrder.order_number}:`,
      crmError
    );
  }
}

// ============================================================
// ASYNC PAYMENT FAILURE
// ============================================================

async function markOrderPaymentFailed(
  session:
    Stripe.Checkout.Session
) {
  const orderId =
    asString(
      session
        .metadata
        ?.order_id
    );

  if (!orderId) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from("store_orders")
      .update({
        payment_status:
          "pending",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (error) {
    throw error;
  }

  console.log(
    `[TOTS STORE] Order ${orderId} async payment failed.`
  );
}

// ============================================================
// PAYMENT INTENT CANCELLED
// ============================================================

async function handlePaymentIntentCancelled(
  paymentIntent:
    Stripe.PaymentIntent
) {
  const orderId =
    asString(
      paymentIntent
        .metadata
        ?.order_id
    );

  if (!orderId) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from("store_orders")
      .update({
        payment_status:
          "pending",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        orderId
      )
      .neq(
        "payment_status",
        "paid"
      );

  if (error) {
    throw error;
  }

  console.log(
    `[TOTS STORE] PaymentIntent cancelled for order ${orderId}.`
  );
}

// ============================================================
// POST
// ============================================================

export async function POST(
  req: Request
) {
  // ==========================================================
  // WEBHOOK SECRET
  //
  // IMPORTANT:
  // This MUST remain inside POST().
  //
  // Putting requireEnv("STRIPE_STORE_WEBHOOK_SECRET") at module
  // scope causes `next build` to fail when the local machine
  // doesn't have the Stripe webhook signing secret.
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
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // STRIPE SIGNATURE
  // ==========================================================

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    console.error(
      "[TOTS STORE WEBHOOK] Missing stripe-signature header."
    );

    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
      },
      {
        status: 400,

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
  // Never use req.json() here.
  // Stripe verifies the exact raw request body.
  // ==========================================================

  let body:
    string;

  try {
    body =
      await req.text();
  } catch (
    error: unknown
  ) {
    console.error(
      "[TOTS STORE WEBHOOK] Could not read request body:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not read webhook body.",
      },
      {
        status: 400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  // ==========================================================
  // VERIFY STRIPE EVENT
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
    error: unknown
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
        status: 400,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  console.log(
    `[TOTS STORE WEBHOOK] Received ${event.type} (${event.id})`
  );

  // ==========================================================
  // HANDLE EVENT
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

        await completeStoreOrder(
          session
        );

        break;
      }

      // ======================================================
      // ASYNC PAYMENT SUCCESS
      // ======================================================

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await completeStoreOrder(
          session
        );

        break;
      }

      // ======================================================
      // ASYNC PAYMENT FAILURE
      // ======================================================

      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as
            Stripe.Checkout.Session;

        await markOrderPaymentFailed(
          session
        );

        break;
      }

      // ======================================================
      // PAYMENT INTENT CANCELLED
      // ======================================================

      case "payment_intent.canceled": {
        const paymentIntent =
          event.data.object as
            Stripe.PaymentIntent;

        await handlePaymentIntentCancelled(
          paymentIntent
        );

        break;
      }

      // ======================================================
      // OTHER EVENTS
      // ======================================================

      default: {
        console.log(
          `[TOTS STORE WEBHOOK] Ignoring unhandled event ${event.type}.`
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
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      `[TOTS STORE WEBHOOK] Processing failed for ${event.type} (${event.id}):`,
      error
    );

    /*
     * Returning HTTP 500 is intentional here.
     *
     * Stripe will retry the webhook if important processing
     * such as payment state or inventory management fails.
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