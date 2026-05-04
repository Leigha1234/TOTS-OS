"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; 
import { 
  Sparkles, Save, Moon, Sun, Loader2, 
  Landmark, ImageIcon, Receipt, User, Globe,
  ShieldCheck, CreditCard, Users, Zap, Mail, Key,
  Plus, Shield, Trash2, ExternalLink
} from "lucide-react";

interface SocialHandles {
  instagram: string; linkedin: string; twitter: string; 
  tiktok: string; facebook: string; youtube: string;
  [key: string]: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  modules: string[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // -- TEAM & BILLING STATES --
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentTier, setCurrentTier] = useState("STANDARD");
  const ADDITIONAL_SEAT_PRICE = 19.95;

  // -- AUTH & BRAND STATES --
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [bankInfo, setBankInfo] = useState({ name: "", acc: "", sort: "" });

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      setEmail(user.email || "");

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setCurrentTier(p.tier?.toUpperCase() || "STANDARD");
      }

      const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).maybeSingle();
      if (membership?.team_id) {
        setTeamId(membership.team_id);
        
        // Fetch all team members for this team
        const { data: members } = await supabase.from("team_members").select("*").eq("team_id", membership.team_id);
        if (members) setTeamMembers(members);

        const { data: s } = await supabase.from("settings").select("*").eq("team_id", membership.team_id).maybeSingle();
        if (s) {
          setToneOfVoice(s.tone_of_voice || "");
          setBankInfo(s.bank_info || bankInfo);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // MOCK: In a real app, this would redirect to a Stripe Checkout Session
  const handleBillingAction = (action: 'upgrade' | 'add_seat' | 'portal') => {
    alert(`Redirecting to Secure Payment Gateway for: ${action}\nAdditional seats are £${ADDITIONAL_SEAT_PRICE}/mo`);
  };

  const saveGlobalSettings = async () => {
    if (!teamId) return;
    setSaving(true);
    await supabase.from("settings").upsert({
      team_id: teamId,
      tone_of_voice: toneOfVoice,
      bank_info: bankInfo,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    alert("System Synced");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#a9b897]" size={40} /></div>;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-stone-950 text-stone-200' : 'bg-[#fcfaf7] text-stone-900'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-16 space-y-10 pb-40">
        
        {/* HEADER */}
        <header className={`flex flex-col md:flex-row justify-between items-center p-10 rounded-[3rem] border shadow-2xl gap-8 ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
          <div>
            <h1 className="text-5xl font-serif italic tracking-tighter">Command Center</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] rounded-full text-[10px] font-black tracking-widest border border-[#a9b897]/20">
                {currentTier} PLAN
              </span>
              <span className="text-[10px] opacity-40 font-black uppercase tracking-widest">
                {teamMembers.length} SEATS ACTIVE
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-5 rounded-2xl border border-stone-200 hover:bg-stone-50">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={saveGlobalSettings} className="flex items-center gap-4 bg-[#1c1c1c] text-[#a9b897] px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sync Node
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLUMN 1: ACCESS & TEAM */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* TEAM MANAGEMENT */}
            <section className={`p-10 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Users className="text-[#a9b897]" size={20} />
                  <h2 className="text-[10px] font-black uppercase tracking-widest">The Hive: Team</h2>
                </div>
                <button 
                  onClick={() => handleBillingAction('add_seat')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase bg-[#a9b897] text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all"
                >
                  <Plus size={14}/> Add Member (+£19.95)
                </button>
              </div>

              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-5 bg-stone-50/50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-xs font-bold">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{member.email}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[8px] font-black uppercase opacity-40 px-2 py-0.5 border rounded">Invoices</span>
                          <span className="text-[8px] font-black uppercase opacity-40 px-2 py-0.5 border rounded">CRM</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* AI VOICE & FINANCE */}
            <section className={`p-10 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-[#a9b897]" size={20} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Global Brand Tone</h2>
              </div>
              <textarea 
                className="w-full h-32 p-5 rounded-2xl bg-stone-50/50 border border-stone-100 outline-none text-sm italic"
                value={toneOfVoice}
                onChange={e => setToneOfVoice(e.target.value)}
                placeholder="All team members will use this AI tone..."
              />
            </section>
          </div>

          {/* COLUMN 2: BILLING & SECURITY */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* SUBSCRIPTION CARD */}
            <section className="p-10 rounded-[3rem] bg-[#1c1c1c] text-white border border-stone-800 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                   <CreditCard className="text-[#a9b897]" size={24} />
                   <button onClick={() => handleBillingAction('portal')} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60 hover:opacity-100">
                     Manage Billing <ExternalLink size={12}/>
                   </button>
                </div>
                <h3 className="text-3xl font-serif italic mb-2">{currentTier} Plan</h3>
                <p className="text-[10px] opacity-50 font-black tracking-widest mb-8">£0.00 / MONTHLY BASE</p>
                
                <div className="space-y-3 pt-6 border-t border-white/10">
                  <div className="flex justify-between text-xs">
                    <span className="opacity-50">Team Seats ({teamMembers.length})</span>
                    <span>£{(teamMembers.length * ADDITIONAL_SEAT_PRICE).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#a9b897]">
                    <span>Total Monthly Est.</span>
                    <span>£{(teamMembers.length * ADDITIONAL_SEAT_PRICE).toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleBillingAction('upgrade')}
                  className="w-full mt-8 bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#a9b897] hover:text-white transition-all"
                >
                  Upgrade Tier
                </button>
              </div>
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Zap size={120} />
              </div>
            </section>

            {/* SECURITY SECTION */}
            <section className={`p-10 rounded-[3rem] border ${isDarkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
              <div className="flex items-center gap-3 mb-8">
                <ShieldCheck className="text-[#a9b897]" size={20} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Authentication</h2>
              </div>
              <div className="space-y-4">
                <input className="w-full p-4 rounded-xl border bg-stone-50/50 text-xs" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="••••••••" className="w-full p-4 rounded-xl border bg-stone-50/50 text-xs" />
                <button className="w-full py-4 text-[9px] font-black uppercase border border-stone-200 rounded-xl hover:bg-stone-50">Update Identity</button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}