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

  // Balance Sheet State
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

  // Holiday
  const [holidayStartDate, setHolidayStartDate] = useState("");
  const [holidayEndDate, setHolidayEndDate] = useState("");

  // Intel / HMRC state
  const [hmrcSubmitted, setHmrcSubmitted] = useState(false);
  const [hmrcGross, setHmrcGross] = useState(142500);
  const [hmrcExpenses, setHmrcExpenses] = useState(28500);

  // Calculations
  const totalAmount = useMemo(() => items.reduce((a, b) => a + (b.qty * b.rate), 0), [items]);
  const activeEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId), [employees, selectedEmpId]);
  
  const calculatedTaxDueCalculated: number = useMemo(() => {
    return (hmrcGross - hmrcExpenses) * 0.19;
  }, [hmrcGross, hmrcExpenses]);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayStartDate || !holidayEndDate) {
      toast.error("Both start and end dates are required.");
      return;
    }

    setEmployees(prev => prev.map(emp => 
      emp.id === selectedEmpId 
        ? { 
            ...emp, 
            holidayLeft: emp.holidayLeft - 1, 
            holidays: [...emp.holidays, `${holidayStartDate} to ${holidayEndDate}`] 
          } 
        : emp
    ));
    setHolidayStartDate("");
    setHolidayEndDate("");
    setActiveModal(null);
    toast.success("Attendance ledger synchronized with an end date successfully.");
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
      equity: prev.equity + amount
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
      equity: prev.equity - amount
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
                      onClick={() => {
                        setDocType(t);
                        setInvoiceStatus("New");
                      }} 
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
                    <button 
                      onClick={() => toast.success("PDF Generation & Email Dispatch initiated via Secure Gateway.")} 
                      className="w-full h-16 bg-[#a9b897] text-white rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Mail size={16}/> Email to Client
                    </button>
                  )}
                  
                  <button onClick={() => toast.info("PDF Generation initiated.")} className="w-full h-16 bg-stone-100 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"><Download size={16}/> Export PDF</button>
                  <button onClick={() => setInvoiceStatus("Draft")} className="w-full h-16 border-2 border-stone-100 text-stone-400 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-stone-200 transition-all">Save as Draft</button>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-50">
                    <button 
                      onClick={() => { setInvoiceStatus("Approved"); toast.success("Document approved & posted."); }} 
                      className="h-14 border border-green-100 text-green-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-50 transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => { setInvoiceStatus("Void"); toast.error("Document voided & removed from ledger."); }}
                      className="h-14 border border-red-100 text-red-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      Void
                    </button>
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

               {/* Modals and Forms */}
               {activeModal === "holiday" && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
                   <div className="bg-white w-full max-w-lg p-10 rounded-[2.5rem] shadow-2xl relative animate-in zoom-in-95 duration-200">
                     <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={20}/></button>
                     <h3 className="text-2xl font-serif italic mb-6">Book Employee Holiday</h3>
                     <form onSubmit={handleAddHoliday} className="space-y-6">
                       <div>
                         <label className="block text-[8px] font-black uppercase tracking-widest text-stone-300 mb-2">Select Employee</label>
                         <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none text-xs font-bold border-0">
                           {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                         </select>
                       </div>
                       <div>
                         <label className="block text-[8px] font-black uppercase tracking-widest text-stone-300 mb-2">Start Date</label>
                         <input type="date" value={holidayStartDate} onChange={(e) => setHolidayStartDate(e.target.value)} className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none text-xs font-bold border-0" />
                       </div>
                       <div>
                         <label className="block text-[8px] font-black uppercase tracking-widest text-stone-300 mb-2">End Date</label>
                         <input type="date" value={holidayEndDate} onChange={(e) => setHolidayEndDate(e.target.value)} className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none text-xs font-bold border-0" />
                       </div>
                       <button type="submit" className="w-full py-4 bg-stone-900 text-[#a9b897] rounded-xl text-[9px] font-black uppercase tracking-widest">Post to Ledger</button>
                     </form>
                   </div>
                 </div>
               )}

               {activeModal === "appraisal" && activeEmployee && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
                   <div className="bg-white w-full max-w-4xl max-h-[85vh] overflow-y-auto p-12 rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-200">
                     <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 text-stone-300 hover:text-stone-900"><X size={24}/></button>
                     <h2 className="text-4xl font-serif italic mb-2">Appraisal: {activeEmployee.name}</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-10">{activeEmployee.role} &middot; {activeEmployee.employeeNumber}</p>

                     <div className="space-y-8">
                       {APPRAISAL_QUESTIONS_STRUCTURE.map(q => (
                         <div key={q.id} className="p-8 bg-stone-50 rounded-2xl space-y-4">
                           <span className="text-[8px] font-black uppercase tracking-widest text-[#a9b897] leading-tight block mb-1">Audit Questionnaire</span>
                           <p className="text-sm font-bold text-stone-900 leading-tight mb-4">{q.question}</p>
                           <textarea 
                             className="w-full h-24 p-6 bg-white border border-stone-100 rounded-xl text-xs outline-none focus:border-stone-300"
                             placeholder="Type response..."
                             value={appraisalForm[q.id] || ""}
                             onChange={(e) => handleAppraisalQuestionChange(q.id, e.target.value)}
                           />
                         </div>
                       ))}
                     </div>

                     <button onClick={handleSubmitAppraisal} className="w-full py-5 mt-12 bg-stone-900 text-[#a9b897] rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-2xl">Finalise Submission</button>
                   </div>
                 </div>
               )}

               {activeModal === "appraisalList" && activeEmployee && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
                   <div className="bg-white w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl relative max-h-[80vh] overflow-y-auto">
                     <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={20}/></button>
                     <h3 className="text-2xl font-serif italic mb-2">Performance Logs</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-8">{activeEmployee.name}</p>
                     
                     <div className="space-y-4">
                       {activeEmployee.appraisals.length === 0 ? (
                         <p className="text-xs text-stone-400 font-serif italic">No appraisals found in the system for this employee.</p>
                       ) : (
                         activeEmployee.appraisals.map((appr, idx) => (
                           <div key={idx} className="p-6 bg-stone-50 rounded-2xl flex justify-between items-center">
                             <div>
                               <p className="font-bold text-sm">{appr.date}</p>
                               <p className="text-xs text-stone-400 font-serif italic mt-1">{appr.notes}</p>
                             </div>
                             <span className="text-[8px] font-bold px-3 py-1 bg-stone-100 rounded-full">{appr.score}</span>
                           </div>
                         ))
                       )}
                     </div>
                   </div>
                 </div>
               )}

               {activeModal === "payslips" && activeEmployee && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
                   <div className="bg-white w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl relative">
                     <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={20}/></button>
                     <h3 className="text-2xl font-serif italic mb-2">Vault & Banking</h3>
                     <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] mb-8">{activeEmployee.name}</p>
                     <div className="space-y-4 text-xs">
                       <div className="flex justify-between border-b border-stone-50 pb-4">
                         <span className="font-bold text-stone-300">Bank Details</span>
                         <span>{activeEmployee.bankDetails}</span>
                       </div>
                       <div className="flex justify-between border-b border-stone-50 pb-4">
                         <span className="font-bold text-stone-300">Next of Kin</span>
                         <span>{activeEmployee.nextOfKin}</span>
                       </div>
                       <div className="flex justify-between pb-4">
                         <span className="font-bold text-stone-300">Salary Base</span>
                         <span>£{activeEmployee.salary.toLocaleString()} / year</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {activeModal === "newEmployee" && (
                 <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-8 overflow-y-auto">
                   <div className="bg-white w-full max-w-3xl p-12 rounded-[3.5rem] shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
                     <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-300"><X size={20}/></button>
                     <h3 className="text-3xl font-serif italic mb-10">Onboard Employee</h3>
                     <form onSubmit={handleOnboardSubmit} className="grid grid-cols-2 gap-6 text-xs">
                       <div className="col-span-2"><input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none border-none font-bold text-xs" placeholder="Full Name" value={onboardForm.name} onChange={(e) => setOnboardForm({...onboardForm, name: e.target.value})} /></div>
                       <div><input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none border-none font-bold" placeholder="Role/Title" value={onboardForm.role} onChange={(e) => setOnboardForm({...onboardForm, role: e.target.value})} /></div>
                       <div><input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none border-none font-bold" placeholder="Email" type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({...onboardForm, email: e.target.value})} /></div>
                       <div><input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none border-none font-bold" placeholder="Phone" value={onboardForm.phone} onChange={(e) => setOnboardForm({...onboardForm, phone: e.target.value})} /></div>
                       <div><input className="w-full h-12 bg-stone-50 rounded-xl px-4 outline-none border-none font-bold" placeholder="Salary (Annual)" type="number" value={onboardForm.salary} onChange={(e) => setOnboardForm({...onboardForm, salary: e.target.value})} /></div>
                       <button type="submit" className="col-span-2 mt-6 h-14 bg-stone-900 text-[#a9b897] rounded-xl font-black text-[10px] tracking-widest uppercase">Post Employee to Directory</button>
                     </form>
                   </div>
                 </div>
               )}

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
                   { label: "Calculated Tax Due", val: `£${(Math.round((hmrcGross - hmrcExpenses) * 0.19)).toLocaleString()}`, color: "#a9b897" }
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
                               <p className="text-lg font-bold">£{(Math.round((hmrcGross - hmrcExpenses) * 0.19)).toLocaleString()}</p>
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
                 <div className="col-span-12 lg:col-span-4 bg-white rounded-[3.5rem] p-10 border border-stone-100 flex flex-col shadow-sm justify-between">
                   <div>
                     <h3 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em] mb-8">Balance Sheet</h3>
                     <div className="space-y-6 text-xs">
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
                   </div>

                   <div className="mt-8 border-t border-stone-100 pt-6 space-y-4">
                     <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider mb-2">Add Ledger Component</p>
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            placeholder="Asset Label" 
                            value={newAssetLabel} 
                            onChange={(e) => setNewAssetLabel(e.target.value)}
                            className="h-10 bg-stone-50 rounded-xl px-4 text-xs font-bold outline-none" 
                          />
                          <input 
                            type="number" 
                            placeholder="Amt (£)" 
                            value={newAssetAmount} 
                            onChange={(e) => setNewAssetAmount(e.target.value)}
                            className="h-10 bg-stone-50 rounded-xl px-4 text-xs font-bold outline-none" 
                          />
                        </div>
                        <button onClick={handleAddAsset} className="w-full py-3 bg-stone-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Post Asset Pool</button>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-stone-50">
                          <input 
                            placeholder="Liability Label" 
                            value={newLiabilityLabel} 
                            onChange={(e) => setNewLiabilityLabel(e.target.value)}
                            className="h-10 bg-stone-50 rounded-xl px-4 text-xs font-bold outline-none" 
                          />
                          <input 
                            type="number" 
                            placeholder="Amt (£)" 
                            value={newLiabilityAmount} 
                            onChange={(e) => setNewLiabilityAmount(e.target.value)}
                            className="h-10 bg-stone-50 rounded-xl px-4 text-xs font-bold outline-none" 
                          />
                        </div>
                        <button onClick={handleAddLiability} className="w-full py-3 border border-stone-100 text-stone-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all">Adjust Liabilities</button>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}