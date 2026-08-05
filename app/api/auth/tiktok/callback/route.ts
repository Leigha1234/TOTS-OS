import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user.id
const error = url.searchParams.get("error");
const errorDescription = url.searchParams.get("error_description");

if (error) {
  return Response.json(
    {
      error,
      details: errorDescription,
    },
    { status: 400 }
  );
}

if (!code || !state) {
  return Response.json(
    {
      error: "Missing TikTok OAuth parameters",
    },
    { status: 400 }
  );
}


  try {
    if (
  !process.env.TIKTOK_CLIENT_KEY ||
  !process.env.TIKTOK_CLIENT_SECRET ||
  !process.env.TIKTOK_REDIRECT_URI
) {
  return Response.json(
    {
      error: "Missing TikTok environment variables",
    },
    { status: 500 }
  );
}
    // 1. Exchange code for access token
    const tokenRes = await fetch(
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
  redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
}),
      }
    );

    const tokenData = await tokenRes.json();

   if (!tokenRes.ok || !tokenData.access_token) {

  console.error("TikTok token exchange failed:", tokenData);

  return Response.json(
    {
      error: "No TikTok token",
      details: tokenData
    },
    { status: 400 }
  );
}

    const accessToken = tokenData.access_token;

    // 2. Get TikTok user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: ["open_id", "display_name", "avatar_url"],
        }),
      }
    );

    const userData = await userRes.json();

    const profile = userData?.data?.user;
if (!profile?.open_id) {
  return Response.json(
    {
      error: "TikTok profile lookup failed",
      details: userData,
    },
    { status: 400 }
  );
}
 const { error: dbError } = await (supabaseAdmin as any)
  .from("social_accounts")
  .upsert(
    {
      user_id: state,
      platform: "tiktok",
      access_token: accessToken,
      refresh_token: tokenData.refresh_token || null,
      platform_user_id: profile.open_id,
      platform_username: profile.display_name || null,
      expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,platform",
    }
  );

if (dbError) {
  console.error("TikTok Supabase error:", dbError);

  return Response.json(
    {
      error: "Failed saving TikTok connection",
      details: dbError,
    },
    { status: 500 }
  );
}

    // 4. Redirect back
    return Response.redirect(
      `${process.env.APP_URL || "https://www.tots-os.co.uk"}/settings?connected=tiktok`
    );
  } catch (err: any) {
    return Response.json(
      { error: "TikTok callback error", details: String(err) },
      { status: 500 }
    );
  }
}