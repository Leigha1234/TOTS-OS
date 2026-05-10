"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  FileText, ShieldAlert, Eye, X, 
  Users, BarChart3, Check, Search, ArrowUpRight,
  Landmark, Wallet, ArrowRight, AlertCircle, Loader2
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
    operatingCosts: 12400, // Fixed overhead example
    vatPool: 0,
    taxDue: 0
  });

  const [invoices, setInvoices] = useState<any[]>([
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
      // Fetch all timesheet data to calculate real revenue
      const { data, error: tsError } = await supabase
        .from('timesheets')
        .select('mon, tue, wed, thu, fri, sat, sun');

      if (tsError) throw tsError;

      const totalHours = data?.reduce((acc, row) => {
        return acc + (Number(row.mon) + Number(row.tue) + Number(row.wed) + Number(row.thu) + Number(row.fri) + Number(row.sat) + Number(row.sun));
      }, 0) || 0;

      const revenue = totalHours * 85; // £85/hr billable rate
      const vat = revenue * 0.20;
      const tax = (revenue - 12570) * 0.19; // Simple corp tax logic

      setMetrics({
        revYtd: revenue,
        operatingCosts: 12400,
        vatPool: vat,
        taxDue: tax > 0 ? tax : 0
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

  // --- REUSABLE COMPONENTS ---
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
              <Landmark size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Corporate Ledger v5.2</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-tight">Payments</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm overflow-hidden">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'Payments' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-10 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'Payments' ? "bg-stone-900 text-white shadow-xl" : "text-stone-400 hover:text-stone-900"
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
            <p className="text-[10px] font-black uppercase tracking-widest">Finance Feed Error: {error}</p>
          </div>
        )}

        {/* --- KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 relative overflow-hidden group min-w-0">
            <div className="z-10">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Revenue (Billable)</p>
                <ArrowUpRight size={16} className="text-[#a9b897]" />
              </div>
              <h2 className="text-4xl md:text-5xl xl:text-6xl font-mono tracking-tighter truncate">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-stone-800 w-fit px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 border border-stone-700">
              From Timesheets
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 hover:shadow-lg transition-shadow min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net Op Profit</p>
            <h2 className="text-4xl md:text-6xl font-mono tracking-tighter truncate">£{(metrics.revYtd - metrics.operatingCosts).toLocaleString()}</h2>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Stable Margins</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">VAT Reserve</p>
            <h2 className="text-4xl md:text-6xl font-mono tracking-tighter truncate">£{metrics.vatPool.toLocaleString()}</h2>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-300">Liability Q2-26</div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Corp Tax Due</p>
            <h2 className="text-4xl md:text-6xl font-mono tracking-tighter truncate">£{metrics.taxDue.toLocaleString()}</h2>
            <button onClick={() => router.push('/finance-reports')} className="w-full flex items-center justify-between py-4 border-t border-stone-100 text-[9px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">
              Breakdown <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* --- TRANSACTION LEDGER --- */}
        <section className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h4 className="text-4xl font-serif italic tracking-tighter">Transaction Ledger</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Master record of all client billings</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Entity..." 
                className="bg-white border border-stone-200 rounded-full py-5 pl-16 pr-8 text-xs w-full outline-none focus:border-stone-900 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-100">
                    <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Reference</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Entity</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Value</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-stone-300" /></td></tr>
                  ) : filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="group hover:bg-stone-50/80 transition-colors">
                      <td className="px-12 py-10 font-mono text-xs font-black tracking-widest">{inv.id}</td>
                      <td className="px-12 py-10">
                        <p className="text-xs font-bold text-stone-800">{inv.client}</p>
                        <p className="text-[9px] text-stone-400 uppercase font-black">{inv.date}</p>
                      </td>
                      <td className="px-12 py-10 font-mono font-bold text-base">£{inv.amount.toLocaleString()}</td>
                      <td className="px-12 py-10 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          inv.status === 'paid' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400 border-stone-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* --- QUICK ACTIONS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <button onClick={() => setActiveModal('accounts')} className="p-12 bg-white border border-stone-200 rounded-[3.5rem] flex items-center justify-between group hover:border-stone-900 transition-all shadow-sm">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-stone-400">Liquidity Check</p>
                <h5 className="text-3xl font-serif italic">View All Bank Accounts</h5>
              </div>
              <div className="p-5 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-all"><Wallet /></div>
           </button>

           <button onClick={() => setActiveModal('invoice')} className="p-12 bg-stone-900 text-white rounded-[3.5rem] flex items-center justify-between group hover:bg-[#a9b897] transition-all shadow-xl">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-stone-600 group-hover:text-white/60">New Entry</p>
                <h5 className="text-3xl font-serif italic">Create Sales Invoice</h5>
              </div>
              <div className="p-5 bg-stone-800 rounded-2xl group-hover:bg-white group-hover:text-[#a9b897] transition-all"><FileText /></div>
           </button>
        </div>

        {/* --- MODALS --- */}
        <Modal id="accounts" title="Internal Liquidity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: "Business Current", balance: 84200.50, type: "Liquid" },
              { name: "VAT Holding", balance: metrics.vatPool, type: "Escrow" },
              { name: "Tax Reserve", balance: metrics.taxDue, type: "Savings" },
            ].map(acc => (
              <div key={acc.name} className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black uppercase text-stone-400 mb-1">{acc.type}</p>
                  <h6 className="text-xs font-black uppercase mb-4">{acc.name}</h6>
                  <p className="text-3xl font-mono font-bold tracking-tighter">£{acc.balance.toLocaleString()}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#a9b897]" />
              </div>
            ))}
          </div>
        </Modal>

        <Modal id="invoice" title="Sales Generation">
           <div className="space-y-10 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Client Entity</label>
                  <input placeholder="Full Legal Name" className="w-full p-6 bg-stone-50 border border-stone-100 rounded-3xl outline-none focus:border-stone-900 transition-all font-semibold" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Net Amount (£)</label>
                  <input type="number" placeholder="0.00" className="w-full p-6 bg-stone-50 border border-stone-100 rounded-3xl outline-none focus:border-stone-900 font-mono font-bold" />
                </div>
              </div>
              <button onClick={() => { notify("Invoice Sent to Client"); setActiveModal(null); }} className="w-full bg-stone-900 text-white py-7 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-[#a9b897] transition-all">Submit & Dispatch</button>
           </div>
        </Modal>

      </div>
    </div>
  );
}