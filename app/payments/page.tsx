"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, FileText, X, Landmark, Trash2, 
  ShieldAlert, DownloadCloud, ChevronRight, 
  Globe, Search, Info
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Page from "../components/Page";
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

// --- HELPERS ---
const getCurrentTaxYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const isAfterApril6 = now > new Date(year, 3, 6); 
  return isAfterApril6 ? `${year}/${(year + 1).toString().slice(-2)}` : `${year - 1}/${year.toString().slice(-2)}`;
};

const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" }
];

export default function FinancePage() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<DocType>("invoices");
  const [showModal, setShowModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // -- Master Form State --
  const [form, setForm] = useState({ 
    entity_name: "",
    date: new Date().toISOString().split("T")[0],
    tax_year: getCurrentTaxYear(),
    currency: "GBP",
    payroll_meta: { tax_code: "1257L", student_loan: false, nic_category: "A" },
    lines: [{ description: "", amount: "" }],
    include_vat: false,
    vat_rate: 20
  });

  useEffect(() => { init(); }, []);
  useEffect(() => { if (teamId) loadDocs(teamId); }, [type, teamId]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: mem } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
    if (mem?.team_id) {
      setTeamId(mem.team_id);
      const { data: s } = await supabase.from("settings").select("*").eq("team_id", mem.team_id).maybeSingle();
      setBrand(s);
    }
  }

  async function loadDocs(tId: string) {
    setLoading(true);
    const { data } = await supabase.from(type).select("*").eq("team_id", tId).order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }

  // --- SEARCH FILTER LOGIC ---
  const filteredDocs = docs.filter(d => 
    d.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.amount?.toString().includes(searchTerm) ||
    d.tax_year?.includes(searchTerm)
  );

  const addLine = () => setForm({ ...form, lines: [...form.lines, { description: "", amount: "" }] });
  const removeLine = (index: number) => {
    const newLines = [...form.lines];
    newLines.splice(index, 1);
    setForm({ ...form, lines: newLines });
  };
  const updateLine = (index: number, field: string, value: string) => {
    const newLines = [...form.lines] as any;
    newLines[index][field] = value;
    setForm({ ...form, lines: newLines });
  };

  const netTotal = form.lines.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
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
        ...form.payroll_meta, 
        lines: form.lines, 
        net_amount: netTotal,
        vat_amount: vatAmount,
        is_vat_inclusive: form.include_vat,
        currency_symbol: currentSymbol
      }
    }]);
    
    if (!error) {
      setShowModal(false);
      loadDocs(teamId);
      setForm({ ...form, entity_name: "", lines: [{ description: "", amount: "" }] });
    }
  };

  const downloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`${type}_${selectedDoc.entity_name}.pdf`);
  };

  return (
    <Page title="Treasury">
      <div className="min-h-screen bg-[#ecebe6] p-6 md:p-16">
        
        {/* HEADER */}
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
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">Automatic Transition Applied 06 April</p>
            </div>
            <div className="h-16 w-[1px] bg-stone-100" />
            <div>
               <p className="text-5xl font-serif italic text-stone-900">96%</p>
               <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Health</p>
            </div>
          </div>
        </div>

        {/* SEARCH & NAVIGATION */}
        <div className="max-w-[1400px] mx-auto mb-10 space-y-6">
          <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300" size={24} />
            <input 
              type="text" 
              placeholder="Filter ledger by name, year, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white py-10 pl-24 pr-10 rounded-[3rem] text-2xl font-serif italic border border-stone-200 shadow-sm focus:shadow-2xl focus:border-stone-900 transition-all outline-none"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {["invoices", "quotes", "expenses", "payroll", "self_assessment", "end_of_year"].map((t) => (
              <button key={t} onClick={() => setType(t as DocType)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-white text-stone-900 shadow-md border-stone-900' : 'bg-stone-200/50 text-stone-400 hover:bg-white'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* FEED */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          {loading ? (
             <div className="p-20 text-center italic font-serif text-stone-400">Syncing nodes...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-32 text-center border border-stone-100">
               <p className="text-2xl font-serif italic text-stone-300">
                {searchTerm ? `No results for "${searchTerm}"` : `No transactions recorded for ${type}.`}
               </p>
            </div>
          ) : (
            filteredDocs.map((d) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={d.id} onClick={() => setSelectedDoc(d)} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:border-[#a9b897] transition-all cursor-pointer flex justify-between items-center group">
                 <div className="flex items-center gap-8">
                    <div className="p-5 bg-stone-50 rounded-2xl text-stone-400 group-hover:text-[#a9b897] transition-colors"><FileText size={24} /></div>
                    <div>
                       <div className="flex items-center gap-3">
                          <p className="text-3xl font-mono font-bold tracking-tighter">{CURRENCIES.find(c => c.code === d.currency)?.symbol || "£"}{Number(d.amount).toLocaleString()}</p>
                          <span className="text-[8px] font-black px-2 py-1 bg-stone-100 rounded text-stone-400 uppercase">{d.currency}</span>
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-1">{d.entity_name} • {d.date}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Period</p>
                       <p className="text-sm font-serif italic text-stone-800">{d.tax_year}</p>
                    </div>
                    <ChevronRight size={20} className="text-stone-200 group-hover:text-stone-900" />
                 </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-stone-900/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-[#ecebe6] w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col">
               <div className="p-10 bg-white border-b border-stone-200 flex justify-between items-center">
                  <h2 className="text-4xl font-serif italic text-stone-900 uppercase tracking-tighter">New Entry: {type.replace('_', ' ')}</h2>
                  <button onClick={() => setShowModal(false)} className="p-4 bg-stone-100 rounded-full hover:text-red-500"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-12 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Entity</label>
                        <input value={form.entity_name} onChange={(e) => setForm({...form, entity_name: e.target.value})} className="w-full p-6 bg-white border-none rounded-3xl shadow-sm outline-none focus:ring-2 ring-[#a9b897]" placeholder="Client Name" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Currency Node</label>
                        <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="w-full p-6 bg-white border-none rounded-3xl shadow-sm outline-none appearance-none font-bold">
                           {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 ml-4">Tax Period</label>
                        <input value={form.tax_year} onChange={(e) => setForm({...form, tax_year: e.target.value})} className="w-full p-6 bg-white border-none rounded-3xl shadow-sm outline-none text-stone-400 font-mono" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Line Items</p>
                        <button onClick={addLine} className="text-[#a9b897] text-[10px] font-black uppercase hover:underline">+ Add Row</button>
                     </div>
                     {form.lines.map((l, i) => (
                        <div key={i} className="flex gap-4">
                           <input placeholder="Description" value={l.description} onChange={(e) => updateLine(i, 'description', e.target.value)} className="flex-grow p-6 bg-white border-none rounded-3xl shadow-sm outline-none" />
                           <input placeholder="0.00" type="number" value={l.amount} onChange={(e) => updateLine(i, 'amount', e.target.value)} className="w-48 p-6 bg-white border-none rounded-3xl shadow-sm outline-none font-mono" />
                           <button onClick={() => removeLine(i)} className="p-4 text-stone-300 hover:text-red-500"><Trash2 size={20} /></button>
                        </div>
                     ))}
                  </div>

                  <div className="p-10 bg-stone-900 rounded-[3rem] text-white flex justify-between items-center">
                     <div className="flex items-center gap-6">
                        <input type="checkbox" checked={form.include_vat} onChange={(e) => setForm({...form, include_vat: e.target.checked})} className="w-8 h-8 rounded-xl accent-[#a9b897]" />
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">VAT logic</p>
                           <p className="text-sm italic text-stone-400">Apply standard 20% rate</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-stone-500">Gross Payable</p>
                        <p className="text-5xl font-mono font-bold tracking-tighter">{currentSymbol}{grossTotal.toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               <div className="p-10 bg-white border-t border-stone-200 flex justify-end gap-4">
                  <button onClick={handleCreate} className="px-12 py-6 bg-stone-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">
                     Commit Transaction
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
      {selectedDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-stone-900/90 backdrop-blur-xl" onClick={() => setSelectedDoc(null)} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-5xl h-[94vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-10 border-b border-stone-100 flex justify-between items-center">
               <h2 className="text-3xl font-serif italic text-stone-900">Archive Preview</h2>
               <div className="flex gap-4">
                  <button onClick={downloadPDF} className="p-5 bg-stone-900 text-white rounded-3xl hover:bg-[#a9b897] transition-all"><DownloadCloud size={24} /></button>
                  <button onClick={() => setSelectedDoc(null)} className="p-5 bg-stone-100 text-stone-400 rounded-3xl hover:text-red-500"><X size={24} /></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-stone-100/30">
               <div ref={printRef} className="bg-white p-20 shadow-2xl min-h-[1000px] font-serif text-stone-900 max-w-[210mm] mx-auto border border-stone-50">
                  <div className="flex justify-between items-start mb-20">
                     <div className="space-y-4">
                        {brand?.logo && <img src={brand.logo} className="h-20 w-auto mb-6 grayscale" alt="Institutional Logo" />}
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{brand?.business_name || "THE INSTITUTION"}</h2>
                        <p className="text-[10px] font-bold text-stone-400 whitespace-pre-line uppercase tracking-widest leading-loose">{brand?.address}</p>
                     </div>
                     <div className="text-right space-y-2">
                        <p className="text-[10px] font-black uppercase text-stone-300">Transaction Protocol</p>
                        <p className="text-2xl font-bold italic">{type.toUpperCase()}</p>
                        <p className="text-sm font-mono text-stone-400">ID: {selectedDoc.id.split('-')[0]}</p>
                        <p className="text-xl font-bold mt-4">{selectedDoc.date}</p>
                     </div>
                  </div>

                  <div className="mb-20">
                     <p className="text-[10px] font-black uppercase text-stone-300 mb-2">Subject Node</p>
                     <p className="text-4xl italic text-stone-900">{selectedDoc.entity_name}</p>
                  </div>

                  <table className="w-full mb-20 border-collapse">
                     <thead>
                        <tr className="border-b-2 border-stone-900">
                           <th className="text-left py-6 text-[11px] font-black uppercase">Service / Description</th>
                           <th className="text-right py-6 text-[11px] font-black uppercase">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-100">
                        {selectedDoc.metadata?.lines?.map((l: any, i: number) => (
                           <tr key={i}>
                              <td className="py-8 text-xl italic">{l.description}</td>
                              <td className="py-8 text-right font-mono text-xl">{selectedDoc.metadata?.currency_symbol || "£"}{Number(l.amount).toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="flex justify-end pt-12">
                     <div className="w-80 space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase text-stone-400">
                           <span>Net Subtotal</span>
                           <span>{selectedDoc.metadata?.currency_symbol || "£"}{Number(selectedDoc.metadata?.net_amount || 0).toLocaleString()}</span>
                        </div>
                        {selectedDoc.metadata?.is_vat_inclusive && (
                           <div className="flex justify-between text-[11px] font-black uppercase text-stone-400">
                              <span>VAT ({selectedDoc.vat_rate}%)</span>
                              <span>{selectedDoc.metadata?.currency_symbol || "£"}{Number(selectedDoc.metadata?.vat_amount || 0).toLocaleString()}</span>
                           </div>
                        )}
                        <div className="flex justify-between text-4xl font-bold pt-6 border-t border-stone-100">
                           <span className="font-serif italic">Total</span>
                           <span className="text-stone-900">{selectedDoc.metadata?.currency_symbol || "£"}{Number(selectedDoc.amount).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-40 pt-10 border-t border-stone-100 flex justify-between items-center italic text-stone-300 text-[10px] font-black uppercase tracking-[0.3em]">
                     <div className="flex items-center gap-3"><Globe size={14} /> Global Fiscal Integrity {selectedDoc.tax_year}</div>
                     <div>Digital Archive Verification Signed</div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </Page>
  );
}