"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse"; 
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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Logic to prevent RTF files from being processed as CSV
      if (selectedFile.name.endsWith('.rtf')) {
        setStatus('error');
        setErrorMessage("Format Error: Please save your file as a Plain Text CSV, not RTF.");
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage("");
    }
  };

  const startMigration = async () => {
    if (!file) return;
    setStatus('processing');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setStatus('error');
        setErrorMessage("Clearance required: User session not found.");
        return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data;
        
        const formattedData = rawData.map((row: any) => {
          // Robust mapping to handle exact matches in test.csv like "Company"
          const findValue = (possibleKeys: string[]) => {
            const actualKey = Object.keys(row).find(k => 
              possibleKeys.includes(k.trim()) || 
              possibleKeys.includes(k.trim().toLowerCase())
            );
            return actualKey ? row[actualKey] : null;
          };

          return {
            name: findValue(['Name', 'name', 'full name', 'client']) || "Unknown Entity",
            email: findValue(['Email', 'email', 'email address']),
            company: findValue(['Company', 'company', 'business', 'organization']) || "Independent Record",
            user_id: user.id,
            stage: "Lead",
          };
        });

        // Filter out effectively empty rows
        const validData = formattedData.filter(d => d.name !== "Unknown Entity" || d.email);

        if (validData.length === 0) {
          setStatus('error');
          setErrorMessage("No valid nodes found. Ensure your CSV headers are correct.");
          return;
        }

        const { error } = await supabase.from("customers").insert(validData);

        if (error) {
          setStatus('error');
          setErrorMessage(error.message);
        } else {
          setRowCount(validData.length);
          setStatus('success');
        }
      },
      error: () => {
        setStatus('error');
        setErrorMessage("Parsing failure: The file structure is unreadable.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] p-8 md:p-16 max-w-5xl mx-auto space-y-12">
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
              <Button onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); startMigration(); }}>
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
              TOTS OS will map variations like "Full Name" automatically.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="card-fancy p-10 space-y-6 border border-[var(--border)] rounded-[2.5rem]">
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