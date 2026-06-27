import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const campaignId = url.searchParams.get("campaignId");
    const profileId = url.searchParams.get("profileId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaignId" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || null;

    const ipRaw =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";

    const ip = ipRaw.split(",")[0].trim() || null;

    // log open event (best effort)
    try {
      await (supabaseAdmin as any)
        .from("campaign_opens")
        .insert({
          campaign_id: campaignId,
          profile_id: profileId || null,
          user_agent: userAgent,
          ip: ip
        });

      // Keep denormalized counter on campaigns in sync for fast UI reads.
      const { count } = await (supabaseAdmin as any)
        .from("campaign_opens")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId);

      await (supabaseAdmin as any)
        .from("campaigns")
        .update({ open_count: count || 0 })
        .eq("id", campaignId);
    } catch (e) {
      console.error("campaign_opens insert/update error:", e);
    }

    const pixel = Buffer.from(
      "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (err) {
    console.error("open tracking error:", err);

    const pixel = Buffer.from(
      "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store"
      }
    });
  }
}
