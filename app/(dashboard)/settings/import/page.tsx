"use client";

import { useState, useRef } from "react";
import { supabase } from "../../../../lib/supabase";
import Papa from "papaparse"; 
import { 
  UploadCloud, CheckCircle2, Loader2, Database, AlertCircle, Info, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/app/components/Button";

export default function DataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)] border-none">
      <div className="max-w-7xl mx-auto p-6 space-y-10 pb-40">
        
        {/* HEADER SECTION - Matches Settings Header Style */}
        <div className="flex flex-col md:flex-row justify-between items-center p-10 rounded-[3rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm gap-6">
          <div>
            <div className="flex items-center gap-2 text-[#a9b897] mb-1">
              <Database size={14} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">System Infrastructure</p>
            </div>
            <h1 className="text-5xl font-serif italic text-[#a9b897]">Data Migration</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50 text-[var(--text-muted)]">Target: Supabase Cloud Ingestion</p>
          </div>
          <div className="flex gap-4">
            {file && status === 'idle' && (
              <button 
                onClick={startMigration}
                className="px-8 py-4 bg-[#a9b897] text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
              >
                Commit Ingestion <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* MAIN DROPZONE */}
          <div className="lg:col-span-8">
            <section className="p-10 rounded-[2.5rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm h-full flex flex-col justify-center items-center">
              <div 
                onClick={() => status !== 'processing' && fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-[2rem] p-20 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 cursor-pointer ${
                  file ? 'border-[#a9b897] bg-[#a9b897]/5' : 'border-[var(--border)] hover:border-[#a9b897]'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
                
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${
                  status === 'success' ? 'bg-green-500 text-white' : 'bg-[var(--bg-soft)] text-[#a9b897]'
                }`}>
                  {status === 'processing' ? <Loader2 className="animate-spin" /> : status === 'success' ? <CheckCircle2 /> : <UploadCloud />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-[var(--text-main)]">
                    {status === 'success' ? `Migration Successful` : file ? file.name : "Select Source Architecture"}
                  </h3>
                  {status === 'success' && <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{rowCount} Nodes Injected</p>}
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] uppercase bg-red-500/10 px-4 py-2 rounded-xl">
                    <AlertCircle size={14} /> {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR RULES */}
          <div className="lg:col-span-4 space-y-6">
            <section className="p-10 rounded-[2.5rem] border border-[var(--border)] bg-[var(--card-bg)] shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Verification Logic</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] mt-1.5 shrink-0" />
                  <p className="font-serif italic text-sm text-[var(--text-muted)] leading-relaxed">
                    Ensure your file is saved as <strong className="text-[var(--text-main)]">Plain Text CSV</strong>. RTF or formatted Excel files will be rejected.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] mt-1.5 shrink-0" />
                  <p className="font-serif italic text-sm text-[var(--text-muted)] leading-relaxed">
                    The OS maps <strong className="text-[var(--text-main)]">Name, Email, and Company</strong> headers automatically.
                  </p>
                </li>
              </ul>
            </section>

            <section className="p-8 rounded-[2rem] bg-[#a9b897]/10 border border-[#a9b897]/20">
               <div className="flex items-center gap-3 mb-2">
                 <Info size={16} className="text-[#a9b897]" />
                 <h4 className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">System Note</h4>
               </div>
               <p className="text-[11px] font-serif italic text-[#a9b897]/80">
                 Data ingestion is processed via secure neural tunneling. Check your CRM Directory immediately after commit.
               </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}