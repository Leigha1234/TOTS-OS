"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  FileText, X, Landmark, Wallet, ArrowRight, 
  AlertCircle, Loader2, TrendingUp, Search, 
  ArrowUpRight, Receipt, Filter, Download, Plus, Activity
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
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 md:p-6"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 hover:bg-stone-50 rounded-full transition-all">
              <X size={20}/>
            </button>
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Finance Module</p>
              <h3 className="text-3xl md:text-5xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-4 md:p-10 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <TrendingUp size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto space-y-8">
        
        {/* --- HIGH-DENSITY ACTION HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-6 md:p-10 rounded-[3rem] border border-stone-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Activity size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Ledger Node v6.1.0</p>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter">Payments</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveModal('invoice')}
              className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl hover:bg-[#a9b897] transition-all shadow-xl group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">New Invoice</span>
            </button>
            <button className="flex items-center gap-3 bg-white border border-stone-200 px-6 py-4 rounded-2xl hover:bg-stone-50 transition-all shadow-sm">
              <Download size={18} className="text-stone-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Export CSV</span>
            </button>
            
            <div className="h-10 w-[1px] bg-stone-100 mx-2 hidden xl:block" />

            <nav className="flex bg-stone-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
              {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'Payments' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                  className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${
                    path === 'Payments' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {path}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Sync Error: {error}</p>
          </div>
        )}

        {/* --- KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="z-10 space-y-4">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Revenue (Billable)</p>
                <ArrowUpRight size={22} className="text-[#a9b897]" />
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-mono tracking-tighter leading-none pt-4 truncate">
                £{metrics.revYtd.toLocaleString()}
              </h2>
            </div>
            <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Node Aggregate</p>
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            </div>
          </div>

          {[
            { label: 'Net Op Profit', value: (metrics.revYtd - metrics.operatingCosts), sub: 'Stable Margins', icon: <TrendingUp size={18}/> },
            { label: 'VAT Reserve', value: metrics.vatPool, sub: 'Liability Q2-26', icon: <Landmark size={18}/> },
            { label: 'Corp Tax Due', value: metrics.taxDue, sub: 'Projected End YTD', action: 'Details', icon: <Receipt size={18}/> }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-[3.5rem] p-10 flex flex-col justify-between min-h-[280px] shadow-sm hover:border-stone-900 transition-all">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{item.label}</p>
                <div className="text-stone-200 group-hover:text-stone-900">{item.icon}</div>
              </div>
              <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-mono tracking-tighter leading-none py-4 text-stone-800 truncate">
                {item.value < 0 ? `-£${Math.abs(item.value).toLocaleString()}` : `£${item.value.toLocaleString()}`}
              </h2>
              {item.action ? (
                <button onClick={() => router.push('/finance-reports')} className="w-full flex items-center justify-between py-4 border-t border-stone-50 text-[9px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">
                  {item.action} <ArrowRight size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-2 border-t border-stone-50 pt-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897]" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{item.sub}</p>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* --- TRANSACTION TABLE --- */}
        <section className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
          <div className="p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-stone-50">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-serif italic">Transaction Ledger</h3>
              <span className="px-3 py-1 bg-stone-50 rounded-full text-[9px] font-black uppercase text-stone-400 tracking-widest">Active</span>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
              <input 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter Entity..." 
                className="w-full pl-12 pr-6 py-3.5 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold outline-none focus:border-stone-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50">
                  {['Reference', 'Entity', 'Status', 'Date', 'Amount'].map((h) => (
                    <th key={h} className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin inline text-stone-300" /></td></tr>
                ) : filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-stone-50/50 transition-colors cursor-pointer">
                    <td className="px-10 py-6 text-[10px] font-black uppercase text-[#a9b897] font-mono">{inv.id}</td>
                    <td className="px-10 py-6 font-bold text-sm text-stone-800">{inv.client}</td>
                    <td className="px-10 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase border ${inv.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>
                        <div className={`w-1 h-1 rounded-full ${inv.status === 'paid' ? 'bg-green-600' : 'bg-stone-400'}`} />
                        {inv.status}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-[10px] font-bold text-stone-400 tracking-wider font-mono">{inv.date}</td>
                    <td className="px-10 py-6 text-right font-mono font-bold text-stone-900 pr-12">£{inv.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- DUAL ACTION PANELS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <button onClick={() => setActiveModal('accounts')} className="p-8 md:p-12 bg-white border border-stone-200 rounded-[3rem] flex items-center justify-between group hover:border-[#a9b897] transition-all shadow-sm">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Asset Management</p>
                <h5 className="text-3xl font-serif italic tracking-tighter">Liquid Reserves</h5>
              </div>
              <div className="p-6 bg-stone-50 rounded-[1.5rem] text-stone-300 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner"><Wallet size={24} /></div>
           </button>

           <button onClick={() => setActiveModal('invoice')} className="p-8 md:p-12 bg-stone-900 text-white rounded-[3rem] flex items-center justify-between group hover:bg-[#a9b897] transition-all shadow-xl">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">New Directive</p>
                <h5 className="text-3xl font-serif italic tracking-tighter">Issue Invoice</h5>
              </div>
              <div className="p-6 bg-white/10 rounded-[1.5rem] group-hover:bg-white group-hover:text-stone-900 transition-all"><FileText size={24} /></div>
           </button>
        </div>

        {/* --- MODALS --- */}
        <Modal id="accounts" title="Liquidity Report">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {[
              { name: "Current Account", balance: 84200.50, type: "Liquid" },
              { name: "VAT Escrow", balance: metrics.vatPool, type: "Protected" },
              { name: "Tax Reserve", balance: metrics.taxDue, type: "Provision" },
            ].map(acc => (
              <div key={acc.name} className="p-8 bg-stone-50 rounded-[2rem] border border-stone-100 flex flex-col justify-between min-h-[180px] shadow-inner">
                <div>
                  <p className="text-[8px] font-black uppercase text-[#a9b897] mb-1 tracking-widest">{acc.type}</p>
                  <h6 className="text-[10px] font-black uppercase tracking-wider">{acc.name}</h6>
                </div>
                <p className="text-2xl font-mono font-bold tracking-tighter">£{acc.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Modal>

        <Modal id="invoice" title="Sales Directive">
           <div className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Debtor Entity</label>
                  <input placeholder="Aperture Labs..." className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-900 font-bold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-2">Net Sum (£)</label>
                  <input type="number" placeholder="0.00" className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-900 font-mono font-bold text-lg" />
                </div>
              </div>
              <button 
                onClick={() => { notify("Invoice Dispatched to Entity"); setActiveModal(null); }} 
                className="w-full bg-stone-900 text-white py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-[#a9b897] transition-all"
              >
                Execute & Distribute
              </button>
           </div>
        </Modal>

      </div>
    </div>
  );
}