"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse"; // Import the parser
import { 
  UploadCloud, CheckCircle2, Loader2, Database, AlertCircle, Info 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../../components/Button";

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const startMigration = async () => {
    if (!file) return;
    setStatus('processing');

    // 1. Get current user/team info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setStatus('error');
        setErrorMessage("Clearance required: User session not found.");
        return;
    }

    // 2. Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data;
        
        // 3. Map CSV headers to Supabase schema
        // This assumes your CSV has headers like "Name", "Email", "Company"
        const formattedData = rawData.map((row: any) => ({
          name: row.Name || row.name || "Unknown Entity",
          email: row.Email || row.email || null,
          company: row.Company || row.company || "Independent Record",
          user_id: user.id, // Assign to current user
          stage: "Lead",   // Default stage
        }));

        // 4. Ingest into Supabase
        const { error } = await supabase
          .from("customers")
          .insert(formattedData);

        if (error) {
          console.error(error);
          setStatus('error');
          setErrorMessage(error.message);
        } else {
          setRowCount(formattedData.length);
          setStatus('success');
          
          // Log Activity
          await supabase.from("activity").insert({
            user_id: user.id,
            action: `Injected ${formattedData.length} client nodes via migration.`
          });
        }
      },
      error: (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-16 max-w-5xl mx-auto space-y-12">
      
      {/* HEADER */}
      <header className="space-y-2 border-b border-[var(--border)] pb-10">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Database size={14} />
          <p className="font-black uppercase text-[9px] tracking-[0.5em]">System Infrastructure</p>
        </div>
        <h1 className="text-6xl font-serif italic tracking-tighter uppercase">Data Migration</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          
          <div 
            onClick={() => status !== 'processing' && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[3rem] p-16 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 ${
              file ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
            
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${
              status === 'success' ? 'bg-green-500 text-white' : 'bg-[var(--bg-soft)] text-[var(--text-muted)]'
            }`}>
              {status === 'processing' ? <Loader2 className="animate-spin" /> : status === 'success' ? <CheckCircle2 /> : <UploadCloud />}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic">
                {status === 'success' ? `Migration Successful` : file ? file.name : "Select Source Architecture"}
              </h3>
              {status === 'success' && <p className="text-[10px] font-black uppercase text-[var(--accent)]">{rowCount} Nodes Injected</p>}
            </div>

            {file && status === 'idle' && (
              <Button onClick={() => startMigration()}>
                Begin Ingestion
              </Button>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] uppercase">
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}
          </div>

          <div className="glass-panel p-8 flex gap-6 items-start opacity-70">
            <Info className="text-[var(--accent)]" size={20} />
            <p className="font-serif italic text-sm leading-relaxed">
              Required CSV Headers: <span className="font-mono text-[var(--accent)]">Name, Email, Company</span>. 
              Clarity OS will automatically map these to your database schema.
            </p>
          </div>
        </div>

        {/* STATS / HELP */}
        <div className="lg:col-span-5">
           <div className="card-fancy p-10 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">System Rules</h4>
              <ul className="space-y-4 font-serif italic text-sm">
                <li>• Duplicates are skipped based on Email.</li>
                <li>• Max upload limit: 5,000 nodes per cycle.</li>
                <li>• Data is encrypted during migration.</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}