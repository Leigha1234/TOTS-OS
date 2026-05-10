"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  FileText, ShieldAlert, FileDigit, Award, Upload, Eye, X, 
  Users, BarChart3, Check, Calculator, Search, ArrowUpRight,
  Landmark, Receipt, Download, Wallet, Building2, 
  Mail, Phone, CreditCard, Activity, Layers, FileSpreadsheet,
  TrendingUp, ArrowRight
} from "lucide-react";

/**
 * PAYMENTS & FINANCIALS CORE - v5.0.0
 * Standardized Layout Template
 */

export default function PaymentsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI GLOBAL STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // --- DATA STATE ---
  const [metrics, setMetrics] = useState({
    revYtd: 142500,
    liabilities: 28500,
    vatPool: 4210,
    calculatedTaxDue: 21660,
    operatingCosts: 32400,
  });

  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "paid", date: "2026-05-01", category: "Retainer" },
    { id: "INV-102", client: "Cyberdyne Systems", amount: 8900, status: "pending", date: "2026-04-20", category: "Project" },
    { id: "INV-103", client: "Umbrella Corp", amount: 12500, status: "overdue", date: "2026-03-15", category: "Consulting" },
    { id: "INV-104", client: "Tyrell Corp", amount: 22000, status: "paid", date: "2026-04-01", category: "Retainer" },
  ]);

  const [accounts] = useState([
    { name: "Business Current", balance: 84200.50, type: "Liquid" },
    { name: "VAT Holding", balance: 4210.00, type: "Escrow" },
    { name: "Corporation Tax Reserve", balance: 18500.00, type: "Savings" },
  ]);

  // --- FORM STATES ---
  const [invoiceForm, setInvoiceForm] = useState({ client: "", amount: "", category: "Project" });

  useEffect(() => { setIsMounted(true); }, []);

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  const handleAddInvoice = () => {
    if (!invoiceForm.client || !invoiceForm.amount) return;
    const newInv = {
      id: `INV-${Math.floor(Math.random() * 900) + 100}`,
      client: invoiceForm.client,
      amount: parseFloat(invoiceForm.amount),
      status: "pending",
      date: new Date().toISOString().split('T')[0],
      category: invoiceForm.category
    };
    setInvoices([newInv, ...invoices]);
    setMetrics(prev => ({ ...prev, revYtd: prev.revYtd + newInv.amount }));
    setInvoiceForm({ client: "", amount: "", category: "Project" });
    notify("Invoice generated successfully.");
    setActiveModal(null);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  // --- REUSABLE COMPONENTS ---
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      paid: "bg-stone-900 text-white border-stone-900",
      pending: "bg-stone-50 text-stone-500 border-stone-200",
      overdue: "bg-red-50 text-red-700 border-red-100",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

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
              <h3 className="text-5xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* Global Notifications */}
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
              <Landmark size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Corporate Ledger v5.0</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Payments</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">Payments</button>
            <button onClick={() => router.push('/finance-reports')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Reports</button>
            <button onClick={() => router.push('/hr')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">HR</button>
            <button onClick={() => router.push('/timesheets')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Timesheets</button>
          </nav>
        </header>

        {/* --- COMMAND GRID --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            { id: 'invoice', label: 'Create Invoice', icon: FileText, color: 'text-[#a9b897]' },
            { id: 'expense', label: 'Log Expense', icon: ShieldAlert, color: 'text-stone-400' },
            { id: 'accounts', label: 'Ledger View', icon: Eye, color: 'text-stone-400' },
            { id: 'clients', label: 'Directory', icon: Users, color: 'text-stone-400' },
            { id: 'reports_link', label: 'View Reports', icon: BarChart3, color: 'text-[#a9b897]', action: () => router.push('/finance-reports') },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={btn.action ? btn.action : () => setActiveModal(btn.id)}
              className="flex flex-col items-center justify-center gap-5 p-8 bg-white border border-stone-200 rounded-[2.8rem] hover:border-[#a9b897] hover:shadow-2xl transition-all group active:scale-95 shadow-sm min-h-[160px]"
            >
              <btn.icon size={22} className={`${btn.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-500 text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </section>

        {/* --- KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 relative overflow-hidden group">
            <div className="z-10">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Revenue YTD</p>
                <ArrowUpRight size={16} className="text-[#a9b897]" />
              </div>
              <h2 className="text-6xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-stone-800 w-fit px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 border border-stone-700">
              Target: £320,000
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#a9b897] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all" />
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 hover:shadow-lg transition-shadow">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net Op Profit</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{(metrics.revYtd - metrics.operatingCosts).toLocaleString()}</h2>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Stable Margins</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">VAT Holding</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{metrics.vatPool.toLocaleString()}</h2>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-300">Liability Q2-26</div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Projected Tax</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{metrics.calculatedTaxDue.toLocaleString()}</h2>
            <button onClick={() => router.push('/finance-reports')} className="w-full flex items-center justify-between py-4 border-t border-stone-100 text-[9px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">
              Full Breakdown <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* --- MAIN LEDGER TABLE --- */}
        <section className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h4 className="text-4xl font-serif italic tracking-tighter">Transaction Ledger</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-sans">Real-time status of all sales documents</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or Client..." 
                className="bg-white border border-stone-200 rounded-[2rem] py-5 pl-14 pr-8 text-xs w-full outline-none focus:border-stone-900 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Reference</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Entity</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Nominal Value</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-stone-50/80 transition-colors">
                    <td className="px-12 py-10">
                      <span className="text-xs font-black tracking-widest text-stone-900">{inv.id}</span>
                    </td>
                    <td className="px-12 py-10">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-800">{inv.client}</p>
                        <p className="text-[9px] text-stone-400 uppercase font-black">{inv.date}</p>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <p className="text-base font-mono font-bold tracking-tighter">£{inv.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- MODAL SYSTEM --- */}
        <Modal id="invoice" title="New Sales Entry">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Client Name</label>
                <input value={invoiceForm.client} onChange={(e) => setInvoiceForm({...invoiceForm, client: e.target.value})} placeholder="Legal Entity" className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100 outline-none focus:border-stone-900 transition-all text-sm" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Net Value (£)</label>
                <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})} placeholder="0.00" className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100 outline-none focus:border-stone-900 font-mono text-sm" />
              </div>
              <button onClick={handleAddInvoice} className="w-full bg-stone-900 text-white py-7 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Submit to Ledger</button>
            </div>
            <div className="bg-stone-900 rounded-[3.5rem] p-12 text-white flex flex-col justify-between">
              <div className="space-y-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Calculation</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                    <span className="text-xs text-stone-400 uppercase font-black">VAT (20%)</span>
                    <span className="font-mono text-xl">£{(parseFloat(invoiceForm.amount || "0") * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#a9b897] uppercase tracking-widest">Total Gross</span>
                    <span className="font-mono text-4xl tracking-tighter text-[#a9b897]">£{(parseFloat(invoiceForm.amount || "0") * 1.2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-800">
                <p className="text-[9px] text-stone-400 leading-relaxed uppercase font-black">Document will be generated as a PDF and emailed to the primary client contact automatically upon submission.</p>
              </div>
            </div>
          </div>
        </Modal>

        <Modal id="accounts" title="Internal Ledger">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {accounts.map(acc => (
              <div key={acc.name} className="p-10 border border-stone-100 rounded-[3rem] space-y-6 hover:border-stone-900 transition-all">
                <div className="flex justify-between items-center">
                  <div className="p-4 bg-stone-50 rounded-2xl"><Wallet size={20}/></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{acc.type}</span>
                </div>
                <div>
                  <h6 className="text-xs font-black uppercase tracking-widest mb-1">{acc.name}</h6>
                  <p className="text-4xl font-mono tracking-tighter">£{acc.balance.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>

      </div>
    </div>
  );
}