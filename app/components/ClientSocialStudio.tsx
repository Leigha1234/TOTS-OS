"use client";
import {useEffect,useState} from "react";
import {supabase} from "@/lib/supabase";
type Post={id:string;caption:string|null;platform:string|null;status:string|null;scheduled_for:string|null;created_at:string|null};
type Account={id:string;platform:string;display_name:string|null;page_name:string|null;avatar_url:string|null;instagram_business_account_id:string|null;page_id:string|null};
export default function ClientSocialStudio({organisationId,organisationName}:{organisationId:string;organisationName:string}){
 const [posts,setPosts]=useState<Post[]>([]);const [accounts,setAccounts]=useState<Account[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{let live=true;async function load(){setLoading(true);try{
  const {data:{session}}=await supabase.auth.getSession();if(!session)throw Error("Please sign in");
  const res=await fetch(`/api/agency/social?organisationId=${encodeURIComponent(organisationId)}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:"no-store"});
  const json=await res.json();if(!res.ok)throw Error(json.error||"Unable to load posts");if(live){setPosts(json.posts||[]);setAccounts(json.accounts||[]);setError("");}
 }catch(e){if(live)setError(e instanceof Error?e.message:"Could not load posts");}finally{if(live)setLoading(false);}}
 void load();const timer=window.setInterval(()=>void load(),60000);return()=>{live=false;window.clearInterval(timer)};
 },[organisationId]);
 return <main className="mx-auto max-w-5xl space-y-5 p-6 text-[#4f4a46]">
 <header><p className="text-sm text-[#768669]">Client workspace · Social Studio</p><h1 className="text-3xl font-semibold">{organisationName}</h1><p className="mt-2 text-sm">Showing this organisation’s social posts. Drafting, publishing and account connections are disabled here until their API permissions are integrated.</p></header>
 <section className="rounded-xl border border-stone-200 bg-white p-5"><h2 className="text-lg font-semibold">Connected social accounts</h2><p className="mt-1 text-xs text-stone-500">Connections are read-only here. Existing Meta tokens remain unchanged.</p>{!loading&&!error&&(accounts.length?<div className="mt-4 grid gap-3 sm:grid-cols-2">{accounts.map(a=><div key={a.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">{a.avatar_url?<img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover"/>:<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A9B897] text-white">{(a.platform||"S").charAt(0).toUpperCase()}</div>}<div><p className="font-medium">{a.display_name||a.page_name||a.platform}</p><p className="text-xs capitalize text-stone-500">{a.platform}</p></div></div>)}</div>:<p className="mt-3 text-sm text-stone-600">No organisation-linked social accounts found. The existing Meta connections may be linked only to Mike’s user ID.</p>)}</section>
 {loading?<p>Loading posts…</p>:error?<p role="alert" className="text-red-700">{error}</p>:posts.length===0?<p className="rounded-xl bg-[#FAF8F5] p-6">No posts found for this organisation.</p>:<div className="space-y-3">{posts.map(p=><article key={p.id} className="rounded-xl border border-stone-200 bg-white p-4"><div className="mb-2 flex gap-3 text-xs font-semibold uppercase text-[#768669]"><span>{p.platform||"Social"}</span><span>{p.status||"Draft"}</span></div><p className="whitespace-pre-wrap text-sm">{p.caption||"(No caption)"}</p>{p.scheduled_for&&<p className="mt-3 text-xs text-stone-500">Scheduled: {new Date(p.scheduled_for).toLocaleString("en-GB")}</p>}</article>)}</div>}
 </main>;
}

