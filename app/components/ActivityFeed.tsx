"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";

export default function ActivityFeed() {
  // Initialize the client once for this component instance
  const supabase = useMemo(() => createClient(), []);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data fetch
    async function load() {
      try {
        const { data } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        setLogs(data || []);
      } catch (error) {
        console.error("Failed to load activity feed:", error);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Subscribe to REALTIME changes in the activity_logs table
    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        (payload) => {
          // Optimization: Manually add the new log to the top of the list 
          // instead of refetching everything from the DB
          setLogs((prev) => [payload.new, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="border border-white/10 rounded-xl p-5 bg-white/5">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        Activity
        {/* Small live indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </h2>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse rounded" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="group border-l-2 border-transparent hover:border-blue-500 pl-3 transition-colors">
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {log.action}
                </p>
                <time className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                  {new Date(log.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} — {new Date(log.created_at).toLocaleDateString()}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}