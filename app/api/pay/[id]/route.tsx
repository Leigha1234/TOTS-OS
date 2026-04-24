import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// We define a 'Context' to tell TypeScript that params is a Promise
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  // This is the 'await' part—we wait for the ID to be ready
  const { id } = await context.params;

  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}