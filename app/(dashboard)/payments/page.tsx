"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  FileText, X, Landmark, Wallet, ArrowRight, 
  AlertCircle, Loader2, TrendingUp, Search, 
  ArrowUpRight, Receipt, Filter, Download
} from "lucide-react";

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // --- DATABASE STATE ---
  const [metrics, setMetrics] = useState({
    revYtd: 0,
    operatingCosts: 12400,
    vatPool: 0,
    taxDue: 0
  });

  const [invoices] = useState([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "paid", date: "2026-05-01" },
    { id: "INV-102", client: "Cyberdyne Systems", amount: 8900, status: "pending", date: "2026-04-20" },
    { id: "INV-103", client: "Umbrella Corp", amount: 12500, status: "overdue", date: "2026-03-15" },
  ]);

  useEffect(() => {
    setIsMounted(true);
    fetchFinancials();
  }, []);

  async function fetchFinancials() {
    try {
      setIsLoading(true);
      const { data, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = data?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      const revenue = totalHours * 85; 
      setMetrics({
        revYtd: revenue,
        operatingCosts: 12400,
        vatPool: revenue * 0.20,
        taxDue: (revenue - 12570) > 0 ? (revenue - 12570) * 0.19 : 0
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

  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  const Modal = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-6"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[3.5rem] p-12 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 hover:bg-stone-100 rounded-full transition-all">
              <X size={20}/>
            </button>
            <div className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Finance Module</p>
              <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <TrendingUp size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- REFINED HEADER --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Landmark size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Corporate Ledger v5.2.3</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-tight">Payments</h1>
          </div>

          <nav className="flex bg-stone-100/50 border border-stone-200 p-1.5 rounded-[2.5rem] shadow-inner">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Payments' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'Payments' ? "bg-white text-stone-900 shadow-sm border border-stone-200" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        {/* --- KPI METRICS (Fixed Overflow) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between aspect-[4/5] relative overflow-hidden group">
            <div className="z-10 space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Revenue (Billable)</p>
                <ArrowUpRight size={20} className="text-[#a9b897]" />
              </div>
              <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-mono tracking-tighter leading-none pt-4">
                £{metrics.revYtd.toLocaleString()}
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Source: Timesheets</p>
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            </div>
          </div>

          {[
            { label: 'Net Op Profit', value: `£${(metrics.revYtd - metrics.operatingCosts).toLocaleString()}`, sub: 'Stable Margins' },
            { label: 'VAT Reserve', value: `£${metrics.vatPool.toLocaleString()}`, sub: 'Liability Q2-26' },
            { label: 'Corp Tax Due', value: `£${metrics.taxDue.toLocaleString()}`, sub: 'Projected End YTD', action: 'Breakdown' }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-[3.5rem] p-10 flex flex-col justify-between aspect-[4/5] shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{item.label}</p>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-mono tracking-tighter leading-none py-4 text-stone-800">
                {item.value}
              </h2>
              {item.action ? (
                <button onClick={() => router.push('/finance-reports')} className="w-full flex items-center justify-between py-4 border-t border-stone-100 text-[9px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">
                  {item.action} <ArrowRight size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897]" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{item.sub}</p>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* --- TRANSACTION LEDGER --- */}
        <section className="bg-white border border-stone-200 rounded-[4rem] p-8 md:p-12 shadow-sm space-y-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-stone-50 pb-10">
            <div className="flex items-center gap-4">
              <Receipt size={24} className="text-[#a9b897]" />
              <h3 className="text-3xl font-serif italic tracking-tighter">Transaction Ledger</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-grow lg:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                <input 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Entity..." 
                  className="bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-14 pr-6 text-xs w-full outline-none focus:border-stone-900"
                />
              </div>
              <div className="flex gap-2">
                <button className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all"><Filter size={18} /></button>
                <button className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all"><Download size={18} /></button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             {isLoading ? (
               <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-300" /></div>
             ) : filteredInvoices.map((inv) => (
                <div key={inv.id} className="grid grid-cols-1 sm:grid-cols-4 items-center p-8 bg-stone-50/50 border border-stone-100 rounded-[2.5rem] group hover:bg-white hover:border-[#a9b897] transition-all cursor-pointer gap-6 sm:gap-2">
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] font-black uppercase text-[#a9b897]">{inv.id}</p>
                    <p className="font-bold text-sm text-stone-800">{inv.client}</p>
                  </div>
                  <div>
                    <span className="px-4 py-1.5 bg-stone-100 rounded-full text-[8px] font-black uppercase tracking-widest text-stone-500">{inv.date}</span>
                  </div>
                  <div className="sm:flex sm:justify-center">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${inv.status === 'paid' ? 'bg-[#a9b897]/10 text-[#a9b897] border-[#a9b897]/20' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                      <div className={`w-1 h-1 rounded-full ${inv.status === 'paid' ? 'bg-[#a9b897]' : 'bg-stone-400'}`} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{inv.status}</span>
                    </div>
                  </div>
                  <p className="sm:text-right font-mono font-bold text-lg text-stone-900">£{inv.amount.toLocaleString()}</p>
                </div>
             ))}
          </div>
        </section>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <button onClick={() => setActiveModal('accounts')} className="p-10 md:p-14 bg-white border border-stone-200 rounded-[3.5rem] flex items-center justify-between group hover:border-stone-900 transition-all shadow-sm">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Liquidity</p>
                <h5 className="text-3xl font-serif italic">Bank Accounts</h5>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-all"><Wallet /></div>
           </button>

           <button onClick={() => setActiveModal('invoice')} className="p-10 md:p-14 bg-stone-900 text-white rounded-[3.5rem] flex items-center justify-between group hover:bg-[#a9b897] transition-all shadow-xl">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase text-stone-600 group-hover:text-white/60 tracking-widest">New Entry</p>
                <h5 className="text-3xl font-serif italic">Generate Invoice</h5>
              </div>
              <div className="p-6 bg-stone-800 rounded-2xl group-hover:bg-white group-hover:text-[#a9b897] transition-all"><FileText /></div>
           </button>
        </div>

        {/* --- MODALS --- */}
        <Modal id="accounts" title="Liquidity Report">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Current Account", balance: 84200.50, type: "Liquid" },
              { name: "VAT Escrow", balance: metrics.vatPool, type: "Restricted" },
              { name: "Tax Reserve", balance: metrics.taxDue, type: "Reserve" },
            ].map(acc => (
              <div key={acc.name} className="p-10 bg-stone-50 rounded-[2.5rem] border border-stone-100 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black uppercase text-stone-400 mb-1 tracking-widest">{acc.type}</p>
                  <h6 className="text-xs font-black uppercase mb-4 tracking-wider">{acc.name}</h6>
                  <p className="text-3xl font-mono font-bold tracking-tighter">£{acc.balance.toLocaleString()}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#a9b897]" />
              </div>
            ))}
          </div>
        </Modal>

        <Modal id="invoice" title="Sales Invoice">
           <div className="space-y-10 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Client Name</label>
                  <input placeholder="Entity" className="w-full p-6 bg-stone-50 border border-stone-100 rounded-3xl outline-none focus:border-stone-900 transition-all font-semibold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Net Value (£)</label>
                  <input type="number" placeholder="0.00" className="w-full p-6 bg-stone-50 border border-stone-100 rounded-3xl outline-none focus:border-stone-900 font-mono font-bold" />
                </div>
              </div>
              <button onClick={() => { notify("Invoice Dispatched"); setActiveModal(null); }} className="w-full bg-stone-900 text-white py-7 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-[#a9b897] transition-all">Generate & Send</button>
           </div>
        </Modal>

      </div>
    </div>
  );
}