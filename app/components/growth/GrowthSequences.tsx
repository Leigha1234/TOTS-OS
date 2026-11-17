'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
type Enrolment={id:string;lead_id:string;template:string;status:string;created_at:string};
type Step={id:string;enrolment_id:string;lead_id:string;title:string;due_at:string;completed_at:string|null};
const labels:Record<string,string>={new_enquiry:'New enquiry follow-up',trial_followup:'Trial follow-up',reactivation:'Customer reactivation'};
export default function GrowthSequences({organisationId,leadId}:{organisationId:string;leadId?:string}){
 const [enrolments,setEnrolments]=useState<Enrolment[]>([]),[steps,setSteps]=useState<Step[]>([]);
 const [template,setTemplate]=useState('new_enquiry'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[truncated,setTruncated]=useState(false);
 const request=useCallback(async(method:'GET'|'POST'|'PATCH',payload?:Record<string,unknown>)=>{
  const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error('Please sign in');
  const qs=new URLSearchParams({organisationId,...(leadId?{leadId}:{})});
  const r=await fetch(`/api/growth/sequences${method==='GET'?`?${qs}`:''}`,{method,headers:{Authorization:`Bearer ${session.access_token}`,...(method!=='GET'?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify({organisationId,...payload})}:{})});
  const json=await r.json();if(!r.ok)throw Error(json.error||'Request failed');return json;
 },[organisationId,leadId]);
 const reload=useCallback(async()=>{if(!organisationId)return;try{const d=await request('GET');setEnrolments(d.enrolments||[]);setSteps(d.steps||[]);setTruncated(!!d.truncated);setError('');}catch(e){setError(e instanceof Error?e.message:'Unable to load');}},[organisationId,request]);
 useEffect(()=>{void reload();},[reload]);
 async function mutate(payload:Record<string,unknown>,method:'POST'|'PATCH'){
  setBusy(true);try{await request(method,payload);await reload();}catch(e){setError(e instanceof Error?e.message:'Action failed');}finally{setBusy(false);}
 }
 const activeIds=new Set(enrolments.filter(x=>x.status==='active').map(x=>x.id));
 const pending=steps.filter(x=>!x.completed_at&&activeIds.has(x.enrolment_id));
 return <section className="rounded-2xl border border-[#24483D] bg-white p-5 space-y-4">
  <div><h2 className="text-xl font-semibold text-[#123F34]">Growth follow-up sequences</h2><p className="text-sm text-gray-600">Create a scheduled checklist for your team. No messages are sent automatically.</p></div>
  {leadId?<div className="flex flex-wrap gap-2"><select className="rounded-lg border p-2" value={template} onChange={e=>setTemplate(e.target.value)}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button className="rounded-lg bg-[#123F34] px-4 py-2 text-white disabled:opacity-50" disabled={busy} onClick={()=>void mutate({leadId,template},'POST')}>Start sequence</button></div>:<p className="text-sm text-gray-600">Open a lead to start a sequence. Outstanding tasks appear below.</p>}
  {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  {truncated&&<p className="text-xs text-amber-700">Showing a limited number of records. Filter to a lead to see its sequence.</p>}
  <div className="space-y-2">{pending.length===0?<p className="text-sm text-gray-500">No outstanding sequence tasks.</p>:pending.slice(0,30).map(step=><div key={step.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><p className="text-sm font-medium">{step.title}</p><p className="text-xs text-gray-500">Due {new Date(step.due_at).toLocaleString()} · Lead {step.lead_id.slice(0,8)}</p></div><button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>void mutate({action:'complete',id:step.id},'PATCH')}>Complete</button></div>)}</div>
  {leadId&&enrolments.filter(x=>x.status==='active').map(x=><div key={x.id} className="flex items-center justify-between gap-2 border-t pt-2 text-sm"><span>{labels[x.template]||x.template} · active</span><button disabled={busy} className="rounded-lg border px-3 py-2" onClick={()=>void mutate({action:'cancel',id:x.id},'PATCH')}>Cancel sequence</button></div>)}
 </section>;
}
