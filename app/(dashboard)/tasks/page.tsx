"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Trash2, CheckCircle, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  project_id: string;
  status: string;
  color: string;
  rotation: number;
}

const FOLDER_COLORS = ["#adb591", "#d6ffba", "#ffc8f6", "#c8f1ff"];
const POSTIT_COLORS = ["#fff9c4", "#f8bbd0", "#e1f5fe", "#f1f8e9"];

export default function WorkspacePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    init();
    initSpeech();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Projects, XP, and Tasks in parallel
    const [pRes, profileRes] = await Promise.all([
      supabase.from("projects").select("*").order('created_at'),
      supabase.from("profiles").select("xp").eq("id", user.id).single()
    ]);

    if (profileRes.data) setXp(profileRes.data.xp || 0);
    
    const projectList = pRes.data || [];
    setProjects(projectList);
    
    const initial = projectList[0] || { id: "daily", name: "Today" };
    setSelectedProject(initial);
    loadTasks(initial.id);
    setLoading(false);
  }

  function initSpeech() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (e: any) => setCommand(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }

  async function loadTasks(pId: string) {
    const { data } = await supabase.from("tasks").select("*").eq("project_id", pId).eq("status", "active");
    setTasks((data || []).map((t, i) => ({
      ...t,
      // Use the ID to generate a stable color so it doesn't change on refresh
      color: POSTIT_COLORS[t.title.length % POSTIT_COLORS.length],
      rotation: (t.title.length % 6) - 3,
    })));
  }

  async function createPostIt() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!command.trim() || !selectedProject || !user) return;
    
    const { data } = await supabase.from("tasks").insert({
      title: command, 
      project_id: selectedProject.id, 
      status: "active",
      user_id: user.id
    }).select().single();

    if (data) {
      setTasks(prev => [{ 
        ...data, 
        color: POSTIT_COLORS[Math.floor(Math.random() * POSTIT_COLORS.length)], 
        rotation: Math.random() * 4 - 2 
      }, ...prev]);
      setCommand("");
    }
  }

  const handleAction = async (id: string, dir: 'left' | 'right') => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (dir === 'right') {
      const newXp = xp + 25;
      setXp(newXp);
      // Persist XP to database
      if (user) {
        await supabase.from("profiles").update({ xp: newXp }).eq("id", user.id);
      }
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").update({ status: dir === 'right' ? 'completed' : 'binned' }).eq("id", id);
  };

  if (loading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-serif italic text-[var(--text-muted)] text-2xl">Opening Desk...</div>;

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg)] overflow-hidden transition-colors duration-500">
        
        {/* --- FOLDER TABS --- */}
        <div className="w-full h-32 bg-[var(--bg-soft)] border-b border-[var(--border)] relative flex items-end px-16">
          <div className="flex gap-1 z-10">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); loadTasks(p.id); }}
                className={`px-8 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                  selectedProject?.id === p.id 
                  ? "translate-y-[1px] h-14 shadow-lg text-stone-800" 
                  : "bg-stone-300/30 text-[var(--text-muted)] h-11 hover:h-12"
                }`}
                style={{ backgroundColor: selectedProject?.id === p.id ? FOLDER_COLORS[i % FOLDER_COLORS.length] : undefined }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="relative mx-4 md:mx-10 mt-6 min-h-[80vh] glass-panel p-12 shadow-2xl">
          
          {/* XP PROGRESS BAR */}
          <div className="flex items-center gap-8 mb-12 select-none">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Level</span>
              <span className="text-4xl font-serif italic font-bold text-[var(--accent)] leading-none">
                {Math.floor(xp / 100) + 1}
              </span>
            </div>
            
            <div className="h-3 flex-1 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
              <motion.div 
                className="h-full bg-[var(--accent)]" 
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 100)}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>

            <div className="text-right">
              <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Experience</span>
              <span className="text-sm font-mono font-bold text-[var(--text-muted)]">{xp} XP</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            {/* SEARCH */}
            <div className="relative w-full max-w-sm">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-40" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search archive..."
                className="w-full pl-12 pr-4 py-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--accent)] text-sm font-medium"
              />
            </div>

            {/* INPUT CARD */}
            <motion.div className="bg-white p-8 rounded-2xl shadow-2xl border-b-[8px] border-stone-100 w-full md:w-[450px]">
              <textarea 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPostIt()}
                placeholder="New thought..."
                className="w-full h-20 bg-transparent outline-none text-stone-800 font-serif text-3xl placeholder:text-stone-200 resize-none leading-tight"
              />

              <div className="flex items-center justify-between mt-6">
                <button 
                  onMouseDown={() => { setIsListening(true); recognitionRef.current?.start(); }}
                  onMouseUp={() => { recognitionRef.current?.stop(); setTimeout(createPostIt, 500); }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isListening ? "bg-red-500 scale-95 animate-pulse" : "bg-[var(--accent)] hover:brightness-105"
                  }`}
                >
                  <Mic size={24} className={isListening ? "text-white" : "text-stone-700"} />
                </button>
                <div className="text-right">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Hold to transcribe</p>
                  <p className="text-[10px] font-bold text-[var(--accent)] italic mt-1 uppercase tracking-tighter">Adding to {selectedProject?.name}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* POST-ITS GRID */}
          <div className="flex flex-wrap gap-10 justify-start items-start pb-20">
            <AnimatePresence mode="popLayout">
              {tasks
                .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((task) => (
                  <Note key={task.id} task={task} onAction={handleAction} />
                ))
              }
            </AnimatePresence>
          </div>
        </div>
    </div>
  );
}

function Note({ task, onAction }: { task: Task; onAction: (id: string, dir: 'left' | 'right') => void }) {
  const [exitDir, setExitDir] = useState<"left" | "right">("right");

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) { setExitDir("right"); onAction(task.id, 'right'); }
        else if (info.offset.x < -100) { setExitDir("left"); onAction(task.id, 'left'); }
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: task.rotation }}
      exit={{ 
        x: exitDir === 'right' ? 600 : -600,
        rotate: exitDir === 'right' ? 45 : -45,
        opacity: 0,
        transition: { duration: 0.4 }
      }}
      style={{ backgroundColor: task.color }}
      className="relative w-64 h-64 p-8 shadow-xl cursor-grab active:cursor-grabbing flex flex-col group border-b-4 border-black/10 rounded-sm"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-stone-800/20 shadow-inner" />
      <p className="text-stone-800 font-serif text-2xl font-bold leading-tight pt-4 select-none italic">{task.title}</p>
      
      <div className="mt-auto flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setExitDir("left"); onAction(task.id, 'left'); }} className="p-2 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
        <button onClick={() => { setExitDir("right"); onAction(task.id, 'right'); }} className="p-2 hover:text-green-700 transition-colors"><CheckCircle size={18}/></button>
      </div>
    </motion.div>
  );
}