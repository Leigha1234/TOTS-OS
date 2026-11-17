import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime='nodejs';
const json=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
const clean=(x:unknown,n:number)=>typeof x==='string'?x.trim().slice(0,n):'';
export async function POST(req:NextRequest){
 try{
  const length=Number(req.headers.get('content-length')||0);if(length>12000)return json('Payload too large',413);
  const origin=req.headers.get('origin');const allowed=(process.env.GROWTH_CAPTURE_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!origin||!allowed.includes(origin))return json('Origin not allowed',403);
  const body=await req.json();if(body.website||body.company_website)return NextResponse.json({ok:true});
  const slug=clean(body.slug,80),token=clean(body.token,100),name=clean(body.name,150),email=clean(body.email,254).toLowerCase(),phone=clean(body.phone,40);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!/^[0-9a-f]{64}$/.test(token)||!name||(!email&&!phone)||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return json('Invalid submission',400);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return json('Not configured',503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  // Atomic database function checks form status, token, and sliding-window throttle.
  const {data,error}=await db.rpc('growth_capture_submit',{p_slug:slug,p_token:token,p_name:name,p_email:email||null,p_phone:phone||null,p_source:clean(body.source,80)||'website',p_consent_email:body.consent_email===true,p_consent_sms:body.consent_sms===true});
  if(error){console.error('Growth capture error',error.code);return json('Submission unavailable',503);}
  if(data==='rate_limited')return json('Too many submissions; try later',429);
  if(data!=='ok'&&data!=='duplicate')return json('Form unavailable',404);
  return NextResponse.json({ok:true},{status:202,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin'}});
 }catch{return json('Invalid submission',400);}
}
export async function OPTIONS(req:NextRequest){const origin=req.headers.get('origin')||'';const allowed=(process.env.GROWTH_CAPTURE_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim());if(!allowed.includes(origin))return new Response(null,{status:403});return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}});}
