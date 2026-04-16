"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Layers, 
  LifeBuoy, 
  ArrowUpRight, 
  Fingerprint,
  User
} from "lucide-react";
import AuthGuard from "../../components/AuthGuard";

export default function PortalPage() {
  return (
    <AuthGuard>
      <PortalDashboard />
    </AuthGuard>
  );
}

function PortalDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/portal/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
    }
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Fingerprint className="text-stone-300 animate-pulse" size={48} />
          <p className="font-serif italic text-stone-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-16 lg:p-24">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#a9b897]">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Client Environment 01</span>
            </div>
            <h1 className="text-7xl font-serif italic text-stone-900 tracking-tighter leading-none">
              Welcome Back
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-white">
              <User size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Authorized Session</p>
              <p className="text-sm font-mono text-stone-900">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* ACCESS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* STATUS CARD */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm hover:shadow-xl hover:border-[#a9b897] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-12">
              <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[#a9b897]/10 transition-colors">
                <ShieldCheck className="text-stone-400 group-hover:text-[#a9b897]" size={24} />
              </div>
              <ArrowUpRight className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Account Status</p>
            <p className="text-3xl font-serif italic text-stone-900 group-hover:text-[#a9b897] transition-colors">
              Fully Verified
            </p>
          </motion.div>

          {/* PROJECTS CARD */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group bg-stone-900 border border-stone-800 p-10 rounded-[3rem] shadow-2xl cursor-pointer"
          >
            <div className="flex justify-between items-start mb-12">
              <div className="p-4 bg-stone-800 rounded-2xl">
                <Layers className="text-[#a9b897]" size={24} />
              </div>
              <ArrowUpRight className="text-stone-500" size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Project Portfolio</p>
            <p className="text-3xl font-serif italic text-white">
              View All Works
            </p>
          </motion.div>

          {/* SUPPORT CARD */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="group bg-white border border-stone-200 p-10 rounded-[3rem] shadow-sm hover:shadow-xl hover:border-[#a9b897] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-12">
              <div className="p-4 bg-stone-50 rounded-2xl group-hover:bg-[#a9b897]/10 transition-colors">
                <LifeBuoy className="text-stone-400 group-hover:text-[#a9b897]" size={24} />
              </div>
              <ArrowUpRight className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Concierge</p>
            <p className="text-3xl font-serif italic text-stone-900 group-hover:text-[#a9b897] transition-colors">
              Open Ticket
            </p>
          </motion.div>

        </div>

        {/* FOOTER METADATA */}
        <footer className="pt-12 flex justify-between items-center text-stone-400 border-t border-stone-100">
          <p className="text-[9px] font-black uppercase tracking-widest">TOTs OS v3.1.0</p>
          <div className="flex gap-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a9b897]" />
            <p className="text-[9px] font-black uppercase tracking-widest italic">System Nominal</p>
          </div>
        </footer>

      </div>
    </div>
  );
}