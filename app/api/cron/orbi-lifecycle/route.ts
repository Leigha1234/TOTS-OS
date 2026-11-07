import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const DAY=86400000;
const messages:Record<string,[string,string]>= {
 trial_0:["Welcome to your ORBI. trial","Your 14 days start now. Add your business details and explore your workspace."],
 trial_1:["Make ORBI. yours","Set up your business profile, add your first contact and explore your chosen modules."],
 trial_3:["Put ORBI. to work","Try one real workflow today: a customer enquiry, project, invoice or campaign."],
 trial_7:["Halfway through your ORBI. trial","You're halfway through. Explore another module and reply if you need help."],
 trial_11:["Three days left in your ORBI. trial","Your trial is nearly over. Review which modules you use and the plan that fits."],
 trial_13:["Your ORBI. trial ends tomorrow","Take a final look at your workspace and choose how you'd like to continue."],
 expired_0:["Your ORBI. trial has ended","Thanks for trying ORBI. You can review plans if you'd like to continue."],
 expired_2:["Still juggling too many tools?","Bring your contacts, projects and business admin back together in ORBI."],
 expired_5:["What could you manage in ORBI.?","Choose the modules that fit your business and keep the important details together."],
 expired_10:["Ready to get back in orbit?","We'd love to welcome you back. Explore your options or reply with any questions."],
 converted:["Thanks for choosing ORBI.","Your subscription is active. We're excited to help you get the most from your modules."]
};
export async function GET(req:Request){
 if(!process.env.CRON_SECRET||req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,api=process.env.RESEND_API_KEY;
 if(!url||!key||!api)return NextResponse.json({error:"Missing configuration"},{status:500});
 const db=createClient(url,key),resend=new Resend(api),now=Date.now();let sent=0,skipped=0,failed=0;
 const {data:orgs,error}=await db.from("organisations").select("id,subscription_status,retention_trial_ends_at").not("retention_trial_ends_at","is",null).limit(500);
 if(error)return NextResponse.json({error:"Organisation lookup failed"},{status:500});
 for(const org of orgs||[]){
  const end=Date.parse(org.retention_trial_ends_at);if(!Number.isFinite(end))continue;
  const status=String(org.subscription_status||"").toLowerCase();let stage:string|undefined;
  if(["active","paid"].includes(status))stage="converted";
  else if(["trial","trialing"].includes(status)&&now<end){const day=Math.floor((now-(end-14*DAY))/DAY);stage=[13,11,7,3,1,0].filter(x=>day>=x).map(x=>`trial_${x}`)[0];}
  else if(now>=end){const day=Math.floor((now-end)/DAY);stage=[10,5,2,0].filter(x=>day>=x).map(x=>`expired_${x}`)[0];}
  if(!stage)continue;
  const {data:members}=await db.from("organisation_members").select("user_id").eq("organisation_id",org.id).limit(1);
  const userId=members?.[0]?.user_id;if(!userId){skipped++;continue;}
  const {data:user}=await db.auth.admin.getUserById(userId);const email=user?.user?.email?.toLowerCase();if(!email){skipped++;continue;}
  // Explicit allow-list prevents accidental messaging of imported CRM records.
  const {data:pref}=await db.from("orbi_lifecycle_preferences").select("token,unsubscribed_at").eq("email",email).maybeSingle();
  if(!pref||pref.unsubscribed_at){skipped++;continue;}
  const eventKey=`${org.id}:${stage}:${new Date(end).toISOString().slice(0,10)}`;
  const {error:claim}=await db.from("orbi_lifecycle_sends").insert({event_key:eventKey,organisation_id:org.id,email,stage,status:"pending"});
  if(claim){skipped++;continue;}
  const [subject,body]=messages[stage];const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://orbi-os.co.uk").replace(/\/$/,"");
  const unsub=`${base}/api/orbi-lifecycle/unsubscribe?token=${pref.token}`;
  const html=`<div style="background:#f5f1e8;padding:30px"><div style="max-width:560px;margin:auto;background:white;padding:36px;border-radius:12px;font-family:Arial;color:#103d31"><h1 style="font-family:Georgia">ORBI.</h1><h2>${subject}</h2><p style="line-height:1.8">${body}</p><a href="${base}/login" style="background:#103d31;color:white;padding:14px 20px;display:inline-block;text-decoration:none">Open ORBI. →</a><p style="margin-top:35px;font-size:12px"><a href="${unsub}">Unsubscribe from trial emails</a></p></div></div>`;
  try{const result=await resend.emails.send({from:process.env.ORBI_LIFECYCLE_FROM_EMAIL||"ORBI. <hello@orbi-os.co.uk>",to:email,subject,html,headers:{"List-Unsubscribe":`<${unsub}>`}});if(result.error)throw new Error(result.error.message);await db.from("orbi_lifecycle_sends").update({status:"sent",sent_at:new Date().toISOString()}).eq("event_key",eventKey);sent++;}
  catch(err){console.error("[ORBI LIFECYCLE]",eventKey,err);await db.from("orbi_lifecycle_sends").update({status:"failed"}).eq("event_key",eventKey);failed++;}
 }
 return NextResponse.json({sent,skipped,failed});
}
