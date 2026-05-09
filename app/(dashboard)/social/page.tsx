"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  Zap, Layers, Video, FileText, Image as ImageIcon, Calendar, Trash2, 
  BarChart3, Sparkles, Plus, CheckCircle, MoreVertical, Edit2, 
  ChevronLeft, ChevronRight, Rss, Mail, DollarSign, Users, Activity,
  ShieldCheck, Globe, Cpu, Database, CloudLightning, Filter,
  Maximize2, Minimize2, Share2, MessageSquare, Heart, Bookmark,
  Info, AlertTriangle, Eye, EyeOff, Terminal, Command, Hash,
  ArrowUpRight, Target, Workflow, Briefcase
} from "lucide-react";

/** * SYSTEM ARCHITECTURE & TYPE DEFINITIONS
 * Strict typing for the Social Lab & Strategic Horizon Ecosystem.
 */

const platforms = ["Instagram", "LinkedIn", "Twitter", "Global Pool", "Threads", "TikTok"] as const;
type Platform = typeof platforms[number];

type ContentType = "image" | "video" | "blog" | "carousel" | "story" | "thread";
type SystemStatus = "online" | "syncing" | "offline" | "maintenance";

interface ContentDraft {
  id: string;
  type: ContentType;
  caption: string;
  hashtags: string[];
  mentions: string[];
  location: string;
  platform: Platform;
  scheduled_for: string;
  status: "draft" | "scheduled" | "published";
  media_url?: string;
  excellence_score: number;
  resonance_probability: number;
  peak_time: string;
  token_usage: number;
  metadata: {
    aspect_ratio: string;
    neural_model: string;
    color_palette: string[];
  };
}

interface AnalyticsNode {
  id: string;
  label: string;
  value: string | number;
  trend: "up" | "down" | "stable";
  percentage: string;
}

/**
 * CONFIGURATION CONSTANTS
 */
const WEEKLY_LIMIT = 25;
const SYSTEM_VERSION = "4.0.2-OMEGA";

const PLATFORM_CONFIG: Record<Platform, { color: string; accent: string }> = {
  Instagram: { color: "text-pink-600", accent: "bg-pink-50" },
  LinkedIn: { color: "text-blue-700", accent: "bg-blue-50" },
  Twitter: { color: "text-sky-500", accent: "bg-sky-50" },
  "Global Pool": { color: "text-purple-600", accent: "bg-purple-50" },
  Threads: { color: "text-stone-900", accent: "bg-stone-100" },
  TikTok: { color: "text-cyan-500", accent: "bg-cyan-50" },
};

/**
 * UTILITY SUB-COMPONENTS
 */
const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${className}`}>
    {children}
  </span>
);

const LoaderIcon = () => (
  <div className="flex items-center gap-1">
    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white" />
    <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-0.5 bg-white" />
    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-0.5 bg-white" />
  </div>
);

export default function SocialLabDashboard() {
  // --- CORE STATE ENGINE ---
  const [activeTab, setActiveTab] = useState<"lab" | "horizon" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("online");
  
  // --- LAB STATE ENGINE ---
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentType>("image");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  
  // --- HORIZON STATE ENGINE ---
  const [horizonPosts, setHorizonPosts] = useState<ContentDraft[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('stream');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');

  // --- UI & ACCESSIBILITY ---
  const [showTerminal, setShowTerminal] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  /**
   * LIFECYCLE & DATA INITIALIZATION
   */
  useEffect(() => {
    setIsMounted(true);
    fetchCoreData();
    const statusInterval = setInterval(() => {
      const statuses: SystemStatus[] = ["online", "online", "syncing"];
      setSystemStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 8000);
    return () => clearInterval(statusInterval);
  }, []);

  const fetchCoreData = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      
      const { count } = await supabase
        .from("social_posts")
        .select("*", { count: 'exact', head: true })
        .gte("scheduled_for", startOfWeek);
      setWeeklyCount(count || 0);

      const { data } = await supabase
        .from("social_posts")
        .select("*")
        .order("scheduled_for", { ascending: true });
      if (data) setHorizonPosts(data as any);
    } catch (e) {
      console.warn("Supabase connectivity simulated/failed. Entering Offline Mode.");
    }
  };

  /**
   * NEURAL SYNTHESIS HANDLER
   */
  const synthesizeContent = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);

    // Simulated Latency for AI Response
    await new Promise(resolve => setTimeout(resolve, 2200));

    const newDraft: ContentDraft = {
      id: `NODE-${Math.random().toString(36).substring(7).toUpperCase()}`,
      type: contentType,
      platform: selectedPlatform,
      caption: `[Synthesis Complete]: ${prompt}\n\nOur philosophy at The Organised Types revolves around intentional architecture. This post serves as a node for that shift.`,
      hashtags: ["#OrganisedTypes", "#ClarityOS", "#Strategy"],
      mentions: ["@TheOrganisedTypes"],
      location: "Central Node",
      scheduled_for: "",
      status: "draft",
      media_url: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop`,
      excellence_score: Math.floor(Math.random() * 12) + 87,
      resonance_probability: 0.89,
      peak_time: "18:45 GMT",
      token_usage: 124,
      metadata: {
        aspect_ratio: "4:5",
        neural_model: "OMEGA-4",
        color_palette: ["#1c1c1c", "#faf9f6"]
      }
    };

    setDrafts(prev => [newDraft, ...prev]);
    setIsGenerating(false);
    setPrompt("");
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay };
  }, [currentMonth]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897] selection:text-white overflow-x-hidden">
      
      {/* GLOBAL PROGRESS BAR */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#a9b897] origin-left z-[100]" style={{ scaleX }} />

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-12 space-y-12 md:space-y-24">
        
        {/* --- DYNAMIC HEADER SYSTEM --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-10 border-b border-stone-200">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-900 rounded-lg text-white">
                <Terminal size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">Environment: Stable</p>
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full animate-pulse ${systemStatus === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
                   <p className="text-[10px] font-mono uppercase text-stone-500">Node Sync {systemStatus} // v{SYSTEM_VERSION}</p>
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-8xl font-serif italic tracking-tighter leading-none">
              Social <span className="text-stone-300">Lab</span>
            </h1>
          </motion.div>

          <nav className="flex w-full lg:w-auto p-1.5 bg-white border border-stone-200 rounded-[2rem] shadow-sm">
            {["lab", "horizon", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 lg:flex-none px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  activeTab === tab ? "bg-stone-900 text-white shadow-2xl" : "text-stone-400 hover:bg-stone-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </header>

        {/* --- MAIN INTERFACE ENGINE --- */}
        <AnimatePresence mode="wait">
          {activeTab === "lab" && (
            <motion.div 
              key="lab"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16"
            >
              <div className="lg:col-span-8 space-y-12">
                
                {/* SYSTEM KPI WIDGETS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Quota", val: `${weeklyCount}/${WEEKLY_LIMIT}`, icon: Activity, color: "text-purple-600" },
                    { label: "Reach", val: "Elite", icon: CloudLightning, color: "text-amber-500" },
                    { label: "Stability", val: "99.9%", icon: ShieldCheck, color: "text-green-600" },
                    { label: "Latency", val: "24ms", icon: Cpu, color: "text-blue-600" },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm"
                    >
                      <stat.icon size={16} className={`${stat.color} mb-4`} />
                      <p className="text-3xl font-serif italic">{stat.val}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* CENTRAL SYNTHESIZER */}
                <section className="bg-white rounded-[4rem] p-8 md:p-16 shadow-sm border border-stone-100 space-y-12">
                  <header className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-900">Neural Synthesis Hub</h2>
                      <p className="text-[10px] font-serif italic text-stone-400">Transforming intent into digital architecture.</p>
                    </div>
                    <Badge className="bg-stone-100 text-stone-500 border border-stone-200">Priority: High</Badge>
                  </header>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {["image", "video", "carousel", "blog", "story", "thread"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type as any)}
                        className={`p-4 rounded-2xl border text-[9px] font-black uppercase transition-all duration-500 ${
                          contentType === type ? "bg-stone-900 text-white border-stone-900 shadow-xl scale-105" : "bg-transparent text-stone-400 border-stone-100 hover:border-stone-200"
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
                      placeholder="Specify the core objective of this content node..."
                      className="w-full h-72 bg-stone-50 rounded-[3rem] p-10 md:p-14 text-2xl md:text-3xl font-serif outline-none italic text-stone-800 placeholder-stone-200 resize-none transition-all focus:bg-white focus:ring-8 focus:ring-stone-100/50 border border-transparent focus:border-stone-100"
                    />
                    <div className="absolute bottom-10 right-10 flex items-center gap-6">
                       <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors hidden md:block">
                         + Load Template
                       </button>
                       <button
                         onClick={synthesizeContent}
                         disabled={!prompt || isGenerating}
                         className="bg-stone-900 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-stone-800 disabled:opacity-20 transition-all flex items-center gap-4"
                       >
                         {isGenerating ? <LoaderIcon /> : <><Sparkles size={16} /> Synthesis</>}
                       </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    {platforms.map((p: Platform) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPlatform(p)}
                        className={`px-6 py-4 rounded-full text-[10px] font-black uppercase border transition-all duration-300 ${
                          selectedPlatform === p 
                            ? "bg-stone-100 border-stone-900 text-stone-900 shadow-inner" 
                            : "bg-white border-stone-100 text-stone-400 hover:border-stone-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {/* DRAFT OUTPUT GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <AnimatePresence>
                    {drafts.map((draft, idx) => (
                      <motion.div
                        key={draft.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white border border-stone-100 rounded-[3.5rem] p-8 md:p-10 space-y-8 group"
                      >
                        <div className="flex justify-between items-center">
                          <Badge className={`${PLATFORM_CONFIG[draft.platform].accent} ${PLATFORM_CONFIG[draft.platform].color} px-4 py-1.5`}>
                            {draft.platform}
                          </Badge>
                          <div className="flex gap-2">
                            <button className="p-2 text-stone-200 hover:text-stone-900 transition-colors"><Edit2 size={14}/></button>
                            <button onClick={() => setDrafts(drafts.filter(d => d.id !== draft.id))} className="p-2 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>

                        <div className="aspect-square bg-stone-50 rounded-[2.5rem] overflow-hidden relative shadow-inner">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale mix-blend-multiply opacity-60 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-1000" />
                          <div className="absolute top-6 left-6 flex gap-2">
                             <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase">Score: {draft.excellence_score}</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <p className="font-serif italic text-xl text-stone-800 leading-relaxed">"{draft.caption}"</p>
                          <div className="flex gap-4">
                             {draft.hashtags.map(tag => <span key={tag} className="text-[9px] font-mono text-stone-300">{tag}</span>)}
                          </div>
                        </div>

                        <div className="pt-8 border-t border-stone-50 flex flex-col gap-4">
                           <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                              <Calendar size={14} className="text-stone-300" />
                              <input type="datetime-local" className="bg-transparent text-[10px] font-black uppercase outline-none w-full" />
                           </div>
                           <button className="w-full bg-stone-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all">
                              Synchronize with Horizon
                           </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* --- ANALYTICS ASIDE --- */}
              <aside className="lg:col-span-4 space-y-10">
                <div className="sticky top-12 space-y-10">
                  
                  {/* RESONANCE ENGINE */}
                  <div className="bg-[#1c1c1c] text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                      <Workflow size={300} />
                    </div>
                    <div className="relative z-10 space-y-10">
                      <header>
                        <h3 className="text-3xl font-serif italic tracking-tighter">Resonance Probability</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mt-2">Active Node Intelligence</p>
                      </header>

                      <div className="space-y-8">
                        {[
                          { label: "Retention Potential", val: "94.2%", color: "text-[#a9b897]" },
                          { label: "Neural Clarity", val: "High", color: "text-blue-400" },
                          { label: "Sync Window", val: "Optimal", color: "text-purple-400" },
                        ].map((m, i) => (
                          <div key={i} className="flex justify-between items-end border-b border-white/5 pb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{m.label}</p>
                            <p className={`text-4xl font-serif italic ${m.color}`}>{m.val}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                         <div className="flex items-center gap-3">
                           <Target size={14} className="text-[#a9b897]" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Targeting Note</span>
                         </div>
                         <p className="text-xs text-white/50 italic leading-relaxed font-serif">
                           Platform saturation is currently low in the LinkedIn business sector. Synthesis commitment now yields 14% higher reach.
                         </p>
                      </div>
                    </div>
                  </div>

                  {/* CAPACITY & RESOURCES */}
                  <div className="bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm space-y-10">
                     <h3 className="text-xl font-serif italic">Operational Capacity</h3>
                     <div className="space-y-8">
                       <div className="space-y-3">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
                           <span>Weekly Token Usage</span>
                           <span>{Math.round((weeklyCount / WEEKLY_LIMIT) * 100)}%</span>
                         </div>
                         <div className="h-2 w-full bg-stone-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(weeklyCount / WEEKLY_LIMIT) * 100}%` }} className="h-full bg-stone-900" />
                         </div>
                       </div>
                       <div className="space-y-3">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
                           <span>Neural Memory Load</span>
                           <span>42%</span>
                         </div>
                         <div className="h-2 w-full bg-stone-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "42%" }} className="h-full bg-stone-300" />
                         </div>
                       </div>
                     </div>
                  </div>

                  {/* SECURE TUNNEL */}
                  <div className="bg-[#a9b897] p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl shadow-[#a9b897]/20">
                     <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                        <ShieldCheck size={24} />
                     </div>
                     <div className="text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Defense</p>
                        <p className="text-lg font-serif italic">Secure Tunnel Active</p>
                     </div>
                  </div>

                </div>
              </aside>
            </motion.div>
          )}

          {/* ANALYTICS TAB CONTENT */}
          {activeTab === "analytics" && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Total Engagement", val: "248.5K", icon: Heart, trend: "+12%" },
                    { label: "Content Reach", val: "1.2M", icon: Eye, trend: "+5.4%" },
                    { label: "Conversion Rate", val: "4.8%", icon: Target, trend: "+0.2%" },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
                       <div className="flex justify-between items-center">
                          <div className="p-4 bg-stone-50 rounded-2xl"><kpi.icon size={24} className="text-stone-900" /></div>
                          <span className="text-[10px] font-mono text-green-600">{kpi.trend}</span>
                       </div>
                       <div>
                          <p className="text-6xl font-serif italic tracking-tighter">{kpi.val}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-2">{kpi.label}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               {/* DETAILED GROWTH PLOT (Simulated) */}
               <div className="bg-white border border-stone-100 rounded-[4rem] p-12 md:p-20 shadow-sm space-y-10">
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div>
                        <h3 className="text-3xl font-serif italic tracking-tighter">Growth Architecture</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-1">Rolling 30-Day Simulation</p>
                     </div>
                     <button className="px-8 py-4 bg-stone-50 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-stone-100">Export Manifest</button>
                  </header>
                  <div className="h-96 w-full flex items-end gap-2 md:gap-4">
                     {Array.from({ length: 24 }).map((_, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${20 + (Math.random() * 80)}%` }}
                          transition={{ delay: i * 0.05, duration: 1 }}
                          className="flex-1 bg-stone-100 rounded-t-xl hover:bg-stone-900 transition-colors cursor-pointer relative group"
                        >
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {(Math.random() * 100).toFixed(1)}K
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {/* HORIZON TAB CONTENT */}
          {activeTab === "horizon" && (
            <motion.div 
              key="horizon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-stone-100 p-8 rounded-[3rem] gap-8 shadow-sm">
                 <div>
                   <h2 className="text-3xl font-serif italic tracking-tighter">Strategic Horizon</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-1">Distribution Calendar</p>
                 </div>
                 <div className="flex bg-stone-50 p-1.5 rounded-2xl">
                    <button onClick={() => setViewMode('stream')} className={`px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase transition-all ${viewMode === 'stream' ? 'bg-white shadow-xl text-stone-900' : 'text-stone-300'}`}>Stream</button>
                    <button onClick={() => setViewMode('calendar')} className={`px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-white shadow-xl text-stone-900' : 'text-stone-300'}`}>Calendar</button>
                 </div>
              </div>

              {viewMode === 'stream' ? (
                <div className="space-y-8">
                   {horizonPosts.map((post, i) => (
                     <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="bg-white border border-stone-50 p-10 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 group hover:shadow-2xl transition-all"
                      >
                        <div className="text-center md:text-left min-w-[140px]">
                           <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest block mb-2">May 2026</span>
                           <span className="text-6xl font-serif italic text-stone-900 block leading-none">{12 + i}</span>
                           <span className="text-[10px] font-mono text-stone-400 uppercase mt-2 block">18:45 GMT</span>
                        </div>
                        <div className="w-32 h-32 rounded-3xl overflow-hidden bg-stone-50 shadow-inner">
                           <img src={post.media_url || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=400&auto=format&fit=crop"} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                        </div>
                        <div className="flex-1 space-y-4">
                           <Badge className="bg-purple-50 text-purple-600 border border-purple-100">{post.platform}</Badge>
                           <p className="text-2xl font-serif italic text-stone-800 leading-tight">"{post.caption.substring(0, 100)}..."</p>
                        </div>
                        <div className="flex gap-4">
                           <button className="w-16 h-16 rounded-full border border-stone-100 flex items-center justify-center text-stone-200 hover:text-stone-900 hover:bg-stone-50 transition-all"><Edit2 size={20}/></button>
                           <button className="px-10 bg-stone-50 border border-stone-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Live Sync</button>
                        </div>
                     </motion.div>
                   ))}
                </div>
              ) : (
                <div className="bg-white border border-stone-100 rounded-[4rem] p-12 md:p-20 shadow-sm animate-in fade-in zoom-in-95 duration-700">
                   <div className="flex justify-between items-center mb-16">
                      <h3 className="text-4xl font-serif italic tracking-tighter uppercase">{currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}</h3>
                      <div className="flex gap-4">
                         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-5 border border-stone-100 rounded-3xl hover:bg-stone-50 transition-all text-stone-300"><ChevronLeft size={24}/></button>
                         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-5 border border-stone-100 rounded-3xl hover:bg-stone-50 transition-all text-stone-300"><ChevronRight size={24}/></button>
                      </div>
                   </div>
                   <div className="grid grid-cols-7 gap-6">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-black uppercase text-stone-300 text-center tracking-[0.4em] mb-6">{d}</div>
                      ))}
                      {Array.from({ length: calendarDays.firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: calendarDays.daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isScheduled = day % 4 === 0;
                        return (
                          <div key={i} className={`aspect-video md:aspect-square border rounded-3xl p-6 transition-all cursor-pointer group relative overflow-hidden ${isScheduled ? 'bg-[#a9b897]/5 border-[#a9b897]/20' : 'bg-stone-50/30 border-stone-50 hover:bg-stone-50'}`}>
                             <span className="text-lg font-serif italic text-stone-900 relative z-10">{day}</span>
                             {isScheduled && (
                               <motion.div layoutId="dot" className="absolute bottom-6 right-6 w-2 h-2 rounded-full bg-[#a9b897] shadow-[0_0_15px_rgba(169,184,151,0.8)]" />
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- GLOBAL TERMINAL INTERFACE --- */}
        <div className="fixed bottom-10 right-10 z-[100]">
           <button 
             onClick={() => setShowTerminal(!showTerminal)}
             className="w-16 h-16 bg-stone-900 text-[#a9b897] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-500"
           >
              {showTerminal ? <Minimize2 size={24} /> : <Command size={24} />}
           </button>
           <AnimatePresence>
             {showTerminal && (
               <motion.div
                 initial={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
                 animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                 exit={{ opacity: 0, y: 100, scale: 0.8, filter: "blur(10px)" }}
                 className="absolute bottom-24 right-0 w-[420px] h-[550px] bg-stone-950 rounded-[3rem] border border-stone-800 shadow-[0_50px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col backdrop-blur-xl"
               >
                  <header className="p-8 border-b border-stone-800 flex justify-between items-center bg-stone-900/40">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                       <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                       <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-stone-500 tracking-[0.3em]">Root@TheOrganisedTypes</span>
                  </header>
                  <div className="flex-1 p-10 font-mono text-[11px] text-stone-400 overflow-y-auto space-y-6 scrollbar-hide">
                     <p className="text-[#a9b897] leading-relaxed">{`> [SYSTEM]: Initializing Social Lab Interface...`}</p>
                     <p className="leading-relaxed">{`> [NETWORK]: Established encrypted handshake with Supabase cluster.`}</p>
                     <p className="text-blue-400 leading-relaxed">{`> [STORAGE]: Content manifests loaded from strategic_horizon_db.`}</p>
                     <p className="text-stone-600 leading-relaxed">{`> [LOG]: Neural model OMEGA-4 operating at peak efficiency.`}</p>
                     <div className="pt-6 border-t border-stone-800 space-y-4">
                        <p className="text-stone-500">// ACTIVE DAEMONS:</p>
                        <div className="flex justify-between items-center"><span className="text-stone-400">resonance_sim_v4</span> <span className="text-green-500">ACTIVE</span></div>
                        <div className="flex justify-between items-center"><span className="text-stone-400">platform_sync_bridge</span> <span className="text-green-500">ACTIVE</span></div>
                        <div className="flex justify-between items-center"><span className="text-stone-400">auto_hashtag_gen</span> <span className="text-amber-500">STANDBY</span></div>
                     </div>
                  </div>
                  <div className="p-6 border-t border-stone-800 bg-stone-900/20 flex items-center gap-4">
                     <span className="text-white font-black text-sm">$</span>
                     <input className="bg-transparent border-none outline-none text-xs w-full text-stone-300 font-mono" placeholder="Query content engine..." />
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* --- GLOBAL FOOTER --- */}
        <footer className="pt-24 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-10 pb-20 opacity-60 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center">
                    <Target size={14} className="text-stone-400" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Global Reach</p>
                    <p className="text-[9px] font-mono text-stone-400">Status: Maximized</p>
                 </div>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div className="text-[9px] font-mono text-stone-400 space-y-1">
                 <p>London, UK // 51.5074° N, 0.1278° W</p>
                 <p>© 2026 The Organised Types. All Rights Reserved.</p>
              </div>
           </div>
           
           <div className="flex flex-wrap justify-center gap-10">
              {['System Log', 'Security Protocol', 'Privacy Architecture', 'Support Node'].map(link => (
                <a key={link} href="#" className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 tracking-widest transition-colors">{link}</a>
              ))}
           </div>
        </footer>

      </div>
    </div>
  );
}