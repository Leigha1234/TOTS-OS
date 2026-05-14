"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, Download, FileSpreadsheet, Share2,
  Calculator, AlertCircle, Fingerprint, TrendingDown,
  PieChart, ShieldCheck, Zap, X, Eye, FileText,
  Cpu, Lock, Activity, ArrowUpRight, Printer
} from "lucide-react";

/**
 * TOTS OS v7.0.0 - FISCAL ANALYTICS NODE
 * REVISION: HIGH-DENSITY KPI | AUDIT TRAIL ARCHIVE
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-24">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Zap size={14} className="text-[#a9b897] animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto px-10 py-16 space-y-16">
        
        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-stone-100 pb-16">
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-stone-900 text-[#a9b897] rounded-2xl shadow-xl hover:rotate-6 transition-transform"><BarChart3 size={24} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-300">ANALYTICS_PULSE_7.0</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#a9b897] rounded-full animate-pulse" />
                  <p className="text-[8px] font-mono tracking-widest text-[#a9b897] uppercase">SYNC_OK [{systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl lg:text-9xl font-serif italic tracking-tighter leading-[0.8]">Reports</h1>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center bg-white p-1.5 rounded-full shadow-sm border border-stone-100">
              {['Payments', 'Reports', 'HR'].map((tab) => (
                <button key={tab} onClick={() => tab !== 'Reports' && router.push(`/${tab.toLowerCase()}`)}
                  className={`px-10 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-full transition-all ${tab === 'Reports' ? 'bg-stone-900 text-white' : 'text-stone-300 hover:text-stone-900'}`}>
                  {tab}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('audit')} className="bg-[#a9b897] text-stone-900 px-10 py-4.5 rounded-full flex items-center gap-4 hover:bg-stone-900 hover:text-white transition-all shadow-xl shadow-[#a9b897]/10 active:scale-95">
              <Printer size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Audit Protocol</span>
            </button>
          </div>
        </header>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between min-h-[320px] relative overflow-hidden group">
            <div className="z-10 space-y-8 text-left">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-500">Net Surplus</p>
                <div className="bg-white/5 p-4 rounded-2xl text-[#a9b897]"><ShieldCheck size={20} /></div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter text-[#a9b897] leading-none">£{(metrics.netMargin / 1000).toFixed(1)}k</h2>
            </div>
            <div className="z-10 pt-8 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-serif italic text-[#a9b897]">FY26 Liquid Margin</span>
              <Activity size={12} className="text-[#a9b897] animate-pulse" />
            </div>
            <Cpu size={180} className="absolute -right-16 -top-16 opacity-[0.03] text-white" />
          </div>

          {[
            { label: 'Monthly Burn', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Overhead Velocity', icon: <TrendingDown size={18}/> },
            { label: 'Tax Provision', val: `£${metrics.taxReserve.toLocaleString()}`, sub: 'Statutory Liability', icon: <Calculator size={18}/> },
            { label: 'Receivables', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Escrow Pending', icon: <PieChart size={18}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-10 rounded-[3rem] flex flex-col justify-between min-h-[320px] shadow-sm hover:border-stone-900 transition-all duration-700 text-left group">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-[#faf9f6] p-4 rounded-2xl">{item.icon}</div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-8 border-t border-stone-50 flex justify-between items-center">
                <p className="text-[9px] font-serif italic text-[#a9b897]">{item.sub}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-stone-100 group-hover:bg-[#a9b897] transition-colors" />
              </div>
            </div>
          ))}
        </section>

        {/* ANALYTICS NODES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[4rem] p-16 space-y-16 shadow-sm relative overflow-hidden text-left group">
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-2">
                <h4 className="text-5xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 italic">Historical Flow Velocity</p>
              </div>
              <nav className="flex bg-[#faf9f6] p-1.5 rounded-full border border-stone-100 shadow-inner">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-8 py-3 rounded-full text-[9px] font-black tracking-widest transition-all uppercase ${t === '1Y' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-300 hover:text-stone-900'}`}>{t}</button>
                ))}
              </nav>
            </div>
            
            <div className="h-[340px] flex items-end gap-4 px-6 relative z-10">
              {[30, 45, 40, 75, 65, 90, 85, 55, 95, 100, 70, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-6 group/bar h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: i * 0.05, duration: 1.5, ease: "circOut" }}
                    className="w-full bg-[#faf9f6] rounded-2xl group-hover/bar:bg-stone-900 transition-all duration-700 relative border border-stone-50" />
                  <span className="text-[10px] font-black text-stone-200 uppercase tracking-tighter font-mono group-hover/bar:text-[#a9b897] transition-colors">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-stone-900 rounded-[4rem] p-14 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="space-y-12 relative z-10 text-left">
              <div className="flex items-center gap-4 text-stone-500">
                <Cpu size={18} />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">System_Exports</p>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet, sub: 'XLS / CSV Archive' },
                  { label: 'Tax Directive', icon: Calculator, sub: 'Q3 Fiscal Provision' },
                  { label: 'Network Access', icon: Share2, sub: 'Shareable Protocol' },
                ].map((btn, i) => (
                  <button key={i} onClick={() => triggerNotify(`Synthesizing...`)} 
                    className="w-full flex items-center justify-between p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group/btn text-left">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover/btn:bg-[#a9b897] group-hover/btn:text-stone-900 transition-all duration-500">
                        <btn.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest">{btn.label}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-600 mt-1">{btn.sub}</p>
                      </div>
                    </div>
                    <Download size={16} className="text-stone-700 group-hover/btn:text-[#a9b897] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-600 italic">Secure Output Stream</p>
              <Lock size={14} className="text-stone-700" />
            </div>
          </div>
        </div>

        {/* AUDIT TRAIL ARCHIVE */}
        <section className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-700">
           <div className="p-14 border-b border-stone-50 flex flex-col lg:flex-row items-center justify-between gap-10 text-left">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-[#faf9f6] rounded-3xl flex items-center justify-center text-[#a9b897] shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-5xl font-serif italic tracking-tighter">Audit Trail</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 italic">Verified Record Archive</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95">
                Full System Profile
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#faf9f6]">
                  {['Archive Name', 'Fiscal Cycle', 'Verification Status'].map((h) => (
                    <th key={h} className="px-14 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
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
                    <td className="px-14 py-10">
                      <div className="flex items-center gap-6">
                        <FileText size={20} className="text-stone-200 group-hover:text-[#a9b897] transition-colors" />
                        <span className="text-2xl font-bold text-stone-800 tracking-tighter">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-14 py-10 text-[11px] font-mono text-stone-300 font-bold uppercase tracking-widest">{row.period}</td>
                    <td className="px-14 py-10 text-right pr-24">
                      <span className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all ${
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

      {/* AUDIT MODAL ENGINE */}
      <AnimatePresence>
        {activeModal === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/90 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#faf9f6] w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-5 bg-white rounded-full border border-stone-100 shadow-sm hover:rotate-90 transition-all duration-500"><X size={20}/></button>
                
                <div className="text-left space-y-4 mb-12">
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Record_Protocol</p>
                  <h3 className="text-5xl font-serif italic tracking-tighter leading-tight">Fiscal Profile</h3>
                </div>

                <div className="space-y-10">
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-100 space-y-8 text-left shadow-sm">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-8">
                      <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.5em]">Aggregated Intake</p>
                      <p className="text-3xl font-mono font-bold tracking-tighter text-stone-900">£{metrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-50 pb-8">
                      <p className="text-[11px] font-black uppercase text-stone-300 tracking-[0.5em]">Tax Provision</p>
                      <p className="text-3xl font-mono font-bold text-red-500 tracking-tighter">-£{metrics.taxReserve.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <p className="text-[14px] font-black uppercase text-stone-900 tracking-[0.5em]">Net Surplus</p>
                      <p className="text-6xl font-mono font-bold text-[#a9b897] tracking-tighter">£{metrics.netMargin.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => triggerNotify("Compiling Record...")} className="flex items-center justify-center gap-4 py-8 bg-stone-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all shadow-xl active:scale-95">
                      <Download size={20} /> Export PDF
                    </button>
                    <button className="flex items-center justify-center gap-4 py-8 bg-white text-stone-300 border border-stone-100 rounded-3xl text-[11px] font-black uppercase tracking-widest hover:text-stone-900 transition-all active:scale-95">
                      <Eye size={20} /> View Ledger
                    </button>
                  </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}