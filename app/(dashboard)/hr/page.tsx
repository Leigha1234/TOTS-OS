"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, Check, FileText, Mail, 
  AlertCircle, Loader2, Activity, Download, ChevronRight,
  ShieldCheck, Briefcase, Phone, MapPin, Zap, Cpu, Lock, Globe
} from "lucide-react";

/**
 * TOTS OS v6.2 - HUMAN RESOURCES NODE
 * WORKFORCE IDENTITY & OPERATIONAL ACCESS
 */

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- UI STATE ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notification, setNotification] = useState({ visible: false, msg: "" });

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
        notify("Identity not found. Initializing node.");
      }
    } catch (err: any) {
      setError("Network Pulse Failure: Unable to sync identity records.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!profile.id) {
        setError("Write Denied: Secure ID missing.");
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
    setNotification({ visible: true, msg });
    setTimeout(() => setNotification({ visible: false, msg: "" }), 3000);
  };

  if (!isMounted) return null;

  // --- TOTS MODAL WRAPPER ---
  const Modal = ({ id, title, subtitle, children }: { id: string, title: string, subtitle: string, children: React.ReactNode }) => (
    <AnimatePresence>
      {activeModal === id && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[500] flex justify-end"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 250 }}
            className="bg-white h-full w-full max-w-2xl p-12 md:p-20 shadow-2xl relative overflow-y-auto border-l border-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveModal(null)} 
              className="absolute top-12 right-12 p-5 bg-stone-50 rounded-full hover:bg-stone-900 hover:text-white transition-all text-stone-400 group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="mb-16 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] italic">{subtitle}</p>
              <h3 className="text-6xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] selection:text-white overflow-x-hidden">
      
      {/* --- NOTIFICATION HUD --- */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 50, opacity: 0 }} 
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[600] bg-stone-900 text-white px-12 py-6 rounded-full shadow-2xl flex items-center gap-5 border border-white/10"
          >
            <Zap size={16} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-6 py-12 md:p-20 space-y-24">
        
        {/* --- DYNAMIC HEADER --- */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-5 bg-stone-900 text-[#a9b897] rounded-[1.5rem] shadow-2xl"><Fingerprint size={28} /></div>
              <div className="space-y-1">
                <p className="font-black uppercase text-[10px] tracking-[0.5em] text-stone-400">Personnel Directory</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
                  <p className="text-[9px] font-mono text-stone-400 tracking-widest uppercase">Identity Link: Active</p>
                </div>
              </div>
            </div>
            <h1 className="text-8xl md:text-[10rem] font-serif italic tracking-tighter leading-[0.85]">Human Resources</h1>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex items-center bg-stone-100 p-2 rounded-[2.5rem]">
              {['Dashboard', 'Payments', 'Reports', 'HR', 'Network'].map((path) => (
                <button 
                  key={path}
                  onClick={() => path !== 'HR' && router.push(`/${path === 'Dashboard' ? '' : path.toLowerCase()}`)}
                  className={`px-10 py-5 text-[10px] font-black uppercase tracking-widest transition-all rounded-[2rem] ${
                    path === 'HR' ? "bg-white text-stone-900 shadow-xl" : "text-stone-400 hover:text-stone-900"
                  }`}
                >
                  {path}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-100 p-10 rounded-[3rem] flex items-center gap-6 text-red-600">
            <AlertCircle size={24} />
            <p className="text-[11px] font-black uppercase tracking-[0.4em]">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* PRIMARY PROFILE CARD */}
          <section className="lg:col-span-8 bg-white border border-stone-100 p-12 md:p-20 rounded-[5rem] space-y-16 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-stone-50 pb-16 relative z-10 gap-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897] italic">Verified Entity Node</p>
                <h4 className="text-7xl md:text-8xl font-serif italic tracking-tighter leading-none">
                  {profile.full_name || "New Registry"}
                </h4>
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-5 bg-stone-900 text-white px-12 py-7 rounded-[2.5rem] hover:bg-stone-800 transition-all shadow-2xl active:scale-95 group/btn"
              >
                <Save size={22} className="group-hover/btn:scale-110 transition-transform duration-300 text-[#a9b897]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Sync Records</span>
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin text-[#a9b897]" size={48} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 relative z-10">
                {[
                  { label: 'Full Legal Name', key: 'full_name', icon: <Fingerprint size={16}/> },
                  { label: 'Operational Role', key: 'role', icon: <Briefcase size={16}/> },
                  { label: 'Secure Contact', key: 'phone', icon: <Phone size={16}/> },
                  { label: 'Registered Physical Address', key: 'address', full: true, icon: <MapPin size={16}/> },
                ].map((field) => (
                  <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-6`}>
                    <div className="flex items-center gap-4 ml-8">
                      <span className="text-[#a9b897]">{field.icon}</span>
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">{field.label}</label>
                    </div>
                    <input 
                        value={profile[field.key] || ""}
                        onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                        className="w-full p-10 bg-stone-50 border border-stone-100 rounded-[3rem] outline-none focus:border-stone-900 focus:bg-white transition-all font-bold text-xl shadow-inner text-stone-800" 
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="absolute top-0 right-0 p-24 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
              <Activity size={400} />
            </div>
          </section>

          {/* RIGHT SIDE PANEL: STATS & MODAL TRIGGERS */}
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-stone-900 rounded-[5rem] p-14 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[600px] group">
              <div className="relative z-10 space-y-16">
                <div className="flex items-center gap-4 text-stone-500">
                  <Cpu size={18} />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em]">Resource Ledger</p>
                </div>
                
                <div className="space-y-10">
                  <div className="space-y-4">
                    <h2 className="text-[10rem] font-mono tracking-tighter text-[#a9b897] leading-none">28.0</h2>
                    <p className="text-[12px] font-black uppercase text-stone-400 tracking-[0.4em] italic ml-4">Holiday Credit Available</p>
                  </div>
                  <div className="w-full bg-white/5 h-5 rounded-full overflow-hidden border border-white/5 shadow-inner p-1">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: '65%' }} 
                      transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }} 
                      className="bg-[#a9b897] h-full rounded-full shadow-[0_0_30px_rgba(169,184,151,0.5)]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-10">
                  <button onClick={() => setActiveModal('leave')} className="w-full p-12 bg-white/5 border border-white/10 rounded-[3.5rem] flex items-center justify-between hover:bg-white/10 transition-all group/btn active:scale-95">
                    <div className="flex items-center gap-8">
                      <Calendar size={28} className="text-[#a9b897]" />
                      <span className="text-[12px] font-black uppercase tracking-[0.3em]">Deploy Absence</span>
                    </div>
                    <ChevronRight size={20} className="text-stone-700 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={() => setActiveModal('payslip')} className="w-full p-12 bg-white/5 border border-white/10 rounded-[3.5rem] flex items-center justify-between hover:bg-white/10 transition-all group/btn active:scale-95">
                    <div className="flex items-center gap-8">
                      <FileText size={28} className="text-stone-500" />
                      <span className="text-[12px] font-black uppercase tracking-[0.3em]">Document Vault</span>
                    </div>
                    <ChevronRight size={20} className="text-stone-700 group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#a9b897]/5 rounded-full blur-[120px] group-hover:bg-[#a9b897]/10 transition-all duration-1000" />
            </div>
          </div>
        </div>

        {/* SECURE BANKING MODULE */}
        <section className="bg-white rounded-[5rem] p-16 md:p-24 border border-stone-100 shadow-sm grid grid-cols-1 xl:grid-cols-12 gap-20 hover:border-stone-200 transition-all duration-700">
           <div className="xl:col-span-4 xl:border-r border-stone-100 xl:pr-20 space-y-8">
              <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center text-[#a9b897] shadow-inner">
                <Landmark size={36} />
              </div>
              <div className="space-y-4">
                <h5 className="text-[16px] font-black uppercase tracking-[0.4em] text-stone-900">Financial Endpoint</h5>
                <p className="text-[12px] text-stone-400 font-bold leading-relaxed uppercase tracking-[0.3em] italic">
                  Secured banking parameters for automated compensation routing nodes.
                </p>
              </div>
           </div>
           
           <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                  { label: 'Banking Institution', key: 'bank_name' },
                  { label: 'Account Identifier', key: 'account_number' },
                  { label: 'Routing Sort Code', key: 'sort_code' }
                ].map((bank) => (
                  <div key={bank.key} className="p-12 bg-stone-50 rounded-[3.5rem] border border-stone-100 space-y-6 shadow-inner group hover:bg-white hover:border-stone-900 transition-all duration-500">
                    <p className="text-[11px] font-black uppercase text-stone-400 group-hover:text-[#a9b897] transition-colors tracking-[0.4em] italic">{bank.label}</p>
                    <input 
                      value={profile[bank.key] || ""}
                      onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                      className="w-full bg-transparent font-mono font-bold text-xl outline-none text-stone-900 tracking-tight"
                      placeholder="UNASSIGNED"
                    />
                  </div>
              ))}
           </div>
        </section>

        {/* --- GLOBAL FOOTER --- */}
        <footer className="pt-20 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-12 text-stone-300 pb-12">
          <div className="flex items-center gap-8">
            <p className="text-[11px] font-black uppercase tracking-[0.5em]">TOTS OS v6.2.0 • Personnel Module</p>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <Globe size={14} className="text-stone-200" />
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest">
            <button className="hover:text-stone-900 transition-all">Identity Protocols</button>
            <button className="hover:text-stone-900 transition-all">Network Access</button>
            <button className="hover:text-stone-900 transition-all">Encrypted Archive</button>
          </div>
        </footer>
      </div>

      {/* --- POPUP MODALS --- */}
      <Modal id="leave" title="Absence Directive" subtitle="Operational Capacity Adjustment">
        <div className="space-y-16 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <label className="text-[12px] font-black uppercase text-stone-400 ml-10 tracking-[0.4em]">Commencement Date</label>
              <input type="date" className="w-full p-10 bg-stone-50 rounded-[3rem] border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner text-stone-700" />
            </div>
            <div className="space-y-6">
              <label className="text-[12px] font-black uppercase text-stone-400 ml-10 tracking-[0.4em]">Reactivation Date</label>
              <input type="date" className="w-full p-10 bg-stone-50 rounded-[3rem] border border-stone-100 outline-none focus:border-stone-900 focus:bg-white font-bold transition-all shadow-inner text-stone-700" />
            </div>
          </div>
          
          <div className="p-10 border border-[#a9b897]/20 bg-[#a9b897]/5 rounded-[3rem] flex items-start gap-8">
             <AlertCircle size={24} className="text-[#a9b897] mt-1 shrink-0" />
             <p className="text-[11px] font-black uppercase text-stone-500 tracking-[0.3em] leading-loose">
               Directive Note: All absence requests are evaluated against real-time operational throughput. Primary node managers are automatically notified of this status update request.
             </p>
          </div>
          
          <button 
            onClick={() => { notify("Absence Protocol Initiated"); setActiveModal(null); }} 
            className="w-full bg-stone-900 text-white py-12 rounded-[4rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#a9b897] transition-all flex items-center justify-center gap-6 group"
          >
            Deploy Directive <ChevronRight size={22} className="group-hover:translate-x-3 transition-transform" />
          </button>
        </div>
      </Modal>

      <Modal id="payslip" title="Document Vault" subtitle="Encrypted Compensation Ledger">
        <div className="space-y-8 py-10">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <motion.div 
               key={month} 
               whileHover={{ x: 10 }}
               className="flex flex-col lg:flex-row items-center justify-between p-12 bg-stone-50 rounded-[4rem] border border-stone-100 hover:border-stone-900 hover:bg-white transition-all cursor-pointer group shadow-sm"
             >
               <div className="flex items-center gap-10">
                 <div className="w-24 h-24 bg-white border border-stone-100 rounded-[2.5rem] flex items-center justify-center text-stone-200 group-hover:text-[#a9b897] transition-all shadow-inner">
                   <ShieldCheck size={40} />
                 </div>
                 <div className="space-y-3 text-center lg:text-left">
                    <p className="text-3xl font-bold text-stone-800 tracking-tighter group-hover:text-stone-900 transition-colors">{month} Record</p>
                    <div className="flex items-center gap-3">
                      <Lock size={12} className="text-stone-400" />
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] italic">Verified Ledger Object • PDF</p>
                    </div>
                 </div>
               </div>
               <button className="flex items-center gap-5 text-[11px] font-black uppercase text-[#a9b897] tracking-[0.3em] border border-[#a9b897]/30 px-12 py-6 rounded-full bg-[#a9b897]/5 hover:bg-[#a9b897] hover:text-white transition-all shadow-sm mt-10 lg:mt-0">
                 <Download size={18} /> Secure Access
               </button>
             </motion.div>
           ))}
        </div>
      </Modal>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}