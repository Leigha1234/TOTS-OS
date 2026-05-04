"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Sparkles, Save, Moon, Sun, Loader2, Landmark, ImageIcon, 
  Receipt, User, Globe, ShieldCheck, CreditCard, Users, Zap, 
  Mail, Key, Plus, Trash2, ExternalLink, Palette, Lock, Check
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // FINANCE STATES
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });
  const [isDefaultBank, setIsDefaultBank] = useState(true);

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
          setBankInfo(settingsRes.data.bank_info || bankInfo);
          setIsDefaultBank(settingsRes.data.is_default_bank ?? true);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // --- NAVIGATION HANDLERS ---
  const goToBilling = () => router.push("/billing");

  // --- FINANCE HANDLER ---
  const handleUpdateFinance = async () => {
    if (!teamId) return;
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      bank_info: bankInfo,
      is_default_bank: isDefaultBank,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if (!error) alert("Financial nodes updated and set as default.");
  };

  const handleGlobalSync = async () => {
    if (!teamId) return;
    setSaving(true);
    await supabase.from("settings").upsert({
      team_id: teamId,
      brand_color: brandColor,
      font_family: selectedFont,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    alert("System Synced.");
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    setSaving(true);
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId, email: inviteEmail, role: "member", permissions: ["invoices"]
    });
    setSaving(false);
    if (!error) { setInviteEmail(""); init(); }
  };

  const handlePasswordUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) { alert("Security Key Updated."); setNewPassword(""); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-stone-300" /></div>;

  return (
    <div className={`min-h-screen transition-all ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div>
            <h1 className="text-7xl font-serif italic tracking-tighter">Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mt-4">Node: {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-all">
              {isDarkMode ? <Sun size={20} className="text-black"/> : <Moon size={20} />}
            </button>
            <button onClick={handleGlobalSync} className="flex items-center gap-4 bg-stone-900 text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-40">
          <div className="lg:col-span-8 space-y-12">
            
            {/* BRANDING */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <Palette className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Identity Lab</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase opacity-40 block">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-14 h-14 rounded-xl cursor-pointer" />
                    <input type="text" value={brandColor} readOnly className="flex-1 p-4 rounded-xl border bg-stone-50 font-mono text-xs" />
                  </div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mt-8">Global Font</label>
                  <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} className="w-full p-4 rounded-xl border bg-stone-50 text-sm appearance-none outline-none">
                    <option value="Inter">Inter (Modern)</option>
                    <option value="Playfair Display">Playfair (Elegant)</option>
                    <option value="Space Mono">Space Mono (Tech)</option>
                  </select>
                </div>
                <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-1 w-full mb-4" style={{ backgroundColor: brandColor }} />
                  <p style={{ fontFamily: selectedFont }} className="text-xl italic">Preview Persona</p>
                </div>
              </div>
            </section>

            {/* TEAM */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <Users className="text-[#a9b897]" size={20} />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Team</h2>
                </div>
              </div>
              <div className="flex gap-2 mb-8">
                <input placeholder="Invite email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 p-4 rounded-xl border bg-stone-50 text-sm" />
                <button onClick={handleInvite} className="bg-stone-900 text-white px-8 rounded-xl text-[10px] font-black uppercase hover:bg-[#a9b897] transition-all">Invite +£19.95</button>
              </div>
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-5 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-sm font-bold">{member.email}</span>
                    <button onClick={async () => { await supabase.from("team_members").delete().eq("id", member.id); init(); }} className="p-2 text-stone-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* BILLING CARD - ALL LINKS GO TO /billing */}
            <section className="bg-stone-900 text-white p-10 rounded-[3.5rem] shadow-2xl space-y-8">
              <div className="flex justify-between items-start">
                <CreditCard className="text-[#a9b897]" size={28} />
                <button onClick={goToBilling} className="text-[9px] font-black uppercase opacity-40 hover:opacity-100 flex items-center gap-2 tracking-widest transition-all">Billing Portal <ExternalLink size={10}/></button>
              </div>
              <div>
                <h3 className="text-4xl font-serif italic uppercase">{profile?.tier || 'Standard'}</h3>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Monthly Est.</span>
                  <span className="text-2xl font-serif italic">£{(teamMembers.length * 19.95).toFixed(2)}</span>
              </div>
              <div className="space-y-3 pt-4">
                <button onClick={goToBilling} className="w-full py-5 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">Upgrade Plan</button>
                <button onClick={goToBilling} className="w-full text-center text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-all">Cancel Subscription</button>
              </div>
            </section>

            {/* FINANCE CARD - WITH DEFAULT TOGGLE & SUBMIT */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Landmark className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Finance Node</h2>
              </div>
              <div className="space-y-3">
                <input placeholder="Bank Name" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
                <input placeholder="Account No" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
                <input placeholder="Sort Code" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
              </div>
              
              <div className="flex items-center justify-between p-2">
                <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Set as Default</span>
                <button 
                  onClick={() => setIsDefaultBank(!isDefaultBank)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isDefaultBank ? 'bg-[#a9b897]' : 'bg-stone-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDefaultBank ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <button 
                onClick={handleUpdateFinance} 
                className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={14}/> : <Check size={14}/>} Submit Bank Details
              </button>
            </section>

            {/* SECURITY */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Security</h2>
              </div>
              <input type="password" placeholder="New Master Key" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 rounded-xl border bg-stone-50 text-xs" />
              <button onClick={handlePasswordUpdate} className="w-full py-4 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Update Access</button>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}