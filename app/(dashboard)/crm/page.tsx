"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Plus, Building2, ArrowRight, Search, Mail, Phone, 
  MapPin, FileText, Briefcase, MessageSquare, MailWarning,
  CheckCircle2, X
} from "lucide-react";
import Link from "next/link";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    on_mailing_list: true,
    mailing_list_category: "General"
  });

  useEffect(() => {
    fetchDirectory();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchDirectory())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchDirectory() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order('created_at', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from("customers")
      .insert([formData]);

    if (error) {
      console.error("Error adding contact:", error.message);
      alert("Error initializing node. Check RLS policies.");
    } else {
      setIsModalOpen(false);
      setFormData({
        name: "", company: "", email: "", phone: "", 
        address: "", on_mailing_list: true, mailing_list_category: "General"
      });
    }
    setIsSubmitting(false);
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#a9b897] text-black p-5 rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(169,184,151,0.2)]"
            >
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
                      
                      <div className="mt-4 flex items-center gap-3">
                        {customer.on_mailing_list ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#a9b897]/10 border border-[#a9b897]/20 rounded-full text-[#a9b897] text-[8px] font-black uppercase tracking-tighter">
                            <CheckCircle2 size={10} /> Subscribed: {customer.mailing_list_category}
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

                  {/* Right: Activity Summary */}
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

      {/* ADD CONTACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-[3rem] p-10 relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.4em] mb-2">System Entry</p>
              <h2 className="text-4xl font-serif italic">Initialize Contact Node</h2>
            </div>

            <form onSubmit={handleAddContact} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 ml-2">Full Identity</label>
                  <input 
                    required
                    placeholder="Name"
                    className="w-full bg-black border border-stone-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#a9b897]/50"
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 ml-2">Organization</label>
                  <input 
                    placeholder="Company Name"
                    className="w-full bg-black border border-stone-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#a9b897]/50"
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 ml-2">Direct Mail</label>
                  <input 
                    type="email"
                    placeholder="email@address.com"
                    className="w-full bg-black border border-stone-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#a9b897]/50"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 ml-2">Signal Line</label>
                  <input 
                    placeholder="+1 (000) 000-0000"
                    className="w-full bg-black border border-stone-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#a9b897]/50"
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] uppercase font-black tracking-widest text-stone-500 ml-2">Physical Location</label>
                  <input 
                    placeholder="Full Business Address"
                    className="w-full bg-black border border-stone-800 rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#a9b897]/50"
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-black rounded-3xl border border-stone-800 gap-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={formData.on_mailing_list}
                    onChange={(e) => setFormData({...formData, on_mailing_list: e.target.checked})}
                    className="w-5 h-5 accent-[#a9b897] bg-stone-900 border-stone-800 rounded"
                  />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Global Broadcast</p>
                    <p className="text-[10px] text-stone-500 italic font-serif">Include in automated mailing lists</p>
                  </div>
                </div>
                
                <select 
                  className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-[#a9b897]"
                  value={formData.mailing_list_category}
                  onChange={(e) => setFormData({...formData, mailing_list_category: e.target.value})}
                >
                  <option value="General">General List</option>
                  <option value="VIP">VIP / Priority</option>
                  <option value="Lead">Lead / Prospect</option>
                  <option value="Internal">Internal Team</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#a9b897] text-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Syncing Logic..." : "Deploy Node to Registry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}