"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Page from "@/app/components/Page";
import Card from "@/app/components/Card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, MoreHorizontal } from "lucide-react";

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
    const previousCustomers = [...customers];
    setCustomers(customers.map(c => c.id === id ? { ...c, stage } : c));

    const { error } = await supabase.from("customers").update({ stage }).eq("id", id);
    
    if (error) {
      console.error("Move Error:", error);
      setCustomers(previousCustomers);
    }
  }

  // Helper for mobile quick-move
  const cycleStage = (id: string, currentStage: string, direction: number) => {
    const currentIndex = STAGES.indexOf(currentStage);
    const nextIndex = (currentIndex + direction + STAGES.length) % STAGES.length;
    move(id, STAGES[nextIndex]);
  };

  return (
    <Page title="Pipeline">
      {loading ? (
        <div className="flex justify-center items-center h-64 text-[#a9b897] font-black text-[10px] uppercase tracking-widest">
          Syncing Neural Pipeline...
        </div>
      ) : (
        /* MOBILE: Horizontal overflow with snap points 
           DESKTOP: Standard 4-column grid
        */
        <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 items-start overflow-x-auto snap-x snap-mandatory pb-8 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
          {STAGES.map((stage) => (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragged && move(dragged.id, stage)}
              className="flex flex-col gap-4 min-h-[500px] w-[85vw] md:w-auto shrink-0 snap-center p-5 md:p-4 rounded-[2rem] bg-stone-50 border border-stone-200 transition-colors hover:bg-stone-100/50"
            >
              {/* Column Header */}
              <header className="py-2 flex items-center justify-between border-b border-stone-200/50">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a9b897]">
                  {stage}
                </h2>
                <span className="text-[10px] font-mono bg-white border border-stone-100 px-2 py-0.5 rounded-full text-stone-400">
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={() => setDragged(c)}
                        onDragEnd={() => setDragged(null)}
                        className={`cursor-grab active:cursor-grabbing transition-opacity ${
                          dragged?.id === c.id ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <Card className="hover:border-[#a9b897]/30 transition-all bg-white border-stone-200 shadow-sm p-4 relative group">
                          <div className="flex flex-col gap-1 pr-16">
                            <span className="text-sm font-bold text-stone-800 uppercase tracking-tight">
                              {c.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono">
                              NODE_{c.id.slice(0, 8)}
                            </span>
                          </div>

                          {/* MOBILE QUICK ACTION CONTROLS */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex md:hidden gap-1">
                            <button 
                              onClick={() => cycleStage(c.id, stage, -1)}
                              className="p-2 bg-stone-50 rounded-lg text-stone-400 active:bg-[#a9b897] active:text-white transition-colors"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button 
                              onClick={() => cycleStage(c.id, stage, 1)}
                              className="p-2 bg-stone-50 rounded-lg text-stone-400 active:bg-[#a9b897] active:text-white transition-colors"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>

                          {/* DESKTOP HOVER HINT */}
                          <div className="hidden md:block absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal size={14} className="text-stone-300" />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
                
                {customers.filter((c) => c.stage === stage).length === 0 && (
                  <div className="h-32 border border-dashed border-stone-200 rounded-[1.5rem] flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-stone-300 font-bold italic">
                    Void Stage
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MOBILE INSTRUCTION */}
      <div className="mt-6 block md:hidden text-center">
        <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold italic">
          Swipe horizontal to view segments • Use arrows to transition nodes
        </p>
      </div>
    </Page>
  );
}