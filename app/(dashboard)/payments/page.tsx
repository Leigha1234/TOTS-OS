"use client";

import React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client"; 
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FileText, Landmark, Plus, Search, X } from "lucide-react";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

type LineItem = {
  description: string;
  amount: number;
};

type FinanceForm = {
  contact_id: string;
  invoice_number: string;
  date: string;
  currency: string;
  lines: LineItem[];
  include_vat: boolean;
  vat_rate: number;
  recurring: string;
  bank_details: string;
  thank_you_message: string;
  send_email_now: boolean;
  send_receipt: boolean;
  auto_reminders: boolean;
};

const CURRENCIES = [
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" }
];

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<FinanceForm>({ 
    contact_id: "",
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    currency: "GBP",
    lines: [{ description: "", amount: 0 }],
    include_vat: false,
    vat_rate: 20,
    recurring: "none", // none, weekly, monthly, annually
    bank_details: "",
    thank_you_message: "Thank you for your business!",
    send_email_now: false,
    send_receipt: true,
    auto_reminders: true
  });

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      loadDocs(mem.team_id);
      loadContacts(mem.team_id);
    }
  }, [type]);

  const loadDocs = async (tId: string) => {
    setLoading(true);
    const { data } = await supabase.from(type).select("*, contacts(name, email)").eq("team_id", tId).order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const loadContacts = async (tId: string) => {
    const { data } = await supabase.from("contacts").select("*").eq("team_id", tId);
    setContacts(data || []);
  };

  useEffect(() => { init(); }, [init]);

  // Calculations
  const netTotal = form.lines.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
  const vatAmount = form.include_vat ? (netTotal * (form.vat_rate / 100)) : 0;
  const grossTotal = netTotal + vatAmount;

  const handleAddLine = () => setForm({ ...form, lines: [...form.lines, { description: "", amount: 0 }] });
  
  const handleCreate = async () => {
    if (!teamId) return;
    const { error } = await supabase.from(type).insert([{
      ...form,
      team_id: teamId,
      amount: grossTotal,
      status: "pending",
      metadata: { 
        ...form,
        net_amount: netTotal,
        vat_amount: vatAmount,
      }
    }]);
    
    if (!error) {
      setShowModal(false);
      loadDocs(teamId);
    } else {
      alert("Error creating invoice: " + error.message);
    }
  };

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        {/* Header Section */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
              <Landmark size={14} strokeWidth={3} /> Institutional Treasury
            </p>
            <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">
              Capital <br /> Ledger
            </h1>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3"
            >
              <Plus size={16} /> New Invoice
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="max-w-[1400px] mx-auto mb-10 space-y-6">
          <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" size={24} />
            <input 
              type="text" 
              placeholder="Search ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white py-10 pl-24 pr-10 rounded-[3rem] text-2xl font-serif italic border border-stone-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          {loading ? (
             <div className="p-20 text-center italic font-serif text-stone-400">Syncing data stream...</div>
          ) : docs.map((d) => (
            <div key={d.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex justify-between items-center group hover:border-stone-900 transition-all cursor-pointer">
              <div className="flex items-center gap-8">
                <div className="p-5 bg-stone-50 rounded-2xl"><FileText size={24} /></div>
                <div>
                  <p className="text-3xl font-mono font-bold">{CURRENCIES.find(c => c.code === d.currency)?.symbol}{d.amount}</p>
                  <p className="text-[10px] font-black uppercase text-stone-400">{d.contacts?.name || 'No Contact'} • {d.invoice_number}</p>
                </div>
              </div>
              <ChevronRight size={20} />
            </div>
          ))}
        </div>

        {/* REWRITTEN MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4"
            >
              <motion.div 
                initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
                className="bg-[#fcfbf8] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-12 shadow-2xl relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-stone-400 hover:text-black"><X /></button>
                
                <h2 className="text-5xl font-serif italic mb-8">Create New Invoice</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Invoice Number</label>
                    <input 
                      className="w-full bg-white p-4 rounded-2xl border border-stone-200" 
                      value={form.invoice_number} 
                      onChange={e => setForm({...form, invoice_number: e.target.value})} 
                    />

                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Link Contact</label>
                    <select 
                      className="w-full bg-white p-4 rounded-2xl border border-stone-200"
                      value={form.contact_id}
                      onChange={e => setForm({...form, contact_id: e.target.value})}
                    >
                      <option value="">Select a Contact</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Date</label>
                        <input type="date" className="w-full bg-white p-4 rounded-2xl border border-stone-200" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400">Repeat</label>
                        <select className="w-full bg-white p-4 rounded-2xl border border-stone-200" value={form.recurring} onChange={e => setForm({...form, recurring: e.target.value})}>
                          <option value="none">One-off</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Settings & Automation */}
                  <div className="bg-stone-100/50 p-8 rounded-[2rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">Enable VAT (20%)</span>
                      <input type="checkbox" checked={form.include_vat} onChange={e => setForm({...form, include_vat: e.target.checked})} className="w-5 h-5 accent-stone-900" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">Auto-Reminders</span>
                      <input type="checkbox" checked={form.auto_reminders} onChange={e => setForm({...form, auto_reminders: e.target.checked})} className="w-5 h-5 accent-stone-900" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest">Send Receipt on Payment</span>
                      <input type="checkbox" checked={form.send_receipt} onChange={e => setForm({...form, send_receipt: e.target.checked})} className="w-5 h-5 accent-stone-900" />
                    </div>
                    <textarea 
                      placeholder="Bank Details (IBAN, Sort Code...)" 
                      className="w-full p-4 rounded-xl text-xs border border-stone-200" 
                      rows={2}
                      onChange={e => setForm({...form, bank_details: e.target.value})}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="mt-12">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif italic">Line Items</h3>
                    <button onClick={handleAddLine} className="text-[9px] font-black uppercase bg-stone-200 px-4 py-2 rounded-full">+ Add Line</button>
                  </div>
                  <div className="space-y-3">
                    {form.lines.map((line, idx) => (
                      <div key={idx} className="flex gap-4">
                        <input 
                          placeholder="Description" 
                          className="flex-1 bg-white p-4 rounded-xl border border-stone-200" 
                          value={line.description} 
                          onChange={e => {
                            const newLines = [...form.lines];
                            newLines[idx].description = e.target.value;
                            setForm({...form, lines: newLines});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          className="w-32 bg-white p-4 rounded-xl border border-stone-200" 
                          value={line.amount}
                          onChange={e => {
                            const newLines = [...form.lines];
                            newLines[idx].amount = Number(e.target.value);
                            setForm({...form, lines: newLines});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Summary */}
                <div className="mt-12 pt-8 border-t border-stone-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400">Total Due</p>
                    <p className="text-6xl font-serif italic">{CURRENCIES.find(c => c.code === form.currency)?.symbol}{grossTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-4">
                     <button 
                      onClick={handleCreate}
                      className="bg-stone-900 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-all"
                     >
                        Confirm & Create Invoice
                     </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Page>
  );
}