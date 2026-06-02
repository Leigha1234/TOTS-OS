import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing Invoice ID", { status: 400 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, customers(*)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return new NextResponse("Invoice not found or database error", { status: 404 });
  }

  return NextResponse.json({
    message: "Connection successful",
    invoice_id: invoice.id,
    amount: invoice.amount,
    customer_name: (invoice as any)?.customers?.name || "N/A"
  });
}