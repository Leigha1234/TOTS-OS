
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  User, Building2, Mail, ArrowLeft,
  Edit3, Loader2, Phone, MapPin, Zap, Calendar, Paperclip, Radio, Database, ListPlus
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useSettings } from "@/app/context/SettingsContext";

export default function AccountProfilePage() {
  const params = useParams();
  // Fix profileId extraction (handles array/undefined)
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { organisationId } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Optional stability improvement
  const [initialised, setInitialised] = useState(false);

  const [tasks, setTasks] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<"info" | "tasks" | "email">("info");

  const safeProfile = profile || {};

  const canManageInbox = safeProfile?.role === "admin" || safeProfile?.role === "manager";

  /* -------------------------
     SAFE FETCH WRAPPER
  --------------------------*/
  const safeFetch = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  /* -------------------------
     LOAD PROFILE
  --------------------------*/
  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fix profile fetch (use organisation filter + maybeSingle)
      const query = supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId);

      if (organisationId) {
        query.eq("organisation_id", organisationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Profile error:", error);
        setProfile(null);
        return;
      }

      setProfile(data || null);
    } finally {
      setLoading(false);
      setInitialised(true);
    }
  };

  /* -------------------------
     LOAD TASKS
  --------------------------*/
  const fetchTasks = async () => {
    // Fix tasks fetch (add organisation guard + safer query)
    if (!profileId) return;
    if (!organisationId) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("profile_id", profileId)
      .eq("organisation_id", organisationId);

    setTasks(data || []);
  };

  /* -------------------------
     LOAD THREADS
  --------------------------*/
  const fetchThreads = async () => {
    // Fix threads fetch similarly
    if (!profileId) return;
    if (!organisationId) return;

    const { data } = await supabase
      .from("email_threads")
      .select("*")
      .eq("profile_id", profileId)
      .eq("organisation_id", organisationId);

    setThreads(data || []);
  };

  const fetchMessages = async (threadId: string) => {
    if (!threadId) return;

    const { data } = await supabase
      .from("email_messages")
      .select("*")
      .eq("thread_id", threadId);

    setMessages(data || []);
  };

  /* -------------------------
     INIT
  --------------------------*/
  useEffect(() => {
    if (!profileId) return;

    safeFetch(async () => {
      await fetchProfile();

      if (organisationId) {
        await Promise.all([
          fetchTasks(),
          fetchThreads()
        ]);
      }
    });
  }, [profileId, organisationId]);

  useEffect(() => {
    if (!threads?.length) return;

    if (!activeThread && threads[0]?.id) {
      setActiveThread(threads[0]);
      fetchMessages(threads[0].id);
    }
  }, [threads, activeThread]);

  /* -------------------------
     GUARDS
  --------------------------*/
  // Add early safe guard for missing profileId
  if (!profileId) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400">
        Loading profile...
      </div>
    );
  }

  // Use initialised for stability improvement
  if (!initialised || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // Improve error resilience in profile guard render
  if (!profile && !loading) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400">
        Profile not found or access denied
      </div>
    );
  }

  /* UI (MINIMAL SAFE RENDER) */
  return (
    <div className="min-h-screen bg-[#faf9f6] p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* BACK BUTTON */}
        <Link href="/crm" className="flex items-center gap-2 text-stone-500">
          <ArrowLeft size={14} />
          Back to CRM
        </Link>

        {/* PROFILE HEADER */}
        <div className="bg-white border rounded-2xl p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {profile.name || "Unnamed Profile"}
              </h1>
              <p className="text-sm text-stone-500">
                {profile.role || "Contact"} • {profile.email}
              </p>
            </div>

            <div className="text-right text-xs text-stone-400">
              <p>ID: {profile.id}</p>
              <p>Org: {profile.organisation_id}</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm text-stone-600 mt-3">
            <span><Mail size={14} className="inline mr-1" /> {profile.email || "No email"}</span>
            <span><Phone size={14} className="inline mr-1" /> {profile.phone || "No phone"}</span>
            <span><Building2 size={14} className="inline mr-1" /> {profile.company_name || "No company"}</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b">
          {["info", "tasks", "email"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-stone-900 text-stone-900"
                  : "text-stone-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="space-y-6">

          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border space-y-2">
                <h2 className="font-bold">Profile Details</h2>
                <p className="text-sm">Role: {profile.role || "N/A"}</p>
                <p className="text-sm">Company: {profile.company_name || "N/A"}</p>
                <p className="text-sm">Phone: {profile.phone || "N/A"}</p>
                <p className="text-sm">Created: {profile.created_at ? format(new Date(profile.created_at), "PPP") : "N/A"}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border space-y-2">
                <h2 className="font-bold">Organisation</h2>
                <p className="text-sm">{profile.organisation_id || "N/A"}</p>

                <h2 className="font-bold mt-4">Brand Settings</h2>
                <p className="text-sm">Primary: {profile.brand_color || "N/A"}</p>
                <p className="text-sm">Secondary: {profile.secondary_color || "N/A"}</p>
                <p className="text-sm">Font: {profile.font_family || "Default"}</p>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="bg-white p-4 rounded-xl border space-y-2">
              <h2 className="font-bold">Tasks</h2>
              {tasks.length === 0 ? (
                <p className="text-stone-400">No tasks found</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="border-b py-2 text-sm">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-stone-400">{t.status || "pending"}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === "email" && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* THREADS */}
              <div className="bg-white p-4 rounded-xl border">
                <h2 className="font-bold mb-2">Threads</h2>
                {threads.length === 0 ? (
                  <p className="text-stone-400">No threads</p>
                ) : (
                  threads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveThread(t);
                        fetchMessages(t.id);
                      }}
                      className="block w-full text-left py-2 border-b text-sm"
                    >
                      {t.subject}
                    </button>
                  ))
                )}
              </div>

              {/* MESSAGES */}
              <div className="bg-white p-4 rounded-xl border">
                <h2 className="font-bold mb-2">Messages</h2>
                {!messages.length ? (
                  <p className="text-stone-400">Select a thread</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="border-b py-2 text-sm">
                      {m.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}