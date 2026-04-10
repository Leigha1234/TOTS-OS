"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Page from "../../components/Page";
import Card from "../../components/Card";

const stages = ["lead", "contacted", "won", "lost"];

export default function PipelinePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [dragged, setDragged] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
  }

  async function move(id: string, stage: string) {
    await supabase.from("customers").update({ stage }).eq("id", id);
    load();
  }

  return (
    <Page title="Pipeline">
      <div className="grid md:grid-cols-4 gap-4">
        {stages.map((stage) => (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragged && move(dragged.id, stage)}
          >
            <h2>{stage}</h2>

            {customers
              .filter((c) => c.stage === stage)
              .map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragged(c)}
                >
                  <Card>
                    {c.name}
                  </Card>
                </div>
              ))}
          </div>
        ))}
      </div>
    </Page>
  );
}