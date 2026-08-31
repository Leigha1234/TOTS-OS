// ==========================================
// lib/import/batchImporter.ts
// ==========================================

import {
  BATCH_CONFIG,
  UNIQUE_KEYS,
} from "./constants";

import {
  BatchImportResult,
  DuplicateResolutionStrategy,
  ProcessedRow,
} from "./types";

// ============================================================
// TYPES
// ============================================================

type PreparedPayload =
  Record<
    string,
    unknown
  >;

// ============================================================
// ALLOWED DATABASE COLUMNS
// ============================================================

const ALLOWED_COLUMNS:
  Record<
    string,
    string[]
  > = {
  contacts: [
    "organisation_id",
    "name",
    "email",
    "phone",
    "address",
    "company_name",
    "company_details",
    "role",
    "created_at",
    "updated_at",
    "website",
    "attachments",
    "customer_id",
  ],

  organisations: [
    "name",
    "email",
    "phone",
    "website",
    "address",
    "status",
    "notes",
    "date_closed",
    "created_at",
  ],
};

// ============================================================
// HELPERS
// ============================================================

function hasValue(
  value:
    unknown
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
  value:
    unknown
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

function cleanEmail(
  value:
    unknown
): string {
  return stringValue(
    value
  ).toLowerCase();
}

// ============================================================

function cleanPayload(
  payload:
    Record<
      string,
      unknown
    >
): PreparedPayload {
  const output:
    PreparedPayload = {};

  Object.entries(
    payload
  ).forEach(
    ([
      key,
      value,
    ]) => {
      if (
        value ===
          undefined ||
        value ===
          null
      ) {
        return;
      }

      if (
        typeof value ===
        "string"
      ) {
        const trimmed =
          value.trim();

        if (
          trimmed ===
          ""
        ) {
          return;
        }

        output[
          key
        ] =
          trimmed;

        return;
      }

      output[
        key
      ] =
        value;
    }
  );

  return output;
}

// ============================================================
// CONTACT NAME
// ============================================================

function buildContactName(
  payload:
    Record<
      string,
      unknown
    >
): string {
  const existingName =
    stringValue(
      payload.name
    );

  if (
    existingName
  ) {
    return existingName;
  }

  const firstName =
    stringValue(
      payload.first_name ??
        payload.firstname ??
        payload.firstName
    );

  const lastName =
    stringValue(
      payload.last_name ??
        payload.lastname ??
        payload.surname ??
        payload.lastName
    );

  return [
    firstName,
    lastName,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    )
    .trim();
}

// ============================================================
// PREPARE CONTACT
// ============================================================

function prepareContactPayload(
  source:
    Record<
      string,
      unknown
    >,

  orgId:
    string | null
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  const name =
    buildContactName(
      payload
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  const email =
    cleanEmail(
      payload.email
    );

  if (
    email
  ) {
    payload.email =
      email;
  } else {
    delete payload.email;
  }

  // ----------------------------------------------------------
  // ROLE
  //
  // Your database uses "role", NOT "position".
  // ----------------------------------------------------------

  const role =
    stringValue(
      payload.role ??
        payload.position ??
        payload.job_title ??
        payload.jobTitle
    );

  if (
    role
  ) {
    payload.role =
      role;
  }

  // ----------------------------------------------------------
  // COMPANY
  //
  // Your contacts table DOES have company_name, so preserve it.
  // ----------------------------------------------------------

  const companyName =
    stringValue(
      payload.company_name ??
        payload.company ??
        payload.organisation ??
        payload.organization ??
        payload.business_name ??
        payload.business
    );

  if (
    companyName
  ) {
    payload.company_name =
      companyName;
  }

  // ----------------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------------

  const address =
    stringValue(
      payload.address ??
        payload.address_line_1 ??
        payload.address1
    );

  if (
    address
  ) {
    payload.address =
      address;
  }

  // ----------------------------------------------------------
  // WEBSITE
  // ----------------------------------------------------------

  const website =
    stringValue(
      payload.website ??
        payload.domain
    );

  if (
    website
  ) {
    payload.website =
      website;
  }

  // ----------------------------------------------------------
  // WORKSPACE
  //
  // organisation_id is the TOTS-OS workspace.
  // Never trust an organisation ID supplied by the import file.
  // ----------------------------------------------------------

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  // ----------------------------------------------------------
  // REMOVE IMPORT-ONLY / NON-DATABASE FIELDS
  // ----------------------------------------------------------

  delete payload.first_name;
  delete payload.firstname;
  delete payload.firstName;

  delete payload.last_name;
  delete payload.lastname;
  delete payload.surname;
  delete payload.lastName;

  delete payload.position;
  delete payload.job_title;
  delete payload.jobTitle;

  delete payload.company;
  delete payload.organisation;
  delete payload.organization;
  delete payload.business_name;
  delete payload.business;

  delete payload.full_name;
  delete payload.contact_name;

  delete payload.domain;

  /**
   * Do not import arbitrary external IDs into your own primary
   * key.
   */
  delete payload.id;

  /**
   * created_by is not a column in public.contacts.
   */
  delete payload.created_by;

  return applyAllowlist(
    "contacts",
    payload
  );
}

// ============================================================
// PREPARE ORGANISATION
// ============================================================

function prepareOrganisationPayload(
  source:
    Record<
      string,
      unknown
    >
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  const name =
    stringValue(
      payload.name ??
        payload.company_name ??
        payload.company ??
        payload.organisation_name ??
        payload.organization_name ??
        payload.organisation ??
        payload.organization ??
        payload.business_name
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  const email =
    cleanEmail(
      payload.email
    );

  if (
    email
  ) {
    payload.email =
      email;
  }

  const website =
    stringValue(
      payload.website ??
        payload.domain
    );

  if (
    website
  ) {
    payload.website =
      website;
  }

  if (
    !hasValue(
      payload.notes
    ) &&
    hasValue(
      payload.description
    )
  ) {
    payload.notes =
      payload.description;
  }

  if (
    !hasValue(
      payload.created_at
    ) &&
    hasValue(
      payload.date_created
    )
  ) {
    payload.created_at =
      payload.date_created;
  }

  /**
   * organisations is treated as a root table in the current
   * import architecture.
   */
  delete payload.organisation_id;
  delete payload.created_by;
  delete payload.id;

  delete payload.company_name;
  delete payload.company;
  delete payload.organisation_name;
  delete payload.organization_name;
  delete payload.organisation;
  delete payload.organization;
  delete payload.business_name;
  delete payload.domain;
  delete payload.description;
  delete payload.date_created;

  return applyAllowlist(
    "organisations",
    payload
  );
}

// ============================================================
// PREPARE GENERIC CHILD TABLE
// ============================================================

function prepareGenericPayload(
  source:
    Record<
      string,
      unknown
    >,

  orgId:
    string | null
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  /**
   * For invoices, expenses and projects we still need the real
   * table schemas before we can safely create strict allowlists.
   *
   * Workspace ownership is still applied here.
   */
  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  delete payload.created_by;

  return payload;
}

// ============================================================
// ALLOWLIST
// ============================================================

function applyAllowlist(
  table:
    string,

  payload:
    PreparedPayload
): PreparedPayload {
  const allowed =
    ALLOWED_COLUMNS[
      table
    ];

  if (
    !allowed
  ) {
    return payload;
  }

  const cleaned:
    PreparedPayload = {};

  allowed.forEach(
    (
      column
    ) => {
      if (
        hasValue(
          payload[
            column
          ]
        )
      ) {
        cleaned[
          column
        ] =
          payload[
            column
          ];
      }
    }
  );

  return cleaned;
}

// ============================================================
// PREPARE PAYLOAD
// ============================================================

function preparePayload(
  row:
    ProcessedRow,

  orgId:
    string | null
): PreparedPayload {
  switch (
    row.targetTable
  ) {
    case "contacts":
      return prepareContactPayload(
        row.payload,
        orgId
      );

    case "organisations":
      return prepareOrganisationPayload(
        row.payload
      );

    default:
      return prepareGenericPayload(
        row.payload,
        orgId
      );
  }
}

// ============================================================
// UNIQUE KEY
// ============================================================

function getUniqueKeys(
  table:
    string
): string[] {
  const configured =
    UNIQUE_KEYS[
      table
    ];

  if (
    !configured
  ) {
    return [];
  }

  if (
    Array.isArray(
      configured
    )
  ) {
    return configured;
  }

  return [
    configured,
  ];
}

// ============================================================
// FIND EXISTING
// ============================================================

async function findExistingRecord(
  table:
    string,

  payload:
    PreparedPayload,

  supabase:
    any,

  orgId:
    string | null
): Promise<Record<string, any> | null> {
  const keys =
    getUniqueKeys(
      table
    );

  if (
    keys.length ===
    0
  ) {
    return null;
  }

  const usableKeys =
    keys.filter(
      (
        key
      ) =>
        hasValue(
          payload[
            key
          ]
        )
    );

  if (
    usableKeys.length !==
    keys.length
  ) {
    return null;
  }

  let query =
    supabase
      .from(
        table
      )
      .select(
        "*"
      );

  for (
    const key of
    usableKeys
  ) {
    let value =
      payload[
        key
      ];

    if (
      key ===
      "email"
    ) {
      value =
        cleanEmail(
          value
        );
    }

    query =
      query.eq(
        key,
        value
      );
  }

  /**
   * Child tables must be scoped to the current workspace.
   */
  if (
    table !==
      "organisations" &&
    orgId
  ) {
    query =
      query.eq(
        "organisation_id",
        orgId
      );
  }

  const {
    data,
    error,
  } =
    await query
      .limit(
        1
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return (
    data ??
    null
  );
}

// ============================================================
// INSERT
// ============================================================

async function insertRecord(
  table:
    string,

  payload:
    PreparedPayload,

  supabase:
    any
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        table
      )
      .insert(
        payload
      )
      .select(
        "*"
      )
      .single();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// UPDATE
// ============================================================

async function updateRecord(
  table:
    string,

  existing:
    Record<
      string,
      any
    >,

  payload:
    PreparedPayload,

  supabase:
    any
) {
  if (
    !existing.id
  ) {
    throw new Error(
      `Existing ${table} record does not contain an id.`
    );
  }

  const updatePayload =
    {
      ...payload,
    };

  delete updatePayload.id;

  const {
    data,
    error,
  } =
    await supabase
      .from(
        table
      )
      .update(
        updatePayload
      )
      .eq(
        "id",
        existing.id
      )
      .select(
        "*"
      )
      .single();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// FAILURE
// ============================================================

function appendFailure(
  result:
    BatchImportResult,

  row:
    ProcessedRow,

  error:
    unknown
) {
  let message =
    "Database import failed.";

  if (
    error instanceof
    Error
  ) {
    message =
      error.message;
  } else if (
    error &&
    typeof error ===
      "object"
  ) {
    const objectError =
      error as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
        code?: unknown;
      };

    const parts =
      [
        stringValue(
          objectError.message
        ),

        stringValue(
          objectError.details
        ),

        stringValue(
          objectError.hint
        ),

        stringValue(
          objectError.code
        ),
      ].filter(
        Boolean
      );

    if (
      parts.length >
      0
    ) {
      message =
        parts.join(
          " — "
        );
    }
  } else if (
    error !==
      undefined &&
    error !==
      null
  ) {
    message =
      String(
        error
      );
  }

  const failedRow:
    ProcessedRow = {
    ...row,

    isValid:
      false,

    validationErrors: [
      ...(
        row.validationErrors ??
        []
      ),

      message,
    ],
  };

  result.failed +=
    1;

  result.failedRows.push(
    failedRow
  );

  console.error(
    "[TOTS IMPORT] Record import failed:",
    {
      table:
        row.targetTable,

      rowId:
        row.id,

      payload:
        row.payload,

      error,

      message,
    }
  );
}

// ============================================================
// MAIN BATCH IMPORTER
// ============================================================

export async function processBatches(
  rows:
    ProcessedRow[],

  supabase:
    any,

  orgId:
    string | null,

  duplicateStrategy:
    DuplicateResolutionStrategy,

  onProgress?:
    (
      batchNumber:
        number,

      totalBatches:
        number
    ) => void
): Promise<BatchImportResult> {
  const result:
    BatchImportResult = {
    inserted:
      0,

    updated:
      0,

    skipped:
      0,

    failed:
      0,

    failedRows:
      [],
  };

  if (
    rows.length ===
    0
  ) {
    return result;
  }

  const configuredBatchSize =
    Number(
      BATCH_CONFIG
        .DEFAULT_BATCH_SIZE
    );

  const batchSize =
    Math.min(
      100,
      Math.max(
        1,
        Number.isFinite(
          configuredBatchSize
        )
          ? configuredBatchSize
          : 50
      )
    );

  const totalBatches =
    Math.max(
      1,
      Math.ceil(
        rows.length /
          batchSize
      )
    );

  for (
    let batchIndex =
      0;
    batchIndex <
    totalBatches;
    batchIndex +=
      1
  ) {
    const start =
      batchIndex *
      batchSize;

    const end =
      start +
      batchSize;

    const batch =
      rows.slice(
        start,
        end
      );

    for (
      const row of
      batch
    ) {
      try {
        const table =
          row.targetTable;

        const payload =
          preparePayload(
            row,
            orgId
          );

        if (
          Object.keys(
            payload
          ).length ===
          0
        ) {
          throw new Error(
            `No supported ${table} fields remained after preparing the import payload.`
          );
        }

        // ----------------------------------------------------
        // CREATE
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "create"
        ) {
          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;

          continue;
        }

        // ----------------------------------------------------
        // FIND EXISTING
        // ----------------------------------------------------

        const existing =
          await findExistingRecord(
            table,
            payload,
            supabase,
            orgId
          );

        // ----------------------------------------------------
        // SKIP
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "skip"
        ) {
          if (
            existing
          ) {
            result.skipped +=
              1;

            continue;
          }

          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;

          continue;
        }

        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "update"
        ) {
          if (
            existing
          ) {
            await updateRecord(
              table,
              existing,
              payload,
              supabase
            );

            result.updated +=
              1;

            continue;
          }

          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;

          continue;
        }
      } catch (
        error
      ) {
        appendFailure(
          result,
          row,
          error
        );
      }
    }

    onProgress?.(
      batchIndex +
        1,
      totalBatches
    );
  }

  return result;
}