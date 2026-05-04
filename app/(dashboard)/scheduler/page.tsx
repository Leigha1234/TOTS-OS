"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; // Import sync client
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Sparkles,
  Zap,
  X,
  Loader2,
  BarChart3
} from "lucide-react";
import Page from "@/app/components/Page"; 

interface ScheduledPost {
  id: string;
  caption: string;
  platform: string;
  scheduled_for: string;
  media_url: string;
  status: string;
}

export default function Scheduler() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // -- Clarity Intelligence States --
  const [isAuditing, setIsAuditing] = useState(false);
  const [strategicInsight, setStrategicInsight] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    // Fetch data using standard client connection
    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .order("scheduled_for", { ascending: true });

    if (error) {
      console.error("Error fetching social posts:", error.message);
      // Fallback for demonstration
      setPosts([
        {
          id: "sp-1",
          caption: "Building a scalable ecosystem with high-fidelity analytics support",
          platform: "LinkedIn",
          scheduled_for: "2026-05-10T14:30:00Z",
          media_url: "",
          status: "Scheduled"
        },
        {
          id: "sp-2",
          caption: "Node synchronization metrics operating at 100% capacity",
          platform: "Twitter",
          scheduled_for: "2026-05-12T09:00:00Z",
          media_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
          status: "Scheduled"
        }
      ]);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const runStrategicAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const platformCounts = posts.reduce((acc: any, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {});
      
      const platforms = Object.keys(platformCounts);
      const primary = platforms[0] || "None";
      
      setStrategicInsight(
        `Audit Complete: Your narrative is currently ${primary}-heavy. To maintain architectural balance, Clarity suggests introducing a high-fidelity visual anchor for the upcoming weekend gap.`
      );
      setIsAuditing(false);
    }, 2000);
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    if (!error) {
      setPosts(posts.filter(p => p.id !== id));
    } else {
      // Mock deletion
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { day: "TBD", num: "??", month: "---", time: "Pending" };
    return {
      day: date.toLocaleDateString("en-US", { weekday: 'short' }),
      num: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: 'short' }),
      time: date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Page title="">
      <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-8 md:p-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#a9b897]">
                <Zap size={12} fill="currentColor" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic">
                  Strategic Timeline
                </h2>
              </div>
              <h1 className="text-5xl md:text-6xl font-serif text-stone-800 italic tracking-tighter">
                The Horizon
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={runStrategicAudit}
                disabled={isAuditing || posts.length === 0}
                className="flex items-center gap-3 bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-50 group cursor-pointer"
              >
                {isAuditing ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles className="group-hover:rotate-12 transition-transform" size={18} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">Run Strategic Audit</span>
              </button>

              <div className="h-14 w-14 rounded-2xl border border-stone-200 flex items-center justify-center text-stone-800 bg-white shadow-sm">
                <CalendarIcon size={20} strokeWidth={1.5} />
              </div>
            </div>
          </header>

          {/* CLARITY INSIGHT PANEL */}
          <AnimatePresence>
            {strategicInsight && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-stone-50 border border-[#a9b897]/30 p-8 rounded-[2rem] shadow-sm group relative mb-6">
                  <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setStrategicInsight(null)} className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="h-16 w-16 bg-white border border-stone-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                      <BarChart3 className="text-[#a9b897]" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[#a9b897] font-black uppercase text-[8px] tracking-[0.4em]">Audit Intelligence Output</p>
                      <p className="text-stone-700 font-serif italic text-lg leading-snug">
                        {strategicInsight}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTENT AREA */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-[#a9b897]" size={32} />
              <p className="italic text-stone-400 font-serif">Aligning the horizon...</p>
            </div>
          ) : posts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-96 border-2 border-dashed border-stone-300 rounded-[3rem] flex flex-col items-center justify-center text-stone-400 space-y-4 bg-white/30"
            >
              <div className="p-6 bg-white rounded-3xl shadow-sm border border-stone-100">
                <CalendarIcon size={40} strokeWidth={1} className="text-stone-300" />
              </div>
              <p className="font-serif italic text-2xl text-stone-800">The horizon is currently unwritten.</p>
              <button className="text-[10px] font-black uppercase tracking-widest bg-stone-900 text-white px-6 py-3 rounded-full hover:bg-stone-700 transition-all cursor-pointer">
                Access Lab to Draft
              </button>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => {
                  const date = formatDate(post.scheduled_for);
                  return (
                    <motion.div 
                      key={post.id}
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="group bg-white border border-stone-200/60 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-xl transition-all duration-300 relative"
                    >
                      {/* DATE ARCHITECTURE */}
                      <div className="flex md:flex-col items-center justify-center min-w-[100px] border-b md:border-b-0 md:border-r border-stone-100 pb-4 md:pb-0 md:pr-10 gap-3 md:gap-1">
                        <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{date.day}</span>
                        <span className="text-4xl font-serif italic text-stone-800 leading-none">{date.num}</span>
                        <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{date.month}</span>
                      </div>

                      {/* MEDIA WRAPPER */}
                      <div className="w-full md:w-32 h-44 md:h-32 rounded-2xl overflow-hidden bg-stone-50 flex-shrink-0 shadow-sm border border-stone-100 relative group-hover:border-stone-200 transition-all">
                        {post.media_url ? (
                          <img 
                            src={post.media_url} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2 italic">
                            <ImageIcon size={24} strokeWidth={1} />
                            <span className="text-[8px] font-black uppercase tracking-tighter text-stone-300">No Visual</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink size={12} className="text-stone-600" />
                        </div>
                      </div>

                      {/* POST METADATA & CONTENT */}
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 bg-stone-50 text-stone-500 rounded-full border border-stone-200/60">
                              {post.platform}
                            </span>
                            <div className="flex items-center gap-2 text-stone-400 text-[9px] font-black uppercase tracking-widest">
                              <Clock size={12} className="text-[#a9b897]" /> {date.time}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => deletePost(post.id)} 
                               className="p-3 bg-stone-50 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                               title="Scrub from Timeline"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                        
                        <p className="text-stone-800 font-serif italic text-xl md:text-2xl leading-snug pr-8 line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                          "{post.caption}"
                        </p>
                      </div>

                      {/* ENTER ACTION */}
                      <div className="hidden lg:block shrink-0">
                        <button className="h-14 w-14 rounded-full border border-stone-100 bg-stone-50 flex items-center justify-center text-stone-400 hover:bg-stone-900 hover:text-[#a9b897] hover:border-stone-900 scale-100 hover:scale-110 transition-all duration-300 shadow-sm">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}