// ==========================================
// app/(dashboard)/settings/import/page.tsx
// ==========================================

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { 
  UploadCloud, CheckCircle2, Loader2, Database, 
  AlertCircle, ArrowLeft, Zap, Clock, FileText, Check, AlertTriangle, Download, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

// Import modules from the new robust import architecture
import { parseFile } from "@/lib/import/fileParser";
import { detectRecords } from "@/lib/import/recordDetector";
import { validateRows } from "@/lib/import/validator";
import { checkDuplicates } from "@/lib/import/duplicateChecker";
import { processBatches } from "@/lib/import/batchImporter";
import { ProgressTracker } from "@/lib/import/progressTracker";
import { generateImportReport } from "@/lib/import/reportGenerator";
import { 
  ImportStatus, 
  DuplicateResolutionStrategy, 
  TargetTableType, 
  ImportReport as ImportReportType,
  ProcessedRow 
} from "@/lib/import/types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * TOTS OS: DATA INGESTION HUB v6.0
 * Enterprise Architecture: Decoupled Pipeline, Fuzzy Mapping, Multi-format Parsing,
 * Relationship Resolution, and Resilient Batch Upserting.
 */

export default function ImportArchitecture() {
  const router = useRouter(); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // -- UI & Pipeline State --
  const [currentTime, setCurrentTime] = useState<string>("");
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Configuration Options
  const [selectedTargetTable, setSelectedTargetTable] = useState<TargetTableType>('auto');
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateResolutionStrategy>('update');

  // Engine Outputs & Preview Metrics
  const [progress, setProgress] = useState({ phase: 'idle', percent: 0, currentBatch: 0, totalBatches: 0, processedRows: 0, elapsedMs: 0, etaMs: 0 });
  const [previewRows, setPreviewRows] = useState<ProcessedRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ProcessedRow[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [report, setReport] = useState<ImportReportType | null>(null);

  const TARGET_TABLES: { id: TargetTableType; label: string; description: string }[] = [
    { id: 'auto', label: 'Auto-Detect (Smart Route)', description: 'Multi-model weighted scoring across contacts, organisations, projects, tasks, invoices, expenses, employees, and notes' },
    { id: 'contacts', label: 'Contacts & CRM', description: 'Maps to public.contacts with relationship auto-resolution' },
    { id: 'organisations', label: 'organisations', description: 'Maps to public.organisations with domain and registration matching' },
    { id: 'invoices', label: 'Finance & Invoices', description: 'Maps to public.invoices with automatic parent record linking' },
    { id: 'expenses', label: 'Expenses & Receipts', description: 'Maps to public.expenses with category tagging' },
    { id: 'projects', label: 'Projects & Tasks', description: 'Maps to public.projects and public.tasks' },
  ];

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // -- File Selection Handler --
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.rtf')) {
        setStatus('error');
        setErrorMessage("Format Error: RTF detected. Use CSV, XLSX, XLS, or TSV.");
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage("");
      setReport(null);
      setPreviewRows([]);
      setInvalidRows([]);
    }
  };

  // -- Master Orchestration Pipeline Execution --
  const startMigration = async () => {
    if (!file) return;
    setStatus('processing');
    setErrorMessage("");
    setReport(null);

    const tracker = new ProgressTracker((p) => {
      setProgress(p);
    });

    try {
      // 1. Authentication & Organisation Context
      tracker.update('reading', 5, 0, 1);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Clearance required: Session offline or unauthenticated.");
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single();

      const orgId = profile?.organisation_id || null;

      // 2. Parse Multi-format File (CSV, XLSX, XLS, TSV)
      tracker.update('reading', 15, 0, 1);
      const rawRows = await parseFile(file);
      if (!rawRows || rawRows.length === 0) {
        throw new Error("Empty dataset: No records found in file.");
      }

      // 3. Record Detection & Fuzzy Field Mapping
      tracker.update('detecting', 30, 0, 1);
      const detectedRecords = detectRecords(rawRows, selectedTargetTable, orgId, user.id);

      // 4. Schema & Format Validation
      tracker.update('validating', 45, 0, 1);
      const validationResult = validateRows(detectedRecords);
      setInvalidRows(validationResult.invalid);

      if (validationResult.valid.length === 0) {
        throw new Error("No valid records found after running strict validation rules.");
      }

      // 5. Duplicate Detection (In-file & Supabase DB)
      tracker.update('checking_duplicates', 60, 0, 1);
      const duplicateResult = await checkDuplicates(validationResult.valid, supabase, orgId);
      setDuplicateCount(duplicateResult.duplicates.length);

      // 6. Batch Upsert Processing with Relationship Resolution & Error Resilience
      tracker.update('importing', 75, 0, 1);
      const importResult = await processBatches(
        duplicateResult.recordsToProcess,
        supabase,
        orgId,
        duplicateStrategy,
        (batchNum, totalBatches) => {
          tracker.update('importing', 75 + Math.floor((batchNum / totalBatches) * 20), batchNum, totalBatches);
        }
      );

      // 7. Generate Import Report & Persist History
      tracker.update('finishing', 95, 1, 1);
      const finalReport = await generateImportReport({
        supabase,
        userId: user.id,
        organisationId: orgId,
        filename: file.name,
        durationMs: tracker.getElapsedTime(),
        rawRowsCount: rawRows.length,
        importResult,
        invalidCount: validationResult.invalid.length,
        duplicateCount: duplicateResult.duplicates.length
      });

      setReport(finalReport);
      setPreviewRows(validationResult.valid.slice(0, 6));
      setStatus('success');
      tracker.complete();

    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || "An unexpected error occurred during pipeline execution.");
    }
  };

  // -- Download Failed Rows Utility --
  const downloadFailedRows = () => {
    if (!invalidRows.length) return;
    const headers = Object.keys(invalidRows[0].rawPayload || {}).join(",");
    const rowsCSV = invalidRows.map(r => Object.values(r.rawPayload || {}).join(",")).join("\n");
    const blob = new Blob([`${headers}\n${rowsCSV}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_import_${file?.name || 'export'}.csv`;
    a.click();
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
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Enterprise Supabase Pipeline v6.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <p className="font-black uppercase text-[9px] tracking-[0.4em]">
                {currentTime || "00:00"}
              </p>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter leading-none text-stone-900">Data Import Command Center</h1>
          
          <nav className="flex items-center gap-4 pt-4">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-3 px-8 py-3.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-all shadow-sm cursor-pointer"
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
            {status === 'processing' ? `${progress.phase.toUpperCase()} (${progress.percent}%)` : "Execute Enterprise Migration"}
          </span>
        </motion.button>
      </header>

      {/* --- PIPELINE CANVAS --- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Drop Zone & Live Engine Feed */}
        <section className="bg-white border border-stone-200 p-8 md:p-14 rounded-[3.5rem] shadow-sm lg:col-span-8 flex flex-col items-center justify-center min-h-[500px]">
          <div 
            onClick={() => status !== 'processing' && fileInputRef.current?.click()}
            className={`w-full h-full border-2 border-dashed rounded-[3rem] transition-all duration-700 flex flex-col items-center justify-center text-center p-10 md:p-20 cursor-pointer group
              ${file ? 'border-[#A3B18A] bg-[#A3B18A]/5' : 'border-stone-200 hover:border-[#A3B18A]'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept=".csv, .xlsx, .xls, .tsv" 
            />
            
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 mb-8
              ${status === 'success' ? 'bg-[#A3B18A] text-white' : 'bg-[#faf9f6] text-stone-300 group-hover:text-[#A3B18A]'}
            `}>
              {status === 'processing' ? <Loader2 className="animate-spin" size={32} /> : status === 'success' ? <CheckCircle2 size={32} /> : <UploadCloud size={32} />}
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl md:text-4xl font-serif italic text-stone-900 tracking-tight">
                {status === 'success' ? 'Enterprise Migration Successful' : file ? file.name : "Select Multi-Format Manifest (CSV, XLSX, XLS, TSV)"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                {status === 'success' && report
                  ? `${report.rowsInserted} Inserted | ${report.rowsUpdated} Updated | ${report.rowsSkipped} Skipped`
                  : status === 'processing'
                    ? `Phase: ${progress.phase.replace('_', ' ').toUpperCase()} — ${progress.percent}% Completed`
                    : file
                      ? "File loaded. Ready for fuzzy mapping & weighted record scoring."
                      : "Drop Spreadsheet or CSV for Automatic Schema Resolution"}
              </p>
            </div>

            {/* Success Report Card */}
            {status === 'success' && report && (
              <div className="mt-8 w-full border border-stone-200 rounded-3xl p-6 bg-white text-left shadow-sm space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">Execution Report Summary</span>
                  <span className="text-[9px] font-mono text-stone-400">Duration: {(report.durationMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-stone-50 p-3 rounded-2xl">
                    <p className="text-xl font-bold text-stone-900">{report.rowsInserted}</p>
                    <p className="text-[9px] font-black uppercase text-stone-400">Inserted</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-2xl">
                    <p className="text-xl font-bold text-stone-900">{report.rowsUpdated}</p>
                    <p className="text-[9px] font-black uppercase text-stone-400">Updated</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-2xl">
                    <p className="text-xl font-bold text-stone-900">{report.duplicatesFound}</p>
                    <p className="text-[9px] font-black uppercase text-stone-400">Duplicates</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-2xl">
                    <p className="text-xl font-bold text-red-600">{report.rowsFailed}</p>
                    <p className="text-[9px] font-black uppercase text-stone-400">Failed</p>
                  </div>
                </div>

                {invalidRows.length > 0 && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-red-600 font-medium">{invalidRows.length} rows failed validation rules.</span>
                    <button 
                      onClick={downloadFailedRows}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                    >
                      <Download size={12} /> Download Failed CSV
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preview Matrix */}
            {previewRows.length > 0 && status !== 'success' && (
              <div className="mt-8 w-full border border-stone-200 rounded-3xl p-6 bg-white/90 text-left shadow-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Validated Preview Records ({previewRows.length})
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                      {duplicateCount} Duplicates Detected
                    </span>
                    {invalidRows.length > 0 && (
                      <span className="text-[9px] font-mono bg-red-50 text-red-600 px-3 py-1 rounded-full">
                        {invalidRows.length} Invalid
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {previewRows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-stone-700 border-b border-stone-100 pb-2 font-mono">
                      <div className="flex items-center gap-3 truncate">
                        <FileText size={14} className="text-[#A3B18A] shrink-0" />
                        <span className="truncate">
                          {row.payload.name || row.payload.company_name || row.payload.description || row.payload.email || `Record ID: ${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold shrink-0 ml-4">
                        Table: {row.targetTable} {row.payload.amount ? `(£${row.payload.amount})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border border-red-200"
              >
                <AlertCircle size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">{errorMessage}</span>
              </motion.div>
            )}
          </div>
        </section>

        {/* Enterprise Configuration Sidebar */}
        <aside className="bg-white border border-stone-200 p-8 md:p-10 rounded-[3.5rem] shadow-sm lg:col-span-4 flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
              Target Routing Engine
            </h2>
            <p className="text-stone-500 text-xs">
              Configure target destination tables and intelligent duplicate resolution strategies.
            </p>
          </div>

          <div className="space-y-3">
            {TARGET_TABLES.map((target) => (
              <div 
                key={target.id}
                onClick={() => setSelectedTargetTable(target.id)}
                className={`border rounded-3xl p-5 cursor-pointer transition-all ${
                  selectedTargetTable === target.id 
                    ? 'border-[#A3B18A] bg-[#A3B18A]/5 shadow-sm' 
                    : 'border-stone-100 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-stone-900">{target.label}</p>
                  {selectedTargetTable === target.id && (
                    <div className="w-5 h-5 rounded-full bg-[#A3B18A] text-white flex items-center justify-center">
                      <Check size={12} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">{target.description}</p>
              </div>
            ))}
          </div>

          {/* Duplicate Strategy Selection */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">
              Duplicate Conflict Resolution
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'update', label: 'Update' },
                { id: 'skip', label: 'Skip' },
                { id: 'create', label: 'Create' }
              ].map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => setDuplicateStrategy(strat.id as DuplicateResolutionStrategy)}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    duplicateStrategy === strat.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {strat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-100 rounded-3xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-stone-700">
              <RefreshCw size={14} className="text-[#A3B18A]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Automatic Relationship Linking</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              organisations, Contacts, Projects, Tasks, and Invoices are automatically linked using foreign key resolution protocols during batch insertion.
            </p>
          </div>
        </aside>

      </main>

    </div>
  );
}