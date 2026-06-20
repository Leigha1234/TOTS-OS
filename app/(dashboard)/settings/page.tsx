"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, useCallback, type FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import SocialConnections from "@/app/components/SocialConnections";
import PasswordSection from "@/app/components/PasswordSection";
import LegalHub from "@/app/components/LegalHub";

/**
 * TOTS OS: UNIFIED ADMINISTRATIVE CONTROL CENTER v8.0.0
 * FULL SCALE IMPLEMENTATION
 */

function SettingsInner() {
  const isMountedRef = useRef(true);
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
  const connectedPlatformsRef = useRef<string[]>([]);
  const isOAuthProcessingRef = useRef(false);
const [connectionHealth, setConnectionHealth] = useState<
  Record<string, "connected" | "disconnected" | "unknown" | "expired">
>({});
  const [postQueue, setPostQueue] = useState<any[]>([]);
  const [showConnectedModal, setShowConnectedModal] = useState(false);
  const [connectedPlatformModal, setConnectedPlatformModal] = useState<string | null>(null);

  // --- REFS FOR SOCIAL ENGINE ---
  const channelRef = useRef<any>(null);
  const subscribedRef = useRef(false);
  const engineIntervalRef = useRef<any>(null);
  const tokenIntervalRef = useRef<any>(null);
const getOAuthStorageKey = (platform: string) =>
  platform === "meta"
    ? "oauth_pending_meta"
    : `oauth_pending_${platform}`;
const refreshConnections = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isMountedRef.current) return;

  const { data: connections } = await supabase
    .from("social_accounts")
    .select("platform")
    .eq("user_id", user.id);

  if (connections) {
    const platforms = connections.map((c: any) => c.platform);
    setConnectedPlatforms(platforms);
    connectedPlatformsRef.current = platforms;

    await verifyConnections();
  }
};

const refreshSocialToken = async (platform: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isMountedRef.current) return false;

    const { data } = await supabase
      .from("social_accounts")
      .select("refresh_token")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .maybeSingle();

    if (!data?.refresh_token) return false;

    const res = await fetch("/api/oauth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        refresh_token: data.refresh_token,
        userId: user.id,
      }),
    });

    if (!res.ok) return false;

    const tokens = await res.json();

    const { error } = await supabase
      .from("social_accounts")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || data.refresh_token,
        expires_at: tokens.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", platform);

    if (error) return false;

    return true;
  } catch (err) {
    console.warn("Token refresh failed:", platform, err);
    return false;
  }
};

const verifyPendingOAuth = async () => {
  const pending = ["meta", "linkedin", "tiktok"].filter((p) =>
    sessionStorage.getItem(getOAuthStorageKey(p)) === "true"
  );

  if (pending.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  for (const platform of pending) {
    try {
      const { data } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .maybeSingle();

      if (data?.id) {
        sessionStorage.removeItem(
          getOAuthStorageKey(platform)
        );

        // Immediately update connection state so UI updates to "Connected"
        await verifyConnections();
        setConnectedPlatforms((prev) =>
          prev.includes(platform) ? prev : [...prev, platform]
        );

        // UX feedback: confirm successful connection detection
        toast.success(`${platform} connected successfully`);
      }
    } catch (err) {
      console.warn("OAuth verify failed:", platform, err);
    }
  }
};

const exchangeOAuthCode = async (platform: string, code: string, state: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    if (!isMountedRef.current) return false;

    let parsedState: any;

try {
  parsedState = JSON.parse(decodeURIComponent(state));
} catch {
  throw new Error("Invalid OAuth state format");
}

if (parsedState.userId !== user.id) {
  throw new Error("OAuth user mismatch - potential CSRF risk");
}

if (parsedState.platform !== platform) {
  throw new Error("OAuth platform mismatch detected");
}
    // Call backend token exchange endpoint (Edge Function / API route)
    const res = await fetch("/api/oauth/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        code,
        state,
        userId: user.id,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "OAuth exchange failed");
    }

    const data = await res.json();

    // Expected: { access_token, refresh_token, expires_at }
    const { access_token, refresh_token, expires_at } = data || {};

    if (!access_token) {
      throw new Error("Missing access token from OAuth exchange");
    }

    // Store securely in Supabase (server-side encrypted column expected)
    const { error } = await supabase.from("social_accounts").upsert({
      user_id: user.id,
      platform,
      access_token,
      refresh_token: refresh_token || null,
      expires_at: expires_at || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    // Cleanup OAuth session state
    sessionStorage.removeItem(
      getOAuthStorageKey(platform)
    );
    sessionStorage.removeItem("oauth_started_at");

    return true;
  } catch (err: any) {
    console.error("OAuth exchange error:", err);
    toast.error(err.message || "OAuth exchange failed");
    return false;
  }
};

const verifyConnections = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const health: Record<string, "connected" | "disconnected" | "unknown" | "expired"> = {
    meta: "unknown",
    linkedin: "unknown",
    tiktok: "unknown",
  };

  if (!user || !isMountedRef.current) {
    if (isMountedRef.current) setConnectionHealth(health);
    return;
  }

  const { data: connections, error } = await supabase
    .from("social_accounts")
    .select("platform, expires_at")
    .eq("user_id", user.id);

  if (error || !connections) {
    setConnectionHealth(health);
    return;
  }

  const now = Date.now();

  for (const connection of connections as any[]) {
    const platform = connection.platform;
    const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : null;

    if (!platform) continue;

    // expired token handling
    if (expiresAt && expiresAt < now) {
      const refreshed = await refreshSocialToken(platform);

      if (refreshed) {
        health[platform] = "connected";
      } else {
        health[platform] = "expired";
      }

      continue;
    }

    health[platform] = "connected";
  }

  ["meta", "linkedin", "tiktok"].forEach((platform) => {
    if (health[platform] !== "connected" && health[platform] !== "expired") {
      health[platform] = "disconnected";
    }
  });

  setConnectionHealth(health);
};

// ===============================
// SOCIAL ENGINE v6 — POSTING CORE
// ===============================

const publishToPlatform = async (
  platform: string,
  content: string,
  media?: any
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const res = await fetch("/api/social/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform,
      content,
      media: media || null,
      userId: user.id,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Post failed");
  }

  return await res.json();
};

const postToSocial = async (content: string, platforms: string[]) => {
  const results: any[] = [];

  for (const platform of platforms) {
    try {
      const result = await publishToPlatform(platform, content);
      results.push({ platform, status: "success", result });
    } catch (err: any) {
      results.push({ platform, status: "failed", error: err.message });
    }
  }

  return results;
};

const scheduleSocialPost = async (
  caption: string,
  platforms: string[],
  scheduledFor: Date
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("scheduled_posts").insert({
    user_id: user.id,
    caption,
    platforms,
    scheduled_for: scheduledFor.toISOString(),
    status: "scheduled",
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  setPostQueue((prev) => [
    ...prev,
    { caption, platforms, scheduledFor }
  ]);

  return true;
};

// ===============================
// SOCIAL ENGINE v7 — SCHEDULER RUNTIME
// ===============================

const processScheduledPosts = async () => {
  if (!isMountedRef.current) return;
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (error || !posts) return;

  for (const post of posts) {
    try {
      await supabase
        .from("scheduled_posts")
        .update({ status: "processing" })
        .eq("id", post.id);

      const results = await postToSocial(post.caption, post.platforms || []);

      const failed = results.filter((r: any) => r.status === "failed");

      await supabase
        .from("scheduled_posts")
        .update({
          status: failed.length === 0 ? "posted" : "failed",
          published_at: failed.length === 0 ? new Date().toISOString() : null,
          error_message: failed.length ? JSON.stringify(failed) : null,
        })
        .eq("id", post.id);

    } catch (err: any) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: err.message,
        })
        .eq("id", post.id);
    }
  }
};

const retryFailedPosts = async () => {
  if (!isMountedRef.current) return;
  const { data: posts } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "failed");

  if (!posts) return;

  for (const post of posts) {
    try {
      const results = await postToSocial(post.caption, post.platforms || []);

      const failed = results.filter((r: any) => r.status === "failed");

      await supabase
        .from("scheduled_posts")
        .update({
          status: failed.length === 0 ? "posted" : "failed",
          error_message: failed.length ? JSON.stringify(failed) : null,
          published_at: new Date().toISOString(),
        })
        .eq("id", post.id);

    } catch (err: any) {
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: err.message,
        })
        .eq("id", post.id);
    }
  }
};

  // -- 3. PASSWORD / AUTH --
  // REMOVED: oldPassword state

  // -- 4. DATA FETCHING --
  // --- Handler for window focus ---
  const handleFocus = async () => {
    if (!isMountedRef.current) return;
    try {
      await refreshConnections();
      await verifyPendingOAuth();
      await verifyConnections();

      ["meta", "linkedin", "tiktok"].forEach((p) => {
        if (!connectedPlatformsRef.current.includes(p)) return;
        sessionStorage.removeItem(
          getOAuthStorageKey(p)
        );
      });
    } catch (err) {
      console.warn("Focus sync failed:", err);
    }
  };

  // --- Handler for document visibility ---
  const triggerBackendScheduler = async () => {
    try {
      await fetch("/api/social/worker/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.warn("Scheduler trigger failed:", err);
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      triggerBackendScheduler();
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
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
        setUserOrgId(profile.organisation_id ?? null);

        // Prevent unsafe execution if component unmounted
        if (isMountedRef.current) {
          try {
            await refreshConnections();
            await verifyPendingOAuth();
          } catch (err) {
            console.warn("Init connection refresh failed:", err);
          }
        }
      }
      setLoading(false);
    }
    init();
    // Clean Meta OAuth redirect artifact (#_=_) on load
    if (typeof window !== "undefined" && window.location.hash === "#_=_") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleVisibility);

    // ===============================
    // REAL-TIME SOCIAL CONNECTION SYNC (MULTI-TENANT SAFE)
    // ===============================
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMountedRef.current) return;

      // Prevent duplicate subscriptions (React StrictMode / re-renders safe)
      if (subscribedRef.current) return;
      subscribedRef.current = true;

      // Cleanup any existing channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`social_accounts_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "social_accounts",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            await refreshConnections();
            await verifyConnections();
          }
        );

      channel.subscribe();
      channelRef.current = channel;
    };

    setupRealtime();

    // ===============================
    // LEVEL 2 SOCIAL ENGINE (AUTOMATION CORE)
    // ===============================

    // Runs scheduled posts every 60 seconds
    engineIntervalRef.current = setInterval(async () => {
      try {
        await processScheduledPosts();
        await retryFailedPosts();
      } catch (err) {
        console.warn("Engine tick failed:", err);
      }
    }, 60_000);

    // Refresh tokens every 15 minutes (multi-platform safe)
    tokenIntervalRef.current = setInterval(async () => {
      try {
        const platforms = ["meta", "linkedin", "tiktok"];
        for (const p of platforms) {
          await refreshSocialToken(p);
        }
      } catch (err) {
        console.warn("Token refresh cycle failed:", err);
      }
    }, 15 * 60 * 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleVisibility);

      if (engineIntervalRef.current) clearInterval(engineIntervalRef.current);
      if (tokenIntervalRef.current) clearInterval(tokenIntervalRef.current);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      subscribedRef.current = false;
    };
  }, [router]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isOAuthProcessingRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) return;

    const handleOAuthCallback = async () => {
      if (isOAuthProcessingRef.current) return;
      isOAuthProcessingRef.current = true;

      try {
        let parsed: any;

        try {
          parsed = JSON.parse(decodeURIComponent(state));
        } catch {
          console.error("Invalid OAuth state format");
          isOAuthProcessingRef.current = false;
          return;
        }

        const platform = parsed.platform;
        const userId = parsed.userId;

        if (!platform || !userId) {
          isOAuthProcessingRef.current = false;
          return;
        }

        const success = await exchangeOAuthCode(platform, code, state);

        if (success) {
          try {
            // 🚨 CRITICAL: immediately clean URL to prevent callback re-trigger loop
            window.history.replaceState({}, document.title, window.location.pathname);

            // 1. Force DB sync FIRST
            await supabase.auth.refreshSession();

            // 2. Wait for database propagation
            await new Promise((res) => setTimeout(res, 600));

            // 3. Refresh connections (must reflect DB)
            await refreshConnections();

            // 4. Verify actual connection state
            await verifyConnections();

            // 5. Confirm platform is actually in DB
            const platformsCheck = await supabase
              .from("social_accounts")
              .select("platform")
              .eq("user_id", userId)
              .eq("platform", platform)
              .maybeSingle();

            if (platformsCheck.data) {
              toast.success(`${platform} connected successfully`);
              setConnectedPlatformModal(platform);
              setShowConnectedModal(true);
            }

            // ❌ IMPORTANT: remove router.replace entirely (this was causing redirect loops)
            // ❌ DO NOT re-navigate - URL is already cleaned above

          } catch (err) {
            console.warn("Post-OAuth sync failed:", err);
            toast.error("Connection completed but UI sync failed");
          } finally {
            isOAuthProcessingRef.current = false;
          }
        } else {
          isOAuthProcessingRef.current = false;
        }
      } catch (err) {
        console.warn("OAuth callback handling failed:", err);
        isOAuthProcessingRef.current = false;
      }
    };

    handleOAuthCallback();
  }, []);

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

    setConnectedPlatforms((prev) => {
      const updated = prev.filter((p) => p !== key);
      connectedPlatformsRef.current = updated;
      return updated;
    });
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

{/* MAINTENANCE NOTICE */}
<div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">
  <p className="text-[10px] font-black uppercase tracking-widest">
    Social Connections is currently in maintenance
  </p>
</div>

                {/* --- CONNECT SOCIALS COMPONENT ROW --- */}
                <div className="pt-10 border-t border-stone-100">
                  <SocialConnections />
                </div>

                {/* --- SECURE PASSWORD ALTERATION MATRICES --- */}
                <div className="pt-10 border-t border-stone-100">
                  <PasswordSection />
                </div>
               </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Legal Hub (The 11 Documents) */}
      <section className="mt-20 pt-12 border-t border-stone-200">
        <LegalHub />
      </section>
    </div>
  );
}
export default function Settings() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-stone-400" size={28} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Loading Settings
          </p>
        </div>
      </div>
    }>
      <SettingsInner />
    </Suspense>
  );
}

