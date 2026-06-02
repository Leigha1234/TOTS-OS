"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useSettings } from "@/app/context/SettingsContext";
import AdminPermissionToggle from "../../../components/AdminPermissionToggle";
import { 
  ArrowLeft, Check, Loader2, Palette, Database, 
  Users, Plus, ChevronRight, Camera, Shield, Clock,
  Trash2, Zap, HardDrive, Search, ShieldCheck, Mail, X, Link, Copy, UserPlus, Upload
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ComprehensiveTeamHub() {
  const router = useRouter();
  const { organisationId, refreshSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- UI & Navigation State --
  const [activeTab, setActiveTab] = useState<"team" | "brand" | "security">("team");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // -- Invite Form State --
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [generatedLink, setGeneratedLink] = useState("");

  // -- Brand & Team State --
  const [logo, setLogo] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#A3B18A");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [handles, setHandles] = useState({ instagram: "", linkedin: "" });
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if (organisationId) init();
    return () => clearInterval(timer);
  }, [organisationId]);

  async function init() {
    try {
      if (!organisationId) return;

      setLoading(true);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("organisation_id", organisationId)
        .order("full_name", { ascending: true });

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("settings")
        .select("*")
        .eq("organisation_id", organisationId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setLogo(settingsData.logo_url || "");
        setBusinessName(settingsData.business_name || "");
        setAddress(settingsData.address || "");
        setWebsite(settingsData.social_links?.website || "");
        setContactEmail(settingsData.contact_email || "");
        setPrimaryColor(settingsData.brand_color || "#A3B18A");
        setHandles(settingsData.social_links || { instagram: "", linkedin: "" });
        setToneOfVoice(settingsData.tone_of_voice || "");
        setNextOfKinPhone(settingsData.next_of_kin_phone || "");
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to sync team data.");
    } finally {
      setLoading(false);
    }
  }

 const handleInvite = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  
  try {
    // 1. Query the Org for available seats
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('available_seats')
      .eq('id', organisationId)
      .single();

    if (orgError) throw orgError;

    // 2. Logic Check: Credit Pool vs. Direct Pay
    if (org.available_seats > 0) {
      // A: USE CREDIT
      await supabase
        .from('organizations')
        .update({ available_seats: org.available_seats - 1 })
        .eq('id', organisationId);

      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert([{ 
          email: inviteEmail, 
          organisation_id: organisationId, 
          role: inviteRole, 
          status: 'paid' 
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;
      setGeneratedLink(`${window.location.origin}/join?token=${invite.token}`);
      toast.success("Seat consumed from credits.");
    } else {
      // B: PAY FOR SEAT (Redirect to Stripe)
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert([{ 
          email: inviteEmail, 
          organisation_id: organisationId, 
          role: inviteRole, 
          status: 'pending' 
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;
      
      // Trigger Stripe Checkout
      const response = await fetch('/api/checkout/create-seat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: invite.id, email: inviteEmail })
      });
      
      const { url, sessionId } = await response.json(); // Ensure your API returns sessionId
      if (!url) throw new Error("Payment session creation failed.");

      // Save the session ID to the invite record for "world-class" recovery
      await supabase
        .from('invites')
        .update({ stripe_session_id: sessionId })
        .eq('id', invite.id);

      window.location.href = url; // Redirect to Stripe
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Payment setup failed");
  } finally {
    setSaving(false);
  }
};

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Invite link copied to clipboard.");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        organisation_id: organisationId,
        logo_url: logo, 
        business_name: businessName, 
        address, 
        contact_email: contactEmail, 
        brand_color: primaryColor,
        social_links: { ...handles, website }, 
        tone_of_voice: toneOfVoice,
        next_of_kin_phone: nextOfKinPhone
      });
      if (error) throw error;
      await refreshSettings();
      toast.success("Settings updated successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={48} />
      <p className="font-black uppercase tracking-[0.6em] text-[#A3B18A] text-[10px]">Loading Hub</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1800px] mx-auto font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-stone-200 pb-10 gap-8">
        <div className="space-y-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
              <Shield size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Business: {businessName || "Unassigned"}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 text-stone-300">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">Team Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-2">Identity & Member Management</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 pt-6">
            <button onClick={() => setActiveTab("team")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "team" ? "bg-stone-900 text-white shadow-2xl" : "bg-white border border-stone-100 text-stone-300"}`}><Users size={14} /> Members</button>
            <button onClick={() => setActiveTab("brand")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "brand" ? "bg-stone-900 text-white shadow-2xl" : "bg-white border border-stone-100 text-stone-300"}`}><Palette size={14} /> Brand Identity</button>
         </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <button onClick={() => router.push('/settings')} className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] border border-stone-100 bg-white text-stone-400 hover:text-stone-900 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"><ArrowLeft size={14} /> Settings</button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} disabled={saving} className="w-full sm:w-auto flex items-center justify-center gap-4 bg-stone-900 px-12 py-5 rounded-[2rem] shadow-xl hover:bg-[#A3B18A] transition-all disabled:opacity-50 group">
            {saving ? <Loader2 className="animate-spin text-white" size={18} /> : <Database className="text-[#A3B18A] group-hover:text-white" size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Save Changes</span>
          </motion.button>
        </div>
      </header>

      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === "team" && (
            <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-stone-100">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input type="text" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-[#faf9f6] border border-stone-50 rounded-2xl text-xs font-bold outline-none" />
                </div>
                <button onClick={() => {setGeneratedLink(""); setShowInviteModal(true);}} className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#A3B18A] rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                  <UserPlus size={14} /> Invite New Member
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {teamMembers.filter(m => m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((member, i) => (
                  <motion.div 
                    key={member.id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: i * 0.05 }} 
                    onClick={() => router.push(`/settings/team/${member.id}`)}
                    className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm group hover:border-[#A3B18A] transition-all duration-500 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-12">
                       <div className="w-16 h-16 rounded-[2rem] bg-[#faf9f6] flex items-center justify-center text-2xl font-serif italic text-stone-200 group-hover:bg-stone-900 group-hover:text-[#A3B18A] transition-all">
                         {member.full_name?.charAt(0) || "U"}
                       </div>
                       <div className="text-right">
                          <div className="px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border bg-green-50 border-green-100 text-green-600">Active</div>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-serif italic text-stone-900">{member.full_name}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A] mt-1 capitalize">{member.role}</p>
                      </div>
                      <div className="bg-[#faf9f6] border border-stone-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[7px] font-black uppercase tracking-widest text-stone-300 mb-1">Payments Access</p>
                          <p className="text-[10px] text-stone-500 truncate">{member.email}</p>
                        </div>
                        <AdminPermissionToggle
                          memberId={member.id}
                          pageSlug="/payments"
                          initialAccess={false}
                        />
                      </div>
                      <div className="pt-6 border-t border-stone-50 flex items-center justify-between text-stone-300">
                        <span className="text-[8px] font-black uppercase tracking-widest">{member.role === 'admin' ? 'Owner Access' : 'Staff Access'}</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform group-hover:text-stone-900" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* BRAND TAB */}
          {activeTab === "brand" && (
            <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* Simplified brand section for the update */}
               <div className="lg:col-span-12 bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm space-y-12">
                 <div className="flex flex-col md:flex-row gap-12">
                    <div className="space-y-4 shrink-0">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Company Logo</label>
                      <div className="w-48 h-48 rounded-[3.5rem] bg-[#faf9f6] border-2 border-dashed border-stone-100 flex items-center justify-center overflow-hidden group relative transition-all hover:border-[#A3B18A]">
                        {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Camera className="text-stone-100" size={32} />}
                        <label className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Upload size={20} className="text-[#A3B18A]" />
                          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
                        </label>
                      </div>
                    </div>
                    <div className="flex-grow space-y-8">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Business Name</label>
                        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-50 rounded-2xl font-serif italic text-4xl outline-none focus:border-[#A3B18A]" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Website</label>
                          <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold" placeholder="yourdomain.com" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Contact Email</label>
                          <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-4 bg-[#faf9f6] border border-stone-50 rounded-xl text-xs font-bold" placeholder="hello@yourbusiness.com" />
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-12 rounded-[4rem] w-full max-w-lg border border-stone-200 shadow-2xl relative">
              <button onClick={() => setShowInviteModal(false)} className="absolute top-8 right-8 text-stone-300 hover:text-stone-900"><X size={24}/></button>
              
              <div className="text-center mb-10 space-y-2">
                <Shield className="mx-auto text-[#A3B18A] mb-4" size={40} />
                <h2 className="text-3xl font-serif italic tracking-tight">Onboard Member</h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Invite a new person to your organization</p>
              </div>

              {!generatedLink ? (
                <form onSubmit={handleInvite} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Member Email</label>
                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@business.com" className="w-full p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl text-xs font-bold outline-none focus:border-[#A3B18A]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Permissions</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full p-5 bg-[#faf9f6] border border-stone-100 rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer">
                      <option value="member">Staff Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <button type="submit" disabled={saving} className="w-full py-5 bg-stone-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                    {saving ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14} fill="currentColor"/>}
                    Generate Invite Link
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#A3B18A]">Onboarding Link Ready</p>
                    <div className="flex items-center gap-3 p-4 bg-white border border-stone-100 rounded-xl overflow-hidden">
                      <Link size={14} className="text-stone-300 shrink-0" />
                      <p className="text-[10px] font-mono text-stone-400 truncate">{generatedLink}</p>
                    </div>
                  </div>
                  <button onClick={copyToClipboard} className="w-full py-5 bg-[#A3B18A] text-white rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                    <Copy size={14} /> Copy to Clipboard
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pt-8 flex justify-between items-center border-t border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#A3B18A] animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Organisation Sync Active</span>
        </div>
        <p className="text-[10px] font-serif italic text-stone-300">TOTS Business OS // 2026</p>
      </footer>
    </div>
  );
}