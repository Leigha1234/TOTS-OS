"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  FileText, ShieldAlert, FileDigit, Award, Download, Eye, X, 
  TrendingUp, BarChart3, ShieldCheck, Check, Calculator, 
  PieChart, Search, ArrowUpRight, ArrowDownRight, Landmark, 
  Receipt, Briefcase, Settings, Calendar, ChevronRight, 
  Filter, MoreHorizontal, Layers, Wallet, Building2, 
  FileSpreadsheet, Activity, TrendingDown, Target, History
} from "lucide-react";

export default function FinanceReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- STATE ---
  const [reportRange, setReportRange] = useState("Q2 2026");
  const [activeTab, setActiveTab] = useState<'ledger' | 'insights' | 'tax'>('ledger');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // --- MOCK DATA FOR INSIGHTS ---
  const performanceData = [
    { label: "Revenue Growth", value: "+12.4%", status: "up" },
    { label: "Burn Rate", value: "-2.1%", status: "down" },
    { label: "Projected Tax", value: "£22,400", status: "neutral" },
    { label: "Net Margin", value: "64%", status: "up" },
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12">
      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- NAVIGATION & HEADER --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Audit & Analytics</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Ledger & Insights</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button onClick={() => router.push('/finances')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Operations</button>
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">Finance Reports</button>
            <button onClick={() => router.push('/hr')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">HR</button>
          </nav>
        </header>

        {/* --- EXECUTIVE SUMMARY METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceData.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-4"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-mono tracking-tighter">{stat.value}</h3>
                {stat.status === 'up' && <ArrowUpRight className="text-green-500 mb-1" size={20} />}
                {stat.status === 'down' && <ArrowDownRight className="text-red-500 mb-1" size={20} />}
              </div>
            </motion.div>
          ))}
        </section>

        {/* --- MAIN REPORTING ENGINE --- */}
        <section className="bg-white rounded-[4rem] border border-stone-100 shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row border-b border-stone-100">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-80 bg-stone-50/50 p-10 space-y-8 border-r border-stone-100">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Timeframe</p>
                <select 
                  value={reportRange}
                  onChange={(e) => setReportRange(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl p-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-stone-900"
                >
                  <option>Q1 2026</option>
                  <option>Q2 2026</option>
                  <option>Full Year 2025</option>
                </select>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reports</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setActiveTab('ledger')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-stone-900 text-white shadow-lg' : 'hover:bg-stone-100 text-stone-500'}`}>
                    <Layers size={14}/> General Ledger
                  </button>
                  <button onClick={() => setActiveTab('insights')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-stone-900 text-white shadow-lg' : 'hover:bg-stone-100 text-stone-500'}`}>
                    <BarChart3 size={14}/> Insights
                  </button>
                  <button onClick={() => setActiveTab('tax')} className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tax' ? 'bg-stone-900 text-white shadow-lg' : 'hover:bg-stone-100 text-stone-500'}`}>
                    <Calculator size={14}/> Tax Forecast
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-stone-200">
                 <button 
                  onClick={() => { setIsExporting(true); setTimeout(() => setIsExporting(false), 2000); }}
                  className="w-full py-5 bg-[#a9b897] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-[#a9b897]/20 hover:brightness-105 transition-all"
                 >
                   {isExporting ? <Loader2 className="animate-spin" size={14}/> : <FileSpreadsheet size={16}/>}
                   Export CSV
                 </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-12 lg:p-20">
              <AnimatePresence mode="wait">
                {activeTab === 'ledger' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <h2 className="text-5xl font-serif italic tracking-tighter">General Ledger</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Financial record of all node transactions for {reportRange}</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                        <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Total Liquid Position</p>
                        <p className="text-2xl font-mono">£107,360.50</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Mock Ledger Rows */}
                      {[
                        { date: '2026-05-01', desc: 'Aperture Labs - Invoice #101', cat: 'Revenue', val: '+ £14,200.00', type: 'credit' },
                        { date: '2026-04-28', desc: 'ServerSpace Inc - Infrastructure', cat: 'Fixed Cost', val: '- £850.00', type: 'debit' },
                        { date: '2026-04-20', desc: 'HMRC - VAT Payment Q1', cat: 'Taxation', val: '- £4,210.00', type: 'debit' },
                        { date: '2026-04-01', desc: 'Tyrell Corp - Retainer', cat: 'Revenue', val: '+ £22,000.00', type: 'credit' },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-2xl border border-stone-100 hover:border-stone-300 transition-all group">
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-mono text-stone-400">{row.date}</span>
                            <div>
                              <p className="text-sm font-bold text-stone-800 tracking-tight">{row.desc}</p>
                              <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{row.cat}</span>
                            </div>
                          </div>
                          <span className={`font-mono text-sm font-bold ${row.type === 'credit' ? 'text-[#a9b897]' : 'text-stone-400'}`}>
                            {row.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'insights' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] space-y-8 relative overflow-hidden">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Margin Analytics</h4>
                       <div className="space-y-6">
                          <div className="flex justify-between items-end border-b border-stone-800 pb-6">
                            <p className="text-5xl font-mono tracking-tighter">68.2%</p>
                            <span className="text-[9px] font-black uppercase text-[#a9b897]">Efficiency Peak</span>
                          </div>
                          <p className="text-sm font-serif italic text-stone-400 leading-relaxed">Profit margins have increased by 4% since previous quarter due to operational optimization.</p>
                       </div>
                       <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897] opacity-20 blur-3xl" />
                    </div>

                    <div className="border border-stone-100 p-12 rounded-[3.5rem] space-y-8">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Burn Forecast</h4>
                       <div className="h-40 flex items-end gap-3 pb-4">
                          {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ height: 0 }} 
                              animate={{ height: `${h}%` }} 
                              className="flex-1 bg-stone-100 rounded-t-lg group relative hover:bg-[#a9b897] transition-all cursor-pointer"
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[8px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">£{h * 100}</div>
                            </motion.div>
                          ))}
                       </div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 text-center">Projected Spending (7-Day Cycle)</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tax' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                     <div className="space-y-2">
                        <h2 className="text-5xl font-serif italic tracking-tighter">Tax Liability Engine</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Automated calculation of estimated corporate tax & VAT pool</p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                         <div className="p-10 bg-white border border-stone-200 rounded-[2.5rem] space-y-4">
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Corporation Tax (19%)</p>
                            <p className="text-4xl font-mono tracking-tighter">£18,420</p>
                         </div>
                         <div className="p-10 bg-white border border-stone-200 rounded-[2.5rem] space-y-4">
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">VAT Due</p>
                            <p className="text-4xl font-mono tracking-tighter">£4,210</p>
                         </div>
                         <div className="p-10 bg-stone-900 text-white rounded-[2.5rem] space-y-4 shadow-xl">
                            <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Total Liability</p>
                            <p className="text-4xl font-mono tracking-tighter text-[#a9b897]">£22,630</p>
                         </div>
                      </div>

                      <div className="p-12 bg-stone-50 rounded-[3.5rem] border border-stone-100 flex items-center gap-10">
                        <div className="p-6 bg-white rounded-3xl"><ShieldCheck size={32} className="text-[#a9b897]"/></div>
                        <div className="space-y-2">
                           <h5 className="text-lg font-bold uppercase tracking-tight">Tax Reserve Recommendation</h5>
                           <p className="text-sm text-stone-500 leading-relaxed">Your currently held reserves (£18,500) cover 82% of projected liabilities. We recommend a further transfer of <strong>£4,130</strong> to the reserve account to maintain compliance.</p>
                        </div>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

      </div>

      {/* Internal Component: Loader for Export */}
      {isExporting && (
        <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-[300] flex items-center justify-center">
           <div className="bg-white p-8 rounded-3xl shadow-2xl flex items-center gap-4">
              <Loader2 className="animate-spin text-[#a9b897]" size={20}/>
              <p className="text-[10px] font-black uppercase tracking-widest">Generating Ledger CSV...</p>
           </div>
        </div>
      )}
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <Activity className={className} size={size} />;
}