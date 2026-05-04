"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, Trash2, UserPlus, Receipt, Users, BarChart3, Download, Zap, X, Mail, 
  Calendar, Eye, Printer, Send, Ban, CheckCircle2, TrendingUp, FileStack, 
  ShieldCheck, HardDrive, Clock, ChevronRight, Briefcase, Landmark, PieChart
} from "lucide-react";

/* ======================================================
   CORE STATE ENGINE & DATABASE MOCK
====================================================== */
interface Appraisal {
  date: string;
  score?: string;
  notes: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  holidayLeft: number;
  holidays: string[];
  appraisals: Appraisal[];
}

interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
}

const INITIAL_DATA: {
  employees: Employee[];
  contacts: Contact[];
  projects: string[];
  bankDetails: { name: string; account: string; sort: string; bank: string };
} = {
  employees: [
    { id: "e1", name: "Sarah Chen", role: "Lead Engineer", salary: 85000, holidayLeft: 12, holidays: ["2026-05-12"], appraisals: [] },
    { id: "e2", name: "Marcus Vane", role: "UX Designer", salary: 52000, holidayLeft: 18, holidays: [], appraisals: [{ date: "2026-03-01", score: "Exceeds", notes: "Excellent UI work." }] }
  ],
  contacts: [
    { id: "c1", name: "Sarah Jenkins", company: "Anthropic", email: "s.jenkins@anthropic.com" },
    { id: "c2", name: "Marcus Vane", company: "Design Systems", email: "m.vane@ds.io" }
  ],
  projects: ["Q2 Brand Audit", "Next.js Migration", "Internal Architecture"],
  bankDetails: { name: "APEX STRATEGY LTD", account: "88224411", sort: "00-11-22", bank: "Mercury Digital" }
};

export default function ApexOS() {
  // Navigation
  const [activeNode, setActiveNode] = useState("finance"); 
  const [docType, setDocType] = useState("invoice");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Finance State
  const [items, setItems] = useState([{ id: 1, desc: "Technical Architecture Review", qty: 1, rate: 2500 }]);
  const [assignedContact, setAssignedContact] = useState("");
  const [assignedProject, setAssignedProject] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("New");

  // HR State
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_DATA.employees);
  const [selectedEmpId, setSelectedEmpId] = useState("e1");
  const [appraisalForm, setAppraisalForm] = useState({ q1: "", q2: "", q3: "" });

  // Computed Values
  const totalAmount = useMemo(() => items.reduce((a, b) => a + (b.qty * b.rate), 0), [items]);
  const activeEmployee = useMemo(() => employees.find(e => e.id === selectedEmpId), [employees, selectedEmpId]);

  /* --------------------------------------------------
      LOGIC HANDLERS
  -------------------------------------------------- */
  const handleAddHoliday = (date: string) => {
    if (!date) return;
    setEmployees(prev => prev.map(emp => 
      emp.id === selectedEmpId 
        ? { ...emp, holidayLeft: emp.holidayLeft - 1, holidays: [...emp.holidays, date] } 
        : emp
    ));
    setActiveModal(null);
  };

  const handleSubmitAppraisal = () => {
    setEmployees(prev => prev.map(emp => 
      emp.id === selectedEmpId 
        ? { ...emp, appraisals: [...emp.appraisals, { date: "2026-05-04", notes: appraisalForm.q1 }] } 
        : emp
    ));
    setActiveModal(null);
    alert("Appraisal locked and saved to employee record.");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfaf7] text-stone-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col h-full shrink-0">
        <div className="p-10 flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl shadow-xl">A</div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Command Center</span>
            </div>
          </div>
          
          <nav className="space-y-4">
            {[
              { id: "finance", icon: <Receipt size={18}/>, label: "Finance & Sales" },
              { id: "hr", icon: <Users size={18}/>, label: "Human Resources" },
              { id: "intel", icon: <BarChart3 size={18}/>, label: "Intelligence" },
            ].map(node => (
              <button 
                key={node.id}
                onClick={() => setActiveNode(node.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeNode === node.id 
                    ? "bg-stone-900 text-[#a9b897] shadow-xl" 
                    : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {node.icon} {node.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-12 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif italic capitalize">{activeNode}</h1>
            <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Live Server Active</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 max-w-7xl w-full mx-auto space-y-12 pb-24">

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
                        <h2 className="text-3xl font-serif italic uppercase">#{docType === 'invoice' ? 'INV' : 'QT'}-2026-004</h2>
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
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
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
                  <button onClick={() => setActiveModal("preview")} className="w-full h-16 bg-[#a9b897] text-white rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"><Mail size={16}/> Email to Client</button>
                  <button onClick={() => alert("PDF Export Initiated...")} className="w-full h-16 bg-stone-100 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"><Download size={16}/> Export PDF</button>
                  <button onClick={() => setInvoiceStatus("Draft")} className="w-full h-16 border-2 border-stone-100 text-stone-400 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-stone-200 transition-all">Save as Draft</button>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-50">
                    <button onClick={() => setInvoiceStatus("Approved")} className="h-14 border border-green-100 text-green-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-50 transition-all">Approve</button>
                    <button onClick={() => setInvoiceStatus("Void")} className="h-14 border border-red-100 text-red-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Void</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR NODE */}
          {activeNode === "hr" && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Payroll Card */}
                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col items-center text-center">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Monthly Payroll</h3>
                   <p className="text-5xl font-serif italic mb-2">£14,250</p>
                   <p className="text-[10px] font-bold text-[#a9b897] uppercase tracking-widest mb-10">Next Run: May 28, 2026</p>
                   <button onClick={() => alert("Payroll Disbursed via BACS.")} className="w-full py-5 bg-[#a9b897] text-white rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Execute Payroll</button>
                 </div>

                 {/* Attendance Card */}
                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8 text-center">Attendance Node</h3>
                   <div className="space-y-4 mb-10">
                     {employees.map(e => (
                       <div key={e.id} className="flex justify-between items-center border-b border-stone-50 pb-2">
                         <span className="font-serif italic text-lg">{e.name}</span>
                         <span className="text-[9px] font-bold text-stone-400">{e.holidayLeft} Days Left</span>
                       </div>
                     ))}
                   </div>
                   <button onClick={() => setActiveModal("holiday")} className="w-full py-5 bg-stone-900 text-[#a9b897] rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-xl">Book Holiday</button>
                 </div>

                 {/* Performance Card */}
                 <div className="bg-white rounded-[3.5rem] p-10 shadow-sm flex flex-col">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8 text-center">Performance</h3>
                   <div className="bg-stone-50 rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center text-center mb-10">
                      <p className="text-[8px] font-black uppercase text-stone-300 mb-2">Next Appraisal</p>
                      <p className="text-2xl font-serif italic">Marcus Vane</p>
                      <p className="text-xs font-bold text-stone-400">— June 12</p>
                   </div>
                   <button onClick={() => setActiveModal("appraisal")} className="w-full py-5 border-2 border-stone-100 text-stone-400 rounded-3xl text-[9px] font-black uppercase tracking-widest">Open Appraisals</button>
                 </div>
               </div>

               {/* Team Directory */}
               <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-50">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-16">
                    <h2 className="text-4xl font-serif italic">Team Matrix</h2>
                    <button onClick={() => setActiveModal("newEmployee")} className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#a9b897] rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.05] transition-all"><UserPlus size={18}/> Onboard Employee</button>
                 </div>
                 <div className="divide-y divide-stone-100">
                    {employees.map(emp => (
                      <div key={emp.id} className="py-8 flex flex-col sm:flex-row justify-between items-center group gap-8">
                        <div className="flex gap-8 items-center">
                          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center font-serif italic text-stone-300 text-2xl group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all">{emp.name[0]}</div>
                          <div>
                            <p className="text-2xl font-serif italic text-stone-900">{emp.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">{emp.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => {setSelectedEmpId(emp.id); setActiveModal("payslips")}} className="px-6 py-3 border border-stone-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2"><Clock size={12}/> View Payslips</button>
                          <button onClick={() => {setSelectedEmpId(emp.id); setActiveModal("holiday")}} className="px-6 py-3 bg-[#a9b897] text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Holiday</button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* INTELLIGENCE NODE */}
          {activeNode === "intel" && (
            <div className="space-y-12 animate-in fade-in duration-1000">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: "Rev YTD", val: "£142,500", color: "#a9b897" },
                   { label: "Liabilities", val: "£28,500", color: "#d6d3d1" },
                   { label: "VAT Pool", val: "£4,210", color: "#d6d3d1" },
                   { label: "Optimal Cap", val: "£109,790", color: "#a9b897" }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50">
                     <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-6">{stat.label}</p>
                     <p className="text-4xl font-serif italic">{stat.val}</p>
                     <p className="text-[9px] font-bold mt-2" style={{ color: stat.color }}>+12% Trend</p>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-12 gap-8 items-start">
                 <div className="col-span-12 lg:col-span-8 bg-stone-900 rounded-[4rem] p-16 text-white relative overflow-hidden group min-h-[500px] flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-12">Tax Readiness Node</p>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-white/20 mb-2">Self Assessment 2026</p>
                      <h2 className="text-7xl md:text-8xl font-serif italic mb-20 group-hover:tracking-wider transition-all duration-700">Pending Submission</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pt-16 border-t border-white/10 shrink-0">
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/30 mb-2">Dividend Pool</p>
                          <p className="text-3xl font-serif italic">£42,000</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/30 mb-2">Corp Tax (Est)</p>
                          <p className="text-3xl font-serif italic">£12,400</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-white/30 mb-2">VAT Returns</p>
                          <p className="text-3xl font-serif italic text-[#a9b897]">Quarterly Clean</p>
                       </div>
                    </div>
                    <Zap size={400} className="absolute -bottom-40 -right-40 text-white/5 rotate-12 pointer-events-none" />
                 </div>

                 <div className="col-span-12 lg:col-span-4 bg-white rounded-[3.5rem] p-10 border border-stone-100 flex flex-col shadow-sm">
                   <h3 className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em] mb-12">Institutional Reports</h3>
                   <div className="space-y-4 flex-1">
                      {["P&L Statement", "Balance Sheet", "Payroll History", "Expense Audit"].map((report, i) => (
                        <div key={i} className="flex items-center gap-5 p-4 rounded-2xl hover:bg-stone-50 transition-all cursor-pointer group">
                           <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-[#a9b897] group-hover:text-white shadow-sm transition-all"><FileStack size={18}/></div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-stone-500 group-hover:text-stone-900">{report}</p>
                              <p className="text-[8px] font-bold text-stone-300">April 2026</p>
                           </div>
                           <Download size={14} className="text-stone-200 group-hover:text-[#a9b897]" />
                        </div>
                      ))}
                   </div>
                   <button className="w-full mt-10 py-5 bg-stone-900 text-[#a9b897] rounded-3xl text-[9px] font-black uppercase tracking-widest shadow-xl">Request Full Audit</button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================
          MODAL ENGINE
      ====================================================== */}
      
      {/* Appraisal Modal */}
      {activeModal === "appraisal" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 animate-in zoom-in-95 duration-300 shadow-2xl relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 bg-stone-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            <div className="mb-12">
              <h3 className="text-4xl font-serif italic text-stone-900">Appraisal Review</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] mt-2">Employee: {activeEmployee?.name}</p>
            </div>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-300 italic">Primary Achievements Q2</label>
                <textarea className="w-full h-32 bg-stone-50 rounded-3xl p-6 outline-none font-serif italic text-sm focus:bg-white border-2 border-transparent focus:border-stone-100 transition-all" onChange={e => setAppraisalForm({...appraisalForm, q1: e.target.value})} placeholder="Detailed performance summary..." />
              </div>
              <button onClick={handleSubmitAppraisal} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all">Lock & Finalize Appraisal</button>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {activeModal === "holiday" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
              <h3 className="text-4xl font-serif italic mb-10 text-center text-stone-900">Book Leave</h3>
              <div className="space-y-6">
                 <div className="space-y-2 text-center">
                   <label className="text-[9px] font-black uppercase text-stone-300">Select Date Range</label>
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

      {/* Dispatch Preview Modal */}
      {activeModal === "preview" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-white rounded-[4rem] w-full max-w-5xl p-12 flex flex-col md:flex-row gap-12 animate-in zoom-in-95 shadow-2xl overflow-hidden">
              <div className="flex-1 bg-stone-50 rounded-[3rem] border border-stone-100 flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-8"><PieChart size={32} className="text-[#a9b897]"/></div>
                 <p className="text-[10px] font-black uppercase text-stone-300 tracking-widest mb-2">Live Generated Ledger</p>
                 <p className="text-xl font-serif italic text-stone-400 uppercase tracking-widest">#{docType.toUpperCase()}-2026-004</p>
              </div>
              <div className="w-full md:w-96 flex flex-col justify-center">
                 <h2 className="text-5xl font-serif italic text-stone-900 mb-6">Review & Send</h2>
                 <p className="text-sm text-stone-400 font-serif italic mb-12">Confirm ledger entries for {assignedContact || 'the selected client'} and global banking instructions are accurate before dispatch.</p>
                 <div className="space-y-4">
                    <button onClick={() => {alert("Dispatched to: " + assignedContact); setActiveModal(null)}} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.03] transition-all"><Send size={18}/> Dispatch Now</button>
                    <button onClick={() => setActiveModal(null)} className="w-full py-5 text-[9px] font-black uppercase text-stone-300 hover:text-stone-900 transition-colors">Return to Workspace</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}