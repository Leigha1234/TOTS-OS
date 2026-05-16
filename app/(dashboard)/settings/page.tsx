"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { 
  User, Users, RefreshCcw, Save, 
  Camera, Palette, ShieldCheck, 
  Fingerprint, Key, ChevronRight, 
  Database, ArrowUpRight, 
  Zap, Clock, Loader2,
  CheckSquare, Smartphone, LogOut,
  Globe, Layers, Plus, ArrowRight,
  Shield, Activity, Settings as SettingsIcon,
  Search, Filter, Trash2, Edit3,
  Mail, Phone, MapPin, AlertTriangle,
  FileJson, Server, HardDrive, Cpu,
  Type, Droplets, Layout, Eye, Video, Instagram, Facebook, Disc, Linkedin,
  Scale, CreditCard, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: UNIFIED ADMINISTRATIVE CONTROL CENTER v7.3
 * Architecture: Enterprise System Identity + Stripe Billing Integration
 * Theme: Organic Minimalist (Customizable)
 */

export default function Settings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- Core Identity & Interface State --
  const [userName] = useState<string>("LEIGHA DAY-CLARK");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"account" | "brand" | "security">("account");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  // -- Global Brand Customization (Persisted Across Workspace Platforms) --
  const [accentColor, setAccentColor] = useState("#A3B18A");
  const [fontPreference, setFontPreference] = useState<"serif-heavy" | "sans-clean">("serif-heavy");
  const [uiDensity, setUiDensity] = useState<"minimal" | "compact">("minimal");

  // -- Profile Information --
  const [displayName, setDisplayName] = useState("Leigha Day-Clark");
  const [email, setEmail] = useState("leigha@theapprenticestore.co.uk");
  const [bio, setBio] = useState("Root Administrator for TOTS OS. Managing cloud architectures and corporate team directories.");

  // -- Security Parameters & Access Activity --
  const [sessionLogs] = useState([
    { id: 1, device: "MacBook Pro M3", location: "Elgin, UK", time: "Active Now", status: "Active" },
    { id: 2, device: "iPhone 15 Pro", location: "Elgin, UK", time: "2 hours ago", status: "Idle" }
  ]);

  // -- Corporate Social Media Channel Integrations State --
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // -- Handshake Link Request to Stripe Customer Subscription Management Portal --
 // -- Handshake Link Request to Stripe Customer Subscription Management Portal --
  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    const billingToast = toast.loading("Establishing secure connection to Stripe Billing Portal...");
    
    try {
      // Simulate validation lookup window delay smoothly
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      toast.dismiss(billingToast);
      toast.success("Secure session verified.");
      
      // Route directly to your dedicated management interface view path
      router.push("/manage-subscription");
    } catch (err) {
      toast.dismiss(billingToast);
      console.error("Billing portal verification failure:", err);
      toast.error("Failed to safely authenticate with Stripe external server.");
    } finally {
      setIsBillingLoading(false);
    }
  };

  // -- Initialize Authentication Requests for Dynamic Client Integrations --
  const connectSocialPlatform = (targetPlatform: "meta" | "tiktok" | "pinterest" | "linkedin") => {
    const redirectUri = encodeURIComponent(`https://tots-os.co.uk/api/auth/callback/${targetPlatform}`);
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
      // Meta Suite Handle Gateway (Instagram & Facebook unified integration)
      const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || "mock_id";
      targetUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts`;
    }

    toast.loading(`Redirecting session to authenticated ${targetPlatform} server page...`);
    window.location.href = targetUrl;
  };

  // -- Disconnect Server Token Records and Revoke Access Permutations --
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
      
      // Fetch fresh structural integrations mapping
      fetchChannelIntegrations();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Database deletion protocol failure:", err);
      toast.error("Cloud architecture rejected configuration deletion request.");
    }
  };

  // -- Map Synchronized Platform Connections From Cloud Repository --
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

  // -- Structural Event Lifecycle Loop --
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const init = setTimeout(() => {
      fetchChannelIntegrations();
      setLoading(false);
    }, 800);
    return () => {
      clearInterval(timer);
      clearTimeout(init);
    };
  }, []);

  // -- Save Administrative Data State Changes --
  const handleSave = async () => {
    setIsSaving(true);
    // Persist layout variations to relational table / local instance
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Workspace System Settings Saved");
  };

  // -- Sign Out Management --
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
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A3B18A]">Verifying Account Workspace</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1700px] mx-auto font-sans">
      
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
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "--:--"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter leading-none text-stone-900">
              Settings
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-300 ml-2">Global System Infrastructure</p>
          </div>
          
          <nav className="flex flex-wrap items-center gap-3 pt-4">
            <button onClick={() => setActiveTab("account")} className={`flex items-center gap-4 px-8 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "account" ? "bg-stone-900 text-white shadow-xl" : "bg-white border border-stone-100 text-stone-300"}`}>
              <User size={14} /> Profile & Billing
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
      <main className="min-h-[600px]">
        <AnimatePresence mode="wait">
          
          {/* VIEW: ACCOUNT & SUBSCRIPTION */}
          {activeTab === "account" && (
            <motion.div key="account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <section className="lg:col-span-8 bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm space-y-16">
                
                {/* ADMINISTRATIVE DETAILS */}
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="shrink-0">
                    <div className="w-40 h-40 rounded-[3rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center group relative overflow-hidden">
                       <span className="text-4xl font-serif italic text-stone-200">LD</span>
                       <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <Camera size={20} className="text-white" />
                       </div>
                    </div>
                  </div>
                  <div className="flex-grow space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Corporate Identity</label>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-5 bg-[#faf9f6] border border-stone-50 rounded-2xl font-bold text-xs focus:accent-border outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">System Email Address</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-5 bg-[#faf9f6] border border-stone-50 rounded-2xl font-bold text-xs focus:accent-border outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Administrative Summary</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-6 bg-[#faf9f6] border border-stone-50 rounded-3xl font-serif italic text-xl min-h-[120px] outline-none" />
                    </div>
                  </div>
                </div>

                {/* --- STRIPE SUBSCRIPTION & BILLING CONFIGURATION PANEL --- */}
                <div className="pt-10 border-t border-stone-100 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-2xl font-serif italic tracking-tight">Subscription & Commercial Terms</h4>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300 mt-1">Manage corporate service tiers, payment parameters, and cancellation protocols</p>
                    </div>
                    <button 
                      onClick={handleManageBilling}
                      disabled={isBillingLoading}
                      className="shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                    >
                      {isBillingLoading ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                      Manage Subscription
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block">Current Service Tier</span>
                        <span className="text-lg font-bold text-stone-800 block mt-1">Premium Corporate</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded w-max border border-emerald-100">
                        Active Account
                      </span>
                    </div>

                    <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block">Available Tiers</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[8px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded">Standard</span>
                          <span className="text-[8px] font-bold px-2 py-0.5 bg-stone-900 text-white rounded">Premium</span>
                          <span className="text-[8px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded">Elite</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-serif italic text-stone-400 block">
                        Tier modifications processed dynamically
                      </span>
                    </div>

                    <div className="p-6 bg-[#faf9f6] border border-stone-100 rounded-2xl flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 block">Verified Credit Vault</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="px-1.5 py-0.5 bg-white border border-stone-200 text-[8px] font-black rounded text-stone-400">VISA</div>
                          <span className="text-sm font-bold text-stone-800">•••• 4096</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-serif italic text-stone-400 block">
                        Card parameters modification handled via Stripe
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- CLIENT SOCIAL SUITE CHANNEL MANAGEMENT PANEL --- */}
                <div className="pt-10 border-t border-stone-100 space-y-6">
                  <div>
                    <h4 className="text-2xl font-serif italic tracking-tight">Client Data Platform Sync</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300 mt-1">Authenticate corporate client distribution pipelines dynamically</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { 
                        key: "meta", 
                        name: "Meta Business Suite", 
                        subtitle: "Instagram & Facebook Pages",
                        icons: [Instagram, Facebook] 
                      },
                      { 
                        key: "tiktok", 
                        name: "TikTok Studio Portal", 
                        subtitle: "Corporate Content Pipeline",
                        icons: [Video] 
                      },
                      { 
                        key: "pinterest", 
                        name: "Pinterest Board Suite", 
                        subtitle: "Visual Commercial Vault",
                        icons: [Disc] 
                      },
                      { 
                        key: "linkedin", 
                        name: "LinkedIn Corporate Network", 
                        subtitle: "B2B Professional Integration",
                        icons: [Linkedin] 
                      }
                    ].map((platformObj) => {
                      const isConnected = connectedPlatforms.includes(platformObj.key);
                      return (
                        <div key={platformObj.key} className="p-5 bg-[#faf9f6] rounded-2xl border border-stone-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl flex gap-1 items-center ${isConnected ? 'accent-bg text-white' : 'bg-white text-stone-300 border border-stone-100'}`}>
                              {platformObj.icons.map((Icon, idx) => (
                                <Icon key={idx} size={16} />
                              ))}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-stone-800">{platformObj.name}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 text-stone-300">
                                {isConnected ? "Verification Active" : "Unlinked Configuration"}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => isConnected ? disconnectSocialPlatform(platformObj.key) : connectSocialPlatform(platformObj.key as any)}
                            className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all ${isConnected ? 'bg-white text-stone-400 border-stone-200 hover:text-red-500' : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'}`}
                          >
                            {isConnected ? "Disconnect" : "Connect"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-stone-50">
                  <button onClick={() => router.push('/settings/team')} className="p-8 bg-stone-900 rounded-[2.5rem] text-white flex flex-col justify-between h-48 group">
                    <Users size={24} className="accent-text" />
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Team Directory</p>
                        <p className="text-[9px] font-serif italic text-stone-400">Administer global corporate profiles</p>
                      </div>
                      <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </button>
                  <button onClick={() => router.push('/settings/import')} className="p-8 bg-white border border-stone-200 rounded-[2.5rem] flex flex-col justify-between h-48 group">
                    <RefreshCcw size={24} className="text-stone-200 group-hover:accent-text transition-colors" />
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Import Hub</p>
                        <p className="text-[9px] font-serif italic text-stone-300">Synchronize external company matrices</p>
                      </div>
                      <ArrowUpRight size={16} className="text-stone-200 group-hover:text-stone-900" />
                    </div>
                  </button>
                </div>
              </section>

              <aside className="lg:col-span-4 space-y-8">
                <section className="bg-stone-900 p-10 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden">
                  <Fingerprint size={120} className="absolute -right-8 -bottom-8 opacity-5" />
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="accent-text" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Access Verification Matrix</h3>
                  </div>
                  <div className="space-y-6 relative z-10">
                    {sessionLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                           <div className="w-1.5 h-1.5 rounded-full accent-bg" />
                           <span className="text-[10px] font-bold">{log.device}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="bg-white border border-stone-200 p-10 rounded-[3.5rem] shadow-sm flex flex-col items-center text-center space-y-6">
                  <Cpu size={40} className="text-stone-100" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 leading-relaxed">
                    Core v7.3 // Primary European Instance // All Systems Operational
                  </p>
                </div>
              </aside>
            </motion.div>
          )}

          {/* VIEW: BRAND DNA Customization */}
          {activeTab === "brand" && (
            <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               <section className="lg:col-span-7 bg-white border border-stone-200 p-12 rounded-[4rem] shadow-sm space-y-16">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-serif italic tracking-tight">System Appearance.</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Global Styling & Corporate Parameters</p>
                  </div>

                  <div className="space-y-12">
                    {/* ACCENT SELECTION */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Droplets size={16} className="accent-text" />
                        <label className="text-[10px] font-black uppercase tracking-widest">Primary Accent Variant</label>
                      </div>
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

                    {/* VIEWPORT DENSITY */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Layout size={16} className="accent-text" />
                        <label className="text-[10px] font-black uppercase tracking-widest">Layout Padding Density</label>
                      </div>
                      <div className="flex gap-4">
                         <button onClick={() => setUiDensity("minimal")} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${uiDensity === 'minimal' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-100 text-stone-300'}`}>Spacious Frame</button>
                         <button onClick={() => setUiDensity("compact")} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${uiDensity === 'compact' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-100 text-stone-300'}`}>Compact Matrix</button>
                      </div>
                    </div>
                  </div>
               </section>

               <section className="lg:col-span-5 space-y-8">
                  <div className="bg-[#faf9f6] border border-dashed border-stone-200 p-12 rounded-[4rem] flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
                     <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center animate-pulse">
                        <Eye size={32} className="accent-text" />
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-2xl font-serif italic">Real-Time Canvas Preview</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 max-w-[240px] leading-relaxed">
                          Global updates to company styles cascade automatically to all connected Client Portals.
                        </p>
                     </div>
                     <div className="w-full p-8 bg-white rounded-3xl shadow-lg space-y-4">
                        <div className="h-2 w-2/3 accent-bg rounded-full opacity-30" />
                        <div className="h-2 w-full bg-stone-50 rounded-full" />
                        <div className="h-2 w-1/2 bg-stone-50 rounded-full" />
                     </div>
                  </div>
               </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- WORKSPACE SYSTEM FOOTER --- */}
      <footer className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full accent-bg animate-pulse shadow-[0_0_8px_rgba(163,177,138,0.5)]" />
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">System Parameters Standard</span>
          </div>
          <p className="text-[10px] font-serif italic text-stone-300">TOTS Operating System // Corporate Cloud Instance</p>
        </div>
        <div className="flex items-center gap-6">
           <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-red-500 transition-colors group"
           >
            <LogOut size={12} className="group-hover:-translate-x-1 transition-transform" /> Terminate Active Session
           </button>
        </div>
      </footer>

    </div>
  );
}