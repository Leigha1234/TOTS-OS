"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { AlertCircle, AlertTriangle, ArrowLeft, Check, CheckCircle2, Clock, Database, Download, FileSearch, FileText, Loader2, RotateCcw, ShieldCheck, UploadCloud, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { parseFile } from "@/lib/import/fileParser";
import { detectRecords } from "@/lib/import/recordDetector";
import { resolveRelationships } from "@/lib/import/relationshipResolver";
import { validateRows } from "@/lib/import/validator";
import { checkDuplicates } from "@/lib/import/duplicateChecker";
import { processBatches } from "@/lib/import/batchImporter";
import { ProgressTracker } from "@/lib/import/progressTracker";
import { generateImportReport } from "@/lib/import/reportGenerator";
import type { DuplicateResolutionStrategy, ImportProgress, ImportReport as ImportReportType, ImportStatus, ProcessedRow, RawRow, TargetTableType } from "@/lib/import/types";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type AuditEntry = { success: boolean; identifier: string; entity: string; details: string; destination?: string; action?: "inserted" | "updated" | "skipped" | "failed" };
type AnalysisSnapshot = {
  userId: string; organisationId: string; rawRows: RawRow[]; detectedRows: ProcessedRow[];
  resolvedRows: ProcessedRow[]; validRows: ProcessedRow[]; invalidRows: ProcessedRow[];
  duplicateRows: ProcessedRow[]; recordsToProcess: ProcessedRow[];
};
const INITIAL_PROGRESS: ImportProgress = { phase: "idle", percent: 0, currentBatch: 0, totalBatches: 1, processedRows: 0, elapsedMs: 0, etaMs: 0 };
const TARGET_TABLES: { id: TargetTableType; label: string; description: string; entityName: string }[] = [
  { id: "auto", label: "Auto-Detect", description: "Analyse the dataset and select the most appropriate supported destination.", entityName: "record" },
  { id: "contacts", label: "Contacts & CRM", description: "Import people, customers and member contact data.", entityName: "contact" },
  { id: "organisations", label: "Organisations", description: "Import genuine company and organisation records.", entityName: "organisation" },
  { id: "invoices", label: "Finance & Invoices", description: "Import supported invoice data.", entityName: "invoice" },
  { id: "expenses", label: "Expenses & Receipts", description: "Import supported expense records.", entityName: "expense" },
  { id: "projects", label: "Projects", description: "Import supported project records.", entityName: "project" },
];
function normaliseKey(value: string) { return value.trim().toLowerCase().replace(/[\s_-]+/g, ""); }
function getObjectValue(object: Record<string, unknown> | null | undefined, aliases: string[]) {
  if (!object) return undefined;
  for (const alias of aliases) {
    const match = Object.entries(object).find(([key]) => normaliseKey(key) === normaliseKey(alias));
    if (match && match[1] != null && String(match[1]).trim()) return match[1];
  }
  return undefined;
}
function stringValue(value: unknown) { return value == null ? "" : String(value).trim(); }
function payloadOf(row: ProcessedRow) { return (row.payload ?? {}) as Record<string, unknown>; }
function getRowEmail(row: ProcessedRow) {
  return stringValue(getObjectValue(payloadOf(row), ["email", "mail", "email_address", "email address", "subscriber", "subscriber_email", "subscriber email"]) ?? getObjectValue(row.rawPayload, ["email", "mail", "email_address", "email address", "subscriber", "subscriber_email", "subscriber email"])).toLowerCase();
}
function getRowPhone(row: ProcessedRow) {
  return stringValue(getObjectValue(payloadOf(row), ["phone", "telephone", "mobile", "phone_number", "phone number"]) ?? getObjectValue(row.rawPayload, ["phone", "telephone", "mobile", "phone_number", "phone number"]));
}
function getContactName(row: ProcessedRow) {
  const payload = payloadOf(row); const raw = row.rawPayload;
  const explicit = stringValue(getObjectValue(payload, ["name", "full_name", "full name", "contact_name", "contact name"]) ?? getObjectValue(raw, ["name", "full_name", "full name", "contact_name", "contact name"]));
  if (explicit) return explicit;
  const first = stringValue(getObjectValue(payload, ["first_name", "first name", "firstname"]) ?? getObjectValue(raw, ["first_name", "first name", "firstname"]));
  const last = stringValue(getObjectValue(payload, ["last_name", "last name", "lastname", "surname"]) ?? getObjectValue(raw, ["last_name", "last name", "lastname", "surname"]));
  return [first, last].filter(Boolean).join(" ").trim();
}
function getRowIdentifier(row: ProcessedRow, fallback: string) {
  return getContactName(row) || stringValue(getObjectValue(payloadOf(row), ["company_name", "company name", "project_name", "project name", "title", "description", "invoice_number", "invoice number", "expense_number", "expense number", "reference"])) || getRowEmail(row) || getRowPhone(row) || fallback;
}
function getEntityLabel(table: unknown) {
  const destination = String(table ?? "");
  return TARGET_TABLES.find((target) => target.id === destination)?.entityName ?? (destination.endsWith("s") ? destination.slice(0, -1) : destination || "record");
}
function createRowSignature(row: ProcessedRow) {
  return [String(row.targetTable ?? ""), getRowEmail(row), getRowIdentifier(row, "").toLowerCase().trim(), JSON.stringify(row.rawPayload ?? {})].join("::");
}
function csvValue(value: unknown) {
  const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  // Spreadsheet formula injection protection; preserve ordinary values as written.
  const safe = /^[\s]*[=+@\-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
function failureReason(row: ProcessedRow) {
  const errors = Array.isArray(row.validationErrors) ? row.validationErrors.map(String).filter(Boolean) : [];
  return errors.length ? errors.join(" | ") : "Database import failed (no detailed error returned by batchImporter)";
}
function downloadFailedRowsCsv(rows: ProcessedRow[], sourceFilename: string) {
  if (!rows.length) return;
  const rawObjects = rows.map((row) => (row.rawPayload ?? row.payload ?? {}) as Record<string, unknown>);
  const headers = [...new Set(rawObjects.flatMap((object) => Object.keys(object)))];
  const metaHeaders = ["TOTS_OS_Import_Status", "TOTS_OS_Failure_Reason", "TOTS_OS_Target_Table"];
  const lines = [
    [...headers, ...metaHeaders].map(csvValue).join(","),
    ...rows.map((row, index) => [...headers.map((header) => rawObjects[index][header]), "Failed", failureReason(row), String(row.targetTable ?? "")].map(csvValue).join(",")),
  ];
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sourceFilename.replace(/\.[^.]+$/, "").trim() || "import"}_failed_rows_with_reasons.csv`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function MetricCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className={`rounded-2xl p-3 text-center ${danger ? "bg-red-50" : "bg-stone-50"}`}><p className={`text-xl font-bold ${danger ? "text-red-600" : "text-stone-900"}`}>{value}</p><p className={`mt-1 text-[8px] font-black uppercase tracking-wider ${danger ? "text-red-400" : "text-stone-400"}`}>{label}</p></div>;
}
function SidebarMetric({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[#dfe6d7] py-2 last:border-b-0"><span className="text-[9px] text-stone-500">{label}</span><span className="text-[10px] font-black text-stone-700">{value}</span></div>;
}

export default function ImportArchitecture() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const runningRef = useRef(false);
  const [currentTime, setCurrentTime] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTargetTable, setSelectedTargetTable] = useState<TargetTableType>("auto");
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateResolutionStrategy>("update");
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS);
  const [analysis, setAnalysis] = useState<AnalysisSnapshot | null>(null);
  const [previewRows, setPreviewRows] = useState<ProcessedRow[]>([]);
  const [failedRows, setFailedRows] = useState<ProcessedRow[]>([]);
  const [processedLogRows, setProcessedLogRows] = useState<AuditEntry[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [report, setReport] = useState<ImportReportType | null>(null);
  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer);
  }, []);
  const resetAnalysis = useCallback((preserveFile = true) => {
    if (runningRef.current) return;
    setStatus("idle"); setErrorMessage(""); setAnalysis(null); setPreviewRows([]); setFailedRows([]);
    setProcessedLogRows([]); setDuplicateCount(0); setReport(null); setProgress(INITIAL_PROGRESS);
    if (!preserveFile) { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }, []);
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (runningRef.current) return;
    const selected = event.target.files?.[0]; if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx", "xls", "tsv"].includes(extension)) {
      resetAnalysis(false); setStatus("error"); setErrorMessage("Unsupported file type. Upload a CSV, XLSX, XLS or TSV file."); return;
    }
    resetAnalysis(true); setFile(selected);
  }, [resetAnalysis]);
  const selectTarget = useCallback((target: TargetTableType) => {
    if (runningRef.current) return;
    setSelectedTargetTable(target); resetAnalysis(true);
  }, [resetAnalysis]);
  const getWorkspaceContext = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error("You must be signed in before importing data.");
    const { data: profile, error: profileError } = await supabase.from("profiles").select("organisation_id").eq("id", authData.user.id).single();
    if (profileError) throw profileError;
    const organisationId = String(profile?.organisation_id ?? "").trim();
    if (!organisationId) throw new Error("No organisation is linked to this account. Importing was stopped.");
    return { userId: authData.user.id, organisationId };
  }, []);
  const analyseFile = useCallback(async () => {
    if (!file || runningRef.current) return;
    runningRef.current = true;
    setStatus("processing"); setErrorMessage(""); setReport(null); setProcessedLogRows([]); setFailedRows([]); setAnalysis(null);
    const tracker = new ProgressTracker(setProgress);
    try {
      tracker.update("authorising", 5, 0, 1);
      const { userId, organisationId } = await getWorkspaceContext();
      tracker.update("reading", 15, 0, 1);
      const rawRows = await parseFile(file);
      if (!rawRows.length) throw new Error("No data rows were found in this file.");
      tracker.update("detecting", 30, 0, 1);
      const detectedRows = detectRecords(rawRows, selectedTargetTable, organisationId, userId);
      if (!detectedRows.length) throw new Error("TOTS-OS could not detect any importable records.");
      tracker.update("resolving_relationships", 40, 0, 1);
      const resolvedRows = await resolveRelationships(detectedRows, supabase, organisationId);
      tracker.update("validating", 52, 0, 1);
      const validationResult = validateRows(resolvedRows);
      if (!validationResult.valid.length && !validationResult.invalid.length) throw new Error("No structured records were returned after validation.");
      tracker.update("checking_duplicates", 70, 0, 1);
      const duplicateResult = await checkDuplicates(validationResult.valid, supabase, organisationId);
      tracker.update("preview_ready", 100, 1, 1, rawRows.length);
      setAnalysis({ userId, organisationId, rawRows, detectedRows, resolvedRows,
        validRows: duplicateResult.recordsToProcess, invalidRows: validationResult.invalid,
        duplicateRows: duplicateResult.duplicates, recordsToProcess: duplicateResult.recordsToProcess });
      setFailedRows(validationResult.invalid);
      setDuplicateCount(duplicateResult.duplicates.length);
      setPreviewRows(duplicateResult.recordsToProcess.slice(0, 12));
      setStatus("idle");
    } catch (error) {
      console.error("[TOTS IMPORT] Analysis failed:", error);
      setStatus("error"); setErrorMessage(error instanceof Error ? error.message : "The file could not be analysed.");
    } finally { runningRef.current = false; }
  }, [file, selectedTargetTable, getWorkspaceContext]);
  const executeImport = useCallback(async () => {
    if (!file || !analysis || runningRef.current || status === "success") return;
    runningRef.current = true;
    setStatus("processing"); setErrorMessage(""); setReport(null); setProcessedLogRows([]);
    const tracker = new ProgressTracker(setProgress);
    try {
      tracker.update("authorising", 5, 0, 1);
      const context = await getWorkspaceContext();
      if (context.userId !== analysis.userId || context.organisationId !== analysis.organisationId)
        throw new Error("Your active workspace changed. Analyse the file again before importing.");
      if (!analysis.recordsToProcess.length) throw new Error("There are no valid records ready to import.");
      tracker.update("importing", 15, 0, 1);
      const importResult = await processBatches(analysis.recordsToProcess, supabase, analysis.organisationId, duplicateStrategy, (batchNum, totalBatches) => {
        const total = Math.max(totalBatches, 1);
        tracker.update("importing", Math.min(15 + Math.floor((batchNum / total) * 75), 90), batchNum, total,
          Math.min(analysis.recordsToProcess.length, Math.ceil((batchNum / total) * analysis.recordsToProcess.length)));
      });
      const executionFailures = Array.isArray(importResult.failedRows) ? importResult.failedRows : [];
      const allFailures = [...analysis.invalidRows, ...executionFailures];
      setFailedRows(allFailures);
      tracker.update("finishing", 93, 1, 1, analysis.recordsToProcess.length);
      const finalReport = await generateImportReport({ supabase, userId: analysis.userId, organisationId: analysis.organisationId,
        filename: file.name, durationMs: tracker.getElapsedTime(), rawRowsCount: analysis.rawRows.length,
        importResult, invalidCount: analysis.invalidRows.length, duplicateCount: analysis.duplicateRows.length });
      // IMPORTANT: A non-failed row is not proof of a successful DB write. Only actual
      // failed-row errors are individually audited here; aggregate successes come from the report.
      const failureEntries: AuditEntry[] = allFailures.map((row, index) => ({
        success: false, action: "failed", identifier: getRowIdentifier(row, `Failed row #${index + 1}`),
        entity: getEntityLabel(row.targetTable), destination: String(row.targetTable ?? ""), details: failureReason(row),
      }));
      setProcessedLogRows(failureEntries);
      setReport(finalReport);
      tracker.complete(analysis.recordsToProcess.length);
      setStatus("success");
    } catch (error) {
      console.error("[TOTS IMPORT] Import failed:", error);
      setStatus("error"); setErrorMessage(error instanceof Error ? error.message : "The import could not be completed.");
    } finally { runningRef.current = false; }
  }, [file, analysis, status, duplicateStrategy, getWorkspaceContext]);
  const handlePrimaryAction = useCallback(async () => {
    if (!file || runningRef.current || status === "processing" || status === "success") return;
    if (analysis) await executeImport(); else await analyseFile();
  }, [file, status, analysis, executeImport, analyseFile]);
  const destinationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of analysis?.recordsToProcess ?? []) {
      const target = String(row.targetTable); map.set(target, (map.get(target) ?? 0) + 1);
    }
    return [...map.entries()].map(([destination, count]) => ({ destination, count })).sort((a, b) => b.count - a.count);
  }, [analysis]);
  const reportHasFailures = Boolean(report && Number(report.rowsFailed ?? 0) > 0);
  const analysisReady = Boolean(analysis);
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-8 bg-[#faf9f6] p-4 font-sans text-stone-900 md:space-y-12 md:p-8 lg:p-12">
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap'); .font-serif{font-family:'Instrument Serif',serif}.font-sans{font-family:'Inter',sans-serif}`}</style>
      <header className="flex flex-col items-start justify-between gap-6 border-b border-stone-200 pb-8 md:flex-row md:items-end md:pb-12">
        <div className="space-y-4"><div className="flex items-center gap-6 text-[#A3B18A]"><span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em]"><Database size={12}/> TOTS-OS Import Pipeline</span><span className="flex items-center gap-2 text-[9px] font-black"><Clock size={12}/>{currentTime}</span></div>
          <h1 className="font-serif text-5xl italic tracking-tighter md:text-7xl">Data Import Hub</h1>
          <p className="max-w-2xl text-xs leading-6 text-stone-500">Analyse existing business data, preview its destination, check for duplicates, then confirm the import.</p>
          <div className="flex flex-wrap gap-3 pt-2"><button type="button" onClick={() => router.push("/settings")} disabled={status === "processing"} className="flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-[9px] font-black uppercase tracking-widest disabled:opacity-40"><ArrowLeft size={12}/> Return to Settings</button>
            {file && <button type="button" disabled={status === "processing"} onClick={() => resetAnalysis(false)} className="flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-[9px] font-black uppercase tracking-widest disabled:opacity-40"><RotateCcw size={12}/> Start over</button>}</div></div>
        <motion.button whileHover={file && status !== "processing" && status !== "success" ? { scale: 1.02 } : undefined} type="button" onClick={() => void handlePrimaryAction()} disabled={!file || status === "processing" || status === "success"} className={`flex w-full items-center justify-center gap-4 rounded-[2rem] px-10 py-5 text-white shadow-sm transition-all md:w-auto ${!file || status === "success" ? "cursor-not-allowed bg-stone-300" : analysisReady ? "bg-stone-900 hover:bg-[#A3B18A]" : "bg-[#A3B18A]"}`}>
          {status === "processing" ? <Loader2 size={18} className="animate-spin"/> : status === "success" ? <CheckCircle2 size={18}/> : analysisReady ? <Zap size={18}/> : <FileSearch size={18}/>}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{status === "processing" ? `${progress.phase.replace(/_/g, " ").toUpperCase()} (${progress.percent}%)` : status === "success" ? "Import complete" : analysisReady ? `Confirm Import (${analysis?.recordsToProcess.length ?? 0})` : "Analyse File"}</span>
        </motion.button>
      </header>
      <div className="flex items-start gap-4 rounded-[1.75rem] border border-[#dfe6d7] bg-[#f4f7f0] p-5"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#71805f]"/><div><p className="text-[10px] font-black uppercase tracking-wider text-[#647356]">Safe import mode</p><p className="mt-1.5 text-[10px] leading-5 text-stone-500">Analysis does not write to the database. Records are written only after Confirm Import. Verify destinations and duplicate handling first.</p></div></div>
      <main className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <section className="flex min-h-[500px] flex-col items-center justify-center rounded-[3.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-10 lg:col-span-8 lg:p-14">
          <div role="button" tabIndex={0} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && status !== "processing") { event.preventDefault(); fileInputRef.current?.click(); } }} onClick={() => { if (status !== "processing") fileInputRef.current?.click(); }} className={`group flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[3rem] border-2 border-dashed p-7 text-center transition-all md:p-14 ${file ? "border-[#A3B18A] bg-[#A3B18A]/5" : "border-stone-200 hover:border-[#A3B18A]"} ${status === "processing" ? "pointer-events-none" : ""}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv,.xlsx,.xls,.tsv"/>
            <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] ${status === "success" ? reportHasFailures ? "bg-amber-100 text-amber-600" : "bg-[#A3B18A] text-white" : analysisReady ? "bg-[#e8efe2] text-[#71805f]" : "bg-[#faf9f6] text-stone-300"}`}>
              {status === "processing" ? <Loader2 className="animate-spin" size={32}/> : status === "success" ? reportHasFailures ? <AlertTriangle size={32}/> : <CheckCircle2 size={32}/> : analysisReady ? <FileSearch size={32}/> : <UploadCloud size={32}/>}
            </div>
            <h3 className="font-serif text-3xl italic tracking-tight md:text-4xl">{status === "success" ? reportHasFailures ? "Import completed with some issues" : "Import completed successfully" : analysisReady ? "Analysis complete — ready to review" : file ? file.name : "Select a CSV, XLSX, XLS or TSV file"}</h3>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">{status === "success" && report ? `${report.rowsInserted} inserted · ${report.rowsUpdated} updated · ${report.rowsSkipped} skipped · ${report.rowsFailed} failed` : status === "processing" ? `${progress.phase.replace(/_/g, " ")} — ${progress.percent}%` : analysis && analysisReady ? `${analysis.rawRows.length} source rows · ${analysis.recordsToProcess.length} ready · ${duplicateCount} duplicates · ${analysis.invalidRows.length} invalid` : file ? "Click Analyse File to preview without writing data" : "Upload business data for validation and routing"}</p>
            {analysis && status !== "success" && <div onClick={(event) => event.stopPropagation()} className="mt-8 w-full space-y-6 rounded-3xl border border-stone-200 bg-white p-6 text-left shadow-sm">
              <div className="border-b pb-4"><p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">Import Preview</p><p className="mt-1 text-xs text-stone-500">Nothing has been written yet.</p></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label="Source rows" value={analysis.rawRows.length}/><MetricCard label="Ready" value={analysis.recordsToProcess.length}/><MetricCard label="Duplicates" value={duplicateCount}/><MetricCard label="Invalid" value={analysis.invalidRows.length} danger={analysis.invalidRows.length > 0}/></div>
              {destinationCounts.length > 0 && <div><p className="mb-3 text-[8px] font-black uppercase tracking-wider text-stone-400">Detected destinations</p><div className="grid gap-2 sm:grid-cols-2">{destinationCounts.map((item) => <div key={item.destination} className="flex justify-between rounded-2xl bg-stone-50 p-4 text-[10px]"><span>public.{item.destination}</span><strong>{item.count}</strong></div>)}</div></div>}
              {previewRows.length > 0 && <div><p className="mb-3 text-[8px] font-black uppercase tracking-wider text-stone-400">Record preview (first 12)</p><div className="overflow-hidden rounded-2xl border">{previewRows.map((row, index) => <div key={`${createRowSignature(row)}-${index}`} className="flex items-center justify-between gap-2 border-b p-3 text-[10px] last:border-0"><div className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-[#A3B18A]"/><span className="truncate font-bold">{getRowIdentifier(row, `Record ${index + 1}`)}</span></div><div className="flex gap-2">{row.isDuplicate && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-600">Duplicate</span>}<span className="rounded-full bg-stone-50 px-2 py-1">{row.targetTable}</span></div></div>)}</div></div>}
              {analysis.invalidRows.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[10px] font-bold text-amber-800">{analysis.invalidRows.length} invalid rows will not be written.</p><button type="button" className="mt-3 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[9px] font-bold text-amber-800" onClick={() => downloadFailedRowsCsv(analysis.invalidRows, file?.name ?? "import")}><Download size={12}/> Download invalid rows with reasons</button></div>}
              <p className="text-[10px] text-stone-500">Check the destinations above, then press <strong>Confirm Import</strong> at the top.</p>
            </div>}
            {status === "success" && report && <div onClick={(event) => event.stopPropagation()} className="mt-8 w-full space-y-5 rounded-3xl border bg-white p-6 text-left shadow-sm">
              <div className="flex justify-between border-b pb-3"><span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">Import Summary</span><span className="text-[9px] font-mono text-stone-400">{(report.durationMs / 1000).toFixed(2)}s</span></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><MetricCard label="Inserted" value={report.rowsInserted}/><MetricCard label="Updated" value={report.rowsUpdated}/><MetricCard label="Skipped" value={report.rowsSkipped}/><MetricCard label="Duplicates" value={report.duplicatesFound}/><MetricCard label="Failed" value={report.rowsFailed} danger={report.rowsFailed > 0}/></div>
              {failedRows.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4"><div><p className="text-[10px] font-bold text-red-700">{failedRows.length} records could not be imported.</p><p className="mt-1 text-[9px] text-red-500">Download includes the reasons returned by validation or the batch importer.</p></div><button type="button" onClick={() => downloadFailedRowsCsv(failedRows, file?.name ?? "import")} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[9px] font-black uppercase text-red-600"><Download size={12}/> Download failures + reasons</button></div>}
            </div>}
            {status === "success" && processedLogRows.length > 0 && <div onClick={(event) => event.stopPropagation()} className="mt-6 w-full space-y-4 rounded-3xl border bg-white p-6 text-left shadow-sm"><div className="flex justify-between border-b pb-3"><span className="text-[9px] font-black uppercase tracking-[0.3em]">Failure details</span><span className="text-[9px] font-mono text-stone-400">{processedLogRows.length} entries</span></div><div className="max-h-96 space-y-2 overflow-y-auto">{processedLogRows.map((entry, index) => <div key={`${entry.identifier}-${index}`} className="rounded-2xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-900"><p className="flex items-center gap-2 font-bold"><AlertCircle size={12}/>{entry.identifier} could not be imported</p><p className="mt-1 text-[9px] opacity-70">public.{entry.destination}</p><p className="mt-2 break-words font-mono text-[9px]">{entry.details}</p></div>)}</div></div>}
            {status === "error" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={(event) => event.stopPropagation()} className="mt-8 flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-left text-red-600"><AlertCircle size={17}/><div><p className="text-[9px] font-black uppercase tracking-widest">Import stopped</p><p className="mt-1 text-[10px]">{errorMessage}</p></div></motion.div>}
          </div>
        </section>
        <aside className="flex flex-col gap-6 rounded-[3.5rem] border border-stone-200 bg-white p-7 shadow-sm md:p-10 lg:col-span-4">
          <div><h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">Import destination</h2><p className="mt-2 text-xs leading-5 text-stone-500">Use Auto-Detect when unsure, or choose a specific destination.</p></div>
          <div className="space-y-3">{TARGET_TABLES.map((target) => <button type="button" key={target.id} disabled={status === "processing"} onClick={() => selectTarget(target.id)} className={`w-full rounded-3xl border p-5 text-left transition-all disabled:opacity-50 ${selectedTargetTable === target.id ? "border-[#A3B18A] bg-[#A3B18A]/5" : "border-stone-100 bg-stone-50/50 hover:border-stone-300"}`}><div className="flex items-center justify-between"><p className="text-sm font-bold">{target.label}</p>{selectedTargetTable === target.id && <span className="rounded-full bg-[#A3B18A] p-1 text-white"><Check size={12}/></span>}</div><p className="mt-1.5 text-xs leading-5 text-stone-500">{target.description}</p></button>)}</div>
          <div className="space-y-3 border-t pt-5"><h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">Duplicate handling</h2><p className="text-[10px] leading-5 text-stone-500">Choose how existing matching records are handled.</p><div className="grid grid-cols-3 gap-2">{(["update", "skip", "create"] as DuplicateResolutionStrategy[]).map((strategy) => <button type="button" key={strategy} disabled={status === "processing" || status === "success"} onClick={() => setDuplicateStrategy(strategy)} className={`rounded-2xl border py-3 text-[9px] font-black uppercase disabled:opacity-40 ${duplicateStrategy === strategy ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50"}`}>{strategy}</button>)}</div>{duplicateStrategy === "create" && <p className="rounded-2xl bg-amber-50 p-4 text-[9px] leading-5 text-amber-700">Create can intentionally produce duplicate records. Use Update or Skip for most migrations.</p>}</div>
          <div className="rounded-3xl border bg-stone-50 p-5"><p className="text-[9px] font-black uppercase tracking-widest">Safe relationships</p><p className="mt-2 text-xs leading-relaxed text-stone-500">Imported records are assigned to the active workspace. External organisation IDs are not trusted.</p></div>
          {analysis && <div className="space-y-3 rounded-3xl border border-[#dfe6d7] bg-[#f4f7f0] p-5"><p className="flex items-center gap-2 text-[9px] font-black uppercase text-[#647356]"><CheckCircle2 size={14}/> Analysis ready</p><SidebarMetric label="Source rows" value={analysis.rawRows.length}/><SidebarMetric label="Detected records" value={analysis.detectedRows.length}/><SidebarMetric label="Ready to process" value={analysis.recordsToProcess.length}/><SidebarMetric label="Duplicates" value={duplicateCount}/><SidebarMetric label="Invalid" value={analysis.invalidRows.length}/></div>}
        </aside>
      </main>
    </div>
  );
}
