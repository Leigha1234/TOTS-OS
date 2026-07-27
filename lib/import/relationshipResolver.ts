// ==========================================
// lib/import/relationshipResolver.ts
// ==========================================

import { ProcessedRow } from "./types";

export async function resolveRelationships(
  rows: ProcessedRow[],
  supabase: any,
  orgId: string | null
): Promise<ProcessedRow[]> {

  for (const row of rows) {

    /**
     * Contacts can reference a company name.
     * We need to find/create the organisation record,
     * then attach its ID to the contact.
     */
    if (
      row.targetTable === "contacts" &&
      row.payload.company_name
    ) {

      try {

        const companyName =
          String(row.payload.company_name).trim();


        // Find existing organisation
        const { data: existingCompany } =
          await supabase
            .from("organisations")
            .select("id")
            .eq("name", companyName)
            .maybeSingle();



        if (existingCompany) {

          row.payload.organisation_id =
            existingCompany.id;


        } else {


          // Create organisation
          const { data: newCompany, error } =
            await supabase
              .from("organisations")
              .insert({
                name: companyName
              })
              .select("id")
              .single();


          if (!error && newCompany) {

            row.payload.organisation_id =
              newCompany.id;

          }
        }


        // Remove temporary import field
        delete row.payload.company_name;


      } catch (err) {

        console.error(
          "Relationship resolver error:",
          err
        );

      }
    }


    /**
     * Always attach the user's organisation
     * to child tables only.
     */
    if (
      orgId &&
      row.targetTable !== "organisations" &&
      !row.payload.organisation_id
    ) {

      row.payload.organisation_id = orgId;

    }


    /**
     * Never allow organisations table
     * to receive organisation_id.
     */
    if (row.targetTable === "organisations") {

      delete row.payload.organisation_id;

    }

  }


  return rows;
}