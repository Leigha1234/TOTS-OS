"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Trash2, CheckCircle } from "lucide-react";

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
    setTasks((data || []).map((t) => ({
      ...t,
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
      if (user) await supabase.from("profiles").update({ xp: newXp }).eq("id", user.id);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").update({ status: dir === 'right' ? 'completed' : 'binned' }).eq("id", id);
  };

  if (loading) return <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center font-serif italic text-[var(--text-muted)] text-2xl">Opening Desk...</div>;

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg)] overflow-hidden transition-colors duration-500">
        
        {/* TABS */}
        <div className="w-full h-32 bg-[var(--bg-soft)] border-b border-[var(--border)] relative flex items-end px-16">
          <div className="flex gap-1 z-10">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); loadTasks(p.id); }}
                className={`px-8 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
                  selectedProject?.id === p.id ? "translate-y-[1px] h-14 bg-white shadow-lg text-stone-800" : "bg-stone-300/30 text-[var(--text-muted)] h-11 hover:h-12"
                }`}
                style={{ backgroundColor: selectedProject?.id === p.id ? FOLDER_COLORS[i % FOLDER_COLORS.length] : undefined }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto p-8 md:p-12 space-y-12">
          
          {/* XP PROGRESS BAR */}
          <div className="flex items-center justify-between gap-12 bg-[var(--card-bg)] p-8 rounded-[2.5rem] border border-[var(--border)] backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-8 flex-1">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Level</span>
                <span className="text-5xl font-serif italic text-[var(--accent)] leading-none">{Math.floor(xp / 100) + 1}</span>
              </div>
              <div className="flex-1 h-3 bg-[var(--bg)] rounded-full border border-[var(--border)] overflow-hidden shadow-inner">
                <motion.div className="h-full bg-[var(--accent)]" animate={{ width: `${xp % 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 block">Experience</span>
              <span className="font-mono font-bold text-xl">{xp} XP</span>
            </div>
          </div>

          {/* INPUT & SEARCH GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="glass-panel p-8 flex items-center gap-5 shadow-lg border border-[var(--border)]">
              <Search className="opacity-20" size={24} />
              <input 
                className="bg-transparent w-full outline-none font-serif italic text-2xl" 
                placeholder="Search archive..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl border-b-[10px] border-black/5">
              <textarea 
                className="w-full h-24 bg-transparent outline-none text-3xl font-serif italic resize-none leading-tight" 
                placeholder="New thought..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPostIt()}
              />
              <div className="flex justify-between items-center mt-6">
                <button 
                  onMouseDown={() => { setIsListening(true); recognitionRef.current?.start(); }}
                  onMouseUp={() => { recognitionRef.current?.stop(); setTimeout(createPostIt, 500); }}
                  className={`p-5 rounded-2xl shadow-xl transition-all ${isListening ? 'bg-red-500 scale-90 animate-pulse' : 'bg-[var(--accent)] hover:brightness-105'}`}
                >
                  <Mic size={24} className="text-white" />
                </button>
                <div className="text-right opacity-40 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                  Hold to transcribe<br/>
                  <span className="text-[var(--accent)]">Adding to {selectedProject?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES GRID */}
          <div className="flex flex-wrap gap-12 pb-32">
            <AnimatePresence mode="popLayout">
              {tasks
                .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(task => (
                  <Note key={task.id} task={task} onAction={handleAction} />
                ))}
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
      layout drag="x" dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) { setExitDir("right"); onAction(task.id, 'right'); }
        else if (info.offset.x < -100) { setExitDir("left"); onAction(task.id, 'left'); }
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: task.rotation }}
      exit={{ x: exitDir === 'right' ? 600 : -600, opacity: 0, rotate: exitDir === 'right' ? 45 : -45 }}
      style={{ backgroundColor: task.color }}
      className="relative w-72 h-72 p-10 shadow-2xl cursor-grab active:cursor-grabbing flex flex-col group border-b-4 border-black/10 rounded-sm"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-stone-800/10 shadow-inner" />
      <p className="text-stone-800 font-serif text-3xl font-bold leading-tight pt-4 select-none italic">{task.title}</p>
      <div className="mt-auto flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setExitDir("left"); onAction(task.id, 'left'); }} className="p-2 hover:scale-125 transition-transform"><Trash2 size={20}/></button>
        <button onClick={() => { setExitDir("right"); onAction(task.id, 'right'); }} className="p-2 hover:scale-125 transition-transform"><CheckCircle size={20}/></button>
      </div>
    </motion.div>
  );
}