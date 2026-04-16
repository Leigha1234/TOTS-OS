"use client";

import React from "react";

interface PageProps {
  title: string;
  children: React.ReactNode;
  narrow?: boolean; // Prop to toggle between the two original widths
}

export default function Page({ title, children, narrow = false }: PageProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 p-8 md:p-12 space-y-10 selection:bg-[#a9b897]/30">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto border-b border-white/5 pb-8">
        <p className="text-[#a9b897] font-black uppercase text-[10px] tracking-[0.4em] mb-2">
          System / {title}
        </p>
        <h1 className="text-4xl md:text-5xl font-serif italic text-white tracking-tighter">
          {title}
        </h1>
      </header>

      {/* Content Section */}
      <main 
        className={`mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 ${
          narrow ? "max-w-3xl" : "max-w-7xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}