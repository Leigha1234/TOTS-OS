"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { User, Building2, Mail, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      console.log("Fetching profile for ID:", resolvedParams.id);
      
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) {
          console.error("Supabase Error:", error);
          setDebugError(error.message);
        } else {
          console.log("Customer data found:", data);
          setCustomer(data);
        }
      } catch (err: any) {
        console.error("Unexpected Script Error:", err);
        setDebugError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (resolvedParams.id) {
      fetchProfile();
    } else {
      setDebugError("No ID found in URL parameters.");
      setLoading(false);
    }
  }, [resolvedParams.id]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-stone-500">Decrypting Profile...</p>
    </div>
  );

  if (debugError || !customer) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6 text-center">
      <AlertCircle className="text-red-500" size={48} />
      <div className="space-y-2">
        <p className="font-serif italic text-stone-400 text-xl">Record Access Denied or Not Found</p>
        {debugError && <p className="text-xs font-mono text-red-900 bg-red-950/30 p-2 rounded">Error: {debugError}</p>}
      </div>
      <Link href="/crm" className="bg-stone-900 text-[#a9b897] px-8 py-3 rounded-2xl uppercase text-[10px] tracking-widest font-black hover:bg-stone-800 transition-all">
        Return to Directory
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-12">
        <Link href="/crm" className="flex items-center gap-2 text-stone-500 hover:text-[#a9b897] transition-colors group w-fit">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Directory Access</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-900 pb-12">
          <div className="space-y-4">
            <div className="p-4 bg-stone-900 w-fit rounded-3xl text-[#a9b897]">
                <User size={32} />
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-stone-500 italic font-serif text-lg">
                <div className="flex items-center gap-2">
                    <Building2 size={18} />
                    <span>{customer.company || "Independent Record"}</span>
                </div>
                <span className="text-stone-800 hidden md:inline">|</span>
                <div className="flex items-center gap-2">
                    <Mail size={18} />
                    <span>{customer.email}</span>
                </div>
            </div>
          </div>

          <div className="bg-stone-950 border border-stone-800 p-6 rounded-[2rem] flex items-center gap-4 shadow-xl">
            <ShieldCheck className="text-[#a9b897]" />
            <div>
                <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Stage Status</p>
                <p className="font-serif italic text-xl capitalize">{customer.stage || "Active Node"}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-stone-950 border border-stone-800 p-8 rounded-[2.5rem] space-y-4 hover:border-[#a9b897]/30 transition-all">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-600">Intelligence Data</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[9px] text-stone-500 uppercase block mb-1">Created At</label>
                        <p className="font-serif italic text-stone-300">{new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                    <div>
                        <label className="text-[9px] text-stone-500 uppercase block mb-1">Internal UUID</label>
                        <p className="text-[10px] font-mono text-stone-600 break-all">{customer.id}</p>
                    </div>
                </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-8 rounded-[2.5rem] flex items-center justify-center border-dashed group">
                <p className="text-stone-700 font-serif italic group-hover:text-stone-500 transition-colors">Communication Logs Offline</p>
            </div>
        </div>
      </div>
    </div>
  );
}