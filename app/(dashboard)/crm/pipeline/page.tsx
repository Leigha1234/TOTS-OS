"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Page from "@/app/components/Page";
import Card from "@/app/components/Card";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = ["lead", "contacted", "won", "lost"];

export default function PipelinePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [dragged, setDragged] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("customers").select("*");
    setCustomers(data || []);
    setLoading(false);
  }

  async function move(id: string, stage: string) {
    // Optimistic Update: Change UI immediately
    const previousCustomers = [...customers];
    setCustomers(customers.map(c => c.id === id ? { ...c, stage } : c));

    const { error } = await supabase.from("customers").update({ stage }).eq("id", id);
    
    if (error) {
      console.error("Move Error:", error);
      setCustomers(previousCustomers); // Rollback on failure
    }
  }

  return (
    <Page title="Pipeline">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {STAGES.map((stage) => (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragged && move(dragged.id, stage)}
            className="flex flex-col gap-4 min-h-[500px] p-2 rounded-[2rem] bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]"
          >
            {/* Column Header */}
            <header className="px-4 py-2 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                {stage}
              </h2>
              <span className="text-[10px] font-mono text-stone-500">
                {customers.filter((c) => c.stage === stage).length}
              </span>
            </header>

            {/* Customer Cards */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {customers
                  .filter((c) => c.stage === stage)
                  .map((c) => (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={() => setDragged(c)}
                      onDragEnd={() => setDragged(null)}
                      className={`cursor-grab active:cursor-grabbing transition-opacity ${
                        dragged?.id === c.id ? "opacity-30" : "opacity-100"
                      }`}
                    >
                      <Card className="hover:border-[#a9b897]/30 transition-all">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white uppercase tracking-wider">
                            {c.name}
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            ID: {c.id.slice(0, 8)}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}