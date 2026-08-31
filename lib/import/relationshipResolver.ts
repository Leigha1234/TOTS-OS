// ==========================================
// lib/import/relationshipResolver.ts
// ==========================================

import {
  ProcessedRow,
} from "./types";

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

function cleanString(
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

function cloneRow(
  row: ProcessedRow
): ProcessedRow {
  return {
    ...row,

    payload: {
      ...row.payload,
    },

    rawPayload: {
      ...row.rawPayload,
    },

    validationErrors: [
      ...(
        row.validationErrors ??
        []
      ),
    ],
  };
}

// ============================================================

function addValidationWarning(
  row: ProcessedRow,
  message: string
) {
  if (
    row.validationErrors.includes(
      message
    )
  ) {
    return;
  }

  row.validationErrors.push(
    message
  );
}

// ============================================================
// WORKSPACE OWNERSHIP
// ============================================================

function applyWorkspaceRelationship(
  row: ProcessedRow,
  orgId: string | null
) {
  /**
   * organisations is currently treated as the workspace/root
   * entity.
   *
   * It must never receive organisation_id.
   */
  if (
    row.targetTable ===
    "organisations"
  ) {
    delete row.payload
      .organisation_id;

    return;
  }

  /**
   * Every child record belongs to the active TOTS-OS
   * organisation/workspace.
   *
   * We deliberately overwrite imported organisation_id values
   * here.
   *
   * An external CSV must never be able to move an imported
   * record into another workspace by supplying its own
   * organisation_id.
   */
  if (
    orgId
  ) {
    row.payload.organisation_id =
      orgId;
  } else {
    /**
     * Do not leave an externally supplied workspace ID behind
     * when there is no authenticated organisation available.
     */
    delete row.payload
      .organisation_id;

    addValidationWarning(
      row,
      "No active TOTS-OS organisation could be attached to this record."
    );
  }
}

// ============================================================
// CONTACT RELATIONSHIPS
// ============================================================

function resolveContactRelationship(
  row: ProcessedRow
) {
  if (
    row.targetTable !==
    "contacts"
  ) {
    return;
  }

  /**
   * company_name is SOURCE METADATA.
   *
   * It does NOT represent the TOTS-OS workspace.
   *
   * Previous behaviour incorrectly did:
   *
   * company_name
   *      ↓
   * organisations.id
   *      ↓
   * contact.organisation_id
   *
   * That could attach a contact to the wrong workspace.
   *
   * Until the actual CRM customer/company relationship schema
   * is wired into the import system, we preserve company_name
   * temporarily and allow batchImporter.ts to remove it before
   * inserting into public.contacts.
   */
  if (
    hasValue(
      row.payload
        .company_name
    )
  ) {
    row.payload.company_name =
      cleanString(
        row.payload
          .company_name
      );
  }

  /**
   * Also normalise common company aliases if they somehow make
   * it this far without recordDetector.ts canonicalising them.
   */
  const fallbackCompany =
    row.payload.company ??
    row.payload.organisation ??
    row.payload.organization ??
    row.payload.business_name ??
    row.payload.business;

  if (
    !hasValue(
      row.payload
        .company_name
    ) &&
    hasValue(
      fallbackCompany
    )
  ) {
    row.payload.company_name =
      cleanString(
        fallbackCompany
      );
  }

  /**
   * Remove duplicate temporary aliases.
   *
   * company_name remains as the single canonical temporary
   * relationship field.
   */
  delete row.payload.company;
  delete row.payload.organisation;
  delete row.payload.organization;
  delete row.payload
    .business_name;
  delete row.payload.business;
}

// ============================================================
// ORGANISATION CLEANUP
// ============================================================

function resolveOrganisationRelationship(
  row: ProcessedRow
) {
  if (
    row.targetTable !==
    "organisations"
  ) {
    return;
  }

  /**
   * Explicit organisation/company name fields can become the
   * organisation's actual name.
   *
   * Unlike contacts, this row itself genuinely represents an
   * organisation.
   */
  const companyName =
    row.payload
      .company_name ??
    row.payload
      .organisation_name ??
    row.payload
      .organization_name;

  if (
    !hasValue(
      row.payload.name
    ) &&
    hasValue(
      companyName
    )
  ) {
    row.payload.name =
      cleanString(
        companyName
      );
  }

  delete row.payload
    .company_name;

  delete row.payload
    .organisation_name;

  delete row.payload
    .organization_name;

  /**
   * Root organisation records must never inherit an imported
   * workspace ID.
   */
  delete row.payload
    .organisation_id;
}

// ============================================================
// GENERIC RELATIONSHIP METADATA
// ============================================================

function cleanTemporaryRelationshipFields(
  row: ProcessedRow
) {
  /**
   * For invoices/projects/expenses we currently preserve
   * company_name because their real customer relationship
   * fields have not yet been confirmed from the database
   * schema.
   *
   * We only clean the value here; we do NOT manufacture
   * customer IDs or organisation records.
   */
  if (
    hasValue(
      row.payload
        .company_name
    )
  ) {
    row.payload.company_name =
      cleanString(
        row.payload
          .company_name
      );
  }
}

// ============================================================
// MAIN RELATIONSHIP RESOLVER
// ============================================================

export async function resolveRelationships(
  rows: ProcessedRow[],
  _supabase: any,
  orgId: string | null
): Promise<ProcessedRow[]> {
  /**
   * IMPORTANT:
   *
   * This function intentionally performs no database writes.
   *
   * Relationship resolution should never create companies or
   * alter workspace ownership as a side effect of analysing an
   * uploaded spreadsheet.
   *
   * Once the real CRM customer/company relationship schema is
   * confirmed, database relationship lookups can be added here
   * safely.
   */

  const resolvedRows =
    rows.map(
      (
        originalRow
      ) => {
        const row =
          cloneRow(
            originalRow
          );

        // ----------------------------------------------------
        // TARGET-SPECIFIC RELATIONSHIP CLEANUP
        // ----------------------------------------------------

        resolveContactRelationship(
          row
        );

        resolveOrganisationRelationship(
          row
        );

        cleanTemporaryRelationshipFields(
          row
        );

        // ----------------------------------------------------
        // WORKSPACE OWNERSHIP
        // ----------------------------------------------------

        applyWorkspaceRelationship(
          row,
          orgId
        );

        return row;
      }
    );

  return resolvedRows;
}