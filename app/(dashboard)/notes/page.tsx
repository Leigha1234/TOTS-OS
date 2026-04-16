"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { 
  Trash2, Zap, Circle, BookOpen, X, ChevronLeft, ChevronRight, Target, Play, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const COLORS = ["#fef3c7", "#e0f2fe", "#ecfccb", "#fce7f3", "#ede9fe"];

// --- TOUR COMPONENT ---
function SystemNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    {
      title: "Welcome to TOTs OS",
      description: "A unified environment where notes become formal financial records instantly.",
      icon: <Zap className="text-yellow-400" />,
    },
    {
      title: "The Clarity Ledger",
      description: "Type naturally. If you type 'Invoice Acme £500', the system detects the intent automatically.",
      icon: <BookOpen className="text-blue-400" />,
    },
    {
      title: "Treasury Execution",
      description: "Entries with currency symbols (£) are auto-synced to your formal Treasury ledger.",
      icon: <Target className="text-[#a9b897]" />,
    },
    {
      title: "Action Queue",
      description: "Tasks with keywords like 'Remind' or 'Todo' end up here automatically.",
      icon: <Play className="text-stone-400" />,
    }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("tots_tour_complete");
    if (!hasSeenTour) setTimeout(() => setIsOpen(true), 1500);
  }, []);

  const finishTour = () => {
    localStorage.setItem("tots_tour_complete", "true");
    setIsOpen(false);
  };

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 z-50 bg-stone-900 text-[#a9b897] p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all flex items-center gap-3 group">
      <BookOpen size={20} />
      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Training Guide</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-stone-100">
        <div className="h-1.5 w-full bg-stone-50 flex">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-[#a9b897]' : 'bg-transparent'}`} style={{ width: `${100 / STEPS.length}%` }} />
          ))}
        </div>
        <div className="p-12 space-y-8">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-stone-50 rounded-3xl">{STEPS[currentStep].icon}</div>
            <button onClick={finishTour}><X size={24} className="text-stone-300 hover:text-stone-900" /></button>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif italic text-stone-800 leading-tight">{STEPS[currentStep].title}</h2>
            <p className="text-stone-500 text-lg font-serif italic leading-relaxed">{STEPS[currentStep].description}</p>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-stone-50">
            <button onClick={finishTour} className="text-[10px] font-black uppercase text-stone-300 hover:text-stone-500">Skip Guide</button>
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button onClick={() => setCurrentStep(s => s - 1)} className="p-4 rounded-2xl border border-stone-100 hover:bg-stone-50">
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={() => currentStep === STEPS.length - 1 ? finishTour() : setCurrentStep(s => s + 1)} 
                className="bg-stone-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                {currentStep === STEPS.length - 1 ? "Initialize" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE CONTENT ---
function NotesContent() {
  const params = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const channelRef = useRef<any>(null);

  const fetchPulse = useCallback(async (userId: string) => {
    const [{ data: cust }, { data: nts }, { data: tsk }, { data: mem }] = await Promise.all([
      supabase.from("customers").select("*").eq("user_id", userId),
      supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("tasks").select("*, customers(name)").eq("user_id", userId).eq("status", "todo").order("priority", { ascending: false }),
      supabase.from("team_members").select("team_id").eq("user_id", userId).maybeSingle()
    ]);
    if (mem?.team_id) setTeamId(mem.team_id);
    setCustomers(cust || []);
    setNotes(nts || []);
    setTasks(tsk || []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      await fetchPulse(authUser.id);

      if (channelRef.current) supabase.removeChannel(channelRef.current);

      const channelId = `ledger-${Math.random().toString(36).slice(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${authUser.id}` }, () => fetchPulse(authUser.id))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${authUser.id}` }, () => fetchPulse(authUser.id))
        .subscribe();

      channelRef.current = channel;
    };

    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [fetchPulse]);

  const detectIntent = (text: string) => {
    const t = text.toLowerCase();
    if (t.match(/invoice|bill|charge/)) return "invoice";
    if (t.match(/expense|spent|bought/)) return "expense";
    if (t.match(/task|todo|remind/)) return "task";
    return "note";
  };

  async function addNote() {
    if (!newNote.trim() || !user || !teamId) return;
    const intent = detectIntent(newNote);
    const amountMatch = newNote.match(/£?(\d+(\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // 1. Create the Note entry (The visual "Sticky Note")
    await supabase.from("notes").insert({
      content: newNote, 
      user_id: user.id, 
      customer_id: selectedCustomer || null,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    // 2. Logic-based routing
    if (intent === "task") {
      await supabase.from("tasks").insert({ title: newNote, user_id: user.id, customer_id: selectedCustomer || null });
    } else if (intent === "invoice" || intent === "expense") {
      const table = intent === "invoice" ? "invoices" : "expenses";
      await supabase.from(table).insert({
        team_id: teamId, 
        amount: amount, 
        entity_name: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : "Clarity Capture",
        date: new Date().toISOString().split("T")[0], 
        status: "committed"
      });
    }

    setNewNote("");
    setSelectedCustomer("");
    toast.success("Intent Captured & Routed");
  }

  const filteredNotes = notes.filter((note) =>
    note.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12">
      <SystemNavigator />
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: INPUT & LEDGER */}
        <div className="lg:col-span-8 space-y-12">
          <header className="space-y-2">
            <h1 className="text-6xl font-serif italic text-stone-800 tracking-tighter">Clarity Ledger</h1>
            <p className="text-stone-400 font-medium tracking-tight uppercase text-[10px] tracking-[0.2em]">Automated Intent Bridge</p>
          </header>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 space-y-6 focus-within:border-[#a9b897] transition-all">
            <textarea 
              className="w-full min-h-[140px] text-xl outline-none resize-none bg-transparent font-serif italic text-stone-700 placeholder:text-stone-200" 
              placeholder="Record intent (e.g. Invoice Acme £400)..." 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)} 
            />
            <div className="flex justify-between items-center pt-6 border-t border-stone-50">
              <select 
                className="bg-stone-50 text-[10px] font-black uppercase px-6 py-3 rounded-2xl outline-none border border-transparent focus:border-stone-200 transition-all" 
                value={selectedCustomer} 
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">Global Context</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={addNote} className="bg-[#a9b897] text-white px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:shadow-[#a9b897]/20 hover:-translate-y-1 transition-all">
                Commit Entry
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#a9b897] transition-colors" size={20} />
                <input 
                    type="text"
                    placeholder="Filter ledger history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-white border border-stone-100 rounded-[2rem] outline-none shadow-sm focus:ring-4 ring-[#a9b897]/5 transition-all font-serif italic text-lg"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={note.id} 
                    className="p-10 rounded-[3rem] border border-stone-100 flex flex-col justify-between min-h-[260px] relative shadow-sm hover:shadow-md transition-shadow" 
                    style={{ background: note.color }}
                  >
                      <p className="text-stone-800 leading-relaxed font-serif italic text-xl">{note.content}</p>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full border border-black/5">
                          <Zap size={12} className="text-stone-600" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">{detectIntent(note.content)}</span>
                        </div>
                        <button 
                          onClick={() => supabase.from("notes").delete().eq("id", note.id)} 
                          className="p-3 text-stone-400 hover:text-red-500 hover:bg-white/50 rounded-2xl transition-all"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION QUEUE */}
        <div className="lg:col-span-4 space-y-10">
          <div className="px-4">
            <h2 className="text-3xl font-serif italic text-stone-800">Action Queue</h2>
            <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest font-bold">Priority Execution</p>
          </div>
          
          <div className="space-y-4">
            {tasks.map((task) => (
              <motion.div 
                initial={{ x: 20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }}
                key={task.id} 
                className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex items-start gap-5 group shadow-sm hover:border-[#a9b897]/30 transition-all"
              >
                <button 
                  onClick={() => supabase.from("tasks").update({ status: 'done' }).eq("id", task.id)} 
                  className="mt-1 text-stone-100 hover:text-[#a9b897] transition-all"
                >
                  <Circle size={28} strokeWidth={1.5} />
                </button>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-800 leading-tight group-hover:text-stone-900 transition-colors">{task.title}</p>
                  <span className="inline-block text-[9px] font-black text-[#a9b897] uppercase tracking-[0.2em]">{task.customers?.name || 'Firm Internal'}</span>
                </div>
              </motion.div>
            ))}
            {tasks.length === 0 && (
               <div className="py-20 text-center space-y-4">
                 <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mx-auto">
                    <Target size={20} className="text-stone-200" />
                 </div>
                 <p className="text-stone-300 font-serif italic text-sm">Queue clear. Ready for capture.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6] gap-4">
        <div className="w-8 h-8 border-2 border-[#a9b897] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif italic text-stone-400 text-sm">Synchronizing Clarity Ledger...</p>
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}