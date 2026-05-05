"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Send, 
  Percent,
  Minus,
  Mail,
  FileText,
  Save,
  Check,
  Briefcase,
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  FileDigit,
  UserPlus,
  Clock,
  Calendar,
  X,
  Award,
  DollarSign,
  Upload,
  Eye,
  FileCheck,
  Ban,
  Link2,
  Trash2
} from "lucide-react";

export default function FinancialsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("financials"); // 'financials', 'hr', 'timesheets'

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
  const [quoteVat, setQuoteVat] = useState("0");
  const [quoteDiscount, setQuoteDiscount] = useState("");
  const [quoteProject, setQuoteProject] = useState("");
  const [quoteTerms, setQuoteTerms] = useState("");

  // Expense Fields
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseProject, setExpenseProject] = useState("");

  // Ledger States
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  
  // Payroll / HR states
  const [payrollEntries, setPayrollEntries] = useState<any[]>([
    { id: "1", employee: "Sarah Chen", role: "Developer", total: 2000, dateOfPay: "2026-05-28" }
  ]);
  
  // Advanced HR Form
  const [empName, setEmpName] = useState("Jane Doe");
  const [empNumber, setEmpNumber] = useState("EMP-0401");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [contractType, setContractType] = useState("Full-Time");
  const [workingHours, setWorkingHours] = useState("40");
  const [holidayEntitlement, setHolidayEntitlement] = useState("28");
  const [dateOfPayDue, setDateOfPayDue] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinNumber, setNextOfKinNumber] = useState("");
  
  // Timesheets Data & State
  const [selectedWeek, setSelectedWeek] = useState("2026-W18");
  const [timesheetList, setTimesheetList] = useState<any[]>([
    { id: "1", client: "Cyberdyne Systems", task: "Platform Integration", mon: 4, tue: 8, wed: 6, thu: 8, fri: 4, sat: 0, sun: 0 },
    { id: "2", client: "Aperture Labs", task: "Bug Fixing", mon: 2, tue: 2, wed: 4, thu: 2, fri: 2, sat: 0, sun: 0 }
  ]);
  
  const [timesheetClient, setTimesheetClient] = useState("");
  const [timesheetTask, setTimesheetTask] = useState("");
  const [timesheetMon, setTimesheetMon] = useState("0");
  const [timesheetTue, setTimesheetTue] = useState("0");
  const [timesheetWed, setTimesheetWed] = useState("0");
  const [timesheetThu, setTimesheetThu] = useState("0");
  const [timesheetFri, setTimesheetFri] = useState("0");
  const [timesheetSat, setTimesheetSat] = useState("0");
  const [timesheetSun, setTimesheetSun] = useState("0");
  
  const [vatRate, setVatRate] = useState("20"); 
  const [discountAmount, setDiscountAmount] = useState("");
  
  const [balanceSheet] = useState({ assets: 156000, liabilities: 28500, equity: 127500 });
  const [cashFlow] = useState({ inflows: 35000, outflows: 18000, net: 17000 });
  const [accountsReceivable] = useState([{ id: "AR-1", customer: "Cyberdyne Systems", balance: 5400 }]);
  const [incomeStatement] = useState({ grossRevenue: 142500, cogs: 24000, netIncome: 73500 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName,
        amount: parseFloat(newItemAmount),
        quantity: parseInt(newItemQty) || 1,
        total: parseFloat(newItemAmount) * (parseInt(newItemQty) || 1),
      }
    ]);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemQty("1");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

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

  const addTimesheetEntry = () => {
    if (!timesheetClient || !timesheetTask) return;
    setTimesheetList([
      ...timesheetList,
      {
        id: Date.now().toString(),
        client: timesheetClient,
        task: timesheetTask,
        mon: parseFloat(timesheetMon) || 0,
        tue: parseFloat(timesheetTue) || 0,
        wed: parseFloat(timesheetWed) || 0,
        thu: parseFloat(timesheetThu) || 0,
        fri: parseFloat(timesheetFri) || 0,
        sat: parseFloat(timesheetSat) || 0,
        sun: parseFloat(timesheetSun) || 0,
      }
    ]);
    setTimesheetClient("");
    setTimesheetTask("");
    setTimesheetMon("0");
    setTimesheetTue("0");
    setTimesheetWed("0");
    setTimesheetThu("0");
    setTimesheetFri("0");
    setTimesheetSat("0");
    setTimesheetSun("0");
  };

  const deleteTimesheetEntry = (id: string) => {
    setTimesheetList(timesheetList.filter((item) => item.id !== id));
  };

  const calculateTotalWeeklyHours = () => {
    return timesheetList.reduce(
      (acc, curr) => acc + curr.mon + curr.tue + curr.wed + curr.thu + curr.fri + curr.sat + curr.sun,
      0
    );
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discount = discountAmount === "" ? 0 : parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = taxableAmount * (parseFloat(vatRate) / 100);
  const total = taxableAmount + vat;

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <BarChart3 size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Financial & Employee Operations Center</p>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tighter">Financial Accounts & Records</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Secure Connection</p>
        </div>
      </header>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-stone-800 rounded-2xl text-[#a9b897]"><TrendingUp size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Capital Flow</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter">£{metrics.revYtd.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Aggregate YTD Rev</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ShieldAlert size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Liabilities</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.liabilities.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Active Balance</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><ShieldCheck size={24} /></div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">VAT Pool</span>
          </div>
          <div>
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.vatPool.toLocaleString()}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Accrued VAT</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]">
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

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-4 border-b border-stone-200 pb-4">
        <button 
          onClick={() => setActiveTab("financials")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "financials" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Financials
        </button>
        <button 
          onClick={() => setActiveTab("hr")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "hr" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          HR & Payroll
        </button>
        <button 
          onClick={() => setActiveTab("timesheets")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "timesheets" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Timesheets
        </button>
      </div>

      {/* TAB CONTENTS */}
      
      {/* 1. FINANCIALS TAB */}
      {activeTab === "financials" && (
        <div className="space-y-12">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-6 pt-4">
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
                        placeholder="Client Name or Reference" 
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
                        <option value="0">0% (Optional)</option>
                        <option value="5">5% (Reduced Rate)</option>
                        <option value="20">20% (Standard Rate)</option>
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
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Project Link</label>
                      <input 
                        placeholder="Project Name or Reference" 
                        value={invoiceProject} 
                        onChange={(e) => setInvoiceProject(e.target.value)}
                        className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Terms & Conditions</label>
                    <textarea 
                      placeholder="Payment terms, special instructions, or notes"
                      value={invoiceTerms} 
                      onChange={(e) => setInvoiceTerms(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none h-28"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-stone-50 pt-6">
                    <button 
                      onClick={() => alert("Invoice previewing...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Eye size={14} /> Preview Invoice
                    </button>
                    <button 
                      onClick={() => alert("Invoice emailed...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Mail size={14} /> Email Invoice
                    </button>
                    <button 
                      onClick={() => alert("Invoice approved...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <FileCheck size={14} /> Approve
                    </button>
                    <button 
                      onClick={() => alert("Invoice voided...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Ban size={14} /> Void
                    </button>
                  </div>

                  <div className="flex justify-end gap-6 border-t border-stone-50 pt-6">
                    <button onClick={() => setIsInvoiceOpen(false)} className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer">Cancel</button>
                    <button 
                      onClick={addInvoice} 
                      className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                    >
                      Save as Draft
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
                        placeholder="Client Name or Reference" 
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
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">VAT Rate (%)</label>
                      <select 
                        value={quoteVat} 
                        onChange={(e) => setQuoteVat(e.target.value)}
                        className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      >
                        <option value="0">0% (Optional)</option>
                        <option value="5">5% (Reduced Rate)</option>
                        <option value="20">20% (Standard Rate)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Discount Amount (£)</label>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={quoteDiscount} 
                        onChange={(e) => setQuoteDiscount(e.target.value)}
                        className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Project Link</label>
                      <input 
                        placeholder="Project Name or Reference" 
                        value={quoteProject} 
                        onChange={(e) => setQuoteProject(e.target.value)}
                        className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Terms & Conditions</label>
                    <textarea 
                      placeholder="Quote notes, validity period, or specific scopes"
                      value={quoteTerms} 
                      onChange={(e) => setQuoteTerms(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none h-28"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-stone-50 pt-6">
                    <button 
                      onClick={() => alert("Quote previewing...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Eye size={14} /> Preview Quote
                    </button>
                    <button 
                      onClick={() => alert("Quote emailed...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Mail size={14} /> Email Quote
                    </button>
                    <button 
                      onClick={() => alert("Quote converted...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <FileText size={14} /> Convert into Invoice
                    </button>
                    <button 
                      onClick={() => alert("Quote voided...")}
                      className="px-6 py-3 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-stone-100 cursor-pointer"
                    >
                      <Ban size={14} /> Void
                    </button>
                  </div>

                  <div className="flex justify-end gap-6 border-t border-stone-50 pt-6">
                    <button onClick={() => setIsQuoteOpen(false)} className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer">Cancel</button>
                    <button 
                      onClick={addQuote} 
                      className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                    >
                      Save as Draft
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
                <div className="bg-white border border-stone-100 w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif italic text-stone-800">Log Expense</h3>
                    <button onClick={() => setIsExpenseOpen(false)} className="p-3 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"><X size={18}/></button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Vendor Name</label>
                      <input 
                        placeholder="Company or Vendor Name" 
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
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Add to Project (Optional)</label>
                      <input 
                        placeholder="Link Project" 
                        value={expenseProject} 
                        onChange={(e) => setExpenseProject(e.target.value)}
                        className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Upload Receipt</label>
                      <div className="mt-3 border-2 border-dashed border-stone-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 bg-stone-50 cursor-pointer hover:border-stone-400 transition-all">
                        <Upload size={24} className="text-[#a9b897]" />
                        <span className="text-xs font-bold text-stone-600">Click to upload receipt or drag and drop</span>
                        <span className="text-[10px] text-stone-400">PDF, PNG or JPG (Max 10MB)</span>
                      </div>
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

          {/* Financial Records Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-serif italic mb-6">Recent Invoices</h2>
              <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 divide-y divide-stone-100 shadow-sm">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center py-6 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-stone-800">{inv.client}</p>
                      <p className="text-[10px] text-stone-400 mt-1 uppercase font-mono">{inv.id} &bull; {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-mono text-stone-800 text-sm">£{inv.amount.toLocaleString()}</p>
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-serif italic mb-6">Recent Quotes</h2>
              <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 divide-y divide-stone-100 shadow-sm">
                {quotes.map((q) => (
                  <div key={q.id} className="flex justify-between items-center py-6 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-black text-stone-800">{q.client}</p>
                      <p className="text-[10px] text-stone-400 mt-1 uppercase font-mono">{q.id} &bull; {q.date}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-mono text-stone-800 text-sm">£{q.amount.toLocaleString()}</p>
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HR & PAYROLL TAB */}
      {activeTab === "hr" && (
        <div className="space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            <div className="xl:col-span-2 bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm">
              <h3 className="text-2xl font-serif italic mb-8">Add New Employee Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Name</label>
                  <input 
                    value={empName} 
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Number</label>
                  <input 
                    value={empNumber} 
                    onChange={(e) => setEmpNumber(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role Title</label>
                  <input 
                    value={empRole} 
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Contract Type</label>
                  <select 
                    value={contractType} 
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  >
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                    <option>Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Working Hours (Weekly)</label>
                  <input 
                    value={workingHours} 
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Holiday Entitlement</label>
                  <input 
                    value={holidayEntitlement} 
                    onChange={(e) => setHolidayEntitlement(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Bank Name</label>
                  <input 
                    placeholder="Barclays / NatWest"
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Account Number</label>
                  <input 
                    value={accountNumber} 
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Sort Code</label>
                  <input 
                    value={sortCode} 
                    onChange={(e) => setSortCode(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Next of Kin Name</label>
                  <input 
                    value={nextOfKinName} 
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-6 mt-8 border-t border-stone-100 pt-6">
                <button 
                  onClick={() => {
                    setEmpName(""); setEmpNumber(""); setEmpRole("");
                  }} 
                  className="px-6 py-4 text-xs font-bold text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  Clear Form
                </button>
                <button 
                  onClick={() => alert("Employee profile saved to HR database!")} 
                  className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </div>

            {/* Payroll History Panel */}
            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col gap-8 justify-between">
              <div>
                <h3 className="text-2xl font-serif italic mb-6">Payroll Ledger</h3>
                <div className="space-y-4 divide-y divide-stone-50">
                  {payrollEntries.map((p) => (
                    <div key={p.id} className="pt-4 first:pt-0 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-stone-800">{p.employee}</p>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400 mt-1">{p.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-stone-800">£{p.total.toLocaleString()}</p>
                        <p className="text-[9px] uppercase tracking-wider text-green-600 mt-1">Paid: {p.dateOfPay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={() => alert("Executing standard monthly payroll...")}
                className="w-full mt-6 py-5 bg-[#a9b897]/10 text-[#a9b897] rounded-[2rem] text-xs font-black tracking-widest uppercase hover:bg-[#a9b897]/20 transition-all"
              >
                Run Monthly Payroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TIMESHEETS TAB */}
      {activeTab === "timesheets" && (
        <div className="space-y-12">
          {/* Timesheet Summary/Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-stone-200 p-8 rounded-[2.5rem] shadow-sm gap-6">
            <div>
              <h2 className="text-2xl font-serif italic mb-2">Weekly Timesheets</h2>
              <p className="text-xs text-stone-400 tracking-wide">
                Aggregate Weekly Hours Logged: <span className="font-mono font-bold text-stone-800">{calculateTotalWeeklyHours()} hrs</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="week" 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
              />
            </div>
          </div>

          {/* Timesheet Data Entry Form */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm">
            <h3 className="text-xl font-serif italic mb-8">Add New Timesheet Entry</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Client Name</label>
                <input 
                  placeholder="e.g. Aperture Labs" 
                  value={timesheetClient} 
                  onChange={(e) => setTimesheetClient(e.target.value)}
                  className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Task / Description</label>
                <input 
                  placeholder="e.g. Platform Integration" 
                  value={timesheetTask} 
                  onChange={(e) => setTimesheetTask(e.target.value)}
                  className="w-full mt-3 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold focus:ring-4 ring-[#a9b897]/5 outline-none"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-7 gap-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                  const dayStateMap = [
                    timesheetMon, timesheetTue, timesheetWed, 
                    timesheetThu, timesheetFri, timesheetSat, 
                    timesheetSun
                  ];
                  const setDayStateMap = [
                    setTimesheetMon, setTimesheetTue, setTimesheetWed, 
                    setTimesheetThu, setTimesheetFri, setTimesheetSat, 
                    setTimesheetSun
                  ];

                  return (
                    <div key={day} className="flex flex-col items-center">
                      <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{day}</label>
                      <input 
                        type="number" 
                        min="0" 
                        step="0.5" 
                        value={dayStateMap[idx]} 
                        onChange={(e) => setDayStateMap[idx](e.target.value)}
                        className="w-full bg-stone-50 border border-stone-100 rounded-xl p-2 text-center text-xs font-bold focus:ring-4 ring-[#a9b897]/5 outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end gap-6 mt-8 border-t border-stone-100 pt-6">
              <button 
                onClick={addTimesheetEntry} 
                className="px-8 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-3"
              >
                <Plus size={16} /> Add Timesheet Entry
              </button>
            </div>
          </div>

          {/* Timesheet List Table */}
          <div className="bg-white border border-stone-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 text-[9px] font-black tracking-widest uppercase">
                    <th className="py-6 px-8">Client</th>
                    <th className="py-6 px-8">Task</th>
                    <th className="py-6 px-8 text-center">Mon</th>
                    <th className="py-6 px-8 text-center">Tue</th>
                    <th className="py-6 px-8 text-center">Wed</th>
                    <th className="py-6 px-8 text-center">Thu</th>
                    <th className="py-6 px-8 text-center">Fri</th>
                    <th className="py-6 px-8 text-center">Sat</th>
                    <th className="py-6 px-8 text-center">Sun</th>
                    <th className="py-6 px-8 text-right">Total</th>
                    <th className="py-6 px-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-800">
                  {timesheetList.map((entry) => {
                    const rowTotal = entry.mon + entry.tue + entry.wed + entry.thu + entry.fri + entry.sat + entry.sun;
                    return (
                      <tr key={entry.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-6 px-8">{entry.client}</td>
                        <td className="py-6 px-8 text-stone-400 text-[11px]">{entry.task}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.mon}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.tue}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.wed}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.thu}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.fri}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.sat}</td>
                        <td className="py-6 px-8 text-center font-mono">{entry.sun}</td>
                        <td className="py-6 px-8 text-right font-mono text-stone-900 font-bold">{rowTotal} hrs</td>
                        <td className="py-6 px-8 text-right">
                          <button 
                            onClick={() => deleteTimesheetEntry(entry.id)} 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {timesheetList.length === 0 && (
              <div className="py-16 text-center text-stone-400 text-xs">No entries for this time period.</div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
}