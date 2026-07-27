// ==========================================
// 7. lib/import/duplicateChecker.ts
// ==========================================

import { ProcessedRow, DuplicateResult } from "./types";
import { UNIQUE_KEYS } from "./constants";

export async function checkDuplicates(
  rows: ProcessedRow[],
  supabase: any,
  orgId: string | null
): Promise<DuplicateResult> {
  const recordsToProcess: ProcessedRow[] = [];
  const duplicates: ProcessedRow[] = [];

  // Track in-file duplicates using a Set map
  const seenKeys = new Set<string>();

  for (const row of rows) {
    const table = row.targetTable;
    const keys = UNIQUE_KEYS[table] || ['name'];
    
    // Build unique lookup fingerprint
    const fingerprint = keys.map(k => row.payload[k]).filter(Boolean).join('|').toLowerCase();

    if (fingerprint && seenKeys.has(fingerprint)) {
      duplicates.push({ ...row, isDuplicate: true });
      recordsToProcess.push({ ...row, isDuplicate: true }); // Marked for strategy handling
    } else {
      if (fingerprint) seenKeys.add(fingerprint);
      recordsToProcess.push(row);
    }
  }

  return { recordsToProcess, duplicates };
}