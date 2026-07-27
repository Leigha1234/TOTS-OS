// ==========================================
// 1. lib/import/types.ts
// ==========================================

export type ImportStatus = 'idle' | 'reading' | 'detecting' | 'validating' | 'checking_duplicates' | 'importing' | 'finishing' | 'success' | 'error';

export type DuplicateResolutionStrategy = 'update' | 'skip' | 'create';

export type TargetTableType = 'auto' | 'contacts' | 'companies' | 'invoices' | 'expenses' | 'projects';

export interface RawRow {
  [key: string]: any;
}

export interface ProcessedRow {
  id: string;
  targetTable: string;
  payload: Record<string, any>;
  rawPayload: Record<string, any>;
  isValid: boolean;
  validationErrors: string[];
  isDuplicate?: boolean;
}

export interface ValidationResult {
  valid: ProcessedRow[];
  invalid: ProcessedRow[];
}

export interface DuplicateResult {
  recordsToProcess: ProcessedRow[];
  duplicates: ProcessedRow[];
}

export interface BatchImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  failedRows: ProcessedRow[];
}

export interface ImportReport {
  id?: string;
  filename: string;
  durationMs: number;
  rowsProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  rowsFailed: number;
  duplicatesFound: number;
  status: 'success' | 'partial' | 'failed';
}