'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
type Handoff={id:string;title:string;booking_url:string;status:'proposed'|'sent'|'booked'|'cancelled';appointment_at:string|null;notes:string};
export default function GrowthBookingHandoffs({organisationId,leadId}:{organisationId:string;leadId:string}){
 const [items,setItems]=useState<Handoff[]>([]),[title,setTitle]=useState(''),[url,setUrl]=useState(''),[notes,setNotes]=useState('');
 const [dates,setDates]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const request=useCallback(async(method:'GET'|'POST'|'PATCH',body?:Record<string,unknown>)=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('Sign in required');
  const query=new URLSearchParams({organisationId,leadId});
  const r=await fetch('/api/growth/booking'+(method==='GET'?`?${query}`:''),{method,headers:{Authorization:`Bearer ${session.access_token}`,...(method==='GET'?{}:{'Content-Type':'application/json'})},...(method==='GET'?{}:{body:JSON.stringify({...body,organisationId,leadId})})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Booking handoff failed');return d;
 },[organisationId,leadId]);
 const reload=useCallback(async()=>{const d=await request('GET');setItems(d.handoffs||[]);},[request]);
 useEffect(()=>{let active=true;request('GET').then(d=>{if(active)setItems(d.handoffs||[]);}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to load');});return()=>{active=false;};},[request]);
 const action=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');setNotice('');try{await fn();await reload();setNotice('Booking handoff saved.');}catch(e){setError(e instanceof Error?e.message:'Unable to save');}finally{setBusy(false);}};
 return <section className="space-y-3 rounded-xl border p-3"><h3 className="font-semibold">Calendar & booking handoffs · Part 2</h3><p className="text-xs text-[#6B8177]">Link a lead to an existing ORBI. booking page or another HTTPS booking page. This does not create or verify a booking, reserve a slot or send a message. Mark bookings confirmed only after checking the booking system.</p>
  <input aria-label="Booking handoff title" className="w-full rounded-lg border p-2 text-sm" placeholder="e.g. Free intro consultation" value={title} onChange={e=>setTitle(e.target.value)}/>
  <input aria-label="Booking page URL" className="w-full rounded-lg border p-2 text-sm" type="url" placeholder="https://... booking page" value={url} onChange={e=>setUrl(e.target.value)}/>
  <input aria-label="Booking handoff notes" className="w-full rounded-lg border p-2 text-sm" placeholder="Internal notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
  <button type="button" disabled={busy||!title.trim()||!url.trim()} className="rounded-lg bg-[#123F34] px-3 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void action(async()=>{await request('POST',{title,booking_url:url,notes});setTitle('');setUrl('');setNotes('');})}>Create booking handoff</button>
  {items.map(item=><div key={item.id} className="space-y-2 rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.title}</strong><span className="capitalize">{item.status}</span></div><a className="break-all underline" href={item.booking_url} target="_blank" rel="noopener noreferrer">Open booking page ↗</a>{item.notes&&<p className="text-xs">{item.notes}</p>}{item.appointment_at&&<p>Recorded appointment: {new Date(item.appointment_at).toLocaleString('en-GB')}</p>}
   <div className="flex flex-wrap items-center gap-2"><button disabled={busy} className="rounded border px-2 py-1" onClick={()=>void action(async()=>{await request('PATCH',{id:item.id,status:'sent'});})}>Mark link shared</button><input aria-label={`Confirmed appointment for ${item.title}`} type="datetime-local" className="rounded border p-1" value={dates[item.id]||''} onChange={e=>setDates(d=>({...d,[item.id]:e.target.value}))}/><button disabled={busy||!dates[item.id]} className="rounded border px-2 py-1 disabled:opacity-50" onClick={()=>void action(async()=>{await request('PATCH',{id:item.id,status:'booked',appointment_at:new Date(dates[item.id]).toISOString()});})}>Record confirmed booking</button><button disabled={busy} className="rounded border px-2 py-1" onClick={()=>void action(async()=>{await request('PATCH',{id:item.id,status:'cancelled'});})}>Cancel handoff</button></div></div>)}
  {!items.length&&<p className="text-xs text-[#6B8177]">No booking handoffs for this lead.</p>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm text-green-700">{notice}</p>}
 </section>;
}
