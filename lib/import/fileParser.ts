// ==========================================
// lib/import/fileParser.ts
// ==========================================

import Papa from "papaparse";
import * as XLSX from "xlsx";

import {
  RawRow,
} from "./types";

// ============================================================
// CONSTANTS
// ============================================================

const SUPPORTED_EXTENSIONS = [
  ".csv",
  ".tsv",
  ".xlsx",
  ".xls",
] as const;

const MAX_FILE_SIZE_BYTES =
  25 * 1024 * 1024;

// ============================================================
// HELPERS
// ============================================================

function getFileExtension(
  fileName: string
) {
  const lower =
    fileName
      .trim()
      .toLowerCase();

  return SUPPORTED_EXTENSIONS.find(
    (
      extension
    ) =>
      lower.endsWith(
        extension
      )
  ) ?? null;
}

// ============================================================

function cleanHeader(
  header: unknown
) {
  return String(
    header ?? ""
  )
    /**
     * Remove UTF-8 BOM.
     */
    .replace(
      /^\uFEFF/,
      ""
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

// ============================================================

function cleanStringValue(
  value: string
) {
  return value
    .replace(
      /^\uFEFF/,
      ""
    )
    .trim();
}

// ============================================================

function cleanCellValue(
  value: unknown
): any {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return cleanStringValue(
      value
    );
  }

  if (
    value instanceof
    Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value ===
      "number" ||
    typeof value ===
      "boolean"
  ) {
    return value;
  }

  /**
   * Excel libraries can occasionally return unexpected object
   * values depending on workbook structure.
   */
  if (
    typeof value ===
    "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return String(
        value
      );
    }
  }

  return value;
}

// ============================================================

function rowHasValues(
  row: RawRow
) {
  return Object.values(
    row
  ).some(
    (
      value
    ) => {
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
  );
}

// ============================================================

function cleanRow(
  row: RawRow
): RawRow {
  const cleaned:
    RawRow = {};

  const usedHeaders =
    new Map<
      string,
      number
    >();

  Object.entries(
    row
  ).forEach(
    ([
      rawHeader,
      rawValue,
    ]) => {
      let header =
        cleanHeader(
          rawHeader
        );

      if (
        !header
      ) {
        return;
      }

      /**
       * Protect against duplicate headers.
       *
       * Example:
       *
       * Email | Name | Email
       *
       * becomes:
       *
       * Email
       * Name
       * Email_2
       */
      const normalisedHeader =
        header.toLowerCase();

      const previousCount =
        usedHeaders.get(
          normalisedHeader
        ) ?? 0;

      const newCount =
        previousCount +
        1;

      usedHeaders.set(
        normalisedHeader,
        newCount
      );

      if (
        newCount >
        1
      ) {
        header =
          `${header}_${newCount}`;
      }

      cleaned[
        header
      ] =
        cleanCellValue(
          rawValue
        );
    }
  );

  return cleaned;
}

// ============================================================

function cleanRows(
  rows: RawRow[]
) {
  return rows
    .map(
      cleanRow
    )
    .filter(
      rowHasValues
    );
}

// ============================================================
// CSV / TSV
// ============================================================

async function parseDelimitedFile(
  file: File,
  delimiter?: string
): Promise<RawRow[]> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      Papa.parse<RawRow>(
        file,
        {
          header:
            true,

          skipEmptyLines:
            "greedy",

          delimiter:
            delimiter ?? "",

          transformHeader: (
            header
          ) =>
            cleanHeader(
              header
            ),

          transform: (
            value
          ) =>
            cleanCellValue(
              value
            ),

          complete: (
            results
          ) => {
            /**
             * PapaParse can technically complete while still
             * reporting parsing problems.
             */
            const seriousErrors =
              results.errors.filter(
                (
                  error
                ) =>
                  error.code !==
                  "UndetectableDelimiter"
              );

            if (
              seriousErrors.length >
              0
            ) {
              const firstError =
                seriousErrors[
                  0
                ];

              const rowText =
                typeof firstError.row ===
                "number"
                  ? ` at row ${firstError.row + 1}`
                  : "";

              reject(
                new Error(
                  `Failed to parse spreadsheet${rowText}: ${firstError.message}`
                )
              );

              return;
            }

            const cleaned =
              cleanRows(
                results.data
              );

            if (
              cleaned.length ===
              0
            ) {
              reject(
                new Error(
                  "The uploaded file does not contain any usable data rows."
                )
              );

              return;
            }

            resolve(
              cleaned
            );
          },

          error: (
            error
          ) => {
            reject(
              new Error(
                `Failed to read the uploaded file: ${error.message}`
              )
            );
          },
        }
      );
    }
  );
}

// ============================================================
// EXCEL
// ============================================================

async function parseExcelFile(
  file: File
): Promise<RawRow[]> {
  try {
    const arrayBuffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(
        arrayBuffer,
        {
          type:
            "array",

          /**
           * Return actual Date objects where possible.
           */
          cellDates:
            true,

          /**
           * Avoid executing or evaluating workbook formulas.
           */
          cellFormula:
            false,

          cellHTML:
            false,

          cellText:
            false,
        }
      );

    if (
      !workbook.SheetNames ||
      workbook.SheetNames.length ===
        0
    ) {
      throw new Error(
        "The workbook does not contain any worksheets."
      );
    }

    /**
     * For now the Import Hub imports the first non-empty sheet.
     *
     * This is safer than blindly assuming SheetNames[0]
     * contains the data.
     */
    let parsedRows:
      RawRow[] =
      [];

    for (
      const sheetName of
      workbook.SheetNames
    ) {
      const worksheet =
        workbook.Sheets[
          sheetName
        ];

      if (
        !worksheet
      ) {
        continue;
      }

      const rows =
        XLSX.utils.sheet_to_json<RawRow>(
          worksheet,
          {
            defval:
              "",

            raw:
              true,

            blankrows:
              false,
          }
        );

      const cleaned =
        cleanRows(
          rows
        );

      if (
        cleaned.length >
        0
      ) {
        parsedRows =
          cleaned;

        break;
      }
    }

    if (
      parsedRows.length ===
      0
    ) {
      throw new Error(
        "The workbook does not contain any usable data rows."
      );
    }

    return parsedRows;
  } catch (
    error:
      unknown
  ) {
    const message =
      error instanceof
        Error
        ? error.message
        : String(
            error
          );

    throw new Error(
      `Failed to parse Excel file: ${message}`
    );
  }
}

// ============================================================
// PUBLIC FILE PARSER
// ============================================================

export async function parseFile(
  file: File
): Promise<RawRow[]> {
  // ==========================================================
  // BASIC VALIDATION
  // ==========================================================

  if (
    !file
  ) {
    throw new Error(
      "No file was provided."
    );
  }

  if (
    file.size ===
    0
  ) {
    throw new Error(
      "The uploaded file is empty."
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE_BYTES
  ) {
    throw new Error(
      "The uploaded file is too large. Please use a file smaller than 25 MB."
    );
  }

  const extension =
    getFileExtension(
      file.name
    );

  if (
    !extension
  ) {
    throw new Error(
      "Unsupported file format. Please upload a CSV, TSV, XLSX, or XLS file."
    );
  }

  // ==========================================================
  // CSV
  // ==========================================================

  if (
    extension ===
    ".csv"
  ) {
    return parseDelimitedFile(
      file
    );
  }

  // ==========================================================
  // TSV
  // ==========================================================

  if (
    extension ===
    ".tsv"
  ) {
    return parseDelimitedFile(
      file,
      "\t"
    );
  }

  // ==========================================================
  // EXCEL
  // ==========================================================

  if (
    extension ===
      ".xlsx" ||
    extension ===
      ".xls"
  ) {
    return parseExcelFile(
      file
    );
  }

  /**
   * TypeScript exhaustiveness fallback.
   */
  throw new Error(
    "Unsupported file format."
  );
}