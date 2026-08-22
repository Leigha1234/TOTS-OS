// app/api/cron/notifications/route.ts

import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

// ============================================================
// TYPES
// ============================================================

type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "payment"
  | "invoice"
  | "order"
  | "task"
  | "project"
  | "calendar"
  | "client"
  | "social";

type NotificationInput = {
  userId:
    string;

  organisationId?:
    string | null;

  title:
    string;

  message:
    string;

  type:
    NotificationType;

  link?:
    string;

  dedupeKey:
    string;

  metadata?:
    Record<
      string,
      unknown
    >;
};

type NotificationCounters = {
  created:
    number;

  duplicates:
    number;

  skipped:
    number;

  errors:
    number;

  invoicesChecked:
    number;

  tasksChecked:
    number;

  projectsChecked:
    number;

  eventsChecked:
    number;

  contactsChecked:
    number;

  ordersChecked:
    number;
};

type GenericRow =
  Record<
    string,
    any
  >;

// ============================================================
// DATE HELPERS
// ============================================================

function startOfDay(
  date:
    Date
) {
  const result =
    new Date(
      date
    );

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

// ============================================================

function endOfDay(
  date:
    Date
) {
  const result =
    new Date(
      date
    );

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}

// ============================================================

function addDays(
  date:
    Date,

  days:
    number
) {
  const result =
    new Date(
      date
    );

  result.setDate(
    result.getDate() +
      days
  );

  return result;
}

// ============================================================

function addHours(
  date:
    Date,

  hours:
    number
) {
  const result =
    new Date(
      date
    );

  result.setHours(
    result.getHours() +
      hours
  );

  return result;
}

// ============================================================

function safeDate(
  value:
    unknown
) {
  if (
    typeof value !==
      "string" &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

// ============================================================

function sameDay(
  first:
    Date,

  second:
    Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

// ============================================================

function isBeforeToday(
  date:
    Date,

  now:
    Date
) {
  return (
    date.getTime() <
    startOfDay(
      now
    ).getTime()
  );
}

// ============================================================
// BASIC VALUE HELPERS
// ============================================================

function cleanString(
  value:
    unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

// ============================================================

function getFirstString(
  row:
    GenericRow,

  keys:
    string[]
) {
  for (
    const key of
    keys
  ) {
    const value =
      cleanString(
        row?.[key]
      );

    if (
      value
    ) {
      return value;
    }
  }

  return "";
}

// ============================================================

function getFirstNumber(
  row:
    GenericRow,

  keys:
    string[]
) {
  for (
    const key of
    keys
  ) {
    const value =
      row?.[key];

    if (
      typeof value ===
        "number" &&
      Number.isFinite(
        value
      )
    ) {
      return value;
    }

    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      const parsed =
        Number(
          value
        );

      if (
        Number.isFinite(
          parsed
        )
      ) {
        return parsed;
      }
    }
  }

  return null;
}

// ============================================================

function getFirstDate(
  row:
    GenericRow,

  keys:
    string[]
) {
  for (
    const key of
    keys
  ) {
    const date =
      safeDate(
        row?.[key]
      );

    if (
      date
    ) {
      return date;
    }
  }

  return null;
}

// ============================================================

function getRowId(
  row:
    GenericRow
) {
  return (
    cleanString(
      row.id
    ) ||
    cleanString(
      row.uuid
    )
  );
}

// ============================================================

function getOrganisationId(
  row:
    GenericRow
) {
  return (
    cleanString(
      row.organisation_id
    ) ||
    cleanString(
      row.organization_id
    ) ||
    null
  );
}

// ============================================================

function getDirectUserId(
  row:
    GenericRow
) {
  return (
    cleanString(
      row.user_id
    ) ||
    cleanString(
      row.owner_id
    ) ||
    cleanString(
      row.assigned_to
    ) ||
    cleanString(
      row.assignee_id
    ) ||
    cleanString(
      row.created_by
    ) ||
    ""
  );
}

// ============================================================

function formatMoney(
  amount:
    number | null
) {
  if (
    amount ===
    null
  ) {
    return "";
  }

  try {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          "GBP",
      }
    ).format(
      amount
    );
  } catch {
    return `£${amount.toFixed(
      2
    )}`;
  }
}

// ============================================================
// TABLE FETCH
//
// A missing optional table should NOT kill the notification
// worker.
//
// This lets you progressively connect more TOTS-OS modules.
// ============================================================

async function fetchTableRows(
  supabase:
    any,

  table:
    string,

  limit =
    1000
): Promise<
  GenericRow[] | null
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        table
      )
      .select(
        "*"
      )
      .limit(
        limit
      );

  if (
    error
  ) {
    console.warn(
      `[NOTIFICATION CRON] Could not read ${table}:`,
      error.message
    );

    return null;
  }

  return (
    data ||
    []
  ) as GenericRow[];
}

// ============================================================
// TABLE FALLBACK
//
// Useful where your database may currently call something:
//
// orders
// shop_orders
//
// etc.
// ============================================================

async function fetchFirstAvailableTable(
  supabase:
    any,

  tables:
    string[]
) {
  for (
    const table of
    tables
  ) {
    const rows =
      await fetchTableRows(
        supabase,
        table
      );

    if (
      rows !==
      null
    ) {
      return {
        table,
        rows,
      };
    }
  }

  return {
    table:
      null,

    rows:
      [] as GenericRow[],
  };
}

// ============================================================
// ORGANISATION MEMBER LOOKUP
//
// Some records may have organisation_id but no user_id.
//
// We resolve organisation members from profiles and cache them.
// ============================================================

async function getOrganisationUserIds({
  supabase,
  organisationId,
  cache,
}: {
  supabase:
    any;

  organisationId:
    string;

  cache:
    Map<
      string,
      string[]
    >;
}) {
  if (
    cache.has(
      organisationId
    )
  ) {
    return (
      cache.get(
        organisationId
      ) ||
      []
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, organisation_id"
      )
      .eq(
        "organisation_id",
        organisationId
      );

  if (
    error
  ) {
    console.warn(
      "[NOTIFICATION CRON] Could not resolve organisation users:",
      error.message
    );

    cache.set(
      organisationId,
      []
    );

    return [];
  }

  const userIds =
    (
      data ||
      []
    )
      .map(
        (
          profile:
            GenericRow
        ) =>
          cleanString(
            profile.id
          )
      )
      .filter(
        Boolean
      );

  cache.set(
    organisationId,
    userIds
  );

  return userIds;
}

// ============================================================
// RESOLVE WHO GETS A NOTIFICATION
// ============================================================

async function resolveRecipients({
  supabase,
  row,
  organisationUserCache,
}: {
  supabase:
    any;

  row:
    GenericRow;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const directUserId =
    getDirectUserId(
      row
    );

  if (
    directUserId
  ) {
    return [
      directUserId,
    ];
  }

  const organisationId =
    getOrganisationId(
      row
    );

  if (
    organisationId
  ) {
    return getOrganisationUserIds({
      supabase,

      organisationId,

      cache:
        organisationUserCache,
    });
  }

  return [];
}

// ============================================================
// CREATE NOTIFICATION
//
// Requires:
//
// notifications.dedupe_key
//
// to have a unique index.
//
// Example:
//
// create unique index if not exists
// notifications_dedupe_key_idx
// on notifications(dedupe_key)
// where dedupe_key is not null;
// ============================================================

async function createNotification({
  supabase,
  counters,
  input,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  input:
    NotificationInput;
}) {
  if (
    !input.userId ||
    !input.dedupeKey
  ) {
    counters.skipped +=
      1;

    return false;
  }

  const payload = {
    user_id:
      input.userId,

    organisation_id:
      input.organisationId ??
      null,

    title:
      input.title,

    message:
      input.message,

    type:
      input.type,

    link:
      input.link ||
      null,

    read:
      false,

    dedupe_key:
      input.dedupeKey,

    metadata:
      input.metadata ||
      {},

    created_at:
      new Date()
        .toISOString(),
  };

  try {
    const {
      error,
    } =
      await supabase
        .from(
          "notifications"
        )
        .upsert(
          payload,
          {
            onConflict:
              "dedupe_key",

            ignoreDuplicates:
              true,
          }
        );

    if (
      error
    ) {
      /*
       * PostgreSQL unique violation.
       */

      if (
        error.code ===
        "23505"
      ) {
        counters.duplicates +=
          1;

        return false;
      }

      console.error(
        "[NOTIFICATION CRON] Notification insert failed:",
        {
          input,
          error,
        }
      );

      counters.errors +=
        1;

      return false;
    }

    /*
     * Supabase ignoreDuplicates does not always clearly
     * report whether a record was inserted, so the unique key
     * is relied on as the source of truth.
     */

    counters.created +=
      1;

    return true;
  } catch (
    error
  ) {
    console.error(
      "[NOTIFICATION CRON] Unexpected notification error:",
      error
    );

    counters.errors +=
      1;

    return false;
  }
}

// ============================================================
// CREATE FOR ALL RESOLVED RECIPIENTS
// ============================================================

async function notifyRow({
  supabase,
  counters,
  row,
  organisationUserCache,
  build,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  row:
    GenericRow;

  organisationUserCache:
    Map<
      string,
      string[]
    >;

  build:
    (
      userId:
        string
    ) =>
      Omit<
        NotificationInput,
        "userId"
      >;
}) {
  const recipients =
    await resolveRecipients({
      supabase,

      row,

      organisationUserCache,
    });

  if (
    recipients.length ===
    0
  ) {
    counters.skipped +=
      1;

    return;
  }

  for (
    const userId of
    recipients
  ) {
    const input =
      build(
        userId
      );

    await createNotification({
      supabase,

      counters,

      input: {
        userId,

        ...input,
      },
    });
  }
}

// ============================================================
// INVOICE NOTIFICATIONS
// ============================================================

async function processInvoices({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const result =
    await fetchFirstAvailableTable(
      supabase,
      [
        "invoices",
        "finance_invoices",
      ]
    );

  if (
    !result.table
  ) {
    return;
  }

  for (
    const invoice of
    result.rows
  ) {
    counters.invoicesChecked +=
      1;

    const invoiceId =
      getRowId(
        invoice
      );

    if (
      !invoiceId
    ) {
      continue;
    }

    const status =
      getFirstString(
        invoice,
        [
          "status",
          "payment_status",
        ]
      ).toLowerCase();

    const paid =
      [
        "paid",
        "settled",
        "complete",
        "completed",
      ].includes(
        status
      ) ||
      invoice.paid ===
        true;

    if (
      paid
    ) {
      continue;
    }

    const dueDate =
      getFirstDate(
        invoice,
        [
          "due_date",
          "due_at",
          "payment_due_date",
        ]
      );

    if (
      !dueDate
    ) {
      continue;
    }

    const invoiceNumber =
      getFirstString(
        invoice,
        [
          "invoice_number",
          "number",
          "reference",
          "title",
        ]
      ) ||
      "Invoice";

    const customerName =
      getFirstString(
        invoice,
        [
          "customer_name",
          "client_name",
          "contact_name",
        ]
      );

    const amount =
      getFirstNumber(
        invoice,
        [
          "total",
          "total_amount",
          "amount_due",
          "amount",
        ]
      );

    const amountText =
      amount !==
        null
        ? ` — ${formatMoney(
            amount
          )}`
        : "";

    const organisationId =
      getOrganisationId(
        invoice
      );

    // ========================================================
    // OVERDUE
    // ========================================================

    if (
      isBeforeToday(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          invoice,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Invoice overdue",

            message:
              `${invoiceNumber}${
                customerName
                  ? ` for ${customerName}`
                  : ""
              } is overdue${amountText}.`,

            type:
              "invoice",

            link:
              "/payments",

            dedupeKey:
              `invoice:${invoiceId}:overdue:${userId}`,

            metadata: {
              invoice_id:
                invoiceId,

              invoice_number:
                invoiceNumber,

              due_date:
                dueDate.toISOString(),

              amount,

              status:
                "overdue",
            },
          }),
      });

      continue;
    }

    // ========================================================
    // DUE TODAY
    // ========================================================

    if (
      sameDay(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          invoice,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Invoice due today",

            message:
              `${invoiceNumber}${
                customerName
                  ? ` for ${customerName}`
                  : ""
              } is due today${amountText}.`,

            type:
              "invoice",

            link:
              "/payments",

            dedupeKey:
              `invoice:${invoiceId}:due-today:${userId}`,

            metadata: {
              invoice_id:
                invoiceId,

              invoice_number:
                invoiceNumber,

              due_date:
                dueDate.toISOString(),

              amount,

              status:
                "due_today",
            },
          }),
      });

      continue;
    }

    // ========================================================
    // DUE TOMORROW
    // ========================================================

    if (
      sameDay(
        dueDate,
        addDays(
          now,
          1
        )
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          invoice,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Invoice due tomorrow",

            message:
              `${invoiceNumber}${
                customerName
                  ? ` for ${customerName}`
                  : ""
              } is due tomorrow${amountText}.`,

            type:
              "invoice",

            link:
              "/payments",

            dedupeKey:
              `invoice:${invoiceId}:due-tomorrow:${userId}`,

            metadata: {
              invoice_id:
                invoiceId,

              invoice_number:
                invoiceNumber,

              due_date:
                dueDate.toISOString(),

              amount,

              status:
                "due_tomorrow",
            },
          }),
      });
    }
  }
}

// ============================================================
// TASK NOTIFICATIONS
// ============================================================

async function processTasks({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const rows =
    await fetchTableRows(
      supabase,
      "tasks"
    );

  if (
    rows ===
    null
  ) {
    return;
  }

  for (
    const task of
    rows
  ) {
    counters.tasksChecked +=
      1;

    const taskId =
      getRowId(
        task
      );

    if (
      !taskId
    ) {
      continue;
    }

    const status =
      getFirstString(
        task,
        [
          "status",
          "task_status",
        ]
      ).toLowerCase();

    const completed =
      task.completed ===
        true ||
      task.is_completed ===
        true ||
      [
        "complete",
        "completed",
        "done",
      ].includes(
        status
      );

    if (
      completed
    ) {
      continue;
    }

    const dueDate =
      getFirstDate(
        task,
        [
          "due_date",
          "due_at",
          "deadline",
        ]
      );

    if (
      !dueDate
    ) {
      continue;
    }

    const title =
      getFirstString(
        task,
        [
          "title",
          "name",
          "task_name",
        ]
      ) ||
      "Task";

    const organisationId =
      getOrganisationId(
        task
      );

    // ========================================================
    // OVERDUE
    // ========================================================

    if (
      isBeforeToday(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          task,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Task overdue",

            message:
              `${title} has passed its due date.`,

            type:
              "task",

            link:
              "/projects",

            dedupeKey:
              `task:${taskId}:overdue:${userId}`,

            metadata: {
              task_id:
                taskId,

              due_date:
                dueDate.toISOString(),

              status:
                "overdue",
            },
          }),
      });

      continue;
    }

    // ========================================================
    // DUE TODAY
    // ========================================================

    if (
      sameDay(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          task,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Task due today",

            message:
              `${title} is due today.`,

            type:
              "task",

            link:
              "/projects",

            dedupeKey:
              `task:${taskId}:due-today:${userId}`,

            metadata: {
              task_id:
                taskId,

              due_date:
                dueDate.toISOString(),

              status:
                "due_today",
            },
          }),
      });

      continue;
    }

    // ========================================================
    // DUE TOMORROW
    // ========================================================

    if (
      sameDay(
        dueDate,
        addDays(
          now,
          1
        )
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          task,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Task due tomorrow",

            message:
              `${title} is due tomorrow.`,

            type:
              "task",

            link:
              "/projects",

            dedupeKey:
              `task:${taskId}:due-tomorrow:${userId}`,

            metadata: {
              task_id:
                taskId,

              due_date:
                dueDate.toISOString(),

              status:
                "due_tomorrow",
            },
          }),
      });
    }
  }
}

// ============================================================
// PROJECT NOTIFICATIONS
// ============================================================

async function processProjects({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const rows =
    await fetchTableRows(
      supabase,
      "projects"
    );

  if (
    rows ===
    null
  ) {
    return;
  }

  for (
    const project of
    rows
  ) {
    counters.projectsChecked +=
      1;

    const projectId =
      getRowId(
        project
      );

    if (
      !projectId
    ) {
      continue;
    }

    const status =
      getFirstString(
        project,
        [
          "status",
          "project_status",
        ]
      ).toLowerCase();

    if (
      [
        "complete",
        "completed",
        "done",
        "archived",
        "cancelled",
        "canceled",
      ].includes(
        status
      )
    ) {
      continue;
    }

    const dueDate =
      getFirstDate(
        project,
        [
          "due_date",
          "deadline",
          "end_date",
          "target_date",
        ]
      );

    if (
      !dueDate
    ) {
      continue;
    }

    const name =
      getFirstString(
        project,
        [
          "name",
          "title",
          "project_name",
        ]
      ) ||
      "Project";

    const organisationId =
      getOrganisationId(
        project
      );

    if (
      isBeforeToday(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          project,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Project overdue",

            message:
              `${name} has passed its deadline.`,

            type:
              "project",

            link:
              `/projects`,

            dedupeKey:
              `project:${projectId}:overdue:${userId}`,

            metadata: {
              project_id:
                projectId,

              due_date:
                dueDate.toISOString(),

              status:
                "overdue",
            },
          }),
      });

      continue;
    }

    if (
      sameDay(
        dueDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          project,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Project deadline today",

            message:
              `${name} is due today.`,

            type:
              "project",

            link:
              "/projects",

            dedupeKey:
              `project:${projectId}:due-today:${userId}`,

            metadata: {
              project_id:
                projectId,

              due_date:
                dueDate.toISOString(),

              status:
                "due_today",
            },
          }),
      });

      continue;
    }

    if (
      sameDay(
        dueDate,
        addDays(
          now,
          1
        )
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          project,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Project due tomorrow",

            message:
              `${name} is due tomorrow.`,

            type:
              "project",

            link:
              "/projects",

            dedupeKey:
              `project:${projectId}:due-tomorrow:${userId}`,

            metadata: {
              project_id:
                projectId,

              due_date:
                dueDate.toISOString(),

              status:
                "due_tomorrow",
            },
          }),
      });
    }
  }
}

// ============================================================
// CALENDAR NOTIFICATIONS
// ============================================================

async function processCalendarEvents({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const result =
    await fetchFirstAvailableTable(
      supabase,
      [
        "events",
        "calendar_events",
      ]
    );

  if (
    !result.table
  ) {
    return;
  }

  const oneHourFromNow =
    addHours(
      now,
      1
    );

  /*
   * A small window allows hourly cron execution without
   * requiring second-perfect timing.
   */

  const reminderWindowEnd =
    new Date(
      oneHourFromNow.getTime() +
      30 *
        60 *
        1000
    );

  for (
    const event of
    result.rows
  ) {
    counters.eventsChecked +=
      1;

    const eventId =
      getRowId(
        event
      );

    if (
      !eventId
    ) {
      continue;
    }

    const startTime =
      getFirstDate(
        event,
        [
          "start_at",
          "start_time",
          "starts_at",
          "scheduled_for",
          "date",
        ]
      );

    if (
      !startTime
    ) {
      continue;
    }

    const cancelled =
      [
        "cancelled",
        "canceled",
      ].includes(
        getFirstString(
          event,
          [
            "status",
          ]
        ).toLowerCase()
      );

    if (
      cancelled
    ) {
      continue;
    }

    const title =
      getFirstString(
        event,
        [
          "title",
          "name",
          "event_name",
        ]
      ) ||
      "Calendar event";

    const organisationId =
      getOrganisationId(
        event
      );

    // ========================================================
    // EVENT IN ABOUT ONE HOUR
    // ========================================================

    if (
      startTime.getTime() >=
        oneHourFromNow.getTime() &&
      startTime.getTime() <=
        reminderWindowEnd.getTime()
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          event,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Event starting soon",

            message:
              `${title} starts in about one hour.`,

            type:
              "calendar",

            link:
              "/calendar",

            dedupeKey:
              `event:${eventId}:one-hour:${userId}`,

            metadata: {
              event_id:
                eventId,

              start_time:
                startTime.toISOString(),
            },
          }),
      });

      continue;
    }

    // ========================================================
    // EVENT TOMORROW
    // ========================================================

    if (
      sameDay(
        startTime,
        addDays(
          now,
          1
        )
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          event,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Event tomorrow",

            message:
              `${title} is scheduled for tomorrow.`,

            type:
              "calendar",

            link:
              "/calendar",

            dedupeKey:
              `event:${eventId}:tomorrow:${userId}`,

            metadata: {
              event_id:
                eventId,

              start_time:
                startTime.toISOString(),
            },
          }),
      });
    }
  }
}

// ============================================================
// CRM FOLLOW-UP NOTIFICATIONS
// ============================================================

async function processClientFollowUps({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const rows =
    await fetchTableRows(
      supabase,
      "contacts"
    );

  if (
    rows ===
    null
  ) {
    return;
  }

  for (
    const contact of
    rows
  ) {
    counters.contactsChecked +=
      1;

    const contactId =
      getRowId(
        contact
      );

    if (
      !contactId
    ) {
      continue;
    }

    const followUpDate =
      getFirstDate(
        contact,
        [
          "follow_up_date",
          "next_follow_up",
          "next_contact_date",
          "follow_up_at",
        ]
      );

    if (
      !followUpDate
    ) {
      continue;
    }

    const name =
      getFirstString(
        contact,
        [
          "name",
          "full_name",
          "company_name",
          "business_name",
        ]
      ) ||
      "Client";

    const organisationId =
      getOrganisationId(
        contact
      );

    if (
      isBeforeToday(
        followUpDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          contact,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Client follow-up overdue",

            message:
              `Your follow-up with ${name} is overdue.`,

            type:
              "client",

            link:
              "/crm",

            dedupeKey:
              `contact:${contactId}:followup-overdue:${userId}`,

            metadata: {
              contact_id:
                contactId,

              follow_up_date:
                followUpDate.toISOString(),
            },
          }),
      });

      continue;
    }

    if (
      sameDay(
        followUpDate,
        now
      )
    ) {
      await notifyRow({
        supabase,

        counters,

        row:
          contact,

        organisationUserCache,

        build:
          (
            userId
          ) => ({
            organisationId,

            title:
              "Client follow-up due",

            message:
              `Follow up with ${name} today.`,

            type:
              "client",

            link:
              "/crm",

            dedupeKey:
              `contact:${contactId}:followup-today:${userId}`,

            metadata: {
              contact_id:
                contactId,

              follow_up_date:
                followUpDate.toISOString(),
            },
          }),
      });
    }
  }
}

// ============================================================
// SHOP ORDER NOTIFICATIONS
//
// Ideally an order should also trigger an immediate notification
// when it is created.
//
// This cron fallback watches orders created within the previous
// 24 hours and safely deduplicates them.
// ============================================================

async function processShopOrders({
  supabase,
  counters,
  now,
  organisationUserCache,
}: {
  supabase:
    any;

  counters:
    NotificationCounters;

  now:
    Date;

  organisationUserCache:
    Map<
      string,
      string[]
    >;
}) {
  const result =
    await fetchFirstAvailableTable(
      supabase,
      [
        "orders",
        "shop_orders",
      ]
    );

  if (
    !result.table
  ) {
    return;
  }

  const cutoff =
    new Date(
      now.getTime() -
      24 *
        60 *
        60 *
        1000
    );

  for (
    const order of
    result.rows
  ) {
    counters.ordersChecked +=
      1;

    const orderId =
      getRowId(
        order
      );

    if (
      !orderId
    ) {
      continue;
    }

    const createdAt =
      getFirstDate(
        order,
        [
          "created_at",
          "ordered_at",
          "order_date",
        ]
      );

    if (
      !createdAt ||
      createdAt.getTime() <
        cutoff.getTime()
    ) {
      continue;
    }

    const status =
      getFirstString(
        order,
        [
          "status",
          "payment_status",
        ]
      ).toLowerCase();

    /*
     * Don't treat clearly abandoned/cancelled rows as orders.
     */

    if (
      [
        "cancelled",
        "canceled",
        "failed",
        "abandoned",
      ].includes(
        status
      )
    ) {
      continue;
    }

    const customerName =
      getFirstString(
        order,
        [
          "customer_name",
          "client_name",
          "name",
        ]
      ) ||
      "A customer";

    const orderNumber =
      getFirstString(
        order,
        [
          "order_number",
          "reference",
          "number",
        ]
      );

    const total =
      getFirstNumber(
        order,
        [
          "total",
          "total_amount",
          "amount",
          "amount_paid",
        ]
      );

    const totalText =
      total !==
        null
        ? ` for ${formatMoney(
            total
          )}`
        : "";

    const organisationId =
      getOrganisationId(
        order
      );

    await notifyRow({
      supabase,

      counters,

      row:
        order,

      organisationUserCache,

      build:
        (
          userId
        ) => ({
          organisationId,

          title:
            "New order received",

          message:
            `${customerName} placed${
              orderNumber
                ? ` order ${orderNumber}`
                : " an order"
            }${totalText}.`,

          type:
            "order",

          link:
            "/shop",

          dedupeKey:
            `order:${orderId}:created:${userId}`,

          metadata: {
            order_id:
              orderId,

            order_number:
              orderNumber ||
              null,

            amount:
              total,

            created_at:
              createdAt.toISOString(),
          },
        }),
    });
  }
}

// ============================================================
// CRON
// ============================================================

export async function GET(
  request:
    Request
) {
  // ==========================================================
  // AUTH
  // ==========================================================

  const cronSecret =
    process.env
      .CRON_SECRET
      ?.trim();

  if (
    !cronSecret
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "CRON_SECRET is not configured.",
      },
      {
        status:
          500,
      }
    );
  }

  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    authHeader !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Unauthorized",
      },
      {
        status:
          401,
      }
    );
  }

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          "Missing Supabase environment variables.",
      },
      {
        status:
          500,
      }
    );
  }

  const supabase =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession:
            false,

          autoRefreshToken:
            false,
        },
      }
    );

  // ==========================================================
  // COUNTERS
  // ==========================================================

  const counters:
    NotificationCounters = {
      created:
        0,

      duplicates:
        0,

      skipped:
        0,

      errors:
        0,

      invoicesChecked:
        0,

      tasksChecked:
        0,

      projectsChecked:
        0,

      eventsChecked:
        0,

      contactsChecked:
        0,

      ordersChecked:
        0,
    };

  const organisationUserCache =
    new Map<
      string,
      string[]
    >();

  const now =
    new Date();

  // ==========================================================
  // RUN MODULE CHECKS
  //
  // Each module is isolated so one broken/missing table doesn't
  // stop every other notification from running.
  // ==========================================================

  const jobs = [
    {
      name:
        "invoices",

      run:
        () =>
          processInvoices({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },

    {
      name:
        "tasks",

      run:
        () =>
          processTasks({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },

    {
      name:
        "projects",

      run:
        () =>
          processProjects({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },

    {
      name:
        "calendar",

      run:
        () =>
          processCalendarEvents({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },

    {
      name:
        "contacts",

      run:
        () =>
          processClientFollowUps({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },

    {
      name:
        "orders",

      run:
        () =>
          processShopOrders({
            supabase,

            counters,

            now,

            organisationUserCache,
          }),
    },
  ];

  const moduleResults:
    Record<
      string,
      {
        success:
          boolean;

        error?:
          string;
      }
    > =
    {};

  for (
    const job of
    jobs
  ) {
    try {
      await job.run();

      moduleResults[
        job.name
      ] = {
        success:
          true,
      };
    } catch (
      error
    ) {
      const message =
        error instanceof
          Error
          ? error.message
          : String(
              error
            );

      console.error(
        `[NOTIFICATION CRON] ${job.name} processing failed:`,
        error
      );

      counters.errors +=
        1;

      moduleResults[
        job.name
      ] = {
        success:
          false,

        error:
          message,
      };
    }
  }

  // ==========================================================
  // FINISHED
  // ==========================================================

  console.log(
    "[NOTIFICATION CRON] Finished:",
    {
      counters,
      moduleResults,
    }
  );

  return NextResponse.json(
    {
      success:
        true,

      ranAt:
        now.toISOString(),

      ...counters,

      modules:
        moduleResults,
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}