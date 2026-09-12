"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Instagram,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import { useParams } from "next/navigation";

// ============================================================
// TYPES
// ============================================================

type Storefront = {
  id: string;
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

  company_name?: string | null;

  logo_url?: string | null;

  email?: string | null;
  phone?: string | null;
  address?: string | null;

  website_url?: string | null;
  instagram_url?: string | null;
};

type SellingModel =
  | "physical"
  | "digital_download"
  | "digital_delivery"
  | "collect"
  | "customisable"
  | "request_to_order"
  | "service";

type Product = {
  id: string;

  organisation_id?: string | null;

  name: string;

  slug?: string | null;

  description?: string | null;

  category?: string | null;

  selling_model?: SellingModel | string | null;

  price: number | string;

  compare_at_price?: number | string | null;

  cost_price?: number | string | null;

  image_url?: string | null;

  images?: string[] | null;

  inventory_quantity?: number | null;

  stock?: number | null;

  low_stock_threshold?: number | null;

  track_inventory?: boolean | null;

  sku?: string | null;

  is_active?: boolean | null;

  featured?: boolean | null;

  sort_order?: number | null;

  status?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  purchase_type?:
    | "one_off"
    | "subscription"
    | string
    | null;

  billing_interval?:
    | "week"
    | "month"
    | "year"
    | string
    | null;

  external_system?:
    | string
    | null;

  external_plan_code?:
    | string
    | null;

  beneficiary_mode?:
    | "none"
    | "single_adult"
    | "couple"
    | "child"
    | "child_plus_adult"
    | string
    | null;

  [key: string]: unknown;
};

type CartLine = {
  product: Product;
  quantity: number;
};

type BeneficiaryType =
  | "adult"
  | "child";

type BeneficiaryMode =
  | "none"
  | "single_adult"
  | "couple"
  | "child"
  | "child_plus_adult";

type BeneficiaryDraft = {
  productId: string;
  slotKey: string;
  beneficiaryType: BeneficiaryType;
  isPrimary: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationshipToPayer: string;
};

type BeneficiarySpec = {
  key: string;
  beneficiaryType: BeneficiaryType;
  isPrimary: boolean;
  title: string;
  description: string;
  relationshipToPayer: string;
  emailRequired: boolean;
};

type StorefrontApiResponse = {
  store?: Storefront;
  products?: Product[];
  productLoadWarning?: string | null;
  error?: string;
};

type ContactApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type CheckoutApiResponse = {
  success?: boolean;

  url?: string;
  checkoutUrl?: string;
  sessionUrl?: string;

  sessionId?: string;

  orderId?: string;
  orderNumber?: string;

  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  total?: number;

  discountCode?: string | null;

  error?: string;
  message?: string;
};

// ============================================================
// CONSTANTS
// ============================================================

const STOREFRONT_REQUEST_TIMEOUT_MS = 30000;
const CONTACT_REQUEST_TIMEOUT_MS = 20000;

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value?: number | string | null
) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(value || 0));
}

function normaliseColour(
  value?: string | null,
  fallback = "#a9b897"
) {
  const trimmed = String(
    value || ""
  ).trim();

  if (
    /^#[0-9A-Fa-f]{6}$/.test(
      trimmed
    )
  ) {
    return trimmed;
  }

  return fallback;
}

function normaliseDiscountCode(
  value: string
) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normaliseBeneficiaryMode(
  value: unknown
): BeneficiaryMode {
  switch (value) {
    case "single_adult":
    case "couple":
    case "child":
    case "child_plus_adult":
      return value;

    default:
      return "none";
  }
}

function isMembershipProduct(
  product: Product
) {
  return (
    String(
      product.purchase_type ||
        ""
    ).toLowerCase() ===
      "subscription" &&
    String(
      product.external_system ||
        ""
    ).toLowerCase() ===
      "mtc" &&
    normaliseBeneficiaryMode(
      product.beneficiary_mode
    ) !== "none"
  );
}

function getBeneficiarySpecs(
  line: CartLine
): BeneficiarySpec[] {
  if (
    !isMembershipProduct(
      line.product
    )
  ) {
    return [];
  }

  const mode =
    normaliseBeneficiaryMode(
      line.product
        .beneficiary_mode
    );

  const specs:
    BeneficiarySpec[] = [];

  const quantity =
    Math.max(
      1,
      Math.floor(
        Number(
          line.quantity ||
            1
        )
      )
    );

  for (
    let purchaseIndex = 0;
    purchaseIndex <
    quantity;
    purchaseIndex += 1
  ) {
    const purchaseSuffix =
      quantity > 1
        ? ` — membership ${purchaseIndex + 1}`
        : "";

    if (
      mode ===
      "single_adult"
    ) {
      specs.push({
        key:
          `${line.product.id}:${purchaseIndex}:adult:1`,
        beneficiaryType:
          "adult",
        isPrimary:
          true,
        title:
          `Member${purchaseSuffix}`,
        description:
          "Enter the adult who will use this membership.",
        relationshipToPayer:
          "self",
        emailRequired:
          true,
      });
    }

    if (
      mode === "couple"
    ) {
      specs.push(
        {
          key:
            `${line.product.id}:${purchaseIndex}:adult:1`,
          beneficiaryType:
            "adult",
          isPrimary:
            true,
          title:
            `Adult 1${purchaseSuffix}`,
          description:
            "First adult covered by the couples membership.",
          relationshipToPayer:
            "self",
          emailRequired:
            true,
        },
        {
          key:
            `${line.product.id}:${purchaseIndex}:adult:2`,
          beneficiaryType:
            "adult",
          isPrimary:
            false,
          title:
            `Adult 2${purchaseSuffix}`,
          description:
            "Second adult covered by the couples membership.",
          relationshipToPayer:
            "partner",
          emailRequired:
            true,
        }
      );
    }

    if (
      mode === "child"
    ) {
      specs.push({
        key:
          `${line.product.id}:${purchaseIndex}:child:1`,
        beneficiaryType:
          "child",
        isPrimary:
          true,
        title:
          `Child${purchaseSuffix}`,
        description:
          "Enter the child who will use this membership.",
        relationshipToPayer:
          "child",
        emailRequired:
          false,
      });
    }

    if (
      mode ===
      "child_plus_adult"
    ) {
      specs.push(
        {
          key:
            `${line.product.id}:${purchaseIndex}:adult:1`,
          beneficiaryType:
            "adult",
          isPrimary:
            true,
          title:
            `Adult / parent${purchaseSuffix}`,
          description:
            "This adult receives the Open Gym entitlement.",
          relationshipToPayer:
            "self",
          emailRequired:
            true,
        },
        {
          key:
            `${line.product.id}:${purchaseIndex}:child:1`,
          beneficiaryType:
            "child",
          isPrimary:
            false,
          title:
            `Child${purchaseSuffix}`,
          description:
            "This child receives the kids class entitlement.",
          relationshipToPayer:
            "child",
          emailRequired:
            false,
        }
      );
    }
  }

  return specs;
}

function getProductImage(
  product: Product
) {
  if (
    typeof product.image_url ===
      "string" &&
    product.image_url.trim()
  ) {
    return product.image_url.trim();
  }

  if (
    Array.isArray(
      product.images
    )
  ) {
    const first =
      product.images.find(
        (image) =>
          typeof image ===
            "string" &&
          image.trim()
      );

    if (first) {
      return first;
    }
  }

  return null;
}

// ============================================================
// INVENTORY
// ============================================================

function getAvailableQuantity(
  product: Product
) {
  if (
    product.track_inventory ===
    false
  ) {
    return null;
  }

  if (
    typeof product.inventory_quantity ===
      "number"
  ) {
    return product.inventory_quantity;
  }

  if (
    typeof product.stock ===
      "number"
  ) {
    return product.stock;
  }

  return null;
}

function isOutOfStock(
  product: Product
) {
  if (
    product.track_inventory ===
    false
  ) {
    return false;
  }

  const quantity =
    getAvailableQuantity(
      product
    );

  return (
    quantity !== null &&
    quantity <= 0
  );
}

function isLowStock(
  product: Product
) {
  if (
    product.track_inventory ===
    false
  ) {
    return false;
  }

  const quantity =
    getAvailableQuantity(
      product
    );

  const threshold =
    typeof product.low_stock_threshold ===
      "number"
      ? product.low_stock_threshold
      : 5;

  return (
    quantity !== null &&
    quantity > 0 &&
    quantity <= threshold
  );
}

// ============================================================
// SELLING MODELS
//
// The Store management page deliberately reuses the existing
// category + inventory schema, so the public storefront infers
// the selling model from those values.
//
// Supported models:
// - Physical product
// - Digital download
// - Digitally delivered
// - Order to collect
// - Customisable / made to order
// - Request to order / quote
// - Service
// ============================================================

function inferSellingModel(
  product: Product
): SellingModel {
  const storedModel =
    String(
      product.selling_model || ""
    )
      .trim()
      .toLowerCase();

  const validModels: SellingModel[] = [
    "physical",
    "digital_download",
    "digital_delivery",
    "collect",
    "customisable",
    "request_to_order",
    "service",
  ];

  if (
    validModels.includes(
      storedModel as SellingModel
    )
  ) {
    return storedModel as SellingModel;
  }

  // Legacy fallback for products created before selling_model
  // existed. New products should always use selling_model.
  const category =
    String(
      product.category || ""
    )
      .trim()
      .toLowerCase();

  if (
    category.includes(
      "digital download"
    ) ||
    category.includes(
      "download"
    ) ||
    category.includes(
      "template"
    ) ||
    category.includes(
      "ebook"
    )
  ) {
    return "digital_download";
  }

  if (
    category.includes(
      "digital delivery"
    ) ||
    category.includes(
      "digitally delivered"
    )
  ) {
    return "digital_delivery";
  }

  if (
    category.includes(
      "collect"
    ) ||
    category.includes(
      "collection"
    ) ||
    category.includes(
      "click and collect"
    )
  ) {
    return "collect";
  }

  if (
    category.includes(
      "custom"
    ) ||
    category.includes(
      "personalised"
    ) ||
    category.includes(
      "personalized"
    ) ||
    category.includes(
      "made to order"
    )
  ) {
    return "customisable";
  }

  if (
    category.includes(
      "request"
    ) ||
    category.includes(
      "quote"
    ) ||
    category.includes(
      "enquiry"
    )
  ) {
    return "request_to_order";
  }

  if (
    category.includes(
      "service"
    ) ||
    category.includes(
      "consult"
    ) ||
    category.includes(
      "session"
    ) ||
    category.includes(
      "booking"
    ) ||
    [
      "websites",
      "website",
      "website add-ons",
      "website add ons",
      "website maintenance",
      "branding",
      "business coaching",
      "coaching",
      "social media",
      "business support",
    ].includes(
      category
    )
  ) {
    return "service";
  }

  return product.track_inventory ===
    false
    ? "service"
    : "physical";
}

function isServiceProduct(
  product: Product
) {
  return (
    inferSellingModel(
      product
    ) ===
    "service"
  );
}

function isDigitalProduct(
  product: Product
) {
  const model =
    inferSellingModel(
      product
    );

  return (
    model ===
      "digital_download" ||
    model ===
      "digital_delivery"
  );
}

function isCollectionProduct(
  product: Product
) {
  return (
    inferSellingModel(
      product
    ) ===
    "collect"
  );
}

function isCustomisableProduct(
  product: Product
) {
  return (
    inferSellingModel(
      product
    ) ===
    "customisable"
  );
}

function isRequestToOrderProduct(
  product: Product
) {
  return (
    inferSellingModel(
      product
    ) ===
    "request_to_order"
  );
}

function requiresShipping(
  product: Product
) {
  return (
    inferSellingModel(
      product
    ) ===
    "physical"
  );
}

function getProductTypeLabel(
  product: Product
) {
  const model =
    inferSellingModel(
      product
    );

  switch (
    model
  ) {
    case "digital_download":
      return "Digital download";

    case "digital_delivery":
      return "Digital delivery";

    case "collect":
      return "Collection";

    case "customisable":
      return "Customisable";

    case "request_to_order":
      return "Request to order";

    case "service":
      return "Service";

    default:
      return "Physical product";
  }
}

function getProductActionLabel(
  product: Product
) {
  const model =
    inferSellingModel(
      product
    );

  switch (
    model
  ) {
    case "digital_download":
      return "Buy download";

    case "digital_delivery":
      return "Buy now";

    case "collect":
      return "Order to collect";

    case "customisable":
      return "Customise & order";

    case "request_to_order":
      return "Request to order";

    case "service":
      return "Add service";

    default:
      return "Add to basket";
  }
}

function getProductFulfilmentText(
  product: Product
) {
  const model =
    inferSellingModel(
      product
    );

  switch (
    model
  ) {
    case "digital_download":
      return "Digital product — no shipping required.";

    case "digital_delivery":
      return "Delivered digitally after purchase.";

    case "collect":
      return "Order online and collect from the business.";

    case "customisable":
      return "Made for you — send your custom details before ordering.";

    case "request_to_order":
      return "Send a request first. The business will confirm the details with you.";

    case "service":
      return "Service purchase — the business will confirm next steps.";

    default:
      return "Physical product — delivery or fulfilment details are confirmed at checkout.";
  }
}

// ============================================================
// PAGE
// ============================================================

export default function ShopFrontPage() {
  const params =
    useParams();

  const slug =
    typeof params?.slug ===
    "string"
      ? params.slug
      : Array.isArray(
            params?.slug
          )
        ? params.slug[0]
        : "";

  // ==========================================================
  // REQUEST MANAGEMENT
  // ==========================================================

  const requestControllerRef =
    useRef<AbortController | null>(
      null
    );

  const contactControllerRef =
    useRef<AbortController | null>(
      null
    );

  // ==========================================================
  // STORE
  // ==========================================================

  const [
    store,
    setStore,
  ] =
    useState<Storefront | null>(
      null
    );

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    productLoadWarning,
    setProductLoadWarning,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("All");

  // ==========================================================
  // UI
  // ==========================================================

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] =
    useState(false);

  const [
    contactOpen,
    setContactOpen,
  ] =
    useState(false);

  // ==========================================================
  // CONTACT
  // ==========================================================

  const [
    contactName,
    setContactName,
  ] =
    useState("");

  const [
    contactEmail,
    setContactEmail,
  ] =
    useState("");

  const [
    contactMessage,
    setContactMessage,
  ] =
    useState("");

  const [
    sendingMessage,
    setSendingMessage,
  ] =
    useState(false);

  const [
    messageSent,
    setMessageSent,
  ] =
    useState(false);

  const [
    messageError,
    setMessageError,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // CART
  // ==========================================================

  const [
    cart,
    setCart,
  ] =
    useState<
      Record<
        string,
        CartLine
      >
    >({});

  const [
    checkingOut,
    setCheckingOut,
  ] =
    useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] =
    useState<string | null>(
      null
    );

  const [
    beneficiaryDrafts,
    setBeneficiaryDrafts,
  ] =
    useState<
      Record<
        string,
        BeneficiaryDraft
      >
    >({});

  // ==========================================================
  // DISCOUNTS
  // ==========================================================

  const [
    discountCode,
    setDiscountCode,
  ] =
    useState("");

  const [
    appliedDiscountCode,
    setAppliedDiscountCode,
  ] =
    useState("");

  const [
    discountMessage,
    setDiscountMessage,
  ] =
    useState<string | null>(
      null
    );

  // ==========================================================
  // LOAD STORE
  // ==========================================================

  const loadStore =
    useCallback(
      async () => {
        if (
          !slug ||
          !slug.trim()
        ) {
          setStore(null);
          setProducts([]);

          setError(
            "No store was specified."
          );

          setLoading(false);

          return;
        }

        requestControllerRef.current?.abort();

        const controller =
          new AbortController();

        requestControllerRef.current =
          controller;

        setLoading(true);

        setError(null);

        setProductLoadWarning(
          null
        );

        const safeSlug =
          slug
            .trim()
            .toLowerCase();

        let timeoutId:
          ReturnType<
            typeof setTimeout
          > | null =
          null;

        try {
          timeoutId =
            setTimeout(
              () => {
                controller.abort();
              },
              STOREFRONT_REQUEST_TIMEOUT_MS
            );

          const response =
            await fetch(
              `/api/storefront/${encodeURIComponent(
                safeSlug
              )}?t=${Date.now()}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

                cache:
                  "no-store",

                signal:
                  controller.signal,
              }
            );

          const contentType =
            response.headers.get(
              "content-type"
            );

          let data:
            StorefrontApiResponse | null =
            null;

          if (
            contentType?.includes(
              "application/json"
            )
          ) {
            data =
              (await response.json()) as StorefrontApiResponse;
          } else {
            const text =
              await response.text();

            console.error(
              "[TOTS STORE] API returned a non-JSON response:",
              text.slice(
                0,
                500
              )
            );

            throw new Error(
              "The store server returned an unexpected response."
            );
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data?.error ||
                "The store could not be loaded."
            );
          }

          if (
            !data?.store
          ) {
            throw new Error(
              "This store could not be found."
            );
          }

          const incomingProducts =
            Array.isArray(
              data.products
            )
              ? data.products
              : [];

          const cleanedProducts =
            incomingProducts
              .filter(
                (product) =>
                  Boolean(
                    product?.id
                  )
              )
              .filter(
                (product) =>
                  typeof product.name ===
                    "string" &&
                  Boolean(
                    product.name.trim()
                  )
              )
              .filter(
                (product) =>
                  product.is_active !==
                  false
              )
              .filter(
                (product) =>
                  !product.status ||
                  product.status ===
                    "active"
              )
              .sort(
                (
                  first,
                  second
                ) => {
                  const firstFeatured =
                    first.featured ===
                    true
                      ? 1
                      : 0;

                  const secondFeatured =
                    second.featured ===
                    true
                      ? 1
                      : 0;

                  if (
                    firstFeatured !==
                    secondFeatured
                  ) {
                    return (
                      secondFeatured -
                      firstFeatured
                    );
                  }

                  const firstOrder =
                    typeof first.sort_order ===
                    "number"
                      ? first.sort_order
                      : 999999;

                  const secondOrder =
                    typeof second.sort_order ===
                    "number"
                      ? second.sort_order
                      : 999999;

                  if (
                    firstOrder !==
                    secondOrder
                  ) {
                    return (
                      firstOrder -
                      secondOrder
                    );
                  }

                  return first.name.localeCompare(
                    second.name
                  );
                }
              );

          setStore(
            data.store
          );

          setProducts(
            cleanedProducts
          );

          setProductLoadWarning(
            typeof data.productLoadWarning ===
              "string"
              ? data.productLoadWarning
              : null
          );

          setError(null);
        } catch (
          loadError: unknown
        ) {
          if (
            controller.signal.aborted
          ) {
            if (
              requestControllerRef.current !==
              controller
            ) {
              return;
            }

            setStore(null);

            setProducts([]);

            setError(
              "The store is taking longer than expected. Please try again."
            );

            return;
          }

          console.error(
            "[TOTS STORE] Storefront request failed:",
            loadError
          );

          setStore(null);

          setProducts([]);

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "We couldn't load this store right now."
          );
        } finally {
          if (
            timeoutId
          ) {
            clearTimeout(
              timeoutId
            );
          }

          if (
            requestControllerRef.current ===
            controller
          ) {
            setLoading(false);
          }
        }
      },
      [
        slug,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      void loadStore();

      return () => {
        requestControllerRef.current?.abort();

        contactControllerRef.current?.abort();
      };
    },
    [
      loadStore,
    ]
  );

  // ==========================================================
  // CONTACT
  // ==========================================================

  async function sendContactMessage() {
    if (
      sendingMessage ||
      !store
    ) {
      return;
    }

    const name =
      contactName.trim();

    const email =
      contactEmail.trim();

    const message =
      contactMessage.trim();

    if (
      !name
    ) {
      setMessageError(
        "Please enter your name."
      );

      return;
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setMessageError(
        "Please enter a valid email address."
      );

      return;
    }

    if (
      !message
    ) {
      setMessageError(
        "Please enter a message."
      );

      return;
    }

    contactControllerRef.current?.abort();

    const controller =
      new AbortController();

    contactControllerRef.current =
      controller;

    setSendingMessage(true);

    setMessageError(null);

    setMessageSent(false);

    const timeoutId =
      setTimeout(
        () => {
          controller.abort();
        },
        CONTACT_REQUEST_TIMEOUT_MS
      );

    try {
      const response =
        await fetch(
          "/api/store-contact",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache:
              "no-store",

            signal:
              controller.signal,

            body:
              JSON.stringify({
                organisationId:
                  store.organisation_id,

                storeId:
                  store.id,

                storeSlug:
                  store.slug,

                storeName:
                  store.store_name,

                name,
                email,
                message,

                source:
                  "storefront",
              }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        );

      let data:
        ContactApiResponse | null =
        null;

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        data =
          (await response.json()) as ContactApiResponse;
      } else {
        const text =
          await response.text();

        console.error(
          "[TOTS STORE] Contact endpoint returned non-JSON:",
          text.slice(
            0,
            500
          )
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Your message could not be sent."
        );
      }

      setMessageSent(true);

      setContactName("");

      setContactEmail("");

      setContactMessage("");
    } catch (
      sendError: unknown
    ) {
      if (
        controller.signal.aborted
      ) {
        setMessageError(
          "Sending took too long. Please try again."
        );
      } else {
        setMessageError(
          sendError instanceof
            Error
            ? sendError.message
            : "Your message could not be sent."
        );
      }
    } finally {
      clearTimeout(
        timeoutId
      );

      if (
        contactControllerRef.current ===
        controller
      ) {
        setSendingMessage(false);
      }
    }
  }

  function openContactDrawer() {
    setMessageSent(false);

    setMessageError(null);

    setContactOpen(true);
  }

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories =
    useMemo(
      () => [
        "All",

        ...Array.from(
          new Set(
            products
              .map(
                (product) =>
                  product.category?.trim()
              )
              .filter(
                (
                  value
                ):
                  value is string =>
                    Boolean(
                      value
                    )
              )
          )
        ).sort(
          (
            first,
            second
          ) =>
            first.localeCompare(
              second
            )
        ),
      ],
      [
        products,
      ]
    );

  // ==========================================================
  // VISIBLE PRODUCTS
  // ==========================================================

  const visibleProducts =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (product) => {
            if (
              category !==
                "All" &&
              product.category !==
                category
            ) {
              return false;
            }

            if (
              !query
            ) {
              return true;
            }

            return [
              product.name,
              product.description,
              product.category,
              product.sku,
            ]
              .filter(
                Boolean
              )
              .some(
                (value) =>
                  String(
                    value
                  )
                    .toLowerCase()
                    .includes(
                      query
                    )
              );
          }
        );
      },
      [
        products,
        search,
        category,
      ]
    );

  // ==========================================================
  // FEATURED
  // ==========================================================

  const featuredProducts =
    useMemo(
      () => {
        const explicit =
          products.filter(
            (product) =>
              product.featured ===
              true
          );

        return (
          explicit.length
            ? explicit
            : products
        ).slice(
          0,
          3
        );
      },
      [
        products,
      ]
    );

  // ==========================================================
  // CART
  // ==========================================================

  const cartLines =
    useMemo(
      () =>
        Object.values(
          cart
        ),
      [
        cart,
      ]
    );

  const cartCount =
    useMemo(
      () =>
        cartLines.reduce(
          (
            total,
            line
          ) =>
            total +
            line.quantity,
          0
        ),
      [
        cartLines,
      ]
    );

  const cartTotal =
    useMemo(
      () =>
        cartLines.reduce(
          (
            total,
            line
          ) =>
            total +
            Number(
              line.product.price ||
                0
            ) *
              line.quantity,
          0
        ),
      [
        cartLines,
      ]
    );

  const cartContainsPhysicalProduct =
    useMemo(
      () =>
        cartLines.some(
          (
            line
          ) =>
            requiresShipping(
              line.product
            )
        ),
      [
        cartLines,
      ]
    );

  const cartContainsCollectionProduct =
    useMemo(
      () =>
        cartLines.some(
          (
            line
          ) =>
            isCollectionProduct(
              line.product
            )
        ),
      [
        cartLines,
      ]
    );

  const cartContainsDigitalProduct =
    useMemo(
      () =>
        cartLines.some(
          (
            line
          ) =>
            isDigitalProduct(
              line.product
            )
        ),
      [
        cartLines,
      ]
    );

  const cartContainsServiceProduct =
    useMemo(
      () =>
        cartLines.some(
          (
            line
          ) =>
            isServiceProduct(
              line.product
            )
        ),
      [
        cartLines,
      ]
    );

  const membershipLines =
    useMemo(
      () =>
        cartLines.filter(
          (
            line
          ) =>
            isMembershipProduct(
              line.product
            )
        ),
      [
        cartLines,
      ]
    );

  const requiredBeneficiarySpecs =
    useMemo(
      () =>
        membershipLines.flatMap(
          (
            line
          ) =>
            getBeneficiarySpecs(
              line
            ).map(
              (
                spec
              ) => ({
                ...spec,
                productId:
                  line.product.id,
                productName:
                  line.product.name,
                planCode:
                  String(
                    line.product
                      .external_plan_code ||
                      ""
                  ).trim(),
              })
            )
        ),
      [
        membershipLines,
      ]
    );

  // ==========================================================
  // CART ACTIONS
  // ==========================================================

  function addToCart(
    product: Product
  ) {
    if (
      isOutOfStock(
        product
      )
    ) {
      return;
    }

    setCheckoutError(null);

    setCart(
      (previous) => {
        const existing =
          previous[
            product.id
          ];

        let nextQuantity =
          existing
            ? existing.quantity +
              1
            : 1;

        const available =
          getAvailableQuantity(
            product
          );

        if (
          available !==
          null
        ) {
          nextQuantity =
            Math.min(
              nextQuantity,
              Math.max(
                available,
                0
              )
            );
        }

        if (
          nextQuantity <=
          0
        ) {
          return previous;
        }

        return {
          ...previous,

          [product.id]: {
            product,

            quantity:
              nextQuantity,
          },
        };
      }
    );

    setCartOpen(true);
  }

  function requestProduct(
    product: Product
  ) {
    setCartOpen(false);

    setMessageSent(false);
    setMessageError(null);

    const model =
      inferSellingModel(
        product
      );

    const intro =
      model ===
      "customisable"
        ? `Hi, I'd like to customise and order "${product.name}". My customisation details are: `
        : model ===
            "request_to_order"
          ? `Hi, I'd like to request to order "${product.name}". Please can you let me know the next steps?`
          : `Hi, I'm interested in "${product.name}". Please can you send me more information?`;

    setContactMessage(
      intro
    );

    setContactOpen(true);
  }

  function setQuantity(
    productId: string,
    quantity: number
  ) {
    setCheckoutError(null);

    setCart(
      (previous) => {
        if (
          quantity <=
          0
        ) {
          const next = {
            ...previous,
          };

          delete next[
            productId
          ];

          return next;
        }

        const existing =
          previous[
            productId
          ];

        if (
          !existing
        ) {
          return previous;
        }

        let safeQuantity =
          quantity;

        const available =
          getAvailableQuantity(
            existing.product
          );

        if (
          available !==
          null
        ) {
          safeQuantity =
            Math.min(
              safeQuantity,
              Math.max(
                available,
                0
              )
            );
        }

        return {
          ...previous,

          [productId]: {
            ...existing,

            quantity:
              safeQuantity,
          },
        };
      }
    );
  }

  function removeFromCart(
    productId: string
  ) {
    setCheckoutError(null);

    setCart(
      (previous) => {
        const next = {
          ...previous,
        };

        delete next[
          productId
        ];

        return next;
      }
    );
  }

  // ==========================================================
  // MEMBERSHIP BENEFICIARIES
  // ==========================================================

  function updateBeneficiaryDraft(
    spec: BeneficiarySpec & {
      productId: string;
    },
    field:
      | "firstName"
      | "lastName"
      | "email"
      | "phone",
    value: string
  ) {
    setCheckoutError(
      null
    );

    setBeneficiaryDrafts(
      (
        previous
      ) => {
        const existing =
          previous[
            spec.key
          ];

        const base:
          BeneficiaryDraft =
          existing || {
            productId:
              spec.productId,
            slotKey:
              spec.key,
            beneficiaryType:
              spec.beneficiaryType,
            isPrimary:
              spec.isPrimary,
            firstName:
              "",
            lastName:
              "",
            email:
              "",
            phone:
              "",
            relationshipToPayer:
              spec.relationshipToPayer,
          };

        return {
          ...previous,

          [spec.key]: {
            ...base,
            [field]:
              value,
          },
        };
      }
    );
  }

  function buildCheckoutBeneficiaries() {
    const payload:
      Array<{
        productId: string;
        slotKey: string;
        beneficiaryType: BeneficiaryType;
        isPrimary: boolean;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        relationshipToPayer: string | null;
      }> = [];

    for (
      const spec of
      requiredBeneficiarySpecs
    ) {
      const draft =
        beneficiaryDrafts[
          spec.key
        ];

      const firstName =
        String(
          draft?.firstName ||
            ""
        ).trim();

      const lastName =
        String(
          draft?.lastName ||
            ""
        ).trim();

      const email =
        String(
          draft?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const phone =
        String(
          draft?.phone ||
            ""
        ).trim();

      if (
        !firstName ||
        !lastName
      ) {
        throw new Error(
          `Enter the first and last name for ${spec.title} on ${spec.productName}.`
        );
      }

      if (
        spec.emailRequired &&
        !email
      ) {
        throw new Error(
          `Enter an email address for ${spec.title} on ${spec.productName}.`
        );
      }

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        throw new Error(
          `Enter a valid email address for ${spec.title} on ${spec.productName}.`
        );
      }

      payload.push({
        productId:
          spec.productId,

        slotKey:
          spec.key,

        beneficiaryType:
          spec.beneficiaryType,

        isPrimary:
          spec.isPrimary,

        firstName,

        lastName,

        email:
          email ||
          null,

        phone:
          phone ||
          null,

        relationshipToPayer:
          spec.relationshipToPayer ||
          null,
      });
    }

    return payload;
  }

  // ==========================================================
  // DISCOUNT
  // ==========================================================

  function applyDiscountCode() {
    const code =
      normaliseDiscountCode(
        discountCode
      );

    setCheckoutError(null);

    setDiscountMessage(null);

    if (
      !code
    ) {
      setAppliedDiscountCode("");

      setDiscountMessage(
        "Enter a discount code first."
      );

      return;
    }

    setDiscountCode(code);

    setAppliedDiscountCode(
      code
    );

    setDiscountMessage(
      "We'll verify this code securely when you continue."
    );
  }

  function removeDiscountCode() {
    setDiscountCode("");

    setAppliedDiscountCode("");

    setDiscountMessage(null);

    setCheckoutError(null);
  }

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  async function startCheckout() {
    if (
      checkingOut ||
      !store ||
      cartLines.length ===
        0
    ) {
      return;
    }

    setCheckingOut(true);

    setCheckoutError(null);

    try {
      const items =
        cartLines.map(
          (
            line
          ) => ({
            productId:
              line.product.id,

            quantity:
              line.quantity,
          })
        );

      const resolvedDiscountCode =
        normaliseDiscountCode(
          discountCode ||
            appliedDiscountCode
        );

      const beneficiaries =
        buildCheckoutBeneficiaries();

      const response =
        await fetch(
          "/api/store-checkout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify({
                storeSlug:
                  store.slug,

                items,

                discountCode:
                  resolvedDiscountCode ||
                  undefined,

                beneficiaries:
                  beneficiaries.length >
                  0
                    ? beneficiaries
                    : undefined,
              }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        );

      let data:
        CheckoutApiResponse | null =
        null;

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        data =
          (await response.json()) as CheckoutApiResponse;
      } else {
        const text =
          await response.text();

        console.error(
          "[TOTS STORE] Checkout returned non-JSON:",
          text.slice(
            0,
            500
          )
        );

        throw new Error(
          "Checkout returned an unexpected response."
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Checkout could not be started."
        );
      }

      const checkoutUrl =
        data?.url ||
        data?.checkoutUrl ||
        data?.sessionUrl;

      if (
        !checkoutUrl
      ) {
        throw new Error(
          "Stripe checkout was created, but no checkout URL was returned."
        );
      }

      window.location.href =
        checkoutUrl;
    } catch (
      checkoutFailure: unknown
    ) {
      console.error(
        "[TOTS STORE] Checkout failed:",
        checkoutFailure
      );

      setCheckoutError(
        checkoutFailure instanceof
          Error
          ? checkoutFailure.message
          : "Checkout could not be started."
      );
    } finally {
      setCheckingOut(false);
    }
  }

  // ==========================================================
  // BRAND
  // ==========================================================

  const primary =
    normaliseColour(
      store?.accent_colour,
      "#a9b897"
    );

  const secondary =
    `${primary}12`;

  const strongerSecondary =
    `${primary}20`;

  const storeName =
    store?.store_name ||
    store?.company_name ||
    "Online Store";

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Loader2
              className="animate-spin text-stone-400"
              size={22}
            />
          </div>

          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
            Opening store
          </p>

          <p className="mt-2 text-xs text-stone-400">
            Getting everything ready for you.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    !store ||
    error
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <Store
              size={22}
            />
          </div>

          <h1 className="mt-6 font-serif text-4xl italic text-stone-900">
            We couldn&apos;t open this store.
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-500">
            {error ||
              "This store could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadStore()
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
          >
            Try again

            <ArrowRight
              size={13}
            />
          </button>
        </div>

        <StorefrontGlobalStyles />
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div
      className="min-h-screen bg-[#f8f7f3] text-stone-900"
      style={
        {
          "--brand":
            primary,
        } as CSSProperties
      }
    >
      {/* =====================================================
          ANNOUNCEMENT
      ===================================================== */}

      <div
        className="px-4 py-2.5 text-center text-[8px] font-black uppercase tracking-[0.2em] text-white"
        style={{
          background:
            primary,
        }}
      >
        {store.announcement ||
          "Shop securely with us online"}
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f8f7f3]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white lg:hidden"
          >
            <Menu
              size={16}
            />
          </button>

          <a
            href="#top"
            className="flex min-w-0 items-center gap-3 no-underline"
          >
            {store.logo_url ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white">
                <img
                  src={
                    store.logo_url
                  }
                  alt={`${storeName} logo`}
                  className="h-full w-full object-contain p-1"
                />
              </div>
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    primary,
                }}
              >
                <Store
                  size={17}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-[-0.01em] text-stone-900">
                {
                  storeName
                }
              </p>

              <p className="mt-0.5 hidden text-[9px] text-stone-400 sm:block">
                Online store
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#shop"
              className="text-xs font-semibold text-stone-500 no-underline transition hover:text-stone-900"
            >
              Shop
            </a>

            {featuredProducts.length >
              0 && (
              <a
                href="#featured"
                className="text-xs font-semibold text-stone-500 no-underline transition hover:text-stone-900"
              >
                Featured
              </a>
            )}

            <a
              href="#about"
              className="text-xs font-semibold text-stone-500 no-underline transition hover:text-stone-900"
            >
              About
            </a>

            <button
              type="button"
              onClick={
                openContactDrawer
              }
              className="text-xs font-semibold text-stone-500 transition hover:text-stone-900"
            >
              Contact
            </button>
          </nav>

          <button
            type="button"
            aria-label={`Open basket with ${cartCount} items`}
            onClick={() =>
              setCartOpen(
                true
              )
            }
            className="relative flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-bold text-stone-700 shadow-sm transition hover:border-stone-300 hover:shadow-md"
          >
            <ShoppingBag
              size={15}
            />

            <span className="hidden sm:inline">
              Basket
            </span>

            {cartCount >
              0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[8px] font-black text-white"
                style={{
                  background:
                    primary,
                }}
              >
                {
                  cartCount
                }
              </span>
            )}
          </button>
        </div>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-stone-950/40 backdrop-blur-sm lg:hidden">

          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
          />

          <aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-stone-900">
                {
                  storeName
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="mt-8 space-y-2">

              <MobileMenuLink
                href="#shop"
                label="Shop everything"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
              />

              {featuredProducts.length >
                0 && (
                <MobileMenuLink
                  href="#featured"
                  label="Featured"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                />
              )}

              <MobileMenuLink
                href="#about"
                label="About us"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
              />

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(
                    false
                  );

                  openContactDrawer();
                }}
                className="mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm font-bold text-white"
                style={{
                  background:
                    primary,
                }}
              >
                Get in touch

                <MessageCircle
                  size={15}
                />
              </button>
            </div>

          </aside>
        </div>
      )}

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="top"
        className="px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-7"
      >
        <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_16px_50px_rgba(28,25,23,0.04)] lg:rounded-[2.5rem]">

          <div className="grid lg:grid-cols-[1.08fr_.92fr]">

            <div className="flex min-h-[490px] items-center p-7 sm:p-10 lg:p-14 xl:p-16">

              <div className="max-w-2xl">

                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-[0.18em]"
                  style={{
                    background:
                      strongerSecondary,

                    color:
                      primary,
                  }}
                >
                  <Sparkles
                    size={11}
                  />

                  Welcome to{" "}
                  {
                    storeName
                  }
                </div>

                <h1 className="mt-6 max-w-[720px] font-serif text-[3.4rem] italic leading-[0.92] tracking-[-0.035em] text-stone-900 sm:text-6xl lg:text-[4.5rem]">
                  {store.hero_title ||
                    `Everything you need, all in one place.`}
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-7 text-stone-500 sm:text-[15px]">
                  {store.hero_text ||
                    store.store_description ||
                    `Explore products and services from ${storeName}.`}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">

                  <a
                    href="#shop"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    Shop now

                    <ArrowRight
                      size={13}
                    />
                  </a>

                  <button
                    type="button"
                    onClick={
                      openContactDrawer
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    Ask a question
                  </button>

                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-stone-100 pt-6">

                  <TrustItem
                    icon={
                      <ShieldCheck
                        size={13}
                      />
                    }
                    text="Secure payment"
                    primary={
                      primary
                    }
                  />

                  <TrustItem
                    icon={
                      <MessageCircle
                        size={13}
                      />
                    }
                    text="Direct support"
                    primary={
                      primary
                    }
                  />

                  <TrustItem
                    icon={
                      <ShoppingBag
                        size={13}
                      />
                    }
                    text="Independent business"
                    primary={
                      primary
                    }
                  />

                </div>
              </div>
            </div>

            <div
              className="relative min-h-[340px] overflow-hidden lg:min-h-[520px]"
              style={{
                background:
                  secondary,
              }}
            >
              <div
                className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{
                  background:
                    primary,
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center p-7 sm:p-10 lg:p-12">

                {featuredProducts[0] &&
                getProductImage(
                  featuredProducts[0]
                ) ? (
                  <div className="relative w-full max-w-[390px]">

                    <div className="absolute -left-6 top-10 h-[82%] w-full rotate-[-4deg] rounded-[2rem] bg-white/55" />

                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(28,25,23,0.16)]">

                      <img
                        src={
                          getProductImage(
                            featuredProducts[0]
                          )!
                        }
                        alt={
                          featuredProducts[0]
                            .name
                        }
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">

                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
                          Featured
                        </p>

                        <div className="mt-1 flex items-end justify-between gap-3">

                          <p className="line-clamp-1 text-sm font-bold text-stone-800">
                            {
                              featuredProducts[0]
                                .name
                            }
                          </p>

                          <p className="shrink-0 font-serif text-xl italic">
                            {formatCurrency(
                              featuredProducts[0]
                                .price
                            )}
                          </p>

                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">

                    <div
                      className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] text-white shadow-xl"
                      style={{
                        background:
                          primary,
                      }}
                    >
                      {store.logo_url ? (
                        <img
                          src={
                            store.logo_url
                          }
                          alt={`${storeName} logo`}
                          className="h-20 w-20 object-contain"
                        />
                      ) : (
                        <ShoppingBag
                          size={38}
                        />
                      )}
                    </div>

                    <p className="mt-5 text-sm font-bold text-stone-700">
                      {
                        storeName
                      }
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORY BAR
      ===================================================== */}

      {categories.length >
        1 && (
        <section className="px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-[1360px]">

            <div className="no-scrollbar flex gap-2 overflow-x-auto py-3">

              {categories.map(
                (
                  item
                ) => (
                  <button
                    type="button"
                    key={
                      item
                    }
                    onClick={() => {
                      setCategory(
                        item
                      );

                      document
                        .getElementById(
                          "shop"
                        )
                        ?.scrollIntoView({
                          behavior:
                            "smooth",
                        });
                    }}
                    className="shrink-0 rounded-full border px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] transition"
                    style={
                      category ===
                      item
                        ? {
                            borderColor:
                              primary,

                            background:
                              primary,

                            color:
                              "#ffffff",
                          }
                        : {
                            borderColor:
                              "#e7e5e4",

                            background:
                              "#ffffff",

                            color:
                              "#78716c",
                          }
                    }
                  >
                    {
                      item
                    }
                  </button>
                )
              )}

            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FEATURED
      ===================================================== */}

      {featuredProducts.length >
        0 && (
        <section
          id="featured"
          className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-[1360px]">

            <SectionHeading
              eyebrow="Popular right now"
              title="Featured picks."
              description={`A few popular choices from ${storeName}.`}
              primary={
                primary
              }
            />

            <div className="mt-8 grid gap-5 lg:grid-cols-3">

              {featuredProducts.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    primary={
                      primary
                    }
                    onAdd={() =>
                      addToCart(
                        product
                      )
                    }
                    onRequest={() =>
                      requestProduct(
                        product
                      )
                    }
                    featuredLayout
                  />
                )
              )}

            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          SHOP
      ===================================================== */}

      <section
        id="shop"
        className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="mx-auto max-w-[1360px]">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">

            <SectionHeading
              eyebrow="Browse the store"
              title="Find what you need."
              description="Browse everything available, or use the filters to narrow things down."
              primary={
                primary
              }
            />

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">

              <div className="relative flex-1 lg:w-[300px]">

                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search products..."
                  className="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-11 pr-4 text-xs text-stone-700 outline-none transition focus:border-stone-400 focus:shadow-sm"
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearch(
                        ""
                      )
                    }
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-stone-100 text-stone-400"
                  >
                    <X
                      size={11}
                    />
                  </button>
                )}

              </div>

              {categories.length >
                1 && (
                <div className="relative">

                  <select
                    value={
                      category
                    }
                    onChange={(
                      event
                    ) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    className="h-12 w-full appearance-none rounded-2xl border border-stone-200 bg-white pl-4 pr-10 text-xs font-semibold text-stone-600 outline-none sm:w-52"
                  >
                    {categories.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {
                            item
                          }
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                  />

                </div>
              )}

            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-b border-stone-200 pb-4">

            <p className="text-xs text-stone-400">
              <strong className="font-bold text-stone-700">
                {
                  visibleProducts.length
                }
              </strong>{" "}
              {visibleProducts.length ===
              1
                ? "result"
                : "results"}
            </p>

            {(search ||
              category !==
                "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");

                  setCategory(
                    "All"
                  );
                }}
                className="text-[9px] font-black uppercase tracking-[0.12em] text-stone-500"
              >
                Reset filters
              </button>
            )}

          </div>

          {productLoadWarning && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">

              <p className="text-xs font-semibold text-amber-700">
                {
                  productLoadWarning
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadStore()
                }
                className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700 underline"
              >
                Try again
              </button>

            </div>
          )}

          {visibleProducts.length >
          0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {visibleProducts.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    primary={
                      primary
                    }
                    onAdd={() =>
                      addToCart(
                        product
                      )
                    }
                    onRequest={() =>
                      requestProduct(
                        product
                      )
                    }
                  />
                )
              )}

            </div>
          ) : products.length ===
            0 ? (
            <EmptyState
              icon={
                <Package
                  size={26}
                />
              }
              title="Nothing here yet."
              description="New products and services will appear here when they're published."
            />
          ) : (
            <EmptyState
              icon={
                <Search
                  size={26}
                />
              }
              title="No matches found."
              description="Try another search term or clear your filters."
            />
          )}

        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white">

          <div className="grid lg:grid-cols-[1.1fr_.9fr]">

            <div className="p-8 sm:p-10 lg:p-14">

              <p
                className="text-[8px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                About us
              </p>

              <h2 className="mt-4 max-w-xl font-serif text-4xl italic tracking-[-0.02em] text-stone-900 sm:text-5xl">
                The people behind{" "}
                {
                  storeName
                }.
              </h2>

              <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-7 text-stone-500">
                {store.store_description ||
                  `Welcome to ${storeName}. We're an independent business creating products and services designed to make things easier for our customers.`}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">

                {store.website_url && (
                  <a
                    href={
                      store.website_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-stone-600 no-underline transition hover:bg-stone-50"
                  >
                    Visit website

                    <ExternalLink
                      size={12}
                    />
                  </a>
                )}

                <button
                  type="button"
                  onClick={
                    openContactDrawer
                  }
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-white"
                  style={{
                    background:
                      primary,
                  }}
                >
                  Contact us

                  <MessageCircle
                    size={12}
                  />
                </button>

              </div>
            </div>

            <div
              className="flex min-h-[300px] items-center justify-center p-10"
              style={{
                background:
                  secondary,
              }}
            >

              <div className="text-center">

                {store.logo_url ? (
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white p-4 shadow-sm">
                    <img
                      src={
                        store.logo_url
                      }
                      alt={`${storeName} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] text-white"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    <Store
                      size={30}
                    />
                  </div>
                )}

                <p className="mt-5 text-base font-bold text-stone-700">
                  {
                    storeName
                  }
                </p>

                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.17em] text-stone-400">
                  Independent business
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT CTA
      ===================================================== */}

      <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[2rem] bg-stone-900 p-8 text-white sm:p-10 lg:p-14">

          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">

            <div>

              <p
                className="text-[8px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                Need some help?
              </p>

              <h2 className="mt-4 max-w-2xl font-serif text-4xl italic tracking-[-0.02em] sm:text-5xl">
                Not sure what to choose?
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-400">
                Send us a message before you order and we&apos;ll help point you in the right direction.
              </p>

              <button
                type="button"
                onClick={
                  openContactDrawer
                }
                className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                style={{
                  background:
                    primary,
                }}
              >
                Talk to us

                <ArrowRight
                  size={13}
                />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:w-[440px]">

              {store.email && (
                <ContactItem
                  href={`mailto:${store.email}`}
                  icon={
                    <Mail
                      size={15}
                    />
                  }
                  label={
                    store.email
                  }
                  primary={
                    primary
                  }
                />
              )}

              {store.phone && (
                <ContactItem
                  href={`tel:${store.phone}`}
                  icon={
                    <Phone
                      size={15}
                    />
                  }
                  label={
                    store.phone
                  }
                  primary={
                    primary
                  }
                />
              )}

              {store.address && (
                <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4">
                  <MapPin
                    size={15}
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <span className="text-xs text-stone-300">
                    {
                      store.address
                    }
                  </span>
                </div>
              )}

              {store.instagram_url && (
                <ContactItem
                  href={
                    store.instagram_url
                  }
                  external
                  icon={
                    <Instagram
                      size={15}
                    />
                  }
                  label="Instagram"
                  primary={
                    primary
                  }
                />
              )}

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-[1360px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            {store.logo_url ? (
              <img
                src={
                  store.logo_url
                }
                alt={`${storeName} logo`}
                className="h-9 w-9 rounded-xl object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    primary,
                }}
              >
                <Store
                  size={14}
                />
              </div>
            )}

            <div>

              <p className="text-xs font-bold text-stone-700">
                {
                  storeName
                }
              </p>

              <p className="mt-0.5 text-[8px] text-stone-400">
                ©{" "}
                {new Date().getFullYear()}{" "}
                {
                  storeName
                }
              </p>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[8px] text-stone-400">

            <span className="flex items-center gap-1.5">
              <LockKeyhole
                size={10}
              />

              Secure checkout
            </span>

            <span className="flex items-center gap-1.5">
              <Sparkles
                size={10}
                style={{
                  color:
                    primary,
                }}
              />

              Powered by TOTS-OS
            </span>

          </div>

        </div>
      </footer>

      {/* =====================================================
          FLOATING CONTACT
      ===================================================== */}

      {!contactOpen &&
        !cartOpen && (
        <button
          type="button"
          onClick={
            openContactDrawer
          }
          className="fixed bottom-5 right-5 z-[80] flex h-12 items-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_45px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5"
          style={{
            background:
              primary,
          }}
        >
          <MessageCircle
            size={15}
          />

          <span className="hidden sm:inline">
            Need help?
          </span>
        </button>
      )}

      {/* =====================================================
          CONTACT DRAWER
      ===================================================== */}

      {contactOpen && (
        <div className="fixed inset-0 z-[170] bg-stone-950/40 backdrop-blur-sm">

          <button
            type="button"
            aria-label="Close contact panel"
            className="absolute inset-0"
            onClick={() => {
              if (
                !sendingMessage
              ) {
                setContactOpen(
                  false
                );
              }
            }}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">

            <div
              className="border-b border-stone-100 px-6 pb-7 pt-7"
              style={{
                background:
                  secondary,
              }}
            >

              <div className="flex items-start justify-between gap-5">

                <div>

                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    <MessageCircle
                      size={19}
                    />
                  </div>

                  <p
                    className="mt-5 text-[8px] font-black uppercase tracking-[0.2em]"
                    style={{
                      color:
                        primary,
                    }}
                  >
                    Contact{" "}
                    {
                      storeName
                    }
                  </p>

                  <h2 className="mt-2 font-serif text-4xl italic leading-none text-stone-900">
                    How can we help?
                  </h2>

                  <p className="mt-3 max-w-sm text-xs leading-6 text-stone-500">
                    Send us a message and we&apos;ll get back to you as soon as we can.
                  </p>

                </div>

                <button
                  type="button"
                  disabled={
                    sendingMessage
                  }
                  onClick={() =>
                    setContactOpen(
                      false
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-stone-500 shadow-sm disabled:opacity-50"
                >
                  <X
                    size={15}
                  />
                </button>

              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {messageSent ? (
                <div className="flex min-h-[430px] flex-col items-center justify-center text-center">

                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    <Check
                      size={25}
                    />
                  </div>

                  <h3 className="mt-6 font-serif text-4xl italic text-stone-900">
                    Message sent.
                  </h3>

                  <p className="mt-3 max-w-xs text-sm leading-6 text-stone-500">
                    Thanks for getting in touch. We&apos;ll get back to you as soon as possible.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageSent(
                        false
                      );

                      setContactOpen(
                        false
                      );
                    }}
                    className="mt-7 rounded-full px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    Done
                  </button>

                </div>
              ) : (
                <div className="space-y-5">

                  <StoreInput
                    label="Your name"
                    id="store-contact-name"
                    value={
                      contactName
                    }
                    onChange={
                      setContactName
                    }
                    placeholder="Your name"
                    autoComplete="name"
                  />

                  <StoreInput
                    label="Email address"
                    id="store-contact-email"
                    type="email"
                    value={
                      contactEmail
                    }
                    onChange={
                      setContactEmail
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                  />

                  <div>

                    <label
                      htmlFor="store-contact-message"
                      className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
                    >
                      How can we help?
                    </label>

                    <textarea
                      id="store-contact-message"
                      value={
                        contactMessage
                      }
                      onChange={(
                        event
                      ) =>
                        setContactMessage(
                          event.target.value
                        )
                      }
                      placeholder="Tell us what you'd like to know..."
                      rows={7}
                      className="store-contact-input resize-none"
                    />

                  </div>

                  {messageError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">

                      <p className="text-xs leading-5 text-red-600">
                        {
                          messageError
                        }
                      </p>

                    </div>
                  )}

                  <button
                    type="button"
                    disabled={
                      sendingMessage
                    }
                    onClick={() =>
                      void sendContactMessage()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />

                        Sending...
                      </>
                    ) : (
                      <>
                        <Send
                          size={14}
                        />

                        Send message
                      </>
                    )}
                  </button>

                  <div className="rounded-2xl bg-stone-50 p-4">

                    <div className="flex items-start gap-3">

                      <ShieldCheck
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            primary,
                        }}
                      />

                      <p className="text-[10px] leading-5 text-stone-400">
                        Your message goes directly to{" "}
                        <strong className="font-semibold text-stone-600">
                          {
                            storeName
                          }
                        </strong>
                        .
                      </p>

                    </div>
                  </div>

                  {store.email && (
                    <p className="text-center text-[9px] leading-5 text-stone-400">
                      Prefer email?{" "}

                      <a
                        href={`mailto:${store.email}`}
                        className="font-semibold underline"
                        style={{
                          color:
                            primary,
                        }}
                      >
                        {
                          store.email
                        }
                      </a>
                    </p>
                  )}

                </div>
              )}

            </div>
          </aside>
        </div>
      )}

      {/* =====================================================
          CART DRAWER
      ===================================================== */}

      {cartOpen && (
        <div className="fixed inset-0 z-[160] bg-stone-950/40 backdrop-blur-sm">

          <button
            type="button"
            aria-label="Close basket"
            className="absolute inset-0"
            onClick={() => {
              if (
                !checkingOut
              ) {
                setCartOpen(
                  false
                );
              }
            }}
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">

            {/* HEADER */}

            <div className="border-b border-stone-100 px-5 py-5 sm:px-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                    Your basket
                  </p>

                  <div className="mt-1 flex items-baseline gap-2">

                    <h3 className="font-serif text-3xl italic">
                      {
                        cartCount
                      }{" "}
                      {cartCount ===
                      1
                        ? "item"
                        : "items"}
                    </h3>

                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    checkingOut
                  }
                  onClick={() =>
                    setCartOpen(
                      false
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 disabled:opacity-50"
                >
                  <X
                    size={16}
                  />
                </button>

              </div>
            </div>

            {/* ITEMS */}

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">

              {cartLines.length ===
              0 ? (
                <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                    <ShoppingCart
                      size={22}
                    />
                  </div>

                  <h4 className="mt-5 font-serif text-3xl italic text-stone-800">
                    Your basket is empty.
                  </h4>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-stone-400">
                    Browse the store and add something you love.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setCartOpen(
                        false
                      )
                    }
                    className="mt-6 rounded-full bg-stone-900 px-6 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                  >
                    Continue shopping
                  </button>

                </div>
              ) : (
                <div className="space-y-3">

                  {cartLines.map(
                    (
                      line
                    ) => {
                      const image =
                        getProductImage(
                          line.product
                        );

                      const maxStock =
                        getAvailableQuantity(
                          line.product
                        );

                      return (
                        <div
                          key={
                            line.product.id
                          }
                          className="rounded-2xl border border-stone-100 bg-stone-50 p-3"
                        >

                          <div className="flex gap-3">

                            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">

                              {image ? (
                                <img
                                  src={
                                    image
                                  }
                                  alt={
                                    line.product.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-stone-300">
                                  <Package
                                    size={18}
                                  />
                                </div>
                              )}

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  <p className="truncate text-xs font-bold text-stone-700">
                                    {
                                      line.product.name
                                    }
                                  </p>

                                  <p className="mt-1 text-[9px] text-stone-400">
                                    {getProductTypeLabel(
                                      line.product
                                    )}
                                  </p>

                                </div>

                                <button
                                  type="button"
                                  aria-label={`Remove ${line.product.name}`}
                                  disabled={
                                    checkingOut
                                  }
                                  onClick={() =>
                                    removeFromCart(
                                      line.product.id
                                    )
                                  }
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-stone-400 transition hover:text-red-500 disabled:opacity-40"
                                >
                                  <Trash2
                                    size={11}
                                  />
                                </button>

                              </div>

                              <div className="mt-3 flex items-center justify-between">

                                <div className="flex items-center rounded-full border border-stone-200 bg-white p-1">

                                  <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    disabled={
                                      checkingOut
                                    }
                                    onClick={() =>
                                      setQuantity(
                                        line.product.id,
                                        line.quantity -
                                          1
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-50 disabled:opacity-40"
                                  >
                                    <Minus
                                      size={10}
                                    />
                                  </button>

                                  <span className="min-w-7 text-center text-[10px] font-bold">
                                    {
                                      line.quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    disabled={
                                      checkingOut ||
                                      (
                                        maxStock !==
                                          null &&
                                        line.quantity >=
                                          maxStock
                                      )
                                    }
                                    onClick={() =>
                                      setQuantity(
                                        line.product.id,
                                        line.quantity +
                                          1
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 hover:bg-stone-50 disabled:opacity-30"
                                  >
                                    <Plus
                                      size={10}
                                    />
                                  </button>

                                </div>

                                <div className="text-right">

                                  <p className="font-serif text-xl italic text-stone-800">
                                    {formatCurrency(
                                      Number(
                                        line.product.price ||
                                          0
                                      ) *
                                        line.quantity
                                    )}
                                  </p>

                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            {/* FOOTER */}

            {cartLines.length >
              0 && (
              <div className="border-t border-stone-100 bg-white px-5 pb-5 pt-5 sm:px-6">

                {/* MEMBERSHIP DETAILS */}

                {requiredBeneficiarySpecs.length >
                  0 && (
                  <div className="mb-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">

                    <div className="flex items-start gap-3">

                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                        style={{
                          background:
                            primary,
                        }}
                      >
                        <ShieldCheck
                          size={14}
                        />
                      </div>

                      <div>

                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-700">
                          Membership details
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-stone-500">
                          Tell us who will use the membership. Payment details are entered securely with Stripe next.
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 space-y-4">

                      {requiredBeneficiarySpecs.map(
                        (
                          spec
                        ) => {
                          const draft =
                            beneficiaryDrafts[
                              spec.key
                            ];

                          return (
                            <div
                              key={
                                spec.key
                              }
                              className="rounded-2xl border border-stone-200 bg-white p-4"
                            >

                              <div className="flex items-start justify-between gap-3">

                                <div>

                                  <p className="text-[10px] font-black text-stone-800">
                                    {
                                      spec.title
                                    }
                                  </p>

                                  <p className="mt-1 text-[9px] leading-4 text-stone-400">
                                    {
                                      spec.productName
                                    }
                                    {spec.planCode
                                      ? ` · ${spec.planCode}`
                                      : ""}
                                  </p>

                                  <p className="mt-1 text-[9px] leading-4 text-stone-400">
                                    {
                                      spec.description
                                    }
                                  </p>

                                </div>

                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.12em] text-stone-500">
                                  {
                                    spec.beneficiaryType
                                  }
                                </span>

                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2">

                                <input
                                  type="text"
                                  value={
                                    draft?.firstName ||
                                    ""
                                  }
                                  disabled={
                                    checkingOut
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateBeneficiaryDraft(
                                      spec,
                                      "firstName",
                                      event.target.value
                                    )
                                  }
                                  placeholder="First name *"
                                  autoComplete="given-name"
                                  className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-[10px] font-semibold text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50"
                                />

                                <input
                                  type="text"
                                  value={
                                    draft?.lastName ||
                                    ""
                                  }
                                  disabled={
                                    checkingOut
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateBeneficiaryDraft(
                                      spec,
                                      "lastName",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Last name *"
                                  autoComplete="family-name"
                                  className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-[10px] font-semibold text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50"
                                />

                                <input
                                  type="email"
                                  value={
                                    draft?.email ||
                                    ""
                                  }
                                  disabled={
                                    checkingOut
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateBeneficiaryDraft(
                                      spec,
                                      "email",
                                      event.target.value
                                    )
                                  }
                                  placeholder={
                                    spec.emailRequired
                                      ? "Email *"
                                      : "Email (optional)"
                                  }
                                  autoComplete="email"
                                  className="col-span-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-[10px] font-semibold text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50"
                                />

                                <input
                                  type="tel"
                                  value={
                                    draft?.phone ||
                                    ""
                                  }
                                  disabled={
                                    checkingOut
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateBeneficiaryDraft(
                                      spec,
                                      "phone",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Phone (optional)"
                                  autoComplete="tel"
                                  className="col-span-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-[10px] font-semibold text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50"
                                />

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

                {/* DISCOUNT */}

                <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">

                  <div className="flex items-center gap-2">

                    <Tag
                      size={13}
                      style={{
                        color:
                          primary,
                      }}
                    />

                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-500">
                      Have a discount code?
                    </p>

                  </div>

                  {appliedDiscountCode ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3">

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <div
                            className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                            style={{
                              background:
                                primary,
                            }}
                          >
                            <Check
                              size={10}
                            />
                          </div>

                          <p className="truncate text-xs font-black text-stone-700">
                            {
                              appliedDiscountCode
                            }
                          </p>

                        </div>

                        <p className="mt-1 pl-7 text-[9px] text-stone-400">
                          Ready to be verified at checkout.
                        </p>

                      </div>

                      <button
                        type="button"
                        disabled={
                          checkingOut
                        }
                        onClick={
                          removeDiscountCode
                        }
                        className="text-[8px] font-black uppercase tracking-[0.12em] text-stone-400 underline disabled:opacity-40"
                      >
                        Remove
                      </button>

                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">

                      <input
                        type="text"
                        value={
                          discountCode
                        }
                        disabled={
                          checkingOut
                        }
                        onChange={(
                          event
                        ) => {
                          setDiscountCode(
                            event.target.value.toUpperCase()
                          );

                          setCheckoutError(
                            null
                          );

                          setDiscountMessage(
                            null
                          );
                        }}
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter"
                          ) {
                            event.preventDefault();

                            applyDiscountCode();
                          }
                        }}
                        placeholder="Enter code"
                        autoComplete="off"
                        spellCheck={
                          false
                        }
                        className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-stone-700 outline-none transition focus:border-stone-400 disabled:opacity-50"
                      />

                      <button
                        type="button"
                        disabled={
                          checkingOut ||
                          !discountCode.trim()
                        }
                        onClick={
                          applyDiscountCode
                        }
                        className="shrink-0 rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-40"
                      >
                        Apply
                      </button>

                    </div>
                  )}

                  {discountMessage && (
                    <p className="mt-2 text-[9px] leading-4 text-stone-400">
                      {
                        discountMessage
                      }
                    </p>
                  )}

                </div>

                {/* SHIPPING / DELIVERY */}

                <div className="mt-4">

                  {store.shipping_text ? (
                    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4">

                      <Truck
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            primary,
                        }}
                      />

                      <p className="text-[10px] leading-5 text-stone-500">
                        {
                          store.shipping_text
                        }
                      </p>

                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4">

                      {cartContainsPhysicalProduct ? (
                        <Truck
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{
                            color:
                              primary,
                          }}
                        />
                      ) : (
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{
                            color:
                              primary,
                          }}
                        />
                      )}

                      <p className="text-[10px] leading-5 text-stone-500">
                        {cartContainsPhysicalProduct
                          ? "Your basket includes a physical product. Delivery details will be confirmed during checkout."
                          : cartContainsCollectionProduct
                            ? "This order includes collection items. The business will confirm collection details with you."
                            : cartContainsDigitalProduct
                              ? "No shipping required. Digital fulfilment details will be provided after purchase."
                              : cartContainsServiceProduct
                                ? "No shipping required. The business will confirm the next steps for your service."
                                : "No shipping required for these items."}
                      </p>

                    </div>
                  )}

                </div>

                {/* ERROR */}

                {checkoutError && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">

                    <p className="text-[10px] font-semibold leading-5 text-red-600">
                      {
                        checkoutError
                      }
                    </p>

                    {appliedDiscountCode && (
                      <button
                        type="button"
                        onClick={
                          removeDiscountCode
                        }
                        className="mt-2 text-[8px] font-black uppercase tracking-[0.12em] text-red-500 underline"
                      >
                        Remove discount code
                      </button>
                    )}

                  </div>
                )}

                {/* TOTAL */}

                <div className="mt-5 border-t border-stone-100 pt-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[9px] font-semibold text-stone-400">
                        Subtotal
                      </p>

                      <p className="mt-1 text-[8px] text-stone-300">
                        Discounts applied at checkout
                      </p>

                    </div>

                    <strong className="font-serif text-3xl italic text-stone-900">
                      {formatCurrency(
                        cartTotal
                      )}
                    </strong>

                  </div>

                </div>

                {/* CHECKOUT */}

                <button
                  type="button"
                  disabled={
                    checkingOut
                  }
                  onClick={() =>
                    void startCheckout()
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[9px] font-black uppercase tracking-[0.17em] text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background:
                      primary,
                  }}
                >
                  {checkingOut ? (
                    <>
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />

                      Preparing checkout...
                    </>
                  ) : (
                    <>
                      Checkout securely

                      <ArrowRight
                        size={13}
                      />
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-2 text-[8px] text-stone-400">

                  <LockKeyhole
                    size={10}
                  />

                  Secure payment powered by Stripe

                </div>

              </div>
            )}

          </aside>
        </div>
      )}

      <StorefrontGlobalStyles />
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

function ProductCard({
  product,
  primary,
  onAdd,
  onRequest,
  featuredLayout = false,
}: {
  product: Product;
  primary: string;
  onAdd: () => void;
  onRequest: () => void;
  featuredLayout?: boolean;
}) {
  const image =
    getProductImage(
      product
    );

  const outOfStock =
    isOutOfStock(
      product
    );

  const lowStock =
    isLowStock(
      product
    );

  const available =
    getAvailableQuantity(
      product
    );

  const compareAt =
    Number(
      product.compare_at_price ||
        0
    );

  const price =
    Number(
      product.price ||
        0
    );

  const onSale =
    compareAt >
      price &&
    price >
      0;

  const typeLabel =
    getProductTypeLabel(
      product
    );

  const sellingModel =
    inferSellingModel(
      product
    );

  const requestAction =
    sellingModel ===
      "customisable" ||
    sellingModel ===
      "request_to_order";

  const saving =
    onSale
      ? compareAt -
        price
      : 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.65rem] border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(28,25,23,0.08)]">

      {/* IMAGE */}

      <div
        className={`relative overflow-hidden bg-[#f2f0ec] ${
          featuredLayout
            ? "aspect-[16/11]"
            : "aspect-[4/3]"
        }`}
      >
        {image ? (
          <img
            src={
              image
            }
            alt={
              product.name
            }
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <Package
              size={30}
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">

          {product.featured && (
            <span
              className="rounded-full px-3 py-1.5 text-[6px] font-black uppercase tracking-[0.13em] text-white shadow-sm"
              style={{
                background:
                  primary,
              }}
            >
              Featured
            </span>
          )}

          {onSale && (
            <span className="rounded-full bg-stone-900 px-3 py-1.5 text-[6px] font-black uppercase tracking-[0.13em] text-white shadow-sm">
              Save{" "}
              {formatCurrency(
                saving
              )}
            </span>
          )}

          {outOfStock && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[6px] font-black uppercase tracking-[0.13em] text-stone-500 shadow-sm">
              Unavailable
            </span>
          )}

        </div>

        <div className="absolute bottom-3 right-3">

          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[6px] font-black uppercase tracking-[0.12em] text-stone-500 shadow-sm backdrop-blur">
            {
              typeLabel
            }
          </span>

        </div>
      </div>

      {/* CONTENT */}

      <div className="flex flex-1 flex-col p-5">

        <p
          className="text-[7px] font-black uppercase tracking-[0.16em]"
          style={{
            color:
              primary,
          }}
        >
          {product.category ||
            "General"}
        </p>

        <h3 className="mt-2 line-clamp-2 text-[15px] font-bold leading-5 text-stone-800">
          {
            product.name
          }
        </h3>

        {product.description ? (
          <p className="mt-2 line-clamp-2 min-h-[42px] text-[10px] leading-5 text-stone-400">
            {
              product.description
            }
          </p>
        ) : (
          <div className="min-h-[50px]" />
        )}

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 px-3 py-2.5">
          {sellingModel ===
          "physical" ? (
            <Truck
              size={12}
              className="mt-0.5 shrink-0"
              style={{
                color:
                  primary,
              }}
            />
          ) : sellingModel ===
              "collect" ? (
            <MapPin
              size={12}
              className="mt-0.5 shrink-0"
              style={{
                color:
                  primary,
              }}
            />
          ) : (
            <Check
              size={12}
              className="mt-0.5 shrink-0"
              style={{
                color:
                  primary,
              }}
            />
          )}

          <p className="text-[8px] leading-4 text-stone-500">
            {getProductFulfilmentText(
              product
            )}
          </p>
        </div>

        <div className="mt-auto pt-5">

          <div className="flex items-end justify-between gap-3">

            <div>

              <div className="flex items-end gap-2">

                <p className="font-serif text-[1.8rem] italic leading-none text-stone-900">
                  {formatCurrency(
                    product.price
                  )}
                </p>

                {onSale && (
                  <p className="pb-0.5 text-[9px] text-stone-400 line-through">
                    {formatCurrency(
                      compareAt
                    )}
                  </p>
                )}

              </div>

              {lowStock &&
                available !==
                  null && (
                  <p className="mt-2 text-[7px] font-black uppercase tracking-[0.12em] text-amber-600">
                    Only{" "}
                    {
                      available
                    }{" "}
                    left
                  </p>
                )}

            </div>
          </div>

          <button
            type="button"
            disabled={
              outOfStock &&
              !requestAction
            }
            onClick={
              requestAction
                ? onRequest
                : onAdd
            }
            className="mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                outOfStock &&
                !requestAction
                  ? "#d6d3d1"
                  : primary,
            }}
          >
            <span className="text-[8px] font-black uppercase tracking-[0.13em]">
              {outOfStock &&
              !requestAction
                ? "Unavailable"
                : getProductActionLabel(
                    product
                  )}
            </span>

            {(!outOfStock ||
              requestAction) && (
              <ArrowRight
                size={12}
              />
            )}
          </button>

        </div>
      </div>
    </article>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  description,
  primary,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  primary: string;
}) {
  return (
    <div>

      <p
        className="text-[8px] font-black uppercase tracking-[0.22em]"
        style={{
          color:
            primary,
        }}
      >
        {
          eyebrow
        }
      </p>

      <h2 className="mt-2 font-serif text-4xl italic tracking-[-0.025em] text-stone-900 sm:text-5xl">
        {
          title
        }
      </h2>

      {description && (
        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
          {
            description
          }
        </p>
      )}

    </div>
  );
}

// ============================================================
// TRUST ITEM
// ============================================================

function TrustItem({
  icon,
  text,
  primary,
}: {
  icon: React.ReactNode;
  text: string;
  primary: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-semibold text-stone-400">

      <span
        style={{
          color:
            primary,
        }}
      >
        {
          icon
        }
      </span>

      {
        text
      }

    </div>
  );
}

// ============================================================
// CONTACT ITEM
// ============================================================

function ContactItem({
  href,
  icon,
  label,
  primary,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary: string;
  external?: boolean;
}) {
  return (
    <a
      href={
        href
      }
      target={
        external
          ? "_blank"
          : undefined
      }
      rel={
        external
          ? "noopener noreferrer"
          : undefined
      }
      className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4 no-underline transition hover:bg-white/10"
    >
      <span
        style={{
          color:
            primary,
        }}
      >
        {
          icon
        }
      </span>

      <span className="truncate text-xs text-stone-300">
        {
          label
        }
      </span>
    </a>
  );
}

// ============================================================
// MOBILE MENU LINK
// ============================================================

function MobileMenuLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <a
      href={
        href
      }
      onClick={
        onClick
      }
      className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-700 no-underline"
    >
      {
        label
      }

      <ArrowRight
        size={14}
      />
    </a>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-8 rounded-[2rem] border border-dashed border-stone-200 bg-white py-20 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-50 text-stone-300">
        {
          icon
        }
      </div>

      <p className="mt-5 text-sm font-bold text-stone-600">
        {
          title
        }
      </p>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
        {
          description
        }
      </p>

    </div>
  );
}

// ============================================================
// INPUT
// ============================================================

function StoreInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>

      <label
        htmlFor={
          id
        }
        className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
      >
        {
          label
        }
      </label>

      <input
        id={
          id
        }
        type={
          type
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        autoComplete={
          autoComplete
        }
        className="store-contact-input"
      />

    </div>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================

function StorefrontGlobalStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;500;600;700;800&display=swap");

      html {
        scroll-behavior: smooth;
      }

      body {
        font-family:
          "Inter",
          Arial,
          sans-serif;
      }

      .font-serif {
        font-family:
          "Instrument Serif",
          Georgia,
          serif;
      }

      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .store-contact-input {
        width: 100%;
        border: 1px solid #e7e5e4;
        background: #fafaf9;
        border-radius: 1rem;
        padding: 0.95rem 1rem;
        font-size: 0.78rem;
        color: #44403c;
        outline: none;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .store-contact-input::placeholder {
        color: #b9b4ae;
      }

      .store-contact-input:focus {
        background: #ffffff;
        border-color: var(--brand);
        box-shadow:
          0 0 0 3px
          color-mix(
            in srgb,
            var(--brand) 12%,
            transparent
          );
      }

      button,
      a,
      input,
      textarea,
      select {
        -webkit-tap-highlight-color: transparent;
      }

      @media (max-width: 640px) {
        .font-serif {
          text-wrap: balance;
        }
      }
    `}</style>
  );
}