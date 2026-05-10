"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, Check, FileText, Mail, 
  AlertCircle, Loader2, Activity
} from "lucide-react";

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // --- DATABASE DATA STATE ---
  const [profile, setProfile] = useState<any>({
    id: null,
    full_name: "",
    role: "",
    address: "",
    company_details: "",
    bank_name: "",
    account_number: "",
    sort_code: "",
    phone: ""
  });

  useEffect(() => {
    setIsMounted(true);
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setIsLoading(true);
      setError(null);

      // FIX: Changed .single() to .limit(1) to avoid JSON Coercion error
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1); 

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setProfile(data[0]);
      } else {
        // Handle case where no profile exists yet
        notify("No profile found. Please initialize your record.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!profile.id) {
        setError("Cannot update: No profile ID found in database.");
        return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
            full_name: profile.full_name,
            role: profile.role,
            phone: profile.phone,
            address: profile.address,
            company_details: profile.company_details,
            bank_name: profile.bank_name,
            account_number: profile.account_number,
            sort_code: profile.sort_code
        })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      notify("Database synchronized successfully");
    } catch (err: any) {
      setError(err.message);
    }
  }

  const notify = (msg: string) => {
    setNotificationMsg(msg);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  };

  if (!isMounted) return null;

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
            className="bg-white w-full max-w-4xl rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 hover:bg-stone-100 rounded-full transition-all">
              <X size={20}/>
            </button>
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Personnel Module</p>
              <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter">{title}</h3>
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
        
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Workforce Identity v5.2.1</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-tight">Human Resources</h1>
          </div>

          <nav className="flex flex-wrap bg-white border border-stone-200 p-1.5 rounded-[2rem] shadow-sm">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'HR' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'HR' ? "bg-stone-900 text-white shadow-lg" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <section className="lg:col-span-2 bg-white border border-stone-200 p-8 md:p-12 rounded-[3.5rem] space-y-12 shadow-sm min-w-0">
            <div className="flex justify-between items-end border-b border-stone-50 pb-8 gap-4">
              <div className="space-y-2 min-w-0">
                <h4 className="text-3xl md:text-4xl font-serif italic tracking-tighter truncate">
                  Personnel Record
                </h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 truncate">
                  {profile.full_name || "Profile Loading..."}
                </p>
              </div>
              <button 
                onClick={handleSave}
                className="p-5 bg-stone-900 text-white rounded-2xl hover:bg-[#a9b897] transition-all active:scale-95 flex-shrink-0 shadow-lg"
              >
                <Save size={20} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#a9b897]" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'Legal Full Name', key: 'full_name' },
                  { label: 'Professional Role', key: 'role' },
                  { label: 'Contact Number', key: 'phone' },
                  { label: 'Physical Address', key: 'address', full: true },
                  { label: 'Company Registration Details', key: 'company_details', full: true },
                ].map((field) => (
                  <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-3`}>
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">{field.label}</label>
                    {field.full ? (
                      <textarea 
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                        className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#a9b897] transition-all font-semibold text-sm min-h-[100px] resize-none"
                      />
                    ) : (
                      <input 
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                        className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-[#a9b897] transition-all font-semibold text-sm" 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-10 border-t border-stone-50">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-stone-400 flex items-center gap-3">
                <Landmark size={14} className="text-[#a9b897]" /> Banking & Disbursements
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Bank Institution', key: 'bank_name' },
                  { label: 'Account Number', key: 'account_number' },
                  { label: 'Sort Code', key: 'sort_code' }
                ].map((bank) => (
                  <div key={bank.key} className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
                    <p className="text-[8px] font-black uppercase text-stone-400">{bank.label}</p>
                    <input 
                      value={profile[bank.key] || ""}
                      onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                      className="w-full bg-transparent font-mono font-bold text-xs outline-none focus:text-[#a9b897]"
                      placeholder="SET DATA"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-8">
            <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white space-y-10 shadow-xl overflow-hidden relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Employment Summary</p>
              <div className="space-y-6">
                <div>
                  <h2 className="text-5xl font-mono tracking-tighter text-[#a9b897]">28.0</h2>
                  <p className="text-[9px] font-black uppercase text-stone-400 mt-1">Holiday Balance</p>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#a9b897] h-full w-[65%]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveModal('leave')} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all">
                  <Calendar size={18} className="text-[#a9b897]" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Book Leave</span>
                </button>
                <button onClick={() => setActiveModal('payslip')} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all">
                  <FileText size={18} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Payslips</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] space-y-6 shadow-sm">
              <h6 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Activity size={14} /> System Tasks
              </h6>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl text-[9px] font-black uppercase hover:bg-stone-100 transition-all border border-stone-100">
                  Request P60 <Mail size={14} className="text-stone-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-2xl text-[9px] font-black uppercase hover:bg-stone-100 transition-all border border-stone-100">
                  Staff Handbook <FileText size={14} className="text-stone-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal id="leave" title="Time-Off Request">
        <div className="space-y-8 py-4">
          <p className="text-sm text-stone-500 leading-relaxed">Absence requests are synchronized with your department lead automatically.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2">Start Date</label>
              <input type="date" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-2">End Date</label>
              <input type="date" className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 outline-none" />
            </div>
          </div>
          <button onClick={() => { notify("Leave Request Logged"); setActiveModal(null); }} className="w-full bg-stone-900 text-white py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-[#a9b897] transition-all">Submit for Review</button>
        </div>
      </Modal>

      <Modal id="payslip" title="Compensation Archive">
        <div className="space-y-4 py-4">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <div key={month} className="flex items-center justify-between p-6 bg-stone-50 rounded-3xl border border-stone-100 hover:border-stone-300 transition-all cursor-pointer group">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-300 group-hover:text-stone-900 transition-colors">
                   <DownloadIcon size={18} />
                 </div>
                 <p className="text-sm font-bold">{month} Payslip</p>
               </div>
               <span className="text-[9px] font-black uppercase text-[#a9b897]">Download</span>
             </div>
           ))}
        </div>
      </Modal>
    </div>
  );
}

const DownloadIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);