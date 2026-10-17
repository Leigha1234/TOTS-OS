"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import OriginalSocialStudio from "./OriginalSocialStudio";
import ClientSocialStudio from "@/app/components/ClientSocialStudio";
const KEY = "tots_agency_preview_organisation_id";
type Context = {id:string;name:string;kind:"direct"|"delegated";permissions:Record<string,Record<string,boolean>>|null};
export default function SocialPage() {
 const [loading,setLoading]=useState(true);
 const [context,setContext]=useState<Context|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{
  let alive=true;
  async function refresh(){
   setLoading(true);
   try {
    const {data:{session}}=await supabase.auth.getSession();
    if(!session)throw Error("Please log in");
    const r=await fetch("/api/agency/contexts",{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
    const j=await r.json();if(!r.ok)throw Error(j.error||"Unable to check access");
    const contexts:Context[]=j.contexts||[];
    const selected=localStorage.getItem(KEY);
    const next=contexts.find(c=>c.id===selected)||contexts.find(c=>c.kind==="direct")||null;
    if(alive){setContext(next);setError("");}
   }catch(e){if(alive){setContext(null);setError(e instanceof Error?e.message:"Access check failed");}}
   finally{if(alive)setLoading(false);}
  }
  void refresh();const changed=()=>void refresh();
  window.addEventListener("tots:organisation-changed",changed);window.addEventListener("focus",changed);
  return()=>{alive=false;window.removeEventListener("tots:organisation-changed",changed);window.removeEventListener("focus",changed)};
 },[]);
 if(loading)return <div className="p-8">Checking organisation access…</div>;
 if(error)return <div role="alert" className="p-8 text-red-700">{error}</div>;
 if(!context)return <div className="p-8">No authorised organisation found.</div>;
 if(context.kind==="delegated")return <ClientSocialStudio key={context.id} organisationId={context.id} organisationName={context.name}/>;
 return <OriginalSocialStudio key={context.id}/>;
}
