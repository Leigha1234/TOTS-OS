"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { getUserTeam } from "@/lib/getUserTeam";
import { 
  ArrowRight, Briefcase, X, Loader2, Zap, 
  FileText, Share2, Mail, User as UserIcon, 
  Clock, PoundSterling, ShieldCheck, Activity 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("OPERATOR");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0, invoicesDue: 2, socialsPending: 5, emailsScheduled: 3, currentProfit: 18450.00,
  });
  const [showScanModal, setShowScanModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function init() {
      const team = await getUserTeam();
      if (team) {
        // Mocking stats for the 'ready to sell' look while keeping DB links ready
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-6 md:p-12 lg:ml-64 transition-all">
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-[#a9b897]">
              <UserIcon size={12} fill="currentColor" />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">Node: {userName}</p>
              <p className="text-stone-300">|</p>
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic tracking-tighter leading-none">Business Pulse</h1>
          </div>
          <button onClick={() => setShowScanModal(true)} className="bg-stone-900 px-8 py-5 rounded-full flex items-center gap-4 shadow-xl hover:bg-[#a9b897] transition-all group">
            <Zap className="text-[#a9b897] group-hover:text-white" size={16} fill="currentColor" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Intelligence Scan</span>
          </button>
        </header>

        {/* METRICS - Fluid height to prevent overflow */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, path: "/projects" },
            { label: "Invoices Waiting", value: stats.invoicesDue, icon: FileText, path: "/payments" },
            { label: "Social Reach", value: stats.socialsPending, icon: Share2, path: "/social" },
            { label: "Scheduled Emails", value: stats.emailsScheduled, icon: Mail, path: "/campaigns" },
            { label: "Live Profit", value: `£${stats.currentProfit.toLocaleString()}`, icon: PoundSterling, path: "/payments" },
          ].map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ y: -5 }}
              onClick={() => router.push(item.path)}
              className="bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[220px]"
            >
              <div className="space-y-6">
                <div className="p-3 bg-stone-50 rounded-xl w-fit text-stone-400 group-hover:text-[#a9b897]">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">{item.label}</p>
                  <p className="text-3xl font-serif italic text-stone-900 leading-none">{item.value}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-stone-300 mt-4">
                View <ArrowRight size={10} />
              </div>
            </motion.div>
          ))}
        </section>

        {/* BOTTOM STACK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white border border-stone-100 p-10 rounded-[3.5rem] shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-8 flex items-center gap-3">
              <Activity size={14} className="text-[#a9b897]" /> Today’s Priority Sync
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Finance systems synced",
                "Campaign automations optimised",
                "New CRM access provisioned",
                "Intelligence nodes verified"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-6 rounded-2xl bg-[#faf9f6] border border-stone-50 group hover:border-[#a9b897] transition-all">
                  <div className="w-5 h-5 rounded border border-stone-200 bg-white group-hover:border-[#a9b897] transition-all" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-700">{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-stone-900 p-10 rounded-[3.5rem] text-white flex flex-col justify-between min-h-[350px] relative overflow-hidden">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-8">Team Hub</h2>
            <div className="space-y-3 relative z-10">
              {["Leigha (Lead Architect)", "Strategy Node (Active)"].map((m, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#a9b897] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-200">{m}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-start gap-4 relative z-10 opacity-50">
              <ShieldCheck size={18} className="text-[#a9b897]" />
              <p className="text-[9px] font-serif italic leading-relaxed uppercase tracking-tighter">System synchronized.</p>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#a9b897] blur-[80px] opacity-10" />
          </section>
        </div>
      </div>
    </div>
  );
}