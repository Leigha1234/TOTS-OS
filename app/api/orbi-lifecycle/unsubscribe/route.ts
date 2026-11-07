import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export async function GET(request:Request){
 const token=new URL(request.url).searchParams.get("token");
 if(!token||!/^[0-9a-f-]{36}$/i.test(token))return new Response("Invalid link",{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return new Response("Service unavailable",{status:503});
 const db=createClient(url,key);const {error}=await db.from("orbi_lifecycle_preferences").update({unsubscribed_at:new Date().toISOString()}).eq("token",token);
 if(error)return new Response("Please try again",{status:500});
 return new Response("You've unsubscribed from ORBI. trial and follow-up emails.",{headers:{"Content-Type":"text/plain; charset=utf-8"}});
}
