"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  CreditCard, Users, Trash2, ExternalLink, Palette, Lock, Check,
  Eye, EyeOff, ChevronRight, UserPlus
} from "lucide-react";

// 1. Define the pages that can be toggled
const APP_PAGES = [
  { id: "dashboard", label: "Dashboard" },
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
  const [profile, setProfile] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // BRANDING & FINANCE
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [isDefaultBank, setIsDefaultBank] = useState(true);
  const [newPassword, setNewPassword] = useState("");

  // INVITE LOGIC STATES
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);

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
          setIsDefaultBank(settingsRes.data.is_default_bank ?? true);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const togglePermission = (pageId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return alert("Please enter an email.");
    setSaving(true);
    
    // This inserts the new member with the specific array of allowed pages
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      email: inviteEmail.toLowerCase().trim(),
      role: "member",
      permissions: selectedPermissions 
    });

    if (error) {
      alert("Invite failed: " + error.message);
    } else {
      alert(`Access granted to ${inviteEmail}.`);
      setInviteEmail("");
      setSelectedPermissions(["dashboard"]);
      init(); // Refresh the list
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]"><Loader2 className="animate-spin text-[#a9b897]" /></div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Command Center</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">User: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
               {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button onClick={() => alert("Settings Synced")} className="flex items-center gap-4 bg-stone-900 text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
              <Save size={16} /> Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* TEAM MANAGEMENT */}
          <div className="lg:col-span-8 space-y-12">
            
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm transition-all duration-500">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Users className="text-[#a9b897]" size={24} />
                  <h2 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40">The Hive (Team Management)</h2>
                </div>
                <div className="text-[9px] font-black bg-stone-900 text-white px-4 py-2 rounded-full uppercase tracking-widest">+£19.95/mo Seat Cost</div>
              </div>

              <div className="space-y-8">
                {/* Email Input Field */}
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:text-[#a9b897] group-focus-within:opacity-100 transition-all" size={20}/>
                  <input 
                    placeholder="Colleague's email address..." 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    className="w-full p-6 pl-14 rounded-3xl border border-stone-100 bg-stone-50/50 text-base focus:ring-4 ring-[#a9b897]/10 outline-none transition-all"
                  />
                </div>

                {/* Permissions Matrix - ONLY SHOWS WHEN EMAIL IS BEING ENTERED */}
                {inviteEmail.length > 2 && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                       <ChevronRight size={14} className="text-[#a9b897]"/>
                       <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Select Access Clearances</label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {APP_PAGES.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => togglePermission(page.id)}
                          className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                            selectedPermissions.includes(page.id) 
                            ? 'border-[#a9b897] bg-[#a9b897]/5 text-stone-900 shadow-inner' 
                            : 'border-stone-100 bg-white text-stone-400 grayscale'
                          }`}
                        >
                          <span className="text-xs font-bold tracking-tight">{page.label}</span>
                          {selectedPermissions.includes(page.id) ? <Eye size={16} className="text-[#a9b897]" /> : <EyeOff size={16} />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleInvite} 
                      disabled={saving}
                      className="w-full py-6 bg-stone-900 text-[#a9b897] rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl"
                    >
                      {saving ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>}
                      Provision New Seat
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIVE TEAM LIST */}
              <div className="mt-16 pt-12 border-t border-stone-50 space-y-6">
                <h3 className="text-[10px] font-black uppercase opacity-40 tracking-[0.3em] mb-4">Active Deployments</h3>
                {teamMembers.length === 0 ? (
                  <p className="text-xs italic opacity-30">No additional team members found.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-6 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 group">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-full bg-white border border-stone-100 flex items-center justify-center text-[11px] font-black text-stone-400">
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">{member.email}</p>
                            <div className="flex gap-2 mt-2">
                              {member.permissions?.map((p: string) => (
                                <span key={p} className="text-[8px] bg-white border border-stone-200 px-2.5 py-1 rounded-lg uppercase font-black opacity-50 tracking-tighter">{p}</span>
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
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR: BILLING & SECURITY */}
          <div className="lg:col-span-4 space-y-12">
            <section className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
              <div className="flex justify-between items-start">
                <CreditCard className="text-[#a9b897]" size={28} />
                <button onClick={() => router.push("/billing")} className="text-[9px] font-black uppercase opacity-40 hover:opacity-100 tracking-widest">Portal <ExternalLink size={10}/></button>
              </div>
              <h3 className="text-4xl font-serif italic">{profile?.tier || 'Alpha'} Tier</h3>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Monthly Total</span>
                  <span className="text-2xl font-serif italic text-[#a9b897]">£{(teamMembers.length * 19.95).toFixed(2)}</span>
              </div>
              <button onClick={() => router.push("/billing")} className="w-full py-5 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">Upgrade Package</button>
            </section>

            {/* FINANCE MODULE */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Landmark className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Financial</h2>
              </div>
              <div className="space-y-3">
                <input placeholder="Bank Name" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
                <input placeholder="Account No" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
                <input placeholder="Sort Code" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
                <button onClick={() => alert("Saved")} className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">Save Node</button>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}