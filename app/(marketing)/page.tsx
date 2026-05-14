"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

/**
 * TOTS OS: CINEMATIC REVEAL v6.0
 * DESIGN: HIGH-FIDELITY LUXURY / ATMOSPHERIC DEPTH
 */

export default function TeaserPage() {
  const [phase, setPhase] = useState<"loading" | "hero" | "access">("loading");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Phase 1: Logo Entry
    const t1 = setTimeout(() => setPhase("hero"), 500);
    // Phase 2: The Grand Transition
    const t2 = setTimeout(() => setPhase("access"), 3500);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsJoined(true);
      toast.success("Identity Verified: Welcome to TOTS OS");
    }, 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] selection:bg-[#a9b897] selection:text-white overflow-hidden font-sans relative">
      
      {/* ATMOSPHERIC BACKGROUND LAYERS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            opacity: phase === "access" ? 0.15 : 0,
            scale: phase === "access" ? 1.2 : 1 
          }}
          transition={{ duration: 3 }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#a9b897]/20 blur-[160px] rounded-full" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* --- HERO SECTION: THE LOGO REVEAL --- */}
      <div className="relative h-full w-full flex items-center justify-center z-20">
        <motion.div 
          animate={{ 
            scale: phase === "access" ? 0.5 : 1,
            y: phase === "access" ? -280 : 0,
            opacity: phase === "loading" ? 0 : 1,
            filter: phase === "access" ? "blur(4px)" : "blur(0px)"
          }}
          transition={{ duration: 2, ease: [0.65, 0, 0.35, 1] }}
          className="text-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-72 h-72 md:w-[420px] md:h-[420px] mx-auto rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="TOTS OS" 
              fill 
              priority
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "access" ? 0 : 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 space-y-4"
          >
            <h1 className="text-3xl md:text-5xl font-serif italic tracking-tighter text-stone-100">
              TOTS OS is <span className="text-[#a9b897]">Coming</span>
            </h1>
            <p className="text-[8px] font-black uppercase tracking-[0.8em] text-stone-500 animate-pulse">
              Initializing Digital Estate
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* --- ACCESS SECTION: THE SLIDE-UP UI --- */}
      <AnimatePresence>
        {phase === "access" && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center z-30 px-6 pt-[20vh]"
          >
            <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl text-center space-y-12">
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                   <ShieldCheck className="text-[#a9b897] opacity-50" size={20} />
                </div>
                <h2 className="text-3xl md:text-4xl font-serif italic tracking-tighter text-white">
                  Join the <span className="text-[#a9b897]">Waiting List</span>
                </h2>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 leading-relaxed">
                  High-fidelity management for the organised few. Secure priority placement.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!isJoined ? (
                  <motion.form 
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="relative border-b border-white/10 focus-within:border-[#a9b897] transition-all duration-700">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="IDENTIFICATION / EMAIL" 
                        className="w-full bg-transparent py-4 text-center outline-none text-[10px] font-bold tracking-[0.5em] text-white placeholder:text-stone-600 uppercase"
                        required
                      />
                    </div>
                    
                    <button 
                      disabled={isSubmitting}
                      className="w-full bg-white text-black py-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#a9b897] hover:text-black transition-all duration-500 shadow-xl flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          Request Invite <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-4"
                  >
                    <CheckCircle2 size={32} className="text-[#a9b897] stroke-[1px]" />
                    <div className="space-y-2">
                       <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white block">
                        Identity Synchronized
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-500 block">
                        Check your comms for confirmation
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MINIMAL FOOTER */}
              <div className="pt-4 flex flex-col items-center gap-6 opacity-30">
                <div className="flex gap-10">
                  <button className="text-[7px] font-black uppercase tracking-widest hover:text-[#a9b897]">Instagram</button>
                  <button className="text-[7px] font-black uppercase tracking-widest hover:text-[#a9b897]">Protocol</button>
                </div>
                <p className="text-[7px] font-black uppercase tracking-[1em] text-stone-500">
                  TOTS OS © 2026
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none z-40 shadow-[inset_0_0_150px_rgba(0,0,0,0.4)]" />
    </div>
  );
}