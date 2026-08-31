// ==========================================
// lib/import/duplicateChecker.ts
// ==========================================

import {
  DuplicateResult,
  ProcessedRow,
} from "./types";

import {
  UNIQUE_KEYS,
} from "./constants";

// ============================================================
// TYPES
// ============================================================

type DuplicateSource =
  | "file"
  | "database";

// ============================================================
// HELPERS
// ============================================================

function normaliseValue(
  key: string,
  value: unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return "";
  }

  let stringValue =
    String(
      value
    ).trim();

  if (
    !stringValue
  ) {
    return "";
  }

  if (
    key ===
    "email"
  ) {
    return stringValue
      .toLowerCase();
  }

  if (
    key.includes(
      "name"
    )
  ) {
    return stringValue
      .replace(
        /\s+/g,
        " "
      )
      .toLowerCase();
  }

  return stringValue
    .toLowerCase();
}

// ============================================================

function getUniqueKeys(
  targetTable: string
) {
  const configured =
    UNIQUE_KEYS[
      targetTable
    ];

  if (
    !configured
  ) {
    return [];
  }

  return Array.isArray(
    configured
  )
    ? configured
    : [
        configured,
      ];
}

// ============================================================

function getFingerprint(
  row: ProcessedRow
) {
  const keys =
    getUniqueKeys(
      row.targetTable
    );

  if (
    keys.length ===
    0
  ) {
    return "";
  }

  const values =
    keys.map(
      (
        key
      ) =>
        normaliseValue(
          key,
          row.payload[
            key
          ]
        )
    );

  /*
   * If any required unique-key field is missing, we cannot
   * safely consider the row a duplicate.
   */
  if (
    values.some(
      (
        value
      ) =>
        !value
    )
  ) {
    return "";
  }

  return [
    row.targetTable,
    ...values,
  ].join(
    "::"
  );
}

// ============================================================

function markDuplicate(
  row: ProcessedRow,
  source: DuplicateSource
): ProcessedRow {
  const existingErrors =
    row.validationErrors ??
    [];

  const message =
    source ===
    "file"
      ? "Duplicate record detected within the uploaded file."
      : "Matching record already exists in TOTS-OS.";

  return {
    ...row,

    isDuplicate:
      true,

    validationErrors:
      existingErrors.includes(
        message
      )
        ? existingErrors
        : [
            ...existingErrors,
            message,
          ],
  };
}

// ============================================================

async function existsInDatabase(
  row: ProcessedRow,
  supabase: any,
  orgId: string | null
) {
  const keys =
    getUniqueKeys(
      row.targetTable
    );

  if (
    keys.length ===
    0
  ) {
    return false;
  }

  for (
    const key of
    keys
  ) {
    const value =
      row.payload[
        key
      ];

    if (
      value ===
        undefined ||
      value ===
        null ||
      String(
        value
      ).trim() ===
        ""
    ) {
      return false;
    }
  }

  let query =
    supabase
      .from(
        row.targetTable
      )
      .select(
        "id"
      );

  for (
    const key of
    keys
  ) {
    let value =
      row.payload[
        key
      ];

    if (
      key ===
      "email"
    ) {
      value =
        String(
          value
        )
          .trim()
          .toLowerCase();
    }

    query =
      query.eq(
        key,
        value
      );
  }

  /*
   * Child-table duplicate detection must stay inside the
   * active workspace.
   *
   * organisations is excluded because in your current schema
   * it is treated as a root table and does not receive
   * organisation_id.
   */
  if (
    orgId &&
    row.targetTable !==
      "organisations"
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
      );

  if (
    error
  ) {
    throw new Error(
      `Duplicate check failed for public.${row.targetTable}: ${error.message}`
    );
  }

  return Boolean(
    data &&
      data.length >
        0
  );
}

// ============================================================
// MAIN DUPLICATE CHECKER
// ============================================================

export async function checkDuplicates(
  rows: ProcessedRow[],
  supabase: any,
  orgId: string | null
): Promise<DuplicateResult> {
  const recordsToProcess:
    ProcessedRow[] =
    [];

  const duplicates:
    ProcessedRow[] =
    [];

  // ==========================================================
  // IN-FILE DUPLICATE TRACKING
  // ==========================================================

  const seenFingerprints =
    new Set<string>();

  // ==========================================================
  // DATABASE LOOKUP CACHE
  //
  // If the same email appears repeatedly in a file, we do not
  // need to make the exact same Supabase lookup over and over.
  // ==========================================================

  const databaseDuplicateCache =
    new Map<
      string,
      boolean
    >();

  // ==========================================================
  // PROCESS EACH RECORD
  // ==========================================================

  for (
    const row of
    rows
  ) {
    const fingerprint =
      getFingerprint(
        row
      );

    // --------------------------------------------------------
    // TABLE HAS NO SAFE DUPLICATE KEY
    // --------------------------------------------------------

    if (
      !fingerprint
    ) {
      recordsToProcess.push(
        row
      );

      continue;
    }

    // --------------------------------------------------------
    // DUPLICATE INSIDE CURRENT FILE
    // --------------------------------------------------------

    const duplicateInFile =
      seenFingerprints.has(
        fingerprint
      );

    if (
      !duplicateInFile
    ) {
      seenFingerprints.add(
        fingerprint
      );
    }

    // --------------------------------------------------------
    // DUPLICATE ALREADY IN DATABASE
    // --------------------------------------------------------

    let duplicateInDatabase:
      boolean;

    if (
      databaseDuplicateCache.has(
        fingerprint
      )
    ) {
      duplicateInDatabase =
        databaseDuplicateCache.get(
          fingerprint
        ) ??
        false;
    } else {
      duplicateInDatabase =
        await existsInDatabase(
          row,
          supabase,
          orgId
        );

      databaseDuplicateCache.set(
        fingerprint,
        duplicateInDatabase
      );
    }

    // --------------------------------------------------------
    // MARK DUPLICATES
    // --------------------------------------------------------

    if (
      duplicateInFile ||
      duplicateInDatabase
    ) {
      let duplicateRow =
        row;

      if (
        duplicateInFile
      ) {
        duplicateRow =
          markDuplicate(
            duplicateRow,
            "file"
          );
      }

      if (
        duplicateInDatabase
      ) {
        duplicateRow =
          markDuplicate(
            duplicateRow,
            "database"
          );
      }

      duplicates.push(
        duplicateRow
      );

      /*
       * Keep it in recordsToProcess.
       *
       * processBatches() will decide whether to:
       *
       * - update
       * - skip
       * - create
       *
       * based on the user's chosen strategy.
       */
      recordsToProcess.push(
        duplicateRow
      );

      continue;
    }

    // --------------------------------------------------------
    // NORMAL NON-DUPLICATE
    // --------------------------------------------------------

    recordsToProcess.push(
      row
    );
  }

  return {
    recordsToProcess,
    duplicates,
  };
}