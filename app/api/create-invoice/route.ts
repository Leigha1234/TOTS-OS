import { NextResponse } from "next/server";
import { getBranding } from "@/lib/getBranding";
import { createClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = await createClient();

  const { teamId, customerId, note } = body;

  // 🎨 GET BRANDING
  const branding = await getBranding(teamId);

  // 💾 CREATE INVOICE
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      team_id: teamId,
      customer_id: customerId,
      amount: 0,
      status: "draft",

      // 👇 embed branding snapshot
      logo: branding.logo,
      primary_color: branding.primaryColor,
      font: branding.font,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice: data });
}