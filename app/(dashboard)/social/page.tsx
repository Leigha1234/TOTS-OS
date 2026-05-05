"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client"; // Use sync client
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Layers, 
  Video, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  Trash2, 
  BarChart3, 
  Sparkles,
  Plus,
  Clock3,
  CheckCircle,
  MoreVertical,
  Edit2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface ContentDraft {
  id?: string;
  type: "image" | "video" | "blog" | "carousel";
  caption: string;
  hashtags: string[];
  mentions: string[];
  location: string;
  platform: string;
  scheduled_for: string;
  status: "draft" | "scheduled";
  media_url?: string;
  excellence_score?: number;
  peak_time?: string;
}

const WEEKLY_LIMIT = 15;

export default function SocialLab() {
  const [activeSubTab, setActiveSubTab] = useState<"synthesizer" | "horizon">("synthesizer");
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentDraft["type"]>("image");
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);

  // Horizon Scheduler States
  const [horizonPosts, setHorizonPosts] = useState<ContentDraft[]>([]);
  const [viewMode, setViewMode] = useState<'stream' | 'calendar'>('stream');
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Calendar Engine States
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const contentTypes = [
    { id: "image", label: "Image", icon: ImageIcon, code: "IMG" },
    { id: "carousel", label: "Carousel", icon: Layers, code: "CRSL" },
    { id: "video", label: "Video", icon: Video, code: "MOV" },
    { id: "blog", label: "Blog", icon: FileText, code: "TXT" },
  ] as const;

  const platforms = ["Instagram", "LinkedIn", "Twitter", "Global Pool"];

  useEffect(() => {
    setIsMounted(true);
    fetchWeeklyCount();
    if (activeSubTab === 'horizon') {
      fetchScheduledPosts();
    }
  }, [activeSubTab]);

  const fetchWeeklyCount = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const { count } = await supabase
        .from("social_posts")
        .select("*", { count: 'exact', head: true })
        .gte("scheduled_for", startOfWeek);
      if (count !== null) setWeeklyCount(count);
    } catch (e) {
      console.error("Capacity check failed", e);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("status", "scheduled")
        .order("scheduled_for", { ascending: true });
        
      if (!error && data) {
        const mapped: ContentDraft[] = data.map((item: any) => ({
          id: item.id,
          type: "image",
          caption: item.caption,
          hashtags: [],
          mentions: [],
          location: "",
          platform: item.platform,
          scheduled_for: item.scheduled_for,
          status: "scheduled",
          media_url: item.media_url,
          excellence_score: 92
        }));
        setHorizonPosts(mapped);
      }
    } catch (e) {
      console.error("Failed to load scheduled items", e);
    }
  };

  const buildContent = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 1000);
      const score = Math.floor(Math.random() * (98 - 85) + 85);
      
      const aiResponse: ContentDraft = {
        id: `draft-${Date.now()}`,
        type: contentType,
        platform: selectedPlatform.toLowerCase(),
        caption: `Clarity isn't about doing more; it's about being more intentional.\n\n${prompt} — We're implementing this shift at The Organised Types.\n\nHow does this change your workflow? 👇`,
        hashtags: ["#theorganisedtypes", "#clarityOS"],
        mentions: ["@TheOrganisedTypes"],
        location: "Clarity Headquarters",
        scheduled_for: "",
        status: "draft",
        media_url: `https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=800&sig=${randomId}`,
        excellence_score: score,
        peak_time: "06:45 PM"
      };

      setDrafts([aiResponse, ...drafts]);
      setIsGenerating(false);
      setPrompt("");
    }, 1500);
  };

  const schedulePost = async (index: number) => {
    const post = drafts[index];
    if (!selectedScheduleDate) return alert("Please select a date on the draft card.");

    const { error } = await supabase.from("social_posts").insert([{
      caption: post.caption,
      platform: post.platform,
      scheduled_for: selectedScheduleDate,
      status: "scheduled",
      media_url: post.media_url
    }]);

    if (!error) {
      const newDrafts = drafts.filter((_, i) => i !== index);
      setDrafts(newDrafts);
      fetchWeeklyCount();
      alert("Post synchronized with the horizon.");
      setSelectedScheduleDate('');
    } else {
      alert(`Synchronization failure: ${error.message}`);
    }
  };

  // Calendar Engine Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const TabButton = ({ id, label, current }: { id: any, label: string, current: any }) => (
    <button 
      onClick={() => setActiveSubTab(id)}
      className={`px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer ${
        current === id 
          ? "bg-stone-900 text-white shadow-xl" 
          : "bg-white border border-stone-200 text-stone-500 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );

  const SubTabActiveCheck = (tab: string) => (
    tab === 'horizon' ? 'hidden lg:block' : ''
  );

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-6 md:p-12 max-w-[1700px] mx-auto space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200 pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-600">
            <Zap size={14} fill="currentColor" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Elite Tier Access</p>
          </div>
          <h1 className="text-7xl font-serif italic tracking-tighter">Social Lab</h1>
          <p className="text-stone-400 italic font-serif text-lg">Distribution engine online. Synthesizing excellence.</p>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-100 md:border-none">
          <TabButton id="synthesizer" label="Synthesizer & Drafts" current={activeSubTab} />
          <TabButton id="horizon" label="Strategic Horizon" current={activeSubTab} />
        </div>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-start gap-12 bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm">
        <div className="w-full md:w-80 space-y-3">
          <div className="flex justify-between items-end">
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Weekly Output Capacity</p>
            <p className="text-sm font-serif italic">{weeklyCount} / {WEEKLY_LIMIT}</p>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(weeklyCount / WEEKLY_LIMIT) * 100}%` }}
              className="h-full bg-purple-500"
            />
          </div>
        </div>
        <button className="text-[10px] font-black bg-stone-900 text-white px-8 py-5 rounded-2xl uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-stone-700 transition-all cursor-pointer">
          <BarChart3 size={16} /> Platform Audit Intelligence
        </button>
      </div>

      <div className="grid grid-cols-12 gap-16">
        <div className={`${activeSubTab === 'synthesizer' ? 'lg:col-span-8' : 'col-span-12'} space-y-12`}>
          <AnimatePresence mode="wait">
            {activeSubTab === "synthesizer" ? (
              <motion.div key="syn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-12">
                <section className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-stone-100 space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex flex-col gap-6">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Content Architecture</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {contentTypes.map((t) => (
                          <button 
                            key={t.id} 
                            onClick={() => setContentType(t.id)} 
                            className={`flex items-center gap-3 p-5 rounded-2xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${contentType === t.id ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-transparent border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-700'}`}
                          >
                            <t.icon size={14} strokeWidth={contentType === t.id ? 3 : 2} />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Target Hub</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {platforms.map((p) => (
                          <button 
                            key={p} 
                            onClick={() => setSelectedPlatform(p)} 
                            className={`flex items-center gap-3 p-5 rounded-2xl border text-[10px] font-bold uppercase transition-all cursor-pointer ${selectedPlatform === p ? 'bg-stone-100 text-stone-900 border-stone-200' : 'bg-transparent border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-700'}`}
                          >
                            <Sparkles size={14} className={selectedPlatform === p ? 'text-purple-600' : ''}/>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Input post intent or core message..."
                      className="w-full h-56 bg-stone-50 rounded-[2.5rem] p-10 text-2xl font-serif outline-none italic text-stone-800 placeholder-stone-200 resize-none transition-all focus:bg-white focus:shadow-inner border border-transparent focus:border-stone-100"
                    />
                    <div className="absolute top-8 right-10 flex items-center gap-2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-mono text-[9px] tracking-widest uppercase text-stone-400">Buffer Ready</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-3 hover:text-stone-900 transition-colors cursor-pointer">
                      <Plus size={14} /> Attach Reference
                    </button>
                    <button
                      onClick={buildContent}
                      disabled={isGenerating || !prompt}
                      className="bg-purple-600 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-200 hover:bg-purple-700 disabled:opacity-20 transition-all flex items-center gap-3 cursor-pointer"
                    >
                      {isGenerating ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Synthesizing</>
                      ) : (
                        <><Sparkles size={14} /> Generate Excellence</>
                      )}
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <AnimatePresence>
                    {drafts.map((post, idx) => (
                      <motion.div 
                        key={post.id} 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-[#fffde7] p-10 rounded-[3rem] shadow-xl flex flex-col gap-6 relative group"
                      >
                        <button 
                          onClick={() => setDrafts(drafts.filter((_, i) => i !== idx))}
                          className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-inner">
                          <img src={post.media_url} className="w-full h-full object-cover grayscale mix-blend-multiply opacity-70" alt="Generated Content Preview" />
                          <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-2">
                             <BarChart3 size={10} /> RESONANCE: {post.excellence_score}%
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                            {post.platform} // {post.type}
                          </p>
                          <p className="text-stone-900 font-serif text-lg leading-relaxed italic line-clamp-4">
                            "{post.caption}"
                          </p>
                        </div>

                        <div className="pt-6 border-t border-black/5 space-y-4">
                          <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-black/5 cursor-pointer">
                            <Calendar size={14} className="text-stone-400" />
                            <input 
                              type="datetime-local" 
                              className="bg-transparent text-[10px] font-bold uppercase outline-none w-full cursor-pointer" 
                              value={selectedScheduleDate}
                              onChange={(e) => setSelectedScheduleDate(e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => schedulePost(idx)}
                            className="w-full bg-stone-900 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                          >
                            Synchronize with Horizon
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div key="hor" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-12">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white border border-stone-200 p-8 rounded-[2.5rem] gap-6 shadow-sm">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-serif italic text-stone-800 tracking-tighter">Strategic Horizon Schedule</h2>
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Chronological Distribution Feed</p>
                  </div>
                  
                  <div className="flex items-center gap-3 border border-stone-100 rounded-xl p-1 bg-stone-50">
                    {['stream', 'calendar'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={`px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === mode ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-700'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {viewMode === 'stream' ? (
                  <div className="space-y-8">
                    {horizonPosts.map((post) => {
                      const schedDate = new Date(post.scheduled_for);
                      return (
                        <div key={post.id} className="bg-white border border-stone-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-start md:items-center gap-10 shadow-sm group">
                          <div className="flex md:flex-col items-center justify-center min-w-[90px] border-b md:border-b-0 md:border-r border-stone-100 pb-4 md:pb-0 md:pr-10 gap-2 md:gap-1">
                            <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">{schedDate.toLocaleDateString("en-US", { weekday: 'short' })}</span>
                            <span className="text-4xl font-serif italic text-stone-800 leading-none">{schedDate.getDate()}</span>
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{schedDate.toLocaleDateString("en-US", { month: 'short' })}</span>
                          </div>

                          <div className="aspect-square w-24 rounded-xl overflow-hidden bg-stone-50 shadow-inner">
                            <img src={post.media_url} className="w-full h-full object-cover" alt="Scheduled Media" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest">
                                {post.platform}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-stone-400 text-[9px] font-bold uppercase p-1.5 px-3 bg-stone-50 border border-stone-100 rounded-full">{post.type}</span>
                                <MoreVertical size={16} className="text-stone-300" />
                              </div>
                            </div>
                            <p className="text-stone-900 font-serif italic text-lg leading-snug line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                              "{post.caption}"
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-3">
                            <button className="h-14 w-14 rounded-full border border-stone-100 flex items-center justify-center text-stone-300 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer">
                              <Edit2 size={18}/>
                            </button>
                            <div className="h-14 w-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                              <CheckCircle size={18}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {horizonPosts.length === 0 && (
                      <div className="col-span-3 text-center py-24 bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2.5rem]">
                        <p className="text-xs text-stone-400 tracking-widest uppercase font-black">No scheduled posts on the horizon</p>
                        <p className="text-stone-500 italic mt-2 text-sm font-serif">Synthesize drafts from the Synthesizer tab to fill the calendar.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Fully Realized Interactive Calendar Interface
                  <div className="bg-white border border-stone-200 p-12 rounded-[2.5rem] shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-serif italic text-stone-800 tracking-tighter">
                          {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                        </h3>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handlePrevMonth}
                          className="h-12 w-12 rounded-2xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 hover:text-stone-900 cursor-pointer text-stone-400 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={handleNextMonth}
                          className="h-12 w-12 rounded-2xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 hover:text-stone-900 cursor-pointer text-stone-400 transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4 text-center">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-[9px] font-black tracking-[0.2em] text-stone-400 uppercase py-3 border-b border-stone-100">
                          {day}
                        </div>
                      ))}

                      {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-20" />
                      ))}

                      {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, day) => {
                        const dayNumber = day + 1;
                        const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                        const postExists = horizonPosts.some(p => p.scheduled_for.startsWith(dateString));

                        return (
                          <div 
                            key={dayNumber} 
                            onClick={() => setSelectedScheduleDate(dateString)}
                            className={`h-20 rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none ${
                              selectedScheduleDate === dateString 
                              ? 'border-purple-400 bg-purple-50/40 ring-2 ring-purple-100'
                              : 'border-stone-100 hover:border-stone-300 bg-stone-50/40'
                            }`}
                          >
                            <span className={`text-xs font-bold ${postExists ? 'text-purple-600 font-black' : 'text-stone-700'}`}>
                              {dayNumber}
                            </span>
                            {postExists && (
                              <div className="flex justify-center items-center">
                                <span className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                              </div>
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
        </div>

        <aside className={`lg:col-span-4 ${SubTabActiveCheck(activeSubTab)}`}>
          <div className="bg-white border border-stone-200 p-12 rounded-[3.5rem] shadow-sm space-y-10 sticky top-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-serif italic text-stone-900 tracking-tighter">Resonance Engine</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">Real-time Predictive Data</p>
            </div>

            <div className="space-y-8">
              {[
                { label: "Predictive Engagement", val: "+24.8%", trend: "OPTIMAL", trendColor: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                { label: "Global Reach Index", val: "Elite", trend: "MAX", trendColor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Peak Window", val: "18:45", trend: "LOCKED", trendColor: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-end border-b border-stone-100 pb-6 group cursor-pointer hover:border-purple-100 transition-colors">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 group-hover:text-purple-600 transition-colors">{m.label}</p>
                    <p className="text-4xl font-serif italic mt-1 text-stone-950">{m.val}</p>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase border ${m.trendColor} ${m.bg} ${m.border}`}>
                    {m.trend}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-purple-600"/>
                <p className="text-[10px] font-bold uppercase text-stone-900 tracking-wider">Insight Node</p>
              </div>
              <p className="text-sm font-serif italic text-stone-700 leading-relaxed">
                "Video content synthesized between 12:00 and 14:00 today shows a 12% higher resonance probability based on recent node activity."
              </p>
              <button className="text-[9px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition-colors pt-2 cursor-pointer">View Node Data →</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}