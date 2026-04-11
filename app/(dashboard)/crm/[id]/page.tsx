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
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) {
          setDebugError(error.message);
        } else {
          setCustomer(data);
        }
      } catch (err: any) {
        setDebugError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (resolvedParams.id) fetchProfile();
  }, [resolvedParams.id]);

  if (loading) return (
    <div className="h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (debugError || !customer) return (
    <div className="h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <p className="font-serif italic text-[var(--text-muted)] text-xl">Record Access Denied</p>
      <Link href="/crm" className="mt-6 text-[var(--accent)] uppercase text-[10px] tracking-widest font-black hover:opacity-70 transition-opacity">
        ← Back to Directory
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-16 transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* BREADCRUMB */}
        <Link href="/crm" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent)] group w-fit transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Directory Access</span>
        </Link>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border)] pb-12">
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-soft)] w-fit rounded-3xl text-[var(--accent)] shadow-sm border border-[var(--border)]">
              <User size={32} />
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter">
              {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-[var(--text-muted)] italic font-serif text-lg">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="opacity-40" />
                  <span>{customer.company || "Independent Record"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="opacity-40" />
                  <span>{customer.email}</span>
                </div>
            </div>
          </div>

          {/* STATUS WIDGET */}
          <div className="glass-panel p-6 px-8 flex items-center gap-5 shadow-sm">
            <div className="p-3 bg-[var(--accent)] text-white rounded-2xl shadow-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
                <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">Stage Status</p>
                <p className="font-serif italic text-2xl capitalize text-[var(--accent)]">{customer.stage || "Active Node"}</p>
            </div>
          </div>
        </div>

        {/* DATA GRID */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="card-fancy p-10 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] border-b border-[var(--border)] pb-4">
                  Intelligence Profile
                </h3>
                <div className="space-y-8">
                    <div className="group">
                        <label className="text-[9px] text-[var(--text-muted)] uppercase block mb-2 tracking-[0.2em] font-black group-hover:text-[var(--accent)] transition-colors">
                          Node Identification
                        </label>
                        <p className="font-serif italic text-2xl group-hover:translate-x-1 transition-transform">
                          {customer.name}
                        </p>
                    </div>
                    
                    <div className="group">
                        <label className="text-[9px] text-[var(--text-muted)] uppercase block mb-2 tracking-[0.2em] font-black group-hover:text-[var(--accent)] transition-colors">
                          Deployment Date
                        </label>
                        <p className="font-serif italic text-2xl group-hover:translate-x-1 transition-transform">
                          {new Date(customer.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* SECONDARY DATA CARD */}
            <div className="glass-panel p-10 flex flex-col justify-center items-center text-center space-y-4 opacity-80">
               <div className="w-12 h-12 rounded-full bg-[var(--bg-soft)] flex items-center justify-center border border-[var(--border)]">
                 <Building2 size={20} className="text-[var(--text-muted)]" />
               </div>
               <p className="font-serif italic text-stone-500 leading-relaxed max-w-[200px]">
                 Additional node metadata will be populated as intelligence grows.
               </p>
            </div>
        </div>
      </div>
    </div>
  );
}