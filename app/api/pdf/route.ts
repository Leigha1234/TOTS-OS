import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Invoice ID", { status: 400 });
  }

  // Fetch data from Supabase
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return new NextResponse("Invoice not found or database error", { status: 404 });
  }

  // Return raw JSON for now to verify the connection is working
  return NextResponse.json({
    message: "Connection successful",
    invoice_id: invoice.id,
    amount: invoice.amount,
    customer_name: (invoice.customers as any)?.name || "N/A"
  });
}