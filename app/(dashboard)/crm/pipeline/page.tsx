"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client"; // Import sync client
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
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*");
    if (!error) setCustomers(data || []);
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
      {loading ? (
        <div className="flex justify-center items-center h-64 text-[#a9b897]">Loading Pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {STAGES.map((stage) => (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragged && move(dragged.id, stage)}
              className="flex flex-col gap-4 min-h-[500px] p-4 rounded-[2rem] bg-stone-50 border border-stone-200 transition-colors hover:bg-stone-100/50"
            >
              {/* Column Header */}
              <header className="py-2 flex items-center justify-between border-b border-stone-200/50">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                  {stage}
                </h2>
                <span className="text-[10px] font-mono text-stone-400">
                  {customers.filter((c) => c.stage === stage).length}
                </span>
              </header>

              {/* Customer Cards */}
              <div className="space-y-3 flex-1">
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
                        <Card className="hover:border-[#a9b897]/30 transition-all bg-white border-stone-200 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-stone-800 uppercase tracking-wider">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ID: {c.id.slice(0, 8)}
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {customers.filter((c) => c.stage === stage).length === 0 && (
                  <div className="h-48 border border-dashed border-stone-200 rounded-2xl flex items-center justify-center text-[9px] uppercase tracking-widest text-stone-300">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}