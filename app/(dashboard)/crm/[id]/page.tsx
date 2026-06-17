"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  User,
  Building2,
  Mail,
  ArrowLeft,
  Edit3,
  Loader2,
  Phone,
  MapPin,
  Zap,
  Calendar,
  Paperclip,
  Radio,
  Database,
  ListPlus,
  Send
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useSettings } from "@/app/context/SettingsContext";

export default function AccountProfilePage() {
  const params = useParams();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const router = useRouter();
  const { organisationId } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"info" | "tasks" | "email" | "timeline">("info");

  const [tasks, setTasks] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [showComposer, setShowComposer] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  const [subscriberLists, setSubscriberLists] = useState<any[]>([]);
  const [profileLists, setProfileLists] = useState<any[]>([]);
  const fetchProfileLists = async () => {
    if (!profileId) return;

    const { data, error } = await supabase
      .from("profile_subscriber_lists")
      .select("*")
      .eq("profile_id", profileId);

    if (error) {
      console.error("Profile subscriber lists error:", error);
      return;
    }

    setProfileLists(data || []);
  };
  const [selectedListId, setSelectedListId] = useState("");

  const [notes, setNotes] = useState<any[]>([]);
  const [noteForm, setNoteForm] = useState({ type: "internal", content: "" });


  const safeProfile = profile ?? {};

  const canManageInbox =
    safeProfile.role === "admin" || safeProfile.role === "manager";

  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    address: "",
    company_name: "",
    company_details: "",
    email_list: false
  });

  const [newEmail, setNewEmail] = useState({
    subject: "",
    body: "",
    attachment: null as File | null
  });

  /* ---------------- FETCH PROFILE ---------------- */
  const fetchProfile = async () => {
    if (!profileId || !organisationId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data);

    setEditForm({
      name: data?.name || "",
      role: data?.role || "user",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      company_name: data?.company_name || "",
      company_details: data?.company_details || "",
      email_list: data?.email_list || false
    });

    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("profile_id", profileId);

    setTasks(data || []);
  };

  const fetchThreads = async () => {
    const { data } = await supabase
      .from("email_threads")
      .select("*")
      .eq("profile_id", profileId);

    setThreads(data || []);
  };

  const fetchMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("email_messages")
      .select("*")
      .eq("thread_id", threadId);

    setMessages(data || []);
  };

  const fetchSubscriberLists = async () => {
    if (!organisationId) return;

    const { data } = await supabase
      .from("subscriber_lists")
      .select("id, name")
      .eq("organisation_id", organisationId);

    setSubscriberLists(data || []);

    if (data?.length && !selectedListId) {
      setSelectedListId(data[0].id);
    }
  };

  const fetchNotes = async () => {
    if (!profileId) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Notes fetch error:", error);
        setNotes([]);
        return;
      }

      setNotes(data || []);
    } catch (err) {
      console.error("Notes fetch exception:", err);
      setNotes([]);
    }
  };


  /* ---------------- INIT ---------------- */
  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchTasks();
      fetchThreads();
      fetchSubscriberLists();
      fetchNotes();
      fetchProfileLists();
    }
  }, [profileId, organisationId]);

  useEffect(() => {
    if (threads.length && !activeThread) {
      setActiveThread(threads[0]);
      fetchMessages(threads[0].id);
    }
  }, [threads]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.subject || !newEmail.body || emailSaving) return;
    if (!profile?.email) {
      alert('This contact does not have an email address.');
      return;
    }

    try {
      setEmailSaving(true);
      console.log('Sending email to:', safeProfile.email);
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: newEmail.subject.trim(),
          body: newEmail.body.trim()
        })
      });

      const result = await response.json().catch(() => null);
      console.log('Email API response:', result);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to send email");
      }

      let threadId = activeThread?.id;

      if (!threadId) {
        const { data, error } = await supabase
          .from("email_threads")
          .insert({
            profile_id: profileId,
            organisation_id: organisationId,
            subject: newEmail.subject
          })
          .select()
          .single();

        if (error) throw error;

        threadId = data.id;
        setActiveThread(data);
      }

      await supabase.from("email_messages").insert({
        thread_id: threadId,
        profile_id: profileId,
        organisation_id: organisationId,
        direction: "outbound",
        subject: newEmail.subject,
        body: newEmail.body,
        status: "sent"
      });

      setNewEmail({ subject: "", body: "", attachment: null });

      await fetchThreads();
      await fetchMessages(threadId);
    } catch (error) {
      console.error("Email send failed:", error);
      alert(`Failed to send email${error instanceof Error ? `: ${error.message}` : ". Please try again."}`);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);

    await supabase
      .from("profiles")
      .update(editForm)
      .eq("id", profileId);

    setProfile({ ...profile, ...editForm });
    setIsEditing(false);

    setIsSaving(false);
  };

  /* ---------------- UI ---------------- */
  const healthScore = (() => {
    const openTasks = tasks.filter(t => t.status !== "done").length;

    const lastMessageDate = messages?.[messages.length - 1]?.created_at;
    const lastContactPenalty =
      lastMessageDate ? 0 : 20;

    const taskScore = Math.max(0, 40 - openTasks * 5);

    const campaignScore = safeProfile.email_list ? 20 : 0;

    return Math.max(0, Math.min(100, taskScore + campaignScore - lastContactPenalty));
  })();

  const timelineEvents = [
    ...(messages || []).map(m => ({
      type: "email",
      created_at: m.created_at,
      title: m.subject || "Email",
      content: m.body,
    })),
    ...(notes || []).map(n => ({
      type: "note",
      created_at: n.created_at,
      title: n.type || "Note",
      content: n.content,
    })),
    ...(tasks || []).map(t => ({
      type: "task",
      created_at: t.created_at || t.due_date,
      title: t.title || "Task",
      content: t.description || "",
    })),
  ]
    .filter(e => e.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#faf9f6]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center text-stone-400">
        Contact not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-10 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">

        <Link href="/crm" className="text-xs uppercase tracking-widest text-stone-400">
          ← Back to CRM
        </Link>

        {/* HEADER */}
        <div className="bg-white/90 backdrop-blur border border-stone-200 p-10 rounded-[3rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-6">
  <div className="h-20 w-20 rounded-full bg-[#a9b897] text-white flex items-center justify-center text-2xl font-bold">
  {(safeProfile.name || "?").charAt(0).toUpperCase()}
</div>
            
            <div>
              {isEditing ? (
  <input
    className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
    value={editForm.name}
    onChange={(e) =>
      setEditForm({
        ...editForm,
        name: e.target.value
      })
    }
    placeholder="Full Name"
  />
) : (
  <h1 className="text-5xl font-serif italic">
    {safeProfile.name || "Unnamed Contact"}
  </h1>
)}
              <p className="text-stone-500">{safeProfile.email}</p>
              <p className="text-xs uppercase tracking-widest text-stone-400 mt-2">
                {safeProfile.company_name || "No company assigned yet"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setActiveTab("email");
                setShowComposer(true);
              }}
           className="px-5 py-3 rounded-2xl bg-[#a9b897] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition"
            >
              Send Email
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
           className="px-5 py-3 rounded-2xl border border-[#d8d0c2] bg-[#faf9f6] text-xs font-bold uppercase tracking-wider text-stone-700"
            >
              View Tasks
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 text-xs uppercase font-bold">
          {["info", "tasks", "email", "timeline"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-3 rounded-full transition border ${
                activeTab === tab
                  ? "bg-[#a9b897] text-white border-[#a9b897]"
                  : "bg-[#faf9f6] border-[#d8d0c2] hover:border-[#a9b897]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* INFO */}
        {activeTab === "info" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex justify-end">
  <button
    onClick={() => setIsEditing(!isEditing)}
    className="px-4 py-2 rounded-xl bg-[#a9b897] text-white text-xs font-semibold"
  >
    {isEditing ? "Cancel Editing" : "Edit Details"}
  </button>
</div>
            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-6">Contact Information</h3>
              <div className="space-y-4 text-sm">
              {isEditing ? (
  <>
    <input
      className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
      value={editForm.email}
      onChange={(e) =>
        setEditForm({ ...editForm, email: e.target.value })
      }
      placeholder="Email Address"
    />

    <input
      className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
      value={editForm.phone}
      onChange={(e) =>
        setEditForm({ ...editForm, phone: e.target.value })
      }
      placeholder="Phone Number"
    />

    <input
      className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
      value={editForm.address}
      onChange={(e) =>
        setEditForm({ ...editForm, address: e.target.value })
      }
      placeholder="Address"
    />
  </>
) : (
  <>
    <p><strong>Email Address:</strong> {safeProfile.email || "Not provided"}</p>
    <p><strong>Phone Number:</strong> {safeProfile.phone || "Not provided"}</p>
    <p><strong>Address:</strong> {safeProfile.address || "Not provided"}</p>
  </>
)}
 </div>
            </div>

            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-6">Business Information</h3>
              {isEditing ? (
  <>
    <input
      className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
      value={editForm.company_name}
      onChange={(e) =>
        setEditForm({ ...editForm, company_name: e.target.value })
      }
      placeholder="Company Name"
    />

    <input
      className="w-full p-3 border border-[#d8d0c2] rounded-xl bg-[#faf9f6]"
      value={editForm.role}
      onChange={(e) =>
        setEditForm({ ...editForm, role: e.target.value })
      }
      placeholder="Role"
    />

    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={editForm.email_list}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            email_list: e.target.checked
          })
        }
      />
      Subscribed to mailing list
    </label>
  </>
) : (
  <>
    <p><strong>Company:</strong> {safeProfile.company_name || "Not provided"}</p>
    <p><strong>Role:</strong> {safeProfile.role || "Client"}</p>
    <p><strong>Mailing List:</strong> {safeProfile.email_list ? "Subscribed" : "Not Subscribed"}</p>
  </>
)}
            </div>

            <div className="md:col-span-2 bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-6">Company Information & Notes</h3>
              {isEditing ? (
  <textarea
    className="w-full p-4 border border-[#d8d0c2] rounded-xl bg-[#faf9f6] min-h-[120px]"
    value={editForm.company_details}
    onChange={(e) =>
      setEditForm({
        ...editForm,
        company_details: e.target.value
      })
    }
  />
) : (
  <p className="text-stone-600 leading-relaxed">
    {safeProfile.company_details || "No notes have been added yet."}
  </p>
)}

{isEditing && (
  <div className="mt-6 flex justify-end">
    <button
      onClick={handleUpdate}
      disabled={isSaving}
      className="px-6 py-3 rounded-xl bg-[#a9b897] text-white font-semibold disabled:opacity-50"
    >
      {isSaving ? "Saving Changes..." : "Save Changes"}
    </button>
  </div>
)}
            </div>
          </div>
        )}

        {/* TASKS */}
        {activeTab === "tasks" && (
          <>
          <div className="mb-8 p-6 rounded-2xl bg-[#a9b897]/10 border border-[#a9b897]/20">
            <h3 className="font-semibold text-stone-900 mb-2">Project Activity</h3>
            <p className="text-sm text-stone-600">
              Track deliverables, deadlines and client actions linked to this contact.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur p-10 rounded-[2rem] border border-stone-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400">Tasks</h3>
              <span className="px-3 py-1 rounded-full bg-stone-100 text-xs">
                {tasks.length} Active
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                No tasks assigned to this contact.
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(t => (
                  <div key={t.id} className="p-5 border border-stone-200 rounded-2xl bg-white">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">{t.title}</h4>
                      <span className="px-3 py-1 rounded-full bg-[#a9b897]/20 text-xs text-stone-700">
                        {t.status || "todo"}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-sm text-stone-500 mt-2">{t.description}</p>
                    )}
                    {t.due_date && (
                      <p className="text-xs text-stone-400 mt-3">
                        Due: {format(new Date(t.due_date), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}

        {/* EMAIL */}
        {activeTab === "email" && (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6 min-h-[700px]">

            <div className="bg-white/90 backdrop-blur p-6 rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Inbox</h3>
                <span className="text-xs text-stone-400">{threads.length}</span>
              </div>
              {threads.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThread(t);
                    fetchMessages(t.id);
                  }}
                  className={`block w-full text-left p-3 rounded-xl transition ${activeThread?.id === t.id ? 'bg-[#a9b897] text-white' : 'hover:bg-[#f3f0ea]'}`}
                >
                  <div>
                    <div className="font-medium truncate">{t.subject}</div>
                    <div className="text-xs opacity-70 truncate">
                      Email conversation
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white/90 backdrop-blur p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    {activeThread?.subject || "New Conversation"}
                  </h2>
                  <p className="text-xs text-stone-400">
                    {safeProfile.email}
                  </p>
                </div>

                <button
                  onClick={() => setShowComposer(v => !v)}
                  className="px-4 py-2 rounded-xl bg-[#a9b897] text-white text-xs hover:opacity-90 transition"
                >
                  {showComposer ? "Hide Composer" : "Reply"}
                </button>
              </div>

              {showComposer && (
              <>
              <form onSubmit={handleSendEmail} className="mt-4 space-y-2">
                <input
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  placeholder="Subject"
                  value={newEmail.subject}
                  onChange={e => setNewEmail({ ...newEmail, subject: e.target.value })}
                />
                <textarea
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  placeholder="Message"
                  value={newEmail.body}
                  onChange={e => setNewEmail({ ...newEmail, body: e.target.value })}
                />
                {emailSaving && (
                  <div className="text-xs text-stone-500 text-center">
                    Sending email...
                  </div>
                )}
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="w-full bg-[#a9b897] text-white py-3 rounded-xl disabled:opacity-50"
                >
                  {emailSaving ? "Sending..." : "Send Email"}
                </button>
              </form>
              </>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
  {messages.length === 0 ? (
    <div className="text-sm text-stone-400 text-center py-8">
      No messages in this conversation yet.
    </div>
  ) : (
    messages.map((message) => (
      <div
        key={message.id}
        className={`p-4 rounded-2xl border ${
          message.direction === "outbound"
            ? "bg-[#a9b897]/10 border-[#a9b897]/20"
            : "bg-stone-50 border-stone-200"
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider text-stone-400">
            {message.direction === "outbound" ? "Sent" : "Received"}
          </span>
          <span className="text-xs text-stone-400">
            {message.created_at
              ? format(new Date(message.created_at), "dd MMM yyyy HH:mm")
              : ""}
          </span>
        </div>

        {message.subject && (
          <div className="font-semibold text-sm mb-2">
            {message.subject}
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap text-stone-700">
          {message.body}
        </div>
      </div>
    ))
  )}
</div>
              <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-400">
                {messages.length} messages in this conversation
              </div>
            </div>

          </div>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-6">

            {/* HEALTH SCORE */}
            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-4">
                Client Health Score
              </h3>
              <div className="text-4xl font-bold">{healthScore}/100</div>
              <p className="text-xs text-stone-400 mt-2">
                Based on tasks, engagement and campaign activity
              </p>
            </div>

            {/* ACTIVITY FEED */}
            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-4">
                Activity Feed
              </h3>

              <div className="space-y-4">
                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-stone-400">No activity yet.</p>
                ) : (
                  timelineEvents.map((event, idx) => (
                    <div key={idx} className="p-4 border rounded-xl bg-white">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs uppercase text-stone-400">
                          {event.type}
                        </span>
                        <span className="text-xs text-stone-400">
                          {event.created_at ? new Date(event.created_at).toLocaleString() : ""}
                        </span>
                      </div>

                      <div className="font-medium text-sm">{event.title}</div>
                      {event.content && (
                        <div className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {event.content}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* NOTES */}
            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-4">
                Internal Notes
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!noteForm.content) return;

                  const { data } = await supabase.from("notes").insert({
                    profile_id: profileId,
                    organisation_id: organisationId,
                    type: noteForm.type,
                    content: noteForm.content
                  }).select().single();

                  setNotes([data, ...notes]);
                  setNoteForm({ type: "internal", content: "" });
                }}
                className="space-y-2 mb-6"
              >
                <select
                  value={noteForm.type}
                  onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="internal">Internal</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                </select>

                <textarea
                  className="w-full p-3 border rounded-xl"
                  placeholder="Add a note..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                />

                <button className="px-4 py-2 bg-[#a9b897] text-white rounded-xl text-xs hover:opacity-90 transition">
                  Add Note
                </button>
              </form>

              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className="p-4 border rounded-xl bg-white">
                    <div className="text-xs text-stone-400 uppercase">{n.type}</div>
                    <div className="text-sm">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CAMPAIGN MEMBERSHIP */}
            <div className="bg-white/90 backdrop-blur p-8 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-4">
                Mailing List Membership
              </h3>

              <div className="space-y-2">
                {(subscriberLists || []).map(list => {
                  const isMember = profileLists.some(
                    (x: any) => x.subscriber_list_id === list.id
                  );

                  return (
                    <div key={list.id} className="flex justify-between items-center p-3 border rounded-xl">
                      <span>{list.name}</span>

                      <button
                        disabled={!organisationId}
                        onClick={
                          async () => {
                            if (!organisationId || !profileId) return;

                            try {
                              if (isMember) {
                                const { error } = await supabase
                                  .from("profile_subscriber_lists")
                                  .delete()
                                  .eq("profile_id", profileId)
                                  .eq("subscriber_list_id", list.id);

                                if (error) console.error("Remove list error:", error);
                              } else {
                                const { error } = await supabase
                                  .from("profile_subscriber_lists")
                                  .insert({
                                    profile_id: profileId,
                                    subscriber_list_id: list.id,
                                    organisation_id: organisationId
                                  });

                                if (error) console.error("Add list error:", error);
                              }

                              fetchProfileLists();
                            } catch (err) {
                              console.error("Membership toggle exception:", err);
                            }
                          }
                        }
                        className={`text-xs px-3 py-1 rounded-lg border ${!organisationId ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isMember ? "Remove" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}