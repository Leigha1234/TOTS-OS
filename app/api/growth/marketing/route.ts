import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const respond = (error:string,status=400)=>NextResponse.json({error},{status});
async function authorize(req:NextRequest,organisationId:string){
 if(!uuid.test(organisationId)) return {error:'Invalid organisation',status:400} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return {error:'Missing server configuration',status:500} as const;
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return {error:'Unauthorised',status:401} as const;
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);
 if(error||!user)return {error:'Unauthorised',status:401} as const;
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [owner,member]=await Promise.all([
  db.from('organisations').select('id').eq('id',organisationId).eq('created_by',user.id).maybeSingle(),
  db.from('organisation_members').select('organisation_id').eq('organisation_id',organisationId).eq('user_id',user.id).maybeSingle()
 ]);
 if(owner.error||member.error)return {error:'Access check failed',status:500} as const;
 if(!owner.data&&!member.data)return {error:'Organisation access denied',status:403} as const;
 return {db,user} as const;
}
export async function GET(req:NextRequest){
 const org=req.nextUrl.searchParams.get('organisationId')||'';
 const a=await authorize(req,org);if(a.error)return respond(a.error,a.status);
 const {data,error}=await a.db.from('growth_leads').select('id,name,email,stage,source,consent_email,created_at').eq('organisation_id',org).order('created_at',{ascending:false}).limit(1000);
 if(error)return respond('Unable to load marketing eligibility',500);
 const leads=data||[];
 const eligible=leads.filter(l=>l.email&&l.consent_email===true&&l.stage!=='lost');
 return NextResponse.json({leads,summary:{total:leads.length,eligible:eligible.length,withoutConsent:leads.filter(l=>l.email&&!l.consent_email).length,withoutEmail:leads.filter(l=>!l.email).length},truncated:leads.length===1000},{headers:{'Cache-Control':'no-store'}});
}
export async function PATCH(req:NextRequest){
 let body:Record<string,unknown>;try{body=await req.json();}catch{return respond('Invalid JSON');}
 const org=typeof body.organisationId==='string'?body.organisationId:'';
 const a=await authorize(req,org);if(a.error)return respond(a.error,a.status);
 const id=typeof body.leadId==='string'?body.leadId:'';
 if(!uuid.test(id)||typeof body.consentEmail!=='boolean')return respond('Invalid lead or consent');
 const source=typeof body.evidence==='string'?body.evidence.trim().slice(0,300):'';
 if(body.consentEmail===true&&source.length<10)return respond('Record the consent evidence and date before enabling marketing (at least 10 characters)');
 const existing=await a.db.from('growth_leads').select('id,consent_email').eq('id',id).eq('organisation_id',org).maybeSingle();
 if(existing.error)return respond('Unable to check lead',500);
 if(!existing.data)return respond('Lead not found',404);
 const updated=await a.db.from('growth_leads').update({consent_email:body.consentEmail}).eq('id',id).eq('organisation_id',org).select('id,consent_email').single();
 if(updated.error)return respond('Unable to update consent',500);
 const audit=await a.db.from('growth_activities').insert({organisation_id:org,lead_id:id,event_type:'email_consent_updated',actor_id:a.user.id,details:{previous:existing.data.consent_email,current:body.consentEmail,evidence:source||'Opted out manually',recorded_at:new Date().toISOString()}});
 if(audit.error){await a.db.from('growth_leads').update({consent_email:existing.data.consent_email}).eq('id',id).eq('organisation_id',org);return respond('Consent audit failed; please retry',500);}
 return NextResponse.json({lead:updated.data},{headers:{'Cache-Control':'no-store'}});
}
