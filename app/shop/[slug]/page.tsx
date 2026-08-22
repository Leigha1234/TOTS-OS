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
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
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

type Product = {
  id: string;

  organisation_id?: string | null;

  name: string;

  slug?: string | null;

  description?: string | null;

  category?: string | null;

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

  [key: string]: unknown;
};

type CartLine = {
  product: Product;
  quantity: number;
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
  url?: string;
  checkoutUrl?: string;
  sessionUrl?: string;
  sessionId?: string;
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
// PRODUCT TYPES
// ============================================================

function isServiceProduct(
  product: Product
) {
  const category =
    String(
      product.category || ""
    )
      .trim()
      .toLowerCase();

  return [
    "websites",
    "website",
    "website add-ons",
    "website add ons",
    "website maintenance",
    "branding",
    "business coaching",
    "coaching",
    "services",
    "service",
    "social media",
    "business support",
  ].includes(category);
}

function isDigitalProduct(
  product: Product
) {
  const category =
    String(
      product.category || ""
    )
      .trim()
      .toLowerCase();

  return (
    category.includes(
      "digital"
    ) ||
    category.includes(
      "template"
    ) ||
    category.includes(
      "resource"
    )
  );
}

function getProductActionLabel(
  product: Product
) {
  if (
    isServiceProduct(
      product
    )
  ) {
    return "Choose service";
  }

  if (
    isDigitalProduct(
      product
    )
  ) {
    return "Get this";
  }

  return "Add to basket";
}

// ============================================================
// PAGE
// ============================================================

export default function ShopFrontPage() {
  const params = useParams();

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
  // CONTACT FORM
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
                method: "GET",

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

            console.warn(
              "[TOTS STORE] Storefront request timed out."
            );

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

          if (
            loadError instanceof
            TypeError
          ) {
            setError(
              "We couldn't connect to the store. Please check your connection and try again."
            );
          } else {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "We couldn't load this store right now."
            );
          }
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
  // LOAD ON SLUG CHANGE
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
  // CONTACT MESSAGE
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
        console.error(
          "[TOTS STORE] Contact message failed:",
          sendError
        );

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
        setSendingMessage(
          false
        );
      }
    }
  }

  function openContactDrawer() {
    setMessageSent(false);
    setMessageError(null);

    setContactOpen(
      true
    );
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
  // FEATURED PRODUCTS
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

    setCheckoutError(
      null
    );

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

    setCartOpen(
      true
    );
  }

  function setQuantity(
    productId: string,
    quantity: number
  ) {
    setCheckoutError(
      null
    );

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
              quantity,
              Math.max(
                available,
                0
              )
            );
        }

        if (
          safeQuantity <=
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

    setCheckingOut(
      true
    );

    setCheckoutError(
      null
    );

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
                organisationId:
                  store.organisation_id,

                storeId:
                  store.id,

                storeSlug:
                  store.slug,

                items,
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
        console.error(
          "[TOTS STORE] Checkout response:",
          data
        );

        throw new Error(
          "Stripe checkout was created, but no checkout URL was returned."
        );
      }

      window.location.href =
        checkoutUrl;
    } catch (
      checkoutFailure:
        unknown
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
      setCheckingOut(
        false
      );
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
    `${primary}16`;

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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-5">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-stone-500"
            size={28}
          />

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">
            Opening store
          </p>

          <p className="mt-2 text-[9px] text-stone-300">
            Just a moment
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-5">
        <div className="w-full max-w-lg rounded-[2rem] border border-stone-200 bg-white p-9 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <Store
              size={22}
            />
          </div>

          <h1 className="mt-6 font-serif text-4xl italic text-stone-900">
            Store unavailable
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
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-stone-800"
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
      {/* ANNOUNCEMENT */}

      <div
        className="px-4 py-2 text-center text-[8px] font-black uppercase tracking-[0.18em] text-white"
        style={{
          background:
            primary,
        }}
      >
        {store.announcement ||
          "Independent business · Powered by TOTS-OS"}
      </div>

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#f8f7f3]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white lg:hidden"
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
                  size={15}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-stone-900">
                {
                  storeName
                }
              </p>

              <p className="mt-0.5 hidden text-[9px] text-stone-400 sm:block">
                Shop · Services · Resources
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#shop"
              className="text-xs font-semibold text-stone-500 no-underline transition hover:text-stone-900"
            >
              Explore
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
              Talk to us
            </button>
          </nav>

          <button
            type="button"
            onClick={() =>
              setCartOpen(
                true
              )
            }
            className="relative flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold shadow-sm"
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
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[8px] font-black text-white"
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

      {/* MOBILE MENU */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/40 p-4 backdrop-blur-sm lg:hidden">
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

          <div className="relative ml-auto w-full max-w-sm rounded-[1.75rem] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Explore
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

            <div className="mt-5 grid gap-2">
              <a
                href="#shop"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3.5 text-sm font-semibold no-underline"
              >
                Shop

                <ArrowRight
                  size={14}
                />
              </a>

              {featuredProducts.length >
                0 && (
                <a
                  href="#featured"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3.5 text-sm font-semibold no-underline"
                >
                  Featured

                  <ArrowRight
                    size={14}
                  />
                </a>
              )}

              <a
                href="#about"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3.5 text-sm font-semibold no-underline"
              >
                About

                <ArrowRight
                  size={14}
                />
              </a>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(
                    false
                  );

                  openContactDrawer();
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-white"
                style={{
                  background:
                    primary,
                }}
              >
                Talk to us

                <MessageCircle
                  size={14}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}

      <section
        id="top"
        className="px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6"
      >
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm lg:rounded-[2.5rem]">
          <div className="grid lg:grid-cols-[1.12fr_.88fr]">
            <div className="flex items-center p-7 sm:p-10 lg:p-12 xl:p-14">
              <div className="max-w-2xl">
                <div
                  className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-[0.18em]"
                  style={{
                    background:
                      `${primary}1c`,

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

                <h1 className="font-serif text-[3.1rem] italic leading-[0.95] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
                  {store.hero_title ||
                    `A simpler way to shop ${storeName}.`}
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500 sm:text-[15px]">
                  {store.hero_text ||
                    store.store_description ||
                    "Explore services, resources and products designed to make business feel simpler."}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href="#shop"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white no-underline transition hover:opacity-90"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    Explore everything

                    <ArrowRight
                      size={13}
                    />
                  </a>

                  <button
                    type="button"
                    onClick={
                      openContactDrawer
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-stone-600"
                  >
                    Talk to us

                    <MessageCircle
                      size={13}
                    />
                  </button>
                </div>

                <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[9px] text-stone-400">
                  <span className="flex items-center gap-2">
                    <Check
                      size={11}
                      style={{
                        color:
                          primary,
                      }}
                    />

                    Independent business
                  </span>

                  <span className="flex items-center gap-2">
                    <Check
                      size={11}
                      style={{
                        color:
                          primary,
                      }}
                    />

                    Secure checkout
                  </span>

                  <span className="flex items-center gap-2">
                    <Check
                      size={11}
                      style={{
                        color:
                          primary,
                      }}
                    />

                    Direct support
                  </span>
                </div>
              </div>
            </div>

            <div
              className="relative min-h-[260px] overflow-hidden lg:min-h-[440px]"
              style={{
                background:
                  secondary,
              }}
            >
              {featuredProducts[0] &&
              getProductImage(
                featuredProducts[0]
              ) ? (
                <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-10 lg:p-12">
                  <div className="relative h-full max-h-[390px] w-full max-w-[310px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_22px_60px_rgba(0,0,0,0.12)]">
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
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-[2rem] text-white shadow-xl"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY CHIPS */}

      {categories.length >
        1 && (
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
              {categories.map(
                (item) => (
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
                    className="shrink-0 rounded-full border px-4 py-2 text-[8px] font-black uppercase tracking-[0.13em] transition"
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

      {/* FEATURED */}

      {featuredProducts.length >
        0 && (
        <section
          id="featured"
          className="px-4 py-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p
                  className="text-[8px] font-black uppercase tracking-[0.22em]"
                  style={{
                    color:
                      primary,
                  }}
                >
                  Start here
                </p>

                <h2 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">
                  A few favourites.
                </h2>

                <p className="mt-2 text-xs text-stone-400">
                  Popular ways to work with{" "}
                  {
                    storeName
                  }.
                </p>
              </div>

              <a
                href="#shop"
                className="hidden items-center gap-2 text-xs font-semibold text-stone-500 no-underline sm:flex"
              >
                See all

                <ArrowRight
                  size={13}
                />
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featuredProducts.map(
                (product) => (
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
                    featuredLayout
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* SHOP */}

      <section
        id="shop"
        className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[8px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                Explore
              </p>

              <h2 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">
                Find what your business needs.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                Websites, branding, coaching, resources and more — all in one place.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={13}
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
                  placeholder="What are you looking for?"
                  className="w-full rounded-full border border-stone-200 bg-white py-3 pl-10 pr-5 text-xs outline-none transition focus:border-stone-400 sm:w-72"
                />
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
                    className="w-full appearance-none rounded-full border border-stone-200 bg-white py-3 pl-5 pr-10 text-xs font-semibold text-stone-600 outline-none sm:w-52"
                  >
                    {categories.map(
                      (item) => (
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

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[10px] text-stone-400">
              Showing{" "}
              <strong className="text-stone-600">
                {
                  visibleProducts.length
                }
              </strong>{" "}
              {visibleProducts.length ===
              1
                ? "option"
                : "options"}
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
                className="text-[9px] font-bold text-stone-500 underline"
              >
                Clear filters
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
            <div className="mt-7 grid gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map(
                (product) => (
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
                  />
                )
              )}
            </div>
          ) : products.length ===
            0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-stone-200 bg-white py-16 text-center">
              <Package
                className="mx-auto text-stone-300"
                size={26}
              />

              <p className="mt-4 text-sm font-semibold text-stone-600">
                More coming soon
              </p>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
                There&apos;s nothing published here just yet.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-stone-200 bg-white py-16 text-center">
              <Search
                className="mx-auto text-stone-300"
                size={26}
              />

              <p className="mt-4 text-sm font-semibold text-stone-600">
                Nothing matched that
              </p>

              <p className="mt-2 text-xs text-stone-400">
                Try another search or reset your filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-[1320px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white lg:grid-cols-[1.2fr_.8fr]">
          <div className="p-8 sm:p-10 lg:p-12">
            <p
              className="text-[8px] font-black uppercase tracking-[0.22em]"
              style={{
                color:
                  primary,
              }}
            >
              Behind the store
            </p>

            <h2 className="mt-3 max-w-xl font-serif text-4xl italic tracking-tight sm:text-5xl">
              Made by a real business, for real businesses.
            </h2>

            <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-7 text-stone-500">
              {store.store_description ||
                `Welcome to ${storeName}. Everything here has been created to make running your business easier, clearer and a little less overwhelming.`}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {store.website_url && (
                <a
                  href={
                    store.website_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 no-underline"
                >
                  Visit our website

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
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                style={{
                  background:
                    primary,
                }}
              >
                Talk to us

                <MessageCircle
                  size={12}
                />
              </button>
            </div>
          </div>

          <div
            className="flex min-h-[250px] items-center justify-center p-8"
            style={{
              background:
                secondary,
            }}
          >
            <div className="text-center">
              {store.logo_url ? (
                <img
                  src={
                    store.logo_url
                  }
                  alt={`${storeName} logo`}
                  className="mx-auto max-h-24 max-w-[180px] object-contain"
                />
              ) : (
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-white"
                  style={{
                    background:
                      primary,
                  }}
                >
                  <Store
                    size={28}
                  />
                </div>
              )}

              <p className="mt-4 text-sm font-semibold text-stone-700">
                {
                  storeName
                }
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.13em] text-stone-400">
                Independent business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}

      <section
        id="contact"
        className="px-4 pb-14 pt-5 sm:px-6 lg:px-8 lg:pb-16"
      >
        <div className="mx-auto max-w-[1320px] rounded-[2rem] bg-stone-900 p-8 text-white sm:p-10 lg:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[8px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                Not sure what you need?
              </p>

              <h2 className="mt-3 max-w-2xl font-serif text-4xl italic tracking-tight sm:text-5xl">
                Talk to us before you buy.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-stone-400">
                Questions about a service, package or product? Send us a message and we&apos;ll help point you in the right direction.
              </p>

              <button
                type="button"
                onClick={
                  openContactDrawer
                }
                className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[9px] font-black uppercase tracking-[0.15em] text-white"
                style={{
                  background:
                    primary,
                }}
              >
                Send us a message

                <MessageCircle
                  size={13}
                />
              </button>
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[440px]">
              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4 no-underline transition hover:bg-white/10"
                >
                  <Mail
                    size={15}
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <span className="truncate text-xs">
                    {
                      store.email
                    }
                  </span>
                </a>
              )}

              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4 no-underline transition hover:bg-white/10"
                >
                  <Phone
                    size={15}
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <span className="truncate text-xs">
                    {
                      store.phone
                    }
                  </span>
                </a>
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

                  <span className="text-xs">
                    {
                      store.address
                    }
                  </span>
                </div>
              )}

              {store.instagram_url && (
                <a
                  href={
                    store.instagram_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4 no-underline transition hover:bg-white/10"
                >
                  <Instagram
                    size={15}
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <span className="text-xs">
                    Instagram
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-stone-200 bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img
                src={
                  store.logo_url
                }
                alt={`${storeName} logo`}
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{
                  background:
                    primary,
                }}
              >
                <Store
                  size={13}
                />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-stone-700">
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

          <div className="flex items-center gap-2 text-[8px] text-stone-400">
            <Sparkles
              size={10}
              style={{
                color:
                  primary,
              }}
            />

            Powered by TOTS-OS
          </div>
        </div>
      </footer>

      {/* FLOATING CONTACT */}

      {!contactOpen &&
        !cartOpen && (
        <button
          type="button"
          onClick={
            openContactDrawer
          }
          className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-full px-5 py-3.5 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
          style={{
            background:
              primary,
          }}
        >
          <MessageCircle
            size={15}
          />

          Talk to us
        </button>
      )}

      {/* CONTACT DRAWER */}

      {contactOpen && (
        <div className="fixed inset-0 z-[140] bg-stone-900/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close message panel"
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

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[470px] flex-col bg-white shadow-2xl">
            <div
              className="border-b border-stone-100 px-6 pb-6 pt-7"
              style={{
                background:
                  secondary,
              }}
            >
              <div className="flex items-start justify-between gap-4">
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
                    Talk to us
                  </p>

                  <h2 className="mt-2 font-serif text-4xl italic leading-none text-stone-900">
                    How can we help?
                  </h2>

                  <p className="mt-3 max-w-sm text-xs leading-6 text-stone-500">
                    Ask about a service, product, package or anything else. Your message will come straight through to the TOTS-OS inbox.
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
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
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
                    Thanks for getting in touch. Your message has been sent through to the TOTS-OS inbox.
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
                  <div>
                    <label
                      htmlFor="store-contact-name"
                      className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
                    >
                      Your name
                    </label>

                    <input
                      id="store-contact-name"
                      value={
                        contactName
                      }
                      onChange={(
                        event
                      ) =>
                        setContactName(
                          event.target.value
                        )
                      }
                      placeholder="Your name"
                      autoComplete="name"
                      className="store-contact-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="store-contact-email"
                      className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
                    >
                      Email address
                    </label>

                    <input
                      id="store-contact-email"
                      type="email"
                      value={
                        contactEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setContactEmail(
                          event.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="store-contact-input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="store-contact-message"
                      className="mb-2 block text-[8px] font-black uppercase tracking-[0.16em] text-stone-400"
                    >
                      What can we help with?
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
                      placeholder="Tell us what you're looking for..."
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[9px] font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <Sparkles
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            primary,
                        }}
                      />

                      <p className="text-[10px] leading-5 text-stone-400">
                        Your message is linked to{" "}
                        <strong className="font-semibold text-stone-600">
                          {
                            storeName
                          }
                        </strong>{" "}
                        so the team can see exactly which storefront you contacted them from.
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

      {/* CART */}

      {cartOpen && (
        <div className="fixed inset-0 z-[120] bg-stone-900/35 backdrop-blur-sm">
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

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-5">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                  Your basket
                </p>

                <h3 className="mt-1 font-serif text-2xl italic">
                  {
                    cartCount
                  }{" "}
                  {cartCount ===
                  1
                    ? "item"
                    : "items"}
                </h3>
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
                className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 disabled:opacity-50"
              >
                <X
                  size={15}
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartLines.length ===
              0 ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                    <ShoppingCart
                      size={21}
                    />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-stone-700">
                    Nothing here yet
                  </p>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-stone-400">
                    Pick something from the store and it&apos;ll appear here.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setCartOpen(
                        false
                      )
                    }
                    className="mt-5 rounded-full bg-stone-900 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                  >
                    Keep browsing
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartLines.map(
                    (line) => {
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
                          className="flex gap-3 rounded-2xl border border-stone-100 bg-stone-50 p-3"
                        >
                          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
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
                            <p className="truncate text-xs font-semibold text-stone-700">
                              {
                                line.product.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-stone-500">
                              {formatCurrency(
                                line.product.price
                              )}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
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
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white disabled:opacity-40"
                              >
                                <Minus
                                  size={10}
                                />
                              </button>

                              <span className="min-w-5 text-center text-[10px] font-semibold">
                                {
                                  line.quantity
                                }
                              </span>

                              <button
                                type="button"
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
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus
                                  size={10}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xs font-semibold text-stone-700">
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
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">
                  Subtotal
                </span>

                <strong className="font-serif text-2xl italic text-stone-900">
                  {formatCurrency(
                    cartTotal
                  )}
                </strong>
              </div>

              {store.shipping_text && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 p-3">
                  <Truck
                    size={12}
                    className="mt-0.5 shrink-0"
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <p className="text-[9px] leading-4 text-stone-500">
                    {
                      store.shipping_text
                    }
                  </p>
                </div>
              )}

              {checkoutError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-[10px] leading-5 text-red-600">
                    {
                      checkoutError
                    }
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={
                  !cartLines.length ||
                  checkingOut
                }
                onClick={() =>
                  void startCheckout()
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[9px] font-black uppercase tracking-[0.17em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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

                    Opening checkout...
                  </>
                ) : (
                  <>
                    Continue to checkout

                    <ArrowRight
                      size={13}
                    />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[8px] leading-4 text-stone-400">
                Secure checkout powered by TOTS-OS and Stripe.
              </p>
            </div>
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
  featuredLayout = false,
}: {
  product: Product;
  primary: string;
  onAdd: () => void;
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

  const service =
    isServiceProduct(
      product
    );

  const digital =
    isDigitalProduct(
      product
    );

  return (
    <article className="group min-w-0 overflow-hidden rounded-[1.55rem] border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <div
        className={`relative overflow-hidden bg-stone-100 ${
          featuredLayout
            ? "aspect-[16/9]"
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
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-300">
            <Package
              size={28}
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.featured && (
            <span
              className="rounded-full px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.13em] text-white"
              style={{
                background:
                  primary,
              }}
            >
              Featured
            </span>
          )}

          {onSale && (
            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.13em] text-white">
              Offer
            </span>
          )}

          {outOfStock && (
            <span className="rounded-full bg-white px-2.5 py-1 text-[6px] font-black uppercase tracking-[0.13em] text-stone-600 shadow-sm">
              Unavailable
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-[7px] font-black uppercase tracking-[0.15em]"
            style={{
              color:
                primary,
            }}
          >
            {product.category ||
              "Product"}
          </p>

          {service ? (
            <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-stone-300">
              Service
            </span>
          ) : digital ? (
            <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-stone-300">
              Digital
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-stone-800">
          {
            product.name
          }
        </h3>

        {product.description && (
          <p className="mt-2 line-clamp-2 min-h-[40px] text-[10px] leading-5 text-stone-400">
            {
              product.description
            }
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-serif text-[1.65rem] italic leading-none text-stone-900">
              {formatCurrency(
                product.price
              )}
            </p>

            {onSale && (
              <p className="mt-1 text-[9px] text-stone-400 line-through">
                {formatCurrency(
                  compareAt
                )}
              </p>
            )}
          </div>

          {lowStock &&
            available !==
              null && (
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-amber-600">
                Only{" "}
                {
                  available
                }{" "}
                left
              </p>
            )}
        </div>

        <button
          type="button"
          disabled={
            outOfStock
          }
          onClick={
            onAdd
          }
          className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background:
              outOfStock
                ? "#d6d3d1"
                : primary,
          }}
        >
          <span className="text-[8px] font-black uppercase tracking-[0.13em]">
            {outOfStock
              ? "Unavailable"
              : getProductActionLabel(
                  product
                )}
          </span>

          {!outOfStock && (
            <ArrowRight
              size={12}
            />
          )}
        </button>
      </div>
    </article>
  );
}

// ============================================================
// GLOBAL STYLES
// ============================================================

function StorefrontGlobalStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

      html {
        scroll-behavior: smooth;
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
        border-radius: 0.9rem;
        padding: 0.9rem 1rem;
        font-size: 0.78rem;
        color: #44403c;
        outline: none;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
      }

      .store-contact-input::placeholder {
        color: #c4bfb9;
      }

      .store-contact-input:focus {
        background: #ffffff;
        border-color: var(--brand);
        box-shadow:
          0 0 0 3px
          color-mix(
            in srgb,
            var(--brand) 14%,
            transparent
          );
      }
    `}</style>
  );
}