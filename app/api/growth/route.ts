import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const stages = ['new','contacted','qualified','booked','won','lost'];
const fail = (error:string,status=400) => NextResponse.json({error},{status});
async function access(req:NextRequest, organisationId:string) {
 if(!uuid.test(organisationId)) return {error:'Invalid organisation',status:400} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return {error:'Missing server configuration',status:500} as const;
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return {error:'Unauthorised',status:401} as const;
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return {error:'Unauthorised',status:401} as const;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [owner,member]=await Promise.all([
  db.from('organisations').select('id').eq('id',organisationId).eq('created_by',user.id).maybeSingle(),
  db.from('organisation_members').select('organisation_id').eq('organisation_id',organisationId).eq('user_id',user.id).maybeSingle()
 ]);
 if(owner.error||member.error)return {error:'Access lookup failed',status:500} as const;
 if(!owner.data&&!member.data)return {error:'Organisation access denied',status:403} as const;
 return {db,user} as const;
}
const reject=(a:{error?:string,status?:number})=>fail(a.error||'Access denied',a.status||403);
const clean=(v:unknown,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
export async function GET(req:NextRequest){
 const org=req.nextUrl.searchParams.get('organisationId')||'';
 const a=await access(req,org);if(a.error)return reject(a);
 const [leads,workflows,activities]=await Promise.all([
  a.db.from('growth_leads').select('id,name,email,phone,source,stage,value_pence,notes,next_follow_up_at,consent_email,consent_sms,created_at,updated_at').eq('organisation_id',org).order('created_at',{ascending:false}).limit(500),
  a.db.from('growth_workflows').select('id,name,trigger_stage,action_type,delay_hours,enabled,created_at').eq('organisation_id',org).order('created_at',{ascending:false}).limit(100),
  a.db.from('growth_activities').select('id,lead_id,event_type,details,created_at').eq('organisation_id',org).order('created_at',{ascending:false}).limit(100)
 ]);
 if(leads.error||workflows.error||activities.error)return fail('Growth tables unavailable. Apply the supplied SQL migration.',500);
 const rows=leads.data||[];
 const summary={total:rows.length,open:rows.filter(x=>!['won','lost'].includes(x.stage)).length,won:rows.filter(x=>x.stage==='won').length,pipelinePence:rows.filter(x=>!['won','lost'].includes(x.stage)).reduce((n,x)=>n+x.value_pence,0),wonPence:rows.filter(x=>x.stage==='won').reduce((n,x)=>n+x.value_pence,0)};
 return NextResponse.json({leads:rows,workflows:workflows.data||[],activities:activities.data||[],summary},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
 try{
  const b=await req.json();const org=clean(b.organisationId,50);const a=await access(req,org);if(a.error)return reject(a);
  if(b.kind==='workflow'){
   if(!stages.includes(b.trigger_stage)||!['suggest_follow_up','create_task'].includes(b.action_type)||!Number.isInteger(b.delay_hours)||b.delay_hours<0||b.delay_hours>720)return fail('Invalid workflow');
   const name=clean(b.name,100);if(!name)return fail('Workflow name required');
   const {data,error}=await a.db.from('growth_workflows').insert({organisation_id:org,name,trigger_stage:b.trigger_stage,action_type:b.action_type,delay_hours:b.delay_hours,enabled:false,created_by:a.user.id}).select().single();
   return error?fail('Unable to save workflow',500):NextResponse.json({workflow:data},{status:201});
  }
  const name=clean(b.name,150),email=clean(b.email,254).toLowerCase(),phone=clean(b.phone,40);
  if(!name||(!email&&!phone)||email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail('Name and valid email or phone required');
  const value=Number(b.value_pence||0);if(!Number.isSafeInteger(value)||value<0||value>100000000000)return fail('Invalid lead value');
  const {data,error}=await a.db.from('growth_leads').insert({organisation_id:org,name,email:email||null,phone:phone||null,source:clean(b.source,80)||'manual',stage:'new',value_pence:value,notes:clean(b.notes,4000),consent_email:b.consent_email===true,consent_sms:b.consent_sms===true,created_by:a.user.id}).select().single();
  if(error)return fail('Unable to create lead',500);
  await a.db.from('growth_activities').insert({organisation_id:org,lead_id:data.id,event_type:'created',actor_id:a.user.id});
  return NextResponse.json({lead:data},{status:201});
 }catch{return fail('Invalid request');}
}
export async function PATCH(req:NextRequest){
 try{
  const b=await req.json(),org=clean(b.organisationId,50),id=clean(b.id,50);
  const a=await access(req,org);if(a.error)return reject(a);if(!uuid.test(id))return fail('Invalid id');
  if(b.kind==='workflow'){
   if(typeof b.enabled!=='boolean')return fail('Enabled must be boolean');
   const {data,error}=await a.db.from('growth_workflows').update({enabled:b.enabled}).eq('organisation_id',org).eq('id',id).select().maybeSingle();
   return error?fail('Unable to update workflow',500):!data?fail('Workflow not found',404):NextResponse.json({workflow:data});
  }
  const changes:Record<string,unknown>={};
  if(b.stage!==undefined){if(!stages.includes(b.stage))return fail('Invalid stage');changes.stage=b.stage;}
  if(b.notes!==undefined)changes.notes=clean(b.notes,4000);
  if(b.next_follow_up_at!==undefined){
   if(b.next_follow_up_at!==null&&(typeof b.next_follow_up_at!=='string'||!Number.isFinite(Date.parse(b.next_follow_up_at))))return fail('Invalid follow-up date');
   changes.next_follow_up_at=b.next_follow_up_at;
  }
  if(!Object.keys(changes).length)return fail('Nothing to update');
  changes.updated_at=new Date().toISOString();
  const {data:before,error:beforeError}=await a.db.from('growth_leads').select('stage').eq('organisation_id',org).eq('id',id).maybeSingle();
  if(beforeError)return fail('Unable to check lead',500);if(!before)return fail('Lead not found',404);
  const {data,error}=await a.db.from('growth_leads').update(changes).eq('organisation_id',org).eq('id',id).select().maybeSingle();
  if(error||!data)return fail('Unable to update lead',500);
  const event_type=b.stage!==undefined&&b.stage!==before.stage?'stage_changed':b.next_follow_up_at!==undefined?'follow_up_set':'note';
  await a.db.from('growth_activities').insert({organisation_id:org,lead_id:id,event_type,details:{from:before.stage,to:data.stage},actor_id:a.user.id});
  return NextResponse.json({lead:data});
 }catch{return fail('Invalid request');}
}
