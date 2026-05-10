"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  BarChart3, TrendingUp, Download, 
  FileSpreadsheet, Printer, Share2,
  Check, Activity, Calculator, AlertCircle, Loader2
} from "lucide-react";

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- DATABASE DATA ---
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    burnRate: 8200, // Standard overhead
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
      // Actual Data Fetch: Summing hours from timesheets to calculate receivables
      const { data: timesheets, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = timesheets?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      // Logic: £85 hourly rate * total hours in DB
      const calculatedReceivables = totalHours * 85;

      setMetrics(prev => ({
        ...prev,
        receivables: calculatedReceivables,
        totalRevenue: calculatedReceivables * 1.2 // Mock logic for demo
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Analytics Engine v5.2</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-tight">Finance Reports</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm overflow-hidden">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((item) => (
              <button 
                key={item}
                onClick={() => item !== 'Reports' && router.push(`/${item.toLowerCase()}`)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  item === 'Reports' ? "bg-stone-900 text-white shadow-xl" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Connection Error: {error}</p>
          </div>
        )}

        {/* --- KPI METRICS (FIXED SCALING) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 min-w-0">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Total Revenue (YTD)</p>
              <h2 className="text-4xl md:text-5xl xl:text-6xl font-mono tracking-tighter text-[#a9b897] truncate">
                £{(metrics.totalRevenue / 1000).toFixed(1)}k
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[#a9b897]">
              <TrendingUp size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Live DB Feed</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 min-w-0 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Operating Overhead</p>
            <h2 className="text-4xl md:text-6xl font-mono tracking-tighter truncate">£{metrics.burnRate.toLocaleString()}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Standard monthly burn</p>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 min-w-0 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Accounts Receivable</p>
            <h2 className="text-4xl md:text-6xl font-mono tracking-tighter truncate text-stone-800">
              £{metrics.receivables.toLocaleString()}
            </h2>
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="bg-[#a9b897] h-full" 
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Effective Tax Rate</p>
            <h2 className="text-6xl font-mono tracking-tighter">{metrics.taxRate}%</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">Optimized via R&D credits</p>
          </div>
        </section>

        {/* --- PERFORMANCE INSIGHTS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[3.5rem] p-10 md:p-12 space-y-10 shadow-sm min-w-0">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div className="space-y-2 min-w-0">
                <h4 className="text-3xl md:text-4xl font-serif italic tracking-tighter truncate">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Real-time timesheet conversion</p>
              </div>
              <div className="flex bg-stone-50 p-1.5 rounded-full border border-stone-100">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-5 py-2 rounded-full text-[8px] font-black tracking-widest transition-all ${t === '1Y' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-end gap-2 md:gap-4 px-2 overflow-hidden">
              {[45, 60, 40, 85, 70, 95, 80, 55, 90, 100, 75, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05 }}
                    className="w-full bg-stone-100 rounded-t-xl group-hover:bg-[#a9b897] transition-all relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[8px] px-2 py-1 rounded shadow-xl">£{val}k</div>
                  </motion.div>
                  <span className="text-[7px] font-black text-stone-300 uppercase">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Controls Section */}
          <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-xl">
            <div className="space-y-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Report Generation</p>
              <div className="space-y-4">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet },
                  { label: 'Tax Projection', icon: Calculator },
                  { label: 'Share Access', icon: Share2 },
                ].map((btn, i) => (
                  <button 
                    key={i}
                    onClick={() => notify(`Exporting ${btn.label}...`)}
                    className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <btn.icon size={18} className="text-stone-500 group-hover:text-[#a9b897]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                    </div>
                    <Download size={14} className="text-stone-700" />
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-600 text-center mt-8 italic">Certified Data Node</p>
          </div>
        </section>

        {/* --- RECENT ARCHIVED REPORTS --- */}
        <section className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
           <div className="p-10 border-b border-stone-50">
              <h4 className="text-3xl font-serif italic tracking-tighter">Audit Trail</h4>
           </div>
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-12 py-6 text-[10px] font-black uppercase text-stone-400">Report Identity</th>
                  <th className="px-12 py-6 text-[10px] font-black uppercase text-stone-400">Period</th>
                  <th className="px-12 py-6 text-[10px] font-black uppercase text-stone-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', status: 'Certified' },
                  { name: 'VAT Reconciliation', period: 'Q1 2026', status: 'Filed' },
                  { name: 'R&D Tax Submission', period: 'FY 2025', status: 'Pending' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-12 py-8">
                      <span className="text-xs font-bold text-stone-800">{row.name}</span>
                    </td>
                    <td className="px-12 py-8 text-[10px] font-black uppercase text-stone-400 tracking-widest">{row.period}</td>
                    <td className="px-12 py-8 text-right">
                      <span className="px-4 py-1.5 bg-stone-100 text-stone-600 text-[8px] font-black uppercase tracking-widest rounded-full">{row.status}</span>
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