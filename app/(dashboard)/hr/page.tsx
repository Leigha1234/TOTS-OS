"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Users, Save, Clock, Calendar, Award, Trash2, UserPlus, 
  X, Check, Briefcase, Landmark, Fingerprint, HeartPulse, 
  FileText, Search, ArrowUpRight, ShieldCheck, Mail
} from "lucide-react";

/**
 * HR & PAYROLL CORE - v5.0.0
 * Standardized Personnel & Operations Template
 */

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // --- UI GLOBAL STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // --- HR DATA STATE ---
  const [empName, setEmpName] = useState("Jane Doe");
  const [empRole, setEmpRole] = useState("Marketing Executive");
  const [contractType, setContractType] = useState("Full-Time");
  const [holidayEntitlement, setHolidayEntitlement] = useState(28);

  const [payrollEntries, setPayrollEntries] = useState([
    { id: "1", employee: "Sarah Chen", role: "Developer", total: 2000, dateOfPay: "2026-05-28" },
    { id: "2", employee: "Marcus Aurelius", role: "Strategy", total: 4500, dateOfPay: "2026-05-28" }
  ]);

  const [holidayRequests] = useState([
    { id: "H-1", employee: "Jane Doe", dates: "May 10 - May 17", status: "Pending" },
    { id: "H-2", employee: "Sarah Chen", dates: "Jun 01 - Jun 05", status: "Approved" }
  ]);

  useEffect(() => { setIsMounted(true); }, []);

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  if (!isMounted) return null;

  // --- REUSABLE COMPONENTS ---
  const Modal = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-6"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[3.5rem] p-12 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 hover:bg-stone-100 rounded-full transition-all">
              <X size={20}/>
            </button>
            <div className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Personnel Module</p>
              <h3 className="text-5xl font-serif italic tracking-tighter">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-16">
        
        {/* --- HEADER & NAVIGATION --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Workforce Identity v5.0</p>
            </div>
            <h1 className="text-7xl font-serif italic tracking-tighter leading-tight">Human Resources</h1>
          </div>

          <nav className="flex bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            <button onClick={() => router.push('/payments')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Payments</button>
            <button onClick={() => router.push('/finance-reports')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Reports</button>
            <button className="px-10 py-4 text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white rounded-full shadow-xl">HR</button>
            <button onClick={() => router.push('/timesheets')} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all">Timesheets</button>
          </nav>
        </header>

        {/* --- COMMAND GRID --- */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            { id: 'onboard', label: 'Onboard Staff', icon: UserPlus, color: 'text-[#a9b897]' },
            { id: 'payroll', label: 'Run Payroll', icon: Landmark, color: 'text-stone-400' },
            { id: 'appraisals', label: 'Performance', icon: Award, color: 'text-stone-400' },
            { id: 'leave', label: 'Leave Manager', icon: Calendar, color: 'text-stone-400' },
            { id: 'directory', label: 'Staff Directory', icon: Users, color: 'text-[#a9b897]' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setActiveModal(btn.id)}
              className="flex flex-col items-center justify-center gap-5 p-8 bg-white border border-stone-200 rounded-[2.8rem] hover:border-[#a9b897] hover:shadow-2xl transition-all group active:scale-95 shadow-sm min-h-[160px]"
            >
              <btn.icon size={22} className={`${btn.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-500 text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </section>

        {/* --- HR KPI METRICS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 relative overflow-hidden group">
            <div className="z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">Total Workforce</p>
              <h2 className="text-6xl font-mono tracking-tighter">12</h2>
            </div>
            <div className="z-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">All Systems Nominal</span>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#a9b897] opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-all" />
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 hover:shadow-lg transition-shadow">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payroll Pool</p>
            <h2 className="text-6xl font-mono tracking-tighter">£{payrollEntries.reduce((a, b) => a + b.total, 0).toLocaleString()}</h2>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Next Run: 28 May</p>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Leave Balance</p>
            <h2 className="text-6xl font-mono tracking-tighter">{holidayEntitlement}d</h2>
            <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
              <div className="bg-[#a9b897] h-full w-[40%]" />
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] flex flex-col justify-between h-72 border-b-8 border-b-stone-900">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Contract Status</p>
            <h2 className="text-5xl font-serif italic tracking-tighter">{contractType}</h2>
            <button className="w-full py-4 border-t border-stone-100 text-[9px] font-black uppercase tracking-widest hover:text-[#a9b897] transition-colors">
              Review Documents
            </button>
          </div>
        </section>

        {/* --- MAIN OPERATIONS AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Employee Profile Section */}
          <div className="lg:col-span-2 bg-white border border-stone-200 p-12 rounded-[3.5rem] space-y-10 shadow-sm">
            <div className="flex justify-between items-end border-b border-stone-50 pb-8">
              <div className="space-y-2">
                <h4 className="text-4xl font-serif italic tracking-tighter">Core Personnel Record</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Electronic Staff File: {empName}</p>
              </div>
              <button onClick={() => notify("Profile records updated")} className="p-4 bg-stone-900 text-white rounded-2xl hover:scale-105 transition-transform">
                <Save size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {[
                { label: 'Legal Name', val: empName, set: setEmpName },
                { label: 'Professional Role', val: empRole, set: setEmpRole },
                { label: 'Weekly Hours', val: '40', type: 'number' },
                { label: 'Annual Leave', val: holidayEntitlement.toString(), type: 'number' }
              ].map((field, i) => (
                <div key={i} className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">{field.label}</label>
                  <input 
                    type={field.type || 'text'}
                    value={field.val}
                    onChange={(e) => field.set && field.set(e.target.value)}
                    className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-900 transition-all font-semibold text-sm" 
                  />
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-stone-50">
              <h5 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-stone-400 flex items-center gap-2">
                <Landmark size={14} /> Emergency & Financial
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-stone-50 rounded-3xl space-y-2 border border-stone-100">
                  <p className="text-[8px] font-black uppercase text-stone-400">Bank Account</p>
                  <p className="text-xs font-mono font-bold tracking-widest">**** 4402</p>
                </div>
                <div className="p-6 bg-stone-50 rounded-3xl space-y-2 border border-stone-100">
                  <p className="text-[8px] font-black uppercase text-stone-400">Sort Code</p>
                  <p className="text-xs font-mono font-bold tracking-widest">40-12-00</p>
                </div>
                <div className="p-6 bg-stone-50 rounded-3xl space-y-2 border border-stone-100">
                  <p className="text-[8px] font-black uppercase text-stone-400">Next of Kin</p>
                  <p className="text-xs font-bold uppercase">+44 7700 900</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity/Status Sidebar */}
          <div className="space-y-8">
            <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white space-y-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Live Leave Requests</p>
              <div className="space-y-4">
                {holidayRequests.map((h) => (
                  <div key={h.id} className="p-5 bg-stone-800/50 rounded-2xl border border-stone-700/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">{h.employee}</p>
                      <p className="text-[9px] text-stone-500 uppercase font-black">{h.dates}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${h.status === 'Approved' ? 'bg-[#a9b897] text-white' : 'bg-stone-700 text-stone-400'}`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Approve All Pending
              </button>
            </div>

            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6">
              <h6 className="text-xs font-black uppercase tracking-widest">Quick Actions</h6>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all">
                  Request P60 <Mail size={14} className="text-stone-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all">
                  Download Handbook <FileText size={14} className="text-stone-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- PAYROLL LEDGER --- */}
        <section className="space-y-10 pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <h4 className="text-4xl font-serif italic tracking-tighter">Payroll Disbursement</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-sans">Monthly compensation history</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-[3.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Personnel</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Role Title</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400">Amount</th>
                  <th className="px-12 py-8 text-[10px] font-black uppercase text-stone-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payrollEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-12 py-10">
                      <p className="text-xs font-bold text-stone-800">{entry.employee}</p>
                      <p className="text-[9px] text-stone-400 uppercase font-black">ID: {entry.id}002</p>
                    </td>
                    <td className="px-12 py-10 text-[10px] font-black uppercase text-stone-500 tracking-widest">{entry.role}</td>
                    <td className="px-12 py-10 font-mono font-bold text-base">£{entry.total.toLocaleString()}</td>
                    <td className="px-12 py-10 text-right">
                      <span className="px-3 py-1 border border-stone-200 text-stone-400 text-[8px] font-black uppercase tracking-widest rounded-full">Processing</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* --- MODALS --- */}
      <Modal id="onboard" title="Personnel Onboarding">
        <div className="space-y-8 py-4">
          <p className="text-sm text-stone-500 leading-relaxed">Initiate the onboarding process for a new team member. This will generate the necessary contract templates and system access credentials.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input placeholder="Legal Full Name" className="w-full p-6 bg-stone-50 rounded-2xl border border-stone-100 outline-none" />
            <input placeholder="Personal Email Address" className="w-full p-6 bg-stone-50 rounded-2xl border border-stone-100 outline-none" />
          </div>
          <button onClick={() => { notify("Onboarding Link Sent"); setActiveModal(null); }} className="w-full bg-stone-900 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">Generate Invitation</button>
        </div>
      </Modal>

    </div>
  );
}