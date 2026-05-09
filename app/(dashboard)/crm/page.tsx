"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Plus, Search, User, X, Check } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // Added for smoother mobile transitions

const MAILING_LIST_OPTIONS = [
  "General Newsletter",
  "Product Updates",
  "Enterprise Announcements",
  "Weekly Digest"
];

export default function CRMDirectory() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addToMailingList, setAddToMailingList] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCustomers(data);
    setLoading(false);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      on_mailing_list: addToMailingList,
      mailing_list_category: addToMailingList && selectedLists.length > 0 ? selectedLists.join(", ") : "General"
    };
    const { data, error } = await supabase.from("customers").insert([payload]).select().single();
    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }
    setCustomers((prev) => [data, ...prev]);
    setForm({ name: "", company: "", email: "", phone: "", address: "" });
    setAddToMailingList(false);
    setSelectedLists([]);
    setShowModal(false);
    setSaving(false);
  }

  const toggleListSelection = (listName: string) => {
    setSelectedLists(prev => 
      prev.includes(listName) ? prev.filter(l => l !== listName) : [...prev, listName]
    );
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 pb-32 md:pb-8">
      <div className="max-w-6xl mx-auto">

        {/* RESPONSIVE HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-10 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#a9b897] font-black">
              CRM Module
            </p>
            <h1 className="text-4xl md:text-6xl font-serif italic text-stone-800 tracking-tighter lowercase">Client Directory</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                placeholder="Search node..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-3 md:py-4 rounded-2xl border border-stone-200 bg-white outline-none focus:ring-2 focus:ring-[#a9b897]/20 transition-all text-sm"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-stone-900 hover:bg-stone-800 p-4 md:p-5 rounded-2xl text-white transition-all shadow-xl active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* CUSTOMER LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
          {loading && (
            <div className="text-center p-12 bg-white border border-stone-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-stone-300">
              Synchronizing Directory...
            </div>
          )}

          {!loading && filtered.length > 0 &&
            filtered.map((customer) => (
              <Link 
                href={`/crm/${customer.id}`} 
                key={customer.id}
                className="bg-white border border-stone-100 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 flex items-center gap-4 md:gap-6 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-stone-50 text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-colors flex items-center justify-center shrink-0 border border-stone-100">
                  <User size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-stone-800 truncate">{customer.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#a9b897]">{customer.company || "Independent"}</p>
                    <p className="hidden xs:block text-xs text-stone-400 truncate">{customer.email}</p>
                  </div>
                </div>
              </Link>
            ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-[3rem]">
              <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.4em]">Zero Results</p>
              <p className="text-stone-500 text-sm mt-2 italic font-serif">Adjust parameters or provision new client.</p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE RESPONSIVE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 bg-white rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 w-full max-w-xl shadow-2xl max-h-[92vh] overflow-y-auto border border-stone-100"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                   <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897]">Entry Form</p>
                   <h2 className="text-2xl md:text-3xl font-serif italic text-stone-800">Add New Client</h2>
                </div>

                <button onClick={() => setShowModal(false)} className="p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addCustomer} className="space-y-4 pb-8 md:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Identity</label>
                    <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#a9b897]/10" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Organization</label>
                    <input placeholder="Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200/50 rounded-xl p-4 text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Electronic Mail</label>
                  <input type="email" placeholder="client@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm focus:outline-none" />
                </div>

                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-1">Physical Location</label>
                   <textarea placeholder="Address details..." value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm h-24 resize-none focus:outline-none" />
                </div>

                {/* MAILING LIST TOGGLE */}
                <div className="border-t border-stone-100 pt-6 mt-6">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 group-hover:text-stone-800 transition-colors">
                      Activate Marketing Sequence
                    </span>
                    <input
                      type="checkbox"
                      checked={addToMailingList}
                      onChange={() => setAddToMailingList(!addToMailingList)}
                      className="h-5 w-5 rounded-lg border-stone-300 text-[#a9b897] focus:ring-transparent"
                    />
                  </label>
                </div>

                {/* MAILING LIST OPTIONS */}
                {addToMailingList && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-2 mt-4 pt-4 border-t border-stone-50"
                  >
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-3 ml-1">Audience Segments</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MAILING_LIST_OPTIONS.map((listName) => {
                        const isChecked = selectedLists.includes(listName);
                        return (
                          <div 
                            key={listName}
                            onClick={() => toggleListSelection(listName)}
                            className={`flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-[#a9b897]/5 border-[#a9b897] text-[#1c1917]' 
                                : 'bg-white border-stone-100 text-stone-500 hover:border-stone-200'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-tight">{listName}</span>
                            {isChecked && <Check size={12} className="text-[#a9b897]" />}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black mt-8 text-[10px] tracking-[0.3em] uppercase hover:bg-stone-800 disabled:opacity-40 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {saving ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Provision Client"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}