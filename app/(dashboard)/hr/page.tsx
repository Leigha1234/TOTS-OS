"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, Check, FileText, Mail, 
  AlertCircle, Loader2, Activity, Download, ChevronRight
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
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1); 

      if (fetchError) throw fetchError;
      if (data && data.length > 0) {
        setProfile(data[0]);
      } else {
        notify("Identity not found. Initializing record.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!profile.id) {
        setError("Write Denied: Profile ID missing.");
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
      notify("Workforce Identity Synchronized");
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

  // --- REUSABLE MODAL COMPONENT ---
  const Modal = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white w-full max-w-4xl rounded-[3.5rem] p-8 md:p-14 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 hover:bg-stone-50 rounded-full transition-all text-stone-400 hover:text-stone-900">
              <X size={20}/>
            </button>
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Personnel Module</p>
              <h3 className="text-4xl md:text-5xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 font-sans p-6 md:p-12 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Check size={16} className="text-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* --- HEADER BLOCK (Dashboard Inspired) --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-stone-400">
              <Fingerprint size={14} className="text-[#a9b897]" />
              <p className="font-black uppercase text-[10px] tracking-[0.4em]">Workforce Identity v5.2.2</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter">Human Resources</h1>
          </div>

          <nav className="flex items-center bg-[#c8d3b9] p-1.5 rounded-full shadow-inner">
            {['Payments', 'Reports', 'HR', 'Timesheets'].map((path) => (
              <button 
                key={path}
                onClick={() => path !== 'HR' && router.push(`/${path === 'Reports' ? 'finance-reports' : path.toLowerCase()}`)}
                className={`px-8 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-full ${
                  path === 'HR' ? "bg-white text-stone-900 shadow-lg scale-105" : "text-white hover:text-stone-800"
                }`}
              >
                {path}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center gap-4 text-red-600">
            <AlertCircle size={20} />
            <p className="text-[10px] font-black uppercase tracking-widest">Feed Error: {error}</p>
          </div>
        )}

        {/* --- GRID SYSTEM --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Form Card */}
          <section className="lg:col-span-2 bg-white border border-stone-200 p-10 md:p-14 rounded-[4rem] space-y-12 shadow-sm">
            <div className="flex justify-between items-center border-b border-stone-50 pb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Legal Identity</p>
                <h4 className="text-4xl md:text-5xl font-serif italic tracking-tighter truncate leading-none">
                  {profile.full_name || "New Entity"}
                </h4>
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-3 bg-stone-900 text-white px-8 py-5 rounded-3xl hover:bg-[#a9b897] transition-all shadow-xl active:scale-95"
              >
                <Save size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sync</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {[
                  { label: 'Full Name', key: 'full_name' },
                  { label: 'Professional Role', key: 'role' },
                  { label: 'Contact', key: 'phone' },
                  { label: 'Physical Address', key: 'address', full: true },
                ].map((field) => (
                  <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-3`}>
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-2">{field.label}</label>
                    <input 
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                        className="w-full p-6 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-900 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Stat Card */}
          <div className="space-y-10">
            <div className="bg-stone-900 rounded-[4rem] p-10 md:p-14 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[450px]">
              <div className="relative z-10 space-y-12">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Employment Summary</p>
                <div className="space-y-6">
                  <h2 className="text-8xl font-mono tracking-tighter text-[#a9b897] leading-none">28.0</h2>
                  <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.2em]">Holiday Remaining</p>
                  <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="bg-[#a9b897] h-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveModal('leave')} className="p-7 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all group">
                    <Calendar size={22} className="text-[#a9b897]" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Book Leave</span>
                  </button>
                  <button onClick={() => setActiveModal('payslip')} className="p-7 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-4 hover:bg-white/10 transition-all group">
                    <FileText size={22} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Archive</span>
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897]/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>

        {/* Banking Card */}
        <div className="bg-white rounded-[4rem] p-10 md:p-14 border border-stone-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="md:border-r border-stone-50 md:pr-12">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-stone-400 flex items-center gap-3">
                <Landmark size={14} className="text-[#a9b897]" /> Banking
              </h5>
              <p className="text-sm text-stone-400 font-medium leading-relaxed">Identity-verified banking endpoints for secure monthly compensation.</p>
           </div>
           <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { label: 'Bank Institution', key: 'bank_name' },
                  { label: 'Account Number', key: 'account_number' },
                  { label: 'Sort Code', key: 'sort_code' }
                ].map((bank) => (
                  <div key={bank.key} className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2 shadow-inner">
                    <p className="text-[8px] font-black uppercase text-stone-400">{bank.label}</p>
                    <input 
                      value={profile[bank.key] || ""}
                      onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                      className="w-full bg-transparent font-mono font-bold text-xs outline-none focus:text-[#a9b897]"
                    />
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal id="leave" title="Time-Off Request">
        <div className="space-y-10 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 tracking-widest">Start Date</label>
              <input type="date" className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-2 tracking-widest">End Date</label>
              <input type="date" className="w-full p-6 bg-stone-50 rounded-3xl border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner" />
            </div>
          </div>
          <button 
            onClick={() => { notify("Leave Request Dispatched"); setActiveModal(null); }} 
            className="w-full bg-stone-900 text-white py-8 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#a9b897] transition-all"
          >
            Submit Request
          </button>
        </div>
      </Modal>

      <Modal id="payslip" title="Archive">
        <div className="space-y-4 py-6">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <div key={month} className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 hover:border-stone-900 hover:bg-white transition-all cursor-pointer group">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-stone-900 transition-all">
                   <Download size={22} />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-stone-800">{month} Payslip</p>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest mt-1">1.2MB • PDF</p>
                 </div>
               </div>
               <span className="text-[9px] font-black uppercase text-[#a9b897] tracking-widest border border-[#a9b897]/30 px-6 py-3 rounded-full bg-[#a9b897]/5">Download</span>
             </div>
           ))}
        </div>
      </Modal>
    </div>
  );
}