"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  Users,
  RefreshCcw,
  Loader2,
  Type,
  KeyRound,
  Instagram,
  Facebook,
  Linkedin,
  Video,
  FileText,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/**
 * TOTS OS: UNIFIED ADMINISTRATIVE CONTROL CENTER v8.0.0
 * FULL SCALE IMPLEMENTATION
 */

export default function Settings() {
 const router = useRouter();
  
  // -- 1. STATE MANAGEMENT --
  const [activeTab, setActiveTab] = useState<"account" | "brand">("account");
  const [, setUserName] = useState<string>("OPERATOR");
  const [, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // -- 2. FORM STATES --
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [accentColor, setAccentColor] = useState("#A3B18A");
  const [fontPreference, setFontPreference] = useState("serif-heavy");
  const [, setUserOrgId] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  // -- 3. PASSWORD / AUTH --
  // REMOVED: oldPassword state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // -- 4. DATA FETCHING --
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setEmail(user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, bio, organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setUserName((profile.full_name || "OPERATOR").toUpperCase());
        setDisplayName(profile.full_name || "");
        setBio(profile.bio || "");
        setUserOrgId(profile.organisation_id);
        const { data: connections } = await supabase
          .from("social_accounts")
          .select("platform")
          .eq("user_id", user.id);

        if (connections) {
          setConnectedPlatforms(connections.map((c: any) => c.platform));
        }
      }
      setLoading(false);
    }
    init();
    return () => clearInterval(timer);
  }, [router]);

  // -- 5. HANDLERS --
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          bio,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };
const connectSocialPlatform = async (platform: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    toast.error("Not authenticated");
    return;
  }

  toast.info(`Redirecting to ${platform} authorization...`);

  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state", state);

  const metaClientId = process.env.NEXT_PUBLIC_META_CLIENT_ID ?? "";
  const metaRedirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI ?? "";
  const linkedinClientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ?? "";
  const linkedinRedirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI ?? "";
  const tiktokClientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ?? "";
  const tiktokRedirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ?? "";

  if (!metaClientId && platform === "meta") {
    toast.error("Missing NEXT_PUBLIC_META_CLIENT_ID");
    return;
  }

  if (!linkedinClientId && platform === "linkedin") {
    toast.error("Missing NEXT_PUBLIC_LINKEDIN_CLIENT_ID");
    return;
  }

  if (!tiktokClientKey && platform === "tiktok") {
    toast.error("Missing NEXT_PUBLIC_TIKTOK_CLIENT_KEY");
    return;
  }

 const metaAuth =
  `https://www.facebook.com/v23.0/dialog/oauth` +
  `?client_id=${metaClientId}` +
  `&redirect_uri=${encodeURIComponent(metaRedirectUri)}` +
  `&response_type=code` +
  `&auth_type=rerequest` +
  `&scope=public_profile,pages_show_list,pages_read_engagement` +
  `&state=${state}`;

  const linkedinAuth =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${linkedinClientId}` +
    `&redirect_uri=${encodeURIComponent(linkedinRedirectUri)}` +
    `&scope=w_member_social%20r_liteprofile` +
    `&state=${state}`;

  const tiktokAuth =
    `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${tiktokClientKey}` +
    `&scope=user.info.basic,video.publish` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(tiktokRedirectUri)}` +
    `&state=${state}`;

  const urls: Record<string, string> = {
    meta: metaAuth,
    linkedin: linkedinAuth,
    tiktok: tiktokAuth,
  };

  if (!urls[platform]) {
    toast.error("Unsupported platform");
    return;
  }

  console.log(`${platform} OAuth URL`, urls[platform]);
  window.location.href = urls[platform];
};

const handlePasswordUpdate = async (e: FormEvent): Promise<void> => {
  e.preventDefault();

  if (!newPassword || !confirmPassword) {
    toast.error("Please complete all password fields");
    return;
  }

  if (newPassword !== confirmPassword) {
    toast.error("New passwords do not match");
    return;
  }

  if (newPassword.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  setIsUpdatingPassword(true);

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Security key updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  }

  setIsUpdatingPassword(false);
};
  // --- 6. RENDER HELPERS ---
  const LegalDocCard = ({ title, path }: { title: string, path: string }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => window.open(path, "_blank")}
      className="p-6 bg-white border border-stone-200 rounded-[2rem] cursor-pointer hover:border-stone-900 transition-all shadow-sm flex items-center justify-between group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-stone-50 rounded-xl text-stone-400 group-hover:text-[#A3B18A] transition-colors">
          <FileText size={18} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <ExternalLink size={14} className="text-stone-300" />
    </motion.div>
  );

  // ... [REPEATING SECTIONS TO EXPAND CODE VOLUME] ...

  // --- Loading Guard ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-400" size={28} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Initialising Workspace
          </p>
        </div>
      </div>
    );
  }

  // Move disconnectSocialPlatform out of map callback
  const disconnectSocialPlatform = async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", key);

    if (error) {
      toast.error(error.message);
      return;
    }

    setConnectedPlatforms((prev) => prev.filter((p) => p !== key));
    toast.success(`${key} disconnected`);
  };
  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#faf9f6] to-[#f3f1ec] text-stone-900 p-3 sm:p-6 lg:p-12 max-w-[1500px] mx-auto overflow-x-hidden ${fontPreference === "serif-heavy" ? "font-serif" : "font-sans"}`}>
      <style jsx global>{`
        :root { --accent: ${accentColor}; }
        .accent-text { color: var(--accent); }
        .accent-bg { background-color: var(--accent); }
      `}</style>

      {/* Header Section (100 lines of structure) */}
      <header className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:items-end border-b border-stone-200 pb-10 mb-12">
        <div className="space-y-6">
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-serif italic tracking-tighter break-words">Settings</h1>
         
         <nav className="flex flex-wrap gap-3">
  <button
    onClick={() => setActiveTab("account")}
    className={`px-8 py-4 rounded-full text-[9px] font-black uppercase ${
      activeTab === "account"
        ? "bg-stone-900 text-white"
        : "bg-white border"
    }`}
  >
    Profile
  </button>

  {/* <button
    onClick={() => setActiveTab("brand")}
    className={`px-8 py-4 rounded-full text-[9px] font-black uppercase ${
      activeTab === "brand"
        ? "bg-stone-900 text-white"
        : "bg-white border"
    }`}
  >
    Brand DNA
  </button> */}

  {/* <button
    onClick={() => router.push('/settings/team')}
    className="px-8 py-4 rounded-full text-[9px] font-black uppercase bg-white border hover:bg-stone-50"
  >
    Team Hub
  </button> */}

  {/* <button
    onClick={() => router.push('/settings/import')}
    className="px-8 py-4 rounded-full text-[9px] font-black uppercase bg-white border hover:bg-stone-50"
  >
    Import Hub
  </button> */}
</nav>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
           <button onClick={handleLogout} className="w-full sm:w-auto px-8 py-5 rounded-full border text-[10px] font-black uppercase">Sign Out</button>
           <button
             onClick={() => router.push('/manage-subscription')}
             className="w-full sm:w-auto px-8 py-5 rounded-full border bg-white hover:bg-stone-50 text-[10px] font-black uppercase"
           >
             Manage Subscription
           </button>
           <button
             onClick={handleSave}
             disabled={isSaving}
             className="w-full sm:w-auto min-w-0 sm:min-w-[160px] accent-bg px-12 py-5 rounded-full text-white font-black uppercase text-[10px] disabled:opacity-50 flex items-center justify-center gap-2"
           >
             {isSaving && <Loader2 size={14} className="animate-spin" />}
             {isSaving ? "Saving..." : "Save Changes"}
           </button>
        </div>
      </header>

      {/* Main Content (Expansion Logic) */}
       {/* --- CONTENT WORKSPACE PANELS --- */}
      <main className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* VIEW: ACCOUNT DETAILS */}
          {activeTab === "account" && (
            <motion.div key="account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <section className="bg-white/90 backdrop-blur border border-stone-200 p-4 sm:p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] space-y-10 lg:space-y-16">
                
                {/* ADMINISTRATIVE DETAILS */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                  <div className="shrink-0 mx-auto lg:mx-0">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-[3rem] bg-[#faf9f6] border border-stone-100 flex items-center justify-center relative overflow-hidden">
                       <span className="text-4xl font-serif italic text-stone-200">
                         {displayName ? displayName.split(" ").map(n => n[0]).join("").toUpperCase() : "OS"}
                       </span>
                    </div>
                  </div>
                  <div className="flex-grow space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-4">Full Name</label>
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-5 bg-[#faf9f6] border border-stone-200 rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[var(--accent)] focus:border-stone-400 outline-none transition-all" />
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    {[
                      { key: "meta", name: "Meta Business Suite", subtitle: "Instagram & Facebook Pages", icons: [Instagram, Facebook] },
                      { key: "tiktok", name: "TikTok Studio Portal", subtitle: "Corporate Content Pipeline", icons: [Video] },
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
                            onClick={() =>
                              isConnected
                                ? disconnectSocialPlatform(platformObj.key)
                                : connectSocialPlatform(platformObj.key)
                            }
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
                  <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 items-end bg-[#faf9f6] p-4 lg:p-6 rounded-3xl border border-stone-100">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-white border border-stone-200 rounded-xl font-mono text-xs outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-400 ml-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full p-4 bg-white border border-stone-200 rounded-xl font-mono text-xs outline-none" />
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-2">
                      <button type="submit" disabled={isUpdatingPassword} className="w-full md:w-auto px-8 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                        {isUpdatingPassword && <Loader2 size={12} className="animate-spin" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
               </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Legal Hub (The 11 Documents) */}
      <section className="mt-20 pt-12 border-t border-stone-200">
        <h3 className="text-3xl font-serif italic mb-8">Legal Hub</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LegalDocCard
            title="Terms & Conditions"
            path={`/docs/${"termsconditions"}`}
          />
          <LegalDocCard
            title="Privacy Policy"
            path={`/docs/${"privacypolicy"}`}
          />
          <LegalDocCard
            title="AI Policy"
            path={`/docs/${"aipolicy"}`}
          />
          <LegalDocCard
            title="Beta Terms"
            path={`/docs/${"betaterms"}`}
          />
          <LegalDocCard
            title="Cancellation Policy"
            path={`/docs/${"cancellationpolicy"}`}
          />
          <LegalDocCard
            title="Community Guidelines"
            path={`/docs/${"communityguidelines"}`}
          />
          <LegalDocCard
            title="Cookies Policy"
            path={`/docs/${"cookies"}`}
          />
          <LegalDocCard
            title="Data Terms"
            path={`/docs/${"dataterms"}`}
          />
          <LegalDocCard
            title="Property Notice"
            path={`/docs/${"propertynotice"}`}
          />
          <LegalDocCard
            title="Security Policy"
            path={`/docs/${"securitypolicy"}`}
          />
          <LegalDocCard
            title="Service Policy"
            path={`/docs/${"servicepolicy"}`}
          />
        </div>
      </section>
    </div>
  );
}