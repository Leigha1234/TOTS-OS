"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
const supabase = getBrowserClient();
import { 
  X, Landmark, Wallet, TrendingUp, Search, 
  ArrowUpRight, Receipt, Plus, Activity, 
  Fingerprint, Send, Trash2, Database,
  Filter, Cpu, AlertCircle, CheckCircle2, 
  Download, PieChart, History, Zap, ShieldCheck,
  BarChart3, Users, Clock
} from "lucide-react";

/**
 * TOTS OS v7.0.1 - COMPACT FISCAL NODE
 * REVISION: ADDED NAV NODES | TIGHTER PADDING
 */

const MetricCard = ({ label, value, sub, icon, isDark = false }: any) => (
  <div className={`${isDark ? 'bg-stone-900 shadow-xl' : 'bg-white border border-stone-100 shadow-sm'} p-6 rounded-[2rem] flex flex-col justify-between min-h-[220px] relative overflow-hidden group hover:shadow-lg transition-all duration-500`}>
    <div className="z-10 flex justify-between items-start">
      <p className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-stone-500' : 'text-stone-300'}`}>{label}</p>
      <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5 text-[#a9b897]' : 'bg-[#faf9f6] text-stone-200 group-hover:text-stone-900'} transition-all`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>
    </div>
    
    <div className="z-10 mt-4 text-left">
      <h2 className={`font-mono tracking-tighter leading-tight ${isDark ? 'text-[#a9b897]' : 'text-stone-900'} 
        ${value.toString().length > 10 ? 'text-2xl' : 'text-3xl'}`}>
        £{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h2>
    </div>

    <div className="z-10 pt-4 border-t border-stone-100/10 flex items-center justify-between">
      <span className="text-[8px] font-serif italic text-[#a9b897]">{sub}</span>
      {isDark && <Activity size={10} className="text-[#a9b897] animate-pulse" />}
    </div>
    {isDark && <Cpu size={120} className="absolute -right-10 -top-10 opacity-[0.03] text-white" />}
  </div>
);

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"dispatch" | "reserves" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ visible: false, msg: "", type: "success" });
  const router = useRouter();

  const [formData, setFormData] = useState({ client: "", email: "", reference: `TX-${Math.floor(1000 + Math.random() * 9000)}` });
  const [lineItems, setLineItems] = useState([{ id: Date.now(), desc: "Neural Architecture Node", qty: 1, price: 12500 }]);
  const [metrics, setMetrics] = useState({ revYtd: 0, operatingCosts: 18450, vatPool: 0, taxDue: 0 });
  const [ledger, setLedger] = useState([
    { id: "INV-882", client: "Aperture Labs", amount: 14200, status: "paid", type: "Invoice", date: "2026-05-01" },
    { id: "QT-402", client: "Cyberdyne Systems", amount: 8900, status: "pending", type: "Quote", date: "2026-04-20" },
    { id: "INV-901", client: "Umbrella Corp", amount: 12500, status: "overdue", type: "Invoice", date: "2026-03-15" },
  ]);

  useEffect(() => {
    setIsMounted(true);
    const syncData = async () => {
        const { data } = await supabase.from('timesheets').select('mon, tue, wed, thu, fri');
       // Add :number to 'a' and :any to 'r'
const hours = data?.reduce((a: number, r: any) => a + (Number(r.mon) + Number(r.tue) + Number(r.wed) + Number(r.thu) + Number(r.fri)), 0) ?? 0;
 const rev = hours * 125;
        setMetrics({ revYtd: rev, operatingCosts: 18450, vatPool: rev * 0.2, taxDue: (rev - 12570) * 0.19 });
    };
    syncData();
  }, []);

  const grandTotal = useMemo(() => lineItems.reduce((a, i) => a + (i.qty * i.price * 1.2), 0), [lineItems]);

  const triggerNotify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ visible: true, msg, type });
    setTimeout(() => setNotification({ visible: false, msg: "", type: "success" }), 3000);
  };

  const handleDispatch = () => {
    if (!formData.client) { triggerNotify("Entity Node Missing", "error"); return; }
    const doc = { id: `INV-${Math.floor(Math.random() * 900) + 100}`, client: formData.client, amount: grandTotal, status: "pending", type: "Invoice", date: new Date().toISOString().split('T')[0] };
    setLedger([doc, ...ledger]);
    triggerNotify("Directive Dispatched");
    setActiveModal(null);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 size={12} className="text-[#a9b897]" /> : <AlertCircle size={12} className="text-red-500" />}
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
        
        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Fingerprint size={18} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-300">FISCAL_PULSE_7.1</p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">Optimized</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
              <button className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all">Payments</button>
              {[
                { name: 'Financial Reports', path: '/finance-reports', icon: <BarChart3 size={10}/> },
                { name: 'HR & Payroll', path: '/hr', icon: <Users size={10}/> },
                { name: 'Timesheets', path: '/timesheets', icon: <Clock size={10}/> }
              ].map((link) => (
                <button key={link.name} onClick={() => router.push(link.path)}
                  className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                  {link.icon} {link.name}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('dispatch')} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95">
              <Plus size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Directive</span>
            </button>
          </div>
        </header>

        {/* METRIC GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Gross Intake" value={metrics.revYtd} sub="Engagement: 114%" icon={<TrendingUp />} isDark />
          <MetricCard label="Operational" value={metrics.revYtd - metrics.operatingCosts} sub="Flow: Clear" icon={<Database />} />
          <MetricCard label="VAT Escrow" value={metrics.vatPool} sub="Lock Active" icon={<Landmark />} />
          <MetricCard label="Fiscal Prov" value={metrics.taxDue} sub="FY26 Est." icon={<Receipt />} />
        </section>

        {/* INTERACTIVE NODES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setActiveModal('reserves')} className="p-10 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col justify-between hover:border-stone-900 transition-all shadow-sm group min-h-[300px] relative overflow-hidden text-left">
              <div className="flex justify-between w-full">
                <div className="p-5 bg-[#faf9f6] rounded-2xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all duration-500"><Wallet size={32} /></div>
                <div className="p-4 border border-stone-100 rounded-full text-stone-200 group-hover:text-stone-900 transition-all"><ArrowUpRight size={18}/></div>
              </div>
              <div className="mt-6">
                <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.4em] italic mb-1">Audit Stream</p>
                <h5 className="text-5xl font-serif italic tracking-tighter">Reserves</h5>
              </div>
              <Landmark size={180} className="absolute -left-10 -bottom-10 opacity-[0.02] text-stone-900" />
            </button>

            <button onClick={() => setActiveModal('dispatch')} className="p-10 bg-stone-900 text-white rounded-[2.5rem] flex flex-col justify-between hover:bg-stone-800 transition-all shadow-xl group min-h-[300px] relative overflow-hidden text-left">
                <div className="p-5 bg-white/10 rounded-2xl w-fit group-hover:bg-[#a9b897] group-hover:text-stone-900 transition-all duration-500"><Send size={32} /></div>
                <div className="mt-6 relative z-10">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.4em] mb-1">Outbound Signal</p>
                    <h5 className="text-5xl font-serif italic tracking-tighter">Dispatch Node</h5>
                </div>
                <Zap size={180} className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:rotate-12 transition-transform" />
            </button>
        </div>

        {/* LEDGER ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-stone-50 flex flex-col xl:flex-row justify-between items-center gap-6">
            <div className="text-left w-full xl:w-auto">
                <h3 className="text-4xl font-serif italic tracking-tighter">Ledger Archive</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Operational Stream</p>
            </div>
            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9b897]" size={14} />
                  <input placeholder="References..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-6 py-3 bg-[#faf9f6] border border-stone-50 rounded-full text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:bg-white focus:border-stone-900 transition-all" />
              </div>
              <button className="p-3 bg-stone-900 text-[#a9b897] rounded-full"><Filter size={16}/></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#faf9f6]">
                  {['Ref', 'Target Entity', 'Status', 'Aggregate'].map((h) => (
                    <th key={h} className="px-8 py-5 text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-left">
                {ledger.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#faf9f6]/50 transition-all cursor-pointer group">
                    <td className="px-8 py-6 font-mono text-[9px] text-[#a9b897] font-black">{inv.id}</td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-lg tracking-tighter text-stone-900">{inv.client}</p>
                      <p className="text-[8px] font-mono text-stone-300 uppercase tracking-widest">{inv.date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-300'}`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right pr-12 font-mono font-bold text-xl tracking-tighter text-stone-900">£{inv.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}