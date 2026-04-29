"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Page from "@/app/components/Page";
import Card from "@/app/components/Card";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = await createClient();
    try {
      setLoading(true);
      
      // 1. Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // 2. Get the team membership for this user
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!membership) return;

      // 3. Fetch activity logs for that specific team
      const { data: activityLogs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("team_id", membership.team_id)
        .order("created_at", { ascending: false });

      setLogs(activityLogs || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page title="Activity">
      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500 animate-pulse">Loading activity...</p>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.id}>
              <p className="text-sm">
                <span className="font-mono text-blue-400">
                  {log.user_id.slice(0, 8)}... 
                </span>{" "}
                <span className="font-semibold text-gray-700">
                  → {log.action}
                </span>
              </p>

              {log.metadata && (
                <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </Card>
          ))
        ) : (
          <p className="text-gray-500">No activity found.</p>
        )}
      </div>
    </Page>
  );
}