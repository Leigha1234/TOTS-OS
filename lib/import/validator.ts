// ==========================================
// 6. lib/import/validator.ts
// ==========================================

import {
  ProcessedRow,
  ValidationResult
} from "./types";


export function validateRows(
  rows: ProcessedRow[]
): ValidationResult {


  const valid: ProcessedRow[] = [];
  const invalid: ProcessedRow[] = [];


  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  const phoneRegex =
    /^[\d\s\+\-\(\)ext\.]+$/i;



  for (const row of rows) {

    const errors: string[] = [];

    const payload = row.payload;



    /**
     * Empty row check
     */
    const hasValues =
      Object.entries(payload)
        .some(
          ([key, value]) =>
            key !== "organisation_id" &&
            value !== null &&
            value !== undefined &&
            value !== ""
        );


    if (!hasValues) {
      errors.push(
        "Row is completely empty."
      );
    }



    /**
     * Organisation validation
     */
    if (
      row.targetTable === "organisations"
    ) {

      if (
        !payload.name ||
        String(payload.name).trim() === ""
      ) {
        errors.push(
          "Organisation name is required."
        );
      }

    }



    /**
     * Contact validation
     */
    if (
      row.targetTable === "contacts"
    ) {

      if (
        !payload.name &&
        !payload.email
      ) {
        errors.push(
          "Contact requires a name or email."
        );
      }


      if (
        payload.email &&
        !emailRegex.test(
          String(payload.email)
        )
      ) {

        errors.push(
          `Invalid email format: ${payload.email}`
        );

      }


      if (
        payload.phone &&
        !phoneRegex.test(
          String(payload.phone)
        )
      ) {

        errors.push(
          `Invalid phone number format: ${payload.phone}`
        );

      }

    }



    /**
     * Amount validation
     */
    if (
      payload.amount !== undefined &&
      payload.amount !== null
    ) {

      const amount =
        Number(payload.amount);


      if (
        Number.isNaN(amount) ||
        amount < 0
      ) {

        errors.push(
          `Invalid numerical amount: ${payload.amount}`
        );

      }

    }



    if (errors.length > 0) {

      invalid.push({
        ...row,
        isValid: false,
        validationErrors: errors
      });


    } else {

      valid.push({
        ...row,
        isValid: true,
        validationErrors: []
      });

    }

  }


  return {
    valid,
    invalid
  };
}