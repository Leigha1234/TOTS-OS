"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Save, Moon, Sun, Loader2, Landmark, 
  CreditCard, Users, Trash2, Lock, Check,
  Eye, EyeOff, UserPlus, ShieldCheck
} from "lucide-react";

// The clearance levels / pages you want to control
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
  const [profile, setProfile] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // INVITE STATES
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["dashboard"]);

  // FINANCE STATES
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });

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
        if (settingsRes.data) setBankInfo(settingsRes.data.bank_info || bankInfo);
      }
    } catch (err) { 
      console.error("Initialization error:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const togglePermission = (pageId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
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

    if (error) {
      alert("Error: " + error.message);
    } else {
      setInviteEmail("");
      setSelectedPermissions(["dashboard"]);
      init(); // Refresh list
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
      <Loader2 className="animate-spin text-[#a9b897]" size={40} />
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <div className="max-w-6xl mx-auto p-8 lg:p-16 space-y-12">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-stone-200 pb-10">
          <div>
            <h1 className="text-6xl font-serif italic tracking-tighter">The Hive</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-4">Node: {profile?.tier || 'Standard'}</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white">
            {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* MAIN COLUMN: TEAM */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <Users className="text-[#a9b897]" size={22} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Provision New Member</h2>
              </div>

              <div className="space-y-8">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase opacity-30 ml-2">Email Address</label>
                  <div className="relative">
                    <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 opacity-20" size={18}/>
                    <input 
                      placeholder="teammate@company.com" 
                      value={inviteEmail} 
                      onChange={e => setInviteEmail(e.target.value)} 
                      className="w-full p-5 pl-14 rounded-2xl border border-stone-100 bg-stone-50/50 text-sm focus:ring-2 ring-[#a9b897] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Permissions Matrix - Force Display if email exists */}
                {inviteEmail.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-stone-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black uppercase opacity-30 ml-2">Assign Page Permissions</label>
                      <span className="text-[9px] font-bold text-[#a9b897]">{selectedPermissions.length} Pages Selected</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {APP_PAGES.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => togglePermission(page.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            selectedPermissions.includes(page.id) 
                            ? 'border-[#a9b897] bg-[#a9b897]/5 text-stone-900 shadow-sm' 
                            : 'border-stone-100 bg-white text-stone-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-tight">{page.label}</span>
                          {selectedPermissions.includes(page.id) ? <Eye size={14} className="text-[#a9b897]"/> : <EyeOff size={14} />}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleInvite} 
                      disabled={saving}
                      className="w-full py-5 bg-stone-900 text-[#a9b897] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>}
                      Authorize & Invite Member (+£19.95)
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* List of active members */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase opacity-30 tracking-widest ml-6">Active Deployments ({teamMembers.length})</h3>
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-stone-100 group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100">
                      <ShieldCheck size={16} className="text-[#a9b897]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{member.email}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {member.permissions?.map((p: string) => (
                          <span key={p} className="text-[7px] bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-md uppercase font-black opacity-60">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={async () => { if(confirm("Revoke Access?")) { await supabase.from("team_members").delete().eq("id", member.id); init(); }}}
                    className="opacity-0 group-hover:opacity-100 p-3 text-stone-200 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR: STATS & SETTINGS */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-xl space-y-8">
              <div className="flex justify-between items-start">
                <CreditCard className="text-[#a9b897]" size={24} />
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase opacity-40">Monthly Burn</p>
                  <p className="text-2xl font-serif italic text-[#a9b897]">£{(teamMembers.length * 19.95).toFixed(2)}</p>
                </div>
              </div>
              <button onClick={() => router.push("/billing")} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">Billing Portal</button>
            </section>

            <section className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Landmark className="text-[#a9b897]" size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Banking Node</h2>
              </div>
              <div className="space-y-3">
                <input placeholder="Account Holder" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-[10px] uppercase font-bold" />
                <input placeholder="Account No" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-[10px] font-bold" />
                <input placeholder="Sort Code" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-[10px] font-bold" />
                <button onClick={() => alert("Banking Updated")} className="w-full py-4 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">Update Finance</button>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}