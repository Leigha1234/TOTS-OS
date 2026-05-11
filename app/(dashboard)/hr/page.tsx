"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, Check, FileText, Mail, 
  AlertCircle, Loader2, Activity, Download, ChevronRight,
  ShieldCheck, Briefcase, Phone, MapPin, Zap
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

  // --- MODAL WRAPPER ---
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
            className="bg-white w-full max-w-4xl rounded-[4rem] p-10 md:p-14 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} className="absolute top-10 right-10 p-3 hover:bg-stone-50 rounded-full transition-all text-stone-400">
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
      
      {/* --- NOTIFICATION --- */}
      <AnimatePresence>
        {isNotificationVisible && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-stone-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-4">
            <Zap size={14} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* --- HEADER --- */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* PRIMARY IDENTITY FORM */}
          <section className="lg:col-span-2 bg-white border border-stone-100 p-10 md:p-14 rounded-[4rem] space-y-12 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center border-b border-stone-50 pb-10 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Legal Entity Record</p>
                <h4 className="text-4xl md:text-5xl font-serif italic tracking-tighter truncate leading-none">
                  {profile.full_name || "Unidentified Node"}
                </h4>
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] hover:bg-[#a9b897] transition-all shadow-xl active:scale-95 group/btn"
              >
                <Save size={18} className="group-hover/btn:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sync Profile</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-24"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
                {[
                  { label: 'Full Name', key: 'full_name', icon: <Fingerprint size={12}/> },
                  { label: 'Professional Role', key: 'role', icon: <Briefcase size={12}/> },
                  { label: 'Contact', key: 'phone', icon: <Phone size={12}/> },
                  { label: 'Physical Address', key: 'address', full: true, icon: <MapPin size={12}/> },
                ].map((field) => (
                  <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-4`}>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-stone-300">{field.icon}</span>
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">{field.label}</label>
                    </div>
                    <input 
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                        className="w-full p-6 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <Activity size={200} />
            </div>
          </section>

          {/* LEAVE & ARCHIVE PANEL */}
          <div className="space-y-10">
            <div className="bg-stone-900 rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[500px]">
              <div className="relative z-10 space-y-12">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Resource Allocation</p>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-8xl font-mono tracking-tighter text-[#a9b897] leading-none">28.0</h2>
                    <p className="text-[11px] font-black uppercase text-stone-400 tracking-[0.3em]">Holiday Credit Remaining</p>
                  </div>
                  <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, ease: "circOut" }} className="bg-[#a9b897] h-full shadow-[0_0_20px_rgba(169,184,151,0.5)]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => setActiveModal('leave')} className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all group active:scale-95">
                    <div className="flex items-center gap-6">
                      <Calendar size={22} className="text-[#a9b897]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Book Time-Off</span>
                    </div>
                    <ChevronRight size={14} className="text-stone-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setActiveModal('payslip')} className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between hover:bg-white/10 transition-all group active:scale-95">
                    <div className="flex items-center gap-6">
                      <FileText size={22} className="text-stone-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Document Vault</span>
                    </div>
                    <ChevronRight size={14} className="text-stone-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#a9b897]/5 rounded-full blur-[100px]" />
            </div>
          </div>
        </div>

        {/* BANKING MODULE */}
        <div className="bg-white rounded-[4rem] p-10 md:p-14 border border-stone-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-12 hover:border-stone-200 transition-all">
           <div className="md:border-r border-stone-50 md:pr-12 space-y-4">
              <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#a9b897]">
                <Landmark size={20} />
              </div>
              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900">Compensation Routing</h5>
              <p className="text-[11px] text-stone-400 font-medium leading-relaxed uppercase tracking-wider">Identity-verified banking endpoints for secure monthly payouts.</p>
           </div>
           <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  { label: 'Bank Institution', key: 'bank_name' },
                  { label: 'Account Number', key: 'account_number' },
                  { label: 'Sort Code', key: 'sort_code' }
                ].map((bank) => (
                  <div key={bank.key} className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 space-y-3 shadow-inner group hover:bg-white hover:border-stone-900 transition-all">
                    <p className="text-[9px] font-black uppercase text-stone-400 group-hover:text-[#a9b897] transition-colors">{bank.label}</p>
                    <input 
                      value={profile[bank.key] || ""}
                      onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                      className="w-full bg-transparent font-mono font-bold text-sm outline-none text-stone-900"
                    />
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal id="leave" title="Absence Management">
        <div className="space-y-10 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Departure Date</label>
              <input type="date" className="w-full p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Return Date</label>
              <input type="date" className="w-full p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner" />
            </div>
          </div>
          <button 
            onClick={() => { notify("Absence Request Dispatched"); setActiveModal(null); }} 
            className="w-full bg-stone-900 text-white py-10 rounded-[3rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#a9b897] transition-all flex items-center justify-center gap-4 group"
          >
            Submit Request <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </Modal>

      <Modal id="payslip" title="Document Vault">
        <div className="space-y-6 py-6">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <div key={month} className="flex items-center justify-between p-10 bg-stone-50 rounded-[3rem] border border-stone-100 hover:border-stone-900 hover:bg-white transition-all cursor-pointer group shadow-sm">
               <div className="flex items-center gap-8">
                 <div className="w-16 h-16 bg-white border border-stone-100 rounded-[1.5rem] flex items-center justify-center text-stone-300 group-hover:text-[#a9b897] transition-all shadow-inner">
                   <ShieldCheck size={28} />
                 </div>
                 <div>
                    <p className="text-base font-bold text-stone-800 tracking-tight">{month} Compensation Statement</p>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.2em] mt-1 italic">Verified Personnel File • 1.4MB PDF</p>
                 </div>
               </div>
               <button className="flex items-center gap-3 text-[9px] font-black uppercase text-[#a9b897] tracking-widest border border-[#a9b897]/30 px-8 py-4 rounded-full bg-[#a9b897]/5 hover:bg-[#a9b897] hover:text-white transition-all shadow-sm">
                 <Download size={14} /> Download
               </button>
             </div>
           ))}
        </div>
      </Modal>
    </div>
  );
}