"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  BadgePoundSterling,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// ============================================================
// SUPABASE
// ============================================================
// IMPORTANT:
// Use the app-wide @supabase/ssr browser client so Store shares the exact
// same persisted PKCE auth session as the rest of TOTS-OS.
// If your supabase client file lives somewhere else, only change the
// import path above.
// ============================================================

// ============================================================
// TYPES
// ============================================================

type Organisation = {
  id: string;
  name: string;
  store_enabled?: boolean | null;
};

type Product = {
  id: string;
  organisation_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  price: number | string;
  compare_at_price?: number | string | null;
  cost_price?: number | string | null;
  stock?: number | null;
  inventory_quantity?: number | null;
  low_stock_threshold?: number | null;
  track_inventory?: boolean | null;
  image_url?: string | null;
  featured?: boolean | null;
  status?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  selling_model?: string | null;
  purchase_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type StoreOrder = {
  id: string;
  organisation_id: string;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  shipping_amount?: number | string | null;
  total?: number | string | null;
  payment_status?: string | null;
  fulfilment_status?: string | null;
  currency?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_account_id?: string | null;
  refunded_amount?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
};

type Subscription = {
  id: string;
  organisation_id: string;
  product_id?: string | null;
  order_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  status?: string | null;
  quantity?: number | null;
  currency?: string | null;
  unit_amount_pence?: number | null;
  billing_interval?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean | null;
  cancelled_at?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Discount = {
  id: string;
  organisation_id: string;
  code: string;
  discount_type?: string | null;
  value?: number | string | null;
  minimum_order_amount?: number | string | null;
  maximum_discount_amount?: number | string | null;
  usage_limit?: number | null;
  times_used?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

type ProductDraft = {
  name: string;
  description: string;
  sku: string;
  category: string;
  price: string;
  compare_at_price: string;
  cost_price: string;
  inventory_quantity: string;
  low_stock_threshold: string;
  image_url: string;
  selling_model: string;
  purchase_type: string;
  track_inventory: boolean;
  featured: boolean;
  is_active: boolean;
};

type Tab = "overview" | "products" | "orders" | "subscriptions" | "discounts";

// ============================================================
// HELPERS
// ============================================================

const inputClass =
  "h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100";

const blankProduct: ProductDraft = {
  name: "",
  description: "",
  sku: "",
  category: "",
  price: "",
  compare_at_price: "",
  cost_price: "",
  inventory_quantity: "0",
  low_stock_threshold: "5",
  image_url: "",
  selling_model: "physical",
  purchase_type: "one_off",
  track_inventory: true,
  featured: false,
  is_active: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown, currency = "GBP") {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(toNumber(value));
  } catch {
    return `£${toNumber(value).toFixed(2)}`;
  }
}

function formatPence(value: unknown, currency = "GBP") {
  return formatMoney(toNumber(value) / 100, currency);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClasses(value?: string | null) {
  const status = value?.toLowerCase() ?? "";

  if (
    ["active", "paid", "complete", "completed", "fulfilled"].includes(status)
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["pending", "processing", "unfulfilled"].includes(status)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (["cancelled", "canceled", "failed", "refunded"].includes(status)) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  return "bg-stone-100 text-stone-600 ring-stone-200";
}

function getStoredOrganisationId() {
  if (typeof window === "undefined") return null;

  const keys = [
    "activeOrganisationId",
    "active_organisation_id",
    "currentOrganisationId",
    "current_organisation_id",
    "organisationId",
    "organisation_id",
    "organizationId",
    "organization_id",
    "selectedOrganisationId",
  ];

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (
      value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      return value;
    }
  }

  return null;
}

function pickOrganisationId(record: Record<string, unknown> | null) {
  if (!record) return null;

  const candidates = [
    record.organisation_id,
    record.organization_id,
    record.active_organisation_id,
    record.active_organization_id,
    record.current_organisation_id,
    record.current_organization_id,
    record.default_organisation_id,
    record.default_organization_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

// ============================================================
// PAGE
// ============================================================

export default function StoreDashboardPage() {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(blankProduct);
  const [savingProduct, setSavingProduct] = useState(false);

  const resolveOrganisationId = useCallback(async () => {
    // 1. Prefer an already-selected organisation stored by TOTS-OS.
    const stored = getStoredOrganisationId();
    if (stored) return stored;

    // 2. Resolve from the logged-in Supabase user.
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
      throw new Error("You are not signed in.");
    }

    // 3. Check auth metadata.
    const metadataId = pickOrganisationId({
      ...(user.user_metadata ?? {}),
      ...(user.app_metadata ?? {}),
    });

    if (metadataId) return metadataId;

    // 4. Check profiles.
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profileOrganisationId = pickOrganisationId(
      (profile ?? null) as Record<string, unknown> | null,
    );

    if (profileOrganisationId) return profileOrganisationId;

    // 5. Compatibility fallbacks for membership tables.
    const membershipTables = [
      "organisation_members",
      "organization_members",
      "organisation_users",
      "organization_users",
    ];

    for (const table of membershipTables) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      const row =
        Array.isArray(data) && data.length > 0
          ? (data[0] as Record<string, unknown>)
          : null;

      const id = pickOrganisationId(row);

      if (id) return id;
    }

    throw new Error(
      "We could not determine which organisation is currently active.",
    );
  }, []);

  const loadStore = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const organisationId = await resolveOrganisationId();

        const [
          organisationResult,
          productsResult,
          ordersResult,
          subscriptionsResult,
          discountsResult,
        ] = await Promise.all([
          supabase
            .from("organisations")
            .select("id, name, store_enabled")
            .eq("id", organisationId)
            .single(),

          supabase
            .from("store_products")
            .select("*")
            .eq("organisation_id", organisationId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),

          supabase
            .from("store_orders")
            .select("*")
            .eq("organisation_id", organisationId)
            .order("created_at", { ascending: false }),

          supabase
            .from("store_subscriptions")
            .select("*")
            .eq("organisation_id", organisationId)
            .order("created_at", { ascending: false }),

          supabase
            .from("store_discounts")
            .select("*")
            .eq("organisation_id", organisationId)
            .order("created_at", { ascending: false }),
        ]);

        if (organisationResult.error) throw organisationResult.error;
        if (productsResult.error) throw productsResult.error;
        if (ordersResult.error) throw ordersResult.error;
        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (discountsResult.error) throw discountsResult.error;

        setOrganisation(organisationResult.data as Organisation);
        setProducts((productsResult.data ?? []) as Product[]);
        setOrders((ordersResult.data ?? []) as StoreOrder[]);
        setSubscriptions((subscriptionsResult.data ?? []) as Subscription[]);
        setDiscounts((discountsResult.data ?? []) as Discount[]);
      } catch (loadError) {
        console.error("Store dashboard load error:", loadError);

        setOrganisation(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load this store.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveOrganisationId],
  );

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  const metrics = useMemo(() => {
    const activeProducts = products.filter(
      (product) =>
        product.is_active !== false &&
        product.status?.toLowerCase() !== "archived",
    ).length;

    const paidOrders = orders.filter(
      (order) => order.payment_status?.toLowerCase() === "paid",
    );

    const revenue = paidOrders.reduce(
      (sum, order) => sum + toNumber(order.total),
      0,
    );

    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status?.toLowerCase() === "active",
    );

    const monthlySubscriptionValue = activeSubscriptions.reduce(
      (sum, subscription) => {
        const amount = toNumber(subscription.unit_amount_pence) / 100;
        const quantity = subscription.quantity ?? 1;
        const interval = subscription.billing_interval?.toLowerCase();

        if (["year", "yearly", "annual"].includes(interval ?? "")) {
          return sum + (amount * quantity) / 12;
        }

        return sum + amount * quantity;
      },
      0,
    );

    return {
      activeProducts,
      revenue,
      paidOrders: paidOrders.length,
      activeSubscriptions: activeSubscriptions.length,
      monthlySubscriptionValue,
    };
  }, [products, orders, subscriptions]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query),
    );
  }, [products, search]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter(
      (order) =>
        order.order_number?.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query),
    );
  }, [orders, search]);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter(
      (subscription) =>
        subscription.customer_name?.toLowerCase().includes(query) ||
        subscription.customer_email?.toLowerCase().includes(query) ||
        subscription.status?.toLowerCase().includes(query),
    );
  }, [subscriptions, search]);

  function openNewProduct() {
    setEditingProduct(null);
    setDraft(blankProduct);
    setProductModalOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);

    setDraft({
      name: product.name ?? "",
      description: product.description ?? "",
      sku: product.sku ?? "",
      category: product.category ?? "",
      price:
        product.price !== null && product.price !== undefined
          ? String(product.price)
          : "",
      compare_at_price:
        product.compare_at_price !== null &&
        product.compare_at_price !== undefined
          ? String(product.compare_at_price)
          : "",
      cost_price:
        product.cost_price !== null && product.cost_price !== undefined
          ? String(product.cost_price)
          : "",
      inventory_quantity: String(
        product.inventory_quantity ?? product.stock ?? 0,
      ),
      low_stock_threshold: String(product.low_stock_threshold ?? 5),
      image_url: product.image_url ?? "",
      selling_model: product.selling_model ?? "physical",
      purchase_type: product.purchase_type ?? "one_off",
      track_inventory: product.track_inventory ?? true,
      featured: product.featured ?? false,
      is_active: product.is_active ?? true,
    });

    setProductModalOpen(true);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();

    if (!organisation) return;

    if (!draft.name.trim()) {
      setError("Enter a product name.");
      return;
    }

    const price = Number(draft.price);

    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid product price.");
      return;
    }

    setSavingProduct(true);
    setError(null);

    try {
      const inventoryQuantity = Number(draft.inventory_quantity || "0");
      const lowStockThreshold = Number(draft.low_stock_threshold || "0");

      const payload = {
        organisation_id: organisation.id,
        name: draft.name.trim(),
        slug: editingProduct?.slug || slugify(draft.name),
        description: draft.description.trim() || null,
        sku: draft.sku.trim() || null,
        category: draft.category.trim() || null,
        price,
        compare_at_price: draft.compare_at_price.trim()
          ? Number(draft.compare_at_price)
          : null,
        cost_price: draft.cost_price.trim()
          ? Number(draft.cost_price)
          : null,
        inventory_quantity: Number.isFinite(inventoryQuantity)
          ? inventoryQuantity
          : 0,
        stock: Number.isFinite(inventoryQuantity) ? inventoryQuantity : 0,
        low_stock_threshold: Number.isFinite(lowStockThreshold)
          ? lowStockThreshold
          : 0,
        track_inventory: draft.track_inventory,
        image_url: draft.image_url.trim() || null,
        featured: draft.featured,
        status: draft.is_active ? "active" : "draft",
        is_active: draft.is_active,
        selling_model: draft.selling_model,
        purchase_type: draft.purchase_type,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("store_products")
          .update(payload)
          .eq("id", editingProduct.id)
          .eq("organisation_id", organisation.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("store_products")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      setDraft(blankProduct);

      await loadStore(true);
    } catch (saveError) {
      console.error("Product save error:", saveError);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "We couldn't save that product.",
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!organisation) return;

    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("store_products")
        .delete()
        .eq("id", product.id)
        .eq("organisation_id", organisation.id);

      if (deleteError) throw deleteError;

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
    } catch (deleteError) {
      console.error("Product delete error:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "We couldn't delete that product.",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-stone-700" />
          </div>

          <div className="text-center">
            <p className="font-semibold text-stone-900">Loading your store</p>
            <p className="mt-1 text-sm text-stone-500">
              Connecting to your organisation…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-[28px] border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-stone-900">
            We couldn't open this store
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            {error ?? "No active organisation could be found for this account."}
          </p>

          <button
            type="button"
            onClick={() => void loadStore()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-6 md:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              <Store className="h-4 w-4" />
              Commerce
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Store
            </h1>

            <p className="mt-1 text-sm text-stone-500">{organisation.name}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void loadStore(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openNewProduct}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>

            <button type="button" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {organisation.store_enabled === false && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">
              Store module disabled
            </p>
            <p className="mt-1 text-sm text-amber-700">
              This organisation currently has store_enabled set to false.
            </p>
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Package}
            label="Active products"
            value={String(metrics.activeProducts)}
            detail={`${products.length} total`}
          />


          <MetricCard
            icon={CreditCard}
            label="Active subscriptions"
            value={String(metrics.activeSubscriptions)}
            detail={`${subscriptions.length} total`}
          />

          <MetricCard
            icon={BadgePoundSterling}
            label="Monthly subscription value"
            value={formatMoney(metrics.monthlySubscriptionValue)}
            detail="Approx. monthly recurring"
          />
        </div>

        <div className="mt-7 overflow-x-auto">
          <div className="inline-flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
              Overview
            </TabButton>

            <TabButton active={tab === "products"} onClick={() => setTab("products")}>
              Products <CountBadge>{products.length}</CountBadge>
            </TabButton>

            <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
              Orders <CountBadge>{orders.length}</CountBadge>
            </TabButton>

            <TabButton
              active={tab === "subscriptions"}
              onClick={() => setTab("subscriptions")}
            >
              Subscriptions <CountBadge>{subscriptions.length}</CountBadge>
            </TabButton>

            <TabButton
              active={tab === "discounts"}
              onClick={() => setTab("discounts")}
            >
              Discounts <CountBadge>{discounts.length}</CountBadge>
            </TabButton>
          </div>
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-[24px] border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
                <div>
                  <h2 className="font-semibold text-stone-950">Products</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Latest products in {organisation.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTab("products")}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600 transition hover:text-stone-950"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {products.slice(0, 6).map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onEdit={() => openEditProduct(product)}
                  />
                ))}

                {products.length === 0 && (
                  <EmptyState
                    icon={Package}
                    title="No products yet"
                    description="Add your first product to start building your store."
                    action={
                      <button
                        type="button"
                        onClick={openNewProduct}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add product
                      </button>
                    }
                  />
                )}
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-stone-950">Store health</h2>
                    <p className="mt-1 text-sm text-stone-500">Database status</p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2e8]">
                    <Check className="h-5 w-5 text-[#617451]" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <HealthRow label="Organisation" value="Connected" good />
                  <HealthRow
                    label="Products"
                    value={`${products.length}`}
                    good={products.length > 0}
                  />
                  <HealthRow label="Orders" value={`${orders.length}`} good />
                  <HealthRow
                    label="Subscriptions"
                    value={`${subscriptions.length}`}
                    good
                  />
                  <HealthRow
                    label="Discounts"
                    value={`${discounts.length}`}
                    good
                  />
                </div>
              </section>

              <section className="rounded-[24px] bg-stone-950 p-6 text-white shadow-sm">
                <ShoppingBag className="h-6 w-6" />

                <h2 className="mt-5 text-xl font-semibold">{organisation.name}</h2>

                <p className="mt-2 text-sm leading-6 text-stone-400">
                  This dashboard is scoped directly to the active organisation.
                  There is no separate store ID required.
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Organisation ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-stone-300">
                    {organisation.id}
                  </p>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === "products" && (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <SectionHeader
              title="Products"
              description="Manage products available through your store."
            >
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search products..."
              />

              <button
                type="button"
                onClick={openNewProduct}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add product
              </button>
            </SectionHeader>

            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-stone-100 bg-stone-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Price</th>
                      <th className="px-4 py-4">Stock</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-stone-50/60"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <ProductImage product={product} />

                            <div>
                              <p className="font-semibold text-stone-900">
                                {product.name}
                              </p>
                              <p className="mt-0.5 text-xs text-stone-400">
                                {product.sku || product.slug || "No SKU"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-stone-600">
                          {product.category || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-stone-900">
                          {formatMoney(product.price)}
                        </td>

                        <td className="px-4 py-4 text-sm text-stone-600">
                          {product.track_inventory === false
                            ? "Not tracked"
                            : product.inventory_quantity ?? product.stock ?? 0}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              product.is_active === false
                                ? "draft"
                                : product.status || "active"
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-sm capitalize text-stone-600">
                          {(product.selling_model || "physical").replaceAll(
                            "_",
                            " ",
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:bg-stone-50 hover:text-stone-950"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => void deleteProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No products found"
                description={
                  search
                    ? "Nothing matched your search."
                    : "Add your first product to get started."
                }
              />
            )}
          </section>
        )}

        {tab === "orders" && (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <SectionHeader
              title="Orders"
              description="Orders placed through this organisation's store."
            >
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search orders..."
              />
            </SectionHeader>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead className="border-b border-stone-100 bg-stone-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      <th className="px-6 py-4">Order</th>
                      <th className="px-4 py-4">Customer</th>
                      <th className="px-4 py-4">Total</th>
                      <th className="px-4 py-4">Payment</th>
                      <th className="px-4 py-4">Fulfilment</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/60">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-stone-900">
                            {order.order_number || order.id.slice(0, 8)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-stone-800">
                            {order.customer_name || "Customer"}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-400">
                            {order.customer_email || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-semibold text-stone-900">
                          {formatMoney(order.total, order.currency || "GBP")}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={order.payment_status || "pending"} />
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={order.fulfilment_status || "unfulfilled"}
                          />
                        </td>

                        <td className="px-6 py-4 text-sm text-stone-500">
                          {formatDateTime(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Orders will appear here when customers purchase through your store."
              />
            )}
          </section>
        )}

        {tab === "subscriptions" && (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <SectionHeader
              title="Subscriptions"
              description="Recurring memberships and subscriptions attached to this store."
            >
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search subscriptions..."
              />
            </SectionHeader>

            {filteredSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="border-b border-stone-100 bg-stone-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Interval</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Started</th>
                      <th className="px-6 py-4">Subscription ID</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {filteredSubscriptions.map((subscription) => (
                      <tr
                        key={subscription.id}
                        className="hover:bg-stone-50/60"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-stone-900">
                            {subscription.customer_name || "Customer"}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-400">
                            {subscription.customer_email || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-semibold text-stone-900">
                          {formatPence(
                            subscription.unit_amount_pence,
                            subscription.currency || "GBP",
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm capitalize text-stone-600">
                          {subscription.billing_interval || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={subscription.status || "unknown"}
                          />
                        </td>

                        <td className="px-4 py-4 text-sm text-stone-500">
                          {formatDate(
                            subscription.current_period_start ||
                              subscription.created_at,
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="max-w-[260px] truncate font-mono text-xs text-stone-500">
                            {subscription.stripe_subscription_id || "—"}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={CreditCard}
                title="No subscriptions"
                description="Active store subscriptions and memberships will appear here."
              />
            )}
          </section>
        )}

        {tab === "discounts" && (
          <section className="mt-6 overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
            <SectionHeader
              title="Discounts"
              description="Discount codes connected to this organisation."
            />

            {discounts.length > 0 ? (
              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="rounded-2xl border border-stone-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2e8]">
                        <Tag className="h-5 w-5 text-[#617451]" />
                      </div>

                      <StatusBadge
                        status={discount.is_active === false ? "inactive" : "active"}
                      />
                    </div>

                    <p className="mt-5 font-mono text-lg font-bold text-stone-950">
                      {discount.code}
                    </p>

                    <p className="mt-2 text-sm text-stone-500">
                      {discount.discount_type === "percentage"
                        ? `${toNumber(discount.value)}% off`
                        : `${formatMoney(discount.value)} off`}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-xs text-stone-400">
                      <span>
                        Used {discount.times_used ?? 0}
                        {discount.usage_limit ? ` / ${discount.usage_limit}` : ""}
                      </span>

                      <span>
                        {discount.expires_at
                          ? `Ends ${formatDate(discount.expires_at)}`
                          : "No expiry"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Tag}
                title="No discount codes"
                description="Discount codes created for this store will appear here."
              />
            )}
          </section>
        )}
      </div>

      {productModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  {editingProduct ? "Edit product" : "Add product"}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {organisation.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="max-h-[calc(92vh-82px)] overflow-y-auto"
            >
              <div className="grid gap-5 p-6 md:grid-cols-2">
                <Field label="Product name" required className="md:col-span-2">
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="e.g. Couple Membership"
                  />
                </Field>

                <Field label="Description" className="md:col-span-2">
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={4}
                    className={`${inputClass} h-auto resize-none py-3`}
                    placeholder="Product description..."
                  />
                </Field>

                <Field label="Price">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      £
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      className={`${inputClass} pl-8`}
                      placeholder="0.00"
                    />
                  </div>
                </Field>

                <Field label="Compare at price">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                      £
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.compare_at_price}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          compare_at_price: event.target.value,
                        }))
                      }
                      className={`${inputClass} pl-8`}
                      placeholder="Optional"
                    />
                  </div>
                </Field>

                <Field label="Category">
                  <input
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Memberships"
                  />
                </Field>

                <Field label="SKU">
                  <input
                    value={draft.sku}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        sku: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Optional"
                  />
                </Field>

                <Field label="Selling model">
                  <select
                    value={draft.selling_model}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        selling_model: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="physical">Physical product</option>
                    <option value="digital_download">Digital download</option>
                    <option value="digital_delivery">Digital delivery</option>
                    <option value="collect">Collection</option>
                    <option value="customisable">Customisable</option>
                    <option value="request_to_order">Request to order</option>
                    <option value="service">Service</option>
                  </select>
                </Field>

                <Field label="Purchase type">
                  <select
                    value={draft.purchase_type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        purchase_type: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="one_off">One-off</option>
                    <option value="subscription">Subscription</option>
                    <option value="membership">Membership</option>
                  </select>
                </Field>

                <Field label="Inventory">
                  <input
                    type="number"
                    min="0"
                    value={draft.inventory_quantity}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        inventory_quantity: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Low stock warning">
                  <input
                    type="number"
                    min="0"
                    value={draft.low_stock_threshold}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        low_stock_threshold: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Image URL" className="md:col-span-2">
                  <input
                    type="url"
                    value={draft.image_url}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </Field>

                <div className="grid gap-3 md:col-span-2 sm:grid-cols-3">
                  <ToggleCard
                    label="Active"
                    description="Show in store"
                    checked={draft.is_active}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        is_active: value,
                      }))
                    }
                  />

                  <ToggleCard
                    label="Featured"
                    description="Highlight product"
                    checked={draft.featured}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        featured: value,
                      }))
                    }
                  />

                  <ToggleCard
                    label="Track stock"
                    description="Inventory enabled"
                    checked={draft.track_inventory}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        track_inventory: value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-100 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="h-11 rounded-xl border border-stone-200 px-5 text-sm font-semibold text-stone-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingProduct ? "Save changes" : "Add product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf2e8]">
        <Icon className="h-5 w-5 text-[#617451]" />
      </div>

      <p className="mt-5 text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
        {value}
      </p>
      <p className="mt-2 text-xs text-stone-400">{detail}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        active
          ? "bg-stone-950 text-white shadow-sm"
          : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-bold">
      {children}
    </span>
  );
}

function SectionHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-stone-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="font-semibold text-stone-950">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>

      {children && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {children}
        </div>
      )}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full min-w-[240px] rounded-xl border border-stone-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400"
      />
    </div>
  );
}

function ProductImage({ product }: { product: Product }) {
  if (product.image_url) {
    return (
      <div className="h-11 w-11 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100">
      <Package className="h-5 w-5 text-stone-400" />
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-stone-50"
    >
      <ProductImage product={product} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-900">
          {product.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-stone-400">
          {product.category || product.selling_model || "Product"}
        </p>
      </div>

      <p className="text-sm font-semibold text-stone-900">
        {formatMoney(product.price)}
      </p>

      <ChevronRight className="h-4 w-4 text-stone-300" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusClasses(
        status,
      )}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function HealthRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-stone-500">{label}</span>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-stone-800">{value}</span>
        <span
          className={`h-2 w-2 rounded-full ${
            good ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
        <Icon className="h-5 w-5 text-stone-400" />
      </div>

      <h3 className="mt-4 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>

      {action}
    </div>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}
    </label>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-[#a9b897] bg-[#f4f7f1]"
          : "border-stone-200 bg-white"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="mt-0.5 text-xs text-stone-400">{description}</p>
      </div>

      <div
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-[#718261]" : "bg-stone-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}
