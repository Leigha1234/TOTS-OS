"use client";

import "./globals.css";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import AuthGuard from "../components/AuthGuard";
import SetupTeam from "../components/SetupTeam";
import ErrorBoundary from "../components/ErrorBoundary";
import { useState, useEffect } from "react";
import { 
  Menu, X, Command, Search, Zap, BookOpen, 
  ChevronLeft, ChevronRight, Target, Play 
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- GLOBAL TRAINING GUIDE COMPONENT ---
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
      title: "Clarity Ledger",
      description: "Capture intent in real-time. Typing 'Invoice Apple £1200' triggers the bridge to your financial nodes.",
      icon: <BookOpen className="text-blue-400" />,
    },
    {
      title: "Treasury Node",
      description: "Your source of truth. Formal records, VAT logic, and committed transmissions live here.",
      icon: <Target className="text-[#a9b897]" />,
    },
    {
      title: "Command Palette",
      description: "Press ⌘K anywhere to jump between nodes or search your institutional memory.",
      icon: <Command className="text-stone-400" />,
    }
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("tots_tour_complete");
    if (!hasSeenTour) setTimeout(() => setIsOpen(true), 2000);
  }, []);

  const finishTour = () => {
    localStorage.setItem("tots_tour_complete", "true");
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsOpen(true)} 
            className="fixed bottom-8 right-8 z-[150] bg-stone-900 text-[#a9b897] p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all flex items-center gap-3 group"
          >
            <BookOpen size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block">Training Guide</span>
          </motion.button>
        )}

        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-stone-100"
            >
              <div className="h-1.5 w-full bg-stone-50 flex">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-[#a9b897]' : 'bg-transparent'}`} style={{ width: `${100 / STEPS.length}%` }} />
                ))}
              </div>
              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-stone-50 rounded-3xl">{STEPS[currentStep].icon}</div>
                  <button onClick={finishTour} className="text-stone-300 hover:text-stone-900"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a9b897]">Module {currentStep + 1}</p>
                  <h2 className="text-4xl font-serif italic text-stone-800 leading-tight">{STEPS[currentStep].title}</h2>
                  <p className="text-stone-500 text-lg leading-relaxed font-serif italic">{STEPS[currentStep].description}</p>
                </div>
                <div className="flex justify-between items-center pt-8 border-t border-stone-50">
                  <button onClick={finishTour} className="text-[10px] font-black uppercase tracking-widest text-stone-300">Skip Guide</button>
                  <div className="flex gap-4">
                    {currentStep > 0 && (
                      <button onClick={() => setCurrentStep(s => s - 1)} className="p-4 rounded-2xl border border-stone-100 text-stone-400 hover:bg-stone-50 transition-all"><ChevronLeft size={20} /></button>
                    )}
                    <button 
                      onClick={() => currentStep === STEPS.length - 1 ? finishTour() : setCurrentStep(s => s + 1)} 
                      className="bg-stone-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all"
                    >
                      {currentStep === STEPS.length - 1 ? "Initialize" : "Continue"}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- MAIN ROOT LAYOUT ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    setInsights([
      "Revenue trending up this month",
      "2 invoices overdue",
      "Top client: Acme Ltd",
      "Tasks completion rate: 78%",
    ]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") setShowCommandPalette(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('global-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, (payload) => {
          toast.message("Automated Intent Captured", {
            description: `New task: ${payload.new.title}`,
            icon: "✨",
          });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Contacts", href: "/crm" },
    { name: "Projects", href: "/projects" },
    { name: "Tasks", href: "/tasks" },
    { name: "Money", href: "/payments" },
    { name: "Notes", href: "/notes" },
    { name: "Calendar", href: "/calendar" },
  ];

  const filteredNav = navigation.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <html lang="en">
      <body className="bg-[#e9e9e1] text-stone-900 antialiased font-sans">
        <Toaster position="top-right" toastOptions={{ style: { background: '#1c1c1c', color: '#fff', border: 'none', borderRadius: '1rem' } }} />
        
        <SystemNavigator />

        {/* COMMAND PALETTE */}
        <AnimatePresence>
          {showCommandPalette && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[160] flex items-start justify-center pt-[15vh] px-4 bg-stone-900/40 backdrop-blur-sm"
              onClick={() => setShowCommandPalette(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: -10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl border border-stone-200 overflow-hidden"
              >
                <div className="flex items-center px-6 py-4 border-b border-stone-100">
                  <Search size={20} className="text-stone-400 mr-3" />
                  <input autoFocus placeholder="Jump to node..." className="w-full outline-none text-lg bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {filteredNav.map((item) => (
                    <button key={item.href} onClick={() => { router.push(item.href); setShowCommandPalette(false); setSearchQuery(""); }} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-stone-50 group transition-colors">
                      <span className="text-sm font-medium text-stone-600 group-hover:text-black">{item.name}</span>
                      <Command size={14} className="text-stone-300" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="min-h-screen flex relative">
          <div className="hidden md:block"><Sidebar /></div>
          
          <main className="flex-1 min-h-screen p-8 flex flex-col">
            <AuthGuard>
              <SetupTeam />
              <div className="bg-stone-200/50 p-6 rounded-2xl border border-stone-300/50 mb-8">
                <div className="flex items-center gap-2 mb-4 text-stone-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Clarity AI</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {insights.map((i, idx) => (
                    <p key={idx} className="text-sm font-medium text-stone-600 italic font-serif leading-relaxed">"{i}"</p>
                  ))}
                </div>
              </div>
              <div className="max-w-7xl w-full flex-grow">
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </AuthGuard>
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}