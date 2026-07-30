

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Meta OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.META_REDIRECT_URI?.replace("/api/oauth/meta/callback", "")}/settings?oauth=failed`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing OAuth code or state" },
        { status: 400 }
      );
    }

    const exchangeUrl = new URL(
      `${process.env.META_REDIRECT_URI?.replace("/api/oauth/meta/callback", "")}/api/oauth/exchange`
    );

    exchangeUrl.searchParams.set("code", code);
    exchangeUrl.searchParams.set("state", state);
    exchangeUrl.searchParams.set("platform", "meta");

    const response = await fetch(exchangeUrl.toString());

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      console.error("Meta token exchange failed:", data);

      return NextResponse.redirect(
        `${process.env.META_REDIRECT_URI?.replace("/api/oauth/meta/callback", "")}/settings?oauth=failed`
      );
    }

    return NextResponse.redirect(
      `${process.env.META_REDIRECT_URI?.replace("/api/oauth/meta/callback", "")}/settings?oauth=success`
    );
  } catch (error) {
    console.error("Meta OAuth callback error:", error);

    return NextResponse.redirect(
      `${process.env.META_REDIRECT_URI?.replace("/api/oauth/meta/callback", "")}/settings?oauth=failed`
    );
  }
}