"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, Plus, Zap, Target, FileText, 
  Upload, Shield, Trash2, Check, LayoutGrid, Clock, Radio,
  Users, Settings, Calendar, Share2, Mail, X, MoreHorizontal,
  Cloud, Lock, Save, AlertCircle, Hash
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ProjectEngine() {
  const { id } = useParams();
  const projectId =
  typeof id === "string"
    ? id
    : Array.isArray(id)
    ? id[0]
    : null;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tasks"); // Tasks, assets, Project Settings
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [subProjects, setSubProjects] = useState<any[]>([]);
  const [subProjectName, setSubProjectName] = useState("");
  const [subProjectSummary, setSubProjectSummary] = useState("");
  const [subProjectDueDate, setSubProjectDueDate] = useState("");

  const subProjectMarker = useMemo(
    () => (projectId ? `SUBPROJECT_OF:${projectId}` : ""),
    [projectId]
  );

  // --- CLARITY TEAM INTELLIGENCE ENGINE ---
const workloadByUser = useMemo(() => {
  const map: Record<string, number> = {};

  tasks.forEach(t => {
    const assignee = t.assigned_to || t.user_id;

    if (assignee) {
      map[assignee] = (map[assignee] || 0) + 1;
    }
  });

  return map;
}, [tasks]);

  const leastBusyUser = useMemo(() => {
    if (!contacts.length) return null;

    return contacts.reduce((best, user) => {
      const bestLoad = best ? (workloadByUser[best.id] || 0) : Infinity;
      const userLoad = workloadByUser[user.id] || 0;

      return userLoad < bestLoad ? user : best;
    }, null as any);
  }, [contacts, workloadByUser]);

  const completedCount = useMemo(() => {
    return tasks.filter(t => t.status === "completed").length;
  }, [tasks]);

  const assignedCount = useMemo(() => {
    return tasks.filter(t => t.assigned_to || t.user_id).length;
  }, [tasks]);

  const unassignedCount = useMemo(() => {
    return tasks.filter(t => !t.assigned_to && !t.user_id).length;
  }, [tasks]);

  const membersList = useMemo(() => {
    if (!project?.members) return [];
    if (Array.isArray(project.members)) return project.members;
    if (typeof project.members === "string") {
      return project.members
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [project?.members]);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.error("Project engine auth error:", authError);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile?.organisation_id) {
        console.error("Project engine profile error:", profileError);
        setLoading(false);
        return;
      }

      const orgId = profile.organisation_id;
      setOrganisationId(orgId);

      const { data: p } = await supabase
        .from("projects")
        .select("*")
        .eq("organisation_id", orgId)
        .eq("id", projectId)
        .single();

      const { data: childProjects, error: childProjectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("organisation_id", orgId)
        .eq("parent_project_id", projectId)
        .order("created_at", { ascending: true });

     const { data: projectTasks, error: projectTasksError } = await supabase
  .from("tasks")
  .select("*")
  .eq("project_id", projectId)
  .eq("organisation_id", orgId)
  .order("created_at", { ascending: true });

if (projectTasksError) {
  console.error("Failed to load tasks:", projectTasksError);
}


      // Fetch contacts (profiles)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("organisation_id", orgId);

      const taskIds = (projectTasks || []).map((task: any) => task.id);
      let taskComments: any[] = [];

      if (taskIds.length > 0) {
        const { data: commentRows } = await supabase
  .from("task_comments")
  .select("*")
  .in("task_id", taskIds)
  .order("created_at", { ascending: true });

        taskComments = commentRows || [];
      }

      setContacts(profiles || []);


     const normalisedProjectTasks = (projectTasks || []).map((t: any) => ({
  id: t.id,
  title: t.title || "Untitled Task",
  description: t.description || "",
  status: t.status || "todo",
  assigned_to: t.assigned_to || null,
user_id: t.user_id || null,
created_at: t.created_at,
source: "tasks"
}));

      if (!childProjectsError) {
        setSubProjects(childProjects || []);
      } else {
        const { data: fallbackSubProjects } = await supabase
          .from("projects")
          .select("*")
          .eq("organisation_id", orgId)
          .ilike("objective_summary", `%${subProjectMarker}%`)
          .order("created_at", { ascending: true });

        setSubProjects(fallbackSubProjects || []);
      }

      setComments(taskComments || []);

      setProject(p);
      setTasks(normalisedProjectTasks);
      // Auto-suggest least busy user for task assignment
      if (!taskAssignee && leastBusyUser?.id) {
        setTaskAssignee(leastBusyUser.id);
      }
      setLoading(false);
    }
    load();
    // Including leastBusyUser and taskAssignee intentionally for smart default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]);

  // --- PHASE 4: EMAIL NOTIFICATION KERNEL ---
  const sendEmailNotification = async (payload: {
    type: string;
    taskId?: string;
    content?: string;
  }) => {
    try {
      await fetch("/api/notifications/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: id,
          ...payload
        })
      });
    } catch (err) {
      console.error("Email notification failed:", err);
    }
  };

  // --- PHASE 3: ADD COMMENT FUNCTION ---
  const addComment = async (taskId: string, text: string) => {
  if (!text.trim()) return;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id || !organisationId) {
    toast.error("Unable to save comment");
    return;
  }

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      content: text,
      user_id: user.id,
      organisation_id: organisationId,
    })
    .select()
    .single();


  if (error) {
    console.error(error);
    toast.error("Failed to save comment");
    return;
  }


  setComments(prev => [...prev, data]);

  setCommentInput(prev => ({
    ...prev,
    [taskId]: ""
  }));

  toast.success("Comment saved");
};

  const addTask = async () => {
  if (!taskInput) return;

 

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id || !organisationId) {
    toast.error("Unable to create task");
    return;
  }

  const { data: taskData, error } = await supabase
    .from("tasks")
   
  .insert([
  {
  project_id: projectId,
  title: taskInput,
  status: "todo",

  // creator
  user_id: user.id,

  // additional assignee only
  assigned_to: taskAssignee || null,

  organisation_id: organisationId || project?.organisation_id || null
}
])
    
    .select()
    .single();

  if (error) {
    console.error(error);
    toast.error("Failed to create task");
    return;
  }

  if (taskData) {
    const normalizedTask = {
      id: taskData.id,
      title: taskData.title,
      status: taskData.status,
      source: "tasks",
      assigned_to: taskData.assigned_to || null,
user_id: taskData.user_id || null
    };

    setTasks(prev => [...prev, normalizedTask]);

    if (taskData?.assigned_to) {
      await sendEmailNotification({
        type: "task_assigned",
        taskId: taskData.id,
        content: taskInput
      });
    }
  }

  setTaskInput("");
  setTaskAssignee("");

  toast.success("Task created successfully");

  await sendEmailNotification({
    type: "task_created",
    taskId: taskData?.id,
    content: taskInput
  });
};

  const addSubProject = async () => {
    if (!subProjectName.trim() || !organisationId || !projectId) {
      toast.error("Sub-project name is required");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      toast.error("Unable to create sub-project");
      return;
    }

    const basePayload = {
      name: subProjectName.trim(),
      objective_summary: `${subProjectMarker}${subProjectSummary ? ` ${subProjectSummary.trim()}` : ""}`,
      description: subProjectSummary.trim() || null,
      category: "Sub-project",
      status: "live",
      priority: "Medium",
      health: "good",
      members: [],
      start_date: new Date().toISOString().slice(0, 10),
      due_date: subProjectDueDate || null,
      budget: 0,
      organisation_id: organisationId,
      user_id: user.id,
    };

    let inserted: any = null;

    const withParentPayload = {
      ...basePayload,
      parent_project_id: projectId,
    };

    const firstAttempt = await supabase
      .from("projects")
      .insert(withParentPayload)
      .select("*")
      .single();

    if (!firstAttempt.error) {
      inserted = firstAttempt.data;
    } else {
      const fallbackAttempt = await supabase
        .from("projects")
        .insert(basePayload)
        .select("*")
        .single();

      if (fallbackAttempt.error) {
        console.error("Sub-project create error:", fallbackAttempt.error);
        toast.error("Failed to create sub-project");
        return;
      }

      inserted = fallbackAttempt.data;
    }

    if (inserted) {
      setSubProjects((prev) => [inserted, ...prev]);
      setSubProjectName("");
      setSubProjectSummary("");
      setSubProjectDueDate("");
      toast.success("Sub-project created");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("organisation_id", organisationId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task removed");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const toggleTaskComplete = async (task: any) => {
    const newStatus = task.status === "completed" ? "todo" : "completed";

    if (task.source === "tasks") {
      await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", task.id)
        .eq("organisation_id", organisationId);
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, status: newStatus } : t
      )
    );

    toast.success(
  newStatus === "completed" ? "Task completed" : "Task reopened"
);
  };

  useEffect(() => {
  return () => {};
}, []);

  const updateProject = async (updates: any) => {
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .eq("organisation_id", organisationId);
    if (!error) {
      setProject({ ...project, ...updates });
      toast.success("System Parameters Updated");
    }
  };

  const deleteProject = async () => {
    const confirmDelete = window.confirm("Delete this project permanently?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("projects")
      .delete()
        .eq("id", projectId)
        .eq("organisation_id", organisationId);

    if (!error) {
      toast.success("Project deleted");
      router.push("/projects");
    } else {
      toast.error("Failed to delete project");
    }
  };

  if (loading || !project) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
          Loading Project Engine...
        </p>
      </div>
    </div>
  );
}

return (
    <div className="min-h-screen bg-stone-50 pb-24 overflow-x-hidden selection:bg-[#a9b897] selection:text-white">
      
      {/* TACTICAL HEADER */}
      <nav className="p-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <Link href="/projects" className="flex items-center gap-3 group">
            <div className="p-2 bg-stone-50 rounded-lg group-hover:bg-stone-900 group-hover:text-white transition-all">
              <ChevronLeft size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Project Overview</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {["Tasks", "assets", "Admin"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${project.health === 'Stable' ? 'bg-[#a9b897]' : 'bg-red-400'} animate-pulse`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 italic">Project Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 overflow-x-hidden">
        
        {/* PROJECT PROGRESS BAR */}
        {tasks.length > 0 && (
          <div className="col-span-12">
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-2 bg-[#a9b897]"
                style={{
                  width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%`
                }}
              />
            </div>

            <p className="text-[9px] font-black uppercase text-stone-400 mt-2">
              Project Completion: {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </p>
          </div>
        )}
        
        {/* LEFT COLUMN: PRIMARY INTERFACE */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          <header className="space-y-4">
            <div className="flex items-center gap-4 text-[#a9b897]">
               <Hash size={16} />
               <p className="text-[11px] font-black uppercase tracking-[0.4em]">{project.category}</p>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-serif italic tracking-tighter text-stone-800 leading-none break-words">
              {project.name}
            </h1>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === "Tasks" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                {/* TIMELINE VISUAL */}
                <div className="bg-white border border-stone-100 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-10 shadow-sm space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Timeline</h3>
                    <div className="mt-8 flex items-center gap-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-stone-100 -z-10" />
                        {[project.start_date, "Active Deployment", project.due_date].map((point, i) => ( point && (
                           <div key={i} className="bg-white px-4 py-2 border border-stone-100 rounded-full flex items-center gap-2 shadow-sm">
                              <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-[#a9b897]' : 'bg-stone-200'}`} />
                              <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">{point || "TBD"}</span>
                           </div>
                        )))}
                    </div>
                  </div>

                  {/* TASK LIST */}
                  <div className="space-y-6 pt-10 border-t border-stone-50">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        placeholder="Define next objective..."
                        className="flex-1 bg-stone-50 p-5 rounded-2xl text-xs font-serif italic outline-none focus:ring-1 ring-[#a9b897]/30 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTask();
                        }}
                      />
                      <select
                        value={taskAssignee}
                        onChange={(e) => setTaskAssignee(e.target.value)}
                        className="bg-stone-50 p-5 rounded-2xl text-xs font-serif italic outline-none border border-stone-100"
                      >
                        <option value="">
                          Assign manually (Clarity can suggest)
                        </option>
                        {contacts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name || c.email}
                          </option>
                        ))}
                      </select>
                      <button onClick={addTask} className="bg-stone-900 text-white px-6 sm:px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all w-full sm:w-auto">Add</button>
                    </div>
                    <div className="space-y-3">
                      {tasks.length === 0 ? (
                        <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-stone-300">
                          No tasks yet. Add your first objective.
                        </div>
                      ) : tasks.map(t => {
                        const assignedUser = contacts.find((c) => c.id === (t.assigned_to || t.user_id));
                        const taskComments = comments.filter((c) => c.task_id === t.id);
                        const isExpanded = expandedTaskId === t.id;

                        return (
                          <div key={t.id} className="border border-stone-100 rounded-2xl bg-stone-50/60 overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 hover:bg-stone-50 transition-all group">
                              <div className="flex items-start gap-4">
                                <button
                                  onClick={() => toggleTaskComplete(t)}
                                  className="w-7 h-7 rounded-lg border-2 border-stone-100 flex items-center justify-center group-hover:border-[#a9b897] transition-all cursor-pointer"
                                >
                                  <Check
                                    size={13}
                                    className={
                                      t.status === "completed"
                                        ? "text-[#a9b897]"
                                        : "text-transparent group-hover:text-[#a9b897]"
                                    }
                                  />
                                </button>

                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-stone-700">
                                    {t.title || "Untitled Task"}
                                  </span>
                                  <span className="text-[10px] text-stone-400 mt-1">
                                    {assignedUser ? `Assigned: ${assignedUser.full_name || assignedUser.email}` : "Unassigned"}
                                    {t.created_at ? ` • ${new Date(t.created_at).toLocaleDateString()}` : ""}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setExpandedTaskId((prev) => (prev === t.id ? null : t.id))}
                                  className="text-[9px] font-black uppercase text-stone-500 border border-stone-200 px-3 py-2 rounded-lg hover:border-stone-400 transition-colors"
                                >
                                  {isExpanded ? "Collapse" : "Expand"}
                                </button>
                                <Trash2
                                  size={14}
                                  onClick={() => deleteTask(t.id)}
                                  className="text-stone-300 hover:text-red-400 cursor-pointer transition-colors"
                                />
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="border-t border-stone-100 bg-white p-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="rounded-xl bg-stone-50 p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Status</p>
                                    <p className="text-[11px] text-stone-700 mt-1">{t.status || "todo"}</p>
                                  </div>
                                  <div className="rounded-xl bg-stone-50 p-3">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Assigned To</p>
                                    <p className="text-[11px] text-stone-700 mt-1">{assignedUser ? assignedUser.full_name || assignedUser.email : "Unassigned"}</p>
                                  </div>
                                </div>

                                <div className="rounded-xl bg-stone-50 p-3">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Task Details</p>
                                  <p className="text-[11px] text-stone-700 mt-1 whitespace-pre-wrap">
                                    {t.description?.trim() ? t.description : "No additional task details available."}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                                    Comments ({taskComments.length})
                                  </p>

                                  {taskComments.map((c) => (
                                    <div key={c.id} className="text-[10px] bg-stone-50 p-2 rounded-lg">
                                      {c.content}
                                    </div>
                                  ))}

                                  {taskComments.length === 0 && (
                                    <div className="text-[10px] text-stone-400 bg-stone-50 p-2 rounded-lg">
                                      No comments yet.
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <input
                                      value={commentInput[t.id] || ""}
                                      onChange={(e) =>
                                        setCommentInput((prev) => ({
                                          ...prev,
                                          [t.id]: e.target.value
                                        }))
                                      }
                                      placeholder="Write a comment..."
                                      className="flex-1 bg-stone-50 p-2 rounded-lg text-[10px]"
                                    />

                                    <button
                                      onClick={() => addComment(t.id, commentInput[t.id] || "")}
                                      className="text-[9px] font-black uppercase bg-stone-900 text-white px-3 rounded-lg"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "assets" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* UPLOAD ZONE */}
                  <div className="border-2 border-dashed border-stone-200 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-12 text-center bg-white hover:border-[#a9b897] transition-all cursor-pointer group">
                    <Cloud size={40} className="mx-auto text-stone-200 group-hover:text-[#a9b897] transition-all mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Assets (Upload Coming Soon)</p>
                    <p className="text-[9px] text-stone-300 mt-2 font-serif italic">PDF, PNG, MP4, .SQL</p>
                  </div>

                  {/* RECENT FILES */}
                  <div className="bg-white border border-stone-100 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-8 space-y-4">
                     <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-300">Sync Assets</h3>
                     {[1,2].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <FileText size={16} className="text-[#a9b897]" />
                              <span className="text-[10px] font-bold text-stone-600">Schema_Protocol_v{i}.docs</span>
                           </div>
                           <MoreHorizontal size={14} className="text-stone-300" />
                        </div>
                     ))}
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "Admin" && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                 <div className="bg-white border border-stone-100 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-10 space-y-12 shadow-sm">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* PARAMETERS SECTION */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Administrative Details</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">Due Date</label>
                                    <input type="date" defaultValue={project.due_date} onChange={(e) => updateProject({ due_date: e.target.value })} className="w-full bg-stone-50 p-4 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-stone-200" />
                                </div>
                               
                            </div>
                        </div>

                        {/* STACKED AND CONTROLLED PERSONNEL ACCESS BOX */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Team Members</h3>
                            <div className="space-y-4">
                                <div className="space-y-2.5">
                                    <input 
                                      value={inviteEmail} 
                                      onChange={(e) => setInviteEmail(e.target.value)} 
                                      placeholder="Email address..." 
                                      className="w-full bg-stone-50 p-4 rounded-xl text-xs outline-none border border-stone-100 focus:bg-stone-50/40 focus:border-stone-200 transition-all text-stone-800" 
                                    />
                                    <button className="w-full bg-stone-900 text-white py-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm">
                                      Invite Member
                                    </button>
                                </div>
                                <div className="space-y-2 pt-2">
                                    {membersList.map((m: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 border border-stone-50 rounded-xl bg-stone-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-[#a9b897]/20 flex items-center justify-center text-[8px] font-black text-[#a9b897]">{m.trim().charAt(0)}</div>
                                                <span className="text-[10px] font-bold text-stone-600">{m.trim()}</span>
                                            </div>
                                            <button className="text-[8px] font-black uppercase text-stone-300 hover:text-red-500 transition-colors">Revoke</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-stone-50">
                        <button
                          onClick={deleteProject}
                          className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} /> Delete Project
                        </button>
                    </div>
                 </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: UTILITY & CARDS */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* CLARITY TEAM INTELLIGENCE */}
          <div className="bg-white border border-stone-100 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">
                Team Intelligence
              </h3>
              <Users size={14} className="text-stone-300" />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-stone-500">
                Total Tasks: {tasks.length}
              </p>

              <p className="text-[10px] text-stone-500">
                Assigned: {assignedCount}
              </p>

              <p className="text-[10px] text-stone-500">
                Unassigned: {unassignedCount}
              </p>

              <p className="text-[10px] text-stone-500">
                Team Members: {contacts.length}
              </p>
            </div>

            {leastBusyUser && (
              <div className="p-3 bg-stone-50 rounded-xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">
                  Clarity Suggestion
                </p>
                <p className="text-[10px] text-stone-600 mt-1">
                  Suggested Assignee: {leastBusyUser.full_name || leastBusyUser.email}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white border border-stone-100 p-4 lg:p-8 rounded-[2rem] lg:rounded-[3rem] shadow-sm space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">Sub-Projects</h3>

            <div className="space-y-2">
              <input
                value={subProjectName}
                onChange={(e) => setSubProjectName(e.target.value)}
                placeholder="Sub-project name"
                className="w-full bg-stone-50 p-3 rounded-xl text-[11px] outline-none border border-stone-100"
              />
              <textarea
                value={subProjectSummary}
                onChange={(e) => setSubProjectSummary(e.target.value)}
                placeholder="Summary / scope"
                className="w-full bg-stone-50 p-3 rounded-xl text-[11px] outline-none border border-stone-100 min-h-[80px]"
              />
              <input
                type="date"
                value={subProjectDueDate}
                onChange={(e) => setSubProjectDueDate(e.target.value)}
                className="w-full bg-stone-50 p-3 rounded-xl text-[11px] outline-none border border-stone-100"
              />
              <button
                onClick={addSubProject}
                className="w-full bg-stone-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all"
              >
                Add Sub-Project
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {subProjects.length === 0 ? (
                <p className="text-[10px] text-stone-400">No sub-projects yet.</p>
              ) : (
                subProjects.map((sp) => (
                  <Link
                    key={sp.id}
                    href={`/projects/${sp.id}`}
                    className="block p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors"
                  >
                    <p className="text-[11px] font-bold text-stone-700">{sp.name || "Untitled Sub-project"}</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      {sp.due_date ? `Due ${sp.due_date}` : "No due date"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          

        </aside>
      </main>

      {/* RE-CONSTRUCTED SANITIZED STRINGS FOR THE FONTS LAYER */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}