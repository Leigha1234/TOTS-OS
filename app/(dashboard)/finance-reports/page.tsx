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
  PieChart, ShieldCheck, Zap, X, Eye, FileText
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

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  useEffect(() => {
    setIsMounted(true);
    calculateFinancials();
  }, []);

  async function calculateFinancials() {
    try {
      setIsLoading(true);
      // Logic: Pulling hours to calculate revenue at £85/hr
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
        receivables: billable * 0.4, 
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

  // --- MODAL WRAPPER ---
  const Modal = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[200] flex justify-end"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="bg-white h-full w-full max-w-2xl p-12 md:p-20 shadow-2xl relative overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-12 right-12 p-3 hover:bg-stone-50 rounded-full transition-all text-stone-400">
              <X size={24}/>
            </button>
            <div className="mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-3">Audit Protocol</p>
              <h3 className="text-5xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- SYSTEM NOTIFICATION --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] bg-stone-900 text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-4">
            <Zap size={14} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Analytics Engine v5.2.4</p>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter">Finance Reports</h1>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button 
              onClick={() => setActiveModal('audit')}
              className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] flex items-center gap-4 hover:bg-[#a9b897] transition-all shadow-xl active:scale-95 group"
            >
              <Printer size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Full Audit</span>
            </button>
            <nav className="flex items-center bg-[#c8d3b9] p-2 rounded-full shadow-inner">
              {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Reports' && router.push(path === 'dashboard' ? '/' : `/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                  className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
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
          <div className="bg-red-50 border border-red-100 p-6 rounded-[2.5rem] flex items-center gap-5 text-red-600">
            <AlertCircle size={24} />
            <p className="text-[11px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        {/* --- KPI INTELLIGENCE GRID --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="bg-stone-900 text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-between min-h-[350px] relative overflow-hidden group">
            <div className="z-10 space-y-6">
              <div className="flex justify-between items-start">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Projected Net Margin</p>
                <div className="bg-[#a9b897]/20 p-3 rounded-2xl">
                  <ShieldCheck size={22} className="text-[#a9b897]" />
                </div>
              </div>
              <h2 className="text-7xl font-mono tracking-tighter text-[#a9b897] leading-none">
                £{(metrics.netMargin / 1000).toFixed(1)}k
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 italic">Financial Safety Factor</span>
              <div className="w-3 h-3 rounded-full bg-[#a9b897] animate-pulse shadow-[0_0_15px_rgba(169,184,151,1)]" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#a9b897]/10 rounded-full blur-[80px]" />
          </div>

          {[
            { label: 'Operating Burn', val: `£${metrics.burnRate.toLocaleString()}`, sub: 'Monthly Operational Overhead', icon: <TrendingDown size={18}/> },
            { label: 'Tax Provision', val: `£${metrics.taxReserve.toLocaleString()}`, sub: '19% Corporation Liability', icon: <Calculator size={18}/> },
            { label: 'Unallocated Capital', val: `£${metrics.receivables.toLocaleString()}`, sub: 'Accounts Receivable (40%)', icon: <PieChart size={18}/> },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 p-12 rounded-[4rem] flex flex-col justify-between min-h-[350px] shadow-sm hover:border-stone-900 transition-all group cursor-default">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900 transition-colors bg-stone-50 p-3 rounded-2xl">{item.icon}</div>
              </div>
              <h2 className="text-6xl font-mono tracking-tighter leading-none text-stone-900">{item.val}</h2>
              <div className="pt-8 border-t border-stone-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] italic">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* --- VISUAL ANALYTICS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 bg-white border border-stone-100 rounded-[5rem] p-12 md:p-16 space-y-14 shadow-sm relative group overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-5xl font-serif italic tracking-tighter leading-none">Revenue Attribution</h4>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Annual Capital Velocity Log</p>
              </div>
              <div className="flex bg-stone-50 p-2 rounded-full border border-stone-100 shadow-inner">
                {['6M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-10 py-3.5 rounded-full text-[10px] font-black tracking-[0.2em] transition-all ${t === '1Y' ? 'bg-stone-900 text-white shadow-lg scale-105' : 'text-stone-400 hover:text-stone-900'}`}>{t}</button>
                ))}
              </div>
            </div>
            
            <div className="h-[400px] flex items-end gap-3 md:gap-8 px-4 relative z-10">
              {[40, 55, 30, 75, 65, 90, 85, 50, 95, 100, 70, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-6 group/bar h-full justify-end">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${val}%` }} 
                    transition={{ delay: i * 0.05, duration: 1.2, ease: "circOut" }}
                    className="w-full bg-stone-50 rounded-[1.5rem] group-hover/bar:bg-[#a9b897] transition-all relative border border-stone-100 group-hover/bar:border-transparent group-hover/bar:shadow-2xl group-hover/bar:scale-110"
                  >
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all bg-stone-900 text-white text-[11px] px-5 py-3 rounded-2xl shadow-2xl whitespace-nowrap z-20 font-mono">£{val}k</div>
                  </motion.div>
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter group-hover/bar:text-stone-900 transition-colors font-mono">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 p-20 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity pointer-events-none duration-1000"><BarChart3 size={300} /></div>
          </div>

          {/* Intelligence Hub */}
          <div className="bg-stone-900 rounded-[5rem] p-14 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="space-y-12 relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-600">Secure Export Node</p>
              <div className="space-y-6">
                {[
                  { label: 'P&L Statement', icon: FileSpreadsheet, sub: 'XLS / CSV' },
                  { label: 'Tax Projection', icon: Calculator, sub: 'Q2 Directive' },
                  { label: 'Stakeholder Portal', icon: Share2, sub: 'Remote Access' },
                ].map((btn, i) => (
                  <button 
                    key={i} 
                    onClick={() => notify(`Synthesizing ${btn.label}...`)} 
                    className="w-full flex items-center justify-between p-10 bg-white/5 border border-white/10 rounded-[3rem] hover:bg-white/10 transition-all group/btn active:scale-95"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover/btn:bg-[#a9b897]/20 group-hover/btn:text-[#a9b897] transition-all shadow-inner">
                        <btn.icon size={22} />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-widest">{btn.label}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-600 group-hover/btn:text-stone-400 mt-1">{btn.sub}</p>
                      </div>
                    </div>
                    <Download size={20} className="text-stone-800 group-hover/btn:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-12 border-t border-white/5 flex items-center gap-5">
              <Activity size={18} className="text-[#a9b897]" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-700">Restricted Data Stream</p>
            </div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#a9b897]/5 rounded-full blur-[120px] group-hover:bg-[#a9b897]/10 transition-all duration-1000" />
          </div>
        </section>

        {/* --- AUDIT TRAIL LEDGER --- */}
        <section className="bg-white border border-stone-100 rounded-[5rem] overflow-hidden shadow-sm hover:border-stone-200 transition-all duration-700">
           <div className="p-14 md:p-20 border-b border-stone-50 flex flex-col sm:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-10">
                <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center text-[#a9b897] shadow-inner">
                  <ShieldCheck size={36} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-5xl font-serif italic tracking-tighter">Audit Trail</h4>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400">Verified System Records & Certification</p>
                </div>
              </div>
              <button 
                onClick={() => notify("Accessing Secure Archives...")}
                className="bg-stone-50 px-12 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 flex items-center gap-5 transition-all shadow-sm active:scale-95"
              >
                View Historical Vault <ChevronRight size={18}/>
              </button>
           </div>
           
           <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/40">
                  {['Document Reference', 'Filing Period', 'Certification Node', 'Status'].map(h => (
                    <th key={h} className="px-20 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {[
                  { name: 'Corporation Tax Summary', period: 'FY 2025-26', cert: 'Director Authority', status: 'Certified' },
                  { name: 'VAT Reconciliation', period: 'Q1 2026', cert: 'Gov.Connect API', status: 'Filed' },
                  { name: 'R&D Tax Submission', period: 'FY 2025', cert: 'External Audit', status: 'In Review' }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50/40 transition-all cursor-pointer">
                    <td className="px-20 py-14">
                      <div className="flex items-center gap-6">
                        <FileText size={18} className="text-stone-200 group-hover:text-[#a9b897] transition-colors" />
                        <span className="text-xl font-bold text-stone-800 tracking-tight group-hover:text-[#a9b897] transition-colors">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-20 py-14 text-[11px] font-black uppercase text-stone-400 tracking-[0.3em] font-mono italic">{row.period}</td>
                    <td className="px-20 py-14 text-[11px] font-black uppercase text-stone-600 tracking-[0.2em]">{row.cert}</td>
                    <td className="px-20 py-14 text-right sm:text-left">
                      <span className={`px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border shadow-sm transition-all ${row.status === 'In Review' ? 'bg-white text-stone-400 border-stone-100 italic' : 'bg-stone-900 text-white border-stone-900 group-hover:bg-[#a9b897] group-hover:border-[#a9b897]'}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* --- MODAL CONTENT --- */}
      <Modal id="audit" title="System Audit Record">
        <div className="space-y-12">
          <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 space-y-8">
            <div className="flex justify-between items-center border-b border-stone-200 pb-8">
              <p className="text-[12px] font-black uppercase text-stone-400 tracking-widest">Revenue (Cumulative)</p>
              <p className="text-2xl font-mono font-bold">£{metrics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200 pb-8">
              <p className="text-[12px] font-black uppercase text-stone-400 tracking-widest">Tax Provision (19%)</p>
              <p className="text-2xl font-mono font-bold text-red-400">-£{metrics.taxReserve.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[12px] font-black uppercase text-stone-900 tracking-widest">Net Surplus</p>
              <p className="text-4xl font-mono font-bold text-[#a9b897]">£{metrics.netMargin.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <button className="flex items-center justify-center gap-4 py-8 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#a9b897] transition-all shadow-xl group">
               <Download size={18} /> Export PDF
             </button>
             <button className="flex items-center justify-center gap-4 py-8 bg-stone-50 text-stone-400 border border-stone-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:text-stone-900 transition-all">
               <Eye size={18} /> View Ledger
             </button>
          </div>

          <div className="p-8 border border-[#a9b897]/20 bg-[#a9b897]/5 rounded-[2.5rem]">
            <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest leading-loose text-center">
              Verified by TOTS OS Automated Audit Engine <br/>
              Timestamp: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}