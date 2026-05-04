"use client";

import React, { useState, useMemo } from "react";
import { 
  Plus, Trash2, Landmark, FileText, UserPlus, Receipt, Users, BarChart3, 
  Download, Search, Camera, Zap, ChevronRight, Mail, Calendar, Eye, 
  EyeOff, Printer, Send, Ban, CheckCircle2, Briefcase, TrendingUp, 
  FileStack, ShieldCheck, X, Save, Wallet, HardDrive
} from "lucide-react";

/* ======================================================
   1. TYPES & MOCK DATA
====================================================== */

const MOCK_DB = {
  contacts: [
    { id: "c1", name: "Sarah Jenkins", company: "Anthropic" },
    { id: "c2", name: "Marcus Vane", company: "Design Systems" }
  ],
  projects: [
    { id: "p1", name: "Q2 Brand Audit" },
    { id: "p2", name: "Next.js Migration" }
  ],
  employees: [
    { id: "e1", name: "Sarah Chen", role: "Lead Engineer", salary: 85000, holidayLeft: 12 },
    { id: "e2", name: "Marcus Vane", role: "UX Designer", salary: 52000, holidayLeft: 18 }
  ]
};

/* ======================================================
   2. CORE UTILITY COMPONENTS (Modals)
====================================================== */

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="text-xl font-serif italic">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <div className="p-10 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* ======================================================
   3. MAIN APPLICATION
====================================================== */

export default function ApexOS() {
  const [activeNode, setActiveNode] = useState("finance");
  const [docType, setDocType] = useState("invoice"); // invoice | quote | expense
  const [status, setStatus] = useState("Draft"); // Draft | Approved | Void
  
  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Finance State
  const [items, setItems] = useState([{ id: 1, desc: "System Architecture Design", qty: 1, rate: 4500 }]);
  const [assignedContact, setAssignedContact] = useState("");
  const [assignedProject, setAssignedProject] = useState("");

  // Intelligence State (Reports)
  const [reportRange, setReportRange] = useState("2026");

  const totalAmount = useMemo(() => items.reduce((a, b) => a + (b.qty * b.rate), 0), [items]);

  /* Handlers */
  const handleExecutePayroll = () => {
    alert("Payroll Processing: Sending £14,250 to 12 employees via BACS... Success.");
  };

  const handleExportPDF = () => {
    alert(`Generating high-fidelity PDF for ${docType} #APX-001... Download started.`);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-stone-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen z-50">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-[#a9b897] font-serif italic text-2xl shadow-xl">A</div>
            <div className="flex flex-col leading-none">
              <span className="font-serif italic text-xl tracking-tighter">Apex OS</span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Command Center</span>
            </div>
          </div>
          <nav className="space-y-3">
            {[
              { id: "finance", icon: <Receipt size={18}/>, label: "Finance & Sales" },
              { id: "hr", icon: <Users size={18}/>, label: "Human Resources" },
              { id: "intelligence", icon: <BarChart3 size={18}/>, label: "Intelligence" },
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => setActiveNode(btn.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeNode === btn.id ? "bg-stone-900 text-[#a9b897] shadow-xl" : "text-stone-400 hover:text-stone-900"}`}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-12 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif italic capitalize">{activeNode}</h1>
            <div className="h-1 w-1 rounded-full bg-stone-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] animate-pulse">Node Live</span>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto space-y-12">

          {/* FINANCE NODE */}
          {activeNode === "finance" && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-8 space-y-8">
                <div className="flex gap-4 bg-stone-100 p-2 rounded-3xl w-fit">
                  {["invoice", "quote", "expense"].map(t => (
                    <button key={t} onClick={() => setDocType(t)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${docType === t ? "bg-white shadow-sm" : "text-stone-400"}`}>{t}</button>
                  ))}
                </div>

                <div className="bg-white border border-stone-100 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden">
                   {/* Status Badge */}
                   <div className={`absolute top-10 right-10 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'Approved' ? 'bg-[#a9b897] text-white' : status === 'Void' ? 'bg-red-100 text-red-500' : 'bg-stone-100 text-stone-400'}`}>
                    {status}
                   </div>

                   <div className="grid grid-cols-2 gap-10 mb-16">
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Assign Contact</label>
                        <select className="w-full h-14 bg-stone-50 border-none rounded-2xl px-4 text-xs font-bold" onChange={(e) => setAssignedContact(e.target.value)}>
                          <option>Select Client...</option>
                          {MOCK_DB.contacts.map(c => <option key={c.id} value={c.name}>{c.name} ({c.company})</option>)}
                          <option value="new">+ Create New Contact</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Project Link</label>
                        <select className="w-full h-14 bg-stone-50 border-none rounded-2xl px-4 text-xs font-bold" onChange={(e) => setAssignedProject(e.target.value)}>
                          <option>Internal / General</option>
                          {MOCK_DB.projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                   </div>

                   <div className="space-y-4 mb-12">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                          <input className="flex-1 h-14 bg-stone-50 rounded-2xl px-6 font-serif italic" value={item.desc} />
                          <input className="w-32 h-14 bg-stone-50 rounded-2xl text-center font-bold" value={`£${item.rate}`} />
                          <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-stone-200 hover:text-red-400"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      <button onClick={() => setItems([...items, {id: Date.now(), desc: "", qty: 1, rate: 0}])} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#a9b897] mt-4"><Plus size={14}/> Add New Line</button>
                   </div>

                   <div className="p-10 bg-stone-900 rounded-[3rem] text-white flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Total Settlement Value</p>
                      <p className="text-4xl font-serif italic">£{totalAmount.toLocaleString()}</p>
                   </div>
                </div>
              </div>

              <div className="col-span-4 space-y-6">
                 <div className="bg-white border border-stone-100 rounded-[3.5rem] p-8 space-y-3">
                    <button onClick={() => setActiveModal("preview")} className="w-full h-16 bg-stone-900 text-[#a9b897] rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"><Mail size={16}/> Email to Client</button>
                    <button onClick={handleExportPDF} className="w-full h-16 bg-stone-50 text-stone-500 rounded-3xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-100 transition-all"><Download size={16}/> Export PDF</button>
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <button onClick={() => setStatus("Approved")} className="h-14 border-2 border-[#a9b897]/20 text-[#a9b897] rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-[#a9b897] hover:text-white transition-all"><CheckCircle2 size={14}/> Approve</button>
                      <button onClick={() => setStatus("Void")} className="h-14 border-2 border-red-100 text-red-400 rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"><Ban size={14}/> Void</button>
                    </div>
                    <button onClick={() => setStatus("Draft")} className="w-full h-14 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest mt-2 hover:text-stone-600 transition-all"><Save size={14}/> Save to Drafts</button>
                 </div>
              </div>
            </div>
          )}

          {/* HR NODE */}
          {activeNode === "hr" && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-3 gap-8">
                {/* Payroll */}
                <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group">
                  <Wallet className="absolute -right-4 -bottom-4 text-stone-50 group-hover:text-[#a9b897]/5 transition-colors" size={140}/>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Monthly Payroll</h3>
                  <p className="text-5xl font-serif italic mb-2">£14,250</p>
                  <p className="text-[9px] font-black uppercase text-[#a9b897] tracking-widest mb-10">Next Run: May 28</p>
                  <button onClick={handleExecutePayroll} className="w-full py-5 bg-stone-900 text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 shadow-xl">Execute Payroll Run</button>
                </div>
                {/* Holidays */}
                <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Attendance Node</h3>
                  <div className="space-y-4 mb-10">
                    {MOCK_DB.employees.map(e => (
                      <div key={e.id} className="flex justify-between items-center text-xs">
                        <span className="font-serif italic">{e.name}</span>
                        <span className="text-[9px] font-bold bg-stone-50 px-3 py-1 rounded-full">{e.holidayLeft} Days Left</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveModal("holiday")} className="w-full py-5 bg-[#a9b897] text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest shadow-xl">Book Holiday</button>
                </div>
                {/* Appraisals */}
                <div className="bg-white border border-stone-100 rounded-[3.5rem] p-10 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 mb-8">Performance</h3>
                  <div className="bg-stone-50 rounded-3xl p-6 mb-10">
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-1">Scheduled Today</p>
                    <p className="text-sm font-serif italic text-stone-900">Marcus Vane — Q2 Review</p>
                  </div>
                  <button onClick={() => setActiveModal("appraisal")} className="w-full py-5 border border-stone-100 text-stone-400 rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all">Open Appraisals</button>
                </div>
              </div>

              {/* Employee Table */}
              <div className="bg-white border border-stone-100 rounded-[4rem] p-16 shadow-2xl">
                <div className="flex justify-between items-center mb-12">
                  <h2 className="text-4xl font-serif italic">Team Directory</h2>
                  <button onClick={() => setActiveModal("newEmployee")} className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#a9b897] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] transition-all">
                    <UserPlus size={18}/> Add New Employee
                  </button>
                </div>
                <table className="w-full">
                  <thead className="text-[9px] font-black uppercase tracking-widest text-stone-300 text-left">
                    <tr><th className="pb-8">Name</th><th className="pb-8">Role</th><th className="pb-8">Status</th><th className="pb-8 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {MOCK_DB.employees.map(e => (
                      <tr key={e.id}>
                        <td className="py-8 font-serif italic">{e.name}</td>
                        <td className="py-8 text-xs font-bold text-stone-400 uppercase tracking-tighter">{e.role}</td>
                        <td className="py-8"><span className="px-3 py-1 bg-green-50 text-green-500 text-[8px] font-black uppercase rounded-full tracking-widest">Active</span></td>
                        <td className="py-8 text-right">
                          <button onClick={() => setActiveModal("payslips")} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-[#a9b897] transition-colors">View Payslips</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INTELLIGENCE NODE (FIXED LAYOUT) */}
          {activeNode === "intelligence" && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: "Rev YTD", val: "£412,000", delta: "+18%", icon: <TrendingUp className="text-[#a9b897]"/> },
                    { label: "Liabilities", val: "£22,400", delta: "Normal", icon: <ShieldCheck className="text-stone-300"/> },
                    { label: "Team Velocity", val: "84%", delta: "High", icon: <Zap className="text-stone-300"/> },
                    { label: "Burn Rate", val: "£12,000", delta: "-2%", icon: <HardDrive className="text-stone-300"/> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-stone-100 rounded-[2.5rem] p-8 shadow-sm group hover:border-[#a9b897] transition-all">
                      <div className="flex justify-between mb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">{stat.label}</span>
                        {stat.icon}
                      </div>
                      <p className="text-3xl font-serif italic text-stone-900 mb-1">{stat.val}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897]">{stat.delta}</p>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-12 gap-10">
                  <div className="col-span-8 bg-stone-900 rounded-[4rem] p-16 text-white relative overflow-hidden">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-12">Dynamic Financial Forecast</h3>
                    <div className="h-64 flex items-end gap-4 mb-8">
                       {[60, 80, 45, 90, 100, 75, 120, 140].map((h, i) => (
                         <div key={i} className="flex-1 bg-white/10 rounded-t-2xl hover:bg-[#a9b897] transition-all relative group" style={{height: `${h}px`}}>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-stone-900 text-[8px] font-black px-2 py-1 rounded-lg">£{h}k</div>
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                       <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                    </div>
                  </div>

                  <div className="col-span-4 bg-white border border-stone-100 rounded-[4rem] p-12">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-8">Institutional Reports</h3>
                     <div className="space-y-3">
                        {[
                          { name: "Profit & Loss", date: "Q1 2026", type: "Full Audit" },
                          { name: "VAT Summary", date: "Mar 2026", type: "Standard Rate" },
                          { name: "Payroll History", date: "2025/26", type: "Tax Year" }
                        ].map((rep, i) => (
                          <div key={i} className="p-6 bg-stone-50 rounded-[2rem] flex justify-between items-center group hover:bg-stone-900 transition-all cursor-pointer">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover:text-[#a9b897] mb-1">{rep.name}</p>
                                <p className="text-[8px] font-bold text-stone-300 group-hover:text-white/40">{rep.date} / {rep.type}</p>
                             </div>
                             <Download size={16} className="text-stone-200 group-hover:text-white"/>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================
         4. MODAL RENDERER
      ====================================================== */}
      
      {/* Email/Invoice Preview Modal */}
      <Modal isOpen={activeModal === "preview"} onClose={() => setActiveModal(null)} title="Final Review & Dispatch">
        <div className="space-y-8">
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 mb-4">Recipient: {assignedContact || 'Select Contact First'}</p>
            <div className="p-10 bg-white border border-stone-200 shadow-sm rounded-xl text-center">
              <FileText className="mx-auto mb-4 text-stone-200" size={48}/>
              <p className="text-sm font-serif italic text-stone-400">PDF Preview generated for #APX-001</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 py-5 bg-stone-900 text-[#a9b897] rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => {alert("Email Sent!"); setActiveModal(null)}}>Confirm & Send Email</button>
          </div>
        </div>
      </Modal>

      {/* Holiday Booking Modal */}
      <Modal isOpen={activeModal === "holiday"} onClose={() => setActiveModal(null)} title="Book Attendance Leave">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">Select Member</label>
            <select className="w-full h-14 bg-stone-50 rounded-2xl px-4 text-xs font-bold border-none outline-none">
              {MOCK_DB.employees.map(e => <option key={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">From</label>
              <input type="date" className="w-full h-14 bg-stone-50 rounded-2xl px-4 text-xs font-bold border-none outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">To</label>
              <input type="date" className="w-full h-14 bg-stone-50 rounded-2xl px-4 text-xs font-bold border-none outline-none" />
            </div>
          </div>
          <button className="w-full py-5 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl mt-4">Confirm Leave Request</button>
        </div>
      </Modal>

      {/* New Employee Modal */}
      <Modal isOpen={activeModal === "newEmployee"} onClose={() => setActiveModal(null)} title="Onboard New Talent">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Full Legal Name" className="h-14 bg-stone-50 rounded-2xl px-6 text-sm" />
            <input placeholder="Job Title" className="h-14 bg-stone-50 rounded-2xl px-6 text-sm" />
          </div>
          <input placeholder="Personal Email" className="w-full h-14 bg-stone-50 rounded-2xl px-6 text-sm" />
          <div className="p-6 border-2 border-dashed border-stone-100 rounded-3xl flex items-center justify-between text-stone-300">
             <span className="text-[10px] font-black uppercase tracking-widest">Employment Contract (PDF)</span>
             <Upload size={18}/>
          </div>
          <button className="w-full py-5 bg-stone-900 text-[#a9b897] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Onboard Employee</button>
        </div>
      </Modal>

      {/* Appraisals Modal */}
      <Modal isOpen={activeModal === "appraisal"} onClose={() => setActiveModal(null)} title="Performance Appraisal Engine">
        <div className="space-y-8">
           {[
             "What are the primary achievements this quarter?",
             "What blockers are currently impacting performance?",
             "Growth Goal for the next 90 days:"
           ].map((q, i) => (
             <div key={i} className="space-y-2">
               <label className="text-[9px] font-black uppercase tracking-widest text-stone-300">{q}</label>
               <textarea className="w-full h-32 bg-stone-50 rounded-2xl p-6 text-sm italic font-serif border-none outline-none resize-none" placeholder="Enter findings..."></textarea>
             </div>
           ))}
           <button className="w-full py-5 bg-[#a9b897] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Lock Appraisal Report</button>
        </div>
      </Modal>

      {/* View Payslips Modal */}
      <Modal isOpen={activeModal === "payslips"} onClose={() => setActiveModal(null)} title="Employee Financial History">
        <div className="space-y-4">
          {["April 2026", "March 2026", "February 2026", "January 2026"].map((m, i) => (
            <div key={i} className="p-6 bg-stone-50 rounded-3xl flex justify-between items-center group hover:bg-stone-900 transition-all">
              <span className="text-xs font-serif italic text-stone-900 group-hover:text-white">{m} Payroll Statement</span>
              <button className="p-3 bg-white rounded-xl text-stone-900 group-hover:bg-[#a9b897] transition-all"><Download size={16}/></button>
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
}