"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  CreditCard, Users, Trash2, Lock, Check,
  Eye, EyeOff, UserPlus, ShieldCheck, ChevronRight,
  Camera, Mail, Phone, HeartPulse, Palette, Type,
  UserCircle, Fingerprint
} from "lucide-react";

const APP_PAGES = [
  { id: "dashboard", label: "Main Dashboard" },
  { id: "invoices", label: "Invoice Manager" },
  { id: "crm", label: "Client CRM" },
  { id: "banking", label: "Banking & Ledger" },
  { id: "projects", label: "Project Boards" },
  { id: "settings", label: "System Settings" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // PROFILE & IDENTITY
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    phone: "",
    avatar_url: "",
    next_of_kin: "",
    email_signature: ""
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // INVITE LOGIC
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // BRANDING & FINANCE
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) setProfile(p);

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        const [membersRes, settingsRes] = await Promise.all([
          supabase.from("team_members").select("*").eq("team_id", membership.team_id),
          supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle()
        ]);
        if (membersRes.data) setTeamMembers(membersRes.data);
        if (settingsRes.data) {
          setBrandColor(settingsRes.data.brand_color || "#a9b897");
          setSelectedFont(settingsRes.data.font_family || "Inter");
          setBankInfo(settingsRes.data.bank_info || { name: "", acc: "", sort: "" });
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile Table
      await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        next_of_kin: profile.next_of_kin,
        email_signature: profile.email_signature,
        avatar_url: profile.avatar_url
      }).eq("id", user.id);
      
      // 2. Update Team Settings Table
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          font_family: selectedFont,
          bank_info: bankInfo
        });
      }

      // 3. Password Update
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
        setNewPassword("");
      }

      alert("Node Synchronized: All changes committed.");
    } catch (err) {
      alert("Sync Error: Connection to database failed.");
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSaving(true);
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      email: inviteEmail.toLowerCase().trim(),
      role: "member",
      permissions: selectedPermissions 
    });
    if (!error) {
      setInviteEmail("");
      setSelectedPermissions(["dashboard"]);
      init();
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`} style={{ fontFamily: selectedFont }}>
      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        {/* TOP NAVIGATION BAR */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Operational Node: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm hover:bg-stone-50 transition-all">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleGlobalSave} 
              disabled={saving} 
              className="flex items-center gap-4 bg-stone-900 text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: IDENTITY & BRANDING */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* PROFILE CARD */}
            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="relative group w-32 h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden transition-all hover:border-[#a9b897]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={40} className="opacity-10" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Camera size={20} />
                    <span className="text-[8px] font-black uppercase mt-1">Update</span>
                    <input type="file" className="hidden" onChange={() => alert("Storage logic required for file upload")} />
                  </label>
                </div>
                <input 
                  value={profile.full_name || ""} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Legal Full Name" 
                  className="text-center font-serif italic text-2xl w-full bg-transparent outline-none placeholder:opacity-20"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100/50">
                  <Phone size={18} className="text-[#a9b897]" />
                  <input value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Primary Contact No." className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100/50">
                  <HeartPulse size={18} className="text-red-400" />
                  <input value={profile.next_of_kin || ""} onChange={e => setProfile({...profile, next_of_kin: e.target.value})} placeholder="Next of Kin / Emergency" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100/50">
                  <Fingerprint size={18} className="text-stone-400" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Reset Password" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
              </div>
            </section>

            {/* BRANDING CARD */}
            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3"><Palette size={16} className="text-[#a9b897]"/> Design System</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase opacity-40">Primary Branding</label>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-12 h-12 rounded-full border-none cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase opacity-40">System Typography</label>
                  <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none">
                    <option value="Inter">Modern Sans</option>
                    <option value="serif">Classic Serif</option>
                    <option value="monospace">Tech Mono</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: TEAM & SIGNATURE */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* TEAM MANAGEMENT SECTION */}
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-stone-900 rounded-3xl text-[#a9b897]">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 leading-none">The Hive</h2>
                    <p className="text-[9px] font-bold opacity-30 mt-1 uppercase tracking-widest">Team Deployment Manager</p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/billing')} 
                  className="bg-stone-50 border border-stone-200 text-stone-600 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all"
                >
                  Purchase Additional Seat £19.95
                </button>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <UserPlus className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:text-[#a9b897] group-focus-within:opacity-100 transition-all" size={20}/>
                  <input 
                    placeholder="Enter collaborator's email..." 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    className="w-full p-7 pl-16 rounded-[2.5rem] border border-stone-100 bg-stone-50/50 text-base outline-none focus:ring-4 ring-[#a9b897]/10 transition-all"
                  />
                </div>

                {/* PERMISSION MATRIX - SHOWS WHEN EMAIL ENTERED */}
                {inviteEmail.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8 pt-6 border-t border-stone-50">
                    <div className="flex items-center gap-3">
                       <ChevronRight size={14} className="text-[#a9b897]"/>
                       <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Define Clearance Levels</label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {APP_PAGES.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => {
                            setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])
                          }}
                          className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                            selectedPermissions.includes(page.id) 
                            ? 'border-[#a9b897] bg-[#a9b897]/5 text-stone-900 shadow-inner' 
                            : 'border-stone-100 bg-white text-stone-300 grayscale'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-tighter">{page.label}</span>
                          {selectedPermissions.includes(page.id) ? <Eye size={16} className="text-[#a9b897]" /> : <EyeOff size={16} />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleInvite} 
                      disabled={saving}
                      className="w-full py-7 bg-stone-900 text-[#a9b897] rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl"
                    >
                      {saving ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>}
                      Activate Provisioned Seat
                    </button>
                  </div>
                )}
              </div>

              {/* TEAM LIST */}
              <div className="mt-16 pt-12 border-t border-stone-50 space-y-6">
                <h3 className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em] mb-4">Active Deployments</h3>
                <div className="grid grid-cols-1 gap-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 group transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-white border border-stone-100 flex items-center justify-center text-[11px] font-black text-stone-400">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold tracking-tight">{member.email}</p>
                          <div className="flex gap-2 mt-2">
                            {member.permissions?.map((p: string) => (
                              <span key={p} className="text-[7px] bg-white border border-stone-200 px-2 py-0.5 rounded-md uppercase font-black opacity-50 tracking-tighter">{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={async () => { if(confirm("Terminate Access?")) { await supabase.from("team_members").delete().eq("id", member.id); init(); }}}
                        className="p-4 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* EMAIL SIGNATURE CARD */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Mail className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 leading-none">Automated Signature</h2>
              </div>
              <textarea 
                value={profile.email_signature || ""}
                onChange={e => setProfile({...profile, email_signature: e.target.value})}
                placeholder="-- Regards, The Management Team"
                className="w-full h-40 p-8 rounded-[2.5rem] border border-stone-100 bg-stone-50/50 text-sm outline-none focus:ring-4 ring-[#a9b897]/10 transition-all resize-none font-mono"
              />
            </section>

            {/* FINANCE MODULE */}
            <section className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-sm space-y-8">
               <div className="flex items-center gap-3 opacity-40">
                <Landmark size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-widest leading-none">Banking Distribution</h2>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Bank Identifier</label>
                   <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:bg-white/10" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Account Node</label>
                   <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:bg-white/10" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase opacity-40 tracking-widest">Routing / Sort</label>
                   <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xs outline-none focus:bg-white/10" />
                 </div>
               </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}