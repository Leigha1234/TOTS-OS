"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Page from "../components/Page";
import Card from "../components/Card";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: membership } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (!membership) return;

    const { data: logs } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("team_id", membership.team_id)
      .order("created_at", { ascending: false });

    setLogs(logs || []);
  }

  return (
    <Page title="Activity">
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <p className="text-sm">
              <span className="text-gray-400">
                {log.user_id}
              </span>{" "}
              → {log.action}
            </p>

            <pre className="text-xs text-gray-500 mt-1">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </Card>
        ))}
      </div>
    </Page>
  );
}