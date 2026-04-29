"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client"; // Use sync client
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mic, Trash2, CheckCircle, Zap, Layers } from "lucide-react";

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

  useEffect(() => { init(); initSpeech(); }, []);

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
      color: POSTIT_COLORS[Math.floor(Math.random() * POSTIT_COLORS.length)],
      rotation: Math.random() * 6 - 3,
    })));
  }

  async function createPostIt() {
    const { data: { user } } = await supabase.auth.getUser();
    const finalCommand = command.trim();
    if (!finalCommand || !selectedProject || !user) return;
    
    const { data, error } = await supabase.from("tasks").insert({
      title: finalCommand, 
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
    await supabase.from("tasks").update({ 
      status: dir === 'right' ? 'completed' : 'binned' 
    }).eq("id", id);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center font-serif italic text-stone-300 text-2xl animate-pulse">
      Opening Desk...
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#faf9f6] overflow-x-hidden font-sans">
        {/* TABS NAVIGATION */}
        <div className="w-full h-32 bg-[#f0efe9] border-b border-stone-200 relative flex items-end px-16">
          <div className="flex gap-1 z-10">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); loadTasks(p.id); }}
                className={`px-8 py-3 rounded-t-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 ${
                  selectedProject?.id === p.id 
                  ? "translate-y-[1px] h-14 bg-white shadow-[-5px_-5px_15px_rgba(0,0,0,0.02)] text-stone-800" 
                  : "bg-stone-300/30 text-stone-400 h-11 hover:h-12"
                }`}
                style={{ backgroundColor: selectedProject?.id === p.id ? FOLDER_COLORS[i % FOLDER_COLORS.length] : undefined }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto p-8 md:p-12 space-y-12">
          {/* XP ENGINE BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
            <div className="flex items-center gap-8 flex-1 w-full">
              <div className="flex flex-col">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">System Level</p>
                <span className="text-5xl font-serif italic text-purple-500 leading-none">
                  {Math.floor(xp / 100) + 1}
                </span>
              </div>
              <div className="flex-1 h-2 bg-stone-50 rounded-full border border-stone-100 overflow-hidden relative">
                <motion.div 
                  className="h-full bg-purple-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${xp % 100}%` }} 
                  transition={{ type: "spring", bounce: 0, duration: 1 }}
                />
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Archive Strength</p>
              <span className="font-mono font-bold text-xl text-stone-800">{xp} XP</span>
            </div>
          </div>

          {/* UTILITY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-[2rem] flex items-center gap-5 border border-stone-100 shadow-sm h-full">
              <Search className="text-stone-300" size={20} />
              <input 
                className="bg-transparent w-full outline-none font-serif italic text-xl text-stone-700 placeholder-stone-200" 
                placeholder="Search the grid..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-2xl border-b-[10px] border-black/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={40} />
              </div>
              <textarea 
                className="w-full h-24 bg-transparent outline-none text-3xl font-serif italic resize-none leading-tight text-stone-800 placeholder-stone-200" 
                placeholder="Drop a thought..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPostIt()}
              />
              <div className="flex justify-between items-center mt-6">
                <button 
                  onMouseDown={() => { setIsListening(true); recognitionRef.current?.start(); }}
                  onMouseUp={() => { recognitionRef.current?.stop(); setTimeout(createPostIt, 400); }}
                  className={`p-6 rounded-2xl shadow-xl transition-all ${isListening ? 'bg-red-500 scale-90 animate-pulse text-white' : 'bg-stone-900 text-white hover:brightness-110'}`}
                >
                  <Mic size={24} />
                </button>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 leading-tight">
                    HOLD TO TRANSCRIBE
                  </p>
                  <p className="text-[10px] font-bold text-purple-500 uppercase mt-1 italic">
                    Node: {selectedProject?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES FLOW */}
          <div className="flex flex-wrap gap-12 pb-32">
            <AnimatePresence mode="popLayout">
              {tasks
                .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(task => (
                  <Note key={task.id} task={task} onAction={handleAction} />
                ))}
            </AnimatePresence>
            
            {tasks.length === 0 && (
               <div className="w-full py-20 text-center space-y-4">
                  <Layers className="mx-auto text-stone-100" size={64} />
                  <p className="font-serif italic text-2xl text-stone-200">The horizon is clear.</p>
               </div>
            )}
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
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, rotate: task.rotation, y: 0 }}
      exit={{ 
        x: exitDir === 'right' ? 800 : -800, 
        opacity: 0, 
        rotate: exitDir === 'right' ? 45 : -45,
        transition: { duration: 0.4 }
      }}
      style={{ backgroundColor: task.color }}
      className="relative w-72 h-72 p-10 shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.1)] cursor-grab active:cursor-grabbing flex flex-col group border-b-4 border-black/5 rounded-sm"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-stone-900/5 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-900/10" />
      </div>
      
      <p className="text-stone-800 font-serif text-3xl font-bold leading-tight pt-4 select-none italic">
        {task.title}
      </p>

      <div className="mt-auto flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => { setExitDir("left"); onAction(task.id, 'left'); }} 
          className="p-3 bg-white/40 hover:bg-white/80 rounded-full transition-all text-stone-600 hover:text-red-500"
        >
          <Trash2 size={18}/>
        </button>
        <button 
          onClick={() => { setExitDir("right"); onAction(task.id, 'right'); }} 
          className="p-3 bg-white/40 hover:bg-white/80 rounded-full transition-all text-stone-600 hover:text-green-600"
        >
          <CheckCircle size={18}/>
        </button>
      </div>

      {/* Ripped Paper Detail */}
      <div className="absolute bottom-[-4px] left-0 w-full h-2 opacity-[0.03] bg-black" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }} />
    </motion.div>
  );
}