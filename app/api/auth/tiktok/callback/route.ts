import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.tots-os.co.uk";

  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription =
      searchParams.get("error_description");

    // User rejected TikTok permissions
    if (error) {
      console.error("TikTok OAuth rejected:", {
        error,
        errorDescription,
      });

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed`
      );
    }

    if (!code || !state) {
      console.error(
        "Missing TikTok OAuth callback parameters"
      );

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=missing_parameters`
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret =
      process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI ||
      `${appUrl}/api/auth/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      console.error(
        "Missing TikTok environment variables"
      );

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=config`
      );
    }

    /**
     * Exchange authorization code for tokens
     */
    const tokenResponse = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData =
      await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error(
        "TikTok token exchange failed:",
        tokenData
      );

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=token_exchange`
      );
    }

    const accessToken =
      tokenData.access_token;

    const refreshToken =
      tokenData.refresh_token || null;

    /**
     * Get TikTok user information
     */
    const profileResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profileData =
      await profileResponse.json();

    if (
      !profileResponse.ok ||
      !profileData.data?.user
    ) {
      console.error(
        "TikTok profile request failed:",
        profileData
      );

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=profile`
      );
    }

    const profile =
      profileData.data.user;

    /**
     * Save connection
     */
    const supabase = await createServerSupabaseClient();

    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: state,
          platform: "tiktok",
          access_token: accessToken,
          refresh_token: refreshToken,
          platform_user_id: profile.open_id,
          expires_at: new Date(
            Date.now() +
              tokenData.expires_in * 1000
          ).toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (dbError) {
      console.error(
        "TikTok Supabase save failed:",
        dbError
      );

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=database`
      );
    }

    console.log(
      "TikTok connected successfully:",
      profile.open_id
    );

    return NextResponse.redirect(
      `${appUrl}/settings?connected=tiktok`
    );

  } catch (error) {
    console.error(
      "TikTok callback error:",
      error
    );

    return NextResponse.redirect(
      `${appUrl}/settings?oauth=tiktok_failed`
    );
  }
}