"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, Trash2, UserPlus, Receipt, Users, BarChart3, 
  Download, Zap, X, Mail, Calendar, Eye, 
  Printer, Send, Ban, CheckCircle2, TrendingUp, 
  FileStack, ShieldCheck, HardDrive, Clock, ChevronRight
} from "lucide-react";

/* ======================================================
   DATABASE & STATE SIMULATION
====================================================== */
const INITIAL_EMPLOYEES = [
  { id: "e1", name: "Sarah Chen", role: "Lead Engineer", salary: 85000, holidayLeft: 12, holidays: ["2026-05-12"] },
  { id: "e2", name: "Marcus Vane", role: "UX Designer", salary: 52000, holidayLeft: 18, holidays: [] }
];

const CONTACTS = [
  { id: "c1", name: "Sarah Jenkins", company: "Anthropic", email: "s.jenkins@anthropic.com" },
  { id: "c2", name: "Marcus Vane", company: "Design Systems", email: "m.vane@ds.io" }
];

const PROJECTS = ["Q2 Brand Audit", "Next.js Migration", "Internal Architecture"];

/* ======================================================
   APEX OS ENGINE
====================================================== */
export default function ApexOS() {
  // Navigation & View State
  const [activeNode, setActiveNode] = useState("hr"); 
  const [docType, setDocType] = useState("invoice");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Finance & Sales Engine
  const [items, setItems] = useState([{ id: 1, desc: "Technical Architecture Review", qty: 1, rate: 2500 }]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [assignedContact, setAssignedContact] = useState("");
  const [assignedProject, setAssignedProject] = useState("");
  const [currentStatus, setCurrentStatus] = useState("New");

  // HR & Team Engine
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState(INITIAL_EMPLOYEES[0]);
  const [holidayForm, setHolidayForm] = useState({ empId: "", date: "" });

  // Calculation Logic
  const totalAmount = useMemo(() => items.reduce((a, b) => a + (b.qty * b.rate), 0), [items]);

  /* --------------------------------------------------
     LOGIC HANDLERS
  -------------------------------------------------- */
  const saveAsDraft = () => {
    const newDraft = { id: Date.now(), type: docType, amount: totalAmount, contact: assignedContact, status: 'Draft' };
    setDrafts([...drafts, newDraft]);
    setCurrentStatus("Draft Saved");
    alert("Invoice saved to local ledger.");
  };

  const executePayroll = () => {
    const total = employees.reduce((sum, emp) => sum + (emp.salary / 12), 0);
    alert(`PAYROLL SUCCESS: £${total.toLocaleString()} disbursed to ${employees.length} employees.`);
  };

  const bookHoliday = () => {
    setEmployees(prev => prev.map(emp => 
      emp.id === holidayForm.empId 
      ? { ...emp, holidayLeft: emp.holidayLeft - 1, holidays: [...emp.holidays, holidayForm.date] }
      : emp
    ));
    setActiveModal(null);
  };

  const onboardEmployee = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newEmp = {
      id: `e${Date.now()}`,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      salary: Number(formData.get("salary")),
      holidayLeft: 25,
      holidays: []
    };
    setEmployees([...employees, newEmp]);
    setActiveModal(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-stone-900 font-sans">
      
      {/* SIDEBAR (Referencing image_657258.png style) */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl">A</div>
            <div className="flex flex-col">
              <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Command Center</span>
            </div>
          </div>
          <nav className="space-y-4">
            <button onClick={() => setActiveNode("finance")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNode === "finance" ? "bg-[#a9b897] text-white shadow-lg" : "text-stone-400 hover:bg-stone-50"}`}><Receipt size={18}/> Finance & Sales</button>
            <button onClick={() => setActiveNode("hr")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNode === "hr" ? "bg-[#a9b897] text-white shadow-lg" : "text-stone-400 hover:bg-stone-50"}`}><Users size={18}/> Human Resources</button>
            <button onClick={() => setActiveNode("intel")} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNode === "intel" ? "bg-[#a9b897] text-white shadow-lg" : "text-stone-400 hover:bg-stone-50"}`}><BarChart3 size={18}/> Intelligence</button>
          </nav>
        </div>
      </aside>

      {/* VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        
        {/* FINANCE INTERFACE */}
        {activeNode === "finance" && (
          <div className="p-16 max-w-7xl mx-auto grid grid-cols-12 gap-12">
            <div className="col-span-8 space-y-8">
              <div className="flex gap-4 bg-stone-100 p-2 rounded-3xl w-fit">
                {["invoice", "quote", "expense"].map(t => (
                  <button key={t} onClick={() => setDocType(t)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${docType === t ? "bg-white shadow-sm" : "text-stone-400"}`}>{t}</button>
                ))}
              </div>

              <div className="bg-white border border-stone-100 rounded-[4rem] p-16 shadow-2xl relative">
                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Assign Contact</label>
                     <select className="w-full mt-2 h-14 bg-stone-50 rounded-2xl px-4 border-none text-xs font-bold" onChange={(e) => setAssignedContact(e.target.value)}>
                       <option>Select Customer...</option>
                       {CONTACTS.map(c => <option key={c.id} value={c.name}>{c.name} ({c.company})</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Project Link</label>
                     <select className="w-full mt-2 h-14 bg-stone-50 rounded-2xl px-4 border-none text-xs font-bold" onChange={(e) => setAssignedProject(e.target.value)}>
                       {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                   </div>
                </div>

                <div className="space-y-4 mb-10">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-stone-50/50 p-4 rounded-2xl">
                      <input className="flex-1 bg-transparent font-serif italic text-sm outline-none" value={item.desc} onChange={(e) => {
                        const n = [...items]; n[idx].desc = e.target.value; setItems(n);
                      }} />
                      <input className="w-24 bg-transparent text-right font-bold outline-none" value={item.rate} type="number" onChange={(e) => {
                        const n = [...items]; n[idx].rate = Number(e.target.value); setItems(n);
                      }} />
                      <button onClick={() => setItems(items.filter(i => i.id !== item.id))}><Trash2 size={14} className="text-stone-300 hover:text-red-400"/></button>
                    </div>
                  ))}
                  <button onClick={() => setItems([...items, {id: Date.now(), desc: "New Item", qty: 1, rate: 0}])} className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">+ Add Row</button>
                </div>

                <div className="pt-10 border-t border-stone-100 flex justify-between items-end">
                  <div className="text-[9px] font-bold text-stone-400">STATUS: <span className="text-[#a9b897]">{currentStatus}</span></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-stone-300">Grand Total</p>
                    <p className="text-5xl font-serif italic">£{totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Drafts Section */}
              <div className="bg-white rounded-[3rem] p-10 border border-stone-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-6">Saved Drafts</h3>
                <div className="space-y-3">
                  {drafts.map(d => (
                    <div key={d.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase">{d.type} - {d.contact}</span>
                      <div className="flex gap-4">
                        <button onClick={() => setCurrentStatus("Approved")} className="text-[9px] font-black uppercase text-green-500">Approve</button>
                        <button onClick={() => setDrafts(drafts.filter(x => x.id !== d.id))} className="text-[9px] font-black uppercase text-red-400">Void</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FINANCE ACTIONS (Referencing image_651c00.jpg) */}
            <div className="col-span-4 space-y-6">
              <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-4">Global Actions</h3>
                <button onClick={() => setActiveModal("preview")} className="w-full h-16 bg-[#a9b897] text-white rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl"><Mail size={16}/> Email to Client</button>
                <button onClick={() => alert("Downloading PDF...")} className="w-full h-16 bg-stone-100 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"><Download size={16}/> Export PDF</button>
                <button onClick={saveAsDraft} className="w-full h-16 border-2 border-stone-100 text-stone-400 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-stone-200 transition-all">Save as Draft</button>
                <button onClick={() => {setItems([]); setAssignedContact(""); setCurrentStatus("Voided")}} className="w-full h-14 text-red-300 hover:text-red-500 text-[9px] font-black uppercase tracking-widest transition-all">Void Current {docType}</button>
              </div>
            </div>
          </div>
        )}

        {/* HR INTERFACE (Referencing image_657258.png) */}
        {activeNode === "hr" && (
          <div className="p-16 max-w-7xl mx-auto space-y-12">
            <div className="grid grid-cols-3 gap-10">
              {/* Payroll Card */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm flex flex-col items-center text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-10">Monthly Payroll</p>
                <p className="text-6xl font-serif italic mb-2">£{(employees.reduce((a,b)=>a+(b.salary/12), 0)).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-[#a9b897] uppercase tracking-widest mb-12">Next Run: May 28, 2026</p>
                <button onClick={executePayroll} className="px-10 py-5 bg-[#a9b897] text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Execute Payroll Run</button>
              </div>

              {/* Attendance Card */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-10 text-center">Attendance Node</p>
                <div className="space-y-6 mb-12">
                  {employees.map(e => (
                    <div key={e.id} className="flex justify-between items-center group">
                      <span className="font-serif italic">{e.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold bg-stone-50 px-3 py-1 rounded-full">{e.holidayLeft} Days</span>
                        {e.holidays.length > 0 && <Calendar size={12} className="text-[#a9b897] animate-pulse" />}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveModal("holiday")} className="w-full py-5 bg-[#a9b897] text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl">Book Holiday</button>
              </div>

              {/* Appraisals Card */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-10 text-center">Performance</p>
                <div className="flex-1 bg-stone-50 rounded-[3rem] p-8 mb-10 text-center flex flex-col justify-center">
                   <p className="text-[8px] font-black uppercase text-stone-300 tracking-widest mb-2">Next Appraisal</p>
                   <p className="text-xl font-serif italic">Marcus Vane</p>
                   <p className="text-xs font-bold text-stone-400">— June 12</p>
                </div>
                <button onClick={() => setActiveModal("appraisal")} className="w-full py-5 bg-[#a9b897] text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl">Open Appraisals</button>
              </div>
            </div>

            {/* Team List */}
            <div className="bg-white rounded-[4rem] p-16 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-serif italic text-stone-900">Team Matrix</h2>
                <button onClick={() => setActiveModal("newEmployee")} className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#a9b897] rounded-full text-[10px] font-black uppercase tracking-widest"><UserPlus size={18}/> Add New Employee</button>
              </div>
              <div className="divide-y divide-stone-100">
                {employees.map(e => (
                  <div key={e.id} className="py-8 flex justify-between items-center">
                    <div>
                      <p className="text-xl font-serif italic">{e.name}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">{e.role}</p>
                    </div>
                    <button onClick={() => {setSelectedEmployee(e); setActiveModal("payslips")}} className="px-6 py-3 border border-stone-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all">View All Payslips</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INTELLIGENCE INTERFACE (Referencing image_651427.jpg) */}
        {activeNode === "intel" && (
          <div className="p-16 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
             <div className="grid grid-cols-4 gap-6">
                {["£142,500", "£28,500", "£4,210", "£109,790"].map((v, i) => (
                  <div key={i} className="bg-white rounded-[3rem] p-10 shadow-sm">
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-6">Metric Node {i+1}</p>
                    <p className="text-4xl font-serif italic">{v}</p>
                    <p className="text-[9px] font-bold text-[#a9b897] mt-2">+12% vs LY</p>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-12 gap-10">
                <div className="col-span-8 bg-stone-900 rounded-[5rem] p-20 text-white relative overflow-hidden">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-12">Tax Readiness Node</p>
                   <p className="text-[10px] font-black uppercase text-white/20 mb-2">Self Assessment 2026</p>
                   <h2 className="text-7xl font-serif italic mb-16">Pending Submission</h2>
                   
                   <div className="grid grid-cols-3 gap-10 pt-12 border-t border-white/10">
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/30 mb-2">Dividend Pool</p>
                        <p className="text-2xl font-serif italic">£42,000</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/30 mb-2">Corp Tax (Est)</p>
                        <p className="text-2xl font-serif italic">£12,400</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/30 mb-2">VAT Returns</p>
                        <p className="text-2xl font-serif italic text-[#a9b897]">Quarterly Clean</p>
                      </div>
                   </div>
                   <Zap size={300} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
                </div>

                <div className="col-span-4 bg-white rounded-[4rem] p-12 flex flex-col">
                   <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.3em] mb-10">System Reports</p>
                   <div className="space-y-4 flex-1">
                      {["P&L Statement", "Balance Sheet", "Payroll History", "Expense Audit"].map((r, i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                           <div className="w-16 h-16 bg-[#a9b897] rounded-2xl flex items-center justify-center text-white"><FileStack size={20}/></div>
                           <div>
                             <p className="text-[10px] font-black uppercase group-hover:text-[#a9b897] transition-all">{r}</p>
                             <p className="text-[8px] font-bold text-stone-300">Updated April 2026</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* ======================================================
         MODAL SYSTEM (The Action Popups)
      ====================================================== */}
      
      {/* Holiday Modal with Logic */}
      {activeModal === "holiday" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-xl p-16 animate-in zoom-in-95">
            <h3 className="text-3xl font-serif italic mb-10">Book Attendance Leave</h3>
            <div className="space-y-6">
              <select className="w-full h-16 bg-stone-50 rounded-2xl px-6 outline-none" onChange={(e) => setHolidayForm({...holidayForm, empId: e.target.value})}>
                <option>Select Team Member...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <input type="date" className="w-full h-16 bg-stone-50 rounded-2xl px-6 outline-none" onChange={(e) => setHolidayForm({...holidayForm, date: e.target.value})} />
              <button onClick={bookHoliday} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Confirm Leave & Sync Calendar</button>
              <button onClick={() => setActiveModal(null)} className="w-full text-[9px] font-black uppercase text-stone-300">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Employee Modal with Logic */}
      {activeModal === "newEmployee" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl p-16 animate-in zoom-in-95">
            <h3 className="text-3xl font-serif italic mb-10">Onboard New Talent</h3>
            <form onSubmit={onboardEmployee} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input name="name" placeholder="Full Legal Name" className="h-16 bg-stone-50 rounded-2xl px-6 outline-none" required />
                <input name="role" placeholder="Position" className="h-16 bg-stone-50 rounded-2xl px-6 outline-none" required />
              </div>
              <input name="salary" type="number" placeholder="Annual Salary (£)" className="w-full h-16 bg-stone-50 rounded-2xl px-6 outline-none" required />
              <div className="p-10 border-2 border-dashed border-stone-100 rounded-3xl text-center text-stone-300">
                <p className="text-[10px] font-black uppercase mb-2">Employment Contract</p>
                <input type="file" className="text-[8px]" />
              </div>
              <button type="submit" className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Create Employee Record</button>
              <button type="button" onClick={() => setActiveModal(null)} className="w-full text-[9px] font-black uppercase text-stone-300">Discard</button>
            </form>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {activeModal === "preview" && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl p-20 flex gap-12 animate-in slide-in-from-bottom-10">
            <div className="flex-1 bg-stone-100 rounded-[3rem] p-10 flex flex-col justify-center items-center text-stone-300 border border-stone-200">
               <Eye size={48} className="mb-4 opacity-20" />
               <p className="text-[10px] font-black uppercase">Live PDF Preview</p>
            </div>
            <div className="w-80 space-y-8">
               <h3 className="text-3xl font-serif italic">Dispatch Invoice</h3>
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-stone-300">Recipient</p>
                  <p className="text-sm font-bold">{assignedContact || "No Client Selected"}</p>
                  <p className="text-[10px] font-black uppercase text-stone-300 mt-6">Project</p>
                  <p className="text-sm font-bold italic">{assignedProject}</p>
               </div>
               <button onClick={() => {alert("Email Dispatched to Client!"); setActiveModal(null)}} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3"><Send size={16}/> Confirm & Send</button>
               <button onClick={() => setActiveModal(null)} className="w-full text-[9px] font-black uppercase text-stone-400">Back to Editor</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}