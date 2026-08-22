"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BadgePoundSterling,
  Building2,
  Check,
  CircleUserRound,
  FileText,
  FolderKanban,
  Loader2,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Save,
  Send,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  format,
} from "date-fns";

import {
  supabase,
} from "@/lib/supabase";

import {
  useSettings,
} from "@/app/context/SettingsContext";

// ============================================================
// TYPES
// ============================================================

type ClientTab =
  | "overview"
  | "projects"
  | "money"
  | "tasks"
  | "email"
  | "info"
  | "timeline";

type CustomerRecord = {
  id: string;

  organisation_id:
    | string
    | null;

  name:
    | string
    | null;

  email:
    | string
    | null;

  phone:
    | string
    | null;

  company:
    | string
    | null;

  notes:
    | string
    | null;

  tags:
    | string[]
    | null;

  stage:
    | string
    | null;

  address:
    | string
    | null;

  client_type:
    | string
    | null;

  status:
    | string
    | null;

  created_at:
    | string
    | null;

  updated_at:
    | string
    | null;

  on_mailing_list:
    | boolean
    | null;

  mailing_list_category:
    | string
    | null;

  project_count:
    | number
    | null;

  invoice_count:
    | number
    | null;

  message_count:
    | number
    | null;
};

type LegacyContactRecord = {
  id: string;

  organisation_id:
    string;

  customer_id?:
    | string
    | null;

  name?:
    | string
    | null;

  email?:
    | string
    | null;

  phone?:
    | string
    | null;

  address?:
    | string
    | null;

  website?:
    | string
    | null;

  company_name?:
    | string
    | null;

  company_details?:
    | string
    | null;

  role?:
    | string
    | null;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
};

type ProjectRecord = {
  id: string;

  name: string;

  status?:
    | string
    | null;

  due_date?:
    | string
    | null;

  created_at?:
    | string
    | null;

  customer_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;
};

type FinanceRecord = {
  id: string;

  amount?:
    | number
    | string
    | null;

  status?:
    | string
    | null;

  date?:
    | string
    | null;

  due_date?:
    | string
    | null;

  created_at?:
    | string
    | null;

  description?:
    | string
    | null;

  project_id?:
    | string
    | null;

  customer_id?:
    | string
    | null;
};

type TaskRecord = {
  id: string;

  title: string;

  description?:
    | string
    | null;

  status?:
    | string
    | null;

  project_id?:
    | string
    | null;

  contact_id?:
    | string
    | null;

  customer_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  user_id?:
    | string
    | null;

  due_date?:
    | string
    | null;

  created_at?:
    | string
    | null;
};

type TaskCommentRecord = {
  id: string;

  task_id:
    string;

  contact_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  user_id?:
    | string
    | null;

  content?:
    | string
    | null;

  created_at?:
    | string
    | null;
};

type EmailThreadRecord = {
  id: string;

  profile_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  contact_id?:
    | string
    | null;

  subject?:
    | string
    | null;

  status?:
    | string
    | null;

  created_at?:
    | string
    | null;

  last_message_at?:
    | string
    | null;

  last_direction?:
    | string
    | null;

  last_preview?:
    | string
    | null;
};

type EmailMessageRecord = {
  id: string;

  thread_id:
    string;

  profile_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  direction?:
    | string
    | null;

  subject?:
    | string
    | null;

  body?:
    | string
    | null;

  status?:
    | string
    | null;

  from_email?:
    | string
    | null;

  created_at?:
    | string
    | null;
};

type NoteRecord = {
  id: string;

  content:
    string;

  type?:
    | string
    | null;

  created_at?:
    | string
    | null;

  contact_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;
};

type TimelineRecord = {
  id: string;

  contact_id?:
    | string
    | null;

  organisation_id?:
    | string
    | null;

  type?:
    | string
    | null;

  title?:
    | string
    | null;

  content?:
    | string
    | null;

  created_at?:
    | string
    | null;
};

type StoreOrderRecord = {
  id: string;

  order_number?:
    | string
    | null;

  customer_name?:
    | string
    | null;

  customer_email?:
    | string
    | null;

  subtotal?:
    | number
    | string
    | null;

  discount_amount?:
    | number
    | string
    | null;

  shipping_amount?:
    | number
    | string
    | null;

  total?:
    | number
    | string
    | null;

  payment_status?:
    | string
    | null;

  fulfilment_status?:
    | string
    | null;

  created_at?:
    | string
    | null;
};

type EditForm = {
  name:
    string;

  email:
    string;

  phone:
    string;

  address:
    string;

  company:
    string;

  stage:
    string;

  clientType:
    string;

  status:
    string;

  notes:
    string;

  onMailingList:
    boolean;

  mailingListCategory:
    string;
};

// ============================================================
// HELPERS
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

function safeArray(
  value:
    unknown
) {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item
    ): item is string =>
      typeof item ===
        "string" &&
      Boolean(
        item.trim()
      )
  );
}

function isCompletedTask(
  status:
    unknown
) {
  return [
    "done",
    "completed",
    "complete",
  ].includes(
    String(
      status ||
        ""
    )
      .trim()
      .toLowerCase()
  );
}

function isCompletedProject(
  status:
    unknown
) {
  return [
    "completed",
    "complete",
    "done",
    "archived",
    "cancelled",
    "canceled",
  ].includes(
    String(
      status ||
        ""
    )
      .trim()
      .toLowerCase()
  );
}

function getCustomerSource(
  customer:
    CustomerRecord
) {
  const tags =
    safeArray(
      customer.tags
    ).map(
      (
        tag
      ) =>
        tag
          .trim()
          .toLowerCase()
    );

  if (
    tags.includes(
      "store customer"
    ) ||
    customer.client_type ===
      "store_customer"
  ) {
    return "Store";
  }

  return "CRM";
}

function getCustomerStageLabel(
  value:
    unknown
) {
  const stage =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    stage ===
    "lead"
  ) {
    return "Lead";
  }

  if (
    stage ===
    "partner"
  ) {
    return "Partner";
  }

  if (
    stage ===
    "member"
  ) {
    return "Team Member";
  }

  return "Client";
}

function getInitials(
  name:
    string | null | undefined
) {
  const cleaned =
    cleanString(
      name
    );

  if (
    !cleaned
  ) {
    return "?";
  }

  const parts =
    cleaned
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length -
        1
    ][0]
  }`.toUpperCase();
}

function formatSafeDate(
  value:
    string | null | undefined,
  pattern =
    "dd MMM yyyy"
) {
  if (
    !value
  ) {
    return "";
  }

  try {
    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return format(
      date,
      pattern
    );
  } catch {
    return value;
  }
}

// ============================================================
// PAGE
// ============================================================

export default function AccountProfilePage() {
  const params =
    useParams();

  /*
   * IMPORTANT:
   *
   * /crm/[id] now means CUSTOMER ID.
   *
   * The CRM directory links here using customers.id.
   */

  const customerId =
    Array.isArray(
      params?.id
    )
      ? params.id[0]
      : typeof params?.id ===
          "string"
        ? params.id
        : "";

  const {
    organisationId,
  } =
    useSettings();

  // ==========================================================
  // MAIN
  // ==========================================================

  const [
    customer,
    setCustomer,
  ] =
    useState<CustomerRecord | null>(
      null
    );

  /*
   * Some existing TOTS features still use contact_id.
   *
   * This is NOT the source of truth.
   *
   * It is simply the legacy bridge:
   *
   * contacts.customer_id -> customers.id
   */

  const [
    linkedContact,
    setLinkedContact,
  ] =
    useState<LegacyContactRecord | null>(
      null
    );

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ClientTab>(
      "overview"
    );

  const [
    pageError,
    setPageError,
  ] =
    useState<
      string | null
    >(
      null
    );

  // ==========================================================
  // COMMERCIAL
  // ==========================================================

  const [
    clientProjects,
    setClientProjects,
  ] =
    useState<
      ProjectRecord[]
    >(
      []
    );

  const [
    clientQuotes,
    setClientQuotes,
  ] =
    useState<
      FinanceRecord[]
    >(
      []
    );

  const [
    clientInvoices,
    setClientInvoices,
  ] =
    useState<
      FinanceRecord[]
    >(
      []
    );

  const [
    clientExpenses,
    setClientExpenses,
  ] =
    useState<
      FinanceRecord[]
    >(
      []
    );

  const [
    clientDataLoading,
    setClientDataLoading,
  ] =
    useState(
      false
    );

  // ==========================================================
  // STORE ORDERS
  // ==========================================================

  const [
    storeOrders,
    setStoreOrders,
  ] =
    useState<
      StoreOrderRecord[]
    >(
      []
    );

  // ==========================================================
  // TASKS
  // ==========================================================

  const [
    tasks,
    setTasks,
  ] =
    useState<
      TaskRecord[]
    >(
      []
    );

  const [
    taskComments,
    setTaskComments,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    taskCommentThreads,
    setTaskCommentThreads,
  ] =
    useState<
      Record<
        string,
        TaskCommentRecord[]
      >
    >({});

  const [
    newTask,
    setNewTask,
  ] =
    useState({
      title:
        "",

      description:
        "",

      project_id:
        "",
    });

  const [
    creatingTask,
    setCreatingTask,
  ] =
    useState(
      false
    );

  // ==========================================================
  // EMAIL
  // ==========================================================

  const [
    threads,
    setThreads,
  ] =
    useState<
      EmailThreadRecord[]
    >(
      []
    );

  const [
    activeThread,
    setActiveThread,
  ] =
    useState<EmailThreadRecord | null>(
      null
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      EmailMessageRecord[]
    >(
      []
    );

  const [
    showComposer,
    setShowComposer,
  ] =
    useState(
      false
    );

  const [
    emailSaving,
    setEmailSaving,
  ] =
    useState(
      false
    );

  const [
    newEmail,
    setNewEmail,
  ] =
    useState({
      subject:
        "",

      body:
        "",
    });

  // ==========================================================
  // EDITING
  // ==========================================================

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(
      false
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditForm>({
      name:
        "",

      email:
        "",

      phone:
        "",

      address:
        "",

      company:
        "",

      stage:
        "client",

      clientType:
        "client",

      status:
        "live",

      notes:
        "",

      onMailingList:
        false,

      mailingListCategory:
        "General",
    });

  // ==========================================================
  // NOTES / TIMELINE
  // ==========================================================

  const [
    notes,
    setNotes,
  ] =
    useState<
      NoteRecord[]
    >(
      []
    );

  const [
    timelineEntries,
    setTimelineEntries,
  ] =
    useState<
      TimelineRecord[]
    >(
      []
    );

  const [
    noteForm,
    setNoteForm,
  ] =
    useState({
      type:
        "internal",

      content:
        "",
    });

  const [
    timelineEntry,
    setTimelineEntry,
  ] =
    useState(
      ""
    );

  // ==========================================================
  // BASIC HELPERS
  // ==========================================================

  const formatCurrency =
    useCallback(
      (
        value:
          | number
          | string
          | null
          | undefined
      ) =>
        new Intl.NumberFormat(
          "en-GB",
          {
            style:
              "currency",

            currency:
              "GBP",

            maximumFractionDigits:
              2,
          }
        ).format(
          Number(
            value ||
              0
          )
        ),
      []
    );

  // ==========================================================
  // PROJECT MAP
  // ==========================================================

  const projectMap =
    useMemo(
      () => {
        const map:
          Record<
            string,
            string
          > =
          {};

        for (
          const project of
          clientProjects
        ) {
          map[
            project.id
          ] =
            project.name;
        }

        return map;
      },
      [
        clientProjects,
      ]
    );

  // ==========================================================
  // METRICS
  // ==========================================================

  const activeProjects =
    useMemo(
      () =>
        clientProjects.filter(
          (
            project
          ) =>
            !isCompletedProject(
              project.status
            )
        ),
      [
        clientProjects,
      ]
    );

  const quotedTotal =
    useMemo(
      () =>
        clientQuotes.reduce(
          (
            total,
            quote
          ) =>
            total +
            Number(
              quote.amount ||
                0
            ),
          0
        ),
      [
        clientQuotes,
      ]
    );

  const invoicedTotal =
    useMemo(
      () =>
        clientInvoices.reduce(
          (
            total,
            invoice
          ) =>
            total +
            Number(
              invoice.amount ||
                0
            ),
          0
        ),
      [
        clientInvoices,
      ]
    );

  const paidTotal =
    useMemo(
      () =>
        clientInvoices
          .filter(
            (
              invoice
            ) =>
              String(
                invoice.status ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              "paid"
          )
          .reduce(
            (
              total,
              invoice
            ) =>
              total +
              Number(
                invoice.amount ||
                  0
              ),
            0
          ),
      [
        clientInvoices,
      ]
    );

  const outstandingTotal =
    Math.max(
      invoicedTotal -
        paidTotal,
      0
    );

  const expensesTotal =
    useMemo(
      () =>
        clientExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            Number(
              expense.amount ||
                0
            ),
          0
        ),
      [
        clientExpenses,
      ]
    );

  const openTasks =
    useMemo(
      () =>
        tasks.filter(
          (
            task
          ) =>
            !isCompletedTask(
              task.status
            )
        ),
      [
        tasks,
      ]
    );

  const paidStoreOrders =
    useMemo(
      () =>
        storeOrders.filter(
          (
            order
          ) =>
            String(
              order.payment_status ||
                ""
            )
              .trim()
              .toLowerCase() ===
            "paid"
        ),
      [
        storeOrders,
      ]
    );

  const storeRevenue =
    useMemo(
      () =>
        paidStoreOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.total ||
                0
            ),
          0
        ),
      [
        paidStoreOrders,
      ]
    );

  // ==========================================================
  // CUSTOMER SUMMARY
  // ==========================================================

  const clientSummary =
    useMemo(
      () => {
        if (
          !customer
        ) {
          return "";
        }

        const pieces:
          string[] =
          [];

        pieces.push(
          `${activeProjects.length} ${
            activeProjects.length ===
            1
              ? "active project"
              : "active projects"
          }`
        );

        if (
          quotedTotal >
          0
        ) {
          pieces.push(
            `${formatCurrency(
              quotedTotal
            )} quoted`
          );
        }

        if (
          invoicedTotal >
          0
        ) {
          pieces.push(
            `${formatCurrency(
              invoicedTotal
            )} invoiced`
          );
        }

        if (
          paidTotal >
          0
        ) {
          pieces.push(
            `${formatCurrency(
              paidTotal
            )} paid`
          );
        }

        if (
          outstandingTotal >
          0
        ) {
          pieces.push(
            `${formatCurrency(
              outstandingTotal
            )} outstanding`
          );
        }

        if (
          openTasks.length >
          0
        ) {
          pieces.push(
            `${openTasks.length} ${
              openTasks.length ===
              1
                ? "open task"
                : "open tasks"
            }`
          );
        }

        if (
          paidStoreOrders.length >
          0
        ) {
          pieces.push(
            `${paidStoreOrders.length} ${
              paidStoreOrders.length ===
              1
                ? "store order"
                : "store orders"
            }`
          );
        }

        return pieces.join(
          " · "
        );
      },
      [
        customer,
        activeProjects.length,
        quotedTotal,
        invoicedTotal,
        paidTotal,
        outstandingTotal,
        openTasks.length,
        paidStoreOrders.length,
        formatCurrency,
      ]
    );

  // ==========================================================
  // LOAD LEGACY CONTACT BRIDGE
  // ==========================================================

  const fetchLinkedContact =
    useCallback(
      async () => {
        if (
          !customerId ||
          !organisationId
        ) {
          setLinkedContact(
            null
          );

          return null;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "contacts"
            )
            .select("*")
            .eq(
              "organisation_id",
              organisationId
            )
            .eq(
              "customer_id",
              customerId
            )
            .limit(
              1
            );

        if (
          error
        ) {
          /*
           * This bridge is optional.
           *
           * If contacts isn't available or RLS blocks it,
           * the customer page should still work.
           */

          console.warn(
            "[TOTS CRM] Linked contact lookup unavailable:",
            error
          );

          setLinkedContact(
            null
          );

          return null;
        }

        const record =
          (
            data?.[0] ||
            null
          ) as LegacyContactRecord | null;

        setLinkedContact(
          record
        );

        return record;
      },
      [
        customerId,
        organisationId,
      ]
    );

  // ==========================================================
  // LOAD COMMERCIAL DATA
  // ==========================================================

  const fetchCommercialData =
    useCallback(
      async () => {
        if (
          !customerId ||
          !organisationId
        ) {
          return;
        }

        setClientDataLoading(
          true
        );

        try {
          const [
            projectsResult,
            quotesResult,
            invoicesResult,
            expensesResult,
          ] =
            await Promise.all(
              [
                supabase
                  .from(
                    "projects"
                  )
                  .select(
                    "*"
                  )
                  .eq(
                    "organisation_id",
                    organisationId
                  )
                  .eq(
                    "customer_id",
                    customerId
                  )
                  .is(
                    "deleted_at",
                    null
                  )
                  .order(
                    "created_at",
                    {
                      ascending:
                        false,
                    }
                  ),

                supabase
                  .from(
                    "quotes"
                  )
                  .select(
                    "*"
                  )
                  .eq(
                    "organisation_id",
                    organisationId
                  )
                  .eq(
                    "customer_id",
                    customerId
                  )
                  .order(
                    "created_at",
                    {
                      ascending:
                        false,
                    }
                  ),

                supabase
                  .from(
                    "invoices"
                  )
                  .select(
                    "*"
                  )
                  .eq(
                    "organisation_id",
                    organisationId
                  )
                  .eq(
                    "customer_id",
                    customerId
                  )
                  .order(
                    "created_at",
                    {
                      ascending:
                        false,
                    }
                  ),

                supabase
                  .from(
                    "expenses"
                  )
                  .select(
                    "*"
                  )
                  .eq(
                    "organisation_id",
                    organisationId
                  )
                  .eq(
                    "customer_id",
                    customerId
                  )
                  .order(
                    "created_at",
                    {
                      ascending:
                        false,
                    }
                  ),
              ]
            );

          if (
            projectsResult.error
          ) {
            console.error(
              "Client projects fetch error:",
              projectsResult.error
            );
          }

          if (
            quotesResult.error
          ) {
            console.error(
              "Client quotes fetch error:",
              quotesResult.error
            );
          }

          if (
            invoicesResult.error
          ) {
            console.error(
              "Client invoices fetch error:",
              invoicesResult.error
            );
          }

          if (
            expensesResult.error
          ) {
            console.error(
              "Client expenses fetch error:",
              expensesResult.error
            );
          }

          setClientProjects(
            (
              projectsResult.data ||
              []
            ) as ProjectRecord[]
          );

          setClientQuotes(
            (
              quotesResult.data ||
              []
            ) as FinanceRecord[]
          );

          setClientInvoices(
            (
              invoicesResult.data ||
              []
            ) as FinanceRecord[]
          );

          setClientExpenses(
            (
              expensesResult.data ||
              []
            ) as FinanceRecord[]
          );
        } finally {
          setClientDataLoading(
            false
          );
        }
      },
      [
        customerId,
        organisationId,
      ]
    );

  // ==========================================================
  // LOAD STORE ORDERS
  // ==========================================================

  const fetchStoreOrders =
    useCallback(
      async (
        customerRecord:
          CustomerRecord
      ) => {
        if (
          !organisationId
        ) {
          return;
        }

        /*
         * store_orders currently does not have customer_id.
         *
         * Therefore the safest current bridge is the exact
         * customer email.
         *
         * Once you add customer_id to store_orders we should
         * replace this with:
         *
         * .eq("customer_id", customerRecord.id)
         */

        const email =
          cleanString(
            customerRecord.email
          );

        if (
          !email
        ) {
          setStoreOrders(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "store_orders"
            )
            .select(
              `
                id,
                order_number,
                customer_name,
                customer_email,
                subtotal,
                discount_amount,
                shipping_amount,
                total,
                payment_status,
                fulfilment_status,
                created_at
              `
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .ilike(
              "customer_email",
              email
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          error
        ) {
          console.warn(
            "Store orders fetch error:",
            error
          );

          setStoreOrders(
            []
          );

          return;
        }

        setStoreOrders(
          (
            data ||
            []
          ) as StoreOrderRecord[]
        );
      },
      [
        organisationId,
      ]
    );

  // ==========================================================
  // FETCH CUSTOMER
  // ==========================================================

  const fetchProfile =
    useCallback(
      async (
        quiet =
          false
      ) => {
        if (
          !customerId ||
          !organisationId
        ) {
          return;
        }

        if (
          quiet
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(
            true
          );
        }

        setPageError(
          null
        );

        try {
          const {
            data:
              authData,
            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError ||
            !authData.user
          ) {
            throw (
              authError ||
              new Error(
                "Not authenticated."
              )
            );
          }

          setCurrentUserId(
            authData.user.id
          );

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "customers"
              )
              .select(
                `
                  id,
                  organisation_id,
                  name,
                  email,
                  phone,
                  company,
                  notes,
                  tags,
                  stage,
                  address,
                  client_type,
                  status,
                  created_at,
                  updated_at,
                  on_mailing_list,
                  mailing_list_category,
                  project_count,
                  invoice_count,
                  message_count
                `
              )
              .eq(
                "id",
                customerId
              )
              .eq(
                "organisation_id",
                organisationId
              )
              .maybeSingle();

          if (
            error
          ) {
            throw error;
          }

          if (
            !data
          ) {
            setCustomer(
              null
            );

            return;
          }

          const loaded =
            data as CustomerRecord;

          setCustomer(
            loaded
          );

          setEditForm({
            name:
              loaded.name ||
              "",

            email:
              loaded.email ||
              "",

            phone:
              loaded.phone ||
              "",

            address:
              loaded.address ||
              "",

            company:
              loaded.company ||
              "",

            stage:
              loaded.stage ||
              "client",

            clientType:
              loaded.client_type ||
              loaded.stage ||
              "client",

            status:
              loaded.status ||
              "live",

            notes:
              loaded.notes ||
              "",

            onMailingList:
              loaded.on_mailing_list ===
              true,

            mailingListCategory:
              loaded.mailing_list_category ||
              "General",
          });

          await Promise.all(
            [
              fetchLinkedContact(),
              fetchCommercialData(),
              fetchStoreOrders(
                loaded
              ),
            ]
          );
        } catch (
          loadError:
            unknown
        ) {
          console.error(
            "Customer load error:",
            loadError
          );

          setPageError(
            loadError instanceof
              Error
              ? loadError.message
              : "Failed to load customer."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        customerId,
        organisationId,
        fetchLinkedContact,
        fetchCommercialData,
        fetchStoreOrders,
      ]
    );

  // ==========================================================
  // TASKS
  // ==========================================================

  const fetchTasks =
    useCallback(
      async () => {
        if (
          !customerId ||
          !organisationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "tasks"
            )
            .select(
              "*"
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .eq(
              "customer_id",
              customerId
            )
            .is(
              "deleted_at",
              null
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          error
        ) {
          console.error(
            "Tasks fetch error:",
            error
          );

          setTasks(
            []
          );

          return;
        }

        setTasks(
          (
            data ||
            []
          ) as TaskRecord[]
        );
      },
      [
        customerId,
        organisationId,
      ]
    );

  // ==========================================================
  // COMMENTS
  // ==========================================================

  const fetchTaskComments =
    useCallback(
      async () => {
        if (
          tasks.length ===
          0
        ) {
          setTaskCommentThreads(
            {}
          );

          return;
        }

        const taskIds =
          tasks.map(
            (
              task
            ) =>
              task.id
          );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "task_comments"
            )
            .select(
              "*"
            )
            .in(
              "task_id",
              taskIds
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          console.error(
            "Task comments fetch error:",
            error
          );

          return;
        }

        const grouped:
          Record<
            string,
            TaskCommentRecord[]
          > =
          {};

        for (
          const comment of
          (data ||
            []) as TaskCommentRecord[]
        ) {
          if (
            !grouped[
              comment.task_id
            ]
          ) {
            grouped[
              comment.task_id
            ] =
              [];
          }

          grouped[
            comment.task_id
          ].push(
            comment
          );
        }

        setTaskCommentThreads(
          grouped
        );
      },
      [
        tasks,
      ]
    );

  useEffect(
    () => {
      void fetchTaskComments();
    },
    [
      fetchTaskComments,
    ]
  );

  // ==========================================================
  // EMAIL THREADS
  // ==========================================================

  const fetchThreads =
    useCallback(
      async () => {
        if (
          !linkedContact?.id ||
          !organisationId
        ) {
          setThreads(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "email_threads"
            )
            .select(
              "*"
            )
            .eq(
              "contact_id",
              linkedContact.id
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "last_message_at",
              {
                ascending:
                  false,
                nullsFirst:
                  false,
              }
            );

        if (
          error
        ) {
          console.error(
            "Threads fetch error:",
            error
          );

          return;
        }

        setThreads(
          (
            data ||
            []
          ) as EmailThreadRecord[]
        );
      },
      [
        linkedContact?.id,
        organisationId,
      ]
    );

  const fetchMessages =
    useCallback(
      async (
        threadId:
          string
      ) => {
        if (
          !organisationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "email_messages"
            )
            .select(
              "*"
            )
            .eq(
              "thread_id",
              threadId
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          console.error(
            "Messages fetch error:",
            error
          );

          return;
        }

        setMessages(
          (
            data ||
            []
          ) as EmailMessageRecord[]
        );
      },
      [
        organisationId,
      ]
    );

  // ==========================================================
  // NOTES
  // ==========================================================

  const fetchNotes =
    useCallback(
      async () => {
        if (
          !linkedContact?.id ||
          !organisationId
        ) {
          setNotes(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notes"
            )
            .select(
              "*"
            )
            .eq(
              "contact_id",
              linkedContact.id
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          error
        ) {
          console.error(
            "Notes fetch error:",
            error
          );

          setNotes(
            []
          );

          return;
        }

        setNotes(
          (
            data ||
            []
          ) as NoteRecord[]
        );
      },
      [
        linkedContact?.id,
        organisationId,
      ]
    );

  // ==========================================================
  // TIMELINE
  // ==========================================================

  const fetchTimelineEntries =
    useCallback(
      async () => {
        if (
          !linkedContact?.id ||
          !organisationId
        ) {
          setTimelineEntries(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "contact_timeline"
            )
            .select(
              "*"
            )
            .eq(
              "contact_id",
              linkedContact.id
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          error
        ) {
          console.error(
            "Timeline fetch error:",
            error
          );

          setTimelineEntries(
            []
          );

          return;
        }

        setTimelineEntries(
          (
            data ||
            []
          ) as TimelineRecord[]
        );
      },
      [
        linkedContact?.id,
        organisationId,
      ]
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(
    () => {
      if (
        !customerId ||
        !organisationId
      ) {
        return;
      }

      void Promise.all(
        [
          fetchProfile(),
          fetchTasks(),
        ]
      );
    },
    [
      customerId,
      organisationId,
      fetchProfile,
      fetchTasks,
    ]
  );

  // ==========================================================
  // LOAD CONTACT-BASED LEGACY DATA
  // ==========================================================

  useEffect(
    () => {
      if (
        !linkedContact?.id
      ) {
        setThreads(
          []
        );

        setMessages(
          []
        );

        setNotes(
          []
        );

        setTimelineEntries(
          []
        );

        return;
      }

      void Promise.all(
        [
          fetchThreads(),
          fetchNotes(),
          fetchTimelineEntries(),
        ]
      );
    },
    [
      linkedContact?.id,
      fetchThreads,
      fetchNotes,
      fetchTimelineEntries,
    ]
  );

  // ==========================================================
  // THREAD SELECTION
  // ==========================================================

  useEffect(
    () => {
      if (
        threads.length ===
        0
      ) {
        setActiveThread(
          null
        );

        setMessages(
          []
        );

        return;
      }

      if (
        activeThread &&
        threads.some(
          (
            thread
          ) =>
            thread.id ===
            activeThread.id
        )
      ) {
        return;
      }

      const firstThread =
        threads[0];

      setActiveThread(
        firstThread
      );

      void fetchMessages(
        firstThread.id
      );
    },
    [
      threads,
      activeThread,
      fetchMessages,
    ]
  );

  // ==========================================================
  // UPDATE CUSTOMER
  // ==========================================================

  const handleUpdate =
    async () => {
      if (
        !customerId ||
        !organisationId ||
        isSaving
      ) {
        return;
      }

      const name =
        cleanString(
          editForm.name
        );

      if (
        !name
      ) {
        alert(
          "Enter a customer name."
        );

        return;
      }

      setIsSaving(
        true
      );

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "customers"
            )
            .update({
              name,

              email:
                cleanString(
                  editForm.email
                ) ||
                null,

              phone:
                cleanString(
                  editForm.phone
                ) ||
                null,

              address:
                cleanString(
                  editForm.address
                ) ||
                null,

              company:
                cleanString(
                  editForm.company
                ) ||
                null,

              stage:
                editForm.stage ||
                "client",

              client_type:
                editForm.clientType ||
                editForm.stage ||
                "client",

              status:
                editForm.status ||
                "live",

              notes:
                cleanString(
                  editForm.notes
                ) ||
                null,

              on_mailing_list:
                editForm.onMailingList,

              mailing_list_category:
                cleanString(
                  editForm.mailingListCategory
                ) ||
                "General",

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              customerId
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .select(
              "*"
            )
            .maybeSingle();

        if (
          error
        ) {
          throw error;
        }

        if (
          !data
        ) {
          throw new Error(
            "No customer record was updated."
          );
        }

        const updated =
          data as CustomerRecord;

        setCustomer(
          updated
        );

        setIsEditing(
          false
        );

        /*
         * If a legacy contact link exists, keep the commonly
         * shared fields in sync.
         */

        if (
          linkedContact?.id
        ) {
          const {
            error:
              contactSyncError,
          } =
            await supabase
              .from(
                "contacts"
              )
              .update({
                name:
                  updated.name,

                email:
                  updated.email,

                phone:
                  updated.phone,

                address:
                  updated.address,

                company_name:
                  updated.company,

                role:
                  updated.stage,

                updated_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                linkedContact.id
              )
              .eq(
                "organisation_id",
                organisationId
              );

          if (
            contactSyncError
          ) {
            console.warn(
              "Legacy contact sync failed:",
              contactSyncError
            );
          }
        }
      } catch (
        updateError:
          unknown
      ) {
        console.error(
          "Customer update error:",
          updateError
        );

        alert(
          updateError instanceof
            Error
            ? updateError.message
            : "Failed to save customer."
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  // ==========================================================
  // CREATE TASK
  // ==========================================================

  const createClientTask =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (
        !customerId ||
        !organisationId ||
        !newTask.title.trim() ||
        creatingTask
      ) {
        return;
      }

      setCreatingTask(
        true
      );

      try {
        const {
          data:
            authData,
        } =
          await supabase.auth.getUser();

        if (
          !authData.user?.id
        ) {
          throw new Error(
            "Unable to identify the signed-in user."
          );
        }

        const selectedProject =
          clientProjects.find(
            (
              project
            ) =>
              project.id ===
              newTask.project_id
          );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "tasks"
            )
            .insert({
              title:
                newTask.title.trim(),

              description:
                newTask.description.trim() ||
                null,

              status:
                "todo",

              /*
               * CUSTOMER is now the primary link.
               */

              customer_id:
                customerId,

              /*
               * Keep contact_id only as a compatibility link
               * when one exists.
               */

              contact_id:
                linkedContact?.id ||
                null,

              organisation_id:
                organisationId,

              project_id:
                selectedProject?.id ||
                null,

              user_id:
                authData.user.id,
            })
            .select(
              "*"
            )
            .single();

        if (
          error
        ) {
          throw error;
        }

        setTasks(
          (
            previous
          ) => [
            data as TaskRecord,
            ...previous,
          ]
        );

        setNewTask({
          title:
            "",

          description:
            "",

          project_id:
            "",
        });
      } catch (
        taskError:
          unknown
      ) {
        console.error(
          "Task creation error:",
          taskError
        );

        alert(
          taskError instanceof
            Error
            ? taskError.message
            : "Task could not be created."
        );
      } finally {
        setCreatingTask(
          false
        );
      }
    };

  // ==========================================================
  // TOGGLE TASK
  // ==========================================================

  const toggleTaskComplete =
    async (
      task:
        TaskRecord
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      const newStatus =
        isCompletedTask(
          task.status
        )
          ? "todo"
          : "done";

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .update({
            status:
              newStatus,
          })
          .eq(
            "id",
            task.id
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        console.error(
          "Task update error:",
          error
        );

        return;
      }

      setTasks(
        (
          previous
        ) =>
          previous.map(
            (
              currentTask
            ) =>
              currentTask.id ===
              task.id
                ? {
                    ...currentTask,

                    status:
                      newStatus,
                  }
                : currentTask
          )
      );
    };

  // ==========================================================
  // DELETE TASK
  // ==========================================================

  const deleteTask =
    async (
      taskId:
        string
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      if (
        !window.confirm(
          "Delete this task?"
        )
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .delete()
          .eq(
            "id",
            taskId
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        console.error(
          "Task delete error:",
          error
        );

        return;
      }

      setTasks(
        (
          previous
        ) =>
          previous.filter(
            (
              task
            ) =>
              task.id !==
              taskId
          )
      );
    };

  // ==========================================================
  // ADD TASK COMMENT
  // ==========================================================

  const addTaskComment =
    async (
      taskId:
        string
    ) => {
      const content =
        taskComments[
          taskId
        ];

      if (
        !content?.trim() ||
        !organisationId
      ) {
        return;
      }

      const {
        data:
          authData,
      } =
        await supabase.auth.getUser();

      if (
        !authData.user
      ) {
        return;
      }

      /*
       * task_comments currently uses contact_id in the existing
       * implementation, so comments require the compatibility
       * contact link.
       */

      if (
        !linkedContact?.id
      ) {
        alert(
          "This customer does not yet have a linked contact record, so task comments cannot be recorded yet."
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "task_comments"
          )
          .insert({
            task_id:
              taskId,

            contact_id:
              linkedContact.id,

            organisation_id:
              organisationId,

            user_id:
              authData.user.id,

            content:
              content.trim(),
          })
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Comment error:",
          error
        );

        return;
      }

      setTaskCommentThreads(
        (
          previous
        ) => ({
          ...previous,

          [taskId]: [
            ...(previous[
              taskId
            ] ||
              []),

            data as TaskCommentRecord,
          ],
        })
      );

      setTaskComments(
        (
          previous
        ) => ({
          ...previous,

          [taskId]:
            "",
        })
      );
    };

  // ==========================================================
  // SEND EMAIL
  // ==========================================================

  const handleSendEmail =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (
        !customer ||
        !newEmail.subject.trim() ||
        !newEmail.body.trim() ||
        emailSaving
      ) {
        return;
      }

      if (
        !customer.email
      ) {
        alert(
          "This customer does not have an email address."
        );

        return;
      }

      if (
        !organisationId
      ) {
        return;
      }

      setEmailSaving(
        true
      );

      try {
        let userId =
          currentUserId;

        if (
          !userId
        ) {
          const {
            data:
              authData,
          } =
            await supabase.auth.getUser();

          userId =
            authData.user?.id ||
            null;

          setCurrentUserId(
            userId
          );
        }

        if (
          !userId
        ) {
          throw new Error(
            "Unable to identify the signed-in user."
          );
        }

        // ====================================================
        // SEND ACTUAL EMAIL
        // ====================================================

        const response =
          await fetch(
            "/api/send-email",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  to:
                    customer.email,

                  subject:
                    newEmail.subject.trim(),

                  body:
                    newEmail.body.trim(),
                }),
            }
          );

        const result =
          await response
            .json()
            .catch(
              () =>
                null
            );

        if (
          !response.ok
        ) {
          throw new Error(
            result?.error ||
              "Failed to send email."
          );
        }

        /*
         * EMAIL LOGGING CURRENTLY NEEDS contact_id.
         *
         * We still allow the real email to send if this customer
         * doesn't have a legacy contact, but we cannot create
         * email_threads without the existing contact relationship.
         */

        if (
          !linkedContact?.id
        ) {
          setNewEmail({
            subject:
              "",

            body:
              "",
          });

          alert(
            "Email sent successfully. This customer does not yet have a linked contact record, so the conversation could not be added to the TOTS email history."
          );

          return;
        }

        let threadId =
          activeThread?.id ||
          null;

        if (
          !threadId
        ) {
          const {
            data:
              threadData,
            error:
              threadError,
          } =
            await supabase
              .from(
                "email_threads"
              )
              .insert({
                profile_id:
                  userId,

                contact_id:
                  linkedContact.id,

                organisation_id:
                  organisationId,

                subject:
                  newEmail.subject.trim(),

                status:
                  "active",

                last_direction:
                  "outbound",

                last_preview:
                  newEmail.body
                    .trim()
                    .slice(
                      0,
                      200
                    ),

                last_message_at:
                  new Date()
                    .toISOString(),
              })
              .select(
                "*"
              )
              .single();

          if (
            threadError
          ) {
            throw threadError;
          }

          threadId =
            threadData.id;

          setActiveThread(
            threadData as EmailThreadRecord
          );
        }

        const {
          error:
            messageError,
        } =
          await supabase
            .from(
              "email_messages"
            )
            .insert({
              thread_id:
                threadId,

              profile_id:
                userId,

              organisation_id:
                organisationId,

              direction:
                "outbound",

              subject:
                newEmail.subject.trim(),

              body:
                newEmail.body.trim(),

              status:
                "sent",
            });

        if (
          messageError
        ) {
          throw messageError;
        }

        await supabase
          .from(
            "email_threads"
          )
          .update({
            last_message_at:
              new Date()
                .toISOString(),

            last_direction:
              "outbound",

            last_preview:
              newEmail.body
                .trim()
                .slice(
                  0,
                  200
                ),
          })
          .eq(
            "id",
            threadId
          );

        setNewEmail({
          subject:
            "",

          body:
            "",
        });

        await fetchThreads();

        if (
          threadId
        ) {
          await fetchMessages(
            threadId
          );
        }
      } catch (
        emailError:
          unknown
      ) {
        console.error(
          "Email send error:",
          emailError
        );

        alert(
          emailError instanceof
            Error
            ? emailError.message
            : "Failed to send email."
        );
      } finally {
        setEmailSaving(
          false
        );
      }
    };

  // ==========================================================
  // NOTE
  // ==========================================================

  const createClientNote =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (
        !noteForm.content.trim() ||
        !organisationId
      ) {
        return;
      }

      /*
       * Rich CRM notes currently use notes.contact_id.
       */

      if (
        !linkedContact?.id
      ) {
        /*
         * Customer still has its main notes column, so keep this
         * useful rather than blocking the user entirely.
         */

        const existingNotes =
          cleanString(
            customer?.notes
          );

        const newNote =
          `[${new Date().toLocaleString(
            "en-GB"
          )}] ${noteForm.content.trim()}`;

        const combined =
          existingNotes
            ? `${newNote}\n\n${existingNotes}`
            : newNote;

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "customers"
            )
            .update({
              notes:
                combined,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              customerId
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .select(
              "*"
            )
            .maybeSingle();

        if (
          error
        ) {
          console.error(
            "Customer note error:",
            error
          );

          return;
        }

        if (
          data
        ) {
          setCustomer(
            data as CustomerRecord
          );

          setEditForm(
            (
              previous
            ) => ({
              ...previous,

              notes:
                String(
                  data.notes ||
                    ""
                ),
            })
          );
        }

        setNoteForm({
          type:
            "internal",

          content:
            "",
        });

        return;
      }

      const {
        data:
          authData,
      } =
        await supabase.auth.getUser();

      if (
        !authData.user
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "notes"
          )
          .insert({
            user_id:
              authData.user.id,

            contact_id:
              linkedContact.id,

            organisation_id:
              organisationId,

            type:
              noteForm.type,

            content:
              noteForm.content.trim(),
          })
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Note error:",
          error
        );

        return;
      }

      setNotes(
        (
          previous
        ) => [
          data as NoteRecord,
          ...previous,
        ]
      );

      setNoteForm({
        type:
          "internal",

        content:
          "",
      });
    };

  // ==========================================================
  // TIMELINE MANUAL ENTRY
  // ==========================================================

  const addTimelineEntry =
    async (
      event:
        FormEvent
    ) => {
      event.preventDefault();

      if (
        !timelineEntry.trim() ||
        !organisationId
      ) {
        return;
      }

      if (
        !linkedContact?.id
      ) {
        alert(
          "This customer does not yet have a linked contact record. Automatic customer activity is still shown below, but manual contact timeline entries require the compatibility contact link."
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "contact_timeline"
          )
          .insert({
            contact_id:
              linkedContact.id,

            organisation_id:
              organisationId,

            type:
              "timeline",

            title:
              "Manual timeline update",

            content:
              timelineEntry.trim(),
          })
          .select(
            "*"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Timeline entry error:",
          error
        );

        return;
      }

      setTimelineEntries(
        (
          previous
        ) => [
          data as TimelineRecord,
          ...previous,
        ]
      );

      setTimelineEntry(
        ""
      );
    };

  // ==========================================================
  // HEALTH
  // ==========================================================

  const healthScore =
    useMemo(
      () => {
        const taskScore =
          Math.max(
            0,
            40 -
              openTasks.length *
                5
          );

        const projectScore =
          activeProjects.length >
          0
            ? 20
            : 10;

        const communicationScore =
          threads.length >
            0 ||
          messages.length >
            0
            ? 15
            : customer?.email
              ? 8
              : 3;

        const financeScore =
          paidTotal >
          0
            ? 15
            : invoicedTotal >
                0
              ? 10
              : 5;

        const marketingScore =
          customer?.on_mailing_list
            ? 10
            : 5;

        return Math.max(
          0,
          Math.min(
            100,
            taskScore +
              projectScore +
              communicationScore +
              financeScore +
              marketingScore
          )
        );
      },
      [
        openTasks.length,
        activeProjects.length,
        threads.length,
        messages.length,
        customer?.email,
        customer?.on_mailing_list,
        paidTotal,
        invoicedTotal,
      ]
    );

  // ==========================================================
  // TIMELINE EVENTS
  // ==========================================================

  const timelineEvents =
    useMemo(
      () =>
        [
          ...(customer?.created_at
            ? [
                {
                  id:
                    `customer-created-${customer.id}`,

                  type:
                    "customer",

                  created_at:
                    customer.created_at,

                  title:
                    "Customer added",

                  content:
                    `${customer.name || "Customer"} was added to the CRM.`,
                },
              ]
            : []),

          ...storeOrders.map(
            (
              order
            ) => ({
              id:
                `store-${order.id}`,

              type:
                "store order",

              created_at:
                order.created_at,

              title:
                order.order_number ||
                "Store order",

              content:
                `${formatCurrency(
                  order.total
                )} · ${
                  order.payment_status ||
                  "pending"
                } · ${
                  order.fulfilment_status ||
                  "new"
                }`,
            })
          ),

          ...timelineEntries.map(
            (
              entry
            ) => ({
              id:
                `timeline-${entry.id}`,

              type:
                entry.type ||
                "timeline",

              created_at:
                entry.created_at,

              title:
                entry.title ||
                "Timeline Entry",

              content:
                entry.content ||
                "",
            })
          ),

          ...messages.map(
            (
              message
            ) => ({
              id:
                `email-${message.id}`,

              type:
                "email",

              created_at:
                message.created_at,

              title:
                message.subject ||
                "Email",

              content:
                message.body ||
                "",
            })
          ),

          ...notes.map(
            (
              note
            ) => ({
              id:
                `note-${note.id}`,

              type:
                "note",

              created_at:
                note.created_at,

              title:
                note.type ||
                "Note",

              content:
                note.content ||
                "",
            })
          ),

          ...tasks.map(
            (
              task
            ) => ({
              id:
                `task-${task.id}`,

              type:
                "task",

              created_at:
                task.created_at ||
                task.due_date,

              title:
                task.title ||
                "Task",

              content:
                task.description ||
                "",
            })
          ),

          ...clientProjects.map(
            (
              project
            ) => ({
              id:
                `project-${project.id}`,

              type:
                "project",

              created_at:
                project.created_at ||
                project.due_date,

              title:
                project.name,

              content:
                project.status
                  ? `Status: ${project.status}`
                  : "",
            })
          ),

          ...clientInvoices.map(
            (
              invoice
            ) => ({
              id:
                `invoice-${invoice.id}`,

              type:
                "invoice",

              created_at:
                invoice.created_at ||
                invoice.date,

              title:
                `Invoice ${formatCurrency(
                  invoice.amount
                )}`,

              content:
                invoice.status ||
                "",
            })
          ),
        ]
          .filter(
            (
              event
            ) =>
              Boolean(
                event.created_at
              )
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second.created_at!
              ).getTime() -
              new Date(
                first.created_at!
              ).getTime()
          ),
      [
        customer,
        storeOrders,
        timelineEntries,
        messages,
        notes,
        tasks,
        clientProjects,
        clientInvoices,
        formatCurrency,
      ]
    );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2]">
        <div className="text-center">
          <Loader2
            size={26}
            className="mx-auto animate-spin text-[#829473]"
          />

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-stone-300">
            Opening customer
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    pageError
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle
            size={24}
            className="mx-auto text-red-400"
          />

          <h1 className="mt-5 font-serif text-4xl italic text-stone-800">
            Unable to load customer
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {
              pageError
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void fetchProfile()
            }
            className="mt-6 rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (
    !customer
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] p-6">
        <div className="text-center">
          <CircleUserRound
            size={28}
            className="mx-auto text-stone-300"
          />

          <h1 className="mt-4 font-serif text-4xl italic text-stone-800">
            Customer not found.
          </h1>

          <Link
            href="/crm"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white no-underline"
          >
            <ArrowLeft
              size={12}
            />

            Back to CRM
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================================
  // DISPLAY VALUES
  // ==========================================================

  const displayName =
    customer.company ||
    customer.name ||
    "Unnamed Customer";

  const personName =
    customer.company
      ? customer.name ||
        ""
      : "";

  const stageLabel =
    getCustomerStageLabel(
      customer.stage
    );

  const source =
    getCustomerSource(
      customer
    );

  const tabs:
    ClientTab[] =
    [
      "overview",
      "projects",
      "money",
      "tasks",
      "email",
      "info",
      "timeline",
    ];

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5f2] pb-32 text-stone-900">

      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pt-12">

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <Link
            href="/crm"
            className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-stone-400 no-underline transition hover:text-stone-700"
          >
            <ArrowLeft
              size={12}
            />

            Back to CRM
          </Link>

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              void fetchProfile(
                true
              )
            }
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-stone-500 disabled:opacity-40"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">

          <div className="p-6 sm:p-8 lg:p-10">

            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">

                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-[#a9b897] text-xl font-black text-white shadow-sm">
                  {getInitials(
                    customer.name ||
                      customer.company
                  )}
                </div>

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-[#a9b897]/15 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-[#829473]">
                      {
                        stageLabel
                      }
                    </span>

                    {source ===
                      "Store" && (
                      <span className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-white">
                        <ShoppingBag
                          size={9}
                        />

                        Store customer
                      </span>
                    )}

                    {linkedContact && (
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-stone-400">
                        Contact linked
                      </span>
                    )}

                  </div>

                  <h1 className="mt-4 break-words font-serif text-4xl italic leading-none tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                    {
                      displayName
                    }
                  </h1>

                  {personName && (
                    <p className="mt-2 text-sm font-semibold text-stone-600">
                      {
                        personName
                      }
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-stone-400">

                    {customer.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail
                          size={11}
                        />

                        {
                          customer.email
                        }
                      </span>
                    )}

                    {customer.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone
                          size={11}
                        />

                        {
                          customer.phone
                        }
                      </span>
                    )}

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      "email"
                    );

                    setShowComposer(
                      true
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#a9b897] px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                >
                  <Mail
                    size={12}
                  />

                  Send email
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "tasks"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-600"
                >
                  <Check
                    size={12}
                  />

                  Tasks
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(
                      "info"
                    );

                    setIsEditing(
                      true
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-stone-600"
                >
                  <Pencil
                    size={12}
                  />

                  Edit
                </button>

              </div>

            </div>

          </div>

          {/* MINI STATS */}

          <div className="grid border-t border-stone-100 sm:grid-cols-2 lg:grid-cols-4">

            <HeroStat
              label="Active projects"
              value={String(
                activeProjects.length
              )}
            />

            <HeroStat
              label="Invoiced"
              value={formatCurrency(
                invoicedTotal
              )}
            />

            <HeroStat
              label="Outstanding"
              value={formatCurrency(
                outstandingTotal
              )}
            />

            <HeroStat
              label="Open tasks"
              value={String(
                openTasks.length
              )}
            />

          </div>

        </section>

        {/* ====================================================
            TABS
        ==================================================== */}

        <div className="no-scrollbar mt-5 overflow-x-auto">

          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm">

            {tabs.map(
              (
                tab
              ) => (
                <button
                  key={
                    tab
                  }
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab
                    )
                  }
                  className={`rounded-xl px-4 py-3 text-[8px] font-black uppercase tracking-[0.14em] transition ${
                    activeTab ===
                    tab
                      ? "bg-stone-900 text-white"
                      : "text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                  }`}
                >
                  {
                    tab
                  }
                </button>
              )
            )}

          </div>

        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab ===
          "overview" && (
          <div className="mt-6 space-y-6">

            {/* TOTS SUMMARY */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/15 text-[#829473]">
                  <Sparkles
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    TOTS Client Summary
                  </p>

                  <p className="mt-3 max-w-4xl text-lg leading-8 text-stone-700">
                    {clientSummary ||
                      "This customer is ready to be connected to projects, invoices, tasks and communication."}
                  </p>
                </div>

              </div>

            </section>

            {/* LEGACY BRIDGE NOTICE */}

            {!linkedContact && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <div className="flex items-start gap-3">

                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Some older CRM features are not linked yet
                    </p>

                    <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-700">
                      Projects, invoices, expenses and tasks are already connected directly to this customer. Email history, contact timeline and task comments still use the older contact relationship until we finish migrating those tables to customer_id.
                    </p>
                  </div>

                </div>

              </section>
            )}

            {/* MAIN GRID */}

            <div className="grid gap-6 lg:grid-cols-12">

              {/* CURRENT WORK */}

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:col-span-7">

                <SectionHeading
                  kicker="Current work"
                  title="Active projects"
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "projects"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      View all
                    </button>
                  }
                />

                <div className="mt-6">

                  {activeProjects.length ===
                  0 ? (
                    <EmptyState
                      icon={
                        FolderKanban
                      }
                      title="No active projects"
                      description="Create a project and choose this customer to connect the work automatically."
                      action={
                        <Link
                          href="/projects"
                          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#829473] no-underline"
                        >
                          Open projects

                          <ArrowUpRight
                            size={12}
                          />
                        </Link>
                      }
                    />
                  ) : (
                    <div className="space-y-3">

                      {activeProjects
                        .slice(
                          0,
                          4
                        )
                        .map(
                          (
                            project
                          ) => (
                            <Link
                              key={
                                project.id
                              }
                              href={`/projects/${project.id}`}
                              className="group flex items-center justify-between rounded-2xl border border-transparent bg-stone-50 p-4 no-underline transition hover:border-stone-200 hover:bg-white"
                            >
                              <div>
                                <p className="text-sm font-semibold text-stone-700">
                                  {
                                    project.name
                                  }
                                </p>

                                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-stone-400">
                                  {project.status ||
                                    "In progress"}
                                </p>
                              </div>

                              <ArrowUpRight
                                size={14}
                                className="text-stone-300 transition group-hover:text-[#829473]"
                              />
                            </Link>
                          )
                        )}

                    </div>
                  )}

                </div>

              </section>

              {/* COMMERCIAL */}

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:col-span-5">

                <SectionHeading
                  kicker="Commercial"
                  title="Client value"
                />

                <div className="mt-6 space-y-4">

                  <ClientMoneyRow
                    label="Quoted"
                    value={formatCurrency(
                      quotedTotal
                    )}
                  />

                  <ClientMoneyRow
                    label="Invoiced"
                    value={formatCurrency(
                      invoicedTotal
                    )}
                  />

                  <ClientMoneyRow
                    label="Paid"
                    value={formatCurrency(
                      paidTotal
                    )}
                  />

                  <ClientMoneyRow
                    label="Outstanding"
                    value={formatCurrency(
                      outstandingTotal
                    )}
                  />

                  <ClientMoneyRow
                    label="Expenses"
                    value={formatCurrency(
                      expensesTotal
                    )}
                  />

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "money"
                    )
                  }
                  className="mt-6 text-xs font-semibold text-[#829473]"
                >
                  View financial activity →
                </button>

              </section>

            </div>

            {/* STORE */}

            {storeOrders.length >
              0 && (
              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                      TOTS Commerce
                    </p>

                    <h2 className="mt-1 font-serif text-3xl italic text-stone-800">
                      Store activity.
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-serif text-3xl italic text-stone-900">
                      {formatCurrency(
                        storeRevenue
                      )}
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.13em] text-stone-400">
                      Paid store value
                    </p>
                  </div>

                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">

                  {storeOrders
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        order
                      ) => (
                        <div
                          key={
                            order.id
                          }
                          className="rounded-2xl bg-stone-50 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">

                            <div>
                              <p className="text-sm font-semibold text-stone-700">
                                {order.order_number ||
                                  "Store order"}
                              </p>

                              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-stone-400">
                                {order.payment_status ||
                                  "pending"}{" "}
                                ·{" "}
                                {order.fulfilment_status ||
                                  "new"}
                              </p>
                            </div>

                            <p className="font-serif text-xl italic text-stone-900">
                              {formatCurrency(
                                order.total
                              )}
                            </p>

                          </div>
                        </div>
                      )
                    )}

                </div>

              </section>
            )}

          </div>
        )}

        {/* ====================================================
            PROJECTS
        ==================================================== */}

        {activeTab ===
          "projects" && (
          <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                  Client projects
                </p>

                <h2 className="mt-1 font-serif text-3xl italic text-stone-800">
                  Work for{" "}
                  {
                    displayName
                  }.
                </h2>

                <p className="mt-2 text-xs text-stone-400">
                  Projects connect to this customer using customer_id.
                </p>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-[0.13em] text-white no-underline"
              >
                <Plus
                  size={12}
                />

                New project
              </Link>

            </div>

            <div className="mt-8">

              {clientDataLoading ? (
                <Loader2
                  size={20}
                  className="animate-spin text-[#829473]"
                />
              ) : clientProjects.length ===
                0 ? (
                <EmptyState
                  icon={
                    FolderKanban
                  }
                  title="No projects yet"
                  description="When a project is created with this customer selected, it will appear here automatically."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                  {clientProjects.map(
                    (
                      project
                    ) => (
                      <Link
                        key={
                          project.id
                        }
                        href={`/projects/${project.id}`}
                        className="group rounded-2xl border border-stone-100 bg-stone-50 p-5 no-underline transition hover:border-[#a9b897] hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <p className="font-serif text-2xl italic text-stone-800">
                              {
                                project.name
                              }
                            </p>

                            <p className="mt-2 text-[8px] font-black uppercase tracking-[0.13em] text-stone-400">
                              {project.status ||
                                "In progress"}
                            </p>
                          </div>

                          <ArrowUpRight
                            size={15}
                            className="text-stone-300 group-hover:text-[#829473]"
                          />

                        </div>

                        {project.due_date && (
                          <p className="mt-8 text-xs text-stone-500">
                            Due{" "}
                            {formatSafeDate(
                              project.due_date
                            )}
                          </p>
                        )}

                      </Link>
                    )
                  )}

                </div>
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            MONEY
        ==================================================== */}

        {activeTab ===
          "money" && (
          <div className="mt-6 space-y-6">

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="Client money"
                title="Commercial relationship"
              />

              <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5">

                <ClientStatCard
                  label="Quoted"
                  value={formatCurrency(
                    quotedTotal
                  )}
                />

                <ClientStatCard
                  label="Invoiced"
                  value={formatCurrency(
                    invoicedTotal
                  )}
                />

                <ClientStatCard
                  label="Paid"
                  value={formatCurrency(
                    paidTotal
                  )}
                />

                <ClientStatCard
                  label="Outstanding"
                  value={formatCurrency(
                    outstandingTotal
                  )}
                />

                <ClientStatCard
                  label="Expenses"
                  value={formatCurrency(
                    expensesTotal
                  )}
                />

              </div>

            </section>

            <div className="grid gap-6 lg:grid-cols-2">

              <ClientFinanceList
                title="Invoices"
                icon={
                  ReceiptText
                }
                records={
                  clientInvoices
                }
                formatCurrency={
                  formatCurrency
                }
              />

              <ClientFinanceList
                title="Quotes"
                icon={
                  BadgePoundSterling
                }
                records={
                  clientQuotes
                }
                formatCurrency={
                  formatCurrency
                }
              />

            </div>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-center justify-between gap-4">

                <SectionHeading
                  kicker="Costs"
                  title="Client expenses"
                />

                <Link
                  href="/payments"
                  className="text-xs font-semibold text-[#829473] no-underline"
                >
                  Open Finance →
                </Link>

              </div>

              <div className="mt-6 space-y-2">

                {clientExpenses.length ===
                0 ? (
                  <p className="text-sm text-stone-400">
                    No expenses linked to this customer.
                  </p>
                ) : (
                  clientExpenses.map(
                    (
                      expense
                    ) => (
                      <div
                        key={
                          expense.id
                        }
                        className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-stone-700">
                            {expense.description ||
                              "Expense"}
                          </p>

                          <p className="mt-1 text-[9px] text-stone-400">
                            {formatSafeDate(
                              expense.date ||
                                expense.created_at
                            )}
                          </p>
                        </div>

                        <p className="font-semibold text-stone-700">
                          {formatCurrency(
                            expense.amount
                          )}
                        </p>
                      </div>
                    )
                  )
                )}

              </div>

            </section>

          </div>
        )}

        {/* ====================================================
            TASKS
        ==================================================== */}

        {activeTab ===
          "tasks" && (
          <div className="mt-6 space-y-6">

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="Client tasks"
                title="Actions & delivery"
              />

              <form
                className="mt-7 space-y-3"
                onSubmit={
                  createClientTask
                }
              >

                <input
                  className="tots-input"
                  placeholder="What needs to be done?"
                  value={
                    newTask.title
                  }
                  onChange={(
                    event
                  ) =>
                    setNewTask(
                      (
                        previous
                      ) => ({
                        ...previous,

                        title:
                          event.target.value,
                      })
                    )
                  }
                />

                <textarea
                  className="tots-input min-h-[90px] resize-none"
                  placeholder="Add some context..."
                  value={
                    newTask.description
                  }
                  onChange={(
                    event
                  ) =>
                    setNewTask(
                      (
                        previous
                      ) => ({
                        ...previous,

                        description:
                          event.target.value,
                      })
                    )
                  }
                />

                <select
                  className="tots-input"
                  value={
                    newTask.project_id
                  }
                  onChange={(
                    event
                  ) =>
                    setNewTask(
                      (
                        previous
                      ) => ({
                        ...previous,

                        project_id:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="">
                    No project
                  </option>

                  {clientProjects.map(
                    (
                      project
                    ) => (
                      <option
                        key={
                          project.id
                        }
                        value={
                          project.id
                        }
                      >
                        {
                          project.name
                        }
                      </option>
                    )
                  )}
                </select>

                <button
                  type="submit"
                  disabled={
                    creatingTask ||
                    !newTask.title.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#a9b897] px-5 py-3 text-[8px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-40"
                >
                  {creatingTask ? (
                    <Loader2
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus
                      size={12}
                    />
                  )}

                  {creatingTask
                    ? "Creating..."
                    : "Create task"}
                </button>

              </form>

            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              {tasks.length ===
              0 ? (
                <EmptyState
                  icon={
                    Check
                  }
                  title="No tasks"
                  description="This customer doesn't have any tasks yet."
                />
              ) : (
                <div className="space-y-3">

                  {tasks.map(
                    (
                      task
                    ) => {
                      const done =
                        isCompletedTask(
                          task.status
                        );

                      return (
                        <div
                          key={
                            task.id
                          }
                          className={`rounded-2xl border border-stone-100 bg-stone-50 p-5 ${
                            done
                              ? "opacity-60"
                              : ""
                          }`}
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex min-w-0 items-start gap-3">

                              <button
                                type="button"
                                onClick={() =>
                                  void toggleTaskComplete(
                                    task
                                  )
                                }
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                                  done
                                    ? "border-[#a9b897] bg-[#a9b897] text-white"
                                    : "border-stone-200 bg-white text-transparent"
                                }`}
                              >
                                <Check
                                  size={13}
                                />
                              </button>

                              <div className="min-w-0">

                                <h4
                                  className={`font-semibold ${
                                    done
                                      ? "text-stone-400 line-through"
                                      : "text-stone-700"
                                  }`}
                                >
                                  {
                                    task.title
                                  }
                                </h4>

                                {task.description && (
                                  <p className="mt-2 text-sm leading-6 text-stone-500">
                                    {
                                      task.description
                                    }
                                  </p>
                                )}

                                {task.project_id && (
                                  <Link
                                    href={`/projects/${task.project_id}`}
                                    className="mt-3 inline-flex rounded-full bg-[#a9b897]/15 px-3 py-1 text-[9px] font-semibold text-stone-600 no-underline"
                                  >
                                    {projectMap[
                                      task.project_id
                                    ] ||
                                      "Project"}
                                  </Link>
                                )}

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteTask(
                                  task.id
                                )
                              }
                              className="shrink-0 text-red-300 transition hover:text-red-500"
                            >
                              <Trash2
                                size={14}
                              />
                            </button>

                          </div>

                          {/* COMMENTS */}

                          <div className="mt-4 border-t border-stone-200 pt-4">

                            {!linkedContact && (
                              <p className="mb-3 text-[9px] leading-4 text-amber-600">
                                Task comments still require the older contact link. The task itself is correctly linked to this customer.
                              </p>
                            )}

                            <div className="flex gap-2">

                              <input
                                disabled={
                                  !linkedContact
                                }
                                className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white p-2.5 text-xs outline-none disabled:opacity-40"
                                placeholder="Add comment..."
                                value={
                                  taskComments[
                                    task.id
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  setTaskComments(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,

                                      [task.id]:
                                        event.target.value,
                                    })
                                  )
                                }
                              />

                              <button
                                type="button"
                                disabled={
                                  !linkedContact ||
                                  !taskComments[
                                    task.id
                                  ]?.trim()
                                }
                                onClick={() =>
                                  void addTaskComment(
                                    task.id
                                  )
                                }
                                className="rounded-lg bg-[#a9b897] px-3 py-2 text-white disabled:opacity-30"
                              >
                                <Send
                                  size={13}
                                />
                              </button>

                            </div>

                            {(taskCommentThreads[
                              task.id
                            ] ||
                              []).length >
                              0 && (
                              <div className="mt-3 space-y-2">

                                {(taskCommentThreads[
                                  task.id
                                ] ||
                                  []).map(
                                  (
                                    comment
                                  ) => (
                                    <div
                                      key={
                                        comment.id
                                      }
                                      className="rounded-xl border border-stone-100 bg-white p-3"
                                    >
                                      <p className="text-[8px] uppercase tracking-[0.1em] text-stone-400">
                                        {comment.created_at
                                          ? new Date(
                                              comment.created_at
                                            ).toLocaleString(
                                              "en-GB"
                                            )
                                          : ""}
                                      </p>

                                      <p className="mt-1 text-xs leading-5 text-stone-700">
                                        {
                                          comment.content
                                        }
                                      </p>
                                    </div>
                                  )
                                )}

                              </div>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </div>
        )}

        {/* ====================================================
            EMAIL
        ==================================================== */}

        {activeTab ===
          "email" && (
          <div className="mt-6">

            {!linkedContact && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <p className="text-sm font-semibold text-amber-800">
                  Email history is not linked yet
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  You can still send an email to this customer. Existing TOTS email-thread history requires a contact record linked through customer_id.
                </p>

              </div>
            )}

            <div className="grid min-h-[680px] gap-6 lg:grid-cols-[320px_1fr]">

              {/* THREAD LIST */}

              <aside className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-400">
                      Email
                    </p>

                    <h3 className="mt-1 font-serif text-2xl italic text-stone-800">
                      Conversations
                    </h3>
                  </div>

                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[9px] text-stone-500">
                    {
                      threads.length
                    }
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveThread(
                      null
                    );

                    setMessages(
                      []
                    );

                    setShowComposer(
                      true
                    );

                    setNewEmail({
                      subject:
                        "",

                      body:
                        "",
                    });
                  }}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 p-3 text-[8px] font-black uppercase tracking-[0.14em] text-white"
                >
                  <Plus
                    size={12}
                  />

                  New email
                </button>

                <div className="space-y-2">

                  {threads.length ===
                  0 ? (
                    <p className="rounded-xl bg-stone-50 p-4 text-xs leading-5 text-stone-400">
                      No saved conversations yet.
                    </p>
                  ) : (
                    threads.map(
                      (
                        thread
                      ) => (
                        <button
                          key={
                            thread.id
                          }
                          type="button"
                          onClick={() => {
                            setActiveThread(
                              thread
                            );

                            setShowComposer(
                              false
                            );

                            void fetchMessages(
                              thread.id
                            );
                          }}
                          className={`block w-full rounded-xl p-3 text-left transition ${
                            activeThread?.id ===
                            thread.id
                              ? "bg-[#a9b897] text-white"
                              : "bg-stone-50 hover:bg-stone-100"
                          }`}
                        >
                          <p className="truncate text-xs font-semibold">
                            {thread.subject ||
                              "Conversation"}
                          </p>

                          <p
                            className={`mt-1 truncate text-[9px] ${
                              activeThread?.id ===
                              thread.id
                                ? "text-white/60"
                                : "text-stone-400"
                            }`}
                          >
                            {thread.last_preview ||
                              formatSafeDate(
                                thread.last_message_at ||
                                  thread.created_at
                              )}
                          </p>
                        </button>
                      )
                    )
                  )}

                </div>

              </aside>

              {/* MESSAGES */}

              <section className="flex flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">

                <div className="mb-4 flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <h2 className="font-serif text-2xl italic text-stone-800">
                      {activeThread?.subject ||
                        "New conversation"}
                    </h2>

                    <p className="mt-1 text-xs text-stone-400">
                      {customer.email ||
                        "No email address"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      !customer.email
                    }
                    onClick={() =>
                      setShowComposer(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="rounded-xl bg-[#a9b897] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-40"
                  >
                    {showComposer
                      ? "Hide composer"
                      : activeThread
                        ? "Reply"
                        : "Write email"}
                  </button>

                </div>

                {showComposer && (
                  <form
                    onSubmit={
                      handleSendEmail
                    }
                    className="mb-6 space-y-3 rounded-2xl bg-stone-50 p-4"
                  >

                    <input
                      className="tots-input bg-white"
                      placeholder="Subject"
                      value={
                        newEmail.subject
                      }
                      onChange={(
                        event
                      ) =>
                        setNewEmail(
                          (
                            previous
                          ) => ({
                            ...previous,

                            subject:
                              event.target.value,
                          })
                        )
                      }
                    />

                    <textarea
                      className="tots-input min-h-[140px] resize-none bg-white"
                      placeholder="Write your message..."
                      value={
                        newEmail.body
                      }
                      onChange={(
                        event
                      ) =>
                        setNewEmail(
                          (
                            previous
                          ) => ({
                            ...previous,

                            body:
                              event.target.value,
                          })
                        )
                      }
                    />

                    <button
                      type="submit"
                      disabled={
                        emailSaving ||
                        !customer.email ||
                        !newEmail.subject.trim() ||
                        !newEmail.body.trim()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a9b897] py-3.5 text-[8px] font-black uppercase tracking-[0.14em] text-white disabled:opacity-40"
                    >
                      {emailSaving ? (
                        <>
                          <Loader2
                            size={13}
                            className="animate-spin"
                          />

                          Sending...
                        </>
                      ) : (
                        <>
                          <Send
                            size={13}
                          />

                          Send email
                        </>
                      )}
                    </button>

                  </form>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto">

                  {messages.length ===
                  0 ? (
                    <div className="py-14 text-center">
                      <Mail
                        size={24}
                        className="mx-auto text-stone-200"
                      />

                      <p className="mt-3 text-sm text-stone-400">
                        No saved messages yet.
                      </p>
                    </div>
                  ) : (
                    messages.map(
                      (
                        message
                      ) => (
                        <div
                          key={
                            message.id
                          }
                          className={`rounded-2xl border p-4 ${
                            message.direction ===
                            "outbound"
                              ? "border-[#a9b897]/20 bg-[#a9b897]/10"
                              : "border-stone-200 bg-stone-50"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-4">

                            <span className="text-[8px] font-black uppercase tracking-[0.12em] text-stone-400">
                              {message.direction ===
                              "outbound"
                                ? "Sent"
                                : "Received"}
                            </span>

                            <span className="text-[9px] text-stone-400">
                              {formatSafeDate(
                                message.created_at,
                                "dd MMM yyyy HH:mm"
                              )}
                            </span>

                          </div>

                          {message.subject && (
                            <p className="mb-2 text-sm font-semibold text-stone-700">
                              {
                                message.subject
                              }
                            </p>
                          )}

                          <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
                            {
                              message.body
                            }
                          </p>
                        </div>
                      )
                    )
                  )}

                </div>

              </section>

            </div>

          </div>
        )}

        {/* ====================================================
            INFO
        ==================================================== */}

        {activeTab ===
          "info" && (
          <div className="mt-6 space-y-6">

            <div className="flex justify-end">

              {isEditing ? (
                <div className="flex gap-2">

                  <button
                    type="button"
                    disabled={
                      isSaving
                    }
                    onClick={() => {
                      setIsEditing(
                        false
                      );

                      setEditForm({
                        name:
                          customer.name ||
                          "",

                        email:
                          customer.email ||
                          "",

                        phone:
                          customer.phone ||
                          "",

                        address:
                          customer.address ||
                          "",

                        company:
                          customer.company ||
                          "",

                        stage:
                          customer.stage ||
                          "client",

                        clientType:
                          customer.client_type ||
                          customer.stage ||
                          "client",

                        status:
                          customer.status ||
                          "live",

                        notes:
                          customer.notes ||
                          "",

                        onMailingList:
                          customer.on_mailing_list ===
                          true,

                        mailingListCategory:
                          customer.mailing_list_category ||
                          "General",
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-stone-500"
                  >
                    <X
                      size={11}
                    />

                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      isSaving
                    }
                    onClick={() =>
                      void handleUpdate()
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#a9b897] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-40"
                  >
                    {isSaving ? (
                      <Loader2
                        size={11}
                        className="animate-spin"
                      />
                    ) : (
                      <Save
                        size={11}
                      />
                    )}

                    {isSaving
                      ? "Saving..."
                      : "Save changes"}
                  </button>

                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setIsEditing(
                      true
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#a9b897] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-white"
                >
                  <Pencil
                    size={11}
                  />

                  Edit customer
                </button>
              )}

            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              {/* CONTACT DETAILS */}

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

                <SectionHeading
                  kicker="Details"
                  title="Contact information"
                />

                <div className="mt-6 space-y-4">

                  {isEditing ? (
                    <>
                      <FormField
                        label="Name"
                        icon={
                          UserRound
                        }
                      >
                        <input
                          className="tots-input with-icon"
                          value={
                            editForm.name
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                name:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label="Email"
                        icon={
                          Mail
                        }
                      >
                        <input
                          type="email"
                          className="tots-input with-icon"
                          value={
                            editForm.email
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                email:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label="Phone"
                        icon={
                          Phone
                        }
                      >
                        <input
                          className="tots-input with-icon"
                          value={
                            editForm.phone
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                phone:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label="Address"
                        icon={
                          Building2
                        }
                      >
                        <input
                          className="tots-input with-icon"
                          value={
                            editForm.address
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                address:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </FormField>
                    </>
                  ) : (
                    <>
                      <InfoRow
                        label="Name"
                        value={
                          customer.name ||
                          "Not provided"
                        }
                      />

                      <InfoRow
                        label="Email"
                        value={
                          customer.email ||
                          "Not provided"
                        }
                      />

                      <InfoRow
                        label="Phone"
                        value={
                          customer.phone ||
                          "Not provided"
                        }
                      />

                      <InfoRow
                        label="Address"
                        value={
                          customer.address ||
                          "Not provided"
                        }
                      />

                      <InfoRow
                        label="Created"
                        value={
                          formatSafeDate(
                            customer.created_at
                          ) ||
                          "—"
                        }
                      />
                    </>
                  )}

                </div>

              </section>

              {/* BUSINESS */}

              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

                <SectionHeading
                  kicker="Relationship"
                  title="Business information"
                />

                <div className="mt-6 space-y-4">

                  {isEditing ? (
                    <>
                      <FormField
                        label="Company"
                        icon={
                          Building2
                        }
                      >
                        <input
                          className="tots-input with-icon"
                          value={
                            editForm.company
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                company:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </FormField>

                      <div>
                        <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
                          Relationship
                        </label>

                        <select
                          className="tots-input"
                          value={
                            editForm.stage
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                stage:
                                  event.target.value,

                                clientType:
                                  event.target.value,
                              })
                            )
                          }
                        >
                          <option value="client">
                            Client
                          </option>

                          <option value="lead">
                            Lead
                          </option>

                          <option value="partner">
                            Partner
                          </option>

                          <option value="member">
                            Team member
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
                          Status
                        </label>

                        <select
                          className="tots-input"
                          value={
                            editForm.status
                          }
                          onChange={(
                            event
                          ) =>
                            setEditForm(
                              (
                                previous
                              ) => ({
                                ...previous,

                                status:
                                  event.target.value,
                              })
                            )
                          }
                        >
                          <option value="live">
                            Live
                          </option>

                          <option value="inactive">
                            Inactive
                          </option>

                          <option value="archived">
                            Archived
                          </option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow
                        label="Company"
                        value={
                          customer.company ||
                          "Not provided"
                        }
                      />

                      <InfoRow
                        label="Relationship"
                        value={
                          stageLabel
                        }
                      />

                      <InfoRow
                        label="Status"
                        value={
                          customer.status ||
                          "live"
                        }
                      />

                      <InfoRow
                        label="Source"
                        value={
                          source
                        }
                      />

                      <InfoRow
                        label="Commercial record"
                        value="Customer source of truth"
                      />

                      <InfoRow
                        label="Legacy contact"
                        value={
                          linkedContact
                            ? "Linked"
                            : "Not linked"
                        }
                      />
                    </>
                  )}

                </div>

              </section>

            </div>

            {/* MARKETING */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="Marketing"
                title="Mailing preferences"
              />

              <div className="mt-6">

                {isEditing ? (
                  <div className="space-y-4">

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-stone-50 p-4">

                      <div>
                        <p className="text-sm font-semibold text-stone-700">
                          On mailing list
                        </p>

                        <p className="mt-1 text-[9px] leading-4 text-stone-400">
                          Only enable this where you have permission to contact them for marketing.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={
                          editForm.onMailingList
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              onMailingList:
                                event.target.checked,
                            })
                          )
                        }
                        className="h-4 w-4 accent-[#829473]"
                      />

                    </label>

                    {editForm.onMailingList && (
                      <input
                        className="tots-input"
                        value={
                          editForm.mailingListCategory
                        }
                        onChange={(
                          event
                        ) =>
                          setEditForm(
                            (
                              previous
                            ) => ({
                              ...previous,

                              mailingListCategory:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="General"
                      />
                    )}

                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">

                    <InfoCard
                      label="Mailing list"
                      value={
                        customer.on_mailing_list
                          ? "Subscribed"
                          : "Not subscribed"
                      }
                    />

                    <InfoCard
                      label="Category"
                      value={
                        customer.mailing_list_category ||
                        "General"
                      }
                    />

                  </div>
                )}

              </div>

            </section>

            {/* NOTES */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="Customer notes"
                title="Things worth remembering"
              />

              {isEditing ? (
                <textarea
                  className="tots-input mt-6 min-h-[180px] resize-none"
                  value={
                    editForm.notes
                  }
                  onChange={(
                    event
                  ) =>
                    setEditForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        notes:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Add useful context about this customer..."
                />
              ) : (
                <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                  {customer.notes ||
                    "No customer notes have been added yet."}
                </p>
              )}

            </section>

            {/* TAGS */}

            {safeArray(
              customer.tags
            ).length >
              0 && (
              <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

                <SectionHeading
                  kicker="Tags"
                  title="Customer labels"
                />

                <div className="mt-5 flex flex-wrap gap-2">

                  {safeArray(
                    customer.tags
                  ).map(
                    (
                      tag
                    ) => (
                      <span
                        key={
                          tag
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-stone-500"
                      >
                        <Tag
                          size={9}
                        />

                        {
                          tag
                        }
                      </span>
                    )
                  )}

                </div>

              </section>
            )}

          </div>
        )}

        {/* ====================================================
            TIMELINE
        ==================================================== */}

        {activeTab ===
          "timeline" && (
          <div className="mt-6 space-y-6">

            {/* HEALTH */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    Customer health
                  </p>

                  <h2 className="mt-1 font-serif text-3xl italic text-stone-800">
                    Relationship snapshot.
                  </h2>

                  <p className="mt-2 max-w-xl text-xs leading-5 text-stone-400">
                    Based on projects, outstanding tasks, communication, finance and engagement.
                  </p>
                </div>

                <p className="font-serif text-6xl italic leading-none text-stone-900">
                  {
                    healthScore
                  }
                  <span className="text-2xl text-stone-300">
                    /100
                  </span>
                </p>

              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#a9b897] transition-all"
                  style={{
                    width:
                      `${healthScore}%`,
                  }}
                />
              </div>

            </section>

            {/* MANUAL TIMELINE */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="Timeline"
                title="Add an update"
              />

              <form
                onSubmit={
                  addTimelineEntry
                }
                className="mt-6 space-y-3"
              >

                <textarea
                  disabled={
                    !linkedContact
                  }
                  className="tots-input min-h-[100px] resize-none disabled:opacity-40"
                  placeholder={
                    linkedContact
                      ? "Add a relationship update..."
                      : "Manual contact timeline entries require a linked contact."
                  }
                  value={
                    timelineEntry
                  }
                  onChange={(
                    event
                  ) =>
                    setTimelineEntry(
                      event.target.value
                    )
                  }
                />

                <button
                  type="submit"
                  disabled={
                    !linkedContact ||
                    !timelineEntry.trim()
                  }
                  className="rounded-xl bg-[#a9b897] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-30"
                >
                  Add to timeline
                </button>

              </form>

            </section>

            {/* ACTIVITY */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <SectionHeading
                kicker="History"
                title="Customer activity"
              />

              <div className="mt-6 space-y-3">

                {timelineEvents.length ===
                0 ? (
                  <p className="text-sm text-stone-400">
                    No activity yet.
                  </p>
                ) : (
                  timelineEvents.map(
                    (
                      event
                    ) => (
                      <div
                        key={
                          event.id
                        }
                        className="rounded-2xl border border-stone-100 bg-stone-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#829473]">
                              {
                                event.type
                              }
                            </p>

                            <p className="mt-1 text-sm font-semibold text-stone-700">
                              {
                                event.title
                              }
                            </p>

                            {event.content && (
                              <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-500">
                                {
                                  event.content
                                }
                              </p>
                            )}

                          </div>

                          <span className="shrink-0 text-[9px] text-stone-400">
                            {formatSafeDate(
                              event.created_at,
                              "dd MMM yyyy HH:mm"
                            )}
                          </span>

                        </div>
                      </div>
                    )
                  )
                )}

              </div>

            </section>

            {/* NOTES */}

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a9b897]/15 text-[#829473]">
                  <FileText
                    size={15}
                  />
                </div>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#829473]">
                    Notes
                  </p>

                  <h3 className="font-serif text-2xl italic text-stone-800">
                    Relationship notes
                  </h3>
                </div>

              </div>

              <form
                onSubmit={
                  createClientNote
                }
                className="mt-6 space-y-3"
              >

                <select
                  value={
                    noteForm.type
                  }
                  onChange={(
                    event
                  ) =>
                    setNoteForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        type:
                          event.target.value,
                      })
                    )
                  }
                  className="tots-input"
                >
                  <option value="internal">
                    Internal note
                  </option>

                  <option value="meeting">
                    Meeting
                  </option>

                  <option value="call">
                    Call
                  </option>
                </select>

                <textarea
                  className="tots-input min-h-[100px] resize-none"
                  placeholder="Add a note..."
                  value={
                    noteForm.content
                  }
                  onChange={(
                    event
                  ) =>
                    setNoteForm(
                      (
                        previous
                      ) => ({
                        ...previous,

                        content:
                          event.target.value,
                      })
                    )
                  }
                />

                <button
                  type="submit"
                  disabled={
                    !noteForm.content.trim()
                  }
                  className="rounded-xl bg-[#a9b897] px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.13em] text-white disabled:opacity-30"
                >
                  Add note
                </button>

              </form>

              {notes.length >
                0 && (
                <div className="mt-6 space-y-3">

                  {notes.map(
                    (
                      note
                    ) => (
                      <div
                        key={
                          note.id
                        }
                        className="rounded-xl bg-stone-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#829473]">
                            {note.type ||
                              "note"}
                          </p>

                          <span className="text-[9px] text-stone-400">
                            {formatSafeDate(
                              note.created_at
                            )}
                          </span>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                          {
                            note.content
                          }
                        </p>
                      </div>
                    )
                  )}

                </div>
              )}

            </section>

          </div>
        )}

      </div>

      <PageStyles />

    </main>
  );
}

// ============================================================
// HERO STAT
// ============================================================

function HeroStat({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="border-b border-stone-100 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">

      <p className="font-serif text-2xl italic leading-none text-stone-900">
        {
          value
        }
      </p>

      <p className="mt-2 text-[7px] font-black uppercase tracking-[0.14em] text-stone-400">
        {
          label
        }
      </p>

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function ClientStatCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-5">

      <p className="font-serif text-2xl italic text-stone-800">
        {
          value
        }
      </p>

      <p className="mt-2 text-[7px] font-black uppercase tracking-[0.14em] text-stone-400">
        {
          label
        }
      </p>

    </div>
  );
}

// ============================================================
// MONEY ROW
// ============================================================

function ClientMoneyRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0 last:pb-0">

      <span className="text-xs text-stone-400">
        {
          label
        }
      </span>

      <span className="text-sm font-semibold text-stone-700">
        {
          value
        }
      </span>

    </div>
  );
}

// ============================================================
// FINANCE LIST
// ============================================================

function ClientFinanceList({
  title,
  records,
  formatCurrency,
  icon:
    Icon,
}: {
  title:
    string;

  records:
    FinanceRecord[];

  formatCurrency:
    (
      value:
        | number
        | string
        | null
        | undefined
    ) => string;

  icon:
    any;
}) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a9b897]/15 text-[#829473]">
            <Icon
              size={14}
            />
          </div>

          <h3 className="font-serif text-2xl italic text-stone-800">
            {
              title
            }
          </h3>

        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-[9px] text-stone-500">
          {
            records.length
          }
        </span>

      </div>

      <div className="mt-6">

        {records.length ===
        0 ? (
          <p className="text-sm text-stone-400">
            No{" "}
            {title.toLowerCase()}{" "}
            yet.
          </p>
        ) : (
          <div className="space-y-2">

            {records.map(
              (
                record
              ) => (
                <div
                  key={
                    record.id
                  }
                  className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-700">
                      {formatCurrency(
                        record.amount
                      )}
                    </p>

                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-stone-400">
                      {record.status ||
                        "Draft"}
                    </p>
                  </div>

                  <span className="text-[9px] text-stone-400">
                    {formatSafeDate(
                      record.due_date ||
                        record.date ||
                        record.created_at
                    )}
                  </span>
                </div>
              )
            )}

          </div>
        )}

      </div>

    </section>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-stone-100 pb-4 last:border-0 last:pb-0">

      <span className="text-xs text-stone-400">
        {
          label
        }
      </span>

      <span className="max-w-[65%] break-words text-right text-xs font-semibold text-stone-700">
        {
          value
        }
      </span>

    </div>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">

      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-stone-400">
        {
          label
        }
      </p>

      <p className="mt-2 text-sm font-semibold text-stone-700">
        {
          value
        }
      </p>

    </div>
  );
}

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  kicker,
  title,
  action,
}: {
  kicker:
    string;

  title:
    string;

  action?:
    React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">

      <div>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#829473]">
          {
            kicker
          }
        </p>

        <h2 className="mt-1 font-serif text-3xl italic leading-none text-stone-800">
          {
            title
          }
        </h2>
      </div>

      {
        action
      }

    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  icon:
    Icon,
  title,
  description,
  action,
}: {
  icon:
    any;

  title:
    string;

  description:
    string;

  action?:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-300">
        <Icon
          size={19}
        />
      </div>

      <p className="mt-4 text-sm font-semibold text-stone-600">
        {
          title
        }
      </p>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-stone-400">
        {
          description
        }
      </p>

      {
        action
      }

    </div>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  icon:
    Icon,
  children,
}: {
  label:
    string;

  icon:
    any;

  children:
    React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
        {
          label
        }
      </label>

      <div className="relative">

        <Icon
          size={13}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-stone-300"
        />

        {
          children
        }

      </div>

    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

function PageStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap");

      .font-serif {
        font-family:
          "Instrument Serif",
          Georgia,
          serif;
      }

      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .tots-input {
        width: 100%;
        border: 1px solid #e7e5e4;
        background: #fafaf9;
        border-radius: 0.8rem;
        padding: 0.9rem 1rem;
        font-size: 0.75rem;
        color: #44403c;
        outline: none;
        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .tots-input.with-icon {
        padding-left: 2.6rem;
      }

      .tots-input::placeholder {
        color: #c4bfb9;
      }

      .tots-input:focus {
        border-color: #a9b897;
        background: #ffffff;
        box-shadow:
          0 0 0 3px
          rgba(
            169,
            184,
            151,
            0.12
          );
      }
    `}</style>
  );
}