import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientKey || !appUrl) {
      return NextResponse.json(
        {
          error: "Missing TikTok OAuth parameters",
          missing: {
            TIKTOK_CLIENT_KEY: !clientKey,
            NEXT_PUBLIC_APP_URL: !appUrl,
          },
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);

    let state = searchParams.get("state");

    if (!state) {
      state = crypto.randomUUID();
    }

    const redirectUri = `${appUrl}/api/oauth/tiktok/callback`;

    const scopes = [
      "user.info.basic",
      "video.upload",
      "video.publish",
    ].join(",");

    const oauthUrl = new URL(
      "https://www.tiktok.com/v2/auth/authorize/"
    );

    oauthUrl.searchParams.set(
      "client_key",
      clientKey
    );

    oauthUrl.searchParams.set(
      "response_type",
      "code"
    );

    oauthUrl.searchParams.set(
      "scope",
      scopes
    );

    oauthUrl.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    oauthUrl.searchParams.set(
      "state",
      state
    );

    return NextResponse.redirect(oauthUrl.toString());

  } catch (error) {
    console.error(
      "TikTok OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to start TikTok OAuth",
      },
      {
        status: 500,
      }
    );
  }
}