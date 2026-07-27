// ==========================================
// lib/import/batchImporter.ts
// Production batch importer
// ==========================================

import {
  ProcessedRow,
  DuplicateResolutionStrategy,
  BatchImportResult,
} from "./types";

export async function processBatches(
  records: ProcessedRow[],
  supabase: any,
  orgId: string | null,
  strategy: DuplicateResolutionStrategy,
  onProgress?: (batchNum: number, totalBatches: number) => void
): Promise<BatchImportResult> {
  const batchSize = 50;
  const totalBatches = Math.ceil(records.length / batchSize) || 1;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const failedRows: ProcessedRow[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    try {
      for (const row of batch) {
        const targetTable = row.targetTable;

        // Clone payload so original parsed data is untouched
        let payload = {
          ...row.payload,
        };

        /**
         * Organisations are the root entity.
         * They DO NOT contain organisation_id.
         * Every other organisation-owned table does.
         */
        if (
          orgId &&
          targetTable !== "organisations" &&
          !payload.organisation_id
        ) {
          payload.organisation_id = orgId;
        }

        /**
         * Resolve company relationships for contacts.
         */
        if (
          targetTable === "contacts" &&
          payload.company_name &&
          !payload.organisation_id
        ) {
          const { data: existingOrg } = await supabase
            .from("organisations")
            .select("id")
            .eq("name", payload.company_name)
            .maybeSingle();

          if (existingOrg) {
            payload.organisation_id = existingOrg.id;
          } else {
            const { data: createdOrg, error: createOrgError } =
              await supabase
                .from("organisations")
                .upsert(
                  {
                    name: payload.company_name,
                  },
                  {
                    onConflict: "name",
                  }
                )
                .select("id")
                .single();

            if (!createOrgError && createdOrg) {
              payload.organisation_id = createdOrg.id;
            }
          }

          delete payload.company_name;
        }


        /**
         * Clean organisation payload.
         *
         * IMPORTANT:
         * organisations.id is the organisation identifier.
         * organisations does NOT have organisation_id.
         */
        if (targetTable === "organisations") {
          delete payload.organisation_id;

          if (payload.company_name && !payload.name) {
            payload.name = payload.company_name;
          }

          if (payload.date_created && !payload.created_at) {
            payload.created_at = payload.date_created;
          }

          delete payload.company_name;
          delete payload.date_created;
          delete payload.opportunity_id;
        }


        /**
         * Remove empty undefined values before sending.
         */
        Object.keys(payload).forEach((key) => {
          if (
            payload[key] === undefined ||
            payload[key] === null ||
            payload[key] === ""
          ) {
            delete payload[key];
          }
        });


        /**
         * Debug organisation imports.
         * Remove later once confirmed working.
         */
        if (targetTable === "organisations") {
          console.log(
            "ORGANISATION IMPORT PAYLOAD:",
            JSON.stringify(payload, null, 2)
          );
        }


        /**
         * Determine conflict key.
         */
        let conflictColumn = "id";

        if (targetTable === "organisations") {
          conflictColumn = "name";
        }

        if (targetTable === "contacts") {
          conflictColumn = "email";
        }


        /**
         * Upsert data.
         */
        const { error } = await supabase
          .from(targetTable)
          .upsert(payload, {
            onConflict: conflictColumn,
            ignoreDuplicates: strategy === "skip",
          });


        if (error) {
          console.error(
            "Supabase Import Error Details:",
            {
              table: targetTable,
              payload,
              error,
            }
          );

          failed++;

          failedRows.push({
            ...row,
            isValid: false,
            validationErrors: [
              ...row.validationErrors,
              error.message,
            ],
          });

        } else {

          if (strategy === "update") {
            updated++;
          } else {
            inserted++;
          }

        }
      }

    } catch (err: any) {

      console.error(
        "Batch Import Exception:",
        err
      );

      failed += batch.length;

      batch.forEach((row) => {
        failedRows.push({
          ...row,
          isValid: false,
          validationErrors: [
            ...row.validationErrors,
            err.message,
          ],
        });
      });
    }


    /**
     * Update progress.
     */
    onProgress?.(
      batchNum,
      totalBatches
    );
  }


  return {
    inserted,
    updated,
    skipped,
    failed,
    failedRows,
  };
}