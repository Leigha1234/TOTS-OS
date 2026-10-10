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
  QrCode,
  Copy,
  Download,
  Link2,
  Power,
  PowerOff,
  Sparkles,
  WandSparkles,
  ClipboardCopy,
  Megaphone,
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


type AiCopy = {
  title: string;
  short_description: string;
  description: string;
  seo_title: string;
  meta_description: string;
  alt_text: string;
  category: string;
  tags: string[];
  instagram: string;
  facebook: string;
  tiktok: string;
  email_subject: string;
  email_body: string;
};

type Tab =
  | "overview"
  | "products"
  | "orders"
  | "subscriptions"
  | "discounts"
  | "qr"
  | "settings";

type StoreQrCode = {
  id: string;
  organisation_id: string;
  name: string;
  slug: string;
  destination_type:
    | "storefront"
    | "category"
    | "product"
    | "membership"
    | "drinks"
    | "rooted"
    | "custom";
  destination_url: string;
  category?: string | null;
  product_id?: string | null;
  description?: string | null;
  is_active: boolean;
  track_scans: boolean;
  scan_count: number;
  foreground_color?: string | null;
  background_color?: string | null;
  label?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type QrDraft = {
  name: string;
  slug: string;
  destination_type: StoreQrCode["destination_type"];
  destination_url: string;
  description: string;
  track_scans: boolean;
};

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
  const [qrCodes, setQrCodes] = useState<StoreQrCode[]>([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<StoreQrCode | null>(null);
  const [savingQr, setSavingQr] = useState(false);
  const [qrPreviewSvg, setQrPreviewSvg] = useState<Record<string, string>>({});
  const [qrDraft, setQrDraft] = useState<QrDraft>({
    name: "",
    slug: "",
    destination_type: "custom",
    destination_url: "",
    description: "",
    track_scans: true,
  });
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiCopy, setAiCopy] = useState<AiCopy | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTone, setAiTone] = useState("friendly");
  const [aiAudience, setAiAudience] = useState("");
  const [aiFacts, setAiFacts] = useState("");
  const [aiBrandVoice, setAiBrandVoice] = useState("");
  const [aiBulkBusy, setAiBulkBusy] = useState(false);
  const [aiBulkProgress, setAiBulkProgress] = useState("");
  const [aiSelected, setAiSelected] = useState<string[]>([]);


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
          qrCodesResult,
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
            .from("store_qr_codes")
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
        if (qrCodesResult.error) throw qrCodesResult.error;
        if (settingsResult.error) throw settingsResult.error;

        setOrganisation(organisationResult.data as Organisation);
        setProducts((productsResult.data ?? []) as Product[]);
        setOrders((ordersResult.data ?? []) as StoreOrder[]);
        setSubscriptions((subscriptionsResult.data ?? []) as Subscription[]);
        setDiscounts((discountsResult.data ?? []) as Discount[]);
        setQrCodes((qrCodesResult.data ?? []) as StoreQrCode[]);
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


  async function requestAi(product: ProductDraft, tone = aiTone, facts = aiFacts) {
    if (!organisation) throw new Error("Select an organisation first.");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch("/api/store/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        organisation_id: organisation.id,
        product,
        tone,
        audience: aiAudience,
        brand_voice: aiBrandVoice,
        additional_facts: facts,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "AI generation failed.");
    return result.copy as AiCopy;
  }

  async function generateAi() {
    setAiBusy(true);
    setAiError(null);
    try {
      const result = await requestAi(draft);
      setAiCopy(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI generation failed.");
    } finally {
      setAiBusy(false);
    }
  }

  async function saveAiCopy(productId: string, copy: AiCopy) {
    if (!organisation) return;
    const { error: upsertError } = await supabase
      .from("store_product_ai_content")
      .upsert({
        organisation_id: organisation.id,
        product_id: productId,
        content: copy,
        updated_at: new Date().toISOString(),
      }, { onConflict: "product_id" });
    if (upsertError) throw upsertError;
  }

  async function openProductAi(product?: Product) {
    setAiError(null);
    setAiCopy(null);
    setAiOpen(true);
    if (!product) return;
    try {
      const { data, error: readError } = await supabase
        .from("store_product_ai_content")
        .select("content")
        .eq("product_id", product.id)
        .maybeSingle();
      if (readError) throw readError;
      if (data?.content) setAiCopy(data.content as AiCopy);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not load saved AI copy.");
    }
  }

  async function saveCurrentAi() {
    if (!editingProduct || !aiCopy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      await saveAiCopy(editingProduct.id, aiCopy);
      setAiOpen(false);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not save AI content.");
    } finally {
      setAiBusy(false);
    }
  }

  async function generateMissingDescriptions() {
    if (!organisation || aiSelected.length === 0) return;
    setAiBulkBusy(true);
    setAiBulkProgress("");
    let success = 0;
    let failed = 0;
    try {
      for (const [index, id] of aiSelected.entries()) {
        const product = products.find((item) => item.id === id);
        if (!product) continue;
        setAiBulkProgress(`Generating ${index + 1} of ${aiSelected.length}: ${product.name}`);
        try {
          const copy = await requestAi({
            ...blankProduct,
            name: product.name,
            description: product.description || "",
            category: product.category || "",
            price: String(product.price),
            image_url: product.image_url || "",
            selling_model: product.selling_model || "physical",
          });
          await saveAiCopy(id, copy);
          // Only fill an empty description; never overwrite existing copy.
          if (!product.description?.trim()) {
            const { error: updateError } = await supabase
              .from("store_products")
              .update({ description: copy.description })
              .eq("id", id)
              .eq("organisation_id", organisation.id);
            if (updateError) throw updateError;
          }
          success++;
        } catch (e) {
          console.error("Bulk AI product failed", id, e);
          failed++;
        }
      }
      setAiBulkProgress(`Finished: ${success} generated, ${failed} failed.`);
      setAiSelected([]);
      await loadStore(true);
    } finally {
      setAiBulkBusy(false);
    }
  }

  function openNewProduct() {
    setEditingProduct(null);
    setAiCopy(null);
    setDraft(blankProduct);
    setProductModalOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setAiCopy(null);

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
        if (aiCopy) await saveAiCopy(editingProduct.id, aiCopy);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("store_products")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        if (inserted && aiCopy) await saveAiCopy(inserted.id, aiCopy);
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


  const publicQrUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/q/${slug}`;
    }
    return `https://www.tots-os.co.uk/q/${slug}`;
  };

  const normaliseQrSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

  const openNewQr = () => {
    setEditingQr(null);
    setQrDraft({
      name: "",
      slug: "",
      destination_type: "custom",
      destination_url: "",
      description: "",
      track_scans: true,
    });
    setQrModalOpen(true);
  };

  const openEditQr = (qr: StoreQrCode) => {
    setEditingQr(qr);
    setQrDraft({
      name: qr.name,
      slug: qr.slug,
      destination_type: qr.destination_type,
      destination_url: qr.destination_url,
      description: qr.description || "",
      track_scans: qr.track_scans,
    });
    setQrModalOpen(true);
  };

  const saveQrCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!organisation) return;

    const name = qrDraft.name.trim();
    const slug = normaliseQrSlug(qrDraft.slug || qrDraft.name);
    const destinationUrl = qrDraft.destination_url.trim();

    if (!name || !slug || !destinationUrl) {
      setError("QR name, slug and destination are required.");
      return;
    }

    setSavingQr(true);
    setError(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const payload = {
        organisation_id: organisation.id,
        name,
        slug,
        destination_type: qrDraft.destination_type,
        destination_url: destinationUrl,
        description: qrDraft.description.trim() || null,
        track_scans: qrDraft.track_scans,
        created_by: authData.user?.id ?? null,
      };

      if (editingQr) {
        const { data, error: updateError } = await supabase
          .from("store_qr_codes")
          .update({
            name: payload.name,
            slug: payload.slug,
            destination_type: payload.destination_type,
            destination_url: payload.destination_url,
            description: payload.description,
            track_scans: payload.track_scans,
          })
          .eq("id", editingQr.id)
          .eq("organisation_id", organisation.id)
          .select("*")
          .single();

        if (updateError) throw updateError;
        setQrCodes((current) =>
          current.map((item) => (item.id === editingQr.id ? (data as StoreQrCode) : item)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("store_qr_codes")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) throw insertError;
        setQrCodes((current) => [data as StoreQrCode, ...current]);
      }

      setQrModalOpen(false);
    } catch (saveError) {
      console.error("Unable to save QR code:", saveError);
      setError(saveError instanceof Error ? saveError.message : "Unable to save QR code.");
    } finally {
      setSavingQr(false);
    }
  };

  const toggleQrActive = async (qr: StoreQrCode) => {
    const { data, error: updateError } = await supabase
      .from("store_qr_codes")
      .update({ is_active: !qr.is_active })
      .eq("id", qr.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setQrCodes((current) =>
      current.map((item) => (item.id === qr.id ? (data as StoreQrCode) : item)),
    );
  };

  const deleteQrCode = async (qr: StoreQrCode) => {
    if (!window.confirm(`Delete "${qr.name}"? Printed copies of this QR will stop working.`)) return;
    const { error: deleteError } = await supabase
      .from("store_qr_codes")
      .delete()
      .eq("id", qr.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setQrCodes((current) => current.filter((item) => item.id !== qr.id));
  };

  const ensureQrSvg = async (qr: StoreQrCode) => {
    if (qrPreviewSvg[qr.id]) return qrPreviewSvg[qr.id];
    const QRCode = await import("qrcode");
    const svg = await QRCode.toString(publicQrUrl(qr.slug), {
      type: "svg",
      width: 360,
      margin: 2,
      color: {
        dark: qr.foreground_color || "#000000",
        light: qr.background_color || "#FFFFFF",
      },
    });
    setQrPreviewSvg((current) => ({ ...current, [qr.id]: svg }));
    return svg;
  };

  const downloadQr = async (qr: StoreQrCode) => {
    try {
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(publicQrUrl(qr.slug), {
        width: 1200,
        margin: 3,
        errorCorrectionLevel: "H",
        color: {
          dark: qr.foreground_color || "#000000",
          light: qr.background_color || "#FFFFFF",
        },
      });
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${qr.slug}-qr.png`;
      anchor.click();
    } catch (downloadError) {
      console.error(downloadError);
      setError("Unable to generate the QR image.");
    }
  };

  useEffect(() => {
    if (tab !== "qr") return;
    qrCodes.forEach((qr) => {
      void ensureQrSvg(qr);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, qrCodes]);

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

            <TabButton active={tab === "qr"} onClick={() => setTab("qr")}>
              <span className="inline-flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Codes <CountBadge>{qrCodes.length}</CountBadge>
              </span>
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
                onClick={() => void generateMissingDescriptions()}
                disabled={aiBulkBusy || aiSelected.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#cbd8bf] bg-[#edf2e8] px-4 text-xs font-bold text-[#526744] disabled:opacity-40"
              >
                {aiBulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI bulk ({aiSelected.length})
              </button>

              <button
                type="button"
                onClick={openNewProduct}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add product
              </button>
            </SectionHeader>

            {aiBulkProgress && (
              <p className="border-b border-stone-100 px-6 py-3 text-xs text-stone-600" role="status">{aiBulkProgress}</p>
            )}
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-stone-100 bg-stone-50/80">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      <th className="pl-6 py-4">
                        <input type="checkbox" aria-label="Select visible products" checked={filteredProducts.length > 0 && filteredProducts.every((p) => aiSelected.includes(p.id))} onChange={(e) => setAiSelected(e.target.checked ? filteredProducts.map((p) => p.id) : [])} />
                      </th>
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
                        <td className="pl-6 py-4"><input type="checkbox" aria-label={`Select ${product.name}`} checked={aiSelected.includes(product.id)} onChange={(e) => setAiSelected((current) => e.target.checked ? [...new Set([...current, product.id])] : current.filter((id) => id !== product.id))} /></td>
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

        {tab === "qr" && (
          <div className="mt-6 space-y-6">
            <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
              <SectionHeader
                title="QR Codes"
                description="Create permanent, trackable QR links for your shop, products, memberships and in-person sales."
              >
                <button
                  type="button"
                  onClick={openNewQr}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white hover:bg-stone-800"
                >
                  <Plus className="h-4 w-4" />
                  Create QR code
                </button>
              </SectionHeader>

              {qrCodes.length ? (
                <div className="grid gap-5 p-6 lg:grid-cols-2 2xl:grid-cols-3">
                  {qrCodes.map((qr) => (
                    <article key={qr.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                      <div className="grid grid-cols-[132px_1fr] gap-5 p-5">
                        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-white p-2">
                          {qrPreviewSvg[qr.id] ? (
                            <div
                              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                              dangerouslySetInnerHTML={{ __html: qrPreviewSvg[qr.id] }}
                            />
                          ) : (
                            <Loader2 className="h-5 w-5 animate-spin text-stone-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold text-stone-950">{qr.name}</h3>
                              <p className="mt-1 text-xs capitalize text-stone-400">
                                {qr.destination_type.replaceAll("_", " ")}
                              </p>
                            </div>
                            <StatusBadge status={qr.is_active ? "active" : "inactive"} />
                          </div>

                          <div className="mt-4 rounded-xl bg-stone-50 px-3 py-2">
                            <p className="truncate font-mono text-[11px] text-stone-500">
                              /q/{qr.slug}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center gap-4 text-xs text-stone-500">
                            <span><strong className="text-stone-900">{qr.scan_count ?? 0}</strong> scans</span>
                            <span>{qr.track_scans ? "Tracking on" : "Tracking off"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-stone-100 p-4">
                        <button
                          type="button"
                          onClick={() => void navigator.clipboard.writeText(publicQrUrl(qr.slug))}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadQr(qr)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          <Download className="h-3.5 w-3.5" /> Download PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditQr(qr)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleQrActive(qr)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          {qr.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          {qr.is_active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteQrCode(qr)}
                          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
                          aria-label={`Delete ${qr.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={QrCode}
                  title="No QR codes yet"
                  description="Create a permanent QR for memberships, a product range, drinks, events or any other store destination."
                  action={
                    <button
                      type="button"
                      onClick={openNewQr}
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" /> Create your first QR
                    </button>
                  }
                />
              )}
            </section>
          </div>
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

      {qrModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void saveQrCode(event)}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-stone-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">
                  {editingQr ? "Edit QR code" : "Create QR code"}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  The printed QR stays the same even when you change its destination.
                </p>
              </div>
              <button type="button" onClick={() => setQrModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-stone-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field label="QR name" required>
                <input
                  className={inputClass}
                  value={qrDraft.name}
                  onChange={(event) =>
                    setQrDraft((current) => ({
                      ...current,
                      name: event.target.value,
                      slug: editingQr ? current.slug : normaliseQrSlug(event.target.value),
                    }))
                  }
                  placeholder="Buy a Drink"
                  required
                />
              </Field>

              <Field label="Permanent slug" required>
                <input
                  className={inputClass}
                  value={qrDraft.slug}
                  onChange={(event) => setQrDraft((current) => ({ ...current, slug: normaliseQrSlug(event.target.value) }))}
                  placeholder="mtc-drinks"
                  required
                />
                <span className="mt-2 block text-xs text-stone-400">/q/{qrDraft.slug || "your-code"}</span>
              </Field>

              <Field label="Destination type">
                <select
                  className={inputClass}
                  value={qrDraft.destination_type}
                  onChange={(event) =>
                    setQrDraft((current) => ({
                      ...current,
                      destination_type: event.target.value as StoreQrCode["destination_type"],
                    }))
                  }
                >
                  <option value="storefront">Storefront</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                  <option value="membership">Memberships</option>
                  <option value="drinks">Drinks / self-service</option>
                  <option value="rooted">Rooted</option>
                  <option value="custom">Custom URL</option>
                </select>
              </Field>

              <Field label="Destination URL" required>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-300" />
                  <input
                    className={`${inputClass} pl-10`}
                    value={qrDraft.destination_url}
                    onChange={(event) => setQrDraft((current) => ({ ...current, destination_url: event.target.value }))}
                    placeholder="/shop/your-store or https://..."
                    required
                  />
                </div>
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  className={`${inputClass} h-auto min-h-24 resize-y py-3`}
                  value={qrDraft.description}
                  onChange={(event) => setQrDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional internal note about where this QR will be displayed."
                />
              </Field>

              <div className="md:col-span-2">
                <ToggleCard
                  label="Track scans"
                  description="Count how many times this QR is scanned. No raw IP address is stored."
                  checked={qrDraft.track_scans}
                  onChange={(value) => setQrDraft((current) => ({ ...current, track_scans: value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-5">
              <button type="button" onClick={() => setQrModalOpen(false)} className="h-11 rounded-xl border border-stone-200 px-5 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                Cancel
              </button>
              <button type="submit" disabled={savingQr} className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50">
                {savingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {editingQr ? "Save QR code" : "Create QR code"}
              </button>
            </div>
          </form>
        </div>
      )}


      {aiOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-[#faf9f6] shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#7b9568]"><Sparkles className="h-4 w-4" /> Clarity AI · Store</p>
                <h2 className="mt-1 text-2xl font-semibold text-stone-900">AI Product Assistant</h2>
                <p className="mt-1 text-xs text-stone-500">Generate product copy, SEO, image alt text and marketing captions. Nothing is published automatically.</p>
              </div>
              <button type="button" onClick={() => setAiOpen(false)} className="rounded-xl p-2 hover:bg-stone-100" aria-label="Close AI assistant"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tone"><select className={inputClass} value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                  <option value="friendly">Friendly</option><option value="professional">Professional</option><option value="luxury">Luxury</option><option value="playful">Playful</option><option value="bold">Bold</option><option value="minimal">Minimal</option>
                </select></Field>
                <Field label="Target audience"><input className={inputClass} value={aiAudience} onChange={(e) => setAiAudience(e.target.value)} placeholder="e.g. Busy parents, gym members" /></Field>
                <Field label="Brand voice" className="sm:col-span-2"><input className={inputClass} value={aiBrandVoice} onChange={(e) => setAiBrandVoice(e.target.value)} placeholder="e.g. Down-to-earth, Scottish, never pushy" /></Field>
                <Field label="Extra product facts (AI must not invent details)" className="sm:col-span-2"><textarea className={`${inputClass} h-auto min-h-20 py-3`} value={aiFacts} onChange={(e) => setAiFacts(e.target.value)} placeholder="Materials, sizes, benefits, what's included, delivery info..." /></Field>
              </div>
              <button type="button" disabled={aiBusy || !draft.name.trim()} onClick={() => void generateAi()} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-stone-900 px-5 text-sm font-bold text-white disabled:opacity-40">
                {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                {aiBusy ? "Generating..." : aiCopy ? "Regenerate all copy" : "Generate product content"}
              </button>
              {!draft.name.trim() && <p className="mt-2 text-xs text-amber-700">Enter the product name first, then open Clarity AI.</p>}
              {aiError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{aiError}</p>}
              {aiCopy && (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-bold text-stone-900">Product listing</h3>
                    <AiTextEditor label="Product title" value={aiCopy.title} onChange={(value) => setAiCopy({ ...aiCopy, title: value })} onUse={() => setDraft((p) => ({ ...p, name: aiCopy.title }))} />
                    <AiTextEditor label="Short description" value={aiCopy.short_description} onChange={(value) => setAiCopy({ ...aiCopy, short_description: value })} />
                    <AiTextEditor label="Full description" value={aiCopy.description} onChange={(value) => setAiCopy({ ...aiCopy, description: value })} onUse={() => setDraft((p) => ({ ...p, description: aiCopy.description }))} />
                    <AiTextEditor label="Suggested category" value={aiCopy.category} onChange={(value) => setAiCopy({ ...aiCopy, category: value })} onUse={() => setDraft((p) => ({ ...p, category: aiCopy.category }))} />
                    <AiTextEditor label="Tags" value={aiCopy.tags.join(", ")} onChange={(value) => setAiCopy({ ...aiCopy, tags: value.split(",").map((v) => v.trim()).filter(Boolean) })} />
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h3 className="mb-4 text-sm font-bold text-stone-900">SEO & accessibility</h3>
                    <AiTextEditor label="SEO title" value={aiCopy.seo_title} onChange={(value) => setAiCopy({ ...aiCopy, seo_title: value })} />
                    <AiTextEditor label="Meta description" value={aiCopy.meta_description} onChange={(value) => setAiCopy({ ...aiCopy, meta_description: value })} />
                    <AiTextEditor label="Image alt text" value={aiCopy.alt_text} onChange={(value) => setAiCopy({ ...aiCopy, alt_text: value })} />
                    <p className="text-xs text-stone-400">Review alt text against the actual product image before using it.</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-stone-900"><Megaphone className="h-4 w-4" /> Promote with AI</h3>
                    <AiTextEditor label="Instagram caption" value={aiCopy.instagram} onChange={(value) => setAiCopy({ ...aiCopy, instagram: value })} />
                    <AiTextEditor label="Facebook caption" value={aiCopy.facebook} onChange={(value) => setAiCopy({ ...aiCopy, facebook: value })} />
                    <AiTextEditor label="TikTok caption" value={aiCopy.tiktok} onChange={(value) => setAiCopy({ ...aiCopy, tiktok: value })} />
                    <AiTextEditor label="Email subject" value={aiCopy.email_subject} onChange={(value) => setAiCopy({ ...aiCopy, email_subject: value })} />
                    <AiTextEditor label="Email launch copy" value={aiCopy.email_body} onChange={(value) => setAiCopy({ ...aiCopy, email_body: value })} />
                    <p className="text-xs text-stone-400">Copy captions into Social Studio or email campaigns. Direct scheduling integration is not enabled in this version.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-stone-200 bg-white px-5 py-4 sm:px-7">
              <button type="button" onClick={() => setAiOpen(false)} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold">Close</button>
              {editingProduct && aiCopy && <button type="button" disabled={aiBusy} onClick={() => void saveCurrentAi()} className="rounded-xl bg-[#a9b897] px-4 py-2.5 text-sm font-bold text-stone-900 disabled:opacity-50">Save AI content</button>}
            </div>
          </div>
        </div>
      )}

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
                onClick={() => void openProductAi(editingProduct ?? undefined)}
                className="ml-auto mr-3 inline-flex items-center gap-2 rounded-xl bg-[#edf2e8] px-3 py-2 text-xs font-bold text-[#526744] hover:bg-[#dfe9d8]"
              >
                <Sparkles className="h-4 w-4" /> Clarity AI
              </button>

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

function AiTextEditor({ label, value, onChange, onUse }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUse?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* Clipboard may be unavailable. */ }
  }
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-stone-600">{label}</label>
        <div className="flex gap-2">
          {onUse && <button type="button" onClick={onUse} className="rounded-lg bg-[#edf2e8] px-3 py-1.5 text-[11px] font-bold text-[#526744]">Use in product</button>}
          <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600"><ClipboardCopy className="h-3 w-3" />{copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={value.length > 150 ? 5 : 2} className="w-full resize-y rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2.5 text-sm leading-6 text-stone-800 outline-none focus:border-stone-500" />
    </div>
  );
}

