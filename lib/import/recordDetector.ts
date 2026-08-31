// ==========================================
// lib/import/recordDetector.ts
// ==========================================

import {
  ProcessedRow,
  RawRow,
  TargetTableType,
} from "./types";

import {
  findMappedValue,
} from "./fieldMapper";

// ============================================================
// TYPES
// ============================================================

type ResolvedTargetTable =
  Exclude<
    TargetTableType,
    "auto"
  >;

type DetectionScores =
  Record<
    ResolvedTargetTable,
    number
  >;

// ============================================================
// HELPERS
// ============================================================

function hasValue(
  value: unknown
): boolean {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return false;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim() !==
      ""
    );
  }

  return true;
}

// ============================================================

function stringValue(
  value: unknown
): string {
  if (
    !hasValue(
      value
    )
  ) {
    return "";
  }

  return String(
    value
  ).trim();
}

// ============================================================

function normaliseHeader(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[._\-]+/g,
      " "
    )
    .replace(
      /[^a-z0-9\s]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

// ============================================================

function normalisePayloadKey(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}

// ============================================================

function parseAmount(
  value: unknown
): number | null {
  if (
    !hasValue(
      value
    )
  ) {
    return null;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : null;
  }

  const raw =
    String(
      value
    )
      .trim()
      .replace(
        /\s/g,
        ""
      )
      .replace(
        /,/g,
        ""
      )
      .replace(
        /[£$€]/g,
        ""
      );

  /**
   * Handles accounting-style negatives:
   *
   * (25.00) -> -25.00
   */
  const accountingNegative =
    raw.startsWith(
      "("
    ) &&
    raw.endsWith(
      ")"
    );

  const cleaned =
    raw.replace(
      /[()]/g,
      ""
    );

  const parsed =
    Number(
      cleaned
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null;
  }

  return accountingNegative
    ? -Math.abs(
        parsed
      )
    : parsed;
}

// ============================================================

function cleanEmail(
  value: unknown
): string {
  return stringValue(
    value
  )
    .toLowerCase();
}

// ============================================================

function addIfPresent(
  payload:
    Record<
      string,
      any
    >,

  key:
    string,

  value:
    unknown
) {
  if (
    !hasValue(
      value
    )
  ) {
    return;
  }

  payload[
    key
  ] =
    typeof value ===
    "string"
      ? value.trim()
      : value;
}

// ============================================================

function copyUnknownSourceFields(
  row:
    RawRow,

  payload:
    Record<
      string,
      any
    >,

  excludedKeys:
    string[] = []
) {
  const excluded =
    new Set(
      excludedKeys
        .map(
          normalisePayloadKey
        )
    );

  Object.entries(
    row
  ).forEach(
    ([
      rawKey,
      value,
    ]) => {
      if (
        !hasValue(
          value
        )
      ) {
        return;
      }

      const key =
        normalisePayloadKey(
          rawKey
        );

      if (
        !key ||
        excluded.has(
          key
        )
      ) {
        return;
      }

      if (
        payload[
          key
        ] !==
        undefined
      ) {
        return;
      }

      payload[
        key
      ] =
        typeof value ===
        "string"
          ? value.trim()
          : value;
    }
  );
}

// ============================================================
// HEADER DETECTION
// ============================================================

function getHeaders(
  rows:
    RawRow[]
): string[] {
  const headers =
    new Set<string>();

  /**
   * Inspect several rows rather than only the first one.
   *
   * Some spreadsheet parsers can expose slightly different
   * objects between rows.
   */
  const sample =
    rows.slice(
      0,
      25
    );

  sample.forEach(
    (
      row
    ) => {
      Object.keys(
        row
      ).forEach(
        (
          key
        ) => {
          const normalised =
            normaliseHeader(
              key
            );

          if (
            normalised
          ) {
            headers.add(
              normalised
            );
          }
        }
      );
    }
  );

  return Array.from(
    headers
  );
}

// ============================================================

function headerContains(
  headers:
    string[],

  terms:
    string[]
): boolean {
  return headers.some(
    (
      header
    ) =>
      terms.some(
        (
          term
        ) => {
          const cleanTerm =
            normaliseHeader(
              term
            );

          return (
            header ===
              cleanTerm ||
            header.includes(
              cleanTerm
            )
          );
        }
      )
  );
}

// ============================================================

function countHeaderMatches(
  headers:
    string[],

  terms:
    string[]
): number {
  return terms.reduce(
    (
      count,
      term
    ) =>
      count +
      (
        headerContains(
          headers,
          [
            term,
          ]
        )
          ? 1
          : 0
      ),
    0
  );
}

// ============================================================
// AUTO-DETECTION
// ============================================================

function detectTargetTable(
  rawRows:
    RawRow[]
): ResolvedTargetTable {
  const headers =
    getHeaders(
      rawRows
    );

  const scores:
    DetectionScores = {
    contacts:
      0,

    organisations:
      0,

    invoices:
      0,

    expenses:
      0,

    projects:
      0,
  };

  // ==========================================================
  // INVOICE SIGNALS
  // ==========================================================

  scores.invoices +=
    countHeaderMatches(
      headers,
      [
        "invoice number",
        "invoice no",
        "invoice id",
        "invoice reference",
      ]
    ) *
    8;

  scores.invoices +=
    countHeaderMatches(
      headers,
      [
        "invoice date",
        "due date",
        "amount due",
        "balance due",
      ]
    ) *
    4;

  scores.invoices +=
    countHeaderMatches(
      headers,
      [
        "amount",
        "total",
        "subtotal",
        "vat",
        "tax",
      ]
    ) *
    2;

  // ==========================================================
  // EXPENSE SIGNALS
  // ==========================================================

  scores.expenses +=
    countHeaderMatches(
      headers,
      [
        "expense",
        "expense id",
        "expense number",
        "expense date",
        "receipt",
        "receipt number",
      ]
    ) *
    7;

  scores.expenses +=
    countHeaderMatches(
      headers,
      [
        "vendor",
        "supplier",
        "merchant",
        "expense category",
        "category",
      ]
    ) *
    4;

  scores.expenses +=
    countHeaderMatches(
      headers,
      [
        "cost",
        "amount",
        "vat",
        "tax",
      ]
    ) *
    2;

  // ==========================================================
  // PROJECT SIGNALS
  // ==========================================================

  scores.projects +=
    countHeaderMatches(
      headers,
      [
        "project name",
        "project id",
        "project",
      ]
    ) *
    7;

  scores.projects +=
    countHeaderMatches(
      headers,
      [
        "task",
        "task name",
        "deadline",
        "milestone",
        "assignee",
        "assigned to",
      ]
    ) *
    4;

  // ==========================================================
  // ORGANISATION SIGNALS
  // ==========================================================

  scores.organisations +=
    countHeaderMatches(
      headers,
      [
        "company name",
        "business name",
        "organisation name",
        "organization name",
        "company",
        "organisation",
        "organization",
      ]
    ) *
    6;

  scores.organisations +=
    countHeaderMatches(
      headers,
      [
        "website",
        "company website",
        "business website",
        "domain",
      ]
    ) *
    4;

  // ==========================================================
  // CONTACT SIGNALS
  // ==========================================================

  scores.contacts +=
    countHeaderMatches(
      headers,
      [
        "first name",
        "last name",
        "full name",
        "contact name",
        "customer name",
        "client name",
        "member name",
      ]
    ) *
    5;

  scores.contacts +=
    countHeaderMatches(
      headers,
      [
        "email",
        "email address",
        "phone",
        "mobile",
        "telephone",
      ]
    ) *
    3;

  scores.contacts +=
    countHeaderMatches(
      headers,
      [
        "job title",
        "position",
        "role",
      ]
    ) *
    2;

  // ==========================================================
  // MAILER / SUBSCRIBER SIGNALS
  //
  // TargetTableType does not yet contain a subscribers table,
  // so subscriber exports currently route into CRM contacts.
  //
  // Their original data remains available in rawPayload for
  // later marketing/subscriber fan-out.
  // ==========================================================

  if (
    headerContains(
      headers,
      [
        "subscriber",
      ]
    )
  ) {
    scores.contacts +=
      8;
  }

  if (
    headerContains(
      headers,
      [
        "opens",
        "clicks",
        "subscribed",
      ]
    )
  ) {
    scores.contacts +=
      3;
  }

  // ==========================================================
  // TEAMUP / MEMBER-LIKE SIGNALS
  // ==========================================================

  if (
    headerContains(
      headers,
      [
        "member",
        "customer email",
        "customer name",
      ]
    )
  ) {
    scores.contacts +=
      5;
  }

  // ==========================================================
  // NEGATIVE / CONFLICT SIGNALS
  // ==========================================================

  /**
   * An email column alone must not beat a strongly identified
   * invoice/expense/project file.
   */
  const strongFinanceOrProject =
    Math.max(
      scores.invoices,
      scores.expenses,
      scores.projects
    );

  if (
    strongFinanceOrProject >=
    8
  ) {
    scores.contacts =
      Math.max(
        0,
        scores.contacts -
          4
      );
  }

  // ==========================================================
  // PICK BEST MATCH
  // ==========================================================

  const ordered =
    (
      Object.entries(
        scores
      ) as [
        ResolvedTargetTable,
        number,
      ][]
    ).sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    );

  const [
    bestTarget,
    bestScore,
  ] =
    ordered[
      0
    ];

  // ==========================================================
  // FALLBACK DETECTION USING ACTUAL VALUES
  // ==========================================================

  if (
    bestScore <=
    0
  ) {
    const firstUsefulRow =
      rawRows.find(
        (
          row
        ) =>
          Object.values(
            row
          ).some(
            hasValue
          )
      );

    if (
      firstUsefulRow
    ) {
      const email =
        findMappedValue(
          firstUsefulRow,
          "email"
        );

      const phone =
        findMappedValue(
          firstUsefulRow,
          "phone"
        );

      const firstName =
        findMappedValue(
          firstUsefulRow,
          "first_name"
        );

      const lastName =
        findMappedValue(
          firstUsefulRow,
          "last_name"
        );

      const personName =
        findMappedValue(
          firstUsefulRow,
          "name"
        );

      const companyName =
        findMappedValue(
          firstUsefulRow,
          "company_name"
        );

      const website =
        findMappedValue(
          firstUsefulRow,
          "website"
        );

      if (
        email ||
        phone ||
        firstName ||
        lastName ||
        personName
      ) {
        return "contacts";
      }

      if (
        companyName ||
        website
      ) {
        return "organisations";
      }
    }

    /**
     * Final conservative fallback.
     *
     * A generic unknown file should not automatically create
     * organisations just because the detector could not
     * understand it.
     */
    return "contacts";
  }

  return bestTarget;
}

// ============================================================
// CONTACT PAYLOAD
// ============================================================

function buildContactPayload(
  row:
    RawRow,

  orgId:
    string | null
) {
  const payload:
    Record<
      string,
      any
    > = {};

  const firstName =
    findMappedValue(
      row,
      "first_name"
    );

  const lastName =
    findMappedValue(
      row,
      "last_name"
    );

  const name =
    findMappedValue(
      row,
      "name"
    );

  const email =
    findMappedValue(
      row,
      "email"
    );

  const phone =
    findMappedValue(
      row,
      "phone"
    );

  const position =
    findMappedValue(
      row,
      "position"
    );

  const companyName =
    findMappedValue(
      row,
      "company_name"
    );

  const createdAt =
    findMappedValue(
      row,
      "created_at"
    );

  addIfPresent(
    payload,
    "first_name",
    firstName
  );

  addIfPresent(
    payload,
    "last_name",
    lastName
  );

  /**
   * Keep a combined name only when separate fields were not
   * available.
   *
   * batchImporter.ts will safely split this into first_name /
   * last_name before writing to contacts.
   */
  if (
    !hasValue(
      firstName
    ) &&
    !hasValue(
      lastName
    )
  ) {
    addIfPresent(
      payload,
      "name",
      name
    );
  }

  if (
    hasValue(
      email
    )
  ) {
    payload.email =
      cleanEmail(
        email
      );
  }

  addIfPresent(
    payload,
    "phone",
    phone
  );

  addIfPresent(
    payload,
    "position",
    position
  );

  /**
   * This is temporary relationship metadata.
   *
   * batchImporter.ts deliberately strips company_name from the
   * contacts insert until the proper CRM customer relationship
   * schema is wired in.
   */
  addIfPresent(
    payload,
    "company_name",
    companyName
  );

  addIfPresent(
    payload,
    "created_at",
    createdAt
  );

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  return payload;
}

// ============================================================
// ORGANISATION PAYLOAD
// ============================================================

function buildOrganisationPayload(
  row:
    RawRow
) {
  const payload:
    Record<
      string,
      any
    > = {};

  const companyName =
    findMappedValue(
      row,
      "company_name"
    );

  const genericName =
    findMappedValue(
      row,
      "name"
    );

  const email =
    findMappedValue(
      row,
      "email"
    );

  const phone =
    findMappedValue(
      row,
      "phone"
    );

  const website =
    findMappedValue(
      row,
      "website"
    ) ??
    findMappedValue(
      row,
      "domain"
    );

  const address =
    findMappedValue(
      row,
      "address"
    );

  const status =
    findMappedValue(
      row,
      "status"
    );

  const notes =
    findMappedValue(
      row,
      "notes"
    ) ??
    findMappedValue(
      row,
      "description"
    );

  const createdAt =
    findMappedValue(
      row,
      "created_at"
    );

  /**
   * Explicit company/organisation fields always win over the
   * generic Name field.
   */
  addIfPresent(
    payload,
    "name",
    companyName ??
      genericName
  );

  if (
    hasValue(
      email
    )
  ) {
    payload.email =
      cleanEmail(
        email
      );
  }

  addIfPresent(
    payload,
    "phone",
    phone
  );

  addIfPresent(
    payload,
    "website",
    website
  );

  addIfPresent(
    payload,
    "address",
    address
  );

  addIfPresent(
    payload,
    "status",
    status
  );

  addIfPresent(
    payload,
    "notes",
    notes
  );

  addIfPresent(
    payload,
    "created_at",
    createdAt
  );

  return payload;
}

// ============================================================
// INVOICE PAYLOAD
// ============================================================

function buildInvoicePayload(
  row:
    RawRow,

  orgId:
    string | null
) {
  const payload:
    Record<
      string,
      any
    > = {};

  const invoiceNumber =
    findMappedValue(
      row,
      "invoice_number"
    );

  const amount =
    findMappedValue(
      row,
      "amount"
    );

  const date =
    findMappedValue(
      row,
      "date"
    );

  const dueDate =
    findMappedValue(
      row,
      "due_date"
    );

  const status =
    findMappedValue(
      row,
      "status"
    );

  const description =
    findMappedValue(
      row,
      "description"
    );

  const email =
    findMappedValue(
      row,
      "email"
    );

  const companyName =
    findMappedValue(
      row,
      "company_name"
    );

  addIfPresent(
    payload,
    "invoice_number",
    invoiceNumber
  );

  const parsedAmount =
    parseAmount(
      amount
    );

  if (
    parsedAmount !==
    null
  ) {
    payload.amount =
      parsedAmount;
  }

  addIfPresent(
    payload,
    "date",
    date
  );

  addIfPresent(
    payload,
    "due_date",
    dueDate
  );

  addIfPresent(
    payload,
    "status",
    status
  );

  addIfPresent(
    payload,
    "description",
    description
  );

  if (
    hasValue(
      email
    )
  ) {
    payload.email =
      cleanEmail(
        email
      );
  }

  addIfPresent(
    payload,
    "company_name",
    companyName
  );

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  /**
   * Preserve source-specific invoice fields for now.
   *
   * Once we inspect the invoices schema, batchImporter.ts should
   * receive a strict invoices allowlist just like contacts.
   */
  copyUnknownSourceFields(
    row,
    payload,
    [
      "invoice_number",
      "amount",
      "date",
      "due_date",
      "status",
      "description",
      "email",
      "company_name",
      "organisation_id",
    ]
  );

  return payload;
}

// ============================================================
// EXPENSE PAYLOAD
// ============================================================

function buildExpensePayload(
  row:
    RawRow,

  orgId:
    string | null
) {
  const payload:
    Record<
      string,
      any
    > = {};

  const amount =
    findMappedValue(
      row,
      "amount"
    );

  const date =
    findMappedValue(
      row,
      "date"
    );

  const category =
    findMappedValue(
      row,
      "category"
    );

  const description =
    findMappedValue(
      row,
      "description"
    );

  const currency =
    findMappedValue(
      row,
      "currency"
    );

  const tax =
    findMappedValue(
      row,
      "tax"
    );

  const expenseNumber =
    findMappedValue(
      row,
      "expense_number"
    );

  const parsedAmount =
    parseAmount(
      amount
    );

  if (
    parsedAmount !==
    null
  ) {
    payload.amount =
      parsedAmount;
  }

  addIfPresent(
    payload,
    "date",
    date
  );

  addIfPresent(
    payload,
    "category",
    category
  );

  addIfPresent(
    payload,
    "description",
    description
  );

  addIfPresent(
    payload,
    "currency",
    currency
  );

  const parsedTax =
    parseAmount(
      tax
    );

  if (
    parsedTax !==
    null
  ) {
    payload.tax =
      parsedTax;
  }

  addIfPresent(
    payload,
    "expense_number",
    expenseNumber
  );

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  copyUnknownSourceFields(
    row,
    payload,
    [
      "amount",
      "date",
      "category",
      "description",
      "currency",
      "tax",
      "expense_number",
      "organisation_id",
    ]
  );

  return payload;
}

// ============================================================
// PROJECT PAYLOAD
// ============================================================

function buildProjectPayload(
  row:
    RawRow,

  orgId:
    string | null
) {
  const payload:
    Record<
      string,
      any
    > = {};

  const projectName =
    findMappedValue(
      row,
      "project_name"
    );

  const genericName =
    findMappedValue(
      row,
      "name"
    );

  const status =
    findMappedValue(
      row,
      "status"
    );

  const description =
    findMappedValue(
      row,
      "description"
    );

  const dueDate =
    findMappedValue(
      row,
      "due_date"
    );

  const companyName =
    findMappedValue(
      row,
      "company_name"
    );

  addIfPresent(
    payload,
    "name",
    projectName ??
      genericName
  );

  addIfPresent(
    payload,
    "status",
    status
  );

  addIfPresent(
    payload,
    "description",
    description
  );

  addIfPresent(
    payload,
    "due_date",
    dueDate
  );

  addIfPresent(
    payload,
    "company_name",
    companyName
  );

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  copyUnknownSourceFields(
    row,
    payload,
    [
      "name",
      "project_name",
      "status",
      "description",
      "due_date",
      "company_name",
      "organisation_id",
    ]
  );

  return payload;
}

// ============================================================
// BUILD PAYLOAD
// ============================================================

function buildPayload(
  row:
    RawRow,

  targetTable:
    ResolvedTargetTable,

  orgId:
    string | null
) {
  switch (
    targetTable
  ) {
    case "contacts":
      return buildContactPayload(
        row,
        orgId
      );

    case "organisations":
      return buildOrganisationPayload(
        row
      );

    case "invoices":
      return buildInvoicePayload(
        row,
        orgId
      );

    case "expenses":
      return buildExpensePayload(
        row,
        orgId
      );

    case "projects":
      return buildProjectPayload(
        row,
        orgId
      );

    default: {
      const exhaustiveCheck:
        never =
        targetTable;

      throw new Error(
        `Unsupported import target: ${String(
          exhaustiveCheck
        )}`
      );
    }
  }
}

// ============================================================
// MAIN DETECTOR
// ============================================================

export function detectRecords(
  rawRows:
    RawRow[],

  targetTableOverride:
    TargetTableType,

  orgId:
    string | null,

  _userId:
    string
): ProcessedRow[] {
  if (
    rawRows.length ===
    0
  ) {
    return [];
  }

  // ==========================================================
  // DETECT FILE DESTINATION ONCE
  //
  // An uploaded spreadsheet normally represents one dataset,
  // so detection should be based on the whole file rather than
  // independently guessing each row.
  // ==========================================================

  const detectedTarget:
    ResolvedTargetTable =
    targetTableOverride ===
    "auto"
      ? detectTargetTable(
          rawRows
        )
      : targetTableOverride;

  // ==========================================================
  // BUILD RECORDS
  // ==========================================================

  return rawRows.map(
    (
      row,
      index
    ) => {
      const payload =
        buildPayload(
          row,
          detectedTarget,
          orgId
        );

      return {
        id:
          `row_${index + 1}`,

        targetTable:
          detectedTarget,

        payload,

        /**
         * Always preserve the untouched source row.
         *
         * This is important for:
         *
         * - import previews
         * - failed-record downloads
         * - audit/debugging
         * - future subscriber/campaign fan-out
         */
        rawPayload: {
          ...row,
        },

        isValid:
          true,

        validationErrors:
          [],
      };
    }
  );
}