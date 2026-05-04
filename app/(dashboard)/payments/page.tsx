"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Plus, FileText, X, Landmark, Trash2, 
  ShieldAlert, DownloadCloud, ChevronRight, 
  Search, Mail, Calendar, Receipt, CreditCard,
  Calculator, Globe
} from "lucide-react";
import Page from "@/app/components/Page"; 
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" }
];

const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const isAfterApril6 = now > new Date(year, 3, 6); 
  return isAfterApril6 ? `${year}/${(year + 1).toString().slice(-2)}` : `${year - 1}/${year.toString().slice(-2)}`;
};

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({ 
    contact_id: "",
    entity_name: "", 
    invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split("T")[0],
    tax_year: getCurrentTaxYear(),
    currency: "GBP",
    lines: [{ description: "", amount: "" }], // Keeping amount as string for input flexibility
    include_vat: false,
    vat_rate: 20,
    recurring: "none", 
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
      const { data: s } = await supabase.from("settings").select("*").eq("team_id", mem.team_id).maybeSingle();
      setBrand(s);
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

  const filteredDocs = docs.filter(d => 
    (d.entity_name || d.contacts?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.tax_year?.includes(searchTerm)
  );

  const netTotal = form.lines.reduce((acc, curr) => acc + (parseFloat(curr.amount as string) || 0), 0);
  const vatAmount = form.include_vat ? (netTotal * (form.vat_rate / 100)) : 0;
  const grossTotal = netTotal + vatAmount;
  const currentSymbol = CURRENCIES.find(c => c.code === form.currency)?.symbol || "£";

  const handleCreate = async () => {
    if (!teamId) return;
    const { error } = await supabase.from(type).insert([{
      ...form,
      team_id: teamId,
      amount: grossTotal,
      status: "committed",
      metadata: { 
        lines: form.lines, 
        net_amount: netTotal,
        vat_amount: vatAmount,
        is_vat_inclusive: form.include_vat,
        currency_symbol: currentSymbol,
        bank_details: form.bank_details,
        recurring: form.recurring,
        thank_you: form.thank_you_message
      }
    }]);
    
    if (!error) {
      setShowModal(false);
      loadDocs(teamId);
      setForm({ ...form, entity_name: "", lines: [{ description: "", amount: "" }] });
    }
  };

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        
        {/* ORIGINAL HEADER DESIGN */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <div className="space-y-6">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 flex items-center gap-3">
              <Landmark size={14} strokeWidth={3} /> Institutional Treasury
            </p>
            <h1 className="text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.85]">
              Capital <br /> Ledger
            </h1>
            <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#a9b897] transition-all flex items-center gap-3">
              <Plus size={16} /> New {type.replace('_', ' ')}
            </button>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-xl flex items-center gap-10 min-w-[450px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#a9b897]">
                <ShieldAlert size={14} />
                <p className="text-[9px] font-black uppercase tracking-widest">Active Compliance</p>
              </div>
              <p className="text-2xl font-serif italic text-stone-800">Tax Year {getCurrentTaxYear()}</p>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter italic">Automatic Node Transition</p>
            </div>
            <div className="h-16 w-[1px] bg-stone-100" />
            <div>
               <p className="text-5xl font-serif italic text-stone-900">96%</p>
               <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Health</p>
            </div>
          </div>
        </div>

        {/* ORIGINAL SEARCH & TABS */}
        <div className="max-w-[1400px] mx-auto mb-10 space-y-6">
          <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" size={24} />
            <input 
              type="text" 
              placeholder="Search ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white py-10 pl-24 pr-10 rounded-[3rem] text-2xl font-serif italic border border-stone-200 focus:border-[#a9b897] outline-none transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {["invoices", "quotes", "expenses", "payroll", "self_assessment", "end_of_year"].map((t) => (
              <button 
                key={t} 
                onClick={() => setType(t as DocType)} 
                className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${type === t ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900'}`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* DOCUMENT LIST */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
                <div className="p-20 text-center italic font-serif text-stone-400">Syncing data stream...</div>
            ) : filteredDocs.map((d) => (
              <motion.div 
                layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                key={d.id} 
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-2xl hover:border-[#a9b897] transition-all cursor-pointer flex justify-between items-center group"
              >
                 <div className="flex items-center gap-8">
                    <div className="p-5 bg-stone-50 rounded-2xl text-stone-400 group-hover:text-[#a9b897] transition-colors"><FileText size={24} /></div>
                    <div>
                       <div className="flex items-center gap-3">
                          <p className="text-3xl font-mono font-bold tracking-tighter">{CURRENCIES.find(c => c.code === d.currency)?.symbol || "£"}{Number(d.amount).toLocaleString()}</p>
                          <span className="text-[8px] font-black px-2 py-1 bg-stone-100 rounded text-stone-400 uppercase">{d.currency}</span>
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1">
                        {d.contacts?.name || d.entity_name} • {d.date}
                       </p>
                    </div>
                 </div>
                 <ChevronRight size={20} className="text-stone-200 group-hover:text-stone-900" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* FULLY INTEGRATED POP-UP */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4"
            >
              <motion.div 
                initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
                className="bg-[#fcfbf8] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[4rem] p-12 shadow-2xl relative"
              >
                <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-stone-400 hover:text-black"><X size={32}/></button>
                
                <header className="mb-12">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Internal Ledger Entry</p>
                  <h2 className="text-6xl font-serif italic uppercase tracking-tighter">New {type.replace('_', ' ')}</h2>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column: Core Data */}
                  <div className="lg:col-span-2 space-y-8">
                    <section className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400">Linked Contact / Entity</label>
                        {type === "invoices" ? (
                          <select className="w-full bg-white p-5 rounded-3xl border border-stone-200 outline-none" value={form.contact_id} onChange={e => setForm({...form, contact_id: e.target.value})}>
                            <option value="">Select Institutional Contact</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (
                          <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" placeholder="Entity Name" value={form.entity_name} onChange={e => setForm({...form, entity_name: e.target.value})} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400">Reference No.</label>
                        <input className="w-full bg-white p-5 rounded-3xl border border-stone-200" value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} />
                      </div>
                    </section>

                    {/* NEW: Dynamic Line Items */}
                    <section className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Calculator size={14}/> Line Items</h3>
                        <button onClick={() => setForm({...form, lines: [...form.lines, {description: "", amount: ""}]})} className="p-2 bg-stone-900 text-white rounded-full hover:bg-[#a9b897] transition-all"><Plus size={16}/></button>
                      </div>
                      {form.lines.map((line, idx) => (
                        <div key={idx} className="flex gap-4 group">
                          <input className="flex-1 bg-white p-5 rounded-3xl border border-stone-200" placeholder="Line Description" value={line.description} onChange={e => {
                            const l = [...form.lines]; l[idx].description = e.target.value; setForm({...form, lines: l});
                          }} />
                          <input type="number" className="w-32 bg-white p-5 rounded-3xl border border-stone-200 font-mono" placeholder="0.00" value={line.amount} onChange={e => {
                            const l = [...form.lines]; l[idx].amount = e.target.value; setForm({...form, lines: l});
                          }} />
                          {form.lines.length > 1 && (
                            <button onClick={() => setForm({...form, lines: form.lines.filter((_, i) => i !== idx)})} className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"><Trash2 size={18}/></button>
                          )}
                        </div>
                      ))}
                    </section>

                    {/* Bank & Message */}
                    <section className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-stone-400">Payment & Closing Details</label>
                        <textarea className="w-full bg-white p-6 rounded-[2rem] border border-stone-200 text-sm italic" rows={3} placeholder="Bank: Institutional Bank | Account: 00000000 | Sort: 00-00-00" value={form.bank_details} onChange={e => setForm({...form, bank_details: e.target.value})} />
                        <input className="w-full bg-white p-5 rounded-3xl border border-stone-200 text-sm italic" placeholder="Custom Thank You Message..." value={form.thank_you_message} onChange={e => setForm({...form, thank_you_message: e.target.value})} />
                    </section>
                  </div>

                  {/* Right Column: Settings Panel */}
                  <div className="bg-stone-100 p-10 rounded-[3rem] space-y-8 h-fit">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-stone-400">Currency</span>
                        <select className="bg-transparent font-serif italic text-right outline-none" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-stone-400">Frequency</span>
                        <select className="bg-transparent font-serif italic text-right outline-none" value={form.recurring} onChange={e => setForm({...form, recurring: e.target.value})}>
                          <option value="none">One-off</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                      
                      <hr className="border-stone-200" />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase flex items-center gap-2 text-stone-500"><Globe size={12}/> Include VAT</label>
                          <input type="checkbox" checked={form.include_vat} onChange={e => setForm({...form, include_vat: e.target.checked})} className="w-4 h-4 accent-stone-900"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase flex items-center gap-2 text-stone-500"><Mail size={12}/> Send via Email</label>
                          <input type="checkbox" checked={form.send_email_now} onChange={e => setForm({...form, send_email_now: e.target.checked})} className="w-4 h-4 accent-stone-900"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase flex items-center gap-2 text-stone-500"><Receipt size={12}/> Auto Receipt</label>
                          <input type="checkbox" checked={form.send_receipt} onChange={e => setForm({...form, send_receipt: e.target.checked})} className="w-4 h-4 accent-stone-900"/>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black uppercase flex items-center gap-2 text-stone-500"><Calendar size={12}/> Reminders</label>
                          <input type="checkbox" checked={form.auto_reminders} onChange={e => setForm({...form, auto_reminders: e.target.checked})} className="w-4 h-4 accent-stone-900"/>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-200">
                      <div className="flex justify-between text-stone-400 mb-2">
                        <span className="text-[10px] font-black uppercase">Net Allocation</span>
                        <span className="font-mono">{currentSymbol}{netTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-stone-900 font-bold">
                        <span className="text-[10px] font-black uppercase">Gross Total</span>
                        <span className="text-3xl font-serif italic">{currentSymbol}{grossTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <button onClick={handleCreate} className="w-full bg-stone-900 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all shadow-xl">
                      Authorize Document
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