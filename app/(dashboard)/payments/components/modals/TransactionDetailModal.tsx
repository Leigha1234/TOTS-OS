"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CheckCircle2, ExternalLink, Loader2, Plus, Save, Trash2, X } from "lucide-react";

type Props = {
  open: boolean;
  entry: { id: string; type: "Invoice" | "Quote" } | null;
  customers?: any[];
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
};

type Line = { id?: string; description: string; quantity: number; unit_price: number };

const field = "h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100";
const label = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-stone-400";

function money(n: unknown) { return Number(n || 0).toLocaleString("en-GB", { style: "currency", currency: "GBP" }); }
function dateValue(v: unknown) { return typeof v === "string" && v ? v.slice(0, 10) : ""; }

export default function TransactionDetailModal({ open, entry, customers = [], onClose, onSaved }: Props) {
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [record, setRecord] = useState<any>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const isInvoice = entry?.type === "Invoice";
  const total = Number(record?.amount || 0);
  const amountPaid = Number(record?.amount_paid || 0);
  const balance = record?.balance_due == null ? Math.max(0, total - amountPaid) : Number(record.balance_due || 0);

  useEffect(() => {
    if (!open || !entry) return;
    let alive = true;
    (async () => {
      setLoading(true); setError(null); setRecord(null); setLines([]); setPaymentAmount("");
      try {
        const table = entry.type === "Invoice" ? "invoices" : "quotes";
        const { data, error: e } = await supabase.from(table).select("*").eq("id", entry.id).single();
        if (e) throw e;
        if (!alive) return;
        setRecord(data);
        if (entry.type === "Invoice") {
          const { data: lineData, error: lineError } = await supabase.from("invoice_lines").select("id, description, quantity, unit_price").eq("invoice_id", entry.id).order("id");
          if (lineError) console.warn("Invoice line load:", lineError.message);
          if (alive) setLines((lineData || []).map((x: any) => ({ id: x.id, description: x.description || "", quantity: Number(x.quantity || 1), unit_price: Number(x.unit_price || 0) })));
        }
      } catch (e: any) { if (alive) setError(e?.message || "Could not load this transaction."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [open, entry?.id, entry?.type, supabase]);

  async function refreshParent() { if (onSaved) await onSaved(); }

  async function save() {
    if (!entry || !record) return;
    setSaving(true); setError(null);
    try {
      if (isInvoice) {
        const calculatedSubtotal = lines.length ? lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0), 0) : Number(record.amount || 0);
        const tax = Number(record.tax || 0);
        const calculatedTotal = lines.length ? calculatedSubtotal + tax : Number(record.amount || 0);
        const paid = Math.min(Number(record.amount_paid || 0), calculatedTotal);
        const payload: any = {
          customer_id: record.customer_id || null,
          invoice_number: record.invoice_number || null,
          invoice_date: record.invoice_date || null,
          due_date: record.due_date || null,
          status: record.status || "draft",
          amount: calculatedTotal,
          tax,
          amount_paid: paid,
          balance_due: Math.max(0, calculatedTotal - paid),
          notes: record.notes || null,
          payment_terms: record.payment_terms || null,
          updated_at: new Date().toISOString(),
        };
        const { error: updateError } = await supabase.from("invoices").update(payload).eq("id", entry.id);
        if (updateError) throw updateError;

        const existingIds = lines.filter(l => l.id).map(l => l.id!);
        const { data: oldLines } = await supabase.from("invoice_lines").select("id").eq("invoice_id", entry.id);
        const removeIds = (oldLines || []).map((x: any) => x.id).filter((id: string) => !existingIds.includes(id));
        if (removeIds.length) {
          const { error: delError } = await supabase.from("invoice_lines").delete().in("id", removeIds);
          if (delError) throw delError;
        }
        for (const line of lines) {
          const lp = { invoice_id: entry.id, organisation_id: record.organisation_id, description: line.description.trim(), quantity: Number(line.quantity || 0), unit_price: Number(line.unit_price || 0) };
          if (line.id) {
            const { error: le } = await supabase.from("invoice_lines").update(lp).eq("id", line.id);
            if (le) throw le;
          } else if (line.description.trim()) {
            const { data: inserted, error: le } = await supabase.from("invoice_lines").insert(lp).select("id").single();
            if (le) throw le;
            line.id = inserted.id;
          }
        }
        setRecord((r: any) => ({ ...r, ...payload }));
      } else {
        const payload = {
          customer_id: record.customer_id || null,
          client_name: record.client_name || null,
          description: record.description || null,
          amount: Number(record.amount || 0),
          date: record.date || null,
          status: record.status || "draft",
        };
        const { error: updateError } = await supabase.from("quotes").update(payload).eq("id", entry.id);
        if (updateError) throw updateError;
      }
      await refreshParent();
    } catch (e: any) { setError(e?.message || "Could not save changes."); }
    finally { setSaving(false); }
  }

  async function recordPayment(amount: number) {
    if (!entry || !record || !isInvoice || amount <= 0) return;
    setSaving(true); setError(null);
    try {
      const nextPaid = Math.min(total, amountPaid + amount);
      const nextBalance = Math.max(0, total - nextPaid);
      const now = new Date().toISOString();
      const nextStatus = nextBalance <= 0 ? "paid" : "partially_paid";
      const { error: payError } = await supabase.from("payments").insert({
        organisation_id: record.organisation_id,
        invoice_id: entry.id,
        customer_id: record.customer_id || null,
        amount,
        currency: record.currency || "GBP",
        status: "paid",
        type: "invoice_payment",
        paid_at: now,
        description: `Payment for invoice ${record.invoice_number || entry.id.slice(0, 8)}`,
        payment_method: "manual",
      });
      if (payError) throw payError;
      const { error: invoiceError } = await supabase.from("invoices").update({ amount_paid: nextPaid, balance_due: nextBalance, status: nextStatus, paid_at: nextBalance <= 0 ? now : record.paid_at || null, updated_at: now }).eq("id", entry.id);
      if (invoiceError) throw invoiceError;
      setRecord((r: any) => ({ ...r, amount_paid: nextPaid, balance_due: nextBalance, status: nextStatus, paid_at: nextBalance <= 0 ? now : r.paid_at }));
      setPaymentAmount("");
      await refreshParent();
    } catch (e: any) { setError(e?.message || "Could not record payment."); }
    finally { setSaving(false); }
  }

  async function markPaid() { await recordPayment(balance > 0 ? balance : total); }

  if (!open || !entry) return null;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-[#faf9f6] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8fa07d]">{entry.type}</p><h2 className="mt-1 text-2xl font-semibold text-stone-900">Transaction details</h2></div>
        <button type="button" onClick={onClose} className="rounded-full border border-stone-200 bg-white p-2.5 text-stone-500 hover:bg-stone-50"><X size={18}/></button>
      </div>

      {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-[#a9b897]"/></div> : record ? <div className="space-y-6 p-6 sm:p-8">
        {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {isInvoice && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Total', money(total)], ['Paid', money(amountPaid)], ['Outstanding', money(balance)], ['Status', String(record.status || 'draft').replaceAll('_',' ')]].map(([a,b]) => <div key={a} className="rounded-2xl border border-stone-100 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{a}</p><p className="mt-2 text-lg font-bold capitalize text-stone-900">{b}</p></div>)}
        </div>}

        <div className="rounded-2xl border border-stone-100 bg-white p-5 sm:p-6">
          <h3 className="mb-5 font-semibold text-stone-900">Document information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Client</label><select className={field} value={record.customer_id || ""} onChange={e => setRecord({...record, customer_id:e.target.value})}><option value="">No linked client</option>{customers.map((c:any)=><option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ''}</option>)}</select></div>
            {isInvoice ? <div><label className={label}>Invoice number</label><input className={field} value={record.invoice_number || ""} onChange={e=>setRecord({...record,invoice_number:e.target.value})}/></div> : <div><label className={label}>Client name</label><input className={field} value={record.client_name || ""} onChange={e=>setRecord({...record,client_name:e.target.value})}/></div>}
            <div><label className={label}>Status</label><select className={field} value={record.status || "draft"} onChange={e=>setRecord({...record,status:e.target.value})}>{(isInvoice ? ['draft','sent','viewed','open','partially_paid','paid','overdue','void','cancelled'] : ['draft','sent','viewed','accepted','rejected','converted','cancelled']).map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></div>
            {isInvoice ? <><div><label className={label}>Invoice date</label><input type="date" className={field} value={dateValue(record.invoice_date)} onChange={e=>setRecord({...record,invoice_date:e.target.value})}/></div><div><label className={label}>Due date</label><input type="date" className={field} value={dateValue(record.due_date)} onChange={e=>setRecord({...record,due_date:e.target.value})}/></div><div><label className={label}>VAT / tax (£)</label><input type="number" step="0.01" className={field} value={record.tax ?? 0} onChange={e=>setRecord({...record,tax:e.target.value})}/></div></> : <><div><label className={label}>Quote date</label><input type="date" className={field} value={dateValue(record.date)} onChange={e=>setRecord({...record,date:e.target.value})}/></div><div><label className={label}>Amount (£)</label><input type="number" step="0.01" className={field} value={record.amount ?? 0} onChange={e=>setRecord({...record,amount:e.target.value})}/></div></>}
          </div>
        </div>

        {isInvoice && <div className="rounded-2xl border border-stone-100 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Line items</h3><button type="button" onClick={()=>setLines([...lines,{description:'',quantity:1,unit_price:0}])} className="flex items-center gap-1 rounded-full bg-[#eef2e9] px-3 py-2 text-xs font-bold text-[#657456]"><Plus size={13}/> Add item</button></div>
          <div className="space-y-3">{lines.map((l,i)=><div key={l.id || i} className="grid grid-cols-[1fr_80px_110px_38px] gap-2"><input className={field} placeholder="Description" value={l.description} onChange={e=>setLines(lines.map((x,j)=>j===i?{...x,description:e.target.value}:x))}/><input className={field} type="number" min="0" step="1" value={l.quantity} onChange={e=>setLines(lines.map((x,j)=>j===i?{...x,quantity:Number(e.target.value)}:x))}/><input className={field} type="number" min="0" step="0.01" value={l.unit_price} onChange={e=>setLines(lines.map((x,j)=>j===i?{...x,unit_price:Number(e.target.value)}:x))}/><button type="button" onClick={()=>setLines(lines.filter((_,j)=>j!==i))} className="rounded-xl text-red-400 hover:bg-red-50"><Trash2 size={15}/></button></div>)}</div>
        </div>}

        <div className="rounded-2xl border border-stone-100 bg-white p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>{isInvoice ? 'Notes' : 'Description'}</label><textarea rows={4} className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none" value={(isInvoice ? record.notes : record.description) || ''} onChange={e=>setRecord({...record,[isInvoice?'notes':'description']:e.target.value})}/></div>{isInvoice && <div><label className={label}>Payment terms</label><textarea rows={4} className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none" value={record.payment_terms || ''} onChange={e=>setRecord({...record,payment_terms:e.target.value})}/></div>}</div></div>

        {isInvoice && <div className="rounded-2xl border border-[#dfe7d8] bg-[#f4f7f1] p-5 sm:p-6"><h3 className="font-semibold text-stone-900">Payments</h3><p className="mt-1 text-xs text-stone-500">Record bank transfer, cash or another payment received outside the online checkout.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="number" min="0" step="0.01" placeholder={`Amount (max ${balance.toFixed(2)})`} className={field} value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}/><button type="button" disabled={saving || Number(paymentAmount)<=0} onClick={()=>void recordPayment(Math.min(balance,Number(paymentAmount)))} className="h-11 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-5 text-xs font-bold disabled:opacity-40">Record payment</button>{balance>0 && <button type="button" disabled={saving} onClick={()=>void markPaid()} className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-stone-900 px-5 text-xs font-bold text-white disabled:opacity-40"><CheckCircle2 size={15}/> Mark paid</button>}</div></div>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-5"><div className="flex gap-2">{isInvoice && record.public_token && <a href={`/pay/${record.public_token}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold"><ExternalLink size={14}/> Open invoice</a>}</div><div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold">Close</button><button type="button" disabled={saving} onClick={()=>void save()} className="flex items-center gap-2 rounded-xl bg-[#a9b897] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>} Save changes</button></div></div>
      </div> : <div className="p-8 text-sm text-red-600">{error || "Transaction not found."}</div>}
    </div>
  </div>;
}
