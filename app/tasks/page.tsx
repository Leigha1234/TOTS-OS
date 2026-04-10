"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Page from "../components/Page";

interface Task {
  id: string;
  title: string;
  project_id: string;
  status: string;
  color: string;
  rotation: number;
}

const FOLDER_COLORS = ["#adb591", "#d6ffba", "#ffc8f6", "#c8f1ff"];

export default function WorkspacePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Gamification State
  const [xp, setXp] = useState(0);

  // Search & Input States
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
    const { data: pData } = await supabase.from("projects").select("*").order('created_at');
    setProjects(pData || []);
    const initial = pData?.[0] || { id: "daily", name: "Today" };
    setSelectedProject(initial);
    loadTasks(initial.id);
    setLoading(false);
  }

  function initSpeech() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (e: any) => setCommand(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }

  async function loadTasks(pId: string) {
    const { data } = await supabase.from("tasks").select("*").eq("project_id", pId).eq("status", "active");
    const colors = ["#fff9c4", "#f8bbd0", "#e1f5fe", "#f1f8e9"];
    setTasks((data || []).map((t, i) => ({
      ...t,
      color: colors[i % colors.length],
      rotation: Math.random() * 6 - 3,
    })));
  }

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function createPostIt() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!command.trim() || !selectedProject || !user) return;
    
    const { data } = await supabase.from("tasks").insert({
      title: command, 
      project_id: selectedProject.id, 
      status: "active",
      user_id: user.id
    }).select().single();

    if (data) setTasks(prev => [{ ...data, color: "#fff9c4", rotation: Math.random() * 4 - 2 }, ...prev]);
    setCommand("");
  }

  const handleAction = async (id: string, dir: 'left' | 'right') => {
    // 🏆 Reward XP on completion (Swipe Right)
    if (dir === 'right') {
      setXp(prev => prev + 25);
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").update({ status: dir === 'right' ? 'completed' : 'binned' }).eq("id", id);
  };

  if (loading) return <div className="p-10 font-bold opacity-30">Opening Desk...</div>;

  return (
    <Page title="">
      <div className="relative min-h-screen w-full bg-[#e9e9e1] overflow-hidden">
        
        {/* --- HEADER BANNER --- */}
        <div className="w-full h-32 bg-[#e2e2d9] border-b border-stone-300 relative flex items-end px-16">
          <div className="flex gap-1 z-10">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProject(p); loadTasks(p.id); }}
                className={`px-8 py-3 rounded-t-xl font-bold text-[11px] uppercase tracking-widest transition-all ${
                  selectedProject?.id === p.id 
                  ? "bg-[#adb591] text-stone-800 translate-y-[1px] h-12" 
                  : "bg-[#d1d1c7] text-stone-500 h-10 hover:bg-[#c8c8bd]"
                }`}
                style={{ backgroundColor: selectedProject?.id === p.id ? FOLDER_COLORS[i % FOLDER_COLORS.length] : undefined }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN WORKSPACE --- */}
        <div className="relative mx-8 mt-4 min-h-[80vh] bg-[#f7f7f2] rounded-t-[3rem] shadow-inner p-12">
          
          {/* 🎮 GAMIFICATION PROGRESS BAR */}
          <div className="flex items-center gap-6 mb-8 px-4 select-none">
            <div className="flex flex-col min-w-[100px]">
              <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Level</span>
              <span className="text-3xl font-serif font-bold text-[#adb591] leading-none">
                {Math.floor(xp / 100) + 1}
              </span>
            </div>
            
            <div className="h-2 flex-1 bg-stone-200/50 rounded-full overflow-hidden relative border border-stone-300/10 shadow-inner">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-[#adb591]" 
                initial={{ width: 0 }}
                animate={{ width: `${(xp % 100)}%` }}
                transition={{ type: "spring", stiffness: 40, damping: 10 }}
              />
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest block">Exp Points</span>
              <span className="text-[12px] font-bold text-stone-400 tabular-nums">
                {xp} XP
              </span>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          <div className="flex items-center gap-4 mb-10 w-full max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes by keyword..."
                className="w-full pl-12 pr-4 py-3 bg-stone-100/50 border border-stone-200 rounded-2xl outline-none focus:bg-white transition-all font-medium text-stone-600"
              />
            </div>
          </div>

          {/* OVERLAPPING SPEAKER INPUT CARD */}
          <div className="absolute -top-16 right-16 z-50 w-[420px]">
            <motion.div className="bg-white p-8 rounded-sm shadow-2xl border-b-[10px] border-stone-100">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#eb4132] shadow-xl border-b-4 border-black/10" />
              
              <textarea 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPostIt()}
                placeholder="Write or Speak..."
                className="w-full h-24 bg-transparent outline-none text-stone-700 font-serif text-3xl placeholder:text-stone-200 resize-none leading-tight"
              />

              <div className="flex items-center justify-between mt-8">
                <button 
                  onMouseDown={() => { setIsListening(true); recognitionRef.current?.start(); }}
                  onMouseUp={() => { recognitionRef.current?.stop(); setTimeout(createPostIt, 500); }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${
                    isListening ? "bg-red-500 scale-90 animate-pulse" : "bg-[#adb591] hover:brightness-105"
                  }`}
                >
                  <span className="text-2xl filter brightness-0 opacity-40">🎤</span>
                </button>
                <div className="text-right">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Hold to speak</p>
                  <p className="text-[9px] font-bold text-[#adb591] uppercase mt-0.5 italic">Adding to {selectedProject?.name}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* DYNAMIC POST-ITS GRID */}
          <div className="flex flex-wrap gap-12 justify-start items-start">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <Note key={task.id} task={task} onAction={handleAction} />
              ))}
            </AnimatePresence>
            
            {filteredTasks.length === 0 && (
              <div className="w-full text-center py-20 opacity-20 font-serif italic text-3xl">
                {searchTerm ? "No matching notes found..." : "This folder is empty."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
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
        if (info.offset.x > 120) { setExitDir("right"); onAction(task.id, 'right'); }
        else if (info.offset.x < -120) { setExitDir("left"); onAction(task.id, 'left'); }
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: task.rotation }}
      exit={{ 
        x: exitDir === 'right' ? 800 : -800,
        y: 200,
        scale: 0.2, 
        rotate: exitDir === 'right' ? 360 : -360, 
        borderRadius: "100%", 
        opacity: 0,
        transition: { duration: 0.5 }
      }}
      style={{ backgroundColor: task.color }}
      className="relative w-64 h-64 p-8 shadow-[10px_20px_40px_-15px_rgba(0,0,0,0.1)] cursor-grab active:cursor-grabbing flex flex-col group border-b border-black/5"
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#3b5998] shadow-md border-b-2 border-black/20" />
      <p className="text-stone-800 font-serif text-2xl font-bold leading-tight pt-5 select-none">{task.title}</p>
      
      <div className="mt-auto flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => { setExitDir("left"); onAction(task.id, 'left'); }} className="text-[10px] font-black text-stone-400 hover:text-red-500 uppercase tracking-widest">🗑️ Bin</button>
        <button onClick={() => { setExitDir("right"); onAction(task.id, 'right'); }} className="text-[10px] font-black text-stone-400 hover:text-green-600 uppercase tracking-widest">Done ✅</button>
      </div>
      
      <div className="absolute bottom-[-8px] left-0 w-full h-3 opacity-[0.05] bg-black" style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }} />
    </motion.div>
  );
}