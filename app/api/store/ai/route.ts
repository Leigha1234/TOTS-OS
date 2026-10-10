import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const FIELDS = [
  "title",
  "short_description",
  "description",
  "seo_title",
  "meta_description",
  "alt_text",
  "category",
  "tags",
  "instagram",
  "facebook",
  "tiktok",
  "email_subject",
  "email_body",
] as const;

export async function POST(request: NextRequest) {
  try {
    /* ============================================================
       AUTH
    ============================================================ */

    const authHeader = request.headers.get("authorization") || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!url || !anonKey || !openaiKey) {
      return NextResponse.json(
        {
          error:
            "Store AI is not configured. Add OPENAI_API_KEY and check Supabase environment variables.",
        },
        { status: 503 }
      );
    }

    const supabase = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Session expired." },
        { status: 401 }
      );
    }

    /* ============================================================
       REQUEST
    ============================================================ */

    const body = await request.json();

    const organisationId =
      typeof body.organisation_id === "string"
        ? body.organisation_id
        : "";

    if (!/^[0-9a-f-]{36}$/i.test(organisationId)) {
      return NextResponse.json(
        { error: "Invalid organisation." },
        { status: 400 }
      );
    }

    /* ============================================================
       ORGANISATION ACCESS

       First use the same organisation helper used elsewhere
       in TOTS-OS.

       Then fall back to checking common organisation membership
       structures so Clarity isn't blocked unnecessarily.
    ============================================================ */

    let hasOrganisationAccess = false;

    // ------------------------------------------------------------
    // 1. Existing TOTS-OS RPC
    // ------------------------------------------------------------

    try {
      const { data: member, error: membershipError } =
        await supabase.rpc(
          "user_belongs_to_organisation",
          {
            org_id: organisationId,
          }
        );

      if (!membershipError && member === true) {
        hasOrganisationAccess = true;
      }

      if (membershipError) {
        console.warn(
          "Store AI organisation RPC check failed:",
          membershipError.message
        );
      }
    } catch (error) {
      console.warn(
        "Store AI organisation RPC unavailable:",
        error
      );
    }

    // ------------------------------------------------------------
    // 2. Check whether organisation itself belongs to user
    // ------------------------------------------------------------

    if (!hasOrganisationAccess) {
      try {
        const { data } = await supabase
          .from("organisations")
          .select("id")
          .eq("id", organisationId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.id) {
          hasOrganisationAccess = true;
        }
      } catch {
        // Ignore — schema may not use user_id here.
      }
    }

    // ------------------------------------------------------------
    // 3. Check organisation_members
    // ------------------------------------------------------------

    if (!hasOrganisationAccess) {
      try {
        const { data } = await supabase
          .from("organisation_members")
          .select("organisation_id")
          .eq("organisation_id", organisationId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.organisation_id) {
          hasOrganisationAccess = true;
        }
      } catch {
        // Table may not exist in older organisations.
      }
    }

    // ------------------------------------------------------------
    // 4. Check organisation_memberships
    // ------------------------------------------------------------

    if (!hasOrganisationAccess) {
      try {
        const { data } = await supabase
          .from("organisation_memberships")
          .select("organisation_id")
          .eq("organisation_id", organisationId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.organisation_id) {
          hasOrganisationAccess = true;
        }
      } catch {
        // Table may not exist.
      }
    }

    if (!hasOrganisationAccess) {
      console.warn(
        "Store AI access denied",
        {
          userId: user.id,
          organisationId,
        }
      );

      return NextResponse.json(
        {
          error:
            "We couldn't verify access to this organisation. Refresh the page and try again.",
        },
        { status: 403 }
      );
    }

    /* ============================================================
       PRODUCT
    ============================================================ */

    const product = body.product || {};

    const name = String(product.name || "")
      .trim()
      .slice(0, 200);

    if (!name) {
      return NextResponse.json(
        {
          error: "Enter a product name first.",
        },
        { status: 400 }
      );
    }

    const productFacts = {
      name,

      description: String(
        product.description || ""
      ).slice(0, 3000),

      category: String(
        product.category || ""
      ).slice(0, 150),

      price: String(
        product.price || ""
      ).slice(0, 30),

      selling_model: String(
        product.selling_model || ""
      ).slice(0, 60),

      extra_facts: String(
        body.additional_facts || ""
      ).slice(0, 2500),
    };

    /* ============================================================
       BUSINESS / BRAND CONTEXT

       Clarity learns this automatically.
       The user doesn't need to select:
       - tone
       - audience
       - writing style
       - business type
    ============================================================ */

    const [
      orgResult,
      settingsResult,
      productsResult,
    ] = await Promise.all([
      supabase
        .from("organisations")
        .select("*")
        .eq("id", organisationId)
        .maybeSingle(),

      supabase
        .from("store_settings")
        .select("*")
        .eq("organisation_id", organisationId)
        .maybeSingle(),

      supabase
        .from("store_products")
        .select(
          "name, description, category"
        )
        .eq(
          "organisation_id",
          organisationId
        )
        .not(
          "description",
          "is",
          null
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(8),
    ]);

    const org =
      (orgResult.data || {}) as Record<
        string,
        unknown
      >;

    const settings =
      (settingsResult.data || {}) as Record<
        string,
        unknown
      >;

    const existingProducts =
      Array.isArray(productsResult.data)
        ? productsResult.data
        : [];

    /* ============================================================
       SAFE TEXT EXTRACTION
    ============================================================ */

    const pickText = (
      value: unknown,
      max = 1000
    ) =>
      typeof value === "string"
        ? value.trim().slice(0, max)
        : "";

    /* ============================================================
       BRAND CONTEXT
    ============================================================ */

    const brandContext = {
      business_name:
        pickText(org.name, 200) ||
        pickText(settings.store_name, 200) ||
        "Business",

      business_description:
        pickText(
          org.description ||
            org.business_description ||
            org.bio,
          1200
        ),

      industry:
        pickText(
          org.industry ||
            org.business_type ||
            org.category,
          200
        ),

      website:
        pickText(
          org.website ||
            org.website_url,
          300
        ),

      store_name:
        pickText(
          settings.store_name,
          200
        ),

      store_description:
        pickText(
          settings.store_description,
          1200
        ),

      storefront_heading:
        pickText(
          settings.hero_title,
          300
        ),

      storefront_subheading:
        pickText(
          settings.hero_subtitle ||
            settings.hero_description,
          600
        ),

      existing_product_copy:
        existingProducts.map(
          (
            item: Record<
              string,
              unknown
            >
          ) => ({
            name:
              pickText(
                item.name,
                180
              ),

            category:
              pickText(
                item.category,
                120
              ),

            description:
              pickText(
                item.description,
                700
              ),
          })
        ),
    };

    /* ============================================================
       CLARITY INSTRUCTIONS
    ============================================================ */

    const instructions = `
You are Clarity AI inside TOTS-OS.

You are helping a business create and market a product.

IMPORTANT:

You already know the business.

Infer its established:

- tone of voice
- vocabulary
- level of formality
- writing style
- selling style
- brand personality

from the supplied organisation,
storefront and existing product context.

The user should NOT have to repeatedly
describe their tone, audience or brand.

Match their existing business naturally.

If brand context is sparse, use:
clear, warm, natural UK English.

Avoid generic AI-sounding marketing copy.

Do not invent:

- materials
- sizes
- ingredients
- sustainability claims
- certifications
- stock levels
- guarantees
- delivery times
- product benefits
- discounts
- testimonials
- specifications

If information has not been supplied,
do not claim it.

ALT TEXT:

Only describe facts that are actually
known from the product information.

You have NOT seen the product image.

If meaningful alt text cannot be created
without guessing, return an empty string.

SEO:

seo_title must be 60 characters or fewer.

meta_description must be 155 characters
or fewer.

short_description must be 160 characters
or fewer.

SOCIAL:

Write each platform caption specifically
for that platform.

Do not simply repeat the same caption.

Avoid spammy hashtags.

Avoid fake urgency.

EMAIL:

email_subject should be concise and
natural.

email_body should sound like the
business itself wrote it.

OUTPUT:

Respond ONLY with valid JSON.

Use exactly these keys:

${FIELDS.join(", ")}

tags must be an array containing
3 to 8 short strings.

Every other value must be a string.

Never return markdown.
Never return code fences.
`;

    /* ============================================================
       OPENAI
    ============================================================ */

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${openaiKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model:
            process.env.STORE_AI_MODEL ||
            "gpt-6-luna",

          instructions,

          input: JSON.stringify({
            brand_context:
              brandContext,

            product:
              productFacts,
          }),

          max_output_tokens: 1800,

          store: false,
        }),

        signal:
          AbortSignal.timeout(
            45000
          ),
      }
    );

    /* ============================================================
       PROVIDER ERROR
    ============================================================ */

    if (!response.ok) {
      const message =
        await response.text();

      console.error(
        "Store AI provider error",
        response.status,
        message.slice(
          0,
          500
        )
      );

      return NextResponse.json(
        {
          error:
            "Clarity is temporarily unavailable. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    /* ============================================================
       PARSE RESPONSE
    ============================================================ */

    const result =
      await response.json();

    const output =
      Array.isArray(
        result.output
      )
        ? result.output
            .flatMap(
              (
                item: {
                  content?: Array<{
                    type?: string;
                    text?: string;
                  }>;
                }
              ) =>
                item.content ||
                []
            )
            .filter(
              (
                part: {
                  type?: string;
                }
              ) =>
                part.type ===
                "output_text"
            )
            .map(
              (
                part: {
                  text?: string;
                }
              ) =>
                part.text ||
                ""
            )
            .join("")
        : "";

    let parsed:
      Record<
        string,
        unknown
      >;

    try {
      parsed =
        JSON.parse(
          output
            .trim()
            .replace(
              /^```(?:json)?\s*/i,
              ""
            )
            .replace(
              /\s*```$/,
              ""
            )
        );
    } catch {
      console.error(
        "Store AI invalid JSON:",
        output.slice(
          0,
          500
        )
      );

      return NextResponse.json(
        {
          error:
            "Clarity returned an invalid response. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    /* ============================================================
       SANITISE OUTPUT
    ============================================================ */

    const copy:
      Record<
        string,
        string | string[]
      > = {};

    for (
      const field
      of FIELDS
    ) {
      if (
        field ===
        "tags"
      ) {
        copy.tags =
          Array.isArray(
            parsed.tags
          )
            ? parsed.tags
                .slice(
                  0,
                  8
                )
                .map(
                  (
                    value
                  ) =>
                    String(
                      value
                    ).slice(
                      0,
                      50
                    )
                )
            : [];
      } else {
        copy[field] =
          typeof parsed[
            field
          ] ===
          "string"
            ? (
                parsed[
                  field
                ] as string
              ).slice(
                0,
                6000
              )
            : "";
      }
    }

    /* ============================================================
       SUCCESS
    ============================================================ */

    return NextResponse.json(
      {
        copy,
      }
    );
  } catch (error) {
    console.error(
      "Store AI failed",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not generate AI content. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}