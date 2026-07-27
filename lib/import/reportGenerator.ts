// ==========================================
// 11. lib/import/reportGenerator.ts
// ==========================================

import {
  BatchImportResult,
  ImportReport
} from "./types";


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


export async function generateImportReport(
  options: ReportOptions
): Promise<ImportReport> {

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


  const failedRows =
    importResult.failed + invalidCount;


  const status =
    failedRows === 0
      ? "success"
      : importResult.inserted > 0
        ? "partial"
        : "failed";


  const report: ImportReport = {

    filename,

    durationMs,

    rowsProcessed:
      rawRowsCount,

    rowsInserted:
      importResult.inserted,

    rowsUpdated:
      importResult.updated,

    rowsSkipped:
      importResult.skipped,

    rowsFailed:
      failedRows,

    duplicatesFound:
      duplicateCount,

    status
  };


  /**
   * Save import history
   */
  try {

    const { error } =
      await supabase
        .from("import_history")
        .insert({

          filename,

          uploaded_by:
            userId,

          organisation_id:
            organisationId,

          upload_date:
            new Date().toISOString(),

          duration:
            durationMs,

          rows_processed:
            rawRowsCount,

          rows_inserted:
            importResult.inserted,

          rows_updated:
            importResult.updated,

          rows_failed:
            failedRows,

          import_status:
            status
        });


    if (error) {

      console.warn(
        "Import history save failed:",
        error
      );

    }


  } catch (err) {

    console.warn(
      "Import history unavailable:",
      err
    );

  }


  return report;
}