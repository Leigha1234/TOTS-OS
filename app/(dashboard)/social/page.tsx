"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, User, Camera, 
  CheckCircle2, Upload, Calendar as CalIcon,
  Sparkles, Edit3, X, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

// --- Interfaces ---
interface SocialNode {
  id: string;
  title: string;
  platform: string;
  format: string;
  media_url: string;
  status: string;
  scheduled_date: string;
  created_at: string;
}

export default function SocialStudio() {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [isManualMode, setIsManualMode] = useState(true);
  const [status, setStatus] = useState("Ready");
  
  // --- Form State ---
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- Data State ---
  const [nodes, setNodes] = useState<SocialNode[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Database Sync ---
  const syncNodes = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setNodes((data as SocialNode[]) || []);
      setStatus("Ready");
    }
  };

  useEffect(() => {
    syncNodes();
    const channel = supabase.channel('social_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'socials' }, syncNodes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAISynthesis = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setStatus("Synthesizing");
    
    // Simulate AI synthesis logic
    await new Promise(r => setTimeout(r, 1800));
    
    const aiCaption = `✨ [AI Optimized]: ${prompt}\n\n#Innovation #SocialGrowth`;
    const aiImage = `https://picsum.photos/seed/${Math.random()}/800/1200`;
    
    setPrompt(aiCaption);
    setMediaPreview(aiImage);
    setIsGenerating(false);
    setStatus("Ready");
    toast.success("Content synthesized. You can now edit and schedule.");
  };

  const handleCommitToCloud = async () => {
    if (!prompt) return;
    setStatus("Persisting");
    
    const { error } = await supabase.from('socials').insert([{
      title: prompt,
      platform,
      format: "Image",
      status: "Scheduled",
      media_url: mediaPreview || `https://picsum.photos/seed/${Math.random()}/800/1200`,
      scheduled_date: new Date().toISOString()
    }]);

    if (!error) {
      toast.success("Node scheduled and added to calendar");
      setPrompt("");
      setMediaPreview(null);
      syncNodes();
    }
  };

  const deleteNode = async (id: string) => {
    const { error } = await supabase.from('socials').delete().eq('id', id);
    if (!error) {
      toast.success("Node purged");
      syncNodes();
    }
  };

  // --- Calendar Logic ---
  const calendar = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ d: 0, current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, current: true });
    return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year: y };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] p-8 font-sans antialiased">
      
      {/* Header Nav */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-stone-100 shadow-sm sticky top-8 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1c1c1c] rounded-2xl flex items-center justify-center text-[#a9b897]">
              <Layers size={20} />
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">TOTs Studio</p>
              <p className="text-[8px] font-bold text-stone-300 uppercase mt-1">v5.2.0_Core</p>
            </div>
          </div>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {(["lab", "scheduler"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-[#1c1c1c] shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-stone-50 border-stone-100">
             <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
             <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">{status}</span>
           </div>
           <button onClick={syncNodes} className="p-2.5 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"><RefreshCcw size={16}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* --- SOCIAL LAB --- */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-16">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Synthesis Hub</p>
                    <h1 className="text-7xl font-serif italic text-[#1c1c1c] tracking-tight">The Lab.</h1>
                  </div>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button onClick={() => setIsManualMode(true)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>Manual</button>
                    <button onClick={() => setIsManualMode(false)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}>AI Sync</button>
                  </div>
                </header>

                <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl space-y-10 relative overflow-hidden">
                  {!isManualMode && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a9b897] to-transparent animate-shimmer" />
                  )}
                  
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase text-stone-300">Target Platform</label>
                    <div className="flex gap-3">
                      {["Instagram", "LinkedIn", "Twitter"].map(p => (
                        <button key={p} onClick={() => setPlatform(p)} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>{p}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-stone-300">Content Logic</label>
                      <textarea 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isManualMode ? "Write your caption..." : "Describe the vision for AI synthesis..."}
                        className="w-full h-72 bg-stone-50 rounded-[2.5rem] p-10 text-2xl font-serif italic outline-none resize-none shadow-inner transition-all focus:bg-white border-2 border-transparent focus:border-stone-50"
                      />
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-stone-300">Visual Asset</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-72 rounded-[2.5rem] bg-stone-50 border-2 border-dashed border-stone-100 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative group"
                      >
                        {mediaPreview ? (
                          <>
                            <img src={mediaPreview} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Edit3 className="text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm"><Upload className="text-stone-300" size={24}/></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Import Media</p>
                          </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {!isManualMode && (
                      <button 
                        onClick={handleAISynthesis} 
                        disabled={!prompt || isGenerating}
                        className="flex-1 bg-stone-100 text-stone-900 py-6 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 hover:bg-stone-200 transition-all"
                      >
                        {isGenerating ? "Synthesizing..." : "Run AI Engine"} <Sparkles size={18} className="text-[#a9b897]"/>
                      </button>
                    )}
                    <button 
                      onClick={handleCommitToCloud}
                      disabled={!prompt}
                      className="flex-1 bg-[#1c1c1c] text-white py-6 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-stone-400/20 hover:scale-[1.01] transition-transform"
                    >
                      Schedule Node <Zap size={18} fill="#a9b897" className="text-[#a9b897]"/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-10 pt-28">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-300">Live Infrastructure</h3>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>
                <div className="space-y-5">
                  {nodes.slice(0, 4).map(node => (
                    <motion.div layout key={node.id} className="bg-white p-5 rounded-[2.5rem] border border-stone-100 flex items-center gap-5 group hover:border-[#a9b897] transition-all shadow-sm">
                      <div className="w-20 h-20 bg-stone-50 rounded-3xl overflow-hidden flex-shrink-0 shadow-inner">
                        <img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-[#a9b897] mb-1">{node.platform}</p>
                        <p className="text-lg font-serif italic truncate text-stone-600 leading-tight">"{node.title}"</p>
                      </div>
                      <button onClick={() => deleteNode(node.id)} className="p-3 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={18}/>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- SCHEDULER --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <header className="flex justify-between items-end border-b border-stone-100 pb-12">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Temporal Matrix</p>
                    <h1 className="text-7xl font-serif italic text-[#1c1c1c] tracking-tight leading-none">Scheduler.</h1>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-5 bg-white border border-stone-100 rounded-3xl hover:shadow-xl transition-all"><ChevronLeft size={24}/></button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-5 bg-white border border-stone-100 rounded-3xl hover:shadow-xl transition-all"><ChevronRight size={24}/></button>
                  </div>
               </header>
               
               <div className="grid grid-cols-7 gap-6 bg-white p-20 rounded-[5rem] border border-stone-100 shadow-2xl shadow-stone-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[11px] font-black text-stone-200 uppercase tracking-widest pb-10">{d}</div>
                  ))}
                  {calendar.days.map((day, i) => {
                    // Check if there is a post for this day
                    const hasNode = nodes.some(n => {
                       const d = new Date(n.scheduled_date);
                       return d.getDate() === day.d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    });
                    
                    return (
                      <div key={i} className={`aspect-square rounded-[2rem] border border-stone-50 flex items-center justify-center text-4xl font-serif italic relative group ${day.current ? 'text-[#1c1c1c] hover:bg-stone-50 hover:shadow-lg transition-all cursor-pointer' : 'text-stone-50 opacity-10 pointer-events-none'}`}>
                        {day.d > 0 ? day.d : ""}
                        {hasNode && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-6 w-2.5 h-2.5 rounded-full bg-[#a9b897] shadow-[0_0_15px_#a9b897]" />
                        )}
                      </div>
                    );
                  })}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
      `}</style>
    </div>
  );
}