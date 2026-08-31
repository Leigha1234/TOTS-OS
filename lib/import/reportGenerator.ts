// ==========================================
// lib/import/reportGenerator.ts
// ==========================================

import {
  BatchImportResult,
  ImportReport,
} from "./types";

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function safeCount(
  value: number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      value
    )
  );
}

// ============================================================

function safeDuration(
  value: number
): number {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      value
    )
  );
}

// ============================================================

function cleanFilename(
  filename: string
): string {
  const cleaned =
    String(
      filename ?? ""
    )
      .trim();

  return (
    cleaned ||
    "Unknown import"
  );
}

// ============================================================

function determineStatus(
  inserted: number,
  updated: number,
  skipped: number,
  failed: number,
  totalRows: number
): ImportReport["status"] {
  const successfulActions =
    inserted +
    updated +
    skipped;

  if (
    failed === 0
  ) {
    return "success";
  }

  if (
    successfulActions >
    0
  ) {
    return "partial";
  }

  /**
   * An empty import should not really reach this stage,
   * because fileParser.ts rejects files with no usable rows.
   *
   * If it somehow does, treat it as failed rather than
   * claiming success.
   */
  if (
    totalRows ===
    0
  ) {
    return "failed";
  }

  return "failed";
}

// ============================================================
// MAIN REPORT GENERATOR
// ============================================================

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
    duplicateCount,
  } =
    options;

  // ==========================================================
  // NORMALISE COUNTS
  // ==========================================================

  const rowsProcessed =
    safeCount(
      rawRowsCount
    );

  const rowsInserted =
    safeCount(
      importResult.inserted
    );

  const rowsUpdated =
    safeCount(
      importResult.updated
    );

  const rowsSkipped =
    safeCount(
      importResult.skipped
    );

  const executionFailures =
    safeCount(
      importResult.failed
    );

  const validationFailures =
    safeCount(
      invalidCount
    );

  const duplicatesFound =
    safeCount(
      duplicateCount
    );

  /**
   * Validation failures never reach processBatches(), so they
   * must be added to execution failures to get the true failed
   * row count.
   */
  const rowsFailed =
    executionFailures +
    validationFailures;

  const safeDurationMs =
    safeDuration(
      durationMs
    );

  // ==========================================================
  // STATUS
  // ==========================================================

  const status =
    determineStatus(
      rowsInserted,
      rowsUpdated,
      rowsSkipped,
      rowsFailed,
      rowsProcessed
    );

  // ==========================================================
  // REPORT
  // ==========================================================

  const report:
    ImportReport = {
    filename:
      cleanFilename(
        filename
      ),

    durationMs:
      safeDurationMs,

    rowsProcessed,

    rowsInserted,

    rowsUpdated,

    rowsSkipped,

    rowsFailed,

    duplicatesFound,

    status,
  };

  // ==========================================================
  // SAVE IMPORT HISTORY
  // ==========================================================

  /**
   * Import history is useful, but it is secondary.
   *
   * A missing import_history table, RLS issue, or schema
   * mismatch must never turn an otherwise successful import
   * into a failed import.
   */
  try {
    const historyPayload =
      {
        filename:
          report.filename,

        uploaded_by:
          userId,

        organisation_id:
          organisationId,

        upload_date:
          new Date()
            .toISOString(),

        duration:
          report.durationMs,

        rows_processed:
          report.rowsProcessed,

        rows_inserted:
          report.rowsInserted,

        rows_updated:
          report.rowsUpdated,

        rows_failed:
          report.rowsFailed,

        import_status:
          report.status,
      };

    const {
      error,
    } =
      await supabase
        .from(
          "import_history"
        )
        .insert(
          historyPayload
        );

    if (
      error
    ) {
      console.warn(
        "[TOTS IMPORT] Import history could not be saved:",
        {
          message:
            error.message,

          code:
            error.code,

          details:
            error.details,

          hint:
            error.hint,
        }
      );
    }
  } catch (
    error:
      unknown
  ) {
    const message =
      error instanceof
        Error
        ? error.message
        : String(
            error
          );

    console.warn(
      "[TOTS IMPORT] Import history is unavailable:",
      message
    );
  }

  return report;
}