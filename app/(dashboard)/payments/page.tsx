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
  Mail, Phone, Globe, CreditCard
} from "lucide-react";

/**
 * FINANCIALS & LEDGER OPERATIONS PAGE
 * Total Lines: ~650
 * Features: Local State Persistence, Real-time Calculation, Multi-Modal Architecture
 */

export default function FinancialsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI STATE ---
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
    { id: "QT-004", client: "Black Mesa Corp", amount: 4500, status: "sent", date: "2026-05-15", expires: "2026-06-15" },
    { id: "QT-005", client: "Wayne Enterprises", amount: 62000, status: "draft", date: "2026-05-08", expires: "2026-06-08" }
  ]);

  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "processed", date: "2026-05-02", category: "Rent" },
    { id: "EXP-23", vendor: "ServerSpace Inc.", amount: 850, status: "processed", date: "2026-04-28", category: "Infrastructure" },
    { id: "EXP-24", vendor: "Adobe Creative", amount: 45, status: "pending", date: "2026-05-05", category: "Software" },
  ]);

  const [clients, setClients] = useState([
    { id: 1, name: "Aperture Labs", contact: "Cave Johnson", email: "cave@aperture.com", total: 142000, status: "Active" },
    { id: 2, name: "Cyberdyne Systems", contact: "Miles Dyson", email: "m.dyson@cyberdyne.io", total: 89400, status: "Active" },
    { id: 3, name: "Black Mesa", contact: "Wallace Breen", email: "admin@blackmesa.com", total: 12000, status: "Inactive" },
  ]);

  // --- FORM STATES ---
  const [invoiceForm, setInvoiceForm] = useState({ client: "", amount: "", category: "Project", date: "" });
  const [quoteForm, setQuoteForm] = useState({ client: "", amount: "", notes: "" });
  const [expenseForm, setExpenseForm] = useState({ vendor: "", amount: "", category: "Operations", file: null as File | null });
  const [taxInput, setTaxInput] = useState({ income: "142500", expenses: "32400", rate: "20" });

  useEffect(() => { setIsMounted(true); }, []);

  // --- ACTIONS ---
  const triggerNotification = (msg: string) => {
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
      due: "2026-06-09",
      category: invoiceForm.category
    };
    setInvoices([newInv, ...invoices]);
    setMetrics({ ...metrics, revYtd: metrics.revYtd + newInv.amount });
    triggerNotification("Invoice generated and logged to ledger.");
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
    setMetrics({ ...metrics, operatingCosts: metrics.operatingCosts + newExp.amount });
    triggerNotification("Expense logged. Net profit adjusted.");
    setActiveModal(null);
  };

  const downloadCSV = () => {
    const headers = "ID,Client/Vendor,Amount,Status,Date\n";
    const data = invoices.map(i => `${i.id},${i.client},${i.amount},${i.status},${i.date}`).join("\n");
    const blob = new Blob([headers + data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    triggerNotification("Ledger report exported.");
  };

  // --- CALCULATED VALUES ---
  const currentProfit = useMemo(() => metrics.revYtd - metrics.operatingCosts, [metrics]);
  const filteredInvoices = invoices.filter(inv => 
    inv.client.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isMounted) return null;

  // --- SUB-COMPONENTS ---
  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      paid: "bg-stone-100 text-stone-800",
      pending: "bg-stone-50 text-stone-500 border border-stone-200",
      overdue: "bg-red-50 text-red-600 border border-red-100",
      processed: "bg-stone-100 text-stone-800"
    };
    return (
      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const ModalWrapper = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex justify-center items-center p-4 md:p-12"
        >
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[3rem] p-8 md:p-14 shadow-2xl overflow-y-auto max-h-[90vh] relative"
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
              <X size={20}/>
            </button>
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)] mb-2">Financial Operations</p>
              <h3 className="text-4xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div 
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-stone-800"
          >
            <Check size={16} className="text-stone-400" />
            <p className="text-[10px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto p-6 md:p-12 space-y-12">
        
        {/* --- SECTION 1: HEADER & NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-900 text-white rounded-xl"><Landmark size={18}/></div>
              <p className="font-black uppercase text-[10px] tracking-[0.4em] text-stone-400">Ledger v4.0</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-none">Accounts & <br />Asset Management.</h1>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-6 bg-white border border-stone-200 p-2 rounded-2xl shadow-sm">
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Overview</button>
              <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-xl shadow-lg">Financials</button>
              <button onClick={() => router.push('/hr')} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">Payroll</button>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-stone-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500">Auto-save Enabled</p>
            </div>
          </div>
        </header>

        {/* --- SECTION 2: COMMAND BAR --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
          {[
            { id: 'invoice', label: 'Invoice', icon: FileText, primary: true },
            { id: 'quote', label: 'Quote', icon: FileDigit },
            { id: 'expense', label: 'Expense', icon: ShieldAlert },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'accounts', label: 'Ledger', icon: Eye },
            { id: 'insights', label: 'Analysis', icon: BarChart3 },
            { id: 'upload', label: 'Scanner', icon: Receipt },
            { id: 'tax', label: 'Tax', icon: Calculator },
            { id: 'reports', label: 'Export', icon: Download },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModal(item.id)}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[2.5rem] transition-all cursor-pointer group border ${
                item.primary 
                ? 'bg-stone-900 border-stone-900 text-white shadow-xl hover:bg-stone-800' 
                : 'bg-white border-stone-200 text-stone-900 hover:border-stone-400'
              }`}
            >
              <item.icon size={20} className={`${item.primary ? 'text-[var(--brand-primary)]' : 'text-stone-400 group-hover:text-stone-900'} transition-colors`} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </button>
          ))}
        </div>

        {/* --- SECTION 3: KEY METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                <TrendingUp size={24} />
              </div>
              <div className="flex items-center gap-1 text-stone-400">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-black">12.4%</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Aggregate Revenue</p>
            <h2 className="text-5xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</h2>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <ShieldCheck size={24} />
              </div>
              <div className="flex items-center gap-1 text-stone-400">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-black">2.1%</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Net Operations</p>
            <h2 className="text-5xl font-mono tracking-tighter">£{currentProfit.toLocaleString()}</h2>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <PieChart size={24} />
              </div>
              <span className="text-[10px] font-black text-stone-400">Q2 Buffer</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">VAT Liability</p>
            <h2 className="text-5xl font-mono tracking-tighter">£{metrics.vatPool.toLocaleString()}</h2>
          </div>

          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-stone-800 rounded-2xl text-[var(--brand-primary)]">
                <Calculator size={24} />
              </div>
              <div className="flex items-center gap-1 text-stone-500">
                <Clock size={14} />
                <span className="text-[10px] font-black">Due July</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Corporation Tax</p>
            <h2 className="text-5xl font-mono tracking-tighter">£{metrics.calculatedTaxDue.toLocaleString()}</h2>
          </div>
        </div>

        {/* --- SECTION 4: LEDGER TABLES --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-12">
          
          {/* Main Ledger Table */}
          <div className="xl:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h4 className="text-2xl font-serif italic">Recent Ledger Activity</h4>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search clients or ID..." 
                  className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-6 text-xs outline-none focus:border-stone-900 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Document ID</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Counterparty</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Date</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Amount</th>
                    <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-stone-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <FileText size={14} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                          <span className="text-xs font-black">{inv.id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-medium text-stone-600">{inv.client}</td>
                      <td className="px-8 py-6 text-xs text-stone-400">{inv.date}</td>
                      <td className="px-8 py-6 text-xs font-mono font-bold">£{inv.amount.toLocaleString()}</td>
                      <td className="px-8 py-6 text-right"><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secondary Stats / Expenses Sidebar */}
          <div className="space-y-8">
            <h4 className="text-2xl font-serif italic">Expense Breakdown</h4>
            <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase">{exp.vendor}</p>
                      <p className="text-[10px] text-stone-400">{exp.category} • {exp.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold">£{exp.amount.toLocaleString()}</p>
                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{exp.status}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Outgoing</p>
                <p className="text-lg font-mono font-bold text-red-500">£{metrics.operatingCosts.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <h5 className="text-xl font-serif italic">Annual Projection</h5>
                <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">Estimated Run Rate</p>
                <div className="text-4xl font-mono tracking-tighter">£{metrics.annualForecast.toLocaleString()}</div>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] hover:translate-x-1 transition-transform">
                  View Full Forecast <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />
            </div>
          </div>
        </div>

        {/* --- MODAL SYSTEM: INVOICE --- */}
        <ModalWrapper id="invoice" title="Generate New Invoice">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Client Account</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input 
                    type="text" placeholder="Start typing client name..." 
                    value={invoiceForm.client} onChange={(e) => setInvoiceForm({...invoiceForm, client: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-5 pl-12 pr-6 text-sm outline-none focus:border-stone-900 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Line Item Amount (£)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input 
                    type="number" placeholder="0.00" 
                    value={invoiceForm.amount} onChange={(e) => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-5 pl-12 pr-6 text-sm outline-none focus:border-stone-900 transition-all font-mono"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Billing Category</label>
                <select 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-5 px-6 text-sm outline-none focus:border-stone-900 appearance-none"
                  value={invoiceForm.category} onChange={(e) => setInvoiceForm({...invoiceForm, category: e.target.value})}
                >
                  <option>Retainer</option>
                  <option>Project Fee</option>
                  <option>Hourly Consulting</option>
                  <option>Expenses Reimbursment</option>
                </select>
              </div>
            </div>
            <div className="space-y-8">
              <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 space-y-4">
                <h5 className="text-xs font-black uppercase tracking-widest">Summary Preview</h5>
                <div className="flex justify-between text-xs py-2 border-b border-stone-200/50">
                  <span className="text-stone-400">Subtotal</span>
                  <span className="font-mono">£{invoiceForm.amount || '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-stone-200/50">
                  <span className="text-stone-400">VAT (20%)</span>
                  <span className="font-mono">£{(parseFloat(invoiceForm.amount || "0") * 0.2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-4">
                  <span>Total Due</span>
                  <span className="font-mono">£{(parseFloat(invoiceForm.amount || "0") * 1.2).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={handleAddInvoice} className="w-full bg-stone-900 text-white py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-stone-800 transition-all cursor-pointer">
                Confirm & Create Document
              </button>
            </div>
          </div>
        </ModalWrapper>

        {/* --- MODAL SYSTEM: EXPENSE --- */}
        <ModalWrapper id="expense" title="Log Expenditure">
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payee / Vendor</label>
                <input 
                  type="text" placeholder="e.g. Amazon Web Services" 
                  value={expenseForm.vendor} onChange={(e) => setExpenseForm({...expenseForm, vendor: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-5 px-6 text-sm outline-none focus:border-stone-900 transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Cost (£)</label>
                <input 
                  type="number" placeholder="0.00" 
                  value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-5 px-6 text-sm outline-none focus:border-stone-900 font-mono"
                />
              </div>
            </div>
            <div className="p-12 border-2 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 bg-stone-50/50 hover:bg-stone-50 transition-all cursor-pointer">
              <div className="p-4 bg-white rounded-full shadow-sm text-stone-400"><Upload size={24}/></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Attach digital receipt or photo</p>
              <input type="file" className="hidden" />
            </div>
            <button onClick={handleAddExpense} className="w-full bg-stone-900 text-white py-6 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl cursor-pointer">
              Finalize Expense Log
            </button>
          </div>
        </ModalWrapper>

        {/* --- MODAL SYSTEM: CLIENTS --- */}
        <ModalWrapper id="clients" title="Client Registry">
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={14} />
                <input placeholder="Filter registry..." className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-xs outline-none" />
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">
                <Plus size={14} /> Add Counterparty
              </button>
            </div>
            <div className="space-y-4">
              {clients.map(client => (
                <div key={client.id} className="p-6 border border-stone-100 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center text-lg font-serif italic text-stone-400">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h6 className="text-sm font-black uppercase">{client.name}</h6>
                      <p className="text-[10px] text-stone-400">{client.email} • {client.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12 text-right">
                    <div>
                      <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1">Lifetime Value</p>
                      <p className="text-sm font-mono font-bold">£{client.total.toLocaleString()}</p>
                    </div>
                    <button className="p-3 bg-stone-50 rounded-xl text-stone-400 hover:text-stone-900 transition-colors cursor-pointer">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalWrapper>

        {/* --- MODAL SYSTEM: TAX --- */}
        <ModalWrapper id="tax" title="Taxation Workbench">
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Annual Income</label>
                <input 
                  type="number" value={taxInput.income} onChange={(e) => setTaxInput({...taxInput, income: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-6 text-sm outline-none font-mono" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Allowable Expenses</label>
                <input 
                  type="number" value={taxInput.expenses} onChange={(e) => setTaxInput({...taxInput, expenses: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-6 text-sm outline-none font-mono" 
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tax Rate (%)</label>
                <input 
                  type="number" value={taxInput.rate} onChange={(e) => setTaxInput({...taxInput, rate: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-6 text-sm outline-none font-mono" 
                />
              </div>
            </div>
            
            <div className="p-10 bg-stone-900 rounded-[2.5rem] text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-6">Liability Calculation</p>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Taxable Profit</span>
                      <span className="font-mono text-white">£{(parseFloat(taxInput.income) - parseFloat(taxInput.expenses)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-400">
                      <span>Calculated Rate</span>
                      <span className="font-mono text-white">{taxInput.rate}%</span>
                    </div>
                    <div className="pt-6 border-t border-stone-800 flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)]">Total Liability</span>
                      <span className="text-4xl font-mono tracking-tighter">
                        £{((parseFloat(taxInput.income) - parseFloat(taxInput.expenses)) * (parseFloat(taxInput.rate)/100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-stone-800 rounded-3xl p-8 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3 text-stone-400">
                    <Clock size={16}/>
                    <p className="text-[9px] font-black uppercase tracking-widest">Next Filing Deadline</p>
                  </div>
                  <p className="text-xl font-serif italic text-[var(--brand-primary)]">July 15, 2026</p>
                  <p className="text-[10px] text-stone-500 leading-relaxed uppercase font-black">Ensure all VAT returns are submitted 7 days prior to primary filing.</p>
                </div>
              </div>
            </div>
          </div>
        </ModalWrapper>

        {/* --- MODAL SYSTEM: EXPORT --- */}
        <ModalWrapper id="reports" title="Export Center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-stone-100 rounded-[2.5rem] space-y-6 bg-stone-50/30">
              <div className="p-4 bg-stone-900 text-white rounded-2xl w-fit"><Briefcase size={20}/></div>
              <div>
                <h5 className="text-sm font-black uppercase tracking-widest">General Ledger</h5>
                <p className="text-xs text-stone-400 mt-1">Full transaction history in CSV format.</p>
              </div>
              <button onClick={downloadCSV} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-900 hover:gap-4 transition-all cursor-pointer">
                Download Now <Download size={14} />
              </button>
            </div>
            <div className="p-8 border border-stone-100 rounded-[2.5rem] space-y-6 bg-stone-50/30">
              <div className="p-4 bg-stone-100 text-stone-400 rounded-2xl w-fit"><Landmark size={20}/></div>
              <div>
                <h5 className="text-sm font-black uppercase tracking-widest">Compliance Pack</h5>
                <p className="text-xs text-stone-400 mt-1">Consolidated PDF for tax filings.</p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-300 cursor-not-allowed">
                Generate Package <Settings size={14} />
              </button>
            </div>
          </div>
        </ModalWrapper>

        {/* --- MODAL SYSTEM: INSIGHTS --- */}
        <ModalWrapper id="insights" title="Financial Intelligence">
          <div className="space-y-12">
            <div className="flex items-center gap-8 bg-stone-50 p-8 rounded-[2rem]">
              <div className="h-40 w-40 rounded-full border-[12px] border-stone-900 flex items-center justify-center border-t-[var(--brand-primary)] animate-spin-slow">
                <span className="text-2xl font-mono font-bold">{metrics.grossMargin}%</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-serif italic text-stone-800">Operational Efficiency</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 leading-relaxed max-w-xs">
                  Your current profit margin is 8% higher than the industry average for technical consulting services.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 border border-stone-100 rounded-3xl space-y-4">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Biggest Expense Category</h6>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-bold">Cloud Infrastructure</p>
                  <p className="text-sm font-mono text-red-500">34% of spend</p>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-900 w-[34%]" />
                </div>
              </div>
              <div className="p-8 border border-stone-100 rounded-3xl space-y-4">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Revenue Concentration</h6>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-bold">Retainer Clients</p>
                  <p className="text-sm font-mono text-green-500">62% of income</p>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--brand-primary)] w-[62%]" />
                </div>
              </div>
            </div>
          </div>
        </ModalWrapper>

      </div>

      {/* Internal Custom Styles */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}