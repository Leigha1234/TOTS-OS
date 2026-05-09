"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  FileText, ShieldAlert, FileDigit, Award, Upload, Eye, X, 
  Clock, Users, TrendingUp, BarChart3, ShieldCheck, Download,
  Plus, Check, Calculator, PieChart, Search, ArrowUpRight,
  ArrowDownRight, Landmark, Receipt, Briefcase, Settings,
  Calendar, ChevronRight, Filter, MoreHorizontal, Trash2,
  Mail, Phone, Globe, CreditCard, Activity, Layers, BriefcaseBusiness,
  History, Laptop, Wallet, Building2, Smartphone, FileSpreadsheet
} from "lucide-react";

/**
 * FINANCIALS & LEDGER CORE - v4.2.0
 * Line Count: ~700
 * Functional Status: Full Interactive Prototyping (CRUD Simulated)
 */

export default function FinancialsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI GLOBAL STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // --- FINANCIAL DATA STATE ---
  const [metrics, setMetrics] = useState({
    revYtd: 142500,
    liabilities: 28500,
    vatPool: 4210,
    calculatedTaxDue: 21660,
    grossMargin: 68,
    operatingCosts: 32400,
    projectedTax: 25000,
    annualForecast: 320000
  });

  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "paid", date: "2026-05-01", due: "2026-05-31", category: "Retainer" },
    { id: "INV-102", client: "Cyberdyne Systems", amount: 8900, status: "pending", date: "2026-04-20", due: "2026-05-20", category: "Project" },
    { id: "INV-103", client: "Umbrella Corp", amount: 12500, status: "overdue", date: "2026-03-15", due: "2026-04-15", category: "Consulting" },
    { id: "INV-104", client: "Tyrell Corp", amount: 22000, status: "paid", date: "2026-04-01", due: "2026-05-01", category: "Retainer" },
  ]);

  const [quotes, setQuotes] = useState<any[]>([
    { id: "QT-88", client: "Black Mesa", amount: 45000, date: "2026-05-08", status: "sent" },
    { id: "QT-89", client: "Weyland-Yutani", amount: 12400, date: "2026-05-09", status: "draft" }
  ]);

  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "processed", date: "2026-05-02", category: "Rent" },
    { id: "EXP-23", vendor: "ServerSpace Inc.", amount: 850, status: "processed", date: "2026-04-28", category: "Infrastructure" },
    { id: "EXP-24", vendor: "Adobe Creative", amount: 45, status: "pending", date: "2026-05-05", category: "Software" },
  ]);

  const [clients, setClients] = useState([
    { id: 1, name: "Aperture Labs", contact: "Cave Johnson", email: "cave@aperture.com", total: 142000, phone: "+1 555-0192", status: "Active" },
    { id: 2, name: "Cyberdyne Systems", contact: "Miles Dyson", email: "m.dyson@cyberdyne.io", total: 89400, phone: "+1 555-0481", status: "Active" },
    { id: 3, name: "Black Mesa", contact: "Wallace Breen", email: "admin@blackmesa.com", total: 12000, phone: "+1 555-0912", status: "Inactive" },
  ]);

  const [accounts] = useState([
    { name: "Business Current", balance: 84200.50, type: "Liquid" },
    { name: "VAT Holding", balance: 4210.00, type: "Escrow" },
    { name: "Corporation Tax Reserve", balance: 18500.00, type: "Savings" },
    { name: "Petty Cash", balance: 450.00, type: "Cash" }
  ]);

  // --- FORM STATES ---
  const [invoiceForm, setInvoiceForm] = useState({ client: "", amount: "", category: "Project" });
  const [quoteForm, setQuoteForm] = useState({ client: "", amount: "", description: "" });
  const [expenseForm, setExpenseForm] = useState({ vendor: "", amount: "", category: "Operations" });
  const [taxInput, setTaxInput] = useState({ income: "142500", rate: "20" });

  useEffect(() => { setIsMounted(true); }, []);

  // --- CORE LOGIC HANDLERS ---
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
    notify("Invoice generated and stored.");
    setActiveModal(null);
  };

  const handleAddQuote = () => {
    if (!quoteForm.client || !quoteForm.amount) return;
    const newQuote = {
      id: `QT-${Math.floor(Math.random() * 900) + 100}`,
      client: quoteForm.client,
      amount: parseFloat(quoteForm.amount),
      status: "sent",
      date: new Date().toISOString().split('T')[0]
    };
    setQuotes([newQuote, ...quotes]);
    notify("Quote dispatched to client email.");
    setActiveModal(null);
  };

  const handleAddExpense = () => {
    if (!expenseForm.vendor || !expenseForm.amount) return;
    const newExp = {
      id: `EXP-${Math.floor(Math.random() * 90) + 10}`,
      vendor: expenseForm.vendor,
      amount: parseFloat(expenseForm.amount),
      status: "pending",
      date: new Date().toISOString().split('T')[0],
      category: expenseForm.category
    };
    setExpenses([newExp, ...expenses]);
    setMetrics(prev => ({ ...prev, operatingCosts: prev.operatingCosts + newExp.amount }));
    notify("Expense logged. Operating margin adjusted.");
    setActiveModal(null);
  };

  const handleScan = () => {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          notify("Document OCR Complete. Data extracted.");
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const downloadCSV = () => {
    notify("Preparing data structures...");
    setTimeout(() => notify("CSV Export: Complete"), 1200);
  };

  // --- ANALYTICS ---
  const currentProfit = useMemo(() => metrics.revYtd - metrics.operatingCosts, [metrics]);
  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  // --- REUSABLE UI BLOCKS ---
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      paid: "bg-stone-900 text-white border-stone-900",
      pending: "bg-stone-50 text-stone-500 border-stone-200",
      overdue: "bg-red-50 text-red-700 border-red-100",
      processed: "bg-stone-100 text-stone-600 border-stone-200",
      sent: "bg-blue-50 text-blue-700 border-blue-100",
      draft: "bg-stone-50 text-stone-400 border-dashed border-stone-300"
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const Modal = ({ id, title, children, maxWidth = "max-w-4xl" }: { id: string, title: string, children: React.ReactNode, maxWidth?: string }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-6"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className={`bg-white w-full ${maxWidth} rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-y-auto max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 hover:bg-stone-100 rounded-full cursor-pointer transition-all">
              <X size={20}/>
            </button>
            <div className="mb-12 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)]">System Module</p>
              <h3 className="text-5xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans p-6 md:p-12 selection:bg-stone-900 selection:text-white">
      
      {/* Notifications */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[var(--brand-primary)]" />
            <p className="text-[9px] font-black uppercase tracking-widest leading-none">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- SECTION 1: HEADER & PILL NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Landmark size={14} />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Corporate Ledger v4</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Finances</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">Finances</button>
            <button onClick={() => router.push('/hr')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all cursor-pointer">HR</button>
            <button onClick={() => router.push('/timesheets')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all cursor-pointer">Timesheets</button>
          </nav>
        </header>

        {/* --- SECTION 2: COMMAND GRID --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
          {[
            { id: 'invoice', label: 'Create Invoice', icon: FileText, color: 'text-[var(--brand-primary)]' },
            { id: 'quote', label: 'Create Quote', icon: FileDigit, color: 'text-stone-400' },
            { id: 'expense', label: 'Log Expense', icon: ShieldAlert, color: 'text-stone-400' },
            { id: 'accounts', label: 'View Ledger', icon: Eye, color: 'text-stone-400' },
            { id: 'clients', label: 'Directory', icon: Users, color: 'text-stone-400' },
            { id: 'insights', label: 'Insights', icon: Award, color: 'text-[var(--brand-primary)]' },
            { id: 'upload', label: 'Doc Scanner', icon: Receipt, color: 'text-stone-400' },
            { id: 'tax', label: 'Tax Calc', icon: Calculator, color: 'text-stone-400' },
            { id: 'reports', label: 'Reports', icon: Download, color: 'text-stone-400' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveModal(btn.id)}
              className="flex flex-col items-center justify-center gap-5 p-8 bg-white border border-stone-200 rounded-[2.8rem] hover:border-stone-400 hover:shadow-2xl transition-all group cursor-pointer active:scale-95 shadow-sm min-h-[160px]"
            >
              <btn.icon size={22} className={`${btn.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-500 text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </section>

        {/* --- SECTION 3: KEY METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 relative overflow-hidden group">
            <div className="z-10">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Revenue YTD</p>
                <ArrowUpRight size={16} className="text-[var(--brand-primary)]" />
              </div>
              <h2 className="text-6xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</h2>
            </div>
            <div className="z-10 bg-stone-800 w-fit px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400 border border-stone-700">
              Target: £320,000
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[var(--brand-primary)] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all" />
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 hover:shadow-lg transition-shadow">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Net Operational Profit</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{currentProfit.toLocaleString()}</h2>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Margins: 68.2%</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">VAT Reserved</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{metrics.vatPool.toLocaleString()}</h2>
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-300">Liability accrued Q2</div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tax Liability</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{metrics.calculatedTaxDue.toLocaleString()}</h2>
            <button onClick={() => setActiveModal('tax')} className="w-full py-4 border border-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-colors">Adjust Forecast</button>
          </div>
        </section>

        {/* --- SECTION 4: RECENT TRANSACTIONS --- */}
        <section className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h4 className="text-4xl font-serif italic tracking-tighter">Aggregate Ledger</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">All recent document activity and status tracking</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
              <input 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ref, client, or amount..." 
                className="bg-white border border-stone-200 rounded-3xl py-5 pl-14 pr-8 text-xs w-full outline-none focus:border-stone-900 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Ref ID</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Counterparty</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Department</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400">Nominal Value</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors group cursor-default">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-stone-50 rounded-lg group-hover:bg-stone-900 group-hover:text-white transition-colors"><FileText size={14}/></div>
                        <span className="text-xs font-black tracking-widest">{inv.id}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-800">{inv.client}</p>
                        <p className="text-[9px] text-stone-400 uppercase font-black">{inv.date}</p>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-[10px] font-black uppercase text-stone-400 tracking-wider">{inv.category}</td>
                    <td className="px-12 py-10 text-base font-mono font-bold tracking-tighter">£{inv.amount.toLocaleString()}</td>
                    <td className="px-12 py-10 text-right"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredInvoices.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <Search size={32} className="mx-auto text-stone-200" />
                <p className="text-xs font-black uppercase text-stone-400 tracking-widest">No matching transactions found</p>
              </div>
            )}
          </div>
        </section>

        {/* --- MODAL SYSTEM ARCHITECTURE --- */}

        {/* 1. Invoice Modal */}
        <Modal id="invoice" title="Sales Ledger Entry">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Users size={12}/> Client Account</label>
                <input value={invoiceForm.client} onChange={(e) => setInvoiceForm({...invoiceForm, client: e.target.value})} placeholder="Legal Entity Name" className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 transition-all text-sm" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><CreditCard size={12}/> Net Value (£)</label>
                <input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})} placeholder="0.00" className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 font-mono text-sm" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2"><Layers size={12}/> Nominal Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Retainer', 'Project', 'Ad-hoc', 'Consulting'].map(cat => (
                    <button key={cat} onClick={() => setInvoiceForm({...invoiceForm, category: cat})} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${invoiceForm.category === cat ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'}`}>{cat}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-stone-900 rounded-[3.5rem] p-12 text-white flex flex-col justify-between">
              <div className="space-y-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Summary Projection</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                    <span className="text-xs text-stone-400">Base Net</span>
                    <span className="font-mono text-xl">£{invoiceForm.amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                    <span className="text-xs text-stone-400">VAT (20%)</span>
                    <span className="font-mono text-xl">£{(parseFloat(invoiceForm.amount || "0") * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xs font-bold text-[var(--brand-primary)] uppercase tracking-widest">Total Gross</span>
                    <span className="font-mono text-4xl tracking-tighter text-[var(--brand-primary)]">£{(parseFloat(invoiceForm.amount || "0") * 1.2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleAddInvoice} className="w-full bg-white text-stone-900 py-7 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">Post Document</button>
            </div>
          </div>
        </Modal>

        {/* 2. Expense Modal */}
        <Modal id="expense" title="Log Expenditure">
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payee</label>
                <input value={expenseForm.vendor} onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})} placeholder="Supplier Name" className="p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none w-full" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total (£)</label>
                <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="Inc. Tax" className="p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none font-mono w-full" />
              </div>
            </div>
            <div className="group relative h-64 border-2 border-dashed border-stone-200 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:bg-stone-50 transition-all cursor-pointer overflow-hidden">
              {scanning ? (
                <div className="w-full max-w-xs space-y-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Analyzing Metadata...</p>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} className="h-full bg-stone-900" />
                  </div>
                  <p className="text-xl font-mono font-bold">{scanProgress}%</p>
                </div>
              ) : (
                <div onClick={handleScan} className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform"><Upload size={28} className="text-stone-300" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tap to Upload Receipt</p>
                </div>
              )}
            </div>
            <button onClick={handleAddExpense} className="w-full bg-stone-900 text-white py-7 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-stone-800 shadow-xl transition-all">Submit Outgoing Entry</button>
          </div>
        </Modal>

        {/* 3. Quote Modal */}
        <Modal id="quote" title="Commercial Quotation">
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Prospective Client</label>
              <input value={quoteForm.client} onChange={(e) => setQuoteForm({...quoteForm, client: e.target.value})} className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none" placeholder="Target Entity" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Proposed Fee (£)</label>
              <input type="number" value={quoteForm.amount} onChange={(e) => setQuoteForm({...quoteForm, amount: e.target.value})} className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none font-mono" placeholder="0.00" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Project Scope</label>
              <textarea rows={4} className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none resize-none text-sm" placeholder="Brief description of deliverables..."></textarea>
            </div>
            <button onClick={handleAddQuote} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all">Issue Quote</button>
          </div>
        </Modal>

        {/* 4. Accounts / Ledger Modal */}
        <Modal id="accounts" title="Ledger Accounts" maxWidth="max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {accounts.map(acc => (
              <div key={acc.name} className="p-10 border border-stone-100 rounded-[3rem] space-y-6 hover:border-stone-900 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-all"><Wallet size={20}/></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{acc.type}</span>
                </div>
                <div>
                  <h6 className="text-sm font-black uppercase tracking-widest mb-1">{acc.name}</h6>
                  <p className="text-4xl font-mono tracking-tighter">£{acc.balance.toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-stone-50 flex gap-2">
                  <button className="flex-1 py-3 bg-stone-50 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-stone-100 transition-colors">Transfer</button>
                  <button className="flex-1 py-3 bg-stone-50 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-stone-100 transition-colors">History</button>
                </div>
              </div>
            ))}
            <div className="md:col-span-2 p-10 bg-stone-50 rounded-[3rem] border border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-white rounded-3xl shadow-sm"><Building2 size={24}/></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Aggregate Cash Position</p>
                  <p className="text-4xl font-mono font-bold tracking-tighter">£{(accounts.reduce((a, b) => a + b.balance, 0)).toLocaleString()}</p>
                </div>
              </div>
              <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">Reconcile Accounts</button>
            </div>
          </div>
        </Modal>

        {/* 5. Directory Modal */}
        <Modal id="clients" title="Counterparty Registry">
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-stone-50 p-6 rounded-[2.5rem]">
              <div className="flex items-center gap-4 text-stone-400">
                <Filter size={16}/>
                <p className="text-[9px] font-black uppercase tracking-widest">Active Accounts Only</p>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">{clients.length} Registered Entities</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {clients.map(c => (
                <div key={c.id} className="p-8 border border-stone-100 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-stone-900 text-white rounded-full flex items-center justify-center font-serif italic text-3xl shadow-2xl group-hover:scale-110 transition-transform">
                      {c.name[0]}
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-xl font-serif italic tracking-tighter">{c.name}</h5>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest"><Mail size={12}/> {c.email}</span>
                        <span className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest"><Phone size={12}/> {c.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-12 text-right">
                    <div>
                      <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mb-1">Lifetime Value</p>
                      <p className="text-2xl font-mono font-bold tracking-tighter text-stone-900">£{c.total.toLocaleString()}</p>
                    </div>
                    <button className="p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer">
                      <Settings size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* 6. Insights Modal */}
        <Modal id="insights" title="Business Intelligence">
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Gross Margin</p>
                <p className="text-5xl font-mono tracking-tighter">68.2%</p>
                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '68.2%' }} className="h-full bg-stone-900" />
                </div>
              </div>
              <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Expense Ratio</p>
                <p className="text-5xl font-mono tracking-tighter">22.7%</p>
                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '22.7%' }} className="h-full bg-red-400" />
                </div>
              </div>
              <div className="p-10 bg-stone-900 text-white rounded-[3rem] space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Runway (Months)</p>
                <p className="text-5xl font-mono tracking-tighter">24+</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-1.5 flex-1 bg-[var(--brand-primary)] rounded-full" />)}
                </div>
              </div>
            </div>
            <div className="p-12 border-2 border-stone-100 rounded-[4rem] bg-stone-50/30">
              <div className="flex items-start gap-8">
                <div className="p-6 bg-white rounded-3xl shadow-sm text-[var(--brand-primary)]"><Activity size={32}/></div>
                <div className="space-y-4">
                  <h6 className="text-2xl font-serif italic tracking-tighter text-stone-800">Executive Summary</h6>
                  <p className="text-sm text-stone-500 leading-relaxed font-serif">
                    Year-to-date performance remains exceptionally strong with revenue concentration primarily in 
                    Retainer Services (62%). Infrastructure costs have stabilized at £850/mo, providing a high degree 
                    of operational leverage. We recommend increasing the Corporation Tax reserve by 5% to account 
                    for projected Q4 growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* 7. Tax Modal */}
        <Modal id="tax" title="Tax Simulation Engine">
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Gross Income Forecast</label>
                  <input value={taxInput.income} onChange={(e) => setTaxInput({...taxInput, income: e.target.value})} className="w-full p-6 bg-stone-50 rounded-[2rem] border font-mono text-xl" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tax Jurisdiction Rate (%)</label>
                  <input value={taxInput.rate} onChange={(e) => setTaxInput({...taxInput, rate: e.target.value})} className="w-full p-6 bg-stone-50 rounded-[2rem] border font-mono text-xl" />
                </div>
              </div>
              <div className="p-10 bg-stone-900 text-white rounded-[3.5rem] flex flex-col justify-between shadow-2xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Calculated Liability</p>
                  <h4 className="text-6xl font-mono tracking-tighter text-[var(--brand-primary)]">£{((parseFloat(taxInput.income) - metrics.operatingCosts) * (parseFloat(taxInput.rate)/100)).toLocaleString()}</h4>
                </div>
                <div className="space-y-4 pt-10 border-t border-stone-800">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <span>Deadline</span>
                    <span className="text-white font-serif italic">July 15, 2026</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <span>Status</span>
                    <span className="text-[var(--brand-primary)]">Accruing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* 8. Reports Modal */}
        <Modal id="reports" title="Data Export Suite">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-12 border border-stone-100 rounded-[3.5rem] space-y-8 hover:shadow-2xl transition-all cursor-pointer group" onClick={downloadCSV}>
              <div className="p-6 bg-stone-50 rounded-3xl w-fit group-hover:bg-stone-900 group-hover:text-white transition-all"><FileSpreadsheet size={32}/></div>
              <div className="space-y-2">
                <h6 className="text-lg font-black uppercase tracking-widest">Ledger (CSV)</h6>
                <p className="text-sm text-stone-400 font-serif italic">Complete transaction history for audit.</p>
              </div>
              <div className="pt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">Download Structure <Download size={14}/></div>
            </div>
            <div className="p-12 border border-stone-100 rounded-[3.5rem] space-y-8 opacity-40 grayscale cursor-not-allowed">
              <div className="p-6 bg-stone-50 rounded-3xl w-fit"><BriefcaseBusiness size={32}/></div>
              <div className="space-y-2">
                <h6 className="text-lg font-black uppercase tracking-widest">Compliance Pack</h6>
                <p className="text-sm text-stone-400 font-serif italic">Official PDF filing compilation.</p>
              </div>
              <div className="pt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">Unlocks at Year-End <Clock size={14}/></div>
            </div>
          </div>
        </Modal>

        {/* 9. Scanner Modal (Handled in Doc Scanner / Upload logic) */}
        <Modal id="upload" title="Metadata Scanner">
           <div className="space-y-12">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center gap-4">
                   <Laptop size={24} className="text-stone-300"/>
                   <span className="text-[8px] font-black uppercase tracking-widest">Device Upload</span>
                </div>
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center gap-4">
                   <Smartphone size={24} className="text-stone-300"/>
                   <span className="text-[8px] font-black uppercase tracking-widest">Mobile Sync</span>
                </div>
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 flex flex-col items-center gap-4">
                   <Globe size={24} className="text-stone-300"/>
                   <span className="text-[8px] font-black uppercase tracking-widest">Cloud URL</span>
                </div>
              </div>
              <div className="border-2 border-dashed border-stone-200 rounded-[4rem] p-24 text-center space-y-6 hover:bg-stone-50 transition-all cursor-pointer" onClick={handleScan}>
                 <div className="p-6 bg-white rounded-full shadow-xl w-fit mx-auto"><Receipt size={32} className="text-stone-400"/></div>
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Click to engage OCR engine</p>
              </div>
           </div>
        </Modal>

      </div>

      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        ::selection {
          background: #000;
          color: #fff;
        }
      `}</style>
    </div>
  );
}