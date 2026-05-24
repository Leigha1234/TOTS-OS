"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import { 
  BarChart3, Download, FileSpreadsheet, Share2,
  Calculator, TrendingDown,
  PieChart, ShieldCheck, Zap, FileText,
  Cpu, Lock, Activity, Printer, Users, Clock
} from "lucide-react";

/**
 * TOTS OS v7.1.0 - FINANCIAL REPORTS
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
    const supabase = getBrowserClient();
    if (!supabase) return;

    try {
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      // FIXED: Added explicit types to resolve build error
      const totalHours = timesheets?.reduce((acc: number, row: any) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) ?? 480;

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
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Financial Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
              <button onClick={() => router.push('/payments')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all">Payments</button>
              <button className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <BarChart3 size={10}/> Financial Reports
              </button>
              {[
                { name: 'HR & Payroll', path: '/hr', icon: <Users size={10}/> },
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden text-left group">
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <h4 className="text-3xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300 italic">Historical Flow</p>
              </div>
            </div>
            <div className="h-[220px] flex items-end gap-3 px-4 relative z-10">
              {[30, 45, 40, 75, 65, 90, 85, 55, 95, 100, 70, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: i * 0.05, duration: 1, ease: "circOut" }}
                    className="w-full bg-[#faf9f6] rounded-xl hover:bg-stone-900 transition-all duration-500 relative border border-stone-50" />
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
                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-all duration-300">
                        <btn.icon size={16} />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest">{btn.label}</p>
                    </div>
                    <Download size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <footer className="pt-8 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-[0.4em]">
          <div className="flex items-center gap-3">
            <p>TOTS OS v7.1.0 • FINANCIAL REPORTS</p>
            <div className="w-1 h-1 rounded-full bg-[#a9b897] animate-pulse" />
          </div>
          <div className="flex gap-6">
            <button className="hover:text-stone-900">Protocols</button>
            <button className="hover:text-stone-900">Privacy</button>
          </div>
        </footer>
      </div>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}