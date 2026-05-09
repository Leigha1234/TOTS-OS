"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  Layers, Trash2, Sparkles, Edit2, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, Cpu, CloudLightning, Heart, Eye, Target, Workflow 
} from "lucide-react";

/** * PLATFORM ARCHITECTURE
 */
const platforms = ["Instagram", "LinkedIn", "Twitter", "Global Pool", "Threads", "TikTok"] as const;
type Platform = typeof platforms[number];

const PLATFORM_CONFIG: Record<Platform, { color: string; accent: string }> = {
  Instagram: { color: "text-pink-600", accent: "bg-pink-50" },
  LinkedIn: { color: "text-blue-700", accent: "bg-blue-50" },
  Twitter: { color: "text-sky-500", accent: "bg-sky-50" },
  "Global Pool": { color: "text-purple-600", accent: "bg-purple-50" },
  Threads: { color: "text-[var(--text-main)]", accent: "bg-[var(--bg-soft)]" },
  TikTok: { color: "text-cyan-500", accent: "bg-cyan-50" },
};

/**
 * UI COMPONENTS
 */
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${className}`}>
    {children}
  </span>
);

const LoaderIcon = () => (
  <div className="flex items-center gap-1">
    {[0, 0.2, 0.4].map((delay) => (
      <motion.div 
        key={delay}
        animate={{ height: [4, 12, 4] }} 
        transition={{ repeat: Infinity, duration: 0.8, delay }} 
        className="w-0.5 bg-white" 
      />
    ))}
  </div>
);

export default function SocialLabDashboard() {
  const [activeTab, setActiveTab] = useState<"lab" | "horizon" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [systemStatus, setSystemStatus] = useState("online");
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
    } catch (e) { console.warn("Standalone Mode Active"); }
  };

  const synthesizeContent = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2200));
    
    const newDraft = {
      id: `NODE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      platform: selectedPlatform,
      caption: prompt,
      media_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800",
      hashtags: ["#OrganisedTypes", "#Strategy"]
    };

    setDrafts(prev => [newDraft, ...prev]);
    setIsGenerating(false);
    setPrompt("");
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] selection:bg-[var(--brand-primary)] selection:text-white">
      
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[var(--brand-primary)] origin-left z-[100]" style={{ scaleX }} />

      <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 space-y-24">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-10 border-b border-[var(--border)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--text-main)] rounded-lg text-[var(--bg)]">
                <Layers size={18} />
              </div>
              <p className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Node Sync {systemStatus} // v4.0.2</p>
            </div>
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none text-[var(--brand-primary)]">
              Social <span className="opacity-20 text-[var(--text-main)]">Lab</span>
            </h1>
          </div>

          <nav className="flex p-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] shadow-sm">
            {["lab", "horizon", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-[var(--text-main)] text-[var(--bg)] shadow-xl" : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-12">
                
                {/* KPI GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Quota", val: `${weeklyCount}/25`, icon: Activity, color: "text-purple-500" },
                    { label: "Reach", val: "Elite", icon: CloudLightning, color: "text-amber-500" },
                    { label: "Stability", val: "99.9%", icon: ShieldCheck, color: "text-green-500" },
                    { label: "Latency", val: "24ms", icon: Cpu, color: "text-blue-500" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border)]">
                      <stat.icon size={16} className={`${stat.color} mb-4`} />
                      <p className="text-3xl font-serif italic">{stat.val}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* SYNTHESIZER */}
                <section className="bg-[var(--card-bg)] rounded-[4rem] p-8 md:p-16 border border-[var(--border)] space-y-12 shadow-sm">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {["image", "video", "carousel", "blog", "story", "thread"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`p-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${
                          contentType === type ? "bg-[var(--text-main)] text-[var(--bg)] border-transparent scale-105" : "bg-transparent text-[var(--text-muted)] border-[var(--border)]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Specify the core objective..."
                      className="w-full h-72 bg-[var(--bg-soft)] rounded-[3rem] p-10 text-2xl md:text-3xl font-serif outline-none italic text-[var(--text-main)] placeholder-[var(--text-muted)]/30 resize-none border border-transparent focus:border-[var(--border)]"
                    />
                    <div className="absolute bottom-10 right-10">
                       <button
                         onClick={synthesizeContent}
                         disabled={!prompt || isGenerating}
                         className="bg-[var(--brand-primary)] text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-20 transition-all flex items-center gap-4"
                       >
                         {isGenerating ? <LoaderIcon /> : <><Sparkles size={16} /> Synthesis</>}
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={`px-6 py-4 rounded-full text-[10px] font-black uppercase border transition-all ${
                          selectedPlatform === p ? "bg-[var(--bg-soft)] border-[var(--text-main)] text-[var(--text-main)]" : "bg-white border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {/* DRAFTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {drafts.map((draft) => (
                    <motion.div key={draft.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-[3.5rem] p-8 space-y-8 group">
                      <div className="flex justify-between items-center">
                        <Badge className={`${PLATFORM_CONFIG[draft.platform as Platform].accent} ${PLATFORM_CONFIG[draft.platform as Platform].color} px-4 py-1.5`}>
                          {draft.platform}
                        </Badge>
                        <button onClick={() => setDrafts(drafts.filter(d => d.id !== draft.id))} className="text-[var(--text-muted)] hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                      <div className="aspect-square bg-[var(--bg-soft)] rounded-[2.5rem] overflow-hidden">
                        <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                      </div>
                      <p className="font-serif italic text-xl text-[var(--text-main)] leading-relaxed">"{draft.caption}"</p>
                      <button className="w-full bg-[var(--text-main)] text-[var(--bg)] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        Synchronize with Horizon
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ASIDE */}
              <aside className="lg:col-span-4 space-y-10">
                <div className="sticky top-12 space-y-10">
                  <div className="bg-[var(--brand-secondary)] text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                    <Workflow size={300} className="absolute -right-20 -top-20 opacity-5" />
                    <div className="relative z-10 space-y-10">
                      <h3 className="text-3xl font-serif italic tracking-tighter">Resonance Probability</h3>
                      <div className="space-y-8">
                        <div className="flex justify-between items-end border-b border-white/5 pb-6">
                          <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">Retention</p>
                          <p className="text-4xl font-serif italic text-[var(--brand-primary)]">94.2%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* HORIZON */}
          {activeTab === "horizon" && (
            <motion.div key="horizon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex justify-between items-center bg-[var(--card-bg)] border border-[var(--border)] p-8 rounded-[3rem]">
                 <h2 className="text-3xl font-serif italic tracking-tighter">Strategic Horizon</h2>
                 <div className="flex bg-[var(--bg-soft)] p-1.5 rounded-2xl">
                    <button onClick={() => setViewMode('stream')} className={`px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase transition-all ${viewMode === 'stream' ? 'bg-[var(--card-bg)] shadow-xl text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Stream</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-[var(--card-bg)] shadow-xl text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Calendar</button>
                 </div>
              </div>

              {viewMode === 'calendar' && (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-[4rem] p-12 shadow-sm">
                   <div className="grid grid-cols-7 gap-6">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-black uppercase text-[var(--text-muted)] text-center tracking-widest mb-6">{d}</div>
                      ))}
                      {Array.from({ length: calendarDays.firstDay }).map((_, i) => <div key={i} />)}
                      {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => (
                        <div key={i} className="aspect-square border border-[var(--border)] rounded-3xl p-6 bg-[var(--bg-soft)]/30 hover:bg-[var(--bg-soft)] transition-all cursor-pointer">
                           <span className="text-lg font-serif italic text-[var(--text-main)]">{i + 1}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}