"use client";
import Card from "../../components/Card";
import { Activity, Zap, Lock, Terminal, Loader2, ChevronRight, Send } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-6 md:p-10 space-y-10 bg-[var(--bg)] min-h-screen text-[var(--text-main)] transition-all duration-500">
      
      {/* RESTORED HEADER */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[var(--accent)] font-black uppercase text-[10px] tracking-[0.5em]">Operational Overview</p>
          <h1 className="text-5xl font-serif italic tracking-tighter">Command Center</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[var(--text-muted)] text-[10px] font-mono bg-[var(--card-bg)] px-5 py-2.5 rounded-full border border-[var(--border)] backdrop-blur-md">
          <Activity size={12} className="text-[var(--accent)] animate-pulse" />
          NODE_ACTIVE: {new Date().toLocaleDateString()}
        </div>
      </header>

      {/* STATS GRID: Bringing back the hover states and font styles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Daily Velocity", val: "0", unit: "HRS" },
          { label: "Active Cycles", val: "0", unit: "TASKS" }
        ].map((stat, i) => (
          <div key={i} className="card-fancy p-10 group hover:text-white transition-all">
            <p className="text-[10px] text-[var(--text-muted)] group-hover:text-white/70 uppercase tracking-[0.2em] mb-4 font-black">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-7xl font-serif italic tracking-tighter">{stat.val}</p>
              <span className="text-sm font-mono opacity-50">{stat.unit}</span>
            </div>
          </div>
        ))}

        <div className="card-fancy p-10 relative overflow-hidden group">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 font-black">Node Status</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-serif italic text-[var(--accent)] group-hover:text-white uppercase tracking-tighter">Standard Node</p>
            <Lock size={14} className="opacity-20" />
          </div>
          <Zap size={100} className="absolute -right-6 -bottom-6 opacity-5 group-hover:text-white/20 transition-all" />
        </div>
      </div>

      {/* CLARITY CONSOLE: Restoring the glass-morphic depth */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="glass-panel h-[500px] flex flex-col shadow-2xl">
            <div className="px-8 py-5 border-b border-[var(--border)] flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--accent)]" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Clarity OS v1.0.4</span>
              </div>
              <Terminal size={14} className="opacity-30" />
            </div>
            
            <div className="flex-grow p-8 font-mono text-[11px] opacity-80">
               <span className="text-[var(--accent)]">System:</span> Clarity engaged. How can I assist?
            </div>

            <div className="p-6 mt-auto">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Ask Clarity..."
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl py-5 px-6 outline-none focus:border-[var(--accent)] transition-all font-mono text-[11px]"
                />
                <button className="absolute right-4 bg-[var(--accent)] text-white p-2.5 rounded-xl">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}