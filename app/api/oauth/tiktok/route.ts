import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // --------------------------------------------------
    // TIKTOK ENVIRONMENT VARIABLES
    // --------------------------------------------------

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;

    // --------------------------------------------------
    // VALIDATE REQUIRED ENVIRONMENT VARIABLES
    // --------------------------------------------------

    if (!clientKey || !redirectUri) {
      console.error("Missing TikTok OAuth parameters", {
        hasClientKey: Boolean(clientKey),
        hasRedirectUri: Boolean(redirectUri),
      });

      return NextResponse.json(
        {
          error: "Missing TikTok OAuth parameters",
          missing: {
            TIKTOK_CLIENT_KEY: !clientKey,
            TIKTOK_REDIRECT_URI: !redirectUri,
          },
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // GET / CREATE OAUTH STATE
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    let state = searchParams.get("state");

    if (!state) {
      state = crypto.randomUUID();
    }

    // --------------------------------------------------
    // TIKTOK SCOPES
    // --------------------------------------------------
    //
    // user.info.basic
    //   Required for basic TikTok account information.
    //
    // video.publish
    //   Required for Direct Post / publishing to TikTok.
    //
    // video.upload
    //   Required for TikTok video upload functionality.
    //
    // --------------------------------------------------

    const scopes = [
      "user.info.basic",
      "video.publish",
      "video.upload",
    ].join(",");

    // --------------------------------------------------
    // DEBUG LOG
    // --------------------------------------------------

    console.log("Starting TikTok OAuth", {
      redirectUri,
      scopes,
      hasClientKey: Boolean(clientKey),
      state,
    });

    // --------------------------------------------------
    // BUILD TIKTOK AUTHORISATION URL
    // --------------------------------------------------

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

    // --------------------------------------------------
    // DEBUG FINAL OAUTH REQUEST
    // --------------------------------------------------

    console.log("TikTok OAuth request", {
      clientKey,
      redirectUri,
      scopes,
      state,
      oauthUrl: oauthUrl.toString(),
    });

    // --------------------------------------------------
    // REDIRECT USER TO TIKTOK
    // --------------------------------------------------

    return NextResponse.redirect(
      oauthUrl.toString()
    );
  } catch (error) {
    console.error(
      "TikTok OAuth start error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to start TikTok OAuth",
        message:
          error instanceof Error
            ? error.message
            : "Unknown TikTok OAuth error",
      },
      {
        status: 500,
      }
    );
  }
}