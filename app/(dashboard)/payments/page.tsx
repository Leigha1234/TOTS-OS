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
  CheckCircle2, ChevronDown, Download, Share2
} from "lucide-react";

/**
 * TOTS OS v6.2 - FISCAL PULSE NODE
 * TOTAL LINE COUNT: ~430 (Including Logic, State, and Infrastructure)
 * MISSION: ARCHITECTURAL FINANCIAL DISPATCH & NETWORK LEDGERING
 */

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUptime, setSystemUptime] = useState(0);
  const [pulseSync, setPulseSync] = useState(true);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  const [commandHistory, setCommandHistory] = useState<{id: string, time: string, msg: string}[]>([]);
  
  // --- FORM & DISPATCH STATE ---
  const [docType, setDocType] = useState<"Invoice" | "Quote">("Invoice");
  const [activeTab, setActiveTab] = useState<"items" | "expenses">("items");
  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    notes: "", 
    reference: `TX-${Math.floor(Math.random() * 10000)}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "System Architecture Design", qty: 1, price: 2500, vat: 20 }
  ]);
  
  const [expenses, setExpenses] = useState([
    { id: Date.now() + 1, desc: "Cloud Provisioning (AWS)", amount: 120 }
  ]);

  // --- FINANCIAL METRICS ---
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18400, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
    { id: "INV-922", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10" },
    { id: "QT-415", client: "Weyland-Yutani", amount: 35000, status: "draft", type: "Quote", date: "2026-05-12" },
  ]);

  // --- LIFECYCLE & SYNC ---
  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
    const timer = setInterval(() => setSystemUptime(p => p + 1), 1000);
    logAction("Fiscal nodes synchronised with main cluster.");
    logAction("Awaiting inbound signal directives...");
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // --- CALCULATIONS ENGINE ---
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
    } catch (err) { 
      logAction("Signal disruption: Ledger fetch failed."); 
    } finally { 
      setIsLoading(false); 
    }
  }

  // --- LOGIC HANDLERS ---
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
        triggerNotification("Data Integrity Failure: Client Required", "error");
        logAction("ERROR: Attempted dispatch with null identifier.");
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
    logAction(`${docType} directive ${newDoc.id} established for ${formData.client}.`);
    triggerNotification(isDraft ? "Committed to Drafts" : `Dispatched to ${formData.client}`);
    setActiveModal(null);
    // Reset form
    setFormData({ client: "", email: "", notes: "", reference: `TX-${Math.floor(Math.random() * 10000)}`, dueDate: "" });
    setLineItems([{ id: Date.now(), desc: "", qty: 1, price: 0, vat: 20 }]);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-20 overflow-x-hidden">
      
      {/* --- NOTIFICATION HUD --- */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[900] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
          >
            {notification.type === "success" ? <CheckCircle2 size={16} className="text-[#a9b897]" /> : <AlertCircle size={16} className="text-red-500" />}
            <p className="text-[9px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-16 space-y-20">
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 text-[#a9b897] rounded-2xl shadow-xl shadow-[#a9b897]/10"><Fingerprint size={24} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[9px] tracking-[0.4em] text-stone-400">System Node: Payments_v6.2</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${pulseSync ? 'bg-[#a9b897] animate-pulse' : 'bg-red-500'}`} />
                  <p className="text-[8px] font-mono text-stone-400 tracking-widest uppercase">
                    UPTIME: {Math.floor(systemUptime/3600)}H {Math.floor((systemUptime%3600)/60)}M {systemUptime%60}S
                  </p>
                </div>
              </div>
            </div>
            <h1 className="text-7xl md:text-9xl font-serif italic tracking-tighter leading-none">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <nav className="flex items-center bg-stone-100 p-1.5 rounded-full">
              {['Dashboard', 'Payments', 'HR', 'Network'].map((path) => (
                <button 
                  key={path} 
                  onClick={() => path !== 'Payments' && router.push(`/${path.toLowerCase()}`)} 
                  className={`px-8 py-4 text-[9px] font-black uppercase tracking-widest transition-all rounded-full ${path === 'Payments' ? "bg-white text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-900"}`}
                >
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('invoice')} className="bg-stone-900 text-white px-8 py-5 rounded-full flex items-center gap-4 hover:bg-stone-800 transition-all shadow-xl group">
              <Plus size={18} className="text-[#a9b897] group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Directive</span>
            </button>
          </div>
        </header>

        {/* --- FISCAL METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between min-h-[350px] relative overflow-hidden group border border-white/5">
            <div className="z-10 space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Gross Intake YTD</p>
              <h2 className="text-7xl font-mono tracking-tighter text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-white/5 p-5 rounded-2xl flex items-center justify-between border border-white/5 backdrop-blur-md">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-500">Live Ledger Stream</span>
              <Activity size={14} className="text-[#a9b897] animate-pulse" />
            </div>
            <Cpu size={200} className="absolute -right-10 -top-10 opacity-[0.03] text-white" />
          </div>

          {[
            { label: 'Operational Profit', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Flow: Optimized', icon: <Database size={20}/> },
            { label: 'VAT Escrow Pool', value: metrics.vatPool, sub: '20% Protected', icon: <Landmark size={20}/> },
            { label: 'Fiscal Tax Due', value: metrics.taxDue, sub: 'Statutory Provision', icon: <Receipt size={20}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-[3.5rem] p-10 flex flex-col justify-between min-h-[350px] shadow-sm hover:border-stone-900 transition-all duration-500 group text-left relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors p-4 bg-stone-50 rounded-xl">{item.icon}</div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter text-stone-900 z-10">£{item.value.toLocaleString()}</h2>
              <div className="pt-6 border-t border-stone-50 text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic z-10">{item.sub}</div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-stone-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150" />
            </div>
          ))}
        </section>

        {/* --- SYSTEM INTELLIGENCE & TERMINAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <button className="p-12 bg-white border border-stone-100 rounded-[3.5rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group">
              <div className="flex justify-between w-full">
                <div className="p-6 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all"><Wallet size={36} /></div>
                <div className="flex gap-2">
                  <div className="p-3 border border-stone-100 rounded-full text-stone-300 hover:text-stone-900 hover:border-stone-900 transition-all"><Download size={16}/></div>
                  <div className="p-3 border border-stone-100 rounded-full text-stone-300 hover:text-stone-900 hover:border-stone-900 transition-all"><ArrowUpRight size={16}/></div>
                </div>
              </div>
              <div className="mt-12 text-left">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] italic mb-2">Reserve Auditing</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Liquid Assets</h5>
                <p className="mt-4 text-[11px] text-stone-300 max-w-[200px] leading-relaxed">Securely connected to primary treasury nodes.</p>
              </div>
            </button>
            <button onClick={() => setActiveModal('invoice')} className="p-12 bg-stone-900 text-white rounded-[3.5rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-xl group relative overflow-hidden">
                <div className="p-6 bg-white/10 rounded-2xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all"><Send size={36} /></div>
                <div className="mt-12 text-left relative z-10">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em] italic mb-2">Network Disbursement</p>
                    <h5 className="text-5xl font-serif italic tracking-tighter">Dispatch Directive</h5>
                    <div className="mt-6 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[#a9b897] animate-ping" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Uplink Ready</span>
                    </div>
                </div>
                <Mail size={180} className="absolute -right-10 -bottom-10 opacity-5" />
            </button>
          </div>

          <div className="lg:col-span-4 bg-[#0d0d0d] rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[400px] border border-white/5">
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between opacity-40">
                <div className="flex items-center gap-4">
                  <Terminal size={16} className="text-[#a9b897]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em]">Fiscal Pulse Feed</span>
                </div>
                <Globe size={14} />
              </div>
              <div ref={scrollRef} className="font-mono text-[10px] space-y-5 h-48 overflow-y-auto scrollbar-hide text-left pr-4">
                {commandHistory.map(cmd => (
                  <div key={cmd.id} className="border-l border-white/10 pl-4 group hover:border-[#a9b897] transition-all">
                    <span className="text-[#a9b897]/50 block text-[8px] mb-1 font-bold">[{cmd.time}]</span> 
                    <p className="text-white/60 tracking-tight leading-relaxed group-hover:text-white transition-all">{cmd.msg}</p>
                  </div>
                ))}
                <div className="flex items-center gap-4 opacity-20 italic pt-2">
                  <span className="w-1 h-1 rounded-full bg-[#a9b897] animate-pulse" />
                  <span className="tracking-[0.2em] uppercase text-[8px]">Listening for network events...</span>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-stone-600 italic">
              <span>Node Identity Secured</span>
              <div className="flex items-center gap-3 text-[#a9b897]/50">
                <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />
                SYNCED
              </div>
            </div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* --- TRANSACTION ARCHIVE --- */}
        <section className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-sm">
          <div className="p-12 border-b border-stone-50 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-left">
                <h3 className="text-5xl font-serif italic tracking-tighter">Network Ledger</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 mt-2">Audited Transaction History Stream</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-[400px]">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#a9b897]" size={18} />
                  <input 
                      placeholder="Identify Node or Ref..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-16 pr-6 py-4 bg-stone-50 border border-stone-100 rounded-full text-sm font-bold outline-none focus:bg-white focus:border-stone-900 transition-all" 
                  />
              </div>
              <button className="p-4 bg-stone-50 rounded-full text-stone-400 hover:bg-stone-900 hover:text-white transition-all"><Filter size={18}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-stone-50/50">
                <tr>
                  {['Reference ID', 'Entity Node', 'Directive', 'Operational Status', 'Net Total'].map((h) => (
                    <th key={h} className="px-12 py-6 text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ledger.filter(l => l.client.toLowerCase().includes(searchQuery.toLowerCase()) || l.id.toLowerCase().includes(searchQuery.toLowerCase())).map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/50 transition-all cursor-pointer group">
                    <td className="px-12 py-10 font-mono text-[11px] text-[#a9b897] font-bold">{inv.id}</td>
                    <td className="px-12 py-10">
                      <p className="font-bold text-xl tracking-tight">{inv.client}</p>
                      <p className="text-[8px] font-mono text-stone-300 uppercase mt-1 tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-12 py-10">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-400 tracking-widest">
                            {inv.type === 'Invoice' ? <Receipt size={12} className="text-[#a9b897]"/> : <Package size={12} className="text-blue-400"/>}
                            {inv.type}
                        </div>
                    </td>
                    <td className="px-12 py-10">
                      <span className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                          inv.status === 'overdue' ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 
                          'bg-stone-50 text-stone-400 border-stone-100'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.4)]' : inv.status === 'overdue' ? 'bg-red-500' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-12 py-10 text-right pr-20 relative">
                        <p className="font-mono font-bold text-2xl tracking-tighter">£{inv.amount.toLocaleString()}</p>
                        <p className="text-[8px] font-black text-stone-300 uppercase tracking-[0.3em]">Aggregate GBP</p>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronDown size={16} className="text-stone-300" />
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-stone-50/30 flex justify-center border-t border-stone-50">
             <button className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 hover:text-stone-900 transition-all">Initialize Full Audit History</button>
          </div>
        </section>

      </div>

      {/* --- MODAL: SALES DIRECTIVE (DIRECTIVE DEPLOYMENT) --- */}
      <AnimatePresence>
        {activeModal === 'invoice' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[1000] flex justify-center items-center p-6 md:p-12" 
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ y: 50, scale: 0.98, opacity: 0 }} 
              animate={{ y: 0, scale: 1, opacity: 1 }} 
              className="bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="p-12 pb-6 flex justify-between items-start border-b border-stone-50">
                    <div className="space-y-2 text-left">
                        <div className="flex items-center gap-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Node v6.2.8 // Directive Initialization</p>
                            <span className="px-3 py-1 bg-stone-100 rounded-full text-[8px] font-black text-stone-400 uppercase tracking-widest">{formData.reference}</span>
                        </div>
                        <h3 className="text-6xl font-serif italic tracking-tighter">Deploy Sales Directive</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-4 bg-stone-50 rounded-full text-stone-400 hover:bg-stone-100 transition-all"><Share2 size={18}/></button>
                        <button onClick={() => setActiveModal(null)} className="p-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all"><X size={20}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                    {/* Entity Identification Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em] ml-6">Target Entity</label>
                            <input value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="Identifying Node..." className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 transition-all font-bold text-xl" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em] ml-6">Signal Path (Email)</label>
                            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="address@network.com" className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 transition-all font-bold text-xl" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em] ml-6">Maturity Date</label>
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 transition-all font-bold text-xl" />
                        </div>
                    </div>

                    {/* Operational Tabs */}
                    <div className="space-y-8">
                        <div className="flex gap-12 border-b border-stone-100 pb-4">
                            {[
                                { id: 'items', label: 'Service Units', icon: <Package size={14}/> },
                                { id: 'expenses', label: 'Operational Costs', icon: <TrendingUp size={14}/> }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative pb-4 ${activeTab === tab.id ? 'text-stone-900' : 'text-stone-300'}`}
                                >
                                    {tab.icon} {tab.label}
                                    {activeTab === tab.id && <motion.div layoutId="modalTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#a9b897]" />}
                                </button>
                            ))}
                        </div>

                        {/* Line Items Editor */}
                        <div className="space-y-4">
                            {activeTab === 'items' ? (
                                <>
                                    {lineItems.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-stone-50/50 p-4 rounded-[2rem] hover:bg-stone-50 transition-all group">
                                            <div className="col-span-6">
                                                <input value={item.desc} onChange={(e) => {
                                                    const newList = [...lineItems];
                                                    newList[idx].desc = e.target.value;
                                                    setLineItems(newList);
                                                }} placeholder="Description of service node..." className="w-full bg-transparent p-4 outline-none font-bold text-lg" />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" value={item.qty} onChange={(e) => {
                                                    const newList = [...lineItems];
                                                    newList[idx].qty = Number(e.target.value);
                                                    setLineItems(newList);
                                                }} className="w-full bg-transparent p-4 outline-none font-mono font-bold text-center" />
                                            </div>
                                            <div className="col-span-3">
                                                <div className="flex items-center gap-2 px-4">
                                                    <span className="text-stone-400 font-mono">£</span>
                                                    <input type="number" value={item.price} onChange={(e) => {
                                                        const newList = [...lineItems];
                                                        newList[idx].price = Number(e.target.value);
                                                        setLineItems(newList);
                                                    }} className="w-full bg-transparent p-4 outline-none font-mono font-bold" />
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => removeItem(item.id)} className="p-3 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addItem} className="w-full py-6 border-2 border-dashed border-stone-100 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-3">
                                        <Plus size={16}/> Append Service Node
                                    </button>
                                </>
                            ) : (
                                <>
                                    {expenses.map((exp, idx) => (
                                        <div key={exp.id} className="grid grid-cols-12 gap-4 items-center bg-stone-50/50 p-4 rounded-[2rem] hover:bg-stone-50 transition-all">
                                            <div className="col-span-8">
                                                <input value={exp.desc} onChange={(e) => {
                                                    const newList = [...expenses];
                                                    newList[idx].desc = e.target.value;
                                                    setExpenses(newList);
                                                }} placeholder="Expense description..." className="w-full bg-transparent p-4 outline-none font-bold text-lg" />
                                            </div>
                                            <div className="col-span-3 px-4 flex items-center gap-2">
                                                <span className="text-stone-400 font-mono">£</span>
                                                <input type="number" value={exp.amount} onChange={(e) => {
                                                    const newList = [...expenses];
                                                    newList[idx].amount = Number(e.target.value);
                                                    setExpenses(newList);
                                                }} className="w-full bg-transparent p-4 outline-none font-mono font-bold" />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button onClick={() => removeExpense(exp.id)} className="p-3 text-stone-200 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={addExpense} className="w-full py-6 border-2 border-dashed border-stone-100 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all flex items-center justify-center gap-3">
                                        <Plus size={16}/> Append Expense Flow
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer / Aggregate Calculation */}
                <div className="p-12 pt-6 bg-stone-50/80 backdrop-blur-md border-t border-stone-100 rounded-b-[3.5rem]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="flex gap-8">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Subtotal</p>
                                <p className="font-mono text-xl font-bold">£{subtotal.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 border-l border-stone-200 pl-8">
                                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Tax Pool (20%)</p>
                                <p className="font-mono text-xl font-bold">£{totalVat.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1 border-l border-stone-200 pl-8">
                                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Costs</p>
                                <p className="font-mono text-xl font-bold">£{expenseTotal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-10">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Final Aggregate</p>
                                <p className="text-6xl font-mono font-bold tracking-tighter">£{grandTotal.toLocaleString()}</p>
                            </div>
                            <div className="h-20 w-px bg-stone-200" />
                            <div className="flex flex-col gap-3">
                                <button onClick={() => handleDocumentDispatch(false)} className="px-10 py-5 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 flex items-center gap-4 group whitespace-nowrap">
                                    Execute Directive <Send size={16} className="text-[#a9b897] group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button onClick={() => handleDocumentDispatch(true)} className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 hover:text-stone-900 transition-all">Store as Draft</button>
                            </div>
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
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}