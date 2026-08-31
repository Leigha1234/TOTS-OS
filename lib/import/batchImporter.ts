// ==========================================
// lib/import/batchImporter.ts
// Production batch importer
// ==========================================

import {
  BatchImportResult,
  DuplicateResolutionStrategy,
  ProcessedRow,
} from "./types";

import {
  BATCH_CONFIG,
  UNIQUE_KEYS,
} from "./constants";

// ============================================================
// TYPES
// ============================================================

type Payload =
  Record<
    string,
    any
  >;

type ExistingRecord =
  Record<
    string,
    any
  >;

// ============================================================
// TABLE CONFIGURATION
// ============================================================

/**
 * These are the tables whose exact safe import columns we
 * currently know.
 *
 * Do NOT add fields here unless they genuinely exist in the
 * corresponding Supabase table.
 *
 * Other supported tables can still be processed, but their
 * payload is left intact until we add their exact schema.
 */
const ALLOWED_COLUMNS:
  Record<
    string,
    string[]
  > = {
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

  contacts: [
    "first_name",
    "last_name",
    "email",
    "phone",
    "position",
    "organisation_id",
    "created_at",
  ],
};

// ============================================================
// HELPERS
// ============================================================

function stringValue(
  value:
    unknown
) {
  if (
    value ===
      null ||
    value ===
      undefined
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
) {
  return stringValue(
    value
  )
    .toLowerCase();
}

// ============================================================

function cleanPayload(
  payload:
    Payload
) {
  const cleaned:
    Payload = {};

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
          "string" &&
        value.trim() ===
          ""
      ) {
        return;
      }

      cleaned[
        key
      ] =
        typeof value ===
        "string"
          ? value.trim()
          : value;
    }
  );

  return cleaned;
}

// ============================================================

function splitContactName(
  value:
    unknown
) {
  const name =
    stringValue(
      value
    );

  if (
    !name
  ) {
    return {
      firstName:
        "",

      lastName:
        "",
    };
  }

  const parts =
    name
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  if (
    parts.length ===
    1
  ) {
    return {
      firstName:
        parts[0],

      lastName:
        "",
    };
  }

  return {
    firstName:
      parts[0],

    lastName:
      parts
        .slice(
          1
        )
        .join(
          " "
        ),
  };
}

// ============================================================

function prepareContactPayload(
  original:
    Payload,

  orgId:
    string | null
) {
  const payload:
    Payload = {
    ...original,
  };

  /**
   * Map common imported contact fields.
   */
  const importedName =
    payload.full_name ??
    payload.contact_name ??
    payload.name;

  if (
    importedName &&
    !payload.first_name &&
    !payload.last_name
  ) {
    const {
      firstName,
      lastName,
    } =
      splitContactName(
        importedName
      );

    if (
      firstName
    ) {
      payload.first_name =
        firstName;
    }

    if (
      lastName
    ) {
      payload.last_name =
        lastName;
    }
  }

  /**
   * Common role mapping.
   */
  if (
    payload.role &&
    !payload.position
  ) {
    payload.position =
      payload.role;
  }

  if (
    payload.job_title &&
    !payload.position
  ) {
    payload.position =
      payload.job_title;
  }

  /**
   * Normalise email.
   */
  if (
    payload.email
  ) {
    payload.email =
      cleanEmail(
        payload.email
      );
  }

  /**
   * organisation_id here is the user's TOTS-OS workspace.
   *
   * IMPORTANT:
   * We do NOT create a new public.organisations record from
   * company_name here.
   *
   * Customer/company relationships must be handled by the
   * dedicated CRM/customer relationship layer rather than
   * overwriting the workspace organisation_id.
   */
  if (
    orgId &&
    !payload.organisation_id
  ) {
    payload.organisation_id =
      orgId;
  }

  /**
   * Temporary/raw mapping fields that do not belong directly
   * in public.contacts.
   */
  delete payload.name;
  delete payload.full_name;
  delete payload.contact_name;
  delete payload.company_name;
  delete payload.company;
  delete payload.organisation;
  delete payload.organization;
  delete payload.role;
  delete payload.job_title;

  return payload;
}

// ============================================================

function prepareOrganisationPayload(
  original:
    Payload
) {
  const payload:
    Payload = {
    ...original,
  };

  /**
   * organisations is currently treated as the root entity and
   * therefore must never receive organisation_id.
   */
  delete payload.organisation_id;

  if (
    payload.company_name &&
    !payload.name
  ) {
    payload.name =
      payload.company_name;
  }

  if (
    payload.organisation_name &&
    !payload.name
  ) {
    payload.name =
      payload.organisation_name;
  }

  if (
    payload.organization_name &&
    !payload.name
  ) {
    payload.name =
      payload.organization_name;
  }

  if (
    payload.domain &&
    !payload.website
  ) {
    payload.website =
      payload.domain;
  }

  if (
    payload.description &&
    !payload.notes
  ) {
    payload.notes =
      payload.description;
  }

  if (
    payload.date_created &&
    !payload.created_at
  ) {
    payload.created_at =
      payload.date_created;
  }

  delete payload.company_name;
  delete payload.organisation_name;
  delete payload.organization_name;
  delete payload.domain;
  delete payload.description;
  delete payload.date_created;

  return payload;
}

// ============================================================

function prepareGenericPayload(
  original:
    Payload,

  targetTable:
    string,

  orgId:
    string | null
) {
  const payload:
    Payload = {
    ...original,
  };

  /**
   * Child records belong to the active TOTS-OS workspace.
   */
  if (
    orgId &&
    targetTable !==
      "organisations" &&
    !payload.organisation_id
  ) {
    payload.organisation_id =
      orgId;
  }

  return payload;
}

// ============================================================

function applyAllowlist(
  targetTable:
    string,

  payload:
    Payload
) {
  const allowed =
    ALLOWED_COLUMNS[
      targetTable
    ];

  /**
   * We only strip fields for tables whose exact schema is known.
   *
   * This prevents accidentally deleting valid fields from
   * invoices/projects/expenses before their schemas are added
   * here.
   */
  if (
    !allowed
  ) {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(
      payload
    ).filter(
      ([
        key,
      ]) =>
        allowed.includes(
          key
        )
    )
  );
}

// ============================================================

function preparePayload(
  targetTable:
    string,

  original:
    Payload,

  orgId:
    string | null
) {
  let payload:
    Payload;

  if (
    targetTable ===
    "contacts"
  ) {
    payload =
      prepareContactPayload(
        original,
        orgId
      );
  } else if (
    targetTable ===
    "organisations"
  ) {
    payload =
      prepareOrganisationPayload(
        original
      );
  } else {
    payload =
      prepareGenericPayload(
        original,
        targetTable,
        orgId
      );
  }

  payload =
    applyAllowlist(
      targetTable,
      payload
    );

  return cleanPayload(
    payload
  );
}

// ============================================================

function appendFailure(
  failedRows:
    ProcessedRow[],

  row:
    ProcessedRow,

  message:
    string
) {
  failedRows.push({
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
  });
}

// ============================================================

function getUniqueKey(
  targetTable:
    string,

  payload:
    Payload
) {
  const configured =
    UNIQUE_KEYS[
      targetTable
    ];

  if (
    !configured
  ) {
    return null;
  }

  const keys =
    Array.isArray(
      configured
    )
      ? configured
      : [
          configured,
        ];

  const usable =
    keys.filter(
      (
        key
      ) => {
        const value =
          payload[
            key
          ];

        return (
          value !==
            undefined &&
          value !==
            null &&
          String(
            value
          ).trim() !==
            ""
        );
      }
    );

  if (
    usable.length ===
    0
  ) {
    return null;
  }

  return usable;
}

// ============================================================

async function findExistingRecord(
  supabase:
    any,

  targetTable:
    string,

  payload:
    Payload,

  orgId:
    string | null
): Promise<ExistingRecord | null> {
  const uniqueKeys =
    getUniqueKey(
      targetTable,
      payload
    );

  if (
    !uniqueKeys ||
    uniqueKeys.length ===
      0
  ) {
    return null;
  }

  let query =
    supabase
      .from(
        targetTable
      )
      .select(
        "*"
      );

  for (
    const key of
    uniqueKeys
  ) {
    query =
      query.eq(
        key,
        payload[
          key
        ]
      );
  }

  /**
   * Scope child-table duplicate lookups to the current
   * workspace whenever possible.
   *
   * organisations is deliberately excluded because the
   * existing schema treats it as the root entity.
   */
  if (
    orgId &&
    targetTable !==
      "organisations" &&
    payload.organisation_id
  ) {
    query =
      query.eq(
        "organisation_id",
        payload.organisation_id
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
    throw new Error(
      `Duplicate lookup failed for public.${targetTable}: ${error.message}`
    );
  }

  return (
    data ??
    null
  );
}

// ============================================================

async function insertRecord(
  supabase:
    any,

  targetTable:
    string,

  payload:
    Payload
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        targetTable
      )
      .insert(
        payload
      )
      .select(
        "*"
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================

async function updateRecord(
  supabase:
    any,

  targetTable:
    string,

  payload:
    Payload,

  existing:
    ExistingRecord
) {
  /**
   * Prefer an actual row ID when the table has one.
   */
  if (
    existing.id
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          targetTable
        )
        .update(
          payload
        )
        .eq(
          "id",
          existing.id
        )
        .select(
          "*"
        )
        .maybeSingle();

    if (
      error
    ) {
      throw error;
    }

    return data;
  }

  /**
   * Fallback for schemas without an exposed `id`.
   */
  const uniqueKeys =
    getUniqueKey(
      targetTable,
      payload
    );

  if (
    !uniqueKeys ||
    uniqueKeys.length ===
      0
  ) {
    throw new Error(
      `Cannot update public.${targetTable}: no usable unique key was found.`
    );
  }

  let query =
    supabase
      .from(
        targetTable
      )
      .update(
        payload
      );

  for (
    const key of
    uniqueKeys
  ) {
    query =
      query.eq(
        key,
        payload[
          key
        ]
      );
  }

  const {
    data,
    error,
  } =
    await query
      .select(
        "*"
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data;
}

// ============================================================
// MAIN IMPORTER
// ============================================================

export async function processBatches(
  records:
    ProcessedRow[],

  supabase:
    any,

  orgId:
    string | null,

  strategy:
    DuplicateResolutionStrategy,

  onProgress?:
    (
      batchNum:
        number,

      totalBatches:
        number
    ) =>
      void
): Promise<BatchImportResult> {
  const batchSize =
    BATCH_CONFIG
      ?.DEFAULT_BATCH_SIZE ??
    50;

  const safeBatchSize =
    Math.max(
      1,
      Math.min(
        batchSize,
        100
      )
    );

  const totalBatches =
    Math.ceil(
      records.length /
        safeBatchSize
    ) ||
    1;

  let inserted =
    0;

  let updated =
    0;

  let skipped =
    0;

  let failed =
    0;

  const failedRows:
    ProcessedRow[] =
    [];

  // ==========================================================
  // PROCESS BATCHES
  // ==========================================================

  for (
    let batchStart =
      0;

    batchStart <
    records.length;

    batchStart +=
      safeBatchSize
  ) {
    const batch =
      records.slice(
        batchStart,
        batchStart +
          safeBatchSize
      );

    const batchNum =
      Math.floor(
        batchStart /
          safeBatchSize
      ) +
      1;

    // ========================================================
    // PROCESS EACH ROW INDEPENDENTLY
    //
    // A failure on one row must NOT mark an entire batch as
    // failed.
    // ========================================================

    for (
      const row of
      batch
    ) {
      try {
        const targetTable =
          String(
            row.targetTable ??
              ""
          ).trim();

        if (
          !targetTable ||
          targetTable ===
            "auto"
        ) {
          throw new Error(
            "Import destination could not be resolved for this record."
          );
        }

        // ----------------------------------------------------
        // PREPARE SAFE PAYLOAD
        // ----------------------------------------------------

        const payload =
          preparePayload(
            targetTable,
            {
              ...row.payload,
            },
            orgId
          );

        if (
          Object.keys(
            payload
          ).length ===
          0
        ) {
          throw new Error(
            `No valid fields remained after preparing the record for public.${targetTable}.`
          );
        }

        // ----------------------------------------------------
        // CREATE STRATEGY
        //
        // "create" means INSERT.
        // It intentionally does not turn into an upsert.
        // ----------------------------------------------------

        if (
          strategy ===
          "create"
        ) {
          await insertRecord(
            supabase,
            targetTable,
            payload
          );

          inserted++;

          continue;
        }

        // ----------------------------------------------------
        // DETECT EXISTING RECORD
        // ----------------------------------------------------

        const existing =
          await findExistingRecord(
            supabase,
            targetTable,
            payload,
            orgId
          );

        // ----------------------------------------------------
        // SKIP STRATEGY
        // ----------------------------------------------------

        if (
          strategy ===
          "skip"
        ) {
          if (
            existing
          ) {
            skipped++;

            continue;
          }

          await insertRecord(
            supabase,
            targetTable,
            payload
          );

          inserted++;

          continue;
        }

        // ----------------------------------------------------
        // UPDATE STRATEGY
        //
        // Existing record -> UPDATE
        // No existing record -> INSERT
        // ----------------------------------------------------

        if (
          strategy ===
          "update"
        ) {
          if (
            existing
          ) {
            await updateRecord(
              supabase,
              targetTable,
              payload,
              existing
            );

            updated++;
          } else {
            await insertRecord(
              supabase,
              targetTable,
              payload
            );

            inserted++;
          }

          continue;
        }

        throw new Error(
          `Unsupported duplicate strategy: ${strategy}`
        );
      } catch (
        error:
          unknown
      ) {
        failed++;

        const message =
          error instanceof
            Error
            ? error.message
            : String(
                error
              );

        console.error(
          "[TOTS IMPORT] Record import failed:",
          {
            rowId:
              row.id,

            table:
              row.targetTable,

            message,

            payload:
              row.payload,
          }
        );

        appendFailure(
          failedRows,
          row,
          message
        );
      }
    }

    // ========================================================
    // PROGRESS
    // ========================================================

    onProgress?.(
      batchNum,
      totalBatches
    );
  }

  // ==========================================================
  // RESULT
  // ==========================================================

  return {
    inserted,
    updated,
    skipped,
    failed,
    failedRows,
  };
}