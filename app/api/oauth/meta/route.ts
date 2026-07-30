

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

    const appId = process.env.META_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`;

    if (!appId || !process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "Meta OAuth environment variables are missing" },
        { status: 500 }
      );
    }

    const permissions = [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
      "pages_read_user_content",
      "instagram_basic",
      "instagram_content_publish",
      "business_management",
    ].join(",");

    const oauthUrl = new URL("https://www.facebook.com/v20.0/dialog/oauth");

    oauthUrl.searchParams.set("client_id", appId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("scope", permissions);
    oauthUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("Meta OAuth start error:", error);

    return NextResponse.json(
      { error: "Unable to start Meta OAuth" },
      { status: 500 }
    );
  }
}