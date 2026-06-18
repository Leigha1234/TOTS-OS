import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1x1 transparent tracking pixel
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X0kQAAAAASUVORK5CYII=",
  "base64"
);

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

    // log open event
    const userAgent = req.headers.get("user-agent") || null;

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;

    await supabaseAdmin.from("campaign_opens").insert({
      campaign_id: campaignId,
      profile_id: profileId,
      user_agent: userAgent,
      ip: ip
    });

    // update aggregate counter
    await supabaseAdmin.rpc("increment_campaign_open", {
      campaign_id_input: campaignId
    });

    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  } catch (err) {
    console.error("open tracking error:", err);

    // still return pixel so emails don't break
    return new NextResponse(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      }
    });
  }
}
