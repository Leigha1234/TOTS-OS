import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (message:string,status=400)=>NextResponse.json({error:message},{status});
const templates:Record<string,{title:string,days:number}[]> = {
 new_enquiry:[{title:'Personally reply to new enquiry',days:0},{title:'Check whether the lead needs help',days:2},{title:'Review enquiry outcome',days:7}],
 trial_followup:[{title:'Check trial booking and welcome lead',days:0},{title:'Ask how the trial went',days:2},{title:'Discuss next steps or membership',days:5}],
 reactivation:[{title:'Review previous customer relationship',days:0},{title:'Check whether a personal follow-up is appropriate',days:7}]
};
async function access(req:NextRequest,organisationId:string){
 if(!uuid.test(organisationId))return {error:'Invalid organisation',status:400} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return {error:'Server configuration missing',status:500} as const;
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return {error:'Sign in required',status:401} as const;
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user)return {error:'Invalid session',status:401} as const;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [owner,member]=await Promise.all([
  db.from('organisations').select('id').eq('id',organisationId).eq('created_by',user.id).maybeSingle(),
  db.from('organisation_members').select('organisation_id').eq('organisation_id',organisationId).eq('user_id',user.id).maybeSingle()
 ]);
 if(owner.error||member.error)return {error:'Access check failed',status:500} as const;
 if(!owner.data&&!member.data)return {error:'Access denied',status:403} as const;
 return {db,user} as const;
}
export async function GET(req:NextRequest){
 const org=req.nextUrl.searchParams.get('organisationId')||'';
 const a=await access(req,org);if(a.error)return fail(a.error,a.status);
 const leadId=req.nextUrl.searchParams.get('leadId');
 if(leadId&&!uuid.test(leadId))return fail('Invalid lead');
 let q=a.db.from('growth_sequence_enrolments').select('id,lead_id,template,status,created_at,cancelled_at').eq('organisation_id',org).order('created_at',{ascending:false}).limit(200);
 if(leadId)q=q.eq('lead_id',leadId);
 const {data:enrolments,error}=await q;
 if(error)return fail('Unable to load sequences',500);
 let stepsQuery=a.db.from('growth_sequence_steps').select('id,enrolment_id,lead_id,step_number,title,due_at,completed_at').eq('organisation_id',org).order('due_at',{ascending:true}).limit(500);
 if(leadId)stepsQuery=stepsQuery.eq('lead_id',leadId);
 const {data:steps,error:stepError}=await stepsQuery;
 if(stepError)return fail('Unable to load sequence tasks',500);
 return NextResponse.json({enrolments,steps,templates:Object.keys(templates),truncated:(enrolments||[]).length===200||(steps||[]).length===500},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
 let body:Record<string,unknown>;try{body=await req.json();}catch{return fail('Invalid JSON');}
 const org=typeof body.organisationId==='string'?body.organisationId:'';
 const a=await access(req,org);if(a.error)return fail(a.error,a.status);
 const leadId=typeof body.leadId==='string'?body.leadId:'';
 const template=typeof body.template==='string'?body.template:'';
 if(!uuid.test(leadId)||!Object.prototype.hasOwnProperty.call(templates,template))return fail('Invalid lead or template');
 const lead=await a.db.from('growth_leads').select('id').eq('organisation_id',org).eq('id',leadId).maybeSingle();
 if(lead.error||!lead.data)return fail('Lead not found',404);
 const {data:enrolment,error}=await a.db.from('growth_sequence_enrolments').insert({organisation_id:org,lead_id:leadId,template,created_by:a.user.id}).select('id').single();
 if(error){if(error.code==='23505')return fail('This sequence is already assigned to this lead',409);return fail('Unable to start sequence',500);}
 const now=Date.now();
 const rows=templates[template].map((s,i)=>({enrolment_id:enrolment.id,organisation_id:org,lead_id:leadId,step_number:i+1,title:s.title,due_at:new Date(now+s.days*86400000).toISOString()}));
 const steps=await a.db.from('growth_sequence_steps').insert(rows);
 if(steps.error){await a.db.from('growth_sequence_enrolments').delete().eq('id',enrolment.id).eq('organisation_id',org);return fail('Unable to create sequence tasks',500);}
 return NextResponse.json({id:enrolment.id,stepsCreated:rows.length},{status:201});
}
export async function PATCH(req:NextRequest){
 let body:Record<string,unknown>;try{body=await req.json();}catch{return fail('Invalid JSON');}
 const org=typeof body.organisationId==='string'?body.organisationId:'';
 const a=await access(req,org);if(a.error)return fail(a.error,a.status);
 const id=typeof body.id==='string'?body.id:'';
 if(!uuid.test(id))return fail('Invalid identifier');
 if(body.action==='complete'){
  const {data,error}=await a.db.from('growth_sequence_steps').update({completed_at:new Date().toISOString()}).eq('id',id).eq('organisation_id',org).is('completed_at',null).select('id').maybeSingle();
  if(error)return fail('Unable to complete task',500);
  return data?NextResponse.json({ok:true}):fail('Task not found or already complete',404);
 }
 if(body.action==='cancel'){
  const {data,error}=await a.db.from('growth_sequence_enrolments').update({status:'cancelled',cancelled_at:new Date().toISOString()}).eq('id',id).eq('organisation_id',org).eq('status','active').select('id').maybeSingle();
  if(error)return fail('Unable to cancel sequence',500);
  return data?NextResponse.json({ok:true}):fail('Sequence not found or already cancelled',404);
 }
 return fail('Unknown action');
}
