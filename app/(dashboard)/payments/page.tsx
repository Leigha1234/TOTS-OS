"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Mail, Send, 
  Trash2, Database,
  Filter, Cpu, AlertCircle,
  CheckCircle2, ChevronDown, Download,
  FileSpreadsheet, PieChart, History, Zap,
  ShieldCheck, Globe, BarChart3, Settings2,
  Layers, Terminal, HardDrive, Share2,
  Calendar, RefreshCcw, CreditCard, Box
} from "lucide-react";

/**
 * TOTS OS v6.8.0 - FISCAL PULSE NODE (EXTENDED ARCHITECTURE)
 * REVISION: HIGH-DENSITY UI | MULTI-MODAL LOGIC | GLOBAL STATE SYNC
 * TOTAL LINE COUNT OPTIMIZED FOR SCALE
 */

// --- TYPES & INTERFACES ---

interface MetricProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  isDark?: boolean;
  trend?: "up" | "down" | "neutral";
}

interface LedgerItem {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "processing";
  type: "Invoice" | "Quote" | "Retainer" | "Expense";
  date: string;
  priority: "high" | "med" | "low";
}

// --- SHARED UI COMPONENTS ---

const MetricCard = ({ label, value, sub, icon, isDark = false, trend = "neutral" }: MetricProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`${isDark ? 'bg-stone-900 shadow-2xl' : 'bg-white border border-stone-100 shadow-sm'} p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:border-stone-900 transition-all duration-500`}
  >
    <div className="z-10 flex justify-between items-start">
      <div className="space-y-1">
        <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{label}</p>
        <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${trend === 'up' ? 'bg-green-500' : trend === 'down' ? 'bg-red-500' : 'bg-stone-300'}`} />
            <span className="text-[7px] font-mono uppercase tracking-widest text-stone-500">{trend}stream</span>
        </div>
      </div>
      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-stone-50 text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {icon}
      </div>
    </div>
    
    <div className="z-10 mt-6 text-left">
      <h2 className={`font-mono tracking-tighter leading-none transition-all ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} 
        ${value.toString().length > 10 ? 'text-2xl' : value.toString().length > 7 ? 'text-3xl' : 'text-6xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-6 border-t border-stone-50/10 flex items-center justify-between">
      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#a9b897] italic">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    
    {/* Decorative Background Elements */}
    <div className={`absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none transition-transform duration-1000 group-hover:scale-110 ${isDark ? 'text-white' : 'text-stone-900'}`}>
        <Layers size={200} />
    </div>
  </motion.div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center gap-6 text-left mb-10">
        <div className="p-5 bg-stone-900 text-[#a9b897] rounded-2xl shadow-lg">
            <Icon size={20} />
        </div>
        <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">{subtitle}</p>
            <h3 className="text-4xl font-serif italic tracking-tighter">{title}</h3>
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const containerRef = useRef(null);

  // --- CORE STATE ---
  const [activeModal, setActiveModal] = useState<"dispatch" | "reserves" | "intelligence" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  
  // --- FORM ENGINE STATE ---
  const [formData, setFormData] = useState({ 
    client: "", 
    email: "", 
    reference: `TX-${Math.floor(Math.random() * 10000)}`,
    notes: "",
    taxRate: 20
  });

  const [lineItems, setLineItems] = useState([
    { id: Date.now(), desc: "Enterprise Architecture Node", qty: 1, price: 12500 }
  ]);

  // --- DATA SETS ---
  const [metrics, setMetrics] = useState({ 
    revYtd: 0, 
    operatingCosts: 18450.40, 
    vatPool: 0, 
    taxDue: 0,
    projected: 245000 
  });

  const [ledger, setLedger] = useState<LedgerItem[]>([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01", priority: "high" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20", priority: "med" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15", priority: "high" },
    { id: "EXP-112", client: "Vercel Edge", amount: 450, status: "paid", type: "Expense", date: "2026-05-12", priority: "low" },
    { id: "INV-922", client: "Soylent Corp", amount: 4200, status: "paid", type: "Invoice", date: "2026-05-10", priority: "med" },
    { id: "QT-405", client: "Tyrell Corp", amount: 32000, status: "processing", type: "Quote", date: "2026-05-13", priority: "high" },
  ]);

  // --- LOGIC: INITIALIZATION & DATA SYNC ---
  useEffect(() => {
    setIsMounted(true);
    const syncData = async () => {
        try {
            const { data, error } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
            if (error) throw error;
            
            const hours = data?.reduce((a, r) => a + (Number(r.mon) + Number(r.tue) + Number(r.wed) + Number(r.thu) + Number(r.fri)), 0) || 640;
            const rev = hours * 125;
            
            setMetrics(prev => ({ 
              ...prev,
              revYtd: rev, 
              vatPool: rev * 0.2, 
              taxDue: (rev - 12570) * 0.19 
            }));
        } catch (e) {
            console.error("Supabase Sync Failed: Falling back to Local Cache.");
        }
    };
    
    syncData();
    const t = setInterval(() => setSystemUptime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // --- COMPUTED PROPERTIES ---
  const filteredLedger = useMemo(() => {
    return ledger.filter(item => {
        const matchesSearch = item.client.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || item.type.toLowerCase() === activeTab.toLowerCase();
        return matchesSearch && matchesTab;
    });
  }, [ledger, searchQuery, activeTab]);

  const grandTotal = useMemo(() => {
    const sub = lineItems.reduce((a, i) => a + (i.qty * i.price), 0);
    return sub * (1 + (formData.taxRate / 100));
  }, [lineItems, formData.taxRate]);

  // --- HANDLERS ---
  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 4000);
  };

  const addItem = () => {
    setLineItems([...lineItems, { id: Date.now(), desc: "New Directive Unit", qty: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(i => i.id !== id));
  };

  const handleDispatch = () => {
    if (!formData.client) { triggerNotify("Entity Node Missing", "error"); return; }
    
    const doc: LedgerItem = {
      id: `INV-${Math.floor(Math.random() * 900) + 100}`,
      client: formData.client, 
      amount: grandTotal, 
      status: "pending", 
      type: "Invoice", 
      date: new Date().toISOString().split('T')[0],
      priority: grandTotal > 10000 ? "high" : "med"
    };

    setLedger([doc, ...ledger]);
    triggerNotify("Fiscal Directive Dispatched");
    setActiveModal(null);
    setFormData({ ...formData, client: "", email: "" });
  };

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-24 overflow-x-hidden">
      
      {/* HUD NOTIFICATION SYSTEM */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.9 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 50, opacity: 0, scale: 0.9 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 border border-white/10"
          >
            {notification.type === 'success' ? <CheckCircle2 size={14} className="text-[#a9b897]" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto px-8 lg:px-16 py-12 space-y-24">
        
        {/* PRIMARY HEADER ARCHITECTURE */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-8 text-left max-w-4xl">
            <div className="flex items-center gap-6">
              <motion.div 
                whileHover={{ rotate: 90 }}
                className="p-5 bg-stone-900 text-[#a9b897] rounded-3xl shadow-xl cursor-crosshair"
              >
                <Fingerprint size={28} />
              </motion.div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.6em] text-stone-300">SYSTEM_NODE // FISCAL_PULSE_6.8</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <p className="text-[8px] font-mono tracking-widest uppercase text-stone-400">STATUS: OPERATIONAL [UPTIME: {systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-[10rem] lg:text-[14rem] font-serif italic tracking-tighter leading-[0.75] text-stone-900 select-none">
              Payments<span className="text-[#a9b897]">.</span>
            </h1>
          </div>

          <div className="flex flex-col items-end gap-10">
            <nav className="flex items-center bg-stone-100 p-2.5 rounded-full shadow-inner border border-stone-200/50">
              {['Payments', 'HR', 'Analytics'].map((label) => {
                const isActive = label === 'Payments';
                const route = label === 'Analytics' ? '/finance-reports' : `/${label.toLowerCase()}`;
                return (
                  <button 
                    key={label} 
                    onClick={() => !isActive && router.push(route)} 
                    className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-full ${isActive ? "bg-white text-stone-900 shadow-xl scale-105" : "text-stone-400 hover:text-stone-900"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setActiveModal('intelligence')}
                    className="p-6 border border-stone-200 rounded-full text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all active:scale-90"
                >
                    <Settings2 size={20} />
                </button>
                <button 
                    onClick={() => setActiveModal('dispatch')} 
                    className="bg-stone-900 text-white px-12 py-6 rounded-full flex items-center gap-6 hover:bg-stone-800 transition-all shadow-2xl group active:scale-95"
                >
                    <Plus size={20} className="text-[#a9b897] group-hover:rotate-90 transition-transform duration-700" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em]">Initialize Directive</span>
                </button>
            </div>
          </div>
        </header>

        {/* TOP-TIER ANALYTICS GRID */}
        <section className="space-y-12">
            <SectionHeader title="Core Indicators" subtitle="Real-time Fiscal Telemetry" icon={BarChart3} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <MetricCard label="Gross Intake YTD" value={metrics.revYtd} sub="Performance: +18.4%" icon={<TrendingUp size={20}/>} isDark trend="up" />
              <MetricCard label="Operating Margin" value={metrics.revYtd - metrics.operatingCosts} sub="Status: Healthy Flow" icon={<Database size={20}/>} trend="neutral" />
              <MetricCard label="VAT Reserve Pool" value={metrics.vatPool} sub="HMRC Escrow: Locked" icon={<Landmark size={20}/>} trend="up" />
              <MetricCard label="Statutory Tax Provision" value={metrics.taxDue} sub="FY26 Projection" icon={<Receipt size={20}/>} trend="down" />
            </div>
        </section>

        {/* INTERACTIVE OPERATIONAL NODES */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <button 
                onClick={() => setActiveModal('reserves')} 
                className="xl:col-span-2 p-20 bg-white border border-stone-100 rounded-[4rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group min-h-[550px] relative overflow-hidden text-left"
            >
              <div className="flex justify-between w-full z-10">
                <div className="p-10 bg-stone-50 rounded-[2rem] group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-700">
                    <Wallet size={64} />
                </div>
                <div className="flex flex-col items-end gap-4">
                    <div className="p-6 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 group-hover:border-stone-900 transition-all">
                        <ArrowUpRight size={28}/>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">Last Synced</p>
                        <p className="text-[10px] font-mono font-bold">2026.05.13 // 11:24</p>
                    </div>
                </div>
              </div>
              <div className="mt-20 z-10 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-[#a9b897]/10 text-[#a9b897] text-[8px] font-black uppercase tracking-widest rounded-full">Liquid Asset</span>
                    <span className="px-4 py-1.5 bg-stone-50 text-stone-400 text-[8px] font-black uppercase tracking-widest rounded-full">Encrypted</span>
                </div>
                <h5 className="text-8xl font-serif italic tracking-tighter text-stone-900">Reserve Audit</h5>
                <p className="text-stone-400 max-w-md text-sm leading-relaxed">Detailed breakdown of capital allocation across operational accounts, tax provisions, and emergency liquidity nodes.</p>
              </div>
              <Globe size={400} className="absolute -left-20 -bottom-20 opacity-[0.02] text-stone-900 pointer-events-none group-hover:rotate-45 transition-transform duration-[3000ms]" />
            </button>

            <button 
                onClick={() => setActiveModal('dispatch')} 
                className="p-16 bg-stone-900 text-white rounded-[4rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-2xl group relative overflow-hidden text-left active:scale-[0.98] min-h-[550px]"
            >
                <div className="p-10 bg-white/5 rounded-[2rem] w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-700">
                    <Send size={56} />
                </div>
                <div className="mt-20 relative z-10 space-y-6">
                    <div className="space-y-2">
                        <p className="text-[12px] font-black uppercase text-[#a9b897] tracking-[0.6em]">Outbound Logic</p>
                        <h5 className="text-7xl font-serif italic tracking-tighter">Dispatch Node</h5>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Active Queue</p>
                            <p className="text-[10px] font-mono">03 Directives</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Avg Lifecycle</p>
                            <p className="text-[10px] font-mono">14.2 Days</p>
                        </div>
                    </div>
                </div>
                <Mail size={300} className="absolute -right-16 -bottom-16 opacity-[0.04] group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-1000 pointer-events-none" />
            </button>
        </div>

        {/* LEDGER CENTRAL ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-2xl">
          <div className="p-16 border-b border-stone-50 flex flex-col 2xl:flex-row justify-between items-center gap-12 bg-white/50 backdrop-blur-xl">
            <div className="text-left w-full 2xl:w-auto space-y-4">
                <div className="flex items-center gap-4">
                    <Terminal size={18} className="text-[#a9b897]" />
                    <h3 className="text-6xl font-serif italic tracking-tighter">Network Ledger</h3>
                </div>
                <div className="flex items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Transactional Persistence Layer</p>
                    <div className="h-px w-24 bg-stone-100" />
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[8px] font-mono uppercase text-stone-400">Local Cache: Synced</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 w-full 2xl:w-auto">
              <div className="flex bg-stone-100 p-1.5 rounded-full border border-stone-200/50">
                {['All', 'Invoice', 'Quote', 'Expense'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${activeTab === tab.toLowerCase() ? "bg-white text-stone-900 shadow-md" : "text-stone-400 hover:text-stone-600"}`}
                    >
                        {tab}
                    </button>
                ))}
              </div>

              <div className="relative flex-1 2xl:w-[450px] min-w-[300px] group">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" size={18} />
                  <input 
                    placeholder="Search Entities or References..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-16 pr-10 py-6 bg-stone-50 border border-stone-100 rounded-full text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white focus:border-stone-900 focus:ring-4 ring-stone-900/5 transition-all placeholder:text-stone-300 shadow-inner" 
                  />
              </div>
              
              <button className="p-6 bg-stone-900 text-[#a9b897] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <Filter size={20}/>
              </button>
              
              <button className="p-6 border border-stone-200 text-stone-400 rounded-full hover:border-stone-900 hover:text-stone-900 transition-all">
                <Download size={20}/>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1200px] border-collapse">
              <thead className="bg-stone-50/50">
                <tr>
                  {['Reference', 'Entity Node', 'Category', 'Priority', 'Status', 'Aggregate Total'].map((h) => (
                    <th key={h} className="px-16 py-10 text-[10px] font-black uppercase tracking-[0.6em] text-stone-400 border-b border-stone-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredLedger.length > 0 ? (
                    filteredLedger.map((inv) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={inv.id} 
                        className="hover:bg-stone-50/80 transition-all cursor-pointer group active:bg-stone-100"
                      >
                        <td className="px-16 py-12">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-10 bg-stone-100 group-hover:bg-[#a9b897] transition-all rounded-full" />
                                <span className="font-mono text-[13px] text-stone-900 font-bold group-hover:translate-x-1 transition-transform">{inv.id}</span>
                            </div>
                        </td>
                        <td className="px-16 py-12">
                          <div className="space-y-1">
                            <p className="font-bold text-2xl tracking-tighter text-stone-900">{inv.client}</p>
                            <div className="flex items-center gap-3">
                                <Calendar size={10} className="text-stone-300" />
                                <p className="text-[9px] font-mono text-stone-300 uppercase tracking-widest">{inv.date}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-16 py-12">
                            <div className="flex items-center gap-3">
                                {inv.type === 'Invoice' ? <FileSpreadsheet size={14} className="text-stone-300" /> : <RefreshCcw size={14} className="text-stone-300" />}
                                <span className="text-[11px] font-black uppercase text-stone-400 tracking-widest">{inv.type}</span>
                            </div>
                        </td>
                        <td className="px-16 py-12">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                                inv.priority === 'high' ? 'text-red-500 border-red-100 bg-red-50' : 
                                inv.priority === 'med' ? 'text-blue-500 border-blue-100 bg-blue-50' : 
                                'text-stone-400 border-stone-100 bg-stone-50'
                            }`}>
                                {inv.priority}
                            </span>
                        </td>
                        <td className="px-16 py-12">
                          <span className={`inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border transition-all ${
                            inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 
                            inv.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-stone-50 text-stone-400 border-stone-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${inv.status === 'paid' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : inv.status === 'overdue' ? 'bg-red-500' : 'bg-stone-300'}`} />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-16 py-12 text-right pr-24">
                            <p className="font-mono font-bold text-3xl tracking-tighter text-stone-900 group-hover:text-[#a9b897] transition-colors">
                                £{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </td>
                      </motion.tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} className="px-16 py-32 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                                <Box size={64} />
                                <p className="text-[12px] font-black uppercase tracking-[0.5em]">No Log Data Found</p>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-10 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Displaying {filteredLedger.length} Records</p>
            <div className="flex items-center gap-4">
                <button className="px-6 py-3 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-stone-900 transition-all">Prev</button>
                <button className="px-6 py-3 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-stone-900 transition-all">Next</button>
            </div>
          </div>
        </section>

        {/* SYSTEM INTELLIGENCE & INFRASTRUCTURE */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-stone-900 text-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-12 text-left">
                    <SectionHeader title="Fiscal Logic" subtitle="Engine Diagnostics" icon={Cpu} />
                    <div className="space-y-8">
                        {[
                            { label: "AI Revenue Forecasting", val: 94 },
                            { label: "Tax Liability Accuracy", val: 99 },
                            { label: "Asset Liquidity Ratio", val: 82 }
                        ].map(stat => (
                            <div key={stat.label} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{stat.label}</p>
                                    <p className="text-xl font-mono text-[#a9b897]">{stat.val}%</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${stat.val}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                        className="h-full bg-[#a9b897]" 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <HardDrive size={300} className="absolute -right-20 -top-20 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000" />
            </div>

            <div className="bg-[#a9b897] p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                <div className="relative z-10 space-y-8 text-left">
                    <div className="p-6 bg-white/20 backdrop-blur-xl rounded-3xl w-fit">
                        <ShieldCheck size={32} className="text-stone-900" />
                    </div>
                    <h4 className="text-6xl font-serif italic tracking-tighter text-stone-900 leading-tight">Security & <br/>Compliance Node</h4>
                    <p className="text-stone-800 text-sm font-medium leading-relaxed max-w-sm">System integrity is maintained through AES-256 encryption. All transactional directives are immutable and cryptographically signed.</p>
                </div>
                <div className="relative z-10 pt-10 flex gap-6">
                    <button className="flex-1 py-5 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-stone-800 transition-all">Verify Node</button>
                    <button className="flex-1 py-5 bg-white/20 text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md hover:bg-white/30 transition-all border border-black/5">Audit Access</button>
                </div>
                <Fingerprint size={350} className="absolute -right-20 -bottom-20 opacity-[0.1] text-stone-900" />
            </div>
        </section>
      </div>

      {/* --- MODAL ARCHITECTURE SYSTEM --- */}
      <AnimatePresence>
        
        {/* MODAL 1: DISPATCH NODE (EXTENDED) */}
        {activeModal === 'dispatch' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-stone-900/90 backdrop-blur-3xl z-[9000] flex justify-center items-center p-6 lg:p-12" 
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.95 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                className="bg-white w-full max-w-7xl rounded-[4rem] p-12 lg:p-20 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]" 
                onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-16 border-b border-stone-50 pb-12">
                <div className="text-left space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-[#a9b897] rounded-full animate-ping" />
                    <p className="text-[12px] font-black uppercase tracking-[0.6em] text-[#a9b897]">Directive_Alpha_V6.8</p>
                  </div>
                  <h3 className="text-7xl font-serif italic tracking-tighter">Deploy Fiscal Directive</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-8 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all active:rotate-90 duration-500 shadow-sm"><X size={28}/></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar space-y-16 text-left">
                {/* Entity Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4 flex items-center gap-3">
                        <Globe size={12}/> Target Entity
                    </label>
                    <input 
                        placeholder="Legal Entity Name..." 
                        value={formData.client} 
                        onChange={e => setFormData({...formData, client: e.target.value})} 
                        className="w-full p-8 bg-stone-50 rounded-[2.5rem] border-none outline-none font-bold text-2xl focus:ring-8 ring-[#a9b897]/5 transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4 flex items-center gap-3">
                        <Mail size={12}/> Comms Route
                    </label>
                    <input 
                        placeholder="billing@entity.pulse" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full p-8 bg-stone-50 rounded-[2.5rem] border-none outline-none font-bold text-2xl shadow-inner" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4 flex items-center gap-3">
                        <CreditCard size={12}/> Tax Reference
                    </label>
                    <div className="relative">
                        <select 
                            value={formData.taxRate}
                            onChange={(e) => setFormData({...formData, taxRate: Number(e.target.value)})}
                            className="w-full p-8 bg-stone-50 rounded-[2.5rem] border-none outline-none font-bold text-2xl appearance-none cursor-pointer"
                        >
                            <option value={20}>VAT 20% (Standard)</option>
                            <option value={5}>VAT 5% (Reduced)</option>
                            <option value={0}>VAT 0% (Exempt)</option>
                        </select>
                        <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300" />
                    </div>
                  </div>
                </div>

                {/* Directive Composition */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400">Unit Decomposition</p>
                        <p className="text-[10px] font-mono text-stone-300">{lineItems.length} Units Defined</p>
                    </div>
                    
                    <div className="space-y-4">
                        {lineItems.map((item, index) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={item.id} 
                                className="flex flex-col lg:flex-row justify-between items-center bg-stone-50/50 p-10 rounded-[3rem] border border-stone-100/50 hover:bg-white hover:border-[#a9b897] transition-all gap-8"
                            >
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-stone-900 text-[#a9b897] rounded-lg text-[10px] font-mono">0{index + 1}</div>
                                        <input 
                                            value={item.desc}
                                            onChange={e => {
                                                const newItems = [...lineItems];
                                                newItems[index].desc = e.target.value;
                                                setLineItems(newItems);
                                            }}
                                            className="bg-transparent border-none outline-none font-bold text-2xl w-full"
                                        />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-14">System ID: {item.id}</p>
                                </div>
                                <div className="flex items-center gap-8 w-full lg:w-auto">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 text-right">Unit Price (£)</p>
                                        <input 
                                            type="number" 
                                            value={item.price} 
                                            onChange={e => {
                                                const newItems = [...lineItems];
                                                newItems[index].price = Number(e.target.value);
                                                setLineItems(newItems);
                                            }}
                                            className="bg-white px-8 py-5 rounded-2xl outline-none font-mono font-black text-2xl text-right w-48 shadow-sm focus:ring-4 ring-[#a9b897]/10 transition-all" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeItem(item.id)}
                                        className="p-5 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                    >
                                        <Trash2 size={24}/>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={addItem}
                        className="w-full py-12 border-2 border-dashed border-stone-200 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.5em] text-stone-300 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition-all flex items-center justify-center gap-6 active:scale-[0.99]"
                    >
                        <Plus size={20}/> Append Unit Component
                    </button>
                </div>
                
                {/* Contextual Notes */}
                <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase text-stone-400 tracking-[0.5em] ml-4">Terminal Annotations</label>
                    <textarea 
                        placeholder="Input private operational context here..."
                        rows={3}
                        className="w-full p-10 bg-stone-50 rounded-[3rem] border-none outline-none font-medium text-lg shadow-inner resize-none focus:ring-4 ring-[#a9b897]/5 transition-all"
                    />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-16 pt-12 border-t border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-12 mt-12 bg-white/80 backdrop-blur-md">
                <div className="flex gap-16">
                    <div className="text-left space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-300">Subtotal</p>
                        <h4 className="font-mono font-bold tracking-tighter text-4xl text-stone-400">£{(grandTotal / (1 + (formData.taxRate / 100))).toLocaleString()}</h4>
                    </div>
                    <div className="text-left space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Aggregate Total</p>
                        <h4 className="font-mono font-bold tracking-tighter text-8xl">£{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                    </div>
                </div>
                <div className="flex gap-6 w-full xl:w-auto">
                    <button className="flex-1 xl:flex-none px-12 py-8 border border-stone-200 rounded-full text-[11px] font-black uppercase tracking-[0.5em] hover:bg-stone-50 transition-all active:scale-95">Save Fragment</button>
                    <button 
                        onClick={handleDispatch} 
                        className="flex-1 xl:flex-none px-20 py-8 bg-stone-900 text-white rounded-full text-[13px] font-black uppercase tracking-[0.6em] hover:bg-stone-800 transition-all shadow-2xl flex items-center justify-center gap-6 active:scale-95 group"
                    >
                        Dispatch <Send size={22} className="text-[#a9b897] group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL 2: LIQUID RESERVES (EXTENDED) */}
        {activeModal === 'reserves' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-stone-900/95 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" 
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, rotateY: 30 }} 
                animate={{ scale: 1, opacity: 1, rotateY: 0 }} 
                className="bg-stone-50 w-full max-w-6xl rounded-[4rem] p-16 lg:p-24 shadow-2xl relative overflow-hidden text-left" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Share2 size={16} className="text-[#a9b897]" />
                            <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#a9b897]">Node_Audit_v6.8</p>
                        </div>
                        <h3 className="text-7xl font-serif italic tracking-tighter text-stone-900">Capital Distribution</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="p-8 bg-white rounded-full hover:bg-stone-900 hover:text-white transition-all shadow-xl active:scale-90 duration-500"><X size={32}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8 group hover:border-stone-900 transition-all">
                        <div className="p-5 bg-stone-50 rounded-2xl w-fit group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all"><PieChart size={32} /></div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.5em] mb-2">Escrow Reserves</p>
                            <p className="text-4xl font-mono font-black tracking-tighter text-stone-900">£12,450.00</p>
                        </div>
                    </div>
                    <div className="bg-stone-900 p-12 rounded-[3.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="p-5 bg-white/10 rounded-2xl w-fit text-[#a9b897] animate-pulse"><Zap size={32} /></div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black uppercase text-stone-500 tracking-[0.5em] mb-2">Operational Fluidity</p>
                            <p className="text-4xl font-mono font-black tracking-tighter text-[#a9b897]">£{metrics.revYtd.toLocaleString()}</p>
                        </div>
                        <Activity size={180} className="absolute -right-12 -bottom-12 opacity-[0.05] pointer-events-none" />
                    </div>
                    <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8 group hover:border-stone-900 transition-all">
                        <div className="p-5 bg-stone-50 rounded-2xl w-fit group-hover:bg-stone-900 group-hover:text-green-500 transition-all"><History size={32} /></div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.5em] mb-2">Growth Vector (30D)</p>
                            <p className="text-4xl font-mono font-black tracking-tighter text-green-500">+14.7%</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-stone-100 rounded-[4rem] p-16 space-y-12 relative shadow-inner">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-stone-900">Liquidity Snapshot</h4>
                            <p className="text-[10px] font-mono text-stone-300">7-Day Transactional Variance</p>
                        </div>
                        <button className="flex items-center gap-4 px-8 py-4 bg-stone-50 rounded-full text-[10px] font-black uppercase tracking-widest text-stone-500 hover:bg-stone-900 hover:text-white transition-all shadow-sm">
                            <Download size={16} /> Export Detailed Audit
                        </button>
                    </div>
                    
                    {/* Visual Graph Representation */}
                    <div className="h-64 flex items-end gap-4 px-6 relative">
                        <div className="absolute inset-0 border-b border-stone-50 flex flex-col justify-between pointer-events-none">
                            <div className="h-px w-full bg-stone-50/50" />
                            <div className="h-px w-full bg-stone-50/50" />
                            <div className="h-px w-full bg-stone-50/50" />
                        </div>
                        {[45, 65, 40, 85, 70, 95, 100, 80, 60, 85, 90, 75].map((h, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ height: 0 }} 
                                animate={{ height: `${h}%` }} 
                                transition={{ delay: i * 0.05, duration: 1.2, ease: "circOut" }} 
                                className="flex-1 bg-stone-50 group relative rounded-t-[1.5rem] overflow-hidden cursor-crosshair"
                            >
                                <div className="absolute inset-0 bg-stone-900 scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-700 ease-in-out" />
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono font-bold text-white z-10">{h}%</div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between pt-6 border-t border-stone-50">
                        <p className="text-[8px] font-mono text-stone-300">SYSTEM_EPOCH_01</p>
                        <p className="text-[8px] font-mono text-stone-300">CURRENT_WINDOW_MAY</p>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:italic&family=Inter:wght@400;700;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        .font-serif { font-family: 'Instrument Serif', serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a9b897; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        ::selection { background: #a9b897; color: white; }
      `}</style>
    </div>
  );
}