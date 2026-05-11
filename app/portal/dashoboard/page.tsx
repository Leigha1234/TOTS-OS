"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Layers, 
  LifeBuoy, 
  ArrowUpRight, 
  Fingerprint,
  User,
  Zap,
  LogOut
} from "lucide-react";
import AuthGuard from "@/app/components/AuthGuard";

export default function PortalPage() {
  return (
    <AuthGuard>
      <PortalOperationalPulse />
    </AuthGuard>
  );
}

function PortalOperationalPulse() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);

  useEffect(() => {
    async function checkUser() {
      const supabase = await createClient();
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

  const handleSignOut = async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  if (loading) {
    return (
      <div key="loading-state" className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Fingerprint className="text-[#a9b897] animate-pulse" size={64} strokeWidth={1} />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-[#a9b897] rounded-full opacity-20"
          />
        </div>
        <p className="font-serif italic text-stone-400 tracking-tight">Decrypting secure environment...</p>
      </div>
    );
  }

  return (
    <div key="operational-pulse-content" className="min-h-screen bg-[#faf9f6] p-8 md:p-16 lg:p-24 selection:bg-[#a9b897] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-20">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Zap size={14} className="text-[#a9b897] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Node Active</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-serif italic text-stone-900 tracking-tighter leading-[0.8] py-2">
              Welcome
            </h1>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="flex items-center gap-5 bg-white pl-6 pr-3 py-3 rounded-full border border-stone-200 shadow-sm">
              <div className="text-right">
                <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest">Authorized As</p>
                <p className="text-[11px] font-mono font-bold text-stone-900">{user?.email}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-10 h-10 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* ACCESS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { 
              id: 'status', 
              label: 'Identity Protocol', 
              title: 'Fully Verified', 
              desc: 'Security clearance: Level 1',
              icon: ShieldCheck, 
              color: 'text-stone-400' 
            },
            { 
              id: 'projects', 
              label: 'Neural Hub', 
              title: 'Access Portal', 
              desc: 'Review ledger & work.',
              icon: Layers, 
              color: 'text-[#a9b897]', 
              isDark: true,
              link: `/portal/${user?.id}` 
            },
            { 
              id: 'support', 
              label: 'Concierge', 
              title: 'Support Node', 
              desc: 'Connect with our team.',
              icon: LifeBuoy, 
              color: 'text-stone-400' 
            }
          ].map((card) => (
            <motion.div 
              key={card.id}
              onClick={() => card.link && router.push(card.link)}
              whileHover={{ y: -8, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`group p-12 rounded-[3.5rem] transition-all cursor-pointer relative overflow-hidden ${
                card.isDark 
                  ? 'bg-stone-900 border border-stone-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]' 
                  : 'bg-white border border-stone-200 shadow-sm hover:shadow-2xl hover:border-[#a9b897]/30'
              }`}
            >
              <div className="flex justify-between items-start mb-16 relative z-10">
                <div className={`p-5 rounded-2xl transition-colors duration-500 ${card.isDark ? 'bg-stone-800' : 'bg-stone-50 group-hover:bg-stone-900 group-hover:text-white'}`}>
                  <card.icon className={card.isDark ? 'text-[#a9b897]' : `transition-colors`} size={28} strokeWidth={1.5} />
                </div>
                <ArrowUpRight className={card.isDark ? 'text-stone-600' : 'text-stone-300 group-hover:text-[#a9b897] transition-colors'} size={24} />
              </div>
              
              <div className="relative z-10 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-2">{card.label}</p>
                  <p className={`text-4xl font-serif italic leading-none ${card.isDark ? 'text-white' : 'text-stone-900'}`}>
                    {card.title}
                  </p>
                </div>
                <p className={`text-sm ${card.isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                  {card.desc}
                </p>
              </div>

              {card.isDark && (
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#a9b897] blur-[100px] opacity-20 pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>

        {/* FOOTER METADATA */}
        <footer className="pt-16 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-stone-200/60">
          <div className="flex items-center gap-6">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">TOTs Operating System</p>
            <span className="text-stone-200 text-xs">/</span>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400">v3.1.0-Neural</p>
          </div>
          
          <div className="flex items-center gap-4 bg-stone-100/50 px-4 py-2 rounded-full border border-stone-200/50">
            <span className="h-2 w-2 rounded-full bg-[#a9b897] animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-600 italic">Interface Synchronized</p>
          </div>
        </footer>

      </div>
    </div>
  );
}