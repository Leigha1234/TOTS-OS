"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  FileText,
  ShieldAlert,
  FileDigit,
  Award,
  Upload,
  Eye,
  X,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Download
} from "lucide-react";

export default function FinancialsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Modal Visibility States
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isClientDirectoryOpen, setIsClientDirectoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTaxCalcOpen, setIsTaxCalcOpen] = useState(false);

  // Financial Dashboard Metrics 
  const [metrics] = useState({
    revYtd: 142500,
    liabilities: 28500,
    vatPool: 4210,
    calculatedTaxDue: 21660,
    grossMargin: 68,
    operatingCosts: 32400,
    projectedTax: 25000,
    annualForecast: 320000
  });

  const currentProfit: number = metrics.revYtd - metrics.operatingCosts;

  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "approved", date: "2026-05-01", type: "Retainer", dueDate: "2026-05-31" },
    { id: "INV-102", client: "Cyberdyne Systems", amount: 8900, status: "pending", date: "2026-04-20", type: "Project", dueDate: "2026-05-20" },
    { id: "INV-103", client: "Umbrella Corp", amount: 18500, status: "paid", date: "2026-04-15", type: "Hourly", dueDate: "2026-05-15" }
  ]);

  const [quotes, setQuotes] = useState<any[]>([
    { id: "QT-004", client: "Black Mesa Corp", amount: 4500, status: "pending", date: "2026-05-15", expiry: "2026-06-15" },
    { id: "QT-005", client: "Tyrell Corp", amount: 12800, status: "approved", date: "2026-04-28", expiry: "2026-05-28" }
  ]);

  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "pending", date: "2026-05-02", category: "Utilities" },
    { id: "EXP-23", vendor: "ServerSpace Inc.", amount: 850, status: "paid", date: "2026-04-28", category: "Infrastructure" }
  ]);

  const [clients, setClients] = useState<any[]>([
    { id: 1, name: "Aperture Labs", contact: "GlaDOS", email: "glados@aperture.org", totalSpent: 28400, status: "Active" },
    { id: 2, name: "Black Mesa Corp", contact: "Dr. Breen", email: "breen@blackmesa.com", totalSpent: 19500, status: "Active" }
  ]);

  // Form Fields
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceVat, setInvoiceVat] = useState("0");
  const [invoiceDiscount, setInvoiceDiscount] = useState("");
  const [invoiceFrequency, setInvoiceFrequency] = useState("one-off");
  const [invoiceProject, setInvoiceProject] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Office Supplies");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addInvoice = () => {
    if (!invoiceClient || !invoiceAmount) return;
    setInvoices([{ 
        id: `INV-${Math.floor(Math.random() * 900) + 100}`, 
        client: invoiceClient, 
        amount: parseFloat(invoiceAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        type: "Project",
        dueDate: new Date().toISOString().split('T')[0]
      }, ...invoices]);
    setIsInvoiceOpen(false);
  };

  const addQuote = () => {
    if (!quoteClient || !quoteAmount) return;
    setQuotes([{ 
        id: `QT-${Math.floor(Math.random() * 900) + 100}`, 
        client: quoteClient, 
        amount: parseFloat(quoteAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        expiry: new Date().toISOString().split('T')[0]
      }, ...quotes]);
    setIsQuoteOpen(false);
  };

  const addExpense = () => {
    if (!expenseVendor || !expenseAmount) return;
    setExpenses([{ 
        id: `EXP-${Math.floor(Math.random() * 90) + 10}`, 
        vendor: expenseVendor, 
        amount: parseFloat(expenseAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        category: expenseCategory
      }, ...expenses]);
    setIsExpenseOpen(false);
  };

  const downloadReport = (type: string) => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Client,Amount,Status,Date\n"
      + invoices.map(e => `${e.id},${e.client},${e.amount},${e.status},${e.date}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${type}_report.csv`);
    link.click();
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 lg:p-12 max-w-[1400px] mx-auto space-y-12">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--border)] pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--brand-primary)]">
            <BarChart3 size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Financial Accounts Operations</p>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter">Financial Accounts & Invoicing</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border)] px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Live Workspace</p>
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-4 border-b border-[var(--border)] pb-4">
        <button className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-stone-900 text-white shadow-xl">
          Payments
        </button>
        <button onClick={() => router.push("/timesheets")} className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition">
          Timesheets
        </button>
        <button onClick={() => router.push("/hr")} className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition">
          HR & Payroll
        </button>
      </div>

      {/* Operations Bar */}
      <div className="flex flex-wrap gap-6 pt-4 pb-4">
        {[
          { label: "Create Invoice", icon: <FileText size={16} className="text-[var(--brand-primary)]" />, onClick: () => setIsInvoiceOpen(true) },
          { label: "Create Quote", icon: <FileDigit size={16} className="text-[var(--brand-primary)]" />, onClick: () => setIsQuoteOpen(true) },
          { label: "Log Expense", icon: <ShieldAlert size={16} className="text-red-500" />, onClick: () => setIsExpenseOpen(true) },
          { label: "View Accounts", icon: <Eye size={16} className="text-[var(--text-muted)]" />, onClick: () => setIsViewDetailsOpen(true) },
          { label: "Client Directory", icon: <Users size={16} className="text-[var(--text-muted)]" />, onClick: () => setIsClientDirectoryOpen(true) },
          { label: "Insights", icon: <Award size={16} className="text-[var(--brand-primary)]" />, onClick: () => setIsAnalyticsOpen(true) },
          { label: "Upload Receipts", icon: <Upload size={16} className="text-blue-500" />, onClick: () => setIsUploadModalOpen(true) },
          { label: "Tax Calculator", icon: <Clock size={16} className="text-yellow-500" />, onClick: () => setIsTaxCalcOpen(true) },
          { label: "Download Reports", icon: <Download size={16} className="text-[var(--text-muted)]" />, onClick: () => downloadReport("financials") }
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            className="px-8 py-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-[var(--text-main)] hover:border-[var(--brand-primary)] transition-all flex items-center gap-4 cursor-pointer"
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-stone-800 rounded-2xl text-[var(--brand-primary)]"><TrendingUp size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Aggregate YTD Rev</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Revenue</p>
          </div>
        </div>

        {[
          { label: "Current Profit", val: currentProfit, icon: <Award size={24} />, sub: "Net Operations" },
          { label: "VAT Pool", val: metrics.vatPool, icon: <ShieldCheck size={24} />, sub: "Accrued VAT" },
          { label: "Tax Due", val: metrics.calculatedTaxDue, icon: <FileDigit size={24} />, sub: "Calculated Balance" }
        ].map((m, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[var(--bg-soft)] text-[var(--brand-primary)] rounded-2xl">{m.icon}</div>
              <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.3em]">{m.label}</span>
            </div>
            <div>
              <p className="text-4xl font-mono tracking-tighter text-[var(--text-main)]">£{m.val.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-black mt-2 tracking-widest">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Layout for Document Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
        {[
          { title: "Recent Invoices", data: invoices },
          { title: "Active Quotes", data: quotes },
          { title: "Recent Expenses", data: expenses }
        ].map((sec, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] p-8 rounded-[2.5rem] shadow-sm">
            <h4 className="text-lg font-serif italic mb-6">{sec.title}</h4>
            <div className="space-y-4">
              {sec.data.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl">
                  <div>
                    <p className="text-xs font-black uppercase">{item.id}</p>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.client || item.vendor}</span>
                  </div>
                  <p className="text-xs font-mono font-bold">£{item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Generic styles applied to Invoice Modal as example */}
      <AnimatePresence>
        {isInvoiceOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] overflow-y-auto p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-[var(--text-main)]">Generate Invoice</h3>
                <button onClick={() => setIsInvoiceOpen(false)} className="p-3 rounded-full hover:bg-[var(--bg-soft)] transition-colors cursor-pointer text-[var(--text-main)]"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-[0.2em]">Select Client</label>
                  <input placeholder="Client Name" value={invoiceClient} onChange={(e) => setInvoiceClient(e.target.value)} className="w-full mt-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[var(--brand-primary)]/5 outline-none text-[var(--text-main)]" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-[var(--text-muted)] ml-2 tracking-[0.2em]">Amount (£)</label>
                  <input type="number" placeholder="0.00" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} className="w-full mt-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[var(--brand-primary)]/5 outline-none text-[var(--text-main)]" />
                </div>
              </div>

              <div className="flex justify-end gap-6 border-t border-[var(--border)] pt-6">
                <button onClick={() => setIsInvoiceOpen(false)} className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">Cancel</button>
                <button onClick={addInvoice} className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all cursor-pointer">Save Invoice</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}