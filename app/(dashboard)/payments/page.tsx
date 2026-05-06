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

  // Derived metrics
  const currentProfit: number = metrics.revYtd - metrics.operatingCosts;

  // Detailed Document Lists
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

  // Clients Directory
  const [clients, setClients] = useState<any[]>([
    { id: 1, name: "Aperture Labs", contact: "GlaDOS", email: "glados@aperture.org", totalSpent: 28400, status: "Active" },
    { id: 2, name: "Black Mesa Corp", contact: "Dr. Breen", email: "breen@blackmesa.com", totalSpent: 19500, status: "Active" }
  ]);

  // Tax Calculator States
  const [taxIncome, setTaxIncome] = useState("100000");
  const [taxDeductions, setTaxDeductions] = useState("15000");

  // Invoice Fields
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceVat, setInvoiceVat] = useState("0");
  const [invoiceDiscount, setInvoiceDiscount] = useState("");
  const [invoiceFrequency, setInvoiceFrequency] = useState("one-off");
  const [invoiceProject, setInvoiceProject] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState("");

  // Quote Fields
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");

  // Expense Fields
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Office Supplies");

  // Client Fields
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addInvoice = () => {
    if (!invoiceClient || !invoiceAmount) return;
    setInvoices([
      ...invoices,
      { 
        id: `INV-${Math.floor(Math.random() * 900) + 100}`, 
        client: invoiceClient, 
        amount: parseFloat(invoiceAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        type: "Project",
        dueDate: new Date().toISOString().split('T')[0]
      }
    ]);
    setInvoiceClient("");
    setInvoiceAmount("");
    setIsInvoiceOpen(false);
  };

  const addQuote = () => {
    if (!quoteClient || !quoteAmount) return;
    setQuotes([
      ...quotes,
      { 
        id: `QT-${Math.floor(Math.random() * 900) + 100}`, 
        client: quoteClient, 
        amount: parseFloat(quoteAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        expiry: new Date().toISOString().split('T')[0]
      }
    ]);
    setQuoteClient("");
    setQuoteAmount("");
    setIsQuoteOpen(false);
  };

  const addExpense = () => {
    if (!expenseVendor || !expenseAmount) return;
    setExpenses([
      ...expenses,
      { 
        id: `EXP-${Math.floor(Math.random() * 90) + 10}`, 
        vendor: expenseVendor, 
        amount: parseFloat(expenseAmount), 
        status: "pending", 
        date: new Date().toISOString().split('T')[0],
        category: expenseCategory
      }
    ]);
    setExpenseVendor("");
    setExpenseAmount("");
    setIsExpenseOpen(false);
  };

  const addClient = () => {
    if (!newClientName || !newClientEmail) return;
    setClients([
      ...clients,
      {
        id: Date.now(),
        name: newClientName,
        contact: "Accounts Desk",
        email: newClientEmail,
        totalSpent: 0,
        status: "Active"
      }
    ]);
    setNewClientName("");
    setNewClientEmail("");
    setIsClientDirectoryOpen(false);
  };

  const downloadReport = (type: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Client,Amount,Status,Date"].join(",") + "\n"
      + invoices.map(e => `${e.id},${e.client},${e.amount},${e.status},${e.date}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1400px] mx-auto space-y-12">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <BarChart3 size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Financial Accounts Operations</p>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter">Financial Accounts & Invoicing</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Workspace</p>
        </div>
      </header>

      {/* Navigation Controls */}
      <div className="flex flex-wrap gap-4 border-b border-stone-200 pb-4">
        <button 
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-stone-900 text-white shadow-xl cursor-pointer"
        >
          Payments
        </button>
        <button 
          onClick={() => router.push("/timesheets")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          Timesheets
        </button>
        <button 
          onClick={() => router.push("/hr")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer transition"
        >
          HR & Payroll
        </button>
      </div>

      {/* Financial Operations Forms at the Top */}
      <div className="flex flex-wrap gap-6 pt-4 pb-4">
        <button
          onClick={() => setIsInvoiceOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <FileText size={16} className="text-[#a9b897]" /> Create Invoice
        </button>
        <button
          onClick={() => setIsQuoteOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <FileDigit size={16} className="text-[#a9b897]" /> Create Quote
        </button>
        <button
          onClick={() => setIsExpenseOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <ShieldAlert size={16} className="text-red-500" /> Log Expense
        </button>
        <button
          onClick={() => setIsViewDetailsOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <Eye size={16} className="text-stone-500" /> View Accounts
        </button>
        <button
          onClick={() => setIsClientDirectoryOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <Users size={16} className="text-stone-500" /> Client Directory
        </button>
        <button
          onClick={() => setIsAnalyticsOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <Award size={16} className="text-[#a9b897]" /> Insights
        </button>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <Upload size={16} className="text-blue-500" /> Upload Receipts
        </button>
        <button
          onClick={() => setIsTaxCalcOpen(true)}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <span className="p-1 bg-yellow-50 text-yellow-600 rounded"></span> Tax Calculator
        </button>
        <button
          onClick={() => downloadReport("financials")}
          className="px-8 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-sm text-xs font-black tracking-widest uppercase text-stone-800 hover:border-stone-400 transition-all flex items-center gap-4 cursor-pointer"
        >
          <Download size={16} className="text-stone-500" /> Download Reports
        </button>
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-stone-800 rounded-2xl text-[#a9b897]"><TrendingUp size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Aggregate YTD Rev</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Revenue</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Award size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Current Profit</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{currentProfit.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Net Operations</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><ShieldCheck size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">VAT Pool</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.vatPool.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Accrued VAT</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[200px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl"><FileDigit size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Tax Due</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.calculatedTaxDue.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Calculated Balance</p>
          </div>
        </div>
      </div>

      {/* Grid Layout for Document Lists and Sub Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
        {/* Invoices List */}
        <div className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-lg font-serif italic mb-6">Recent Invoices</h4>
          <div className="space-y-4">
            {invoices.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 border border-stone-100 rounded-2xl">
                <div>
                  <p className="text-xs font-black uppercase">{item.id}</p>
                  <span className="text-[10px] text-stone-400">{item.client}</span>
                </div>
                <p className="text-xs font-mono font-bold">£{item.amount.toLocaleString()}</p>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-center text-[10px] text-stone-400 py-6">No invoices created yet.</p>}
          </div>
        </div>

        {/* Quotes List */}
        <div className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-lg font-serif italic mb-6">Active Quotes</h4>
          <div className="space-y-4">
            {quotes.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 border border-stone-100 rounded-2xl">
                <div>
                  <p className="text-xs font-black uppercase">{item.id}</p>
                  <span className="text-[10px] text-stone-400">{item.client}</span>
                </div>
                <p className="text-xs font-mono font-bold">£{item.amount.toLocaleString()}</p>
              </div>
            ))}
            {quotes.length === 0 && <p className="text-center text-[10px] text-stone-400 py-6">No quotes created yet.</p>}
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white border border-stone-200/60 p-8 rounded-[2.5rem] shadow-sm">
          <h4 className="text-lg font-serif italic mb-6">Recent Expenses</h4>
          <div className="space-y-4">
            {expenses.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 border border-stone-100 rounded-2xl">
                <div>
                  <p className="text-xs font-black uppercase">{item.id}</p>
                  <span className="text-[10px] text-stone-400">{item.vendor}</span>
                </div>
                <p className="text-xs font-mono font-bold">£{item.amount.toLocaleString()}</p>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center text-[10px] text-stone-400 py-6">No expenses logged yet.</p>}
          </div>
        </div>
      </div>

      {/* Invoice Modal Slide */}
      <AnimatePresence>
        {isInvoiceOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white border border-stone-100 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] overflow-y-auto p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Generate Invoice</h3>
                <button onClick={() => setIsInvoiceOpen(false)} className="p-3 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Select Client</label>
                  <input 
                    placeholder="Client Name" 
                    value={invoiceClient} 
                    onChange={(e) => setInvoiceClient(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Amount (£)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={invoiceAmount} 
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">VAT Rate (%)</label>
                  <select 
                    value={invoiceVat} 
                    onChange={(e) => setInvoiceVat(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Discount Amount (£)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={invoiceDiscount} 
                    onChange={(e) => setInvoiceDiscount(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Billing Frequency</label>
                  <select 
                    value={invoiceFrequency} 
                    onChange={(e) => setInvoiceFrequency(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  >
                    <option value="one-off">One-Off</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Project Reference</label>
                  <input 
                    placeholder="Project Number/Name" 
                    value={invoiceProject} 
                    onChange={(e) => setInvoiceProject(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Terms & Instructions</label>
                <textarea 
                  placeholder="Additional conditions..."
                  value={invoiceTerms} 
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none h-28"
                />
              </div>

              <div className="flex justify-end gap-6 border-t border-stone-50 pt-6">
                <button onClick={() => setIsInvoiceOpen(false)} className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer">Cancel</button>
                <button 
                  onClick={addInvoice} 
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  Save Invoice
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Modal Slide */}
      <AnimatePresence>
        {isQuoteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white border border-stone-100 w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] overflow-y-auto p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Generate Quote</h3>
                <button onClick={() => setIsQuoteOpen(false)} className="p-3 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Select Client</label>
                  <input 
                    placeholder="Client Name" 
                    value={quoteClient} 
                    onChange={(e) => setQuoteClient(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Amount (£)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={quoteAmount} 
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-6 border-t border-stone-50 pt-6">
                <button onClick={() => setIsQuoteOpen(false)} className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer">Cancel</button>
                <button 
                  onClick={addQuote} 
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  Save Quote
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Modal Slide */}
      <AnimatePresence>
        {isExpenseOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white border border-stone-100 w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Log Expense</h3>
                <button onClick={() => setIsExpenseOpen(false)} className="p-3 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"><X size={18}/></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Vendor Name</label>
                  <input 
                    placeholder="Vendor Name" 
                    value={expenseVendor} 
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Amount (£)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={expenseAmount} 
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Category</label>
                  <select 
                    value={expenseCategory} 
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  >
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-6 border-t border-stone-50 pt-6">
                <button onClick={() => setIsExpenseOpen(false)} className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer">Cancel</button>
                <button 
                  onClick={addExpense} 
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewDetailsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Accounts Summary</h3>
                <button onClick={() => setIsViewDetailsOpen(false)} className="p-3 rounded-full hover:bg-stone-100 cursor-pointer"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4">Gross Margin</p>
                  <p className="text-4xl font-mono tracking-tight">{metrics.grossMargin}%</p>
                </div>
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4">Operating Costs</p>
                  <p className="text-4xl font-mono tracking-tight">£{metrics.operatingCosts.toLocaleString()}</p>
                </div>
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4">Projected Tax</p>
                  <p className="text-4xl font-mono tracking-tight">£{metrics.projectedTax.toLocaleString()}</p>
                </div>
                <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] mb-4">Annual Run Rate</p>
                  <p className="text-4xl font-mono tracking-tight">£{metrics.annualForecast.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Directory Modal */}
      <AnimatePresence>
        {isClientDirectoryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white w-full max-w-5xl max-h-[80vh] rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Client Directory</h3>
                <button onClick={() => setIsClientDirectoryOpen(false)} className="p-3 rounded-full hover:bg-stone-100 cursor-pointer"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clients.map((c) => (
                  <div key={c.id} className="p-6 bg-stone-50 border border-stone-100 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black tracking-wide">{c.name}</p>
                      <p className="text-[10px] text-stone-400 mt-1">{c.email}</p>
                    </div>
                    <p className="text-xs font-mono font-bold">Spent: £{c.totalSpent.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6 space-y-6">
                <h4 className="text-sm font-serif italic">Add New Client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input 
                    placeholder="Name" 
                    value={newClientName} 
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold outline-none focus:ring-4 ring-[#a9b897]/5"
                  />
                  <input 
                    placeholder="Email Address" 
                    value={newClientEmail} 
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold outline-none focus:ring-4 ring-[#a9b897]/5"
                  />
                </div>
                <div className="flex justify-end">
                  <button onClick={addClient} className="px-6 py-3 bg-stone-900 text-white text-xs font-bold rounded-2xl hover:bg-stone-800 cursor-pointer">Save Client</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {isAnalyticsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Analytics & Insights</h3>
                <button onClick={() => setIsAnalyticsOpen(false)} className="p-3 rounded-full hover:bg-stone-100 cursor-pointer"><X size={18}/></button>
              </div>
              <div className="space-y-6">
                <p className="text-xs font-medium text-stone-500 leading-relaxed">
                  Year-to-date performance remains steady. Based on the trailing twelve months (TTM), 
                  the consulting and retainer-based revenue has grown by 18%. Operating costs are maintained within the projected 35% margin.
                </p>
                <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
                  <div className="w-[68%] bg-[#a9b897] h-full" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase">
                  <span>Gross Margin Capacity</span>
                  <span>Target: 75%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Receipts Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Upload Receipts</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 rounded-full hover:bg-stone-100 cursor-pointer"><X size={18}/></button>
              </div>
              <div className="border-4 border-dashed border-stone-200 rounded-3xl p-16 flex flex-col items-center gap-6 text-center">
                <Upload size={32} className="text-[#a9b897]" />
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Drag and drop receipts here</span>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-3 bg-stone-900 text-white text-xs font-bold rounded-2xl cursor-pointer">Done</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tax Calculator Modal */}
      <AnimatePresence>
        {isTaxCalcOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-6"
          >
            <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif italic text-stone-800">Tax Estimation</h3>
                <button onClick={() => setIsTaxCalcOpen(false)} className="p-3 rounded-full hover:bg-stone-100 cursor-pointer"><X size={18}/></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Gross Income (£)</label>
                  <input 
                    type="number" 
                    value={taxIncome} 
                    onChange={(e) => setTaxIncome(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Deductible Expenses (£)</label>
                  <input 
                    type="number" 
                    value={taxDeductions} 
                    onChange={(e) => setTaxDeductions(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.2em]">Estimated Liability</span>
                  <p className="text-2xl font-mono mt-2 font-bold">
                    £{Math.max(0, (parseFloat(taxIncome) - parseFloat(taxDeductions)) * 0.19).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setIsTaxCalcOpen(false)} className="px-6 py-3 bg-stone-900 text-white text-xs font-bold rounded-2xl cursor-pointer">Calculate</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}