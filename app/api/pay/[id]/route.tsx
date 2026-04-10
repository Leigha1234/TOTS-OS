import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Next.js 16+ Dynamic Route Configuration
 * The 'params' object must be awaited as it is a Promise.
 */

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  // Extract and await the params from the context
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

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
    console.error("Payment API Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}