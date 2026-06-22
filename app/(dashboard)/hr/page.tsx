"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
type Profile = Record<string, any>;
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, FileText, Download, BarChart3, Clock,
  Loader2, Activity, ChevronRight,
  ShieldCheck, Briefcase, Phone, MapPin, Zap, Cpu, Lock, Globe,
  Wallet, Receipt, ClipboardCheck, Umbrella, HeartPulse
} from "lucide-react";

/**
 * TOTS OS v7.1.0 - COMPACT PERSONNEL MODULE
 * REVISION: SCALE ALIGNMENT | NAV SYNC | DENSITY OPTIMIZATION
 */

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notification, setNotification] = useState({ visible: false, msg: "" });
  const [activeTab, setActiveTab] = useState<string>("overview");

  const [profile, setProfile] = useState<Profile>({
    id: null,
    full_name: "",
    role: "",
    address: "",
    phone: "",
    bank_name: "",
    account_number: "",
    sort_code: ""
  });

  // === CLARITY HR INTELLIGENCE ENGINE ===
  const clarityHR = React.useMemo(() => {
    const filledFields = [
      profile.full_name,
      profile.role,
      profile.phone,
      profile.address,
      profile.bank_name,
      profile.account_number,
      profile.sort_code
    ].filter(Boolean).length;

    const completeness = (filledFields / 7) * 100;

    const riskFlags: string[] = [];

    if (!profile.bank_name) riskFlags.push("Missing payroll institution");
    if (!profile.address) riskFlags.push("Incomplete identity record");
    if (!profile.role) riskFlags.push("Undefined operational role");

    const status =
      completeness > 80 ? "verified" : completeness > 50 ? "partial" : "critical";

    return {
      completeness,
      riskFlags,
      status
    };
  }, [profile]);

  useEffect(() => {
    setIsMounted(true);
    fetchProfile();
  }, []);

// Replace your existing functions with these:
async function fetchProfile() {
  setIsLoading(true);
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error) {
    console.error("Auth error:", error);
    setIsLoading(false);
    return;
  }

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  }
  setIsLoading(false);
}

async function handleSave() {
  // Defensive Check
  if (!profile.full_name || profile.full_name.trim() === "") {
    notify("Error: Name Required");
    return;
  }
  
  setIsSaving(true);
  const { data, error: authError } = await supabase.auth.getUser();
  const user = data?.user;
  
  if (authError || !user) {
    notify("Auth Error: Unable to verify user");
    setIsSaving(false);
    return;
  }
  
  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        role: profile.role,
        address: profile.address,
        phone: profile.phone,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        sort_code: profile.sort_code
      })
      .eq('id', user.id);
      
    if (!error) {
      notify("Identity Synchronized");
      setProfile((prev: Profile) => ({ ...prev, ...profile }));
    } else {
      notify("Sync Failure: Database Denied");
    }
  }
  setIsSaving(false);
}

  const notify = (msg: string) => {
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  if (!isMounted) return null;

  const Modal = ({ id, title, subtitle, children }: { id: string, title: string, subtitle: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[9000] flex justify-end"
          onClick={() => setActiveModal(null)}>
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 40, stiffness: 300 }}
            className="bg-[#faf9f6] h-full w-full max-w-md p-10 shadow-2xl relative overflow-y-auto border-l border-stone-100"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 p-3 bg-white rounded-full hover:bg-stone-900 hover:text-white transition-all text-stone-400 shadow-sm border border-stone-100">
              <X size={16} />
            </button>
            <div className="mb-8 space-y-1 text-left">
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">{subtitle}</p>
              <h3 className="text-3xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans selection:bg-[#a9b897] pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
            <Zap size={12} className="text-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-10">

        {/* CLARITY HR INTELLIGENCE PANEL */}
        <div className="bg-stone-900 text-white rounded-[2.5rem] p-6 mb-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
              Clarity HR Intelligence
            </h3>
            <Cpu size={14} className="text-[#a9b897]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono">
            <div>Completeness: {clarityHR.completeness.toFixed(0)}%</div>
            <div>Status: {clarityHR.status}</div>
            <div>Role: {profile.role || "undefined"}</div>
            <div>Fields: {7}</div>
          </div>

          {clarityHR.riskFlags.length > 0 && (
            <div className="mt-3 text-[9px] uppercase tracking-widest text-red-300">
              {clarityHR.riskFlags.join(" • ")}
            </div>
          )}
        </div>
        
        {/* HEADER ARCHITECTURE */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-100 pb-8">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Fingerprint size={18} /></div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#a9b897] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-serif italic tracking-tighter leading-none">HR & Payroll</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center bg-white p-1 rounded-full shadow-sm border border-stone-100">
              <button onClick={() => router.push('/payments')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] transition-all">Payments</button>
              <button onClick={() => router.push('/finance-reports')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <BarChart3 size={10}/> Financial Reports
              </button>
              <button className="px-5 py-2.5 bg-stone-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <Globe size={10}/> HR & Payroll
              </button>
              <button onClick={() => router.push('/timesheets')} className="px-5 py-2.5 text-stone-300 hover:text-stone-900 rounded-full text-[8px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                <Clock size={10}/> Timesheets
              </button>
            </nav>
            <button onClick={handleSave} disabled={isSaving} className="bg-[#a9b897] text-stone-900 px-6 py-2.5 rounded-full flex items-center gap-3 hover:bg-stone-900 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="text-[8px] font-black uppercase tracking-widest">{isSaving ? 'Syncing' : 'Sync'}</span>
            </button>
          </div>
        </header>

        {/* HR INTERNAL TABS */}
        <div className="flex items-center gap-2 bg-white border border-stone-100 rounded-full p-1 w-fit shadow-sm mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "overview" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("modules")}
            className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === "modules" ? "bg-stone-900 text-white" : "text-stone-300 hover:text-stone-900"}`}
          >
            Modules
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            {/* IDENTITY SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-8 bg-white border border-stone-100 p-8 rounded-[2.5rem] space-y-10 shadow-sm relative overflow-hidden group text-left">
                <div className="flex justify-between items-end border-b border-stone-50 pb-8 relative z-10">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">Verified Registry</p>
                    <h4 className="text-4xl font-serif italic tracking-tighter leading-none mt-1">
                      {profile.full_name || "Registry Pending"}
                    </h4>
                  </div>
                  <Activity size={24} className="text-[#a9b897] opacity-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {[
                    { label: 'Full Legal Name', key: 'full_name', icon: <Fingerprint size={12}/> },
                    { label: 'Operational Role', key: 'role', icon: <Briefcase size={12}/> },
                    { label: 'Secure Contact', key: 'phone', icon: <Phone size={12}/> },
                    { label: 'Physical Address', key: 'address', full: true, icon: <MapPin size={12}/> },
                  ].map((field) => (
                    <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-2`}>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[#a9b897]">{field.icon}</span>
                        <label className="text-[8px] font-black uppercase tracking-[0.4em] text-stone-300">{field.label}</label>
                      </div>
                      <input value={profile[field.key] || ""} onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                          className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl outline-none focus:border-stone-900 focus:bg-white transition-all font-bold text-base text-stone-800" />
                    </div>
                  ))}
                </div>
                <Cpu size={180} className="absolute -right-10 -bottom-10 opacity-[0.02] text-stone-900 pointer-events-none" />
              </section>

              {/* RESOURCE LEDGER */}
              <div className="lg:col-span-4">
                <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[440px] group text-left">
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3 text-stone-500">
                      <Activity size={14} />
                      <p className="text-[8px] font-black uppercase tracking-[0.4em]">Resource Ledger</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-7xl font-mono tracking-tighter text-[#a9b897] leading-none">28.0</h2>
                        <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.4em] italic mt-2">Holiday Credit</p>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5 }} 
                          className="bg-[#a9b897] h-full rounded-full" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4">
                      <button onClick={() => setActiveModal('leave')} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <Calendar size={18} className="text-[#a9b897]" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Request Leave</span>
                        </div>
                        <ChevronRight size={14} className="text-stone-700" />
                      </button>
                      <button onClick={() => setActiveModal('payslip')} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <FileText size={18} className="text-stone-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Document Vault</span>
                        </div>
                        <ChevronRight size={14} className="text-stone-700" />
                      </button>
                    </div>
                  </div>
                  <Lock size={120} className="absolute -right-8 -bottom-8 opacity-[0.03] text-white" />
                </div>
              </div>
            </div>

            {/* BANKING ENDPOINT */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm grid grid-cols-1 xl:grid-cols-12 gap-8 hover:border-stone-900 transition-all text-left">
               <div className="xl:col-span-4 xl:border-r border-stone-100 xl:pr-8 space-y-3">
                  <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-[#a9b897] shadow-inner"><Landmark size={20} /></div>
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Financial Endpoint</h5>
                    <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest italic">Secured parameters for compensation.</p>
                  </div>
               </div>
               
               <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                      { label: 'Institution', key: 'bank_name' },
                      { label: 'Account No.', key: 'account_number' },
                      { label: 'Sort Code', key: 'sort_code' }
                    ].map((bank) => (
                      <div key={bank.key} className="p-5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2 group hover:bg-white transition-all">
                        <p className="text-[8px] font-black uppercase text-stone-300 tracking-[0.4em]">{bank.label}</p>
                        <input value={profile[bank.key] || ""} onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                          className="w-full bg-transparent font-mono font-bold text-base outline-none text-stone-900" placeholder="XXXXXX" />
                      </div>
                  ))}
               </div>
            </section>
          </>
        )}

        {activeTab === "modules" && (
          <>
            {/* HR & PAYROLL MODULES */}
            <section className="space-y-5 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897] italic">Operations Hub</p>
                  <h3 className="text-3xl font-serif italic tracking-tighter">HR & Payroll Modules</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
                {[
                  { title: 'Payroll', id: 'payroll', icon: <Wallet size={18} /> },
                  { title: 'Payslips', id: 'payslips', icon: <Receipt size={18} /> },
                  { title: 'Appraisals', id: 'appraisals', icon: <ClipboardCheck size={18} /> },
                  { title: 'Holiday Requests', id: 'holiday-requests', icon: <Umbrella size={18} /> },
                  { title: 'Sick Pay', id: 'sick-pay', icon: <HeartPulse size={18} /> },

                  { title: 'Expenses', id: 'expenses', icon: <FileText size={18} /> },
                  { title: 'Compliance', id: 'compliance', icon: <ShieldCheck size={18} /> },
                  { title: 'Training', id: 'training', icon: <Activity size={18} /> },
                  { title: 'Employees', id: 'employees', icon: <Briefcase size={18} /> },
                  { title: 'Documents', id: 'documents', icon: <FileText size={18} /> }
                ].map((card) => (
                  <motion.button
                    key={card.title}
                    onClick={() => setActiveModal(card.id)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm hover:border-stone-900 hover:shadow-lg transition-all text-left group flex flex-col justify-between min-h-[170px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-[#a9b897] group-hover:bg-stone-900 group-hover:text-white transition-all">
                      {card.icon}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-lg font-bold tracking-tight text-stone-900">{card.title}</h4>
                      <div className="flex items-center gap-2 text-stone-300 group-hover:text-stone-900 transition-all">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Open Module</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="pt-8 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-[0.4em]">
          <div className="flex items-center gap-3">
            <p>TOTS OS v7.1.0 • HR & PAYROLL</p>
            <div className="w-1 h-1 rounded-full bg-[#a9b897] animate-pulse" />
          </div>
          <div className="flex gap-6">
            <button className="hover:text-stone-900">Protocols</button>
            <button className="hover:text-stone-900">Privacy</button>
          </div>
        </footer>
      </div>

      <Modal id="leave" title="Absence" subtitle="Operational Capacity">
        <div className="space-y-6 py-4 text-left">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-stone-300 ml-2 tracking-widest">Commencement</label>
              <input type="date" className="w-full p-4 bg-stone-50 rounded-xl border border-stone-100 outline-none font-bold text-stone-700" />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-stone-300 ml-2 tracking-widest">Reactivation</label>
              <input type="date" className="w-full p-4 bg-stone-50 rounded-xl border border-stone-100 outline-none font-bold text-stone-700" />
            </div>
          </div>
          <button onClick={() => { notify("Protocol Initiated"); setActiveModal(null); }} 
            className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">
            Deploy Directive
          </button>
        </div>
      </Modal>

      <Modal id="payslip" title="Vault" subtitle="Encrypted Records">
        <div className="space-y-3 py-4">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <div key={month} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 hover:border-stone-900 transition-all cursor-pointer text-left">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-200"><ShieldCheck size={18} /></div>
                 <div>
                    <p className="text-base font-bold text-stone-800 tracking-tight">{month}</p>
                    <p className="text-[7px] font-black uppercase text-stone-300 tracking-widest italic">Verified</p>
                 </div>
               </div>
               <Download size={14} className="text-[#a9b897]" />
             </div>
           ))}
        </div>
      </Modal>

      <Modal id="payroll" title="Payroll" subtitle="Compensation Centre">
        <div className="space-y-4 py-4 text-left">
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100">
            <p className="text-sm font-bold text-stone-900">Payroll Overview</p>
            <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-2">Next payroll processing cycle pending.</p>
          </div>
          <button
            onClick={() => notify('Payroll Module Opened')}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all"
          >
            Process Payroll
          </button>
        </div>
      </Modal>

      <Modal id="payslips" title="Payslips" subtitle="Employee Records">
        <div className="space-y-3 py-4 text-left">
          {['May 2026', 'April 2026', 'March 2026'].map((month) => (
            <div
              key={month}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 hover:border-stone-900 transition-all"
            >
              <div>
                <p className="font-bold text-stone-900">{month}</p>
                <p className="text-[8px] uppercase tracking-widest text-stone-300">Payslip Available</p>
              </div>
              <Download size={16} className="text-[#a9b897]" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal id="appraisals" title="Appraisals" subtitle="Performance Review">
        <div className="space-y-4 py-4 text-left">
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100">
            <p className="font-bold text-stone-900">Annual Review</p>
            <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-2">No active appraisal scheduled.</p>
          </div>
          <button
            onClick={() => notify('Appraisal Scheduled')}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all"
          >
            Schedule Appraisal
          </button>
        </div>
      </Modal>

      <Modal id="holiday-requests" title="Holiday Requests" subtitle="Leave Management">
        <div className="space-y-4 py-4 text-left">
          <div className="space-y-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 ml-2">Leave Dates</label>
            <input
              type="date"
              className="w-full p-4 bg-stone-50 rounded-xl border border-stone-100 outline-none font-bold text-stone-700"
            />
          </div>
          <button
            onClick={() => { notify('Holiday Request Submitted'); setActiveModal(null); }}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all"
          >
            Submit Request
          </button>
        </div>
      </Modal>

      <Modal id="sick-pay" title="Sick Pay" subtitle="Support & Recovery">
        <div className="space-y-4 py-4 text-left">
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-100">
            <p className="font-bold text-stone-900">Sick Pay Status</p>
            <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-2">No active sick leave recorded.</p>
          </div>
          <button
            onClick={() => notify('Sick Pay Record Updated')}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all"
          >
            Update Record
          </button>
        </div>
      </Modal>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}