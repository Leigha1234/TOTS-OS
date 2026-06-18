import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const campaignId = body?.campaignId;
    const url = body?.url;
    const profileId = body?.profileId ?? null;

    if (!campaignId || !url) {
      return NextResponse.json(
        { error: "Missing campaignId or url" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || null;

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;

    // 1. log click event (safe fail)
    try {
      await supabaseAdmin.from("campaign_clicks").insert({
        campaign_id: campaignId,
        profile_id: profileId,
        url,
        user_agent: userAgent,
        ip,
      });
    } catch (e) {
      console.error("campaign_clicks insert error:", e);
    }

    // 2. increment analytics counter (safe fail)
    try {
      await supabaseAdmin.rpc("increment_campaign_click", {
        campaign_id_input: campaignId,
      });
    } catch (e) {
      console.error("increment_campaign_click RPC error:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("click tracking error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}