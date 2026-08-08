import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const appUrl =
    process.env.TIKTOK_POST_AUTH_REDIRECT ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.tots-os.co.uk";

  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // TikTok can return the scopes granted by the user here
    const grantedScopesFromCallback =
      searchParams.get("scopes") ||
      searchParams.get("scope");

    console.log("TIKTOK CALLBACK GRANTED SCOPES:", {
      grantedScopesFromCallback,
    });

    let userId: string | null = null;

    if (state) {
      try {
        const parsedState = JSON.parse(state);

        userId =
          typeof parsedState?.userId === "string"
            ? parsedState.userId
            : null;
      } catch {
        // Backwards compatibility if state is just the raw UUID
        userId = state;
      }
    }

    // --------------------------------------------------
    // USER REJECTED / TIKTOK RETURNED ERROR
    // --------------------------------------------------

    if (error) {
      console.error("TikTok OAuth rejected:", {
        error,
        errorDescription,
        grantedScopesFromCallback,
      });

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=rejected`
      );
    }

    // --------------------------------------------------
    // VALIDATE CALLBACK PARAMETERS
    // --------------------------------------------------

    if (!code || !state || !userId) {
      console.error("Missing TikTok OAuth callback parameters", {
        hasCode: Boolean(code),
        hasState: Boolean(state),
        hasUserId: Boolean(userId),
        grantedScopesFromCallback,
      });

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=missing_parameters`
      );
    }

    // --------------------------------------------------
    // ENVIRONMENT VARIABLES
    // --------------------------------------------------

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;

    if (!clientKey || !clientSecret || !redirectUri) {
      console.error("Missing TikTok environment variables", {
        TIKTOK_CLIENT_KEY: Boolean(clientKey),
        TIKTOK_CLIENT_SECRET: Boolean(clientSecret),
        TIKTOK_REDIRECT_URI: Boolean(redirectUri),
      });

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=config`
      );
    }

    // --------------------------------------------------
    // EXCHANGE CODE FOR ACCESS TOKEN
    // --------------------------------------------------

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

    const tokenData = await tokenResponse.json();

    console.log("TIKTOK TOKEN RESPONSE:", {
      tokenResponseOk: tokenResponse.ok,
      tokenResponseStatus: tokenResponse.status,
      scope: tokenData?.scope,
      accessTokenReceived: Boolean(tokenData?.access_token),
      refreshTokenReceived: Boolean(tokenData?.refresh_token),
      expiresIn: tokenData?.expires_in,
      refreshExpiresIn: tokenData?.refresh_expires_in,
      openId: tokenData?.open_id,
      tokenType: tokenData?.token_type,
      error: tokenData?.error,
      errorDescription: tokenData?.error_description,
    });

    if (!tokenResponse.ok || !tokenData?.access_token) {
      console.error("TikTok token exchange failed:", tokenData);

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=token_exchange`
      );
    }

    const accessToken = tokenData.access_token as string;

    const refreshToken =
      typeof tokenData.refresh_token === "string"
        ? tokenData.refresh_token
        : null;

    const expiresIn =
      typeof tokenData.expires_in === "number"
        ? tokenData.expires_in
        : null;

    const tokenScope =
      typeof tokenData.scope === "string"
        ? tokenData.scope
        : null;

    // --------------------------------------------------
    // DEBUG EXACT GRANTED SCOPES
    // --------------------------------------------------

    console.log("TIKTOK FINAL GRANTED SCOPE CHECK:", {
      requestedExpectedScopes: [
        "user.info.basic",
        "video.publish",
        "video.upload",
      ],
      callbackScopes: grantedScopesFromCallback,
      tokenScopes: tokenScope,
      hasBasicScope:
        tokenScope?.includes("user.info.basic") ?? false,
      hasPublishScope:
        tokenScope?.includes("video.publish") ?? false,
      hasUploadScope:
        tokenScope?.includes("video.upload") ?? false,
    });

    // --------------------------------------------------
    // GET BASIC TIKTOK PROFILE
    // --------------------------------------------------

    const profileResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profileData = await profileResponse.json();

    if (!profileResponse.ok || !profileData?.data?.user) {
      console.error("TikTok profile request failed:", profileData);

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=profile`
      );
    }

    const profile = profileData.data.user;

    // --------------------------------------------------
    // SAVE CONNECTION
    // --------------------------------------------------

    const supabase = await createServerSupabaseClient();

    const connectionData: Record<string, any> = {
      user_id: userId,
      platform: "tiktok",
      access_token: accessToken,
      refresh_token: refreshToken,
      platform_user_id: profile.open_id,
      expires_at: expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    // Only keep these if the columns exist in social_accounts
    if (profile.display_name) {
      connectionData.display_name = profile.display_name;
    }

    if (profile.avatar_url) {
      connectionData.avatar_url = profile.avatar_url;
    }

    /*
     * OPTIONAL:
     *
     * If your social_accounts table has a scope/scopes column,
     * you can save the granted scopes too.
     *
     * For example:
     *
     * connectionData.scopes =
     *   tokenScope ||
     *   grantedScopesFromCallback ||
     *   null;
     *
     * Do NOT uncomment this unless that column exists.
     */

    const { error: dbError } = await supabase
      .from("social_accounts")
      .upsert(connectionData, {
        onConflict: "user_id,platform",
      });

    if (dbError) {
      console.error("TikTok Supabase save failed:", dbError);

      return NextResponse.redirect(
        `${appUrl}/settings?oauth=tiktok_failed&reason=database`
      );
    }

    console.log("TikTok connected successfully:", {
      userId,
      platformUserId: profile.open_id,
      callbackScopes: grantedScopesFromCallback,
      tokenScopes: tokenScope,
      hasVideoPublish:
        tokenScope?.includes("video.publish") ?? false,
      hasVideoUpload:
        tokenScope?.includes("video.upload") ?? false,
    });

    // --------------------------------------------------
    // REDIRECT BACK TO SETTINGS
    // --------------------------------------------------

    return NextResponse.redirect(
      `${appUrl}/settings?connected=tiktok`
    );
  } catch (error) {
    console.error("TikTok callback error:", error);

    return NextResponse.redirect(
      `${appUrl}/settings?oauth=tiktok_failed&reason=unexpected`
    );
  }
}