"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, FileText, X, Landmark, Trash2, 
  ShieldAlert, DownloadCloud, ChevronRight, 
  Globe, Search, Calculator
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Page from "@/components/Page"; // Fixed import path
import { motion, AnimatePresence } from "framer-motion";

type DocType = "invoices" | "quotes" | "expenses" | "payroll" | "self_assessment" | "end_of_year";

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

  const [form, setForm] = useState({ 
    entity_name: "",
    date: new Date().toISOString().split("T")[0],
    tax_year: getCurrentTaxYear(),
    currency: "GBP",
    lines: [{ description: "", amount: "" }],
    include_vat: false,
    vat_rate: 20
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
    }
  }, [type]);

  const loadDocs = async (tId: string) => {
    setLoading(true);
    const { data } = await supabase.from(type).select("*").eq("team_id", tId).order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { init(); }, [init]);

  const filteredDocs = docs.filter(d => 
    d.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.tax_year?.includes(searchTerm)
  );

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
        
        {/* UPPER DASHBOARD */}
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

        {/* SEARCH & DOC SELECTOR */}
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

        {/* LEDGER FEED */}
        <div className="max-w-[1400px] mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
                <div className="p-20 text-center italic font-serif text-stone-400">Syncing data stream...</div>
            ) : filteredDocs.map((d) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                key={d.id} 
                onClick={() => setSelectedDoc(d)} 
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-2xl hover:border-[#a9b897] transition-all cursor-pointer flex justify-between items-center group"
              >
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
                 <ChevronRight size={20} className="text-stone-200 group-hover:text-stone-900" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* RENDER MODALS (Omitted for brevity, logic remains same as provided) */}
      {/* Ensure the PDF Preview modal uses the `printRef` for high-quality capture */}
      
    </Page>
  );
}