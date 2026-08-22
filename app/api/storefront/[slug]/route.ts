import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================
// ADMIN CLIENT
// ============================================================

const supabaseAdmin =
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

// ============================================================
// HELPERS
// ============================================================

function firstString(
  ...values: unknown[]
) {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

// ============================================================
// GET STOREFRONT
// ============================================================

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const {
      slug,
    } =
      await context.params;

    const safeSlug =
      String(
        slug || ""
      )
        .trim()
        .toLowerCase();

    if (!safeSlug) {
      return NextResponse.json(
        {
          error:
            "No store was specified.",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // STORE SETTINGS
    // ========================================================

    const {
      data: settings,
      error:
        settingsError,
    } =
      await supabaseAdmin
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
        .maybeSingle();

    if (settingsError) {
      console.error(
        "[STOREFRONT API] Settings error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "The store could not be loaded.",
        },
        {
          status: 500,
        }
      );
    }

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "This store could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      settings.is_live !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "This store is not currently live.",
        },
        {
          status: 404,
        }
      );
    }

    // ========================================================
    // LOAD ORGANISATION + PRODUCTS IN PARALLEL
    // ========================================================

    const [
      organisationResult,
      productResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from(
            "organisations"
          )
          .select("*")
          .eq(
            "id",
            settings.organisation_id
          )
          .maybeSingle(),

        supabaseAdmin
          .from(
            "store_products"
          )
          .select(
            `
              id,
              organisation_id,
              name,
              slug,
              description,
              sku,
              category,
              price,
              compare_at_price,
              cost_price,
              stock,
              image_url,
              featured,
              status,
              created_at,
              updated_at,
              inventory_quantity,
              low_stock_threshold,
              track_inventory,
              sort_order,
              is_active
            `
          )
          .eq(
            "organisation_id",
            settings.organisation_id
          )
          .eq(
            "is_active",
            true
          ),
      ]);

    // ========================================================
    // ORGANISATION
    // ========================================================

    const organisation =
      organisationResult.data;

    if (
      organisationResult.error
    ) {
      console.warn(
        "[STOREFRONT API] Organisation branding unavailable:",
        organisationResult.error
      );
    }

    // ========================================================
    // PRODUCTS
    // ========================================================

    if (
      productResult.error
    ) {
      console.error(
        "[STOREFRONT API] Products error:",
        productResult.error
      );
    }

    const products =
      (
        productResult.data ||
        []
      )
        .filter(
          (product) =>
            product.is_active !==
            false
        )
        .filter(
          (product) =>
            typeof product.name ===
              "string" &&
            product.name.trim()
        )
        .sort(
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

            return String(
              first.name
            ).localeCompare(
              String(
                second.name
              )
            );
          }
        );

    // ========================================================
    // BRANDING
    // ========================================================

    const companyName =
      firstString(
        settings.store_name,
        organisation?.company_name,
        organisation?.name
      ) ||
      "Online Store";

    const logoUrl =
      firstString(
        organisation?.logo_url,
        organisation?.company_logo_url,
        organisation?.branding_logo_url,
        organisation?.company_logo,
        organisation?.logo
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        store: {
          id:
            settings.id,

          organisation_id:
            settings.organisation_id,

          slug:
            settings.slug,

          store_name:
            companyName,

          company_name:
            companyName,

          store_description:
            settings.store_description ||
            firstString(
              organisation?.description
            ),

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
            firstString(
              settings.support_email,
              organisation?.email
            ),

          phone:
            firstString(
              organisation?.phone
            ),

          address:
            firstString(
              organisation?.address
            ),

          website_url:
            firstString(
              organisation?.website_url,
              organisation?.website
            ),

          instagram_url:
            firstString(
              organisation?.instagram_url,
              organisation?.instagram
            ),

          logo_url:
            logoUrl,

          is_live:
            true,
        },

        products,

        productLoadWarning:
          productResult.error
            ? "Products could not be loaded right now."
            : null,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error(
      "[STOREFRONT API] Fatal error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The store could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}