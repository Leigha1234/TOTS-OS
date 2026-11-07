import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.firstName || "").trim().slice(0, 80);
    const businessName = String(body.businessName || "").trim().slice(0, 120);
    const source = String(body.source || "website").trim().slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (body.consent !== true) return NextResponse.json({ error: "Please agree to receive ORBI. launch emails." }, { status: 400 });
    if (body.website) return NextResponse.json({ ok: true }); // honeypot
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase configuration missing");
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await db.from("orbi_waitlist").insert({ email, first_name: firstName || null, business_name: businessName || null, source });
    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ORBI WAITLIST] Signup error", error);
    return NextResponse.json({ error: "Couldn't save your details. Please try again." }, { status: 500 });
  }
}
