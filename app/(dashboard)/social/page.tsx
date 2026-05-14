"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  Layers, Trash2, Sparkles, Edit2, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, Cpu, CloudLightning, Heart, Eye, Target, Workflow, Zap, Radio,
  Calendar as CalendarIcon, List, Send, Globe, Share2, BarChart3, Clock, Settings
} from "lucide-react";
import { toast } from "sonner";

/** * PLATFORM ARCHITECTURE
 */
const platforms = ["Instagram", "LinkedIn", "Twitter", "Global Pool", "Threads", "TikTok"] as const;
type Platform = typeof platforms[number];

const PLATFORM_CONFIG: Record<Platform, { color: string; accent: string }> = {
  Instagram: { color: "text-pink-600", accent: "bg-pink-50" },
  LinkedIn: { color: "text-blue-700", accent: "bg-blue-50" },
  Twitter: { color: "text-sky-500", accent: "bg-sky-50" },
  "Global Pool": { color: "text-purple-600", accent: "bg-purple-50" },
  Threads: { color: "text-black", accent: "bg-slate-50" },
  TikTok: { color: "text-cyan-500", accent: "bg-cyan-50" },
};

/**
 * UI COMPONENTS (DENSE)
 */
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${className}`}>
    {children}
  </span>
);

const LoaderBars = () => (
  <div className="flex items-center gap-0.5">
    {[0, 0.2, 0.4].map((delay) => (
      <motion.div 
        key={delay}
        animate={{ height: [2, 8, 2] }} 
        transition={{ repeat: Infinity, duration: 0.8, delay }} 
        className="w-0.5 bg-white" 
      />
    ))}
  </div>
);

export default function SocialLabDashboard() {
  const [activeTab, setActiveTab] = useState<"lab" | "horizon" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState("image");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [horizonPosts, setHorizonPosts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('stream');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { count } = await supabase.from("social_posts").select("*", { count: 'exact', head: true });
      setWeeklyCount(count || 0);
      const { data } = await supabase.from("social_posts").select("*").order("scheduled_for", { ascending: true });
      if (data) setHorizonPosts(data);
    } catch (e) { console.warn("Operational Sync Error"); }
  };

  const synthesizeContent = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    
    const newDraft = {
      id: `NODE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      platform: selectedPlatform,
      caption: prompt,
      media_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
      status: "Draft"
    };

    setDrafts(prev => [newDraft, ...prev]);
    setIsGenerating(false);
    setPrompt("");
    toast.success("Signal Synthesized");
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      firstDay: new Date(year, month, 1).getDay()
    };
  }, [currentMonth]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#1a1a1a] pb-20 font-sans selection:bg-[#A3B18A] selection:text-white">
      
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-black origin-left z-[100]" style={{ scaleX }} />

      {/* COMPACT TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-black rounded text-white"><Radio size={12} className="animate-pulse" /></div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Social Engine v4.0</span>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100">
          {["lab", "horizon", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-green-50 text-green-600">System Live</Badge>
          <div className="h-4 w-[1px] bg-slate-200" />
          <Settings size={14} className="text-slate-300 hover:text-black cursor-pointer" />
        </div>
      </nav>

      <div className="max-w-[1500px] mx-auto px-6 py-10">
        
        <AnimatePresence mode="wait">
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-8">
              
              {/* LEFT: SYNTHESIS CORE */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                
                {/* KPI MINI-GRID */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Quota", val: `${weeklyCount}/25`, icon: Activity, color: "text-purple-500" },
                    { label: "Stability", val: "99.9%", icon: ShieldCheck, color: "text-green-500" },
                    { label: "Latency", val: "24ms", icon: Cpu, color: "text-blue-500" },
                    { label: "Status", val: "Elite", icon: CloudLightning, color: "text-amber-500" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between h-24 shadow-sm">
                      <stat.icon size={12} className={stat.color} />
                      <div>
                        <p className="text-xl font-serif italic">{stat.val}</p>
                        <p className="text-[7px] font-black uppercase tracking-widest text-slate-300">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SYNTHESIZER (30% SMALLER) */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-8 shadow-sm">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["image", "video", "carousel", "blog", "story", "thread"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`px-4 py-2 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                          contentType === type ? "bg-black text-white border-black" : "bg-transparent text-slate-400 border-slate-100"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Define communication objective..."
                      className="w-full h-48 bg-[#F9F9FB] rounded-2xl p-6 text-xl font-serif outline-none italic text-black placeholder-slate-200 resize-none border border-transparent focus:border-slate-100"
                    />
                    <div className="absolute bottom-6 right-6">
                       <button
                         onClick={synthesizeContent}
                         disabled={!prompt || isGenerating}
                         className="bg-black text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl disabled:opacity-20 transition-all flex items-center gap-3"
                       >
                         {isGenerating ? <LoaderBars /> : <><Sparkles size={12} className="text-[#A3B18A]" /> Execute</>}
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={`px-4 py-2 rounded-full text-[8px] font-black uppercase border tracking-widest transition-all ${
                          selectedPlatform === p ? "bg-black text-white border-black" : "bg-white text-slate-400 border-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {/* DRAFTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {drafts.map((draft) => (
                    <motion.div key={draft.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 group shadow-sm">
                      <div className="flex justify-between items-center">
                        <Badge className={`${PLATFORM_CONFIG[draft.platform as Platform].accent} ${PLATFORM_CONFIG[draft.platform as Platform].color}`}>
                          {draft.platform} • {draft.id}
                        </Badge>
                        <button onClick={() => setDrafts(drafts.filter(d => d.id !== draft.id))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                      </div>
                      <div className="aspect-[16/10] bg-slate-50 rounded-xl overflow-hidden">
                        <img src={draft.media_url} alt="Draft" className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                      </div>
                      <p className="font-serif italic text-sm text-slate-700 truncate">"{draft.caption}"</p>
                      <button className="w-full bg-slate-50 border border-slate-100 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                        Commit to Horizon
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* RIGHT: STRATEGIC ASIDE */}
              <aside className="col-span-12 lg:col-span-4 space-y-6">
                <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden h-fit">
                  <Workflow size={200} className="absolute -right-16 -top-16 opacity-5 rotate-12" />
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-xl font-serif italic tracking-tighter">Resonance Logic</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-white/10 pb-4">
                        <p className="text-[8px] font-black uppercase opacity-30 tracking-widest">Retention</p>
                        <p className="text-3xl font-serif italic text-[#A3B18A]">94.2%</p>
                      </div>
                      <p className="text-[8px] uppercase font-black tracking-widest opacity-40 leading-relaxed">
                        Visual momentum is peaking for {selectedPlatform}. Optimal deployment window opens in 3.4 hours.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] space-y-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Live Channels</h3>
                  <div className="space-y-2">
                    {platforms.map(p => (
                      <div key={p} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-3">
                          <Share2 size={10} className="text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-600">{p}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {activeTab === "horizon" && (
            <motion.div key="horizon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-2xl">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-serif italic tracking-tighter">Strategic Horizon</h2>
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Visualized Deployment Timeline</p>
                 </div>
                 <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => setViewMode('stream')} className={`px-5 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === 'stream' ? 'bg-white shadow-sm text-black' : 'text-slate-400'}`}>Stream</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-5 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-black' : 'text-slate-400'}`}>Calendar</button>
                 </div>
              </div>

              {viewMode === 'calendar' ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                   <div className="grid grid-cols-7 gap-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[9px] font-black uppercase text-slate-300 text-center tracking-widest mb-4">{d}</div>
                      ))}
                      {Array.from({ length: calendarDays.firstDay }).map((_, i) => <div key={i} />)}
                      {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => (
                        <div key={i} className="aspect-square border border-slate-50 rounded-2xl p-4 bg-[#FBFBFB] hover:bg-black group transition-all cursor-pointer">
                           <span className="text-sm font-serif italic text-slate-400 group-hover:text-white">{i + 1}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-100 rounded-[3rem] space-y-3 opacity-30">
                  <Clock size={24} />
                  <p className="text-[8px] font-black uppercase tracking-[0.4em]">Awaiting Sequence</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center space-y-4">
              <BarChart3 size={32} className="mx-auto text-slate-100" />
              <h2 className="text-5xl font-serif italic text-slate-100">Signal Data Pending</h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}