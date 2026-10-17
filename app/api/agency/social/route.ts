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


import { createClient as makeClient } from "@supabase/supabase-js";
const validUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function authorize(req:NextRequest,org:string,action:"create"|"edit"|"delete") {
 if(!validUUID.test(org)) return {error:"Invalid organisation",status:400} as const;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!anon||!key)return {error:"Server configuration missing",status:500} as const;
 const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return {error:"Unauthorised",status:401} as const;
 const auth=makeClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await auth.auth.getUser(token);
 if(authError||!user)return {error:"Unauthorised",status:401} as const;
 const db=makeClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [owner,member,profile,grants]=await Promise.all([
 db.from("organisations").select("id").eq("id",org).eq("created_by",user.id).maybeSingle(),
 db.from("organisation_members").select("id").eq("organisation_id",org).eq("user_id",user.id).maybeSingle(),
 db.from("profiles").select("organisation_id").eq("id",user.id).maybeSingle(),
 db.from("agency_access_grants").select("grantee_type,grantee_email,grantee_organisation_id,permissions").eq("client_organisation_id",org).eq("status","active")
 ]);
 if([owner,member,profile,grants].some(r=>r.error))return {error:"Access verification failed",status:500} as const;
 let allowed=!!owner.data||!!member.data||profile.data?.organisation_id===org;
 if(!allowed){
  const eligible=(grants.data||[]).filter(g=>g.permissions?.social?.[action]===true);
  if(user.email_confirmed_at&&user.email)allowed=eligible.some(g=>g.grantee_type==="individual"&&g.grantee_email?.trim().toLowerCase()===user.email!.toLowerCase());
  if(!allowed){
   const ids=[...new Set(eligible.filter(g=>g.grantee_type==="organisation"&&g.grantee_organisation_id).map(g=>g.grantee_organisation_id as string))];
   if(ids.length){
    const [owned,joined]=await Promise.all([db.from("organisations").select("id").in("id",ids).eq("created_by",user.id),db.from("organisation_members").select("organisation_id").in("organisation_id",ids).eq("user_id",user.id)]);
    if(owned.error||joined.error)return {error:"Agency membership lookup failed",status:500} as const;
    const membership=new Set([...(owned.data||[]).map(x=>x.id),...(joined.data||[]).map(x=>x.organisation_id)]);
    allowed=ids.some(id=>membership.has(id));
   }
  }
 }
 if(!allowed)return {error:`Social ${action} permission not granted`,status:403} as const;
 return {db,user} as const;
}
const reject=(result:{error?:string;status?:number})=>NextResponse.json({error:result.error??"Unauthorised"},{status:result.status??500});
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const org=body?.organisationId;
  const access=await authorize(req,org,"create");if(access.error!==undefined)return reject(access);
  const caption=typeof body.caption==="string"?body.caption.trim():"";
  const platform=body.platform;
  if(!caption||caption.length>10000||!(["facebook","instagram"].includes(platform)))return NextResponse.json({error:"Provide a caption (up to 10,000 characters) and choose Facebook or Instagram"},{status:400});
  // Draft only. Never set scheduled/publishing status from a browser request.
  const {data,error}=await access.db.from("socials").insert({organisation_id:org,user_id:access.user.id,caption,platform,status:"draft"}).select("id,caption,platform,status,scheduled_for,created_at,media_url").single();
  if(error){console.error("Agency social draft insert",error);return NextResponse.json({error:"Unable to save draft"},{status:500});}
  return NextResponse.json({post:data},{status:201});
 }catch(e){console.error("Agency social draft",e);return NextResponse.json({error:"Unable to save draft"},{status:500});}
}
export async function PATCH(req:NextRequest){
 try{
  const body=await req.json();const org=body?.organisationId,id=body?.postId;
  if(!validUUID.test(id||""))return NextResponse.json({error:"Invalid post"},{status:400});
  const access=await authorize(req,org,"edit");if(access.error!==undefined)return reject(access);
  const caption=typeof body.caption==="string"?body.caption.trim():"";
  if(!caption||caption.length>10000)return NextResponse.json({error:"Caption must be between 1 and 10,000 characters"},{status:400});
  const {data,error}=await access.db.from("socials").update({caption}).eq("id",id).eq("organisation_id",org).eq("status","draft").select("id").maybeSingle();
  if(error)return NextResponse.json({error:"Unable to update draft"},{status:500});
  if(!data)return NextResponse.json({error:"Draft not found or no longer editable"},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update draft"},{status:500});}
}
export async function DELETE(req:NextRequest){
 try{
  const body=await req.json();const org=body?.organisationId,id=body?.postId;
  if(!validUUID.test(id||""))return NextResponse.json({error:"Invalid post"},{status:400});
  const access=await authorize(req,org,"delete");if(access.error!==undefined)return reject(access);
  const {data,error}=await access.db.from("socials").delete().eq("id",id).eq("organisation_id",org).eq("status","draft").select("id").maybeSingle();
  if(error)return NextResponse.json({error:"Unable to delete draft"},{status:500});
  if(!data)return NextResponse.json({error:"Draft not found or no longer deletable"},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to delete draft"},{status:500});}
}
