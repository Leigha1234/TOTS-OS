"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileText,
  Loader2,
  Mail,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useSettings } from "@/app/context/SettingsContext";

// ============================================================
// TYPES
// ============================================================

type ClientTab =
  | "overview"
  | "projects"
  | "money"
  | "tasks"
  | "email"
  | "info"
  | "timeline";

type ContactRecord = {
  id: string;
  organisation_id: string;
  customer_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  company_name?: string | null;
  company_details?: string | null;
  role?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CustomerRecord = {
  id: string;
  organisation_id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  stage?: string | null;
  status?: string | null;
  address?: string | null;
  client_type?: string | null;
};

type ProjectRecord = {
  id: string;
  name: string;
  status?: string | null;
  due_date?: string | null;
  customer_id?: string | null;
  organisation_id?: string | null;
};

type FinanceRecord = {
  id: string;
  amount?: number | string | null;
  status?: string | null;
  date?: string | null;
  due_date?: string | null;
  description?: string | null;
  project_id?: string | null;
  customer_id?: string | null;
};

type TaskRecord = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  project_id?: string | null;
  contact_id?: string | null;
  customer_id?: string | null;
  organisation_id?: string | null;
  user_id?: string | null;
  due_date?: string | null;
  created_at?: string | null;
};

type EmailThreadRecord = {
  id: string;
  profile_id?: string | null;
  organisation_id?: string | null;
  contact_id?: string | null;
  subject?: string | null;
  status?: string | null;
  created_at?: string | null;
  last_message_at?: string | null;
};

type EmailMessageRecord = {
  id: string;
  thread_id: string;
  profile_id?: string | null;
  organisation_id?: string | null;
  direction?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: string | null;
  from_email?: string | null;
  created_at?: string | null;
};

type NoteRecord = {
  id: string;
  content: string;
  type?: string | null;
  created_at?: string | null;
  contact_id?: string | null;
  organisation_id?: string | null;
};

type TimelineRecord = {
  id: string;
  contact_id?: string | null;
  organisation_id?: string | null;
  type?: string | null;
  title?: string | null;
  content?: string | null;
  created_at?: string | null;
};

// ============================================================
// PAGE
// ============================================================

export default function AccountProfilePage() {
  const params = useParams();
  const contactId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { organisationId } = useSettings();

  // ==========================================================
  // MAIN STATE
  // ==========================================================

  const [contact, setContact] = useState<ContactRecord | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [pageError, setPageError] = useState<string | null>(null);

  // ==========================================================
  // COMMERCIAL CLIENT STATE
  // ==========================================================

  const [linkedCustomer, setLinkedCustomer] = useState<CustomerRecord | null>(null);
  const [clientProjects, setClientProjects] = useState<ProjectRecord[]>([]);
  const [clientQuotes, setClientQuotes] = useState<FinanceRecord[]>([]);
  const [clientInvoices, setClientInvoices] = useState<FinanceRecord[]>([]);
  const [clientExpenses, setClientExpenses] = useState<FinanceRecord[]>([]);
  const [clientDataLoading, setClientDataLoading] = useState(false);

  // ==========================================================
  // TASKS
  // ==========================================================

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [taskCommentThreads, setTaskCommentThreads] = useState<Record<string, any[]>>({});
  const [newTask, setNewTask] = useState({ title: "", description: "", project_id: "" });

  // ==========================================================
  // EMAIL
  // ==========================================================

  const [threads, setThreads] = useState<EmailThreadRecord[]>([]);
  const [activeThread, setActiveThread] = useState<EmailThreadRecord | null>(null);
  const [messages, setMessages] = useState<EmailMessageRecord[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [newEmail, setNewEmail] = useState({ subject: "", body: "" });

  // ==========================================================
  // EDITING
  // ==========================================================

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    company_name: "",
    company_details: "",
  });

  // ==========================================================
  // NOTES / TIMELINE
  // ==========================================================

  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<TimelineRecord[]>([]);
  const [noteForm, setNoteForm] = useState({ type: "internal", content: "" });
  const [timelineEntry, setTimelineEntry] = useState("");

  // ==========================================================
  // MAILING LISTS
  // ==========================================================

  const [subscriberLists, setSubscriberLists] = useState<any[]>([]);
  const [profileLists, setProfileLists] = useState<any[]>([]);

  // ==========================================================
  // SAFE PROFILE
  // ==========================================================

  const safeProfile: Partial<ContactRecord> = contact ?? {};

  // ==========================================================
  // HELPERS
  // ==========================================================

  const clearCommercialData = useCallback(() => {
    setLinkedCustomer(null);
    setClientProjects([]);
    setClientQuotes([]);
    setClientInvoices([]);
    setClientExpenses([]);
  }, []);

  const formatCurrency = (value: number | string | null | undefined) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  // ==========================================================
  // PROJECT MAP
  // ==========================================================

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    clientProjects.forEach((project) => {
      map[project.id] = project.name;
    });
    return map;
  }, [clientProjects]);

  // ==========================================================
  // CLIENT METRICS
  // ==========================================================

  const activeProjects = useMemo(() => {
    return clientProjects.filter((project) => {
      const status = String(project.status || "").trim().toLowerCase();
      return !["completed", "done", "archived"].includes(status);
    });
  }, [clientProjects]);

  const quotedTotal = useMemo(() => {
    return clientQuotes.reduce((total, quote) => total + Number(quote.amount || 0), 0);
  }, [clientQuotes]);

  const invoicedTotal = useMemo(() => {
    return clientInvoices.reduce((total, invoice) => total + Number(invoice.amount || 0), 0);
  }, [clientInvoices]);

  const paidTotal = useMemo(() => {
    return clientInvoices
      .filter((invoice) => String(invoice.status || "").trim().toLowerCase() === "paid")
      .reduce((total, invoice) => total + Number(invoice.amount || 0), 0);
  }, [clientInvoices]);

  const outstandingTotal = Math.max(invoicedTotal - paidTotal, 0);

  const expensesTotal = useMemo(() => {
    return clientExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  }, [clientExpenses]);

  const openTasks = useMemo(() => {
    return tasks.filter(
      (task) => !["done", "completed", "complete"].includes(String(task.status || "").trim().toLowerCase())
    );
  }, [tasks]);

  const isMailingListMember = profileLists.length > 0;

  // ==========================================================
  // CLIENT SUMMARY
  // ==========================================================

  const clientSummary = useMemo(() => {
    if (contact?.role !== "client" && !linkedCustomer) {
      return "This contact is stored in your CRM but is not currently a commercial client. Their notes, tasks, email and relationship history are still available here.";
    }

    if (!linkedCustomer) {
      return "This client contact is not yet connected to a customer record, so commercial data cannot be linked to them yet.";
    }

    const pieces: string[] = [];

    pieces.push(`${activeProjects.length} ${activeProjects.length === 1 ? "active project" : "active projects"}`);

    if (quotedTotal > 0) pieces.push(`${formatCurrency(quotedTotal)} quoted`);
    if (invoicedTotal > 0) pieces.push(`${formatCurrency(invoicedTotal)} invoiced`);
    if (paidTotal > 0) pieces.push(`${formatCurrency(paidTotal)} paid`);
    if (outstandingTotal > 0) pieces.push(`${formatCurrency(outstandingTotal)} outstanding`);
    if (openTasks.length > 0) pieces.push(`${openTasks.length} ${openTasks.length === 1 ? "open task" : "open tasks"}`);

    return pieces.join(" · ");
  }, [
    contact?.role,
    linkedCustomer,
    activeProjects.length,
    quotedTotal,
    invoicedTotal,
    paidTotal,
    outstandingTotal,
    openTasks.length,
  ]);

  // ==========================================================
  // FETCH COMMERCIAL DATA
  // ==========================================================

  /**
   * IMPORTANT
   *
   * We no longer search customers by email.
   *
   * Correct relationship:
   *
   * contacts.customer_id
   *        ↓
   * customers.id
   */
  const fetchClientCommercialData = useCallback(
    async (contactRecord: ContactRecord) => {
      if (!organisationId) return;

      setClientDataLoading(true);

      try {
        const customerId = contactRecord.customer_id || null;

        if (!customerId) {
          clearCommercialData();
          return;
        }

        // ----------------------------------------------
        // LOAD LINKED CUSTOMER DIRECTLY BY UUID
        // ----------------------------------------------

        const { data: customerRecord, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .eq("organisation_id", organisationId)
          .maybeSingle();

        if (customerError) {
          console.error("Linked customer lookup error:", customerError);
          clearCommercialData();
          return;
        }

        if (!customerRecord) {
          console.warn("Contact has customer_id but matching customer could not be loaded:", customerId);
          clearCommercialData();
          return;
        }

        setLinkedCustomer(customerRecord as CustomerRecord);

        // ----------------------------------------------
        // EVERYTHING BELOW USES THE SAME CUSTOMER UUID
        // ----------------------------------------------

        const [projectsResult, quotesResult, invoicesResult, expensesResult] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .eq("organisation_id", organisationId)
            .eq("customer_id", customerId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),

          supabase
            .from("quotes")
            .select("*")
            .eq("organisation_id", organisationId)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false }),

          supabase
            .from("invoices")
            .select("*")
            .eq("organisation_id", organisationId)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false }),

          supabase
            .from("expenses")
            .select("*")
            .eq("organisation_id", organisationId)
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false }),
        ]);

        if (projectsResult.error) console.error("Client projects fetch error:", projectsResult.error);
        if (quotesResult.error) console.error("Client quotes fetch error:", quotesResult.error);
        if (invoicesResult.error) console.error("Client invoices fetch error:", invoicesResult.error);
        if (expensesResult.error) console.error("Client expenses fetch error:", expensesResult.error);

        setClientProjects((projectsResult.data || []) as ProjectRecord[]);
        setClientQuotes((quotesResult.data || []) as FinanceRecord[]);
        setClientInvoices((invoicesResult.data || []) as FinanceRecord[]);
        setClientExpenses((expensesResult.data || []) as FinanceRecord[]);
      } catch (error) {
        console.error("Client commercial data error:", error);
        clearCommercialData();
      } finally {
        setClientDataLoading(false);
      }
    },
    [organisationId, clearCommercialData]
  );

  // ==========================================================
  // FETCH CONTACT
  // ==========================================================

  const fetchProfile = useCallback(async () => {
    if (!contactId || !organisationId) return;

    setLoading(true);
    setPageError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw authError || new Error("Not authenticated");
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("organisation_id", organisationId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setContact(null);
        return;
      }

      const loadedContact = data as ContactRecord;

      setContact(loadedContact);

      setEditForm({
        name: loadedContact.name || "",
        role: loadedContact.role || "client",
        email: loadedContact.email || "",
        phone: loadedContact.phone || "",
        address: loadedContact.address || "",
        website: loadedContact.website || "",
        company_name: loadedContact.company_name || "",
        company_details: loadedContact.company_details || "",
      });

      await fetchClientCommercialData(loadedContact);
    } catch (error) {
      console.error("Contact load error:", error);
      setPageError(error instanceof Error ? error.message : "Failed to load contact.");
    } finally {
      setLoading(false);
    }
  }, [contactId, organisationId, fetchClientCommercialData]);

  // ==========================================================
  // FETCH TASKS
  // ==========================================================

  const fetchTasks = useCallback(async () => {
    if (!contactId || !organisationId) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("contact_id", contactId)
      .eq("organisation_id", organisationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Tasks fetch error:", error);
      setTasks([]);
      return;
    }

    setTasks((data || []) as TaskRecord[]);
  }, [contactId, organisationId]);

  // ==========================================================
  // TASK COMMENTS
  // ==========================================================

  const fetchTaskComments = useCallback(async () => {
    if (!tasks.length) {
      setTaskCommentThreads({});
      return;
    }

    const taskIds = tasks.map((task) => task.id);

    const { data, error } = await supabase
      .from("task_comments")
      .select("*")
      .in("task_id", taskIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Task comments fetch error:", error);
      return;
    }

    const grouped: Record<string, any[]> = {};

    (data || []).forEach((comment: any) => {
      if (!grouped[comment.task_id]) grouped[comment.task_id] = [];
      grouped[comment.task_id].push(comment);
    });

    setTaskCommentThreads(grouped);
  }, [tasks]);

  useEffect(() => {
    void fetchTaskComments();
  }, [fetchTaskComments]);

  // ==========================================================
  // REALTIME TASK COMMENTS
  // ==========================================================

  useEffect(() => {
    if (!contactId) return;

    const channel = supabase
      .channel(`task_comments_${contactId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "task_comments" },
        (payload: any) => {
          const newComment = payload.new;

          if (newComment?.contact_id && newComment.contact_id !== contactId) return;

          setTaskCommentThreads((previous) => {
            const existing = previous[newComment.task_id] || [];
            return {
              ...previous,
              [newComment.task_id]: [...existing, newComment],
            };
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contactId]);

  // ==========================================================
  // TOGGLE TASK
  // ==========================================================

  const toggleTaskComplete = async (task: TaskRecord) => {
    if (!organisationId) return;

    const current = String(task.status || "").trim().toLowerCase();
    const newStatus = ["done", "completed", "complete"].includes(current) ? "todo" : "done";

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id)
      .eq("organisation_id", organisationId);

    if (error) {
      console.error("Task update error:", error);
      return;
    }

    setTasks((previous) =>
      previous.map((currentTask) => (currentTask.id === task.id ? { ...currentTask, status: newStatus } : currentTask))
    );
  };

  // ==========================================================
  // DELETE TASK
  // ==========================================================

  const deleteTask = async (taskId: string) => {
    if (!organisationId) return;

    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("organisation_id", organisationId);

    if (error) {
      console.error("Task delete error:", error);
      return;
    }

    setTasks((previous) => previous.filter((task) => task.id !== taskId));
  };

  // ==========================================================
  // ADD TASK COMMENT
  // ==========================================================

  const addTaskComment = async (taskId: string) => {
    const content = taskComments[taskId];

    if (!content?.trim() || !organisationId || !contactId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      contact_id: contactId,
      organisation_id: organisationId,
      user_id: user.id,
      content: content.trim(),
    });

    if (error) {
      console.error("Comment error:", error);
      return;
    }

    setTaskComments((previous) => ({ ...previous, [taskId]: "" }));
  };

  // ==========================================================
  // EMAIL THREADS
  // ==========================================================

  const fetchThreads = useCallback(async () => {
    if (!contactId || !organisationId) return;

    const { data, error } = await supabase
      .from("email_threads")
      .select("*")
      .eq("contact_id", contactId)
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Threads fetch error:", error);
      return;
    }

    setThreads((data || []) as EmailThreadRecord[]);
  }, [contactId, organisationId]);

  const fetchMessages = useCallback(
    async (threadId: string) => {
      if (!organisationId) return;

      const { data, error } = await supabase
        .from("email_messages")
        .select("*")
        .eq("thread_id", threadId)
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Messages fetch error:", error);
        return;
      }

      setMessages((data || []) as EmailMessageRecord[]);
    },
    [organisationId]
  );

  // ==========================================================
  // SUBSCRIBER LISTS
  // ==========================================================

  const fetchSubscriberLists = useCallback(async () => {
    if (!organisationId) return;

    const { data, error } = await supabase.from("subscriber_lists").select("id, name").eq("organisation_id", organisationId);

    if (error) {
      console.error("Subscriber lists error:", error);
      return;
    }

    setSubscriberLists(data || []);
  }, [organisationId]);

  const fetchProfileLists = useCallback(async () => {
    if (!contactId) return;

    const { data, error } = await supabase.from("profile_subscriber_lists").select("*").eq("contact_id", contactId);

    if (error) {
      console.error("Profile subscriber lists error:", error);
      return;
    }

    setProfileLists(data || []);
  }, [contactId]);

  // ==========================================================
  // NOTES
  // ==========================================================

  const fetchNotes = useCallback(async () => {
    if (!contactId || !organisationId) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("contact_id", contactId)
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notes fetch error:", error);
      setNotes([]);
      return;
    }

    setNotes((data || []) as NoteRecord[]);
  }, [contactId, organisationId]);

  // ==========================================================
  // TIMELINE
  // ==========================================================

  const fetchTimelineEntries = useCallback(async () => {
    const orgScope = organisationId || contact?.organisation_id || null;

    if (!contactId || !orgScope) return;

    const { data, error } = await supabase
      .from("contact_timeline")
      .select("*")
      .eq("contact_id", contactId)
      .eq("organisation_id", orgScope)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Timeline fetch error:", error);
      setTimelineEntries([]);
      return;
    }

    setTimelineEntries((data || []) as TimelineRecord[]);
  }, [contactId, organisationId, contact?.organisation_id]);

  // ==========================================================
  // INIT
  // ==========================================================

  useEffect(() => {
    if (!contactId || !organisationId) return;

    void Promise.all([
      fetchProfile(),
      fetchTasks(),
      fetchThreads(),
      fetchSubscriberLists(),
      fetchNotes(),
      fetchProfileLists(),
    ]);
  }, [contactId, organisationId, fetchProfile, fetchTasks, fetchThreads, fetchSubscriberLists, fetchNotes, fetchProfileLists]);

  useEffect(() => {
    if (contactId && (organisationId || contact?.organisation_id)) {
      void fetchTimelineEntries();
    }
  }, [contactId, organisationId, contact?.organisation_id, fetchTimelineEntries]);

  useEffect(() => {
    if (threads.length > 0 && !activeThread) {
      const firstThread = threads[0];
      setActiveThread(firstThread);
      void fetchMessages(firstThread.id);
    }

    if (threads.length === 0) {
      setActiveThread(null);
      setMessages([]);
    }
  }, [threads, activeThread, fetchMessages]);

  // ==========================================================
  // SEND EMAIL
  // ==========================================================

  const handleSendEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newEmail.subject.trim() || !newEmail.body.trim() || emailSaving) return;

    if (!contact?.email) {
      alert("This contact does not have an email address.");
      return;
    }

    if (!organisationId) return;

    try {
      setEmailSaving(true);

      let userId = currentUserId;

      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        userId = user?.id || null;

        if (userId) setCurrentUserId(userId);
      }

      if (!userId) {
        throw new Error("Unable to identify the signed-in user.");
      }

      // ----------------------------------------------
      // SEND ACTUAL EMAIL
      // ----------------------------------------------

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.email,
          subject: newEmail.subject.trim(),
          body: newEmail.body.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to send email");
      }

      // ----------------------------------------------
      // THREAD
      // email_threads.profile_id is NOT NULL
      // ----------------------------------------------

      let threadId = activeThread?.id || null;

      if (!threadId) {
        const { data: threadData, error: threadError } = await supabase
          .from("email_threads")
          .insert({
            profile_id: userId,
            contact_id: contactId,
            organisation_id: organisationId,
            subject: newEmail.subject.trim(),
            status: "active",
            last_direction: "outbound",
            last_preview: newEmail.body.trim().slice(0, 200),
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (threadError) throw threadError;

        threadId = threadData.id;
        setActiveThread(threadData);
      }

      // ----------------------------------------------
      // MESSAGE
      // email_messages does NOT have contact_id
      // profile_id is NOT NULL
      // ----------------------------------------------

      const { error: messageError } = await supabase.from("email_messages").insert({
        thread_id: threadId,
        profile_id: userId,
        organisation_id: organisationId,
        direction: "outbound",
        subject: newEmail.subject.trim(),
        body: newEmail.body.trim(),
        status: "sent",
      });

      if (messageError) throw messageError;

      // ----------------------------------------------
      // UPDATE THREAD PREVIEW
      // ----------------------------------------------

      await supabase
        .from("email_threads")
        .update({
          last_message_at: new Date().toISOString(),
          last_direction: "outbound",
          last_preview: newEmail.body.trim().slice(0, 200),
        })
        .eq("id", threadId);

      setNewEmail({ subject: "", body: "" });

      await fetchThreads();
      await fetchMessages(threadId);
    } catch (error) {
      console.error("Email send failed:", error);
      alert(`Failed to send email${error instanceof Error ? `: ${error.message}` : ". Please try again."}`);
    } finally {
      setEmailSaving(false);
    }
  };

  // ==========================================================
  // UPDATE CONTACT
  // ==========================================================

  const handleUpdate = async () => {
    if (!contactId) return;

    setIsSaving(true);

    try {
      const orgScope = organisationId || contact?.organisation_id || null;

      let updateQuery = supabase
        .from("contacts")
        .update({
          name: editForm.name.trim() || null,
          role: editForm.role.trim() || null,
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null,
          website: editForm.website.trim() || null,
          company_name: editForm.company_name.trim() || null,
          company_details: editForm.company_details.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId);

      if (orgScope) {
        updateQuery = updateQuery.eq("organisation_id", orgScope);
      }

      const { data, error } = await updateQuery.select("*").maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("No contact record was updated.");
      }

      const updatedContact = data as ContactRecord;

      setContact(updatedContact);
      setIsEditing(false);

      await fetchClientCommercialData(updatedContact);
    } catch (error) {
      console.error("Contact update error:", error);
      alert(error instanceof Error ? error.message : "Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================
  // CREATE TASK
  // ==========================================================

  const createClientTask = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!contactId || !organisationId || !newTask.title.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const selectedProject = clientProjects.find((project) => project.id === newTask.project_id);

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        status: "todo",
        contact_id: contactId,
        customer_id: linkedCustomer?.id || null,
        organisation_id: organisationId,
        project_id: selectedProject?.id || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Task creation error:", error);
      return;
    }

    setTasks((previous) => [data, ...previous]);
    setNewTask({ title: "", description: "", project_id: "" });
  };

  // ==========================================================
  // CREATE NOTE
  // ==========================================================

  const createClientNote = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!noteForm.content.trim() || !contactId || !organisationId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        contact_id: contactId,
        organisation_id: organisationId,
        type: noteForm.type,
        content: noteForm.content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Note error:", error);
      return;
    }

    setNotes((previous) => [data, ...previous]);
    setNoteForm({ type: "internal", content: "" });
  };

  // ==========================================================
  // HEALTH SCORE
  // ==========================================================

  const healthScore = useMemo(() => {
    const taskScore = Math.max(0, 50 - openTasks.length * 5);
    const engagement = threads.length > 0 || messages.length > 0 ? 25 : 5;
    const relationshipScore = linkedCustomer ? 15 : 5;
    const mailingScore = isMailingListMember ? 10 : 5;

    return Math.max(0, Math.min(100, taskScore + engagement + relationshipScore + mailingScore));
  }, [openTasks.length, threads.length, messages.length, linkedCustomer, isMailingListMember]);

  // ==========================================================
  // TIMELINE EVENTS
  // ==========================================================

  const timelineEvents = useMemo(
    () =>
      [
        ...timelineEntries.map((entry) => ({
          id: `timeline-${entry.id}`,
          type: entry.type || "timeline",
          created_at: entry.created_at,
          title: entry.title || "Timeline Entry",
          content: entry.content || "",
        })),

        ...messages.map((message) => ({
          id: `email-${message.id}`,
          type: "email",
          created_at: message.created_at,
          title: message.subject || "Email",
          content: message.body || "",
        })),

        ...notes.map((note) => ({
          id: `note-${note.id}`,
          type: "note",
          created_at: note.created_at,
          title: note.type || "Note",
          content: note.content || "",
        })),

        ...tasks.map((task) => ({
          id: `task-${task.id}`,
          type: "task",
          created_at: task.created_at || task.due_date,
          title: task.title || "Task",
          content: task.description || "",
        })),

        ...clientProjects.map((project) => ({
          id: `project-${project.id}`,
          type: "project",
          created_at: project.due_date,
          title: project.name,
          content: project.status ? `Status: ${project.status}` : "",
        })),
      ]
        .filter((event) => event.created_at)
        .sort((first, second) => new Date(second.created_at!).getTime() - new Date(first.created_at!).getTime()),
    [timelineEntries, messages, notes, tasks, clientProjects]
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#faf9f6]">
        <Loader2 className="animate-spin text-[#a9b897]" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] p-6">
        <div className="max-w-md rounded-[2rem] border border-red-100 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-400" />
          <h1 className="font-serif text-3xl italic text-stone-800">Unable to load contact</h1>
          <p className="mt-3 text-sm text-stone-500">{pageError}</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return <div className="flex h-screen items-center justify-center bg-[#faf9f6] text-stone-400">Contact not found</div>;
  }

  // ==========================================================
  // TABS
  // ==========================================================

  const tabs: ClientTab[] = ["overview", "projects", "money", "tasks", "email", "info", "timeline"];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9f6] p-3 pb-24 text-stone-900 sm:p-4 md:p-6 lg:p-10 lg:pb-32">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ====================================================
            BACK
        ==================================================== */}

        <Link href="/crm" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 hover:text-stone-700">
          <ArrowLeft size={13} />
          Back to contacts
        </Link>

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col gap-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897] text-2xl font-bold text-white lg:h-20 lg:w-20">
              {(safeProfile.name || "?").charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">{safeProfile.role || "Contact"}</p>

                {linkedCustomer && (
                  <span className="rounded-full bg-[#a9b897]/10 px-2.5 py-1 text-[7px] font-black uppercase tracking-wider text-[#829473]">
                    Commercial Client
                  </span>
                )}
              </div>

              <h1 className="break-words font-serif text-4xl italic tracking-tight text-stone-800 lg:text-5xl">
                {safeProfile.company_name || safeProfile.name || "Unnamed Contact"}
              </h1>

              {safeProfile.company_name && <p className="mt-2 text-sm font-medium text-stone-600">{safeProfile.name}</p>}

              <p className="mt-1 text-xs text-stone-400">{safeProfile.email || "No email address"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setShowComposer(true);
              }}
              className="rounded-xl bg-[#a9b897] px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white transition hover:opacity-90"
            >
              Send Email
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600"
            >
              View Tasks
            </button>
          </div>
        </div>

        {/* ====================================================
            TABS
        ==================================================== */}

        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] transition ${
                  activeTab === tab ? "bg-stone-900 text-white" : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#829473]">TOTS Client Summary</p>
                  <p className="mt-3 max-w-4xl text-lg leading-8 text-stone-700">{clientSummary}</p>
                </div>
              </div>
            </div>

            {!linkedCustomer && safeProfile.role === "client" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-800">Commercial client not linked</p>
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  This contact does not currently have a valid customer record attached through <strong>customer_id</strong>. Tasks, email, notes and CRM
                  history will continue to work.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ClientStatCard label="Active Projects" value={String(activeProjects.length)} />
              <ClientStatCard label="Invoiced" value={formatCurrency(invoicedTotal)} />
              <ClientStatCard label="Outstanding" value={formatCurrency(outstandingTotal)} />
              <ClientStatCard label="Open Tasks" value={String(openTasks.length)} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* PROJECTS */}

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:col-span-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Current Work</p>
                    <h2 className="mt-1 font-serif text-2xl italic text-stone-800">Active projects</h2>
                  </div>

                  <button type="button" onClick={() => setActiveTab("projects")} className="text-xs font-semibold text-[#829473]">
                    View all
                  </button>
                </div>

                {activeProjects.length === 0 ? (
                  <div className="rounded-2xl bg-stone-50 p-8 text-center">
                    <p className="text-sm text-stone-500">No active projects linked to this client.</p>

                    {linkedCustomer && (
                      <Link href="/projects" className="mt-3 inline-block text-xs font-semibold text-[#829473]">
                        Create or link a project →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.slice(0, 4).map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="group flex items-center justify-between rounded-2xl bg-stone-50 p-4 transition hover:bg-stone-100"
                      >
                        <div>
                          <p className="font-semibold text-stone-700">{project.name}</p>
                          <p className="mt-1 text-[10px] text-stone-400">
                            {project.due_date ? `Due ${format(new Date(`${project.due_date}T12:00:00`), "dd MMM yyyy")}` : "No deadline"}
                          </p>
                        </div>

                        <ArrowUpRight size={15} className="text-stone-300 transition group-hover:text-[#829473]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* MONEY */}

              <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:col-span-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Commercial</p>
                <h2 className="mt-1 font-serif text-2xl italic text-stone-800">Client value</h2>

                <div className="mt-6 space-y-4">
                  <ClientMoneyRow label="Quoted" value={formatCurrency(quotedTotal)} />
                  <ClientMoneyRow label="Invoiced" value={formatCurrency(invoicedTotal)} />
                  <ClientMoneyRow label="Paid" value={formatCurrency(paidTotal)} />
                  <ClientMoneyRow label="Outstanding" value={formatCurrency(outstandingTotal)} />
                  <ClientMoneyRow label="Expenses" value={formatCurrency(expensesTotal)} />
                </div>

                <button type="button" onClick={() => setActiveTab("money")} className="mt-6 text-xs font-semibold text-[#829473]">
                  View financial activity →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            PROJECTS
        ==================================================== */}

        {activeTab === "projects" && (
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Client Projects</p>
                <h2 className="mt-1 font-serif text-3xl italic text-stone-800">Work for {safeProfile.company_name || safeProfile.name}</h2>
              </div>

              <Link href="/projects" className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-widest text-white">
                <Plus size={12} />
                New Project
              </Link>
            </div>

            {clientDataLoading ? (
              <Loader2 className="animate-spin text-[#a9b897]" />
            ) : clientProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 p-12 text-center">
                <p className="text-sm text-stone-500">No projects linked to this client.</p>
                <Link href="/projects" className="mt-4 inline-block text-xs font-semibold text-[#829473]">
                  Open Projects →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {clientProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group rounded-2xl border border-stone-100 bg-stone-50 p-5 transition hover:border-[#a9b897]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-serif text-xl italic text-stone-800">{project.name}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-stone-400">{project.status || "In progress"}</p>
                      </div>

                      <ArrowUpRight size={16} className="text-stone-300 group-hover:text-[#829473]" />
                    </div>

                    {project.due_date && (
                      <p className="mt-6 text-xs text-stone-500">Due {format(new Date(`${project.due_date}T12:00:00`), "dd MMM yyyy")}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            MONEY
        ==================================================== */}

        {activeTab === "money" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Client Money</p>
              <h2 className="mt-1 font-serif text-3xl italic text-stone-800">Commercial relationship</h2>

              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <ClientStatCard label="Quoted" value={formatCurrency(quotedTotal)} />
                <ClientStatCard label="Invoiced" value={formatCurrency(invoicedTotal)} />
                <ClientStatCard label="Paid" value={formatCurrency(paidTotal)} />
                <ClientStatCard label="Outstanding" value={formatCurrency(outstandingTotal)} />
                <ClientStatCard label="Expenses" value={formatCurrency(expensesTotal)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ClientFinanceList title="Invoices" records={clientInvoices} formatCurrency={formatCurrency} />
              <ClientFinanceList title="Quotes" records={clientQuotes} formatCurrency={formatCurrency} />
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Costs</p>
                  <h3 className="mt-1 font-serif text-2xl italic text-stone-800">Client expenses</h3>
                </div>

                <Link href="/payments" className="text-xs font-semibold text-[#829473]">
                  Open Finance →
                </Link>
              </div>

              <div className="mt-6 space-y-2">
                {clientExpenses.length === 0 ? (
                  <p className="text-sm text-stone-400">No expenses linked to this client.</p>
                ) : (
                  clientExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-700">{expense.description || "Expense"}</p>
                        <p className="mt-1 text-[10px] text-stone-400">{expense.date || ""}</p>
                      </div>

                      <p className="font-semibold text-stone-700">{formatCurrency(expense.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            INFO
        ==================================================== */}

        {activeTab === "info" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex justify-end md:col-span-2">
              <button
                type="button"
                onClick={() => setIsEditing((current) => !current)}
                className="rounded-xl bg-[#a9b897] px-4 py-2 text-xs font-semibold text-white"
              >
                {isEditing ? "Cancel Editing" : "Edit Details"}
              </button>
            </div>

            {/* CONTACT INFO */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-stone-400">Contact Information</h3>

              <div className="space-y-4 text-sm">
                {isEditing ? (
                  <>
                    <input
                      className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                      value={editForm.name}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                      placeholder="Name"
                    />

                    <input
                      type="email"
                      className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                      value={editForm.email}
                      onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                      placeholder="Email Address"
                    />

                    <input
                      className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                      value={editForm.phone}
                      onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
                      placeholder="Phone Number"
                    />

                    <input
                      className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                      value={editForm.address}
                      onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
                      placeholder="Address"
                    />

                    <input
                      className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                      value={editForm.website}
                      onChange={(event) => setEditForm({ ...editForm, website: event.target.value })}
                      placeholder="Website"
                    />
                  </>
                ) : (
                  <>
                    <InfoRow label="Name" value={safeProfile.name || "Not provided"} />
                    <InfoRow label="Email" value={safeProfile.email || "Not provided"} />
                    <InfoRow label="Phone" value={safeProfile.phone || "Not provided"} />
                    <InfoRow label="Address" value={safeProfile.address || "Not provided"} />
                    <InfoRow label="Website" value={safeProfile.website || "Not provided"} />
                  </>
                )}
              </div>
            </div>

            {/* BUSINESS INFO */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-stone-400">Business Information</h3>

              {isEditing ? (
                <div className="space-y-4">
                  <input
                    className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                    value={editForm.company_name}
                    onChange={(event) => setEditForm({ ...editForm, company_name: event.target.value })}
                    placeholder="Company Name"
                  />

                  <select
                    className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                    value={editForm.role}
                    onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
                  >
                    <option value="client">Client</option>
                    <option value="lead">Lead</option>
                    <option value="partner">Partner</option>
                    <option value="member">Team Member</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <InfoRow label="Company" value={safeProfile.company_name || "Not provided"} />
                  <InfoRow label="Role" value={safeProfile.role || "Contact"} />
                  <InfoRow label="Commercial Record" value={linkedCustomer ? "Linked" : "Not linked"} />
                  <InfoRow label="Mailing Lists" value={profileLists.length > 0 ? `${profileLists.length} list${profileLists.length === 1 ? "" : "s"}` : "None"} />
                </div>
              )}
            </div>

            {/* COMPANY NOTES */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm md:col-span-2 lg:p-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-stone-400">Company Notes</h3>

              {isEditing ? (
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-4"
                  value={editForm.company_details}
                  onChange={(event) => setEditForm({ ...editForm, company_details: event.target.value })}
                />
              ) : (
                <p className="leading-7 text-stone-600">{safeProfile.company_details || "No notes have been added yet."}</p>
              )}

              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleUpdate()}
                    disabled={isSaving}
                    className="rounded-xl bg-[#a9b897] px-6 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {isSaving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            TASKS
        ==================================================== */}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Client Tasks</p>
              <h2 className="mt-1 font-serif text-3xl italic text-stone-800">Actions & delivery</h2>

              <form className="mt-8 space-y-3" onSubmit={createClientTask}>
                <input
                  className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
                />

                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(event) => setNewTask({ ...newTask, description: event.target.value })}
                />

                <select
                  className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                  value={newTask.project_id}
                  onChange={(event) => setNewTask({ ...newTask, project_id: event.target.value })}
                >
                  <option value="">No project</option>
                  {clientProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <button type="submit" className="rounded-xl bg-[#a9b897] px-5 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                  Create Task
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              {tasks.length === 0 ? (
                <div className="py-16 text-center text-stone-400">No tasks assigned to this client.</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const done = ["done", "completed", "complete"].includes(String(task.status || "").trim().toLowerCase());

                    return (
                      <div key={task.id} className={`rounded-2xl border border-stone-100 bg-stone-50 p-5 ${done ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <button
                              type="button"
                              onClick={() => void toggleTaskComplete(task)}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                                done ? "border-[#a9b897] bg-[#a9b897] text-white" : "border-stone-200 bg-white text-transparent"
                              }`}
                            >
                              <Check size={13} />
                            </button>

                            <div>
                              <h4 className={`font-semibold ${done ? "text-stone-400 line-through" : "text-stone-700"}`}>{task.title}</h4>

                              {task.description && <p className="mt-2 text-sm leading-6 text-stone-500">{task.description}</p>}

                              {task.project_id && (
                                <Link href={`/projects/${task.project_id}`} className="mt-3 inline-flex rounded-full bg-[#a9b897]/15 px-3 py-1 text-[10px] text-stone-600">
                                  {projectMap[task.project_id] || "Project"}
                                </Link>
                              )}
                            </div>
                          </div>

                          <button type="button" onClick={() => void deleteTask(task.id)} className="text-red-300 transition hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="mt-4 space-y-3 border-t border-stone-200 pt-4">
                          <div className="flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-stone-200 bg-white p-2 text-xs"
                              placeholder="Add comment..."
                              value={taskComments[task.id] || ""}
                              onChange={(event) => setTaskComments({ ...taskComments, [task.id]: event.target.value })}
                            />

                            <button type="button" onClick={() => void addTaskComment(task.id)} className="rounded-lg bg-[#a9b897] px-3 py-2 text-white">
                              <Send size={14} />
                            </button>
                          </div>

                          {(taskCommentThreads[task.id] || []).map((comment: any) => (
                            <div key={comment.id} className="rounded-lg border border-stone-100 bg-white p-3 text-xs">
                              <p className="mb-1 text-[9px] uppercase text-stone-400">
                                {comment.created_at ? new Date(comment.created_at).toLocaleString("en-GB") : ""}
                              </p>

                              <p className="text-stone-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            EMAIL
        ==================================================== */}

        {activeTab === "email" && (
          <div className="grid min-h-[700px] grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* THREADS */}

            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Conversations</h3>
                <span className="text-xs text-stone-400">{threads.length}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveThread(null);
                  setMessages([]);
                  setShowComposer(true);
                  setNewEmail({ subject: "", body: "" });
                }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 p-3 text-[8px] font-black uppercase tracking-widest text-white"
              >
                <Plus size={12} />
                New Email
              </button>

              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveThread(thread);
                      setShowComposer(false);
                      void fetchMessages(thread.id);
                    }}
                    className={`block w-full rounded-xl p-3 text-left transition ${
                      activeThread?.id === thread.id ? "bg-[#a9b897] text-white" : "bg-stone-50 hover:bg-stone-100"
                    }`}
                  >
                    <p className="truncate font-medium">{thread.subject || "Conversation"}</p>

                    {thread.created_at && (
                      <p className={`mt-1 text-[9px] ${activeThread?.id === thread.id ? "text-white/60" : "text-stone-400"}`}>
                        {format(new Date(thread.created_at), "dd MMM yyyy")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGE AREA */}

            <div className="flex flex-col rounded-[2rem] border border-stone-200 bg-white p-5 lg:p-6">
              <div className="mb-4 flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{activeThread?.subject || "New Conversation"}</h2>
                  <p className="text-xs text-stone-400">{safeProfile.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowComposer((current) => !current)}
                  className="rounded-xl bg-[#a9b897] px-4 py-2 text-xs text-white"
                >
                  {showComposer ? "Hide Composer" : activeThread ? "Reply" : "Write Email"}
                </button>
              </div>

              {showComposer && (
                <form onSubmit={handleSendEmail} className="mb-6 space-y-3 rounded-2xl bg-stone-50 p-4">
                  <input
                    className="w-full rounded-xl border border-stone-200 bg-white p-3"
                    placeholder="Subject"
                    value={newEmail.subject}
                    onChange={(event) => setNewEmail({ ...newEmail, subject: event.target.value })}
                  />

                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-stone-200 bg-white p-3"
                    placeholder="Message"
                    value={newEmail.body}
                    onChange={(event) => setNewEmail({ ...newEmail, body: event.target.value })}
                  />

                  <button
                    type="submit"
                    disabled={emailSaving || !newEmail.subject.trim() || !newEmail.body.trim()}
                    className="w-full rounded-xl bg-[#a9b897] py-3 text-white disabled:opacity-50"
                  >
                    {emailSaving ? "Sending..." : "Send Email"}
                  </button>
                </form>
              )}

              <div className="flex-1 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <Mail className="mx-auto mb-3 text-stone-200" />
                    <p className="text-sm text-stone-400">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl border p-4 ${
                        message.direction === "outbound" ? "border-[#a9b897]/20 bg-[#a9b897]/10" : "border-stone-200 bg-stone-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-[9px] uppercase tracking-wider text-stone-400">
                          {message.direction === "outbound" ? "Sent" : "Received"}
                        </span>

                        <span className="text-[10px] text-stone-400">
                          {message.created_at ? format(new Date(message.created_at), "dd MMM yyyy HH:mm") : ""}
                        </span>
                      </div>

                      {message.subject && <p className="mb-2 font-semibold">{message.subject}</p>}

                      <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{message.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TIMELINE
        ==================================================== */}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            {/* MANUAL ENTRY */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Timeline</p>
              <h2 className="mt-1 font-serif text-3xl italic text-stone-800">Client history</h2>

              <form
                onSubmit={async (event) => {
                  event.preventDefault();

                  const orgScope = organisationId || contact?.organisation_id || null;

                  if (!timelineEntry.trim() || !contactId || !orgScope) return;

                  const { data, error } = await supabase
                    .from("contact_timeline")
                    .insert({
                      contact_id: contactId,
                      organisation_id: orgScope,
                      type: "timeline",
                      title: "Manual timeline update",
                      content: timelineEntry.trim(),
                    })
                    .select()
                    .single();

                  if (error) {
                    console.error("Timeline entry error:", error);
                    return;
                  }

                  setTimelineEntries((previous) => [data, ...previous]);
                  setTimelineEntry("");
                }}
                className="mt-6 space-y-3"
              >
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-stone-200 bg-stone-50 p-3"
                  placeholder="Add a timeline update..."
                  value={timelineEntry}
                  onChange={(event) => setTimelineEntry(event.target.value)}
                />

                <button type="submit" className="rounded-xl bg-[#a9b897] px-4 py-2 text-xs text-white">
                  Add to Timeline
                </button>
              </form>
            </div>

            {/* HEALTH */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">Client Health</p>
              <div className="mt-3 font-serif text-5xl italic text-stone-800">{healthScore}/100</div>
              <p className="mt-2 max-w-xl text-xs leading-5 text-stone-400">
                Based on outstanding tasks, communication history, commercial relationship and engagement.
              </p>
            </div>

            {/* ACTIVITY */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <h3 className="mb-6 font-serif text-2xl italic text-stone-800">Activity</h3>

              <div className="space-y-3">
                {timelineEvents.length === 0 ? (
                  <p className="text-sm text-stone-400">No activity yet.</p>
                ) : (
                  timelineEvents.map((event) => (
                    <div key={event.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#829473]">{event.type}</span>
                        <span className="text-[10px] text-stone-400">{event.created_at ? new Date(event.created_at).toLocaleString("en-GB") : ""}</span>
                      </div>

                      <p className="font-medium text-stone-700">{event.title}</p>

                      {event.content && <p className="mt-1 line-clamp-3 text-xs leading-5 text-stone-500">{event.content}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* NOTES */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <div className="mb-6 flex items-center gap-3">
                <FileText size={16} className="text-[#829473]" />
                <h3 className="font-serif text-2xl italic text-stone-800">Notes</h3>
              </div>

              <form onSubmit={createClientNote} className="mb-6 space-y-3">
                <select
                  value={noteForm.type}
                  onChange={(event) => setNoteForm({ ...noteForm, type: event.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <option value="internal">Internal</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                </select>

                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-stone-200 bg-stone-50 p-3"
                  placeholder="Add a note..."
                  value={noteForm.content}
                  onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })}
                />

                <button type="submit" className="rounded-xl bg-[#a9b897] px-4 py-2 text-xs text-white">
                  Add Note
                </button>
              </form>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-stone-400">No notes yet.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-xl bg-stone-50 p-4">
                      <p className="text-[9px] uppercase tracking-wider text-[#829473]">{note.type || "note"}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MAILING LISTS */}

            <div className="rounded-[2rem] border border-stone-200 bg-white p-6 lg:p-8">
              <h3 className="mb-6 font-serif text-2xl italic text-stone-800">Mailing Lists</h3>

              {subscriberLists.length === 0 ? (
                <p className="text-sm text-stone-400">No mailing lists available.</p>
              ) : (
                <div className="space-y-2">
                  {subscriberLists.map((list) => {
                    const isMember = profileLists.some((item: any) => item.subscriber_list_id === list.id);

                    return (
                      <div key={list.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                        <span className="text-sm text-stone-700">{list.name}</span>

                        <button
                          type="button"
                          disabled={!organisationId}
                          onClick={async () => {
                            if (!organisationId || !contactId) return;

                            if (isMember) {
                              const { error } = await supabase
                                .from("profile_subscriber_lists")
                                .delete()
                                .eq("contact_id", contactId)
                                .eq("subscriber_list_id", list.id);

                              if (error) {
                                console.error("Remove mailing list error:", error);
                                return;
                              }
                            } else {
                              const { error } = await supabase.from("profile_subscriber_lists").insert({
                                contact_id: contactId,
                                subscriber_list_id: list.id,
                                organisation_id: organisationId,
                              });

                              if (error) {
                                console.error("Add mailing list error:", error);
                                return;
                              }
                            }

                            await fetchProfileLists();
                          }}
                          className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs"
                        >
                          {isMember ? "Remove" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');

            .font-serif {
              font-family: 'Instrument Serif', serif;
            }

            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }

            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `,
        }}
      />
    </div>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function ClientStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <p className="font-serif text-2xl italic text-stone-800">{value}</p>
      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">{label}</p>
    </div>
  );
}

function ClientMoneyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="text-sm font-semibold text-stone-700">{value}</span>
    </div>
  );
}

function ClientFinanceList({
  title,
  records,
  formatCurrency,
}: {
  title: string;
  records: FinanceRecord[];
  formatCurrency: (value: number | string | null | undefined) => string;
}) {
  return (
    <div className="rounded-[2rem] border border-stone-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-serif text-2xl italic text-stone-800">{title}</h3>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">{records.length}</span>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-stone-400">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
              <div>
                <p className="text-sm font-semibold text-stone-700">{formatCurrency(record.amount)}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-stone-400">{record.status || "Draft"}</p>
              </div>

              <span className="text-[10px] text-stone-400">{record.due_date || record.date || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-stone-100 pb-4 last:border-0">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="max-w-[65%] break-words text-right text-xs font-semibold text-stone-700">{value}</span>
    </div>
  );
}