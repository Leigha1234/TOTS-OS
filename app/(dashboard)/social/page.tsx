"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, Heart, Zap, Radio,
  Share2, ArrowUpRight, Upload, Download, Globe, 
  Calendar as CalendarIcon, List, Eye, Clock,
  MoreHorizontal, Hash, MessageSquare, Image as ImageIcon,
  CheckCircle2, AlertCircle, Settings, User, Layers,
  Filter, Search, Plus, BarChart3, Camera, Play, 
  Target, ZapOff, Fingerprint, Cpu
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types & Constants ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "Threads" | "TikTok";
type PostFormat = "Image" | "Video" | "Carousel";
type PostType = "Promotional" | "Comedic" | "Educational" | "Behind the Scenes" | "Lifestyle";

const platforms: Platform[] = ["Instagram", "LinkedIn", "Twitter", "Threads", "TikTok"];
const postFormats: PostFormat[] = ["Image", "Video", "Carousel"];
const postTypes: PostType[] = ["Promotional", "Comedic", "Educational", "Behind the Scenes", "Lifestyle"];

interface DraftPost {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: "Draft" | "Scheduled" | "Published";
  scheduled_date: string;
  tags: string[];
  format?: PostFormat;
  type?: PostType;
}

export default function SocialStudioPro() {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler" | "gallery" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("Image");
  const [selectedType, setSelectedType] = useState<PostType>("Promotional");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('calendar');
  const [selectedDatePosts, setSelectedDatePosts] = useState<DraftPost[] | null>(null);
  const [stats, setStats] = useState({ reach: "12.4k", engagement: "5.2%", growth: "842" });
  const [currentDate, setCurrentDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Life Cycle & Realtime Sync ---
  useEffect(() => {
    setIsMounted(true);
    fetchInitialData();

    // PROTOCOL: Define listeners BEFORE calling .subscribe() to avoid state race conditions
    const channel = supabase.channel('social_studio_sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          console.log('Realtime Update:', payload);
          toast.info("Database synchronized with Studio");
          fetchInitialData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const fetchInitialData = async () => {
    const { data: posts, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error("Fetch Error:", error.message);
      return;
    }

    if (posts) {
      const formatted = posts.map(p => ({
        id: p.id,
        platform: "LinkedIn" as Platform,
        caption: p.title || "Social Synthesis Node",
        media_url: `https://picsum.photos/seed/${p.id}/1200/1500`,
        status: "Published" as const,
        scheduled_date: new Date().toISOString().split('T')[0],
        tags: ["System-Sync"],
        format: "Image" as PostFormat
      }));
      setDrafts(formatted);
    }
  };

  // --- Logic & Generators ---

  const handlePostCreation = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);

    try {
      const newPost: DraftPost = {
        id: `${isManualMode ? 'MAN' : 'AI'}-${Date.now()}`,
        platform: selectedPlatform,
        caption: isManualMode ? prompt : `✨ [Synthesized Content]: ${prompt}\n\n#TOTs #DigitalGrowth`,
        media_url: `https://picsum.photos/seed/${Math.random()}/1000/1200`,
        status: "Draft",
        scheduled_date: new Date().toISOString().split('T')[0],
        tags: [isManualMode ? "Manual" : "AI-Gen", selectedType],
        format: selectedFormat,
        type: selectedType
      };

      if (!isManualMode) await new Promise(r => setTimeout(r, 1800));
      
      setDrafts(prev => [newPost, ...prev]);
      toast.success(isManualMode ? "Draft stored in Lab" : "AI Content Synthesized");
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    toast.info("Initializing high-res render...");
    
    // Fix: Using forced background colors to bypass modern CSS color function errors (lab/oklch)
    const canvas = await html2canvas(reportRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#FBFBFA",
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`TOTs-Performance-Report-${Date.now()}.pdf`);
    toast.success("PDF exported successfully");
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, month, year };
  }, [currentDate]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 pb-20 selection:bg-[#a9b897] selection:text-white antialiased">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-3xl border-b border-stone-100 px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 flex items-center justify-center text-[#a9b897] transition-transform group-hover:scale-105">
              <Cpu size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] leading-none">Studio</span>
              <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1">v2.4.0-Stable</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-stone-100/50 p-1.5 rounded-2xl border border-stone-100">
            {["lab", "scheduler", "gallery", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-xl shadow-stone-200/50" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-3 px-5 py-2.5 bg-white border border-stone-100 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse shadow-[0_0_10px_#a9b897]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Live Infrastructure</span>
          </div>
          <div className="h-10 w-[1px] bg-stone-100" />
          <div className="flex items-center gap-4">
            <button className="p-3 text-stone-400 hover:text-stone-900 transition-colors"><Search size={18}/></button>
            <button className="p-3 text-stone-400 hover:text-stone-900 transition-colors"><Settings size={18}/></button>
            <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-[#a9b897] shadow-lg">
              <User size={16} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1700px] mx-auto px-10 py-16">
        <AnimatePresence mode="wait">
          
          {/* --- VIEW: LAB --- */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-20">
              <div className="col-span-12 lg:col-span-8 space-y-16">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[#a9b897]">Neural Content Engine</p>
                    <h1 className="text-9xl font-serif italic tracking-tighter text-stone-900 leading-[0.8]">Social Lab</h1>
                  </div>
                  <div className="flex items-center gap-4 pb-2">
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/50">
                      <button onClick={() => setIsManualMode(false)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isManualMode ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400'}`}>AI Sync</button>
                      <button onClick={() => setIsManualMode(true)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isManualMode ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400'}`}>Manual</button>
                    </div>
                  </div>
                </header>

                <div className="bg-white rounded-[4.5rem] border border-stone-100 p-16 shadow-sm space-y-16">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <section className="space-y-8">
                      <div className="flex items-center gap-3">
                        <Globe size={14} className="text-[#a9b897]" />
                        <label className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Deployment Platform</label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {platforms.map(p => (
                          <button key={p} onClick={() => setSelectedPlatform(p)} className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedPlatform === p ? 'bg-stone-900 text-white border-stone-900 shadow-2xl' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-8">
                      <div className="flex items-center gap-3">
                        <Layers size={14} className="text-[#a9b897]" />
                        <label className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Asset Format</label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {postFormats.map(f => (
                          <button key={f} onClick={() => setSelectedFormat(f)} className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedFormat === f ? 'bg-[#a9b897] text-white border-[#a9b897] shadow-xl shadow-[#a9b897]/20' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{f}</button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <Target size={14} className="text-[#a9b897]" />
                      <label className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300">Content DNA</label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {postTypes.map(t => (
                        <button key={t} onClick={() => setSelectedType(t)} className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedType === t ? 'bg-stone-900 text-[#a9b897] border-stone-900' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isManualMode ? "Write your caption directly..." : "Describe the creative vision for the synthesis engine..."}
                      className="w-full h-80 bg-stone-50/50 rounded-[3.5rem] p-12 text-4xl font-serif italic outline-none text-stone-800 placeholder-stone-200 focus:bg-white border border-transparent focus:border-stone-100 transition-all resize-none leading-tight"
                    />
                    <div className="absolute bottom-10 right-10 flex gap-4">
                      <input type="file" ref={fileInputRef} className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="p-7 bg-white border border-stone-100 rounded-full hover:border-[#a9b897] text-stone-400 transition-all hover:text-[#a9b897] shadow-lg">
                        <Camera size={20} />
                      </button>
                      <button
                        onClick={handlePostCreation}
                        disabled={!prompt || isGenerating}
                        className="bg-stone-900 text-white px-14 py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl disabled:opacity-20 transition-all flex items-center gap-5 hover:scale-[1.02] active:scale-95 group"
                      >
                        {isGenerating ? "Synthesizing Node..." : "Initiate Synthesis"}
                        <div className="w-5 h-5 bg-[#a9b897] rounded-full flex items-center justify-center text-stone-900">
                          <Zap size={12} fill="currentColor" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="flex items-center gap-6 px-4">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-400">Incubating Drafts</h3>
                    <div className="h-px flex-1 bg-stone-100" />
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{drafts.length} Units</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {drafts.map((draft) => (
                      <motion.div layout key={draft.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] p-6 border border-stone-100 group shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-1000">
                        <div className="aspect-[4/5] relative rounded-[3rem] overflow-hidden mb-10 bg-stone-100">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100" />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                          <div className="absolute top-8 left-8 flex gap-3">
                            <span className="bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">{draft.platform}</span>
                            <span className="bg-stone-900/90 text-[#a9b897] backdrop-blur-xl px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">{draft.type}</span>
                          </div>
                          <button className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-stone-900 w-16 h-16 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500 shadow-2xl">
                             <Play size={20} fill="currentColor" />
                          </button>
                        </div>
                        <div className="px-6 pb-6 space-y-8">
                          <p className="text-2xl font-serif italic text-stone-700 leading-relaxed line-clamp-3">"{draft.caption}"</p>
                          <div className="flex gap-4 pt-4 border-t border-stone-50">
                            <button className="flex-1 bg-stone-900 text-white py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#a9b897] transition-all">Schedule Node</button>
                            <button onClick={() => setDrafts(prev => prev.filter(p => p.id !== draft.id))} className="p-6 bg-stone-50 text-stone-300 rounded-3xl hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"><Trash2 size={20}/></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-4 space-y-10">
                <div className="bg-stone-900 text-white p-16 rounded-[5rem] shadow-2xl relative overflow-hidden group">
                  <Fingerprint size={350} className="absolute -right-24 -top-24 opacity-5 rotate-12 transition-transform group-hover:rotate-[30deg] duration-1000" />
                  <div className="relative z-10 space-y-14">
                    <header className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#a9b897]/20 flex items-center justify-center text-[#a9b897]">
                         <Activity size={24} />
                      </div>
                      <h3 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40">System Core</h3>
                      <p className="text-6xl font-serif italic tracking-tighter leading-[0.8]">Active State.</p>
                    </header>
                    <div className="space-y-10 pt-14 border-t border-white/5">
                      {[
                        { label: "Target Context", val: selectedPlatform },
                        { label: "Logic Protocol", val: isManualMode ? "Manual Override" : "AI Synthesis" },
                        { label: "Asset Pipeline", val: selectedFormat },
                        { label: "Creative DNA", val: selectedType }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-end group/item">
                          <p className="text-[11px] font-black uppercase tracking-widest opacity-30 transition-opacity group-hover/item:opacity-100">{item.label}</p>
                          <p className="text-3xl font-serif italic text-[#a9b897]">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#a9b897] p-16 rounded-[5rem] space-y-10 text-stone-900 relative overflow-hidden shadow-xl">
                  <Sparkles size={120} className="absolute -right-6 -bottom-6 opacity-20" />
                  <h4 className="text-[12px] font-black uppercase tracking-[0.6em] opacity-40">Live Insights</h4>
                  <p className="text-4xl font-serif italic tracking-tight relative z-10 leading-tight">Video formats are performing <span className="underline decoration-white underline-offset-8">42% better</span> on LinkedIn this week.</p>
                  <button className="relative z-10 px-8 py-4 bg-white/20 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/30 hover:bg-white transition-all">View Analytics</button>
                </div>

                <Link href="/settings/team" className="block group">
                  <div className="bg-white border border-stone-100 p-14 rounded-[5rem] space-y-10 shadow-sm hover:border-[#a9b897] transition-all duration-700">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-stone-900" />
                        <div className="w-2 h-2 rounded-full bg-stone-200" />
                        <div className="w-2 h-2 rounded-full bg-stone-100" />
                      </div>
                      <ArrowUpRight size={22} className="text-stone-300 group-hover:text-[#a9b897] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-stone-800">Team Collaboration</p>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-300">app/internal/team-nexus</p>
                    </div>
                  </div>
                </Link>
              </aside>
            </motion.div>
          )}

          {/* --- VIEW: SCHEDULER --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 pb-16 border-b border-stone-100">
                <div className="space-y-4">
                  <p className="text-[12px] font-black uppercase tracking-[0.7em] text-[#a9b897]">Chronos Mapping</p>
                  <h1 className="text-9xl font-serif italic tracking-tighter text-stone-900 leading-[0.8]">Scheduler</h1>
                </div>
                <div className="flex bg-white p-2 rounded-[2rem] border border-stone-100 shadow-xl shadow-stone-200/40">
                  <button onClick={() => setViewMode('stream')} className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'stream' ? 'bg-stone-900 text-white shadow-2xl' : 'text-stone-400'}`}>Stream View</button>
                  <button onClick={() => setViewMode('calendar')} className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-stone-900 text-white shadow-2xl' : 'text-stone-400'}`}>Grid Map</button>
                </div>
              </header>

              {viewMode === 'calendar' ? (
                <div className="grid grid-cols-12 gap-20">
                  <div className="col-span-12 lg:col-span-8 bg-white border border-stone-100 rounded-[6rem] p-24 shadow-sm">
                    <div className="flex items-center justify-between mb-24">
                      <h2 className="text-7xl font-serif italic text-stone-900">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                      <div className="flex gap-4">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-6 bg-stone-50 rounded-3xl hover:bg-stone-100 transition-all border border-stone-100 shadow-sm"><ChevronLeft size={24}/></button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-6 bg-stone-50 rounded-3xl hover:bg-stone-100 transition-all border border-stone-100 shadow-sm"><ChevronRight size={24}/></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-8">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[13px] font-black uppercase text-stone-300 text-center tracking-[0.6em] mb-12">{d}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const day = i - calendarGrid.firstDay + 1;
                        const isCurrentMonth = day > 0 && day <= calendarGrid.daysInMonth;
                        const hasPost = isCurrentMonth && (day === 12 || day === 15 || day === 22);
                        
                        return (
                          <div 
                            key={i} 
                            className={`aspect-square border border-stone-50 rounded-[3rem] p-10 transition-all cursor-pointer relative flex flex-col items-center justify-center group ${
                              !isCurrentMonth ? 'opacity-5 pointer-events-none' : 'bg-stone-50/20 hover:bg-white hover:shadow-2xl hover:border-[#a9b897]/50'
                            }`}
                          >
                            <span className={`text-3xl font-serif italic ${isCurrentMonth ? 'text-stone-400 group-hover:text-stone-900' : ''}`}>{isCurrentMonth ? day : ''}</span>
                            {hasPost && (
                              <div className="absolute bottom-8 w-2.5 h-2.5 rounded-full bg-[#a9b897] shadow-[0_0_15px_#a9b897]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-4 space-y-12">
                    <div className="flex items-center gap-6 px-4">
                      <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-stone-300">Pending Nodes</h3>
                      <div className="h-px flex-1 bg-stone-100" />
                    </div>
                    <div className="space-y-8">
                      {drafts.slice(0, 3).map(post => (
                        <div key={post.id} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-sm space-y-6 hover:border-[#a9b897] transition-all group">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-[#a9b897] tracking-[0.3em]">{post.platform}</span>
                            <div className="flex items-center gap-2 text-stone-300 group-hover:text-stone-900 transition-colors">
                              <Clock size={14}/>
                              <span className="text-[10px] font-black uppercase tracking-widest">09:00 AM</span>
                            </div>
                          </div>
                          <p className="text-2xl font-serif italic text-stone-700 line-clamp-2 leading-tight">"{post.caption}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {drafts.map(post => (
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} key={post.id} className="bg-white p-12 rounded-[4.5rem] border border-stone-100 flex items-center justify-between group hover:shadow-2xl transition-all duration-700">
                      <div className="flex items-center gap-16">
                        <div className="w-56 h-36 rounded-[2.5rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 bg-stone-50 border border-stone-100">
                          <img src={post.media_url} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-4 py-2 rounded-full">{post.platform}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">{post.format}</span>
                          </div>
                          <h4 className="text-4xl font-serif italic text-stone-800 line-clamp-1">"{post.caption}"</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-16 pr-8">
                        <div className="text-right">
                          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300 mb-2">Sync Date</p>
                          <p className="text-2xl font-serif italic">May 24, 2026</p>
                        </div>
                        <button className="p-7 bg-stone-50 text-stone-400 rounded-full group-hover:bg-stone-900 group-hover:text-white transition-all shadow-sm"><MoreHorizontal size={24}/></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- VIEW: ANALYTICS --- */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
               <div id="social-report" ref={reportRef} className="space-y-20 bg-[#FBFBFA] p-16 rounded-[6rem]">
                 <header className="flex justify-between items-end mb-12">
                    <div className="space-y-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.8em] text-[#a9b897]">Audit & Analysis</p>
                      <h2 className="text-8xl font-serif italic tracking-tighter text-stone-900 leading-[0.8]">Performance Map.</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black uppercase tracking-widest text-stone-300 mb-2">Cycle Period</p>
                      <p className="text-3xl font-serif italic">April 15 — May 15</p>
                    </div>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                    {[
                      { label: "Aggregate Reach", val: stats.reach, trend: "+12%", icon: <Globe /> },
                      { label: "Engagement Rate", val: stats.engagement, trend: "+0.4%", icon: <Heart /> },
                      { label: "Total Growth", val: stats.growth, trend: "+84", icon: <Activity /> }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-16 rounded-[5.5rem] border border-stone-100 shadow-sm space-y-10 relative overflow-hidden group">
                         <div className="flex justify-between items-start relative z-10">
                            <div className="p-6 bg-stone-50 rounded-3xl text-[#a9b897] transition-all group-hover:bg-stone-900 group-hover:text-white group-hover:scale-110">{stat.icon}</div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/10 px-6 py-3 rounded-full">{stat.trend}</span>
                         </div>
                         <div className="relative z-10">
                            <p className="text-[13px] font-black uppercase tracking-[0.6em] text-stone-300 mb-6">{stat.label}</p>
                            <p className="text-9xl font-serif italic tracking-tighter text-stone-900 leading-none group-hover:scale-105 transition-transform duration-1000 origin-left">{stat.val}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="bg-stone-900 rounded-[6rem] p-24 text-white flex flex-col lg:flex-row justify-between items-center gap-16 relative overflow-hidden">
                    <Sparkles size={400} className="absolute -right-32 -bottom-32 opacity-5" />
                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#a9b897] flex items-center justify-center text-stone-900">
                          <BarChart3 size={24} />
                        </div>
                        <h3 className="text-[13px] font-black uppercase tracking-[0.6em] text-[#a9b897]">Strategic Summary</h3>
                      </div>
                      <p className="text-6xl font-serif italic tracking-tight leading-[0.9] max-w-2xl">LinkedIn presence is at a <span className="text-[#a9b897]">30-day peak</span>. Transition focus to TikTok Reels for the next sprint.</p>
                      <div className="flex gap-10 pt-4">
                        <div className="space-y-2">
                           <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Primary Driver</p>
                           <p className="text-2xl font-serif italic">Video Interaction</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Audience Peak</p>
                           <p className="text-2xl font-serif italic">18:00 - 20:00 GMT</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 relative z-10 w-full lg:w-auto">
                      <button onClick={generatePDF} className="px-16 py-8 bg-[#a9b897] text-stone-900 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[#a9b897]/20 group">
                        <Download size={20} className="group-hover:-translate-y-1 transition-transform" /> Export High-Res Audit
                      </button>
                      <button className="px-16 py-8 bg-white/5 border border-white/10 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center gap-4">
                        <Share2 size={20} /> Share Studio Report
                      </button>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}

          {/* --- VIEW: GALLERY/VAULT --- */}
          {activeTab === "gallery" && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
              <header className="flex justify-between items-end pb-16 border-b border-stone-100">
                <div className="space-y-4">
                  <p className="text-[12px] font-black uppercase tracking-[0.7em] text-[#a9b897]">Media Asset Repository</p>
                  <h1 className="text-9xl font-serif italic tracking-tighter text-stone-900 leading-[0.8]">The Vault</h1>
                </div>
                <div className="flex gap-4">
                  <button className="p-6 bg-white border border-stone-100 rounded-3xl text-stone-400 hover:text-stone-900 transition-all shadow-sm"><Filter size={20}/></button>
                  <button className="px-10 py-5 bg-stone-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl"><Plus size={18}/> New Collection</button>
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-10">
                {drafts.map((post, i) => (
                  <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group aspect-[3/4] bg-white border border-stone-100 rounded-[3.5rem] p-5 relative overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700"
                  >
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000 relative">
                      <img src={post.media_url} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                         <div className="flex gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            <button className="p-4 bg-white rounded-full text-stone-900 shadow-2xl hover:scale-110 transition-transform"><Eye size={18}/></button>
                            <button className="p-4 bg-white rounded-full text-stone-900 shadow-2xl hover:scale-110 transition-transform"><Download size={18}/></button>
                         </div>
                      </div>
                    </div>
                    <div className="absolute top-8 right-8">
                       <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-400 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- Global Styles --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a9b897; }
      `}} />
    </div>
  );
}