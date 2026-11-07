"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/auth";

type Rule = "none" | "fixed" | "percentage" | "full";
type Service = {id:string; booking_page_id:string; name:string; description:string; duration_minutes:number; price_pence:number; payment_rule:Rule; deposit_value:number; is_active:boolean; sort_order:number};
const blank = {name:"",description:"",duration_minutes:60,price_pence:0,payment_rule:"none" as Rule,deposit_value:0,is_active:true,sort_order:0};
const money = (n:number) => new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n/100);
export default function BookingServicesEditor({bookingPageId}:{bookingPageId:string}) {
  const [rows,setRows]=useState<Service[]>([]); const [draft,setDraft]=useState(blank);
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  const load=useCallback(async()=>{const db=createClient(); const {data,error}=await db.from("booking_services").select("*").eq("booking_page_id",bookingPageId).order("sort_order").order("created_at"); if(error)setError(error.message); else setRows((data||[]) as Service[]);},[bookingPageId]);
  useEffect(()=>{void load()},[load]);
  async function add(){setError("");setMessage(""); if(!draft.name.trim()){setError("Enter a service name.");return;} if(draft.duration_minutes<5||draft.duration_minutes>1440){setError("Duration must be 5–1440 minutes.");return;} if(draft.payment_rule==="percentage"&&(draft.deposit_value<=0||draft.deposit_value>100)){setError("Percentage must be between 1 and 100.");return;} if(draft.payment_rule==="fixed"&&(draft.deposit_value<=0||draft.deposit_value>draft.price_pence)){setError("Fixed deposit must be greater than £0 and no more than the service price.");return;} if(draft.payment_rule!=="none"&&draft.price_pence<=0){setError("Paid services need a price.");return;} setBusy(true);const db=createClient();const {error}=await db.from("booking_services").insert({...draft,name:draft.name.trim(),booking_page_id:bookingPageId,sort_order:rows.length});setBusy(false);if(error)setError(error.message);else{setDraft(blank);setMessage("Service saved. Customer selection is not enabled until the booking API upgrade is installed.");void load();}}
  async function update(row:Service,changes:Partial<Service>){setError("");setMessage("");const next={...row,...changes};setRows(prev=>prev.map(x=>x.id===row.id?next:x)); const db=createClient();const {error}=await db.from("booking_services").update(changes).eq("id",row.id).eq("booking_page_id",bookingPageId);if(error){setError(error.message);void load();}}
  return <section className="rounded-[2rem] border border-[#E1EAE2] bg-white p-6 md:p-8">
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#446D59]">Services &amp; booking rules</p>
    <h3 className="mt-2 text-2xl font-serif text-[#183E31]">Your appointment menu</h3>
    <p className="mt-2 text-sm text-[#52665B]">Create services with individual prices, timings and deposit rules. These are saved as drafts for the upcoming customer booking-flow upgrade; they do not yet change live bookings.</p>
    <div className="mt-5 space-y-3">{rows.map(row=><div key={row.id} className="rounded-xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3"><div><div className="font-semibold text-[#183E31]">{row.name}</div><div className="text-xs text-stone-500">{row.duration_minutes} min · {money(row.price_pence)} · {row.payment_rule==="none"?"No payment":row.payment_rule==="full"?"Full payment":row.payment_rule==="fixed"?`${money(row.deposit_value)} deposit`:`${row.deposit_value}% deposit`}</div></div><label className="text-xs flex items-center gap-2"><input type="checkbox" checked={row.is_active} onChange={e=>void update(row,{is_active:e.target.checked})}/>Active</label></div>)}</div>
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <label className="text-sm">Service name<input className="form-input mt-2" placeholder="e.g. Lash lift" value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
      <label className="text-sm">Duration (minutes)<input className="form-input mt-2" type="number" min="5" max="1440" value={draft.duration_minutes} onChange={e=>setDraft(d=>({...d,duration_minutes:Number(e.target.value)}))}/></label>
      <label className="text-sm">Price (£)<input className="form-input mt-2" type="number" min="0" step="0.01" value={(draft.price_pence/100).toFixed(2)} onChange={e=>setDraft(d=>({...d,price_pence:Math.max(0,Math.round(Number(e.target.value)*100))}))}/></label>
      <label className="text-sm">Payment rule<select className="form-input mt-2" value={draft.payment_rule} onChange={e=>setDraft(d=>({...d,payment_rule:e.target.value as Rule,deposit_value:0}))}><option value="none">No payment</option><option value="fixed">Fixed deposit</option><option value="percentage">Percentage deposit</option><option value="full">Full payment</option></select></label>
      {(draft.payment_rule==="fixed"||draft.payment_rule==="percentage")&&<label className="text-sm">{draft.payment_rule==="fixed"?"Deposit (pence)":"Deposit (%)"}<input className="form-input mt-2" type="number" min="1" max={draft.payment_rule==="percentage"?100:undefined} value={draft.deposit_value} onChange={e=>setDraft(d=>({...d,deposit_value:Number(e.target.value)}))}/></label>}
      <label className="text-sm md:col-span-2">Description<textarea className="form-input mt-2" value={draft.description} onChange={e=>setDraft(d=>({...d,description:e.target.value}))}/></label>
    </div>
    {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{message&&<p className="mt-3 text-sm text-green-800">{message}</p>}
    <button type="button" disabled={busy||!bookingPageId} onClick={()=>void add()} className="mt-4 rounded-xl bg-[#103F33] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Add service"}</button>
  </section>;
}
