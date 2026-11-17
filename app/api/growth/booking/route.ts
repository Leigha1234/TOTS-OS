import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply=(error:string,status=400)=>NextResponse.json({error},{status});
async function context(req:NextRequest,org:string,lead:string){
 if(!UUID.test(org)||!UUID.test(lead))return {error:'Invalid organisation or lead',status:400} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return {error:'Server configuration missing',status:500} as const;
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)return {error:'Unauthorised',status:401} as const;
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);if(authError||!user)return {error:'Unauthorised',status:401} as const;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [owner,member,leadRow]=await Promise.all([
  db.from('organisations').select('id').eq('id',org).eq('created_by',user.id).maybeSingle(),
  db.from('organisation_members').select('organisation_id').eq('organisation_id',org).eq('user_id',user.id).maybeSingle(),
  db.from('growth_leads').select('id,stage').eq('organisation_id',org).eq('id',lead).maybeSingle()
 ]);
 if(owner.error||member.error||leadRow.error)return {error:'Access lookup failed',status:500} as const;
 if(!owner.data&&!member.data)return {error:'Access denied',status:403} as const;
 if(!leadRow.data)return {error:'Lead not found',status:404} as const;
 return {db,user,lead:leadRow.data} as const;
}
export async function GET(req:NextRequest){
 const org=req.nextUrl.searchParams.get('organisationId')||'',lead=req.nextUrl.searchParams.get('leadId')||'';
 const c=await context(req,org,lead);if(c.error)return reply(c.error,c.status);
 const {data,error}=await c.db.from('growth_booking_handoffs').select('id,title,booking_url,status,appointment_at,notes,created_at,updated_at').eq('organisation_id',org).eq('lead_id',lead).order('created_at',{ascending:false}).limit(50);
 return error?reply('Apply the Part 2 booking migration',500):NextResponse.json({handoffs:data||[]},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
 let b:Record<string,unknown>;try{b=await req.json();}catch{return reply('Invalid JSON');}
 const org=String(b.organisationId||''),lead=String(b.leadId||'');const c=await context(req,org,lead);if(c.error)return reply(c.error,c.status);
 const title=String(b.title||'').trim().slice(0,150),raw=String(b.booking_url||'').trim();
 if(!title)return reply('Title required');let bookingUrl:string;
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||!u.hostname||u.hostname==='localhost')return reply('Use a public HTTPS booking URL');bookingUrl=u.toString();}catch{return reply('Valid HTTPS booking URL required');}
 if(bookingUrl.length>2000)return reply('URL too long');
 const notes=String(b.notes||'').trim().slice(0,2000);
 const {data,error}=await c.db.from('growth_booking_handoffs').insert({organisation_id:org,lead_id:lead,title,booking_url:bookingUrl,notes,created_by:c.user.id}).select('id,title,booking_url,status,appointment_at,notes,created_at,updated_at').single();
 if(error)return reply('Could not create booking handoff',500);
 await c.db.from('growth_activities').insert({organisation_id:org,lead_id:lead,event_type:'booking_handoff_created',details:{handoff_id:data.id},actor_id:c.user.id});
 return NextResponse.json({handoff:data},{status:201});
}
export async function PATCH(req:NextRequest){
 let b:Record<string,unknown>;try{b=await req.json();}catch{return reply('Invalid JSON');}
 const org=String(b.organisationId||''),lead=String(b.leadId||'');const c=await context(req,org,lead);if(c.error)return reply(c.error,c.status);
 const id=String(b.id||''),status=String(b.status||'');if(!UUID.test(id)||!['proposed','sent','booked','cancelled'].includes(status))return reply('Invalid handoff or status');
 let appointment_at:string|null=null;
 if(status==='booked'){
  if(typeof b.appointment_at!=='string'||!Number.isFinite(Date.parse(b.appointment_at)))return reply('Appointment date required for booked status');
  appointment_at=new Date(b.appointment_at).toISOString();
 }
 const {data,error}=await c.db.from('growth_booking_handoffs').update({status,appointment_at,updated_at:new Date().toISOString()}).eq('organisation_id',org).eq('lead_id',lead).eq('id',id).select('id,title,booking_url,status,appointment_at,notes,created_at,updated_at').maybeSingle();
 if(error)return reply('Could not update handoff',500);if(!data)return reply('Handoff not found',404);
 await c.db.from('growth_activities').insert({organisation_id:org,lead_id:lead,event_type:'booking_handoff_updated',details:{handoff_id:id,status},actor_id:c.user.id});
 return NextResponse.json({handoff:data});
}
