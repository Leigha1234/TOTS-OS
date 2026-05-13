"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, Download, 
  FileSpreadsheet, Printer, Share2,
  Calculator, AlertCircle, Loader2,
  Fingerprint, TrendingDown,
  PieChart, ShieldCheck, Zap, X, Eye, FileText, Terminal,
  Cpu, Lock, Globe, Activity, ArrowUpRight
} from "lucide-react";

/**
 * TOTS OS v6.7.1 - COMPACT FINANCE ANALYTICS
 * REVISION: REDUCED SCALE | REMOVED DASHBOARD NAV
 */

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setIsLoading(true);
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = timesheets?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 520;

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
    } catch (err: any) {
      setError("Signal Disruption.");
    } finally {
      setIsLoading(false);
    }
  }

  const triggerNotify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-white/5">
            <Zap size={12} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">
        
        {/* --- COMPACT HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-10">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><BarChart3 size={18} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-[0.4em] text-stone-400">FINANCIAL_ANALYTICS_6.7</p>
                <p className="text-[7px] font-mono text-stone-400 tracking-widest uppercase">Node Sync [{systemUptime}s]</p>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tighter leading-none">Finance Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200/50">
              {['Payments', 'Reports', 'HR'].map((path) => (
                <button key={path} onClick={() => path !== 'Reports' && router.push(`/${path.toLowerCase()}`)}
                  className={`px-6 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${path === 'Reports' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-6 py-3 rounded-full flex items-center gap-3 hover:opacity-90 transition-all shadow-lg active:scale-95">
              <Printer size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Audit Protocol</span>
            </button>
          </div>
        </header>

        {/* --- KPI GRID (SHRUNKEN) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="z-10 space-y-6 text-left">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500">Net Margin</p>
                <div className="bg-[#a9b897]/10 p-3 rounded-2xl text-[#a9b897]"><ShieldCheck size={18} /></div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter text-[#a9b897] leading-none">£{(metrics.netMargin / 1000).toFixed(1)}k</h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-500 italic">Fiscal Safety</span>
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            </div>
          </div>

          {[
            { label: 'Operating Burn', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Monthly Overhead', icon: <TrendingDown size={18}/> },
            { label: 'Tax Provision', val: `£${metrics.taxReserve.toLocaleString()}`, sub: 'Statutory Liability', icon: <Calculator size={18}/> },
            { label: 'Unallocated', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Pending Receivables', icon: <PieChart size={18}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] shadow-sm hover:border-stone-900 transition-all text-left group">
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-3 rounded-2xl">{item.icon}</div>
              </div>
              <h2 className="text-4xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-6 border-t border-stone-50 flex justify-between items-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897] italic">{item.sub}</p>
                <Activity size={10} className="text-stone-200" />
              </div>
            </div>
          ))}
        </section>

        {/* --- ANALYTICS SECTION (REDUCED) --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[3rem] p-8 md:p-12 space-y-12 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center relative z-10">
              <div className="text-left">
                <h4 className="text-4xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 italic">Capital Velocity Log</p>
              </div>
              <div className="flex bg-stone-50 p-1 rounded-full border border-stone-100">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-6 py-2 rounded-full text-[8px] font-black tracking-widest transition-all uppercase ${t === '1Y' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-[300px] flex items-end gap-3 px-4 relative z-10">
              {[40, 55, 30, 75, 65, 90, 85, 50, 95, 100, 70, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar h-full justify-end">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ delay: i * 0.05, duration: 1 }}
                    className="w-full bg-stone-50 rounded-xl group-hover/bar:bg-stone-900 transition-all relative border border-stone-100" />
                  <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter font-mono">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-stone-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="space-y-8 relative z-10 text-left">
              <div className="flex items-center gap-3 text-stone-500">
                <Cpu size={14} />
                <p className="text-[9px] font-black uppercase tracking-widest">Secure Export</p>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet, sub: 'XLS / CSV' },
                  { label: 'Tax Projection', icon: Calculator, sub: 'Q2 Directive' },
                  { label: 'Stakeholder Portal', icon: Share2, sub: 'Remote Link' },
                ].map((btn, i) => (
                  <button key={i} onClick={() => triggerNotify(`Synthesizing...`)} 
                    className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group/btn text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/btn:bg-[#a9b897]/20 group-hover/btn:text-[#a9b897] transition-all">
                        <btn.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">{btn.label}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-600 mt-0.5">{btn.sub}</p>
                      </div>
                    </div>
                    <Download size={14} className="text-stone-700 group-hover/btn:text-white" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-600">Restricted Stream</p>
              <Lock size={12} className="text-stone-700" />
            </div>
          </div>
        </section>

        {/* --- AUDIT TRAIL (COMPACT) --- */}
        <section className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden shadow-sm hover:border-stone-900 transition-all">
           <div className="p-8 border-b border-stone-50 flex flex-col lg:flex-row items-center justify-between gap-6 text-left">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#a9b897] shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-4xl font-serif italic tracking-tighter">Audit Trail</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 italic">Verified System Records</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95">
                Full Profile
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', status: 'Certified' },
                  { name: 'VAT Reconciliation Hub', period: 'Q1 2026', status: 'Filed' },
                  { name: 'Strategic R&D Submission', period: 'FY 2025', status: 'In Review' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50/40 transition-all cursor-pointer" onClick={() => setActiveModal('audit')}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <FileText size={16} className="text-stone-200 group-hover:text-[#a9b897]" />
                        <span className="text-lg font-bold text-stone-800 group-hover:text-stone-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-[9px] font-black uppercase text-stone-400 font-mono italic">{row.period}</td>
                    <td className="px-10 py-6 text-right">
                      <span className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${row.status === 'In Review' ? 'text-stone-400 border-stone-100 italic' : 'bg-stone-900 text-white border-stone-900 group-hover:bg-[#a9b897]'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="pt-12 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <p>TOTS OS v6.7.1 • Analytics Module</p>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <p className="font-mono">UPTIME: {Math.floor(systemUptime/60)}M {systemUptime%60}S</p>
          </div>
          <div className="flex gap-8">
            <button className="hover:text-stone-900">Security Node</button>
            <button className="hover:text-stone-900">Audit Logs</button>
          </div>
        </footer>
      </div>

      {/* --- MODAL ENGINE (REDUCED) --- */}
      <AnimatePresence>
        {activeModal === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[9000] flex justify-center items-center p-6" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#fcfbf9] w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 bg-white rounded-full hover:bg-stone-900 hover:text-white shadow-sm transition-all"><X size={18}/></button>
                
                <div className="text-left space-y-2 mb-10">
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897]">Audit Protocol</p>
                  <h3 className="text-4xl font-serif italic tracking-tighter">Fiscal Record</h3>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2rem] border border-stone-100 space-y-6 text-left">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-6">
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Aggregated Revenue</p>
                      <p className="text-2xl font-mono font-bold tracking-tighter">£{metrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-50 pb-6">
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Tax Reserve</p>
                      <p className="text-2xl font-mono font-bold text-red-500 tracking-tighter">-£{metrics.taxReserve.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-[12px] font-black uppercase text-stone-900 tracking-widest">Net Surplus</p>
                      <p className="text-5xl font-mono font-bold text-[#a9b897] tracking-tighter">£{metrics.netMargin.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => triggerNotify("Exporting Audit...")} className="flex items-center justify-center gap-4 py-6 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">
                      <Download size={18} /> Export PDF
                    </button>
                    <button className="flex items-center justify-center gap-4 py-6 bg-white text-stone-400 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-stone-900 transition-all">
                      <Eye size={18} /> View Ledger
                    </button>
                  </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}