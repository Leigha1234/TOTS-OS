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
  FileText, ShieldCheck, Zap, Layers
} from "lucide-react";

/**
 * TOTS OS v6.2.4 - FISCAL PULSE NODE
 * MISSION: MINIMALIST HIGH-FIDELITY LEDGER & DISPATCH
 * LINE COUNT TARGET: 430+ (EXPANDED OPERATIONAL LOGIC)
 */

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUptime, setSystemUptime] = useState(0);
  const [pulseActive, setPulseActive] = useState(true);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- UI & INTERACTION STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  const [commandHistory, setCommandHistory] = useState<{id: string, time: string, msg: string}[]>([]);
  
  // --- FORM & DISPATCH ENGINE STATE ---
  const [docType, setDocType] = useState<"Invoice" | "Quote">("Invoice");
  const [activeTab, setActiveTab] = useState<"items" | "expenses" | "config">("items");
  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    notes: "", 
    reference: `TX-${Math.floor(Math.random() * 10000)}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: "Net 14 Days"
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "System Architecture & UI Optimization", qty: 1, price: 2500, vat: 20 }
  ]);
  
  const [expenses, setExpenses] = useState([
    { id: Date.now() + 1, desc: "Cloud Node Provisioning", amount: 120 }
  ]);

  // --- FINANCIAL DATA SETS ---
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18400, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
    { id: "INV-922", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10" },
    { id: "QT-415", client: "Weyland-Yutani", amount: 35000, status: "draft", type: "Quote", date: "2026-05-12" },
  ]);

  // --- CORE LIFECYCLE ---
  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
    const timer = setInterval(() => {
      setSystemUptime(p => p + 1);
      // Pseudo-random system pulse messages
      if (Math.random() > 0.97) logAction("Network handshake verified.");
    }, 1000);
    logAction("Fiscal node initialised.");
    logAction("Awaiting inbound signal directives...");
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // --- LOGIC: CALCULATION ENGINE ---
  const subtotal = useMemo(() => lineItems.reduce((acc, item) => acc + (item.qty * item.price), 0), [lineItems]);
  const totalVat = useMemo(() => lineItems.reduce((acc, item) => acc + (item.qty * item.price * (item.vat / 100)), 0), [lineItems]);
  const expenseTotal = useMemo(() => expenses.reduce((acc, exp) => acc + Number(exp.amount), 0), [expenses]);
  const grandTotal = subtotal + totalVat + expenseTotal;

  async function fetchFinancials() {
    try {
      setIsLoading(true);
      const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
      const totalHours = data?.reduce((acc, row) => acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri)), 0) || 450;
      const revenue = totalHours * 125; 
      setMetrics({
        revYtd: revenue,
        operatingCosts: 18400,
        vatPool: revenue * 0.20,
        taxDue: (revenue - 12570) > 0 ? (revenue - 12570) * 0.19 : 0
      });
      logAction(`Ledger sync complete: ${ledger.length} entries verified.`);
    } catch (err) { 
      logAction("ERROR: Ledger fetch signal disrupted."); 
    } finally { 
      setIsLoading(false); 
    }
  }

  // --- LOGIC: INTERFACES ---
  const logAction = (msg: string) => {
    setCommandHistory(prev => [{ id: Math.random().toString(36), time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 15));
  };

  const triggerNotification = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 4000);
  };

  const addItem = () => setLineItems([...lineItems, { id: Date.now(), desc: "", qty: 1, price: 0, vat: 20 }]);
  const removeItem = (id: number) => setLineItems(lineItems.filter(i => i.id !== id));
  
  const addExpense = () => setExpenses([...expenses, { id: Date.now(), desc: "", amount: 0 }]);
  const removeExpense = (id: number) => setExpenses(expenses.filter(e => e.id !== id));

  const handleDocumentDispatch = (isDraft: boolean) => {
    if (!formData.client || grandTotal === 0) { 
        triggerNotification("Data Integrity Failure", "error");
        return; 
    }
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
    triggerNotification(isDraft ? "Draft Committed" : "Directive Dispatched");
    setActiveModal(null);
    setFormData({ client: "", email: "", notes: "", reference: `TX-${Math.floor(Math.random() * 10000)}`, dueDate: "", terms: "Net 14 Days" });
    setLineItems([{ id: Date.now(), desc: "", qty: 1, price: 0, vat: 20 }]);
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
      const matchesSearch = item.client.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [ledger, searchQuery, filterStatus]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-10 overflow-x-hidden">
      
      {/* NOTIFICATION HUD */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[900] bg-stone-900 text-white px-10 py-4 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
          >
            {notification.type === "success" ? <CheckCircle2 size={14} className="text-[#a9b897]" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1550px] mx-auto px-6 py-10 space-y-16">
        
        {/* CONDENSED HEADER SECTION */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 border-b border-stone-100 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-stone-900 text-[#a9b897] rounded-2xl shadow-xl"><Fingerprint size={22} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-400">Node Status: Active</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />
                  <p className="text-[7px] font-mono text-stone-400 tracking-widest uppercase">UPTIME: {Math.floor(systemUptime/60)}M {systemUptime%60}S</p>
                </div>
              </div>
            </div>
            <h1 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-none">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <nav className="flex items-center bg-stone-100 p-1.5 rounded-full">
              {['Payments', 'HR', 'Analytics'].map((path) => (
                <button 
                  key={path} 
                  onClick={() => path !== 'Payments' && router.push(`/${path.toLowerCase() === 'analytics' ? 'analytics' : path.toLowerCase()}`)} 
                  className={`px-7 py-3.5 text-[8px] font-black uppercase tracking-widest transition-all rounded-full ${path === 'Payments' ? "bg-white text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-900"}`}
                >
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('invoice')} className="bg-stone-900 text-white px-7 py-4 rounded-full flex items-center gap-4 hover:bg-stone-800 transition-all shadow-xl group">
              <Plus size={16} className="text-[#a9b897] group-hover:rotate-90 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Deploy Directive</span>
            </button>
          </div>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="z-10 space-y-4">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500">Gross Intake YTD</p>
              <h2 className="text-6xl font-mono tracking-tighter text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 backdrop-blur-md">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Ledger Signal Sync</span>
              <Activity size={12} className="text-[#a9b897] animate-pulse" />
            </div>
            <Cpu size={180} className="absolute -right-8 -top-8 opacity-[0.03] text-white" />
          </div>

          {[
            { label: 'Operational Margin', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Flow: Optimized', icon: <Database size={18}/> },
            { label: 'VAT Escrow Pool', value: metrics.vatPool, sub: '20% Protected', icon: <Landmark size={18}/> },
            { label: 'Fiscal Tax Due', value: metrics.taxDue, sub: 'Statutory Prov', icon: <Receipt size={18}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] shadow-sm hover:border-stone-900 transition-all duration-500 group">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors p-3.5 bg-stone-50 rounded-xl">{item.icon}</div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter text-stone-900">£{item.value.toLocaleString()}</h2>
              <div className="pt-4 border-t border-stone-50 text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">{item.sub}</div>
            </div>
          ))}
        </section>

        {/* SYSTEM TERMINAL & INTELLIGENCE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <button className="p-10 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group">
              <div className="flex justify-between w-full">
                <div className="p-5 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all"><Wallet size={32} /></div>
                <div className="flex gap-2">
                   <div className="p-3 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all"><ArrowUpRight size={14}/></div>
                </div>
              </div>
              <div className="mt-8 text-left">
                <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em] italic mb-1">Reserve Audit</p>
                <h5 className="text-4xl font-serif italic tracking-tighter">Liquid Assets</h5>
              </div>
            </button>
            <button onClick={() => setActiveModal('invoice')} className="p-10 bg-stone-900 text-white rounded-[2.5rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-xl group relative overflow-hidden text-left">
                <div className="p-5 bg-white/10 rounded-2xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all"><Send size={32} /></div>
                <div className="mt-8 relative z-10">
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.4em] italic mb-1">Network Outbound</p>
                    <h5 className="text-4xl font-serif italic tracking-tighter">Dispatch Directive</h5>
                </div>
                <Mail size={150} className="absolute -right-8 -bottom-8 opacity-5" />
            </button>
          </div>

          <div className="lg:col-span-4 bg-[#0d0d0d] rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[350px] border border-white/5">
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between opacity-30">
                <div className="flex items-center gap-3">
                  <Terminal size={14} className="text-[#a9b897]" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Pulse Feed</span>
                </div>
                <Globe size={12} />
              </div>
              <div ref={scrollRef} className="font-mono text-[9px] space-y-4 h-40 overflow-y-auto scrollbar-hide text-left">
                {commandHistory.map(cmd => (
                  <div key={cmd.id} className="border-l border-white/10 pl-3 group">
                    <span className="text-[#a9b897]/50 block text-[7px] mb-0.5 font-bold">[{cmd.time}]</span> 
                    <p className="text-white/60 tracking-tight leading-relaxed group-hover:text-white transition-colors">{cmd.msg}</p>
                  </div>
                ))}
                <div className="flex items-center gap-3 opacity-20 italic">
                  <span className="w-1 h-1 rounded-full bg-[#a9b897] animate-pulse" />
                  <span className="uppercase text-[7px] tracking-widest">Listening...</span>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] text-stone-600 italic">
              <span>Node Authenticated</span>
              <div className="flex items-center gap-2 text-green-500/40"><div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />SYNCED</div>
            </div>
          </div>
        </div>

        {/* LEDGER ARCHIVE SECTION */}
        <section className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-stone-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
                <h3 className="text-4xl font-serif italic tracking-tighter">Network Ledger</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-300 mt-1">Operational History Stream</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9b897]" size={14} />
                  <input 
                      placeholder="Search Ledger..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-full text-xs font-bold outline-none focus:bg-white focus:border-stone-900 transition-all placeholder:text-stone-300" 
                  />
              </div>
              <button className="p-3.5 bg-stone-50 rounded-full text-stone-400 hover:bg-stone-900 hover:text-white transition-all"><Filter size={16}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-stone-50/50">
                <tr>
                  {['Reference', 'Entity Node', 'Directive', 'Operational Status', 'Net Total'].map((h) => (
                    <th key={h} className="px-10 py-5 text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredLedger.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 transition-all cursor-pointer group">
                    <td className="px-10 py-7 font-mono text-[10px] text-[#a9b897] font-bold">{inv.id}</td>
                    <td className="px-10 py-7">
                      <p className="font-bold text-lg tracking-tight">{inv.client}</p>
                      <p className="text-[7px] font-mono text-stone-300 uppercase mt-0.5 tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-10 py-7 text-[9px] font-black uppercase text-stone-400 tracking-widest italic">{inv.type}</td>
                    <td className="px-10 py-7">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                          inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                          inv.status === 'overdue' ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 
                          'bg-stone-50 text-stone-300 border-stone-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.3)]' : inv.status === 'overdue' ? 'bg-red-500' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-right pr-16 relative">
                        <p className="font-mono font-bold text-xl tracking-tighter">£{inv.amount.toLocaleString()}</p>
                        <p className="text-[7px] font-black text-stone-300 uppercase tracking-[0.2em]">Aggregate</p>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronDown size={14} className="text-stone-300" />
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
        {activeModal === 'invoice' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[1000] flex justify-center items-center p-4" 
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ y: 30, opacity: 0, scale: 0.98 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-10 pb-6 flex justify-between items-center border-b border-stone-50">
                    <div className="space-y-1 text-left">
                        <div className="flex items-center gap-3">
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Sales Directive v6.2</p>
                            <span className="px-2.5 py-1 bg-stone-50 rounded-full text-[7px] font-black text-stone-300 uppercase tracking-widest">{formData.reference}</span>
                        </div>
                        <h3 className="text-5xl font-serif italic tracking-tighter">Deploy Directive</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide text-left">
                    {/* Identification Layer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[8px] font-black uppercase text-stone-400 tracking-[0.4em] ml-4">Target Node</label>
                            <input value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="Entity Name..." className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:border-stone-900 transition-all font-bold text-lg" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[8px] font-black uppercase text-stone-400 tracking-[0.4em] ml-4">Signal Path</label>
                            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@entity.pulse" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none focus:border-stone-900 transition-all font-bold text-lg" />
                        </div>
                    </div>

                    {/* Operational Workspace */}
                    <div className="space-y-6">
                        <div className="flex gap-10 border-b border-stone-100 pb-2">
                            {[
                                { id: 'items', label: 'Service Units', icon: <Package size={12}/> },
                                { id: 'expenses', label: 'Flow Costs', icon: <Zap size={12}/> }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] transition-all relative pb-3 ${activeTab === tab.id ? 'text-stone-900' : 'text-stone-300'}`}
                                >
                                    {tab.icon} {tab.label}
                                    {activeTab === tab.id && <motion.div layoutId="modalTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#a9b897]" />}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            {activeTab === 'items' ? (
                                <>
                                    {lineItems.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-stone-50/50 p-3 rounded-2xl group hover:bg-stone-50 transition-all">
                                            <div className="col-span-6">
                                                <input value={item.desc} onChange={(e) => {
                                                    const newList = [...lineItems];
                                                    newList[idx].desc = e.target.value;
                                                    setLineItems(newList);
                                                }} placeholder="Service description..." className="w-full bg-transparent p-3 outline-none font-bold" />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" value={item.qty} onChange={(e) => {
                                                    const newList = [...lineItems];
                                                    newList[idx].qty = Number(e.target.value);
                                                    setLineItems(newList);
                                                }} className="w-full bg-transparent p-3 outline-none font-mono font-bold text-center" />
                                            </div>
                                            <div className="col-span-3">
                                                <div className="flex items-center gap-2 px-3">
                                                    <span className="text-stone-300 font-mono">£</span>
                                                    <input type="number" value={item.price} onChange={(e) => {
                                                        const newList = [...lineItems];
                                                        newList[idx].price = Number(e.target.value);
                                                        setLineItems(newList);
                                                    }} className="w-full bg-transparent p-3 outline-none font-mono font-bold" />
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => removeItem(item.id)} className="p-2 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[8px] font-black uppercase tracking-[0.4em] text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-2">
                                        <Plus size={14}/> Append Unit
                                    </button>
                                </>
                            ) : (
                                <>
                                    {expenses.map((exp, idx) => (
                                        <div key={exp.id} className="grid grid-cols-12 gap-3 items-center bg-stone-50/50 p-3 rounded-2xl hover:bg-stone-50 transition-all">
                                            <div className="col-span-8">
                                                <input value={exp.desc} onChange={(e) => {
                                                    const newList = [...expenses];
                                                    newList[idx].desc = e.target.value;
                                                    setExpenses(newList);
                                                }} placeholder="Operational cost identifier..." className="w-full bg-transparent p-3 outline-none font-bold" />
                                            </div>
                                            <div className="col-span-3 px-3 flex items-center gap-2">
                                                <span className="text-stone-300 font-mono">£</span>
                                                <input type="number" value={exp.amount} onChange={(e) => {
                                                    const newList = [...expenses];
                                                    newList[idx].amount = Number(e.target.value);
                                                    setExpenses(newList);
                                                }} className="w-full bg-transparent p-3 outline-none font-mono font-bold" />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => removeExpense(exp.id)} className="p-2 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addExpense} className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[8px] font-black uppercase tracking-[0.4em] text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-2">
                                        <Plus size={14}/> Append Flow
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Aggregate Layer */}
                <div className="p-10 pt-6 bg-stone-50/80 backdrop-blur-md border-t border-stone-100 rounded-b-[3rem]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex gap-8 items-center">
                            <div className="space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-stone-400">Net Units</p>
                                <p className="font-mono text-lg font-bold">£{subtotal.toLocaleString()}</p>
                            </div>
                            <div className="h-6 w-px bg-stone-200" />
                            <div className="space-y-1">
                                <p className="text-[7px] font-black uppercase tracking-widest text-stone-400">Tax Provision</p>
                                <p className="font-mono text-lg font-bold">£{totalVat.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Grand Aggregate</p>
                                <p className="text-5xl font-mono font-bold tracking-tighter">£{grandTotal.toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDocumentDispatch(false)} className="px-9 py-4 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl flex items-center gap-3 group">
                                Dispatch <Send size={14} className="text-[#a9b897] group-hover:translate-x-1 transition-transform" />
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}