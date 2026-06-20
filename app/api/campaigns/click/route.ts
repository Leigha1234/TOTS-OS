import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

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
      await (supabaseAdmin as any)
        .from("campaign_clicks")
        .insert({
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
      await (supabaseAdmin as any).rpc("increment_campaign_click", {
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