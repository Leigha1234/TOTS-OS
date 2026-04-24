import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getUserTeam } from "@/lib/getUserTeam";

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Initialize the client once inside the effect
    const supabase = createClient();

    async function init() {
      const teamId = await getUserTeam();
      if (!teamId) return;

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
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    let cleanup: any;
    init().then((result) => {
      cleanup = result;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return notifications;
}