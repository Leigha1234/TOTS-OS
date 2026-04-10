import { supabaseAdmin } from "@/lib/supabase-admin";
import { runClarity } from "@/lib/clarity";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { teamId, context } = await req.json();

    const { data: invoices } = await supabaseAdmin.from("invoices").select("*").eq("team_id", teamId);
    const { data: tasks } = await supabaseAdmin.from("tasks").select("*").eq("team_id", teamId);

    const result = await runClarity({
      invoices: invoices || [],
      tasks: tasks || [],
      teamId: teamId,
      context: context // e.g. "finance", "tasks", "dashboard"
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed to run Clarity" }, { status: 500 });
  }
}