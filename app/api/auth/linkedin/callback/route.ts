import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user.id
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.json({ error: "LinkedIn OAuth failed" }, { status: 400 });
  }

  const userId = state;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return Response.json(
        { error: "No LinkedIn token", details: tokenData },
        { status: 400 }
      );
    }

    // 2. Get profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileRes.json();

    // 3. Store in Supabase
    await supabase.from("social_accounts").upsert({
      user_id: userId,
      platform: "linkedin",
      access_token: tokenData.access_token,
      refresh_token: null,
      platform_user_id: profile.id,
      platform_username:
        profile.localizedFirstName + " " + profile.localizedLastName,
      expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 4. Redirect back
    return Response.redirect(
      `${process.env.APP_URL}/settings?connected=linkedin`
    );
  } catch (err: any) {
    return Response.json(
      { error: "LinkedIn callback error", details: String(err) },
      { status: 500 }
    );
  }
}