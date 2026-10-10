import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const FIELDS = [
  "title", "short_description", "description", "seo_title", "meta_description",
  "alt_text", "category", "tags", "instagram", "facebook", "tiktok",
  "email_subject", "email_body",
] as const;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!url || !anonKey || !openaiKey) {
      return NextResponse.json({ error: "Store AI is not configured. Add OPENAI_API_KEY and check Supabase environment variables." }, { status: 503 });
    }

    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    const body = await request.json();
    const organisationId = typeof body.organisation_id === "string" ? body.organisation_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(organisationId)) {
      return NextResponse.json({ error: "Invalid organisation." }, { status: 400 });
    }

    // Existing TOTS-OS membership helper is SECURITY DEFINER and checks auth.uid().
    const { data: member, error: membershipError } = await supabase
      .rpc("user_belongs_to_organisation", { p_organisation_id: organisationId });
    if (membershipError || member !== true) {
      return NextResponse.json({ error: "You do not have access to this organisation." }, { status: 403 });
    }

    const product = body.product || {};
    const name = String(product.name || "").trim().slice(0, 200);
    if (!name) return NextResponse.json({ error: "Enter a product name first." }, { status: 400 });

    // Never accept raw unbounded product/brand input into a paid API call.
    const productFacts = {
      name,
      description: String(product.description || "").slice(0, 3000),
      category: String(product.category || "").slice(0, 150),
      price: String(product.price || "").slice(0, 30),
      selling_model: String(product.selling_model || "").slice(0, 60),
      extra_facts: String(body.additional_facts || "").slice(0, 2500),
    };

    const { data: org } = await supabase
      .from("organisations")
      .select("name")
      .eq("id", organisationId)
      .maybeSingle();

    const instructions = `You are Clarity AI, a UK English ecommerce copywriter working for a small business. Produce helpful, natural, distinctive copy that fits the supplied brand. Do not invent materials, sizes, ingredients, sustainability claims, certifications, stock levels, guarantees, delivery times, product benefits, discounts, testimonials, or specifications. If information is missing, avoid claiming it. Do not assume a pictured product's appearance because you have not seen the image. Alt text must only describe verifiable facts from the provided text; otherwise leave it empty. Avoid misleading urgency, spammy hashtags, and unsupported claims. Respond ONLY with valid JSON, with exactly these keys: ${FIELDS.join(", ")}. tags must be an array of 3 to 8 short strings; every other key must be a string. SEO title <= 60 chars; meta description <= 155 chars; short_description <= 160 chars; social copy must be platform-appropriate, not repetitive. Never include markdown fences.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.STORE_AI_MODEL || "gpt-6-luna",
        instructions,
        input: JSON.stringify({
          business_name: org?.name || "Business",
          tone: String(body.tone || "friendly").slice(0, 50),
          audience: String(body.audience || "").slice(0, 400),
          brand_voice: String(body.brand_voice || "").slice(0, 800),
          product: productFacts,
        }),
        max_output_tokens: 1800,
        store: false,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error("Store AI provider error", response.status, message.slice(0, 400));
      return NextResponse.json({ error: "AI generation is temporarily unavailable." }, { status: 502 });
    }
    const result = await response.json();
    const output = Array.isArray(result.output)
      ? result.output.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content || [])
          .filter((part: { type?: string }) => part.type === "output_text")
          .map((part: { text?: string }) => part.text || "")
          .join("")
      : "";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(output.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    } catch {
      return NextResponse.json({ error: "AI returned an invalid response. Please regenerate." }, { status: 502 });
    }
    const copy: Record<string, string | string[]> = {};
    for (const field of FIELDS) {
      if (field === "tags") {
        copy.tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map((value) => String(value).slice(0, 50)) : [];
      } else {
        copy[field] = typeof parsed[field] === "string" ? (parsed[field] as string).slice(0, 6000) : "";
      }
    }
    return NextResponse.json({ copy });
  } catch (error) {
    console.error("Store AI failed", error);
    return NextResponse.json({ error: "Could not generate AI content. Please try again." }, { status: 500 });
  }
}
