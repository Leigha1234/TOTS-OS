import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user.id
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.json({ error: "OAuth failed" }, { status: 400 });
  }

  const userId = state;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Exchange code for token (META example)
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
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

  // 2. OPTIONAL: fetch pages / IG user info
  const meRes = await fetch(
    `https://graph.facebook.com/me?access_token=${tokenData.access_token}`
  );
  const me = await meRes.json();

  // 3. STORE IN SUPABASE
  await supabase.from("social_accounts").upsert({
    user_id: userId,
    platform: "meta",
    access_token: tokenData.access_token,
    refresh_token: null,
    platform_user_id: me.id,
    platform_username: me.name,
    expires_at: null,
    updated_at: new Date().toISOString(),
  });

  // 4. Redirect back to app
  return Response.redirect(`${process.env.APP_URL}/settings?connected=meta`);
}