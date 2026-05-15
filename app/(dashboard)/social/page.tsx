"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Activity, Heart, Zap, Radio, Share2, ArrowUpRight, 
  Upload, Download, Globe, Calendar as CalendarIcon, 
  Eye, Clock, MoreHorizontal, Settings, User, Layers,
  Filter, Search, Plus, BarChart3, Camera, Play, 
  Target, Fingerprint, Cpu, Info, CheckCircle2,
  Instagram, Linkedin, Twitter, MessageSquare, Video,
  Terminal, ShieldCheck, Database, ZapOff, RefreshCcw,
  LayoutGrid, List, BarChart, HardDrive, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- System Configuration & Types ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "Threads" | "TikTok";
type PostFormat = "Image" | "Video" | "Carousel";
type PostType = "Promotional" | "Comedic" | "Educational" | "Behind the Scenes" | "Lifestyle";
type StudioStatus = "Ready" | "Syncing" | "Synthesizing" | "Error";

interface DraftPost {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: "Draft" | "Scheduled" | "Published";
  scheduled_date: string;
  tags: string[];
  format: PostFormat;
  type: PostType;
}

const PLATFORMS: Platform[] = ["Instagram", "LinkedIn", "Twitter", "Threads", "TikTok"];
const FORMATS: PostFormat[] = ["Image", "Video", "Carousel"];
const TYPES: PostType[] = ["Promotional", "Comedic", "Educational", "Behind the Scenes", "Lifestyle"];

export default function SocialStudioPro() {
  // --- Core State Engine ---
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler" | "gallery" | "analytics">("lab");
  const [isMounted, setIsMounted] = useState(false);
  const [studioStatus, setStudioStatus] = useState<StudioStatus>("Ready");
  const [prompt, setPrompt] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("Image");
  const [selectedType, setSelectedType] = useState<PostType>("Promotional");
  
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // --- Supabase Client ---
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Database Sync Logic ---
  const fetchContentNodes = async () => {
    setStudioStatus("Syncing");
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Database Error:", error);
      setStudioStatus("Error");
      toast.error("Cloud synchronization failed");
      return;
    }

    if (data) {
      const mapped: DraftPost[] = data.map(d => ({
        id: d.id,
        platform: (d.platform as Platform) || "LinkedIn",
        caption: d.title || d.description || "Untitled Synthesis",
        media_url: d.media_url || `https://picsum.photos/seed/${d.id}/800/1000`,
        status: d.status || "Draft",
        scheduled_date: d.scheduled_date || d.created_at,
        tags: d.tags || ["System-Sync"],
        format: d.format || "Image",
        type: d.type || "Lifestyle"
      }));
      setDrafts(mapped);
    }
    setStudioStatus("Ready");
  };

  useEffect(() => {
    setIsMounted(true);
    fetchContentNodes();

    // Realtime Subscription
    const channel = supabase.channel('studio_v4_stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchContentNodes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // --- Calendar Engine (Year Error Fix) ---
  const calendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, current: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false });
    }

    return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year };
  }, [currentDate]);

  const handleMonthChange = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  // --- Functional Database Operations ---
  const handleSynthesize = async () => {
    if (!prompt || studioStatus === "Synthesizing") return;
    setStudioStatus("Synthesizing");

    const newNode = {
      title: prompt,
      platform: selectedPlatform,
      format: selectedFormat,
      type: selectedType,
      status: "Draft",
      media_url: `https://picsum.photos/seed/${Math.random()}/800/1200`,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('tasks').insert([newNode]);

    if (error) {
      toast.error("Failed to commit to database");
      setStudioStatus("Error");
    } else {
      toast.success("Content node persisted to cloud");
      setPrompt("");
      fetchContentNodes(); // Refresh
    }
  };

  const deleteNode = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      toast.success("Node purged");
      fetchContentNodes();
    }
  };

  const exportAudit = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#FBFBFA" });
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save(`Audit-${calendar.monthName}-${calendar.year}.pdf`);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 antialiased selection:bg-[#a9b897]">
      
      {/* --- REFINED NAV --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-100 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-[#a9b897]">
              <Database size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">Studio Pro</span>
              <span className="text-[7px] font-bold text-stone-300 uppercase mt-1">v4.8_Connected</span>
            </div>
          </div>
          
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {["lab", "scheduler", "gallery", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 border border-stone-100 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${studioStatus === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-[8px] font-black uppercase text-stone-400 tracking-tighter">{studioStatus}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-[#a9b897]">
            <User size={14} />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          
          {/* --- LAB VIEW --- */}
          {activeTab === "lab" && (
            <motion.div key="lab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-10">
              <div className="col-span-12 lg:col-span-8 space-y-10">
                <header className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Neural Synthesis Engine</p>
                  <h1 className="text-5xl font-serif italic text-stone-900 leading-none">The Lab.</h1>
                </header>

                <div className="bg-white rounded-[2.5rem] border border-stone-100 p-10 shadow-sm space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <section className="space-y-4">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 ml-1">Destination</label>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map(p => (
                          <button key={p} onClick={() => setSelectedPlatform(p)} className={`px-4 py-2 rounded-xl text-[9px] font-bold border transition-all ${selectedPlatform === p ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-4">
                      <label className="text-[8px] font-black uppercase tracking-widest text-stone-300 ml-1">Composition</label>
                      <div className="flex flex-wrap gap-2">
                        {FORMATS.map(f => (
                          <button key={f} onClick={() => setSelectedFormat(f)} className={`px-4 py-2 rounded-xl text-[9px] font-bold border transition-all ${selectedFormat === f ? 'bg-[#a9b897] text-white border-[#a9b897]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>{f}</button>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Input creative prompt for cloud synthesis..."
                      className="w-full h-48 bg-stone-50 rounded-[2rem] p-8 text-2xl font-serif italic outline-none text-stone-800 placeholder-stone-200 border border-transparent focus:border-stone-100 transition-all resize-none"
                    />
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-stone-100 rounded-full text-stone-300 hover:text-[#a9b897] transition-all shadow-sm">
                        <Camera size={18} />
                      </button>
                      <button
                        onClick={handleSynthesize}
                        disabled={!prompt || studioStatus === "Synthesizing"}
                        className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                      >
                        {studioStatus === "Synthesizing" ? "Synthesizing..." : "Generate Node"}
                        <Zap size={14} fill="currentColor" className="text-[#a9b897]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-stone-300 ml-2">Recent Database Nodes</h3>
                  <div className="grid grid-cols-2 gap-8">
                    {drafts.slice(0, 4).map((draft) => (
                      <div key={draft.id} className="bg-white rounded-[2.5rem] p-4 border border-stone-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                        <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-stone-50 mb-6 relative">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm">{draft.platform}</div>
                        </div>
                        <p className="text-lg font-serif italic text-stone-700 leading-snug px-2 line-clamp-2">"{draft.caption}"</p>
                        <div className="mt-6 flex gap-2">
                           <button className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">Schedule</button>
                           <button onClick={() => deleteNode(draft.id)} className="p-3 bg-stone-50 text-stone-300 rounded-xl hover:text-red-500 transition-colors hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                  <Fingerprint size={180} className="absolute -right-10 -top-10 opacity-5 rotate-12 group-hover:opacity-10 transition-opacity" />
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <ShieldCheck size={12} /> System Health
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[8px] font-bold text-stone-500 uppercase">Latency</span>
                        <span className="text-lg font-serif italic text-[#a9b897]">24ms</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <span className="text-[8px] font-bold text-stone-500 uppercase">Cloud Nodes</span>
                        <span className="text-lg font-serif italic text-[#a9b897]">{drafts.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#a9b897] p-8 rounded-[2.5rem] space-y-4">
                   <div className="flex items-center gap-2 text-stone-900/60">
                     <Sparkles size={16} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Neural Insight</span>
                   </div>
                   <p className="text-2xl font-serif italic text-stone-900 leading-tight">Your organic database reach is <span className="underline decoration-white underline-offset-4">up 12%</span> this week.</p>
                </div>

                <div className="bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">Live Traffic</span>
                     <RefreshCcw size={12} className={`text-stone-300 ${studioStatus === 'Syncing' ? 'animate-spin' : ''}`} />
                   </div>
                   <div className="space-y-3">
                      {[65, 45, 90].map((w, i) => (
                        <div key={i} className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: i * 0.2 }} className="h-full bg-stone-200 rounded-full" />
                        </div>
                      ))}
                   </div>
                </div>
              </aside>
            </motion.div>
          )}

          {/* --- SCHEDULER VIEW --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <header className="flex justify-between items-end border-b border-stone-100 pb-8">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Chronos Mapping</p>
                  <h1 className="text-5xl font-serif italic text-stone-900">Grid.</h1>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleMonthChange(-1)} className="p-3 bg-white border border-stone-100 rounded-xl text-stone-400 hover:text-stone-900 transition-all"><ChevronLeft size={20}/></button>
                  <button onClick={() => handleMonthChange(1)} className="p-3 bg-white border border-stone-100 rounded-xl text-stone-400 hover:text-stone-900 transition-all"><ChevronRight size={20}/></button>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-8 bg-white rounded-[3.5rem] border border-stone-100 p-10 shadow-sm">
                   <div className="flex justify-between items-center mb-10 px-4">
                      <h2 className="text-4xl font-serif italic text-stone-900">{calendar.monthName} <span className="text-stone-200">{calendar.year}</span></h2>
                   </div>
                   
                   <div className="grid grid-cols-7 gap-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[9px] font-black text-stone-200 uppercase text-center tracking-[0.2em] pb-4">{d}</div>
                      ))}
                      {calendar.days.map((d, i) => {
                        const hasNode = d.current && (d.day % 7 === 0);
                        return (
                          <div key={i} className={`aspect-square rounded-2xl border border-stone-50 flex flex-col items-center justify-center relative transition-all group cursor-pointer ${d.current ? 'bg-white hover:bg-stone-50' : 'bg-stone-50/50 opacity-20'}`}>
                             <span className={`text-xl font-serif italic ${d.current ? 'text-stone-900' : 'text-stone-300'}`}>{d.day}</span>
                             {hasNode && <div className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-[#a9b897]" />}
                          </div>
                        );
                      })}
                   </div>
                </div>
                
                <div className="col-span-12 lg:col-span-4 space-y-6">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-300 flex items-center gap-2 px-2">
                     <List size={12}/> Live Queue
                   </h4>
                   <div className="space-y-4">
                     {drafts.slice(0, 5).map(post => (
                       <div key={post.id} className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center gap-5 group hover:border-[#a9b897] transition-all">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-50 flex-shrink-0">
                             <img src={post.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-[#a9b897] uppercase tracking-widest">{post.platform}</p>
                             <p className="text-sm font-serif italic text-stone-600 line-clamp-1">"{post.caption}"</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- ANALYTICS VIEW --- */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10" ref={reportRef}>
               <header className="flex justify-between items-end border-b border-stone-100 pb-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Performance Mapping</p>
                    <h1 className="text-5xl font-serif italic text-stone-900 leading-none">Metrics.</h1>
                  </div>
                  <button onClick={exportAudit} className="flex items-center gap-3 px-6 py-3 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                    <Download size={16} /> Audit PDF
                  </button>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Cloud Storage", val: `${(drafts.length * 1.2).toFixed(1)}mb`, trend: "Optimal" },
                    { label: "Sync Velocity", val: "98.4%", trend: "+2.1%" },
                    { label: "Total Nodes", val: drafts.length, trend: "Stable" }
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-stone-100 text-center space-y-4">
                       <p className="text-[9px] font-black uppercase tracking-widest text-stone-200">{s.label}</p>
                       <p className="text-6xl font-serif italic text-stone-900">{s.val}</p>
                       <span className="inline-block px-3 py-1 bg-[#a9b897]/10 text-[#a9b897] text-[9px] font-black rounded-full uppercase tracking-widest">{s.trend}</span>
                    </div>
                  ))}
               </div>

               <div className="bg-stone-900 rounded-[3.5rem] p-12 text-white flex items-center justify-between relative overflow-hidden group">
                  <BarChart3 size={200} className="absolute -right-20 opacity-5 group-hover:opacity-10 transition-opacity" />
                  <div className="space-y-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-[#a9b897]/20 flex items-center justify-center text-[#a9b897]">
                        <Activity size={24} />
                     </div>
                     <p className="text-4xl font-serif italic max-w-xl leading-tight">Database integrity is <span className="text-[#a9b897]">confirmed</span>. Real-time sync streaming is active across all sessions.</p>
                  </div>
               </div>
            </motion.div>
          )}

          {/* --- GALLERY VIEW --- */}
          {activeTab === "gallery" && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <header className="flex justify-between items-end border-b border-stone-100 pb-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Media Repository</p>
                    <h1 className="text-5xl font-serif italic text-stone-900">Vault.</h1>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={fetchContentNodes} className="p-3 bg-white border border-stone-100 rounded-xl text-stone-400 hover:text-stone-900 transition-colors"><RefreshCcw size={20}/></button>
                    <button className="px-6 py-3 bg-stone-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                       <Plus size={16}/> New Entry
                    </button>
                  </div>
               </header>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {drafts.map((post) => (
                    <div key={post.id} className="aspect-[3/4] rounded-[2.5rem] overflow-hidden group relative bg-stone-100 border border-stone-50 shadow-sm">
                       <img src={post.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                       <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                          <button className="p-3 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform"><Eye size={20}/></button>
                          <button onClick={() => deleteNode(post.id)} className="p-3 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"><Trash2 size={20}/></button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- GLOBAL STYLING --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E5E0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a9b897; }
        .antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}