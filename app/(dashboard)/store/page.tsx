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
  ArrowUpRight,
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
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Users,
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

type Product = {
  id: string;

  organisation_id: string;

  name: string;
  sku: string;
  category: string;

  description: string;

  price: number;
  compare_at_price: number | null;
  cost: number;

  inventory_quantity: number;

  status: ProductStatus;

  image_url: string | null;

  images: string[];

  featured: boolean;

  sort_order: number | null;

  is_active: boolean;

  created_at: string | null;

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

  paymentStatus: PaymentStatus;

  items: number;

  createdAt: string;

  raw: Record<
    string,
    unknown
  >;
};

type StoreSettingsRow = {
  id: string;

  organisation_id: string;

  slug: string;

  store_name: string | null;

  store_description: string | null;

  hero_title: string | null;

  hero_text: string | null;

  announcement: string | null;

  accent_colour: string | null;

  shipping_text: string | null;

  support_email: string | null;

  is_live: boolean | null;

  created_at?: string | null;

  updated_at?: string | null;
};

type ProductForm = {
  id?: string;

  name: string;

  sku: string;

  category: string;

  description: string;

  price: string;

  compareAtPrice: string;

  cost: string;

  stock: string;

  imageUrl: string;

  featured: boolean;

  status: ProductStatus;
};

type StockAdjustState = {
  product: Product;
  quantity: string;
};

type OrganisationContext = {
  organisationId: string;
  organisationName: string;
};

// ============================================================
// DEFAULTS
// ============================================================

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "",
  sku: "",
  category: "General",
  description: "",
  price: "",
  compareAtPrice: "",
  cost: "",
  stock: "",
  imageUrl: "",
  featured: false,
  status: "active",
};

// ============================================================
// GENERIC HELPERS
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
      value.trim() !== ""
    ) {
      const parsed =
        Number(
          value
        );

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
    Array.isArray(
      value
    )
  ) {
    return value
      .filter(
        (
          item
        ) =>
          typeof item ===
          "string"
      )
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
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
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
}

function createSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
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
  // TRY USER_ORGANISATIONS
  // ==========================================================

  try {
    const {
      data:
        membershipRows,
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
        .limit(1);

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
  } catch (
    membershipError
  ) {
    console.warn(
      "user_organisations lookup skipped:",
      membershipError
    );
  }

  // ==========================================================
  // TRY PROFILES
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
    profileError
  ) {
    console.warn(
      "profiles organisation lookup skipped:",
      profileError
    );
  }

  // ==========================================================
  // TRY ORGANISATION_MEMBERS
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
        .limit(1);

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
    memberError
  ) {
    console.warn(
      "organisation_members lookup skipped:",
      memberError
    );
  }

  throw new Error(
    "We couldn't work out which organisation this store belongs to."
  );
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
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState<
      string | null
    >(null);

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState("");

  const [
    organisationName,
    setOrganisationName,
  ] =
    useState("");

  // ==========================================================
  // STORE SETTINGS
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
    useState("");

  const [
    storeDescription,
    setStoreDescription,
  ] =
    useState("");

  const [
    heroTitle,
    setHeroTitle,
  ] =
    useState("");

  const [
    heroText,
    setHeroText,
  ] =
    useState("");

  const [
    announcement,
    setAnnouncement,
  ] =
    useState("");

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
    useState("");

  const [
    supportEmail,
    setSupportEmail,
  ] =
    useState("");

  const [
    slug,
    setSlug,
  ] =
    useState("");

  const [
    storeLive,
    setStoreLive,
  ] =
    useState(false);

  const [
    savingSettings,
    setSavingSettings,
  ] =
    useState(false);

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");

  const [
    showProductModal,
    setShowProductModal,
  ] =
    useState(false);

  const [
    productForm,
    setProductForm,
  ] =
    useState<ProductForm>(
      EMPTY_PRODUCT_FORM
    );

  const [
    savingProduct,
    setSavingProduct,
  ] =
    useState(false);

  const [
    deletingProductId,
    setDeletingProductId,
  ] =
    useState<
      string | null
    >(null);

  // ==========================================================
  // INVENTORY
  // ==========================================================

  const [
    lowStockThreshold,
    setLowStockThreshold,
  ] =
    useState("8");

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
    useState(false);

  // ==========================================================
  // ORDERS
  // ==========================================================

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    orderSearch,
    setOrderSearch,
  ] =
    useState("");

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<
      string | null
    >(null);

  // ==========================================================
  // OTHER SETTINGS
  // ==========================================================

  const [
    currency,
    setCurrency,
  ] =
    useState("GBP");

  const [
    orderNotifications,
    setOrderNotifications,
  ] =
    useState(true);

  const [
    autoCreateContacts,
    setAutoCreateContacts,
  ] =
    useState(true);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData =
    useCallback(
      async (
        quiet =
          false
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

          setOrganisationId(
            context.organisationId
          );

          setOrganisationName(
            context.organisationName
          );

          const orgId =
            context.organisationId;

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
              .limit(1);

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
            settings?.store_name ||
              context.organisationName ||
              ""
          );

          setStoreDescription(
            settings?.store_description ||
              ""
          );

          setHeroTitle(
            settings?.hero_title ||
              ""
          );

          setHeroText(
            settings?.hero_text ||
              ""
          );

          setAnnouncement(
            settings?.announcement ||
              ""
          );

          setAccentColour(
            settings?.accent_colour ||
              "#A9B897"
          );

          setShippingText(
            settings?.shipping_text ||
              ""
          );

          setSupportEmail(
            settings?.support_email ||
              ""
          );

          setSlug(
            settings?.slug ||
              createSlug(
                context.organisationName
              )
          );

          setStoreLive(
            settings?.is_live ===
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
                orgId );

          if (
            productError
          ) {
            throw productError;
          }

          // ===================================================
          // ORDER ITEMS
          // Used for product stats where possible
          // ===================================================

          let orderItems:
            Record<
              string,
              unknown
            >[] = [];

          try {
            const {
              data:
                itemRows,
            } =
              await supabase
                .from(
                  "store_order_items"
                )
                .select("*")
                .eq(
                  "organisation_id",
                  orgId
                );

            orderItems =
              (
                itemRows ||
                []
              ) as Record<
                string,
                unknown
              >[];
          } catch (
            orderItemError
          ) {
            console.warn(
              "Order item stats unavailable:",
              orderItemError
            );
          }

          const cleanedProducts =
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
              ): Product => {
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
                        item.product_id,
                        item.store_product_id
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
                          item.unit_price,
                          item.price,
                          item.product_price
                        );

                      const lineTotal =
                        firstNumber(
                          item.total,
                          item.line_total,
                          item.total_amount
                        );

                      return (
                        total +
                        (lineTotal ||
                          unit *
                            quantity)
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

                return {
                  id,

                  organisation_id:
                    String(
                      row.organisation_id ||
                        orgId
                    ),

                  name:
                    firstString(
                      row.name,
                      row.title
                    ) ||
                    "Untitled product",

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
                    firstString(
                      row.description
                    ) ||
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
                      row.cost,
                      row.cost_price,
                      row.unit_cost
                    ),

                  inventory_quantity:
                    firstNumber(
                      row.inventory_quantity,
                      row.stock,
                      row.quantity
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

          cleanedProducts.sort(
            (
              first,
              second
            ) => {
              if (
                first.featured !==
                second.featured
              ) {
                return first.featured
                  ? -1
                  : 1;
              }

              return first.name.localeCompare(
                second.name
              );
            }
          );

          setProducts(
            cleanedProducts
          );

          // ===================================================
          // ORDERS
          // ===================================================

          const {
            data:
              orderRows,
            error:
              orderError,
          } =
            await supabase
              .from(
                "store_orders"
              )
              .select("*")
              .eq(
                "organisation_id",
                orgId
              );

          if (
            orderError
          ) {
            throw orderError;
          }

          const cleanedOrders =
            (
              orderRows ||
              []
            )
              .map(
                (
                  row:
                    Record<
                      string,
                      unknown
                    >
                ): Order => {
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
                          item.order_id,
                          item.store_order_id
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

                  const fallbackItems =
                    firstNumber(
                      row.items,
                      row.item_count,
                      row.total_items
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
                        row.order_number,
                        row.number,
                        row.reference
                      ) ||
                      `#${orderId
                        .slice(
                          0,
                          6
                        )
                        .toUpperCase()}`,

                    customer:
                      firstString(
                        row.customer_name,
                        row.name,
                        row.full_name,
                        row.shipping_name
                      ) ||
                      "Customer",

                    email:
                      firstString(
                        row.customer_email,
                        row.email
                      ) ||
                      "—",

                    total:
                      firstNumber(
                        row.total,
                        row.total_amount,
                        row.amount,
                        row.grand_total
                      ),

                    status:
                      normaliseOrderStatus(
                        firstString(
                          row.status,
                          row.fulfilment_status,
                          row.fulfillment_status
                        )
                      ),

                    paymentStatus:
                      normalisePaymentStatus(
                        firstString(
                          row.payment_status,
                          row.stripe_payment_status,
                          row.payment_state
                        )
                      ),

                    items:
                      itemCount ||
                      fallbackItems,

                    createdAt:
                      formatDate(
                        firstString(
                          row.created_at,
                          row.ordered_at
                        )
                      ),

                    raw:
                      row,
                  };
                }
              )
              .sort(
                (
                  first,
                  second
                ) => {
                  const firstRaw =
                    first.raw
                      .created_at;

                  const secondRaw =
                    second.raw
                      .created_at;

                  return (
                    new Date(
                      String(
                        secondRaw ||
                          0
                      )
                    ).getTime() -
                    new Date(
                      String(
                        firstRaw ||
                          0
                      )
                    ).getTime()
                  );
                }
              );

          setOrders(
            cleanedOrders
          );
        } catch (
          error: any
        ) {
          console.error(
            "Store load failed:",
            error
          );

          setPageError(
            error?.message ||
              "We couldn't load your commerce workspace."
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

  useEffect(
    () => {
      void loadData();
    },
    [
      loadData,
    ]
  );

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
    useMemo(
      () => {
        const productOrderTotal =
          products.reduce(
            (
              total,
              product
            ) =>
              total +
              product.orders,
            0
          );

        return (
          productOrderTotal ||
          orders.length
        );
      },
      [
        products,
        orders,
      ]
    );

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
    orderRevenue ||
    totalRevenue;

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
          ) =>
            product.inventory_quantity <=
              Number(
                lowStockThreshold ||
                  0
              ) &&
            product.inventory_quantity <
              900 &&
            product.status ===
              "active"
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
      ).toFixed(2)}`;
    }
  }

  // ==========================================================
  // PRODUCT ACTIONS
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
    product: Product
  ) {
    setProductForm({
      id:
        product.id,

      name:
        product.name,

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

      status:
        product.status,
    });

    setShowProductModal(
      true
    );
  }

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

    if (
      !productForm.name.trim()
    ) {
      alert(
        "Enter a product name."
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

    const stock =
      Math.max(
        0,
        Number(
          productForm.stock ||
            0
        )
      );

    setSavingProduct(
      true
    );

    try {
      const payload = {
        organisation_id:
          organisationId,

        name:
          productForm.name.trim(),

        sku:
          productForm.sku.trim() ||
          generateSku(
            productForm.name
          ),

        category:
          productForm.category.trim() ||
          "General",

        description:
          productForm.description.trim() ||
          null,

        price,

        compare_at_price:
          productForm.compareAtPrice.trim()
            ? Number(
                productForm.compareAtPrice
              )
            : null,

        inventory_quantity:
          stock,

        image_url:
          productForm.imageUrl.trim() ||
          null,

        featured:
          productForm.featured,

        is_active:
          productForm.status ===
          "active",

        status:
          productForm.status,
      };

      if (
        productForm.id
      ) {
        const {
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
            );

        if (
          error
        ) {
          // Some installations may not yet
          // have status / compare_at_price.
          // Retry with core fields.

          const {
            error:
              fallbackError,
          } =
            await supabase
              .from(
                "store_products"
              )
              .update({
                organisation_id:
                  organisationId,

                name:
                  payload.name,

                sku:
                  payload.sku,

                category:
                  payload.category,

                description:
                  payload.description,

                price:
                  payload.price,

                inventory_quantity:
                  payload.inventory_quantity,

                image_url:
                  payload.image_url,

                featured:
                  payload.featured,

                is_active:
                  payload.is_active,
              })
              .eq(
                "id",
                productForm.id
              )
              .eq(
                "organisation_id",
                organisationId
              );

          if (
            fallbackError
          ) {
            throw fallbackError;
          }
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "store_products"
            )
            .insert(
              payload
            );

        if (
          error
        ) {
          const {
            error:
              fallbackError,
          } =
            await supabase
              .from(
                "store_products"
              )
              .insert({
                organisation_id:
                  organisationId,

                name:
                  payload.name,

                sku:
                  payload.sku,

                category:
                  payload.category,

                description:
                  payload.description,

                price:
                  payload.price,

                inventory_quantity:
                  payload.inventory_quantity,

                image_url:
                  payload.image_url,

                featured:
                  payload.featured,

                is_active:
                  payload.is_active,
              });

          if (
            fallbackError
          ) {
            throw fallbackError;
          }
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
      error: any
    ) {
      console.error(
        "Product save failed:",
        error
      );

      alert(
        error?.message ||
          "Product could not be saved."
      );
    } finally {
      setSavingProduct(
        false
      );
    }
  }

  async function deleteProduct(
    product: Product
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
          );

      if (
        error
      ) {
        throw error;
      }

      setProducts(
        (
          previous
        ) =>
          previous.filter(
            (
              item
            ) =>
              item.id !==
              product.id
          )
      );
    } catch (
      error: any
    ) {
      console.error(
        "Delete product failed:",
        error
      );

      alert(
        error?.message ||
          "Product could not be deleted."
      );
    } finally {
      setDeletingProductId(
        null
      );
    }
  }

  // ==========================================================
  // STOCK ACTIONS
  // ==========================================================

  function openStockAdjust(
    product: Product
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
        error,
      } =
        await supabase
          .from(
            "store_products"
          )
          .update({
            inventory_quantity:
              quantity,
          })
          .eq(
            "id",
            stockAdjust.product.id
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        throw error;
      }

      setProducts(
        (
          previous
        ) =>
          previous.map(
            (
              product
            ) =>
              product.id ===
              stockAdjust.product.id
                ? {
                    ...product,

                    inventory_quantity:
                      quantity,
                  }
                : product
          )
      );

      setStockAdjust(
        null
      );
    } catch (
      error: any
    ) {
      console.error(
        "Stock update failed:",
        error
      );

      alert(
        error?.message ||
          "Stock could not be updated."
      );
    } finally {
      setSavingStock(
        false
      );
    }
  }

  // ==========================================================
  // ORDER ACTIONS
  // ==========================================================

  async function advanceOrder(
    order: Order
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
        error,
      } =
        await supabase
          .from(
            "store_orders"
          )
          .update({
            status:
              nextStatus,
          })
          .eq(
            "id",
            order.id
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        throw error;
      }

      setOrders(
        (
          previous
        ) =>
          previous.map(
            (
              item
            ) =>
              item.id ===
              order.id
                ? {
                    ...item,

                    status:
                      nextStatus,
                  }
                : item
          )
      );
    } catch (
      error: any
    ) {
      console.error(
        "Order update failed:",
        error
      );

      alert(
        error?.message ||
          "Order could not be updated."
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  // ==========================================================
  // SETTINGS
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
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "store_settings"
            )
            .insert(
              payload
            );

        if (
          error
        ) {
          throw error;
        }
      }

      setSlug(
        resolvedSlug
      );

      await loadData(
        true
      );

      alert(
        "Store settings saved."
      );
    } catch (
      error: any
    ) {
      console.error(
        "Store settings save failed:",
        error
      );

      alert(
        error?.message ||
          "Store settings could not be saved."
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
    label: StoreTab;
    icon: any;
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
            size={
              28
            }
            className="mx-auto animate-spin text-[#829473]"
          />

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Loading commerce
          </p>
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
            size={
              26
            }
            className="mx-auto text-amber-500"
          />

          <h1 className="mt-5 font-serif text-4xl italic">
            Commerce couldn&apos;t load
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {
              pageError
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadData()
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white"
          >
            <RefreshCw
              size={
                13
              }
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
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="mx-auto max-w-[1400px] px-4 pb-7 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2">
              <ShoppingBag
                size={
                  13
                }
                className="text-[#829473]"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                TOTS Commerce
              </span>
            </div>

            <h1 className="max-w-4xl font-serif text-5xl italic leading-none tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Your store,
              connected to
              your business.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-500">
              Manage products,
              orders, stock and
              your public
              storefront
              alongside the rest
              of TOTS-OS.
            </p>

            {organisationName && (
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400">
                {
                  organisationName
                }
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
                  size={
                    13
                  }
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
                size={
                  13
                }
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
                size={
                  14
                }
              />

              New Product
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          NAV
      ====================================================== */}

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
                      size={
                        14
                      }
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

      {/* ======================================================
          CONTENT
      ====================================================== */}

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
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                    <Sparkles
                      size={
                        18
                      }
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
                        </strong>{" "}
                        and{" "}
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
                        size={
                          13
                        }
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
                                {index +
                                  1}
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
                  <div className="mb-6">
                    <SectionEyebrow>
                      Inventory
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-2xl italic">
                      Stock warnings
                    </h2>
                  </div>

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
                              size={
                                16
                              }
                              className="text-amber-500"
                            />
                          </button>
                        )
                      )}
                    </div>
                  )}
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
                opacity: 0,
              }}
              animate={{
                opacity: 1,
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
                      Products created here feed directly into your public TOTS storefront.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search
                        size={
                          14
                        }
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
                        size={
                          13
                        }
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
                              size={
                                13
                              }
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
                                  size={
                                    17
                                  }
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
                              ) &&
                              product.inventory_quantity <
                                900 && (
                                <p className="mt-1 text-[9px] text-amber-600">
                                  Low stock
                                </p>
                              )}
                          </button>

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
                                size={
                                  13
                                }
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
                                  size={
                                    13
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    13
                                  }
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
                opacity: 0,
              }}
              animate={{
                opacity: 1,
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
                      size={
                        14
                      }
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
                                  size={
                                    16
                                  }
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
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-400"
                              >
                                <Eye
                                  size={
                                    14
                                  }
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
              INVENTORY
          ================================================== */}

          {activeTab ===
            "Inventory" && (
            <motion.div
              key="inventory"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
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
                      Stock levels here are the same stock levels used by the public storefront, so sold-out products can be blocked automatically.
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
                      const low =
                        product.inventory_quantity <=
                        Number(
                          lowStockThreshold
                        );

                      const soldOut =
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
                                size={
                                  17
                                }
                              />
                            </div>

                            {soldOut ? (
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
                                {
                                  product.inventory_quantity
                                }
                              </p>
                            </div>

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
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
            >
              <Panel>
                <div className="flex h-full min-h-[450px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#82936b]">
                    <BadgePercent
                      size={
                        22
                      }
                    />
                  </div>

                  <SectionEyebrow className="mt-6">
                    TOTS Commerce
                  </SectionEyebrow>

                  <h2 className="mt-2 font-serif text-4xl italic">
                    Discount codes are next.
                  </h2>

                  <p className="mt-3 max-w-lg text-sm leading-7 text-stone-500">
                    The commerce database currently has products, orders, order items and storefront settings, but it does not yet have a dedicated discount-code table. I&apos;d add that next so codes, usage limits, expiry dates and order discounts are properly persistent.
                  </p>

                  <div className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                    <MiniFeature
                      icon={
                        Tag
                      }
                      title="Codes"
                      text="WELCOME10"
                    />

                    <MiniFeature
                      icon={
                        BadgePercent
                      }
                      title="Offers"
                      text="% or fixed"
                    />

                    <MiniFeature
                      icon={
                        ShoppingCart
                      }
                      title="Usage"
                      text="Track redemptions"
                    />
                  </div>
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
                opacity: 0,
              }}
              animate={{
                opacity: 1,
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
                      These settings control the public store at{" "}
                      <strong>
                        /shop/
                        {slug ||
                          "your-store"}
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
                          size={
                            12
                          }
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
                          size={
                            12
                          }
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
                      rows={
                        4
                      }
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
                      rows={
                        3
                      }
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
                      When live, customers can access your shop using your public store URL.
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
                      size={
                        14
                      }
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={
                        14
                      }
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
                    text="Checkout and payment processing will connect here."
                    comingSoon
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

      {/* ======================================================
          PRODUCT MODAL
      ====================================================== */}

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
                onClick={() =>
                  setShowProductModal(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50"
              >
                <X
                  size={
                    15
                  }
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
                  ) =>
                    setProductForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Classic Canvas Tote"
                  className="store-input"
                />
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
                  className="store-input"
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
                  rows={
                    4
                  }
                  placeholder="Tell customers about this product..."
                  className="store-input resize-none"
                />
              </Field>

              <div className="md:col-span-2 flex items-center justify-between rounded-xl bg-stone-50 p-4">
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
                  size={
                    14
                  }
                  className="animate-spin"
                />
              ) : productForm.id ? (
                <Check
                  size={
                    14
                  }
                />
              ) : (
                <Plus
                  size={
                    14
                  }
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

      {/* ======================================================
          STOCK MODAL
      ====================================================== */}

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
                onClick={() =>
                  setStockAdjust(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-50"
              >
                <X
                  size={
                    15
                  }
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
                  size={
                    14
                  }
                  className="animate-spin"
                />
              ) : (
                <Check
                  size={
                    14
                  }
                />
              )}

              {savingStock
                ? "Saving..."
                : "Update Stock"}
            </button>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ======================================================
          STYLES
      ====================================================== */}

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
// SHARED COMPONENTS
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
        size={
          18
        }
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
      {
        status ===
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
                : "Cancelled"
      }
    </span>
  );
}

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
              size={
                12
              }
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
                size={
                  12
                }
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
        size={
          24
        }
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
          size={
            15
          }
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
            size={
              15
            }
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

function MiniFeature({
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
      <Icon
        size={
          16
        }
        className="mx-auto text-[#829473]"
      />

      <p className="mt-3 text-xs font-semibold">
        {
          title
        }
      </p>

      <p className="mt-1 text-[9px] text-stone-400">
        {
          text
        }
      </p>
    </div>
  );
}

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
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={
          onClose
        }
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
          y: 12,
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