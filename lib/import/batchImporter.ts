// ==========================================
// 9. lib/import/batchImporter.ts
// ==========================================

import { ProcessedRow, DuplicateResolutionStrategy, BatchImportResult } from "./types";
import { UNIQUE_KEYS } from "./constants";
import { resolveRelationships } from "./relationshipResolver";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function processBatches(
  rows: ProcessedRow[],
  supabase: any,
  orgId: string | null,
  strategy: DuplicateResolutionStrategy,
  onBatchProgress: (current: number, total: number) => void
): Promise<BatchImportResult> {
  const resolvedRows = await resolveRelationships(rows, supabase, orgId);

  // Group by target table
  const grouped: Record<string, ProcessedRow[]> = {};
  resolvedRows.forEach(row => {
    if (!grouped[row.targetTable]) grouped[row.targetTable] = [];
    grouped[row.targetTable].push(row);
  });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failedRows: ProcessedRow[] = [];

  let totalBatches = Object.values(grouped).reduce((acc, curr) => acc + Math.ceil(curr.length / 500), 0);
  let currentBatchIndex = 0;

  for (const [table, tableRows] of Object.entries(grouped)) {
    const batches = chunkArray(tableRows, 500);
    const uniqueFields = UNIQUE_KEYS[table] || ['id'];

    for (const batch of batches) {
      currentBatchIndex++;
      onBatchProgress(currentBatchIndex, totalBatches);

      if (strategy === 'skip') {
        // Insert ignoring conflicts if possible, or standard insert
        const { error } = await supabase.from(table).insert(batch.map(b => b.payload));
        if (error) {
          failed += batch.length;
          failedRows.push(...batch);
        } else {
          inserted += batch.length;
        }
      } else {
        // Upsert strategy
        const { error } = await supabase.from(table).upsert(
          batch.map(b => b.payload),
          { onConflict: uniqueFields.join(',') }
        );

        if (error) {
          failed += batch.length;
          failedRows.push(...batch);
        } else {
          inserted += batch.length;
        }
      }
    }
  }

  return { inserted, updated, skipped, failed, failedRows };
}