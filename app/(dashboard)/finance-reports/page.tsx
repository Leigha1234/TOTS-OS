"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  BarChart3, PieChart, TrendingUp, Download, Calendar, 
  Filter, ChevronRight, FileSpreadsheet, Printer, Share2,
  ArrowUpRight, ArrowDownRight, Landmark, X, Check,
  Activity, Globe, ShieldCheck, Briefcase, Calculator
} from "lucide-react";

/**
 * FINANCE REPORTS CORE - v5.0.0
 * Analytical specialized view with standardized layout
 */

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI STATE ---
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("Q2 2026");

  useEffect(() => { setIsMounted(true); }, []);

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const handleExport = (format: string) => {
    notify(`Generating ${format} report...`);
    setTimeout(() => notify(`${format} Export Complete`), 1500);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* Notifications */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- HEADER & NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Analytics Engine v5.0</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Reports</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button onClick={() => router.push('/payments')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Payments</button>
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">Reports</button>
            <button onClick={() => router.push('/hr')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">HR</button>
            <button onClick={() => router.push('/timesheets')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Timesheets</button>
          </nav>
        </header>

        {/* --- REPORT CONTROLS GRID --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            { label: 'P&L Statement', icon: FileSpreadsheet, action: () => handleExport('P&L') },
            { label: 'Tax Projection', icon: Calculator, action: () => handleExport('Tax') },
            { label: 'Cash Flow', icon: TrendingUp, action: () => handleExport('Cashflow') },
            { label: 'Client PDF', icon: Printer, action: () => handleExport('Print') },
            { label: 'Share Access', icon: Share2, action: () => notify('Access link copied to clipboard') },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              className="flex flex-col items-center justify-center gap-5 p-8 bg-white border border-stone-200 rounded-[2.8rem] hover:border-[#a9b897] hover:shadow-2xl transition-all group active:scale-95 shadow-sm min-h-[160px]"
            >
              <btn.icon size={22} className="text-stone-400 group-hover:text-[#a9b897] group-hover:scale-110 transition-all" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-500 text-center">{btn.label}</span>
            </button>
          ))}
        </section>

        {/* --- ANALYTICAL KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">EBITDA Projection</p>
              <h2 className="text-6xl font-mono tracking-tighter text-[#a9b897]">£108.4k</h2>
            </div>
            <div className="flex items-center gap-2 text-[#a9b897]">
              <TrendingUp size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">+12.4% vs Q1</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Burn Rate (Avg)</p>
            <h2 className="text-6xl font-mono tracking-tighter">£8.2k</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Monthly operating overhead</p>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Accounts Receivable</p>
            <h2 className="text-6xl font-mono tracking-tighter">£34.9k</h2>
            <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
              <div className="bg-[#a9b897] h-full w-[65%]" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Effective Tax Rate</p>
            <h2 className="text-6xl font-mono tracking-tighter">19%</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">Optimized via R&D credits</p>
          </div>
        </section>

        {/* --- PERFORMANCE INSIGHTS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Breakdown */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-[3.5rem] p-12 space-y-10">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <h4 className="text-4xl font-serif italic tracking-tighter">Revenue Attribution</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Monthly performance tracking per sector</p>
              </div>
              <div className="flex bg-stone-50 p-1 rounded-full border border-stone-100">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-4 py-2 rounded-full text-[8px] font-black tracking-widest transition-all ${t === '1Y' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-64 flex items-end gap-4 px-4">
              {[45, 60, 40, 85, 70, 95, 80, 55, 90, 100, 75, 85].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05 }}
                    className="w-full bg-stone-100 rounded-t-xl group-hover:bg-[#a9b897] transition-all relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-[8px] px-2 py-1 rounded">£{val}k</div>
                  </motion.div>
                  <span className="text-[7px] font-black text-stone-300 uppercase">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Module: Sector Concentration */}
          <div className="bg-stone-900 rounded-[3.5rem] p-12 text-white flex flex-col justify-between">
            <div className="space-y-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Sector Distribution</p>
              <div className="space-y-6">
                {[
                  { label: 'Technology', val: '52%', color: 'bg-[#a9b897]' },
                  { label: 'Consulting', val: '28%', color: 'bg-stone-700' },
                  { label: 'R&D Grants', val: '20%', color: 'bg-stone-800' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-stone-500">{item.val}</span>
                    </div>
                    <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full`} style={{ width: item.val }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="w-full py-6 bg-white/5 border border-white/10 rounded-[2rem] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
              View Detailed Audit
            </button>
          </div>
        </section>

        {/* --- RECENT ARCHIVED REPORTS --- */}
        <section className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <h4 className="text-4xl font-serif italic tracking-tighter">Generated Documents</h4>
            <button className="flex items-center gap-3 px-8 py-4 bg-white border border-stone-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:border-stone-900 transition-all">
              <Filter size={14} /> Filter by Year
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Report Name</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Period</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Status</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  { name: 'Annual Corporation Tax Summary', period: 'FY 2025-26', status: 'Certified' },
                  { name: 'Quarterly VAT Reconciliation', period: 'Q1 2026', status: 'Filed' },
                  { name: 'R&D Tax Credit Submission', period: 'FY 2025', status: 'Pending' }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-stone-50 rounded-lg"><FileSpreadsheet size={14} className="text-stone-400"/></div>
                        <span className="text-xs font-bold text-stone-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-[10px] font-black uppercase text-stone-400 tracking-widest">{row.period}</td>
                    <td className="px-12 py-10">
                      <span className="px-3 py-1 bg-stone-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">{row.status}</span>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <button onClick={() => notify('Downloading PDF...')} className="text-stone-400 hover:text-stone-900 transition-colors">
                        <Download size={18} />
                      </button>
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