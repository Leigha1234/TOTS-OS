"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, Trash2, UserPlus, Receipt, Users, BarChart3, Download, Zap, X, Mail, 
  Calendar, Printer, Send, CheckCircle2, FileStack, 
  Clock, Briefcase, Landmark, PieChart, Upload, DollarSign, Percent, FileText, Settings, ShieldAlert, BadgeCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ======================================================
   CORE STATE ENGINE & TYPES
====================================================== */
interface AppraisalQuestion {
  id: string;
  question: string;
  response: string;
}

interface Appraisal {
  date: string;
  score?: string;
  notes: string;
  questions: AppraisalQuestion[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  holidayLeft: number;
  holidayEntitlement: number;
  holidays: string[];
  appraisals: Appraisal[];
  email: string;
  phone: string;
  bankDetails: string;
  nextOfKin: string;
  contractType: "Full-Time" | "Part-Time" | "Flexible";
  workingHoursDays: string;
  payDueDate: string;
  employeeNumber: string;
}

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
}

interface ReportRecord {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "P&L" | "Balance Sheet" | "Payroll" | "Expense Audit";
  color: string;
}

const INITIAL_DATA: {
  employees: Employee[];
  contacts: Contact[];
  projects: string[];
  bankDetails: { name: string; account: string; sort: string; bank: string };
  reports: ReportRecord[];
} = {
  employees: [
    { 
      id: "e1", 
      name: "Sarah Chen", 
      role: "Lead Engineer", 
      salary: 85000, 
      holidayLeft: 12, 
      holidayEntitlement: 25,
      holidays: ["2026-05-12"], 
      appraisals: [],
      email: "sarah.chen@apex.com", 
      phone: "+44 7700 9001", 
      bankDetails: "Mercury 88224411", 
      nextOfKin: "James Chen (+44 7700 9002)",
      contractType: "Full-Time", 
      workingHoursDays: "40 hrs / Mon-Fri", 
      payDueDate: "28th Monthly", 
      employeeNumber: "APX-001"
    }
  ],
  contacts: [
    { id: "c1", name: "Sarah Jenkins", company: "Anthropic", email: "s.jenkins@anthropic.com" }
  ],
  projects: ["Q2 Brand Audit", "Next.js Migration", "Internal Architecture"],
  bankDetails: { name: "APEX STRATEGY LTD", account: "88224411", sort: "00-11-22", bank: "Mercury Digital" },
  reports: [
    { id: "r1", name: "Q1 END OF YEAR P&L", date: "April 2026", amount: 142500, type: "P&L", color: "#a9b897" },
    { id: "r2", name: "BALANCE SHEET 2025", date: "April 2026", amount: 204100, type: "Balance Sheet", color: "#d6d3d1" },
  ]
};

const APPRAISAL_QUESTIONS_STRUCTURE: Omit<AppraisalQuestion, 'response'>[] = [
  { id: "q1", question: "What accomplishments are you most proud of?" },
  { id: "q2", question: "Which strengths have you used most effectively?" },
  { id: "q3", question: "Primary challenges met & resolutions applied?" },
  { id: "q4", question: "What professional skills would you like to develop?" },
  { id: "q5", question: "How could communication/collaboration improve?" },
  { id: "q6", question: "How can I, as manager, better support your growth?" }
];

export default function ApexOS() {
  const [activeNode, setActiveNode] = useState("finance");
  const [docType, setDocType] = useState("invoice");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Finance
  const [items, setItems] = useState([{ id: 1, desc: "Technical Architecture Review", qty: 1, rate: 2500 }]);
  const [assignedContact, setAssignedContact] = useState("");
  const [assignedProject, setAssignedProject] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("New");

  // Balance Sheet State (Fully Functional)
  const [balanceSheet, setBalanceSheet] = useState({
    assets: 150000,
    cashAtBank: 85000,
    liabilities: 30000,
    equity: 205000
  });
  const [newAssetLabel, setNewAssetLabel] = useState("");
  const [newAssetAmount, setNewAssetAmount] = useState("");
  const [newLiabilityLabel, setNewLiabilityLabel] = useState("");
  const [newLiabilityAmount, setNewLiabilityAmount] = useState("");

  // HR
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_DATA.employees);
  const [selectedEmpId, setSelectedEmpId] = useState("e1");
  const [appraisalForm, setAppraisalForm] = useState<Record<string, string>>({});

  // Onboarding
  const [onboardForm, setOnboardForm] = useState({
    name: "", role: "", email: "", phone: "", salary: "",
    holidayEntitlement: "25", contractType: "Full-Time", workingHoursDays: "Mon-Fri / 9-5",
    payDueDate: "28th Monthly", bankName: "", accountNumber: "", sortCode: "", nextOfKinName: "", nextOfKinNumber: "", employeeNumber: ""
  });

  // Intel / HMRC state
  const [hmrcSubmitted, setHmrcSubmitted] = useState(false);
  const [hmrcGross, setHmrcGross] = useState(142500);
  const [hmrcExpenses, setHmrcExpenses] = useState(28500);

  // Calculations
  const totalAmount = useMemo(() => items.reduce((a, b) => a + (b.qty * b.rate), 0), [items]);
  const activeEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId), [employees, selectedEmpId]);
  
  const calculatedTaxDue = useMemo(() => {
    const profit = hmrcGross - hmrcExpenses;
    return profit * 0.19; // 19% Corporation tax
  }, [hmrcGross, hmrcExpenses]);

  const handleAddHoliday = (date: string) => {
    if (!date) return;
    setEmployees(prev => prev.map(emp => 
      emp.id === selectedEmpId 
        ? { ...emp, holidayLeft: emp.holidayLeft - 1, holidays: [...emp.holidays, date] } 
        : emp
    ));
    setActiveModal(null);
    toast.success("Attendance ledger synchronized successfully.");
  };

  const handleAppraisalQuestionChange = (qId: string, value: string) => {
    setAppraisalForm(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmitAppraisal = () => {
    const filledQuestions: AppraisalQuestion[] = APPRAISAL_QUESTIONS_STRUCTURE.map(q => ({
      id: q.id,
      question: q.question,
      response: appraisalForm[q.id] || "No response provided."
    }));

    const newAppraisal: Appraisal = {
      date: new Date().toLocaleDateString('en-GB'),
      score: "Pending Review",
      notes: appraisalForm["q1"]?.substring(0, 50) || "Appraisal generated.",
      questions: filledQuestions
    };

    setEmployees(prev => prev.map(emp => 
      emp.id === selectedEmpId 
        ? { ...emp, appraisals: [...emp.appraisals, newAppraisal] } 
        : emp
    ));
    setAppraisalForm({});
    setActiveModal(null);
    toast.success("Appraisal finalized and routed to the matrix audit trail.");
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.name || !onboardForm.role || !onboardForm.email) {
      toast.error("Please provide a Name, Role, and Email.");
      return;
    }

    const newEmp: Employee = {
      id: `e${employees.length + 1}`,
      name: onboardForm.name,
      role: onboardForm.role,
      salary: parseInt(onboardForm.salary) || 30000,
      holidayLeft: parseInt(onboardForm.holidayEntitlement) || 25,
      holidayEntitlement: parseInt(onboardForm.holidayEntitlement) || 25,
      holidays: [],
      appraisals: [],
      email: onboardForm.email,
      phone: onboardForm.phone,
      bankDetails: `${onboardForm.bankName} - ${onboardForm.accountNumber} | ${onboardForm.sortCode}`,
      nextOfKin: `${onboardForm.nextOfKinName} (${onboardForm.nextOfKinNumber})`,
      contractType: onboardForm.contractType as Employee['contractType'],
      workingHoursDays: onboardForm.workingHoursDays,
      payDueDate: onboardForm.payDueDate,
      employeeNumber: onboardForm.employeeNumber || `APX-${(employees.length + 1).toString().padStart(3, '0')}`
    };

    setEmployees(prev => [...prev, newEmp]);
    toast.success(`Employee ${onboardForm.name} onboarded to the system.`);
    
    // Reset Form
    setOnboardForm({
      name: "", role: "", email: "", phone: "", salary: "", holidayEntitlement: "25",
      contractType: "Full-Time", workingHoursDays: "Mon-Fri / 9-5", payDueDate: "28th Monthly",
      bankName: "", accountNumber: "", sortCode: "", nextOfKinName: "", nextOfKinNumber: "", employeeNumber: ""
    });
    setActiveModal(null);
  };

  const handleAddAsset = () => {
    const amount = parseFloat(newAssetAmount) || 0;
    setBalanceSheet(prev => ({
      ...prev,
      assets: prev.assets + amount,
      equity: prev.equity + amount // Balanced transaction (assets = liabilities + equity)
    }));
    setNewAssetLabel("");
    setNewAssetAmount("");
    toast.success("Asset added and balance sheet updated.");
  };

  const handleAddLiability = () => {
    const amount = parseFloat(newLiabilityAmount) || 0;
    setBalanceSheet(prev => ({
      ...prev,
      liabilities: prev.liabilities + amount,
      equity: prev.equity - amount // Balanced transaction
    }));
    setNewLiabilityLabel("");
    setNewLiabilityAmount("");
    toast.success("Liability updated.");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfaf7] text-stone-900 font-sans w-full">
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-12 shrink-0 relative z-[20]">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-xl shadow-xl">A</div>
            <span className="font-serif italic text-lg tracking-tighter mr-6">Apex OS</span>
            
            <div className="flex gap-2 bg-stone-100 p-1.5 rounded-2xl">
              {[
                { id: "finance", icon: <Receipt size={14}/>, label: "Finance & Sales" },
                { id: "hr", icon: <Users size={14}/>, label: "Human Resources" },
                { id: "intel", icon: <BarChart3 size={14}/>, label: "Intelligence" },
              ].map(node => (
                <button 
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeNode === node.id 
                      ? "bg-stone-900 text-[#a9b897] shadow-xl" 
                      : "text-stone-400 hover:text-stone-900 bg-transparent"
                  }`}
                >
                  {node.icon} {node.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Live Secure Server Active</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 max-w-7xl w-full mx-auto space-y-12 pb-24 relative z-[10]">

          {/* FINANCE NODE */}
          {activeNode === "finance" && (
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-8 space-y-8">
                <div className="flex gap-4 bg-stone-100 p-2 rounded-3xl w-fit">
                  {["invoice", "quote", "expense"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setDocType(t)} 
                      className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        docType === t ? "bg-white shadow-sm" : "text-stone-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-stone-100 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-12">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a9b897]">Ledger Document</p>
                        <h2 className="text-3xl font-serif italic uppercase">#{docType === 'invoice' ? 'INV' : docType === 'quote' ? 'QT' : 'EXP'}-2026-004</h2>
                     </div>
                     <div className="px-6 py-2 bg-stone-100 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-400">Status: {invoiceStatus}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 mb-16">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Client Link</label>
                      <select className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none border-none text-xs font-bold appearance-none cursor-pointer" onChange={(e) => setAssignedContact(e.target.value)}>
                        <option>Select Contact...</option>
                        {INITIAL_DATA.contacts.map(c => <option key={c.id}>{c.name} ({c.company})</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Project Workspace</label>
                      <select className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none border-none text-xs font-bold appearance-none cursor-pointer" onChange={(e) => setAssignedProject(e.target.value)}>
                        {INITIAL_DATA.projects.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 mb-12">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex gap-4 items-center group">
                        <input 
                          className="flex-1 h-14 bg-stone-50 rounded-2xl px-6 font-serif italic text-sm outline-none focus:bg-stone-100 transition-colors" 
                          value={item.desc} 
                          placeholder="Item Description..." 
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[idx].desc = e.target.value;
                            setItems(newItems);
                          }}
                        />
                        <div className="relative">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 text-xs font-bold">£</span>
                           <input 
                             className="w-32 h-14 bg-stone-50 rounded-2xl pl-10 pr-6 font-bold text-sm outline-none focus:bg-stone-100" 
                             value={item.rate} 
                             type="number" 
                             onChange={(e) => {
                               const newItems = [...items];
                               newItems[idx].rate = parseInt(e.target.value) || 0;
                               setItems(newItems);
                             }}
                          />
                        </div>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={18}/></button>
                      </div>
                    ))}
                    <button onClick={() => setItems([...items, {id: Date.now(), desc: "", qty: 1, rate: 0}])} className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] mt-4 flex items-center gap-2 hover:translate-x-1 transition-transform"><Plus size={14}/> Add Ledger Entry</button>
                  </div>

                  <div className="p-10 bg-stone-900 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center md:items-end gap-8">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-4">Banking Instructions</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase">{INITIAL_DATA.bankDetails.name} / {INITIAL_DATA.bankDetails.bank}</p>
                        <p className="text-[10px] font-bold opacity-60">ACC: {INITIAL_DATA.bankDetails.account} / SORT: {INITIAL_DATA.bankDetails.sort}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Balance Due</p>
                      <p className="text-5xl font-serif italic">£{totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-0">
                <div className="bg-white border border-stone-100 rounded-[3rem] p-8 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-4 text-center">Global Actions</h3>
                  {docType === 'expense' ? (
                     <p className="text-center text-[10px] text-stone-400 font-serif italic pb-4">Internal expense record. Dispatch not applicable.</p>
                  ) : (
                    <button onClick={() => toast.success("PDF Generation & Email Dispatch initiated via Secure Gateway.")} className="w-full h-16 bg-[#a9b897] text-white rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"><Mail size={16}/> Email to Client</button>
                  )}
                  <button onClick={() => toast.info("PDF Generation initiated.")} className="w-full h-16 bg-stone-100 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"><Download size={16}/> Export PDF</button>
                  <button onClick={() => setInvoiceStatus("Draft")} className="w-full h-16 border-2 border-stone-100 text-stone-400 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-stone-200 transition-all">Save as Draft</button>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-50">
                    <button onClick={() => { setInvoiceStatus("Approved"); toast.success("Document approved & posted.") }} className="h-14 border border-green-100 text-green-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-50 transition-all">Approve</button>
                    <button onClick={() => { setInvoiceStatus("Void"); toast.error("Document voided & removed from ledger.")}} className="h-14 border border-red-100 text-red-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Void</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR NODE */}
          {activeNode === "hr" && (
            <div className="space-y-12 relative z-[15]">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-[20]">
                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col items-center text-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Monthly Payroll</h3>
                   <p className="text-5xl font-serif italic mb-2">£14,250</p>
                   <p className="text-[10px] font-bold text-[#a9b897] uppercase tracking-widest mb-10">Next Run: May 28, 2026</p>
                   <button onClick={() => toast.success("Payroll executed. Funds dispersed via BACS Secure Hub.")} className="w-full py-5 bg-[#a9b897] text-white rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Execute Payroll</button>
                 </div>

                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8 text-center">Attendance Node</h3>
                   <div className="space-y-4 mb-10">
                     {employees.map(e => (
                       <div key={e.id} className="flex justify-between items-center border-b border-stone-50 pb-2">
                         <span className="font-serif italic text-lg">{e.name}</span>
                         <span className="text-[9px] font-bold text-stone-400">{e.holidayLeft} / {e.holidayEntitlement} Days Left</span>
                       </div>
                     ))}
                   </div>
                   <button onClick={() => setActiveModal("holiday")} className="w-full py-5 bg-stone-900 text-[#a9b897] rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-xl">Book Holiday</button>
                 </div>

                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8 text-center">Performance Matrix</h3>
                   <div className="bg-stone-50 rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center text-center mb-10">
                      <p className="text-[8px] font-black uppercase text-stone-300 mb-2">Next Appraisal</p>
                      <p className="text-2xl font-serif italic">Sarah Chen</p>
                      <p className="text-xs font-bold text-stone-400">— June 12</p>
                   </div>
                   <button onClick={() => setActiveModal("appraisalList")} className="w-full py-5 border-2 border-stone-100 text-stone-400 rounded-3xl text-[9px] font-black uppercase tracking-widest">Open Appraisal Hub</button>
                 </div>
               </div>

               {/* Team Directory */}
               <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-50 relative z-[10]">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-16">
                    <h2 className="text-4xl font-serif italic">Matrix Team</h2>
                    <button onClick={() => setActiveModal("newEmployee")} className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#a9b897] rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.05] transition-all"><UserPlus size={18}/> Onboard Employee</button>
                 </div>
                 <div className="divide-y divide-stone-100">
                    {employees.map(emp => (
                      <div key={emp.id} className="py-8 flex flex-col sm:flex-row justify-between items-center group gap-8">
                        <div className="flex gap-8 items-center">
                          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center font-serif italic text-stone-300 text-2xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all">{emp.name[0]}</div>
                          <div>
                            <p className="text-2xl font-serif italic text-stone-900">{emp.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">{emp.role} — {emp.contractType}</p>
                            <p className="text-[10px] font-bold text-stone-400">{emp.workingHoursDays}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => { setSelectedEmpId(emp.id); setActiveModal("holiday"); }} className="px-6 py-3 bg-stone-100 border border-stone-100 text-stone-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Holiday</button>
                           <button onClick={() => { setSelectedEmpId(emp.id); setActiveModal("appraisal"); }} className="px-6 py-3 border border-stone-100 text-stone-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2"><CheckCircle2 size={12}/> Appraisal</button>
                           <button onClick={() => { setSelectedEmpId(emp.id); setActiveModal("payslips"); }} className="px-6 py-3 bg-stone-100 text-stone-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2"><Landmark size={12}/> Vault & Banking</button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* INTELLIGENCE NODE */}
          {activeNode === "intel" && (
            <div className="space-y-12 animate-in fade-in duration-1000 relative z-[10]">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-[20]">
                 {[
                   { label: "Rev YTD", val: `£${hmrcGross.toLocaleString()}`, color: "#a9b897" },
                   { label: "Liabilities", val: `£${hmrcExpenses.toLocaleString()}`, color: "#d6d3d1" },
                   { label: "VAT Pool", val: "£4,210", color: "#d6d3d1" },
                   { label: "Calculated Tax Due", val: `£${calculatedTaxDue.toLocaleString()}`, color: "#a9b897" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
                     <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-6">{stat.label}</p>
                     <p className="text-3xl font-serif italic">{stat.val}</p>
                     <p className="text-[9px] font-bold mt-2" style={{ color: stat.color }}>12% Active Yield</p>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-12 gap-8 items-start relative z-[10]">
                 <div className="col-span-12 lg:col-span-8 bg-stone-900 rounded-[4rem] p-16 text-white relative overflow-hidden group min-h-[500px] flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-12">HMRC Compliance Node</p>
                    <div className="flex-1">
                      {hmrcSubmitted ? (
                         <div className="space-y-6 animate-in fade-in">
                            <BadgeCheck size={48} className="text-[#a9b897]" />
                            <h2 className="text-6xl font-serif italic mb-4">HMRC Cleared</h2>
                            <p className="text-xs font-bold text-white/50">Data permanently posted. Clearance ID: ApxOS-SA8822.</p>
                         </div>
                      ) : (
                         <>
                         <p className="text-[10px] font-black uppercase text-white/20 mb-2">Self Assessment 2026</p>
                         <h2 className="text-5xl md:text-6xl font-serif italic mb-10 group-hover:tracking-wider transition-all duration-700 leading-none">Confirm Tax Filing</h2>
                         <div className="max-w-2xl bg-white/5 p-8 rounded-2xl border border-white/10 grid grid-cols-3 gap-6">
                            <div>
                               <p className="text-[8px] uppercase text-white/30">Gross Turnover</p>
                               <input 
                                 type="number" 
                                 value={hmrcGross} 
                                 onChange={(e) => setHmrcGross(parseInt(e.target.value) || 0)} 
                                 className="bg-transparent text-lg font-bold w-full outline-none border-b border-white/20 focus:text-[#a9b897]"
                              />
                            </div>
                            <div>
                               <p className="text-[8px] uppercase text-white/30">Expenses Claimed</p>
                               <input 
                                 type="number" 
                                 value={hmrcExpenses} 
                                 onChange={(e) => setHmrcExpenses(parseInt(e.target.value) || 0)} 
                                 className="bg-transparent text-lg font-bold w-full outline-none border-b border-white/20 focus:text-[#a9b897]"
                              />
                            </div>
                            <div className="text-[#a9b897]">
                               <p className="text-[8px] uppercase text-white/30">Tax Liability</p>
                               <p className="text-lg font-bold">£{calculatedTaxDue.toLocaleString()}</p>
                            </div>
                         </div>
                         <button onClick={() => setHmrcSubmitted(true)} className="mt-8 px-6 py-3 bg-[#a9b897] text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Submit to HMRC</button>
                         </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-16 border-t border-white/10 shrink-0 mt-20">
                       <div><p className="text-[8px] font-black uppercase text-white/30 mb-2">Dividend Pool</p><p className="text-3xl font-serif italic">£42,000</p></div>
                       <div><p className="text-[8px] font-black uppercase text-white/30 mb-2">Corp Tax (Est)</p><p className="text-3xl font-serif italic">£12,400</p></div>
                       <div><p className="text-[8px] font-black uppercase text-white/30 mb-2">VAT Returns</p><p className="text-3xl font-serif italic text-[#a9b897]">Quarterly Clean</p></div>
                    </div>
                    <Zap size={400} className="absolute -bottom-40 -right-40 text-white/5 rotate-12 pointer-events-none" />
                 </div>

                 {/* Balance Sheet Panel */}
                 <div className="col-span-12 lg:col-span-4 bg-white rounded-[3.5rem] p-10 border border-stone-100 flex flex-col shadow-sm">
                   <h3 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em] mb-8">Balance Sheet</h3>
                   <div className="space-y-6 flex-1 text-xs">
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Total Assets</span>
                        <span>£{balanceSheet.assets.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Cash at Bank</span>
                        <span>£{balanceSheet.cashAtBank.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Total Liabilities</span>
                        <span>£{balanceSheet.liabilities.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 text-[#a9b897] font-extrabold">
                        <span>Net Equity</span>
                        <span>£{balanceSheet.equity.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="mt-8 border-t border-stone-100 pt-6 space-y-4">
                     <p className="text-[8px] uppercase tracking-[0.2em] font-black text-stone-400">Add Asset</p>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Label" 
                          value={newAssetLabel} 
                          onChange={(e) => setNewAssetLabel(e.target.value)} 
                          className="w-1/2 p-3 bg-stone-50 rounded-xl text-[10px] outline-none" 
                        />
                        <input 
                          type="number" 
                          placeholder="£ Amount" 
                          value={newAssetAmount} 
                          onChange={(e) => setNewAssetAmount(e.target.value)} 
                          className="w-1/2 p-3 bg-stone-50 rounded-xl text-[10px] outline-none" 
                        />
                     </div>
                     <button onClick={handleAddAsset} className="w-full text-center text-[9px] font-black uppercase bg-stone-100 p-3 rounded-xl hover:bg-stone-200">Add Asset</button>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-stone-100 space-y-4">
                     <p className="text-[8px] uppercase tracking-[0.2em] font-black text-stone-400">Add Liability</p>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Label" 
                          value={newLiabilityLabel} 
                          onChange={(e) => setNewLiabilityLabel(e.target.value)} 
                          className="w-1/2 p-3 bg-stone-50 rounded-xl text-[10px] outline-none" 
                        />
                        <input 
                          type="number" 
                          placeholder="£ Amount" 
                          value={newLiabilityAmount} 
                          onChange={(e) => setNewLiabilityAmount(e.target.value)} 
                          className="w-1/2 p-3 bg-stone-50 rounded-xl text-[10px] outline-none" 
                        />
                     </div>
                     <button onClick={handleAddLiability} className="w-full text-center text-[9px] font-black uppercase bg-stone-100 p-3 rounded-xl hover:bg-stone-200">Add Liability</button>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}
      {activeModal === "appraisalList" && (
         <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 relative">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-y-auto max-h-[80vh]">
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            <div className="mb-12">
              <h3 className="text-4xl font-serif italic text-stone-900">Appraisal Matrix</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mt-2">Matrix Audit trail.</p>
            </div>
            <div className="space-y-6">
               {employees.filter(e => e.appraisals.length > 0).map(emp => emp.appraisals.map((apr, idx) => (
                  <div key={`${emp.id}-${idx}`} className="p-8 bg-stone-50 rounded-3xl border border-stone-100 flex justify-between gap-6">
                     <div>
                        <p className="font-serif italic text-lg">{emp.name}</p>
                        <p className="text-[9px] font-black text-stone-400 mt-1 uppercase tracking-widest">{apr.date} • {apr.notes}</p>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 h-fit bg-white rounded-full text-[#a9b897] border border-[#a9b897]/20">{apr.score}</span>
                  </div>
               )))}
            </div>
          </div>
        </div>
      )}

      {activeModal === "appraisal" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 relative">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl p-12 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            <div className="mb-12">
              <h3 className="text-4xl font-serif italic text-stone-900">Employee Appraisal Matrix</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] mt-2">Employee Audit Node: {activeEmployee?.name}</p>
            </div>
            <div className="space-y-8">
               {APPRAISAL_QUESTIONS_STRUCTURE.map((q, idx) => (
                  <div key={q.id} className="space-y-3">
                     <label className="text-[11px] font-serif italic text-stone-600 block mb-3 border-b border-stone-100 pb-3">{idx + 1}. {q.question}</label>
                     <textarea 
                        className="w-full h-24 bg-stone-50 rounded-2xl p-6 outline-none font-serif italic text-sm focus:bg-white border-2 border-transparent focus:border-stone-100 transition-all resize-none" 
                        onChange={e => handleAppraisalQuestionChange(q.id, e.target.value)}
                        placeholder="Matrix response log..." 
                     />
                  </div>
               ))}
              <button onClick={handleSubmitAppraisal} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all">Lock & Finalize Appraisal Node</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "holiday" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 relative">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
              <h3 className="text-4xl font-serif italic mb-10 text-center text-stone-900">Book Leave</h3>
              <div className="space-y-6">
                 <div className="space-y-2 text-center">
                   <label className="text-[9px] font-black uppercase text-stone-300">Select Date</label>
                   <input type="date" className="w-full h-16 bg-stone-50 rounded-3xl px-8 font-bold outline-none border-none text-center shadow-inner" id="holiday_date" />
                 </div>
                 <button 
                   onClick={() => handleAddHoliday((document.getElementById('holiday_date') as HTMLInputElement).value)}
                   className="w-full py-6 bg-[#a9b897] text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                 >
                   Sync Attendance Ledger
                 </button>
                 <button onClick={() => setActiveModal(null)} className="w-full text-[9px] font-black uppercase text-stone-300 hover:text-stone-900">Discard Request</button>
              </div>
          </div>
        </div>
      )}

      {activeModal === "payslips" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 relative">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl p-12 flex flex-col md:flex-row gap-12 animate-in zoom-in-95 shadow-2xl overflow-hidden relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all z-[10]"><X size={20}/></button>
            <div className="flex-1 bg-stone-50 rounded-[3rem] border border-stone-100 p-12 relative z-[10]">
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-10 border border-stone-100"><Landmark size={32} className="text-[#a9b897]"/></div>
                 <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mb-2">Matrix Audit Hub</p>
                 <h2 className="text-5xl font-serif italic text-stone-900 uppercase tracking-widest mb-8">SECURE VAULT</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-100">
                        <span className="text-[9px] uppercase font-black tracking-widest text-stone-400">Payroll Vault</span>
                        <button onClick={() => toast.success("Payslip generated & dispatched.")} className="px-4 py-1.5 bg-[#a9b897] text-white rounded-full text-[8px] uppercase font-bold tracking-widest">Generate April Slip</button>
                    </div>
                    <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-stone-100">
                        <span className="text-[9px] uppercase font-black tracking-widest text-stone-400">Tax Vault</span>
                        <button onClick={() => toast.success("P60 Archive downloaded.")} className="px-4 py-1.5 border border-stone-100 text-stone-500 rounded-full text-[8px] uppercase font-bold tracking-widest">Download P60 (2025)</button>
                    </div>
                 </div>
              </div>
              <div className="w-full md:w-96 flex flex-col justify-between py-10 relative z-[10]">
                 <div>
                    <h2 className="text-5xl font-serif italic text-stone-900 mb-6">Banking & Contact Node</h2>
                    <p className="text-sm text-stone-400 font-serif italic mb-12">Encrypted profile access for {activeEmployee?.name}. Ensure banking audit trail is locked before viewing full details.</p>
                 </div>
                 <div className="space-y-4 pt-10 border-t border-stone-100">
                    <div className="group">
                        <label className="text-[8px] uppercase text-stone-300 block mb-1">Secure Email</label>
                        <p className="text-xs font-bold">{activeEmployee?.email}</p>
                    </div>
                    <div className="group">
                        <label className="text-[8px] uppercase text-stone-300 block mb-1">Direct Line</label>
                        <p className="text-xs font-bold">{activeEmployee?.phone}</p>
                    </div>
                    <div className="group">
                        <label className="text-[8px] uppercase text-stone-300 block mb-1">BACS Destination ACC</label>
                        <p className="text-xs font-bold truncate">{activeEmployee?.bankDetails}</p>
                    </div>
                    <div className="group">
                        <label className="text-[8px] uppercase text-stone-300 block mb-1">Next of Kin Secure Contact</label>
                        <p className="text-xs font-bold">{activeEmployee?.nextOfKin}</p>
                    </div>
                 </div>
              </div>
              <Zap size={400} className="absolute -bottom-40 -right-40 text-stone-100/10 rotate-12 pointer-events-none" />
           </div>
        </div>
      )}

      {activeModal === "newEmployee" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6 relative">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl p-12 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            <div className="mb-10">
              <h3 className="text-4xl font-serif italic text-stone-900">Onboard New Team Member</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] mt-2">Matrix Database Update</p>
            </div>
            <form onSubmit={handleOnboardSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Full Name</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold placeholder:text-stone-300 text-sm" value={onboardForm.name} onChange={e => setOnboardForm({...onboardForm, name: e.target.value})} placeholder="Jane Doe" required/>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Matrix Role / Title</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold placeholder:text-stone-300 text-sm" value={onboardForm.role} onChange={e => setOnboardForm({...onboardForm, role: e.target.value})} placeholder="Product Architect" required/>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-stone-100">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Fiscal Salary Pool (GBP)</label>
                     <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 text-xs font-bold">£</span>
                        <input className="w-full h-14 bg-stone-50 rounded-2xl pl-10 pr-6 outline-none font-bold text-sm" value={onboardForm.salary} onChange={e => setOnboardForm({...onboardForm, salary: e.target.value})} type="number" required placeholder="30000"/>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Holiday Entitlement (days)</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold text-sm" value={onboardForm.holidayEntitlement} onChange={e => setOnboardForm({...onboardForm, holidayEntitlement: e.target.value})} type="number" required placeholder="25"/>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Working Hours & Days</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold text-sm" value={onboardForm.workingHoursDays} onChange={e => setOnboardForm({...onboardForm, workingHoursDays: e.target.value})} required placeholder="Mon-Fri / 9-5"/>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Contract Node Type</label>
                      <select className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none text-xs font-bold appearance-none cursor-pointer" value={onboardForm.contractType} onChange={e => setOnboardForm({...onboardForm, contractType: e.target.value})} required>
                        <option>Full-Time</option>
                        <option>Part-Time</option>
                        <option>Flexible</option>
                      </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-stone-100">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Vault Email</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold placeholder:text-stone-300 text-sm" type="email" value={onboardForm.email} onChange={e => setOnboardForm({...onboardForm, email: e.target.value})} required placeholder="email@apex.com"/>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Date of Pay Due</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold text-sm" value={onboardForm.payDueDate} onChange={e => setOnboardForm({...onboardForm, payDueDate: e.target.value})} required placeholder="28th Monthly"/>
                  </div>
               </div>

               {/* Bank Details Inputs */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-stone-100">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Bank Name</label>
                     <input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none font-bold text-xs" value={onboardForm.bankName} onChange={e => setOnboardForm({...onboardForm, bankName: e.target.value})} required placeholder="Mercury Digital" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Account Number</label>
                     <input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none font-bold text-xs" value={onboardForm.accountNumber} onChange={e => setOnboardForm({...onboardForm, accountNumber: e.target.value})} required placeholder="88224411" />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Sort Code</label>
                     <input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none font-bold text-xs" value={onboardForm.sortCode} onChange={e => setOnboardForm({...onboardForm, sortCode: e.target.value})} required placeholder="00-11-22" />
                  </div>
               </div>

               {/* Next of Kin Inputs */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-stone-100">
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Next of Kin Name</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold text-sm" value={onboardForm.nextOfKinName} onChange={e => setOnboardForm({...onboardForm, nextOfKinName: e.target.value})} required placeholder="Jane Kin"/>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[9px] font-black uppercase text-stone-300 ml-2 tracking-[0.2em]">Next of Kin Number</label>
                     <input className="w-full h-14 bg-stone-50 rounded-2xl px-6 outline-none font-bold text-sm" value={onboardForm.nextOfKinNumber} onChange={e => setOnboardForm({...onboardForm, nextOfKinNumber: e.target.value})} required placeholder="+44 70000000"/>
                  </div>
               </div>

               <button type="submit" className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all">Generate secure vault record.</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}