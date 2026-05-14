"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { useSettings } from "@/app/context/SettingsContext";

const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") window.alert(message);
  },
  error: (message: string) => {
    if (typeof window !== "undefined") window.alert(message);
  },
};

import { 
  Save, Sun, Loader2, Users, Trash2, Check, Camera, Mail, 
  Palette, UserCircle, Fingerprint, Copy, LogOut, Zap, Sparkles,
  LayoutDashboard, Calendar, Megaphone, DollarSign,
  Briefcase, BarChart3, Globe, Lock, StickyNote, ArrowUpRight,
  Database, Share2, Moon, ShieldCheck, Cpu, HardDrive, 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_OPTIONS = [
  { id: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { id: "/clarity", label: "Clarity AI", icon: Sparkles },
  { id: "/calendar", label: "Calendar", icon: Calendar },
  { id: "/crm", label: "CRM", icon: Users },
  { id: "/notes", label: "Notes", icon: StickyNote },
  { id: "/campaigns", label: "Campaigns", icon: Megaphone },
  { id: "/payments", label: "Finance", icon: DollarSign },
  { id: "/projects", label: "Projects", icon: Briefcase },
  { id: "/reports", label: "Reports", icon: BarChart3 },
  { id: "/social", label: "Social", icon: Globe },
  { id: "/vault", label: "Vault", icon: Lock },
];

export default function CommandPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F6] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-stone-100 border-t-[#A3B18A] animate-spin" />
        <p className="font-serif italic text-stone-400">Restoring Command Protocols...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { refreshSettings } = useSettings(); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [profile, setProfile] = useState<any>({ full_name: "", phone: "", avatar_url: "" });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [mobileNav, setMobileNav] = useState<string[]>([]);

  const [brandColor, setBrandColor] = useState("#A3B18A"); // Default Sage
  const [secondaryColor, setSecondaryColor] = useState("#2C2C2C");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [logoUrl, setLogoUrl] = useState("");

  const inviteLink = useMemo(() => teamId ? `https://tots-os.co.uk/invite/${teamId}` : "", [teamId]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      setEmail(user.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setCurrentTier(p.tier?.toUpperCase() || "STANDARD");
        setMobileNav(p.mobile_nav_config || ["/dashboard", "/clarity", "/calendar"]);
        if (p.brand_color) setBrandColor(p.brand_color);
        if (p.secondary_color) setSecondaryColor(p.secondary_color);
      }

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const [membersRes, settingsRes] = await Promise.all([
          supabase.from("team_members").select("*").eq("team_id", membership.team_id),
          supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle()
        ]);
        if (membersRes.data) setTeamMembers(membersRes.data);
        if (settingsRes.data) {
          if (settingsRes.data.brand_color) setBrandColor(settingsRes.data.brand_color);
          setSecondaryColor(settingsRes.data.secondary_color || "#2C2C2C");
          setBankInfo(settingsRes.data.bank_info || { name: "", acc: "", sort: "" });
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleToggleNav = (id: string) => {
    setMobileNav(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from("profiles").update({ 
        full_name: profile.full_name, 
        tier: currentTier,
        brand_color: brandColor,
        secondary_color: secondaryColor,
        mobile_nav_config: mobileNav 
      }).eq("id", user.id);

      if (profileError) throw profileError;

      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId, brand_color: brandColor, secondary_color: secondaryColor,
          bank_info: bankInfo
        });
      }

      await refreshSettings();
      toast.success("Identity & Logic Synced");
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  if (loading) return null;

  return (
    <div className={`min-h-screen transition-colors duration-1000 selection:bg-[#A3B18A] selection:text-white ${isDarkMode ? 'bg-[#121212] text-stone-200' : 'bg-[#F9F8F6] text-[#2C2C2C]'}`}>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        :root { --brand-primary: ${brandColor}; --brand-secondary: ${secondaryColor}; }
        body { font-family: '${selectedFont}', sans-serif; }
      `}</style>

      <div className="max-w-[1400px] mx-auto p-8 md:p-16 lg:p-24 space-y-24">
        
        {/* REFINED HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-stone-100 pb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#A3B18A] shadow-[0_0_10px_rgba(163,177,138,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-stone-300">Operational Hub</span>
            </div>
            <h1 className="text-8xl md:text-9xl font-serif italic tracking-tighter leading-none text-stone-900">
              Command.
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-5 rounded-3xl border border-stone-100 bg-white/50 backdrop-blur-sm hover:bg-white transition-all shadow-sm group"
            >
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-stone-300 group-hover:text-[#A3B18A]" />}
            </button>
            
            <button 
              onClick={handleGlobalSave} 
              disabled={saving}
              className="flex-1 lg:flex-none flex items-center justify-center gap-5 px-14 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] text-white bg-stone-900 shadow-2xl hover:bg-[#A3B18A] transition-all duration-500 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Fingerprint size={18} />} 
              {saving ? "Syncing Logic" : "Commit Changes"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* LEFT COLUMN: IDENTITY & AESTHETIC */}
          <div className="lg:col-span-4 space-y-16">
            
            {/* PROFILE ARCHIVE */}
            <section className="space-y-10">
              <div className="flex flex-col items-center gap-10">
                <div className="relative group">
                  <div className="w-48 h-48 rounded-[4rem] bg-white border border-stone-100 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:rotate-3 shadow-xl shadow-stone-200/50">
                    {logoUrl ? (
                      <img src={logoUrl} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full bg-[#A3B18A]/5 flex items-center justify-center text-[#A3B18A]/20 italic font-serif text-6xl">L</div>
                    )}
                    <label className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-sm">
                      <Camera size={24} />
                      <span className="text-[9px] font-black uppercase tracking-widest mt-2">Update Visual</span>
                      <input type="file" className="hidden" />
                    </label>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl border border-stone-100 shadow-lg">
                     <ShieldCheck size={16} className="text-[#A3B18A]" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <input 
                    value={profile.full_name || ""} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})} 
                    className="text-center font-serif italic text-5xl w-full bg-transparent outline-none text-stone-900 placeholder-stone-200" 
                    placeholder="Subject Name" 
                  />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A3B18A]">{currentTier} LICENSE</p>
                </div>
              </div>

              <div className="space-y-4 pt-10 border-t border-stone-50">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Authorized Email</label>
                  <div className="flex items-center gap-4 p-6 bg-white border border-stone-100 rounded-3xl transition-all hover:shadow-sm">
                    <Mail size={16} className="text-[#A3B18A]" />
                    <input value={email} readOnly className="bg-transparent text-[11px] font-bold outline-none w-full text-stone-400 cursor-not-allowed" />
                  </div>
                </div>
                
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full p-6 rounded-3xl border border-stone-100 text-stone-400 hover:text-red-400 hover:bg-red-50 hover:border-red-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                  <LogOut size={14} /> Terminate Session
                </button>
              </div>
            </section>

            {/* AESTHETIC DNA */}
            <section className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-10">
              <div className="flex items-center gap-4">
                <Palette size={18} className="text-[#A3B18A]"/>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-900">Aesthetic DNA</h2>
              </div>
              
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-stone-800">Primary Tone</p>
                       <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{brandColor}</p>
                    </div>
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent" />
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-stone-800">Contrast Tone</p>
                       <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{secondaryColor}</p>
                    </div>
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-14 h-14 rounded-2xl cursor-pointer border-none bg-transparent" />
                 </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ARCHITECTURE & NETWORK */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* DATA MIGRATION CARD */}
            <section className="group p-10 lg:p-14 bg-white rounded-[4rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-700 flex flex-col md:flex-row justify-between items-center gap-12">
               <div className="space-y-4 text-center md:text-left">
                 <h2 className="text-5xl font-serif italic text-stone-900 tracking-tighter">Migration Hub.</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Ingest External Archives</p>
               </div>
               
               <button 
                 onClick={() => router.push('/import')}
                 className="w-full md:w-auto flex items-center gap-8 p-10 rounded-[3rem] bg-[#F9F8F6] border border-transparent hover:border-[#A3B18A] transition-all group/btn"
               >
                 <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-[#A3B18A] group-hover/btn:scale-110 transition-transform">
                   <Database size={24} />
                 </div>
                 <div className="pr-8 text-left">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 flex items-center gap-3">
                     Open Import <ArrowUpRight size={16} className="text-stone-200 group-hover/btn:text-[#A3B18A] transition-colors" />
                   </h4>
                   <p className="text-[9px] font-bold text-stone-400 mt-2 uppercase">CSV / JSON Transfer</p>
                 </div>
               </button>
            </section>

            {/* NEURAL NAVIGATION (MOBILE CONFIG) */}
            <section className="bg-white p-10 lg:p-16 rounded-[4.5rem] border border-stone-100 shadow-sm space-y-16">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-3">
                    <h2 className="text-5xl font-serif italic text-stone-900 tracking-tighter">Architecture.</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Mobile Hub Priority</p>
                  </div>
                  <div className="px-6 py-2.5 rounded-full bg-stone-50 border border-stone-100 text-[10px] font-black text-[#A3B18A] uppercase tracking-[0.2em]">
                    {mobileNav.length} / 3 Selected
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {NAV_OPTIONS.map((option) => {
                    const isSelected = mobileNav.includes(option.id);
                    const isDisabled = !isSelected && mobileNav.length >= 3;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleToggleNav(option.id)}
                        disabled={isDisabled}
                        className={`group relative flex flex-col items-center gap-6 p-10 rounded-[3rem] border transition-all duration-500 ${
                          isSelected 
                            ? 'bg-stone-900 text-white border-transparent shadow-2xl scale-[1.02]' 
                            : 'bg-stone-50/50 border-stone-50 text-stone-300 hover:bg-white hover:border-stone-100 hover:text-stone-600'
                        } ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100'}`}
                      >
                        <option.icon size={28} strokeWidth={1.2} className={isSelected ? "text-[#A3B18A]" : "group-hover:text-[#A3B18A] transition-colors"} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center leading-tight">{option.label}</span>
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-[#A3B18A]">
                            <Check size={14}/>
                          </div>
                        )}
                      </button>
                    );
                  })}
               </div>
            </section>

            {/* THE NETWORK (TEAM) */}
            <section className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                 <div className="space-y-3">
                   <h2 className="text-5xl font-serif italic text-stone-900 tracking-tighter">The Network.</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300">Collaborative Nodes</p>
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => router.push('/team')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-5 rounded-[2rem] border border-stone-100 bg-white font-black text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-all shadow-sm"
                    >
                      <Users size={16} /> Manage All
                    </button>
                    <button 
                      onClick={() => {navigator.clipboard.writeText(inviteLink); toast.success("Invite Link Copied");}} 
                      className="p-5 bg-white border border-stone-100 rounded-[2rem] shadow-sm hover:text-[#A3B18A] transition-all"
                    >
                       <Share2 size={18} />
                    </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Invite New Node</p>
                    <div className="space-y-4">
                      <input 
                        placeholder="Email Address..." 
                        value={inviteEmail} 
                        onChange={e => setInviteEmail(e.target.value)} 
                        className="w-full p-6 rounded-2xl bg-[#F9F8F6] border border-transparent text-[11px] font-bold outline-none focus:border-[#A3B18A] transition-all" 
                      />
                      <button className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#A3B18A] transition-colors shadow-lg shadow-stone-200">
                        Dispatch Invite
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     {teamMembers.slice(0, 3).map((m, i) => (
                       <div key={m.id || i} className="flex justify-between items-center p-6 bg-white rounded-[2rem] border border-stone-50 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-[10px] font-bold text-stone-400 group-hover:bg-[#A3B18A]/10 group-hover:text-[#A3B18A] transition-all uppercase italic">
                                {m.email?.charAt(0) || "U"}
                             </div>
                             <span className="text-[11px] font-bold text-stone-600">{m.email}</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[#A3B18A] opacity-30 group-hover:opacity-100 transition-opacity" />
                       </div>
                     ))}
                  </div>
               </div>
            </section>

            {/* LEDGER PROTOCOL (FINANCE) */}
            <section className="bg-stone-900 p-12 lg:p-20 rounded-[5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Cpu size={300} />
               </div>
               
               <div className="relative z-10 space-y-16">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <h2 className="text-5xl font-serif italic text-[#A3B18A] tracking-tighter">Ledger.</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Payout Architecture</p>
                    </div>
                    <Lock size={32} className="text-[#A3B18A]/30" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                       { key: 'name', label: 'Bank Institution', icon: <Globe size={14}/> },
                       { key: 'acc', label: 'Account Identity', icon: <HardDrive size={14}/> },
                       { key: 'sort', label: 'Routing Key', icon: <Zap size={14}/> }
                     ].map((field) => (
                       <div key={field.key} className="space-y-4">
                         <div className="flex items-center gap-3 ml-2 opacity-30 uppercase tracking-[0.2em] text-[9px] font-black">
                           {field.icon} {field.label}
                         </div>
                         <input 
                           value={(bankInfo as any)[field.key]} 
                           onChange={e => setBankInfo({...bankInfo, [field.key]: e.target.value})} 
                           className="w-full bg-white/5 border border-white/5 p-6 rounded-3xl text-[11px] font-mono outline-none focus:border-[#A3B18A] focus:bg-white/10 transition-all" 
                           placeholder="Enter Data..." 
                         />
                       </div>
                     ))}
                  </div>
               </div>
            </section>

          </div>
        </div>
      </div>
      
      {/* MINIMAL UTILITY FOOTER */}
      <footer className="max-w-[1400px] mx-auto px-16 pb-16 pt-8 flex flex-col sm:flex-row justify-between items-center border-t border-stone-50 gap-6">
         <div className="flex items-center gap-8">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">TOTS OS v4.2</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300 hover:text-stone-900 cursor-pointer transition-colors">Privacy Shield</span>
         </div>
         <p className="text-[10px] font-serif italic text-stone-400">Leigha D-C. — Neural Command Interface</p>
      </footer>
    </div>
  );
}