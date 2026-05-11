"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Mail, Send, FileCheck, ShieldCheck, 
  Trash2, Info, Package, CreditCard, Loader2, Database,
  Filter, ArrowDownToLine, MoreHorizontal, Terminal,
  Settings2
} from "lucide-react";

/**
 * TOTS OS v6.2 - PAYMENTS & LEDGER NODE
 * CENTRAL FINANCIAL INFRASTRUCTURE
 * Integrated TOTS Tone: "Network Ledger", "Fiscal Pulse", "Sales Directive"
 */

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUptime, setSystemUptime] = useState(0);
  const router = useRouter();

  // --- UI & NAVIGATION ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });
  const [commandHistory, setCommandHistory] = useState<{id: string, time: string, msg: string}[]>([]);
  
  // --- SALES DIRECTIVE (FORM) STATE ---
  const [docType, setDocType] = useState<"Invoice" | "Quote">("Invoice");
  const [activeTab, setActiveTab] = useState<"items" | "expenses">("items");
  const [formData, setFormData] = useState({ client: "", email: "", notes: "" });
  const [lineItems, setLineItems] = useState([{ id: 1, desc: "", qty: 1, price: 0, vat: 20 }]);
  const [expenses, setExpenses] = useState([{ id: 1, desc: "", amount: 0 }]);

  // --- FISCAL METRICS ---
  const [metrics, setMetrics] = useState({
    revYtd: 0,
    operatingCosts: 12400,
    vatPool: 0,
    taxDue: 0
  });

  const [ledger, setLedger] = useState([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-103", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
    { id: "INV-104", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10" },
  ]);

  // --- CORE LOGIC ---
  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
    const timer = setInterval(() => setSystemUptime(p => p + 1), 1000);
    logAction("Financial nodes synchronised with main cluster.");
    return () => clearInterval(timer);
  }, []);

  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0), [lineItems]);
  const totalVat = useMemo(() => lineItems.reduce((acc, item) => acc + (item.qty * item.price * (item.vat / 100)), 0), [lineItems]);
  const expenseTotal = useMemo(() => expenses.reduce((acc, exp) => acc + Number(exp.amount), 0), [expenses]);
  const grandTotal = subtotal + totalVat + expenseTotal;

  async function fetchFinancials() {
    try {
      setIsLoading(true);
      const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri, sat, sun');
      const totalHours = data?.reduce((acc, row) => acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri)), 0) || 450;
      const revenue = totalHours * 125; 
      setMetrics({
        revYtd: revenue,
        operatingCosts: 18400,
        vatPool: revenue * 0.20,
        taxDue: (revenue - 12570) > 0 ? (revenue - 12570) * 0.19 : 0
      });
    } catch (err) { logAction("Signal disruption: Supabase fetch failed."); } 
    finally { setIsLoading(false); }
  }

  const logAction = (msg: string) => {
    setCommandHistory(prev => [{
      id: Math.random().toString(36),
      time: new Date().toLocaleTimeString(),
      msg
    }, ...prev].slice(0, 5));
  };

  const notify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  const handleDocumentDispatch = (isDraft: boolean) => {
    if (!formData.client || grandTotal === 0) { notify("Data Integrity Failure: Missing Info"); return; }
    const newDoc = {
      id: docType === "Invoice" ? `INV-${Math.floor(Math.random() * 900) + 100}` : `QT-${Math.floor(Math.random() * 900) + 400}`,
      client: formData.client,
      amount: grandTotal,
      status: isDraft ? "draft" : "pending",
      type: docType,
      date: new Date().toISOString().split('T')[0]
    };
    setLedger([newDoc, ...ledger]);
    logAction(`${docType} directive ${newDoc.id} established.`);
    notify(isDraft ? `${docType} Committed to Drafts` : `${docType} Dispatched to ${formData.client}`);
    setActiveModal(null);
  };

  if (!isMounted) return null;

  const Modal = ({ id, title, subtitle, children }: { id: string, title: string, subtitle: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[500] flex justify-center items-center p-6"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 40, opacity: 0 }}
            className="bg-white w-full max-w-6xl rounded-[4rem] p-12 lg:p-20 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-12 right-12 p-5 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all text-stone-400 group"><X size={24} className="group-hover:rotate-90 transition-transform" /></button>
            <div className="mb-16 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] italic">{subtitle}</p>
              <h3 className="text-7xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white overflow-x-hidden">
      
      {/* NOTIFICATION HUD */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[600] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10">
            <Send size={16} className="text-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-20 space-y-24">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-stone-900 text-[#a9b897] rounded-[1.5rem] shadow-2xl"><Fingerprint size={28} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-400">Status: Ledger Node Active</p>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><p className="text-[9px] font-mono text-stone-400 tracking-widest">UPTIME: {Math.floor(systemUptime/60)}M {systemUptime%60}S</p></div>
              </div>
            </div>
            <h1 className="text-8xl md:text-[10rem] font-serif italic tracking-tighter leading-[0.85]">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex items-center bg-stone-100 p-2 rounded-[2.5rem]">
              {['Dashboard', 'Payments', 'HR', 'Network'].map((path) => (
                <button key={path} onClick={() => path !== 'Payments' && router.push(`/${path.toLowerCase()}`)} className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all rounded-[2rem] ${path === 'Payments' ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900"}`}>{path}</button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('invoice')} className="bg-stone-900 text-white px-10 py-6 rounded-[2.5rem] flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl group active:scale-95">
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Deploy Directive</span>
            </button>
          </div>
        </header>

        {/* --- FISCAL PULSE (METRICS) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 p-12 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[380px] group transition-all relative overflow-hidden">
            <div className="z-10 space-y-10">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Gross Intake YTD</p>
                <div className="bg-[#a9b897]/10 p-5 rounded-3xl text-[#a9b897]"><TrendingUp size={24}/></div>
              </div>
              <h2 className="text-7xl font-mono tracking-tighter leading-none text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 italic">Live Signal Stream</span>
              <Activity size={16} className="text-[#a9b897] animate-pulse" />
            </div>
          </div>
          {[
            { label: 'Operating Margin', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Operational Flow Status: High', icon: <Database size={24}/> },
            { label: 'VAT Escrow Pool', value: metrics.vatPool, sub: '20% Protected Liquidity', icon: <Landmark size={24}/> },
            { label: 'Fiscal Tax Due', value: metrics.taxDue, sub: 'Statutory UK Provisions', icon: <Receipt size={24}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-[4rem] p-12 flex flex-col justify-between min-h-[380px] shadow-sm hover:border-stone-900 transition-all group">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-5 rounded-3xl">{item.icon}</div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter leading-none text-stone-900">£{item.value.toLocaleString()}</h2>
              <div className="pt-10 border-t border-stone-50"><p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">{item.sub}</p></div>
            </div>
          ))}
        </section>

        {/* --- NETWORK LEDGER (TABLE) --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] overflow-hidden shadow-sm">
          <div className="p-16 flex flex-col lg:flex-row justify-between items-center gap-12 border-b border-stone-50">
            <div className="space-y-4">
              <h3 className="text-6xl font-serif italic tracking-tighter">Network Ledger</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300 italic">Audited Transaction History Stream</p>
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[450px]">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
                <input 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search Nodes..." 
                  className="w-full pl-20 pr-12 py-8 bg-stone-50 border border-stone-100 rounded-[2.5rem] text-sm font-bold outline-none focus:bg-white transition-all shadow-inner" 
                />
              </div>
              <button className="p-8 bg-stone-50 rounded-[2rem] hover:bg-stone-900 hover:text-white transition-all"><Filter size={20}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/50">
                  {['Reference', 'Entity', 'Type', 'Operational Status', 'Net Total'].map((h) => (
                    <th key={h} className="px-16 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ledger.filter(l => l.client.toLowerCase().includes(searchQuery.toLowerCase())).map((inv) => (
                  <tr key={inv.id} className="group hover:bg-stone-50/40 transition-all cursor-pointer">
                    <td className="px-16 py-12 text-[12px] font-black uppercase text-[#a9b897] font-mono tracking-tighter">{inv.id}</td>
                    <td className="px-16 py-12"><div className="space-y-1"><p className="font-bold text-xl text-stone-800">{inv.client}</p><p className="text-[9px] font-mono text-stone-300 tracking-widest">{inv.date}</p></div></td>
                    <td className="px-16 py-12 text-[10px] font-black uppercase text-stone-400 tracking-widest">{inv.type}</td>
                    <td className="px-16 py-12">
                      <div className={`inline-flex items-center gap-4 px-7 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border ${inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : inv.status === 'overdue' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : inv.status === 'overdue' ? 'bg-red-500' : 'bg-stone-300'}`} />{inv.status}
                      </div>
                    </td>
                    <td className="px-16 py-12 text-right pr-24"><div className="flex flex-col items-end"><p className="font-mono font-bold text-2xl text-stone-900 tracking-tighter">£{inv.amount.toLocaleString()}</p><p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">GBP / NET</p></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-12 border-t border-stone-50 bg-stone-50/20 flex justify-center">
            <button className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-400 hover:text-stone-900 transition-colors">Expand Complete Network History</button>
          </div>
        </section>

        {/* --- SYSTEM INTELLIGENCE & ACTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            <button onClick={() => setActiveModal('accounts')} className="p-16 bg-white border border-stone-100 rounded-[4rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group">
              <div className="flex justify-between items-start w-full">
                <div className="p-6 bg-stone-50 rounded-[2rem] group-hover:bg-stone-900 group-hover:text-white transition-all duration-500 shadow-inner"><Wallet size={36} /></div>
                <ArrowUpRight size={28} className="text-stone-200 group-hover:text-stone-900 transition-colors" />
              </div>
              <div className="space-y-4 text-left mt-12">
                <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em]">Reserve Auditing</p>
                <h5 className="text-6xl font-serif italic tracking-tighter">Liquid Assets</h5>
              </div>
            </button>
            <button onClick={() => setActiveModal('invoice')} className="p-16 bg-stone-900 text-white rounded-[4rem] flex flex-col justify-between hover:opacity-95 transition-all shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5"><Mail size={240} /></div>
              <div className="p-6 bg-white/10 rounded-[2rem] w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-500"><Send size={36} /></div>
              <div className="space-y-4 text-left mt-12 z-10">
                <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.5em]">Network Disbursement</p>
                <h5 className="text-6xl font-serif italic tracking-tighter">Dispatch Directive</h5>
              </div>
            </button>
          </div>

          <div className="lg:col-span-4 bg-[#0a0a0a] rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl">
            <div className="space-y-10">
              <div className="flex items-center gap-4 opacity-40">
                <Terminal size={18} className="text-[#a9b897]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Fiscal Pulse Feed</span>
              </div>
              <div className="font-mono text-[11px] h-52 overflow-y-auto space-y-6 scrollbar-hide">
                {commandHistory.map(cmd => (
                  <p key={cmd.id} className="leading-relaxed"><span className="text-[#a9b897] mr-4">[{cmd.time}]</span> {cmd.msg}</p>
                ))}
                <p className="opacity-30 flex items-center gap-3">Awaiting next signal <span className="animate-bounce">_</span></p>
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-stone-600">
              <span>Node Identity Verified</span>
              <div className="flex items-center gap-3 text-green-500/60"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Synced</div>
            </div>
          </div>
        </div>

        {/* --- MODAL: ACCOUNTS AUDIT --- */}
        <Modal id="accounts" title="Liquidity Report" subtitle="Operational Infrastructure">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10">
            {[
              { name: "Main Operational Reserve", bal: 142200.50, tag: "Liquid Hub", icon: <Activity size={18}/> },
              { name: "VAT Escrow Sync", bal: metrics.vatPool, tag: "Provisioned Liability", icon: <ShieldCheck size={18}/> },
              { name: "Global Tax Provisions", bal: metrics.taxDue, tag: "Statutory Holding", icon: <Landmark size={18}/> },
            ].map(acc => (
              <div key={acc.name} className="p-14 bg-stone-50 rounded-[4rem] border border-stone-100 flex flex-col justify-between min-h-[340px] shadow-inner hover:bg-white transition-all">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-[#a9b897]"><div className="p-3 bg-white rounded-2xl shadow-sm">{acc.icon}</div><p className="text-[10px] font-black uppercase tracking-[0.4em]">{acc.tag}</p></div>
                  <h6 className="text-xl font-bold tracking-tight text-stone-800 leading-snug">{acc.name}</h6>
                </div>
                <p className="text-6xl font-mono font-bold tracking-tighter text-stone-900">£{Math.floor(acc.bal).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Modal>

        {/* --- MODAL: SALES DIRECTIVE --- */}
        <Modal id="invoice" title="Sales Directive" subtitle="New Document Creation">
          <div className="space-y-16 py-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-stone-50 pb-12">
              <div className="flex bg-stone-50 p-2.5 rounded-[2.5rem] border border-stone-100 shadow-inner">
                {["Invoice", "Quote"].map((t) => (
                  <button key={t} onClick={() => setDocType(t as any)} className={`px-16 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${docType === t ? 'bg-stone-900 text-white shadow-2xl scale-105' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
              <div className="flex bg-[#f1f4ec] p-2.5 rounded-[2.5rem] border border-[#dce4d3] shadow-inner">
                {[
                  { id: 'items', label: 'Service Units', icon: <Package size={16}/> },
                  { id: 'expenses', label: 'Disbursements', icon: <CreditCard size={16}/> }
                ].map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center gap-4 ${activeTab === t.id ? 'bg-[#a9b897] text-white shadow-lg' : 'text-stone-500 hover:text-stone-900'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-8 tracking-[0.5em]">Target Entity / Independent Node</label>
                <input value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} placeholder="Input company or node identifier..." className="w-full p-10 bg-stone-50 border border-stone-100 rounded-[2.5rem] outline-none focus:bg-white focus:border-stone-900 transition-all font-bold text-xl shadow-inner" />
              </div>
              <div className="space-y-6">
                <label className="text-[11px] font-black uppercase text-stone-400 ml-8 tracking-[0.5em]">Signal Destination (Email)</label>
                <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="finance@entity.network" className="w-full p-10 bg-stone-50 border border-stone-100 rounded-[2.5rem] outline-none focus:bg-white focus:border-stone-900 transition-all font-bold text-xl shadow-inner" />
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex justify-between items-center px-10">
                <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.6em] italic">Directive Composition</p>
                <button 
                  onClick={() => activeTab === 'items' ? setLineItems([...lineItems, { id: Date.now(), desc: "", qty: 1, price: 0, vat: 20 }]) : setExpenses([...expenses, { id: Date.now(), desc: "", amount: 0 }])} 
                  className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-[#a9b897] hover:text-stone-900 transition-all"
                >
                  <Plus size={20}/> Append Node
                </button>
              </div>
              
              <div className="space-y-6 max-h-[480px] overflow-y-auto pr-6 custom-scrollbar">
                {activeTab === 'items' ? lineItems.map((item, idx) => (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="grid grid-cols-12 gap-10 items-center bg-stone-50 p-10 rounded-[3rem] border border-stone-100 shadow-inner group">
                    <div className="col-span-5"><input placeholder="Description..." value={item.desc} onChange={(e) => { const n = [...lineItems]; n[idx].desc = e.target.value; setLineItems(n); }} className="w-full bg-transparent outline-none font-bold text-xl placeholder:text-stone-300" /></div>
                    <div className="col-span-2 text-center border-l border-stone-200"><p className="text-[8px] font-black uppercase text-stone-400 mb-3">Units</p><input type="number" value={item.qty} onChange={(e) => { const n = [...lineItems]; n[idx].qty = Number(e.target.value); setLineItems(n); }} className="w-full bg-transparent outline-none font-mono text-2xl text-center" /></div>
                    <div className="col-span-2 text-center border-l border-stone-200"><p className="text-[8px] font-black uppercase text-stone-400 mb-3">Unit £</p><input type="number" value={item.price} onChange={(e) => { const n = [...lineItems]; n[idx].price = Number(e.target.value); setLineItems(n); }} className="w-full bg-transparent outline-none font-mono text-2xl text-center" /></div>
                    <div className="col-span-2 text-center border-l border-stone-200"><p className="text-[8px] font-black uppercase text-stone-400 mb-3">VAT</p>
                      <select value={item.vat} onChange={(e) => { const n = [...lineItems]; n[idx].vat = Number(e.target.value); setLineItems(n); }} className="bg-transparent outline-none font-mono font-bold text-[#a9b897] cursor-pointer">
                        <option value={20}>20%</option><option value={5}>5%</option><option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-right"><button onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={22}/></button></div>
                  </motion.div>
                )) : expenses.map((exp, idx) => (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={exp.id} className="grid grid-cols-12 gap-10 items-center bg-stone-50 p-10 rounded-[3rem] border border-stone-100 shadow-inner group">
                    <div className="col-span-8"><input placeholder="Expense identifier (Transport, Cloud Storage)..." value={exp.desc} onChange={(e) => { const n = [...expenses]; n[idx].desc = e.target.value; setExpenses(n); }} className="w-full bg-transparent outline-none font-bold text-xl placeholder:text-stone-300" /></div>
                    <div className="col-span-3 text-right"><p className="text-[8px] font-black uppercase text-stone-400 mb-3">Amount £</p><input type="number" value={exp.amount} onChange={(e) => { const n = [...expenses]; n[idx].amount = Number(e.target.value); setExpenses(n); }} className="w-full bg-transparent outline-none font-mono text-3xl text-right text-[#a9b897] font-bold" /></div>
                    <div className="col-span-1 text-right"><button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={22}/></button></div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end pt-16 border-t border-stone-100">
              <div className="bg-stone-50 p-12 rounded-[4rem] space-y-6 border border-stone-100 shadow-inner">
                <div className="flex items-center gap-4 text-stone-300 mb-4 font-black uppercase text-[10px] tracking-[0.5em]"><Info size={20}/> Calculation Ledger</div>
                <div className="flex justify-between text-base font-bold text-stone-500 tracking-tight"><span>Subtotal (Aggregated)</span><span className="font-mono">£{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-base font-bold text-stone-400 tracking-tight"><span>VAT Liability (20% Pool)</span><span className="font-mono">£{totalVat.toLocaleString()}</span></div>
                {expenseTotal > 0 && <div className="flex justify-between text-base font-bold text-[#a9b897] tracking-tight"><span>Operating Disbursements</span><span className="font-mono">£{expenseTotal.toLocaleString()}</span></div>}
                <div className="pt-10 border-t border-stone-200 flex justify-between items-baseline mt-4">
                   <p className="text-[14px] font-black uppercase tracking-[0.6em] text-stone-900">Final Total</p>
                   <p className="text-7xl font-mono font-bold tracking-tighter text-stone-900">£{grandTotal.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <button onClick={() => handleDocumentDispatch(true)} className="w-full bg-white border-2 border-stone-100 py-10 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] hover:border-stone-900 transition-all flex items-center justify-center gap-5 shadow-sm">Save Draft</button>
                <button onClick={() => handleDocumentDispatch(false)} className="w-full bg-stone-900 text-white py-10 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-5 group">Execute Directive <Send size={20} className="group-hover:translate-x-3 transition-transform text-[#a9b897]" /></button>
              </div>
            </div>
          </div>
        </Modal>

        {/* --- GLOBAL FOOTER --- */}
        <footer className="pt-20 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-12 text-stone-300 pb-12">
          <div className="flex items-center gap-8">
            <p className="text-[11px] font-black uppercase tracking-[0.5em]">TOTS Infrastructure v6.2.0</p>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <p className="text-[11px] font-mono tracking-widest text-stone-400">FINANCE_CLUSTER_SYNCED</p>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest">
            <button className="hover:text-stone-900 transition-all">Audit Trails</button>
            <button className="hover:text-stone-900 transition-all">Privacy Node</button>
            <button className="hover:text-stone-900 transition-all">Security Protocol</button>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dcdcdc; border-radius: 10px; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}