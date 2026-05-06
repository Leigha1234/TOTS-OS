"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText,
  ShieldAlert,
  FileDigit,
  X,
  TrendingUp,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export default function FinancialsPage({ 
  onNavigate 
}: { 
  onNavigate?: (tab: string) => void; 
}) {
  const [isMounted, setIsMounted] = useState(false);

  // Modal Visibility States
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);

  // Financial Dashboard Metrics 
  const [metrics] = useState({
    revYtd: 142500,
    liabilities: 28500,
    vatPool: 4210,
    calculatedTaxDue: 21660,
  });

  // Document Lists
  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "approved", date: "2026-05-01" }
  ]);
  const [quotes, setQuotes] = useState<any[]>([
    { id: "QT-004", client: "Black Mesa Corp", amount: 4500, status: "pending", date: "2026-05-15" }
  ]);
  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "pending", date: "2026-05-02" }
  ]);

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
        date: new Date().toISOString().split('T')[0] 
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
        date: new Date().toISOString().split('T')[0] 
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
        date: new Date().toISOString().split('T')[0] 
      }
    ]);
    setExpenseVendor("");
    setExpenseAmount("");
    setIsExpenseOpen(false);
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
          onClick={() => onNavigate && onNavigate("financials")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-stone-900 text-white shadow-xl cursor-pointer"
        >
          Financials
        </button>
        <button 
          onClick={() => onNavigate && onNavigate("timesheets")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer"
        >
          Timesheets
        </button>
        <button 
          onClick={() => onNavigate && onNavigate("hr")}
          className="px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer"
        >
          HR & Payroll
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
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ShieldAlert size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Liabilities</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.liabilities.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Active Balance</p>
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

      {/* Financial Operations Forms */}
      <div className="flex flex-wrap gap-6 pt-4 border-t border-stone-200/60 pt-12">
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
    </div>
  );
}