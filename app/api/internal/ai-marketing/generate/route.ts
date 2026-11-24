import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = process.env.OPENAI_API_KEY;
  const allowed = (process.env.ORBI_AI_MARKETING_ALLOWED_EMAILS || "")
    .split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!url || !anon || !key || !allowed.length) return NextResponse.json({ error: "Marketing engine is not configured." }, { status: 503 });
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user?.email_confirmed_at || !allowed.includes((user.email || "").toLowerCase())) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  let input: any;
  try { input = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const business = String(input.business || "").trim().slice(0, 100);
  const goal = String(input.goal || "").trim().slice(0, 1200);
  const channel = String(input.channel || "").trim().slice(0, 50);
  const tone = String(input.tone || "").trim().slice(0, 50);
  if (!business || !goal || !["Email", "Social", "Meta Ads"].includes(channel)) return NextResponse.json({ error: "Enter a business, goal and channel." }, { status: 400 });
  try {
    const ai = new OpenAI({ apiKey: key });
    const result = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are ORBI's marketing copywriter. Draft only, never claim a campaign has been published or sent. Avoid invented offers, pricing, testimonials and results. Return useful plain text with headings: Campaign title, Audience, Key message, Copy, CTA, Suggested next steps. For email include subject and preview. For Meta Ads include primary text and headline. Respect marketing consent and ad platform policies." },
        { role: "user", content: `Business: ${business}\nChannel: ${channel}\nTone: ${tone}\nCampaign brief: ${goal}` },
      ],
    });
    return NextResponse.json({ draft: result.choices[0]?.message?.content || "No draft returned." }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("ORBI marketing generation failed", e);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
  }
}
