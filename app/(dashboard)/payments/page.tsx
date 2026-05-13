"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Mail, Send, 
  Trash2, Info, Package, CreditCard, Database,
  Filter, Terminal, Cpu, Globe, AlertCircle,
  CheckCircle2, ChevronDown, Download, Share2,
  FileText, ShieldCheck, Zap, Layers, BarChart3,
  RefreshCcw, Calculator, Settings2, FileJson, FileSpreadsheet
} from "lucide-react";

/**
 * TOTS OS v6.5.0 - FISCAL PULSE NODE
 * REVISION: REMOVED TERMINAL NODE | ENHANCED MODAL TRIGGER ENGINE
 */

// --- SUB-COMPONENTS ---

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div className={`${isDark ? 'bg-stone-900 shadow-2xl' : 'bg-white border border-stone-100 shadow-sm'} p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:border-stone-900 transition-all duration-500`}>
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{label}</p>
      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-stone-50 text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {icon}
      </div>
    </div>
    
    <div className="z-10 mt-6">
      <h2 className={`font-mono tracking-tighter leading-none transition-all ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} 
        ${value.toString().length > 10 ? 'text-2xl' : value.toString().length > 7 ? 'text-3xl' : 'text-5xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-6 border-t border-stone-50/10 flex items-center justify-between">
      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={160} className="absolute -right-12 -top-12 opacity-[0.03] text-white" />}
  </div>
);

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const router = useRouter();

  // --- CORE STATE ---
  const [showModal, setShowModal] = useState(false); // Refactored Modal Trigger
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  
  // --- FORM ENGINE STATE ---
  const [docType, setDocType] = useState<"Invoice" | "Quote">("Invoice");
  const [activeTab, setActiveTab] = useState<"items" | "expenses" | "forecast">("items");
  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    reference: `TX-${Math.floor(Math.random() * 10000)}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: "Net 14",
    currency: "GBP"
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "Enterprise Architecture Node", qty: 1, price: 12500, vat: 20, discount: 0 }
  ]);
  const [expenses, setExpenses] = useState([
    { id: Date.now() + 1, desc: "SaaS Cloud Allocation", amount: 450 }
  ]);

  // --- DATA SETS ---
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18450, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
    { id: "INV-922", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10" },
    { id: "INV-945", client: "Tyrell Corp", amount: 28500, status: "paid", type: "Invoice", date: "2026-02-14" },
  ]);

  // --- LOGIC: SYSTEM ACTIONS ---
  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 4000);
  };

  const handleOpenModal = () => {
    console.log("Modal Engagement Sequence Initiated");
    setShowModal(true);
  };

  // --- LOGIC: FINANCIAL ENGINE ---
  useEffect(() => {
    setIsMounted(true);
    const syncData = async () => {
        const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
        const hours = data?.reduce((a, r) => a + (Number(r.mon) + Number(r.tue) + Number(r.wed) + Number(r.thu) + Number(r.fri)), 0) || 520;
        const rev = hours * 125;
        setMetrics({ 
          revYtd: rev, 
          operatingCosts: 18450, 
          vatPool: rev * 0.2, 
          taxDue: (rev - 12570) * 0.19 
        });
    };
    syncData();
    const t = setInterval(() => setSystemUptime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const subtotal = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * (1 - i.discount / 100)), 0), [lineItems]);
  const totalVat = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * (1 - i.discount / 100) * (i.vat / 100)), 0), [lineItems]);
  const expTotal = useMemo(() => expenses.reduce((a, e) => a + Number(e.amount), 0), [expenses]);
  const grandTotal = subtotal + totalVat + expTotal;

  // --- LOGIC: HANDLERS ---
  const handleItemUpdate = (id: number, key: string, val: any) => {
    setLineItems(lineItems.map(i => i.id === id ? { ...i, [key]: val } : i));
  };

  const handleDispatch = (isDraft: boolean) => {
    if (!formData.client) {
      triggerNotify("Entity Node Missing", "error");
      return;
    }
    const doc = {
      id: docType === "Invoice" ? `INV-${Math.floor(Math.random() * 900) + 100}` : `QT-${Math.floor(Math.random() * 900) + 400}`,
      client: formData.client,
      amount: grandTotal,
      status: isDraft ? "draft" : "pending",
      type: docType,
      date: new Date().toISOString().split('T')[0]
    };
    setLedger([doc, ...ledger]);
    triggerNotify(isDraft ? "Draft Saved" : "Directive Dispatched");
    setShowModal(false);
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter(l => 
      (l.client.toLowerCase().includes(searchQuery.toLowerCase()) || l.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === "all" || l.status === filterStatus)
    );
  }, [ledger, searchQuery, filterStatus]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-16 overflow-x-hidden">
      
      {/* NOTIFICATION HUD */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[5000] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10">
            {notification.type === "success" ? <CheckCircle2 size={14} className="text-[#a9b897]" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-8 py-12 space-y-16">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-14">
          <div className="space-y-5 text-left">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 text-[#a9b897] rounded-3xl shadow-xl hover:rotate-12 transition-transform"><Fingerprint size={24} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[9px] tracking-[0.5em] text-stone-300">CORE NODE: FISCAL_PULSE_6.5</p>
                <div className="flex items-center gap-2 text-green-500/50">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest uppercase">ENCRYPTED LINK ACTIVE [{systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl xl:text-9xl font-serif italic tracking-tighter leading-[0.8] transition-all">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <nav className="flex items-center bg-stone-100 p-2 rounded-full shadow-inner">
              {['Payments', 'HR', 'Analytics'].map((path) => (
                <button 
                  key={path} 
                  onClick={() => path !== 'Payments' && router.push(`/${path.toLowerCase()}`)} 
                  className={`px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-full ${path === 'Payments' ? "bg-white text-stone-900 shadow-md scale-105" : "text-stone-400 hover:text-stone-900"}`}
                >
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={handleOpenModal} className="bg-stone-900 text-white px-10 py-5 rounded-full flex items-center gap-5 hover:bg-stone-800 transition-all shadow-2xl group active:scale-95">
              <Plus size={18} className="text-[#a9b897] group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Deploy Directive</span>
            </button>
          </div>
        </header>

        {/* TOP 4 METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricCard label="Gross Intake YTD" value={metrics.revYtd} sub="Operational Target: 112%" icon={<TrendingUp size={18}/>} isDark />
          <MetricCard label="Operational Margin" value={metrics.revYtd - metrics.operatingCosts} sub="Flow: Unrestricted" icon={<Database size={18}/>} />
          <MetricCard label="VAT Escrow Pool" value={metrics.vatPool} sub="Statutory Lock" icon={<Landmark size={18}/>} />
          <MetricCard label="Fiscal Tax Due" value={metrics.taxDue} sub="FY26 Provision" icon={<Receipt size={18}/>} />
        </section>

        {/* TWO-COLUMN INTERACTIVE GRID (TERMINAL REMOVED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button className="p-16 bg-white border border-stone-100 rounded-[3.5rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group min-h-[450px]">
              <div className="flex justify-between w-full">
                <div className="p-8 bg-stone-50 rounded-3xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500"><Wallet size={48} /></div>
                <div className="p-5 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all"><ArrowUpRight size={24}/></div>
              </div>
              <div className="mt-12 text-left">
                <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.5em] italic mb-3">Audit Stream</p>
                <h5 className="text-6xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
            </button>

            <button onClick={handleOpenModal} className="p-16 bg-stone-900 text-white rounded-[3.5rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-2xl group relative overflow-hidden text-left active:scale-[0.98] min-h-[450px]">
                <div className="p-8 bg-white/10 rounded-3xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-500"><Send size={48} /></div>
                <div className="mt-12 relative z-10">
                    <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em] mb-3">Outbound Logic</p>
                    <h5 className="text-6xl font-serif italic tracking-tighter">Dispatch Node</h5>
                </div>
                <Mail size={220} className="absolute -right-12 -bottom-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700" />
            </button>
        </div>

        {/* NETWORK LEDGER ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[3.5rem] overflow-hidden shadow-sm">
          <div className="p-12 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-10">
            <div className="text-left w-full xl:w-auto">
                <h3 className="text-5xl font-serif italic tracking-tighter">Network Ledger</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 mt-2">Historical Operational Stream</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-96 min-w-[300px]">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#a9b897]" size={16} />
                  <input placeholder="Search References..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-8 py-5 bg-stone-50 border border-stone-100 rounded-full text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-300" />
              </div>
              <div className="flex gap-2">
                <button className="p-5 bg-stone-50 rounded-full text-stone-300 hover:bg-stone-900 hover:text-[#a9b897] transition-all"><FileSpreadsheet size={20}/></button>
                <button className="p-5 bg-stone-900 text-[#a9b897] rounded-full hover:scale-110 transition-all shadow-lg"><Filter size={20}/></button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-stone-50/50">
                <tr>
                  {['Reference', 'Target Entity', 'Directive Type', 'Status', 'Aggregate Total'].map((h) => (
                    <th key={h} className="px-12 py-8 text-[9px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredLedger.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 transition-all cursor-pointer group active:bg-stone-100">
                    <td className="px-12 py-10 font-mono text-[11px] text-[#a9b897] font-black">{inv.id}</td>
                    <td className="px-12 py-10">
                      <p className="font-bold text-xl tracking-tighter text-stone-900">{inv.client}</p>
                      <p className="text-[8px] font-mono text-stone-300 uppercase mt-1 tracking-widest">{inv.date} · {inv.type === 'Invoice' ? 'NET 14' : 'EXP 30D'}</p>
                    </td>
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${inv.type === 'Invoice' ? 'bg-[#a9b897]' : 'bg-stone-200'}`} />
                        <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{inv.type}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <span className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-300 border-stone-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-12 py-10 text-right pr-24 relative">
                        <p className="font-mono font-bold text-2xl tracking-tighter text-stone-900">£{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                            <ChevronDown size={18} className="text-stone-200" />
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* DISPATCH DIRECTIVE MODAL ENGINE */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/70 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 100, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-6xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              
              <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none text-stone-900"><Calculator size={400} /></div>

              <div className="flex justify-between items-center mb-14 border-b border-stone-50 pb-10 z-10">
                <div className="text-left space-y-2">
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Directive_V6.5</p>
                    <span className="px-4 py-1.5 bg-stone-50 rounded-full text-[9px] font-mono text-stone-300 font-black">{formData.reference}</span>
                  </div>
                  <h3 className="text-6xl font-serif italic tracking-tighter">Deploy Directive</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-6 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all shadow-sm active:scale-90"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-12 z-10 text-left">
                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4">Target Node Identity</label>
                    <input placeholder="Entity Name..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full p-8 bg-stone-50 rounded-[2rem] border-none outline-none font-bold text-2xl focus:ring-4 ring-[#a9b897]/10 transition-all" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4">Signal Route (Email)</label>
                    <input placeholder="entity@node.pulse" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-8 bg-stone-50 rounded-[2rem] border-none outline-none font-bold text-2xl focus:ring-4 ring-[#a9b897]/10 transition-all" />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-14 border-b border-stone-50">
                    {['Unit Logic', 'Flow Leakage', 'Fiscal Forecast'].map((label, idx) => {
                        const tabIds = ['items', 'expenses', 'forecast'];
                        return (
                            <button key={tabIds[idx]} onClick={() => setActiveTab(tabIds[idx] as any)} className={`flex items-center gap-3 pb-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === tabIds[idx] ? 'text-stone-900' : 'text-stone-200'}`}>
                                {label}
                                {activeTab === tabIds[idx] && <motion.div layoutId="tabUnder" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-[#a9b897] rounded-full" />}
                            </button>
                        )
                    })}
                </div>

                <div className="min-h-[300px]">
                  {activeTab === 'items' && (
                    <div className="space-y-4">
                        {lineItems.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-5 items-center bg-stone-50/50 p-5 rounded-[2rem] hover:bg-stone-50 transition-all">
                                <div className="col-span-6">
                                    <input value={item.desc} onChange={(e) => handleItemUpdate(item.id, 'desc', e.target.value)} placeholder="Unit description..." className="w-full bg-transparent p-4 outline-none font-bold text-lg" />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" value={item.qty} onChange={(e) => handleItemUpdate(item.id, 'qty', Number(e.target.value))} className="w-full bg-white rounded-xl p-3 outline-none font-mono font-black text-center text-sm shadow-sm" />
                                </div>
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2 font-mono font-black text-xl justify-end">
                                        <span className="text-stone-200">£</span>
                                        <input type="number" value={item.price} onChange={(e) => handleItemUpdate(item.id, 'price', Number(e.target.value))} className="bg-transparent w-full outline-none text-right" />
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))} className="p-4 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setLineItems([...lineItems, { id: Date.now(), desc: "", qty: 1, price: 0, vat: 20, discount: 0 }])} className="w-full py-8 border-2 border-dashed border-stone-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-4">
                            <Plus size={18}/> Append Unit Directive
                        </button>
                    </div>
                  )}

                  {activeTab === 'expenses' && (
                    <div className="space-y-4">
                        {expenses.map((exp, idx) => (
                            <div key={exp.id} className="grid grid-cols-12 gap-5 items-center bg-stone-50/50 p-5 rounded-[2rem] hover:bg-stone-50 transition-all">
                                <div className="col-span-8">
                                    <input value={exp.desc} onChange={(e) => {
                                        const n = [...expenses]; n[idx].desc = e.target.value; setExpenses(n);
                                    }} placeholder="Cost identifier..." className="w-full bg-transparent p-4 outline-none font-bold text-lg" />
                                </div>
                                <div className="col-span-3 flex items-center gap-3 font-mono font-black text-2xl justify-end pr-4">
                                    <span className="text-stone-200">£</span>
                                    <input type="number" value={exp.amount} onChange={(e) => {
                                        const n = [...expenses]; n[idx].amount = Number(e.target.value); setExpenses(n);
                                    }} className="bg-transparent w-full outline-none text-right" />
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="p-4 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setExpenses([...expenses, { id: Date.now(), desc: "", amount: 0 }])} className="w-full py-8 border-2 border-dashed border-stone-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-4">
                            <Plus size={18}/> Append Leakage Direct
                        </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-12 pt-10 bg-stone-50/80 backdrop-blur-xl border-t border-stone-100 rounded-b-[4rem] z-20">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
                  <div className="flex flex-wrap gap-12 items-center justify-center lg:justify-start">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Net Units</p>
                        <p className="font-mono text-2xl font-bold tracking-tighter">£{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Tax Provision</p>
                        <p className="font-mono text-2xl font-bold tracking-tighter">£{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto">
                    <div className="text-center lg:text-right">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-2">Aggregate Total</p>
                        <h4 className={`font-mono font-bold tracking-tighter leading-none transition-all ${grandTotal.toString().length > 9 ? 'text-4xl' : 'text-6xl'}`}>
                            £{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h4>
                    </div>
                    <button onClick={() => handleDispatch(false)} className="w-full sm:w-auto px-12 py-6 bg-stone-900 text-white rounded-full text-[11px] font-black uppercase tracking-[0.5em] hover:bg-stone-800 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                      Dispatch <Send size={18} className="text-[#a9b897] group-hover:translate-x-2 transition-transform duration-500" />
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        ::selection { background: #a9b897; color: white; }
      `}</style>
    </div>
  );
}