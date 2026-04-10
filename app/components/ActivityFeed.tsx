"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ActivityFeed() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    setLogs(data || []);
  }

  return (
    <div className="border border-white/10 rounded-xl p-5 bg-white/5">
      <h2 className="font-semibold mb-3">Activity</h2>

      <div className="space-y-2 text-sm">
        {logs.map((log) => (
          <div key={log.id} className="text-gray-400">
            {log.action}
            <div className="text-xs text-gray-500">
              {new Date(log.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <p className="text-gray-500">No activity yet</p>
        )}
      </div>
    </div>
  );
}