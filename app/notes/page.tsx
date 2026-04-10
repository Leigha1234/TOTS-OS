"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { 
  Trash2, Zap, Plus, Circle, BookOpen, X, ChevronLeft, ChevronRight, Target, Play, Search, StickyNote
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
      description: "Your firm’s new nervous system. A unified environment where notes become formal financial records instantly.",
      icon: <Zap className="text-yellow-400" />,
    },
    {
      title: "The Clarity Ledger",
      description: "This is your capture zone. Type naturally here. If you type 'Invoice Acme £500', the system detects the intent automatically.",
      icon: <BookOpen className="text-blue-400" />,
    },
    {
      title: "Treasury Execution",
      description: "The system monitors your notes. Entries with currency symbols (£) are auto-synced to your formal Treasury ledger.",
      icon: <Target className="text-[#a9b897]" />,
    },
    {
      title: "Action Queue",
      description: "Tasks with keywords like 'Remind' or 'Todo' end up here. Check them off to maintain momentum.",
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
      <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all">Training Guide</span>
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
          <div className="flex justify-between">
            <div className="p-4 bg-stone-50 rounded-3xl">{STEPS[currentStep].icon}</div>
            <button onClick={finishTour}><X size={24} className="text-stone-300 hover:text-stone-900" /></button>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif italic text-stone-800 leading-tight">{STEPS[currentStep].title}</h2>
            <p className="text-stone-500 text-lg font-serif italic">{STEPS[currentStep].description}</p>
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-stone-50">
            <button onClick={finishTour} className="text-[10px] font-black uppercase text-stone-300">Skip Guide</button>
            <div className="flex gap-4">
              {currentStep > 0 && <button onClick={() => setCurrentStep(s => s - 1)} className="p-4 rounded-2xl border border-stone-100"><ChevronLeft size={20} /></button>}
              <button onClick={() => currentStep === STEPS.length - 1 ? finishTour() : setCurrentStep(s => s + 1)} className="bg-stone-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {currentStep === STEPS.length - 1 ? "Start" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- MAIN PAGE ---
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

  // Handle Realtime Sync and Invites
  useEffect(() => {
    let channel: any;

    const checkInvite = async (userId: string) => {
      const token = params.get("token");
      if (!token) return;

      const { data: invite } = await supabase.from("invites").select("*").eq("token", token).single();
      if (!invite) return;

      await supabase.from("team_members").insert({
        user_id: userId,
        team_id: invite.team_id,
        role: "member",
      });
      toast.success("Joined team successfully");
    };

    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setUser(authUser);
      fetchPulse(authUser.id);
      checkInvite(authUser.id);

      // Initialize Realtime Channel with fixed event chaining
      channel = supabase.channel('ledger-sync')
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'notes' }, 
          () => fetchPulse(authUser.id)
        )
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks' }, 
          () => fetchPulse(authUser.id)
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchPulse, params]);

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
    
    await supabase.from("notes").insert({
      content: newNote, user_id: user.id, customer_id: selectedCustomer || null,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    if (intent === "task") {
      await supabase.from("tasks").insert({ title: newNote, user_id: user.id, customer_id: selectedCustomer || null });
    } else if (intent === "invoice" || intent === "expense") {
      const table = intent === "invoice" ? "invoices" : "expenses";
      const amount = (newNote.match(/£?(\d+(\.\d{2})?)/) || [])[1] || 0;
      await supabase.from(table).insert({
        team_id: teamId, amount: parseFloat(amount.toString()), 
        entity_name: selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : "Clarity Capture",
        date: new Date().toISOString().split("T")[0], status: "committed"
      });
    }

    setNewNote("");
    setSelectedCustomer("");
    toast.success("Node Synchronized");
  }

  const filteredNotes = notes.filter((note) =>
    note.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12">
      <SystemNavigator />
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <header className="space-y-2">
            <h1 className="text-6xl font-serif italic text-stone-800 tracking-tighter leading-none">Clarity Ledger</h1>
            <p className="text-stone-400 font-medium tracking-tight">Rapid intent capture. Automatic Treasury bridge.</p>
          </header>

          <div id="ledger-input" className="bg-white p-8 rounded-[3rem] shadow-sm border border-stone-100 space-y-6 focus-within:border-[#a9b897] transition-all">
            <textarea className="w-full min-h-[140px] text-xl outline-none resize-none bg-transparent font-serif italic text-stone-700" placeholder="Type intent (e.g. Spent £40 on travel)..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <div className="flex justify-between items-center pt-6 border-t border-stone-50">
              <select className="bg-stone-50 text-[10px] font-black uppercase px-4 py-3 rounded-2xl outline-none" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                <option value="">Global Node</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={addNote} className="bg-[#a9b897] text-white px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">Commit Entry</button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                    type="text"
                    placeholder="Search ledger items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-stone-100 rounded-2xl outline-none shadow-sm focus:ring-2 ring-[#a9b897]/20 transition-all"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={note.id} className="p-8 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between min-h-[220px] group relative" style={{ background: note.color }}>
                     <p className="text-stone-800 leading-relaxed font-serif italic text-lg z-10">{note.content}</p>
                     <div className="flex justify-between items-end z-10">
                        <div className="flex items-center gap-2 opacity-30"><Zap size={12} /><span className="text-[9px] font-black uppercase">{detectIntent(note.content)}</span></div>
                        <button onClick={() => supabase.from("notes").delete().eq("id", note.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <h2 className="text-2xl font-serif italic text-stone-800 px-4">Action Queue</h2>
          <div id="task-list" className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 flex items-start gap-4 group shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => supabase.from("tasks").update({ status: 'done' }).eq("id", task.id)} className="mt-1 text-stone-200 hover:text-[#a9b897] transition-colors"><Circle size={24} /></button>
                <div>
                  <p className="text-sm font-bold text-stone-800 leading-tight">{task.title}</p>
                  <p className="text-[9px] font-black text-stone-400 uppercase mt-1 tracking-widest">{task.customers?.name || 'Internal'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function NotesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif italic text-stone-400">Loading Clarity Ledger...</div>}>
      <NotesContent />
    </Suspense>
  );
}