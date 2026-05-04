"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  CreditCard, Users, Trash2, Lock, Check,
  Eye, EyeOff, UserPlus, ShieldCheck, ChevronRight,
  Camera, Mail, Phone, HeartPulse, Palette, Type
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
  
  // DATA STATES
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
  
  // TEAM/INVITE STATES
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // BRANDING & FINANCE STATES
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
      // Update Profile (Avatar, Contact, Next of Kin, Signature)
      await supabase.from("profiles").update(profile).eq("id", user.id);
      
      // Update Team Settings (Branding, Bank Info)
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          font_family: selectedFont,
          bank_info: bankInfo
        });
      }

      // Update Password if field is not empty
      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
        setNewPassword("");
      }

      alert("Node Synchronized Successfully.");
    } catch (err) {
      alert("Sync Failed.");
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    // This should redirect to your checkout or trigger your stripe function
    // For now, it adds the member to the DB.
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
      init();
    } else {
      alert(error.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`} style={{ fontFamily: selectedFont }}>
      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">User Identity: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button onClick={handleGlobalSave} disabled={saving} className="flex items-center gap-4 bg-stone-900 text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: PERSONAL & BRANDING */}
          <div className="lg:col-span-4 space-y-8">
            {/* AVATAR & CONTACT */}
            <section className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative group cursor-pointer w-24 h-24 rounded-full bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <Camera size={24} className="opacity-20" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase">Upload</div>
                </div>
                <input 
                  value={profile.full_name} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Full Name" 
                  className="text-center font-bold text-lg w-full bg-transparent outline-none border-b border-transparent focus:border-[#a9b897]"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl">
                  <Phone size={16} className="opacity-30" />
                  <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone Number" className="bg-transparent text-xs outline-none w-full" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl">
                  <HeartPulse size={16} className="opacity-30" />
                  <input value={profile.next_of_kin} onChange={e => setProfile({...profile, next_of_kin: e.target.value})} placeholder="Next of Kin Details" className="bg-transparent text-xs outline-none w-full" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl">
                  <Lock size={16} className="opacity-30" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-xs outline-none w-full" />
                </div>
              </div>
            </section>

            {/* BRANDING */}
            <section className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Palette size={14}/> Design Language</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase opacity-40">Primary Hue</label>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-full h-12 rounded-xl cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase opacity-40">Typography</label>
                  <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full h-12 bg-stone-50 rounded-xl px-2 text-[10px] font-bold">
                    <option value="Inter">Modern (Inter)</option>
                    <option value="serif">Classic (Serif)</option>
                    <option value="monospace">Technical (Mono)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: TEAM & SIGNATURE */}
          <div className="lg:col-span-8 space-y-8">
            {/* TEAM INVITE (The Logic from image_66dd83.png) */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Users className="text-[#a9b897]" size={24} />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">The Hive</h2>
                </div>
                <button onClick={() => router.push('/billing')} className="text-[9px] font-black bg-stone-900 text-[#a9b897] px-4 py-2 rounded-full uppercase tracking-widest hover:bg-black transition-colors">Add Additional Seat £19.95</button>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20" size={20}/>
                  <input 
                    placeholder="teammate@company.com" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    className="w-full p-6 pl-14 rounded-3xl border border-stone-100 bg-stone-50/50 text-sm outline-none focus:ring-4 ring-[#a9b897]/10 transition-all"
                  />
                </div>

                {inviteEmail.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-4 space-y-6 pt-6 border-t border-stone-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {APP_PAGES.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => {
                            setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== pageId) : [...prev, page.id])
                          }}
                          className={`flex items-center justify-between p-4 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                            selectedPermissions.includes(page.id) ? 'border-[#a9b897] bg-[#a9b897]/5 text-stone-900' : 'border-stone-100 text-stone-300'
                          }`}
                        >
                          {page.label}
                          {selectedPermissions.includes(page.id) ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleInvite} className="w-full py-5 bg-stone-900 text-[#a9b897] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Provision Seat Access</button>
                  </div>
                )}
              </div>
            </section>

            {/* EMAIL SIGNATURE */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Mail className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Email Signature</h2>
              </div>
              <textarea 
                value={profile.email_signature}
                onChange={e => setProfile({...profile, email_signature: e.target.value})}
                placeholder="-- Regards, Management"
                className="w-full h-32 p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-sm outline-none focus:ring-4 ring-[#a9b897]/10 transition-all resize-none"
              />
            </section>

            {/* BANKING */}
            <section className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="text-[8px] font-black uppercase opacity-40">Bank Name</label>
                 <input value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
               </div>
               <div className="space-y-2">
                 <label className="text-[8px] font-black uppercase opacity-40">Account Number</label>
                 <input value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
               </div>
               <div className="space-y-2">
                 <label className="text-[8px] font-black uppercase opacity-40">Sort Code</label>
                 <input value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
               </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}