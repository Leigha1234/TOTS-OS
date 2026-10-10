import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const esc = (v: unknown) => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]!));
const money = (v: unknown, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(v || 0));

async function authorised(userId: string, organisationId: string) {
  const [member, legacy, profile] = await Promise.all([
    admin.from("organisation_members").select("id").eq("organisation_id", organisationId).eq("user_id", userId).maybeSingle(),
    admin.from("user_organisations").select("user_id").eq("organisation_id", organisationId).eq("user_id", userId).maybeSingle(),
    admin.from("profiles").select("id").eq("id", userId).eq("organisation_id", organisationId).maybeSingle(),
  ]);
  return Boolean(member.data || legacy.data || profile.data);
}

export async function POST(req: Request) {
  try {
    const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { data: auth, error: authError } = await admin.auth.getUser(bearer);
    if (authError || !auth.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const { invoiceId, recipientEmail } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: "Missing invoiceId." }, { status: 400 });

    const { data: invoice, error } = await admin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (error || !invoice?.organisation_id) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    if (!(await authorised(auth.user.id, invoice.organisation_id))) return NextResponse.json({ error: "You do not have access to this invoice." }, { status: 403 });

    const [{ data: org }, { data: settings }, { data: ownerProfile }, { data: customer }, { data: lines }] = await Promise.all([
      admin.from("organisations").select("name,email,phone,website,address").eq("id", invoice.organisation_id).maybeSingle(),
      admin.from("settings").select("brand_color,secondary_color,font_family,logo_url,company_details,bank_info").eq("organisation_id", invoice.organisation_id).maybeSingle(),
      admin.from("profiles").select("company_name,email,phone,address,logo_url,brand_color,font_family").eq("organisation_id", invoice.organisation_id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      invoice.customer_id ? admin.from("customers").select("name,email,address,company").eq("id", invoice.customer_id).maybeSingle() : Promise.resolve({ data: null }),
      admin.from("invoice_lines").select("description,quantity,unit_price").eq("invoice_id", invoice.id).order("id"),
    ]);

    const data = invoice.data || {};
    const businessName = org?.name || ownerProfile?.company_name || "Your business";
    const businessEmail = org?.email || ownerProfile?.email || null;
    const logo = settings?.logo_url || ownerProfile?.logo_url || null;
    const brand = settings?.brand_color || ownerProfile?.brand_color || "#4f4a46";
    const to = String(recipientEmail || data.send_to_email || data.customer_email || customer?.email || "").trim();
    if (!to) return NextResponse.json({ error: "This customer does not have an email address." }, { status: 400 });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.tots-os.co.uk").replace(/\/$/, "");
    const payUrl = `${appUrl}/pay/${invoice.public_token}`;
    const number = invoice.invoice_number || data.document_number || "Invoice";
    const currency = invoice.currency || "GBP";
    const displayLines = lines?.length ? lines : (Array.isArray(invoice.items) ? invoice.items.map((x: any) => ({ description: x.description || x.desc, quantity: x.quantity ?? x.qty, unit_price: x.unit_price ?? x.price })) : []);
    const rows = displayLines.map((line: any) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eee">${esc(line.description)}</td><td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center">${esc(line.quantity)}</td><td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right">${money(line.unit_price,currency)}</td></tr>`).join("");

    const html = `<div style="background:#f7f5f2;padding:32px 16px;font-family:Arial,sans-serif;color:#292524"><div style="max-width:660px;margin:auto;background:white;border:1px solid #e7e5e4;border-radius:18px;padding:32px">${logo ? `<img src="${esc(logo)}" alt="${esc(businessName)}" style="max-height:54px;max-width:180px;margin-bottom:24px">` : ""}<p style="margin:0;color:#78716c;font-size:13px">Invoice from</p><h1 style="margin:4px 0 24px;font-size:26px">${esc(businessName)}</h1><div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap"><div><strong>${esc(number)}</strong><br><span style="color:#78716c;font-size:13px">Due ${esc(invoice.due_date || "—")}</span></div><div style="text-align:right"><span style="color:#78716c;font-size:13px">Balance due</span><br><strong style="font-size:24px">${money(invoice.balance_due ?? invoice.amount,currency)}</strong></div></div><div style="margin:24px 0;border-top:1px solid #eee"></div><p style="font-size:14px">Hi ${esc(customer?.name || data.customer_name || data.client_name || "there")},</p><p style="font-size:14px;color:#57534e">Your invoice from ${esc(businessName)} is ready.</p>${rows ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0"><thead><tr><th style="text-align:left">Description</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}</tbody></table>` : ""}<div style="text-align:right;margin:20px 0"><div style="font-size:14px;color:#78716c">Total ${money(invoice.amount,currency)}</div>${Number(invoice.amount_paid || 0) > 0 ? `<div style="font-size:14px;color:#78716c">Paid ${money(invoice.amount_paid,currency)}</div>` : ""}<div style="font-size:20px;font-weight:700;margin-top:4px">Due ${money(invoice.balance_due ?? invoice.amount,currency)}</div></div>${invoice.status !== "paid" ? `<a href="${payUrl}" style="display:inline-block;background:${esc(brand)};color:white;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">View &amp; pay invoice</a>` : `<div style="padding:12px 16px;background:#ecfdf5;border-radius:10px;color:#166534;font-weight:700">Paid — thank you</div>`}<div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#78716c">${businessEmail ? `Questions? Reply to this email or contact ${esc(businessEmail)}.<br>` : ""}<span>Powered by <strong>TOTS-OS</strong></span></div></div></div>`;

    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${businessName.replace(/[<>]/g, "")} via TOTS-OS <invoices@tots-os.co.uk>`,
        to: [to],
        reply_to: businessEmail || undefined,
        subject: `${number} from ${businessName} — ${money(invoice.balance_due ?? invoice.amount, currency)} due`,
        html,
      }),
    });
    const resendBody = await resend.json().catch(() => ({}));
    if (!resend.ok) return NextResponse.json({ error: resendBody?.message || "Resend rejected the invoice email." }, { status: 502 });

    await admin.from("invoices").update({ status: invoice.status === "paid" ? "paid" : "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", invoice.id);
    return NextResponse.json({ success: true, emailId: resendBody?.id, payUrl });
  } catch (e) {
    console.error("send invoice", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to send invoice." }, { status: 500 });
  }
}
