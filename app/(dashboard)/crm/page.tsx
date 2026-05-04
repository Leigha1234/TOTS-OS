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
  }, []);

  async function fetchDirectory() {
    const { data } = await supabase.from("customers").select("*").order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

  const handleOpenModal = () => {
    console.log("Button Clicked: Attempting to show modal...");
    setShowModal(true);
  };

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
    <div className="relative min-h-screen bg-white text-stone-900 p-8 md:p-16">
      {/* 
          Z-INDEX DEBUG: 
          If you see this text but can't see the modal, the issue is your 
          parent layout wrapper. 
      */}
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-[#a9b897] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Central Intelligence</p>
            <h1 className="text-5xl font-serif italic tracking-tighter">Directory</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl py-3 pl-12 pr-6 text-sm outline-none w-64"
              />
            </div>
            
            {/* BUTTON TRIGGER */}
            <button 
              type="button"
              onClick={handleOpenModal}
              className="relative z-10 bg-[#a9b897] text-stone-800 p-4 rounded-xl hover:bg-[#98a786] cursor-pointer"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((customer) => (
            <div key={customer.id} className="p-6 rounded-[2rem] bg-stone-100/50 border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center text-white">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif italic">{customer.name}</h3>
                  <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest">{customer.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FORCED OVERLAY MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center" style={{ zIndex: 999999 }}>
          {/* Backdrop with higher opacity for visibility */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowModal(false)} 
          />
          
          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-xl rounded-[2rem] p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] mx-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif italic">Initialize Node</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-black">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                required placeholder="Name" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-[#a9b897]"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              />
              <input 
                placeholder="Company" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-[#a9b897]"
                value={form.company} onChange={e => setForm({...form, company: e.target.value})}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  placeholder="Email" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-[#a9b897]"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                />
                <input 
                  placeholder="Phone" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-[#a9b897]"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>
              <textarea 
                placeholder="Address" 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-[#a9b897] h-20"
                value={form.address} onChange={e => setForm({...form, address: e.target.value})}
              />
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[#a9b897] text-stone-800 py-4 rounded-xl font-bold uppercase tracking-widest hover:opacity-90"
              >
                {submitting ? "Syncing..." : "Add to Registry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}