import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime = "nodejs";
export async function GET(req: Request) {
 const token = new URL(req.url).searchParams.get("token") || "";
 if (!/^[0-9a-f-]{36}$/i.test(token)) return new NextResponse("Invalid unsubscribe link", {status:400});
 return new NextResponse(`<html><body style="font-family:Arial;max-width:500px;margin:80px auto"><h1>Unsubscribe from ORBI.</h1><p>Stop receiving early-access emails?</p><form method="post"><input type="hidden" name="token" value="${token}"><button style="padding:14px 22px">Confirm unsubscribe</button></form></body></html>`,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
export async function POST(req:Request){const data=await req.formData();const token=String(data.get("token")||"");if(!/^[0-9a-f-]{36}$/i.test(token))return new NextResponse("Invalid link",{status:400});const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);const {error}=await db.from("orbi_waitlist").update({unsubscribed_at:new Date().toISOString()}).eq("unsubscribe_token",token);if(error)return new NextResponse("Unable to unsubscribe",{status:500});return new NextResponse("You have been unsubscribed from ORBI. emails.",{headers:{"Content-Type":"text/plain; charset=utf-8"}})}
