import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PayInvoiceClient from "./PayInvoiceClient";

export const dynamic = "force-dynamic";

const money = (v: unknown, currency = "GBP") => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(v || 0));

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: invoice } = await admin.from("invoices").select("*").eq("public_token", token).single();
  if (!invoice) notFound();

  const [{ data: org }, { data: settings }, { data: profile }, { data: customer }, { data: lines }] = await Promise.all([
    admin.from("organisations").select("name,email,phone,website,address").eq("id", invoice.organisation_id).maybeSingle(),
    admin.from("settings").select("brand_color,logo_url,company_details,bank_info").eq("organisation_id", invoice.organisation_id).maybeSingle(),
    admin.from("profiles").select("company_name,email,phone,address,logo_url,brand_color").eq("organisation_id", invoice.organisation_id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    invoice.customer_id ? admin.from("customers").select("name,email,address,company").eq("id", invoice.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    admin.from("invoice_lines").select("description,quantity,unit_price").eq("invoice_id", invoice.id).order("id"),
  ]);

  if (!invoice.viewed_at) await admin.from("invoices").update({ viewed_at: new Date().toISOString(), status: invoice.status === "sent" ? "viewed" : invoice.status }).eq("id", invoice.id);
  const d = invoice.data || {};
  const businessName = org?.name || profile?.company_name || "Business";
  const logo = settings?.logo_url || profile?.logo_url;
  const brand = settings?.brand_color || profile?.brand_color || "#4f4a46";
  const currency = invoice.currency || "GBP";
  const balance = Number(invoice.balance_due ?? (Number(invoice.amount || 0) - Number(invoice.amount_paid || 0)));
  const displayLines = lines?.length ? lines : (Array.isArray(invoice.items) ? invoice.items.map((x:any) => ({ description:x.description||x.desc, quantity:x.quantity??x.qty, unit_price:x.unit_price??x.price })) : []);
  const paid = invoice.status === "paid" || balance <= 0;

  return <main className="min-h-screen bg-[#f7f5f2] px-4 py-8 text-stone-900 sm:py-14">
    <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
      <div className="h-2" style={{ backgroundColor: brand }} />
      <div className="p-6 sm:p-10">
        {query.paid === "1" && <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Payment received. Your invoice will update automatically.</div>}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>{logo ? <img src={logo} alt={businessName} className="mb-5 max-h-14 max-w-[190px] object-contain object-left" /> : null}<p className="text-xs font-black uppercase tracking-[.22em] text-stone-400">Invoice from</p><h1 className="mt-2 text-2xl font-black">{businessName}</h1><p className="mt-2 max-w-sm whitespace-pre-line text-sm text-stone-500">{org?.address || profile?.address || settings?.company_details || ""}</p></div>
          <div className="text-right"><p className="text-xs font-black uppercase tracking-[.22em] text-stone-400">Invoice</p><p className="mt-2 font-bold">{invoice.invoice_number || d.document_number || "Invoice"}</p><p className="mt-1 text-sm text-stone-500">Issued {invoice.invoice_date || d.invoice_date || "—"}</p><p className="text-sm text-stone-500">Due {invoice.due_date || "—"}</p></div>
        </div>
        <div className="my-8 border-t border-stone-100" />
        <div className="grid gap-6 sm:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-[.22em] text-stone-400">Bill to</p><p className="mt-2 font-bold">{customer?.company || customer?.name || d.customer_name || d.client_name || "Customer"}</p><p className="mt-1 whitespace-pre-line text-sm text-stone-500">{customer?.address || d.customer_address || ""}</p></div><div className="sm:text-right"><p className="text-xs font-black uppercase tracking-[.22em] text-stone-400">Balance due</p><p className="mt-2 text-3xl font-black">{money(balance,currency)}</p><p className="mt-1 text-sm capitalize text-stone-500">{String(invoice.status || "draft").replaceAll("_"," ")}</p></div></div>
        <div className="my-8 overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-400"><th className="py-3">Description</th><th className="py-3 text-center">Qty</th><th className="py-3 text-right">Price</th><th className="py-3 text-right">Total</th></tr></thead><tbody>{displayLines.map((line:any,i:number) => <tr key={i} className="border-b border-stone-100"><td className="py-4 font-medium">{line.description}</td><td className="py-4 text-center">{line.quantity}</td><td className="py-4 text-right">{money(line.unit_price,currency)}</td><td className="py-4 text-right font-bold">{money(Number(line.quantity||0)*Number(line.unit_price||0),currency)}</td></tr>)}</tbody></table></div>
        <div className="ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span className="text-stone-500">Subtotal</span><span>{money(Number(invoice.amount||0)-Number(invoice.tax||0),currency)}</span></div>{Number(invoice.tax||0)>0 && <div className="flex justify-between"><span className="text-stone-500">VAT</span><span>{money(invoice.tax,currency)}</span></div>}<div className="flex justify-between border-t border-stone-200 pt-3 text-base font-black"><span>Total</span><span>{money(invoice.amount,currency)}</span></div>{Number(invoice.amount_paid||0)>0 && <div className="flex justify-between text-emerald-700"><span>Paid</span><span>-{money(invoice.amount_paid,currency)}</span></div>}<div className="flex justify-between text-lg font-black"><span>Due</span><span>{money(balance,currency)}</span></div></div>
        {(d.payment_instructions || invoice.payment_terms || invoice.notes) && <div className="mt-8 rounded-2xl bg-stone-50 p-5 text-sm text-stone-600">{d.payment_instructions && <p className="whitespace-pre-line"><strong>Payment instructions</strong><br/>{d.payment_instructions}</p>}{invoice.payment_terms && <p className="mt-3 whitespace-pre-line"><strong>Terms</strong><br/>{invoice.payment_terms}</p>}{invoice.notes && <p className="mt-3 whitespace-pre-line"><strong>Notes</strong><br/>{invoice.notes}</p>}</div>}
        <div className="mt-8"><PayInvoiceClient token={token} disabled={paid} /></div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-stone-100 pt-5 text-xs text-stone-400"><span>{org?.email || profile?.email || ""}</span><span>Powered by <strong>TOTS-OS</strong></span></div>
      </div>
    </div>
  </main>;
}
