import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.json({ error: "OAuth failed" }, { status: 400 });
  }

  const userId = state;


  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: process.env.META_CLIENT_ID!,
          client_secret: process.env.META_CLIENT_SECRET!,
          redirect_uri: process.env.META_REDIRECT_URI!,
          code,
        })
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return Response.json({ error: tokenData }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.META_CLIENT_ID!,
          client_secret: process.env.META_CLIENT_SECRET!,
          fb_exchange_token: shortLivedToken,
        })
    );

    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || shortLivedToken;

    // 3. Get Facebook user info
    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`
    );
    const me = await meRes.json();

    // 4. Get pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    const page = pagesData?.data?.[0];

    let pageAccessToken = null;
    let pageId = null;
    let instagramBusinessAccountId = null;

    if (page) {
      pageId = page.id;
      pageAccessToken = page.access_token;

      // 5. Get Instagram business account from page
      const igRes = await fetch(
        `https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const igData = await igRes.json();

      instagramBusinessAccountId =
        igData?.instagram_business_account?.id || null;
    }

    // 6. Store in Supabase
    await (supabaseAdmin as any)
      .from("social_accounts")
      .upsert({
        user_id: userId,
        platform: "meta",
        platform_user_id: me.id,
        platform_username: me.name,
        access_token: accessToken,
        page_id: pageId,
        page_access_token: pageAccessToken,
        instagram_business_account_id: instagramBusinessAccountId,
        expires_at: null,
        updated_at: new Date().toISOString(),
      });

    // 7. Redirect back to app
    return Response.redirect(
      `${process.env.APP_URL}/settings?connected=meta`
    );
  } catch (err) {
    return Response.json({ error: "Server error", details: err }, { status: 500 });
  }
}