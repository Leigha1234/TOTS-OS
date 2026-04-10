import { NextResponse } from "next/server";
import { getBranding } from "@/lib/getBranding";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const { teamId, customerId, note } = body;

  // 🎨 GET BRANDING
  const branding = await getBranding(teamId);

  // 💾 CREATE INVOICE
  const { data } = await supabase
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

  return NextResponse.json({ invoice: data });
}