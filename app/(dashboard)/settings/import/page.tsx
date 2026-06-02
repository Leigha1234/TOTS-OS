"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import Papa from "papaparse"; 
import { 
  UploadCloud, CheckCircle2, Loader2, Database, 
  AlertCircle, ChevronRight, ArrowLeft, Zap, 
  Clock, Shield, FileText, Layers, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * TOTS OS: DATA INGESTION HUB v5.3
 * Aesthetic: Organic Minimalist / Command Center Parity
 * Functionality: CSV-to-Supabase Pipeline
 */

export default function ImportArchitecture() {
  const router = useRouter(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- UI State --
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  // -- Data State --
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [invalidRows, setInvalidRows] = useState<any[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  // -- Business Data Schema (Import Contract) --
  const REQUIRED_SCHEMA = [
    { field: "Contacts", required: false, description: "Names, emails, phones, companies and CRM records" },
    { field: "Finance", required: false, description: "Invoices, payments, revenue, costs and finance records" },
    { field: "Projects", required: false, description: "Tasks, jobs, projects and workflow records" },
    { field: "Notes & Files", required: false, description: "Documents, notes and uploaded information" },
    { field: "HR & Team", required: false, description: "Employees, payroll, holiday, sick pay and HR records" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // -- Logic: File Selection --
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.rtf')) {
        setStatus('error');
        setErrorMessage("Format Error: RTF detected. Use Plain Text CSV.");
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage("");
    }
  };

  // -- Business-Grade Helper: Chunk Insert --
  const chunkArray = (arr: any[], size: number) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const normaliseKey = (value: string) =>
    value?.toString().trim().toLowerCase().replace(/[_-]/g, ' ');

  const FIELD_MAP: Record<string, string[]> = {
    full_name: [
      'full name', 'name', 'client name', 'customer name', 'contact name',
      'employee name', 'staff name', 'entity', 'person', 'first name', 'lastname',
      'last name', 'surname'
    ],
    first_name: ['first name', 'firstname', 'given name'],
    last_name: ['last name', 'lastname', 'surname', 'family name'],
    email: ['email', 'email address', 'mail'],
    phone: ['phone', 'phone number', 'mobile', 'telephone'],
    company: ['company', 'business', 'organisation', 'organization'],
    role: ['role', 'job role', 'position', 'title'],
    amount: ['amount', 'total', 'value', 'revenue', 'payment', 'price', 'cost'],
    invoice_number: ['invoice', 'invoice number', 'invoice id'],
    status: ['status', 'stage', 'state'],
    date: ['date', 'created', 'due date', 'invoice date'],
    notes: ['notes', 'description', 'comment', 'details']
  };

  const detectMappedValue = (row: any, aliases: string[]) => {
    const keys = Object.keys(row || {});
    const actualKey = keys.find((k) =>
      aliases.some((a) => normaliseKey(a) === normaliseKey(k))
    );

    return actualKey ? row[actualKey] : null;
  };

  const inferRecordType = (row: any) => {
    const keys = Object.keys(row).map(normaliseKey);

    if (keys.some(k => ['invoice', 'payment', 'amount', 'revenue', 'cost'].includes(k))) {
      return 'finance';
    }

    if (keys.some(k => ['employee', 'staff', 'payroll', 'holiday', 'sick pay'].includes(k))) {
      return 'hr';
    }

    if (keys.some(k => ['task', 'project', 'job'].includes(k))) {
      return 'project';
    }

    return 'contact';
  };

  // -- Logic: Ingestion Pipeline --
  const startMigration = async () => {
    if (!file) return;
    setStatus('processing');
    setPreviewData([]);
    setInvalidRows([]);
    setIsValidated(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setStatus('error');
        setErrorMessage("Clearance required: session offline.");
        return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data;

        if (!rawData || rawData.length === 0) {
          setStatus('error');
          setErrorMessage("Empty dataset: no records found in file.");
          return;
        }

        const formattedData = rawData.map((row: any) => {
          const firstName = detectMappedValue(row, FIELD_MAP.first_name);
          const lastName = detectMappedValue(row, FIELD_MAP.last_name);

          const fullName =
            detectMappedValue(row, FIELD_MAP.full_name) ||
            [firstName, lastName].filter(Boolean).join(' ') ||
            null;

          const mapped = {
            full_name: fullName,
            first_name: firstName || null,
            last_name: lastName || null,
            email: detectMappedValue(row, FIELD_MAP.email),
            phone: detectMappedValue(row, FIELD_MAP.phone),
            company: detectMappedValue(row, FIELD_MAP.company),
            role: detectMappedValue(row, FIELD_MAP.role) || 'user',
            amount: detectMappedValue(row, FIELD_MAP.amount),
            invoice_number: detectMappedValue(row, FIELD_MAP.invoice_number),
            status: detectMappedValue(row, FIELD_MAP.status),
            date: detectMappedValue(row, FIELD_MAP.date),
            notes: detectMappedValue(row, FIELD_MAP.notes),
            raw_data: row,
            record_type: inferRecordType(row),
          };

          return {
            ...mapped,
            _isValid: Object.values(mapped).some(v => v !== null && v !== '')
          };
        });

        const validData = formattedData.filter(d => d._isValid);
        const invalidData = formattedData.filter(d => !d._isValid);

        setPreviewData(validData.slice(0, 5));
        setInvalidRows(invalidData);
        setIsValidated(true);

        if (validData.length === 0) {
          setStatus('error');
          setErrorMessage("No usable data detected in file.");
          return;
        }

        const batches = chunkArray(validData, 500);

        let insertError = null;

        for (const batch of batches) {
          const { error } = await supabase
            .from("imports")
            .insert(batch);

          if (error) {
            insertError = error;
            break;
          }
        }

        if (insertError) {
          setStatus('error');
          setErrorMessage(insertError.message);
        } else {
          setRowCount(validData.length);
          setStatus('success');
          setIsValidated(false);
        }
      },
      error: () => {
        setStatus('error');
        setErrorMessage("File structure unreadable.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 p-4 md:p-8 lg:p-12 space-y-8 md:space-y-12 max-w-[1600px] mx-auto font-sans">
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap');
        .font-serif { font-family: 'Instrument Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* --- HEADER & PIPELINE NAV --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-stone-200 pb-8 md:pb-12 gap-6 md:gap-8">
        <div className="space-y-4 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2">
              <Database size={12} fill="currentColor" />
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">Data Import Command Center</h1>
          
          <nav className="flex items-center gap-4 pt-4">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-100 text-stone-300 hover:text-stone-900 transition-all shadow-sm"
            >
              <ArrowLeft size={12} />
              Settings
            </button>
          </nav>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          onClick={startMigration}
          disabled={!file || status === 'processing'}
          className={`w-full md:w-auto flex items-center justify-center gap-4 px-10 py-5 rounded-[2rem] shadow-sm transition-all cursor-pointer
            ${!file ? 'bg-stone-100 text-stone-300 cursor-not-allowed' : 'bg-[#A3B18A] text-white hover:shadow-xl'}
          `}
        >
          {status === 'processing' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {status === 'processing' ? "Importing Data..." : "Start Import"}
          </span>
        </motion.button>
      </header>

      {/* --- PIPELINE CANVAS --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Drop Zone */}
        <section className="bg-white border border-stone-200 p-8 md:p-14 rounded-[3.5rem] shadow-sm lg:col-span-8 flex flex-col items-center justify-center min-h-[500px]">
          <div 
            onClick={() => status !== 'processing' && fileInputRef.current?.click()}
            className={`w-full h-full border-2 border-dashed rounded-[3rem] transition-all duration-700 flex flex-col items-center justify-center text-center p-10 md:p-20 cursor-pointer group
              ${file ? 'border-[#A3B18A] bg-[#A3B18A]/5' : 'border-stone-100 hover:border-[#A3B18A]'}
            `}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
            
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 mb-8
              ${status === 'success' ? 'bg-[#A3B18A] text-white' : 'bg-[#faf9f6] text-stone-200 group-hover:text-[#A3B18A]'}
            `}>
              {status === 'processing' ? <Loader2 className="animate-spin" size={32} /> : status === 'success' ? <CheckCircle2 size={32} /> : <UploadCloud size={32} />}
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl md:text-4xl font-serif italic text-stone-900 tracking-tight">
                {status === 'success' ? 'Migration Complete' : file ? file.name : "Select CSV Manifest"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
                {status === 'success'
                  ? `${rowCount} Nodes Integrated`
                  : file && isValidated
                    ? `${previewData.length} Valid / ${invalidRows.length} Invalid`
                    : "Drop Data Architecture"}
              </p>
            </div>

            {isValidated && previewData.length > 0 && (
              <div className="mt-8 w-full border border-stone-100 rounded-2xl p-6 bg-white/60">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 mb-4">
                  Preview (Top 5 Valid Records)
                </p>

                <div className="space-y-2">
                  {previewData.map((row, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-stone-600 border-b border-stone-100 pb-2">
                      <span>
                        {row.full_name || row.company || row.invoice_number || 'Imported Record'}
                      </span>
                      <span className="text-stone-400 uppercase">
                        {row.record_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center gap-3 text-red-500 bg-red-500/5 px-6 py-4 rounded-2xl border border-red-500/10"
              >
                <AlertCircle size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">{errorMessage}</span>
              </motion.div>
            )}
          </div>
        </section>

        {/* Schema Key Sidebar */}
        <aside className="bg-white border border-stone-200 p-8 md:p-10 rounded-[3.5rem] shadow-sm lg:col-span-4 flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
              Import Schema Key
            </h2>
            <p className="text-stone-500 text-xs">
              Upload contacts, finance, CRM, HR, projects or mixed datasets. TOTS‑OS will automatically map recognised fields.
            </p>
          </div>

          <div className="space-y-4">
            {REQUIRED_SCHEMA.map((item) => (
              <div key={item.field} className="border border-stone-100 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">{item.field}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${item.required ? 'text-red-400' : 'text-stone-400'}`}>
                    {item.required ? 'required' : 'optional'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </aside>

      </main>

    </div>
  );
}