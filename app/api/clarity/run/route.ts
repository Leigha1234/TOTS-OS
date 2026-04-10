import { supabaseAdmin } from "@/lib/supabase-admin";
import { runClarity } from "@/lib/clarity";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: invoices } = await supabaseAdmin.from("invoices").select("*");
  const { data: tasks } = await supabaseAdmin.from("tasks").select("*");

  await runClarity({
    invoices: invoices || [],
    tasks: tasks || [],
    teamId: "system",
  });

  return NextResponse.json({ success: true });
}