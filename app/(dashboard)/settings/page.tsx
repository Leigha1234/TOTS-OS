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
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

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

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) setProfile((prev: any) => ({ ...prev, ...p }));

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
    } catch (err) { 
      console.error("Init Error:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleGlobalSave = async () => {
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        next_of_kin: profile?.next_of_kin || "",
        email_signature: profile?.email_signature || "",
        avatar_url: profile?.avatar_url || ""
      }).eq("id", user?.id);
      
      if (teamId) {
        await supabase.from("settings").upsert({
          team_id: teamId,
          brand_color: brandColor,
          font_family: selectedFont,
          bank_info: bankInfo
        });
      }

      if (newPassword) {
        await supabase.auth.updateUser({ password: newPassword });
        setNewPassword("");
      }

      alert("Changes Synchronized.");
    } catch (err) {
      alert("Save failed. Please check your connection.");
    } finally { setSaving(false); }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSaving(true);
    try {
        const { error } = await supabase.from("team_members").insert({
            team_id: teamId,
            email: inviteEmail.toLowerCase().trim(),
            role: "member",
            permissions: selectedPermissions 
          });
          if (!error) {
            setInviteEmail("");
            init();
          }
    } catch (e) {
        console.error(e);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
      <Loader2 className="animate-spin text-[#a9b897]" size={40} />
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`} style={{ fontFamily: selectedFont }}>
      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-12 pb-40">
        
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Operational Node: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button onClick={handleGlobalSave} disabled={saving} className="flex items-center gap-4 bg-stone-900 text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />} Commit All
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-12">
            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative group w-32 h-32 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <UserCircle size={40} className="opacity-10" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Camera size={20} />
                    <input type="file" className="hidden" />
                  </label>
                </div>
                <input 
                  value={profile?.full_name || ""} 
                  onChange={e => setProfile({...profile, full_name: e.target.value})}
                  placeholder="Full Name" 
                  className="text-center font-serif italic text-2xl w-full bg-transparent outline-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl">
                  <Phone size={18} className="text-[#a9b897]" />
                  <input value={profile?.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl">
                  <HeartPulse size={18} className="text-red-400" />
                  <input value={profile?.next_of_kin || ""} onChange={e => setProfile({...profile, next_of_kin: e.target.value})} placeholder="Next of Kin" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl">
                  <Fingerprint size={18} className="text-stone-400" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="bg-transparent text-xs font-bold outline-none w-full" />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Design</h2>
              <div className="flex justify-between items-center">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer" />
                <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="p-3 bg-stone-50 rounded-xl text-[10px] font-black uppercase outline-none">
                    <option value="Inter">Modern</option>
                    <option value="serif">Classic</option>
                    <option value="monospace">Tech</option>
                </select>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            <section className="bg-white p-10 rounded-[4rem] border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40">The Hive</h2>
                <button onClick={() => router.push('/billing')} className="text-[9px] font-black bg-stone-900 text-[#a9b897] px-4 py-2 rounded-full uppercase tracking-widest">Add Seat £19.95</button>
              </div>

              <div className="space-y-8">
                <input 
                  placeholder="Invite email..." 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  className="w-full p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-base outline-none"
                />

                {inviteEmail.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-stone-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {APP_PAGES.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => setSelectedPermissions(prev => prev.includes(page.id) ? prev.filter(p => p !== page.id) : [...prev, page.id])}
                          className={`p-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${selectedPermissions.includes(page.id) ? 'border-[#a9b897] bg-[#a9b897]/5 text-stone-900' : 'border-stone-100 text-stone-300'}`}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleInvite} className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Provision Seat</button>
                  </div>
                )}
              </div>

              <div className="mt-12 space-y-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-[2rem] border border-stone-100">
                    <span className="text-sm font-bold">{member.email}</span>
                    <button onClick={() => supabase.from("team_members").delete().eq("id", member.id).then(() => init())} className="text-stone-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Signature</h2>
              <textarea 
                value={profile?.email_signature || ""}
                onChange={e => setProfile({...profile, email_signature: e.target.value})}
                placeholder="Regards, Management"
                className="w-full h-32 p-6 rounded-3xl border border-stone-100 bg-stone-50/50 text-sm outline-none resize-none"
              />
            </section>

            <section className="bg-stone-900 text-white p-10 rounded-[3.5rem] grid grid-cols-1 md:grid-cols-3 gap-6">
                 <input placeholder="Bank" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
                 <input placeholder="Acc No" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
                 <input placeholder="Sort" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs" />
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}