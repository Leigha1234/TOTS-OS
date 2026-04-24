import { createClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "unpaid");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  for (const inv of data || []) {
    const age =
      (Date.now() - new Date(inv.created_at).getTime()) /
      (1000 * 60 * 60 * 24);

    if (age > 3) {
      console.log("REMINDER:", inv.id);
      // Logic for sending emails would go here
    }

    if (age > 7) {
      await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", inv.id);
    }
  }

  return Response.json({ ok: true });
}