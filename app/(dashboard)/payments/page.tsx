"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Banknote, 
  Plus, 
  Calculator, 
  Send, 
  Percent,
  Minus,
  Mail,
  FileText,
  Save,
  Check,
  UserPlus,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  BarChart3,
  Search,
  DollarSign,
  Users,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  FolderLock
} from "lucide-react";

export default function FinancePage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Dashboard Metrics 
  const [metrics, setMetrics] = useState({
    revenue: 124500,
    totalHours: 320,
    payrollEst: 8000,
    overdueCount: 2,
    tasksDone: 14,
    activeRunRate: 154000,
    activeBudget: 220000,
    pendingInvoices: 5
  });

  // Ledger States
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  
  // Quotes & Invoices state
  const [quotes, setQuotes] = useState<any[]>([
    { id: "1", client: "Aperture Labs", amount: 12000, status: "pending", date: "2026-05-12" },
    { id: "2", client: "Black Mesa Corp", amount: 4500, status: "approved", date: "2026-05-15" }
  ]);
  const [quoteClient, setQuoteClient] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  
  // Payroll / Ledger states
  const [payrollEntries, setPayrollEntries] = useState<any[]>([
    { id: "1", employee: "John Doe", role: "Developer", rate: 50, hours: 40, total: 2000 },
    { id: "2", employee: "Sarah Lee", role: "Designer", rate: 45, hours: 38, total: 1710 }
  ]);
  const [empNameInput, setEmpNameInput] = useState("");
  const [empRoleInput, setEmpRoleInput] = useState("");
  const [empHoursInput, setEmpHoursInput] = useState("");
  const [empRateInput, setEmpRateInput] = useState("");

  // Common ledger control states
  const [vatRate, setVatRate] = useState("20"); 
  const [discountAmount, setDiscountAmount] = useState("");
  const [liabilityLabel, setNewLiabilityLabel] = useState("");
  const [liabilityAmount, setNewLiabilityAmount] = useState("");
  
  // Onboarding states
  const [empName, setEmpName] = useState("Jane Doe");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [bankDetails, setBankDetails] = useState("");
  const [nextOfKin, setNextOfKin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ledger item handlers
  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    const amount = parseFloat(newItemAmount);
    const qty = parseInt(newItemQty) || 1;

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        name: newItemName,
        amount: amount,
        quantity: qty,
        total: amount * qty,
      }
    ]);

    setNewItemName("");
    setNewItemAmount("");
    setNewItemQty("1");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Quotes handlers
  const addQuote = () => {
    if (!quoteClient || !quoteAmount) return;
    setQuotes([
      ...quotes,
      {
        id: Date.now().toString(),
        client: quoteClient,
        amount: parseFloat(quoteAmount),
        status: "pending",
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setQuoteClient("");
    setQuoteAmount("");
  };

  // Payroll handlers
  const addPayrollEntry = () => {
    if (!empNameInput || !empRateInput || !empHoursInput) return;
    const rate = parseFloat(empRateInput);
    const hours = parseFloat(empHoursInput);

    setPayrollEntries([
      ...payrollEntries,
      {
        id: Date.now().toString(),
        employee: empNameInput,
        role: empRoleInput || "Staff",
        rate,
        hours,
        total: rate * hours
      }
    ]);

    setEmpNameInput("");
    setEmpRoleInput("");
    setEmpHoursInput("");
    setEmpRateInput("");
  };

  // Invoice calculations
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const vat = taxableAmount * (parseFloat(vatRate) / 100);
  const total = taxableAmount + vat;

  // Global functions
  const handleDispatch = () => {
    if (items.length === 0) {
      alert("Ledger is empty. Add elements to this invoice before dispatching.");
      return;
    }
    alert(`Invoice dispatched to workspace with a total of £${total.toFixed(2)}.`);
  };

  const handleSaveDraft = () => {
    alert("Ledger entry saved to draft state.");
  };

  const handleApprove = () => {
    alert("Invoice approved.");
  };

  const handleVoid = () => {
    setItems([]);
    setDiscountAmount("");
    alert("Ledger entry cleared.");
  };

  const handleLiability = () => {
    if (!liabilityLabel || !liabilityAmount) {
      alert("Please fill both Liability Label and Amount.");
      return;
    }
    alert(`Liability ${liabilityLabel} registered at £${liabilityAmount}.`);
    setNewLiabilityLabel("");
    setNewLiabilityAmount("");
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 lg:p-12 max-w-[1600px] mx-auto space-y-12">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#a9b897]">
            <BarChart3 size={14} />
            <p className="font-black uppercase text-[9px] tracking-[0.4em]">Integrated Intelligence and Finance Suite</p>
          </div>
          <h1 className="text-6xl font-serif italic tracking-tighter">Performance, Ledger & Operations</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Telemetry Active</p>
        </div>
      </header>

      {/* METRIC CARD SUITE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-stone-900 text-stone-100 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group"
        >
          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-stone-800 rounded-2xl text-[#a9b897]">
              <TrendingUp size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em]">Capital Flow</span>
          </div>
          <div className="z-10 mt-8">
            <p className="text-4xl font-mono tracking-tighter">£{metrics.revenue.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 uppercase font-black mt-2 tracking-widest">Aggregate Revenue</p>
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
            <Banknote size={160} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Execution</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{metrics.tasksDone}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Completed Nodes</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
              <Clock size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Efficiency</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-stone-800">{metrics.totalHours}<span className="text-xl ml-1 text-stone-400 font-serif italic">hrs</span></p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Labor Deployment</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#fff1f1] border border-red-100 p-10 rounded-[2.5rem] flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200">
              <AlertCircle size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-red-400 tracking-[0.3em]">Risk Assessment</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-red-600">{metrics.overdueCount}</p>
            <p className="text-[10px] text-red-400 uppercase font-black mt-2 tracking-widest italic">Overdue Invoices</p>
          </div>
        </motion.div>
        
        {/* WIDGET TWO: RUN-RATE AND BUDGETARY SUITE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px]"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <Activity size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Run-Rate</span>
          </div>
          <div className="mt-8">
            <p className="text-4xl font-mono tracking-tighter text-stone-800">£{metrics.activeRunRate || "154k"}</p>
            <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Annual Run-Rate</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white border border-stone-200 p-10 rounded-[2.5rem] shadow-sm flex flex-col justify-between min-h-[220px] md:col-span-3"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-stone-100 text-stone-800 rounded-2xl">
              <FolderLock size={24} />
            </div>
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Liability / Budget Metrics</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mt-8">
            <div>
              <p className="text-5xl font-mono tracking-tighter text-stone-900">£{metrics.activeBudget.toLocaleString()}</p>
              <p className="text-[10px] text-stone-400 uppercase font-black mt-2 tracking-widest">Total Capital Liability</p>
            </div>
            <div className="bg-stone-50 border border-stone-100 px-6 py-4 rounded-2xl flex items-center gap-4">
              <DollarSign size={20} className="text-[#a9b897]" />
              <div>
                <p className="text-xs font-bold text-stone-800">£{metrics.payrollEst.toLocaleString()} Monthly Payroll</p>
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-0.5">Calculated Run Rate Costs</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* LOWER SECTION: WORKSPACES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-stone-200">
        
        {/* COLUMN 1: SIDEBAR / LIABILITY AND INVOICE ENTRIES */}
        <div className="lg:col-span-1 space-y-8 h-fit">
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-stone-800 tracking-tight">New Ledger Entry</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Add an item to this invoice</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Item Description</label>
                <input
                  placeholder="e.g. Node Maintenance"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Price (£)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none transition-all font-medium placeholder:text-stone-300 text-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Quantity</label>
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                  />
                </div>
              </div>

              <button
                onClick={addItem}
                disabled={!newItemName || !newItemAmount}
                className="w-full py-5 rounded-[2rem] flex justify-center items-center gap-4 bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-800 transition-all cursor-pointer font-bold tracking-[0.2em] text-xs uppercase shadow-xl"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm space-y-6">
            <h3 className="text-xl font-serif italic text-stone-800 tracking-tight">Add Liability</h3>
            <div className="space-y-4">
              <input
                placeholder="Liability Label"
                value={liabilityLabel}
                onChange={(e) => setNewLiabilityLabel(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <input
                type="number"
                placeholder="Amt (£)"
                value={liabilityAmount}
                onChange={(e) => setNewLiabilityAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <button
                onClick={handleLiability}
                className="w-full py-3 border border-stone-200 text-stone-700 rounded-2xl text-xs uppercase font-bold hover:bg-stone-50 cursor-pointer"
              >
                Add Liability
              </button>
            </div>
          </div>
          
          {/* QUOTE CREATION SUITE */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={18} className="text-[#a9b897]" />
              <h3 className="text-xl font-serif italic text-stone-800 tracking-tight">Create Quote</h3>
            </div>
            <div className="space-y-4">
              <input
                placeholder="Client Name"
                value={quoteClient}
                onChange={(e) => setQuoteClient(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <input
                type="number"
                placeholder="Amount (£)"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl h-10 px-4 text-xs font-bold outline-none text-stone-800"
              />
              <button
                onClick={addQuote}
                className="w-full py-3 border border-stone-200 text-stone-700 rounded-2xl text-xs uppercase font-bold hover:bg-stone-50 cursor-pointer"
              >
                Save Quote
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2 AND 3: PAYROLL, TEAM MATRIX, INVOICE AND QUOTES WORKSPACES */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TEAM MATRIX ONBOARDING MODULE */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
            <div className="flex items-center gap-3 text-stone-800">
              <UserPlus size={18} className="text-[#a9b897]" />
              <h4 className="text-xl font-serif italic tracking-tight">Onboard New Team Member</h4>
            </div>
            <p className="text-[10px] uppercase font-black tracking-widest text-stone-400">Team Matrix Database Update</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Name</label>
                <input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Role/Title</label>
                <input
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Bank Details</label>
                <input
                  placeholder="Bank name and account information"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Next of Kin</label>
                <input
                  placeholder="Name and number"
                  value={nextOfKin}
                  onChange={(e) => setNextOfKin(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:ring-4 ring-[#a9b897]/5 outline-none font-medium text-stone-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm text-stone-800 focus:ring-4 ring-[#a9b897]/5 outline-none font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-[0.2em]">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm text-stone-800 focus:ring-4 ring-[#a9b897]/5 outline-none font-medium"
                />
              </div>
            </div>

            <button 
              onClick={() => alert(`Team Member ${empName} submitted successfully.`)}
              className="w-full py-4 bg-[#a9b897]/20 border border-[#a9b897]/30 text-stone-900 rounded-2xl text-xs uppercase font-bold hover:bg-[#a9b897]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Briefcase size={14} /> Submit to Team Matrix
            </button>
          </div>

          {/* PAYROLL LEDGER MODULE */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-serif italic text-stone-800 tracking-tight">Active Payroll Log</h4>
              <Users size={18} className="text-stone-400" />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  placeholder="Name"
                  value={empNameInput}
                  onChange={(e) => setEmpNameInput(e.target.value)}
                  className="h-10 bg-stone-50 border border-stone-100 rounded-xl px-4 text-xs font-semibold outline-none text-stone-800"
                />
                <input
                  placeholder="Role"
                  value={empRoleInput}
                  onChange={(e) => setEmpRoleInput(e.target.value)}
                  className="h-10 bg-stone-50 border border-stone-100 rounded-xl px-4 text-xs font-semibold outline-none text-stone-800"
                />
                <input
                  type="number"
                  placeholder="Rate (£/hr)"
                  value={empRateInput}
                  onChange={(e) => setEmpRateInput(e.target.value)}
                  className="h-10 bg-stone-50 border border-stone-100 rounded-xl px-4 text-xs font-semibold outline-none text-stone-800"
                />
                <input
                  type="number"
                  placeholder="Hours"
                  value={empHoursInput}
                  onChange={(e) => setEmpHoursInput(e.target.value)}
                  className="h-10 bg-stone-50 border border-stone-100 rounded-xl px-4 text-xs font-semibold outline-none text-stone-800"
                />
              </div>
              <button 
                onClick={addPayrollEntry}
                className="w-full py-3 bg-stone-900 text-white text-xs font-bold uppercase rounded-2xl hover:bg-stone-800"
              >
                Add Payroll Entry
              </button>
            </div>
            
            <div className="divide-y divide-stone-100 mt-4">
              {payrollEntries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center py-3 text-xs font-medium text-stone-800">
                  <div>
                    <span className="font-bold">{entry.employee}</span>
                    <span className="text-stone-400 ml-2">({entry.role})</span>
                  </div>
                  <div>
                    £{entry.total.toFixed(2)} <span className="text-stone-400 text-[10px] ml-2">({entry.hours} hrs @ £{entry.rate}/hr)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* QUOTE MANIFEST MODULE */}
          <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
            <h4 className="text-xl font-serif italic text-stone-800 tracking-tight">Quotes Manifest</h4>
            <div className="divide-y divide-stone-100">
              {quotes.map((q) => (
                <div key={q.id} className="flex justify-between items-center py-4 text-xs">
                  <div>
                    <span className="font-bold text-stone-800">{q.client}</span>
                    <p className="text-[9px] text-stone-400 tracking-wider uppercase mt-1">{q.date}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono font-bold text-stone-900">£{q.amount.toLocaleString()}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      q.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LEDGER ITEMS AREA */}
          {items.length > 0 && (
            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-8">
              <h4 className="text-2xl font-serif italic text-stone-800 tracking-tight">Ledger Items</h4>
              <div className="divide-y divide-stone-100">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-semibold text-stone-800">{item.name}</p>
                      <p className="text-xs text-stone-400">£{item.amount} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-stone-900 font-bold">£{item.total.toFixed(2)}</span>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAX AND TOTAL CALCULATOR SECTION */}
          <div className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">VAT Rate (%)</label>
                <div className="relative">
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none appearance-none transition-all cursor-pointer font-bold"
                  >
                    <option value="0">0% (Zero Rated)</option>
                    <option value="5">5% (Reduced Rate)</option>
                    <option value="20">20% (Standard Rate)</option>
                  </select>
                  <Percent size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-stone-500 tracking-[0.2em]">Discount Amount (£)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-5 text-sm text-white focus:ring-4 ring-[#a9b897]/20 outline-none transition-all placeholder:text-stone-700 font-bold"
                />
              </div>
            </div>

            <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Grand Total</p>
                <p className="text-5xl font-mono tracking-tighter">£{total.toFixed(2)}</p>
              </div>
              <button
                onClick={handleDispatch}
                className="w-full md:w-auto px-10 py-5 rounded-[2rem] bg-[#a9b897] text-stone-900 font-bold tracking-[0.3em] uppercase text-xs flex justify-center items-center gap-4 hover:bg-[#99a888] transition-all"
              >
                <Send size={16} /> Dispatch Ledger
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={handleDispatch} className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm">
              <Mail size={16} /><span className="text-[8px] font-black uppercase tracking-wider">Email Client</span>
            </button>
            <button onClick={() => alert("PDF Export feature processing.")} className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm">
              <FileText size={16} /><span className="text-[8px] font-black uppercase tracking-wider">Export PDF</span>
            </button>
            <button onClick={handleSaveDraft} className="py-4 bg-white border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-700 hover:border-stone-400 transition-all shadow-sm">
              <Save size={16} /><span className="text-[8px] font-black uppercase tracking-wider">Save Draft</span>
            </button>
            <button onClick={handleApprove} className="py-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-600 hover:bg-green-100/40 transition-all cursor-pointer">
              <Check size={16} /><span className="text-[8px] font-black uppercase tracking-wider">Approve</span>
            </button>
          </div>

          <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-red-700">Clear Ledger Data</p>
              <p className="text-[9px] text-red-400 tracking-wider uppercase font-black">Reset invoice values to zero</p>
            </div>
            <button onClick={handleVoid} className="px-6 py-3 bg-red-600 text-white rounded-xl text-[9px] uppercase font-black hover:bg-red-500 shadow-sm">Void</button>
          </div>
        </div>

      </div>
    </div>
  );
}