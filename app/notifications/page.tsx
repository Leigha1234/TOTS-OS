"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Page from "../components/Page";
import Card from "../components/Card";

export default function Notifications() {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: n } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false });

    setNotes(n || []);
  }

  return (
    <Page title="Notifications">
      <div className="space-y-3">
        {notes.map((n) => (
          <Card key={n.id}>
            <p>{n.content}</p>
          </Card>
        ))}
      </div>
    </Page>
  );
}