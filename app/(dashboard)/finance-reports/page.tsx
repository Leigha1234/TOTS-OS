"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
const supabase = getBrowserClient();
import { 
  BarChart3, Download, FileSpreadsheet, Share2,
  Calculator, Fingerprint, TrendingDown,
  PieChart, ShieldCheck, Zap, X, Eye, FileText,
  Cpu, Lock, Activity, Printer, Users, Clock
} from "lucide-react";

/**
 * TOTS OS v7.1.0 - FISCAL ANALYTICS NODE
 * REVISION: COMPACT SCALE | INTEGRATED NAV | OPTIMIZED KPI
 */

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [systemUptime, setSystemUptime] = useState(0);
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    burnRate: 12400, 
    receivables: 0,
    taxReserve: 0,
    netMargin: 0
  });

  const [activeModal, setActiveModal] = useState<"audit" | "export" | null>(null);
  const [notification, setNotification] = useState({ visible: false, msg: "" });

  useEffect(() => {
    setIsMounted(true);
    fetchFinancialData();
    const timer = setInterval(() => setSystemUptime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchFinancialData() {
    try {
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      const totalHours = timesheets?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 480;

      const billable = totalHours * 125; 
      const tax = billable * 0.19; 
      const burn = 12400; 

      setMetrics({
        totalRevenue: billable,
        receivables: billable * 0.15, 
        burnRate: burn,
        taxReserve: tax,
        netMargin: billable - tax - burn
      });
    } catch (err) {
      console.error("Signal Disruption.");
    }
  }

  const triggerNotify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            <Zap size={12} className="text-[#a9b897] animate-pulse" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">
        
        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><BarChart3 size={18} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-300">ANALYTICS_PULSE_7.1</p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[7px] font-mono tracking-widest text-[#a9b897] uppercase">SYNC_OK [{systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
              <button onClick={() => router.push('/payments')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all">Payments</button>
              <button className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <BarChart3 size={10}/> Finance
              </button>
              {[
                { name: 'HR', path: '/hr', icon: <Users size={10}/> },
                { name: 'Timesheets', path: '/timesheets', icon: <Clock size={10}/> }
              ].map((link) => (
                <button key={link.name} onClick={() => router.push(link.path)}
                  className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                  {link.icon} {link.name}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('audit')} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95">
              <Printer size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">Audit</span>
            </button>
          </div>
        </header>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
            <div className="z-10 space-y-4 text-left">
              <div className="flex justify-between items-start">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-500">Net Surplus</p>
                <div className="bg-white/5 p-3 rounded-xl text-[#a9b897]"><ShieldCheck size={16} /></div>
              </div>
              <h2 className="text-3xl font-mono tracking-tighter text-[#a9b897] leading-none">£{(metrics.netMargin / 1000).toFixed(1)}k</h2>
            </div>
            <div className="z-10 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-serif italic text-[#a9b897]">FY26 Margin</span>
              <Activity size={10} className="text-[#a9b897] animate-pulse" />
            </div>
            <Cpu size={120} className="absolute -right-10 -top-10 opacity-[0.03] text-white" />
          </div>

          {[
            { label: 'Burn Rate', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Velocity', icon: <TrendingDown size={16}/> },
            { label: 'Tax Prov', val: `£${metrics.taxReserve.toLocaleString()}`, sub: 'Liability', icon: <Calculator size={16}/> },
            { label: 'Pending', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Escrow', icon: <PieChart size={16}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-6 rounded-[2rem] flex flex-col justify-between min-h-[220px] shadow-sm hover:border-stone-900 transition-all duration-500 text-left group">
              <div className="flex justify-between items-start">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-[#faf9f6] p-3 rounded-xl">{item.icon}</div>
              </div>
              <h2 className="text-2xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
                <p className="text-[8px] font-serif italic text-[#a9b897]">{item.sub}</p>
                <div className="w-1 h-1 rounded-full bg-stone-100 group-hover:bg-[#a9b897] transition-colors" />
              </div>
            </div>
          ))}
        </section>

        {/* ANALYTICS NODES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden text-left group">
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <h4 className="text-3xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Historical Flow</p>
              </div>
              <nav className="flex bg-[#faf9f6] p-1 rounded-full border border-stone-100">
                {['6M', '1Y'].map(t => (
                  <button key={t} className={`px-5 py-2 rounded-full text-[8px] font-black tracking-widest transition-all uppercase ${t === '1Y' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-300 hover:text-stone-900'}`}>{t}</button>
                ))}
              </nav>
            </div>
            
            <div className="h-[220px] flex items-end gap-3 px-4 relative z-10">
              {[30, 45, 40, 75, 65, 90, 85, 55, 95, 100, 70, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: i * 0.05, duration: 1, ease: "circOut" }}
                    className="w-full bg-[#faf9f6] rounded-xl group-hover/bar:bg-stone-900 transition-all duration-500 relative border border-stone-50" />
                  <span className="text-[8px] font-black text-stone-200 uppercase font-mono group-hover/bar:text-[#a9b897] transition-colors">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-stone-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-8 relative z-10 text-left">
              <div className="flex items-center gap-3 text-stone-500">
                <Cpu size={14} />
                <p className="text-[8px] font-black uppercase tracking-[0.4em]">Exports</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet },
                  { label: 'Tax Directive', icon: Calculator },
                  { label: 'Network Access', icon: Share2 },
                ].map((btn, i) => (
                  <button key={i} onClick={() => triggerNotify(`Synthesizing...`)} 
                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/btn text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/btn:bg-[#a9b897] group-hover/btn:text-stone-900 transition-all duration-300">
                        <btn.icon size={16} />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest">{btn.label}</p>
                    </div>
                    <Download size={12} className="text-stone-700 group-hover/btn:text-[#a9b897] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-600 italic">Secure Output</p>
              <Lock size={12} className="text-stone-700" />
            </div>
          </div>
        </div>

        {/* AUDIT TRAIL ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm">
           <div className="p-8 border-b border-stone-50 flex flex-col lg:flex-row items-center justify-between gap-6 text-left">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#faf9f6] rounded-2xl flex items-center justify-center text-[#a9b897] shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-3xl font-serif italic tracking-tighter">Audit Trail</h4>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Verified Records</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-6 py-3 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95">
                System Profile
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#faf9f6]">
                  {['Archive Name', 'Fiscal Cycle', 'Verification Status'].map((h) => (
                    <th key={h} className="px-10 py-5 text-[8px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', status: 'Certified' },
                  { name: 'VAT Reconciliation Hub', period: 'Q1 2026', status: 'Filed' },
                  { name: 'Strategic R&D Submission', period: 'FY 2025', status: 'In Review' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-[#faf9f6]/50 transition-all cursor-pointer" onClick={() => setActiveModal('audit')}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <FileText size={16} className="text-stone-200 group-hover:text-[#a9b897] transition-colors" />
                        <span className="text-xl font-bold text-stone-800 tracking-tighter">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-[9px] font-mono text-stone-300 font-bold uppercase tracking-widest">{row.period}</td>
                    <td className="px-10 py-6 text-right pr-12">
                      <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full border transition-all ${
                        row.status === 'In Review' 
                        ? 'text-stone-300 border-stone-100 italic' 
                        : 'bg-stone-900 text-white border-stone-900 group-hover:bg-[#a9b897] group-hover:text-stone-900'
                      }`}>{row.status}</span>
                    </td>
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