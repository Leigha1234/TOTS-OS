// ==========================================
// app/(dashboard)/settings/import/page.tsx
// ==========================================

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSearch,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import {
  parseFile,
} from "@/lib/import/fileParser";

import {
  detectRecords,
} from "@/lib/import/recordDetector";

import {
  resolveRelationships,
} from "@/lib/import/relationshipResolver";

import {
  validateRows,
} from "@/lib/import/validator";

import {
  checkDuplicates,
} from "@/lib/import/duplicateChecker";

import {
  processBatches,
} from "@/lib/import/batchImporter";

import {
  ProgressTracker,
} from "@/lib/import/progressTracker";

import {
  generateImportReport,
} from "@/lib/import/reportGenerator";

import {
  DuplicateResolutionStrategy,
  ImportProgress,
  ImportReport as ImportReportType,
  ImportStatus,
  ProcessedRow,
  RawRow,
  TargetTableType,
} from "@/lib/import/types";

// ============================================================
// SUPABASE
// ============================================================

const supabase =
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// ============================================================
// LOCAL TYPES
// ============================================================

type AuditEntry = {
  success:
    boolean;

  identifier:
    string;

  entity:
    string;

  details:
    string;

  destination?:
    string;

  action?:
    "inserted" |
    "updated" |
    "skipped" |
    "failed";
};

type AnalysisSnapshot = {
  userId:
    string;

  organisationId:
    string;

  rawRows:
    RawRow[];

  detectedRows:
    ProcessedRow[];

  resolvedRows:
    ProcessedRow[];

  validRows:
    ProcessedRow[];

  invalidRows:
    ProcessedRow[];

  duplicateRows:
    ProcessedRow[];

  recordsToProcess:
    ProcessedRow[];
};

// ============================================================
// CONSTANTS
// ============================================================

const INITIAL_PROGRESS:
  ImportProgress = {
  phase:
    "idle",

  percent:
    0,

  currentBatch:
    0,

  totalBatches:
    1,

  processedRows:
    0,

  elapsedMs:
    0,

  etaMs:
    0,
};

const TARGET_TABLES: {
  id:
    TargetTableType;

  label:
    string;

  description:
    string;

  entityName:
    string;
}[] = [
  {
    id:
      "auto",

    label:
      "Auto-Detect",

    description:
      "Analyse the structure of the uploaded dataset and choose the most appropriate supported TOTS-OS destination.",

    entityName:
      "record",
  },

  {
    id:
      "contacts",

    label:
      "Contacts & CRM",

    description:
      "Import people, customers and member contact data into your CRM.",

    entityName:
      "contact",
  },

  {
    id:
      "organisations",

    label:
      "Organisations",

    description:
      "Import genuine company and organisation records.",

    entityName:
      "organisation",
  },

  {
    id:
      "invoices",

    label:
      "Finance & Invoices",

    description:
      "Import supported invoice data while preserving available source information.",

    entityName:
      "invoice",
  },

  {
    id:
      "expenses",

    label:
      "Expenses & Receipts",

    description:
      "Import supported expense records and finance metadata.",

    entityName:
      "expense",
  },

  {
    id:
      "projects",

    label:
      "Projects",

    description:
      "Import supported project records into your workspace.",

    entityName:
      "project",
  },
];

// ============================================================
// GENERIC HELPERS
// ============================================================

function normaliseKey(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}

// ============================================================

function getObjectValue(
  object:
    Record<
      string,
      unknown
    > | null |
    undefined,

  aliases:
    string[]
) {
  if (
    !object
  ) {
    return undefined;
  }

  const entries =
    Object.entries(
      object
    );

  for (
    const alias of
    aliases
  ) {
    const expected =
      normaliseKey(
        alias
      );

    const match =
      entries.find(
        ([
          key,
        ]) =>
          normaliseKey(
            key
          ) ===
          expected
      );

    if (
      !match
    ) {
      continue;
    }

    const value =
      match[
        1
      ];

    if (
      value !==
        undefined &&
      value !==
        null &&
      String(
        value
      ).trim() !==
        ""
    ) {
      return value;
    }
  }

  return undefined;
}

// ============================================================

function stringValue(
  value:
    unknown
) {
  if (
    value ===
      undefined ||
    value ===
      null
  ) {
    return "";
  }

  return String(
    value
  ).trim();
}

// ============================================================

function getRowEmail(
  row:
    ProcessedRow
) {
  const payload =
    row.payload as Record<
      string,
      unknown
    >;

  const raw =
    row.rawPayload;

  return stringValue(
    getObjectValue(
      payload,
      [
        "email",
        "mail",
        "email_address",
        "email address",
        "subscriber",
        "subscriber_email",
        "subscriber email",
      ]
    ) ??
      getObjectValue(
        raw,
        [
          "email",
          "mail",
          "email_address",
          "email address",
          "subscriber",
          "subscriber_email",
          "subscriber email",
        ]
      )
  )
    .toLowerCase();
}

// ============================================================

function getRowPhone(
  row:
    ProcessedRow
) {
  const payload =
    row.payload as Record<
      string,
      unknown
    >;

  const raw =
    row.rawPayload;

  return stringValue(
    getObjectValue(
      payload,
      [
        "phone",
        "telephone",
        "mobile",
        "phone_number",
        "phone number",
      ]
    ) ??
      getObjectValue(
        raw,
        [
          "phone",
          "telephone",
          "mobile",
          "phone_number",
          "phone number",
        ]
      )
  );
}

// ============================================================

function getContactName(
  row:
    ProcessedRow
) {
  const payload =
    row.payload as Record<
      string,
      unknown
    >;

  const raw =
    row.rawPayload;

  const explicitName =
    stringValue(
      getObjectValue(
        payload,
        [
          "name",
          "full_name",
          "full name",
          "contact_name",
          "contact name",
        ]
      ) ??
        getObjectValue(
          raw,
          [
            "name",
            "full_name",
            "full name",
            "contact_name",
            "contact name",
          ]
        )
    );

  if (
    explicitName
  ) {
    return explicitName;
  }

  const firstName =
    stringValue(
      getObjectValue(
        payload,
        [
          "first_name",
          "first name",
          "firstname",
        ]
      ) ??
        getObjectValue(
          raw,
          [
            "first_name",
            "first name",
            "firstname",
          ]
        )
    );

  const lastName =
    stringValue(
      getObjectValue(
        payload,
        [
          "last_name",
          "last name",
          "lastname",
          "surname",
        ]
      ) ??
        getObjectValue(
          raw,
          [
            "last_name",
            "last name",
            "lastname",
            "surname",
          ]
        )
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

function getRowIdentifier(
  row:
    ProcessedRow,

  fallback:
    string
) {
  const payload =
    row.payload as Record<
      string,
      unknown
    >;

  const contactName =
    getContactName(
      row
    );

  if (
    contactName
  ) {
    return contactName;
  }

  const identifier =
    stringValue(
      getObjectValue(
        payload,
        [
          "name",
          "company_name",
          "company name",
          "project_name",
          "project name",
          "title",
          "description",
          "invoice_number",
          "invoice number",
          "expense_number",
          "expense number",
          "reference",
        ]
      )
    );

  if (
    identifier
  ) {
    return identifier;
  }

  const email =
    getRowEmail(
      row
    );

  if (
    email
  ) {
    return email;
  }

  const phone =
    getRowPhone(
      row
    );

  if (
    phone
  ) {
    return phone;
  }

  return fallback;
}

// ============================================================

function getEntityLabel(
  table:
    unknown
) {
  const destination =
    String(
      table ??
        ""
    );

  const match =
    TARGET_TABLES.find(
      (
        target
      ) =>
        target.id ===
        destination
    );

  if (
    match
  ) {
    return match.entityName;
  }

  if (
    destination.endsWith(
      "s"
    )
  ) {
    return destination.slice(
      0,
      -1
    );
  }

  return (
    destination ||
    "record"
  );
}

// ============================================================

function createRowSignature(
  row:
    ProcessedRow
) {
  const target =
    String(
      row.targetTable ??
        ""
    );

  const email =
    getRowEmail(
      row
    );

  const identifier =
    getRowIdentifier(
      row,
      ""
    )
      .toLowerCase()
      .trim();

  const raw =
    JSON.stringify(
      row.rawPayload ??
        {}
    );

  return [
    target,
    email,
    identifier,
    raw,
  ].join(
    "::"
  );
}

// ============================================================

function escapeCsvValue(
  value:
    unknown
) {
  const string =
    String(
      value ??
        ""
    );

  return `"${string.replace(
    /"/g,
    '""'
  )}"`;
}

// ============================================================

function getFailedDownloadFilename(
  sourceFilename:
    string
) {
  const cleaned =
    sourceFilename
      .trim()
      .replace(
        /\.[^.]+$/,
        ""
      );

  return `${
    cleaned ||
    "import"
  }_failed_rows.csv`;
}

// ============================================================

function downloadRowsAsCsv(
  rows:
    ProcessedRow[],

  filename:
    string
) {
  if (
    rows.length ===
    0
  ) {
    return;
  }

  const rawObjects =
    rows.map(
      (
        row
      ) =>
        (
          row.rawPayload ??
          row.payload ??
          {}
        ) as Record<
          string,
          unknown
        >
    );

  const headerSet =
    new Set<
      string
    >();

  rawObjects.forEach(
    (
      object
    ) => {
      Object.keys(
        object
      ).forEach(
        (
          key
        ) => {
          headerSet.add(
            key
          );
        }
      );
    }
  );

  const headers =
    Array.from(
      headerSet
    );

  if (
    headers.length ===
    0
  ) {
    return;
  }

  const csv =
    [
      headers
        .map(
          escapeCsvValue
        )
        .join(
          ","
        ),

      ...rawObjects.map(
        (
          object
        ) =>
          headers
            .map(
              (
                header
              ) =>
                escapeCsvValue(
                  object[
                    header
                  ]
                )
            )
            .join(
              ","
            )
      ),
    ].join(
      "\n"
    );

  const blob =
    new Blob(
      [
        "\uFEFF",
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      }
    );

  const url =
    window.URL
      .createObjectURL(
        blob
      );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  window.URL.revokeObjectURL(
    url
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ImportArchitecture() {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  // ==========================================================
  // BASIC UI STATE
  // ==========================================================

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<ImportStatus>(
      "idle"
    );

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const [
    selectedTargetTable,
    setSelectedTargetTable,
  ] =
    useState<TargetTableType>(
      "auto"
    );

  const [
    duplicateStrategy,
    setDuplicateStrategy,
  ] =
    useState<DuplicateResolutionStrategy>(
      "update"
    );

  // ==========================================================
  // PIPELINE STATE
  // ==========================================================

  const [
    progress,
    setProgress,
  ] =
    useState<ImportProgress>(
      INITIAL_PROGRESS
    );

  const [
    analysis,
    setAnalysis,
  ] =
    useState<AnalysisSnapshot | null>(
      null
    );

  const [
    previewRows,
    setPreviewRows,
  ] =
    useState<ProcessedRow[]>(
      []
    );

  const [
    failedRows,
    setFailedRows,
  ] =
    useState<ProcessedRow[]>(
      []
    );

  const [
    processedLogRows,
    setProcessedLogRows,
  ] =
    useState<AuditEntry[]>(
      []
    );

  const [
    duplicateCount,
    setDuplicateCount,
  ] =
    useState(
      0
    );

  const [
    report,
    setReport,
  ] =
    useState<ImportReportType | null>(
      null
    );

  // ==========================================================
  // CLOCK
  // ==========================================================

  useEffect(
    () => {
      const update =
        () => {
          setCurrentTime(
            new Date()
              .toLocaleTimeString(
                [],
                {
                  hour:
                    "2-digit",

                  minute:
                    "2-digit",
                }
              )
          );
        };

      update();

      const timer =
        window.setInterval(
          update,
          1000
        );

      return () =>
        window.clearInterval(
          timer
        );
    },
    []
  );

  // ==========================================================
  // RESET ANALYSIS
  // ==========================================================

  const resetAnalysis =
    useCallback(
      (
        preserveFile =
          true
      ) => {
        setStatus(
          "idle"
        );

        setErrorMessage(
          ""
        );

        setAnalysis(
          null
        );

        setPreviewRows(
          []
        );

        setFailedRows(
          []
        );

        setProcessedLogRows(
          []
        );

        setDuplicateCount(
          0
        );

        setReport(
          null
        );

        setProgress(
          INITIAL_PROGRESS
        );

        if (
          !preserveFile
        ) {
          setFile(
            null
          );

          if (
            fileInputRef.current
          ) {
            fileInputRef.current.value =
              "";
          }
        }
      },
      []
    );

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  const handleFileSelect =
    useCallback(
      (
        event:
          React.ChangeEvent<HTMLInputElement>
      ) => {
        const selectedFile =
          event.target
            .files?.[
              0
            ];

        if (
          !selectedFile
        ) {
          return;
        }

        const extension =
          selectedFile.name
            .split(
              "."
            )
            .pop()
            ?.toLowerCase();

        const allowed =
          new Set(
            [
              "csv",
              "xlsx",
              "xls",
              "tsv",
            ]
          );

        if (
          !extension ||
          !allowed.has(
            extension
          )
        ) {
          resetAnalysis(
            false
          );

          setStatus(
            "error"
          );

          setErrorMessage(
            "Unsupported file type. Upload a CSV, XLSX, XLS or TSV file."
          );

          return;
        }

        resetAnalysis(
          true
        );

        setFile(
          selectedFile
        );
      },
      [
        resetAnalysis,
      ]
    );

  // ==========================================================
  // TARGET CHANGE
  // ==========================================================

  const selectTarget =
    useCallback(
      (
        target:
          TargetTableType
      ) => {
        if (
          status ===
          "processing"
        ) {
          return;
        }

        setSelectedTargetTable(
          target
        );

        setStatus(
          "idle"
        );

        setAnalysis(
          null
        );

        setPreviewRows(
          []
        );

        setFailedRows(
          []
        );

        setProcessedLogRows(
          []
        );

        setDuplicateCount(
          0
        );

        setReport(
          null
        );

        setErrorMessage(
          ""
        );

        setProgress(
          INITIAL_PROGRESS
        );
      },
      [
        status,
      ]
    );

  // ==========================================================
  // AUTH + WORKSPACE
  // ==========================================================

  const getWorkspaceContext =
    useCallback(
      async () => {
        const {
          data:
            authData,

          error:
            authError,
        } =
          await supabase
            .auth
            .getUser();

        if (
          authError
        ) {
          throw authError;
        }

        const user =
          authData.user;

        if (
          !user
        ) {
          throw new Error(
            "You must be signed in before importing data."
          );
        }

        const {
          data:
            profile,

          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "organisation_id"
            )
            .eq(
              "id",
              user.id
            )
            .single();

        if (
          profileError
        ) {
          throw profileError;
        }

        const organisationId =
          String(
            profile
              ?.organisation_id ??
              ""
          ).trim();

        if (
          !organisationId
        ) {
          throw new Error(
            "No organisation is linked to this account. Importing has been stopped to prevent data being written outside a workspace."
          );
        }

        return {
          userId:
            user.id,

          organisationId,
        };
      },
      []
    );

  // ==========================================================
  // BUILD DETECTED RECORDS
  // ==========================================================

  const buildDetectedRecords =
    useCallback(
      (
        rawRows:
          RawRow[],

        organisationId:
          string,

        userId:
          string
      ) => {
        /**
         * recordDetector.ts is the source of truth for deciding
         * what this dataset represents.
         *
         * We deliberately DO NOT:
         *
         * - manufacture organisations from contact names
         * - fan contacts out into multiple tables
         * - overwrite target tables here
         *
         * RelationshipResolver then applies safe workspace
         * ownership before validation.
         */
        return detectRecords(
          rawRows,
          selectedTargetTable,
          organisationId,
          userId
        );
      },
      [
        selectedTargetTable,
      ]
    );

  // ==========================================================
  // ANALYSE FILE — DOES NOT WRITE
  // ==========================================================

  const analyseFile =
    useCallback(
      async () => {
        if (
          !file
        ) {
          return;
        }

        setStatus(
          "processing"
        );

        setErrorMessage(
          ""
        );

        setReport(
          null
        );

        setProcessedLogRows(
          []
        );

        setFailedRows(
          []
        );

        setAnalysis(
          null
        );

        const tracker =
          new ProgressTracker(
            (
              next
            ) => {
              setProgress(
                next
              );
            }
          );

        try {
          // --------------------------------------------------
          // 1. WORKSPACE
          // --------------------------------------------------

          tracker.update(
            "authorising",
            5,
            0,
            1
          );

          const {
            userId,
            organisationId,
          } =
            await getWorkspaceContext();

          // --------------------------------------------------
          // 2. FILE PARSING
          // --------------------------------------------------

          tracker.update(
            "reading",
            15,
            0,
            1
          );

          const rawRows =
            await parseFile(
              file
            );

          if (
            rawRows.length ===
            0
          ) {
            throw new Error(
              "No data rows were found in this file."
            );
          }

          // --------------------------------------------------
          // 3. RECORD DETECTION
          // --------------------------------------------------

          tracker.update(
            "detecting",
            30,
            0,
            1
          );

          const detectedRows =
            buildDetectedRecords(
              rawRows,
              organisationId,
              userId
            );

          if (
            detectedRows.length ===
            0
          ) {
            throw new Error(
              "TOTS-OS could not detect any importable records in this file."
            );
          }

          // --------------------------------------------------
          // 4. RELATIONSHIPS
          //
          // IMPORTANT:
          // Current resolver performs no DB writes.
          // It safely applies workspace ownership and cleans
          // temporary relationship metadata.
          // --------------------------------------------------

          tracker.update(
            "resolving_relationships",
            40,
            0,
            1
          );

          const resolvedRows =
            await resolveRelationships(
              detectedRows,
              supabase,
              organisationId
            );

          // --------------------------------------------------
          // 5. VALIDATION
          // --------------------------------------------------

          tracker.update(
            "validating",
            52,
            0,
            1
          );

          const validationResult =
            validateRows(
              resolvedRows
            );

          if (
            validationResult
              .valid
              .length ===
              0 &&
            validationResult
              .invalid
              .length ===
              0
          ) {
            throw new Error(
              "No structured records were returned after validation."
            );
          }

          // --------------------------------------------------
          // 6. DUPLICATE CHECK
          // --------------------------------------------------

          tracker.update(
            "checking_duplicates",
            70,
            0,
            1
          );

          const duplicateResult =
            await checkDuplicates(
              validationResult.valid,
              supabase,
              organisationId
            );

          // --------------------------------------------------
          // 7. STORE PREVIEW
          // --------------------------------------------------

          tracker.update(
            "preview_ready",
            100,
            1,
            1,
            rawRows.length
          );

          const snapshot:
            AnalysisSnapshot = {
            userId,

            organisationId,

            rawRows,

            detectedRows,

            resolvedRows,

            validRows:
              duplicateResult
                .recordsToProcess,

            invalidRows:
              validationResult.invalid,

            duplicateRows:
              duplicateResult.duplicates,

            recordsToProcess:
              duplicateResult.recordsToProcess,
          };

          setAnalysis(
            snapshot
          );

          setFailedRows(
            validationResult.invalid
          );

          setDuplicateCount(
            duplicateResult
              .duplicates
              .length
          );

          /**
           * Preview the duplicate-aware records rather than the
           * original validation result so duplicate badges can
           * be shown correctly.
           */
          setPreviewRows(
            duplicateResult
              .recordsToProcess
              .slice(
                0,
                12
              )
          );

          /**
           * Analysis is complete.
           *
           * Database has NOT been changed.
           */
          setStatus(
            "idle"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS IMPORT] Analysis failed:",
            error
          );

          setStatus(
            "error"
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "The file could not be analysed."
          );
        }
      },
      [
        file,
        buildDetectedRecords,
        getWorkspaceContext,
      ]
    );

  // ==========================================================
  // EXECUTE CONFIRMED IMPORT
  // ==========================================================

  const executeImport =
    useCallback(
      async () => {
        if (
          !file ||
          !analysis
        ) {
          return;
        }

        setStatus(
          "processing"
        );

        setErrorMessage(
          ""
        );

        setReport(
          null
        );

        setProcessedLogRows(
          []
        );

        const tracker =
          new ProgressTracker(
            (
              next
            ) => {
              setProgress(
                next
              );
            }
          );

        try {
          // --------------------------------------------------
          // 1. RE-AUTHORISE
          // --------------------------------------------------

          tracker.update(
            "authorising",
            5,
            0,
            1
          );

          const currentContext =
            await getWorkspaceContext();

          if (
            currentContext
              .userId !==
              analysis.userId ||
            currentContext
              .organisationId !==
              analysis.organisationId
          ) {
            throw new Error(
              "Your active workspace changed after this file was analysed. Analyse the file again before importing."
            );
          }

          // --------------------------------------------------
          // 2. NOTHING TO PROCESS
          // --------------------------------------------------

          if (
            analysis
              .recordsToProcess
              .length ===
            0
          ) {
            throw new Error(
              "There are no valid records ready to import."
            );
          }

          // --------------------------------------------------
          // 3. IMPORT
          // --------------------------------------------------

          tracker.update(
            "importing",
            15,
            0,
            1
          );

          const importResult =
            await processBatches(
              analysis.recordsToProcess,
              supabase,
              analysis.organisationId,
              duplicateStrategy,
              (
                batchNum,
                totalBatches
              ) => {
                const safeTotal =
                  Math.max(
                    totalBatches,
                    1
                  );

                const percent =
                  15 +
                  Math.floor(
                    (
                      batchNum /
                      safeTotal
                    ) *
                      75
                  );

                const estimatedProcessed =
                  Math.min(
                    analysis
                      .recordsToProcess
                      .length,

                    Math.ceil(
                      (
                        batchNum /
                        safeTotal
                      ) *
                        analysis
                          .recordsToProcess
                          .length
                    )
                  );

                tracker.update(
                  "importing",
                  Math.min(
                    percent,
                    90
                  ),
                  batchNum,
                  safeTotal,
                  estimatedProcessed
                );
              }
            );

          // --------------------------------------------------
          // 4. REAL FAILED ROWS
          // --------------------------------------------------

          const executionFailures =
            Array.isArray(
              importResult
                .failedRows
            )
              ? importResult.failedRows
              : [];

          const allFailures =
            [
              ...analysis.invalidRows,
              ...executionFailures,
            ];

          setFailedRows(
            allFailures
          );

          // --------------------------------------------------
          // 5. REMOVE FAILED RECORDS FROM SUCCESS LEDGER
          // --------------------------------------------------

          const failedSignatureCounts =
            new Map<
              string,
              number
            >();

          executionFailures.forEach(
            (
              row
            ) => {
              const signature =
                createRowSignature(
                  row
                );

              failedSignatureCounts.set(
                signature,
                (
                  failedSignatureCounts.get(
                    signature
                  ) ??
                  0
                ) +
                  1
              );
            }
          );

          const successfulOrSkippedRows:
            ProcessedRow[] =
            [];

          analysis
            .recordsToProcess
            .forEach(
              (
                row
              ) => {
                const signature =
                  createRowSignature(
                    row
                  );

                const remaining =
                  failedSignatureCounts.get(
                    signature
                  ) ??
                    0;

                if (
                  remaining >
                  0
                ) {
                  failedSignatureCounts.set(
                    signature,
                    remaining -
                      1
                  );

                  return;
                }

                successfulOrSkippedRows.push(
                  row
                );
              }
            );

          // --------------------------------------------------
          // 6. REPORT
          // --------------------------------------------------

          tracker.update(
            "finishing",
            93,
            1,
            1,
            analysis
              .recordsToProcess
              .length
          );

          const finalReport =
            await generateImportReport({
              supabase,

              userId:
                analysis.userId,

              organisationId:
                analysis.organisationId,

              filename:
                file.name,

              durationMs:
                tracker.getElapsedTime(),

              rawRowsCount:
                analysis.rawRows.length,

              importResult,

              invalidCount:
                analysis.invalidRows.length,

              duplicateCount:
                analysis.duplicateRows.length,
            });

          // --------------------------------------------------
          // 7. AUDIT LOG
          // --------------------------------------------------

          const auditEntries:
            AuditEntry[] =
            [];

          successfulOrSkippedRows.forEach(
            (
              row,
              index
            ) => {
              const destination =
                String(
                  row.targetTable
                );

              let action:
                AuditEntry["action"] =
                "inserted";

              let details =
                `Inserted into public.${destination}`;

              /**
               * Duplicate handling is determined by the strategy
               * selected at commit time.
               */
              if (
                row.isDuplicate &&
                duplicateStrategy ===
                  "skip"
              ) {
                action =
                  "skipped";

                details =
                  `Existing matching ${getEntityLabel(
                    destination
                  )} was kept`;
              } else if (
                row.isDuplicate &&
                duplicateStrategy ===
                  "update"
              ) {
                action =
                  "updated";

                details =
                  `Updated matching record in public.${destination}`;
              }

              auditEntries.push({
                success:
                  true,

                action,

                identifier:
                  getRowIdentifier(
                    row,
                    `Record #${index + 1}`
                  ),

                entity:
                  getEntityLabel(
                    destination
                  ),

                destination,

                details,
              });
            }
          );

          executionFailures.forEach(
            (
              row,
              index
            ) => {
              const destination =
                String(
                  row.targetTable
                );

              const validationErrors =
                Array.isArray(
                  row.validationErrors
                )
                  ? row.validationErrors
                  : [];

              const issue =
                validationErrors[
                  validationErrors.length -
                    1
                ] ||
                "Database import failed";

              auditEntries.push({
                success:
                  false,

                action:
                  "failed",

                identifier:
                  getRowIdentifier(
                    row,
                    `Dataset row #${index + 1}`
                  ),

                entity:
                  getEntityLabel(
                    destination
                  ),

                destination,

                details:
                  String(
                    issue
                  ),
              });
            }
          );

          analysis
            .invalidRows
            .forEach(
              (
                row,
                index
              ) => {
                const destination =
                  String(
                    row.targetTable
                  );

                const validationErrors =
                  Array.isArray(
                    row.validationErrors
                  )
                    ? row.validationErrors
                    : [];

                const issue =
                  validationErrors[
                    validationErrors.length -
                      1
                  ] ||
                  "Validation failed";

                auditEntries.push({
                  success:
                    false,

                  action:
                    "failed",

                  identifier:
                    getRowIdentifier(
                      row,
                      `Source row #${index + 1}`
                    ),

                  entity:
                    getEntityLabel(
                      destination
                    ),

                  destination,

                  details:
                    String(
                      issue
                    ),
                });
              }
            );

          setProcessedLogRows(
            auditEntries
          );

          setReport(
            finalReport
          );

          tracker.complete(
            analysis
              .recordsToProcess
              .length
          );

          setStatus(
            "success"
          );
        } catch (
          error
        ) {
          console.error(
            "[TOTS IMPORT] Import failed:",
            error
          );

          setStatus(
            "error"
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "The import could not be completed."
          );
        }
      },
      [
        analysis,
        duplicateStrategy,
        file,
        getWorkspaceContext,
      ]
    );

  // ==========================================================
  // MAIN ACTION
  // ==========================================================

  const handlePrimaryAction =
    useCallback(
      async () => {
        if (
          !file ||
          status ===
            "processing"
        ) {
          return;
        }

        if (
          analysis
        ) {
          await executeImport();

          return;
        }

        await analyseFile();
      },
      [
        file,
        status,
        analysis,
        analyseFile,
        executeImport,
      ]
    );

  // ==========================================================
  // DOWNLOAD FAILURES
  // ==========================================================

  const downloadFailedRows =
    useCallback(
      () => {
        if (
          failedRows.length ===
          0
        ) {
          return;
        }

        downloadRowsAsCsv(
          failedRows,
          getFailedDownloadFilename(
            file?.name ??
              "import"
          )
        );
      },
      [
        failedRows,
        file,
      ]
    );

  // ==========================================================
  // DERIVED METRICS
  // ==========================================================

  const destinationCounts =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            number
          >();

        const rows =
          analysis
            ?.recordsToProcess ??
          [];

        rows.forEach(
          (
            row
          ) => {
            const destination =
              String(
                row.targetTable
              );

            map.set(
              destination,
              (
                map.get(
                  destination
                ) ??
                  0
              ) +
                1
            );
          }
        );

        return Array.from(
          map.entries()
        )
          .map(
            ([
              destination,
              count,
            ]) => ({
              destination,
              count,
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.count -
              a.count
          );
      },
      [
        analysis,
      ]
    );

  const reportHasFailures =
    Boolean(
      report &&
        Number(
          report.rowsFailed ??
            0
        ) >
          0
    );

  const analysisReady =
    Boolean(
      analysis
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-8 bg-[#faf9f6] p-4 font-sans text-stone-900 md:space-y-12 md:p-8 lg:p-12">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@1,400&family=Inter:wght@300;400;700;900&display=swap");

        .font-serif {
          font-family: "Instrument Serif", serif;
        }

        .font-sans {
          font-family: "Inter", sans-serif;
        }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col items-start justify-between gap-6 border-b border-stone-200 pb-8 md:flex-row md:items-end md:gap-8 md:pb-12">
        <div className="w-full space-y-4 md:w-auto">
          <div className="flex flex-wrap items-center gap-6 text-[#A3B18A]">
            <div className="flex items-center gap-2">
              <Database
                size={12}
                fill="currentColor"
              />

              <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                TOTS-OS Import Pipeline
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock
                size={12}
              />

              <p className="text-[9px] font-black uppercase tracking-[0.4em]">
                {currentTime ||
                  "00:00"}
              </p>
            </div>
          </div>

          <h1 className="font-serif text-5xl italic leading-none tracking-tighter text-stone-900 md:text-7xl">
            Data Import Hub
          </h1>

          <p className="max-w-2xl text-xs leading-6 text-stone-500">
            Analyse existing
            business data,
            preview exactly
            where TOTS-OS will
            send it, check for
            duplicates, then
            confirm the import.
          </p>

          <nav className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/settings"
                )
              }
              disabled={
                status ===
                "processing"
              }
              className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-stone-600 shadow-sm transition hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft
                size={12}
              />

              Return to Settings
            </button>

            {file && (
              <button
                type="button"
                disabled={
                  status ===
                  "processing"
                }
                onClick={() =>
                  resetAnalysis(
                    false
                  )
                }
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-700 disabled:opacity-40"
              >
                <RotateCcw
                  size={12}
                />

                Start over
              </button>
            )}
          </nav>
        </div>

        <motion.button
          whileHover={
            file &&
            status !==
              "processing"
              ? {
                  scale:
                    1.02,
                }
              : undefined
          }
          type="button"
          onClick={() =>
            void handlePrimaryAction()
          }
          disabled={
            !file ||
            status ===
              "processing"
          }
          className={`
            flex
            w-full
            items-center
            justify-center
            gap-4
            rounded-[2rem]
            px-10
            py-5
            shadow-sm
            transition-all
            md:w-auto

            ${
              !file
                ? "cursor-not-allowed bg-stone-100 text-stone-300"
                : analysisReady
                  ? "bg-stone-900 text-white hover:bg-[#A3B18A]"
                  : "bg-[#A3B18A] text-white hover:shadow-xl"
            }
          `}
        >
          {status ===
          "processing" ? (
            <Loader2
              className="animate-spin"
              size={18}
            />
          ) : analysisReady ? (
            <Zap
              size={18}
            />
          ) : (
            <FileSearch
              size={18}
            />
          )}

          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {status ===
            "processing"
              ? `${progress.phase
                  .replace(
                    /_/g,
                    " "
                  )
                  .toUpperCase()} (${progress.percent}%)`
              : analysisReady
                ? `Confirm Import (${analysis?.recordsToProcess.length ?? 0})`
                : "Analyse File"}
          </span>
        </motion.button>
      </header>

      {/* ======================================================
          SAFETY
      ====================================================== */}

      <div className="flex items-start gap-4 rounded-[1.75rem] border border-[#dfe6d7] bg-[#f4f7f0] p-5">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-[#71805f]"
        />

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#647356]">
            Safe import mode
          </p>

          <p className="mt-1.5 max-w-4xl text-[10px] leading-5 text-stone-500">
            Analysing a file
            does not change
            your database.
            TOTS-OS first
            parses, detects,
            resolves workspace
            ownership, validates
            and checks
            duplicates. Records
            are only written
            after you press
            Confirm Import.
          </p>
        </div>
      </div>

      {/* ======================================================
          PIPELINE CANVAS
      ====================================================== */}

      <main className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-12">
        {/* ====================================================
            LEFT
        ==================================================== */}

        <section className="flex min-h-[500px] flex-col items-center justify-center rounded-[3.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-10 lg:col-span-8 lg:p-14">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(
              event
            ) => {
              if (
                (
                  event.key ===
                    "Enter" ||
                  event.key ===
                    " "
                ) &&
                status !==
                  "processing"
              ) {
                fileInputRef
                  .current
                  ?.click();
              }
            }}
            onClick={() => {
              if (
                status !==
                "processing"
              ) {
                fileInputRef
                  .current
                  ?.click();
              }
            }}
            className={`
              group
              flex
              h-full
              w-full
              cursor-pointer
              flex-col
              items-center
              justify-center
              rounded-[3rem]
              border-2
              border-dashed
              p-7
              text-center
              transition-all
              duration-500
              md:p-14

              ${
                file
                  ? "border-[#A3B18A] bg-[#A3B18A]/5"
                  : "border-stone-200 hover:border-[#A3B18A]"
              }

              ${
                status ===
                "processing"
                  ? "pointer-events-none"
                  : ""
              }
            `}
          >
            <input
              type="file"
              ref={
                fileInputRef
              }
              onChange={
                handleFileSelect
              }
              className="hidden"
              accept=".csv,.xlsx,.xls,.tsv"
            />

            <div
              className={`
                mb-8
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-[2.5rem]
                transition-all
                duration-500

                ${
                  status ===
                  "success"
                    ? reportHasFailures
                      ? "bg-amber-100 text-amber-600"
                      : "bg-[#A3B18A] text-white"
                    : analysisReady
                      ? "bg-[#e8efe2] text-[#71805f]"
                      : "bg-[#faf9f6] text-stone-300 group-hover:text-[#A3B18A]"
                }
              `}
            >
              {status ===
              "processing" ? (
                <Loader2
                  className="animate-spin"
                  size={32}
                />
              ) : status ===
                "success" ? (
                reportHasFailures ? (
                  <AlertTriangle
                    size={32}
                  />
                ) : (
                  <CheckCircle2
                    size={32}
                  />
                )
              ) : analysisReady ? (
                <FileSearch
                  size={32}
                />
              ) : (
                <UploadCloud
                  size={32}
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-3xl italic tracking-tight text-stone-900 md:text-4xl">
                {status ===
                  "success"
                  ? reportHasFailures
                    ? "Import completed with some issues"
                    : "Import completed successfully"
                  : analysisReady
                    ? "Analysis complete — ready to review"
                    : file
                      ? file.name
                      : "Select a CSV, XLSX, XLS or TSV file"}
              </h3>

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-stone-400">
                {status ===
                  "success" &&
                report
                  ? `${report.rowsInserted} inserted · ${report.rowsUpdated} updated · ${report.rowsSkipped} skipped · ${report.rowsFailed} failed`
                  : status ===
                      "processing"
                    ? `${progress.phase
                        .replace(
                          /_/g,
                          " "
                        )
                        .toUpperCase()} — ${progress.percent}%`
                    : analysisReady &&
                        analysis
                      ? `${analysis.rawRows.length} source rows · ${analysis.validRows.length} valid records · ${duplicateCount} duplicates · ${analysis.invalidRows.length} invalid`
                      : file
                        ? "File selected. Click Analyse File to inspect it without changing the database."
                        : "Upload existing business data for validation and routing."}
              </p>
            </div>

            {/* ================================================
                ANALYSIS SUMMARY
            ================================================ */}

            {analysis &&
              status !==
                "success" && (
                <div
                  className="mt-8 w-full space-y-6 rounded-3xl border border-stone-200 bg-white p-6 text-left shadow-sm"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">
                        Import Preview
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        Nothing has
                        been written
                        yet.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#e8efe2] px-4 py-2 text-[8px] font-black uppercase tracking-wider text-[#647356]">
                      Ready for confirmation
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <MetricCard
                      label="Source rows"
                      value={
                        analysis
                          .rawRows
                          .length
                      }
                    />

                    <MetricCard
                      label="Valid records"
                      value={
                        analysis
                          .validRows
                          .length
                      }
                    />

                    <MetricCard
                      label="Duplicates"
                      value={
                        duplicateCount
                      }
                    />

                    <MetricCard
                      label="Invalid"
                      value={
                        analysis
                          .invalidRows
                          .length
                      }
                      danger={
                        analysis
                          .invalidRows
                          .length >
                        0
                      }
                    />
                  </div>

                  {/* ==========================================
                      DESTINATIONS
                  ========================================== */}

                  {destinationCounts.length >
                    0 && (
                    <div>
                      <p className="mb-3 text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">
                        Detected destinations
                      </p>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {destinationCounts.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.destination
                              }
                              className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <Database
                                  size={13}
                                  className="text-[#829473]"
                                />

                                <div>
                                  <p className="text-[10px] font-bold text-stone-700">
                                    public.
                                    {
                                      item.destination
                                    }
                                  </p>

                                  <p className="mt-0.5 text-[8px] text-stone-400">
                                    {
                                      getEntityLabel(
                                        item.destination
                                      )
                                    }
                                    s detected
                                  </p>
                                </div>
                              </div>

                              <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black text-stone-600 shadow-sm">
                                {
                                  item.count
                                }
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      PREVIEW
                  ========================================== */}

                  {previewRows.length >
                    0 && (
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">
                          Record preview
                        </p>

                        <span className="text-[8px] font-mono text-stone-400">
                          Showing up to
                          12 records
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-stone-100">
                        {previewRows.map(
                          (
                            row,
                            index
                          ) => {
                            const email =
                              getRowEmail(
                                row
                              );

                            const phone =
                              getRowPhone(
                                row
                              );

                            return (
                              <div
                                key={`${createRowSignature(row)}-${index}`}
                                className="flex flex-col gap-2 border-b border-stone-100 bg-white p-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <FileText
                                    size={14}
                                    className="shrink-0 text-[#A3B18A]"
                                  />

                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-bold text-stone-700">
                                      {getRowIdentifier(
                                        row,
                                        `Record ${index + 1}`
                                      )}
                                    </p>

                                    {(email ||
                                      phone) && (
                                      <p className="mt-0.5 truncate text-[8px] text-stone-400">
                                        {email ||
                                          phone}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                  {row.isDuplicate && (
                                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-amber-600">
                                      Duplicate
                                    </span>
                                  )}

                                  <span className="rounded-full bg-stone-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-stone-400">
                                    {
                                      row.targetTable
                                    }
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      CONFIRMATION MESSAGE
                  ========================================== */}

                  <div className="flex items-start gap-3 rounded-2xl border border-[#dfe6d7] bg-[#f4f7f0] p-4">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-[#71805f]"
                    />

                    <p className="text-[10px] leading-5 text-stone-500">
                      Review the
                      destination and
                      duplicate counts
                      above. When you
                      are happy, use{" "}
                      <strong className="text-stone-700">
                        Confirm Import
                      </strong>{" "}
                      at the top of
                      the page. Only
                      then will TOTS-OS
                      write these
                      records to your
                      workspace.
                    </p>
                  </div>
                </div>
              )}

            {/* ================================================
                FINAL REPORT
            ================================================ */}

            {status ===
              "success" &&
              report && (
                <div
                  className="mt-8 w-full space-y-5 rounded-3xl border border-stone-200 bg-white p-6 text-left shadow-sm"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <div className="flex flex-col gap-2 border-b border-stone-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A3B18A]">
                      Import Summary
                    </span>

                    <span className="text-[9px] font-mono text-stone-400">
                      {(
                        report.durationMs /
                        1000
                      ).toFixed(
                        2
                      )}
                      s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
                    <MetricCard
                      label="Inserted"
                      value={
                        report.rowsInserted
                      }
                    />

                    <MetricCard
                      label="Updated"
                      value={
                        report.rowsUpdated
                      }
                    />

                    <MetricCard
                      label="Skipped"
                      value={
                        report.rowsSkipped
                      }
                    />

                    <MetricCard
                      label="Duplicates"
                      value={
                        report.duplicatesFound
                      }
                    />

                    <MetricCard
                      label="Failed"
                      value={
                        report.rowsFailed
                      }
                      danger={
                        Number(
                          report.rowsFailed
                        ) >
                        0
                      }
                    />
                  </div>

                  {failedRows.length >
                    0 && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-red-700">
                          {
                            failedRows.length
                          }{" "}
                          record
                          {failedRows.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          could not be imported.
                        </p>

                        <p className="mt-1 text-[9px] text-red-500">
                          This includes
                          validation and
                          database failures.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          downloadFailedRows
                        }
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[8px] font-black uppercase tracking-wider text-red-600 shadow-sm transition hover:bg-red-100"
                      >
                        <Download
                          size={12}
                        />

                        Download failures
                      </button>
                    </div>
                  )}
                </div>
              )}

            {/* ================================================
                TRANSACTION LEDGER
            ================================================ */}

            {processedLogRows.length >
              0 &&
              status ===
                "success" && (
                <div
                  className="mt-6 w-full space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-left shadow-sm"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <div className="flex flex-col gap-2 border-b border-stone-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-700">
                      Transaction Ledger
                    </span>

                    <span className="text-[9px] font-mono text-stone-400">
                      {
                        processedLogRows.length
                      }{" "}
                      entries
                    </span>
                  </div>

                  <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
                    {processedLogRows.map(
                      (
                        entry,
                        index
                      ) => (
                        <div
                          key={`${entry.identifier}-${entry.destination}-${index}`}
                          className={`
                            flex
                            flex-col
                            items-start
                            justify-between
                            gap-3
                            rounded-2xl
                            border
                            p-3.5
                            text-xs
                            md:flex-row
                            md:items-center

                            ${
                              entry.success
                                ? entry.action ===
                                  "skipped"
                                  ? "border-amber-100 bg-amber-50/50 text-amber-900"
                                  : "border-emerald-100 bg-emerald-50/50 text-emerald-900"
                                : "border-red-100 bg-red-50/50 text-red-900"
                            }
                          `}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {entry.success ? (
                              <div
                                className={`
                                  flex
                                  h-5
                                  w-5
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full

                                  ${
                                    entry.action ===
                                    "skipped"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  }
                                `}
                              >
                                <Check
                                  size={12}
                                />
                              </div>
                            ) : (
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <AlertCircle
                                  size={12}
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-bold tracking-tight">
                                {entry.success
                                  ? `${entry.identifier} → ${entry.entity}`
                                  : `${entry.identifier} could not be imported`}
                              </p>

                              {entry.destination && (
                                <p className="mt-0.5 text-[9px] opacity-60">
                                  public.
                                  {
                                    entry.destination
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <span
                            className={`
                              max-w-full
                              break-words
                              rounded-full
                              px-2.5
                              py-1
                              text-[9px]
                              font-mono

                              ${
                                entry.success
                                  ? entry.action ===
                                    "skipped"
                                    ? "bg-amber-100/80 text-amber-700"
                                    : "bg-emerald-100/70 text-emerald-800"
                                  : "bg-red-100/80 text-red-700"
                              }
                            `}
                          >
                            {
                              entry.details
                            }
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* ================================================
                ERROR
            ================================================ */}

            {status ===
              "error" && (
                <motion.div
                  initial={{
                    opacity:
                      0,

                    y:
                      10,
                  }}
                  animate={{
                    opacity:
                      1,

                    y:
                      0,
                  }}
                  className="mt-8 flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-left text-red-600"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <AlertCircle
                    className="mt-0.5 shrink-0"
                    size={17}
                  />

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest">
                      Import stopped
                    </p>

                    <p className="mt-1 text-[10px] leading-5">
                      {
                        errorMessage
                      }
                    </p>
                  </div>
                </motion.div>
              )}
          </div>
        </section>

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside className="flex flex-col gap-6 rounded-[3.5rem] border border-stone-200 bg-white p-7 shadow-sm md:p-10 lg:col-span-4">
          {/* ================================================
              ROUTING
          ================================================ */}

          <div className="space-y-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">
              Import destination
            </h2>

            <p className="text-xs leading-5 text-stone-500">
              Auto-Detect is
              recommended when
              you are unsure what
              type of dataset you
              have. Choose a
              specific destination
              when you already
              know what the file
              represents.
            </p>
          </div>

          <div className="space-y-3">
            {TARGET_TABLES.map(
              (
                target
              ) => (
                <button
                  type="button"
                  key={
                    target.id
                  }
                  disabled={
                    status ===
                    "processing"
                  }
                  onClick={() =>
                    selectTarget(
                      target.id
                    )
                  }
                  className={`
                    w-full
                    rounded-3xl
                    border
                    p-5
                    text-left
                    transition-all
                    disabled:cursor-not-allowed
                    disabled:opacity-50

                    ${
                      selectedTargetTable ===
                      target.id
                        ? "border-[#A3B18A] bg-[#A3B18A]/5 shadow-sm"
                        : "border-stone-100 bg-stone-50/50 hover:border-stone-300"
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-stone-900">
                      {
                        target.label
                      }
                    </p>

                    {selectedTargetTable ===
                      target.id && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A3B18A] text-white">
                        <Check
                          size={12}
                        />
                      </div>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-stone-500">
                    {
                      target.description
                    }
                  </p>
                </button>
              )
            )}
          </div>

          {/* ================================================
              DUPLICATES
          ================================================ */}

          <div className="space-y-3 border-t border-stone-100 pt-5">
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.35em] text-stone-400">
                Duplicate handling
              </h2>

              <p className="mt-2 text-[10px] leading-5 text-stone-500">
                Choose what
                should happen
                when the importer
                finds an existing
                matching record.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id:
                    "update",

                  label:
                    "Update",
                },

                {
                  id:
                    "skip",

                  label:
                    "Skip",
                },

                {
                  id:
                    "create",

                  label:
                    "Create",
                },
              ].map(
                (
                  strategy
                ) => (
                  <button
                    type="button"
                    key={
                      strategy.id
                    }
                    disabled={
                      status ===
                      "processing"
                    }
                    onClick={() =>
                      setDuplicateStrategy(
                        strategy.id as DuplicateResolutionStrategy
                      )
                    }
                    className={`
                      rounded-2xl
                      border
                      py-3
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wider
                      transition-all
                      disabled:opacity-40

                      ${
                        duplicateStrategy ===
                        strategy.id
                          ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                          : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                      }
                    `}
                  >
                    {
                      strategy.label
                    }
                  </button>
                )
              )}
            </div>

            {duplicateStrategy ===
              "create" && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0 text-amber-500"
                />

                <p className="text-[9px] leading-5 text-amber-700">
                  Create can
                  intentionally
                  produce duplicate
                  records. Use
                  Update or Skip
                  for most
                  migrations.
                </p>
              </div>
            )}
          </div>

          {/* ================================================
              RELATIONSHIPS
          ================================================ */}

          <div className="space-y-2 rounded-3xl border border-stone-100 bg-stone-50 p-5">
            <div className="flex items-center gap-2 text-stone-700">
              <RefreshCw
                size={14}
                className="text-[#A3B18A]"
              />

              <span className="text-[9px] font-black uppercase tracking-widest">
                Safe relationships
              </span>
            </div>

            <p className="text-xs leading-relaxed text-stone-500">
              Imported child
              records are always
              attached to your
              active TOTS-OS
              workspace. External
              organisation IDs are
              never trusted, and
              company names on
              contacts are not
              treated as workspace
              IDs or automatically
              turned into new
              organisations.
            </p>
          </div>

          {/* ================================================
              ANALYSIS STATUS
          ================================================ */}

          {analysis && (
            <div className="space-y-3 rounded-3xl border border-[#dfe6d7] bg-[#f4f7f0] p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={14}
                  className="text-[#71805f]"
                />

                <span className="text-[9px] font-black uppercase tracking-widest text-[#647356]">
                  Analysis ready
                </span>
              </div>

              <div className="space-y-2">
                <SidebarMetric
                  label="Source rows"
                  value={
                    analysis
                      .rawRows
                      .length
                  }
                />

                <SidebarMetric
                  label="Detected records"
                  value={
                    analysis
                      .detectedRows
                      .length
                  }
                />

                <SidebarMetric
                  label="Ready to process"
                  value={
                    analysis
                      .recordsToProcess
                      .length
                  }
                />

                <SidebarMetric
                  label="Duplicates"
                  value={
                    duplicateCount
                  }
                />

                <SidebarMetric
                  label="Invalid"
                  value={
                    analysis
                      .invalidRows
                      .length
                  }
                />
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  label,
  value,
  danger =
    false,
}: {
  label:
    string;

  value:
    number;

  danger?:
    boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        p-3
        text-center

        ${
          danger
            ? "bg-red-50"
            : "bg-stone-50"
        }
      `}
    >
      <p
        className={`
          text-xl
          font-bold

          ${
            danger
              ? "text-red-600"
              : "text-stone-900"
          }
        `}
      >
        {
          value
        }
      </p>

      <p
        className={`
          mt-1
          text-[8px]
          font-black
          uppercase
          tracking-wider

          ${
            danger
              ? "text-red-400"
              : "text-stone-400"
          }
        `}
      >
        {
          label
        }
      </p>
    </div>
  );
}

// ============================================================
// SIDEBAR METRIC
// ============================================================

function SidebarMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#dfe6d7] py-2 last:border-b-0">
      <span className="text-[9px] text-stone-500">
        {
          label
        }
      </span>

      <span className="text-[10px] font-black text-stone-700">
        {
          value
        }
      </span>
    </div>
  );
}