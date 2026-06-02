
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
  const profileId = params?.id as string;
  const router = useRouter();
  const { organisationId } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error) {
        console.error("Profile error:", error);
        setProfile(null);
        return;
      }

      setProfile(data || null);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     LOAD TASKS
  --------------------------*/
  const fetchTasks = async () => {
    if (!profileId) return;

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("profile_id", profileId);

    setTasks(data || []);
  };

  /* -------------------------
     LOAD THREADS
  --------------------------*/
  const fetchThreads = async () => {
    if (!profileId) return;

    const { data } = await supabase
      .from("email_threads")
      .select("*")
      .eq("profile_id", profileId);

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

      // Only fetch org-dependent data if organisationId exists
      if (organisationId) {
        await fetchTasks();
        await fetchThreads();
      }
    });
  }, [profileId, organisationId]);

  useEffect(() => {
    if (!threads?.length) return;

    if (!activeThread) {
      setActiveThread(threads[0]);
      fetchMessages(threads[0].id);
    }
  }, [threads]);

  /* -------------------------
     GUARDS
  --------------------------*/
  if (!profileId) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400">
        Missing profile ID
      </div>
    );
  }

  if (loading || !profileId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400">
        Profile not found
      </div>
    );
  }

  /* -------------------------
     UI (MINIMAL SAFE RENDER)
  --------------------------*/
  return (
    <div className="min-h-screen bg-[#faf9f6] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <Link href="/crm" className="flex items-center gap-2 text-stone-500">
          <ArrowLeft size={14} />
          Back
        </Link>

        <h1 className="text-3xl font-bold">
          {profile.name || "Unnamed Profile"}
        </h1>

        <div className="bg-white p-6 rounded-xl border space-y-2">
          <p><Mail size={14} className="inline mr-2" /> {profile.email || "No email"}</p>
          <p><Phone size={14} className="inline mr-2" /> {profile.phone || "No phone"}</p>
          <p><Building2 size={14} className="inline mr-2" /> {profile.company_name || "No company"}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="font-bold mb-2">Tasks</h2>
            {tasks.length === 0 ? (
              <p className="text-stone-400">No tasks</p>
            ) : (
              tasks.map(t => (
                <div key={t.id} className="border-b py-2 text-sm">
                  {t.title}
                </div>
              ))
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border">
            <h2 className="font-bold mb-2">Email Threads</h2>
            {threads.length === 0 ? (
              <p className="text-stone-400">No threads</p>
            ) : (
              threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThread(t);
                    fetchMessages(t.id);
                  }}
                  className="block text-left w-full py-2 border-b text-sm"
                >
                  {t.subject}
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}