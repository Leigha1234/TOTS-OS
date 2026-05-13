"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, Download, 
  FileSpreadsheet, Printer, Share2,
  Calculator, AlertCircle, Loader2,
  ChevronRight, Fingerprint, TrendingDown,
  PieChart, ShieldCheck, Zap, X, Eye, FileText, Terminal,
  Cpu, Lock, Globe, Activity, ArrowUpRight, History
} from "lucide-react";

/**
 * TOTS OS v6.7.0 - FINANCE ANALYTICS NODE
 * REVISION: DUAL-MODAL ARCHITECTURE | DYNAMIC AUDIT SYNC
 */

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemUptime, setSystemUptime] = useState(0);
  const router = useRouter();

  // --- FINANCIAL STATE ---
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
      setError("Signal Disruption: Unable to sync financial nodes.");
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
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white pb-20">
      
      {/* HUD NOTIFICATION */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10">
            <Zap size={16} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-20 space-y-24">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-stone-900 text-[#a9b897] rounded-[1.5rem] shadow-2xl"><BarChart3 size={28} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-400">FINANCIAL_ANALYTICS_6.7</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-400 tracking-widest uppercase">Node Synchronized [{systemUptime}s]</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl md:text-[10rem] font-serif italic tracking-tighter leading-[0.85]">Finance Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex items-center bg-stone-100 p-2 rounded-[2.5rem]">
              {['Dashboard', 'Payments', 'Reports', 'HR'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Reports' && router.push(`/${path === 'Dashboard' ? '' : path.toLowerCase()}`)}
                  className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all rounded-[2rem] ${
                    path === 'Reports' ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900"
                  }`}
                >
                  {path}
                </button>
              ))}
            </nav>
            <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-10 py-6 rounded-[2.5rem] flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl group active:scale-95">
              <Printer size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Full Audit Protocol</span>
            </button>
          </div>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-10 rounded-[3rem] flex items-center gap-6 text-red-600">
            <AlertCircle size={24} />
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">{error}</p>
          </motion.div>
        )}

        {/* KPI INTELLIGENCE GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[380px] relative overflow-hidden group">
            <div className="z-10 space-y-10 text-left">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-500">Projected Net Margin</p>
                <div className="bg-[#a9b897]/10 p-5 rounded-3xl text-[#a9b897]"><ShieldCheck size={26} /></div>
              </div>
              <h2 className="text-7xl font-mono tracking-tighter text-[#a9b897] leading-none">
                £{(metrics.netMargin / 1000).toFixed(1)}k
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-500 italic">Fiscal Safety</span>
              <div className="flex items-center gap-3">
                <p className="text-[9px] font-mono text-[#a9b897]">STABLE</p>
                <div className="w-2.5 h-2.5 rounded-full bg-[#a9b897] animate-pulse" />
              </div>
            </div>
            <Cpu size={180} className="absolute -right-10 -top-10 opacity-[0.03] pointer-events-none" />
          </div>

          {[
            { label: 'Operating Burn', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Monthly Operational Overhead', icon: <TrendingDown size={24}/> },
            { label: 'Tax Provision', val: `£${metrics.taxReserve.toLocaleString()}`, sub: '19% Statutory Liability', icon: <Calculator size={24}/> },
            { label: 'Unallocated Capital', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Pending Receivables', icon: <PieChart size={24}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-12 rounded-[4rem] flex flex-col justify-between min-h-[380px] shadow-sm hover:border-stone-900 transition-all group text-left">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-5 rounded-3xl">{item.icon}</div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-10 border-t border-stone-50 flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">{item.sub}</p>
                <Activity size={12} className="text-stone-200 group-hover:text-[#a9b897] transition-colors" />
              </div>
            </div>
          ))}
        </section>

        {/* ANALYTICS & SECURE EXPORT */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-white border border-stone-100 rounded-[5rem] p-12 md:p-20 space-y-16 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-10 relative z-10">
              <div className="space-y-4 text-left w-full">
                <h4 className="text-6xl font-serif italic tracking-tighter leading-none">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300 italic">Annual Capital Velocity Log</p>
              </div>
              <div className="flex bg-stone-50 p-2.5 rounded-[2.5rem] border border-stone-100">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-12 py-4 rounded-[2rem] text-[10px] font-black tracking-[0.3em] transition-all uppercase ${t === '1Y' ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-[450px] flex items-end gap-4 md:gap-10 px-4 relative z-10">
              {[40, 55, 30, 75, 65, 90, 85, 50, 95, 100, 70, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-8 group/bar h-full justify-end">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05, duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full bg-stone-50 rounded-[2rem] group-hover/bar:bg-stone-900 transition-all relative border border-stone-100 group-hover/bar:border-transparent group-hover/bar:shadow-2xl"
                  >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-stone-900 text-[#a9b897] text-[10px] px-6 py-4 rounded-2xl shadow-2xl z-20 font-mono font-bold">£{val}k</div>
                  </motion.div>
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest font-mono">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-stone-900 rounded-[5rem] p-14 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="space-y-12 relative z-10 text-left">
              <div className="flex items-center gap-4 text-stone-500">
                <Cpu size={18} />
                <p className="text-[11px] font-black uppercase tracking-[0.5em]">Secure Export Node</p>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet, sub: 'XLS / CSV Data Hub' },
                  { label: 'Tax Projection', icon: Calculator, sub: 'Q2 Directive Summary' },
                  { label: 'Stakeholder Portal', icon: Share2, sub: 'Remote Access Link' },
                ].map((btn, i) => (
                  <button 
                    key={i} 
                    onClick={() => triggerNotify(`Synthesizing ${btn.label}...`)} 
                    className="w-full flex items-center justify-between p-12 bg-white/5 border border-white/10 rounded-[3.5rem] hover:bg-white/10 transition-all group/btn active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center group-hover/btn:bg-[#a9b897]/20 group-hover/btn:text-[#a9b897] transition-all">
                        <btn.icon size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-[12px] font-black uppercase tracking-widest">{btn.label}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600 group-hover/btn:text-stone-400 mt-1">{btn.sub}</p>
                      </div>
                    </div>
                    <Download size={20} className="text-stone-700 group-hover/btn:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-12 border-t border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <Activity size={18} className="text-[#a9b897]" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-600">Restricted Stream</p>
              </div>
              <Lock size={14} className="text-stone-700" />
            </div>
            <Globe size={300} className="absolute -right-20 -bottom-20 opacity-[0.03] pointer-events-none" />
          </div>
        </section>

        {/* AUDIT TRAIL LEDGER */}
        <section className="bg-white border border-stone-100 rounded-[5rem] overflow-hidden shadow-sm hover:border-stone-900 transition-all duration-1000">
           <div className="p-16 md:p-24 border-b border-stone-50 flex flex-col lg:flex-row items-center justify-between gap-12 text-left">
              <div className="flex items-center gap-12">
                <div className="w-24 h-24 bg-stone-50 rounded-[2.5rem] flex items-center justify-center text-[#a9b897] shadow-inner">
                  <ShieldCheck size={42} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-6xl font-serif italic tracking-tighter">Network Audit Trail</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300 italic">Verified System Records & Certification Feed</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('audit')} className="bg-stone-900 text-white px-12 py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-stone-800 flex items-center gap-5 transition-all active:scale-95">
                Full Audit Profile <ArrowUpRight size={18}/>
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/50">
                  {['Document Reference', 'Filing Period', 'Certification Node', 'Status'].map(h => (
                    <th key={h} className="px-20 py-12 text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', cert: 'Director Authority Node', status: 'Certified' },
                  { name: 'VAT Reconciliation Hub', period: 'Q1 2026', cert: 'Gov.Connect Sync', status: 'Filed' },
                  { name: 'Strategic R&D Submission', period: 'FY 2025', cert: 'External Network Audit', status: 'In Review' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50/40 transition-all cursor-pointer" onClick={() => setActiveModal('audit')}>
                    <td className="px-20 py-16">
                      <div className="flex items-center gap-8">
                        <FileText size={22} className="text-stone-200 group-hover:text-[#a9b897] transition-colors" />
                        <span className="text-2xl font-bold text-stone-800 tracking-tight group-hover:text-stone-900 transition-colors">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-20 py-16 text-[12px] font-black uppercase text-stone-400 tracking-[0.4em] font-mono italic">{row.period}</td>
                    <td className="px-20 py-16 text-[12px] font-black uppercase text-stone-600 tracking-[0.3em]">{row.cert}</td>
                    <td className="px-20 py-16">
                      <span className={`px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border shadow-sm transition-all ${row.status === 'In Review' ? 'bg-white text-stone-400 border-stone-100 italic' : 'bg-stone-900 text-white border-stone-900 group-hover:bg-[#a9b897]'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-20 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-12 text-stone-300 pb-12">
          <div className="flex items-center gap-8">
            <p className="text-[11px] font-black uppercase tracking-[0.5em]">TOTS OS v6.7.0 • Analytics Module</p>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
            <p className="text-[11px] font-mono tracking-widest text-stone-400 uppercase">System Uptime: {Math.floor(systemUptime/60)}M {systemUptime%60}S</p>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-stone-400">
            <button className="hover:text-stone-900 transition-all">Audit Logs</button>
            <button className="hover:text-stone-900 transition-all">Security Node</button>
          </div>
        </footer>
      </div>

      {/* MODAL ENGINE */}
      <AnimatePresence>
        {activeModal === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-stone-900/80 backdrop-blur-3xl z-[9000] flex justify-center items-center p-8" onClick={() => setActiveModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#fcfbf9] w-full max-w-4xl rounded-[4rem] p-16 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveModal(null)} className="absolute top-12 right-12 p-5 bg-white rounded-full hover:bg-stone-900 hover:text-white transition-all shadow-sm"><X size={24}/></button>
                
                <div className="text-left space-y-4 mb-16">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">System Audit Protocol</p>
                  <h3 className="text-6xl font-serif italic tracking-tighter leading-none">Fiscal Record</h3>
                </div>

                <div className="space-y-12">
                  <div className="bg-white p-12 rounded-[4rem] border border-stone-100 space-y-10 shadow-sm text-left">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-10">
                      <p className="text-[14px] font-black uppercase text-stone-400 tracking-[0.4em]">Aggregated Revenue</p>
                      <p className="text-3xl font-mono font-bold tracking-tighter">£{metrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center border-b border-stone-50 pb-10">
                      <p className="text-[14px] font-black uppercase text-stone-400 tracking-[0.4em]">Tax Reserve (19%)</p>
                      <p className="text-3xl font-mono font-bold text-red-500 tracking-tighter">-£{metrics.taxReserve.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <p className="text-[16px] font-black uppercase text-stone-900 tracking-[0.6em]">Net Surplus</p>
                      <p className="text-6xl font-mono font-bold text-[#a9b897] tracking-tighter">£{metrics.netMargin.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <button onClick={() => triggerNotify("Compiling PDF Audit...")} className="flex items-center justify-center gap-6 py-10 bg-stone-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] hover:bg-[#a9b897] transition-all shadow-2xl">
                      <Download size={22} /> Export Audit PDF
                    </button>
                    <button className="flex items-center justify-center gap-6 py-10 bg-white text-stone-400 border border-stone-100 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] hover:text-stone-900 transition-all">
                      <Eye size={22} /> View Secure Ledger
                    </button>
                  </div>

                  <div className="p-10 border border-[#a9b897]/20 bg-[#a9b897]/5 rounded-[3rem] relative overflow-hidden">
                    <Terminal size={60} className="absolute -right-4 -bottom-4 text-[#a9b897]/10" />
                    <p className="text-[11px] font-black uppercase text-[#a9b897] tracking-widest leading-loose text-center relative z-10">
                      TOTS OS AUTOMATED AUDIT ENGINE <br/>
                      STAMP: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
        ::selection { background: #a9b897; color: white; }
      `}</style>
    </div>
  );
}