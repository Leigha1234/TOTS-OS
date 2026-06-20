import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user.id
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.json({ error: "TikTok OAuth failed" }, { status: 400 });
  }

  const userId = state;


  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_ID!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.data?.access_token) {
      return Response.json(
        { error: "No TikTok token", details: tokenData },
        { status: 400 }
      );
    }

    const accessToken = tokenData.data.access_token;

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

    // 3. Store in Supabase
    await (supabaseAdmin as any)
      .from("social_accounts")
      .upsert(
        {
          user_id: userId,
          platform: "tiktok",
          access_token: accessToken,
          refresh_token: tokenData.data.refresh_token || null,
          platform_user_id: profile?.open_id,
          platform_username: profile?.display_name,
          expires_at: new Date(
            Date.now() + tokenData.data.expires_in * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    // 4. Redirect back
    return Response.redirect(
      `${process.env.APP_URL}/settings?connected=tiktok`
    );
  } catch (err: any) {
    return Response.json(
      { error: "TikTok callback error", details: String(err) },
      { status: 500 }
    );
  }
}