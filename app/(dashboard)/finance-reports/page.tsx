"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, Download, 
  FileSpreadsheet, Printer, Share2,
  Check, Activity, Calculator, AlertCircle, Loader2,
  ChevronRight, ArrowUpRight, Fingerprint, TrendingDown,
  PieChart, ShieldCheck, Zap
} from "lucide-react";

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- FINANCIAL INTELLIGENCE STATE ---
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    burnRate: 8200, 
    receivables: 0,
    taxRate: 19,
    netMargin: 0,
    taxReserve: 0
  });

  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
    calculateFinancials();
  }, []);

  async function calculateFinancials() {
    try {
      setIsLoading(true);
      // Fetching all approved hours for calculation
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = timesheets?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      const billable = totalHours * 85;
      const taxAmount = billable * 0.19;

      setMetrics({
        totalRevenue: billable,
        receivables: billable * 0.4, // Simulating 40% outstanding
        burnRate: 8200,
        taxRate: 19,
        taxReserve: taxAmount,
        netMargin: billable - taxAmount - 8200
      });

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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- SYSTEM NOTIFICATION --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Zap size={14} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-12">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Analytics Engine v5.2.4</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter">Finance Reports</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => notify("Generating Audit PDF...")}
              className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 hover:bg-[#a9b897] transition-all shadow-xl"
            >
              <Printer size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Master Audit</span>
            </button>
            <nav className="flex items-center bg-[#c8d3b9] p-1.5 rounded-full shadow-inner">
              {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Reports' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                  className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                    path === 'Reports' ? "bg-white text-stone-900 shadow-lg scale-105" : "text-white hover:text-stone-800"
                  }`}
                >
                  {path}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        {/* --- KPI INTELLIGENCE GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Primary Metric: Profit */}
          <div className="bg-stone-900 text-white p-10 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[320px] relative overflow-hidden group">
            <div className="z-10 space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Net Margin (Est.)</p>
                <div className="bg-[#a9b897]/20 p-2 rounded-lg">
                  <ShieldCheck size={18} className="text-[#a9b897]" />
                </div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter text-[#a9b897] leading-none">
                £{(metrics.netMargin / 1000).toFixed(1)}k
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-500">Safe Capital Reservoir</span>
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897]/5 rounded-full blur-3xl" />
          </div>

          {[
            { label: 'Operating Burn', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Monthly Overhead', icon: <TrendingDown size={14}/> },
            { label: 'Tax Provision', val: `£${metrics.taxReserve.toLocaleString()}`, sub: '19% Corp Tax Liability', icon: <Calculator size={14}/> },
            { label: 'Accounts Receivable', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Unallocated Capital', icon: <PieChart size={14}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-10 rounded-[4rem] flex flex-col justify-between min-h-[320px] shadow-sm hover:border-stone-900 transition-all group">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors">{item.icon}</div>
              </div>
              <h2 className="text-5xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-6 border-t border-stone-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* --- VISUAL ANALYTICS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white border border-stone-100 rounded-[4rem] p-10 md:p-14 space-y-12 shadow-sm relative group overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-4xl font-serif italic tracking-tighter leading-none">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time-to-Capital Velocity</p>
              </div>
              <div className="flex bg-stone-50 p-1.5 rounded-full border border-stone-100 shadow-inner">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-8 py-2.5 rounded-full text-[9px] font-black tracking-widest transition-all ${t === '1Y' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-80 flex items-end gap-3 md:gap-6 px-2 relative z-10">
              {[40, 55, 30, 75, 65, 90, 85, 50, 95, 100, 70, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-5 group/bar">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05, duration: 0.8, ease: "circOut" }}
                    className="w-full bg-stone-50 rounded-2xl group-hover/bar:bg-[#a9b897] transition-all relative border border-stone-100 group-hover/bar:border-transparent group-hover/bar:shadow-2xl group-hover/bar:scale-105"
                  >
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-stone-900 text-white text-[10px] px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap z-20 font-mono">£{val}k</div>
                  </motion.div>
                  <span className="text-[9px] font-black text-stone-300 uppercase tracking-tighter group-hover/bar:text-stone-900 transition-colors">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart3 size={200} /></div>
          </div>

          {/* Document Intelligence Hub */}
          <div className="bg-stone-900 rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="space-y-10 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Intelligence Hub</p>
              <div className="space-y-4">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet, sub: 'PDF / CSV' },
                  { label: 'Tax Projection', icon: Calculator, sub: 'Q2 2026' },
                  { label: 'Stakeholder Share', icon: Share2, sub: 'Direct Link' },
                ].map((btn, i) => (
                  <button key={i} onClick={() => notify(`Processing ${btn.label}...`)} className="w-full flex items-center justify-between p-8 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 transition-all group active:scale-95">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#a9b897]/20 group-hover:text-[#a9b897] transition-all">
                        <btn.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest">{btn.label}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-600 group-hover:text-stone-400">{btn.sub}</p>
                      </div>
                    </div>
                    <Download size={18} className="text-stone-800 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex items-center gap-4">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-600">Restricted Data Node</p>
            </div>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#a9b897]/5 rounded-full blur-[100px]" />
          </div>
        </section>

        {/* --- AUDIT TRAIL & FILING --- */}
        <section className="bg-white border border-stone-100 rounded-[4rem] overflow-hidden shadow-sm hover:border-stone-200 transition-all">
           <div className="p-12 md:p-16 border-b border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center text-[#a9b897] shadow-inner">
                  <BarChart3 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-4xl font-serif italic tracking-tighter">Audit Trail</h4>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Official Filing & Certification</p>
                </div>
              </div>
              <button className="bg-stone-50 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 flex items-center gap-4 transition-all shadow-sm">
                View Archive <ChevronRight size={16}/>
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-stone-50/30">
                  {['Report Reference', 'Reporting Period', 'Certified By', 'Status'].map(h => (
                    <th key={h} className="px-16 py-8 text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', cert: 'Director Pulse', status: 'Certified' },
                  { name: 'VAT Reconciliation', period: 'Q1 2026', cert: 'HMRC Hub', status: 'Filed' },
                  { name: 'R&D Tax Submission', period: 'FY 2025', cert: 'Internal Audit', status: 'Pending' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50/30 transition-all cursor-pointer">
                    <td className="px-16 py-12">
                      <span className="text-lg font-bold text-stone-800 group-hover:text-[#a9b897] transition-colors">{row.name}</span>
                    </td>
                    <td className="px-16 py-12 text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono">{row.period}</td>
                    <td className="px-16 py-12 text-[10px] font-black uppercase text-stone-600 tracking-widest italic">{row.cert}</td>
                    <td className="px-16 py-12">
                      <span className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm transition-all ${row.status === 'Pending' ? 'bg-stone-50 text-stone-400 border-stone-100' : 'bg-stone-900 text-white border-stone-900 group-hover:bg-[#a9b897] group-hover:border-[#a9b897]'}`}>{row.status}</span>
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