"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { User, Building2, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        console.error("Profile Fetch Error:", error.message);
      } else {
        setCustomer(data);
      }
      setLoading(false);
    }

    if (resolvedParams.id) fetchProfile();
  }, [resolvedParams.id]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-serif italic text-stone-500">
      Decrypting Profile...
    </div>
  );

  if (!customer) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <p className="font-serif italic text-stone-500">Record not found in database.</p>
      <Link href="/crm" className="text-[#a9b897] uppercase text-[10px] tracking-widest font-black">Return to Directory</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* NAVIGATION */}
        <Link href="/crm" className="flex items-center gap-2 text-stone-500 hover:text-[#a9b897] transition-colors group w-fit">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Directory</span>
        </Link>

        {/* PROFILE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-900 pb-12">
          <div className="space-y-4">
            <div className="p-4 bg-stone-900 w-fit rounded-3xl text-[#a9b897]">
                <User size={32} />
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter">{customer.name}</h1>
            <div className="flex items-center gap-4 text-stone-500 italic font-serif text-lg">
                <div className="flex items-center gap-2">
                    <Building2 size={18} />
                    <span>{customer.company || "Independent Record"}</span>
                </div>
                <span className="text-stone-800">|</span>
                <div className="flex items-center gap-2">
                    <Mail size={18} />
                    <span>{customer.email}</span>
                </div>
            </div>
          </div>

          <div className="bg-stone-950 border border-stone-800 p-6 rounded-[2rem] flex items-center gap-4">
            <ShieldCheck className="text-[#a9b897]" />
            <div>
                <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Stage Status</p>
                <p className="font-serif italic text-xl capitalize">{customer.stage || "Active Node"}</p>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS GRID */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-stone-950 border border-stone-800 p-8 rounded-[2.5rem] space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-600">Intelligence Data</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[9px] text-stone-500 uppercase block mb-1">Created At</label>
                        <p className="font-serif italic">{new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label className="text-[9px] text-stone-500 uppercase block mb-1">Internal UUID</label>
                        <p className="text-xs font-mono text-stone-400">{customer.id}</p>
                    </div>
                </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-8 rounded-[2.5rem] flex items-center justify-center border-dashed">
                <p className="text-stone-700 font-serif italic">Communication Logs Offline</p>
            </div>
        </div>
      </div>
    </div>
  );
}