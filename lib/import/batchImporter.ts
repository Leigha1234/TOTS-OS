// lib/import/batchImporter.ts
// Safer, workspace-scoped importer. Requires appropriate RLS policies.
import { BATCH_CONFIG, UNIQUE_KEYS } from "./constants";
import { BatchImportResult, DuplicateResolutionStrategy, ProcessedRow } from "./types";

type Payload = Record<string, unknown>;
type DBRecord = Record<string, any>;
type Action = "inserted" | "updated" | "skipped";
type CustomerResolution = { customer: DBRecord; created: boolean };

const ALLOWED_COLUMNS: Record<string, string[]> = {
  contacts: ["organisation_id", "name", "email", "phone", "address", "company_name", "company_details", "role", "website", "attachments", "customer_id"],
  organisations: ["name", "email", "phone", "website", "address", "status", "notes", "date_closed"],
  invoices: ["customer_id", "amount", "status", "link", "type", "items", "tax", "doc_type", "recurring", "interval", "due_date", "team_id", "data", "organisation_id", "project_id", "invoice_number", "invoice_date", "amount_paid", "balance_due", "currency", "source"],
};
const hasValue = (v: unknown) => v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "");
const str = (v: unknown) => hasValue(v) ? String(v).trim() : "";
const email = (v: unknown) => str(v).toLowerCase();
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phone = (v: unknown) => str(v).replace(/[^\d]/g, "");
const lookupKey = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
function field(o: Payload | null | undefined, aliases: string[]): unknown {
  if (!o) return undefined;
  for (const alias of aliases) {
    const entry = Object.entries(o).find(([k, v]) => lookupKey(k) === lookupKey(alias) && hasValue(v));
    if (entry) return entry[1];
  }
  return undefined;
}
function clean(source: Payload): Payload {
  return Object.fromEntries(Object.entries(source).filter(([,v]) => hasValue(v)).map(([k,v]) => [k, typeof v === "string" ? v.trim() : v]));
}
function allow(table: string, source: Payload): Payload {
  const allowed = ALLOWED_COLUMNS[table];
  return allowed ? Object.fromEntries(Object.entries(source).filter(([k,v]) => allowed.includes(k) && hasValue(v))) : source;
}
function number(v: unknown): number | null {
  if (!hasValue(v)) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const raw = str(v).replace(/[\s,£$€]/g, "");
  const neg = raw.startsWith("(") && raw.endsWith(")");
  const parsed = Number(raw.replace(/[()]/g, ""));
  return Number.isFinite(parsed) && raw !== "" ? (neg ? -Math.abs(parsed) : parsed) : null;
}
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const x = e as Record<string, unknown>;
    return [x.message, x.details, x.hint, x.code].map(str).filter(Boolean).join(" — ") || "Database operation failed";
  }
  return str(e) || "Database operation failed";
}
function retryable(e: unknown): boolean {
  return /network|fetch failed|failed to fetch|connection was lost|timeout|timed out|\b502\b|\b503\b|\b504\b/i.test(errorMessage(e));
}
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
// Retries are restricted to reads. Replaying an uncertain write can duplicate records.
async function retryRead<T>(op: () => Promise<T>): Promise<T> {
  const retries = Math.min(5, Math.max(0, Number(BATCH_CONFIG.MAX_RETRIES ?? 3) || 0));
  const delay = Math.max(250, Number(BATCH_CONFIG.RETRY_DELAY_MS ?? 1000) || 1000);
  for (let attempt = 0;; attempt++) {
    try { return await op(); }
    catch (e) {
      if (attempt >= retries || !retryable(e)) throw e;
      await wait(delay * (attempt + 1));
    }
  }
}
function contactPayload(source: Payload, orgId: string): Payload {
  const p = clean(source);
  const name = str(field(p, ["name", "full_name", "full name", "contact_name", "contact name"])) ||
    [field(p, ["first_name", "firstname", "firstName"]), field(p, ["last_name", "lastname", "surname", "lastName"])].map(str).filter(Boolean).join(" ");
  const result: Payload = {
    organisation_id: orgId,
    name,
    email: email(field(p, ["email", "email address", "email_address"])),
    phone: str(field(p, ["phone", "phone number", "phone_number", "mobile", "telephone", "contact number"])),
    address: str(field(p, ["address", "address_line_1", "address1"])),
    company_name: str(field(p, ["company_name", "company", "business_name", "business", "organisation", "organization"])),
    role: str(field(p, ["role", "position", "job_title", "jobTitle"])),
    website: str(field(p, ["website", "domain"])),
    company_details: p.company_details,
    attachments: p.attachments,
  };
  if (!name) throw new Error("Contact has no name. Correct the source row before importing.");
  if (result.email && !validEmail(str(result.email))) {
    // Preserve the original invalid email in the failed CSV, not the database.
    throw new Error(`Invalid contact email format. Correct the email in the source row before importing.`);
  }
  return allow("contacts", result);
}
function organisationPayload(source: Payload): Payload {
  const p = clean(source);
  const name = str(field(p, ["name", "company_name", "company", "organisation_name", "organization_name", "organisation", "organization", "business_name"]));
  if (!name) throw new Error("Organisation name is required.");
  const result: Payload = {
    name, email: email(p.email), phone: p.phone, website: p.website ?? p.domain,
    address: p.address, status: p.status, notes: p.notes ?? p.description,
    date_closed: p.date_closed,
  };
  if (result.email && !validEmail(str(result.email))) throw new Error("Invalid organisation email format.");
  return allow("organisations", result);
}
function invoicePayload(row: ProcessedRow, orgId: string): Payload {
  const p = clean(row.payload as Payload);
  const raw = clean((row.rawPayload ?? {}) as Payload);
  const result: Payload = {
    organisation_id: orgId,
    invoice_number: p.invoice_number,
    amount: number(p.amount), tax: number(p.tax), status: p.status,
    due_date: p.due_date, link: p.link, type: p.type ?? "invoice",
    doc_type: p.doc_type ?? "invoice", items: p.items,
    recurring: p.recurring, interval: p.interval, project_id: p.project_id,
    invoice_date: p.invoice_date, amount_paid: number(p.amount_paid),
    balance_due: number(p.balance_due), currency: p.currency,
    source: p.source ?? "import_hub",
    data: {
      ...(p.data && typeof p.data === "object" && !Array.isArray(p.data) ? p.data as Payload : {}),
      source_record: raw,
      import_metadata: { source: "import_hub", target: "invoices", imported_at: new Date().toISOString() },
    },
  };
  return allow("invoices", result);
}
function genericPayload(row: ProcessedRow, orgId: string): Payload {
  const p = clean(row.payload as Payload);
  delete p.id;
  delete p.created_by;
  delete p.organisation_id;
  return { ...p, organisation_id: orgId };
}
function prepare(row: ProcessedRow, orgId: string): Payload {
  if (row.targetTable === "contacts") return contactPayload(row.payload as Payload, orgId);
  if (row.targetTable === "organisations") return organisationPayload(row.payload as Payload);
  if (row.targetTable === "invoices") return invoicePayload(row, orgId);
  return genericPayload(row, orgId);
}
function uniqueKeys(table: string): string[] {
  const v = UNIQUE_KEYS[table];
  return !v ? [] : Array.isArray(v) ? v : [v];
}
async function matches(table: string, criteria: Payload, supabase: any, orgId: string, limit = 2): Promise<DBRecord[]> {
  return retryRead(async () => {
    let query = supabase.from(table).select("*");
    // Organisations may be global in this schema. Never use external organisation_id.
    if (table !== "organisations") query = query.eq("organisation_id", orgId);
    for (const [key, value] of Object.entries(criteria)) {
      query = key === "email" ? query.ilike(key, email(value)) : query.eq(key, value);
    }
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  });
}
function singleMatch(records: DBRecord[], context: string): DBRecord | null {
  if (records.length > 1) throw new Error(`Ambiguous ${context}: multiple records match. Review manually; nothing was updated.`);
  return records[0] ?? null;
}
async function existingContact(p: Payload, db: any, orgId: string): Promise<DBRecord | null> {
  const e = email(p.email);
  if (e) {
    const found = singleMatch(await matches("contacts", { email: e }, db, orgId), "contact email");
    if (found) {
      const incomingName = str(p.name).toLowerCase();
      const storedName = str(found.name).toLowerCase();
      if (incomingName && storedName && incomingName !== storedName) {
        throw new Error("Email matches an existing contact with a different name. Manual review required.");
      }
      return found;
    }
  }
  const n = str(p.name);
  const ph = phone(p.phone);
  if (!n || ph.length < 7) return null;
  const candidates = await matches("contacts", { name: n }, db, orgId, 1000);
  const found = candidates.filter(x => phone(x.phone) === ph);
  return singleMatch(found, "contact name and phone");
}
async function existingCustomer(p: Payload, db: any, orgId: string): Promise<DBRecord | null> {
  const e = email(p.email);
  if (e) {
    const found = singleMatch(await matches("customers", { email: e }, db, orgId), "customer email");
    if (found) {
      if (str(p.name) && str(found.name) && str(p.name).toLowerCase() !== str(found.name).toLowerCase()) {
        throw new Error("Email matches a customer with a different name. Manual review required.");
      }
      return found;
    }
  }
  const n = str(p.name), ph = phone(p.phone);
  if (!n || ph.length < 7) return null;
  const candidates = await matches("customers", { name: n }, db, orgId, 1000);
  return singleMatch(candidates.filter(x => phone(x.phone) === ph), "customer name and phone");
}
async function customerById(id: unknown, db: any, orgId: string): Promise<DBRecord | null> {
  if (!str(id)) return null;
  return singleMatch(await matches("customers", { id: str(id) }, db, orgId), "linked customer");
}
function newCustomerPayload(p: Payload, orgId: string): Payload {
  return clean({
    organisation_id: orgId, stage: "client", client_type: "client", status: "live",
    tags: ["CRM", "Imported"], on_mailing_list: false, mailing_list_category: "General",
    updated_at: new Date().toISOString(), name: p.name, email: p.email, phone: p.phone,
    company: p.company_name, address: p.address,
  });
}
function customerUpdatePayload(p: Payload): Payload {
  return clean({ name: p.name, email: p.email, phone: p.phone,
    company: p.company_name, address: p.address, updated_at: new Date().toISOString() });
}
async function insert(table: string, p: Payload, db: any): Promise<DBRecord> {
  // Never automatically retry a write after an uncertain network response.
  const { data, error } = await db.from(table).insert(p).select("*").single();
  if (error) throw error;
  if (!data?.id) throw new Error(`${table} insert did not return a confirmed record ID. Verify the database before retrying.`);
  return data;
}
async function update(table: string, existing: DBRecord, p: Payload, db: any, orgId: string): Promise<DBRecord> {
  if (!existing.id) throw new Error(`Existing ${table} record has no ID.`);
  const updatePayload = { ...p };
  delete updatePayload.id;
  delete updatePayload.created_at;
  let query = db.from(table).update(updatePayload).eq("id", existing.id);
  if (table !== "organisations") query = query.eq("organisation_id", orgId);
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  if (!data?.id) throw new Error(`${table} update was not confirmed. Verify the database before retrying.`);
  return data;
}
async function cleanupCustomer(id: unknown, db: any, orgId: string) {
  if (!str(id)) return;
  try {
    const { error } = await db.from("customers").delete().eq("id", str(id)).eq("organisation_id", orgId);
    if (error) console.warn("[TOTS IMPORT] Customer cleanup requires review:", errorMessage(error));
  } catch (e) { console.warn("[TOTS IMPORT] Customer cleanup requires review:", errorMessage(e)); }
}
async function resolveCustomer(p: Payload, linkedContact: DBRecord | null, db: any, orgId: string, strategy: DuplicateResolutionStrategy): Promise<CustomerResolution> {
  if (strategy !== "create" && linkedContact?.customer_id) {
    const linked = await customerById(linkedContact.customer_id, db, orgId);
    if (linked) return { customer: linked, created: false };
  }
  if (strategy !== "create") {
    const found = await existingCustomer(p, db, orgId);
    if (found) return { customer: found, created: false };
  }
  return { customer: await insert("customers", newCustomerPayload(p, orgId), db), created: true };
}
async function processContact(row: ProcessedRow, db: any, orgId: string, strategy: DuplicateResolutionStrategy): Promise<Action> {
  const p = contactPayload(row.payload as Payload, orgId);
  const found = await existingContact(p, db, orgId);
  if (strategy === "skip" && found) return "skipped";
  if (strategy === "create" && found && email(p.email)) {
    throw new Error("Create would duplicate an existing contact email. Use Update or Skip.");
  }
  const resolution = await resolveCustomer(p, found, db, orgId, strategy);
  try {
    const contact = { ...p, customer_id: resolution.customer.id, organisation_id: orgId, updated_at: new Date().toISOString() };
    const action: Action = found && strategy !== "create" ? "updated" : "inserted";
    if (action === "updated") await update("contacts", found!, contact, db, orgId);
    else await insert("contacts", contact, db);
    // Update the linked customer only after the contact write succeeded.
    // This avoids modifying an existing customer when the contact write fails.
    if (action === "updated" && strategy === "update" && !resolution.created) {
      try { await update("customers", resolution.customer, customerUpdatePayload(p), db, orgId); }
      catch (e) { console.warn("[TOTS IMPORT] Contact saved but customer sync needs review:", errorMessage(e)); }
    }
    return action;
  } catch (e) {
    // Cleanup is deliberately not automatic: an uncertain response might mean the
    // contact was committed. Deleting its customer would break that relationship.
    if (resolution.created) console.warn("[TOTS IMPORT] Review possible unlinked customer ID:", resolution.customer.id);
    throw e;
  }
}
function invoiceCustomerPayload(row: ProcessedRow): Payload {
  const raw = (row.rawPayload ?? {}) as Payload;
  const name = str(field(raw, ["Customer Name", "customer_name", "Client Name", "client_name", "Company Name", "company_name", "Contact Name", "contact_name"]));
  return clean({
    name,
    company_name: name,
    email: email(field(raw, ["Primary Contact EmailID", "Primary Contact Email ID", "Primary Contact Email", "Customer Email", "Customer Email Address", "Email", "Email Address", "Contact Email"])),
    phone: field(raw, ["Primary Contact Mobile", "Primary Contact Phone", "Customer Phone", "Billing Phone", "Phone", "Mobile", "Telephone"]),
    address: field(raw, ["Billing Address", "Customer Address", "Address", "Billing Address 1", "Billing Street"]),
  });
}
async function existingInvoice(p: Payload, db: any, orgId: string): Promise<DBRecord | null> {
  const keys = uniqueKeys("invoices");
  if (!keys.length || keys.some(k => !hasValue(p[k]))) return null;
  return singleMatch(await matches("invoices", Object.fromEntries(keys.map(k => [k, p[k]])), db, orgId), "invoice key");
}
async function processInvoice(row: ProcessedRow, db: any, orgId: string, strategy: DuplicateResolutionStrategy): Promise<Action> {
  const p = invoicePayload(row, orgId);
  const found = strategy === "create" ? null : await existingInvoice(p, db, orgId);
  if (found && strategy === "skip") return "skipped";
  const customerSource = invoiceCustomerPayload(row);
  let resolution: CustomerResolution | null = null;
  if (customerSource.name || customerSource.email || customerSource.phone) {
    const existing = await existingCustomer(customerSource, db, orgId);
    resolution = existing ? { customer: existing, created: false } :
      { customer: await insert("customers", newCustomerPayload(customerSource, orgId), db), created: true };
    p.customer_id = resolution.customer.id;
  }
  try {
    if (found) { await update("invoices", found, p, db, orgId); return "updated"; }
    await insert("invoices", p, db);
    return "inserted";
  } catch (e) {
    if (resolution?.created) console.warn("[TOTS IMPORT] Review possible unlinked invoice customer ID:", resolution.customer.id);
    throw e;
  }
}
async function processGeneric(row: ProcessedRow, db: any, orgId: string, strategy: DuplicateResolutionStrategy): Promise<Action> {
  const table = str(row.targetTable);
  // Prevent unexpected arbitrary table writes through Auto-Detect.
  if (!["organisations", "expenses", "projects"].includes(table)) throw new Error(`Unsupported import destination: ${table}`);
  const p = prepare(row, orgId);
  if (!Object.keys(p).length) throw new Error(`No supported fields for ${table}.`);
  if (strategy === "create") { await insert(table, p, db); return "inserted"; }
  const keys = uniqueKeys(table);
  const found = keys.length && keys.every(k => hasValue(p[k]))
    ? singleMatch(await matches(table, Object.fromEntries(keys.map(k => [k, p[k]])), db, orgId), `${table} key`)
    : null;
  if (found && strategy === "skip") return "skipped";
  if (found) { await update(table, found, p, db, orgId); return "updated"; }
  await insert(table, p, db);
  return "inserted";
}
function appendFailure(result: BatchImportResult, row: ProcessedRow, e: unknown) {
  const message = errorMessage(e);
  result.failed++;
  result.failedRows.push({ ...row, isValid: false, validationErrors: [...(row.validationErrors ?? []), message] });
  // Avoid logging raw payloads: imports can contain health and other sensitive data.
  console.error("[TOTS IMPORT] Row failed:", { table: row.targetTable, rowId: row.id, message });
}
export async function processBatches(
  rows: ProcessedRow[], db: any, orgId: string | null,
  strategy: DuplicateResolutionStrategy,
  onProgress?: (batchNumber: number, totalBatches: number) => void
): Promise<BatchImportResult> {
  const result: BatchImportResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] };
  if (!rows.length) return result;
  if (!orgId) throw new Error("An active organisation is required before importing.");
  if (!["update", "skip", "create"].includes(strategy)) throw new Error("Unsupported duplicate strategy.");
  const configured = Number(BATCH_CONFIG.DEFAULT_BATCH_SIZE);
  const batchSize = Math.min(100, Math.max(1, Number.isFinite(configured) ? configured : 50));
  const total = Math.ceil(rows.length / batchSize);
  for (let i = 0; i < total; i++) {
    for (const row of rows.slice(i * batchSize, (i + 1) * batchSize)) {
      try {
        const action = row.targetTable === "contacts"
          ? await processContact(row, db, orgId, strategy)
          : row.targetTable === "invoices"
            ? await processInvoice(row, db, orgId, strategy)
            : await processGeneric(row, db, orgId, strategy);
        result[action]++;
      } catch (e) { appendFailure(result, row, e); }
    }
    onProgress?.(i + 1, total);
  }
  return result;
}
