"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Play, BookOpen, Zap, Target } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to TOTs OS",
    description: "Your firm’s new nervous system. A unified environment where notes become formal financial records instantly.",
    icon: <Zap className="text-yellow-400" />,
    target: "global",
  },
  {
    title: "The Clarity Ledger",
    description: "This is your capture zone. Type naturally here. If you type 'Invoice Acme £500', the system detects the intent automatically.",
    icon: <BookOpen className="text-blue-400" />,
    target: "ledger-input", 
  },
  {
    title: "The Treasury Bridge",
    description: "Formal records live here. When you 'Commit' an intent in the ledger, it synchronizes to Treasury without a refresh.",
    icon: <Target className="text-[#a9b897]" />,
    target: "treasury-node",
  },
  {
    title: "Action Queue",
    description: "Tasks with keywords like 'Remind' or 'Chase' end up here. Check them off to keep the firm's momentum high.",
    icon: <Play className="text-stone-400" />,
    target: "task-list",
  }
];

export default function SystemNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const finishTour = useCallback(() => {
    localStorage.setItem("tots_tour_complete", "true");
    setIsOpen(false);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === STEPS.length - 1) finishTour();
    else setCurrentStep(prev => prev + 1);
  }, [currentStep, finishTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  }, [currentStep]);

  // Keyboard Shortcuts & First-time Trigger
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("tots_tour_complete");
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") finishTour();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, finishTour]);

  return (
    <>
      {/* Help Trigger */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 bg-stone-900 text-[#a9b897] p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 group border border-white/5"
        >
          <BookOpen size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all">
            Training Guide
          </span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-stone-100"
            >
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-stone-50 flex">
                {STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full transition-all duration-700 ease-out ${i <= currentStep ? 'bg-[#a9b897]' : 'bg-transparent'}`}
                    style={{ width: `${100 / STEPS.length}%` }}
                  />
                ))}
              </div>

              <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="p-5 bg-stone-50 rounded-[2rem] text-2xl">
                    {STEPS[currentStep].icon}
                  </div>
                  <button onClick={finishTour} className="p-2 text-stone-300 hover:text-stone-900 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                    Module {currentStep + 1} // {STEPS.length}
                  </p>
                  <h2 className="text-4xl font-serif italic text-stone-800 leading-tight tracking-tighter">
                    {STEPS[currentStep].title}
                  </h2>
                  <p className="text-stone-500 text-lg leading-relaxed font-serif italic">
                    {STEPS[currentStep].description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-stone-50">
                  <button 
                    onClick={finishTour}
                    className="text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-900 transition-colors"
                  >
                    Skip Guide
                  </button>
                  
                  <div className="flex gap-3">
                    {currentStep > 0 && (
                      <button 
                        onClick={handlePrev}
                        className="p-4 rounded-2xl border border-stone-100 text-stone-400 hover:bg-stone-50 transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                    )}
                    
                    <button 
                      onClick={handleNext}
                      className="bg-stone-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-black hover:shadow-xl transition-all"
                    >
                      {currentStep === STEPS.length - 1 ? "Begin Operation" : "Next Phase"}
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