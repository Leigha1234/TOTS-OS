"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; // Import the synchronous client
import { User, Plus, Building2, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Initial fetch
    fetchDirectory();

    // Real-time listener
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchDirectory())
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);

  async function fetchDirectory() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order('created_at', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  }

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-stone-500">Scanning Directory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-900 pb-8">
          <div className="space-y-2">
            <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.4em]">Central Intelligence</p>
            <h1 className="text-6xl font-serif italic tracking-tighter">CRM Directory</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-[#a9b897] transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search Nodes..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-900/50 border border-stone-800 rounded-2xl py-4 pl-12 pr-6 text-xs font-mono focus:outline-none focus:border-[#a9b897]/50 w-64 transition-all"
              />
            </div>
            <button className="bg-[#a9b897] text-black p-5 rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(169,184,151,0.2)]">
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-stone-800 rounded-[3rem] p-24 text-center">
              <p className="font-serif italic text-stone-500 text-xl">No active nodes detected.</p>
            </div>
          ) : (
            filtered.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="group p-8 rounded-[2rem] bg-stone-900/30 border border-stone-800 hover:border-[#a9b897]/50 hover:bg-stone-900/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-stone-900 rounded-2xl text-stone-500 group-hover:text-[#a9b897] transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif italic tracking-tight">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-black tracking-widest mt-2">
                      <Building2 size={12} />
                      {customer.company || "Independent Record"}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center group-hover:border-[#a9b897] transition-all group-hover:translate-x-2">
                  <ArrowRight size={20} className="text-stone-600 group-hover:text-[#a9b897]" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}