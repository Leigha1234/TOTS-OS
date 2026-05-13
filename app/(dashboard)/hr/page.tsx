"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Calendar, Landmark, Fingerprint, 
  X, FileText, Download,
  AlertCircle, Loader2, Activity, ChevronRight,
  ShieldCheck, Briefcase, Phone, MapPin, Zap, Cpu, Lock, Globe
} from "lucide-react";

/**
 * TOTS OS v6.2.1 - COMPACT PERSONNEL MODULE
 * REVISION: REDUCED SCALE | UPDATED NAV PATHS
 */

export default function HRPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notification, setNotification] = useState({ visible: false, msg: "" });

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Unauthorized"); return; }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (data) setProfile(data);
    } catch (err: any) {
      setError("Sync Failure.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!profile.id) return;
    try {
      setIsSaving(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
            full_name: profile.full_name,
            role: profile.role,
            phone: profile.phone,
            address: profile.address,
            bank_name: profile.bank_name,
            account_number: profile.account_number,
            sort_code: profile.sort_code
        })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      notify("Identity Synchronized");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
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
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xl z-[500] flex justify-end"
          onClick={() => setActiveModal(null)}>
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 40, stiffness: 300 }}
            className="bg-[#fcfbf9] h-full w-full max-w-lg p-10 md:p-14 shadow-2xl relative overflow-y-auto border-l border-stone-100"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 p-3 bg-white rounded-full hover:bg-stone-900 hover:text-white transition-all text-stone-400 shadow-sm">
              <X size={18} />
            </button>
            <div className="mb-10 space-y-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897]">{subtitle}</p>
              <h3 className="text-4xl font-serif italic tracking-tighter leading-none">{title}</h3>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-stone-900 font-sans selection:bg-[#a9b897] pb-12">
      
      <AnimatePresence>
        {notification.visible && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border border-white/5">
            <Zap size={12} className="text-[#a9b897] fill-[#a9b897]" />
            <p className="text-[8px] font-black uppercase tracking-widest">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-16">
        
        {/* --- COMPACT HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 text-[#a9b897] rounded-xl shadow-lg"><Fingerprint size={18} /></div>
              <div className="space-y-0.5">
                <p className="font-black uppercase text-[8px] tracking-widest text-stone-400">Personnel Directory</p>
                <p className="text-[7px] font-mono text-stone-400 tracking-widest uppercase">Identity Link: Active</p>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tighter leading-none">Human Resources</h1>
          </div>

          <nav className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200/50">
            {['Timesheets', 'Payments', 'Reports', 'HR'].map((path) => (
              <button key={path} onClick={() => path !== 'HR' && router.push(`/${path.toLowerCase()}`)}
                className={`px-6 py-2.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${path === 'HR' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}>
                {path}
              </button>
            ))}
          </nav>
        </header>

        {/* --- IDENTITY SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 bg-white border border-stone-100 p-8 md:p-12 rounded-[3rem] space-y-12 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-end border-b border-stone-50 pb-10 relative z-10 gap-6">
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#a9b897] italic">Verified Entity Node</p>
                <h4 className="text-5xl font-serif italic tracking-tighter leading-none">
                  {profile.full_name || "Registry Pending"}
                </h4>
              </div>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                {isSaving ? <Loader2 size={14} className="animate-spin text-[#a9b897]" /> : <Save size={14} className="text-[#a9b897]" />}
                <span className="text-[9px] font-black uppercase tracking-widest">{isSaving ? 'Syncing...' : 'Sync Records'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10 text-left">
              {[
                { label: 'Full Legal Name', key: 'full_name', icon: <Fingerprint size={12}/> },
                { label: 'Operational Role', key: 'role', icon: <Briefcase size={12}/> },
                { label: 'Secure Contact', key: 'phone', icon: <Phone size={12}/> },
                { label: 'Physical Address', key: 'address', full: true, icon: <MapPin size={12}/> },
              ].map((field) => (
                <div key={field.key} className={`${field.full ? 'md:col-span-2' : ''} space-y-3`}>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-[#a9b897]">{field.icon}</span>
                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">{field.label}</label>
                  </div>
                  <input value={profile[field.key] || ""} onChange={(e) => setProfile({...profile, [field.key]: e.target.value})}
                      className="w-full p-6 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-stone-900 focus:bg-white transition-all font-bold text-lg text-stone-800" />
                </div>
              ))}
            </div>
            <Activity size={200} className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-all" />
          </section>

          {/* --- RESOURCE LEDGER (RIGHT COLUMN) --- */}
          <div className="lg:col-span-4">
            <div className="bg-stone-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[500px] group">
              <div className="relative z-10 space-y-12 text-left">
                <div className="flex items-center gap-3 text-stone-500">
                  <Cpu size={14} />
                  <p className="text-[9px] font-black uppercase tracking-widest">Resource Ledger</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-8xl font-mono tracking-tighter text-[#a9b897] leading-none">28.0</h2>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest italic ml-2 mt-2">Holiday Credit</p>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5">
                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5 }} 
                      className="bg-[#a9b897] h-full rounded-full shadow-[0_0_15px_rgba(169,184,151,0.4)]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-6">
                  <button onClick={() => setActiveModal('leave')} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all text-left">
                    <div className="flex items-center gap-6">
                      <Calendar size={20} className="text-[#a9b897]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Deploy Absence</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-700" />
                  </button>
                  <button onClick={() => setActiveModal('payslip')} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all text-left">
                    <div className="flex items-center gap-6">
                      <FileText size={20} className="text-stone-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Document Vault</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BANKING (SHRUNKEN) --- */}
        <section className="bg-white rounded-[3rem] p-10 border border-stone-100 shadow-sm grid grid-cols-1 xl:grid-cols-12 gap-10 hover:border-stone-900 transition-all text-left">
           <div className="xl:col-span-4 xl:border-r border-stone-100 xl:pr-10 space-y-4">
              <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-[#a9b897] shadow-inner"><Landmark size={24} /></div>
              <div className="space-y-1">
                <h5 className="text-[12px] font-black uppercase tracking-widest text-stone-900">Financial Endpoint</h5>
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest italic leading-relaxed">Secured parameters for automated compensation.</p>
              </div>
           </div>
           
           <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { label: 'Institution', key: 'bank_name' },
                  { label: 'Account No.', key: 'account_number' },
                  { label: 'Sort Code', key: 'sort_code' }
                ].map((bank) => (
                  <div key={bank.key} className="p-8 bg-stone-50 rounded-3xl border border-stone-100 space-y-3 group hover:bg-white transition-all">
                    <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest">{bank.label}</p>
                    <input value={profile[bank.key] || ""} onChange={(e) => setProfile({...profile, [bank.key]: e.target.value})}
                      className="w-full bg-transparent font-mono font-bold text-lg outline-none text-stone-900" placeholder="XXXXXX" />
                  </div>
              ))}
           </div>
        </section>

        {/* --- COMPACT FOOTER --- */}
        <footer className="pt-12 border-t border-stone-100 flex justify-between items-center text-stone-300 text-[8px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <p>TOTS OS v6.2.1 • Personnel Module</p>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <Globe size={12} className="text-stone-200" />
          </div>
          <div className="flex gap-8">
            <button className="hover:text-stone-900">Identity Protocols</button>
            <button className="hover:text-stone-900">Network Access</button>
          </div>
        </footer>
      </div>

      {/* --- MODALS --- */}
      <Modal id="leave" title="Absence" subtitle="Operational Capacity">
        <div className="space-y-10 py-6 text-left">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-4 tracking-widest">Commencement</label>
              <input type="date" className="w-full p-6 bg-white rounded-2xl border border-stone-100 outline-none font-bold text-stone-700 shadow-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-stone-400 ml-4 tracking-widest">Reactivation</label>
              <input type="date" className="w-full p-6 bg-white rounded-2xl border border-stone-100 outline-none font-bold text-stone-700 shadow-sm" />
            </div>
          </div>
          <button onClick={() => { notify("Protocol Initiated"); setActiveModal(null); }} 
            className="w-full bg-stone-900 text-white py-8 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">
            Deploy Directive
          </button>
        </div>
      </Modal>

      <Modal id="payslip" title="Document Vault" subtitle="Encrypted Ledger">
        <div className="space-y-4 py-6">
           {['May 2026', 'April 2026', 'March 2026'].map((month) => (
             <div key={month} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-stone-100 hover:border-stone-900 transition-all cursor-pointer text-left">
               <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-stone-200 shadow-inner"><ShieldCheck size={20} /></div>
                 <div>
                    <p className="text-lg font-bold text-stone-800 tracking-tight">{month}</p>
                    <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest italic">Verified Record</p>
                 </div>
               </div>
               <Download size={14} className="text-[#a9b897]" />
             </div>
           ))}
        </div>
      </Modal>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }
      `}</style>
    </div>
  );
}