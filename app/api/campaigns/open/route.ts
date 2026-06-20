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
        .from("campaigns_open")
        .insert({
          campaign_id: campaignId,
          profile_id: profileId || null,
          user_agent: userAgent,
          ip: ip
        });
    } catch (e) {
      console.error("campaigns_open insert error:", e);
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
