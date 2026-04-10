import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const teamId = await getUserTeam();

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    setNotifications(data || []);

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  return notifications;
}