"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BadgePercent,
  Boxes,
  Check,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  Mail,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import { supabase } from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

type StoreTab =
  | "Overview"
  | "Products"
  | "Orders"
  | "Payments"
  | "Inventory"
  | "Discounts"
  | "Settings";

type ProductStatus =
  | "active"
  | "draft"
  | "archived";

type OrderStatus =
  | "new"
  | "processing"
  | "dispatched"
  | "delivered"
  | "cancelled";

type PaymentStatus =
  | "paid"
  | "pending"
  | "refunded";

type DiscountType =
  | "percentage"
  | "fixed";

type DiscountStatus =
  | "Active"
  | "Inactive"
  | "Scheduled"
  | "Expired"
  | "Used up";

type Product = {
  id: string;

  organisation_id: string;

  name: string;

  slug: string;

  sku: string;

  category: string;

  description: string;

  price: number;

  compare_at_price:
    | number
    | null;

  /**
   * UI-friendly property.
   *
   * Database column is cost_price.
   */
  cost: number;

  stock: number;

  inventory_quantity: number;

  low_stock_threshold: number;

  track_inventory: boolean;

  status: ProductStatus;

  image_url:
    | string
    | null;

  images: string[];

  featured: boolean;

  sort_order:
    | number
    | null;

  is_active: boolean;

  created_at:
    | string
    | null;

  orders: number;

  revenue: number;
};

type Order = {
  id: string;

  organisation_id: string;

  number: string;

  customer: string;

  email: string;

  total: number;

  status: OrderStatus;

  paymentStatus:
    PaymentStatus;

  items: number;

  createdAt: string;

  raw:
    Record<
      string,
      unknown
    >;
};

type StoreSettingsRow = {
  id: string;

  organisation_id: string;

  slug: string;

  store_name:
    | string
    | null;

  store_description:
    | string
    | null;

  hero_title:
    | string
    | null;

  hero_text:
    | string
    | null;

  announcement:
    | string
    | null;

  accent_colour:
    | string
    | null;

  shipping_text:
    | string
    | null;

  support_email:
    | string
    | null;

  is_live:
    | boolean
    | null;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
};

type ProductForm = {
  id?: string;

  name: string;

  slug: string;

  sku: string;

  category: string;

  description: string;

  price: string;

  compareAtPrice:
    string;

  cost: string;

  stock: string;

  imageUrl: string;

  featured: boolean;

  trackInventory:
    boolean;

  status:
    ProductStatus;
};

type Discount = {
  id: string;

  organisation_id: string;

  code: string;

  description: string;

  discount_type:
    DiscountType;

  value: number;

  minimum_order_amount:
    number;

  maximum_discount_amount:
    | number
    | null;

  usage_limit:
    | number
    | null;

  usage_count: number;

  starts_at:
    | string
    | null;

  expires_at:
    | string
    | null;

  is_active: boolean;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;
};

type DiscountForm = {
  id?: string;

  code: string;

  description:
    string;

  discountType:
    DiscountType;

  value: string;

  minimumOrderAmount:
    string;

  maximumDiscountAmount:
    string;

  usageLimit:
    string;

  startsAt:
    string;

  expiresAt:
    string;

  active:
    boolean;
};

type StockAdjustState = {
  product: Product;

  quantity: string;
};

type OrganisationContext = {
  organisationId:
    string;

  organisationName:
    string;
};


type StripeAccountStatus = {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
};

type RefundFormState = {
  order: Order;
  amount: string;
  reason:
    | "requested_by_customer"
    | "duplicate"
    | "fraudulent";
};

type StoreSubscriptionStatus = {
  subscribed: boolean;
  storeEnabled: boolean;
  status: string | null;
  subscriptionId: string | null;
  customerId: string | null;
  priceId: string | null;
  expectedPriceId: string | null;
  correctProduct: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  needsPurchase: boolean;
  needsPaymentAttention: boolean;
  reason?: string | null;
};

// ============================================================
// DEFAULTS
// ============================================================

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "",
  slug: "",
  sku: "",
  category: "General",
  description: "",
  price: "",
  compareAtPrice: "",
  cost: "",
  stock: "",
  imageUrl: "",
  featured: false,
  trackInventory: true,
  status: "active",
};
const EMPTY_DISCOUNT_FORM: DiscountForm =
  {
    code: "",

    description:
      "",

    discountType:
      "percentage",

    value: "",

    minimumOrderAmount:
      "",

    maximumDiscountAmount:
      "",

    usageLimit:
      "",

    startsAt:
      "",

    expiresAt:
      "",

    active:
      true,
  };

// ============================================================
// HELPERS
// ============================================================

function firstString(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

function firstNumber(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "number" &&
      Number.isFinite(
        value
      )
    ) {
      return value;
    }

    if (
      typeof value ===
        "string" &&
      value.trim() !==
        ""
    ) {
      const parsed =
        Number(value);

      if (
        Number.isFinite(
          parsed
        )
      ) {
        return parsed;
      }
    }
  }

  return 0;
}

function safeBoolean(
  value: unknown,
  fallback = false
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return fallback;
}

function safeStringArray(
  value: unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item ===
        "string"
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function createSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /['’]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function generateSku(
  name: string
) {
  const prefix =
    name
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .slice(
        0,
        4
      )
      .toUpperCase() ||
    "PROD";

  return `${prefix}-${Date.now()
    .toString()
    .slice(-6)}`;
}

function normaliseOrderStatus(
  value: unknown
): OrderStatus {
  const status =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    status ===
    "processing"
  ) {
    return "processing";
  }

  if (
    status ===
      "dispatched" ||
    status ===
      "shipped"
  ) {
    return "dispatched";
  }

  if (
    status ===
      "delivered" ||
    status ===
      "complete" ||
    status ===
      "completed"
  ) {
    return "delivered";
  }

  if (
    status ===
      "cancelled" ||
    status ===
      "canceled"
  ) {
    return "cancelled";
  }

  return "new";
}

function normalisePaymentStatus(
  value: unknown
): PaymentStatus {
  const status =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    status ===
      "paid" ||
    status ===
      "succeeded" ||
    status ===
      "complete" ||
    status ===
      "completed"
  ) {
    return "paid";
  }

  if (
    status ===
      "refunded" ||
    status ===
      "refund"
  ) {
    return "refunded";
  }

  return "pending";
}

function formatDate(
  value: unknown
) {
  if (
    typeof value !==
      "string" ||
    !value
  ) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

function formatDateTimeLocal(
  value:
    | string
    | null
    | undefined
) {
  if (
    !value
  ) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const local =
    new Date(
      date.getTime() -
        date.getTimezoneOffset() *
          60000
    );

  return local
    .toISOString()
    .slice(
      0,
      16
    );
}

function getDiscountStatus(
  discount:
    Discount
): DiscountStatus {
  const now =
    Date.now();

  if (
    !discount.is_active
  ) {
    return "Inactive";
  }

  if (
    discount.starts_at
  ) {
    const starts =
      new Date(
        discount.starts_at
      ).getTime();

    if (
      !Number.isNaN(
        starts
      ) &&
      starts >
        now
    ) {
      return "Scheduled";
    }
  }

  if (
    discount.expires_at
  ) {
    const expires =
      new Date(
        discount.expires_at
      ).getTime();

    if (
      !Number.isNaN(
        expires
      ) &&
      expires <
        now
    ) {
      return "Expired";
    }
  }

  if (
    discount.usage_limit !==
      null &&
    discount.usage_count >=
      discount.usage_limit
  ) {
    return "Used up";
  }

  return "Active";
}

// ============================================================
// ORGANISATION RESOLUTION
// ============================================================

async function resolveOrganisationContext(): Promise<OrganisationContext> {
  const {
    data:
      authData,
    error:
      authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      "You need to be signed in to manage your store."
    );
  }

  const user =
    authData.user;

  // ==========================================================
  // USER ORGANISATIONS
  // ==========================================================

  try {
    const {
      data:
        membershipRows,
      error,
    } =
      await supabase
        .from(
          "user_organisations"
        )
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .limit(
          1
        );

    if (
      !error
    ) {
      const membership =
        membershipRows?.[0] as
          | Record<
              string,
              unknown
            >
          | undefined;

      const membershipOrgId =
        firstString(
          membership
            ?.organisation_id,

          membership
            ?.organization_id
        );

      if (
        membershipOrgId
      ) {
        const {
          data:
            organisation,
        } =
          await supabase
            .from(
              "organisations"
            )
            .select("*")
            .eq(
              "id",
              membershipOrgId
            )
            .maybeSingle();

        return {
          organisationId:
            membershipOrgId,

          organisationName:
            firstString(
              organisation?.name,

              organisation
                ?.company_name
            ) ||
            "My Business",
        };
      }
    }
  } catch (
    error
  ) {
    console.warn(
      "user_organisations lookup skipped:",
      error
    );
  }

  // ==========================================================
  // PROFILES
  // ==========================================================

  try {
    const {
      data:
        profile,
    } =
      await supabase
        .from(
          "profiles"
        )
        .select("*")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    const profileOrgId =
      firstString(
        profile
          ?.organisation_id,

        profile
          ?.organization_id
      );

    if (
      profileOrgId
    ) {
      const {
        data:
          organisation,
      } =
        await supabase
          .from(
            "organisations"
          )
          .select("*")
          .eq(
            "id",
            profileOrgId
          )
          .maybeSingle();

      return {
        organisationId:
          profileOrgId,

        organisationName:
          firstString(
            organisation?.name,

            organisation
              ?.company_name
          ) ||
          "My Business",
      };
    }
  } catch (
    error
  ) {
    console.warn(
      "profiles organisation lookup skipped:",
      error
    );
  }

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  try {
    const {
      data:
        memberRows,
    } =
      await supabase
        .from(
          "organisation_members"
        )
        .select("*")
        .eq(
          "user_id",
          user.id
        )
        .limit(
          1
        );

    const member =
      memberRows?.[0] as
        | Record<
            string,
            unknown
          >
        | undefined;

    const memberOrgId =
      firstString(
        member
          ?.organisation_id,

        member
          ?.organization_id
      );

    if (
      memberOrgId
    ) {
      const {
        data:
          organisation,
      } =
        await supabase
          .from(
            "organisations"
          )
          .select("*")
          .eq(
            "id",
            memberOrgId
          )
          .maybeSingle();

      return {
        organisationId:
          memberOrgId,

        organisationName:
          firstString(
            organisation?.name,

            organisation
              ?.company_name
          ) ||
          "My Business",
      };
    }
  } catch (
    error
  ) {
    console.warn(
      "organisation_members lookup skipped:",
      error
    );
  }

  throw new Error(
    "We couldn't work out which organisation this store belongs to."
  );
}

// ============================================================
// AUTHENTICATED API HEADERS
// ============================================================

async function getAuthenticatedApiHeaders(
  includeJson = false
): Promise<HeadersInit> {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (
    error ||
    !data.session?.access_token
  ) {
    throw new Error(
      "You need to sign in again."
    );
  }

  const headers:
    Record<string, string> =
    {
      Authorization:
        `Bearer ${data.session.access_token}`,
    };

  if (
    includeJson
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
}

// ============================================================
// PAGE
// ============================================================

export default function StorePage() {
  // ==========================================================
  // CORE
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<StoreTab>(
      "Overview"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState(
      ""
    );

  const [
    organisationName,
    setOrganisationName,
  ] =
    useState(
      ""
    );

  // ==========================================================
  // STORE ADD-ON SUBSCRIPTION
  // ==========================================================

  const [
    storeSubscription,
    setStoreSubscription,
  ] =
    useState<StoreSubscriptionStatus | null>(
      null
    );

  const [
    checkingStoreSubscription,
    setCheckingStoreSubscription,
  ] =
    useState(
      true
    );

  const [
    startingStoreCheckout,
    setStartingStoreCheckout,
  ] =
    useState(
      false
    );

  const [
    openingStoreBilling,
    setOpeningStoreBilling,
  ] =
    useState(
      false
    );

  const [
    storeSubscriptionError,
    setStoreSubscriptionError,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // SETTINGS
  // ==========================================================

  const [
    storeSettings,
    setStoreSettings,
  ] =
    useState<StoreSettingsRow | null>(
      null
    );

  const [
    storeName,
    setStoreName,
  ] =
    useState(
      ""
    );

  const [
    storeDescription,
    setStoreDescription,
  ] =
    useState(
      ""
    );

  const [
    heroTitle,
    setHeroTitle,
  ] =
    useState(
      ""
    );

  const [
    heroText,
    setHeroText,
  ] =
    useState(
      ""
    );

  const [
    announcement,
    setAnnouncement,
  ] =
    useState(
      ""
    );

  const [
    accentColour,
    setAccentColour,
  ] =
    useState(
      "#A9B897"
    );

  const [
    shippingText,
    setShippingText,
  ] =
    useState(
      ""
    );

  const [
    supportEmail,
    setSupportEmail,
  ] =
    useState(
      ""
    );

  const [
    slug,
    setSlug,
  ] =
    useState(
      ""
    );

  const [
    storeLive,
    setStoreLive,
  ] =
    useState(
      false
    );

  const [
    savingSettings,
    setSavingSettings,
  ] =
    useState(
      false
    );

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  const [
    products,
    setProducts,
  ] =
    useState<
      Product[]
    >(
      []
    );

  const [
    productSearch,
    setProductSearch,
  ] =
    useState(
      ""
    );

  const [
    showProductModal,
    setShowProductModal,
  ] =
    useState(
      false
    );

  const [
    productForm,
    setProductForm,
  ] =
    useState<ProductForm>({
      ...EMPTY_PRODUCT_FORM,
    });

  const [
    savingProduct,
    setSavingProduct,
  ] =
    useState(
      false
    );

  const [
    deletingProductId,
    setDeletingProductId,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // INVENTORY
  // ==========================================================

  const [
    lowStockThreshold,
    setLowStockThreshold,
  ] =
    useState(
      "8"
    );

  const [
    stockAdjust,
    setStockAdjust,
  ] =
    useState<StockAdjustState | null>(
      null
    );

  const [
    savingStock,
    setSavingStock,
  ] =
    useState(
      false
    );

  // ==========================================================
  // ORDERS
  // ==========================================================

  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >(
      []
    );

  const [
    orderSearch,
    setOrderSearch,
  ] =
    useState(
      ""
    );

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    selectedOrder,
    setSelectedOrder,
  ] =
    useState<Order | null>(
      null
    );

  // ==========================================================
  // DISCOUNTS
  // ==========================================================

  const [
    discounts,
    setDiscounts,
  ] =
    useState<
      Discount[]
    >(
      []
    );

  const [
    discountSearch,
    setDiscountSearch,
  ] =
    useState(
      ""
    );

  const [
    showDiscountModal,
    setShowDiscountModal,
  ] =
    useState(
      false
    );

  const [
    discountForm,
    setDiscountForm,
  ] =
    useState<DiscountForm>({
      ...EMPTY_DISCOUNT_FORM,
    });

  const [
    savingDiscount,
    setSavingDiscount,
  ] =
    useState(
      false
    );

  const [
    deletingDiscountId,
    setDeletingDiscountId,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // LOCAL OPTIONS
  // ==========================================================

  const [
    currency,
    setCurrency,
  ] =
    useState(
      "GBP"
    );

  const [
    orderNotifications,
    setOrderNotifications,
  ] =
    useState(
      true
    );

  const [
    autoCreateContacts,
    setAutoCreateContacts,
  ] =
    useState(
      true
    );


  // ==========================================================
  // STRIPE CONNECT / PAYMENTS
  // ==========================================================

  const [
    stripeStatus,
    setStripeStatus,
  ] =
    useState<StripeAccountStatus>({
      connected:
        false,

      accountId:
        null,

      chargesEnabled:
        false,

      payoutsEnabled:
        false,

      detailsSubmitted:
        false,

      availableBalance:
        0,

      pendingBalance:
        0,

      currency:
        "GBP",
    });

  const [
    loadingStripe,
    setLoadingStripe,
  ] =
    useState(
      false
    );

  const [
    connectingStripe,
    setConnectingStripe,
  ] =
    useState(
      false
    );

  const [
    openingStripeDashboard,
    setOpeningStripeDashboard,
  ] =
    useState(
      false
    );

  const [
    requestingPayout,
    setRequestingPayout,
  ] =
    useState(
      false
    );

  const [
    refundForm,
    setRefundForm,
  ] =
    useState<RefundFormState | null>(
      null
    );

  const [
    refundingOrderId,
    setRefundingOrderId,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // STORE SUBSCRIPTION ACCESS
  //
  // Stripe is the source of truth. The Store workspace is only
  // loaded when /api/store/subscription/status confirms that
  // this organisation has the correct active Store add-on.
  // ==========================================================

  const loadStoreSubscriptionStatus =
    useCallback(
      async () => {
        setCheckingStoreSubscription(
          true
        );

        setStoreSubscriptionError(
          null
        );

        try {
          const headers =
            await getAuthenticatedApiHeaders();

          const response =
            await fetch(
              "/api/store/subscription/status",
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers,
              }
            );

          const result =
            await response
              .json()
              .catch(
                () =>
                  null
              );

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
                "Store subscription status could not be loaded."
            );
          }

          const status:
            StoreSubscriptionStatus =
            {
              subscribed:
                result?.subscribed ===
                true,

              storeEnabled:
                result?.storeEnabled ===
                true,

              status:
                typeof result?.status ===
                "string"
                  ? result.status
                  : null,

              subscriptionId:
                typeof result?.subscriptionId ===
                "string"
                  ? result.subscriptionId
                  : null,

              customerId:
                typeof result?.customerId ===
                "string"
                  ? result.customerId
                  : null,

              priceId:
                typeof result?.priceId ===
                "string"
                  ? result.priceId
                  : null,

              expectedPriceId:
                typeof result?.expectedPriceId ===
                "string"
                  ? result.expectedPriceId
                  : null,

              correctProduct:
                result?.correctProduct ===
                true,

              cancelAtPeriodEnd:
                result?.cancelAtPeriodEnd ===
                true,

              currentPeriodEnd:
                typeof result?.currentPeriodEnd ===
                "string"
                  ? result.currentPeriodEnd
                  : null,

              needsPurchase:
                result?.needsPurchase !==
                false,

              needsPaymentAttention:
                result?.needsPaymentAttention ===
                true,

              reason:
                typeof result?.reason ===
                "string"
                  ? result.reason
                  : null,
            };

          setStoreSubscription(
            status
          );

          return status;
        } catch (
          error:
            unknown
        ) {
          console.error(
            "Store subscription status failed:",
            error
          );

          const message =
            error instanceof
              Error
              ? error.message
              : "Store subscription status could not be loaded.";

          setStoreSubscriptionError(
            message
          );

          setStoreSubscription(
            null
          );

          throw error;
        } finally {
          setCheckingStoreSubscription(
            false
          );
        }
      },
      []
    );

  async function startStoreSubscriptionCheckout() {
    if (
      startingStoreCheckout
    ) {
      return;
    }

    setStartingStoreCheckout(
      true
    );

    setStoreSubscriptionError(
      null
    );

    try {
      const headers =
        await getAuthenticatedApiHeaders(
          true
        );

      const response =
        await fetch(
          "/api/store/subscription/checkout",
          {
            method:
              "POST",

            headers,

            body:
              JSON.stringify({}),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok
      ) {
        /*
         * If Stripe says a subscription already exists, refresh
         * the live status instead of letting the user create a
         * duplicate subscription.
         */
        if (
          response.status ===
            409 &&
          result?.existingSubscription ===
            true
        ) {
          await loadStoreSubscriptionStatus();

          throw new Error(
            result?.error ||
              "A Store subscription already exists."
          );
        }

        throw new Error(
          result?.error ||
            "Store checkout could not be started."
        );
      }

      const checkoutUrl =
        typeof result?.checkoutUrl ===
          "string"
          ? result.checkoutUrl
          : typeof result?.url ===
              "string"
            ? result.url
            : null;

      if (
        !checkoutUrl
      ) {
        throw new Error(
          "Stripe did not return a checkout URL."
        );
      }

      window.location.assign(
        checkoutUrl
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Store subscription checkout failed:",
        error
      );

      setStoreSubscriptionError(
        error instanceof
          Error
          ? error.message
          : "Store checkout could not be started."
      );

      setStartingStoreCheckout(
        false
      );
    }
  }

  async function openStoreBillingPortal() {
    if (
      openingStoreBilling
    ) {
      return;
    }

    setOpeningStoreBilling(
      true
    );

    setStoreSubscriptionError(
      null
    );

    try {
      const headers =
        await getAuthenticatedApiHeaders(
          true
        );

      const response =
        await fetch(
          "/api/store/subscription/portal",
          {
            method:
              "POST",

            headers,

            body:
              JSON.stringify({}),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Store billing could not be opened."
        );
      }

      const portalUrl =
        typeof result?.url ===
          "string"
          ? result.url
          : typeof result?.portalUrl ===
              "string"
            ? result.portalUrl
            : null;

      if (
        !portalUrl
      ) {
        throw new Error(
          "Stripe did not return a billing portal URL."
        );
      }

      window.location.assign(
        portalUrl
      );
    } catch (
      error:
        unknown
    ) {
      console.error(
        "Store billing portal failed:",
        error
      );

      setStoreSubscriptionError(
        error instanceof
          Error
          ? error.message
          : "Store billing could not be opened."
      );
    } finally {
      setOpeningStoreBilling(
        false
      );
    }
  }

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData =
    useCallback(
      async (
        quiet = false
      ) => {
        if (
          quiet
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setPageError(
          null
        );

        try {
          // ===================================================
          // ORGANISATION
          // ===================================================

          const context =
            await resolveOrganisationContext();

          const orgId =
            context.organisationId;

          setOrganisationId(
            orgId
          );

          setOrganisationName(
            context.organisationName
          );

          // ===================================================
          // STORE SETTINGS
          // ===================================================

          const {
            data:
              settingsRows,
            error:
              settingsError,
          } =
            await supabase
              .from(
                "store_settings"
              )
              .select("*")
              .eq(
                "organisation_id",
                orgId
              )
              .limit(
                1
              );

          if (
            settingsError
          ) {
            throw settingsError;
          }

          const settings =
            (
              settingsRows?.[0] ||
              null
            ) as StoreSettingsRow | null;

          setStoreSettings(
            settings
          );

          setStoreName(
            settings
              ?.store_name ||
              context
                .organisationName ||
              ""
          );

          setStoreDescription(
            settings
              ?.store_description ||
              ""
          );

          setHeroTitle(
            settings
              ?.hero_title ||
              ""
          );

          setHeroText(
            settings
              ?.hero_text ||
              ""
          );

          setAnnouncement(
            settings
              ?.announcement ||
              ""
          );

          setAccentColour(
            settings
              ?.accent_colour ||
              "#A9B897"
          );

          setShippingText(
            settings
              ?.shipping_text ||
              ""
          );

          setSupportEmail(
            settings
              ?.support_email ||
              ""
          );

          setSlug(
            settings?.slug ||
              createSlug(
                context
                  .organisationName
              )
          );

          setStoreLive(
            settings
              ?.is_live ===
              true
          );

          // ===================================================
          // PRODUCTS
          // ===================================================

          const {
            data:
              productRows,
            error:
              productError,
          } =
            await supabase
              .from(
                "store_products"
              )
              .select("*")
              .eq(
                "organisation_id",
                orgId
              )
              .order(
                "sort_order",
                {
                  ascending:
                    true,
                }
              );

          if (
            productError
          ) {
            throw productError;
          }

         // ===================================================
// ORDERS
// ===================================================

const {
  data: orderRows,
  error: orderError,
} = await supabase
  .from("store_orders")
  .select(`
    id,
    organisation_id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    subtotal,
    discount_amount,
    shipping_amount,
    total,
    payment_status,
    fulfilment_status,
    created_at,
    updated_at
  `)
  .eq("organisation_id", orgId)
  .order("created_at", {
    ascending: false,
  });

console.log(
  "[TOTS COMMERCE] organisation:",
  orgId
);

console.log(
  "[TOTS COMMERCE] order rows:",
  orderRows
);

console.log(
  "[TOTS COMMERCE] order error:",
  orderError
);

if (orderError) {
  throw orderError;
}
          // ===================================================
          // ORDER ITEMS
          // ===================================================

          let orderItems:
            Record<
              string,
              unknown
            >[] = [];

          const orderIds =
            (
              orderRows ||
              []
            )
              .map(
                (
                  row
                ) =>
                  firstString(
                    row.id
                  )
              )
              .filter(
                (
                  value
                ): value is string =>
                  Boolean(
                    value
                  )
              );

          if (
            orderIds.length >
            0
          ) {
            const {
              data:
                itemRows,
              error:
                orderItemsError,
            } =
              await supabase
                .from(
                  "store_order_items"
                )
                .select("*")
                .in(
                  "order_id",
                  orderIds
                );

            if (
              orderItemsError
            ) {
              console.warn(
                "Order item stats unavailable:",
                orderItemsError
              );
            } else {
              orderItems =
                (
                  itemRows ||
                  []
                ) as Record<
                  string,
                  unknown
                >[];
            }
          }

          // ===================================================
          // DISCOUNTS
          // ===================================================

          const {
            data:
              discountRows,
            error:
              discountError,
          } =
            await supabase
              .from(
                "store_discounts"
              )
              .select("*")
              .eq(
                "organisation_id",
                orgId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            discountError
          ) {
            throw discountError;
          }

          // ===================================================
          // CLEAN PRODUCTS
          // ===================================================

          const cleanedProducts:
            Product[] =
            (
              productRows ||
              []
            ).map(
              (
                row:
                  Record<
                    string,
                    unknown
                  >
              ) => {
                const id =
                  String(
                    row.id
                  );

                const related =
                  orderItems.filter(
                    (
                      item
                    ) =>
                      firstString(
                        item.product_id
                      ) ===
                      id
                  );

                const orders =
                  related.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      firstNumber(
                        item.quantity,
                        1
                      ),
                    0
                  );

                const revenue =
                  related.reduce(
                    (
                      total,
                      item
                    ) => {
                      const quantity =
                        firstNumber(
                          item.quantity,
                          1
                        );

                      const unit =
                        firstNumber(
                          item.unit_price
                        );

                      const lineTotal =
                        firstNumber(
                          item.total
                        );

                      return (
                        total +
                        (
                          lineTotal ||
                          unit *
                            quantity
                        )
                      );
                    },
                    0
                  );

                const rawStatus =
                  firstString(
                    row.status
                  );

                let status:
                  ProductStatus =
                  "active";

                if (
                  rawStatus ===
                  "draft"
                ) {
                  status =
                    "draft";
                }

                if (
                  rawStatus ===
                  "archived"
                ) {
                  status =
                    "archived";
                }

                if (
                  row.is_active ===
                    false &&
                  !rawStatus
                ) {
                  status =
                    "draft";
                }

                const name =
                  firstString(
                    row.name
                  ) ||
                  "Untitled product";

                const inventoryQuantity =
                  firstNumber(
                    row.inventory_quantity,
                    row.stock
                  );

                const stock =
                  firstNumber(
                    row.stock,
                    row.inventory_quantity
                  );

                return {
                  id,

                  organisation_id:
                    String(
                      row.organisation_id ||
                        orgId
                    ),

                  name,

                  slug:
                    firstString(
                      row.slug
                    ) ||
                    createSlug(
                      name
                    ),

                  sku:
                    firstString(
                      row.sku
                    ) ||
                    "—",

                  category:
                    firstString(
                      row.category
                    ) ||
                    "General",

                  description:
                    "",

                  price:
                    firstNumber(
                      row.price
                    ),

                  compare_at_price:
                    row.compare_at_price ===
                      null ||
                    row.compare_at_price ===
                      undefined
                      ? null
                      : firstNumber(
                          row.compare_at_price
                        ),

                  cost:
                    firstNumber(
                      row.cost_price
                    ),

                  stock,

                  inventory_quantity:
                    inventoryQuantity,

                  low_stock_threshold:
                    firstNumber(
                      row.low_stock_threshold,
                      5
                    ),

                  track_inventory:
                    safeBoolean(
                      row.track_inventory,
                      true
                    ),

                  status,

                  image_url:
                    firstString(
                      row.image_url
                    ),

                  images:
                    safeStringArray(
                      row.images
                    ),

                  featured:
                    safeBoolean(
                      row.featured,
                      false
                    ),

                  sort_order:
                    typeof row.sort_order ===
                    "number"
                      ? row.sort_order
                      : null,

                  is_active:
                    row.is_active !==
                    false,

                  created_at:
                    firstString(
                      row.created_at
                    ),

                  orders,

                  revenue,
                };
              }
            );

          setProducts(
            cleanedProducts
          );

          // ===================================================
          // CLEAN ORDERS
          // ===================================================

          const cleanedOrders:
            Order[] =
            (
              orderRows ||
              []
            ).map(
              (
                row:
                  Record<
                    string,
                    unknown
                  >
              ) => {
                const orderId =
                  String(
                    row.id
                  );

                const relatedItems =
                  orderItems.filter(
                    (
                      item
                    ) =>
                      firstString(
                        item.order_id
                      ) ===
                      orderId
                  );

                const itemCount =
                  relatedItems.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      firstNumber(
                        item.quantity,
                        1
                      ),
                    0
                  );

                return {
                  id:
                    orderId,

                  organisation_id:
                    String(
                      row.organisation_id ||
                        orgId
                    ),

                  number:
                    firstString(
                      row.order_number
                    ) ||
                    `#${orderId
                      .slice(
                        0,
                        6
                      )
                      .toUpperCase()}`,

                  customer:
                    firstString(
                      row.customer_name
                    ) ||
                    "Customer",

                  email:
                    firstString(
                      row.customer_email
                    ) ||
                    "—",

                  total:
                    firstNumber(
                      row.total
                    ),

                  status:
                    normaliseOrderStatus(
                      row.fulfilment_status
                    ),

                  paymentStatus:
                    normalisePaymentStatus(
                      row.payment_status
                    ),

                  items:
                    itemCount,

                  createdAt:
                    formatDate(
                      row.created_at
                    ),

                  raw:
                    row,
                };
              }
            );

          setOrders(
            cleanedOrders
          );

          // ===================================================
          // CLEAN DISCOUNTS
          // ===================================================

          const cleanedDiscounts:
            Discount[] =
            (
              discountRows ||
              []
            ).map(
              (
                row:
                  Record<
                    string,
                    unknown
                  >
              ) => {
                const discountType:
                  DiscountType =
                  row.discount_type ===
                  "fixed"
                    ? "fixed"
                    : "percentage";

                return {
                  id:
                    String(
                      row.id
                    ),

                  organisation_id:
                    String(
                      row.organisation_id ||
                        orgId
                    ),

                  code:
                    firstString(
                      row.code
                    ) ||
                    "",

                  description:
                    "",

                  discount_type:
                    discountType,

                  value:
                    firstNumber(
                      row.value
                    ),

                  minimum_order_amount:
                    firstNumber(
                      row.minimum_order_amount
                    ),

                  maximum_discount_amount:
                    row.maximum_discount_amount ===
                      null ||
                    row.maximum_discount_amount ===
                      undefined
                      ? null
                      : firstNumber(
                          row.maximum_discount_amount
                        ),

                  usage_limit:
                    row.usage_limit ===
                      null ||
                    row.usage_limit ===
                      undefined
                      ? null
                      : Math.max(
                          0,
                          Math.floor(
                            firstNumber(
                              row.usage_limit
                            )
                          )
                        ),

                  usage_count:
                    Math.max(
                      0,
                      Math.floor(
                        firstNumber(
                          row.times_used
                        )
                      )
                    ),

                  starts_at:
                    firstString(
                      row.starts_at
                    ),

                  expires_at:
                    firstString(
                      row.expires_at
                    ),

                  is_active:
                    row.is_active !==
                    false,

                  created_at:
                    firstString(
                      row.created_at
                    ),

                  updated_at:
                    firstString(
                      row.updated_at
                    ),
                };
              }
            );

          setDiscounts(
            cleanedDiscounts
          );
        } catch (
          error: unknown
        ) {
          console.error(
            "Store load failed:",
            error
          );

          setPageError(
            error instanceof
              Error
              ? error.message
              : "We couldn't load your commerce workspace."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  // ==========================================================
  // INITIAL LOAD
  //
  // Check the paid Store add-on BEFORE loading any Store data.
  // ==========================================================

  useEffect(
    () => {
      let cancelled =
        false;

      async function initialiseStore() {
        setLoading(
          true
        );

        try {
          const access =
            await loadStoreSubscriptionStatus();

          if (
            cancelled
          ) {
            return;
          }

          if (
            access.storeEnabled
          ) {
            await loadData();
          } else {
            setLoading(
              false
            );
          }
        } catch {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      }

      void initialiseStore();

      return () => {
        cancelled =
          true;
      };
    },
    [
      loadData,
      loadStoreSubscriptionStatus,
    ]
  );

  // ==========================================================
  // REALTIME DATABASE SYNC
  // ==========================================================

  useEffect(
    () => {
      if (
        !organisationId
      ) {
        return;
      }

      const channel =
        supabase
          .channel(
            `commerce-${organisationId}`
          )

          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "store_products",

              filter:
                `organisation_id=eq.${organisationId}`,
            },
            () => {
              void loadData(
                true
              );
            }
          )

          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "store_settings",

              filter:
                `organisation_id=eq.${organisationId}`,
            },
            () => {
              void loadData(
                true
              );
            }
          )

          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "store_orders",

              filter:
                `organisation_id=eq.${organisationId}`,
            },
            () => {
              void loadData(
                true
              );
            }
          )

          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "store_discounts",

              filter:
                `organisation_id=eq.${organisationId}`,
            },
            () => {
              void loadData(
                true
              );
            }
          )

          .subscribe();

      return () => {
        void supabase.removeChannel(
          channel
        );
      };
    },
    [
      organisationId,
      loadData,
    ]
  );

  // ==========================================================
  // STRIPE CONNECT HELPERS
  // ==========================================================

  const loadStripeStatus =
    useCallback(
      async () => {
        if (
          !organisationId
        ) {
          return;
        }

        setLoadingStripe(
          true
        );

        try {
          const response =
            await fetch(
              `/api/store/stripe/status?organisationId=${encodeURIComponent(
                organisationId
              )}`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers:
                  await getAuthenticatedApiHeaders(),
              }
            );

          const result =
            await response
              .json()
              .catch(
                () =>
                  null
              );

          if (
            !response.ok
          ) {
            throw new Error(
              result?.error ||
                "Stripe status could not be loaded."
            );
          }

          setStripeStatus({
            connected:
              result?.connected ===
              true,

            accountId:
              typeof result?.accountId ===
              "string"
                ? result.accountId
                : null,

            chargesEnabled:
              result?.chargesEnabled ===
              true,

            payoutsEnabled:
              result?.payoutsEnabled ===
              true,

            detailsSubmitted:
              result?.detailsSubmitted ===
              true,

            availableBalance:
              Number(
                result?.availableBalance ||
                  0
              ),

            pendingBalance:
              Number(
                result?.pendingBalance ||
                  0
              ),

            currency:
              typeof result?.currency ===
              "string"
                ? result.currency.toUpperCase()
                : "GBP",
          });
        } catch (
          error: unknown
        ) {
          console.error(
            "Stripe status load failed:",
            error
          );
        } finally {
          setLoadingStripe(
            false
          );
        }
      },
      [
        organisationId,
      ]
    );

  useEffect(
    () => {
      if (
        !organisationId
      ) {
        return;
      }

      void loadStripeStatus();
    },
    [
      organisationId,
      loadStripeStatus,
    ]
  );

  async function connectStripeAccount() {
    if (
      !organisationId ||
      connectingStripe
    ) {
      return;
    }

    setConnectingStripe(
      true
    );

    try {
      const response =
        await fetch(
          "/api/store/stripe/connect",
          {
            method:
              "POST",

            headers:
              await getAuthenticatedApiHeaders(
                true
              ),

            body:
              JSON.stringify({
                organisationId,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok ||
        !result?.url
      ) {
        throw new Error(
          result?.error ||
            "Stripe onboarding could not be started."
        );
      }

      window.location.href =
        result.url;
    } catch (
      error: unknown
    ) {
      console.error(
        "Stripe connection failed:",
        error
      );

      alert(
        error instanceof
        Error
          ? error.message
          : "Stripe could not be connected."
      );

      setConnectingStripe(
        false
      );
    }
  }

  async function openStripeDashboard() {
    if (
      !organisationId ||
      openingStripeDashboard
    ) {
      return;
    }

    setOpeningStripeDashboard(
      true
    );

    try {
      const response =
        await fetch(
          "/api/store/stripe/dashboard-link",
          {
            method:
              "POST",

            headers:
              await getAuthenticatedApiHeaders(
                true
              ),

            body:
              JSON.stringify({
                organisationId,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok ||
        !result?.url
      ) {
        throw new Error(
          result?.error ||
            "Stripe dashboard could not be opened."
        );
      }

      window.open(
        result.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Stripe dashboard link failed:",
        error
      );

      alert(
        error instanceof
        Error
          ? error.message
          : "Stripe dashboard could not be opened."
      );
    } finally {
      setOpeningStripeDashboard(
        false
      );
    }
  }

  async function requestStripePayout() {
    if (
      !organisationId ||
      requestingPayout
    ) {
      return;
    }

    if (
      stripeStatus.availableBalance <=
      0
    ) {
      alert(
        "There is no available Stripe balance to withdraw yet."
      );

      return;
    }

    if (
      !window.confirm(
        `Withdraw ${money(
          stripeStatus.availableBalance
        )} from the available Stripe balance?`
      )
    ) {
      return;
    }

    setRequestingPayout(
      true
    );

    try {
      const response =
        await fetch(
          "/api/store/stripe/payout",
          {
            method:
              "POST",

            headers:
              await getAuthenticatedApiHeaders(
                true
              ),

            body:
              JSON.stringify({
                organisationId,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Payout could not be requested."
        );
      }

      alert(
        "Payout request submitted to Stripe."
      );

      await loadStripeStatus();
    } catch (
      error: unknown
    ) {
      console.error(
        "Stripe payout failed:",
        error
      );

      alert(
        error instanceof
        Error
          ? error.message
          : "Payout could not be requested."
      );
    } finally {
      setRequestingPayout(
        false
      );
    }
  }

  function contactOrderCustomer(
    order:
      Order
  ) {
    if (
      !order.email ||
      order.email ===
        "—"
    ) {
      alert(
        "This order does not have a customer email address."
      );

      return;
    }

    const subject =
      encodeURIComponent(
        `Your order ${order.number}`
      );

    window.location.href =
      `mailto:${order.email}?subject=${subject}`;
  }

  function openRefund(
    order:
      Order
  ) {
    if (
      order.paymentStatus !==
      "paid"
    ) {
      alert(
        "Only paid orders can be refunded."
      );

      return;
    }

    if (
      !stripeStatus.connected
    ) {
      alert(
        "Connect Stripe before processing refunds."
      );

      return;
    }

    setRefundForm({
      order,

      amount:
        order.total.toFixed(
          2
        ),

      reason:
        "requested_by_customer",
    });
  }

  async function submitRefund() {
    if (
      !refundForm ||
      refundingOrderId
    ) {
      return;
    }

    const amount =
      Number(
        refundForm.amount
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <=
        0
    ) {
      alert(
        "Enter a valid refund amount."
      );

      return;
    }

    if (
      amount >
      refundForm.order.total
    ) {
      alert(
        "The refund cannot be more than the order total."
      );

      return;
    }

    setRefundingOrderId(
      refundForm.order.id
    );

    try {
      const response =
        await fetch(
          "/api/store/stripe/refund",
          {
            method:
              "POST",

            headers:
              await getAuthenticatedApiHeaders(
                true
              ),

            body:
              JSON.stringify({
                organisationId,

                orderId:
                  refundForm.order.id,

                amount,

                reason:
                  refundForm.reason,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          result?.error ||
            "Refund could not be processed."
        );
      }

      setRefundForm(
        null
      );

      await loadData(
        true
      );

      await loadStripeStatus();

      alert(
        "Refund processed successfully."
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Refund failed:",
        error
      );

      alert(
        error instanceof
        Error
          ? error.message
          : "Refund could not be processed."
      );
    } finally {
      setRefundingOrderId(
        null
      );
    }
  }

  // ==========================================================
  // METRICS
  // ==========================================================

  const totalRevenue =
    useMemo(
      () =>
        products.reduce(
          (
            total,
            product
          ) =>
            total +
            product.revenue,
          0
        ),
      [
        products,
      ]
    );

 const totalOrders =
  orders.length;

  const paidOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            order.paymentStatus ===
            "paid"
        ),
      [
        orders,
      ]
    );

  const orderRevenue =
    useMemo(
      () =>
        paidOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            order.total,
          0
        ),
      [
        paidOrders,
      ]
    );

  const displayRevenue =
  paidOrders.length > 0
    ? orderRevenue
    : totalRevenue;

  const averageOrderValue =
    paidOrders.length >
    0
      ? orderRevenue /
        paidOrders.length
      : totalOrders >
          0
        ? totalRevenue /
          totalOrders
        : 0;

  const lowStockProducts =
    useMemo(
      () =>
        products.filter(
          (
            product
          ) => {
            if (
              product.track_inventory ===
              false
            ) {
              return false;
            }

            return (
              product.inventory_quantity <=
                Number(
                  lowStockThreshold ||
                    0
                ) &&
              product.status ===
                "active"
            );
          }
        ),
      [
        products,
        lowStockThreshold,
      ]
    );

  const openOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            ![
              "delivered",
              "cancelled",
            ].includes(
              order.status
            )
        ),
      [
        orders,
      ]
    );

  const bestSellers =
    useMemo(
      () =>
        [
          ...products,
        ]
          .sort(
            (
              first,
              second
            ) => {
              if (
                second.orders !==
                first.orders
              ) {
                return (
                  second.orders -
                  first.orders
                );
              }

              return (
                second.revenue -
                first.revenue
              );
            }
          )
          .slice(
            0,
            4
          ),
      [
        products,
      ]
    );

  const filteredProducts =
    useMemo(
      () => {
        const value =
          productSearch
            .trim()
            .toLowerCase();

        if (
          !value
        ) {
          return products;
        }

        return products.filter(
          (
            product
          ) =>
            product.name
              .toLowerCase()
              .includes(
                value
              ) ||
            product.sku
              .toLowerCase()
              .includes(
                value
              ) ||
            product.category
              .toLowerCase()
              .includes(
                value
              )
        );
      },
      [
        products,
        productSearch,
      ]
    );

  const filteredOrders =
    useMemo(
      () => {
        const value =
          orderSearch
            .trim()
            .toLowerCase();

        if (
          !value
        ) {
          return orders;
        }

        return orders.filter(
          (
            order
          ) =>
            order.number
              .toLowerCase()
              .includes(
                value
              ) ||
            order.customer
              .toLowerCase()
              .includes(
                value
              ) ||
            order.email
              .toLowerCase()
              .includes(
                value
              )
        );
      },
      [
        orders,
        orderSearch,
      ]
    );

  const filteredDiscounts =
    useMemo(
      () => {
        const value =
          discountSearch
            .trim()
            .toLowerCase();

        if (
          !value
        ) {
          return discounts;
        }

        return discounts.filter(
          (
            discount
          ) =>
            discount.code
              .toLowerCase()
              .includes(
                value
              ) ||
            discount.description
              .toLowerCase()
              .includes(
                value
              ) ||
            discount.discount_type
              .toLowerCase()
              .includes(
                value
              )
        );
      },
      [
        discounts,
        discountSearch,
      ]
    );

  const activeDiscounts =
    useMemo(
      () =>
        discounts.filter(
          (
            discount
          ) =>
            getDiscountStatus(
              discount
            ) ===
            "Active"
        ),
      [
        discounts,
      ]
    );

  const expiredDiscounts =
    useMemo(
      () =>
        discounts.filter(
          (
            discount
          ) =>
            getDiscountStatus(
              discount
            ) ===
            "Expired"
        ),
      [
        discounts,
      ]
    );

  const totalDiscountRedemptions =
    useMemo(
      () =>
        discounts.reduce(
          (
            total,
            discount
          ) =>
            total +
            discount.usage_count,
          0
        ),
      [
        discounts,
      ]
    );

  // ==========================================================
  // MONEY
  // ==========================================================

  function money(
    value:
      | number
      | string
  ) {
    try {
      return new Intl.NumberFormat(
        "en-GB",
        {
          style:
            "currency",

          currency:
            currency ||
            "GBP",

          maximumFractionDigits:
            2,
        }
      ).format(
        Number(
          value ||
            0
        )
      );
    } catch {
      return `£${Number(
        value ||
          0
      ).toFixed(
        2
      )}`;
    }
  }

  // ==========================================================
  // PRODUCT MODAL
  // ==========================================================

  function openNewProduct() {
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
    });

    setShowProductModal(
      true
    );
  }

  function openEditProduct(
    product:
      Product
  ) {
    setProductForm({
      id:
        product.id,

      name:
        product.name,

      slug:
        product.slug,

      sku:
        product.sku ===
        "—"
          ? ""
          : product.sku,

      category:
        product.category,

      description:
        product.description,

      price:
        String(
          product.price
        ),

      compareAtPrice:
        product.compare_at_price ===
        null
          ? ""
          : String(
              product.compare_at_price
            ),

      cost:
        String(
          product.cost
        ),

      stock:
        String(
          product.inventory_quantity
        ),

      imageUrl:
        product.image_url ||
        "",

      featured:
        product.featured,

      trackInventory:
        product.track_inventory,

      status:
        product.status,
    });

    setShowProductModal(
      true
    );
  }

  // ==========================================================
  // SAVE PRODUCT
  // ==========================================================

  async function saveProduct() {
    if (
      savingProduct
    ) {
      return;
    }

    if (
      !organisationId
    ) {
      alert(
        "Organisation could not be found."
      );

      return;
    }

    const name =
      productForm.name.trim();

    if (
      !name
    ) {
      alert(
        "Enter a product name."
      );

      return;
    }

    const productSlug =
      createSlug(
        productForm.slug ||
          name
      );

    if (
      !productSlug
    ) {
      alert(
        "The product needs a valid slug."
      );

      return;
    }

    const price =
      Number(
        productForm.price
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price <
        0
    ) {
      alert(
        "Enter a valid price."
      );

      return;
    }

    const compareAtPrice =
      productForm.compareAtPrice.trim()
        ? Number(
            productForm.compareAtPrice
          )
        : null;

    if (
      compareAtPrice !==
        null &&
      (
        !Number.isFinite(
          compareAtPrice
        ) ||
        compareAtPrice <
          0
      )
    ) {
      alert(
        "Enter a valid compare-at price."
      );

      return;
    }

    const costPrice =
      productForm.cost.trim()
        ? Number(
            productForm.cost
          )
        : 0;

    if (
      !Number.isFinite(
        costPrice
      ) ||
      costPrice <
        0
    ) {
      alert(
        "Enter a valid cost price."
      );

      return;
    }

    const stock =
      productForm.trackInventory
        ? Math.max(
            0,
            Math.floor(
              Number(
                productForm.stock ||
                  0
              )
            )
          )
        : 0;

    setSavingProduct(
      true
    );

    try {
      let slugQuery =
        supabase
          .from(
            "store_products"
          )
          .select(
            "id"
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .eq(
            "slug",
            productSlug
          );

      if (
        productForm.id
      ) {
        slugQuery =
          slugQuery.neq(
            "id",
            productForm.id
          );
      }

      const {
        data:
          existingSlugRows,
        error:
          slugCheckError,
      } =
        await slugQuery.limit(
          1
        );

      if (
        slugCheckError
      ) {
        throw slugCheckError;
      }

      if (
        existingSlugRows &&
        existingSlugRows.length >
          0
      ) {
        alert(
          "Another product already uses this product URL. Change the product slug."
        );

        return;
      }

      const payload = {
        organisation_id:
          organisationId,

        name,

        slug:
          productSlug,

        sku:
          productForm.sku.trim() ||
          generateSku(
            name
          ),

        category:
          productForm.category.trim() ||
          "General",

        description:
          productForm.description.trim() ||
          null,

        price,

        compare_at_price:
          compareAtPrice,

        cost_price:
          costPrice,

        stock,

        inventory_quantity:
          stock,

        track_inventory:
          productForm.trackInventory,

        image_url:
          productForm.imageUrl.trim() ||
          null,

        featured:
          productForm.featured,

        status:
          productForm.status,

        is_active:
          productForm.status ===
          "active",

        updated_at:
          new Date().toISOString(),
      };

      if (
        productForm.id
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_products"
            )
            .update(
              payload
            )
            .eq(
              "id",
              productForm.id
            )
            .eq(
              "organisation_id",
              organisationId
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
            "The product was not updated. Check your store_products RLS UPDATE policy."
          );
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_products"
            )
            .insert(
              payload
            )
            .select(
              "id"
            )
            .single();

        if (
          error
        ) {
          throw error;
        }

        if (
          !data
        ) {
          throw new Error(
            "The product was not created."
          );
        }
      }

      setShowProductModal(
        false
      );

      setProductForm({
        ...EMPTY_PRODUCT_FORM,
      });

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Product save failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Product could not be saved."
      );
    } finally {
      setSavingProduct(
        false
      );
    }
  }

  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  async function deleteProduct(
    product:
      Product
  ) {
    if (
      !window.confirm(
        `Delete "${product.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingProductId(
      product.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "store_products"
          )
          .delete()
          .eq(
            "id",
            product.id
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select(
            "id"
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        !data?.length
      ) {
        throw new Error(
          "The product was not deleted. Check your store_products RLS DELETE policy."
        );
      }

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Delete product failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Product could not be deleted."
      );
    } finally {
      setDeletingProductId(
        null
      );
    }
  }

  // ==========================================================
  // STOCK
  // ==========================================================

  function openStockAdjust(
    product:
      Product
  ) {
    setStockAdjust({
      product,

      quantity:
        String(
          product.inventory_quantity
        ),
    });
  }

  async function saveStockAdjustment() {
    if (
      !stockAdjust ||
      savingStock
    ) {
      return;
    }

    const quantity =
      Math.max(
        0,
        Math.floor(
          Number(
            stockAdjust.quantity ||
              0
          )
        )
      );

    setSavingStock(
      true
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "store_products"
          )
          .update({
            stock:
              quantity,

            inventory_quantity:
              quantity,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            stockAdjust.product.id
          )
          .eq(
            "organisation_id",
            organisationId
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
          "Stock was not updated. Check your store_products RLS UPDATE policy."
        );
      }

      setStockAdjust(
        null
      );

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Stock update failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Stock could not be updated."
      );
    } finally {
      setSavingStock(
        false
      );
    }
  }

  // ==========================================================
  // ORDERS
  // ==========================================================

  async function advanceOrder(
    order:
      Order
  ) {
    if (
      [
        "delivered",
        "cancelled",
      ].includes(
        order.status
      )
    ) {
      return;
    }

    let nextStatus:
      OrderStatus =
      order.status;

    if (
      order.status ===
      "new"
    ) {
      nextStatus =
        "processing";
    } else if (
      order.status ===
      "processing"
    ) {
      nextStatus =
        "dispatched";
    } else if (
      order.status ===
      "dispatched"
    ) {
      nextStatus =
        "delivered";
    }

    setUpdatingOrderId(
      order.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "store_orders"
          )
          .update({
            fulfilment_status:
              nextStatus,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            order.id
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select(
            "id, fulfilment_status"
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
          "The order status was not changed. Supabase did not return the updated order. Check the store_orders UPDATE RLS policy."
        );
      }

      setOrders(
        (previous) =>
          previous.map(
            (existingOrder) =>
              existingOrder.id ===
              order.id
                ? {
                    ...existingOrder,
                    status:
                      nextStatus,
                  }
                : existingOrder
          )
      );

      setSelectedOrder(
        (previous) =>
          previous?.id ===
          order.id
            ? {
                ...previous,
                status:
                  nextStatus,
              }
            : previous
      );

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Order update failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Order could not be updated."
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  // ==========================================================
  // DISCOUNTS
  // ==========================================================

  function openNewDiscount() {
    setDiscountForm({
      ...EMPTY_DISCOUNT_FORM,
    });

    setShowDiscountModal(
      true
    );
  }

  function openEditDiscount(
    discount:
      Discount
  ) {
    setDiscountForm({
      id:
        discount.id,

      code:
        discount.code,

      description:
        discount.description,

      discountType:
        discount.discount_type,

      value:
        String(
          discount.value
        ),

      minimumOrderAmount:
        discount.minimum_order_amount >
        0
          ? String(
              discount.minimum_order_amount
            )
          : "",

      maximumDiscountAmount:
        discount.maximum_discount_amount ===
        null
          ? ""
          : String(
              discount.maximum_discount_amount
            ),

      usageLimit:
        discount.usage_limit ===
        null
          ? ""
          : String(
              discount.usage_limit
            ),

      startsAt:
        formatDateTimeLocal(
          discount.starts_at
        ),

      expiresAt:
        formatDateTimeLocal(
          discount.expires_at
        ),

      active:
        discount.is_active,
    });

    setShowDiscountModal(
      true
    );
  }

  async function saveDiscount() {
    if (
      savingDiscount
    ) {
      return;
    }

    if (
      !organisationId
    ) {
      alert(
        "Organisation could not be found."
      );

      return;
    }

    const code =
      discountForm.code
        .trim()
        .toUpperCase()
        .replace(
          /\s+/g,
          ""
        );

    if (
      !code
    ) {
      alert(
        "Enter a discount code."
      );

      return;
    }

    if (
      !/^[A-Z0-9_-]+$/.test(
        code
      )
    ) {
      alert(
        "Discount codes can only contain letters, numbers, hyphens and underscores."
      );

      return;
    }

    const value =
      Number(
        discountForm.value
      );

    if (
      !Number.isFinite(
        value
      ) ||
      value <=
        0
    ) {
      alert(
        "Enter a valid discount value."
      );

      return;
    }

    if (
      discountForm.discountType ===
        "percentage" &&
      value >
        100
    ) {
      alert(
        "Percentage discounts cannot be more than 100%."
      );

      return;
    }

    const minimumOrder =
      discountForm.minimumOrderAmount.trim()
        ? Number(
            discountForm.minimumOrderAmount
          )
        : 0;

    if (
      !Number.isFinite(
        minimumOrder
      ) ||
      minimumOrder <
        0
    ) {
      alert(
        "Enter a valid minimum order value."
      );

      return;
    }

    const maximumDiscount =
      discountForm.maximumDiscountAmount.trim()
        ? Number(
            discountForm.maximumDiscountAmount
          )
        : null;

    if (
      maximumDiscount !==
        null &&
      (
        !Number.isFinite(
          maximumDiscount
        ) ||
        maximumDiscount <
          0
      )
    ) {
      alert(
        "Enter a valid maximum discount amount."
      );

      return;
    }

    let usageLimit:
      | number
      | null =
      null;

    if (
      discountForm.usageLimit.trim()
    ) {
      const parsedUsageLimit =
        Number(
          discountForm.usageLimit
        );

      if (
        !Number.isFinite(
          parsedUsageLimit
        ) ||
        parsedUsageLimit <
          1
      ) {
        alert(
          "Usage limit must be at least 1."
        );

        return;
      }

      usageLimit =
        Math.floor(
          parsedUsageLimit
        );
    }

    if (
      discountForm.startsAt &&
      discountForm.expiresAt
    ) {
      const start =
        new Date(
          discountForm.startsAt
        ).getTime();

      const end =
        new Date(
          discountForm.expiresAt
        ).getTime();

      if (
        Number.isNaN(
          start
        ) ||
        Number.isNaN(
          end
        ) ||
        end <=
          start
      ) {
        alert(
          "Expiry must be after the start date."
        );

        return;
      }
    }

    setSavingDiscount(
      true
    );

    try {
      // =======================================================
      // CHECK FOR DUPLICATE CODE
      // =======================================================

      let duplicateQuery =
        supabase
          .from(
            "store_discounts"
          )
          .select(
            "id"
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .ilike(
            "code",
            code
          );

      if (
        discountForm.id
      ) {
        duplicateQuery =
          duplicateQuery.neq(
            "id",
            discountForm.id
          );
      }

      const {
        data:
          duplicateRows,
        error:
          duplicateError,
      } =
        await duplicateQuery.limit(
          1
        );

      if (
        duplicateError
      ) {
        throw duplicateError;
      }

      if (
        duplicateRows &&
        duplicateRows.length >
          0
      ) {
        alert(
          "That discount code already exists."
        );

        return;
      }

      const payload = {
        organisation_id:
          organisationId,

        code,

        discount_type:
          discountForm.discountType,

        value,

        minimum_order_amount:
          minimumOrder > 0
            ? minimumOrder
            : null,

        maximum_discount_amount:
          maximumDiscount,

        usage_limit:
          usageLimit,

        starts_at:
          discountForm.startsAt
            ? new Date(
                discountForm.startsAt
              ).toISOString()
            : null,

        expires_at:
          discountForm.expiresAt
            ? new Date(
                discountForm.expiresAt
              ).toISOString()
            : null,

        is_active:
          discountForm.active,

        updated_at:
          new Date().toISOString(),
      };

      if (
        discountForm.id
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_discounts"
            )
            .update(
              payload
            )
            .eq(
              "id",
              discountForm.id
            )
            .eq(
              "organisation_id",
              organisationId
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
            "Discount was not updated. Check the store_discounts RLS UPDATE policy."
          );
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_discounts"
            )
            .insert(
              payload
            )
            .select(
              "id"
            )
            .single();

        if (
          error
        ) {
          throw error;
        }

        if (
          !data
        ) {
          throw new Error(
            "Discount was not created."
          );
        }
      }

      setShowDiscountModal(
        false
      );

      setDiscountForm({
        ...EMPTY_DISCOUNT_FORM,
      });

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Discount save failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Discount could not be saved."
      );
    } finally {
      setSavingDiscount(
        false
      );
    }
  }

  async function deleteDiscount(
    discount:
      Discount
  ) {
    if (
      !window.confirm(
        `Delete discount "${discount.code}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingDiscountId(
      discount.id
    );

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "store_discounts"
          )
          .delete()
          .eq(
            "id",
            discount.id
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select(
            "id"
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        !data?.length
      ) {
        throw new Error(
          "Discount was not deleted. Check the store_discounts RLS DELETE policy."
        );
      }

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Discount delete failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Discount could not be deleted."
      );
    } finally {
      setDeletingDiscountId(
        null
      );
    }
  }

  async function toggleDiscount(
    discount:
      Discount
  ) {
    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "store_discounts"
          )
          .update({
            is_active:
              !discount.is_active,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            discount.id
          )
          .eq(
            "organisation_id",
            organisationId
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
          "Discount status could not be updated."
        );
      }

      await loadData(
        true
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Discount status update failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Discount status could not be updated."
      );
    }
  }

  // ==========================================================
  // STORE SETTINGS
  // ==========================================================

  async function saveStoreSettings() {
    if (
      savingSettings
    ) {
      return;
    }

    if (
      !organisationId
    ) {
      return;
    }

    if (
      !storeName.trim()
    ) {
      alert(
        "Give your store a name."
      );

      return;
    }

    const resolvedSlug =
      createSlug(
        slug ||
          storeName
      );

    if (
      !resolvedSlug
    ) {
      alert(
        "Enter a valid store URL slug."
      );

      return;
    }

    setSavingSettings(
      true
    );

    try {
      let slugQuery =
        supabase
          .from(
            "store_settings"
          )
          .select(
            "id, organisation_id"
          )
          .eq(
            "slug",
            resolvedSlug
          );

      if (
        storeSettings?.id
      ) {
        slugQuery =
          slugQuery.neq(
            "id",
            storeSettings.id
          );
      }

      const {
        data:
          slugRows,
        error:
          slugError,
      } =
        await slugQuery.limit(
          1
        );

      if (
        slugError
      ) {
        throw slugError;
      }

      if (
        slugRows &&
        slugRows.length >
          0
      ) {
        alert(
          "That storefront URL is already being used. Choose another store URL."
        );

        return;
      }

      const payload = {
        organisation_id:
          organisationId,

        slug:
          resolvedSlug,

        store_name:
          storeName.trim(),

        store_description:
          storeDescription.trim() ||
          null,

        hero_title:
          heroTitle.trim() ||
          null,

        hero_text:
          heroText.trim() ||
          null,

        announcement:
          announcement.trim() ||
          null,

        accent_colour:
          accentColour.trim() ||
          "#A9B897",

        shipping_text:
          shippingText.trim() ||
          null,

        support_email:
          supportEmail.trim() ||
          null,

        is_live:
          storeLive,

        updated_at:
          new Date().toISOString(),
      };

      if (
        storeSettings?.id
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_settings"
            )
            .update(
              payload
            )
            .eq(
              "id",
              storeSettings.id
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .select("*")
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
            "Store settings were not updated. Check the store_settings RLS UPDATE policy."
          );
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_settings"
            )
            .insert(
              payload
            )
            .select("*")
            .single();

        if (
          error
        ) {
          throw error;
        }

        if (
          !data
        ) {
          throw new Error(
            "Store settings were not created."
          );
        }
      }

      setSlug(
        resolvedSlug
      );

      await loadData(
        true
      );

      alert(
        "Store settings saved. Your storefront is now using the updated settings."
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Store settings save failed:",
        error
      );

      alert(
        error instanceof
          Error
          ? error.message
          : "Store settings could not be saved."
      );
    } finally {
      setSavingSettings(
        false
      );
    }
  }

  // ==========================================================
  // STOREFRONT
  // ==========================================================

  const storefrontUrl =
    slug
      ? `/shop/${slug}`
      : null;

  async function copyStorefrontUrl() {
    if (
      !storefrontUrl
    ) {
      return;
    }

    const url =
      typeof window !==
      "undefined"
        ? `${window.location.origin}${storefrontUrl}`
        : storefrontUrl;

    try {
      await navigator.clipboard.writeText(
        url
      );

      alert(
        "Store URL copied."
      );
    } catch {
      alert(
        url
      );
    }
  }

  // ==========================================================
  // TABS
  // ==========================================================

  const tabs: {
    label:
      StoreTab;

    icon:
      any;
  }[] = [
    {
      label:
        "Overview",

      icon:
        Store,
    },

    {
      label:
        "Products",

      icon:
        Package,
    },

    {
      label:
        "Orders",

      icon:
        ShoppingBag,
    },

    {
      label:
        "Payments",

      icon:
        WalletCards,
    },

    {
      label:
        "Inventory",

      icon:
        Boxes,
    },

    {
      label:
        "Discounts",

      icon:
        BadgePercent,
    },

    {
      label:
        "Settings",

      icon:
        Settings,
    },
  ];

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2]">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#829473]"
          />

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            {checkingStoreSubscription
              ? "Checking Store access"
              : "Loading commerce"}
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // STORE SUBSCRIPTION CHECK ERROR
  // ==========================================================

  if (
    !storeSubscription &&
    storeSubscriptionError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5 py-12 text-stone-900">
        <div className="w-full max-w-xl rounded-[2.25rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/30 sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle
              size={24}
            />
          </div>

          <p className="mt-6 text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">
            TOTS Commerce
          </p>

          <h1 className="mt-2 font-serif text-4xl italic sm:text-5xl">
            We couldn&apos;t check your Store access.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-stone-500">
            {storeSubscriptionError}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#829473]"
          >
            <RefreshCw
              size={14}
            />

            Check again
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // STORE ADD-ON REQUIRED
  // ==========================================================

  if (
    storeSubscription &&
    !storeSubscription.storeEnabled
  ) {
    const billingProblem =
      storeSubscription
        .needsPaymentAttention ===
        true;

    const existingSubscription =
      storeSubscription
        .subscribed ===
        true ||
      Boolean(
        storeSubscription
          .subscriptionId
      );

    return (
      <main className="min-h-screen bg-[#f7f5f2] px-4 py-10 text-stone-900 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-2xl shadow-stone-200/30">
            <section className="p-7 sm:p-10 lg:p-14">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#a9b897]/30 bg-[#a9b897]/10 px-4 py-2">
                    <Store
                      size={13}
                      className="text-[#718164]"
                    />

                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#718164]">
                      TOTS Store Add-on
                    </span>
                  </div>

                  <h1 className="mt-6 max-w-2xl font-serif text-5xl italic leading-[0.95] tracking-tight sm:text-6xl">
                    {billingProblem
                      ? "Your Store needs a billing update."
                      : existingSubscription
                        ? "Your Store subscription is not active."
                        : "Turn TOTS-OS into your online store."}
                  </h1>

                  <p className="mt-6 max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
                    {billingProblem
                      ? "Your Store is temporarily locked because Stripe needs attention on the subscription. Your products and store data are still there — update billing to restore access."
                      : existingSubscription
                        ? "This Store subscription does not currently grant access. Manage the subscription in Stripe, or purchase the Store add-on once the previous subscription has ended."
                        : "Sell products directly through your own TOTS storefront, manage orders and stock, connect your own Stripe account and keep your commerce alongside the rest of your business."}
                  </p>

                  {storeSubscription.status && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-[9px] font-black uppercase tracking-[0.15em] text-stone-500">
                      Status:
                      <span className="text-stone-800">
                        {storeSubscription.status.replace(
                          /_/g,
                          " "
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full shrink-0 rounded-[2rem] border border-stone-200 bg-[#faf9f7] p-6 sm:p-8 lg:w-[340px]">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                    Store add-on
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="font-serif text-6xl italic leading-none">
                      £39
                    </span>

                    <span className="pb-1.5 text-sm font-semibold text-stone-400">
                      / month
                    </span>
                  </div>

                  <div className="mt-7 space-y-3">
                    {[
                      "Your own public storefront",
                      "Unlimited product management",
                      "Orders and customer details",
                      "Inventory and low-stock tracking",
                      "Discount codes",
                      "Stripe payments to your business",
                      "Refunds and payout controls",
                    ].map(
                      (
                        feature
                      ) => (
                        <div
                          key={
                            feature
                          }
                          className="flex items-start gap-3 text-sm text-stone-600"
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#a9b897]/15 text-[#718164]">
                            <Check
                              size={11}
                              strokeWidth={3}
                            />
                          </div>

                          <span>
                            {feature}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  {storeSubscriptionError && (
                    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs leading-5 text-red-700">
                      {storeSubscriptionError}
                    </div>
                  )}

                  {billingProblem ||
                  (
                    existingSubscription &&
                    !storeSubscription
                      .needsPurchase
                  ) ? (
                    <button
                      type="button"
                      disabled={
                        openingStoreBilling
                      }
                      onClick={() =>
                        void openStoreBillingPortal()
                      }
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#829473] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {openingStoreBilling ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <CreditCard
                          size={14}
                        />
                      )}

                      Manage Store billing
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        startingStoreCheckout
                      }
                      onClick={() =>
                        void startStoreSubscriptionCheckout()
                      }
                      className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#829473] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {startingStoreCheckout ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <ArrowRight
                          size={14}
                        />
                      )}

                      Add Store for £39/month
                    </button>
                  )}

                  <p className="mt-4 text-center text-[10px] leading-5 text-stone-400">
                    Store access is activated only after Stripe confirms the Store subscription.
                  </p>
                </div>
              </div>
            </section>

            <div className="grid border-t border-stone-100 bg-stone-50 sm:grid-cols-3">
              <div className="border-b border-stone-100 p-6 sm:border-b-0 sm:border-r">
                <ShoppingBag
                  size={18}
                  className="text-[#829473]"
                />

                <p className="mt-3 text-sm font-semibold">
                  Sell from TOTS
                </p>

                <p className="mt-1 text-xs leading-5 text-stone-400">
                  Create products and share your storefront with customers.
                </p>
              </div>

              <div className="border-b border-stone-100 p-6 sm:border-b-0 sm:border-r">
                <WalletCards
                  size={18}
                  className="text-[#829473]"
                />

                <p className="mt-3 text-sm font-semibold">
                  Your Stripe account
                </p>

                <p className="mt-1 text-xs leading-5 text-stone-400">
                  Customer sales go through the connected business Stripe account.
                </p>
              </div>

              <div className="p-6">
                <TrendingUp
                  size={18}
                  className="text-[#829473]"
                />

                <p className="mt-3 text-sm font-semibold">
                  One workspace
                </p>

                <p className="mt-1 text-xs leading-5 text-stone-400">
                  Orders, customers, stock and commerce stay connected to TOTS-OS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    pageError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-10 text-center">
          <AlertTriangle
            size={26}
            className="mx-auto text-amber-500"
          />

          <h1 className="mt-5 font-serif text-4xl italic">
            Commerce couldn&apos;t load
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {pageError}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white"
          >
            <RefreshCw
              size={13}
            />

            Try again
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f7f5f2] pb-28 text-stone-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="mx-auto max-w-[1400px] px-4 pb-7 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2">
              <ShoppingBag
                size={13}
                className="text-[#829473]"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                TOTS Commerce
              </span>
            </div>

            <h1 className="max-w-4xl font-serif text-5xl italic leading-none tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Your store, connected to your business.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-500">
              Manage products, orders, stock and your public storefront alongside the rest of TOTS-OS.
            </p>

            {organisationName && (
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                {organisationName}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {storefrontUrl && (
              <a
                href={
                  storefrontUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500 no-underline"
              >
                <ExternalLink
                  size={13}
                />

                View storefront
              </a>
            )}

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadData(
                  true
                )
              }
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={
                openNewProduct
              }
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#a9b897]"
            >
              <Plus
                size={14}
              />

              New Product
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          NAV
      ===================================================== */}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5">
            {tabs.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                const active =
                  tab.label ===
                  activeTab;

                return (
                  <button
                    key={
                      tab.label
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.label
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.13em] transition ${
                      active
                        ? "bg-stone-900 text-white"
                        : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                    }`}
                  >
                    <Icon
                      size={14}
                    />

                    {
                      tab.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence
          mode="wait"
        >
          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {activeTab ===
            "Overview" && (
            <motion.div
              key="overview"
              initial={{
                opacity:
                  0,

                y:
                  8,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                    <Sparkles
                      size={18}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <SectionEyebrow>
                      TOTS Commerce Summary
                    </SectionEyebrow>

                    {orders.length ||
                    products.length ? (
                      <p className="mt-2 max-w-4xl text-lg leading-8 text-stone-700">
                        Your store currently has{" "}

                        <strong>
                          {
                            products.length
                          }{" "}
                          products
                        </strong>

                        ,{" "}

                        <strong>
                          {
                            openOrders.length
                          }{" "}
                          active orders
                        </strong>

                        {" "}and{" "}

                        <strong>
                          {
                            lowStockProducts.length
                          }{" "}
                          stock warnings
                        </strong>

                        . Paid order value currently visible is{" "}

                        <strong>
                          {money(
                            displayRevenue
                          )}
                        </strong>

                        .
                      </p>
                    ) : (
                      <p className="mt-2 max-w-4xl text-lg leading-8 text-stone-700">
                        Your commerce workspace is ready. Start by adding your first product and finishing your storefront settings.
                      </p>
                    )}
                  </div>
                </div>
              </Panel>

              {!storeSettings && (
                <div className="rounded-[2rem] border border-[#dce4d2] bg-[#f1f5ec] p-6 md:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <SectionEyebrow>
                        Storefront setup
                      </SectionEyebrow>

                      <h2 className="mt-2 font-serif text-3xl italic">
                        Finish setting up your online store.
                      </h2>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                        Add your store name, public URL, description and branding before putting the storefront live.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Settings"
                        )
                      }
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                    >
                      Set up store

                      <ArrowRight
                        size={13}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StoreMetric
                  icon={
                    CircleDollarSign
                  }
                  label="Revenue"
                  value={money(
                    displayRevenue
                  )}
                />

                <StoreMetric
                  icon={
                    ShoppingCart
                  }
                  label="Orders"
                  value={String(
                    orders.length
                  )}
                />

                <StoreMetric
                  icon={
                    TrendingUp
                  }
                  label="Avg Order"
                  value={money(
                    averageOrderValue
                  )}
                />

                <StoreMetric
                  icon={
                    AlertTriangle
                  }
                  label="Low Stock"
                  value={String(
                    lowStockProducts.length
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                <Panel className="lg:col-span-7">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Fulfilment
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-2xl italic">
                        Orders needing attention
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Orders"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      View all
                    </button>
                  </div>

                  {!openOrders.length ? (
                    <EmptyState
                      icon={
                        PackageCheck
                      }
                      title="No open orders"
                      text="New storefront orders will appear here ready for fulfilment."
                    />
                  ) : (
                    <div className="space-y-3">
                      {openOrders
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            order
                          ) => (
                            <OrderRow
                              key={
                                order.id
                              }
                              order={
                                order
                              }
                              money={
                                money
                              }
                              loading={
                                updatingOrderId ===
                                order.id
                              }
                              onAdvance={() =>
                                void advanceOrder(
                                  order
                                )
                              }
                            />
                          )
                        )}
                    </div>
                  )}
                </Panel>

                <Panel className="lg:col-span-5">
                  <SectionEyebrow>
                    Store Snapshot
                  </SectionEyebrow>

                  <h2 className="mt-1 font-serif text-2xl italic">
                    Current position
                  </h2>

                  <div className="mt-6 space-y-4">
                    <DetailRow
                      label="Storefront"
                      value={
                        storeLive
                          ? "Live"
                          : "Hidden"
                      }
                    />

                    <DetailRow
                      label="Open orders"
                      value={String(
                        openOrders.length
                      )}
                    />

                    <DetailRow
                      label="Paid orders"
                      value={String(
                        paidOrders.length
                      )}
                    />

                    <DetailRow
                      label="Order value"
                      value={money(
                        orderRevenue
                      )}
                    />

                    <DetailRow
                      label="Active products"
                      value={String(
                        products.filter(
                          (
                            product
                          ) =>
                            product.status ===
                            "active"
                        ).length
                      )}
                    />

                    <DetailRow
                      label="Active discount codes"
                      value={String(
                        activeDiscounts.length
                      )}
                    />
                  </div>
                </Panel>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Panel>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Performance
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-2xl italic">
                        Best sellers
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "Products"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      Products
                    </button>
                  </div>

                  {!bestSellers.length ? (
                    <EmptyState
                      icon={
                        TrendingUp
                      }
                      title="No sales data yet"
                      text="Once customers begin ordering, your best sellers will appear here."
                    />
                  ) : (
                    <div className="space-y-3">
                      {bestSellers.map(
                        (
                          product,
                          index
                        ) => (
                          <div
                            key={
                              product.id
                            }
                            className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400">
                              <span className="font-serif text-lg italic">
                                #
                                {
                                  index +
                                  1
                                }
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {
                                  product.name
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-stone-400">
                                {
                                  product.orders
                                }{" "}
                                items sold
                              </p>
                            </div>

                            <p className="font-serif text-lg italic">
                              {money(
                                product.revenue
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </Panel>

                <Panel>
                  <SectionEyebrow>
                    Inventory
                  </SectionEyebrow>

                  <h2 className="mt-1 font-serif text-2xl italic">
                    Stock warnings
                  </h2>

                  <div className="mt-6">
                    {!lowStockProducts.length ? (
                      <EmptyState
                        icon={
                          Check
                        }
                        title="Stock looks healthy"
                        text="Nothing is currently below your low-stock threshold."
                      />
                    ) : (
                      <div className="space-y-3">
                        {lowStockProducts.map(
                          (
                            product
                          ) => (
                            <button
                              type="button"
                              key={
                                product.id
                              }
                              onClick={() =>
                                openStockAdjust(
                                  product
                                )
                              }
                              className="flex w-full items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-stone-700">
                                  {
                                    product.name
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-amber-700">
                                  {
                                    product.inventory_quantity
                                  }{" "}
                                  left in stock
                                </p>
                              </div>

                              <AlertTriangle
                                size={16}
                                className="text-amber-500"
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </Panel>
              </div>

              <Panel>
                <SectionEyebrow>
                  Connected Business
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Commerce inside the rest of TOTS-OS
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                  <ConnectionCard
                    icon={
                      Users
                    }
                    title="Customers"
                    text="Store customers can become CRM contacts instead of living in another system."
                  />

                  <ConnectionCard
                    icon={
                      CircleDollarSign
                    }
                    title="Finance"
                    text="Store revenue can feed directly into the wider financial picture."
                  />

                  <ConnectionCard
                    icon={
                      PackageCheck
                    }
                    title="Fulfilment"
                    text="Orders and dispatch become trackable operational work."
                  />

                  <ConnectionCard
                    icon={
                      Sparkles
                    }
                    title="Clarity"
                    text="Use sales, stock and customer activity as business context."
                  />
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              PRODUCTS
          ================================================== */}

          {activeTab ===
            "Products" && (
            <motion.div
              key="products"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Catalogue
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Products
                    </h2>

                    <p className="mt-2 text-sm text-stone-500">
                      Products created here are the same database products used by your public TOTS storefront.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                      />

                      <input
                        value={
                          productSearch
                        }
                        onChange={(
                          event
                        ) =>
                          setProductSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search products..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-xs outline-none sm:w-64"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={
                        openNewProduct
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase text-white"
                    >
                      <Plus
                        size={13}
                      />

                      New Product
                    </button>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-2xl border border-stone-100">
                  <div className="hidden grid-cols-[minmax(0,1.7fr)_1fr_.7fr_.7fr_.8fr_90px] gap-4 border-b bg-stone-50 px-5 py-4 text-[8px] font-black uppercase tracking-wider text-stone-400 md:grid">
                    <span>
                      Product
                    </span>

                    <span>
                      Category
                    </span>

                    <span>
                      Price
                    </span>

                    <span>
                      Stock
                    </span>

                    <span>
                      Status
                    </span>

                    <span />
                  </div>

                  {!filteredProducts.length ? (
                    <div className="p-12">
                      <EmptyState
                        icon={
                          Package
                        }
                        title="No products yet"
                        text="Create your first product and it will be available to your storefront."
                      />

                      {!productSearch && (
                        <div className="mt-5 text-center">
                          <button
                            type="button"
                            onClick={
                              openNewProduct
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-wider text-white"
                          >
                            <Plus
                              size={13}
                            />

                            Add first product
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredProducts.map(
                      (
                        product
                      ) => (
                        <div
                          key={
                            product.id
                          }
                          className="grid gap-4 border-b border-stone-100 px-5 py-5 last:border-0 md:grid-cols-[minmax(0,1.7fr)_1fr_.7fr_.7fr_.8fr_90px] md:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50 text-stone-300">
                              {product.image_url ? (
                                <img
                                  src={
                                    product.image_url
                                  }
                                  alt={
                                    product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={17}
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-stone-700">
                                  {
                                    product.name
                                  }
                                </p>

                                {product.featured && (
                                  <span className="rounded-full bg-[#edf1e8] px-2 py-1 text-[7px] font-black uppercase text-[#82936b]">
                                    Featured
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-[10px] text-stone-400">
                                {
                                  product.sku
                                }
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-stone-500">
                            {
                              product.category
                            }
                          </p>

                          <p className="text-xs font-semibold">
                            {money(
                              product.price
                            )}
                          </p>

                          {product.track_inventory ? (
                            <button
                              type="button"
                              onClick={() =>
                                openStockAdjust(
                                  product
                                )
                              }
                              className="w-fit text-left"
                            >
                              <p className="text-xs font-semibold">
                                {
                                  product.inventory_quantity
                                }
                              </p>

                              {product.inventory_quantity <=
                                Number(
                                  lowStockThreshold
                                ) && (
                                <p className="mt-1 text-[9px] text-amber-600">
                                  Low stock
                                </p>
                              )}
                            </button>
                          ) : (
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-stone-400">
                              Unlimited
                            </p>
                          )}

                          <StatusBadge
                            status={
                              product.status
                            }
                          />

                          <div className="flex gap-1 md:justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                openEditProduct(
                                  product
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                            >
                              <Edit3
                                size={13}
                              />
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingProductId ===
                                product.id
                              }
                              onClick={() =>
                                void deleteProduct(
                                  product
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-400 disabled:opacity-50"
                            >
                              {deletingProductId ===
                              product.id ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={13}
                                />
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              ORDERS
          ================================================== */}

          {activeTab ===
            "Orders" && (
            <motion.div
              key="orders"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StoreMetric
                  icon={
                    ShoppingBag
                  }
                  label="Orders"
                  value={String(
                    orders.length
                  )}
                />

                <StoreMetric
                  icon={
                    Package
                  }
                  label="Open"
                  value={String(
                    openOrders.length
                  )}
                />

                <StoreMetric
                  icon={
                    CreditCard
                  }
                  label="Paid"
                  value={String(
                    paidOrders.length
                  )}
                />

                <StoreMetric
                  icon={
                    CircleDollarSign
                  }
                  label="Paid Value"
                  value={money(
                    orderRevenue
                  )}
                />
              </div>

              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Fulfilment
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Orders
                    </h2>

                    <p className="mt-2 text-sm text-stone-500">
                      Orders placed through the TOTS storefront will appear here.
                    </p>
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                    />

                    <input
                      value={
                        orderSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setOrderSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search orders..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-xs outline-none sm:w-72"
                    />
                  </div>
                </div>

                {!filteredOrders.length ? (
                  <div className="mt-8">
                    <EmptyState
                      icon={
                        ShoppingBag
                      }
                      title="No orders yet"
                      text="Once customers place orders on your storefront, they will appear here for fulfilment."
                    />
                  </div>
                ) : (
                  <div className="mt-8 space-y-3">
                    {filteredOrders.map(
                      (
                        order
                      ) => (
                        <div
                          key={
                            order.id
                          }
                          className="rounded-2xl border border-stone-100 bg-stone-50 p-5"
                        >
                          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-stone-400">
                                <ShoppingBag
                                  size={16}
                                />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {
                                      order.number
                                    }
                                  </p>

                                  <OrderStatusBadge
                                    status={
                                      order.status
                                    }
                                  />

                                  <PaymentBadge
                                    status={
                                      order.paymentStatus
                                    }
                                  />
                                </div>

                                <p className="mt-2 text-xs font-medium text-stone-600">
                                  {
                                    order.customer
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-stone-400">
                                  {
                                    order.email
                                  }{" "}
                                  ·{" "}
                                  {
                                    order.items
                                  }{" "}
                                  items ·{" "}
                                  {
                                    order.createdAt
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 md:justify-end">
                              <p className="font-serif text-2xl italic">
                                {money(
                                  order.total
                                )}
                              </p>

                              {![
                                "delivered",
                                "cancelled",
                              ].includes(
                                order.status
                              ) && (
                                <button
                                  type="button"
                                  disabled={
                                    updatingOrderId ===
                                    order.id
                                  }
                                  onClick={() =>
                                    void advanceOrder(
                                      order
                                    )
                                  }
                                  className="rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-white disabled:opacity-50"
                                >
                                  {updatingOrderId ===
                                  order.id
                                    ? "Saving..."
                                    : order.status ===
                                        "new"
                                      ? "Start"
                                      : order.status ===
                                          "processing"
                                        ? "Dispatch"
                                        : "Delivered"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  contactOrderCustomer(
                                    order
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-[8px] font-black uppercase tracking-[0.1em] text-stone-500 transition hover:border-[#a9b897] hover:text-stone-800"
                              >
                                <Mail
                                  size={12}
                                />

                                Contact
                              </button>

                              <button
                                type="button"
                                disabled={
                                  order.paymentStatus !==
                                    "paid" ||
                                  !stripeStatus.connected
                                }
                                onClick={() =>
                                  openRefund(
                                    order
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-[8px] font-black uppercase tracking-[0.1em] text-stone-500 transition hover:border-[#a9b897] hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <RotateCcw
                                  size={12}
                                />

                                Refund
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedOrder(
                                    order
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                                aria-label={`View ${order.number}`}
                              >
                                <Eye
                                  size={14}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              PAYMENTS
          ================================================== */}

          {activeTab ===
            "Payments" && (
            <motion.div
              key="payments"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-[#a9b897]">
                      <WalletCards
                        size={19}
                      />
                    </div>

                    <div>
                      <SectionEyebrow>
                        Stripe Connect
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-3xl italic text-stone-900">
                        Store payments & payouts
                      </h2>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                        Connect your own Stripe account so customer payments are processed for your business. TOTS-OS gives you a simpler control panel while Stripe securely holds and pays out your funds.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!stripeStatus.connected ? (
                      <button
                        type="button"
                        onClick={() =>
                          void connectStripeAccount()
                        }
                        disabled={
                          connectingStripe
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-[9px] font-black uppercase tracking-[0.13em] text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:opacity-50"
                      >
                        {connectingStripe ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />
                        ) : (
                          <CreditCard
                            size={13}
                          />
                        )}

                        Connect Stripe account
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void loadStripeStatus()
                          }
                          disabled={
                            loadingStripe
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-500 transition hover:text-stone-900 disabled:opacity-50"
                        >
                          <RefreshCw
                            size={12}
                            className={
                              loadingStripe
                                ? "animate-spin"
                                : ""
                            }
                          />

                          Refresh
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void openStripeDashboard()
                          }
                          disabled={
                            openingStripeDashboard
                          }
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 text-[8px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:opacity-50"
                        >
                          {openingStripeDashboard ? (
                            <Loader2
                              size={12}
                              className="animate-spin"
                            />
                          ) : (
                            <ExternalLink
                              size={12}
                            />
                          )}

                          Stripe dashboard
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-7 grid overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="border-b border-stone-100 p-5 sm:border-r xl:border-b-0">
                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-stone-400">
                      Connection
                    </p>

                    <p className="mt-2 text-sm font-bold text-stone-700">
                      {stripeStatus.connected
                        ? "Connected"
                        : "Not connected"}
                    </p>
                  </div>

                  <div className="border-b border-stone-100 p-5 sm:border-r xl:border-b-0">
                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-stone-400">
                      Payments
                    </p>

                    <p className="mt-2 text-sm font-bold text-stone-700">
                      {stripeStatus.chargesEnabled
                        ? "Enabled"
                        : "Not enabled"}
                    </p>
                  </div>

                  <div className="border-b border-stone-100 p-5 sm:border-r xl:border-b-0">
                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-stone-400">
                      Payouts
                    </p>

                    <p className="mt-2 text-sm font-bold text-stone-700">
                      {stripeStatus.payoutsEnabled
                        ? "Enabled"
                        : "Not enabled"}
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-stone-400">
                      Stripe account
                    </p>

                    <p className="mt-2 truncate text-sm font-bold text-stone-700">
                      {stripeStatus.accountId ||
                        "—"}
                    </p>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-4 md:grid-cols-2">
                <Panel>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SectionEyebrow>
                        Available
                      </SectionEyebrow>

                      <p className="mt-3 font-serif text-5xl italic text-stone-900">
                        {money(
                          stripeStatus.availableBalance
                        )}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-stone-500">
                        Funds Stripe currently reports as available for payout.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#a9b897]/15 text-[#829473]">
                      <Banknote
                        size={17}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void requestStripePayout()
                    }
                    disabled={
                      !stripeStatus.connected ||
                      !stripeStatus.payoutsEnabled ||
                      stripeStatus.availableBalance <=
                        0 ||
                      requestingPayout
                    }
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#a9b897] px-4 text-[8px] font-black uppercase tracking-[0.13em] text-white transition hover:bg-[#98aa85] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {requestingPayout ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                    ) : (
                      <Banknote
                        size={12}
                      />
                    )}

                    Withdraw available balance
                  </button>
                </Panel>

                <Panel>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">
                        Pending
                      </p>

                      <p className="mt-3 font-serif text-5xl italic text-stone-900">
                        {money(
                          stripeStatus.pendingBalance
                        )}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-stone-500">
                        Payments still clearing through Stripe before they become available.
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
                      <CreditCard
                        size={17}
                      />
                    </div>
                  </div>
                </Panel>
              </div>

              <Panel>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionEyebrow>
                      Account management
                    </SectionEyebrow>

                    <h3 className="mt-1 font-serif text-2xl italic text-stone-800">
                      Bank details, payouts & verification
                    </h3>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-stone-500">
                      Bank account changes, identity verification and Stripe payout schedules are managed securely through Stripe rather than being stored inside TOTS-OS.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void openStripeDashboard()
                    }
                    disabled={
                      !stripeStatus.connected ||
                      openingStripeDashboard
                    }
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-600 transition hover:border-[#a9b897] hover:text-stone-900 disabled:opacity-40"
                  >
                    {openingStripeDashboard ? (
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                    ) : (
                      <ExternalLink
                        size={12}
                      />
                    )}

                    Manage in Stripe
                  </button>
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              INVENTORY
          ================================================== */}

          {activeTab ===
            "Inventory" && (
            <motion.div
              key="inventory"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Stock Control
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Inventory
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                      Stock levels here are written directly to the same products used by the public storefront.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-stone-50 px-5 py-4">
                    <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                      Low stock threshold
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={
                          lowStockThreshold
                        }
                        onChange={(
                          event
                        ) =>
                          setLowStockThreshold(
                            event.target.value
                          )
                        }
                        className="w-20 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs outline-none"
                      />

                      <span className="text-xs text-stone-400">
                        units
                      </span>
                    </div>
                  </div>
                </div>
              </Panel>

              {!products.length ? (
                <EmptyState
                  icon={
                    Boxes
                  }
                  title="Nothing to track yet"
                  text="Create products first and their inventory will appear here."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {products.map(
                    (
                      product
                    ) => {
                      const inventoryTracked =
                        product.track_inventory !==
                        false;

                      const low =
                        inventoryTracked &&
                        product.inventory_quantity <=
                          Number(
                            lowStockThreshold
                          );

                      const soldOut =
                        inventoryTracked &&
                        product.inventory_quantity <=
                          0;

                      return (
                        <div
                          key={
                            product.id
                          }
                          className={`rounded-[1.7rem] border bg-white p-6 ${
                            soldOut
                              ? "border-red-200"
                              : low
                                ? "border-amber-200"
                                : "border-stone-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-50 text-stone-400">
                              <Boxes
                                size={17}
                              />
                            </div>

                            {!inventoryTracked ? (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[8px] font-black uppercase text-blue-500">
                                Unlimited
                              </span>
                            ) : soldOut ? (
                              <span className="rounded-full bg-red-50 px-3 py-1 text-[8px] font-black uppercase text-red-500">
                                Sold out
                              </span>
                            ) : low ? (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-[8px] font-black uppercase text-amber-600">
                                Low stock
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#edf1e8] px-3 py-1 text-[8px] font-black uppercase text-[#82936b]">
                                Healthy
                              </span>
                            )}
                          </div>

                          <h3 className="mt-6 text-sm font-semibold">
                            {
                              product.name
                            }
                          </h3>

                          <p className="mt-1 text-[10px] text-stone-400">
                            {
                              product.sku
                            }
                          </p>

                          <div className="mt-7 flex items-end justify-between">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                                Available
                              </p>

                              <p className="mt-1 font-serif text-4xl italic">
                                {inventoryTracked
                                  ? product.inventory_quantity
                                  : "∞"}
                              </p>
                            </div>

                            {inventoryTracked && (
                              <button
                                type="button"
                                onClick={() =>
                                  openStockAdjust(
                                    product
                                  )
                                }
                                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[8px] font-black uppercase text-stone-500"
                              >
                                Adjust
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ==================================================
              DISCOUNTS
          ================================================== */}

          {activeTab ===
            "Discounts" && (
            <motion.div
              key="discounts"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StoreMetric
                  icon={
                    BadgePercent
                  }
                  label="Discount Codes"
                  value={String(
                    discounts.length
                  )}
                />

                <StoreMetric
                  icon={
                    Check
                  }
                  label="Active"
                  value={String(
                    activeDiscounts.length
                  )}
                />

                <StoreMetric
                  icon={
                    ShoppingCart
                  }
                  label="Redemptions"
                  value={String(
                    totalDiscountRedemptions
                  )}
                />

                <StoreMetric
                  icon={
                    Tag
                  }
                  label="Expired"
                  value={String(
                    expiredDiscounts.length
                  )}
                />
              </div>

              <Panel>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionEyebrow>
                      Promotions
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Discount codes
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                      Create percentage or fixed-value offers for your storefront, set limits and control exactly when they can be used.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                      />

                      <input
                        value={
                          discountSearch
                        }
                        onChange={(
                          event
                        ) =>
                          setDiscountSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search codes..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-xs outline-none sm:w-60"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={
                        openNewDiscount
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-wider text-white"
                    >
                      <Plus
                        size={13}
                      />

                      New Code
                    </button>
                  </div>
                </div>

                {!discounts.length ? (
                  <div className="mt-8">
                    <EmptyState
                      icon={
                        BadgePercent
                      }
                      title="No discount codes"
                      text="Create your first promotion and it will be ready for your storefront checkout."
                    />

                    <div className="mt-5 text-center">
                      <button
                        type="button"
                        onClick={
                          openNewDiscount
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-wider text-white"
                      >
                        <Plus
                          size={13}
                        />

                        Create discount
                      </button>
                    </div>
                  </div>
                ) : !filteredDiscounts.length ? (
                  <div className="mt-8">
                    <EmptyState
                      icon={
                        Search
                      }
                      title="No matching codes"
                      text="Try a different search."
                    />
                  </div>
                ) : (
                  <div className="mt-8 space-y-3">
                    {filteredDiscounts.map(
                      (
                        discount
                      ) => {
                        const status =
                          getDiscountStatus(
                            discount
                          );

                        return (
                          <div
                            key={
                              discount.id
                            }
                            className="rounded-2xl border border-stone-100 bg-stone-50 p-5"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex min-w-0 items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#829473]">
                                  <BadgePercent
                                    size={17}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-black tracking-[0.08em] text-stone-800">
                                      {
                                        discount.code
                                      }
                                    </p>

                                    <DiscountStatusBadge
                                      status={
                                        status
                                      }
                                    />
                                  </div>

                                  <p className="mt-2 font-serif text-2xl italic text-stone-800">
                                    {discount.discount_type ===
                                    "percentage"
                                      ? `${discount.value}% off`
                                      : `${money(
                                          discount.value
                                        )} off`}
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-stone-400">
                                    {discount.minimum_order_amount >
                                      0 && (
                                      <span>
                                        Min.{" "}
                                        {money(
                                          discount.minimum_order_amount
                                        )}
                                      </span>
                                    )}

                                    {discount.maximum_discount_amount !==
                                      null && (
                                      <span>
                                        Max. discount{" "}
                                        {money(
                                          discount.maximum_discount_amount
                                        )}
                                      </span>
                                    )}

                                    <span>
                                      {
                                        discount.usage_count
                                      }
                                      {discount.usage_limit !==
                                      null
                                        ? ` / ${discount.usage_limit}`
                                        : ""}{" "}
                                      uses
                                    </span>

                                    {discount.starts_at && (
                                      <span>
                                        Starts{" "}
                                        {formatDate(
                                          discount.starts_at
                                        )}
                                      </span>
                                    )}

                                    {discount.expires_at && (
                                      <span>
                                        Ends{" "}
                                        {formatDate(
                                          discount.expires_at
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {discount.description && (
                                    <p className="mt-3 max-w-2xl text-[10px] leading-5 text-stone-400">
                                      {
                                        discount.description
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void toggleDiscount(
                                      discount
                                    )
                                  }
                                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                                    discount.is_active
                                      ? "bg-[#a9b897]"
                                      : "bg-stone-200"
                                  }`}
                                  aria-label={
                                    discount.is_active
                                      ? "Disable discount"
                                      : "Enable discount"
                                  }
                                >
                                  <span
                                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                                      discount.is_active
                                        ? "left-7"
                                        : "left-1"
                                    }`}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditDiscount(
                                      discount
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-stone-400 transition hover:text-stone-700"
                                >
                                  <Edit3
                                    size={13}
                                  />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    deletingDiscountId ===
                                    discount.id
                                  }
                                  onClick={() =>
                                    void deleteDiscount(
                                      discount
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-400 disabled:opacity-50"
                                >
                                  {deletingDiscountId ===
                                  discount.id ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={13}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </Panel>

              <Panel>
                <SectionEyebrow>
                  How discounts work
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Flexible promotions without managing them in Stripe.
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <DiscountInfoCard
                    icon={
                      BadgePercent
                    }
                    title="Percentage"
                    text="Use codes such as WELCOME10 to offer a percentage off the basket."
                  />

                  <DiscountInfoCard
                    icon={
                      Tag
                    }
                    title="Fixed amount"
                    text="Offer a set amount off, such as £10 off an eligible order."
                  />

                  <DiscountInfoCard
                    icon={
                      ShoppingCart
                    }
                    title="Control usage"
                    text="Add minimum spend, usage limits, start dates and expiry dates."
                  />
                </div>
              </Panel>
            </motion.div>
          )}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          {activeTab ===
            "Settings" && (
            <motion.div
              key="settings"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <SectionEyebrow>
                      Public Storefront
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Store setup
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                      These settings are stored in your store_settings row and control the public store at{" "}

                      <strong>
                        /shop/
                        {
                          slug ||
                          "your-store"
                        }
                      </strong>

                      .
                    </p>
                  </div>

                  {storefrontUrl && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void copyStorefrontUrl()
                        }
                        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-stone-500"
                      >
                        <Copy
                          size={12}
                        />

                        Copy URL
                      </button>

                      <a
                        href={
                          storefrontUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-white no-underline"
                      >
                        Open store

                        <ExternalLink
                          size={12}
                        />
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <Field
                    label="Store Name"
                  >
                    <input
                      value={
                        storeName
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreName(
                          event.target.value
                        )
                      }
                      className="store-input"
                      placeholder="My Business Store"
                    />
                  </Field>

                  <Field
                    label="Store URL"
                  >
                    <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      <span className="flex items-center border-r border-stone-200 px-3 text-[10px] text-stone-400">
                        /shop/
                      </span>

                      <input
                        value={
                          slug
                        }
                        onChange={(
                          event
                        ) =>
                          setSlug(
                            createSlug(
                              event.target.value
                            )
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-xs outline-none"
                        placeholder="my-business"
                      />
                    </div>
                  </Field>

                  <Field
                    label="Support Email"
                  >
                    <input
                      type="email"
                      value={
                        supportEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setSupportEmail(
                          event.target.value
                        )
                      }
                      className="store-input"
                      placeholder="hello@business.com"
                    />
                  </Field>

                  <Field
                    label="Accent Colour"
                  >
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={
                          accentColour
                        }
                        onChange={(
                          event
                        ) =>
                          setAccentColour(
                            event.target.value
                          )
                        }
                        className="h-[48px] w-14 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
                      />

                      <input
                        value={
                          accentColour
                        }
                        onChange={(
                          event
                        ) =>
                          setAccentColour(
                            event.target.value
                          )
                        }
                        className="store-input"
                      />
                    </div>
                  </Field>

                  <Field
                    label="Store Description"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={
                        storeDescription
                      }
                      onChange={(
                        event
                      ) =>
                        setStoreDescription(
                          event.target.value
                        )
                      }
                      rows={4}
                      className="store-input resize-none"
                      placeholder="Tell customers about your business..."
                    />
                  </Field>

                  <Field
                    label="Hero Title"
                  >
                    <input
                      value={
                        heroTitle
                      }
                      onChange={(
                        event
                      ) =>
                        setHeroTitle(
                          event.target.value
                        )
                      }
                      className="store-input"
                      placeholder="Shop our collection."
                    />
                  </Field>

                  <Field
                    label="Announcement"
                  >
                    <input
                      value={
                        announcement
                      }
                      onChange={(
                        event
                      ) =>
                        setAnnouncement(
                          event.target.value
                        )
                      }
                      className="store-input"
                      placeholder="Free UK delivery over £50"
                    />
                  </Field>

                  <Field
                    label="Hero Text"
                    className="md:col-span-2"
                  >
                    <textarea
                      value={
                        heroText
                      }
                      onChange={(
                        event
                      ) =>
                        setHeroText(
                          event.target.value
                        )
                      }
                      rows={3}
                      className="store-input resize-none"
                    />
                  </Field>

                  <Field
                    label="Shipping Text"
                    className="md:col-span-2"
                  >
                    <input
                      value={
                        shippingText
                      }
                      onChange={(
                        event
                      ) =>
                        setShippingText(
                          event.target.value
                        )
                      }
                      className="store-input"
                      placeholder="UK delivery available."
                    />
                  </Field>

                  <Field
                    label="Currency"
                  >
                    <select
                      value={
                        currency
                      }
                      onChange={(
                        event
                      ) =>
                        setCurrency(
                          event.target.value
                        )
                      }
                      className="store-input"
                    >
                      <option value="GBP">
                        GBP — £
                      </option>

                      <option value="EUR">
                        EUR — €
                      </option>

                      <option value="USD">
                        USD — $
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Low Stock Warning"
                  >
                    <input
                      type="number"
                      min="0"
                      value={
                        lowStockThreshold
                      }
                      onChange={(
                        event
                      ) =>
                        setLowStockThreshold(
                          event.target.value
                        )
                      }
                      className="store-input"
                    />
                  </Field>
                </div>

                <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-stone-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-700">
                      Public storefront
                    </p>

                    <p className="mt-1 text-xs leading-5 text-stone-400">
                      Save after changing this switch. The public storefront uses is_live to decide whether the store is accessible.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setStoreLive(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                    className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                      storeLive
                        ? "bg-[#a9b897]"
                        : "bg-stone-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                        storeLive
                          ? "left-7"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={
                    savingSettings
                  }
                  onClick={() =>
                    void saveStoreSettings()
                  }
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50 sm:w-auto sm:px-7"
                >
                  {savingSettings ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={14}
                    />
                  )}

                  {savingSettings
                    ? "Saving..."
                    : storeSettings
                      ? "Save Store"
                      : "Create Store"}
                </button>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  TOTS Integration
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Connect commerce to the rest of the business
                </h2>

                <div className="mt-7 space-y-4">
                  <ToggleSetting
                    title="Create CRM contacts from customers"
                    text="When a new customer places an order, create or match them inside Contacts."
                    enabled={
                      autoCreateContacts
                    }
                    onChange={() =>
                      setAutoCreateContacts(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                  />

                  <ToggleSetting
                    title="Order notifications"
                    text="Surface new and important orders inside the TOTS workspace."
                    enabled={
                      orderNotifications
                    }
                    onChange={() =>
                      setOrderNotifications(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                  />
                </div>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  TOTS Storefront
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Your selling channel
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <IntegrationCard
                    name="TOTS Storefront"
                    text="Your hosted storefront is built directly into TOTS-OS."
                    connected={
                      !!storeSettings
                    }
                  />

                  <IntegrationCard
                    name="Stripe"
                    text="Stripe Checkout is used for secure storefront payments."
                    connected
                  />

                  <IntegrationCard
                    name="Custom Domain"
                    text="Let businesses point their own domain at their TOTS storefront."
                    comingSoon
                  />
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* =====================================================
          ORDER DETAILS MODAL
      ===================================================== */}

      <AnimatePresence>
        {selectedOrder && (
          <ModalShell
            onClose={() =>
              setSelectedOrder(
                null
              )
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Order details
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  {selectedOrder.number}
                </h2>

                <p className="mt-2 text-xs text-stone-400">
                  {selectedOrder.createdAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 text-stone-500"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Customer
                </p>

                <p className="mt-2 text-sm font-semibold text-stone-700">
                  {selectedOrder.customer}
                </p>

                <p className="mt-1 break-all text-xs text-stone-400">
                  {selectedOrder.email}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Order total
                </p>

                <p className="mt-2 font-serif text-3xl italic text-stone-900">
                  {money(
                    selectedOrder.total
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Payment
                </p>

                <div className="mt-2">
                  <PaymentBadge
                    status={
                      selectedOrder.paymentStatus
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                  Fulfilment
                </p>

                <div className="mt-2">
                  <OrderStatusBadge
                    status={
                      selectedOrder.status
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-100 bg-white p-5">
              <DetailRow
                label="Items"
                value={String(
                  selectedOrder.items
                )}
              />

              <DetailRow
                label="Subtotal"
                value={money(
                  firstNumber(
                    selectedOrder.raw.subtotal
                  )
                )}
              />

              <DetailRow
                label="Discount"
                value={money(
                  firstNumber(
                    selectedOrder.raw.discount_amount
                  )
                )}
              />

              <DetailRow
                label="Shipping"
                value={money(
                  firstNumber(
                    selectedOrder.raw.shipping_amount
                  )
                )}
              />

              <DetailRow
                label="Total"
                value={money(
                  selectedOrder.total
                )}
              />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  contactOrderCustomer(
                    selectedOrder
                  )
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-600 transition hover:border-[#a9b897] hover:text-stone-900"
              >
                <Mail
                  size={12}
                />

                Contact customer
              </button>

              <button
                type="button"
                disabled={
                  selectedOrder.paymentStatus !==
                    "paid" ||
                  !stripeStatus.connected
                }
                onClick={() =>
                  openRefund(
                    selectedOrder
                  )
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-[8px] font-black uppercase tracking-[0.12em] text-stone-600 transition hover:border-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <RotateCcw
                  size={12}
                />

                Refund order
              </button>
            </div>

            {![
              "delivered",
              "cancelled",
            ].includes(
              selectedOrder.status
            ) && (
              <button
                type="button"
                disabled={
                  updatingOrderId ===
                  selectedOrder.id
                }
                onClick={() =>
                  void advanceOrder(
                    selectedOrder
                  )
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
              >
                {updatingOrderId ===
                selectedOrder.id ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : selectedOrder.status ===
                  "new" ? (
                  <>
                    Start processing
                    <ArrowRight
                      size={13}
                    />
                  </>
                ) : selectedOrder.status ===
                  "processing" ? (
                  <>
                    Mark dispatched
                    <ArrowRight
                      size={13}
                    />
                  </>
                ) : (
                  <>
                    Mark delivered
                    <Check
                      size={13}
                    />
                  </>
                )}
              </button>
            )}

            {selectedOrder.status ===
              "delivered" && (
              <div className="mt-6 rounded-2xl bg-[#edf1e8] p-4 text-center">
                <p className="text-xs font-semibold text-[#687a59]">
                  This order has been marked as delivered.
                </p>
              </div>
            )}
          </ModalShell>
        )}
      </AnimatePresence>

      {/* =====================================================
          REFUND MODAL
      ===================================================== */}

      <AnimatePresence>
        {refundForm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close refund"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              onClick={() => {
                if (
                  !refundingOrderId
                ) {
                  setRefundForm(
                    null
                  );
                }
              }}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.96,

                y:
                  12,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,

                scale:
                  0.96,

                y:
                  12,
              }}
              className="relative z-10 w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <SectionEyebrow>
                    Stripe refund
                  </SectionEyebrow>

                  <h3 className="mt-1 font-serif text-3xl italic text-stone-900">
                    Refund {refundForm.order.number}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    Customer: {refundForm.order.customer} · Order total {money(
                      refundForm.order.total
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    Boolean(
                      refundingOrderId
                    )
                  }
                  onClick={() =>
                    setRefundForm(
                      null
                    )
                  }
                  className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
                >
                  <X
                    size={17}
                  />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
                    Refund amount
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    max={
                      refundForm.order.total
                    }
                    step="0.01"
                    value={
                      refundForm.amount
                    }
                    onChange={(
                      event
                    ) =>
                      setRefundForm(
                        (
                          current
                        ) =>
                          current
                            ? {
                                ...current,

                                amount:
                                  event.target.value,
                              }
                            : current
                      )
                    }
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm outline-none focus:border-[#a9b897] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
                    Reason
                  </label>

                  <select
                    value={
                      refundForm.reason
                    }
                    onChange={(
                      event
                    ) =>
                      setRefundForm(
                        (
                          current
                        ) =>
                          current
                            ? {
                                ...current,

                                reason:
                                  event.target.value as RefundFormState["reason"],
                              }
                            : current
                      )
                    }
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm outline-none focus:border-[#a9b897] focus:bg-white"
                  >
                    <option value="requested_by_customer">
                      Requested by customer
                    </option>

                    <option value="duplicate">
                      Duplicate payment
                    </option>

                    <option value="fraudulent">
                      Fraudulent payment
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void submitRefund()
                  }
                  disabled={
                    Boolean(
                      refundingOrderId
                    )
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 text-[9px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:opacity-50"
                >
                  {refundingOrderId ? (
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />
                  ) : (
                    <RotateCcw
                      size={13}
                    />
                  )}

                  Process refund
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =====================================================
          PRODUCT MODAL
      ===================================================== */}

      <AnimatePresence>
        {showProductModal && (
          <ModalShell
            onClose={() => {
              if (
                !savingProduct
              ) {
                setShowProductModal(
                  false
                );
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Catalogue
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  {productForm.id
                    ? "Edit product"
                    : "New product"}
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  savingProduct
                }
                onClick={() =>
                  setShowProductModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 disabled:opacity-50"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <Field
                label="Product Name"
                className="md:col-span-2"
              >
                <input
                  value={
                    productForm.name
                  }
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target.value;

                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        name:
                          value,

                        slug:
                          !previous.id &&
                          (
                            !previous.slug ||
                            previous.slug ===
                              createSlug(
                                previous.name
                              )
                          )
                            ? createSlug(
                                value
                              )
                            : previous.slug,
                      })
                    );
                  }}
                  placeholder="Classic Canvas Tote"
                  className="store-input"
                />
              </Field>

              <Field
                label="Product URL"
                className="md:col-span-2"
              >
                <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <span className="flex items-center border-r border-stone-200 px-3 text-[10px] text-stone-400">
                    product/
                  </span>

                  <input
                    value={
                      productForm.slug
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          slug:
                            createSlug(
                              event.target.value
                            ),
                        })
                      )
                    }
                    placeholder="classic-canvas-tote"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-xs outline-none"
                  />
                </div>
              </Field>

              <Field
                label="SKU"
              >
                <input
                  value={
                    productForm.sku
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        sku:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Leave blank to generate"
                  className="store-input"
                />
              </Field>

              <Field
                label="Category"
              >
                <input
                  value={
                    productForm.category
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        category:
                          event.target.value,
                      })
                    )
                  }
                  className="store-input"
                />
              </Field>

              <Field
                label="Sale Price"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    productForm.price
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        price:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="29.00"
                  className="store-input"
                />
              </Field>

              <Field
                label="Compare At Price"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    productForm.compareAtPrice
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        compareAtPrice:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="39.00"
                  className="store-input"
                />
              </Field>

              <Field
                label="Cost Price"
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    productForm.cost
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        cost:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="8.00"
                  className="store-input"
                />
              </Field>

              <Field
                label="Stock"
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={
                    !productForm.trackInventory
                  }
                  value={
                    productForm.stock
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        stock:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="20"
                  className="store-input disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>

              <Field
                label="Status"
              >
                <select
                  value={
                    productForm.status
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        status:
                          event.target.value as ProductStatus,
                      })
                    )
                  }
                  className="store-input"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </Field>

              <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    Track inventory
                  </p>

                  <p className="mt-1 text-[10px] text-stone-400">
                    Turn this off for services or unlimited digital products.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        trackInventory:
                          !previous.trackInventory,
                      })
                    )
                  }
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    productForm.trackInventory
                      ? "bg-[#a9b897]"
                      : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                      productForm.trackInventory
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              <Field
                label="Image URL"
                className="md:col-span-2"
              >
                <input
                  value={
                    productForm.imageUrl
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        imageUrl:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="https://..."
                  className="store-input"
                />

                {productForm.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
                    <img
                      src={
                        productForm.imageUrl
                      }
                      alt="Product preview"
                      className="h-52 w-full object-cover"
                    />
                  </div>
                )}
              </Field>

              <Field
                label="Description"
                className="md:col-span-2"
              >
                <textarea
                  value={
                    productForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        description:
                          event.target.value,
                      })
                    )
                  }
                  rows={4}
                  placeholder="Tell customers about this product..."
                  className="store-input resize-none"
                />
              </Field>

              <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4 md:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    Featured product
                  </p>

                  <p className="mt-1 text-[10px] text-stone-400">
                    Highlight this product on the storefront.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        featured:
                          !previous.featured,
                      })
                    )
                  }
                  className={`relative h-8 w-14 rounded-full transition ${
                    productForm.featured
                      ? "bg-[#a9b897]"
                      : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                      productForm.featured
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void saveProduct()
              }
              disabled={
                savingProduct
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {savingProduct ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : productForm.id ? (
                <Check
                  size={14}
                />
              ) : (
                <Plus
                  size={14}
                />
              )}

              {savingProduct
                ? "Saving..."
                : productForm.id
                  ? "Save Product"
                  : "Create Product"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* =====================================================
          DISCOUNT MODAL
      ===================================================== */}

      <AnimatePresence>
        {showDiscountModal && (
          <ModalShell
            onClose={() => {
              if (
                !savingDiscount
              ) {
                setShowDiscountModal(
                  false
                );
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Promotion
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  {discountForm.id
                    ? "Edit discount"
                    : "New discount"}
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
                  Create a code customers can enter before checkout.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  savingDiscount
                }
                onClick={() =>
                  setShowDiscountModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 disabled:opacity-50"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <Field
                label="Discount Code"
                className="md:col-span-2"
              >
                <input
                  value={
                    discountForm.code
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        code:
                          event.target.value
                            .toUpperCase()
                            .replace(
                              /\s+/g,
                              ""
                            ),
                      })
                    )
                  }
                  placeholder="WELCOME10"
                  className="store-input uppercase tracking-[0.08em]"
                />
              </Field>

              <Field
                label="Discount Type"
              >
                <select
                  value={
                    discountForm.discountType
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        discountType:
                          event.target.value as DiscountType,

                        maximumDiscountAmount:
                          event.target.value ===
                          "fixed"
                            ? ""
                            : previous.maximumDiscountAmount,
                      })
                    )
                  }
                  className="store-input"
                >
                  <option value="percentage">
                    Percentage
                  </option>

                  <option value="fixed">
                    Fixed amount
                  </option>
                </select>
              </Field>

              <Field
                label={
                  discountForm.discountType ===
                  "percentage"
                    ? "Percentage Off"
                    : "Amount Off"
                }
              >
                <div className="relative">
                  {discountForm.discountType ===
                  "percentage" ? (
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                      %
                    </span>
                  ) : (
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                      £
                    </span>
                  )}

                  <input
                    type="number"
                    min="0"
                    max={
                      discountForm.discountType ===
                      "percentage"
                        ? 100
                        : undefined
                    }
                    step="0.01"
                    value={
                      discountForm.value
                    }
                    onChange={(
                      event
                    ) =>
                      setDiscountForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          value:
                            event.target.value,
                        })
                      )
                    }
                    placeholder={
                      discountForm.discountType ===
                      "percentage"
                        ? "10"
                        : "10.00"
                    }
                    className={`store-input ${
                      discountForm.discountType ===
                      "fixed"
                        ? "pl-8"
                        : "pr-8"
                    }`}
                  />
                </div>
              </Field>

              <Field
                label="Minimum Order"
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                    £
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      discountForm.minimumOrderAmount
                    }
                    onChange={(
                      event
                    ) =>
                      setDiscountForm(
                        (
                          previous
                        ) => ({
                          ...previous,

                          minimumOrderAmount:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="0.00"
                    className="store-input pl-8"
                  />
                </div>
              </Field>

              {discountForm.discountType ===
                "percentage" && (
                <Field
                  label="Maximum Discount"
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                      £
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        discountForm.maximumDiscountAmount
                      }
                      onChange={(
                        event
                      ) =>
                        setDiscountForm(
                          (
                            previous
                          ) => ({
                            ...previous,

                            maximumDiscountAmount:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="No maximum"
                      className="store-input pl-8"
                    />
                  </div>
                </Field>
              )}

              <Field
                label="Usage Limit"
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    discountForm.usageLimit
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        usageLimit:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Unlimited"
                  className="store-input"
                />
              </Field>

              <Field
                label="Starts"
              >
                <input
                  type="datetime-local"
                  value={
                    discountForm.startsAt
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        startsAt:
                          event.target.value,
                      })
                    )
                  }
                  className="store-input"
                />
              </Field>

              <Field
                label="Expires"
              >
                <input
                  type="datetime-local"
                  value={
                    discountForm.expiresAt
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        expiresAt:
                          event.target.value,
                      })
                    )
                  }
                  className="store-input"
                />
              </Field>

              <Field
                label="Description"
                className="md:col-span-2"
              >
                <textarea
                  rows={3}
                  value={
                    discountForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Launch offer, returning customer discount, summer promotion..."
                  className="store-input resize-none"
                />
              </Field>

              <div className="flex items-center justify-between gap-5 rounded-xl bg-stone-50 p-4 md:col-span-2">
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    Discount active
                  </p>

                  <p className="mt-1 max-w-md text-[10px] leading-5 text-stone-400">
                    Customers can only use the code while it is active and within any dates you set.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDiscountForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        active:
                          !previous.active,
                      })
                    )
                  }
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                    discountForm.active
                      ? "bg-[#a9b897]"
                      : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                      discountForm.active
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#dce4d2] bg-[#f5f7f2] p-5">
              <div className="flex items-start gap-3">
                <BadgePercent
                  size={16}
                  className="mt-0.5 shrink-0 text-[#829473]"
                />

                <div>
                  <p className="text-xs font-semibold text-stone-700">
                    Discount preview
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-stone-500">
                    {discountForm.code.trim()
                      ? discountForm.code.toUpperCase()
                      : "YOURCODE"}{" "}
                    will give customers{" "}
                    <strong>
                      {discountForm.discountType ===
                      "percentage"
                        ? `${Number(
                            discountForm.value ||
                              0
                          )}% off`
                        : money(
                            Number(
                              discountForm.value ||
                                0
                            )
                          )}
                    </strong>

                    {Number(
                      discountForm.minimumOrderAmount ||
                        0
                    ) >
                    0
                      ? ` on orders over ${money(
                          Number(
                            discountForm.minimumOrderAmount
                          )
                        )}`
                      : ""}
                    .
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={
                savingDiscount
              }
              onClick={() =>
                void saveDiscount()
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {savingDiscount ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <BadgePercent
                  size={14}
                />
              )}

              {savingDiscount
                ? "Saving..."
                : discountForm.id
                  ? "Save Discount"
                  : "Create Discount"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* =====================================================
          STOCK MODAL
      ===================================================== */}

      <AnimatePresence>
        {stockAdjust && (
          <ModalShell
            onClose={() => {
              if (
                !savingStock
              ) {
                setStockAdjust(
                  null
                );
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionEyebrow>
                  Inventory
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  Adjust stock
                </h2>

                <p className="mt-2 text-sm text-stone-500">
                  {
                    stockAdjust.product.name
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={
                  savingStock
                }
                onClick={() =>
                  setStockAdjust(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50 disabled:opacity-50"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="mt-7 rounded-2xl bg-stone-50 p-5">
              <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
                Current stock
              </p>

              <p className="mt-2 font-serif text-4xl italic">
                {
                  stockAdjust.product.inventory_quantity
                }
              </p>
            </div>

            <Field
              label="New Stock Level"
              className="mt-5"
            >
              <input
                type="number"
                min="0"
                value={
                  stockAdjust.quantity
                }
                onChange={(
                  event
                ) =>
                  setStockAdjust(
                    (
                      previous
                    ) =>
                      previous
                        ? {
                            ...previous,

                            quantity:
                              event.target.value,
                          }
                        : previous
                  )
                }
                className="store-input"
              />
            </Field>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                -5,
                -1,
                1,
                5,
              ].map(
                (
                  amount
                ) => (
                  <button
                    type="button"
                    key={
                      amount
                    }
                    onClick={() =>
                      setStockAdjust(
                        (
                          previous
                        ) => {
                          if (
                            !previous
                          ) {
                            return previous;
                          }

                          return {
                            ...previous,

                            quantity:
                              String(
                                Math.max(
                                  0,
                                  Number(
                                    previous.quantity ||
                                      0
                                  ) +
                                    amount
                                )
                              ),
                          };
                        }
                      )
                    }
                    className="rounded-xl border border-stone-200 bg-stone-50 py-3 text-xs font-semibold text-stone-500"
                  >
                    {amount >
                    0
                      ? `+${amount}`
                      : amount}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={
                savingStock
              }
              onClick={() =>
                void saveStockAdjustment()
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {savingStock ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Check
                  size={14}
                />
              )}

              {savingStock
                ? "Saving..."
                : "Update Stock"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

        .font-serif {
          font-family:
            "Instrument Serif",
            Georgia,
            serif;
        }

        .store-input {
          width: 100%;
          border: 1px solid #eceae5;
          background: #faf9f6;
          border-radius: 0.8rem;
          padding: 0.95rem 1rem;
          font-size: 0.82rem;
          color: #44403c;
          outline: none;
          transition: 0.2s ease;
        }

        .store-input:focus {
          background: white;
          border-color: #a9b897;
          box-shadow:
            0 0 0 3px
            rgba(
              169,
              184,
              151,
              0.1
            );
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function Panel({
  children,
  className = "",
}: {
  children:
    ReactNode;

  className?:
    string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8 ${className}`}
    >
      {
        children
      }
    </div>
  );
}

// ============================================================

function SectionEyebrow({
  children,
  className = "",
}: {
  children:
    ReactNode;

  className?:
    string;
}) {
  return (
    <p
      className={`text-[9px] font-black uppercase tracking-[0.2em] text-[#829473] ${className}`}
    >
      {
        children
      }
    </p>
  );
}

// ============================================================

function StoreMetric({
  icon:
    Icon,
  value,
  label,
}: {
  icon:
    any;

  value:
    string;

  label:
    string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <Icon
        size={18}
        className="mb-6 text-stone-300"
      />

      <p className="font-serif text-2xl italic text-stone-800 sm:text-3xl">
        {
          value
        }
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
        {
          label
        }
      </p>
    </div>
  );
}

// ============================================================

function DetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0">
      <span className="text-xs text-stone-400">
        {
          label
        }
      </span>

      <span className="text-right text-xs font-semibold text-stone-700">
        {
          value
        }
      </span>
    </div>
  );
}

// ============================================================

function Field({
  label,
  children,
  className = "",
}: {
  label:
    string;

  children:
    ReactNode;

  className?:
    string;
}) {
  return (
    <div
      className={
        className
      }
    >
      <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
        {
          label
        }
      </label>

      {
        children
      }
    </div>
  );
}

// ============================================================

function StatusBadge({
  status,
}: {
  status:
    ProductStatus;
}) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "active"
          ? "bg-[#edf1e8] text-[#82936b]"
          : status ===
              "draft"
            ? "bg-amber-50 text-amber-600"
            : "bg-stone-100 text-stone-500"
      }`}
    >
      {
        status
      }
    </span>
  );
}

// ============================================================

function OrderStatusBadge({
  status,
}: {
  status:
    OrderStatus;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "new"
          ? "bg-blue-50 text-blue-600"
          : status ===
              "processing"
            ? "bg-amber-50 text-amber-600"
            : status ===
                "dispatched"
              ? "bg-violet-50 text-violet-600"
              : status ===
                  "delivered"
                ? "bg-[#edf1e8] text-[#82936b]"
                : "bg-red-50 text-red-500"
      }`}
    >
      {status ===
      "new"
        ? "New"
        : status ===
            "processing"
          ? "Processing"
          : status ===
              "dispatched"
            ? "Dispatched"
            : status ===
                "delivered"
              ? "Delivered"
              : "Cancelled"}
    </span>
  );
}

// ============================================================

function PaymentBadge({
  status,
}: {
  status:
    PaymentStatus;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase ${
        status ===
        "paid"
          ? "bg-emerald-50 text-emerald-600"
          : status ===
              "pending"
            ? "bg-stone-100 text-stone-500"
            : "bg-red-50 text-red-500"
      }`}
    >
      {
        status
      }
    </span>
  );
}

// ============================================================

function DiscountStatusBadge({
  status,
}: {
  status:
    DiscountStatus;
}) {
  let className =
    "bg-stone-100 text-stone-500";

  if (
    status ===
    "Active"
  ) {
    className =
      "bg-[#edf1e8] text-[#82936b]";
  }

  if (
    status ===
    "Scheduled"
  ) {
    className =
      "bg-blue-50 text-blue-600";
  }

  if (
    status ===
    "Expired"
  ) {
    className =
      "bg-red-50 text-red-500";
  }

  if (
    status ===
    "Used up"
  ) {
    className =
      "bg-amber-50 text-amber-600";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-[7px] font-black uppercase ${className}`}
    >
      {
        status
      }
    </span>
  );
}

// ============================================================

function OrderRow({
  order,
  money,
  onAdvance,
  loading = false,
}: {
  order:
    Order;

  money:
    (
      value:
        | number
        | string
    ) => string;

  onAdvance:
    () => void;

  loading?:
    boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">
            {
              order.number
            }
          </p>

          <OrderStatusBadge
            status={
              order.status
            }
          />
        </div>

        <p className="mt-2 text-xs text-stone-600">
          {
            order.customer
          }
        </p>

        <p className="mt-1 text-[10px] text-stone-400">
          {
            order.items
          }{" "}
          items ·{" "}
          {
            order.createdAt
          }
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="font-serif text-xl italic">
          {money(
            order.total
          )}
        </p>

        <button
          type="button"
          disabled={
            loading
          }
          onClick={
            onAdvance
          }
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[8px] font-black uppercase text-stone-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2
              size={12}
              className="animate-spin"
            />
          ) : (
            <>
              {order.status ===
              "new"
                ? "Process"
                : order.status ===
                    "processing"
                  ? "Dispatch"
                  : "Complete"}

              <ChevronRight
                size={12}
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================

function EmptyState({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    any;

  title:
    string;

  text:
    string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center">
      <Icon
        size={24}
        className="mx-auto text-stone-300"
      />

      <p className="mt-4 text-sm font-semibold text-stone-600">
        {
          title
        }
      </p>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

// ============================================================

function ConnectionCard({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    any;

  title:
    string;

  text:
    string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#829473]">
        <Icon
          size={15}
        />
      </div>

      <p className="mt-4 text-xs font-semibold">
        {
          title
        }
      </p>

      <p className="mt-2 text-[10px] leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

// ============================================================

function DiscountInfoCard({
  icon:
    Icon,
  title,
  text,
}: {
  icon:
    any;

  title:
    string;

  text:
    string;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#829473]">
        <Icon
          size={15}
        />
      </div>

      <p className="mt-4 text-xs font-semibold text-stone-700">
        {
          title
        }
      </p>

      <p className="mt-2 text-[10px] leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

// ============================================================

function ToggleSetting({
  title,
  text,
  enabled,
  onChange,
}: {
  title:
    string;

  text:
    string;

  enabled:
    boolean;

  onChange:
    () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl bg-stone-50 p-5">
      <div>
        <p className="text-sm font-semibold text-stone-700">
          {
            title
          }
        </p>

        <p className="mt-1 max-w-xl text-xs leading-5 text-stone-400">
          {
            text
          }
        </p>
      </div>

      <button
        type="button"
        onClick={
          onChange
        }
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled
            ? "bg-stone-900"
            : "bg-stone-200"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            enabled
              ? "left-7"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================

function IntegrationCard({
  name,
  text,
  comingSoon = false,
  connected = false,
}: {
  name:
    string;

  text:
    string;

  comingSoon?:
    boolean;

  connected?:
    boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
          <Store
            size={15}
            className="text-stone-400"
          />
        </div>

        {connected ? (
          <span className="rounded-full bg-[#edf1e8] px-3 py-1 text-[7px] font-black uppercase text-[#82936b]">
            Connected
          </span>
        ) : comingSoon ? (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-[7px] font-black uppercase text-stone-400">
            Coming soon
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-sm font-semibold">
        {
          name
        }
      </p>

      <p className="mt-2 text-[10px] leading-5 text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

// ============================================================

function ModalShell({
  children,
  onClose,
}: {
  children:
    ReactNode;

  onClose:
    () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Close modal"
        initial={{
          opacity:
            0,
        }}
        animate={{
          opacity:
            1,
        }}
        exit={{
          opacity:
            0,
        }}
        onClick={
          onClose
        }
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          opacity:
            0,

          scale:
            0.97,

          y:
            12,
        }}
        animate={{
          opacity:
            1,

          scale:
            1,

          y:
            0,
        }}
        exit={{
          opacity:
            0,

          scale:
            0.97,

          y:
            12,
        }}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-stone-100 bg-white p-6 shadow-2xl sm:p-8"
      >
        {
          children
        }
      </motion.div>
    </div>
  );
}