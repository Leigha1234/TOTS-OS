"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Zap, Calendar as CalendarIcon, Database,
  User, Plus, Camera, Cpu, ShieldCheck, RefreshCcw,
  List, LayoutGrid, Layers, CheckCircle2, Clock
} from "lucide-react";
import { toast } from "sonner";

// --- Types ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "TikTok";
type PostFormat = "Image" | "Video" | "Carousel";
type StudioStatus = "Ready" | "Syncing" | "Synthesizing" | "Error";

interface PostNode {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: string;
  created_at: string;
  format: PostFormat;
}

const PLATFORMS: Platform[] = ["Instagram", "LinkedIn", "Twitter", "TikTok"];
const FORMATS: PostFormat[] = ["Image", "Video", "Carousel"];

export default function SocialStudioPro() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<StudioStatus>("Ready");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [format, setFormat] = useState<PostFormat>("Image");
  const [nodes, setNodes] = useState<PostNode[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Database Logic ---
  const syncNodes = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Database connection failed");
      setStatus("Error");
      return;
    }

    setNodes(data.map(d => ({
      id: d.id,
      platform: d.platform || "Instagram",
      caption: d.title || "Untitled node",
      media_url: d.media_url || `https://picsum.photos/seed/${d.id}/800/1000`,
      status: d.status || "Draft",
      created_at: d.created_at,
      format: d.format || "Image"
    })));
    setStatus("Ready");
  };

  useEffect(() => {
    setIsMounted(true);
    syncNodes();

    const channel = supabase.channel('studio_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, syncNodes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // --- Action Handlers ---
  const handleSynthesize = async () => {
    if (!prompt || status === "Synthesizing") return;
    setStatus("Synthesizing");

    const { error } = await supabase.from('tasks').insert([{
      title: prompt,
      platform: platform,
      format: format,
      status: "Draft",
      media_url: `https://picsum.photos/seed/${Math.random()}/800/1200`
    }]);

    if (error) {
      toast.error("Synthesis failed to save");
      setStatus("Error");
    } else {
      toast.success("Content node persisted");
      setPrompt("");
      syncNodes();
    }
  };

  const purgeNode = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) toast.success("Node purged");
  };

  // --- Calendar Engine ---
  const calendar = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];

    // Padding
    const prevDays = new Date(y, m, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) days.push({ d: prevDays - i, current: false });
    // Current
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, current: true });
    // Next
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ d: i, current: false });

    return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year: y };
  }, [currentDate]);

  const shiftMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 antialiased font-sans">
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-[#a9b897] shadow-lg shadow-stone-200">
              <Layers size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Social Studio</span>
              <span className="text-[8px] font-bold text-stone-300 uppercase mt-1">v5.0 Stable</span>
            </div>
          </div>
          
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/50">
            {["lab", "scheduler"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${status === 'Error' ? 'bg-red-50 border-red-100' : 'bg-stone-50 border-stone-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : status === 'Error' ? 'bg-red-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-[8px] font-black uppercase text-stone-400">{status}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center text-[#a9b897] border-2 border-stone-100 shadow-inner">
            <User size={16} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          
          {/* SOCIAL LAB VIEW */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-12">
              <div className="col-span-12 lg:col-span-8 space-y-12">
                <header>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897] mb-2">Content Synthesis</p>
                  <h1 className="text-6xl font-serif italic text-stone-900 leading-none tracking-tight">Social Lab</h1>
                </header>

                <div className="bg-white rounded-[3rem] border border-stone-100 p-10 shadow-xl shadow-stone-200/40 space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <section className="space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-1">Platform Logic</label>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map(p => (
                          <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all duration-300 ${platform === p ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-1">Asset Format</label>
                      <div className="flex flex-wrap gap-2">
                        {FORMATS.map(f => (
                          <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold border transition-all duration-300 ${format === f ? 'bg-[#a9b897] text-white border-[#a9b897] shadow-lg' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{f}</button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Input vision for synthesis..."
                      className="w-full h-56 bg-stone-50 rounded-[2.5rem] p-10 text-2xl font-serif italic outline-none text-stone-800 placeholder-stone-200 border-2 border-transparent focus:border-stone-100 transition-all resize-none shadow-inner"
                    />
                    <div className="absolute bottom-8 right-8 flex gap-4">
                      <button className="p-4 bg-white border border-stone-100 rounded-2xl text-stone-300 hover:text-[#a9b897] transition-all shadow-sm">
                        <Camera size={20} />
                      </button>
                      <button
                        onClick={handleSynthesize}
                        disabled={!prompt || status === "Synthesizing"}
                        className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3"
                      >
                        {status === "Synthesizing" ? "Processing..." : "Generate Node"}
                        <Zap size={16} fill="currentColor" className="text-[#a9b897]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Database History</h3>
                    <div className="h-px flex-1 bg-stone-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    {nodes.slice(0, 4).map((node) => (
                      <div key={node.id} className="bg-white rounded-[2.5rem] p-5 border border-stone-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                        <div className="aspect-[16/10] rounded-[2rem] overflow-hidden bg-stone-50 mb-6 relative">
                          <img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm">{node.platform}</div>
                        </div>
                        <p className="text-xl font-serif italic text-stone-700 leading-snug px-2 line-clamp-2">"{node.caption}"</p>
                        <div className="mt-8 flex gap-3">
                           <button className="flex-1 py-4 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-stone-200">Schedule</button>
                           <button onClick={() => purgeNode(node.id)} className="p-4 bg-stone-50 text-stone-300 rounded-2xl hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Logic */}
              <aside className="col-span-12 lg:col-span-4 space-y-10">
                <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <ShieldCheck size={200} className="absolute -right-20 -top-20 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity" />
                  <div className="relative z-10 space-y-8">
                    <header className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">System Core</h4>
                       <RefreshCcw size={14} className={`opacity-40 ${status === 'Syncing' ? 'animate-spin' : ''}`} />
                    </header>
                    <div className="space-y-6">
                      {[
                        { label: "Cloud Integrity", val: "Verified", icon: <CheckCircle2 size={12}/> },
                        { label: "Sync Latency", val: "18ms", icon: <Clock size={12}/> },
                        { label: "Node Count", val: nodes.length, icon: <Database size={12}/> }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-end border-b border-white/5 pb-3">
                          <span className="text-[9px] font-bold text-stone-500 uppercase flex items-center gap-2">
                            {item.icon} {item.label}
                          </span>
                          <span className="text-xl font-serif italic text-[#a9b897]">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#a9b897] p-10 rounded-[3rem] space-y-5 relative overflow-hidden">
                   <Sparkles size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-stone-900/40 leading-none">Creative Insight</span>
                   <p className="text-3xl font-serif italic text-stone-900 leading-[1.1] tracking-tight">Your organic database resonance is peaking on <span className="underline decoration-white underline-offset-8 decoration-2">LinkedIn</span>.</p>
                </div>
              </aside>
            </motion.div>
          )}

          {/* SOCIAL SCHEDULER VIEW */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <header className="flex justify-between items-end border-b border-stone-100 pb-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Chronos Grid</p>
                  <h1 className="text-6xl font-serif italic text-stone-900 tracking-tight leading-none">Scheduler</h1>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => shiftMonth(-1)} className="p-4 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 hover:shadow-md transition-all"><ChevronLeft size={24}/></button>
                  <button onClick={() => shiftMonth(1)} className="p-4 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 hover:shadow-md transition-all"><ChevronRight size={24}/></button>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-12">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[3.5rem] border border-stone-100 p-12 shadow-xl shadow-stone-200/40">
                   <div className="flex justify-between items-center mb-12 px-2">
                      <h2 className="text-5xl font-serif italic text-stone-900">{calendar.monthName} <span className="text-stone-200">{calendar.year}</span></h2>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                         <div className="w-2.5 h-2.5 rounded-full bg-[#a9b897] shadow-lg shadow-[#a9b897]/40" /> Active Nodes
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-7 gap-5">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-black text-stone-200 uppercase text-center tracking-[0.2em] mb-4">{d}</div>
                      ))}
                      {calendar.days.map((day, i) => {
                        const isScheduled = day.current && (day.d === 14 || day.d === 22 || day.d === 28);
                        return (
                          <div key={i} className={`aspect-square rounded-[1.5rem] border border-stone-50 flex flex-col items-center justify-center relative transition-all duration-300 group cursor-pointer ${day.current ? 'bg-white hover:bg-stone-50 hover:shadow-lg hover:shadow-stone-100' : 'bg-stone-50/50 opacity-10'}`}>
                             <span className={`text-2xl font-serif italic ${day.current ? 'text-stone-900' : 'text-stone-300'}`}>{day.d}</span>
                             {isScheduled && (
                               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-4 w-2 h-2 rounded-full bg-[#a9b897] shadow-[0_0_12px_#a9b897]" />
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>
                
                <div className="col-span-12 lg:col-span-4 space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-300 flex items-center gap-3 px-2">
                     <List size={14}/> Queue Priority
                   </h4>
                   <div className="space-y-5">
                     {nodes.slice(0, 5).map(node => (
                       <div key={node.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex items-center gap-6 group hover:border-[#a9b897] transition-all duration-500 shadow-sm">
                          <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-stone-50 flex-shrink-0 shadow-inner">
                             <img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-[#a9b897] uppercase tracking-[0.2em]">{node.platform} • 09:00</p>
                             <p className="text-lg font-serif italic text-stone-600 line-clamp-1">"{node.caption}"</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a9b897; }
      `}</style>
    </div>
  );
}