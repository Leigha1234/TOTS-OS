"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Plus, Building2, ArrowRight, Search, Mail, Phone, 
  MapPin, X, CheckCircle2, ListFilter 
} from "lucide-react";
import Link from "next/link";

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- MODAL CONTROL ---
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- FORM STATE ---
  const [form, setForm] = useState({
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
    // Real-time listener for instant updates
    const channel = supabase
      .channel('crm-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchDirectory())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchDirectory() {
    const { data } = await supabase.from("customers").select("*").order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("customers").insert([form]);

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setShowModal(false);
      setForm({ name: "", company: "", email: "", phone: "", address: "", on_mailing_list: true, mailing_list_category: "General" });
      fetchDirectory();
    }
    setSubmitting(false);
  }

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-stone-900 p-8 md:p-16 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Central Intelligence</p>
            <h1 className="text-5xl font-serif italic tracking-tighter text-stone-800">Directory</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897]" size={18} />
              <input 
                type="text"
                placeholder="Search..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-[#a9b897] w-64 transition-all"
              />
            </div>
            {/* THIS IS THE PLUS BUTTON */}
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-[#a9b897] text-stone-800 p-4 rounded-xl hover:bg-[#98a786] transition-all shadow-sm active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* LIST VIEW */}
        <div className="space-y-4">
          {filtered.map((customer) => (
            <Link href={`/crm/${customer.id}`} key={customer.id} className="block group">
              <div className="p-6 rounded-[2rem] bg-stone-100/50 border border-stone-200 flex items-center justify-between hover:bg-stone-100 hover:border-stone-300 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center text-white">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-stone-700">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                      <Building2 size={12} /> {customer.company || "Independent"}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-[#a9b897] transition-all">
                  <ArrowRight size={20} className="text-stone-300 group-hover:text-[#a9b897]" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* THE POP-UP (MODAL) */}
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            
            {/* Content */}
            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-widest mb-1">Entry Form</p>
                  <h2 className="text-3xl font-serif italic">New Contact Node</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="text-stone-300 hover:text-stone-800">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  required placeholder="Full Name" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 outline-none focus:border-[#a9b897]"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                />
                <input 
                  placeholder="Company" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 outline-none focus:border-[#a9b897]"
                  value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="Email" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 outline-none focus:border-[#a9b897]"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  />
                  <input 
                    placeholder="Phone" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 outline-none focus:border-[#a9b897]"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Address" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 outline-none focus:border-[#a9b897] h-24 resize-none"
                  value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                />

                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setForm({...form, on_mailing_list: !form.on_mailing_list})}
                      className={`w-12 h-6 rounded-full transition-all relative ${form.on_mailing_list ? 'bg-[#a9b897]' : 'bg-stone-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.on_mailing_list ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Mailing List</span>
                  </div>
                  <select 
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-[#a9b897] outline-none"
                    value={form.mailing_list_category}
                    onChange={e => setForm({...form, mailing_list_category: e.target.value})}
                  >
                    <option value="General">General</option>
                    <option value="VIP">VIP</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>

                <button 
                  disabled={submitting}
                  className="w-full bg-[#a9b897] text-stone-800 py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-[#98a786] transition-all"
                >
                  {submitting ? "Initializing..." : "Initialize Profile"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}