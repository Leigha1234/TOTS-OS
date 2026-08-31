// ==========================================
// lib/import/validator.ts
// ==========================================

import {
  ProcessedRow,
  ValidationResult,
} from "./types";

// ============================================================
// HELPERS
// ============================================================

function hasValue(
  value: unknown
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (
    typeof value === "string"
  ) {
    return value.trim() !== "";
  }

  return true;
}

// ============================================================

function stringValue(
  value: unknown
): string {
  if (
    !hasValue(value)
  ) {
    return "";
  }

  return String(value).trim();
}

// ============================================================

function isValidEmail(
  value: unknown
): boolean {
  const email =
    stringValue(value);

  if (
    !email
  ) {
    return true;
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(
    email
  );
}

// ============================================================

function isValidPhone(
  value: unknown
): boolean {
  const phone =
    stringValue(value);

  if (
    !phone
  ) {
    return true;
  }

  /**
   * Deliberately permissive.
   *
   * Supports things like:
   * +44 7700 900000
   * (01343) 123456
   * 01343 123456 ext 2
   */
  const phoneRegex =
    /^[\d\s+\-().xext]+$/i;

  return phoneRegex.test(
    phone
  );
}

// ============================================================

function isValidNumber(
  value: unknown
): boolean {
  if (
    !hasValue(value)
  ) {
    return true;
  }

  const number =
    typeof value === "number"
      ? value
      : Number(
          String(value)
            .trim()
            .replace(
              /,/g,
              ""
            )
        );

  return Number.isFinite(
    number
  );
}

// ============================================================

function isValidDateLike(
  value: unknown
): boolean {
  if (
    !hasValue(value)
  ) {
    return true;
  }

  if (
    value instanceof Date
  ) {
    return !Number.isNaN(
      value.getTime()
    );
  }

  if (
    typeof value === "number"
  ) {
    return true;
  }

  const parsed =
    Date.parse(
      String(value)
    );

  return !Number.isNaN(
    parsed
  );
}

// ============================================================

function getContactDisplayName(
  payload:
    Record<string, any>
): string {
  const firstName =
    stringValue(
      payload.first_name
    );

  const lastName =
    stringValue(
      payload.last_name
    );

  const fullName =
    stringValue(
      payload.name
    );

  if (
    fullName
  ) {
    return fullName;
  }

  return [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ============================================================

function rowHasMeaningfulValues(
  payload:
    Record<string, any>
): boolean {
  return Object.entries(
    payload
  ).some(
    ([
      key,
      value,
    ]) => {
      /**
       * Workspace ownership alone does not make a row valid.
       */
      if (
        key ===
        "organisation_id"
      ) {
        return false;
      }

      return hasValue(
        value
      );
    }
  );
}

// ============================================================

function addError(
  errors: string[],
  message: string
) {
  if (
    errors.includes(
      message
    )
  ) {
    return;
  }

  errors.push(
    message
  );
}

// ============================================================
// TARGET-SPECIFIC VALIDATION
// ============================================================

function validateOrganisation(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  if (
    !hasValue(
      payload.name
    )
  ) {
    addError(
      errors,
      "Organisation name is required."
    );
  }

  if (
    hasValue(
      payload.email
    ) &&
    !isValidEmail(
      payload.email
    )
  ) {
    addError(
      errors,
      `Invalid email format: ${payload.email}`
    );
  }

  if (
    hasValue(
      payload.phone
    ) &&
    !isValidPhone(
      payload.phone
    )
  ) {
    addError(
      errors,
      `Invalid phone number format: ${payload.phone}`
    );
  }
}

// ============================================================

function validateContact(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  const contactName =
    getContactDisplayName(
      payload
    );

  const email =
    stringValue(
      payload.email
    );

  const phone =
    stringValue(
      payload.phone
    );

  /**
   * A contact can be imported with:
   *
   * - a name
   * - an email
   * - a phone number
   *
   * This matters for CRM exports where one of those fields may
   * be missing.
   */
  if (
    !contactName &&
    !email &&
    !phone
  ) {
    addError(
      errors,
      "Contact requires a name, email, or phone number."
    );
  }

  if (
    email &&
    !isValidEmail(
      email
    )
  ) {
    addError(
      errors,
      `Invalid email format: ${payload.email}`
    );
  }

  if (
    phone &&
    !isValidPhone(
      phone
    )
  ) {
    addError(
      errors,
      `Invalid phone number format: ${payload.phone}`
    );
  }
}

// ============================================================

function validateInvoice(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  if (
    hasValue(
      payload.amount
    ) &&
    !isValidNumber(
      payload.amount
    )
  ) {
    addError(
      errors,
      `Invalid invoice amount: ${payload.amount}`
    );
  }

  if (
    hasValue(
      payload.date
    ) &&
    !isValidDateLike(
      payload.date
    )
  ) {
    addError(
      errors,
      `Invalid invoice date: ${payload.date}`
    );
  }

  if (
    hasValue(
      payload.due_date
    ) &&
    !isValidDateLike(
      payload.due_date
    )
  ) {
    addError(
      errors,
      `Invalid invoice due date: ${payload.due_date}`
    );
  }

  if (
    hasValue(
      payload.email
    ) &&
    !isValidEmail(
      payload.email
    )
  ) {
    addError(
      errors,
      `Invalid email format: ${payload.email}`
    );
  }
}

// ============================================================

function validateExpense(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  if (
    hasValue(
      payload.amount
    ) &&
    !isValidNumber(
      payload.amount
    )
  ) {
    addError(
      errors,
      `Invalid expense amount: ${payload.amount}`
    );
  }

  if (
    hasValue(
      payload.tax
    ) &&
    !isValidNumber(
      payload.tax
    )
  ) {
    addError(
      errors,
      `Invalid tax amount: ${payload.tax}`
    );
  }

  if (
    hasValue(
      payload.date
    ) &&
    !isValidDateLike(
      payload.date
    )
  ) {
    addError(
      errors,
      `Invalid expense date: ${payload.date}`
    );
  }
}

// ============================================================

function validateProject(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  if (
    !hasValue(
      payload.name
    )
  ) {
    addError(
      errors,
      "Project name is required."
    );
  }

  if (
    hasValue(
      payload.due_date
    ) &&
    !isValidDateLike(
      payload.due_date
    )
  ) {
    addError(
      errors,
      `Invalid project due date: ${payload.due_date}`
    );
  }
}

// ============================================================
// SHARED FIELD VALIDATION
// ============================================================

function validateSharedFields(
  row: ProcessedRow,
  errors: string[]
) {
  const payload =
    row.payload;

  /**
   * Generic numeric amount validation.
   *
   * Target-specific validators give nicer messages, but this
   * catches any other supported row containing an amount.
   */
  if (
    hasValue(
      payload.amount
    ) &&
    !isValidNumber(
      payload.amount
    )
  ) {
    addError(
      errors,
      `Invalid numerical amount: ${payload.amount}`
    );
  }
}

// ============================================================
// MAIN VALIDATOR
// ============================================================

export function validateRows(
  rows: ProcessedRow[]
): ValidationResult {
  const valid:
    ProcessedRow[] = [];

  const invalid:
    ProcessedRow[] = [];

  for (
    const originalRow of
    rows
  ) {
    const errors:
      string[] = [];

    const row:
      ProcessedRow = {
      ...originalRow,

      payload: {
        ...originalRow.payload,
      },

      rawPayload: {
        ...originalRow.rawPayload,
      },

      validationErrors:
        [],
    };

    // ========================================================
    // EMPTY ROW
    // ========================================================

    if (
      !rowHasMeaningfulValues(
        row.payload
      )
    ) {
      addError(
        errors,
        "Row is completely empty."
      );
    }

    // ========================================================
    // TARGET-SPECIFIC RULES
    // ========================================================

    switch (
      row.targetTable
    ) {
      case "organisations":
        validateOrganisation(
          row,
          errors
        );
        break;

      case "contacts":
        validateContact(
          row,
          errors
        );
        break;

      case "invoices":
        validateInvoice(
          row,
          errors
        );
        break;

      case "expenses":
        validateExpense(
          row,
          errors
        );
        break;

      case "projects":
        validateProject(
          row,
          errors
        );
        break;
    }

    // ========================================================
    // SHARED RULES
    // ========================================================

    validateSharedFields(
      row,
      errors
    );

    // ========================================================
    // RESULT
    // ========================================================

    if (
      errors.length >
      0
    ) {
      invalid.push({
        ...row,

        isValid:
          false,

        validationErrors:
          errors,
      });

      continue;
    }

    valid.push({
      ...row,

      isValid:
        true,

      validationErrors:
        [],
    });
  }

  return {
    valid,
    invalid,
  };
}