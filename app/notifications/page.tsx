"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, Circle, Clock, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

// --- UTILS ---
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    fetchNotifications();
    
    // Real-time subscription for instant alerts
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' }, 
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const clearAll = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setItems([]);
    toast.success("Notification Ledger Cleared");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] p-8 md:p-12 lg:p-20">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#a9b897]">
              <Bell size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">System Pulse</span>
            </div>
            <h1 className="text-6xl font-serif italic text-stone-800 tracking-tighter">Notifications</h1>
          </div>
          
          {items.length > 0 && (
            <button 
              onClick={clearAll}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors pb-2"
            >
              <Trash2 size={14} />
              Clear Archive
            </button>
          )}
        </header>

        {/* NOTIFICATION LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center font-serif italic text-stone-300">Syncing stream...</div>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative bg-white p-6 rounded-[2rem] border transition-all duration-500 ${
                    n.read ? 'border-stone-100 opacity-60' : 'border-stone-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    {/* Status Icon */}
                    <div className={`mt-1 p-3 rounded-2xl ${n.read ? 'bg-stone-50 text-stone-300' : 'bg-[#a9b897]/10 text-[#a9b897]'}`}>
                      {n.read ? <CheckCircle2 size={18} /> : <Zap size={18} className="animate-pulse" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <p className={`text-lg font-serif italic leading-tight ${n.read ? 'text-stone-500' : 'text-stone-800'}`}>
                        {n.content}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-stone-400">
                          <Clock size={10} />
                          {formatRelativeTime(n.created_at)}
                        </span>
                        {!n.read && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            className="text-[9px] font-black uppercase tracking-widest text-[#a9b897] hover:underline"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!loading && items.length === 0 && (
            <div className="py-32 text-center space-y-4 border-2 border-dashed border-stone-100 rounded-[3rem]">
              <Circle size={40} className="mx-auto text-stone-100" strokeWidth={1} />
              <p className="font-serif italic text-stone-300">The pulse is quiet. No new alerts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}