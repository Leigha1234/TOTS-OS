// ==========================================
// lib/import/recordDetector.ts
// ==========================================

import { RawRow, ProcessedRow, TargetTableType } from "./types";

export function detectRecords(
  rawRows: RawRow[], 
  targetTableOverride: TargetTableType, 
  orgId: string | null, 
  userId: string
): ProcessedRow[] {
  return rawRows.map((row, index) => {
    // Determine target table
    let targetTable = targetTableOverride;
    if (targetTable === 'auto' || targetTable === 'companies') {
      const keys = Object.keys(row).map(k => k.toLowerCase());
      if (keys.some(k => k.includes('email') || k.includes('phone') || k.includes('name'))) {
        targetTable = 'contacts' as TargetTableType;
      } else if (keys.some(k => k.includes('invoice') || k.includes('amount'))) {
        targetTable = 'invoices' as TargetTableType;
      } else if (keys.some(k => k.includes('project') || k.includes('task'))) {
        targetTable = 'projects' as TargetTableType;
      } else {
        targetTable = 'organisations' as TargetTableType;
      }
    }

    // Map fields securely
    const payload: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '_');
      
      if (['name', 'full_name', 'contact_name'].includes(cleanKey)) payload.name = val;
      else if (['email', 'email_address'].includes(cleanKey)) payload.email = val;
      else if (['phone', 'telephone', 'mobile'].includes(cleanKey)) payload.phone = val;
      else if (['company', 'organisation', 'company_name', 'org_name'].includes(cleanKey)) payload.company_name = val;
      else if (['role', 'job_title', 'position'].includes(cleanKey)) payload.role = val;
      else if (['amount', 'total', 'value'].includes(cleanKey)) payload.amount = val ? parseFloat(val) : null;
      else if (['status'].includes(cleanKey)) payload.status = val;
      else if (['description', 'notes', 'memo'].includes(cleanKey)) payload.description = val;
      else {
        payload[cleanKey] = val;
      }
    }

    if (orgId) payload.organisation_id = orgId;

    return {
      id: `row_${index + 1}`,
      targetTable: targetTable === 'companies' ? 'organisations' : targetTable,
      payload,
      rawPayload: row,
      isValid: true,
      validationErrors: []
    };
  });
}