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
  Upload,
  ExternalLink,
  Image as ImageIcon,
  Settings2,
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
  next_payment_at?: string | null;
  cancel_at_period_end?: boolean | null;
  cancelled_at?: string | null;
  stripe_subscription_id?: string | null;
  legacy_billing?: boolean | null;
  payment_provider?: string | null;
  legacy_membership_name?: string | null;
  migrated_from?: string | null;
  processor_verification_status?: string | null;
  cutover_status?: string | null;
  collection_enabled?: boolean | null;
  teamup_billing_active?: boolean | null;
  external_subscription_id?: string | null;
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

type Tab = "overview" | "products" | "orders" | "subscriptions" | "discounts" | "settings";

type StoreSettings = {
  id?: string;
  organisation_id: string;
  slug: string;
  store_name: string;
  store_description?: string | null;
  hero_title?: string | null;
  hero_text?: string | null;
  announcement?: string | null;
  accent_colour?: string | null;
  shipping_text?: string | null;
  support_email?: string | null;
  is_live?: boolean | null;
  storefront_mode?: string | null;
  external_store_url?: string | null;
  external_storefront_url?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  favicon_url?: string | null;
  background_colour?: string | null;
  text_colour?: string | null;
  button_colour?: string | null;
  button_text_colour?: string | null;
  heading_font?: string | null;
  body_font?: string | null;
  layout_style?: string | null;
  card_style?: string | null;
  border_radius?: number | null;
  show_search?: boolean | null;
  show_categories?: boolean | null;
  show_stock?: boolean | null;
  show_prices?: boolean | null;
  footer_text?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  custom_css?: string | null;
};


type MigrationResultItem = {
  subscriptionId?: string | null;
  customerName?: string | null;
  email?: string | null;
  membership?: string | null;
  amountPence?: number | null;
  provider?: string | null;
  result?: string | null;
  reason?: string | null;
  setupUrl?: string | null;
  stripeSubscriptionId?: string | null;
  goCardlessSubscriptionId?: string | null;
  teamupExternalShutdownRequired?: boolean;
};

type CompleteMigrationResult = {
  completedAt?: string;
  summary?: {
    canonicalMembershipsChecked?: number;
    billingLiveOnTots?: number;
    stripeLive?: number;
    goCardlessLive?: number;
    accessMembershipsInTots?: number;
    memberAuthorisationRequired?: number;
    manualReviewRequired?: number;
    duplicatesExcluded?: number;
    externalTeamupShutdownRequired?: number;
  };
  memberAuthorisationRequired?: MigrationResultItem[];
  setupLinks?: MigrationResultItem[];
  manualReview?: MigrationResultItem[];
  teamupShutdownRequired?: MigrationResultItem[];
  important?: {
    totsIsMembershipSourceOfTruth?: boolean;
    mtcAppShouldReadMembershipsFromTots?: boolean;
    teamupApiCancellationPerformed?: boolean;
    note?: string;
  };
};

type StripeStoreStatus = {
  connected: boolean;
  accountId: string | null;
  accountUnavailable: boolean;
  accountType: string | null;
  country: string | null;
  defaultCurrency: string;
  email: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    disabledReason: string | null;
  };
  balance: {
    available: Array<{ currency: string; amount: number; formatted: string }>;
    pending: Array<{ currency: string; amount: number; formatted: string }>;
  };
};

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
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "hero" | "favicon" | null>(null);

  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(blankProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [billingActionId, setBillingActionId] = useState<string | null>(null);
  const [reconcilingStripe, setReconcilingStripe] = useState(false);
  const [preparingCutover, setPreparingCutover] = useState(false);
  const [preparingMtcImport, setPreparingMtcImport] = useState(false);
  const [mtcPreparationResult, setMtcPreparationResult] = useState<CompleteMigrationResult | null>(null);
  const [bulkCutoverMessage, setBulkCutoverMessage] = useState<string | null>(null);
  const [reconcileProgress, setReconcileProgress] = useState<{ current: number; total: number } | null>(null);
  const [reconcileSummary, setReconcileSummary] = useState<Record<string, number> | null>(null);
  const [migrationMessages, setMigrationMessages] = useState<Record<string, string>>({});
  const [stripeStatus, setStripeStatus] = useState<StripeStoreStatus | null>(null);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(true);
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);

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

  const getAccessToken = useCallback(async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const token = data.session?.access_token;
    if (!token) throw new Error("You are not signed in.");

    return token;
  }, []);

  const loadStripeStatus = useCallback(async (silent = false) => {
    if (!silent) setStripeStatusLoading(true);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/store/stripe/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Stripe status could not be loaded.");
      }

      setStripeStatus(result as StripeStoreStatus);
    } catch (statusError) {
      console.error("Store Stripe status load error:", statusError);
      setStripeStatus(null);
      if (!silent) {
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Stripe status could not be loaded.",
        );
      }
    } finally {
      if (!silent) setStripeStatusLoading(false);
    }
  }, [getAccessToken]);

  const connectStripe = useCallback(async () => {
    try {
      setStripeConnectLoading(true);
      setError(null);

      const token = await getAccessToken();
      const response = await fetch("/api/store/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Stripe onboarding could not be started.");
      }

      const onboardingUrl =
        typeof result.onboardingUrl === "string"
          ? result.onboardingUrl
          : typeof result.url === "string"
            ? result.url
            : "";

      if (!onboardingUrl || !onboardingUrl.startsWith("https://")) {
        throw new Error("Stripe did not return a valid onboarding link.");
      }

      window.location.assign(onboardingUrl);
    } catch (connectError) {
      console.error("Stripe connect error:", connectError);
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Stripe onboarding could not be started.",
      );
      setStripeConnectLoading(false);
    }
  }, [getAccessToken]);

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
          settingsResult,
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

          supabase
            .from("store_settings")
            .select("*")
            .eq("organisation_id", organisationId)
            .maybeSingle(),
        ]);

        if (organisationResult.error) throw organisationResult.error;
        if (productsResult.error) throw productsResult.error;
        if (ordersResult.error) throw ordersResult.error;
        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (discountsResult.error) throw discountsResult.error;
        if (settingsResult.error) throw settingsResult.error;

        setOrganisation(organisationResult.data as Organisation);
        setProducts((productsResult.data ?? []) as Product[]);
        setOrders((ordersResult.data ?? []) as StoreOrder[]);
        setSubscriptions((subscriptionsResult.data ?? []) as Subscription[]);
        setDiscounts((discountsResult.data ?? []) as Discount[]);
        setStoreSettings(
          settingsResult.data
            ? (settingsResult.data as StoreSettings)
            : {
                organisation_id: organisationId,
                slug: "",
                store_name: organisationResult.data?.name || "Store",
                background_colour: "#ffffff",
                text_colour: "#1c1917",
                accent_colour: "#A9B897",
                button_colour: "#1c1917",
                button_text_colour: "#ffffff",
                heading_font: "Inter",
                body_font: "Inter",
                layout_style: "classic",
                card_style: "rounded",
                border_radius: 24,
                show_search: true,
                show_categories: true,
                show_stock: true,
                show_prices: true,
                storefront_mode: "hosted",
                is_live: false,
              },
        );
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
    void loadStripeStatus();
  }, [loadStore, loadStripeStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeReturn = params.get("stripe");

    if (stripeReturn === "connected" || stripeReturn === "refresh") {
      void loadStripeStatus(true);

      const cleanUrl = `${window.location.pathname}${window.location.hash || ""}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [loadStripeStatus]);

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

    const membershipRecords = subscriptions.filter(
      (subscription) => subscription.status?.toLowerCase() === "active",
    );

    // Only count subscriptions that TOTS-OS is actually authorised to collect.
    // Legacy TeamUp records deliberately remain visible in this register, but
    // they are NOT TOTS recurring revenue while collection_enabled = false.
    const collectingSubscriptions = membershipRecords.filter(
      (subscription) => subscription.collection_enabled === true,
    );

    const teamupBillingRecords = membershipRecords.filter(
      (subscription) =>
        subscription.legacy_billing === true &&
        subscription.teamup_billing_active === true &&
        subscription.collection_enabled !== true,
    );

    const monthlySubscriptionValue = collectingSubscriptions.reduce(
      (sum, subscription) => {
        const amount = toNumber(subscription.unit_amount_pence) / 100;
        const quantity = subscription.quantity ?? 1;
        const interval = subscription.billing_interval?.toLowerCase();

        if (["year", "yearly", "annual"].includes(interval ?? "")) {
          return sum + (amount * quantity) / 12;
        }

        if (["week", "weekly"].includes(interval ?? "")) {
          return sum + amount * quantity * (52 / 12);
        }

        return sum + amount * quantity;
      },
      0,
    );

    return {
      activeProducts,
      revenue,
      paidOrders: paidOrders.length,
      membershipRecords: membershipRecords.length,
      collectingSubscriptions: collectingSubscriptions.length,
      teamupBillingRecords: teamupBillingRecords.length,
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


  const getBillingToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("You are not signed in.");
    return token;
  }, []);

  const postBillingMigration = useCallback(async (
    token: string,
    body: Record<string, unknown>,
  ) => {
    const response = await fetch("/api/admin/store/billing-migration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Billing migration action failed.");
    return result;
  }, []);

  const prepareAllMembersForMtcApp = useCallback(async () => {
    if (preparingMtcImport) return;

    const confirmed = window.confirm(
      "COMPLETE THE MTC MIGRATION NOW? This will make TOTS-OS/MTC the membership source of truth, preserve existing Stripe and GoCardless subscriptions, create missing processor subscriptions only where verified payment authority exists, disable duplicate legacy collection rows, and create secure authorisation links where authority is missing. It does NOT take an immediate payment. IMPORTANT: this route cannot cancel TeamUp externally; any live memberships still billed in TeamUp must be stopped there to prevent duplicate renewal charges.",
    );
    if (!confirmed) return;

    try {
      setPreparingMtcImport(true);
      setMtcPreparationResult(null);
      setError(null);

      const token = await getBillingToken();
      const result = await postBillingMigration(token, {
        action: "complete_migration",
      });

      setMtcPreparationResult(result as CompleteMigrationResult);
      await loadStore(true);
    } catch (prepareError) {
      setError(
        prepareError instanceof Error
          ? prepareError.message
          : "MTC migration failed.",
      );
    } finally {
      setPreparingMtcImport(false);
    }
  }, [getBillingToken, loadStore, postBillingMigration, preparingMtcImport]);

  const reconcileCopiedStripeCustomers = useCallback(async () => {
    if (reconcilingStripe) return;

    const targets = subscriptions.filter((subscription) => {
      const provider = String(subscription.payment_provider ?? "").toLowerCase();
      const recurring =
        typeof subscription.unit_amount_pence === "number" &&
        subscription.unit_amount_pence > 0 &&
        ["week", "month", "year"].includes(String(subscription.billing_interval ?? "").toLowerCase());

      return (
        provider === "stripe" &&
        recurring &&
        subscription.collection_enabled !== true &&
        subscription.teamup_billing_active === true &&
        subscription.processor_verification_status !== "verified"
      );
    });

    if (!targets.length) {
      window.alert("There are no unverified recurring Stripe memberships left to reconcile.");
      return;
    }

    const confirmed = window.confirm(
      `Reconcile ${targets.length} recurring Stripe memberships against the 599 copied customers? This only verifies copied customer/payment methods. It will NOT collect money, create subscriptions, or stop TeamUp billing.`,
    );
    if (!confirmed) return;

    try {
      setReconcilingStripe(true);
      setError(null);
      setReconcileSummary(null);
      setReconcileProgress({ current: 0, total: targets.length });

      const token = await getBillingToken();
      const counts: Record<string, number> = {};
      const messages: Record<string, string> = {};

      for (let index = 0; index < targets.length; index += 1) {
        const subscription = targets[index];
        try {
          const response = await postBillingMigration(token, {
            subscriptionId: subscription.id,
            action: "scan_one",
          });
          const result = response.result;
          const key = String(result?.result ?? "error");
          counts[key] = (counts[key] ?? 0) + 1;
          if (result?.message) messages[subscription.id] = result.message;
        } catch (scanError) {
          counts.error = (counts.error ?? 0) + 1;
          messages[subscription.id] = scanError instanceof Error ? scanError.message : "Reconciliation failed.";
        }
        setReconcileProgress({ current: index + 1, total: targets.length });
      }

      setMigrationMessages((current) => ({ ...current, ...messages }));
      setReconcileSummary(counts);
      await loadStore(true);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Stripe reconciliation failed.");
    } finally {
      setReconcilingStripe(false);
      setReconcileProgress(null);
    }
  }, [getBillingToken, loadStore, postBillingMigration, reconcilingStripe, subscriptions]);

  const prepareEligibleStripeCutover = useCallback(async () => {
    if (preparingCutover) return;

    const readyCount = subscriptions.filter((subscription) => {
      const provider = String(subscription.payment_provider ?? "").toLowerCase();
      const recurring =
        typeof subscription.unit_amount_pence === "number" &&
        subscription.unit_amount_pence > 0 &&
        ["week", "month", "year"].includes(String(subscription.billing_interval ?? "").toLowerCase());

      return (
        provider === "stripe" &&
        recurring &&
        subscription.collection_enabled !== true &&
        subscription.teamup_billing_active === true &&
        subscription.processor_verification_status === "verified" &&
        Boolean(subscription.next_payment_at)
      );
    }).length;

    if (!readyCount) {
      window.alert("There are no verified Stripe memberships with a confirmed next payment date ready to prepare.");
      return;
    }

    const confirmed = window.confirm(
      `Prepare all ${readyCount} eligible Stripe memberships for TOTS-OS cutover? This creates/schedules the destination Stripe subscriptions for their existing renewal dates. It does NOT charge anyone now and it does NOT cancel TeamUp.`,
    );
    if (!confirmed) return;

    try {
      setPreparingCutover(true);
      setBulkCutoverMessage(null);
      setError(null);

      const token = await getBillingToken();
      const result = await postBillingMigration(token, { action: "prepare_cutover_all" });

      const prepared =
        result?.summary?.prepared ??
        result?.prepared ??
        result?.created ??
        result?.summary?.created ??
        0;
      const alreadyPrepared =
        result?.summary?.alreadyPrepared ??
        result?.alreadyPrepared ??
        result?.summary?.already_prepared ??
        0;
      const failed =
        result?.summary?.failed ??
        result?.failed ??
        result?.summary?.errors ??
        0;

      setBulkCutoverMessage(
        `TOTS cutover preparation finished. Prepared: ${prepared} · Already prepared: ${alreadyPrepared} · Failed/review: ${failed}. No immediate payments were taken and TeamUp has not been marked stopped.`,
      );

      await loadStore(true);
    } catch (prepareError) {
      setError(prepareError instanceof Error ? prepareError.message : "Bulk cutover preparation failed.");
    } finally {
      setPreparingCutover(false);
    }
  }, [getBillingToken, loadStore, postBillingMigration, preparingCutover, subscriptions]);

  const runBillingMigrationAction = useCallback(async (
    subscription: Subscription,
    action: "scan_one" | "setup" | "verify" | "teamup_stopped" | "activate",
  ) => {
    try {
      setBillingActionId(subscription.id);
      setError(null);

      if (action === "setup") {
        if (stripeStatusLoading) throw new Error("Stripe status is still loading. Try again in a moment.");
        if (!stripeStatus?.connected) throw new Error("MTC Stripe is not connected.");
        if (!stripeStatus.onboardingComplete) throw new Error("MTC Stripe onboarding is not complete.");
      }

      if (action === "teamup_stopped") {
        const confirmedStopped = window.confirm(
          "This does NOT cancel TeamUp for you. Only continue if you have already stopped this member’s billing inside TeamUp. Mark TeamUp billing as stopped?",
        );
        if (!confirmedStopped) return;
      }

      if (action === "activate") {
        const confirmed = window.confirm(
          "Only continue after TeamUp billing is stopped AND the member's next payment date has been verified. Continue with TOTS activation?",
        );
        if (!confirmed) return;
      }

      const token = await getBillingToken();
      const result = await postBillingMigration(token, { subscriptionId: subscription.id, action });

      const scanResult = result.result?.result ? result.result : result.result;
      if (action === "scan_one" && scanResult) {
        setMigrationMessages((current) => ({
          ...current,
          [subscription.id]: scanResult.message || String(scanResult.result || "Checked"),
        }));
      }

      if (result.url) {
        await navigator.clipboard.writeText(result.url).catch(() => undefined);
        window.open(result.url, "_blank", "noopener,noreferrer");
        window.alert("Payment setup link opened and copied to your clipboard. TeamUp remains active.");
      } else if (action === "setup" && result.automatic) {
        window.alert("Copied Stripe payment method verified automatically. No setup link is needed and no payment was collected.");
      }

      await loadStore(true);
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Billing migration action failed.";
      setMigrationMessages((current) => ({ ...current, [subscription.id]: message }));
      setError(message);
    } finally {
      setBillingActionId(null);
    }
  }, [getBillingToken, loadStore, postBillingMigration, stripeStatus, stripeStatusLoading]);

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

  function updateStoreSetting<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K],
  ) {
    setStoreSettings((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current,
    );
  }

  async function saveStoreSettings() {
    if (!organisation || !storeSettings) return;

    const slug =
      storeSettings.slug.trim() ||
      slugify(storeSettings.store_name || organisation.name);

    if (!slug) {
      setError("Enter a store name or storefront slug.");
      return;
    }

    setSavingSettings(true);
    setError(null);

    try {
      const payload = {
        ...storeSettings,
        organisation_id: organisation.id,
        slug,
        store_name: storeSettings.store_name.trim() || organisation.name,
        updated_at: new Date().toISOString(),
      };

      delete (payload as Partial<StoreSettings>).id;

      const { data, error: settingsError } = await supabase
        .from("store_settings")
        .upsert(payload, {
          onConflict: "organisation_id",
        })
        .select("*")
        .single();

      if (settingsError) throw settingsError;

      setStoreSettings(data as StoreSettings);
    } catch (settingsError) {
      console.error("Store settings save error:", settingsError);
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "We couldn't save the storefront settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function uploadStoreAsset(
    assetType: "logo" | "hero" | "favicon",
    file: File,
  ) {
    if (!organisation || !storeSettings) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const maxBytes = assetType === "favicon" ? 2 * 1024 * 1024 : 8 * 1024 * 1024;

    if (file.size > maxBytes) {
      setError(
        `This image is ${(file.size / 1024 / 1024).toFixed(2)} MB. Please choose a file under ${
          assetType === "favicon" ? "2" : "8"
        } MB.`,
      );
      return;
    }

    setUploadingAsset(assetType);
    setError(null);

    try {
      const extension =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/svg+xml"
              ? "svg"
              : file.type === "image/x-icon"
                ? "ico"
                : "jpg";

      const path = `${organisation.id}/${assetType}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      updateStoreSetting(
        assetType === "logo"
          ? "logo_url"
          : assetType === "hero"
            ? "hero_image_url"
            : "favicon_url",
        url,
      );
    } catch (uploadError) {
      console.error("Store asset upload error:", uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "We couldn't upload that image.",
      );
    } finally {
      setUploadingAsset(null);
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
              onClick={() => {
                void loadStore(true);
                void loadStripeStatus(true);
              }}
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

        {!stripeStatusLoading && (!stripeStatus?.connected || !stripeStatus.onboardingComplete) && (
          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-950">
                  {!stripeStatus?.connected
                    ? "Connect MTC to Stripe before moving member billing to TOTS-OS"
                    : "Finish MTC Stripe setup before moving member billing to TOTS-OS"}
                </p>
                <p className="mt-1 max-w-3xl text-sm text-amber-800">
                  {!stripeStatus?.connected
                    ? "The 356 legacy membership records stay billed by TeamUp. Connecting Stripe only creates the MTC payment account; it does not charge members or stop TeamUp."
                    : "The Stripe account has been created, but onboarding is not fully operational yet. TeamUp billing remains unchanged until each member is deliberately cut over."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void connectStripe()}
              disabled={stripeConnectLoading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
            >
              {stripeConnectLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              {stripeStatus?.connected ? "Continue Stripe setup" : "Connect Stripe"}
            </button>
          </div>
        )}

        {!stripeStatusLoading && stripeStatus?.connected && stripeStatus.onboardingComplete && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            <Check className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-semibold">MTC Stripe is ready.</span>{" "}
              Member payment setup can now be moved to TOTS-OS one member at a time. TeamUp remains active until you explicitly mark it stopped for that member.
            </div>
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
            label="Membership records"
            value={String(metrics.membershipRecords)}
            detail={`${metrics.teamupBillingRecords} still billed by TeamUp`}
          />

          <MetricCard
            icon={BadgePoundSterling}
            label="TOTS monthly recurring"
            value={formatMoney(metrics.monthlySubscriptionValue)}
            detail={`${metrics.collectingSubscriptions} collecting through TOTS`}
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

            <TabButton
              active={tab === "settings"}
              onClick={() => setTab("settings")}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Storefront
              </span>
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
              description="Membership register, including legacy TeamUp records and subscriptions collected through TOTS-OS."
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={prepareAllMembersForMtcApp}
                  disabled={preparingMtcImport || preparingCutover || reconcilingStripe}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preparingMtcImport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {preparingMtcImport ? "Completing MTC migration…" : "Complete MTC Migration"}
                </button>
                <SearchBox
                  value={search}
                  onChange={setSearch}
                  placeholder="Search subscriptions..."
                />
              </div>
            </SectionHeader>

            {mtcPreparationResult && (
              <div className="border-b border-stone-100 bg-emerald-50/70 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-emerald-950">MTC migration run finished</p>
                    <p className="mt-1 text-xs text-emerald-900/80">
                      TOTS-OS is now the membership source of truth for every membership this run could safely migrate. Existing processor subscriptions were preserved; missing processor subscriptions were only created where verified authority existed. No immediate migration payment was taken.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-2 text-right shadow-sm ring-1 ring-emerald-100">
                    <p className="text-2xl font-bold text-emerald-800">{mtcPreparationResult.summary?.billingLiveOnTots ?? 0}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Billing live on TOTS</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Canonical memberships checked", mtcPreparationResult.summary?.canonicalMembershipsChecked ?? 0],
                    ["Stripe live", mtcPreparationResult.summary?.stripeLive ?? 0],
                    ["GoCardless live", mtcPreparationResult.summary?.goCardlessLive ?? 0],
                    ["Access memberships in TOTS", mtcPreparationResult.summary?.accessMembershipsInTots ?? 0],
                    ["Member authorisation required", mtcPreparationResult.summary?.memberAuthorisationRequired ?? 0],
                    ["Manual review required", mtcPreparationResult.summary?.manualReviewRequired ?? 0],
                    ["Duplicate rows excluded", mtcPreparationResult.summary?.duplicatesExcluded ?? 0],
                    ["TeamUp shutdown required", mtcPreparationResult.summary?.externalTeamupShutdownRequired ?? 0],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-white px-3 py-3 ring-1 ring-stone-100">
                      <p className="text-lg font-bold text-stone-900">{String(value)}</p>
                      <p className="text-[11px] font-medium text-stone-500">{String(label)}</p>
                    </div>
                  ))}
                </div>

                {(mtcPreparationResult.summary?.externalTeamupShutdownRequired ?? 0) > 0 && (
                  <div className="mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
                    <p className="text-xs font-bold text-red-900">External TeamUp shutdown still required</p>
                    <p className="mt-1 text-xs text-red-800">
                      TOTS cannot cancel TeamUp through this route. Stop billing in TeamUp for the memberships listed below before their next renewal to avoid duplicate charges.
                    </p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-red-900">Show memberships ({mtcPreparationResult.teamupShutdownRequired?.length ?? 0})</summary>
                      <div className="mt-2 max-h-72 space-y-2 overflow-auto">
                        {mtcPreparationResult.teamupShutdownRequired?.map((item, index) => (
                          <div key={`${item.subscriptionId ?? item.email ?? "teamup"}-${index}`} className="rounded-lg bg-white px-3 py-2 text-xs">
                            <p className="font-semibold text-stone-900">{item.customerName || "Unnamed member"} · {item.membership || "Membership"}</p>
                            <p className="text-stone-500">{item.email || "No email"} · {item.provider || "processor"}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

                {((mtcPreparationResult.memberAuthorisationRequired?.length ?? 0) > 0 || (mtcPreparationResult.manualReview?.length ?? 0) > 0) && (
                  <details className="mt-4 rounded-xl bg-white p-4 ring-1 ring-amber-200">
                    <summary className="cursor-pointer text-xs font-bold text-amber-900">
                      Members still requiring action ({(mtcPreparationResult.memberAuthorisationRequired?.length ?? 0) + (mtcPreparationResult.manualReview?.length ?? 0)})
                    </summary>
                    <div className="mt-3 max-h-80 space-y-2 overflow-auto">
                      {[...(mtcPreparationResult.memberAuthorisationRequired ?? []), ...(mtcPreparationResult.manualReview ?? [])].map((item, index) => (
                        <div key={`${item.subscriptionId ?? item.email ?? "review"}-${index}`} className="rounded-lg bg-amber-50 px-3 py-2 text-xs">
                          <p className="font-semibold text-stone-900">{item.customerName || "Unnamed member"} · {item.membership || "Membership not specified"}</p>
                          <p className="text-stone-500">{item.email || "No email"} · {item.provider || "provider review"}</p>
                          <p className="mt-1 text-amber-900">{item.reason || item.result || "Manual review required."}</p>
                          {item.setupUrl && <a className="mt-1 inline-block font-semibold underline" href={item.setupUrl} target="_blank" rel="noreferrer">Open secure payment-authorisation link</a>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {bulkCutoverMessage && (
              <div className="border-b border-stone-100 bg-emerald-50 px-6 py-4 text-xs font-medium text-emerald-900">
                {bulkCutoverMessage}
              </div>
            )}

            {reconcileSummary && (
              <div className="border-b border-stone-100 bg-emerald-50/60 px-6 py-4 text-xs text-stone-700">
                <span className="font-semibold text-emerald-800">Stripe reconciliation finished.</span>{" "}
                Verified: {(reconcileSummary.verified ?? 0) + (reconcileSummary.already_verified ?? 0)} · No payment method: {reconcileSummary.no_payment_method ?? 0} · Multiple matches: {reconcileSummary.multiple_customers ?? 0} · Not found: {reconcileSummary.waiting_for_stripe_copy ?? 0} · Errors: {reconcileSummary.error ?? 0}. No payments collected; TeamUp remains active.
              </div>
            )}

            {filteredSubscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="border-b border-stone-100 bg-stone-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Interval</th>
                      <th className="px-4 py-4">Billing</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Started</th>
                      <th className="px-4 py-4">Migration</th>
                      <th className="px-6 py-4">Membership</th>
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
                          {subscription.collection_enabled === true ? (
                            <span className="text-xs font-semibold text-emerald-700">Live on TOTS</span>
                          ) : !(subscription.billing_interval && subscription.unit_amount_pence && subscription.unit_amount_pence > 0) ? (
                            <span className="text-xs text-stone-400">No recurring billing</span>
                          ) : String(subscription.payment_provider ?? "").toLowerCase() === "gocardless" ? (
                            <span className="text-xs font-semibold text-sky-700">GoCardless migration</span>
                          ) : String(subscription.payment_provider ?? "").toLowerCase() !== "stripe" ? (
                            <span className="text-xs font-semibold text-amber-700">Manual review</span>
                          ) : subscription.processor_verification_status === "verified" && subscription.cutover_status === "verified" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Payment verified</span>
                              {subscription.teamup_billing_active === true ? (
                                <button
                                  type="button"
                                  disabled={billingActionId === subscription.id}
                                  onClick={() => runBillingMigrationAction(subscription, "teamup_stopped")}
                                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 disabled:opacity-50"
                                >
                                  Mark TeamUp stopped
                                </button>
                              ) : null}
                            </div>
                          ) : subscription.cutover_status === "ready" && subscription.teamup_billing_active === false ? (
                            <button
                              type="button"
                              disabled={billingActionId === subscription.id}
                              onClick={() => runBillingMigrationAction(subscription, "activate")}
                              className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {billingActionId === subscription.id ? "Working…" : "Activate TOTS"}
                            </button>
                          ) : (
                            <div className="flex max-w-[260px] flex-col gap-1.5">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={billingActionId === subscription.id || reconcilingStripe}
                                  onClick={() => runBillingMigrationAction(subscription, "scan_one")}
                                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
                                >
                                  {billingActionId === subscription.id ? "Checking…" : "Reconcile"}
                                </button>
                                <button
                                  type="button"
                                  disabled={billingActionId === subscription.id || reconcilingStripe}
                                  onClick={() => runBillingMigrationAction(subscription, "setup")}
                                  className="rounded-lg bg-stone-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Fallback setup
                                </button>
                              </div>
                              {migrationMessages[subscription.id] ? (
                                <span className="text-[11px] leading-4 text-stone-500">{migrationMessages[subscription.id]}</span>
                              ) : (
                                <span className="text-[11px] text-stone-400">Awaiting copied Stripe payment verification</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <p className="max-w-[260px] truncate text-xs font-medium text-stone-700">
                            {subscription.legacy_membership_name || "Membership"}
                          </p>
                          <p className="mt-0.5 max-w-[260px] truncate font-mono text-[11px] text-stone-400">
                            {subscription.stripe_subscription_id ||
                              subscription.external_subscription_id ||
                              (subscription.legacy_billing ? "Legacy TeamUp record" : "—")}
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
                title="No membership records"
                description="Membership and subscription records will appear here."
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

        {tab === "settings" && storeSettings && (
          <div className="mt-6 space-y-6">
            <section className="rounded-[24px] border border-stone-200 bg-white shadow-sm">
              <SectionHeader
                title="Storefront"
                description="Control how your public store looks and where customers shop."
              >
                {storeSettings.slug && storeSettings.storefront_mode !== "external" && (
                  <a
                    href={`/shop/${storeSettings.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Preview store
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </SectionHeader>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <Field label="Storefront mode">
                  <select
                    value={storeSettings.storefront_mode || "hosted"}
                    onChange={(event) =>
                      updateStoreSetting("storefront_mode", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="hosted">TOTS hosted storefront</option>
                    <option value="external">External storefront</option>
                  </select>
                </Field>

                <Field label="Store live">
                  <label className="flex h-11 items-center justify-between rounded-xl border border-stone-200 px-4">
                    <span className="text-sm text-stone-700">
                      {storeSettings.is_live ? "Live" : "Hidden"}
                    </span>
                    <input
                      type="checkbox"
                      checked={storeSettings.is_live === true}
                      onChange={(event) =>
                        updateStoreSetting("is_live", event.target.checked)
                      }
                      className="h-4 w-4"
                    />
                  </label>
                </Field>

                <Field label="Store name">
                  <input
                    value={storeSettings.store_name || ""}
                    onChange={(event) =>
                      updateStoreSetting("store_name", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Store slug">
                  <input
                    value={storeSettings.slug || ""}
                    onChange={(event) =>
                      updateStoreSetting("slug", slugify(event.target.value))
                    }
                    className={inputClass}
                    placeholder="moray-training-club"
                  />
                </Field>

                {storeSettings.storefront_mode === "external" && (
                  <Field label="External store URL" className="md:col-span-2">
                    <input
                      value={
                        storeSettings.external_store_url ||
                        storeSettings.external_storefront_url ||
                        ""
                      }
                      onChange={(event) =>
                        updateStoreSetting("external_store_url", event.target.value)
                      }
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </Field>
                )}

                <Field label="Store description" className="md:col-span-2">
                  <textarea
                    value={storeSettings.store_description || ""}
                    onChange={(event) =>
                      updateStoreSetting("store_description", event.target.value)
                    }
                    rows={3}
                    className={`${inputClass} h-auto resize-none py-3`}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-950">Brand assets</h2>
              <p className="mt-1 text-sm text-stone-500">
                Upload images directly. No image URLs are required.
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <StoreAssetUpload
                  label="Logo"
                  value={storeSettings.logo_url || ""}
                  uploading={uploadingAsset === "logo"}
                  onFile={(file) => void uploadStoreAsset("logo", file)}
                  onRemove={() => updateStoreSetting("logo_url", "")}
                />
                <StoreAssetUpload
                  label="Hero image"
                  value={storeSettings.hero_image_url || ""}
                  uploading={uploadingAsset === "hero"}
                  onFile={(file) => void uploadStoreAsset("hero", file)}
                  onRemove={() => updateStoreSetting("hero_image_url", "")}
                />
                <StoreAssetUpload
                  label="Favicon"
                  value={storeSettings.favicon_url || ""}
                  uploading={uploadingAsset === "favicon"}
                  onFile={(file) => void uploadStoreAsset("favicon", file)}
                  onRemove={() => updateStoreSetting("favicon_url", "")}
                />
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-950">Colours & typography</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {([
                  ["Background", "background_colour", "#ffffff"],
                  ["Text", "text_colour", "#1c1917"],
                  ["Accent", "accent_colour", "#A9B897"],
                  ["Button", "button_colour", "#1c1917"],
                  ["Button text", "button_text_colour", "#ffffff"],
                ] as const).map(([label, key, fallback]) => (
                  <Field key={key} label={label}>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(storeSettings[key] as string) || fallback}
                        onChange={(event) => updateStoreSetting(key, event.target.value)}
                        className="h-11 w-14 rounded-xl border border-stone-200 bg-white p-1"
                      />
                      <input
                        value={(storeSettings[key] as string) || fallback}
                        onChange={(event) => updateStoreSetting(key, event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </Field>
                ))}

                <Field label="Heading font">
                  <select
                    value={storeSettings.heading_font || "Inter"}
                    onChange={(event) =>
                      updateStoreSetting("heading_font", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option>Inter</option>
                    <option>Poppins</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                    <option>DM Sans</option>
                  </select>
                </Field>

                <Field label="Body font">
                  <select
                    value={storeSettings.body_font || "Inter"}
                    onChange={(event) =>
                      updateStoreSetting("body_font", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option>Inter</option>
                    <option>Poppins</option>
                    <option>Montserrat</option>
                    <option>DM Sans</option>
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-950">Layout & content</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Layout">
                  <select
                    value={storeSettings.layout_style || "classic"}
                    onChange={(event) =>
                      updateStoreSetting("layout_style", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                    <option value="memberships">Memberships</option>
                  </select>
                </Field>

                <Field label="Card style">
                  <select
                    value={storeSettings.card_style || "rounded"}
                    onChange={(event) =>
                      updateStoreSetting("card_style", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="rounded">Rounded</option>
                    <option value="soft">Soft</option>
                    <option value="square">Square</option>
                  </select>
                </Field>

                <Field label="Border radius">
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={storeSettings.border_radius ?? 24}
                    onChange={(event) =>
                      updateStoreSetting("border_radius", Number(event.target.value))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Support email">
                  <input
                    type="email"
                    value={storeSettings.support_email || ""}
                    onChange={(event) =>
                      updateStoreSetting("support_email", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Hero title">
                  <input
                    value={storeSettings.hero_title || ""}
                    onChange={(event) =>
                      updateStoreSetting("hero_title", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Announcement">
                  <input
                    value={storeSettings.announcement || ""}
                    onChange={(event) =>
                      updateStoreSetting("announcement", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Hero text" className="md:col-span-2">
                  <textarea
                    value={storeSettings.hero_text || ""}
                    onChange={(event) =>
                      updateStoreSetting("hero_text", event.target.value)
                    }
                    rows={3}
                    className={`${inputClass} h-auto resize-none py-3`}
                  />
                </Field>

                <Field label="Shipping text">
                  <input
                    value={storeSettings.shipping_text || ""}
                    onChange={(event) =>
                      updateStoreSetting("shipping_text", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Footer text">
                  <input
                    value={storeSettings.footer_text || ""}
                    onChange={(event) =>
                      updateStoreSetting("footer_text", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    ["Search", "show_search"],
                    ["Categories", "show_categories"],
                    ["Stock", "show_stock"],
                    ["Prices", "show_prices"],
                  ] as const).map(([label, key]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700"
                    >
                      {label}
                      <input
                        type="checkbox"
                        checked={storeSettings[key] !== false}
                        onChange={(event) =>
                          updateStoreSetting(key, event.target.checked)
                        }
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-stone-950">Social & advanced</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Instagram">
                  <input
                    value={storeSettings.instagram_url || ""}
                    onChange={(event) =>
                      updateStoreSetting("instagram_url", event.target.value)
                    }
                    className={inputClass}
                    placeholder="https://instagram.com/..."
                  />
                </Field>
                <Field label="Facebook">
                  <input
                    value={storeSettings.facebook_url || ""}
                    onChange={(event) =>
                      updateStoreSetting("facebook_url", event.target.value)
                    }
                    className={inputClass}
                    placeholder="https://facebook.com/..."
                  />
                </Field>
                <Field label="TikTok">
                  <input
                    value={storeSettings.tiktok_url || ""}
                    onChange={(event) =>
                      updateStoreSetting("tiktok_url", event.target.value)
                    }
                    className={inputClass}
                    placeholder="https://tiktok.com/@..."
                  />
                </Field>
                <Field label="Custom CSS" className="md:col-span-2">
                  <textarea
                    value={storeSettings.custom_css || ""}
                    onChange={(event) =>
                      updateStoreSetting("custom_css", event.target.value)
                    }
                    rows={7}
                    className={`${inputClass} h-auto resize-y py-3 font-mono text-xs`}
                    placeholder=".store-theme { ... }"
                  />
                </Field>
              </div>

              <div className="mt-6 flex justify-end border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => void saveStoreSettings()}
                  disabled={savingSettings}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save storefront settings
                </button>
              </div>
            </section>
          </div>
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

function StoreAssetUpload({
  label,
  value,
  uploading,
  onFile,
  onRemove,
}: {
  label: string;
  value: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-dashed border-stone-200 bg-white">
        <div className="flex min-h-[150px] items-center justify-center p-4">
          {value ? (
            <img src={value} alt={label} className="max-h-[180px] max-w-full object-contain" />
          ) : (
            <div className="text-center text-stone-300">
              <ImageIcon className="mx-auto h-7 w-7" />
              <p className="mt-2 text-xs">No image uploaded</p>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-stone-100 px-4 py-3 text-xs font-semibold text-stone-700 hover:bg-stone-50">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
            disabled={uploading}
            className="hidden"
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.item(0) ?? null;
              if (file) onFile(file);
              input.value = "";
            }}
          />
        </label>
      </div>
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
