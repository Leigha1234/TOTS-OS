import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function GET(req:NextRequest){
 try{
  const org=req.nextUrl.searchParams.get("organisationId")||"";
  if(!uuid.test(org))return NextResponse.json({error:"Invalid organisation"},{status:400});
  const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return NextResponse.json({error:"Unauthorised"},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return NextResponse.json({error:"Configuration missing"},{status:500});
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(token);
  if(authError||!user)return NextResponse.json({error:"Unauthorised"},{status:401});
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  // Server-side authorisation. Never trust the organisation selected in localStorage.
  const [owner,member,profile,grants]=await Promise.all([
   db.from("organisations").select("id").eq("id",org).eq("created_by",user.id).maybeSingle(),
   db.from("organisation_members").select("id").eq("organisation_id",org).eq("user_id",user.id).maybeSingle(),
   db.from("profiles").select("organisation_id").eq("id",user.id).maybeSingle(),
   db.from("agency_access_grants").select("grantee_type,grantee_email,grantee_organisation_id,permissions").eq("client_organisation_id",org).eq("status","active")
  ]);
  if([owner,member,profile,grants].some(r=>r.error))throw Error("Authorisation lookup failed");
  let permitted=!!owner.data||!!member.data||profile.data?.organisation_id===org;
  if(!permitted){
   const eligible=(grants.data||[]).filter(g=>g.permissions?.social?.view===true);
   if(user.email_confirmed_at && user.email)permitted=eligible.some(g=>g.grantee_type==="individual"&&g.grantee_email?.trim().toLowerCase()===user.email!.toLowerCase());
   if(!permitted){
    const agencyIds=[...new Set(eligible.filter(g=>g.grantee_type==="organisation"&&g.grantee_organisation_id).map(g=>g.grantee_organisation_id as string))];
    if(agencyIds.length){
     const [owned,memberOf]=await Promise.all([
      db.from("organisations").select("id").in("id",agencyIds).eq("created_by",user.id),
      db.from("organisation_members").select("organisation_id").in("organisation_id",agencyIds).eq("user_id",user.id)
     ]);
     if(owned.error||memberOf.error)throw Error("Agency membership lookup failed");
     const membership=new Set([...(owned.data||[]).map(o=>o.id),...(memberOf.data||[]).map(m=>m.organisation_id)]);
     permitted=agencyIds.some(id=>membership.has(id));
    }
   }
  }
  if(!permitted)return NextResponse.json({error:"Social access not granted"},{status:403});
  // Only public account metadata is returned. Never expose Meta access tokens.
  const {data:accounts,error:accountsError}=await db.from("social_accounts")
    .select("id,platform,display_name,page_name,avatar_url,instagram_business_account_id,page_id,updated_at")
    .eq("organisation_id",org).order("updated_at",{ascending:false});
  if(accountsError)throw Error("Unable to load connected accounts");
  const {data:posts,error}=await db.from("socials").select("id,caption,platform,status,scheduled_for,created_at,media_url").eq("organisation_id",org).order("created_at",{ascending:false}).limit(100);
  if(error)throw Error("Unable to load posts");
  return NextResponse.json({posts:posts||[],accounts:accounts||[]},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Agency social",e);return NextResponse.json({error:"Unable to load social data"},{status:500});}
}
