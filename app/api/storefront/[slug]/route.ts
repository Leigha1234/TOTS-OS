import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

const supabaseAdmin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function firstBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function safeInteger(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const safeSlug = String(slug || "").trim().toLowerCase();

    if (!safeSlug) {
      return NextResponse.json(
        { error: "No store was specified." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("store_settings")
      .select(`
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
        storefront_mode,
        external_storefront_url,
        logo_url,
        favicon_url,
        hero_image_url,
        background_colour,
        text_colour,
        button_colour,
        button_text_colour,
        heading_font,
        body_font,
        layout_style,
        card_style,
        border_radius,
        show_categories,
        show_search,
        show_stock,
        show_prices,
        footer_text,
        instagram_url,
        facebook_url,
        tiktok_url,
        custom_css,
        created_at,
        updated_at
      `)
      .eq("slug", safeSlug)
      .maybeSingle();

    if (settingsError) {
      console.error("[STOREFRONT API] Settings error:", settingsError);
      return NextResponse.json(
        { error: "The store could not be loaded." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!settings) {
      return NextResponse.json(
        { error: "This store could not be found." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (settings.is_live !== true) {
      return NextResponse.json(
        { error: "This store is not currently live." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const [organisationResult, productResult] = await Promise.all([
      supabaseAdmin
        .from("organisations")
        .select("*")
        .eq("id", settings.organisation_id)
        .maybeSingle(),

      supabaseAdmin
        .from("store_products")
        .select(`
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
          is_active,
          product_type,
          purchase_type,
          billing_interval,
          external_system,
          external_plan_code,
          beneficiary_mode
        `)
        .eq("organisation_id", settings.organisation_id)
        .eq("is_active", true),
    ]);

    const organisation = organisationResult.data;

    if (organisationResult.error) {
      console.warn(
        "[STOREFRONT API] Organisation branding unavailable:",
        organisationResult.error
      );
    }

    if (productResult.error) {
      console.error("[STOREFRONT API] Products error:", productResult.error);
    }

    const products = (productResult.data || [])
      .filter((product) => product.is_active !== false)
      .filter(
        (product) => typeof product.name === "string" && product.name.trim()
      )
      .sort((first, second) => {
        if (first.featured !== second.featured) return first.featured ? -1 : 1;

        const firstOrder =
          typeof first.sort_order === "number" ? first.sort_order : 999999;
        const secondOrder =
          typeof second.sort_order === "number" ? second.sort_order : 999999;

        if (firstOrder !== secondOrder) return firstOrder - secondOrder;

        return String(first.name).localeCompare(String(second.name));
      });

    const companyName =
      firstString(
        settings.store_name,
        organisation?.company_name,
        organisation?.name
      ) || "Online Store";

    const logoUrl = firstString(
      settings.logo_url,
      organisation?.logo_url,
      organisation?.company_logo_url,
      organisation?.branding_logo_url,
      organisation?.company_logo,
      organisation?.logo
    );

    const instagramUrl = firstString(
      settings.instagram_url,
      organisation?.instagram_url,
      organisation?.instagram
    );

    const facebookUrl = firstString(
      settings.facebook_url,
      organisation?.facebook_url,
      organisation?.facebook
    );

    const tiktokUrl = firstString(
      settings.tiktok_url,
      organisation?.tiktok_url,
      organisation?.tiktok
    );

    return NextResponse.json(
      {
        store: {
          id: settings.id,
          organisation_id: settings.organisation_id,
          slug: settings.slug,
          store_name: companyName,
          company_name: companyName,
          store_description:
            settings.store_description || firstString(organisation?.description),

          storefront_mode:
            settings.storefront_mode === "external" ? "external" : "hosted",
          external_storefront_url: firstString(
            settings.external_storefront_url
          ),

          hero_title: firstString(settings.hero_title),
          hero_text: firstString(settings.hero_text),
          announcement: firstString(settings.announcement),
          shipping_text: firstString(settings.shipping_text),
          footer_text: firstString(settings.footer_text),

          logo_url: logoUrl,
          favicon_url: firstString(settings.favicon_url),
          hero_image_url: firstString(settings.hero_image_url),

          accent_colour: firstString(settings.accent_colour) || "#A9B897",
          background_colour:
            firstString(settings.background_colour) || "#FAF8F5",
          text_colour: firstString(settings.text_colour) || "#1c1917",
          button_colour:
            firstString(settings.button_colour) ||
            firstString(settings.accent_colour) ||
            "#1c1917",
          button_text_colour:
            firstString(settings.button_text_colour) || "#ffffff",

          heading_font: firstString(settings.heading_font) || "Poppins",
          body_font: firstString(settings.body_font) || "Poppins",
          layout_style: firstString(settings.layout_style) || "minimal",
          card_style: firstString(settings.card_style) || "soft",
          border_radius: Math.max(
            0,
            Math.min(48, safeInteger(settings.border_radius, 18))
          ),

          show_categories: firstBoolean(settings.show_categories, true),
          show_search: firstBoolean(settings.show_search, true),
          show_stock: firstBoolean(settings.show_stock, false),
          show_prices: firstBoolean(settings.show_prices, true),

          support_email: firstString(settings.support_email),
          email: firstString(settings.support_email, organisation?.email),
          phone: firstString(organisation?.phone),
          address: firstString(organisation?.address),
          website_url: firstString(
            organisation?.website_url,
            organisation?.website
          ),

          instagram_url: instagramUrl,
          facebook_url: facebookUrl,
          tiktok_url: tiktokUrl,

          custom_css: firstString(settings.custom_css),
          is_live: true,
          updated_at: settings.updated_at,
        },

        products,

        productLoadWarning: productResult.error
          ? "Products could not be loaded right now."
          : null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[STOREFRONT API] Fatal error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The store could not be loaded.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
