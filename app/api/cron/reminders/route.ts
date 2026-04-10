import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("status", "unpaid");

  for (const inv of data || []) {
    const age =
      (Date.now() - new Date(inv.created_at).getTime()) /
      (1000 * 60 * 60 * 24);

    if (age > 3) {
      console.log("REMINDER:", inv.id);

      // send email here
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