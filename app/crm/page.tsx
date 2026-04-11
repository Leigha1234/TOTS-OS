"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Plus, Building2, ArrowRight, Search } from "lucide-react";
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-stone-500">Scanning Directory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="flex justify-between items-end border-b border-stone-900 pb-8">
          <div>
            <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Central Intelligence</p>
            <h1 className="text-5xl font-serif italic tracking-tighter">CRM Directory</h1>
          </div>
          <button className="bg-[#a9b897] text-black p-4 rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(169,184,151,0.2)]">
            <Plus size={24} />
          </button>
        </div>

        <div className="grid gap-4">
          {customers.length === 0 ? (
            <div className="border border-dashed border-stone-800 rounded-[2.5rem] p-20 text-center">
              <p className="font-serif italic text-stone-600 text-lg">No active nodes detected in the database.</p>
              <p className="text-[10px] uppercase tracking-widest text-stone-800 mt-2">Initialize a new record to begin</p>
            </div>
          ) : (
            customers.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="group bg-stone-950 border border-stone-900 p-8 rounded-[2.5rem] flex items-center justify-between hover:border-[#a9b897]/50 transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-stone-900 rounded-2xl text-stone-500 group-hover:text-[#a9b897] transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-stone-600 text-[10px] uppercase font-black tracking-widest mt-1">
                      <Building2 size={12} />
                      {customer.company || "Independent Node"}
                    </div>
                  </div>
                </div>
                <ArrowRight className="text-stone-800 group-hover:text-[#a9b897] group-hover:translate-x-2 transition-all" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}