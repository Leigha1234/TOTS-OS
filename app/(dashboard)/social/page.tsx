"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Sparkles, ChevronLeft, ChevronRight, 
  Activity, ShieldCheck, Heart, Eye, Zap, Radio,
  Calendar as CalendarIcon, List, Share2, BarChart3, Clock, Settings,
  Image as ImageIcon, Video, FileText, Plus, X, ArrowUpRight,
  Hash, MessageSquare, Download, Filter, MoreHorizontal,
  Cloud, Lock, CheckCircle2, AlertCircle, UserPlus, Search, Globe, Edit2
} from "lucide-react";
import { toast } from "sonner";

// --- Types & Config ---
type Platform = "Instagram" | "LinkedIn" | "Twitter" | "Threads" | "TikTok";
const platforms: Platform[] = ["Instagram", "LinkedIn", "Twitter", "Threads", "TikTok"];

interface DraftPost {
  id: string;
  platform: Platform;
  caption: string;
  media_url: string;
  status: "Draft" | "Scheduled" | "Published";
  scheduled_date: string;
  tags: string[];
}

export default function SocialStudioPro() {
  // --- State Architecture ---
  const [activeTab, setActiveTab] = useState<"creative" | "scheduler" | "gallery" | "analytics">("creative");
  const [isMounted, setIsMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("Instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('calendar');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    setIsMounted(true);
    // Initialize with some mock data for the 400-line complexity simulation
    setDrafts([
      {
        id: "NODE-881",
        platform: "Instagram",
        caption: "A deep dive into the intersection of tech and organic design principles. #Aesthetic #Tech",
        media_url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=800",
        status: "Scheduled",
        scheduled_date: "2026-05-20",
        tags: ["Design", "Strategy"]
      },
      {
        id: "NODE-442",
        platform: "LinkedIn",
        caption: "Expanding the team at TAS. Grateful for the journey so far.",
        media_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
        status: "Draft",
        scheduled_date: "2026-05-25",
        tags: ["Hiring", "Culture"]
      }
    ]);
  }, []);

  // --- Logic Engines ---
  const synthesizeContent = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    
    // Simulate complex AI multi-step synthesis
    await new Promise(r => setTimeout(r, 1500));
    
    const newDraft: DraftPost = {
      id: `NODE-${Math.floor(Math.random() * 999)}`,
      platform: selectedPlatform,
      caption: prompt,
      media_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
      status: "Draft",
      scheduled_date: new Date().toISOString().split('T')[0],
      tags: ["AI-Generated", "Organic"]
    };

    setDrafts(prev => [newDraft, ...prev]);
    setIsGenerating(false);
    setPrompt("");
    toast.success("Signal Synthesized: Ready for Curation");
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, month, year };
  }, [currentDate]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-800 pb-24 selection:bg-[#a9b897] selection:text-white">
      
      {/* --- GLOBAL TOP NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-100 px-8 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-stone-900 flex items-center justify-center text-[#a9b897] transition-all group-hover:rotate-6">
              <Radio size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-none">Studio</p>
              <p className="text-[8px] font-bold text-stone-400 mt-1 uppercase tracking-widest">v4.0.2 Stable</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-stone-100/50 p-1.5 rounded-2xl">
            {["creative", "scheduler", "gallery", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100">
            <div className="w-2 h-2 rounded-full bg-[#a9b897] animate-pulse" />
            <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Leigha D-C. Online</span>
          </div>
          <button className="p-2.5 hover:bg-stone-100 rounded-full transition-colors"><Settings size={18} className="text-stone-400" /></button>
          <div className="w-10 h-10 rounded-2xl bg-[#a9b897]/20 border border-[#a9b897]/30 flex items-center justify-center font-serif italic font-bold text-[#a9b897]">L</div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-8 py-12">
        
        <AnimatePresence mode="wait">
          
          {/* --- TAB: CREATIVE SUITE --- */}
          {activeTab === "creative" && (
            <motion.div key="creative" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-12">
              
              <div className="col-span-12 lg:col-span-7 space-y-10">
                <header className="space-y-4">
                  <div className="flex items-center gap-3 text-[#a9b897]">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synthesis Engine</span>
                  </div>
                  <h1 className="text-7xl font-serif italic tracking-tighter text-stone-900 leading-tight">Creative <br />Intelligence.</h1>
                </header>

                <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-10 space-y-8">
                    {/* Platform Selector */}
                    <div className="flex flex-wrap gap-2">
                      {platforms.map(p => (
                        <button 
                          key={p} 
                          onClick={() => setSelectedPlatform(p)}
                          className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                            selectedPlatform === p 
                            ? 'bg-stone-900 text-white border-stone-900 shadow-lg shadow-stone-200' 
                            : 'bg-stone-50 text-stone-400 border-stone-100 hover:border-stone-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <div className="relative group">
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Define your creative directive... (e.g., 'Modernist post about software architecture')"
                        className="w-full h-56 bg-stone-50/50 rounded-[2rem] p-8 text-2xl font-serif italic outline-none text-stone-800 placeholder-stone-200 resize-none transition-all focus:bg-white focus:ring-1 ring-stone-100"
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <span className="text-[10px] font-mono text-stone-300">{prompt.length}/280</span>
                        <button
                          onClick={synthesizeContent}
                          disabled={!prompt || isGenerating}
                          className="bg-[#a9b897] text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#a9b897]/20 disabled:opacity-20 transition-all flex items-center gap-4 active:scale-95"
                        >
                          {isGenerating ? "Processing Signal..." : "Execute Synth"}
                          <Zap size={14} fill="currentColor" />
                        </button>
                      </div>
                    </div>

                    {/* Meta Controls */}
                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-50">
                      {[
                        { icon: <ImageIcon size={18}/>, label: "Visual Asset" },
                        { icon: <Video size={18}/>, label: "Motion Clip" },
                        { icon: <Hash size={18}/>, label: "Auto-Tag" }
                      ].map((item, i) => (
                        <button key={i} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all">
                          {item.icon}
                          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* DRAFTS FEED */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300 px-2">Active Signal Drafts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {drafts.map((draft) => (
                      <motion.div layout key={draft.id} className="bg-white rounded-[2.5rem] p-4 border border-stone-100 group shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-500">
                        <div className="aspect-[4/5] relative rounded-[2rem] overflow-hidden mb-6">
                          <img src={draft.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-900">{draft.platform}</span>
                          </div>
                        </div>
                        <div className="px-4 pb-4 space-y-4">
                          <p className="text-base font-serif italic text-stone-600 leading-relaxed line-clamp-3">"{draft.caption}"</p>
                          <div className="flex gap-3">
                            <button className="flex-1 bg-stone-900 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] transition-all">Queue Post</button>
                            <button onClick={() => setDrafts(drafts.filter(d => d.id !== draft.id))} className="p-4 bg-stone-50 text-stone-300 rounded-2xl hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ASIDE: INTELLIGENCE & PERSONNEL */}
              <aside className="col-span-12 lg:col-span-5 space-y-8">
                
                <div className="bg-[#a9b897] text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                  <ShieldCheck size={240} className="absolute -right-16 -top-16 opacity-5 rotate-12" />
                  <div className="relative z-10 space-y-10">
                    <header className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Strategic Overview</h3>
                      <p className="text-4xl font-serif italic tracking-tighter leading-none">Curation <br />Logic.</p>
                    </header>
                    
                    <div className="space-y-6 pt-10 border-t border-white/10">
                      {[
                        { label: "Optimal Flow", val: "High Resonance" },
                        { label: "Viral Potential", val: "Moderate" },
                        { label: "Audience Pulse", val: "18:30 PM Peak" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-end">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{item.label}</p>
                          <p className="text-xl font-serif italic">{item.val}</p>
                        </div>
                      ))}
                    </div>

                    <button className="w-full py-5 bg-white text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Refresh Analytics</button>
                  </div>
                </div>

                <div className="bg-white border border-stone-100 p-10 rounded-[3.5rem] space-y-8 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-300">Team Collaboration</h3>
                  <div className="space-y-4">
                    {[
                      { name: "David M.", role: "Manager", status: "Reviewing" },
                      { name: "Bot Logic", role: "AI", status: "Optimizing" }
                    ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-stone-50 rounded-3xl border border-transparent hover:border-stone-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-400 group-hover:bg-stone-900 group-hover:text-[#a9b897] transition-all">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-stone-800">{user.name}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">{user.role}</p>
                          </div>
                        </div>
                        <span className="text-[8px] font-black uppercase text-[#a9b897] bg-[#a9b897]/5 px-3 py-1 rounded-full">{user.status}</span>
                      </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-300 hover:border-[#a9b897] hover:text-[#a9b897] transition-all flex items-center justify-center gap-2">
                      <UserPlus size={14} /> Invite Node
                    </button>
                  </div>
                </div>

              </aside>
            </motion.div>
          )}

          {/* --- TAB: SCHEDULER ENGINE --- */}
          {activeTab === "scheduler" && (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-stone-100">
                <div className="space-y-4">
                  <h1 className="text-8xl font-serif italic tracking-tighter text-stone-900 leading-none">Roadmap.</h1>
                  <p className="text-lg font-serif italic text-stone-400">Sequential deployment across the digital horizon.</p>
                </div>
                
                <div className="flex gap-4">
                   <div className="flex bg-white p-1.5 rounded-2xl border border-stone-100 shadow-sm">
                      <button onClick={() => setViewMode('stream')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'stream' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>Stream</button>
                      <button onClick={() => setViewMode('calendar')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>Calendar</button>
                   </div>
                   <button className="bg-[#a9b897] text-white px-8 py-4 rounded-2xl flex items-center gap-3 active:scale-95 shadow-xl shadow-[#a9b897]/20">
                      <Plus size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">New Slot</span>
                   </button>
                </div>
              </header>

              {viewMode === 'calendar' ? (
                <div className="bg-white border border-stone-100 rounded-[4rem] p-16 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <CalendarIcon size={400} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-16">
                     <h2 className="text-5xl font-serif italic text-stone-800">
                        {currentDate.toLocaleString('default', { month: 'long' })} <span className="text-stone-300">{currentDate.getFullYear()}</span>
                     </h2>
                     <div className="flex gap-2">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all"><ChevronLeft size={18}/></button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-all"><ChevronRight size={18}/></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-7 gap-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-[11px] font-black uppercase text-stone-300 text-center tracking-[0.4em] mb-8">{d}</div>
                    ))}
                    
                    {Array.from({ length: 35 }).map((_, i) => {
                      const day = i - calendarDays.firstDay + 1;
                      const isCurrentMonth = day > 0 && day <= calendarDays.daysInMonth;
                      const hasPost = isCurrentMonth && [12, 20, 24].includes(day);

                      return (
                        <div key={i} className={`aspect-square border border-stone-50 rounded-[2.5rem] p-6 group transition-all cursor-pointer relative ${
                          !isCurrentMonth ? 'opacity-10' : 'bg-stone-50/30 hover:bg-white hover:shadow-2xl hover:shadow-stone-200/50 hover:border-[#a9b897]/30'
                        }`}>
                          <span className={`text-lg font-serif italic ${hasPost ? 'text-[#a9b897] font-bold' : 'text-stone-400'}`}>
                            {isCurrentMonth ? day : ''}
                          </span>
                          
                          {hasPost && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-6 right-6 flex -space-x-2">
                               <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-900 flex items-center justify-center shadow-lg">
                                  <ImageIcon size={10} className="text-white" />
                               </div>
                               <div className="w-8 h-8 rounded-full border-2 border-white bg-[#a9b897] flex items-center justify-center shadow-lg">
                                  <span className="text-[8px] font-black text-white">+1</span>
                               </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {drafts.filter(d => d.status === 'Scheduled').map(post => (
                    <div key={post.id} className="bg-white p-8 rounded-[3rem] border border-stone-100 flex items-center justify-between group hover:shadow-xl transition-all">
                       <div className="flex items-center gap-10">
                          <div className="w-32 h-20 rounded-2xl overflow-hidden grayscale">
                             <img src={post.media_url} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] mb-2">{post.platform} • Scheduled</p>
                             <h4 className="text-2xl font-serif italic text-stone-800 line-clamp-1">{post.caption}</h4>
                             <div className="flex gap-2 mt-3">
                                {post.tags.map(t => <span key={t} className="text-[8px] font-black uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full text-stone-400">#{t}</span>)}
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-8 px-10">
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Deployment</p>
                             <p className="text-xl font-serif italic text-stone-800">{post.scheduled_date}</p>
                          </div>
                          <button className="p-4 bg-stone-50 rounded-2xl text-stone-300 hover:bg-stone-900 hover:text-white transition-all"><Edit2 size={16}/></button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- TAB: GALLERY VAULT --- */}
          {activeTab === "gallery" && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <header className="flex justify-between items-end pb-10 border-b border-stone-100">
                <div className="space-y-4">
                   <h1 className="text-8xl font-serif italic tracking-tighter text-stone-900 leading-none">Vault.</h1>
                   <p className="text-lg font-serif italic text-stone-400">Curated high-fidelity assets ready for deployment.</p>
                </div>
                <div className="flex gap-4">
                   <div className="relative">
                      <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
                      <input 
                        placeholder="Search manifest..." 
                        className="bg-white border border-stone-100 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:ring-1 ring-[#a9b897]/30 min-w-[300px]"
                      />
                   </div>
                   <button className="bg-stone-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 active:scale-95 shadow-xl">
                      <Cloud size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ingest Asset</span>
                   </button>
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -5 }}
                    className="aspect-square bg-white border border-stone-100 rounded-[2.5rem] p-3 group relative cursor-pointer shadow-sm"
                  >
                    <div className="w-full h-full rounded-[2rem] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                       <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=400`} className="w-full h-full object-cover scale-110 group-hover:scale-100" />
                    </div>
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] flex items-center justify-center gap-3">
                       <button className="p-3 bg-white rounded-xl text-stone-900"><Eye size={16}/></button>
                       <button className="p-3 bg-[#a9b897] rounded-xl text-white"><Share2 size={16}/></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- TAB: PERFORMANCE ANALYTICS --- */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "Global Reach", val: "128.4k", trend: "+14%", icon: <Globe /> },
                    { label: "Engagement", val: "8.2%", trend: "+2.1%", icon: <Heart /> },
                    { label: "Net Growth", val: "4,102", trend: "+12%", icon: <Activity /> }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-12 rounded-[4rem] border border-stone-100 shadow-sm space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="p-4 bg-stone-50 rounded-2xl text-[#a9b897]">{stat.icon}</div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#a9b897] bg-[#a9b897]/5 px-4 py-2 rounded-full">{stat.trend}</span>
                       </div>
                       <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-300 mb-2">{stat.label}</p>
                          <p className="text-7xl font-serif italic tracking-tighter text-stone-900 leading-none">{stat.val}</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="bg-stone-900 text-white p-20 rounded-[5rem] shadow-2xl relative overflow-hidden">
                  <BarChart3 size={400} className="absolute -right-20 -bottom-20 opacity-5" />
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                     <div className="space-y-10">
                        <h2 className="text-6xl font-serif italic tracking-tighter leading-none">Resonance <br />Mapping.</h2>
                        <p className="text-lg font-serif italic opacity-40 max-w-md">Your visual assets are driving 62% of all conversions. We recommend shifting focus to high-contrast monochrome content for Q3.</p>
                        <div className="flex gap-4">
                           <button className="px-10 py-5 bg-[#a9b897] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Download Full PDF</button>
                           <button className="px-10 py-5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all">Share Report</button>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-8">
                        {['Insta', 'LinkedIn', 'Twitter', 'TikTok'].map(p => (
                          <div key={p} className="p-10 border border-white/5 bg-white/5 rounded-[3rem] space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#a9b897]">{p}</p>
                             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.random() * 60 + 40}%` }} className="h-full bg-white transition-all duration-1000" />
                             </div>
                             <p className="text-2xl font-serif italic">+{Math.floor(Math.random() * 1000)} pts</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- FOOTER UTILITY --- */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-stone-100 flex justify-between items-center px-12 z-50">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-400" />
               <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Sync Pipeline: Active</p>
            </div>
            <div className="hidden md:flex gap-6">
               <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 cursor-pointer">Security Protocol</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 cursor-pointer">API Ledger</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <p className="text-[10px] font-serif italic text-stone-400">Operational Node: Edinburgh, UK</p>
            <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-[10px] text-stone-300">?</div>
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #e2e2e2; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #d2d2d2; }
      `}} />
    </div>
  );
}