"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client"; 
import Papa from "papaparse"; 
import { 
  UploadCloud, CheckCircle2, Loader2, Database, AlertCircle, Info, ChevronRight, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DataImportPage() {
  const router = useRouter(); 
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

          // Mapping specifically for your PROFILES table
          return {
            full_name: findValue(['Full Name', 'Name', 'name', 'client', 'Entity']),
            email: findValue(['Email', 'email', 'email address']),
            phone: findValue(['Phone', 'phone number', 'tel']),
            // We use user_id to link this "client" profile to YOU (the logged-in user)
            // Note: If your profiles table uses 'id' for the logged in user, 
            // ensure you have a separate table for 'clients'.
            user_id: user.id, 
            tier: "STANDARD",
            onboarding_status: "Imported"
          };
        });

        // Clean out empty rows
        const validData = formattedData.filter(d => d.full_name || d.email);

        if (validData.length === 0) {
          setStatus('error');
          setErrorMessage("No valid nodes found. Check CSV headers (Full Name, Email).");
          return;
        }

        // CRITICAL CHANGE: Changed "customers" to "profiles" to match your CRM
        const { error } = await supabase.from("profiles").insert(validData);

        if (error) {
          console.error("Supabase Ingestion Error:", error);
          setStatus('error');
          // If error 42703 occurs here, we need to verify your column names in Supabase
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
    <div className="min-h-screen bg-stone-50 text-stone-900 border-none">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 pb-40">
        
        {/* BACK BUTTON */}
        <div className="flex justify-center md:justify-start">
          <button 
            onClick={() => router.push('/settings')}
            className="group flex items-center gap-3 px-6 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-900 hover:text-white transition-all shadow-sm w-full md:w-auto justify-center"
          >
            <ArrowLeft size={16} className="text-[#a9b897] group-hover:text-white transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Command</span>
          </button>
        </div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-stone-100 bg-white shadow-sm gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 text-[#a9b897] mb-1">
              <Database size={14} />
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Data Pipeline</p>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif italic text-[#a9b897]">Import Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-50 text-stone-400">Target: Profiles Production Table</p>
          </div>
          
          {file && status === 'idle' && (
            <button 
              onClick={startMigration}
              className="px-8 py-4 bg-[#a9b897] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center gap-2"
            >
              Start Ingestion <ChevronRight size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <div className="lg:col-span-8">
            <section className="p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 bg-white shadow-sm h-full flex flex-col justify-center items-center">
              <div 
                onClick={() => status !== 'processing' && fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-20 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 cursor-pointer ${
                  file ? 'border-[#a9b897] bg-[#a9b897]/5' : 'border-stone-200 hover:border-[#a9b897]'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
                
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all ${
                  status === 'success' ? 'bg-green-500 text-white' : 'bg-stone-50 text-[#a9b897]'
                }`}>
                  {status === 'processing' ? <Loader2 className="animate-spin" /> : status === 'success' ? <CheckCircle2 size={28} /> : <UploadCloud size={28} />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-serif italic text-stone-900 break-all px-2">
                    {status === 'success' ? `Migration Successful` : file ? file.name : "Drop CSV Architecture"}
                  </h3>
                  {status === 'success' && <p className="text-[10px] font-black uppercase text-[#a9b897] tracking-widest">{rowCount} Profiles Synchronized</p>}
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] uppercase bg-red-500/10 px-4 py-3 rounded-xl max-w-full italic">
                    <AlertCircle size={14} className="shrink-0" /> {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 bg-white shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Protocols</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] mt-1.5 shrink-0" />
                  <p className="font-serif italic text-sm text-stone-500 leading-relaxed">
                    Verify that your column headers include <strong className="text-stone-900">Full Name</strong> and <strong className="text-stone-900">Email</strong>.
                  </p>
                </li>
                <li className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a9b897] mt-1.5 shrink-0" />
                  <p className="font-serif italic text-sm text-stone-500 leading-relaxed">
                    System defaults status to <strong className="text-stone-900">Imported</strong> for new CRM entries.
                  </p>
                </li>
              </ul>
            </section>

            <section className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-[#a9b897]/10 border border-[#a9b897]/20">
               <div className="flex items-center gap-3 mb-2">
                 <Info size={16} className="text-[#a9b897]" />
                 <h4 className="text-[9px] font-black uppercase tracking-widest text-[#a9b897]">Sync Note</h4>
               </div>
               <p className="text-[11px] font-serif italic text-[#a9b897]/80">
                 Ingested data is immediately visible in the Contacts module after the green confirmation appears.
               </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}