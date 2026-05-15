"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Zap, ChevronLeft, ChevronRight, 
  RefreshCcw, Layers, User, Camera, 
  CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";

// Define the interface to clear TypeScript errors
interface SocialNode {
  id: string;
  title: string;
  platform: string;
  format: string;
  media_url: string;
  status: string;
  created_at: string;
}

export default function SocialStudio() {
  const [activeTab, setActiveTab] = useState<"lab" | "scheduler">("lab");
  const [status, setStatus] = useState("Ready");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [format, setFormat] = useState("Image");
  const [nodes, setNodes] = useState<SocialNode[]>([]); // Typed state
  const [currentDate, setCurrentDate] = useState(new Date());

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const syncNodes = async () => {
    setStatus("Syncing");
    const { data, error } = await supabase
      .from('socials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Sync Error:", error);
      setStatus("Error");
    } else {
      setNodes((data as SocialNode[]) || []);
      setStatus("Ready");
    }
  };

  useEffect(() => {
    syncNodes();
    const channel = supabase.channel('realtime_socials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'socials' }, syncNodes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleSynthesize = async () => {
    if (!prompt) return;
    setStatus("Synthesizing");
    
    const { error } = await supabase.from('socials').insert([{
      title: prompt,
      platform,
      format,
      status: "Draft",
      media_url: `https://picsum.photos/seed/${Math.random()}/800/1200`
    }]);

    if (error) {
      toast.error("Synthesis failed");
    } else {
      setPrompt("");
      toast.success("Social node added");
    }
    setStatus("Ready");
  };

  const deleteNode = async (id: string) => {
    const { error } = await supabase.from('socials').delete().eq('id', id);
    if (!error) {
      toast.success("Node purged");
      syncNodes();
    }
  };

  const calendar = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ d: "", current: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ d: i, current: true });
    return { days, monthName: currentDate.toLocaleString('default', { month: 'long' }), year: y };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1c1c1c] p-8 font-sans antialiased">
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-16 bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm sticky top-8 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1c1c1c] rounded-2xl flex items-center justify-center text-[#a9b897]">
              <Layers size={20} />
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">TOTs Studio</p>
              <p className="text-[8px] font-bold text-stone-300 uppercase mt-1">Social.OS</p>
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
        <div className="flex items-center gap-5">
           <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-stone-50 border-stone-100">
             <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-[#a9b897]' : 'bg-amber-400'} animate-pulse`} />
             <span className="text-[9px] font-black uppercase text-stone-400">{status}</span>
           </div>
           <button onClick={syncNodes} className="p-2.5 bg-stone-50 rounded-full"><RefreshCcw size={16}/></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "lab" ? (
            <motion.div key="lab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-12 gap-16">
              <div className="col-span-12 lg:col-span-8 space-y-12">
                <header>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#a9b897] mb-3">Neural Workflow</p>
                  <h1 className="text-7xl font-serif italic text-[#1c1c1c]">The Lab.</h1>
                </header>

                <div className="bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-2xl space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-stone-300">Platform</label>
                      <div className="flex flex-wrap gap-2">
                        {["Instagram", "LinkedIn", "Twitter"].map(p => (
                          <button key={p} onClick={() => setPlatform(p)} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${platform === p ? 'bg-[#1c1c1c] text-white' : 'bg-stone-50 text-stone-400'}`}>{p}</button>
                        ))}
                      </div>
                    </section>
                  </div>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Define the vision..."
                    className="w-full h-64 bg-stone-50 rounded-[2.5rem] p-10 text-3xl font-serif italic outline-none resize-none shadow-inner"
                  />
                  <button onClick={handleSynthesize} className="w-full bg-[#1c1c1c] text-white py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4">
                    Synthesize Node <Zap size={18} fill="#a9b897" className="text-[#a9b897]"/>
                  </button>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-10 pt-24">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-stone-300 px-2">Live Queue</h3>
                <div className="space-y-5">
                  {nodes.slice(0, 5).map(node => (
                    <motion.div layout key={node.id} className="bg-white p-5 rounded-[2rem] border border-stone-100 flex items-center gap-5 group hover:border-[#a9b897] transition-all">
                      <div className="w-16 h-16 bg-stone-50 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={node.media_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-[#a9b897] mb-1">{node.platform}</p>
                        <p className="text-lg font-serif italic truncate text-stone-600">"{node.title}"</p>
                      </div>
                      <button onClick={() => deleteNode(node.id)} className="p-3 text-stone-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16}/>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="scheduler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <header className="flex justify-between items-end border-b border-stone-100 pb-12">
                  <h1 className="text-7xl font-serif italic text-[#1c1c1c] leading-none">Grid.</h1>
                  <div className="flex gap-4">
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-5 bg-white border border-stone-100 rounded-2xl transition-all"><ChevronLeft size={24}/></button>
                     <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-5 bg-white border border-stone-100 rounded-2xl transition-all"><ChevronRight size={24}/></button>
                  </div>
               </header>
               <div className="grid grid-cols-7 gap-6 bg-white p-16 rounded-[4rem] border border-stone-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[11px] font-black text-stone-200 uppercase tracking-widest pb-6">{d}</div>)}
                  {calendar.days.map((day, i) => (
                    <div key={i} className={`aspect-square rounded-[1.8rem] border border-stone-50 flex items-center justify-center text-4xl font-serif italic relative ${day.current ? 'text-[#1c1c1c] hover:bg-stone-50' : 'text-stone-50 opacity-20'}`}>
                      {day.d}
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
      `}</style>
    </div>
  );
}