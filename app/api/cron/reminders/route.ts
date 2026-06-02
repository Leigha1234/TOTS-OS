import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type Invoice = {
  id: string;
  created_at: string;
  email?: string;
  customer_email?: string;
  status: string;
};

export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!resendKey || !supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: "Missing required environment variables" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Only fetch unpaid invoices (limit to avoid large cron runs)
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("status", "unpaid")
      .limit(100);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const invoices: Invoice[] = data ?? [];

    let remindedCount = 0;
    let overdueCount = 0;
    let emailSentCount = 0;

    for (const inv of invoices) {
      try {
        const ageDays =
          (Date.now() - new Date(inv.created_at).getTime()) /
          (1000 * 60 * 60 * 24);

        const email = inv.email || inv.customer_email;

        // Send reminder after 3 days
        if (ageDays > 3 && email) {
          try {
            await resend.emails.send({
              from: "TOTS OS <noreply@yourdomain.com>",
              to: email,
              subject: "Invoice Reminder",
              html: `
                <div>
                  <p>Your invoice <strong>${inv.id}</strong> is still unpaid.</p>
                  <p>Please log in to complete payment.</p>
                </div>
              `,
            });

            emailSentCount++;
            remindedCount++;
          } catch (err) {
            console.error("Email send failed for invoice:", inv.id, err);
          }
        }

        // Mark overdue after 7 days
        if (ageDays > 7) {
          const { error: updateError } = await supabase
            .from("invoices")
            .update({
              status: "overdue",
              updated_at: new Date().toISOString(),
            })
            .eq("id", inv.id);

          if (!updateError) {
            overdueCount++;
          } else {
            console.error(
              "Failed to mark overdue invoice:",
              inv.id,
              updateError
            );
          }
        }
      } catch (err) {
        console.error("Invoice processing failed:", inv.id, err);
      }
    }

    return Response.json({
      ok: true,
      processed: invoices.length,
      remindersSent: remindedCount,
      emailsSent: emailSentCount,
      overdueMarked: overdueCount,
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}