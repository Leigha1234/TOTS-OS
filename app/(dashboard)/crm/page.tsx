"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Plus, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDirectory() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order('created_at', { ascending: false });

      if (data) setCustomers(data);
      setLoading(false);
    }
    fetchDirectory();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-[var(--text-muted)]">Scanning Directory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-16 transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* HEADER */}
        <div className="flex justify-between items-end border-b border-[var(--border)] pb-8">
          <div>
            <p className="text-[var(--accent)] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Central Intelligence</p>
            <h1 className="text-5xl font-serif italic tracking-tighter">CRM Directory</h1>
          </div>
          <button className="bg-[var(--accent)] text-white p-5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
            <Plus size={24} />
          </button>
        </div>

        {/* DIRECTORY GRID */}
        <div className="grid gap-6">
          {customers.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-[2.5rem] p-24 text-center">
              <p className="font-serif italic text-[var(--text-muted)] text-xl">No active nodes detected in the database.</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] mt-4 opacity-60">Initialize a new record to begin</p>
            </div>
          ) : (
            customers.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="card-fancy p-8 flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-[var(--bg-soft)] rounded-2xl text-[var(--text-muted)] group-hover:bg-white/20 group-hover:text-white transition-all">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif italic tracking-tight group-hover:text-white transition-colors">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-white/70 text-[10px] uppercase font-black tracking-widest mt-2 transition-colors">
                      <Building2 size={12} />
                      {customer.company || "Independent Node"}
                    </div>
                  </div>
                </div>
                
                <div className="w-12 h-12 rounded-full border border-[var(--border)] group-hover:border-white/40 flex items-center justify-center transition-all group-hover:translate-x-2">
                  <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}