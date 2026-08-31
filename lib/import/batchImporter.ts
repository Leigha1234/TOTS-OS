// ==========================================
// lib/import/batchImporter.ts
// ==========================================

import {
  BATCH_CONFIG,
  UNIQUE_KEYS,
} from "./constants";

import {
  BatchImportResult,
  DuplicateResolutionStrategy,
  ProcessedRow,
} from "./types";

// ============================================================
// TYPES
// ============================================================

type PreparedPayload =
  Record<
    string,
    unknown
  >;

type DatabaseRecord =
  Record<
    string,
    any
  >;

type CustomerResolution = {
  customer:
    DatabaseRecord;

  created:
    boolean;
};

// ============================================================
// ALLOWED DATABASE COLUMNS
// ============================================================

const ALLOWED_COLUMNS:
  Record<
    string,
    string[]
  > = {
  contacts: [
    "organisation_id",
    "name",
    "email",
    "phone",
    "address",
    "company_name",
    "company_details",
    "role",
    "created_at",
    "updated_at",
    "website",
    "attachments",
    "customer_id",
  ],

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
};

// ============================================================
// GENERAL HELPERS
// ============================================================

function hasValue(
  value:
    unknown
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

function stringValue(
  value:
    unknown
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

function cleanEmail(
  value:
    unknown
): string {
  return stringValue(
    value
  ).toLowerCase();
}

// ============================================================

function normalisePhone(
  value:
    unknown
): string {
  return stringValue(
    value
  ).replace(
    /[^0-9+]/g,
    ""
  );
}

// ============================================================

function cleanPayload(
  payload:
    Record<
      string,
      unknown
    >
): PreparedPayload {
  const output:
    PreparedPayload = {};

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
        "string"
      ) {
        const trimmed =
          value.trim();

        if (
          trimmed ===
          ""
        ) {
          return;
        }

        output[
          key
        ] =
          trimmed;

        return;
      }

      output[
        key
      ] =
        value;
    }
  );

  return output;
}

// ============================================================
// RETRY HELPERS
// ============================================================

function getErrorMessage(
  error:
    unknown
): string {
  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  if (
    error &&
    typeof error ===
      "object"
  ) {
    const objectError =
      error as {
        message?: unknown;
        details?: unknown;
        hint?: unknown;
        code?: unknown;
      };

    const parts =
      [
        stringValue(
          objectError.message
        ),

        stringValue(
          objectError.details
        ),

        stringValue(
          objectError.hint
        ),

        stringValue(
          objectError.code
        ),
      ].filter(
        Boolean
      );

    if (
      parts.length >
      0
    ) {
      return parts.join(
        " — "
      );
    }
  }

  return stringValue(
    error
  ) || "Database operation failed.";
}

// ============================================================

function isRetryableError(
  error:
    unknown
): boolean {
  const message =
    getErrorMessage(
      error
    )
      .toLowerCase();

  return (
    message.includes(
      "network"
    ) ||
    message.includes(
      "fetch failed"
    ) ||
    message.includes(
      "failed to fetch"
    ) ||
    message.includes(
      "connection was lost"
    ) ||
    message.includes(
      "timeout"
    ) ||
    message.includes(
      "timed out"
    ) ||
    message.includes(
      "502"
    ) ||
    message.includes(
      "503"
    ) ||
    message.includes(
      "504"
    )
  );
}

// ============================================================

function wait(
  milliseconds:
    number
) {
  return new Promise<void>(
    (
      resolve
    ) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

// ============================================================

async function withRetry<T>(
  operation:
    () => Promise<T>
): Promise<T> {
  const maxRetries =
    Math.max(
      0,
      Number(
        BATCH_CONFIG
          .MAX_RETRIES ??
          3
      )
    );

  const baseDelay =
    Math.max(
      250,
      Number(
        BATCH_CONFIG
          .RETRY_DELAY_MS ??
          1000
      )
    );

  let attempt =
    0;

  while (
    true
  ) {
    try {
      return await operation();
    } catch (
      error
    ) {
      if (
        attempt >=
          maxRetries ||
        !isRetryableError(
          error
        )
      ) {
        throw error;
      }

      attempt +=
        1;

      await wait(
        baseDelay *
          attempt
      );
    }
  }
}

// ============================================================
// CONTACT NAME
// ============================================================

function buildContactName(
  payload:
    Record<
      string,
      unknown
    >
): string {
  const existingName =
    stringValue(
      payload.name
    );

  if (
    existingName
  ) {
    return existingName;
  }

  const firstName =
    stringValue(
      payload.first_name ??
        payload.firstname ??
        payload.firstName
    );

  const lastName =
    stringValue(
      payload.last_name ??
        payload.lastname ??
        payload.surname ??
        payload.lastName
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
// ALLOWLIST
// ============================================================

function applyAllowlist(
  table:
    string,

  payload:
    PreparedPayload
): PreparedPayload {
  const allowed =
    ALLOWED_COLUMNS[
      table
    ];

  if (
    !allowed
  ) {
    return payload;
  }

  const cleaned:
    PreparedPayload = {};

  allowed.forEach(
    (
      column
    ) => {
      if (
        hasValue(
          payload[
            column
          ]
        )
      ) {
        cleaned[
          column
        ] =
          payload[
            column
          ];
      }
    }
  );

  return cleaned;
}

// ============================================================
// PREPARE CONTACT
// ============================================================

function prepareContactPayload(
  source:
    Record<
      string,
      unknown
    >,

  orgId:
    string | null
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  // ----------------------------------------------------------
  // NAME
  // ----------------------------------------------------------

  const name =
    buildContactName(
      payload
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  const email =
    cleanEmail(
      payload.email
    );

  if (
    email
  ) {
    payload.email =
      email;
  } else {
    delete payload.email;
  }

  // ----------------------------------------------------------
  // ROLE
  // ----------------------------------------------------------

  const role =
    stringValue(
      payload.role ??
        payload.position ??
        payload.job_title ??
        payload.jobTitle
    );

  if (
    role
  ) {
    payload.role =
      role;
  }

  // ----------------------------------------------------------
  // COMPANY
  // ----------------------------------------------------------

  const companyName =
    stringValue(
      payload.company_name ??
        payload.company ??
        payload.organisation ??
        payload.organization ??
        payload.business_name ??
        payload.business
    );

  if (
    companyName
  ) {
    payload.company_name =
      companyName;
  }

  // ----------------------------------------------------------
  // ADDRESS
  // ----------------------------------------------------------

  const address =
    stringValue(
      payload.address ??
        payload.address_line_1 ??
        payload.address1
    );

  if (
    address
  ) {
    payload.address =
      address;
  }

  // ----------------------------------------------------------
  // WEBSITE
  // ----------------------------------------------------------

  const website =
    stringValue(
      payload.website ??
        payload.domain
    );

  if (
    website
  ) {
    payload.website =
      website;
  }

  // ----------------------------------------------------------
  // WORKSPACE
  // ----------------------------------------------------------

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  } else {
    delete payload
      .organisation_id;
  }

  // ----------------------------------------------------------
  // REMOVE IMPORT-ONLY FIELDS
  // ----------------------------------------------------------

  delete payload.first_name;
  delete payload.firstname;
  delete payload.firstName;

  delete payload.last_name;
  delete payload.lastname;
  delete payload.surname;
  delete payload.lastName;

  delete payload.position;
  delete payload.job_title;
  delete payload.jobTitle;

  delete payload.company;
  delete payload.organisation;
  delete payload.organization;
  delete payload.business_name;
  delete payload.business;

  delete payload.full_name;
  delete payload.contact_name;

  delete payload.domain;

  delete payload.id;
  delete payload.created_by;

  /**
   * Never trust a customer relationship ID supplied by an
   * external spreadsheet.
   *
   * We resolve customer_id ourselves below.
   */
  delete payload.customer_id;

  return applyAllowlist(
    "contacts",
    payload
  );
}

// ============================================================
// PREPARE ORGANISATION
// ============================================================

function prepareOrganisationPayload(
  source:
    Record<
      string,
      unknown
    >
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  const name =
    stringValue(
      payload.name ??
        payload.company_name ??
        payload.company ??
        payload.organisation_name ??
        payload.organization_name ??
        payload.organisation ??
        payload.organization ??
        payload.business_name
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  const email =
    cleanEmail(
      payload.email
    );

  if (
    email
  ) {
    payload.email =
      email;
  }

  const website =
    stringValue(
      payload.website ??
        payload.domain
    );

  if (
    website
  ) {
    payload.website =
      website;
  }

  if (
    !hasValue(
      payload.notes
    ) &&
    hasValue(
      payload.description
    )
  ) {
    payload.notes =
      payload.description;
  }

  if (
    !hasValue(
      payload.created_at
    ) &&
    hasValue(
      payload.date_created
    )
  ) {
    payload.created_at =
      payload.date_created;
  }

  delete payload
    .organisation_id;

  delete payload
    .created_by;

  delete payload.id;

  delete payload
    .company_name;

  delete payload.company;

  delete payload
    .organisation_name;

  delete payload
    .organization_name;

  delete payload
    .organisation;

  delete payload
    .organization;

  delete payload
    .business_name;

  delete payload.domain;

  delete payload
    .description;

  delete payload
    .date_created;

  return applyAllowlist(
    "organisations",
    payload
  );
}

// ============================================================
// PREPARE GENERIC
// ============================================================

function prepareGenericPayload(
  source:
    Record<
      string,
      unknown
    >,

  orgId:
    string | null
): PreparedPayload {
  const payload =
    cleanPayload(
      source
    );

  if (
    orgId
  ) {
    payload.organisation_id =
      orgId;
  }

  delete payload
    .created_by;

  return payload;
}

// ============================================================
// PREPARE PAYLOAD
// ============================================================

function preparePayload(
  row:
    ProcessedRow,

  orgId:
    string | null
): PreparedPayload {
  switch (
    row.targetTable
  ) {
    case "contacts":
      return prepareContactPayload(
        row.payload,
        orgId
      );

    case "organisations":
      return prepareOrganisationPayload(
        row.payload
      );

    default:
      return prepareGenericPayload(
        row.payload,
        orgId
      );
  }
}

// ============================================================
// UNIQUE KEYS
// ============================================================

function getUniqueKeys(
  table:
    string
): string[] {
  const configured =
    UNIQUE_KEYS[
      table
    ];

  if (
    !configured
  ) {
    return [];
  }

  if (
    Array.isArray(
      configured
    )
  ) {
    return configured;
  }

  return [
    configured,
  ];
}

// ============================================================
// FIND EXISTING GENERIC RECORD
// ============================================================

async function findExistingRecord(
  table:
    string,

  payload:
    PreparedPayload,

  supabase:
    any,

  orgId:
    string | null
): Promise<DatabaseRecord | null> {
  const keys =
    getUniqueKeys(
      table
    );

  if (
    keys.length ===
    0
  ) {
    return null;
  }

  const usableKeys =
    keys.filter(
      (
        key
      ) =>
        hasValue(
          payload[
            key
          ]
        )
    );

  if (
    usableKeys.length !==
    keys.length
  ) {
    return null;
  }

  return withRetry(
    async () => {
      let query =
        supabase
          .from(
            table
          )
          .select(
            "*"
          );

      for (
        const key of
        usableKeys
      ) {
        const value =
          payload[
            key
          ];

        if (
          key ===
          "email"
        ) {
          query =
            query.ilike(
              key,
              cleanEmail(
                value
              )
            );

          continue;
        }

        query =
          query.eq(
            key,
            value
          );
      }

      if (
        table !==
          "organisations" &&
        orgId
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
          )
          .maybeSingle();

      if (
        error
      ) {
        throw error;
      }

      return (
        data ??
        null
      );
    }
  );
}

// ============================================================
// FIND CONTACT
// ============================================================

async function findExistingContact(
  payload:
    PreparedPayload,

  supabase:
    any,

  orgId:
    string
): Promise<DatabaseRecord | null> {
  const email =
    cleanEmail(
      payload.email
    );

  // ----------------------------------------------------------
  // EMAIL FIRST
  // ----------------------------------------------------------

  if (
    email
  ) {
    const record =
      await withRetry(
        async () => {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "contacts"
              )
              .select(
                "*"
              )
              .eq(
                "organisation_id",
                orgId
              )
              .ilike(
                "email",
                email
              )
              .limit(
                1
              )
              .maybeSingle();

          if (
            error
          ) {
            throw error;
          }

          return (
            data ??
            null
          );
        }
      );

    if (
      record
    ) {
      return record;
    }
  }

  // ----------------------------------------------------------
  // PHONE + NAME FALLBACK
  // ----------------------------------------------------------

  const phone =
    normalisePhone(
      payload.phone
    );

  const name =
    stringValue(
      payload.name
    );

  if (
    !phone ||
    !name
  ) {
    return null;
  }

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "contacts"
          )
          .select(
            "*"
          )
          .eq(
            "organisation_id",
            orgId
          )
          .ilike(
            "name",
            name
          )
          .limit(
            25
          );

      if (
        error
      ) {
        throw error;
      }

      const rows =
        Array.isArray(
          data
        )
          ? data
          : [];

      return (
        rows.find(
          (
            candidate:
              DatabaseRecord
          ) =>
            normalisePhone(
              candidate.phone
            ) ===
            phone
        ) ??
        null
      );
    }
  );
}

// ============================================================
// FIND CUSTOMER BY ID
// ============================================================

async function findCustomerById(
  customerId:
    unknown,

  supabase:
    any,

  orgId:
    string
): Promise<DatabaseRecord | null> {
  const id =
    stringValue(
      customerId
    );

  if (
    !id
  ) {
    return null;
  }

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "customers"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            id
          )
          .eq(
            "organisation_id",
            orgId
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        error
      ) {
        throw error;
      }

      return (
        data ??
        null
      );
    }
  );
}

// ============================================================
// FIND CUSTOMER BY CONTACT DETAILS
// ============================================================

async function findMatchingCustomer(
  contactPayload:
    PreparedPayload,

  supabase:
    any,

  orgId:
    string
): Promise<DatabaseRecord | null> {
  const email =
    cleanEmail(
      contactPayload.email
    );

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  if (
    email
  ) {
    const byEmail =
      await withRetry(
        async () => {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "customers"
              )
              .select(
                "*"
              )
              .eq(
                "organisation_id",
                orgId
              )
              .ilike(
                "email",
                email
              )
              .limit(
                1
              )
              .maybeSingle();

          if (
            error
          ) {
            throw error;
          }

          return (
            data ??
            null
          );
        }
      );

    if (
      byEmail
    ) {
      return byEmail;
    }
  }

  // ----------------------------------------------------------
  // PHONE + NAME
  // ----------------------------------------------------------

  const name =
    stringValue(
      contactPayload.name
    );

  const phone =
    normalisePhone(
      contactPayload.phone
    );

  if (
    !name ||
    !phone
  ) {
    return null;
  }

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "customers"
          )
          .select(
            "*"
          )
          .eq(
            "organisation_id",
            orgId
          )
          .ilike(
            "name",
            name
          )
          .limit(
            25
          );

      if (
        error
      ) {
        throw error;
      }

      const candidates =
        Array.isArray(
          data
        )
          ? data
          : [];

      return (
        candidates.find(
          (
            customer:
              DatabaseRecord
          ) =>
            normalisePhone(
              customer.phone
            ) ===
            phone
        ) ??
        null
      );
    }
  );
}

// ============================================================
// CUSTOMER CREATE PAYLOAD
// ============================================================

function buildNewCustomerPayload(
  contactPayload:
    PreparedPayload,

  orgId:
    string
): PreparedPayload {
  const payload:
    PreparedPayload = {
    organisation_id:
      orgId,

    stage:
      "client",

    client_type:
      "client",

    status:
      "live",

    tags: [
      "CRM",
      "Imported",
    ],

    /**
     * IMPORTANT:
     *
     * Importing someone into CRM is NOT the same as gaining
     * marketing consent.
     */
    on_mailing_list:
      false,

    mailing_list_category:
      "General",

    updated_at:
      new Date()
        .toISOString(),
  };

  const name =
    stringValue(
      contactPayload.name
    );

  const email =
    cleanEmail(
      contactPayload.email
    );

  const phone =
    stringValue(
      contactPayload.phone
    );

  const company =
    stringValue(
      contactPayload.company_name
    );

  const address =
    stringValue(
      contactPayload.address
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  if (
    email
  ) {
    payload.email =
      email;
  }

  if (
    phone
  ) {
    payload.phone =
      phone;
  }

  if (
    company
  ) {
    payload.company =
      company;
  }

  if (
    address
  ) {
    payload.address =
      address;
  }

  return payload;
}

// ============================================================
// CUSTOMER UPDATE PAYLOAD
// ============================================================

function buildCustomerUpdatePayload(
  contactPayload:
    PreparedPayload
): PreparedPayload {
  const payload:
    PreparedPayload = {
    updated_at:
      new Date()
        .toISOString(),
  };

  const name =
    stringValue(
      contactPayload.name
    );

  const email =
    cleanEmail(
      contactPayload.email
    );

  const phone =
    stringValue(
      contactPayload.phone
    );

  const company =
    stringValue(
      contactPayload.company_name
    );

  const address =
    stringValue(
      contactPayload.address
    );

  if (
    name
  ) {
    payload.name =
      name;
  }

  if (
    email
  ) {
    payload.email =
      email;
  }

  if (
    phone
  ) {
    payload.phone =
      phone;
  }

  if (
    company
  ) {
    payload.company =
      company;
  }

  if (
    address
  ) {
    payload.address =
      address;
  }

  /**
   * Do NOT update:
   *
   * on_mailing_list
   * stage
   * client_type
   * status
   * tags
   *
   * on an existing customer during a generic contact import.
   *
   * Those may already contain deliberate CRM decisions.
   */

  return payload;
}

// ============================================================
// CREATE CUSTOMER
// ============================================================

async function createCustomer(
  contactPayload:
    PreparedPayload,

  supabase:
    any,

  orgId:
    string
): Promise<DatabaseRecord> {
  const payload =
    buildNewCustomerPayload(
      contactPayload,
      orgId
    );

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "customers"
          )
          .insert(
            payload
          )
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        throw error;
      }

      if (
        !data
      ) {
        throw new Error(
          "Customer was created but no customer record was returned."
        );
      }

      return data;
    }
  );
}

// ============================================================
// UPDATE CUSTOMER
// ============================================================

async function updateCustomer(
  customer:
    DatabaseRecord,

  contactPayload:
    PreparedPayload,

  supabase:
    any
): Promise<DatabaseRecord> {
  const payload =
    buildCustomerUpdatePayload(
      contactPayload
    );

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "customers"
          )
          .update(
            payload
          )
          .eq(
            "id",
            customer.id
          )
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        throw error;
      }

      if (
        !data
      ) {
        throw new Error(
          "Customer update did not return a record."
        );
      }

      return data;
    }
  );
}

// ============================================================
// RESOLVE CUSTOMER FOR CONTACT
// ============================================================

async function resolveCustomerForContact(
  contactPayload:
    PreparedPayload,

  existingContact:
    DatabaseRecord | null,

  supabase:
    any,

  orgId:
    string,

  duplicateStrategy:
    DuplicateResolutionStrategy
): Promise<CustomerResolution> {
  // ----------------------------------------------------------
  // EXISTING CONTACT ALREADY LINKED
  // ----------------------------------------------------------

  if (
    existingContact
      ?.customer_id
  ) {
    const linkedCustomer =
      await findCustomerById(
        existingContact
          .customer_id,
        supabase,
        orgId
      );

    if (
      linkedCustomer
    ) {
      if (
        duplicateStrategy ===
        "update"
      ) {
        const updated =
          await updateCustomer(
            linkedCustomer,
            contactPayload,
            supabase
          );

        return {
          customer:
            updated,

          created:
            false,
        };
      }

      return {
        customer:
          linkedCustomer,

        created:
          false,
      };
    }
  }

  // ----------------------------------------------------------
  // CREATE STRATEGY
  //
  // Explicitly creating duplicates means create a fresh CRM
  // master record too.
  // ----------------------------------------------------------

  if (
    duplicateStrategy ===
    "create"
  ) {
    const customer =
      await createCustomer(
        contactPayload,
        supabase,
        orgId
      );

    return {
      customer,

      created:
        true,
    };
  }

  // ----------------------------------------------------------
  // FIND MATCHING CUSTOMER
  // ----------------------------------------------------------

  const matchingCustomer =
    await findMatchingCustomer(
      contactPayload,
      supabase,
      orgId
    );

  if (
    matchingCustomer
  ) {
    if (
      duplicateStrategy ===
      "update"
    ) {
      const updated =
        await updateCustomer(
          matchingCustomer,
          contactPayload,
          supabase
        );

      return {
        customer:
          updated,

        created:
          false,
      };
    }

    return {
      customer:
        matchingCustomer,

      created:
        false,
    };
  }

  // ----------------------------------------------------------
  // CREATE CUSTOMER
  // ----------------------------------------------------------

  const customer =
    await createCustomer(
      contactPayload,
      supabase,
      orgId
    );

  return {
    customer,

    created:
      true,
  };
}

// ============================================================
// GENERIC INSERT
// ============================================================

async function insertRecord(
  table:
    string,

  payload:
    PreparedPayload,

  supabase:
    any
) {
  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            table
          )
          .insert(
            payload
          )
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        throw error;
      }

      return data;
    }
  );
}

// ============================================================
// GENERIC UPDATE
// ============================================================

async function updateRecord(
  table:
    string,

  existing:
    DatabaseRecord,

  payload:
    PreparedPayload,

  supabase:
    any
) {
  if (
    !existing.id
  ) {
    throw new Error(
      `Existing ${table} record does not contain an id.`
    );
  }

  const updatePayload =
    {
      ...payload,
    };

  delete updatePayload.id;

  return withRetry(
    async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            table
          )
          .update(
            updatePayload
          )
          .eq(
            "id",
            existing.id
          )
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        throw error;
      }

      return data;
    }
  );
}

// ============================================================
// BEST-EFFORT CUSTOMER CLEANUP
// ============================================================

async function cleanupNewCustomer(
  customerId:
    unknown,

  supabase:
    any
) {
  const id =
    stringValue(
      customerId
    );

  if (
    !id
  ) {
    return;
  }

  try {
    await supabase
      .from(
        "customers"
      )
      .delete()
      .eq(
        "id",
        id
      );
  } catch (
    cleanupError
  ) {
    console.warn(
      "[TOTS IMPORT] Could not clean up customer after failed contact import:",
      cleanupError
    );
  }
}

// ============================================================
// PROCESS CONTACT
// ============================================================

async function processContact(
  row:
    ProcessedRow,

  supabase:
    any,

  orgId:
    string,

  duplicateStrategy:
    DuplicateResolutionStrategy
): Promise<
  | "inserted"
  | "updated"
  | "skipped"
> {
  const contactPayload =
    prepareContactPayload(
      row.payload,
      orgId
    );

  if (
    Object.keys(
      contactPayload
    ).length ===
    0
  ) {
    throw new Error(
      "No supported contact fields remained after preparing the import payload."
    );
  }

  // ----------------------------------------------------------
  // FIND EXISTING CONTACT
  // ----------------------------------------------------------

  const existingContact =
    await findExistingContact(
      contactPayload,
      supabase,
      orgId
    );

  // ----------------------------------------------------------
  // SKIP
  // ----------------------------------------------------------

  if (
    duplicateStrategy ===
      "skip" &&
    existingContact
  ) {
    return "skipped";
  }

  // ----------------------------------------------------------
  // RESOLVE CRM MASTER CUSTOMER
  // ----------------------------------------------------------

  const customerResolution =
    await resolveCustomerForContact(
      contactPayload,
      existingContact,
      supabase,
      orgId,
      duplicateStrategy
    );

  const finalContactPayload:
    PreparedPayload = {
    ...contactPayload,

    customer_id:
      customerResolution
        .customer
        .id,

    organisation_id:
      orgId,

    updated_at:
      new Date()
        .toISOString(),
  };

  try {
    // --------------------------------------------------------
    // CREATE DUPLICATE
    // --------------------------------------------------------

    if (
      duplicateStrategy ===
      "create"
    ) {
      await insertRecord(
        "contacts",
        finalContactPayload,
        supabase
      );

      return "inserted";
    }

    // --------------------------------------------------------
    // UPDATE EXISTING
    // --------------------------------------------------------

    if (
      existingContact
    ) {
      await updateRecord(
        "contacts",
        existingContact,
        finalContactPayload,
        supabase
      );

      return "updated";
    }

    // --------------------------------------------------------
    // INSERT NEW CONTACT
    // --------------------------------------------------------

    await insertRecord(
      "contacts",
      finalContactPayload,
      supabase
    );

    return "inserted";
  } catch (
    error
  ) {
    /**
     * Browser-side Supabase operations cannot share a database
     * transaction across customers + contacts.
     *
     * If we created a brand new customer and the contact then
     * fails, make a best-effort attempt to remove that orphaned
     * customer.
     */
    if (
      customerResolution
        .created
    ) {
      await cleanupNewCustomer(
        customerResolution
          .customer
          .id,
        supabase
      );
    }

    throw error;
  }
}

// ============================================================
// FAILURE
// ============================================================

function appendFailure(
  result:
    BatchImportResult,

  row:
    ProcessedRow,

  error:
    unknown
) {
  const message =
    getErrorMessage(
      error
    );

  const failedRow:
    ProcessedRow = {
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
  };

  result.failed +=
    1;

  result.failedRows.push(
    failedRow
  );

  console.error(
    "[TOTS IMPORT] Record import failed:",
    {
      table:
        row.targetTable,

      rowId:
        row.id,

      payload:
        row.payload,

      error,

      message,
    }
  );
}

// ============================================================
// MAIN BATCH IMPORTER
// ============================================================

export async function processBatches(
  rows:
    ProcessedRow[],

  supabase:
    any,

  orgId:
    string | null,

  duplicateStrategy:
    DuplicateResolutionStrategy,

  onProgress?:
    (
      batchNumber:
        number,

      totalBatches:
        number
    ) => void
): Promise<BatchImportResult> {
  const result:
    BatchImportResult = {
    inserted:
      0,

    updated:
      0,

    skipped:
      0,

    failed:
      0,

    failedRows:
      [],
  };

  if (
    rows.length ===
    0
  ) {
    return result;
  }

  const configuredBatchSize =
    Number(
      BATCH_CONFIG
        .DEFAULT_BATCH_SIZE
    );

  const batchSize =
    Math.min(
      100,
      Math.max(
        1,
        Number.isFinite(
          configuredBatchSize
        )
          ? configuredBatchSize
          : 50
      )
    );

  const totalBatches =
    Math.max(
      1,
      Math.ceil(
        rows.length /
          batchSize
      )
    );

  for (
    let batchIndex =
      0;
    batchIndex <
    totalBatches;
    batchIndex +=
      1
  ) {
    const start =
      batchIndex *
      batchSize;

    const end =
      start +
      batchSize;

    const batch =
      rows.slice(
        start,
        end
      );

    for (
      const row of
      batch
    ) {
      try {
        // ====================================================
        // CONTACT / CRM
        // ====================================================

        if (
          row.targetTable ===
          "contacts"
        ) {
          if (
            !orgId
          ) {
            throw new Error(
              "No active organisation is available for this contact import."
            );
          }

          const action =
            await processContact(
              row,
              supabase,
              orgId,
              duplicateStrategy
            );

          if (
            action ===
            "inserted"
          ) {
            result.inserted +=
              1;
          } else if (
            action ===
            "updated"
          ) {
            result.updated +=
              1;
          } else {
            result.skipped +=
              1;
          }

          continue;
        }

        // ====================================================
        // OTHER TABLES
        // ====================================================

        const table =
          row.targetTable;

        const payload =
          preparePayload(
            row,
            orgId
          );

        if (
          Object.keys(
            payload
          ).length ===
          0
        ) {
          throw new Error(
            `No supported ${table} fields remained after preparing the import payload.`
          );
        }

        // ----------------------------------------------------
        // CREATE
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "create"
        ) {
          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;

          continue;
        }

        // ----------------------------------------------------
        // FIND EXISTING
        // ----------------------------------------------------

        const existing =
          await findExistingRecord(
            table,
            payload,
            supabase,
            orgId
          );

        // ----------------------------------------------------
        // SKIP
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "skip"
        ) {
          if (
            existing
          ) {
            result.skipped +=
              1;

            continue;
          }

          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;

          continue;
        }

        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------

        if (
          duplicateStrategy ===
          "update"
        ) {
          if (
            existing
          ) {
            await updateRecord(
              table,
              existing,
              payload,
              supabase
            );

            result.updated +=
              1;

            continue;
          }

          await insertRecord(
            table,
            payload,
            supabase
          );

          result.inserted +=
            1;
        }
      } catch (
        error
      ) {
        appendFailure(
          result,
          row,
          error
        );
      }
    }

    onProgress?.(
      batchIndex +
        1,
      totalBatches
    );
  }

  return result;
}