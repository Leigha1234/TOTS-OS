// ==========================================
// 8. lib/import/relationshipResolver.ts
// ==========================================

import { ProcessedRow } from "./types";

export async function resolveRelationships(
  rows: ProcessedRow[],
  supabase: any,
  orgId: string | null
): Promise<ProcessedRow[]> {
  // Automatically ensure parent organisations or linked entities exist if referenced by name
  for (const row of rows) {
    if (row.targetTable === 'contacts' && row.payload.company_name && orgId) {
      try {
        // Check if company exists using maybeSingle() to avoid PGRST116 multiple rows / zero rows exceptions
        const { data: existingCompany } = await supabase
          .from('organisations')
          .select('id')
          .eq('company_name', row.payload.company_name)
          .eq('organisation_id', orgId)
          .maybeSingle();

        if (!existingCompany) {
          const { data: newCompany, error: insertError } = await supabase
            .from('organisations')
            .insert({
              company_name: row.payload.company_name,
              organisation_id: orgId
            })
            .select('id')
            .single();

          if (!insertError && newCompany) {
            row.payload.company_id = newCompany.id;
          }
        } else {
          row.payload.company_id = existingCompany.id;
        }
      } catch (err) {
        // Silent catch for soft FK auto-creation fallback
      }
    }
  }
  return rows;
}