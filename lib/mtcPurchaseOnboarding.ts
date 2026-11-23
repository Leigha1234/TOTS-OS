import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const MTC_ORGANISATION_ID = "2c96d537-2be4-4917-8982-e7491300f15f";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Order = { id: string; organisation_id: string; order_number: string; payment_status: string; customer_email: string | null; customer_name: string | null };
type Item = { product_id: string | null; product_name: string; sku: string | null };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Transactional onboarding, once per paid MTC order. Never blocks Stripe fulfilment. */
export async function sendMtcPurchaseOnboardingSafely(orderId: string): Promise<void> {
  try {
    const { data: order, error: orderError } = await supabase.from("store_orders")
      .select("id,organisation_id,order_number,payment_status,customer_email,customer_name")
      .eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    const paidOrder = order as Order | null;
    if (!paidOrder || paidOrder.organisation_id !== MTC_ORGANISATION_ID || paidOrder.payment_status !== "paid") return;

    const { data: items, error: itemsError } = await supabase.from("store_order_items")
      .select("product_id,product_name,sku").eq("order_id", orderId);
    if (itemsError) throw itemsError;
    const lines = (items || []) as Item[];
    if (!lines.length) return;

    const productIds = [...new Set(lines.map(line => line.product_id).filter((id): id is string => Boolean(id)))];
    const { data: products, error: productsError } = productIds.length
      ? await supabase.from("store_products").select("id,external_system,external_plan_code").in("id", productIds)
      : { data: [], error: null };
    if (productsError) throw productsError;
    const integratedIds = new Set((products || []).filter(p => p.external_system === "mtc").map(p => p.id));
    const eligible = lines.filter(line =>
      (line.product_id && integratedIds.has(line.product_id)) ||
      /\b(hyrox|crossfit|mum.fit|course|class pack|session pack|walk.in|open gym|membership|credits?)\b/i.test(line.product_name)
    );
    if (!eligible.length) return;

    const email = paidOrder.customer_email?.trim().toLowerCase();
    if (!email) { console.warn("[MTC ONBOARDING] Missing customer email", orderId); return; }
    const appUrl = process.env.MTC_APP_URL;
    if (!appUrl || !/^https:\/\//i.test(appUrl)) throw new Error("MTC_APP_URL must be an HTTPS link to the MTC app");
    const from = process.env.MTC_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!from || !process.env.RESEND_API_KEY) throw new Error("Missing Resend configuration for MTC onboarding");

    const { data: claimed, error: claimError } = await supabase.rpc("claim_mtc_purchase_onboarding", { p_order_id: orderId });
    if (claimError) throw claimError;
    if (!claimed) return;

    try {
      const name = paidOrder.customer_name?.trim().split(/\s+/)[0] || "there";
      const names = eligible.map(line => line.product_name);
      const description = names.join(", ");
      const isCourse = names.some(value => /\bcourse\b/i.test(value));
      const isMembership = names.some(value => /\bmembership\b|\bunlimited\b|\b3pw\b/i.test(value));
      const intro = isCourse ? "Your course purchase is confirmed!" : isMembership ? "Your membership purchase is confirmed!" : "Your MTC purchase is confirmed!";
      const html = `<!doctype html><html><body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#151515"><div style="max-width:580px;margin:28px auto;background:#fff"><div style="background:#111;padding:30px;text-align:center"><strong style="color:#f5d323;font-size:28px;letter-spacing:2px">MORAY TRAINING CLUB</strong></div><div style="padding:34px"><h1 style="font-size:27px;margin:0 0 18px">You're in. Now get booking!</h1><p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(intro)} Thanks for choosing Moray Training Club.</p><p><strong>Your purchase:</strong> ${escapeHtml(description)}</p><p>Your next step is to open the MTC app and book your sessions. Use the same email address you used at checkout to sign in or create your account.</p><p>If you've purchased for a child or someone else, please follow the app's account and family setup instructions. Access and credits are subject to the relevant membership or course setup.</p><div style="text-align:center;margin:30px 0"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#f5d323;color:#111;text-decoration:none;padding:16px 28px;font-weight:bold;border-radius:4px">OPEN THE MTC APP →</a></div><p>Need help getting started? Speak to the team at the club.</p><p>See you soon!<br><strong>The MTC Team</strong></p></div><div style="background:#111;color:#eee;text-align:center;padding:18px;font-size:12px">Moray Training Club · So much more than a gym</div></div></body></html>`;
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from, to: email, subject: "Your MTC purchase is confirmed — let's get booking!",
        html,
        text: `Hi ${name},\n\n${intro}\nYour purchase: ${description}\n\nOpen the MTC app to book your sessions: ${appUrl}\nSign in or create an account with the email used at checkout. If you purchased for someone else, follow the family/account setup instructions.\n\nSee you soon!\nThe MTC Team`,
      });
      if (error) throw error;
      const { error: markError } = await supabase.from("mtc_purchase_onboarding_emails")
        .update({ status: "sent", sent_at: new Date().toISOString(), resend_id: data?.id || null, last_error: null })
        .eq("order_id", orderId).eq("status", "sending");
      if (markError) throw markError;
    } catch (error) {
      await supabase.from("mtc_purchase_onboarding_emails")
        .update({ status: "failed", last_error: String(error).slice(0, 1000) })
        .eq("order_id", orderId).eq("status", "sending");
      throw error;
    }
  } catch (error) {
    console.error("[MTC ONBOARDING] Email failed; order fulfilment unaffected:", orderId, error);
  }
}
