"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getUserTeam } from "@/lib/getUserTeam";
import { getUserRole } from "@/lib/permissions";
import { 
  Sparkles, Plus, X, Loader2, Folder, 
  CheckSquare, BarChart3, Layers, Users, 
  Star, Tag as TagIcon, StickyNote, Check, AlertCircle, 
  ArrowRight, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

// --- TYPES ---
interface Task {
  id: string;
  project_id: string;
  name: string;
  status: string;
  priority: string;
}

interface Note {
  id: string;
  content: string;
  category: string;
  color: string;
  is_urgent: boolean;
}

export default function ProjectsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("work"); 
  const [activeTab, setActiveTab] = useState("overview"); 

  // Application States
  const [projects, setProjects] = useState<any[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]); // New: To link Vault data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newTaskName, setNewTaskName] = useState<{ [key: string]: string }>({});

  // New Project Form
  const [projectName, setProjectName] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  // Fetch Projects and linked Vault notes
  const loadData = useCallback(async (team: string) => {
    // 1. Fetch Projects
    const { data: projData } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", team)
      .order("created_at", { ascending: false });

    // 2. Fetch All Notes (to cross-reference tags)
    const { data: noteData } = await supabase
      .from("notes")
      .select("*");

    setProjects(projData || []);
    setAllNotes(noteData || []);
    
    if (projData && projData.length > 0 && !selectedProject) {
        setSelectedProject(projData[0]);
    }
    setLoading(false);
  }, [supabase, selectedProject]);

  useEffect(() => {
    setIsMounted(true);
    async function init() {
      const team = await getUserTeam();
      if (!team) {
        setTeamId("mock-team");
        setLoading(false);
        return;
      }
      setTeamId(team);
      loadData(team);
    }
    init();
  }, [loadData]);

  // Create Project Function
  const handleCreateProject = async () => {
    if (!projectName.trim() || !teamId) return;
    setIsSyncing(true);

    const { data, error } = await supabase
      .from("projects")
      .insert([{ 
        name: projectName, 
        team_id: teamId,
        status: "active" 
      }])
      .select();

    if (!error) {
      toast.success("Project launched.");
      setProjectName("");
      setShowCreateModal(false);
      loadData(teamId);
    } else {
      toast.error("Failed to create project.");
    }
    setIsSyncing(false);
  };

  // Filter notes that match the current project's name (Tag)
  const linkedNotes = useMemo(() => {
    if (!selectedProject) return [];
    return allNotes.filter(note => 
      note.category?.toLowerCase() === selectedProject.name?.toLowerCase()
    );
  }, [allNotes, selectedProject]);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`workspace_export.pdf`);
  };

  if (!isMounted) return null;
  if (loading) return <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center font-serif italic text-stone-300 text-4xl underline decoration-stone-200">Initializing Ecosystem...</div>;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 lg:p-12 max-w-[1700px] mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[var(--border)] pb-8 gap-8 mb-12">
        <div className="space-y-2">
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Projects</h1>
          <p className="text-[var(--brand-primary)] font-black uppercase text-[9px] tracking-[0.3em]">Operational Strategy / {activeMode}</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-800 transition-all active:scale-95"
          >
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">New Project</span>
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border)] px-6 py-4 rounded-2xl text-[var(--text-muted)] hover:text-black transition-all">
            <Folder size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">Export</span>
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Project Selector Aside */}
        <aside className="w-full lg:w-72 space-y-8">
          <div>
            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] mb-6 block">Active Portfolios</span>
            <div className="space-y-1">
                {projects.map((p) => (
                <button 
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs text-left transition-all ${
                        selectedProject?.id === p.id 
                        ? "bg-stone-900 text-white shadow-lg" 
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)]"
                    }`}
                >
                    <span className="truncate font-semibold">{p.name}</span>
                    <ArrowRight size={12} className={selectedProject?.id === p.id ? "opacity-100" : "opacity-0"} />
                </button>
                ))}
            </div>
          </div>
        </aside>

        {/* Dynamic Content */}
        <div className="flex-1 space-y-10">
          <div className="flex flex-wrap gap-8 border-b border-[var(--border)] pb-3">
            {["Overview", "Board", "Linked Vault"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab.toLowerCase().replace(" ", "-") ? "text-black border-b-2 border-black" : "text-[var(--text-muted)] hover:text-black"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* PROJECT OVERVIEW + VAULT NOTES */}
          {activeTab === "overview" && selectedProject && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-4">
              
              {/* Project Main Details */}
              <div className="xl:col-span-2 space-y-8">
                <div className="bg-white border border-[var(--border)] p-12 rounded-[3rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                        <Star size={24} className="text-stone-100" />
                    </div>
                    <span className="px-4 py-1.5 bg-stone-50 rounded-full text-[9px] font-black uppercase text-stone-400 tracking-widest border border-stone-100">Project Workspace</span>
                    <h2 className="text-6xl font-serif italic text-stone-900 mt-6 mb-4">{selectedProject.name}</h2>
                    <div className="flex gap-6 mt-12">
                        <div className="flex items-center gap-2 text-stone-400">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Added {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* LINKED NOTES SIDEBAR (The magic part) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <StickyNote size={16} className="text-[var(--brand-primary)]" />
                        Linked Vault
                    </h3>
                    <span className="bg-stone-100 text-[10px] font-bold px-2 py-1 rounded-md">{linkedNotes.length}</span>
                </div>
                
                <div className="space-y-4">
                    {linkedNotes.length > 0 ? (
                        linkedNotes.map((note) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={note.id}
                                className="p-6 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                                style={{ backgroundColor: note.color || '#fff' }}
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-white/20 backdrop-blur-sm border border-white/10" />
                                <p className="text-sm font-serif italic text-stone-800 leading-tight mb-4">{note.content}</p>
                                <div className="flex items-center gap-2">
                                    <TagIcon size={10} className="text-stone-400" />
                                    <span className="text-[8px] font-black uppercase text-stone-400 tracking-widest">{note.category}</span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-12 border-2 border-dashed border-stone-100 rounded-[2rem] text-center">
                            <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.2em]">No notes tagged "{selectedProject.name}"</p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-4xl font-serif italic lowercase">New Project</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-stone-300 hover:text-stone-900 transition-colors">
                  <X size={24}/>
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 ml-2">Internal Title / Tag</label>
                    <input 
                        autoFocus
                        placeholder="Project Name..."
                        className="w-full text-3xl font-serif italic outline-none border-b border-stone-100 pb-4 focus:border-stone-900 transition-all"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleCreateProject}
                    disabled={isSyncing}
                    className="w-full bg-stone-900 text-white py-6 rounded-full font-black uppercase text-[11px] tracking-[0.5em] shadow-xl hover:bg-stone-800 transition-all flex items-center justify-center gap-4"
                >
                    {isSyncing ? <Loader2 size={18} className="animate-spin" /> : "Initiate Workspace"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        :root {
          --bg: #F9F9F7;
          --card-bg: #FFFFFF;
          --border: #EFEFEF;
          --text-main: #1C1917;
          --text-muted: #A8A29E;
          --brand-primary: #1C1917;
          --bg-soft: #F5F5F3;
        }
      `}</style>
    </div>
  );
}