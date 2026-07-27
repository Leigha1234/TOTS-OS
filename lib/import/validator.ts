// ==========================================
// 6. lib/import/validator.ts
// ==========================================

import { ProcessedRow, ValidationResult } from "./types";

export function validateRows(rows: ProcessedRow[]): ValidationResult {
  const valid: ProcessedRow[] = [];
  const invalid: ProcessedRow[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;

  for (const row of rows) {
    const errors: string[] = [];
    const payload = row.payload;

    // Empty row check
    const hasValues = Object.entries(payload).some(([k, v]) => k !== 'organisation_id' && v !== null && v !== undefined && v !== '');
    if (!hasValues) {
      errors.push("Row is completely empty.");
    }

    // Email validation
    if (payload.email && !emailRegex.test(payload.email)) {
      errors.push(`Invalid email format: ${payload.email}`);
    }

    // Phone validation
    if (payload.phone && !phoneRegex.test(payload.phone)) {
      errors.push(`Invalid phone number format: ${payload.phone}`);
    }

    // Amount validation
    if (payload.amount !== undefined && (isNaN(payload.amount) || payload.amount < 0)) {
      errors.push(`Invalid numerical amount: ${payload.amount}`);
    }

    if (errors.length > 0) {
      invalid.push({ ...row, isValid: false, validationErrors: errors });
    } else {
      valid.push({ ...row, isValid: true, validationErrors: [] });
    }
  }

  return { valid, invalid };
}