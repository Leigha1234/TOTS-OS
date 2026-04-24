import { createClient } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("active", true);

  for (const sub of data || []) {
    if (new Date(sub.next_run) <= new Date()) {
      await supabase.from("invoices").insert({
        team_id: sub.team_id,
        client_name: sub.client_name,
        amount: sub.amount,
        status: "unpaid",
      });

      const next = new Date(sub.next_run);
      next.setMonth(next.getMonth() + 1);

      await supabase
        .from("subscriptions")
        .update({ next_run: next })
        .eq("id", sub.id);
    }
  }

  return Response.json({ success: true });
}