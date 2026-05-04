"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Plus, Building2, ArrowRight, Search, Mail, Phone, 
  MapPin, Tag, FileText, Briefcase, MessageSquare, MailWarning,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDirectory();
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchDirectory())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchDirectory() {
    // Note: In your Supabase table, ensure you have: 
    // email, phone, address, on_mailing_list (bool), and mailing_list_category (text)
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order('created_at', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  }

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-stone-500">Scanning Directory...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
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

        {/* Directory Grid */}
        <div className="grid gap-6">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-stone-800 rounded-[3rem] p-24 text-center">
              <p className="font-serif italic text-stone-500 text-xl">No active nodes detected.</p>
            </div>
          ) : (
            filtered.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="group p-8 rounded-[2.5rem] bg-stone-900/20 border border-stone-800/50 hover:border-[#a9b897]/50 hover:bg-stone-900/40 transition-all block"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  
                  {/* Left: Identity */}
                  <div className="flex items-start gap-6">
                    <div className="p-5 bg-stone-900 rounded-3xl text-stone-600 group-hover:text-[#a9b897] group-hover:bg-stone-800 transition-all">
                      <User size={32} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif italic tracking-tight mb-1">{customer.name}</h3>
                      <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-black tracking-widest">
                        <Building2 size={12} className="text-[#a9b897]" />
                        {customer.company || "Independent Record"}
                      </div>
                      
                      {/* Mailing List Toggle & Category Indicator */}
                      <div className="mt-4 flex items-center gap-3">
                        {customer.on_mailing_list ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#a9b897]/10 border border-[#a9b897]/20 rounded-full text-[#a9b897] text-[8px] font-black uppercase tracking-tighter">
                            <CheckCircle2 size={10} /> Subscribed: {customer.mailing_list_category || "General"}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[8px] font-black uppercase tracking-tighter">
                            <MailWarning size={10} /> Unsubscribed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Contact Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 px-4 py-6 border-y lg:border-y-0 lg:border-x border-stone-800/50">
                    <div className="flex items-center gap-3 text-stone-400">
                      <Mail size={14} className="text-stone-600" />
                      <span className="text-xs font-mono">{customer.email || "no-email@entry.io"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-400">
                      <Phone size={14} className="text-stone-600" />
                      <span className="text-xs font-mono">{customer.phone || "--"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-400 sm:col-span-2">
                      <MapPin size={14} className="text-stone-600" />
                      <span className="text-xs font-serif italic">{customer.address || "No physical address logged"}</span>
                    </div>
                  </div>

                  {/* Right: Activity Summary (Counter Logic) */}
                  <div className="flex items-center justify-between lg:justify-end gap-8">
                    <div className="flex gap-6">
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <p className="text-[8px] font-black text-stone-600 uppercase mb-1">Projects</p>
                        <div className="flex items-center gap-1 text-[#a9b897]">
                          <Briefcase size={12} />
                          <span className="text-sm font-bold tracking-tighter">{customer.project_count || 0}</span>
                        </div>
                      </div>
                      <div className="text-center group-hover:scale-110 transition-transform delay-75">
                        <p className="text-[8px] font-black text-stone-600 uppercase mb-1">Docs</p>
                        <div className="flex items-center gap-1 text-white">
                          <FileText size={12} />
                          <span className="text-sm font-bold tracking-tighter">{customer.invoice_count || 0}</span>
                        </div>
                      </div>
                      <div className="text-center group-hover:scale-110 transition-transform delay-150">
                        <p className="text-[8px] font-black text-stone-600 uppercase mb-1">Intel</p>
                        <div className="flex items-center gap-1 text-stone-400">
                          <MessageSquare size={12} />
                          <span className="text-sm font-bold tracking-tighter">{customer.message_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full border border-stone-800 flex items-center justify-center group-hover:border-[#a9b897] transition-all group-hover:translate-x-2">
                      <ArrowRight size={20} className="text-stone-600 group-hover:text-[#a9b897]" />
                    </div>
                  </div>

                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}