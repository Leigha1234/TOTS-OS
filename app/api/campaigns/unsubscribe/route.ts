import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCampaignUnsubscribeToken } from "@/lib/campaign-unsubscribe-token";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function html(message: string) {
  const responseHtml = [
    "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Unsubscribed</title></head><body style=\"font-family:Arial,sans-serif;background:#faf9f6;color:#1c1917;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;\"><div style=\"max-width:560px;background:#fff;border:1px solid #e7e5e4;border-radius:24px;padding:32px;text-align:center;\"><h1 style=\"margin:0 0 12px;font-size:24px;\">",
    message,
    "</h1><p style=\"margin:0;color:#78716c;\">You will no longer receive emails from this list.</p></div></body></html>",
  ].join("");

  return new NextResponse(responseHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyCampaignUnsubscribeToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  if (payload.source === "profile") {
    await supabaseAdmin
      .from("profiles")
      .update({ is_subscribed: false })
      .eq("id", payload.recipientId)
      .eq("email", payload.email);

    await supabaseAdmin
      .from("profile_subscriber_lists")
      .delete()
      .eq("profile_id", payload.recipientId)
      .eq("list_id", payload.listId);
  } else {
    await supabaseAdmin
      .from("campaign_list_emails")
      .delete()
      .eq("list_id", payload.listId)
      .eq("email", payload.email)
      .eq("organisation_id", payload.organisationId);
  }

  return html("You have been unsubscribed");
}