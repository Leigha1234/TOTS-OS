import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: server-only key
);

export async function POST(req: Request) {
  try {
    const { code, state } = await req.json();

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    const parsedState = JSON.parse(decodeURIComponent(state));
    const { userId, platform } = parsedState;

    if (!userId || !platform) {
      return NextResponse.json(
        { error: "Invalid state payload" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 1. Exchange code for short-lived token
    // -----------------------------------------
    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?client_id=${process.env.NEXT_PUBLIC_META_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(
          `${process.env.NEXT_PUBLIC_SITE_URL}/settings`
        )}` +
        `&client_secret=${process.env.META_CLIENT_SECRET}` +
        `&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to get access token", details: tokenData },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 2. Exchange for long-lived token
    // -----------------------------------------
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${process.env.NEXT_PUBLIC_META_CLIENT_ID}` +
        `&client_secret=${process.env.META_CLIENT_SECRET}` +
        `&fb_exchange_token=${tokenData.access_token}`
    );

    const longTokenData = await longTokenRes.json();

    const accessToken =
      longTokenData.access_token || tokenData.access_token;

    // -----------------------------------------
    // 3. Fetch Facebook Pages
    // -----------------------------------------
    const pagesRes = await fetch(
      `https://graph.facebook.com/v23.0/me/accounts?access_token=${accessToken}`
    );

    const pagesData = await pagesRes.json();

    if (!pagesData?.data) {
      return NextResponse.json(
        { error: "Failed to fetch pages", details: pagesData },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 4. Store in Supabase
    // -----------------------------------------
    const inserts = pagesData.data.map((page: any) => ({
      user_id: userId,
      platform: "meta",
      page_id: page.id,
      page_name: page.name,
      page_access_token: page.access_token,
      access_token: accessToken,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("social_accounts")
      .upsert(inserts, { onConflict: "user_id,platform,page_id" });

    if (error) {
      return NextResponse.json(
        { error: "Supabase insert failed", details: error.message },
        { status: 500 }
      );
    }

    // -----------------------------------------
    // 5. Success response
    // -----------------------------------------
    return NextResponse.json({
      success: true,
      pages: pagesData.data.length,
    });
  } catch (err: any) {
    console.error("OAuth exchange error:", err);

    return NextResponse.json(
      {
        error: "OAuth exchange failed",
        message: err.message,
      },
      { status: 500 }
    );
  }
}