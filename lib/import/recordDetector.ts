// ==========================================
// lib/import/recordDetector.ts
// ==========================================

import { RawRow, ProcessedRow, TargetTableType } from "./types";

export function detectRecords(
  rawRows: RawRow[],
  targetTableOverride: TargetTableType,
  orgId: string | null,
  userId: string
): ProcessedRow[] {

  return rawRows.map((row, index) => {

    let targetTable = targetTableOverride;

    if (targetTable === "auto") {

      const keys = Object.keys(row)
        .map((k) => k.toLowerCase());

      if (
        keys.some(
          (k) =>
            k.includes("email") ||
            k.includes("phone") ||
            k.includes("contact")
        )
      ) {
        targetTable = "contacts" as TargetTableType;

      } else if (
        keys.some(
          (k) =>
            k.includes("invoice") ||
            k.includes("amount") ||
            k.includes("total")
        )
      ) {
        targetTable = "invoices" as TargetTableType;

      } else if (
        keys.some(
          (k) =>
            k.includes("project") ||
            k.includes("task")
        )
      ) {
        targetTable = "projects" as TargetTableType;

      } else {
        targetTable = "organisations" as TargetTableType;
      }
    }


    const payload: Record<string, any> = {};


    for (const [key, val] of Object.entries(row)) {

      const cleanKey = key
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "_");


      if (
        [
          "name",
          "full_name",
          "contact_name"
        ].includes(cleanKey)
      ) {
        payload.name = val;


      } else if (
        [
          "email",
          "email_address"
        ].includes(cleanKey)
      ) {
        payload.email = val;


      } else if (
        [
          "phone",
          "telephone",
          "mobile"
        ].includes(cleanKey)
      ) {
        payload.phone = val;


      } else if (
        [
          "company",
          "organisation",
          "company_name",
          "org_name"
        ].includes(cleanKey)
      ) {

        payload.company_name = val;


      } else if (
        [
          "role",
          "job_title",
          "position"
        ].includes(cleanKey)
      ) {

        payload.role = val;


      } else if (
        [
          "amount",
          "total",
          "value"
        ].includes(cleanKey)
      ) {

        payload.amount =
          val
            ? parseFloat(String(val).replace(/[£,]/g, ""))
            : null;


      } else if (
        cleanKey === "status"
      ) {

        payload.status = val;


      } else if (
        [
          "description",
          "notes",
          "memo"
        ].includes(cleanKey)
      ) {

        payload.description = val;


      } else {

        payload[cleanKey] = val;
      }
    }


    /**
     * IMPORTANT:
     *
     * organisations is the root table.
     * It does not have organisation_id.
     *
     * Only attach organisation_id
     * to child tables.
     */
    if (
      orgId &&
      targetTable !== "organisations"
    ) {
      payload.organisation_id = orgId;
    }


    /**
     * Clean organisation payload.
     */
    if (targetTable === "organisations") {

      delete payload.organisation_id;

      if (
        payload.company_name &&
        !payload.name
      ) {
        payload.name = payload.company_name;
      }

      delete payload.company_name;
    }


    return {
      id: `row_${index + 1}`,
      targetTable:
        targetTable === "organisations"
          ? "organisations"
          : targetTable,

      payload,

      rawPayload: row,

      isValid: true,

      validationErrors: []
    };
  });
}