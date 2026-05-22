"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Users, RefreshCcw, Save, 
  Camera, Palette, ShieldCheck, 
  Clock, Loader2, LogOut,
  Droplets, Layout, Type, KeyRound,
  Instagram, Facebook, Disc, Linkedin,
  Video, CreditCard, Scale, FileText, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: UNIFIED ADMINISTRATIVE CONTROL CENTER v8.0.0
 * Architecture: Clean Desk Profile Setup & Expanded Legal Hub Compliance Engine
 */

export default function Settings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- Core Identity & Interface State --
  const [userName, setUserName] = useState<string>("LOADING...");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"account" | "brand" | "security">("account");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  // -- Global Brand Customization --
  const [accentColor, setAccentColor] = useState("#A3B18A");
  const [secondaryColor, setSecondaryColor] = useState("#D4C8B4");
  const [fontPreference, setFontPreference] = useState<"serif-heavy" | "sans-clean">("serif-heavy");
  const [uiDensity, setUiDensity] = useState<"minimal" | "compact">("minimal");
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // -- Profile Information --
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [currentTier, setCurrentTier] = useState("Standard");

  // -- Security States --
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // -- Corporate Social Media Channel Integrations State --
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // -- Stripe Customer Subscription Portal Redirection --
  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    const billingToast = toast.loading("Establishing secure connection to Stripe Billing Portal...");
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.dismiss(billingToast);
      toast.success("Secure session verified.");
      router.push("/settings/manage-subscription");
    } catch (err) {
      toast.dismiss(billingToast);
      console.error("Billing portal verification failure:", err);
      toast.error("Failed to safely authenticate with Stripe external server.");
    } finally {
      setIsBillingLoading(false);
    }
  };

  // -- Initialize Oauth Authentication Request In New Browser Tab --
  const connectSocialPlatform = (targetPlatform: "meta" | "tiktok" | "pinterest" | "linkedin") => {
    const redirectUri = encodeURIComponent(`https://www.tots-os.co.uk/api/auth/callback?platform=${targetPlatform}`);
    let targetUrl = "";

    if (targetPlatform === "tiktok") {
      const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "mock_key";
      targetUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=video.upload,video.publish&response_type=code&redirect_uri=${redirectUri}`;
    } else if (targetPlatform === "pinterest") {
      const clientId = process.env.NEXT_PUBLIC_PINTEREST_CLIENT_ID || "mock_id";
      targetUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=boards:read,pins:read,pins:write`;
    } else if (targetPlatform === "linkedin") {
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "mock_id";
      targetUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=w_member_social,r_liteprofile`;
    } else {
      const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || "mock_id";
      targetUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts`;
    }

    toast.success(`Opening authenticated ${targetPlatform} portal page inside safe sandbox context...`);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // -- Disconnect Server Token Records --
  const disconnectSocialPlatform = async (targetPlatform: string) => {
    const loadingToast = toast.loading(`Deauthorizing active sync credentials for ${targetPlatform}...`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User credentials missing from active database window.");

      const { error } = await supabase
        .from("social_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", targetPlatform);

      if (error) throw error;

      toast.dismiss(loadingToast);
      toast.success(`${targetPlatform.toUpperCase()} channel removed from database records.`);
      fetchChannelIntegrations();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Database deletion protocol failure:", err);
      toast.error("Cloud architecture rejected configuration deletion request.");
    }
  };

  const fetchChannelIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("social_tokens")
          .select("platform")
          .eq("user_id", user.id);
          
        if (error) throw error;
        if (data) setConnectedPlatforms(data.map(item => item.platform));
      }
    } catch (err) {
      console.error("System configuration parsing issue:", err);
    }
  };

  // -- Password Management Stream --
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mismatch: Validation password parameters must align precisely.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Security constraint: Password array must exceed 8 character definitions.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast.success("Security Credentials Overhauled Automatically");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password modification rejection:", err);
      toast.error(err.message || "Security stack refused input credentials.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // -- Dynamic Profile Hydration Lifecycle Hook --
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

   async function loadActiveUserSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, bio, subscription_tier, organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile) {
      setUserName((profile.full_name || "OPERATOR").toUpperCase());
      setDisplayName(profile.full_name || "");
      setEmail(user.email || "");
      setBio(profile.bio || "");
      
      if (profile.organisation_id) {
        setUserOrgId(profile.organisation_id);
        
        // FIXED: Only fetching columns that actually exist in your database
        const { data: tenantSettings, error: settingsError } = await supabase
          .from("settings")
          .select("brand_color, secondary_color")
          .eq("organisation_id", profile.organisation_id)
          .maybeSingle();

        if (settingsError) {
          console.warn("Settings fetch failed:", settingsError.message);
          console.log("Session Check:", { user, organisation_id: profile?.organisation_id });
        } else if (tenantSettings) {
          setAccentColor(tenantSettings.brand_color || "#A3B18A");
          setSecondaryColor(tenantSettings.secondary_color || "#D4C8B4"); 
          console.log("Session Check:", { user, organisation_id: profile?.organisation_id });
        }
      }
    }
  } catch (err) {
    console.error("Critical Auth/Data error:", err);
  } finally {
    setLoading(false);
    fetchChannelIntegrations().catch(console.error);
  }
}
    loadActiveUserSession();
    return () => clearInterval(timer);
  }, [router]);

  // -- Save Profile & Brand Changes --
  // -- Save Profile & Brand Changes --
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication session missing.");

      // 1. Update personal profile information
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          bio: bio
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 2. Persist multi-tenant brand configuration parameters if organisation exists
      if (userOrgId) {
        // FIXED: Removed font_preference and ui_density since those columns 
        // don't exist in your table. Now it only saves columns that exist.
        const { error: settingsError } = await supabase
          .from("settings")
          .upsert({
            organisation_id: userOrgId,
            brand_color: accentColor,
            secondary_color: secondaryColor,
            updated_at: new Date().toISOString()
          }, { onConflict: 'organisation_id' });

        if (settingsError) throw settingsError;
      }

      setUserName(displayName.toUpperCase());
      toast.success("Workspace System Settings Saved");
    } catch (err) {
      console.error("Database persistence update error:", err);
      toast.error("Database rejected parameters update stream.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign Out Authorization Failed");
    } else {
      toast.info("Secure User Session Disconnected");
      router.push("/login");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-[#A3B18A]" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Loading settings...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1400px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        :root {
          --accent: ${accentColor};
        }
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
        .accent-border { border-color: var(--accent); }
      `}</style>

      {/* --- ADMINISTRATIVE CONTROL HEADER --- */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-stone-200 pb-10 gap-8">
        <div className="space-y-6 w-full xl:w-auto">
          <div className="flex flex-wrap items-center gap-6 accent-text">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
              <ShieldCheck size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">User: {userName}</p>
            </div>
            <div className="flex items-center gap-2 px-2 text-stone-400">
              <Clock size={12} />
              <p suppressHydrationWarning className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--:--"}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={isBillingLoading}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-stone-200 text-stone-700 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-stone-50 hover:border-stone-400 transition-all shadow-sm disabled:opacity-50"
            >
              {isBillingLoading ? <Loader2 size={10} className="animate-spin text-stone-400" /> : <CreditCard size={10} className="text-stone-400" />}
              Manage Subscription
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">
              Settings
            </h1>
          </div>
          
          <nav className="flex flex-wrap items-center gap-3 pt-4">
            <button onClick={() => setActiveTab("account")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "account" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <User size={14} /> Profile
            </button>
            <button onClick={() => setActiveTab("brand")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "brand" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <Palette size={14} /> Brand DNA
            </button>
            <button onClick={() => router.push('/settings/team')} className="flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-100 text-stone-300 hover:text-stone-900 transition-all">
              <Users size={14} /> Team Hub
            </button>
            <button onClick={() => router.push('/settings/import')} className="flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-100 text-stone-300 hover:text-stone-900 transition-all">
              <RefreshCcw size={14} /> Import Hub
            </button>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <button onClick={handleLogout} className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] border border-stone-100 bg-white text-stone-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
            <LogOut size={14} /> Sign Out
          </button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={handleSave} className="w-full sm:w-auto flex items-center justify-center gap-4 accent-bg px-12 py-5 rounded-[2rem] shadow-xl hover:brightness-110 transition-all">
            {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : <Save className="text-white" size={18} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Save Changes</span>
          </motion.button>
        </div>
      </header>

      {/* --- CONTENT WORKSPACE PANELS --- */}
      <main className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* VIEW: ACCOUNT DETAILS */}
          {activeTab === "account" && (
            <motion.div key="account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <section className="bg-white border border-stone-200 p-8 md:p-12 rounded-[4rem] shadow-sm space-y-16">
                
                {/* ADMINISTRATIVE DETAILS */}
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="shrink-0 mx-auto md:mx-0">
                    <div className="w-40 h-40 rounded-[3rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center group relative overflow-hidden">
                       <span className="text-4xl font-serif italic text-stone-200">
                         {displayName ? displayName.split(" ").map(n => n[0]).join("").toUpperCase() : "OS"}
                       </span>
                       <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <Camera size={20} className="text-white" />
                       </div>
                    </div>
                  </div>
                  <div className="flex-grow space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Full Name</label>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-5 bg-[#faf9f6] border border-stone-200 rounded-2xl font-bold text-xs focus:accent-border outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Email Address</label>
                        <input value={email} disabled className="w-full p-5 bg-[#faf9f6] border border-stone-200 rounded-2xl font-bold text-xs opacity-60 cursor-not-allowed outline-none select-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Administrative Summary</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-200 rounded-3xl font-serif italic text-xl min-h-[120px] outline-none" />
                    </div>
                  </div>
                </div>

                {/* --- CONNECT SOCIALS COMPONENT ROW --- */}
                <div className="pt-10 border-t border-stone-100 space-y-6">
                  <div>
                    <h4 className="text-2xl font-serif italic tracking-tight">Connect Socials</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "meta", name: "Meta Business Suite", subtitle: "Instagram & Facebook Pages", icons: [Instagram, Facebook] },
                      { key: "tiktok", name: "TikTok Studio Portal", subtitle: "Corporate Content Pipeline", icons: [Video] },
                      { key: "pinterest", name: "Pinterest Board Suite", subtitle: "Visual Commercial Vault", icons: [Disc] },
                      { key: "linkedin", name: "LinkedIn Corporate Network", subtitle: "B2B Professional Integration", icons: [Linkedin] }
                    ].map((platformObj) => {
                      const isConnected = connectedPlatforms.includes(platformObj.key);
                      return (
                        <div key={platformObj.key} className="p-5 bg-[#faf9f6] rounded-2xl border border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl flex gap-1 items-center shrink-0 ${isConnected ? 'accent-bg text-white' : 'bg-white text-stone-300 border border-stone-100'}`}>
                              {platformObj.icons.map((Icon, idx) => (
                                <Icon key={idx} size={16} fill="currentColor" className="stroke-none" />
                              ))}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-stone-800 truncate">{platformObj.name}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-stone-300 truncate">{platformObj.subtitle}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => isConnected ? disconnectSocialPlatform(platformObj.key) : connectSocialPlatform(platformObj.key as any)}
                            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all text-center shrink-0 ${isConnected ? 'bg-white text-stone-400 border-stone-200 hover:text-red-500' : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'}`}
                          >
                            {isConnected ? "Disconnect" : "Connect"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* --- SECURE PASSWORD ALTERATION MATRICES --- */}
                <div className="pt-10 border-t border-stone-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <KeyRound size={18} className="text-stone-400 accent-text" />
                    <div>
                      <h4 className="text-2xl font-serif italic tracking-tight">Password</h4>
                    </div>
                  </div>
                  <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-[#faf9f6] p-6 rounded-3xl border border-stone-100">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Old Password</label>
                      <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-white border border-stone-200 rounded-xl font-mono text-xs outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-white border border-stone-200 rounded-xl font-mono text-xs outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-white border border-stone-200 rounded-xl font-mono text-xs outline-none" />
                    </div>
                    <div className="md:col-span-3 flex justify-end pt-2">
                      <button type="submit" disabled={isUpdatingPassword} className="w-full md:w-auto px-8 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                        {isUpdatingPassword && <Loader2 size={12} className="animate-spin" />}
                        Update Security Key
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* --- NAVIGATION LINKS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-stone-50">
                  <button onClick={() => router.push('/settings/team')} className="p-8 bg-stone-900 rounded-[2.5rem] text-white flex flex-col justify-between h-48 group text-left">
                    <Users size={24} className="accent-text" />
                    <div className="flex justify-between items-end w-full">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Team Hub</p>
                      </div>
                      <Users size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-[#A3B18A]" />
                    </div>
                  </button>
                  <button onClick={() => router.push('/settings/import')} className="p-8 bg-white border border-stone-200 rounded-[2.5rem] flex flex-col justify-between h-48 group text-left">
                    <RefreshCcw size={24} className="text-stone-200 group-hover:accent-text transition-colors" />
                    <div className="flex justify-between items-end w-full">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Import Hub</p>
                      </div>
                      <RefreshCcw size={16} className="text-stone-200 group-hover:text-stone-900 transition-transform" />
                    </div>
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {/* VIEW: BRAND DNA Customization */}
          {activeTab === "brand" && (
            <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               <section className="lg:col-span-12 bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm space-y-16">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-serif italic tracking-tight">System Appearance</h3>
                  </div>

                  <div className="space-y-12">
                    {/* ACCENT SELECTION */}
                    <div className="space-y-6">
                      
                      <div className="flex flex-wrap gap-4">
                        {["#A3B18A", "#6B705C", "#8E9AAF", "#9D8189", "#2D2D2D"].map(color => (
                          <button 
                            key={color} 
                            onClick={() => setAccentColor(color)}
                            className={`w-14 h-14 rounded-2xl transition-all ${accentColor === color ? 'scale-110 shadow-lg ring-2 ring-offset-2 ring-stone-200' : 'opacity-40 hover:opacity-100'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-14 h-14 rounded-2xl bg-transparent border-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* TYPOGRAPHY CONTROLS */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Type size={16} className="accent-text" />
                        <label className="text-[10px] font-black uppercase tracking-widest">Typography Weight Scaling</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setFontPreference("serif-heavy")}
                          className={`p-6 rounded-3xl border text-left transition-all ${fontPreference === 'serif-heavy' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}
                        >
                          <p className="font-serif italic text-2xl mb-1">Instrument Serif</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">High-Contrast Creative Layout</p>
                        </button>
                        <button 
                          onClick={() => setFontPreference("sans-clean")}
                          className={`p-6 rounded-3xl border text-left transition-all ${fontPreference === 'sans-clean' ? 'border-stone-900 bg-stone-50' : 'border-stone-100'}`}
                        >
                          <p className="font-sans font-black text-xl mb-1 uppercase tracking-tight">Inter Bold</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Minimalist Structure Interface</p>
                        </button>
                      </div>
                    </div>

                  </div>
               </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- INTEGRATED COMPLIANCE & LEGAL HUB MATRICES --- */}
      <section className="pt-8 border-t border-stone-200 space-y-6">
        <div className="flex items-center gap-3">
          <Scale size={18} className="text-stone-900 accent-text" />
          <div>
            <h3 className="text-3xl font-serif italic tracking-tight">Legal Hub</h3>
              </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Terms & Conditions", href: "/docs/termsconditions" },
            { title: "Privacy Policy", href: "/docs/privacypolicy" },
            { title: "AI Policy", href: "/docs/aipolicy" },
            { title: "Beta Terms", href: "/docs/betaterms" },
            { title: "Cancellation Policy", href: "/docs/cancellationpolicy" },
            { title: "Community Guidelines", href: "/docs/communityguidelines" },
            { title: "Cookies Policy", href: "/docs/cookies" },
            { title: "Data Terms", href: "/docs/dataterms" },
            { title: "Property Notice", href: "/docs/propertynotice" },
            { title: "Security Policy", href: "/docs/securitypolicy" },
            { title: "Service Policy", href: "/docs/servicepolicy" }
         
          ].map((doc, idx) => (
            <div 
              key={idx} 
              onClick={() => window.open(doc.href, "_blank")}
              className="p-6 bg-white border border-stone-200/80 rounded-[2rem] hover:border-stone-900 transition-all cursor-pointer group shadow-sm flex flex-col justify-between min-h-[160px]"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-stone-50 rounded-xl text-stone-400 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all">
                    <FileText size={16} />
                  </div>
                  <ExternalLink size={12} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-stone-800 pt-1 group-hover:text-stone-950">{doc.title}</h4>
              </div>
              <div className="pt-3 border-t border-stone-50 flex items-center justify-between">
                <span className="text-[7px] font-black uppercase tracking-wider text-stone-300 group-hover:text-stone-900 transition-colors">Review Doc</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}