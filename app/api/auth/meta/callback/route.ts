import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.json({ error: "No code" });

  // 1. Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${process.env.META_CLIENT_ID}` +
      `&redirect_uri=${process.env.META_REDIRECT}` +
      `&client_secret=${process.env.META_CLIENT_SECRET}` +
      `&code=${code}`
  );

  const tokenData = await tokenRes.json();

  // 2. Get user pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`
  );

  const pages = await pagesRes.json();

  const page = pages.data?.[0];

  // 3. Save to DB
  await supabase.from("social_accounts").insert({
    platform: "meta",
    access_token: page?.access_token || tokenData.access_token,
    platform_user_id: page?.id,
    expires_at: null
  });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/social`);
}