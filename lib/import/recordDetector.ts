// ==========================================
// 5. lib/import/recordDetector.ts
// ==========================================

import { ProcessedRow, TargetTableType, RawRow } from "./types";
import { findMappedValue } from "./fieldMapper";

export function detectRecords(
  rawRows: RawRow[], 
  targetTableOverride: TargetTableType, 
  orgId: string | null, 
  userId: string
): ProcessedRow[] {
  return rawRows.map((row, index) => {
    const keys = Object.keys(row).map(k => k.toLowerCase());

    // Weighted scoring to determine best target table if 'auto'
    let targetTable = targetTableOverride;
    if (targetTable === 'auto') {
      let scores = { contacts: 0, companies: 0, projects: 0, invoices: 0, expenses: 0 };

      if (keys.some(k => k.includes('invoice') || k.includes('payment') || k.includes('tax'))) scores.invoices += 5;
      if (keys.some(k => k.includes('expense') || k.includes('receipt') || k.includes('cost'))) scores.expenses += 5;
      if (keys.some(k => k.includes('project') || k.includes('task') || k.includes('milestone'))) scores.projects += 5;
      if (keys.some(k => k.includes('company') || k.includes('organisation') || k.includes('business'))) scores.companies += 5;
      if (keys.some(k => k.includes('email') || k.includes('phone') || k.includes('contact'))) scores.contacts += 5;

      const bestMatch = Object.entries(scores).reduce((max, curr) => curr[1] > max[1] ? curr : max, ['contacts', 0]);
      targetTable = bestMatch[0] as TargetTableType;
    }

    let payload: Record<string, any> = {
      organisation_id: orgId,
    };

    if (targetTable === 'contacts') {
      payload.name = findMappedValue(row, 'name');
      payload.email = findMappedValue(row, 'email');
      payload.phone = findMappedValue(row, 'phone');
      payload.company_name = findMappedValue(row, 'company_name');
      payload.role = findMappedValue(row, 'role');
    } else if (targetTable === 'companies') {
      payload.company_name = findMappedValue(row, 'company_name') || findMappedValue(row, 'name');
      payload.address = findMappedValue(row, 'address');
      payload.postcode = findMappedValue(row, 'postcode');
      payload.city = findMappedValue(row, 'city');
      payload.country = findMappedValue(row, 'country');
    } else if (targetTable === 'invoices') {
      payload.invoice_number = findMappedValue(row, 'invoice_number') || `INV-${Date.now()}-${index}`;
      payload.amount = parseFloat(findMappedValue(row, 'amount')) || 0;
      payload.status = findMappedValue(row, 'status') || 'pending';
      payload.due_date = findMappedValue(row, 'due_date');
    } else if (targetTable === 'expenses') {
      payload.amount = parseFloat(findMappedValue(row, 'amount')) || 0;
      payload.description = findMappedValue(row, 'description') || 'Imported Expense';
      payload.date = findMappedValue(row, 'due_date');
      payload.status = findMappedValue(row, 'status') || 'logged';
    } else if (targetTable === 'projects') {
      payload.name = findMappedValue(row, 'project_name') || findMappedValue(row, 'name') || 'Untitled Project';
      payload.description = findMappedValue(row, 'description');
      payload.status = findMappedValue(row, 'status') || 'planning';
      payload.user_id = userId;
    }

    return {
      id: `row-${index}`,
      targetTable: targetTable === 'auto' ? 'contacts' : targetTable,
      payload,
      rawPayload: row,
      isValid: true,
      validationErrors: []
    };
  });
}