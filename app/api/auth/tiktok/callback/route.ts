import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_ID!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code: code!,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT!,
    }),
  });

  const token = await tokenRes.json();

  await supabase.from("social_accounts").insert({
    platform: "tiktok",
    access_token: token.access_token,
    refresh_token: token.refresh_token
  });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/social`);
}