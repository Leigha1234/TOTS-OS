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

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`;

    if (!clientId || !process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "LinkedIn OAuth environment variables are missing" },
        { status: 500 }
      );
    }

    const scopes = [
      "openid",
      "profile",
      "email",
      "w_member_social",
    ].join(" ");

    const oauthUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");

    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("scope", scopes);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("LinkedIn OAuth start error:", error);

    return NextResponse.json(
      { error: "Unable to start LinkedIn OAuth" },
      { status: 500 }
    );
  }
}
