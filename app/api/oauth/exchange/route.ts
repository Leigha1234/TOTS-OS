import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exchangeOAuth(
  code: string,
  state: string,
  platformOverride?: string
) {
  try {
    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    let parsedState;

    try {
      parsedState = JSON.parse(decodeURIComponent(state));
    } catch {
      return NextResponse.json(
        { error: "Invalid OAuth state" },
        { status: 400 }
      );
    }

    const userId = parsedState.userId;
    const platform = platformOverride || parsedState.platform;

    if (!userId || !platform) {
      return NextResponse.json(
        { error: "Invalid OAuth state payload" },
        { status: 400 }
      );
    }

    let accountData: any[] = [];

    if (platform === "meta" || platform === "instagram") {
      const tokenResponse = await fetch(
        "https://graph.facebook.com/v23.0/oauth/access_token?" +
          new URLSearchParams({
            client_id: process.env.META_APP_ID!,
            client_secret: process.env.META_APP_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`,
            code,
          })
      );

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return NextResponse.json(
          { error: "Meta token exchange failed", details: tokenData },
          { status: 500 }
        );
      }

      const pagesResponse = await fetch(
        `https://graph.facebook.com/v23.0/me/accounts?access_token=${tokenData.access_token}`
      );

      const pagesData = await pagesResponse.json();

      accountData = (pagesData.data || []).map((page: any) => ({
        user_id: userId,
        platform: "meta",
        platform_user_id: page.id,
        access_token: page.access_token || tokenData.access_token,
        created_at: new Date().toISOString(),
      }));
    }

    if (platform === "linkedin") {
      const tokenResponse = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return NextResponse.json(
          { error: "LinkedIn token exchange failed", details: tokenData },
          { status: 500 }
        );
      }

      const profileResponse = await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const profile = await profileResponse.json();

      accountData = [
        {
          user_id: userId,
          platform: "linkedin",
          platform_user_id: profile.sub,
          access_token: tokenData.access_token,
          expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          created_at: new Date().toISOString(),
        },
      ];
    }

    if (platform === "tiktok") {
      const tokenResponse = await fetch(
        "https://open.tiktokapis.com/v2/oauth/token/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_key: process.env.TIKTOK_CLIENT_KEY!,
            client_secret: process.env.TIKTOK_CLIENT_SECRET!,
            code,
            grant_type: "authorization_code",
            redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return NextResponse.json(
          { error: "TikTok token exchange failed", details: tokenData },
          { status: 500 }
        );
      }

      const userResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const userData = await userResponse.json();
      const user = userData.data?.user;

      accountData = [
        {
          user_id: userId,
          platform: "tiktok",
          platform_user_id: user?.open_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          created_at: new Date().toISOString(),
        },
      ];
    }

    if (!accountData.length) {
      return NextResponse.json(
        { error: "No account data returned" },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from("social_accounts")
      .upsert(accountData, { onConflict: "user_id,platform" });

    if (error) {
      console.error("Social account save error:", error);
      return NextResponse.json(
        { error: "Database save failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform,
    });
  } catch (error: any) {
    console.error("OAuth exchange error:", error);

    return NextResponse.json(
      { error: "OAuth exchange failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  return exchangeOAuth(body.code, body.state, body.platform);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  return exchangeOAuth(
    searchParams.get("code") || "",
    searchParams.get("state") || "",
    searchParams.get("platform") || undefined
  );
}