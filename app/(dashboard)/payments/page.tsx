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
  DollarSign
} from "lucide-react";

export default function FinancialsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("financials"); // 'financials', 'hr', 'timesheets', 'appraisals'

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

  // Independent Documents
  const [invoices, setInvoices] = useState<any[]>([
    { id: "INV-101", client: "Aperture Labs", amount: 14200, status: "approved", date: "2026-05-01" }
  ]);
  const [quotes, setQuotes] = useState<any[]>([
    { id: "QT-004", client: "Black Mesa Corp", amount: 4500, status: "pending", date: "2026-05-15" }
  ]);
  const [expenses, setExpenses] = useState<any[]>([
    { id: "EXP-22", vendor: "Apex Facilities", amount: 2300, status: "pending", date: "2026-05-02" }
  ]);

  // Document Entry Fields
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

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
  
  // Appraisal and Time states
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const [timesheetList, setTimesheetList] = useState<any[]>([
    { id: "1", task: "Client Review", duration: "2.5 hrs", date: "2026-05-04" }
  ]);
  const [taskName, setTaskName] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  
  const [vatRate, setVatRate] = useState("20"); 
  const [discountAmount, setDiscountAmount] = useState("");
  
  const [balanceSheet] = useState({ assets: 156000, liabilities: 28500, equity: 127500 });
  const [cashFlow] = useState({ inflows: 35000, outflows: 18000, net: 17000 });
  const [accountsReceivable] = useState([{ id: "AR-1", customer: "Cyberdyne Systems", balance: 5400 }]);
  const [incomeStatement] = useState({ grossRevenue: 142500, cogs: 24000, netIncome: 73500 });

  const [appraisalAnswers, setAppraisalAnswers] = useState({
    q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", 
    q10: "", q11: "", q12: "", q13: "", q14: "", q15: ""
  });

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
      { id: `INV-${Math.floor(Math.random() * 900) + 100}`, client: invoiceClient, amount: parseFloat(invoiceAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setInvoiceClient("");
    setInvoiceAmount("");
    setIsInvoiceOpen(false);
  };

  const addQuote = () => {
    if (!quoteClient || !quoteAmount) return;
    setQuotes([
      ...quotes,
      { id: `QT-${Math.floor(Math.random() * 900) + 100}`, client: quoteClient, amount: parseFloat(quoteAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setQuoteClient("");
    setQuoteAmount("");
    setIsQuoteOpen(false);
  };

  const addExpense = () => {
    if (!expenseVendor || !expenseAmount) return;
    setExpenses([
      ...expenses,
      { id: `EXP-${Math.floor(Math.random() * 90) + 10}`, vendor: expenseVendor, amount: parseFloat(expenseAmount), status: "pending", date: new Date().toISOString().split('T')[0] }
    ]);
    setExpenseVendor("");
    setExpenseAmount("");
    setIsExpenseOpen(false);
  };

  const addTimesheet = () => {
    if (!taskName || !taskDuration) return;
    setTimesheetList([
      ...timesheetList,
      { id: Date.now().toString(), task: taskName, duration: taskDuration, date: new Date().toISOString().split('T')[0] }
    ]);
    setTaskName("");
    setTaskDuration("");
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
        <button 
          onClick={() => setActiveTab("appraisals")}
          className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all ${
            activeTab === "appraisals" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
          }`}
        >
          Appraisals
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
            <div className="lg:col-span-1 space-y-8 h-fit bg-white p-10 border border-stone-100 rounded-[3.5rem]">
              <h3 className="text-xl font-serif italic text-stone-800">Ledger Activity Summary</h3>
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Recent Documents Created</p>
              
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-xs p-4 bg-stone-50/50 rounded-2xl border">
                  <div>
                    <span className="block font-bold">INV-101</span>
                    <span className="block text-[10px] text-stone-400">Aperture Labs</span>
                  </div>
                  <span className="font-mono font-bold">£14,200</span>
                </div>
                <div className="flex justify-between items-center text-xs p-4 bg-stone-50/50 rounded-2xl border">
                  <div>
                    <span className="block font-bold">QT-004</span>
                    <span className="block text-[10px] text-stone-400">Black Mesa Corp</span>
                  </div>
                  <span className="font-mono font-bold">£4,500</span>
                </div>
                <div className="flex justify-between items-center text-xs p-4 bg-stone-50/50 rounded-2xl border">
                  <div>
                    <span className="block font-bold">EXP-22</span>
                    <span className="block text-[10px] text-stone-400">Apex Facilities</span>
                  </div>
                  <span className="font-mono font-bold">£2,300</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                  <h4 className="text-lg font-serif italic text-stone-800">Balance Sheet</h4>
                  <div className="space-y-3 pt-4 text-xs font-medium">
                    <div className="flex justify-between border-b border-stone-100 pb-2">
                      <span className="text-stone-400">Total Assets</span>
                      <span className="font-mono text-stone-800 font-bold">£{balanceSheet.assets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-2">
                      <span className="text-stone-400">Total Liabilities</span>
                      <span className="font-mono text-stone-800 font-bold">£{balanceSheet.liabilities.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm">
                      <span className="text-stone-800 font-bold">Equity</span>
                      <span className="font-mono text-stone-900 font-bold">£{balanceSheet.equity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                  <h4 className="text-lg font-serif italic text-stone-800">Cash Flow Statement</h4>
                  <div className="space-y-3 pt-4 text-xs font-medium">
                    <div className="flex justify-between border-b border-stone-100 pb-2 text-green-600">
                      <span className="flex items-center gap-2"><ArrowUpRight size={14} /> Inflows</span>
                      <span className="font-mono font-bold">£{cashFlow.inflows.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-2 text-red-500">
                      <span className="flex items-center gap-2"><ArrowDownLeft size={14} /> Outflows</span>
                      <span className="font-mono font-bold">-£{cashFlow.outflows.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-sm">
                      <span className="text-stone-800 font-bold">Net Change</span>
                      <span className="font-mono text-stone-900 font-bold">£{cashFlow.net.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                  <h4 className="text-lg font-serif italic text-stone-800">Accounts Receivable</h4>
                  <div className="space-y-2 pt-2">
                    {accountsReceivable.map((ar) => (
                      <div key={ar.id} className="flex justify-between text-xs py-2 border-b border-stone-50">
                        <span className="font-medium text-stone-800">{ar.customer}</span>
                        <span className="font-mono font-bold">£{ar.balance}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-stone-200 p-8 rounded-[2.5rem] space-y-4">
                  <h4 className="text-lg font-serif italic text-stone-800">Income Statement</h4>
                  <div className="space-y-3 text-xs font-medium pt-2">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Gross Rev</span>
                      <span className="font-mono">£{incomeStatement.grossRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">COGS</span>
                      <span className="font-mono text-red-500">-£{incomeStatement.cogs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-100 pt-2 font-bold">
                      <span className="text-stone-800">Net Income</span>
                      <span className="font-mono text-green-600">£{incomeStatement.netIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                  <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Invoices</h5>
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between text-xs">
                        <span className="font-bold">{inv.client}</span>
                        <span className="font-mono">£{inv.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                  <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Quotes</h5>
                  <div className="space-y-3">
                    {quotes.map((q) => (
                      <div key={q.id} className="flex justify-between text-xs">
                        <span className="font-bold">{q.client}</span>
                        <span className="font-mono">£{q.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-[2rem]">
                  <h5 className="text-[10px] font-black uppercase text-stone-400 mb-4 tracking-widest">Expenses</h5>
                  <div className="space-y-3">
                    {expenses.map((e) => (
                      <div key={e.id} className="flex justify-between text-xs">
                        <span className="font-bold">{e.vendor}</span>
                        <span className="font-mono">£{e.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">VAT Rate (%)</label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none appearance-none cursor-pointer font-bold"
                    >
                      <option value="0">0% (Zero Rated)</option>
                      <option value="5">5% (Reduced Rate)</option>
                      <option value="20">20% (Standard Rate)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Discount Amount (£)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none placeholder:text-stone-700 font-bold"
                    />
                  </div>
                </div>

                <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-left">
                    <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Grand Total</p>
                    <p className="text-5xl font-mono tracking-tighter">£{total.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => alert(`Invoice dispatched, total: ${total}`)}
                    className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-[#a9b897] text-stone-900 font-bold tracking-[0.3em] uppercase text-xs flex justify-center items-center gap-4 hover:bg-[#99a888] transition-all"
                  >
                    <Send size={16} /> Dispatch Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HR & PAYROLL TAB */}
      {activeTab === "hr" && (
        <div className="max-w-4xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
          <div className="flex items-center gap-3 text-stone-800">
            <UserPlus size={18} className="text-[#a9b897]" />
            <h4 className="text-xl font-serif italic">Onboard New Team Member</h4>
          </div>
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Payroll Data Interface</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Name</label>
              <input value={empName} onChange={(e) => setEmpName(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Employee Number</label>
              <input value={empNumber} onChange={(e) => setEmpNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role/Title</label>
              <input value={empRole} onChange={(e) => setEmpRole(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Contract Type</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800">
                <option>Full-Time</option>
                <option>Part-Time</option>
                <option>Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Working Hours & Days</label>
              <input placeholder="e.g. 40 hrs / Mon-Fri" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Holiday Entitlement (Days)</label>
              <input value={holidayEntitlement} onChange={(e) => setHolidayEntitlement(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Date of Pay Due</label>
              <input type="date" value={dateOfPayDue} onChange={(e) => setDateOfPayDue(e.target.value)} className="w-full mt-2 bg-stone-50 border border-stone-100 rounded-2xl p-4 text-xs font-semibold text-stone-800" />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-6 space-y-6">
            <h5 className="text-xs font-bold text-stone-700">Banking & Emergency Details</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Bank Name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Account Number</label>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Sort Code</label>
                <input value={sortCode} onChange={(e) => setSortCode(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Next of Kin Name</label>
                <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Next of Kin Number</label>
                <input value={nextOfKinNumber} onChange={(e) => setNextOfKinNumber(e.target.value)} className="w-full mt-2 bg-stone-50 border p-4 rounded-2xl text-xs font-semibold" />
              </div>
            </div>
          </div>

          <button 
            onClick={() => alert(`Team Member ${empName} updated on payroll ledger`)}
            className="w-full py-4 bg-[#a9b897]/20 border border-[#a9b897]/30 text-stone-900 rounded-2xl text-xs uppercase font-bold hover:bg-[#a9b897]/30 flex items-center justify-center gap-2"
          >
            <Briefcase size={14} /> Submit Employee Record
          </button>
        </div>
      )}

      {/* 3. TIMESHEETS TAB */}
      {activeTab === "timesheets" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-[#a9b897]" />
            <h3 className="text-xl font-serif italic text-stone-800">Timesheets</h3>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-12 px-4 text-xs font-bold outline-none text-stone-800"
            />
            <input
              placeholder="Duration (e.g. 3.5 hrs)"
              value={taskDuration}
              onChange={(e) => setTaskDuration(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-12 px-4 text-xs font-bold outline-none text-stone-800"
            />
            <button
              onClick={addTimesheet}
              className="w-full py-3 bg-stone-900 text-white rounded-2xl text-xs uppercase font-bold hover:bg-stone-800"
            >
              Log Time Entry
            </button>
          </div>
          <div className="divide-y divide-stone-100 mt-4 text-xs">
            {timesheetList.map((t) => (
              <div key={t.id} className="flex justify-between py-3">
                <span className="font-semibold">{t.task}</span>
                <span className="text-stone-400 font-mono">{t.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. APPRAISALS TAB */}
      {activeTab === "appraisals" && (
        <div className="max-w-4xl mx-auto bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xl font-serif font-bold text-stone-800">Employee Appraisal</h4>
              <p className="text-[9px] text-stone-400 tracking-wider font-black uppercase mt-1">Submit appraisal logs for employees</p>
            </div>
            <button 
              onClick={() => setAppraisalOpen(true)}
              className="px-6 py-3 bg-stone-900 text-white text-[10px] uppercase font-bold rounded-2xl hover:bg-stone-800"
            >
              Open Form
            </button>
          </div>

          {appraisalOpen && (
            <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[3.5rem] p-12 overflow-y-auto shadow-2xl relative flex flex-col gap-8">
                <button 
                  onClick={() => setAppraisalOpen(false)}
                  className="absolute right-10 top-10 p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"
                >
                  <X size={16} />
                </button>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic tracking-tighter text-stone-900">Employee Appraisal Subsystem</h2>
                  <p className="text-[10px] font-black text-stone-400 tracking-widest uppercase">Self-Reflection, Growth and Development Records</p>
                </div>

                <div className="space-y-6 text-xs text-stone-800">
                  <h3 className="font-bold border-b border-stone-100 pb-2">1. Self-Reflection & Achievements</h3>
                  <div>
                    <label className="font-black text-stone-500">What accomplishment from this review period are you most proud of?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q1} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q1: e.target.value})} />
                  </div>
                  <div>
                    <label className="font-black text-stone-500">Which of your strengths have you used most effectively in your role?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q2} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q2: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">2. Challenges & Improvements</h3>
                  <div>
                    <label className="font-black text-stone-500">What has been your biggest challenge recently, and how did you address it?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q3} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q3: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">3. Goals & Development</h3>
                  <div>
                    <label className="font-black text-stone-500">What professional skills would you like to develop in the next 6–12 months?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q4} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q4: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">4. Teamwork & Collaboration</h3>
                  <div>
                    <label className="font-black text-stone-500">How do you feel about communication and collaboration within the team?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q5} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q5: e.target.value})} />
                  </div>

                  <h3 className="font-bold border-t border-stone-100 pt-6 pb-2">5. Future Outlook</h3>
                  <div>
                    <label className="font-black text-stone-500">Where do you see yourself in the company in the next 1–3 years?</label>
                    <textarea className="w-full mt-2 bg-stone-50 border rounded-2xl p-4" rows={2} value={appraisalAnswers.q6} onChange={(e) => setAppraisalAnswers({...appraisalAnswers, q6: e.target.value})} />
                  </div>
                </div>

                <button 
                  onClick={() => { setAppraisalOpen(false); alert("Appraisal data successfully recorded in the main system."); }}
                  className="w-full py-5 bg-stone-900 text-white font-bold tracking-widest text-xs uppercase rounded-2xl"
                >
                  Submit Appraisal Records
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Invoice Modal */}
        {isInvoiceOpen && (
          <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3.5rem] p-12 overflow-y-auto shadow-2xl relative">
              <button 
                onClick={() => setIsInvoiceOpen(false)}
                className="absolute right-10 top-10 p-3 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-3xl font-serif italic text-stone-800 tracking-tight mb-8">Generate Invoice</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Client Name</label>
                  <input
                    value={invoiceClient}
                    onChange={(e) => setInvoiceClient(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. Aperture Labs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Quick Flat Amount (£)</label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              {/* Itemized Ledger */}
              <div className="border-t border-stone-100 pt-8 mt-4 space-y-6">
                <h4 className="text-xs font-bold text-stone-700 tracking-wider uppercase">Itemized Line Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input
                      placeholder="Item Name"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Amount (£)"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="w-full bg-stone-50 border p-3 rounded-2xl text-xs font-semibold"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-800"
                >
                  <Plus size={14} /> Add Line Item
                </button>
              </div>

              {items.length > 0 && (
                <div className="mt-8 border rounded-2xl p-6 bg-stone-50/50 space-y-4">
                  <h5 className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Current Items</h5>
                  <div className="divide-y divide-stone-200 text-xs">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2">
                        <span>{item.name} <span className="text-stone-400 text-[10px]">({item.quantity} × £{item.amount})</span></span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold">£{item.total}</span>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Minus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-stone-100 pt-8 mt-8 flex justify-end">
                <button
                  onClick={addInvoice}
                  className="w-full md:w-auto px-8 py-5 rounded-2xl bg-[#a9b897] text-stone-900 text-xs font-black tracking-widest uppercase hover:bg-[#99a888]"
                >
                  Commit Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quote Modal */}
        {isQuoteOpen && (
          <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl relative">
              <button 
                onClick={() => setIsQuoteOpen(false)}
                className="absolute right-10 top-10 p-3 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-3xl font-serif italic text-stone-800 tracking-tight mb-8">Generate Quote</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Client Name</label>
                  <input
                    value={quoteClient}
                    onChange={(e) => setQuoteClient(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. Black Mesa Corp"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Amount (£)</label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. 2000"
                  />
                </div>
                
                <button
                  onClick={addQuote}
                  className="w-full py-5 rounded-2xl bg-[#a9b897] text-stone-900 text-xs font-black tracking-widest uppercase hover:bg-[#99a888] mt-4"
                >
                  Save Quote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense Modal */}
        {isExpenseOpen && (
          <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-2xl relative">
              <button 
                onClick={() => setIsExpenseOpen(false)}
                className="absolute right-10 top-10 p-3 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-3xl font-serif italic text-stone-800 tracking-tight mb-8">Log New Expense</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Vendor Name</label>
                  <input
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. Apex Facilities"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-2">Amount (£)</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full mt-2 bg-stone-50 border rounded-2xl p-4 text-xs font-bold outline-none text-stone-800"
                    placeholder="e.g. 150"
                  />
                </div>

                <button
                  onClick={addExpense}
                  className="w-full py-5 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-xs font-black tracking-widest uppercase hover:bg-red-100/40 mt-4"
                >
                  Log Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}