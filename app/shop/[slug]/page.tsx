"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { supabase } from "@/lib/supabase";

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
  Minus,
  Package,
  Phone,
  Plus,
  Search,
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

type StoreSettingsRow = {
  id: string;
  organisation_id: string;
  slug: string;

  store_name?: string | null;
  store_description?: string | null;

  hero_title?: string | null;
  hero_text?: string | null;

  announcement?: string | null;

  accent_colour?: string | null;

  shipping_text?: string | null;

  support_email?: string | null;

  is_live?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type OrganisationRow = {
  id: string;

  name?: string | null;
  company_name?: string | null;

  description?: string | null;

  email?: string | null;
  phone?: string | null;
  address?: string | null;

  website?: string | null;
  website_url?: string | null;

  instagram?: string | null;
  instagram_url?: string | null;

  logo?: string | null;
  logo_url?: string | null;

  company_logo?: string | null;
  company_logo_url?: string | null;

  branding_logo_url?: string | null;

  [key: string]: unknown;
};

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

  description?: string | null;
  category?: string | null;

  price: number | string;

  compare_at_price?:
    | number
    | string
    | null;

  image_url?: string | null;

  images?: string[] | null;

  inventory_quantity?: number | null;

  sku?: string | null;

  is_active?: boolean | null;

  featured?: boolean | null;

  sort_order?: number | null;

  created_at?: string | null;

  [key: string]: unknown;
};

type CartLine = {
  product: Product;
  quantity: number;
};

// ============================================================
// CONSTANTS
// ============================================================

const QUERY_TIMEOUT_MS = 10000;

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value?: number | string | null
) {
  return new Intl.NumberFormat(
    "en-GB",
    {
      style: "currency",
      currency: "GBP",
    }
  ).format(
    Number(
      value || 0
    )
  );
}

function normaliseColour(
  value?: string | null,
  fallback = "#a9b897"
) {
  const trimmed =
    String(
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
    ) &&
    product.images.length >
      0
  ) {
    const first =
      product.images.find(
        (
          image
        ) =>
          typeof image ===
            "string" &&
          image.trim()
      );

    return first || null;
  }

  return null;
}

/**
 * Prevent any Supabase request from leaving the
 * public storefront on "Loading store" forever.
 */
async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = QUERY_TIMEOUT_MS
): Promise<T> {
  return await Promise.race([
    Promise.resolve(
      promise
    ),

    new Promise<T>(
      (
        _resolve,
        reject
      ) => {
        window.setTimeout(
          () => {
            reject(
              new Error(
                "The store took too long to respond. Please try again."
              )
            );
          },
          timeoutMs
        );
      }
    ),
  ]);
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

  // ==========================================================
  // LOAD STORE
  // ==========================================================

  const loadStore =
    useCallback(
      async () => {
        // Always immediately reset the page state.
        setLoading(true);
        setError(null);
        setProductLoadWarning(
          null
        );

        try {
          // ===================================================
          // VALIDATE SLUG
          // ===================================================

          if (
            !slug ||
            !slug.trim()
          ) {
            throw new Error(
              "No store was specified."
            );
          }

          const safeSlug =
            slug
              .trim()
              .toLowerCase();

          console.log(
            "[TOTS STORE] Loading:",
            safeSlug
          );

          // ===================================================
          // 1. LOAD STORE SETTINGS
          //
          // This is the only required query.
          // ===================================================

          const settingsResponse =
            await withTimeout(
              supabase
                .from(
                  "store_settings"
                )
                .select(
                  `
                    id,
                    organisation_id,
                    slug,
                    store_name,
                    store_description,
                    hero_title,
                    hero_text,
                    announcement,
                    accent_colour,
                    shipping_text,
                    support_email,
                    is_live,
                    created_at,
                    updated_at
                  `
                )
                .eq(
                  "slug",
                  safeSlug
                )
                .maybeSingle()
            );

          const {
            data:
              settingsData,
            error:
              settingsError,
          } =
            settingsResponse;

          if (
            settingsError
          ) {
            console.error(
              "[TOTS STORE] Settings query error:",
              settingsError
            );

            throw new Error(
              settingsError.message ||
                "The store settings could not be loaded."
            );
          }

          if (
            !settingsData
          ) {
            throw new Error(
              "This store could not be found."
            );
          }

          const settings =
            settingsData as StoreSettingsRow;

          // ===================================================
          // 2. LIVE CHECK
          // ===================================================

          if (
            settings.is_live !==
            true
          ) {
            throw new Error(
              "This store is not currently live."
            );
          }

          // ===================================================
          // 3. BUILD BASIC STORE IMMEDIATELY
          //
          // Do NOT make organisation data required.
          // ===================================================

          const fallbackStore:
            Storefront =
            {
              id:
                settings.id,

              organisation_id:
                settings.organisation_id,

              slug:
                settings.slug,

              store_name:
                settings.store_name?.trim() ||
                "Online Store",

              company_name:
                settings.store_name?.trim() ||
                "Online Store",

              store_description:
                settings.store_description,

              hero_title:
                settings.hero_title,

              hero_text:
                settings.hero_text,

              announcement:
                settings.announcement,

              accent_colour:
                settings.accent_colour,

              shipping_text:
                settings.shipping_text,

              support_email:
                settings.support_email,

              email:
                settings.support_email,

              phone:
                null,

              address:
                null,

              website_url:
                null,

              instagram_url:
                null,

              logo_url:
                null,

              is_live:
                true,
            };

          // Store now exists.
          // Even if the next two queries fail,
          // the storefront can render.
          setStore(
            fallbackStore
          );

          // ===================================================
          // 4. ORGANISATION BRANDING
          //
          // Optional query.
          // Failure must NOT kill the store.
          // ===================================================

          try {
            const organisationResponse =
              await withTimeout(
                supabase
                  .from(
                    "organisations"
                  )
                  .select("*")
                  .eq(
                    "id",
                    settings.organisation_id
                  )
                  .maybeSingle(),
                6000
              );

            const {
              data:
                organisationData,
              error:
                organisationError,
            } =
              organisationResponse;

            if (
              organisationError
            ) {
              console.warn(
                "[TOTS STORE] Organisation branding unavailable:",
                organisationError
              );
            } else if (
              organisationData
            ) {
              const organisation =
                organisationData as OrganisationRow;

              const companyName =
                firstString(
                  settings.store_name,
                  organisation.company_name,
                  organisation.name
                ) ||
                fallbackStore.store_name;

              const logoUrl =
                firstString(
                  organisation.logo_url,
                  organisation.company_logo_url,
                  organisation.branding_logo_url,
                  organisation.company_logo,
                  organisation.logo
                );

              setStore({
                ...fallbackStore,

                store_name:
                  companyName,

                company_name:
                  companyName,

                store_description:
                  settings.store_description ||
                  firstString(
                    organisation.description
                  ),

                logo_url:
                  logoUrl,

                email:
                  firstString(
                    settings.support_email,
                    organisation.email
                  ),

                phone:
                  firstString(
                    organisation.phone
                  ),

                address:
                  firstString(
                    organisation.address
                  ),

                website_url:
                  firstString(
                    organisation.website_url,
                    organisation.website
                  ),

                instagram_url:
                  firstString(
                    organisation.instagram_url,
                    organisation.instagram
                  ),
              });
            }
          } catch (
            organisationLoadError
          ) {
            // This is intentionally non-fatal.
            console.warn(
              "[TOTS STORE] Organisation branding timed out or failed:",
              organisationLoadError
            );
          }

          // ===================================================
          // 5. PRODUCTS
          //
          // Also optional for storefront rendering.
          // ===================================================

          try {
            const productResponse =
              await withTimeout(
                supabase
                  .from(
                    "store_products"
                  )
                  .select("*")
                  .eq(
                    "organisation_id",
                    settings.organisation_id
                  ),
                8000
              );

            const {
              data:
                productRows,
              error:
                productError,
            } =
              productResponse;

            if (
              productError
            ) {
              console.error(
                "[TOTS STORE] Product query error:",
                productError
              );

              setProductLoadWarning(
                "Products could not be loaded right now."
              );

              setProducts(
                []
              );
            } else {
              const cleanedProducts =
                (
                  productRows ||
                  []
                )
                  .map(
                    (
                      product
                    ) =>
                      product as Product
                  )

                  // Hide explicitly inactive products.
                  .filter(
                    (
                      product
                    ) =>
                      product.is_active !==
                      false
                  )

                  // Ensure we have a usable name.
                  .filter(
                    (
                      product
                    ) =>
                      typeof product.name ===
                        "string" &&
                      product.name.trim()
                  )

                  // Sort locally so optional columns
                  // cannot break the DB query.
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

              setProducts(
                cleanedProducts
              );

              console.log(
                "[TOTS STORE] Products loaded:",
                cleanedProducts.length
              );
            }
          } catch (
            productLoadError
          ) {
            console.warn(
              "[TOTS STORE] Products timed out or failed:",
              productLoadError
            );

            setProducts(
              []
            );

            setProductLoadWarning(
              "Products could not be loaded right now."
            );
          }

          console.log(
            "[TOTS STORE] Store loaded successfully"
          );
        } catch (
          loadError: unknown
        ) {
          console.error(
            "[TOTS STORE] Fatal storefront error:",
            loadError
          );

          setStore(
            null
          );

          setProducts(
            []
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "We couldn't load this store right now."
          );
        } finally {
          // CRITICAL:
          // this always executes regardless of what happened.
          setLoading(
            false
          );
        }
      },
      [
        slug,
      ]
    );

  // ==========================================================
  // LOAD ON MOUNT / SLUG CHANGE
  // ==========================================================

  useEffect(
    () => {
      let mounted =
        true;

      if (
        mounted
      ) {
        void loadStore();
      }

      return () => {
        mounted =
          false;
      };
    },
    [
      loadStore,
    ]
  );

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories =
    useMemo(
      () => {
        return [
          "All",

          ...Array.from(
            new Set(
              products
                .map(
                  (
                    product
                  ) =>
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
              a,
              b
            ) =>
              a.localeCompare(
                b
              )
          ),
        ];
      },
      [
        products,
      ]
    );

  // ==========================================================
  // FILTER PRODUCTS
  // ==========================================================

  const visibleProducts =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (
            product
          ) => {
            const matchesCategory =
              category ===
                "All" ||
              product.category ===
                category;

            if (
              !matchesCategory
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
              .filter(Boolean)
              .some(
                (
                  value
                ) =>
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
            (
              product
            ) =>
              product.featured ===
              true
          );

        if (
          explicit.length >
          0
        ) {
          return explicit.slice(
            0,
            4
          );
        }

        return products.slice(
          0,
          4
        );
      },
      [
        products,
      ]
    );

  // ==========================================================
  // CART DERIVED STATE
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
  // ADD TO CART
  // ==========================================================

  function addToCart(
    product: Product
  ) {
    if (
      typeof product.inventory_quantity ===
        "number" &&
      product.inventory_quantity <=
        0
    ) {
      return;
    }

    setCart(
      (
        previous
      ) => {
        const existing =
          previous[
            product.id
          ];

        let nextQuantity =
          existing
            ? existing.quantity +
              1
            : 1;

        if (
          typeof product.inventory_quantity ===
            "number"
        ) {
          nextQuantity =
            Math.min(
              nextQuantity,
              Math.max(
                product.inventory_quantity,
                0
              )
            );
        }

        return {
          ...previous,

          [product.id]:
            {
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

  // ==========================================================
  // UPDATE CART QUANTITY
  // ==========================================================

  function setQuantity(
    productId: string,
    quantity: number
  ) {
    setCart(
      (
        previous
      ) => {
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

        if (
          typeof existing.product.inventory_quantity ===
            "number"
        ) {
          safeQuantity =
            Math.min(
              quantity,
              existing.product.inventory_quantity
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

          [productId]:
            {
              ...existing,

              quantity:
                safeQuantity,
            },
        };
      }
    );
  }

  // ==========================================================
  // BRANDING
  // ==========================================================

  const primary =
    normaliseColour(
      store?.accent_colour,
      "#a9b897"
    );

  const secondary =
    "#f0f2eb";

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
            size={
              28
            }
          />

          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
            Loading store
          </p>

          <p className="mt-2 text-[10px] text-stone-300">
            {
              slug
            }
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
        <div className="w-full max-w-lg rounded-[2.25rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <Store
              size={
                22
              }
            />
          </div>

          <h1 className="mt-6 font-serif text-4xl italic text-stone-900">
            Store unavailable
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-500">
            {error ||
              "This store could not be found."}
          </p>

          <p className="mt-3 text-[9px] uppercase tracking-[0.14em] text-stone-300">
            Store:{" "}
            {
              slug ||
              "unknown"
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadStore()
            }
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white"
          >
            Try again

            <ArrowRight
              size={
                13
              }
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

      <div className="bg-stone-900 px-4 py-2.5 text-center text-[8px] font-black uppercase tracking-[0.18em] text-white">
        {store.announcement ||
          "Independent business · Store powered by TOTS-OS"}
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#f8f7f3]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white lg:hidden"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
          >
            <Menu
              size={
                17
              }
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
                className="h-11 w-11 rounded-xl object-contain"
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    primary,
                }}
              >
                <Store
                  size={
                    18
                  }
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-[0.14em] text-stone-900">
                {
                  storeName
                }
              </p>

              <p className="mt-0.5 hidden truncate text-[10px] text-stone-400 sm:block">
                Online store
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#shop"
              className="text-xs font-semibold text-stone-600 no-underline transition hover:text-stone-900"
            >
              Shop
            </a>

            {featuredProducts.length >
              0 && (
              <a
                href="#featured"
                className="text-xs font-semibold text-stone-600 no-underline transition hover:text-stone-900"
              >
                Featured
              </a>
            )}

            <a
              href="#about"
              className="text-xs font-semibold text-stone-600 no-underline transition hover:text-stone-900"
            >
              About
            </a>

            <a
              href="#contact"
              className="text-xs font-semibold text-stone-600 no-underline transition hover:text-stone-900"
            >
              Contact
            </a>
          </nav>

          <button
            type="button"
            onClick={() =>
              setCartOpen(
                true
              )
            }
            className="relative flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-xs font-semibold shadow-sm"
          >
            <ShoppingBag
              size={
                16
              }
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

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

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

          <div className="relative ml-auto w-full max-w-sm rounded-[2rem] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                Menu
              </span>

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
                  size={
                    15
                  }
                />
              </button>
            </div>

            <div className="mt-6 grid gap-2">
              {[
                "shop",
                "featured",
                "about",
                "contact",
              ].map(
                (
                  item
                ) => {
                  if (
                    item ===
                      "featured" &&
                    !featuredProducts.length
                  ) {
                    return null;
                  }

                  return (
                    <a
                      key={
                        item
                      }
                      href={`#${item}`}
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-4 text-sm font-semibold capitalize no-underline"
                    >
                      {
                        item
                      }

                      <ArrowRight
                        size={
                          14
                        }
                      />
                    </a>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="top"
        className="px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8"
      >
        <div className="mx-auto max-w-[1450px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm lg:rounded-[3rem]">
          <div className="grid min-h-[520px] lg:grid-cols-[1.04fr_0.96fr]">
            <div className="flex items-center p-7 sm:p-10 lg:p-16">
              <div className="max-w-2xl">
                <div
                  className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[8px] font-black uppercase tracking-[0.18em]"
                  style={{
                    background:
                      `${primary}1c`,
                    color:
                      primary,
                  }}
                >
                  <Sparkles
                    size={
                      12
                    }
                  />

                  Welcome to{" "}
                  {
                    storeName
                  }
                </div>

                <h1 className="font-serif text-5xl italic leading-[0.98] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl xl:text-8xl">
                  {store.hero_title ||
                    `Shop ${storeName}`}
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-7 text-stone-500 sm:text-base">
                  {store.hero_text ||
                    store.store_description ||
                    "Browse our latest products and order directly from our online store."}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#shop"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-4 text-[9px] font-black uppercase tracking-[0.17em] text-white no-underline transition hover:opacity-90"
                    style={{
                      background:
                        primary,
                    }}
                  >
                    Shop now

                    <ArrowRight
                      size={
                        14
                      }
                    />
                  </a>

                  <a
                    href="#about"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-4 text-[9px] font-black uppercase tracking-[0.17em] text-stone-700 no-underline"
                  >
                    About us
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[10px] text-stone-400">
                  <span className="flex items-center gap-2">
                    <Check
                      size={
                        12
                      }
                      style={{
                        color:
                          primary,
                      }}
                    />

                    Independent business
                  </span>

                  <span className="flex items-center gap-2">
                    <Check
                      size={
                        12
                      }
                      style={{
                        color:
                          primary,
                      }}
                    />

                    Secure ordering
                  </span>

                  {store.shipping_text ? (
                    <span className="flex items-center gap-2">
                      <Truck
                        size={
                          12
                        }
                        style={{
                          color:
                            primary,
                        }}
                      />

                      {
                        store.shipping_text
                      }
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check
                        size={
                          12
                        }
                        style={{
                          color:
                            primary,
                        }}
                      />

                      Powered by TOTS-OS
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div
              className="relative min-h-[360px] overflow-hidden lg:min-h-full"
              style={{
                background:
                  secondary,
              }}
            >
              {featuredProducts[0] &&
              getProductImage(
                featuredProducts[0]
              ) ? (
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
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex h-36 w-36 items-center justify-center rounded-[2rem] text-white shadow-xl"
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
                        className="h-28 w-28 object-contain"
                      />
                    ) : (
                      <ShoppingBag
                        size={
                          46
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/25 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SHIPPING
      ===================================================== */}

      {store.shipping_text && (
        <section className="px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1450px] items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-center text-xs font-semibold text-stone-600">
            <Truck
              size={
                15
              }
              style={{
                color:
                  primary,
              }}
            />

            {
              store.shipping_text
            }
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
          className="px-4 py-10 sm:px-6 lg:px-10 lg:py-14"
        >
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.22em]"
                  style={{
                    color:
                      primary,
                  }}
                >
                  Featured
                </p>

                <h2 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">
                  A few favourites.
                </h2>
              </div>

              <a
                href="#shop"
                className="hidden items-center gap-2 text-xs font-semibold text-stone-500 no-underline sm:flex"
              >
                View everything

                <ArrowRight
                  size={
                    14
                  }
                />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        className="px-4 py-12 sm:px-6 lg:px-10 lg:py-16"
      >
        <div className="mx-auto max-w-[1450px]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                Shop
              </p>

              <h2 className="mt-2 font-serif text-4xl italic tracking-tight text-stone-900 sm:text-5xl">
                Browse the collection.
              </h2>

              <p className="mt-3 text-sm text-stone-500">
                {
                  products.length
                }{" "}
                {products.length ===
                1
                  ? "product"
                  : "products"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={
                    14
                  }
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
                  className="w-full rounded-full border border-stone-200 bg-white py-3.5 pl-10 pr-5 text-xs outline-none transition focus:border-stone-400 sm:w-64"
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
                    className="w-full appearance-none rounded-full border border-stone-200 bg-white py-3.5 pl-5 pr-10 text-xs font-semibold text-stone-600 outline-none sm:w-52"
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
                    size={
                      13
                    }
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>
              )}
            </div>
          </div>

          {productLoadWarning && (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
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
                Try loading again
              </button>
            </div>
          )}

          {visibleProducts.length >
          0 ? (
            <div className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  />
                )
              )}
            </div>
          ) : products.length ===
            0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-stone-200 bg-white py-20 text-center">
              <Package
                className="mx-auto text-stone-300"
                size={
                  28
                }
              />

              <p className="mt-4 text-sm font-semibold text-stone-600">
                Products coming soon
              </p>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
                {
                  storeName
                }{" "}
                hasn&apos;t published any products yet.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-dashed border-stone-200 bg-white py-20 text-center">
              <Search
                className="mx-auto text-stone-300"
                size={
                  28
                }
              />

              <p className="mt-4 text-sm font-semibold text-stone-600">
                No products found
              </p>

              <p className="mt-2 text-xs text-stone-400">
                Try another search or category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="px-4 py-12 sm:px-6 lg:px-10 lg:py-16"
      >
        <div className="mx-auto grid max-w-[1450px] overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white lg:grid-cols-2">
          <div className="p-8 sm:p-10 lg:p-14">
            <p
              className="text-[9px] font-black uppercase tracking-[0.22em]"
              style={{
                color:
                  primary,
              }}
            >
              About{" "}
              {
                storeName
              }
            </p>

            <h2 className="mt-3 max-w-xl font-serif text-4xl italic tracking-tight sm:text-5xl">
              Meet the business behind the store.
            </h2>

            <p className="mt-5 max-w-xl whitespace-pre-line text-sm leading-7 text-stone-500">
              {store.store_description ||
                `Welcome to ${storeName}. Browse our products, shop online and get in touch with us directly if you need any help.`}
            </p>

            {store.website_url && (
              <a
                href={
                  store.website_url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 no-underline"
              >
                Visit website

                <ExternalLink
                  size={
                    12
                  }
                />
              </a>
            )}
          </div>

          <div
            className="flex min-h-[320px] items-center justify-center p-10"
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
                  className="mx-auto max-h-40 max-w-[240px] object-contain"
                />
              ) : (
                <div
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl text-white"
                  style={{
                    background:
                      primary,
                  }}
                >
                  <Store
                    size={
                      34
                    }
                  />
                </div>
              )}

              <p className="mt-5 text-sm font-semibold text-stone-700">
                {
                  storeName
                }
              </p>

              <p className="mt-2 text-xs text-stone-500">
                Independent business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section
        id="contact"
        className="px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pb-20"
      >
        <div className="mx-auto max-w-[1450px] rounded-[2.5rem] bg-stone-900 p-8 text-white sm:p-10 lg:p-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.22em]"
                style={{
                  color:
                    primary,
                }}
              >
                Need a hand?
              </p>

              <h2 className="mt-3 max-w-2xl font-serif text-4xl italic tracking-tight sm:text-5xl">
                Speak directly to{" "}
                {
                  storeName
                }
                .
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-stone-400">
                Questions about a
                product or an
                order? Get in
                touch directly
                with the business.
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/5 p-4 no-underline transition hover:bg-white/10"
                >
                  <Mail
                    size={
                      16
                    }
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
                    size={
                      16
                    }
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
                    size={
                      16
                    }
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
                    size={
                      16
                    }
                    style={{
                      color:
                        primary,
                    }}
                  />

                  <span className="truncate text-xs">
                    Instagram
                  </span>
                </a>
              )}

              {!store.email &&
                !store.phone &&
                !store.address &&
                !store.instagram_url && (
                <div className="rounded-2xl bg-white/5 p-5 sm:col-span-2">
                  <p className="text-xs leading-6 text-stone-400">
                    Contact details haven&apos;t been added to this store yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1450px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img
                src={
                  store.logo_url
                }
                alt={`${storeName} logo`}
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{
                  background:
                    primary,
                }}
              >
                <Store
                  size={
                    14
                  }
                />
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-stone-700">
                {
                  storeName
                }
              </p>

              <p className="mt-1 text-[9px] text-stone-400">
                ©{" "}
                {new Date().getFullYear()}{" "}
                {
                  storeName
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[9px] text-stone-400">
            <Sparkles
              size={
                11
              }
              style={{
                color:
                  primary,
              }}
            />

            Store powered by TOTS-OS
          </div>
        </div>
      </footer>

      {/* =====================================================
          CART
      ===================================================== */}

      {cartOpen && (
        <div className="fixed inset-0 z-[120] bg-stone-900/35 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close basket"
            className="absolute inset-0"
            onClick={() =>
              setCartOpen(
                false
              )
            }
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
                onClick={() =>
                  setCartOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100"
              >
                <X
                  size={
                    16
                  }
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cartLines.length ===
              0 ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                    <ShoppingCart
                      size={
                        22
                      }
                    />
                  </div>

                  <p className="mt-5 text-sm font-semibold text-stone-700">
                    Your basket is empty
                  </p>

                  <p className="mt-2 text-xs text-stone-400">
                    Add something you like and it will appear here.
                  </p>
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
                        typeof line.product.inventory_quantity ===
                        "number"
                          ? line.product.inventory_quantity
                          : null;

                      return (
                        <div
                          key={
                            line.product.id
                          }
                          className="flex gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-3"
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
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
                                  size={
                                    20
                                  }
                                />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-stone-700">
                              {
                                line.product.name
                              }
                            </p>

                            <p className="mt-1 text-xs text-stone-500">
                              {formatCurrency(
                                line.product.price
                              )}
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(
                                    line.product.id,
                                    line.quantity -
                                      1
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white"
                              >
                                <Minus
                                  size={
                                    12
                                  }
                                />
                              </button>

                              <span className="min-w-5 text-center text-xs font-semibold">
                                {
                                  line.quantity
                                }
                              </span>

                              <button
                                type="button"
                                disabled={
                                  maxStock !==
                                    null &&
                                  line.quantity >=
                                    maxStock
                                }
                                onClick={() =>
                                  setQuantity(
                                    line.product.id,
                                    line.quantity +
                                      1
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus
                                  size={
                                    12
                                  }
                                />
                              </button>
                            </div>

                            {maxStock !==
                              null &&
                              maxStock <=
                                5 && (
                              <p
                                className="mt-2 text-[8px] font-bold"
                                style={{
                                  color:
                                    primary,
                                }}
                              >
                                {
                                  maxStock
                                }{" "}
                                in stock
                              </p>
                            )}
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
                    size={
                      13
                    }
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

              <button
                type="button"
                disabled={
                  !cartLines.length
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[9px] font-black uppercase tracking-[0.17em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background:
                    primary,
                }}
                onClick={() =>
                  alert(
                    "Basket is ready. Next step is connecting this button to your TOTS-OS order + Stripe checkout API."
                  )
                }
              >
                Checkout

                <ArrowRight
                  size={
                    14
                  }
                />
              </button>

              <p className="mt-3 text-center text-[9px] leading-4 text-stone-400">
                Checkout will be securely processed through this store&apos;s TOTS-OS account.
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
}: {
  product: Product;
  primary: string;
  onAdd: () => void;
}) {
  const image =
    getProductImage(
      product
    );

  const outOfStock =
    typeof product.inventory_quantity ===
      "number" &&
    product.inventory_quantity <=
      0;

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

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white">
        {image ? (
          <img
            src={
              image
            }
            alt={
              product.name
            }
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
            <Package
              size={
                34
              }
            />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.featured && (
            <span
              className="rounded-full px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-white"
              style={{
                background:
                  primary,
              }}
            >
              Featured
            </span>
          )}

          {onSale && (
            <span className="rounded-full bg-stone-900 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-white">
              Sale
            </span>
          )}

          {outOfStock && (
            <span className="rounded-full bg-white px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-stone-600 shadow-sm">
              Sold out
            </span>
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
          className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-full bg-white/95 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-900 shadow-lg backdrop-blur transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {outOfStock ? (
            "Sold out"
          ) : (
            <>
              <ShoppingBag
                size={
                  13
                }
              />

              Add to basket
            </>
          )}
        </button>
      </div>

      <div className="px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product.category && (
              <p className="mb-1 text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
                {
                  product.category
                }
              </p>
            )}

            <h3 className="truncate text-sm font-semibold text-stone-800">
              {
                product.name
              }
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-stone-900">
              {formatCurrency(
                product.price
              )}
            </p>

            {onSale && (
              <p className="mt-1 text-[10px] text-stone-400 line-through">
                {formatCurrency(
                  compareAt
                )}
              </p>
            )}
          </div>
        </div>

        {product.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-400">
            {
              product.description
            }
          </p>
        )}

        {typeof product.inventory_quantity ===
          "number" &&
          product.inventory_quantity >
            0 &&
          product.inventory_quantity <=
            5 && (
          <p
            className="mt-2 text-[9px] font-bold"
            style={{
              color:
                primary,
            }}
          >
            Only{" "}
            {
              product.inventory_quantity
            }{" "}
            left
          </p>
        )}
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
    `}</style>
  );
}