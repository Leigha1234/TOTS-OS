"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Sparkles, Save, Moon, Sun, Loader2, Landmark, ImageIcon, 
  Receipt, User, Globe, ShieldCheck, CreditCard, Users, Zap, 
  Mail, Key, Plus, Trash2, ExternalLink, Palette, Type, CheckCircle2,
  X, Lock
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- 1. VISUALS & BRANDING --
  const [brandColor, setBrandColor] = useState("#a9b897");
  const [accentColor, setAccentColor] = useState("#1c1c1c");
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [defaultLogo, setDefaultLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // -- 2. TEAM & PERMISSIONS --
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState<string[]>(["invoices"]);

  // -- 3. BILLING & SECURITY --
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const [password, setPassword] = useState("");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Load Profile Tier
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) setCurrentTier(p.tier?.toUpperCase() || "STANDARD");

      // Load Team Data
      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        
        // Get Team Members
        const { data: members } = await supabase.from("team_members").select("*").eq("team_id", membership.team_id);
        if (members) setTeamMembers(members);

        // Get Branding Settings
        const { data: s } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        if (s) {
          setBrandColor(s.brand_color || "#a9b897");
          setAccentColor(s.accent_color || "#1c1c1c");
          setSelectedFont(s.font_family || "Inter");
          setBankInfo(s.bank_info || bankInfo);
          setDefaultLogo(s.default_logo || null);
        }
      }
    } catch (err) {
      console.error("Init Error:", err);
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIC HANDLERS ---

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) return alert("Password must be at least 6 characters.");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) alert(error.message);
    else {
      alert("Password updated successfully.");
      setPassword("");
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;
    setSaving(true);
    // Logic: In a Stripe-integrated app, you'd confirm the £19.95/mo charge here.
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      email: inviteEmail,
      permissions: invitePerms,
      role: "member"
    });
    setSaving(false);
    if (error) alert(error.message);
    else {
      alert(`Seat confirmed. £19.95/mo added to subscription.`);
      setInviteEmail("");
      init(); // Refresh list
    }
  };

  const saveGlobalSettings = async () => {
    if (!teamId) return;
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({
      team_id: teamId,
      brand_color: brandColor,
      accent_color: accentColor,
      font_family: selectedFont,
      bank_info: bankInfo,
      default_logo: defaultLogo,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if (!error) alert("Global System Synced Successfully");
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#a9b897]" size={32} />
      <p className="font-serif italic text-stone-400">Synchronizing Nodes...</p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-700 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12 pb-40">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-stone-200 pb-12">
          <div className="space-y-2">
            <h1 className="text-7xl font-serif italic tracking-tighter leading-none">Settings</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Operational Tier: {currentTier}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={saveGlobalSettings} disabled={saving} className="flex items-center gap-4 bg-[#1c1c1c] text-[#a9b897] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Commit All Changes
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* MAIN COLUMN (BRANDING & TEAM) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* 1. VISUAL IDENTITY LAB */}
            <section className={`p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-10">
                <Palette className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Visual Identity Lab</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-4 block">Primary Brand Color</label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-14 h-14 rounded-xl border-none cursor-pointer bg-transparent" />
                      <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="flex-1 p-4 rounded-xl border bg-stone-50/50 text-xs font-mono" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-4 block">Typography Engine</label>
                    <div className="grid grid-cols-1 gap-3">
                      {["Inter", "Playfair Display", "Space Mono"].map((font) => (
                        <button 
                          key={font} 
                          onClick={() => setSelectedFont(font)}
                          className={`p-4 rounded-xl border text-left text-sm transition-all ${selectedFont === font ? 'border-[#a9b897] bg-[#a9b897]/5 font-bold' : 'border-stone-100 opacity-50'}`}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LOGO & PREVIEW */}
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-4">Document Header Preview</p>
                  <div className="aspect-video bg-stone-50 rounded-[2rem] border border-stone-100 p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center">
                        {defaultLogo ? <img src={defaultLogo} className="w-full h-full object-contain" /> : <ImageIcon size={16} className="text-stone-300"/>}
                      </div>
                      <div className="text-right">
                        <div className="h-2 w-20 bg-stone-200 rounded mb-2 ml-auto" style={{ backgroundColor: brandColor }} />
                        <div className="h-2 w-12 bg-stone-100 rounded ml-auto" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <h4 style={{ fontFamily: selectedFont }} className="text-xl italic">Invoice Example</h4>
                       <div className="h-1 w-full bg-stone-200/50 rounded" />
                    </div>
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} className="w-full py-4 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all">
                    Upload New Logo
                  </button>
                  <input type="file" ref={logoInputRef} hidden onChange={(e) => {
                    if (e.target.files?.[0]) setDefaultLogo(URL.createObjectURL(e.target.files[0]))
                  }} />
                </div>
              </div>
            </section>

            {/* 2. THE HIVE: TEAM & PERMISSIONS */}
            <section className={`p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Users className="text-[#a9b897]" size={20} />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Team Clearance</h2>
                </div>
                <div className="bg-red-50 text-red-500 text-[9px] font-black px-4 py-2 rounded-full border border-red-100 uppercase tracking-widest">
                  +£19.95 / Month per user
                </div>
              </div>

              {/* Add Member Bar */}
              <div className="flex flex-col md:flex-row gap-3 mb-10">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-4 opacity-20" size={16}/>
                  <input 
                    placeholder="Colleague Email Address..." 
                    className="w-full p-4 pl-12 rounded-xl border bg-stone-50/50 text-sm"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <button onClick={handleInviteMember} className="bg-stone-900 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all">
                  Invite & Pay
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-2xl border border-stone-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold uppercase">{member.email[0]}</div>
                      <div>
                        <p className="text-sm font-bold">{member.email}</p>
                        <p className="text-[9px] uppercase tracking-widest opacity-40">Permissions: {member.permissions?.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {/* Permission Toggles (Simplified for UI) */}
                       {["Invoices", "CRM", "Settings"].map(mod => (
                         <button key={mod} className="text-[8px] font-black uppercase border border-stone-200 px-3 py-1.5 rounded-lg hover:border-[#a9b897] hover:text-[#a9b897] transition-all bg-white">
                           {mod}
                         </button>
                       ))}
                       <button className="p-3 text-stone-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR (BILLING & SECURITY) */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* BILLING MODULE */}
            <section className="p-10 rounded-[3.5rem] bg-stone-900 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-start">
                   <CreditCard className="text-[#a9b897]" size={28} />
                   <button className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center gap-2">
                     Billing Portal <ExternalLink size={10}/>
                   </button>
                 </div>
                 
                 <div>
                   <h3 className="text-4xl font-serif italic mb-1">{currentTier}</h3>
                   <p className="text-[10px] font-black tracking-widest opacity-40 uppercase">Monthly Subscription</p>
                 </div>

                 <div className="space-y-4 pt-8 border-t border-white/10">
                    <div className="flex justify-between text-xs">
                      <span className="opacity-40 uppercase font-black text-[9px]">Additional Seats</span>
                      <span className="font-mono text-[#a9b897]">{teamMembers.length} × £19.95</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="opacity-40 uppercase font-black text-[9px]">Total Monthly</span>
                      <span className="text-2xl font-serif italic">£{(teamMembers.length * 19.95).toFixed(2)}</span>
                    </div>
                 </div>

                 <button className="w-full bg-[#a9b897] text-stone-900 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95">
                   Upgrade to Elite
                 </button>
                 
                 <button className="w-full text-center text-[9px] font-black uppercase tracking-widest opacity-30 hover:opacity-60 transition-all">
                   Cancel Subscription
                 </button>
               </div>
               {/* Abstract Background Element */}
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897] rounded-full blur-[80px] opacity-20" />
            </section>

            {/* SECURITY MODULE */}
            <section className={`p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <Lock className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">System Security</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase opacity-40">Update Master Password</p>
                  <div className="relative">
                    <Key className="absolute left-4 top-4 opacity-20" size={16}/>
                    <input 
                      type="password" 
                      placeholder="New Password" 
                      className="w-full p-4 pl-12 rounded-xl border bg-stone-50/50 text-sm"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={handleUpdatePassword} className="w-full bg-stone-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] transition-all">
                  Change Password
                </button>
              </div>
            </section>

            {/* FINANCE MODULE (Sourced from Invoices) */}
            <section className={`p-10 rounded-[3.5rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <Landmark className="text-[#a9b897]" size={20} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">Finance Node</h2>
              </div>
              <div className="space-y-4">
                 <input placeholder="Bank Name" className="w-full p-4 rounded-xl border bg-stone-50/50 text-sm" value={bankInfo.name} onChange={e => setBankInfo({...bankInfo, name: e.target.value})} />
                 <input placeholder="Account Number" className="w-full p-4 rounded-xl border bg-stone-50/50 text-sm" value={bankInfo.acc} onChange={e => setBankInfo({...bankInfo, acc: e.target.value})} />
                 <input placeholder="Sort Code" className="w-full p-4 rounded-xl border bg-stone-50/50 text-sm" value={bankInfo.sort} onChange={e => setBankInfo({...bankInfo, sort: e.target.value})} />
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}