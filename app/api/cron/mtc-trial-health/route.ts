import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const org = process.env.TOTS_MTC_ORGANISATION_ID;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !org || !dbUrl || !dbKey) {
    return NextResponse.json(
      { error: "Missing configuration" },
      { status: 503 }
    );
  }

  const bearer =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!same(bearer, secret)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const db = createClient(dbUrl, dbKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("mtc_trial_email_deliveries")
    .select("id,email_step,status,updated_at")
    .eq("organisation_id", org)
    .eq("status", "sending")
    .lt("updated_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      healthy: (data ?? []).length === 0,
      stuck_sending_count: (data ?? []).length,
      records: data ?? [],
      read_only: true,
      truncated: (data ?? []).length === 100,
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
