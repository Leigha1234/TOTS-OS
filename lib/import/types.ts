// ==========================================
// lib/import/types.ts
// ==========================================

// ============================================================
// SHARED VALUE TYPES
// ============================================================

export type ImportCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export interface RawRow {
  [key: string]: any;
}

export type ImportPayload =
  Record<
    string,
    any
  >;

// ============================================================
// IMPORT STATUS
// ============================================================

export type ImportStatus =
  | "idle"
  | "reading"
  | "detecting"
  | "validating"
  | "checking_duplicates"
  | "processing"
  | "importing"
  | "finishing"
  | "success"
  | "error";

// ============================================================
// DUPLICATE HANDLING
// ============================================================

export type DuplicateResolutionStrategy =
  | "update"
  | "skip"
  | "create";

export type DuplicateSource =
  | "file"
  | "database";

// ============================================================
// TARGET TABLES
// ============================================================

export type TargetTableType =
  | "auto"
  | "contacts"
  | "organisations"
  | "invoices"
  | "expenses"
  | "projects";

/**
 * A ProcessedRow can never actually target "auto".
 *
 * "auto" only exists while the user/import engine is deciding
 * where the source data belongs.
 */
export type ResolvedTargetTable =
  Exclude<
    TargetTableType,
    "auto"
  >;

// ============================================================
// PROCESSED ROW
// ============================================================

export interface ProcessedRow {
  /**
   * Import-local identifier.
   *
   * This is not necessarily the database record ID.
   */
  id: string;

  /**
   * Final table selected by the import detector.
   */
  targetTable:
    ResolvedTargetTable;

  /**
   * Canonicalised data prepared for validation/import.
   */
  payload:
    ImportPayload;

  /**
   * Original source row.
   *
   * Keep this intact for:
   * - previews
   * - failed row exports
   * - audit/debugging
   * - future fan-out
   */
  rawPayload:
    RawRow;

  isValid:
    boolean;

  validationErrors:
    string[];

  /**
   * Duplicate information is separate from validation.
   *
   * A duplicate can still be a perfectly valid record.
   */
  isDuplicate?:
    boolean;

  duplicateSource?:
    DuplicateSource;
}

// ============================================================
// VALIDATION
// ============================================================

export interface ValidationResult {
  valid:
    ProcessedRow[];

  invalid:
    ProcessedRow[];
}

// ============================================================
// DUPLICATE CHECKING
// ============================================================

export interface DuplicateResult {
  /**
   * Includes valid records that should continue into duplicate
   * strategy handling.
   *
   * Duplicate rows remain here because batchImporter decides
   * whether to update, skip or create them.
   */
  recordsToProcess:
    ProcessedRow[];

  duplicates:
    ProcessedRow[];
}

// ============================================================
// BATCH IMPORT RESULT
// ============================================================

export interface BatchImportResult {
  inserted:
    number;

  updated:
    number;

  skipped:
    number;

  failed:
    number;

  failedRows:
    ProcessedRow[];
}

// ============================================================
// IMPORT REPORT
// ============================================================

export type ImportReportStatus =
  | "success"
  | "partial"
  | "failed";

export interface ImportReport {
  id?:
    string;

  filename:
    string;

  durationMs:
    number;

  rowsProcessed:
    number;

  rowsInserted:
    number;

  rowsUpdated:
    number;

  rowsSkipped:
    number;

  rowsFailed:
    number;

  duplicatesFound:
    number;

  status:
    ImportReportStatus;
}

// ============================================================
// PROGRESS
// ============================================================

export interface ImportProgress {
  phase:
    string;

  percent:
    number;

  currentBatch:
    number;

  totalBatches:
    number;

  processedRows:
    number;

  elapsedMs:
    number;

  etaMs:
    number;
}

// ============================================================
// IMPORT SUMMARY
// ============================================================

export interface ImportSummary {
  totalRows:
    number;

  validRows:
    number;

  invalidRows:
    number;

  duplicateRows:
    number;

  targetCounts:
    Partial<
      Record<
        ResolvedTargetTable,
        number
      >
    >;
}