// ==========================================
// lib/import/batchImporter.ts
// ==========================================

import { ProcessedRow, DuplicateResolutionStrategy, BatchImportResult } from "./types";

export async function processBatches(
  records: ProcessedRow[],
  supabase: any,
  orgId: string | null,
  strategy: DuplicateResolutionStrategy,
  onProgress?: (batchNum: number, totalBatches: number) => void
): Promise<BatchImportResult> {
  const batchSize = 50;
  const totalBatches = Math.ceil(records.length / batchSize) || 1;
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failedRows: ProcessedRow[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    try {
      for (const row of batch) {
        const targetTable = row.targetTable;
        let payload = { ...row.payload };

        // Ensure organisation_id is attached if available
        if (orgId && !payload.organisation_id) {
          payload.organisation_id = orgId;
        }

        // Handle Organisation / Company Relationship Resolution
        if (targetTable === 'contacts' && payload.company_name && !payload.organisation_id) {
          // Check if organisation exists or insert it
          let { data: orgMatch } = await supabase
            .from('organisations')
            .select('id')
            .eq('name', payload.company_name)
            .maybeSingle();

          if (!orgMatch) {
            const { data: newOrg, error: orgErr } = await supabase
              .from('organisations')
              .insert({ name: payload.company_name })
              .select('id')
              .single();

            if (!orgErr && newOrg) {
              payload.organisation_id = newOrg.id;
            }
          } else {
            payload.organisation_id = orgMatch.id;
          }
          delete payload.company_name;
        }

        // Dynamically assign conflict column based on table type (e.g. name for organisations, email for contacts)
        let conflictColumn = 'id';
        if (targetTable === 'organisations') {
          conflictColumn = 'name';
        } else if (targetTable === 'contacts') {
          conflictColumn = 'email';
        }

        const { error } = await supabase
          .from(targetTable)
          .upsert(payload, { 
            onConflict: conflictColumn,
            ignoreDuplicates: strategy === 'skip' 
          });

        if (error) {
          console.error("Supabase Import Error Details:", error);
          failed++;
          failedRows.push({ ...row, isValid: false, validationErrors: [...row.validationErrors, error.message] });
        } else {
          inserted++;
        }
      }
    } catch (err: any) {
      console.error("Batch Import Exception:", err);
      failed += batch.length;
      batch.forEach(r => failedRows.push({ ...r, isValid: false, validationErrors: [...r.validationErrors, err.message] }));
    }

    if (onProgress) {
      onProgress(batchNum, totalBatches);
    }
  }

  return { inserted, updated, skipped, failed, failedRows };
}