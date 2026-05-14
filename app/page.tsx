"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 selection:bg-[#a9b897] selection:text-white">
      
      <div className="max-w-[600px] w-full text-center space-y-12">
        
        {/* LOGO ANIMATION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative group"
        >
          <motion.div 
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-72 h-72 mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-stone-100 bg-white"
          >
            <Image 
              src="/images/TOTS-OS.jpeg" 
              alt="TOTS OS" 
              fill 
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </motion.div>
        </motion.div>

        {/* TEASER TEXT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <h1 className="text-xl md:text-2xl font-light uppercase tracking-[0.3em] text-stone-800">
            TOTS OS is <span className="text-[#a9b897] font-black italic">Coming</span>
          </h1>
        </motion.div>

        {/* FORM SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#a9b897]">
              Priority Access Protocol
            </span>
          </div>

          <form className="relative max-w-md mx-auto group">
            <div className="flex bg-white border border-stone-100 p-2 rounded-full shadow-sm group-focus-within:border-[#a9b897] group-focus-within:shadow-xl transition-all duration-500">
              <input 
                type="email" 
                placeholder="ENTER EMAIL ADDRESS..." 
                className="flex-1 bg-transparent px-6 py-2 outline-none text-[10px] font-bold tracking-widest text-stone-800 placeholder:text-stone-300"
                required
              />
              <button className="bg-stone-900 text-white px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all active:scale-95">
                Join Waiting List
              </button>
            </div>
          </form>
        </motion.div>

      </div>

      {/* FOOTER */}
      <footer className="absolute bottom-10 opacity-20">
        <p className="text-[8px] font-black uppercase tracking-[0.8em] text-stone-900">
          © 2026 TOTS OS | THE ORGANISED TYPES
        </p>
      </footer>

    </div>
  );
}