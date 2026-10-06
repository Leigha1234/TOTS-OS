import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeDestination(destination: string, request: NextRequest) {
  const trimmed = destination.trim();

  if (trimmed.startsWith("/")) {
    return new URL(trimmed, request.nextUrl.origin);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null;
  }

  return parsed;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();

    if (!cleanSlug) {
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    const supabase = getAdminClient();

    const { data: qr, error } = await supabase
      .from("store_qr_codes")
      .select("id, organisation_id, destination_url, is_active, track_scans")
      .ilike("slug", cleanSlug)
      .maybeSingle();

    if (error) {
      console.error("QR lookup failed:", error);
      return new NextResponse("QR code could not be resolved.", { status: 500 });
    }

    if (!qr || !qr.is_active) {
      return new NextResponse("This QR code is no longer active.", { status: 404 });
    }

    const destination = safeDestination(qr.destination_url, request);

    if (!destination) {
      return new NextResponse("This QR code has an invalid destination.", { status: 500 });
    }

    if (qr.track_scans) {
      const userAgent = request.headers.get("user-agent");
      const referrer = request.headers.get("referer");

      const { error: scanError } = await supabase.from("store_qr_scans").insert({
        qr_code_id: qr.id,
        organisation_id: qr.organisation_id,
        referrer: referrer || null,
        user_agent: userAgent || null,
        metadata: {},
      });

      // A tracking failure must never stop a customer reaching the shop.
      if (scanError) {
        console.error("QR scan tracking failed:", scanError);
      }
    }

    return NextResponse.redirect(destination, 302);
  } catch (error) {
    console.error("QR redirect error:", error);
    return new NextResponse("Unable to open this QR code.", { status: 500 });
  }
}
