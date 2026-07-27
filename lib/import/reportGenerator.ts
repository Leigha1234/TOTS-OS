// ==========================================
// 11. lib/import/reportGenerator.ts
// ==========================================

import { BatchImportResult, ImportReport } from "./types";

interface ReportOptions {
  supabase: any;
  userId: string;
  organisationId: string | null;
  filename: string;
  durationMs: number;
  rawRowsCount: number;
  importResult: BatchImportResult;
  invalidCount: number;
  duplicateCount: number;
}

export async function generateImportReport(options: ReportOptions): Promise<ImportReport> {
  const {
    supabase,
    userId,
    organisationId,
    filename,
    durationMs,
    rawRowsCount,
    importResult,
    invalidCount,
    duplicateCount
  } = options;

  const report: ImportReport = {
    filename,
    durationMs,
    rowsProcessed: rawRowsCount,
    rowsInserted: importResult.inserted,
    rowsUpdated: importResult.updated,
    rowsSkipped: importResult.skipped,
    rowsFailed: importResult.failed + invalidCount,
    duplicatesFound: duplicateCount,
    status: importResult.failed === 0 ? 'success' : 'partial'
  };

  // Persist import history to Supabase table if it exists
  try {
    await supabase.from('import_history').insert({
      filename,
      uploaded_by: userId,
      organisation_id: organisationId,
      upload_date: new Date().toISOString(),
      duration: durationMs,
      rows_processed: rawRowsCount,
      rows_inserted: importResult.inserted,
      rows_updated: importResult.updated,
      rows_failed: importResult.failed + invalidCount,
      import_status: report.status
    });
  } catch (err) {
    // Graceful fallback if import_history table hasn't been migrated yet
  }

  return report;
}