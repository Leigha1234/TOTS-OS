

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json(
        { error: "Missing OAuth state" },
        { status: 400 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`;

    if (!clientKey || !process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "TikTok OAuth environment variables are missing" },
        { status: 500 }
      );
    }

    const scopes = [
      "user.info.basic",
      "video.upload",
      "video.publish",
    ].join(",");

    const oauthUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");

    oauthUrl.searchParams.set("client_key", clientKey);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("state", state);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("TikTok OAuth start error:", error);

    return NextResponse.json(
      { error: "Unable to start TikTok OAuth" },
      { status: 500 }
    );
  }
}