"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, X, Loader2, MapPin, Clock, Video, Landmark, 
  ExternalLink, Mail, Radio, Zap, Shield, Activity,
  Search, Filter, Settings, Bell, Info, Share2, 
  Trash2, Edit3, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, startOfWeek, endOfWeek, isSameMonth, 
  isSameDay, eachDayOfInterval, parseISO, isValid
} from "date-fns";

/**
 * TOTS OS | CHRONOS PROTOCOL 
 * Module: Temporal Infrastructure & Operational Calendar
 * Version: 2.8.4
 */

// --- Type Definitions ---

type DisplayType = 'OPERATION' | 'SIGNAL';

interface ProtocolNode {
  id: string;
  title?: string;
  subject?: string;
  created_at: string;
  scheduled_for?: string;
  description?: string;
  content?: string;
  status?: string;
  priority?: number;
  color?: string;
  colour?: string;
  location?: string;
  vc_link?: string;
  displayType: DisplayType;
  dateField: string;
}

const PRESET_COLOURS = [
  { name: 'Sage', value: '#A3B18A' },
  { name: 'Rose', value: '#E07A5F' },
  { name: 'Amber', value: '#F2CC8F' },
  { name: 'Slate', value: '#3D405B' },
  { name: 'Terracotta', value: '#81171B' },
  { name: 'Amethyst', value: '#8b5cf6' }
];

// --- Sub-Components ---

const SignalStatus = () => (
  <div className="flex items-center justify-between mb-10 p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100/50 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        <Activity size={18} className="text-[#a9b897]" />
        <span className="absolute w-5 h-5 bg-[#a9b897]/20 rounded-full animate-ping" />
      </div>
      <div>
        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-stone-400">Node Connectivity</p>
        <p className="text-[10px] font-black uppercase text-stone-900 tracking-tighter">Protocol Secure</p>
      </div>
    </div>
    <div className="flex gap-1.5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-1 h-3.5 bg-[#a9b897] rounded-full" />
      ))}
      <div className="w-1 h-3.5 bg-stone-200 rounded-full" />
    </div>
  </div>
);

// --- Main Application ---

export default function ChronosProtocolPage() {
  // --- Infrastructure State ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<ProtocolNode[]>([]);
  const [campaigns, setCampaigns] = useState<ProtocolNode[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Modal & Interaction State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "view">("create");
  const [selectedNode, setSelectedNode] = useState<ProtocolNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Transaction State (Forms) ---
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("09:00");
  const [formLocation, setFormLocation] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLOURS[0].value);
  const [formVC, setFormVC] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  // --- Data Orchestration ---

  const fetchProtocolData = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [tasksRes, campaignsRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("campaigns").select("*").eq("user_id", user.id)
      ]);

      const formattedTasks: ProtocolNode[] = (tasksRes.data || []).map(t => ({
        ...t,
        displayType: 'OPERATION',
        dateField: t.created_at
      }));

      const formattedCampaigns: ProtocolNode[] = (campaignsRes.data || []).map(c => ({
        ...c,
        displayType: 'SIGNAL',
        dateField: c.scheduled_for || c.created_at
      }));

      setTasks(formattedTasks);
      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error("Infrastructure Sync Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProtocolData();
  }, [fetchProtocolData, currentMonth]);

  // --- Logic Layers ---

  const daysInPeriod = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getNodesForDate = useCallback((date: Date) => {
    const combined = [...tasks, ...campaigns];
    return combined.filter(node => {
      const nodeDate = parseISO(node.dateField);
      return isValid(nodeDate) && isSameDay(nodeDate, date);
    }).sort((a, b) => new Date(a.dateField).getTime() - new Date(b.dateField).getTime());
  }, [tasks, campaigns]);

  const activeDayNodes = useMemo(() => getNodesForDate(selectedDay), [selectedDay, getNodesForDate]);

  const handleOpenCreate = (date: Date) => {
    setSelectedDay(date);
    setFormDate(format(date, "yyyy-MM-dd"));
    setViewMode("create");
    setSelectedNode(null);
    setIsModalOpen(true);
  };

  const handleViewNode = (e: React.MouseEvent, node: ProtocolNode) => {
    e.stopPropagation();
    setSelectedNode(node);
    setViewMode("view");
    setIsModalOpen(true);
  };

  const commitNewEntry = async () => {
    if (!formTitle) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Auth required");

      const isoTimestamp = new Date(`${formDate}T${formTime}:00`).toISOString();
      
      const { error } = await supabase.from("tasks").insert([{
        title: formTitle,
        user_id: user.id,
        created_at: isoTimestamp,
        description: formNotes,
        location: formLocation,
        vc_link: formVC,
        color: formColor,
        status: 'todo'
      }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setFormTitle(""); setFormNotes(""); setFormVC("");
      fetchProtocolData();
    } catch (err) {
      console.error("Deployment failure:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Layer ---

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 selection:bg-[#a9b897]/30">
      
      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 pb-6 flex justify-between items-start border-b border-stone-50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-1 bg-[#a9b897] rounded-full" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#a9b897]">Tots Protocol Sync</span>
                  </div>
                  <h2 className="text-4xl font-serif italic text-stone-800 tracking-tighter">
                    {viewMode === "create" ? "Establish Entry" : "Node Briefing"}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-stone-50 rounded-full hover:bg-stone-100 transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                {viewMode === "create" ? (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-stone-400 ml-2 tracking-widest">Entry Identifier</label>
                      <input 
                        value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Operation Name..."
                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 text-sm focus:outline-none focus:border-[#a9b897] transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold" />
                      <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="bg-stone-50 border border-stone-100 rounded-2xl p-5 text-xs font-bold" />
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                        <input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Node Location..." className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 pl-14 text-xs" />
                      </div>
                      <div className="relative">
                        <Video className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                        <input value={formVC} onChange={(e) => setFormVC(e.target.value)} placeholder="VC Transmission Link..." className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-5 pl-14 text-xs" />
                      </div>
                    </div>
                    <textarea 
                      value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Operational Details..."
                      className="w-full bg-stone-50 border border-stone-100 rounded-[2.5rem] p-8 text-sm h-40 resize-none focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                        {selectedNode?.displayType === 'SIGNAL' ? <Radio className="text-purple-500" /> : <Zap className="text-[#a9b897]" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-[#a9b897] tracking-[0.3em]">{selectedNode?.displayType}</span>
                        <h3 className="text-3xl font-serif italic text-stone-800 leading-tight">{selectedNode?.title || selectedNode?.subject}</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Timeline Node</p>
                        <p className="text-sm font-bold text-stone-800">{format(parseISO(selectedNode?.dateField || ""), "eeee, do MMM")}</p>
                      </div>
                      <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                        <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Dispatch Time</p>
                        <p className="text-sm font-bold text-stone-800">{format(parseISO(selectedNode?.dateField || ""), "HH:mm")}</p>
                      </div>
                    </div>

                    <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 min-h-[150px]">
                      <p className="text-[8px] font-black uppercase text-stone-400 mb-4 tracking-[0.4em]">Intelligence</p>
                      <p className="text-sm text-stone-600 italic leading-relaxed">{selectedNode?.description || selectedNode?.content || "No intelligence provided."}</p>
                    </div>

                    {selectedNode?.vc_link && (
                      <a href={selectedNode.vc_link} target="_blank" className="flex items-center justify-between p-8 bg-stone-900 text-white rounded-[2.5rem] hover:bg-[#a9b897] transition-all">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Transmission</span>
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-10 pt-4 border-t border-stone-50 shrink-0">
                {viewMode === "create" ? (
                  <button 
                    onClick={commitNewEntry} disabled={isSubmitting || !formTitle}
                    className="w-full bg-stone-900 text-white py-6 rounded-3xl text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-3 hover:bg-[#a9b897] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Establish Entry
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button className="flex-1 py-5 rounded-2xl border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all">Destroy Node</button>
                    <button className="flex-1 py-5 rounded-2xl bg-stone-50 border border-stone-100 text-[9px] font-black uppercase tracking-widest text-stone-600">Modify Protocol</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1700px] mx-auto p-6 md:p-12 grid lg:grid-cols-12 gap-10 md:gap-20">
        
        {/* --- LEFT: CALENDAR INFRASTRUCTURE --- */}
        <div className="lg:col-span-9 space-y-12">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-0.5 bg-[#a9b897]" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#a9b897]">Chronos Temporal Unit</p>
              </div>
              <h1 className="text-6xl md:text-[8rem] font-serif italic text-stone-800 tracking-tighter leading-[0.8] lowercase">
                {format(currentMonth, "MMMM")} <span className="text-stone-200">{format(currentMonth, "yyyy")}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3 p-2 bg-white rounded-3xl border border-stone-100 shadow-sm">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-2xl transition-all"><ChevronLeft size={20}/></button>
              <div className="h-6 w-px bg-stone-100" />
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-4 hover:bg-stone-50 rounded-2xl transition-all"><ChevronRight size={20}/></button>
            </div>
          </header>

          <div className="bg-white rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 border-b border-stone-50 bg-stone-50/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="py-8 text-center text-[9px] font-black uppercase tracking-[0.4em] text-stone-300">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {daysInPeriod.map((day, idx) => {
                const nodes = getNodesForDate(day);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleOpenCreate(day)}
                    className={`min-h-[160px] p-5 border-r border-b border-stone-50 transition-all cursor-pointer relative group
                      ${!isCurrentMonth ? 'opacity-20 bg-stone-50/50' : 'bg-white hover:bg-stone-50/30'}
                      ${isSelected ? 'bg-[#a9b897]/5' : ''}
                      ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[11px] font-black p-2 rounded-xl transition-all ${isToday ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-300 group-hover:text-stone-900'}`}>
                        {format(day, "d")}
                      </span>
                      {nodes.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] animate-pulse mt-2 mr-1" />}
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      {nodes.slice(0, 3).map((node, i) => (
                        <div 
                          key={node.id || i}
                          onClick={(e) => handleViewNode(e, node)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-stone-100 text-[8px] font-black uppercase truncate text-stone-600 hover:border-[#a9b897] transition-all flex items-center gap-2"
                        >
                          <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: node.colour || node.color || '#A3B18A' }} />
                          <span className="truncate">{node.title || node.subject}</span>
                        </div>
                      ))}
                      {nodes.length > 3 && (
                        <p className="text-[7px] font-black text-[#a9b897] pl-1 tracking-widest mt-1">+{nodes.length - 3} NODES</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- RIGHT: PROTOCOL AGGREGATOR --- */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-10 rounded-[4.5rem] border border-stone-100 shadow-2xl flex flex-col sticky top-12 h-[calc(100vh-100px)]">
            
            <SignalStatus />

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-px bg-[#a9b897]" />
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a9b897]">{format(selectedDay, "EEEE")}</p>
              </div>
              <h2 className="text-5xl font-serif italic text-stone-800 tracking-tighter">{format(selectedDay, "do MMM")}</h2>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 pb-10">
              {activeDayNodes.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center opacity-30">
                  <Shield size={48} strokeWidth={1} className="mb-4 text-stone-200" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Temporal Void</p>
                </div>
              ) : (
                activeDayNodes.map((node, i) => (
                  <motion.div 
                    key={node.id || i}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    onClick={(e) => handleViewNode(e, node)}
                    className="p-6 rounded-[2.5rem] bg-stone-50 border border-stone-100 cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-[#a9b897]/10 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#a9b897] flex items-center gap-1.5">
                        {node.displayType === 'SIGNAL' ? <Radio size={10} /> : <Zap size={10} />}
                        {node.displayType}
                      </span>
                      <span className="text-[9px] font-bold text-stone-300 group-hover:text-stone-900 transition-colors">
                        {format(parseISO(node.dateField), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-[11px] font-black text-stone-800 uppercase leading-tight tracking-tight">{node.title || node.subject}</p>
                  </motion.div>
                ))
              )}
            </div>

            <div className="pt-6 space-y-3">
              <button 
                onClick={() => handleOpenCreate(selectedDay)}
                className="w-full bg-stone-900 text-[#a9b897] py-6 rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Establish Entry</span>
              </button>
              
              <div className="flex gap-2">
                <button className="flex-1 p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 flex justify-center transition-all"><Settings size={18}/></button>
                <button className="flex-1 p-4 bg-stone-50 rounded-2xl text-stone-400 hover:text-stone-900 flex justify-center transition-all"><RefreshCw size={18}/></button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Global CSS Overrides */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .shadow-3xl {
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.15);
        }

        input[type="date"], input[type="time"] {
          position: relative;
        }

        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
}