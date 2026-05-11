"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, TrendingUp, Download, 
  FileSpreadsheet, Printer, Share2,
  Check, Activity, Calculator, AlertCircle, Loader2,
  ChevronRight, ArrowUpRight
} from "lucide-react";

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- DATABASE DATA ---
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    burnRate: 8200, 
    receivables: 0,
    taxRate: 19
  });

  // --- UI STATE ---
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
    calculateFinancials();
  }, []);

  async function calculateFinancials() {
    try {
      setIsLoading(true);
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = timesheets?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      const calculatedReceivables = totalHours * 85;

      setMetrics(prev => ({
        ...prev,
        receivables: calculatedReceivables,
        totalRevenue: calculatedReceivables * 1.2 
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-4 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-8 md:space-y-16">
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-6 md:p-10 rounded-[3rem] border border-stone-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Analytics Engine v5.2.4</p>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter">Finance Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => notify("Generating Master Ledger...")} className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl hover:bg-[#a9b897] transition-all shadow-xl group">
              <Printer size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Print Audit</span>
            </button>

            <div className="h-10 w-[1px] bg-stone-100 mx-2 hidden xl:block" />

            <nav className="flex bg-stone-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
              {['Payments', 'Reports', 'HR', 'Timesheets'].map((item) => (
                <button 
                  key={item}
                  onClick={() => item !== 'Reports' && router.push(`/${item === 'Reports' ? 'finance-reports' : item.toLowerCase()}`)}
                  className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${
                    item === 'Reports' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Connection Error: {error}</p>
          </div>
        )}

        {/* --- KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="z-10 space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Total Revenue (YTD)</p>
                <ArrowUpRight size={22} className="text-[#a9b897]" />
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-mono tracking-tighter leading-none text-[#a9b897] truncate">
                £{(metrics.totalRevenue / 1000).toFixed(1)}k
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Live DB Feed</span>
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between min-h-[300px] shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Operating Overhead</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-mono tracking-tighter leading-none text-stone-800 truncate">
              £{metrics.burnRate.toLocaleString()}
            </h2>
            <div className="pt-4 border-t border-stone-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Monthly static burn</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between min-h-[300px] shadow-sm overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Accounts Receivable</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-mono tracking-tighter leading-none text-stone-800 truncate">
              £{metrics.receivables.toLocaleString()}
            </h2>
            <div className="w-full bg-stone-50 h-2 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="bg-[#a9b897] h-full" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between min-h-[300px] border-b-8 border-b-stone-900 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Effective Tax Rate</p>
            <h2 className="text-[clamp(3rem,5vw,5rem)] font-mono tracking-tighter leading-none text-stone-900">{metrics.taxRate}%</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">Optimized v4.0</p>
          </div>
        </section>

        {/* --- PERFORMANCE INSIGHTS & DOCUMENT HUB --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[4rem] p-8 md:p-12 space-y-12 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="space-y-2">
                <h4 className="text-3xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Timesheet volume conversion</p>
              </div>
              <div className="flex bg-stone-50 p-1.5 rounded-xl border border-stone-100">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-5 py-2 rounded-lg text-[8px] font-black tracking-widest transition-all ${t === '1Y' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-72 flex items-end gap-2 md:gap-4 px-2">
              {[45, 60, 40, 85, 70, 95, 80, 55, 90, 100, 75, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05 }}
                    className="w-full bg-stone-50 rounded-t-xl group-hover:bg-[#a9b897] transition-all relative border border-stone-100"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-stone-900 text-white text-[8px] px-3 py-1.5 rounded-full shadow-xl whitespace-nowrap z-20">£{val}k</div>
                  </motion.div>
                  <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 rounded-[4rem] p-10 md:p-12 text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="space-y-10 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Document Hub</p>
              <div className="space-y-3">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet },
                  { label: 'Tax Projection', icon: Calculator },
                  { label: 'Share Access', icon: Share2 },
                ].map((btn, i) => (
                  <button key={i} onClick={() => notify(`Exporting ${btn.label}...`)} className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <btn.icon size={18} className="text-stone-500 group-hover:text-[#a9b897] transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                    </div>
                    <Download size={14} className="text-stone-700" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-white/5">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-600 italic">Financial Node Restricted</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897]/5 rounded-full blur-3xl" />
          </div>
        </section>

        {/* --- AUDIT TRAIL --- */}
        <section className="bg-white border border-stone-200 rounded-[4rem] overflow-hidden shadow-sm">
           <div className="p-10 border-b border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BarChart3 className="text-[#a9b897]" size={24} />
                <h4 className="text-3xl font-serif italic tracking-tighter">Audit Trail</h4>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 flex items-center gap-2 transition-colors">View Full Archive <ChevronRight size={14}/></button>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-12 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Report Reference</th>
                  <th className="px-12 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Period</th>
                  <th className="px-12 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 text-right pr-16">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', status: 'Certified' },
                  { name: 'VAT Reconciliation', period: 'Q1 2026', status: 'Filed' },
                  { name: 'R&D Tax Submission', period: 'FY 2025', status: 'Pending' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50/30 transition-colors cursor-pointer">
                    <td className="px-12 py-8">
                      <span className="text-sm font-bold text-stone-800 group-hover:text-[#a9b897] transition-colors">{row.name}</span>
                    </td>
                    <td className="px-12 py-8 text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono">{row.period}</td>
                    <td className="px-12 py-8 text-right pr-16">
                      <span className={`px-5 py-2 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm border ${row.status === 'Pending' ? 'bg-stone-50 text-stone-400 border-stone-100' : 'bg-stone-900 text-white border-stone-900'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}