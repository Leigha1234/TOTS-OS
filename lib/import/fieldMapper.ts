// ==========================================
// 4. lib/import/fieldMapper.ts
// ==========================================

import { COLUMN_ALIASES } from "./constants";
import { RawRow } from "./types";

function normaliseString(str: string): string {
  return str ? str.toString().trim().toLowerCase().replace(/[-_]/g, ' ') : '';
}

export function findMappedValue(row: RawRow, canonicalKey: string): any {
  const aliases = COLUMN_ALIASES[canonicalKey] || [canonicalKey];
  const rowKeys = Object.keys(row);

  for (const alias of aliases) {
    const normAlias = normaliseString(alias);
    const matchedKey = rowKeys.find(k => normaliseString(k) === normAlias);
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }

  // Fuzzy fallback check using substring matching
  for (const alias of aliases) {
    const normAlias = normaliseString(alias);
    const matchedKey = rowKeys.find(k => normaliseString(k).includes(normAlias) || normAlias.includes(normaliseString(k)));
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }

  return null;
}