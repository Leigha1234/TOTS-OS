import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const APP_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://orbi-os.co.uk").replace(/\/$/, "");
const FROM = process.env.ORBI_WAITLIST_FROM_EMAIL || "ORBI. <hello@orbi-os.co.uk>";
const escape = (s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c));
function content(stage:string, name:string){const hi=name?`Hi ${escape(name)},`:'Hello,';
 switch(stage){
 case 'welcome':return {subject:"You're on the ORBI. early-access list",preview:"Welcome to a simpler way to run your business.",heading:"You're in orbit.",body:`${hi}<br/><br/>You're on the list. ORBI. is bringing your customers, projects, finances, marketing and more together — so running a business feels a little less like juggling.<br/><br/>We'll show you what we're building and let you know when it's time to get started.`,cta:"Explore ORBI."};
 case 'story':return {subject:"Running a business shouldn't mean running 10 apps",preview:"The reason we built ORBI.",heading:"Too many moving parts?",body:`${hi}<br/><br/>A customer enquiry in one place. An invoice somewhere else. Tasks in a spreadsheet. Marketing in another tab.<br/><br/>Sound familiar?<br/><br/>We built ORBI. to bring those moving parts together. Not to give you more admin — to give you less of it.<br/><br/>What's the one part of running your business you'd love to simplify? Hit reply and tell us.`,cta:"See what's coming"};
 case 'closer':return {subject:"A simpler working day starts here",preview:"See how your tools fit together.",heading:"Your day, connected.",body:`${hi}<br/><br/>An enquiry becomes a contact. A contact becomes a project. The work turns into an invoice. ORBI. helps you keep the details together so you can focus on the business itself.<br/><br/>We're almost ready to show you around.`,cta:"See ORBI."};
 case 'demo':return {subject:"A first look at what ORBI. can do",preview:"Customers, projects, marketing — one orbit.",heading:"One business. One home.",body:`${hi}<br/><br/>Imagine opening one workspace to see your customers, follow up on enquiries, organise projects and keep on top of marketing.<br/><br/>That's what ORBI. is designed for. You can choose the tools your business actually needs, rather than forcing your business into someone else's workflow.<br/><br/>We'll be opening the doors soon.`,cta:"Preview ORBI."};
 default:return {subject:"ORBI. is here — your invitation inside",preview:"Your early-access invitation has arrived.",heading:"It's time to get in orbit.",body:`${hi}<br/><br/>ORBI. is ready to explore. Bring your customers, projects, finances and marketing into one connected workspace.<br/><br/>You've been with us before launch — now we'd love you to see it for yourself.`,cta:"Explore ORBI. now"};
 }}
export async function GET(req:Request){
 if(!process.env.CRON_SECRET || req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,apiKey=process.env.RESEND_API_KEY;
 if(!url||!key||!apiKey)return NextResponse.json({error:"Missing server configuration"},{status:500});
 const db=createClient(url,key);const resend=new Resend(apiKey);const now=new Date();const launch=new Date("2026-11-30T09:00:00Z");
 const {data, error}=await db.from("orbi_waitlist").select("id,email,first_name,created_at,unsubscribe_token,welcome_sent_at,story_sent_at,demo_sent_at,closer_sent_at,launch_sent_at").is("unsubscribed_at",null).order("created_at",{ascending:true}).limit(100);
 if(error){console.error("[ORBI WAITLIST] fetch failed",error);return NextResponse.json({error:"Database error"},{status:500});}
 let sent=0,failed=0;for(const row of data||[]){const age=(now.getTime()-new Date(row.created_at).getTime())/86400000;
 let stage:"welcome"|"story"|"demo"|"closer"|"launch"|null=null;
 if(!row.welcome_sent_at)stage="welcome";
 else if(age>=2&&!row.story_sent_at)stage="story";
 else if(age>=5&&!row.demo_sent_at)stage="demo";
 else if(age>=10&&!row.closer_sent_at&&now<launch)stage="closer";
 else if(now>=launch&&!row.launch_sent_at)stage="launch";
 if(!stage)continue;
 const message=content(stage,row.first_name||"");const unsub=`${APP_URL}/api/early-access/unsubscribe?token=${row.unsubscribe_token}`;
 const html=`<div style="background:#f5f1e8;padding:36px 16px"><div style="max-width:540px;margin:auto;background:#fff;padding:35px;border-radius:12px;color:#153c32;font-family:Arial,sans-serif"><div style="font-family:Georgia,serif;font-size:32px;font-weight:bold">ORBI.</div><h1 style="font-family:Georgia,serif;font-weight:normal;font-size:38px">${message.heading}</h1><p style="line-height:1.8;color:#43584f">${message.body}</p><a href="${APP_URL}" style="display:inline-block;background:#103d31;color:white;text-decoration:none;padding:15px 22px;border-radius:8px">${message.cta} →</a><p style="font-size:11px;color:#6d7972;margin-top:36px">You're receiving this because you joined the ORBI. early-access list. <a href="${unsub}">Unsubscribe</a></p></div></div>`;
 try{const result=await resend.emails.send({from:FROM,to:row.email,subject:message.subject,html,headers:{"List-Unsubscribe":`<${unsub}>`}});if(result.error)throw new Error(result.error.message);const column=stage==="welcome"?"welcome_sent_at":stage==="story"?"story_sent_at":stage==="demo"?"demo_sent_at":stage==="closer"?"closer_sent_at":"launch_sent_at";const {error:saveError}=await db.from("orbi_waitlist").update({[column]:new Date().toISOString()}).eq("id",row.id).is(column,null);if(saveError)throw saveError;sent++;}catch(err){console.error("[ORBI WAITLIST] send failed",row.id,err);failed++;}
 }
 return NextResponse.json({processed:(data||[]).length,sent,failed});
}
