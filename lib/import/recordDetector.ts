// ==========================================
// lib/import/recordDetector.ts
// ==========================================

import { ProcessedRow, RawRow, TargetTableType } from "./types";
import { findMappedValue } from "./fieldMapper";

type ResolvedTargetTable = Exclude<TargetTableType, "auto">;
type DetectionScores = Record<ResolvedTargetTable, number>;
type Payload = Record<string, unknown>;

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined &&
    (typeof value !== "string" || value.trim() !== "");
}

function stringValue(value: unknown): string {
  return hasValue(value) ? String(value).trim() : "";
}

function normaliseHeader(value: unknown): string {
  return String(value ?? "")
    .trim().toLowerCase().replace(/[._\-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function normalisePayloadKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseAmount(value: unknown): number | null {
  if (!hasValue(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim().replace(/\s/g, "").replace(/,/g, "")
    .replace(/[£$€]/g, "");
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const cleaned = raw.replace(/[()]/g, "");
  if (!cleaned || !/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? (negative ? -Math.abs(parsed) : parsed) : null;
}

function addIfPresent(payload: Payload, key: string, value: unknown): void {
  if (hasValue(value)) payload[key] = typeof value === "string" ? value.trim() : value;
}

function mapped(row: RawRow, key: string): unknown {
  return findMappedValue(row, key);
}

function getHeaders(rows: RawRow[]): string[] {
  const headers = new Set<string>();
  for (const row of rows.slice(0, 25)) {
    for (const key of Object.keys(row)) {
      const normalised = normaliseHeader(key);
      if (normalised) headers.add(normalised);
    }
  }
  return [...headers];
}

function headerContains(headers: string[], terms: string[]): boolean {
  return headers.some(header => terms.some(term => {
    const needle = normaliseHeader(term);
    return header === needle || header.includes(needle);
  }));
}

function countHeaderMatches(headers: string[], terms: string[]): number {
  return terms.filter(term => headerContains(headers, [term])).length;
}

/**
 * Detect sensitive form/consultation exports BEFORE mapping to ordinary CRM tables.
 * This is intentionally a fail-closed guard, not a destination for health records.
 * Only column HEADERS are inspected; no personal or medical answers are logged.
 */
function isSensitiveConsultationExport(headers: string[]): boolean {
  const strongIndicators = [
    "medical history", "medical conditions", "health conditions",
    "current medication", "medications", "medication list",
    "allergies", "allergy details", "contraindications",
    "pregnancy status", "are you pregnant", "injuries or illnesses",
    "treatment consent", "informed consent", "consent to treatment",
    "gp details", "general practitioner", "date of birth",
    "patient history", "health questionnaire", "consultation form",
    "client consultation", "health declaration",
  ];
  const contextualIndicators = [
    "pain level", "pain score", "previous surgery", "recent surgery",
    "symptoms", "diagnosis", "blood pressure", "treatment history",
    "emergency contact", "consent", "health", "injury", "medication",
  ];
  const strong = countHeaderMatches(headers, strongIndicators);
  const contextual = countHeaderMatches(headers, contextualIndicators);
  // One unambiguous medical field, or multiple weaker health-form indicators.
  // DOB or allergies alone can appear in benign exports: require corroboration.
  const standalone = strongIndicators.filter(term =>
    !["date of birth", "allergies", "allergy details"].includes(term)
  );
  return headerContains(headers, standalone) || strong >= 2 || contextual >= 3;
}

function detectTargetTable(rawRows: RawRow[]): ResolvedTargetTable {
  const headers = getHeaders(rawRows);
  const scores: DetectionScores = {
    contacts: 0, organisations: 0, invoices: 0, expenses: 0, projects: 0,
  };

  scores.invoices += countHeaderMatches(headers,
    ["invoice number", "invoice no", "invoice id", "invoice reference"]) * 8;
  scores.invoices += countHeaderMatches(headers,
    ["invoice date", "due date", "amount due", "balance due"]) * 4;
  scores.invoices += countHeaderMatches(headers,
    ["amount", "total", "subtotal", "vat", "tax"]) * 2;

  scores.expenses += countHeaderMatches(headers,
    ["expense", "expense id", "expense number", "expense date", "receipt", "receipt number"]) * 7;
  scores.expenses += countHeaderMatches(headers,
    ["vendor", "supplier", "merchant", "expense category", "category"]) * 4;
  scores.expenses += countHeaderMatches(headers,
    ["cost", "amount", "vat", "tax"]) * 2;

  scores.projects += countHeaderMatches(headers,
    ["project name", "project id", "project"]) * 7;
  scores.projects += countHeaderMatches(headers,
    ["task", "task name", "deadline", "milestone", "assignee", "assigned to"]) * 4;

  scores.organisations += countHeaderMatches(headers,
    ["company name", "business name", "organisation name", "organization name",
      "company", "organisation", "organization"]) * 6;
  scores.organisations += countHeaderMatches(headers,
    ["website", "company website", "business website", "domain"]) * 4;

  scores.contacts += countHeaderMatches(headers,
    ["first name", "last name", "full name", "contact name", "customer name",
      "client name", "member name"]) * 5;
  scores.contacts += countHeaderMatches(headers,
    ["email", "email address", "phone", "mobile", "telephone"]) * 3;
  scores.contacts += countHeaderMatches(headers, ["job title", "position", "role"]) * 2;

  if (headerContains(headers, ["subscriber"])) scores.contacts += 8;
  if (headerContains(headers, ["opens", "clicks", "subscribed"])) scores.contacts += 3;
  if (headerContains(headers, ["member", "customer email", "customer name"])) scores.contacts += 5;

  if (Math.max(scores.invoices, scores.expenses, scores.projects) >= 8) {
    scores.contacts = Math.max(0, scores.contacts - 4);
  }

  const ordered = (Object.entries(scores) as [ResolvedTargetTable, number][])
    .sort((a, b) => b[1] - a[1]);
  const [bestTarget, bestScore] = ordered[0];

  if (bestScore <= 0) {
    const first = rawRows.find(row => Object.values(row).some(hasValue));
    if (first) {
      if (["email", "phone", "first_name", "last_name", "name"]
        .some(key => hasValue(mapped(first, key)))) return "contacts";
      if (["company_name", "website"]
        .some(key => hasValue(mapped(first, key)))) return "organisations";
    }
    // Don't silently classify an unrecognised dataset as contacts.
    throw new Error(
      "Auto-Detect could not identify a supported record type. Choose a destination manually and review the field mapping."
    );
  }
  return bestTarget;
}

function buildContactPayload(row: RawRow, orgId: string | null): Payload {
  const payload: Payload = {};
  const firstName = stringValue(mapped(row, "first_name"));
  const lastName = stringValue(mapped(row, "last_name"));
  const fullName = stringValue(mapped(row, "name"));
  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();

  // Prefer a complete mapped name when partial first/last fields exist.
  addIfPresent(payload, "name", fullName || combinedName);
  const email = stringValue(mapped(row, "email"));
  if (email) payload.email = email.toLowerCase();
  addIfPresent(payload, "phone", mapped(row, "phone"));
  addIfPresent(payload, "role", mapped(row, "position"));
  addIfPresent(payload, "company_name", mapped(row, "company_name"));
  addIfPresent(payload, "created_at", mapped(row, "created_at"));
  if (orgId) payload.organisation_id = orgId;
  return payload;
}

function buildOrganisationPayload(row: RawRow): Payload {
  const payload: Payload = {};
  addIfPresent(payload, "name", mapped(row, "company_name") ?? mapped(row, "name"));
  const email = stringValue(mapped(row, "email"));
  if (email) payload.email = email.toLowerCase();
  addIfPresent(payload, "phone", mapped(row, "phone"));
  addIfPresent(payload, "website", mapped(row, "website") ?? mapped(row, "domain"));
  addIfPresent(payload, "address", mapped(row, "address"));
  addIfPresent(payload, "status", mapped(row, "status"));
  addIfPresent(payload, "notes", mapped(row, "notes") ?? mapped(row, "description"));
  addIfPresent(payload, "created_at", mapped(row, "created_at"));
  return payload;
}

function buildInvoicePayload(row: RawRow, orgId: string | null): Payload {
  const payload: Payload = {};
  addIfPresent(payload, "invoice_number", mapped(row, "invoice_number"));
  const amount = parseAmount(mapped(row, "amount"));
  if (amount !== null) payload.amount = amount;
  addIfPresent(payload, "invoice_date", mapped(row, "invoice_date") ?? mapped(row, "date"));
  addIfPresent(payload, "due_date", mapped(row, "due_date"));
  addIfPresent(payload, "status", mapped(row, "status"));
  const tax = parseAmount(mapped(row, "tax"));
  if (tax !== null) payload.tax = tax;
  const amountPaid = parseAmount(mapped(row, "amount_paid"));
  if (amountPaid !== null) payload.amount_paid = amountPaid;
  const balanceDue = parseAmount(mapped(row, "balance_due"));
  if (balanceDue !== null) payload.balance_due = balanceDue;
  addIfPresent(payload, "currency", mapped(row, "currency"));
  payload.type = "invoice";
  payload.doc_type = "invoice";
  payload.source = "import_hub";
  if (orgId) payload.organisation_id = orgId;
  // Original invoice row is kept in rawPayload for invoices.data by batchImporter.
  return payload;
}

function copyUnknownSourceFields(row: RawRow, payload: Payload, excludedKeys: string[]): void {
  const excluded = new Set(excludedKeys.map(normalisePayloadKey));
  for (const [rawKey, value] of Object.entries(row)) {
    if (!hasValue(value)) continue;
    const key = normalisePayloadKey(rawKey);
    if (!key || excluded.has(key) || payload[key] !== undefined) continue;
    payload[key] = typeof value === "string" ? value.trim() : value;
  }
}

function buildExpensePayload(row: RawRow, orgId: string | null): Payload {
  const payload: Payload = {};
  const amount = parseAmount(mapped(row, "amount"));
  if (amount !== null) payload.amount = amount;
  addIfPresent(payload, "date", mapped(row, "date"));
  addIfPresent(payload, "category", mapped(row, "category"));
  addIfPresent(payload, "description", mapped(row, "description"));
  addIfPresent(payload, "currency", mapped(row, "currency"));
  const tax = parseAmount(mapped(row, "tax"));
  if (tax !== null) payload.tax = tax;
  addIfPresent(payload, "expense_number", mapped(row, "expense_number"));
  if (orgId) payload.organisation_id = orgId;
  // Retained for backwards compatibility. Generic importer must still validate DB columns.
  copyUnknownSourceFields(row, payload,
    ["amount", "date", "category", "description", "currency", "tax", "expense_number", "organisation_id"]);
  return payload;
}

function buildProjectPayload(row: RawRow, orgId: string | null): Payload {
  const payload: Payload = {};
  addIfPresent(payload, "name", mapped(row, "project_name") ?? mapped(row, "name"));
  addIfPresent(payload, "status", mapped(row, "status"));
  addIfPresent(payload, "description", mapped(row, "description"));
  addIfPresent(payload, "due_date", mapped(row, "due_date"));
  addIfPresent(payload, "company_name", mapped(row, "company_name"));
  if (orgId) payload.organisation_id = orgId;
  // Retained for backwards compatibility. Generic importer must still validate DB columns.
  copyUnknownSourceFields(row, payload,
    ["name", "project_name", "status", "description", "due_date", "company_name", "organisation_id"]);
  return payload;
}

function buildPayload(row: RawRow, target: ResolvedTargetTable, orgId: string | null): Payload {
  switch (target) {
    case "contacts": return buildContactPayload(row, orgId);
    case "organisations": return buildOrganisationPayload(row);
    case "invoices": return buildInvoicePayload(row, orgId);
    case "expenses": return buildExpensePayload(row, orgId);
    case "projects": return buildProjectPayload(row, orgId);
    default: {
      const exhaustive: never = target;
      throw new Error(`Unsupported import target: ${String(exhaustive)}`);
    }
  }
}

export function detectRecords(
  rawRows: RawRow[],
  targetTableOverride: TargetTableType,
  orgId: string | null,
  _userId: string
): ProcessedRow[] {
  if (rawRows.length === 0) return [];

  const headers = getHeaders(rawRows);
  if (isSensitiveConsultationExport(headers)) {
    // Throw BEFORE producing ProcessedRows: no caller can accidentally send
    // a health questionnaire to the ordinary contacts batch importer.
    throw new Error(
      "This spreadsheet appears to contain sensitive health or consultation information. " +
      "TOTS-OS has stopped the import to prevent medical answers being lost or stored in ordinary CRM records. " +
      "Keep the original file secure. Use a dedicated, access-controlled consultation import once configured."
    );
  }

  const target: ResolvedTargetTable = targetTableOverride === "auto"
    ? detectTargetTable(rawRows)
    : targetTableOverride;

  return rawRows.map((row, index): ProcessedRow => ({
    id: `row_${index + 1}`,
    targetTable: target,
    payload: buildPayload(row, target, orgId),
    rawPayload: { ...row },
    isValid: true,
    validationErrors: [],
  }));
}
