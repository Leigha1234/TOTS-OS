"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Plus, Building2, ArrowRight, Search, Mail, Phone, 
  MapPin, FileText, Briefcase, MessageSquare, MailWarning,
  CheckCircle2, X, ListFilter
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
    mailing_list_category: "General",
    project_count: 0,
    invoice_count: 0,
    message_count: 0
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
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order('created_at', { ascending: false });

    if (error) console.error("Fetch error:", error);
    if (data) setCustomers(data);
    setLoading(false);
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // Attempt to insert into Supabase
    const { data, error } = await supabase
      .from("customers")
      .insert([formData])
      .select();

    if (error) {
      console.error("Critical Error:", error);
      alert(`System Error: ${error.message}\n\nCheck if your 'customers' table has columns for: address, phone, on_mailing_list, and mailing_list_category.`);
    } else {
      console.log("Node Initialized:", data);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        name: "", company: "", email: "", phone: "", 
        address: "", on_mailing_list: true, mailing_list_category: "General",
        project_count: 0, invoice_count: 0, message_count: 0
      });
      fetchDirectory(); // Refresh manually just in case real-time lags
    }
    setIsSubmitting(false);
  }

  const filtered = customers.filter(c => 
    (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (c.company?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a9b897] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-serif italic text-stone-500 text-sm tracking-widest uppercase">Syncing Registry...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 selection:bg-[#a9b897] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-900 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#a9b897]"></span>
              <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.5em]">Central Intelligence</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter">Directory</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-[#a9b897] transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search Database..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-900/40 border border-stone-800 rounded-2xl py-4 pl-12 pr-6 text-xs font-mono focus:outline-none focus:border-[#a9b897]/50 w-72 transition-all backdrop-blur-sm"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#a9b897] text-black p-5 rounded-[1.5rem] hover:rotate-90 hover:bg-white transition-all duration-500 shadow-xl"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* List View */}
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="border border-stone-900 rounded-[3rem] py-32 text-center bg-stone-900/10">
              <p className="font-serif italic text-stone-600 text-2xl">Zero nodes match your query.</p>
            </div>
          ) : (
            filtered.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="group relative p-1 rounded-[2.5rem] overflow-hidden transition-all active:scale-[0.99]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-stone-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 rounded-[2.4rem] bg-stone-950 border border-stone-900 group-hover:border-stone-700 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  
                  {/* Identity Section */}
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="p-6 bg-stone-900 rounded-[2rem] text-stone-500 group-hover:text-[#a9b897] transition-all duration-500 group-hover:bg-black border border-transparent group-hover:border-stone-800">
                        <User size={32} />
                      </div>
                      {customer.on_mailing_list && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#a9b897] rounded-full border-4 border-black" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-4xl font-serif italic tracking-tight leading-none mb-3 group-hover:text-[#a9b897] transition-colors">{customer.name}</h3>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-black tracking-widest bg-stone-900/50 px-3 py-1 rounded-full border border-stone-800">
                          <Building2 size={12} className="text-[#a9b897]" />
                          {customer.company || "Independent"}
                        </div>
                        {customer.mailing_list_category && (
                          <div className="flex items-center gap-2 text-[#a9b897] text-[10px] uppercase font-black tracking-widest border border-[#a9b897]/20 px-3 py-1 rounded-full">
                            <ListFilter size={10} /> {customer.mailing_list_category}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div className="flex flex-col gap-2 py-6 lg:py-0 px-8 border-l border-stone-900">
                    <div className="flex items-center gap-3 text-stone-500 group-hover:text-stone-300 transition-colors">
                      <Mail size={14} />
                      <span className="text-xs font-mono lowercase tracking-tighter">{customer.email || "---"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 group-hover:text-stone-300 transition-colors">
                      <Phone size={14} />
                      <span className="text-xs font-mono uppercase tracking-widest">{customer.phone || "---"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-600">
                      <MapPin size={14} />
                      <span className="text-[10px] font-serif italic truncate max-w-[200px]">{customer.address || "No Address Found"}</span>
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="flex items-center gap-12">
                    <div className="hidden xl:flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-1">Projects</p>
                        <span className="text-xl font-mono text-stone-300">{customer.project_count || 0}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-1">Invoices</p>
                        <span className="text-xl font-mono text-stone-300">{customer.invoice_count || 0}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border border-stone-900 flex items-center justify-center group-hover:bg-[#a9b897] transition-all group-hover:border-transparent group-hover:translate-x-2">
                      <ArrowRight size={24} className="text-stone-700 group-hover:text-black" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* CREATE NODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-stone-950 border border-stone-800 w-full max-w-2xl rounded-[3rem] p-12 relative shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-10 right-10 text-stone-500 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="mb-12">
              <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.6em] mb-4">Initialize New Node</p>
              <h2 className="text-5xl font-serif italic tracking-tighter">Contact Parameters</h2>
            </div>

            <form onSubmit={handleAddContact} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 ml-1">Identity</label>
                  <input 
                    required
                    placeholder="Full Name"
                    className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-5 text-sm font-mono outline-none focus:border-[#a9b897] transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 ml-1">Company</label>
                  <input 
                    placeholder="Organization Name"
                    className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-5 text-sm font-mono outline-none focus:border-[#a9b897] transition-all"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 ml-1">Signal (Email)</label>
                  <input 
                    type="email"
                    placeholder="name@domain.com"
                    className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-5 text-sm font-mono outline-none focus:border-[#a9b897] transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 ml-1">Signal (Phone)</label>
                  <input 
                    placeholder="+1 000 000 0000"
                    className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-5 text-sm font-mono outline-none focus:border-[#a9b897] transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-500 ml-1">Physical Location</label>
                  <input 
                    placeholder="Street, City, Country"
                    className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl p-5 text-sm font-serif italic outline-none focus:border-[#a9b897] transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-stone-900/30 rounded-[2rem] border border-stone-800/50 gap-6">
                <div className="flex items-center gap-6">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, on_mailing_list: !formData.on_mailing_list})}
                    className={`w-14 h-8 rounded-full transition-all relative ${formData.on_mailing_list ? 'bg-[#a9b897]' : 'bg-stone-800'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-black transition-all ${formData.on_mailing_list ? 'left-7' : 'left-1'}`} />
                  </button>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Mailing List</p>
                    <p className="text-[10px] text-stone-500 italic font-serif">Global broadcast enabled</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[8px] uppercase font-black text-stone-600 tracking-widest">Select Category</label>
                  <select 
                    className="bg-black border border-stone-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-[#a9b897] appearance-none cursor-pointer"
                    value={formData.mailing_list_category}
                    onChange={(e) => setFormData({...formData, mailing_list_category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="VIP">VIP / Priority</option>
                    <option value="Lead">Lead</option>
                    <option value="Client">Active Client</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#a9b897] text-black py-8 rounded-3xl font-black uppercase text-sm tracking-[0.5em] hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(169,184,151,0.1)]"
              >
                {isSubmitting ? "Encrypting Node..." : "Initialize Profile"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}