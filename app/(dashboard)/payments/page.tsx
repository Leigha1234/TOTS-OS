"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createBrowserClient,
} from "@supabase/ssr";

import FinanceHeader from "./components/FinanceHeader";
import FinanceNav from "./components/FinanceNav";
import FinanceNotification from "./components/FinanceNotification";

import FinanceOverview from "./components/FinanceOverview";
import FinanceSales from "./components/FinanceSales";
import FinanceExpenses from "./components/FinanceExpenses";

import InvoiceQuoteModal, {
  type FinanceContact,
  type FinanceLineItem,
  type FinanceProject,
  type FinanceStaffMember,
  type InvoiceQuoteDocType,
  type InvoiceQuoteFormData,
} from "./components/modals/InvoiceQuoteModal";

import ExpenseModal, {
  type ExpenseForm,
} from "./components/modals/ExpenseModal";

import EmployeeModal, {
  type EmployeeForm,
} from "./components/modals/EmployeeModal";

import RecurringInvoiceModal, {
  type RecurringInvoiceForm,
} from "./components/modals/RecurringInvoiceModal";

import VatModal, {
  type VatForm,
} from "./components/modals/VatModal";

import TaxModal, {
  type TaxForm,
} from "./components/modals/TaxModal";

import {
  useFinanceContext,
} from "./hooks/useFinanceContext";

import {
  useFinanceData,
} from "./hooks/useFinanceData";

import {
  useFinanceMetrics,
} from "./hooks/useFinanceMetrics";

// ============================================================
// TYPES
// ============================================================

type FinanceTab =
  | "overview"
  | "sales"
  | "expenses"
  | "tax"
  | "payroll"
  | "timesheets";

type ModalType =
  | "invoiceQuote"
  | "expense"
  | "employee"
  | "recurring"
  | "vat"
  | "tax"
  | null;

type NotificationType = {
  visible: boolean;
  message: string;
  type: "success" | "error";
};

// ============================================================
// INITIAL STATE
// ============================================================

const createInitialInvoiceQuoteForm =
  (): InvoiceQuoteFormData => {
    const today = new Date();

    const timezoneOffset =
      today.getTimezoneOffset();

    const localToday =
      new Date(
        today.getTime() -
          timezoneOffset *
            60 *
            1000
      )
        .toISOString()
        .slice(0, 10);

    return {
      customerId: "",
      projectId: "",
      newClientName: "",

      invoiceNumber: "",
      orderNumber: "",

      invoiceDate:
        localToday,

      dueDate: "",

      customerName: "",
      customerAddress: "",

      salesPerson: "",

      assignedStaffId: "",
      assignedContactId: "",

      sendToContactId: "",
      sendToEmail: "",

      paymentMethod: "",
      paymentInstructions: "",

      vatEnabled: true,
      vatRate: "20",

      repeatInvoice: false,
      repeatFrequency:
        "monthly",
      repeatStartDate: "",
      repeatEndDate: "",

      remindersEnabled:
        false,

      reminderDaysBefore:
        "3",

      reminderDaysAfter:
        "1",

      terms:
        "Payment is due by the date shown on this document. Please use the invoice number as your payment reference.",

      notes: "",
    };
  };

const INITIAL_LINE_ITEMS: FinanceLineItem[] =
  [
    {
      id: 1,
      desc: "",
      qty: 1,
      price: 0,
    },
  ];

const INITIAL_EXPENSE_FORM: ExpenseForm = {
  description: "",
  amount: "",
  date: "",
  status: "pending",
  customerId: "",
  projectId: "",
  receiptName: "",
  receiptUrl: "",
};

const INITIAL_EMPLOYEE_FORM: EmployeeForm =
  {
    name: "",
    role: "",
    salary_gross: "",
  };

const INITIAL_RECURRING_FORM: RecurringInvoiceForm =
  {
    client_name: "",
    amount: "",
    interval: "monthly",
    next_run: "",
  };

const INITIAL_VAT_FORM: VatForm = {
  amount: "",
  description: "",
};

const INITIAL_TAX_FORM: TaxForm = {
  amount: "",
  description: "",
};

// ============================================================
// PAGE
// ============================================================

export default function PaymentsPage() {
  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ==========================================================
  // MAIN STATE
  // ==========================================================

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<FinanceTab>(
      "overview"
    );

  const [
    activeModal,
    setActiveModal,
  ] =
    useState<ModalType>(
      null
    );

  const [
    projects,
    setProjects,
  ] =
    useState<
      FinanceProject[]
    >([]);

  const [
    contacts,
    setContacts,
  ] =
    useState<
      FinanceContact[]
    >([]);

  const [
    staffMembers,
    setStaffMembers,
  ] =
    useState<
      FinanceStaffMember[]
    >([]);

  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(false);

  const [
    notification,
    setNotification,
  ] =
    useState<NotificationType>({
      visible: false,
      message: "",
      type: "success",
    });

  // ==========================================================
  // INVOICE / QUOTE
  // ==========================================================

  const [
    invoiceQuoteSubmitting,
    setInvoiceQuoteSubmitting,
  ] =
    useState(false);

  const [
    invoiceQuoteDocType,
    setInvoiceQuoteDocType,
  ] =
    useState<InvoiceQuoteDocType>(
      "Invoice"
    );

  const [
    invoiceQuoteForm,
    setInvoiceQuoteForm,
  ] =
    useState<InvoiceQuoteFormData>(
      () =>
        createInitialInvoiceQuoteForm()
    );

  const [
    invoiceQuoteLineItems,
    setInvoiceQuoteLineItems,
  ] =
    useState<
      FinanceLineItem[]
    >(
      INITIAL_LINE_ITEMS
    );

  // ==========================================================
  // EXPENSE
  // ==========================================================

  const [
    expenseSubmitting,
    setExpenseSubmitting,
  ] =
    useState(false);

  const [
    receiptFile,
    setReceiptFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    uploadingReceipt,
    setUploadingReceipt,
  ] =
    useState(false);

  const [
    expenseForm,
    setExpenseForm,
  ] =
    useState<ExpenseForm>(
      INITIAL_EXPENSE_FORM
    );

  // ==========================================================
  // EMPLOYEE
  // ==========================================================

  const [
    employeeSubmitting,
    setEmployeeSubmitting,
  ] =
    useState(false);

  const [
    employeeForm,
    setEmployeeForm,
  ] =
    useState<EmployeeForm>(
      INITIAL_EMPLOYEE_FORM
    );

  // ==========================================================
  // RECURRING
  // ==========================================================

  const [
    recurringSubmitting,
    setRecurringSubmitting,
  ] =
    useState(false);

  const [
    recurringForm,
    setRecurringForm,
  ] =
    useState<RecurringInvoiceForm>(
      INITIAL_RECURRING_FORM
    );

  // ==========================================================
  // VAT
  // ==========================================================

  const [
    vatSubmitting,
    setVatSubmitting,
  ] =
    useState(false);

  const [
    vatForm,
    setVatForm,
  ] =
    useState<VatForm>(
      INITIAL_VAT_FORM
    );

  // ==========================================================
  // TAX
  // ==========================================================

  const [
    taxSubmitting,
    setTaxSubmitting,
  ] =
    useState(false);

  const [
    taxForm,
    setTaxForm,
  ] =
    useState<TaxForm>(
      INITIAL_TAX_FORM
    );

  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {
    orgId: contextOrgId,
    teamId: contextTeamId,
    userId: contextUserId,
    loading: contextLoading,
    error: contextError,
  } =
    useFinanceContext();

  const finance =
    useFinanceData();

  const organisationId =
    contextOrgId ??
    finance.orgId;

  const teamId =
    contextTeamId ??
    finance.teamId;

  const userId =
    contextUserId ??
    finance.userId;

  // ==========================================================
  // NOTIFICATION
  // ==========================================================

  const notify = (
    message: string,
    type:
      | "success"
      | "error" =
      "success"
  ) => {
    setNotification({
      visible: true,
      message,
      type,
    });

    window.setTimeout(
      () => {
        setNotification(
          (previous) => ({
            ...previous,
            visible: false,
          })
        );
      },
      3000
    );
  };

  // ==========================================================
  // LOAD PROJECTS
  // ==========================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      setProjects([]);
      return;
    }

    let active = true;

    async function loadProjects() {
      setProjectsLoading(
        true
      );

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "projects"
            )
            .select(
              "id, name, customer_id, status"
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .is(
              "deleted_at",
              null
            )
            .order(
              "name",
              {
                ascending:
                  true,
              }
            );

        if (error) {
          console.error(
            "Finance projects load error:",
            error
          );

          return;
        }

        if (!active) {
          return;
        }

        setProjects(
          (
            data || []
          ).map(
            (
              project: any
            ) => ({
              id:
                project.id,

              name:
                project.name ||
                "Untitled Project",

              customer_id:
                project.customer_id ||
                null,

              status:
                project.status ||
                null,
            })
          )
        );
      } catch (
        error
      ) {
        console.error(
          "Unexpected project load error:",
          error
        );
      } finally {
        if (active) {
          setProjectsLoading(
            false
          );
        }
      }
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, [
    organisationId,
    supabase,
  ]);

  // ==========================================================
  // LOAD CONTACTS
  // ==========================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      setContacts([]);
      return;
    }

    let active = true;

    async function loadContacts() {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "contacts"
            )
            .select(
              "id, name, email, customer_id"
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "name",
              {
                ascending:
                  true,
              }
            );

        if (error) {
          console.error(
            "Finance contacts load error:",
            error
          );

          return;
        }

        if (!active) {
          return;
        }

        setContacts(
          (
            data || []
          ).map(
            (
              contact: any
            ) => ({
              id:
                contact.id,

              name:
                contact.name ||
                contact.email ||
                "Unnamed contact",

              email:
                contact.email ||
                null,

              customer_id:
                contact.customer_id ||
                null,
            })
          )
        );
      } catch (
        error
      ) {
        console.error(
          "Unexpected contacts load error:",
          error
        );
      }
    }

    void loadContacts();

    return () => {
      active = false;
    };
  }, [
    organisationId,
    supabase,
  ]);

  // ==========================================================
  // LOAD STAFF
  // ==========================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      setStaffMembers(
        []
      );

      return;
    }

    let active = true;

    async function loadStaff() {
      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, full_name, email"
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "full_name",
              {
                ascending:
                  true,
              }
            );

        if (error) {
          console.error(
            "Finance staff load error:",
            error
          );

          return;
        }

        if (!active) {
          return;
        }

        setStaffMembers(
          (
            data || []
          ).map(
            (
              profile: any
            ) => ({
              id:
                profile.id,

              name:
                profile.full_name ||
                profile.email ||
                "Team member",

              email:
                profile.email ||
                null,
            })
          )
        );
      } catch (
        error
      ) {
        console.error(
          "Unexpected staff load error:",
          error
        );
      }
    }

    void loadStaff();

    return () => {
      active = false;
    };
  }, [
    organisationId,
    supabase,
  ]);

  // ==========================================================
  // LEDGER GROUPS
  // ==========================================================

  const invoices =
    useMemo(
      () =>
        (
          finance.ledger ??
          []
        ).filter(
          (entry) =>
            String(
              entry.type ??
                ""
            )
              .trim()
              .toLowerCase() ===
            "invoice"
        ),
      [
        finance.ledger,
      ]
    );

  const quotes =
    useMemo(
      () =>
        (
          finance.ledger ??
          []
        ).filter(
          (entry) =>
            String(
              entry.type ??
                ""
            )
              .trim()
              .toLowerCase() ===
            "quote"
        ),
      [
        finance.ledger,
      ]
    );

  // ==========================================================
  // METRICS
  // ==========================================================

  const metrics =
    useFinanceMetrics({
      invoices,
      quotes,

      expenses:
        finance.expenses ??
        [],

      vatReturns:
        finance.vatReturns ??
        [],

      taxReturns:
        finance.selfAssessments ??
        [],

      payrollEmployees:
        finance.payrollEmployees ??
        [],

      payslips:
        finance.payslips ??
        [],

      timesheets:
        finance.timesheets ??
        [],

      subscriptions:
        finance.subscriptions ??
        [],

      bankTransactions: [],
    });

  // ==========================================================
  // INVOICE TOTALS
  // ==========================================================

  const invoiceQuoteNetTotal =
    useMemo(
      () =>
        invoiceQuoteLineItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.qty ||
                0
            ) *
              Number(
                item.price ||
                  0
              ),
          0
        ),
      [
        invoiceQuoteLineItems,
      ]
    );

  const invoiceQuoteVatRate =
    useMemo(() => {
      if (
        !invoiceQuoteForm.vatEnabled
      ) {
        return 0;
      }

      const rate =
        Number(
          invoiceQuoteForm.vatRate
        );

      if (
        !Number.isFinite(
          rate
        ) ||
        rate < 0
      ) {
        return 0;
      }

      return rate;
    }, [
      invoiceQuoteForm.vatEnabled,
      invoiceQuoteForm.vatRate,
    ]);

  const invoiceQuoteVatTotal =
    useMemo(
      () =>
        invoiceQuoteNetTotal *
        (invoiceQuoteVatRate /
          100),
      [
        invoiceQuoteNetTotal,
        invoiceQuoteVatRate,
      ]
    );

  const invoiceQuoteGrandTotal =
    useMemo(
      () =>
        invoiceQuoteNetTotal +
        invoiceQuoteVatTotal,
      [
        invoiceQuoteNetTotal,
        invoiceQuoteVatTotal,
      ]
    );

  // ==========================================================
  // DOCUMENT NUMBER
  // ==========================================================

  const generateDocumentNumber =
    (
      type: InvoiceQuoteDocType
    ) => {
      const now =
        new Date();

      const year =
        now.getFullYear();

      const month =
        String(
          now.getMonth() +
            1
        ).padStart(
          2,
          "0"
        );

      const day =
        String(
          now.getDate()
        ).padStart(
          2,
          "0"
        );

      const suffix =
        Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase();

      return `${
        type ===
        "Invoice"
          ? "INV"
          : "QUO"
      }-${year}${month}${day}-${suffix}`;
    };

  // ==========================================================
  // OPEN INVOICE / QUOTE
  // ==========================================================

  const openInvoiceQuoteModal =
    (
      type: InvoiceQuoteDocType
    ) => {
      const fresh =
        createInitialInvoiceQuoteForm();

      setInvoiceQuoteDocType(
        type
      );

      setInvoiceQuoteForm({
        ...fresh,

        invoiceNumber:
          generateDocumentNumber(
            type
          ),

        salesPerson:
          staffMembers.find(
            (member) =>
              member.id ===
              userId
          )?.name || "",
      });

      setInvoiceQuoteLineItems(
        [
          {
            id:
              Date.now(),
            desc: "",
            qty: 1,
            price: 0,
          },
        ]
      );

      setActiveModal(
        "invoiceQuote"
      );
    };

  // ==========================================================
  // RESET INVOICE / QUOTE
  // ==========================================================

  const resetInvoiceQuote =
    () => {
      setInvoiceQuoteDocType(
        "Invoice"
      );

      setInvoiceQuoteForm(
        createInitialInvoiceQuoteForm()
      );

      setInvoiceQuoteLineItems(
        [
          {
            id:
              Date.now(),
            desc: "",
            qty: 1,
            price: 0,
          },
        ]
      );
    };

  const closeInvoiceQuoteModal =
    () => {
      if (
        invoiceQuoteSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetInvoiceQuote();
    };

  // ==========================================================
  // CREATE QUOTE CUSTOMER
  // ==========================================================

  const createQuoteCustomer =
    async () => {
      if (
        !organisationId ||
        !userId
      ) {
        throw new Error(
          "Organisation context is unavailable."
        );
      }

      const name =
        invoiceQuoteForm.newClientName.trim();

      if (!name) {
        throw new Error(
          "Client name is required."
        );
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "customers"
          )
          .insert({
            name,

            organisation_id:
              organisationId,

            user_id:
              userId,

            team_id:
              teamId ||
              null,

            status:
              "active",

            stage:
              "lead",
          })
          .select(
            "id, name, email"
          )
          .single();

      if (error) {
        throw new Error(
          error.message ||
            "Unable to create client."
        );
      }

      return data;
    };

  // ==========================================================
  // CREATE INVOICE / QUOTE
  // ==========================================================

  const handleInvoiceQuoteSubmit =
    async (
      options?: {
        sendAfterCreate?: boolean;
      }
    ) => {
      if (
        invoiceQuoteSubmitting
      ) {
        return;
      }

      if (
        !organisationId
      ) {
        notify(
          "Organisation context is unavailable.",
          "error"
        );

        return;
      }

      const hasCustomer =
        Boolean(
          invoiceQuoteForm.customerId.trim()
        );

      const hasNewQuoteCustomer =
        invoiceQuoteDocType ===
          "Quote" &&
        Boolean(
          invoiceQuoteForm.newClientName.trim()
        );

      if (
        !hasCustomer &&
        !hasNewQuoteCustomer
      ) {
        notify(
          "Please select or enter a client.",
          "error"
        );

        return;
      }

      if (
        invoiceQuoteDocType ===
          "Invoice" &&
        !invoiceQuoteForm.dueDate
      ) {
        notify(
          "Please choose an invoice due date.",
          "error"
        );

        return;
      }

      if (
        invoiceQuoteLineItems.length ===
          0 ||
        invoiceQuoteLineItems.some(
          (item) =>
            !item.desc.trim() ||
            Number(
              item.qty
            ) <= 0 ||
            Number(
              item.price
            ) < 0
        )
      ) {
        notify(
          "Please complete all line items.",
          "error"
        );

        return;
      }
if (
  options?.sendAfterCreate &&
  !(invoiceQuoteForm.sendToEmail ?? "").trim() &&
  !invoiceQuoteForm.sendToContactId
) {
        notify(
          "Please choose a recipient or enter an email address.",
          "error"
        );

        return;
      }

      if (
        invoiceQuoteForm.repeatInvoice &&
        !invoiceQuoteForm.repeatStartDate
      ) {
        notify(
          "Please choose a recurring invoice start date.",
          "error"
        );

        return;
      }

      setInvoiceQuoteSubmitting(
        true
      );

      try {
        // ----------------------------------------------------
        // CUSTOMER
        // ----------------------------------------------------

        let customerId =
          invoiceQuoteForm.customerId ||
          null;

        let clientName =
          invoiceQuoteForm.customerName.trim();

        let clientEmail =
          invoiceQuoteForm.sendToEmail.trim();

        if (
          customerId
        ) {
          const customer =
            (
              finance.customers ??
              []
            ).find(
              (record) =>
                record.id ===
                customerId
            );

          clientName =
            clientName ||
            customer?.name ||
            "Client";

          clientEmail =
            clientEmail ||
            customer?.email ||
            "";
        }

        if (
          !customerId &&
          invoiceQuoteDocType ===
            "Quote"
        ) {
          const customer =
            await createQuoteCustomer();

          customerId =
            customer.id;

          clientName =
            customer.name;

          clientEmail =
            clientEmail ||
            customer.email ||
            "";
        }

        if (
          !customerId
        ) {
          throw new Error(
            "A client could not be resolved."
          );
        }

        // ----------------------------------------------------
        // CONTACT
        // ----------------------------------------------------

        const selectedContact =
          contacts.find(
            (contact) =>
              contact.id ===
              invoiceQuoteForm.sendToContactId
          );

        if (
          !clientEmail &&
          selectedContact?.email
        ) {
          clientEmail =
            selectedContact.email;
        }

        // ----------------------------------------------------
        // ITEMS
        // ----------------------------------------------------

        const items =
          invoiceQuoteLineItems.map(
            (item) => ({
              description:
                item.desc.trim(),

              qty:
                Number(
                  item.qty
                ),

              price:
                Number(
                  item.price
                ),

              total:
                Number(
                  item.qty
                ) *
                Number(
                  item.price
                ),
            })
          );

        const documentNumber =
          invoiceQuoteForm.invoiceNumber.trim() ||
          generateDocumentNumber(
            invoiceQuoteDocType
          );

        const invoiceDate =
          invoiceQuoteForm.invoiceDate ||
          new Date()
            .toISOString()
            .slice(
              0,
              10
            );

        const documentData = {
          document_number:
            documentNumber,

          order_number:
            invoiceQuoteForm.orderNumber.trim() ||
            null,

          invoice_date:
            invoiceDate,

          due_date:
            invoiceQuoteForm.dueDate ||
            null,

          client_name:
            clientName,

          customer_name:
            invoiceQuoteForm.customerName.trim() ||
            clientName,

          customer_address:
            invoiceQuoteForm.customerAddress.trim() ||
            null,

          customer_email:
            clientEmail ||
            null,

          project_id:
            invoiceQuoteForm.projectId ||
            null,

          assigned_contact_id:
            invoiceQuoteForm.assignedContactId ||
            null,

          assigned_staff_id:
            invoiceQuoteForm.assignedStaffId ||
            null,

          send_to_contact_id:
            invoiceQuoteForm.sendToContactId ||
            null,

          send_to_email:
            clientEmail ||
            null,

          sales_person:
            invoiceQuoteForm.salesPerson.trim() ||
            null,

          payment_method:
            invoiceQuoteForm.paymentMethod ||
            null,

          payment_instructions:
            invoiceQuoteForm.paymentInstructions.trim() ||
            null,

          vat_enabled:
            invoiceQuoteForm.vatEnabled,

          vat_rate:
            invoiceQuoteVatRate,

          net_total:
            invoiceQuoteNetTotal,

          vat_total:
            invoiceQuoteVatTotal,

          grand_total:
            invoiceQuoteGrandTotal,

          recurring:
            invoiceQuoteForm.repeatInvoice,

          repeat_frequency:
            invoiceQuoteForm.repeatInvoice
              ? invoiceQuoteForm.repeatFrequency
              : null,

          repeat_start_date:
            invoiceQuoteForm.repeatInvoice
              ? invoiceQuoteForm.repeatStartDate ||
                null
              : null,

          repeat_end_date:
            invoiceQuoteForm.repeatInvoice
              ? invoiceQuoteForm.repeatEndDate ||
                null
              : null,

          reminders_enabled:
            invoiceQuoteForm.remindersEnabled,

          reminder_days_before:
            invoiceQuoteForm.remindersEnabled
              ? Number(
                  invoiceQuoteForm.reminderDaysBefore ||
                    0
                )
              : null,

          reminder_days_after:
            invoiceQuoteForm.remindersEnabled
              ? Number(
                  invoiceQuoteForm.reminderDaysAfter ||
                    0
                )
              : null,

          terms:
            invoiceQuoteForm.terms.trim() ||
            null,

          notes:
            invoiceQuoteForm.notes.trim() ||
            null,

          items,
        };

        // ----------------------------------------------------
        // INVOICE
        // ----------------------------------------------------

        if (
          invoiceQuoteDocType ===
          "Invoice"
        ) {
          const {
            data:
              createdInvoice,
            error,
          } =
            await supabase
              .from(
                "invoices"
              )
              .insert({
                customer_id:
                  customerId,

                project_id:
                  invoiceQuoteForm.projectId ||
                  null,

                organisation_id:
                  organisationId,

                team_id:
                  teamId ||
                  null,

                amount:
                  invoiceQuoteGrandTotal,

                tax:
                  invoiceQuoteVatTotal,

                status:
                  options?.sendAfterCreate
                    ? "pending"
                    : "draft",

                type:
                  "invoice",

                doc_type:
                  "Invoice",

                items,

                due_date:
                  invoiceQuoteForm.dueDate,

                recurring:
                  invoiceQuoteForm.repeatInvoice,

                data:
                  documentData,
              })
              .select(
                "id"
              )
              .single();

          if (
            error ||
            !createdInvoice
          ) {
            console.error(
              "Invoice insert error:",
              error
            );

            throw new Error(
              error?.message ||
                "Unable to create invoice."
            );
          }

          // --------------------------------------------------
          // RECURRING
          // --------------------------------------------------

          if (
            invoiceQuoteForm.repeatInvoice
          ) {
            const {
              error:
                recurringError,
            } =
              await supabase
                .from(
                  "subscriptions"
                )
                .insert({
                  organisation_id:
                    organisationId,

                  client_name:
                    clientName,

                  amount:
                    invoiceQuoteGrandTotal,

                  interval:
                    invoiceQuoteForm.repeatFrequency,

                  next_run:
                    invoiceQuoteForm.repeatStartDate,

                  active:
                    true,
                });

            if (
              recurringError
            ) {
              console.error(
                "Recurring invoice create error:",
                recurringError
              );
            }
          }

          // --------------------------------------------------
          // SEND
          // --------------------------------------------------

          if (
            options?.sendAfterCreate
          ) {
            if (
              !clientEmail
            ) {
              throw new Error(
                "The invoice was created, but no recipient email is available."
              );
            }

            const response =
              await fetch(
                "/api/send-invoices",
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      invoiceId:
                        createdInvoice.id,

                      email:
                        clientEmail,

                      recipientEmail:
                        clientEmail,
                    }),
                }
              );

            const result =
              await response
                .json()
                .catch(
                  () => ({})
                );

            if (
              !response.ok
            ) {
              throw new Error(
                result.error ||
                  result.message ||
                  "Invoice was created but could not be emailed."
              );
            }
          }
        }

        // ----------------------------------------------------
        // QUOTE
        // ----------------------------------------------------

        if (
          invoiceQuoteDocType ===
          "Quote"
        ) {
          const description =
            items
              .map(
                (item) =>
                  `${item.description} × ${item.qty}`
              )
              .join(
                ", "
              );

          const {
            error,
          } =
            await supabase
              .from(
                "quotes"
              )
              .insert({
                customer_id:
                  customerId,

                project_id:
                  invoiceQuoteForm.projectId ||
                  null,

                organisation_id:
                  organisationId,

                team_id:
                  teamId ||
                  null,

                client_name:
                  clientName,

                description:
                  description ||
                  null,

                amount:
                  invoiceQuoteGrandTotal,

                date:
                  invoiceDate,

                status:
                  "draft",
              });

          if (
            error
          ) {
            throw new Error(
              error.message ||
                "Unable to create quote."
            );
          }
        }

        await finance.refresh();

        notify(
          options?.sendAfterCreate
            ? `${invoiceQuoteDocType} created and sent successfully.`
            : `${invoiceQuoteDocType} created successfully.`,
          "success"
        );

        setActiveModal(
          null
        );

        resetInvoiceQuote();
      } catch (
        submitError
      ) {
        console.error(
          "Invoice / quote submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : `Unable to create ${invoiceQuoteDocType.toLowerCase()}.`,
          "error"
        );
      } finally {
        setInvoiceQuoteSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // DUPLICATE
  // ==========================================================

  const duplicateInvoiceQuote =
    () => {
      setInvoiceQuoteForm(
        (
          previous
        ) => ({
          ...previous,

          invoiceNumber:
            generateDocumentNumber(
              invoiceQuoteDocType
            ),

          orderNumber:
            "",

          invoiceDate:
            createInitialInvoiceQuoteForm()
              .invoiceDate,

          dueDate:
            "",

          repeatStartDate:
            "",

          repeatEndDate:
            "",
        })
      );

      setInvoiceQuoteLineItems(
        (
          previous
        ) =>
          previous.map(
            (
              item,
              index
            ) => ({
              ...item,

              id:
                Date.now() +
                index,
            })
          )
      );

      notify(
        `${invoiceQuoteDocType} duplicated with a new document number.`
      );
    };

  // ==========================================================
  // PRINT / PDF
  // ==========================================================

  const buildPrintableInvoiceHtml =
    () => {
      const customer =
        (
          finance.customers ??
          []
        ).find(
          (record) =>
            record.id ===
            invoiceQuoteForm.customerId
        );

      const clientName =
        invoiceQuoteForm.customerName.trim() ||
        customer?.name ||
        invoiceQuoteForm.newClientName ||
        "Customer";

      const documentNumber =
        invoiceQuoteForm.invoiceNumber ||
        generateDocumentNumber(
          invoiceQuoteDocType
        );

      const escapeHtml =
        (
          value:
            string
        ) =>
          value
            .replace(
              /&/g,
              "&amp;"
            )
            .replace(
              /</g,
              "&lt;"
            )
            .replace(
              />/g,
              "&gt;"
            )
            .replace(
              /"/g,
              "&quot;"
            )
            .replace(
              /'/g,
              "&#039;"
            );

      const itemsHtml =
        invoiceQuoteLineItems
          .map(
            (item) => `
              <tr>
                <td>
                  ${escapeHtml(
                    item.desc
                  )}
                </td>

                <td style="text-align:right">
                  ${Number(
                    item.qty
                  )}
                </td>

                <td style="text-align:right">
                  £${Number(
                    item.price
                  ).toFixed(
                    2
                  )}
                </td>

                <td style="text-align:right">
                  £${(
                    Number(
                      item.qty
                    ) *
                    Number(
                      item.price
                    )
                  ).toFixed(
                    2
                  )}
                </td>
              </tr>
            `
          )
          .join("");

      return `
        <!doctype html>

        <html>
          <head>
            <meta charset="utf-8" />

            <title>
              ${escapeHtml(
                documentNumber
              )}
            </title>

            <style>
              body {
                font-family: Arial, sans-serif;
                color: #292524;
                padding: 48px;
              }

              h1 {
                font-family: Georgia, serif;
                font-style: italic;
                font-size: 38px;
                margin-bottom: 8px;
              }

              .muted {
                color: #78716c;
              }

              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 30px;
              }

              th,
              td {
                padding: 12px;
                border-bottom: 1px solid #e7e5e4;
                text-align: left;
              }

              th {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: .12em;
              }

              .totals {
                width: 320px;
                margin-left: auto;
                margin-top: 30px;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
              }

              .grand {
                border-top: 1px solid #292524;
                margin-top: 8px;
                padding-top: 16px;
                font-size: 22px;
                font-weight: bold;
              }

              .section {
                margin-top: 40px;
                border-top: 1px solid #e7e5e4;
                padding-top: 20px;
              }
            </style>
          </head>

          <body>
            <h1>
              ${invoiceQuoteDocType}
            </h1>

            <p>
              <strong>
                ${escapeHtml(
                  documentNumber
                )}
              </strong>
            </p>

            ${
              invoiceQuoteForm.orderNumber
                ? `
                  <p class="muted">
                    Order reference:
                    ${escapeHtml(
                      invoiceQuoteForm.orderNumber
                    )}
                  </p>
                `
                : ""
            }

            <div class="grid">
              <div>
                <strong>
                  Customer
                </strong>

                <p>
                  ${escapeHtml(
                    clientName
                  )}
                </p>

                ${
                  invoiceQuoteForm.customerAddress
                    ? `
                      <p class="muted">
                        ${escapeHtml(
                          invoiceQuoteForm.customerAddress
                        ).replace(
                          /\n/g,
                          "<br>"
                        )}
                      </p>
                    `
                    : ""
                }
              </div>

              <div>
                <p>
                  <strong>
                    Date:
                  </strong>

                  ${escapeHtml(
                    invoiceQuoteForm.invoiceDate ||
                      ""
                  )}
                </p>

                ${
                  invoiceQuoteDocType ===
                  "Invoice"
                    ? `
                      <p>
                        <strong>
                          Due:
                        </strong>

                        ${escapeHtml(
                          invoiceQuoteForm.dueDate ||
                            ""
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  invoiceQuoteForm.salesPerson
                    ? `
                      <p>
                        <strong>
                          Sales person:
                        </strong>

                        ${escapeHtml(
                          invoiceQuoteForm.salesPerson
                        )}
                      </p>
                    `
                    : ""
                }
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>
                    Description
                  </th>

                  <th style="text-align:right">
                    Qty
                  </th>

                  <th style="text-align:right">
                    Price
                  </th>

                  <th style="text-align:right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>
                  Net
                </span>

                <span>
                  £${invoiceQuoteNetTotal.toFixed(
                    2
                  )}
                </span>
              </div>

              ${
                invoiceQuoteForm.vatEnabled
                  ? `
                    <div class="total-row">
                      <span>
                        VAT (${invoiceQuoteVatRate}%)
                      </span>

                      <span>
                        £${invoiceQuoteVatTotal.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  `
                  : ""
              }

              <div class="total-row grand">
                <span>
                  Total
                </span>

                <span>
                  £${invoiceQuoteGrandTotal.toFixed(
                    2
                  )}
                </span>
              </div>
            </div>

            ${
              invoiceQuoteForm.paymentMethod
                ? `
                  <div class="section">
                    <strong>
                      Payment method
                    </strong>

                    <p>
                      ${escapeHtml(
                        invoiceQuoteForm.paymentMethod
                      )}
                    </p>

                    ${
                      invoiceQuoteForm.paymentInstructions
                        ? `
                          <p>
                            ${escapeHtml(
                              invoiceQuoteForm.paymentInstructions
                            ).replace(
                              /\n/g,
                              "<br>"
                            )}
                          </p>
                        `
                        : ""
                    }
                  </div>
                `
                : ""
            }

            ${
              invoiceQuoteForm.terms
                ? `
                  <div class="section">
                    <strong>
                      Terms
                    </strong>

                    <p>
                      ${escapeHtml(
                        invoiceQuoteForm.terms
                      ).replace(
                        /\n/g,
                        "<br>"
                      )}
                    </p>
                  </div>
                `
                : ""
            }
          </body>
        </html>
      `;
    };

  const printInvoiceQuote =
    () => {
      const printWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=900"
        );

      if (
        !printWindow
      ) {
        notify(
          "Your browser blocked the print window.",
          "error"
        );

        return;
      }

      printWindow.document.write(
        buildPrintableInvoiceHtml()
      );

      printWindow.document.close();

      printWindow.focus();

      window.setTimeout(
        () => {
          printWindow.print();
        },
        250
      );
    };

  const saveInvoiceQuotePdf =
    () => {
      printInvoiceQuote();
    };

  // ==========================================================
  // EXPENSE
  // ==========================================================

  const resetExpenseForm =
    () => {
      setExpenseForm({
        description: "",
        amount: "",
        date: "",
        status:
          "pending",

        customerId: "",
        projectId: "",
        receiptName: "",
        receiptUrl: "",
      });

      setReceiptFile(
        null
      );
    };

  const handleExpenseReceiptChange =
    (
      file:
        File | null
    ) => {
      setReceiptFile(
        file
      );

      setExpenseForm(
        (
          previous
        ) => ({
          ...previous,

          receiptName:
            file?.name ??
            "",

          receiptUrl:
            file
              ? URL.createObjectURL(
                  file
                )
              : "",
        })
      );
    };

  const closeExpenseModal =
    () => {
      if (
        expenseSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetExpenseForm();
    };

  const handleExpenseSubmit =
    async () => {
      if (
        expenseSubmitting
      ) {
        return;
      }

      if (
        !organisationId
      ) {
        notify(
          "Organisation context is unavailable.",
          "error"
        );

        return;
      }

      if (
        !expenseForm.description.trim()
      ) {
        notify(
          "Please enter an expense description.",
          "error"
        );

        return;
      }

      if (
        !expenseForm.amount ||
        Number(
          expenseForm.amount
        ) <= 0
      ) {
        notify(
          "Please enter a valid expense amount.",
          "error"
        );

        return;
      }

      if (
        !expenseForm.date
      ) {
        notify(
          "Please select an expense date.",
          "error"
        );

        return;
      }

      setExpenseSubmitting(
        true
      );

      try {
        const selectedCustomer =
          (
            finance.customers ??
            []
          ).find(
            (customer) =>
              customer.id ===
              expenseForm.customerId
          );

        let receiptUrl:
          | string
          | null =
          null;

        if (
          receiptFile
        ) {
          setUploadingReceipt(
            true
          );

          const reader =
            new FileReader();

          receiptUrl =
            await new Promise<string>(
              (
                resolve,
                reject
              ) => {
                reader.onload =
                  () =>
                    resolve(
                      String(
                        reader.result ??
                          ""
                      )
                    );

                reader.onerror =
                  () =>
                    reject(
                      new Error(
                        "Unable to read receipt file."
                      )
                    );

                reader.readAsDataURL(
                  receiptFile
                );
              }
            );
        }

        const {
          error,
        } =
          await supabase
            .from(
              "expenses"
            )
            .insert({
              organisation_id:
                organisationId,

              team_id:
                teamId ||
                null,

              customer_id:
                expenseForm.customerId ||
                null,

              project_id:
                expenseForm.projectId ||
                null,

              client_name:
                selectedCustomer?.name ||
                null,

              description:
                expenseForm.description.trim(),

              amount:
                Number(
                  expenseForm.amount
                ),

              date:
                expenseForm.date,

              status:
                expenseForm.status ||
                "pending",

              receipt_url:
                receiptUrl ||
                expenseForm.receiptUrl ||
                null,
            });

        if (
          error
        ) {
          throw new Error(
            error.message ||
              "Unable to log expense."
          );
        }

        await finance.refresh();

        notify(
          "Expense logged successfully."
        );

        setActiveModal(
          null
        );

        resetExpenseForm();
      } catch (
        submitError
      ) {
        console.error(
          "Expense submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to log expense.",
          "error"
        );
      } finally {
        setUploadingReceipt(
          false
        );

        setExpenseSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // EMPLOYEE
  // ==========================================================

  const resetEmployeeForm =
    () => {
      setEmployeeForm({
        name: "",
        role: "",
        salary_gross:
          "",
      });
    };

  const closeEmployeeModal =
    () => {
      if (
        employeeSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetEmployeeForm();
    };

  const handleEmployeeSubmit =
    async () => {
      if (
        employeeSubmitting
      ) {
        return;
      }

      if (
        !employeeForm.name.trim()
      ) {
        notify(
          "Please enter the employee name.",
          "error"
        );

        return;
      }

      if (
        !employeeForm.role.trim()
      ) {
        notify(
          "Please enter the employee role.",
          "error"
        );

        return;
      }

      if (
        !employeeForm.salary_gross ||
        Number(
          employeeForm.salary_gross
        ) <= 0
      ) {
        notify(
          "Please enter a valid salary.",
          "error"
        );

        return;
      }

      setEmployeeSubmitting(
        true
      );

      try {
        if (
          !organisationId
        ) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } =
          await supabase
            .from(
              "payroll_employees"
            )
            .insert({
              organisation_id:
                organisationId,

              name:
                employeeForm.name.trim(),

              role:
                employeeForm.role.trim(),

              salary_gross:
                Number(
                  employeeForm.salary_gross
                ),
            });

        if (
          error
        ) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Employee added successfully."
        );

        setActiveModal(
          null
        );

        resetEmployeeForm();
      } catch (
        submitError
      ) {
        console.error(
          "Employee submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to add employee.",
          "error"
        );
      } finally {
        setEmployeeSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // RECURRING
  // ==========================================================

  const resetRecurringForm =
    () => {
      setRecurringForm({
        client_name: "",
        amount: "",
        interval:
          "monthly",
        next_run: "",
      });
    };

  const closeRecurringModal =
    () => {
      if (
        recurringSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetRecurringForm();
    };

  const handleRecurringSubmit =
    async () => {
      if (
        recurringSubmitting
      ) {
        return;
      }

      if (
        !recurringForm.client_name.trim()
      ) {
        notify(
          "Please enter a client name.",
          "error"
        );

        return;
      }

      if (
        !recurringForm.amount ||
        Number(
          recurringForm.amount
        ) <= 0
      ) {
        notify(
          "Please enter a valid invoice amount.",
          "error"
        );

        return;
      }

      if (
        !recurringForm.interval
      ) {
        notify(
          "Please choose a billing frequency.",
          "error"
        );

        return;
      }

      if (
        !recurringForm.next_run
      ) {
        notify(
          "Please choose the next invoice date.",
          "error"
        );

        return;
      }

      setRecurringSubmitting(
        true
      );

      try {
        if (
          !organisationId
        ) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } =
          await supabase
            .from(
              "subscriptions"
            )
            .insert({
              organisation_id:
                organisationId,

              client_name:
                recurringForm.client_name.trim(),

              amount:
                Number(
                  recurringForm.amount
                ),

              interval:
                recurringForm.interval,

              next_run:
                recurringForm.next_run,

              active:
                true,
            });

        if (
          error
        ) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Recurring invoice scheduled successfully."
        );

        setActiveModal(
          null
        );

        resetRecurringForm();
      } catch (
        submitError
      ) {
        console.error(
          "Recurring invoice submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to schedule recurring invoice.",
          "error"
        );
      } finally {
        setRecurringSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // VAT
  // ==========================================================

  const resetVatForm =
    () => {
      setVatForm({
        amount: "",
        description:
          "",
      });
    };

  const closeVatModal =
    () => {
      if (
        vatSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetVatForm();
    };

  const handleVatSubmit =
    async () => {
      if (
        vatSubmitting
      ) {
        return;
      }

      if (
        !vatForm.description.trim()
      ) {
        notify(
          "Please enter a VAT return description.",
          "error"
        );

        return;
      }

      if (
        !vatForm.amount ||
        Number(
          vatForm.amount
        ) < 0
      ) {
        notify(
          "Please enter a valid VAT amount.",
          "error"
        );

        return;
      }

      setVatSubmitting(
        true
      );

      try {
        if (
          !organisationId
        ) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } =
          await supabase
            .from(
              "vat_returns"
            )
            .insert({
              organisation_id:
                organisationId,

              amount:
                Number(
                  vatForm.amount
                ),

              description:
                vatForm.description.trim(),

              date:
                new Date()
                  .toISOString()
                  .slice(
                    0,
                    10
                  ),

              status:
                "draft",
            });

        if (
          error
        ) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "VAT return saved successfully."
        );

        setActiveModal(
          null
        );

        resetVatForm();
      } catch (
        submitError
      ) {
        console.error(
          "VAT return submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to save VAT return.",
          "error"
        );
      } finally {
        setVatSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // TAX
  // ==========================================================

  const resetTaxForm =
    () => {
      setTaxForm({
        amount: "",
        description:
          "",
      });
    };

  const closeTaxModal =
    () => {
      if (
        taxSubmitting
      ) {
        return;
      }

      setActiveModal(
        null
      );

      resetTaxForm();
    };

  const handleTaxSubmit =
    async () => {
      if (
        taxSubmitting
      ) {
        return;
      }

      if (
        !taxForm.description.trim()
      ) {
        notify(
          "Please enter a tax record description.",
          "error"
        );

        return;
      }

      if (
        !taxForm.amount ||
        Number(
          taxForm.amount
        ) < 0
      ) {
        notify(
          "Please enter a valid tax amount.",
          "error"
        );

        return;
      }

      setTaxSubmitting(
        true
      );

      try {
        if (
          !organisationId
        ) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } =
          await supabase
            .from(
              "self_assessment"
            )
            .insert({
              organisation_id:
                organisationId,

              amount:
                Number(
                  taxForm.amount
                ),

              description:
                taxForm.description.trim(),

              date:
                new Date()
                  .toISOString()
                  .slice(
                    0,
                    10
                  ),

              status:
                "draft",
            });

        if (
          error
        ) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Tax record saved successfully."
        );

        setActiveModal(
          null
        );

        resetTaxForm();
      } catch (
        submitError
      ) {
        console.error(
          "Tax record submission failed:",
          submitError
        );

        notify(
          submitError instanceof
            Error
            ? submitError.message
            : "Unable to save tax record.",
          "error"
        );
      } finally {
        setTaxSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // PAGE STATE
  // ==========================================================

  const loading =
    contextLoading ||
    finance.loading ||
    projectsLoading;

  const error =
    contextError ||
    finance.error;

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f6] p-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      <FinanceNotification
        visible={
          notification.visible
        }
        message={
          notification.message
        }
        type={
          notification.type
        }
      />

      <main className="mx-auto max-w-[1400px] space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <FinanceHeader
          loading={
            loading
          }
          onRefresh={
            finance.refresh
          }
          onCreateInvoice={() =>
            openInvoiceQuoteModal(
              "Invoice"
            )
          }
          onCreateQuote={() =>
            openInvoiceQuoteModal(
              "Quote"
            )
          }
        />

        <FinanceNav
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
        />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#a9b897]" />
          </div>
        ) : (
          <>
            {(
              [
                "tax",
                "payroll",
                "timesheets",
              ] as FinanceTab[]
            ).includes(
              activeTab
            ) && (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-white/80 p-6 text-center shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-[#829473]">
                  Coming Soon
                </p>

                <h2 className="mt-2 font-serif text-3xl italic text-stone-900">
                  {activeTab ===
                  "tax"
                    ? "Tax & VAT"
                    : activeTab ===
                        "payroll"
                      ? "Payroll"
                      : "Timesheets"}
                </h2>

                <p className="mt-2 text-sm text-stone-500">
                  This area is in
                  active build and
                  will open with the
                  next finance
                  release.
                </p>
              </div>
            )}

            {activeTab ===
              "overview" && (
              <FinanceOverview
                metrics={
                  metrics
                }
                invoices={
                  invoices
                }
                quotes={
                  quotes
                }
                expenses={
                  finance.expenses ??
                  []
                }
                subscriptions={
                  finance.subscriptions ??
                  []
                }
                onCreateInvoice={() =>
                  openInvoiceQuoteModal(
                    "Invoice"
                  )
                }
                onLogExpense={() =>
                  setActiveModal(
                    "expense"
                  )
                }
                onAddEmployee={() =>
                  setActiveModal(
                    "employee"
                  )
                }
                onRecurring={() =>
                  setActiveModal(
                    "recurring"
                  )
                }
              />
            )}

            {activeTab ===
              "sales" && (
              <FinanceSales
                invoices={
                  invoices
                }
                quotes={
                  quotes
                }
                customers={
                  finance.customers ??
                  []
                }
                subscriptions={
                  finance.subscriptions ??
                  []
                }
                metrics={
                  metrics
                }
                refresh={
                  finance.refresh
                }
                onRecurring={() =>
                  setActiveModal(
                    "recurring"
                  )
                }
              />
            )}

            {activeTab ===
              "expenses" && (
              <FinanceExpenses
                expenses={
                  finance.expenses ??
                  []
                }
                onAddExpense={() =>
                  setActiveModal(
                    "expense"
                  )
                }
              />
            )}
          </>
        )}
      </main>

      {/* ======================================================
          INVOICE / QUOTE
      ====================================================== */}

      <InvoiceQuoteModal
        open={
          activeModal ===
          "invoiceQuote"
        }
        submitting={
          invoiceQuoteSubmitting
        }
        docType={
          invoiceQuoteDocType
        }
        customers={
          finance.customers ??
          []
        }
        projects={
          projects
        }
        contacts={
          contacts
        }
        staffMembers={
          staffMembers
        }
        formData={
          invoiceQuoteForm
        }
        lineItems={
          invoiceQuoteLineItems
        }
        netTotal={
          invoiceQuoteNetTotal
        }
        vatTotal={
          invoiceQuoteVatTotal
        }
        grandTotal={
          invoiceQuoteGrandTotal
        }
        onDocTypeChange={(
          type
        ) => {
          setInvoiceQuoteDocType(
            type
          );

          setInvoiceQuoteForm(
            (
              previous
            ) => ({
              ...previous,

              invoiceNumber:
                generateDocumentNumber(
                  type
                ),

              repeatInvoice:
                type ===
                "Invoice"
                  ? previous.repeatInvoice
                  : false,
            })
          );
        }}
        onFormChange={
          setInvoiceQuoteForm
        }
        onLineItemsChange={
          setInvoiceQuoteLineItems
        }
        onDuplicate={
          duplicateInvoiceQuote
        }
        onPrint={
          printInvoiceQuote
        }
        onSavePdf={
          saveInvoiceQuotePdf
        }
        onSend={() =>
          void handleInvoiceQuoteSubmit(
            {
              sendAfterCreate:
                true,
            }
          )
        }
        onClose={
          closeInvoiceQuoteModal
        }
        onSubmit={() =>
          void handleInvoiceQuoteSubmit()
        }
      />

      {/* ======================================================
          EXPENSE
      ====================================================== */}

      <ExpenseModal
        open={
          activeModal ===
          "expense"
        }
        submitting={
          expenseSubmitting
        }
        uploadingReceipt={
          uploadingReceipt
        }
        expense={
          expenseForm
        }
        customers={
          finance.customers ??
          []
        }
        projects={
          projects
        }
        onChange={
          setExpenseForm
        }
        onReceiptChange={
          handleExpenseReceiptChange
        }
        onClose={
          closeExpenseModal
        }
        onSubmit={
          handleExpenseSubmit
        }
      />

      {/* ======================================================
          EMPLOYEE
      ====================================================== */}

      <EmployeeModal
        open={
          activeModal ===
          "employee"
        }
        submitting={
          employeeSubmitting
        }
        employee={
          employeeForm
        }
        onChange={
          setEmployeeForm
        }
        onClose={
          closeEmployeeModal
        }
        onSubmit={
          handleEmployeeSubmit
        }
      />

      {/* ======================================================
          RECURRING
      ====================================================== */}

      <RecurringInvoiceModal
        open={
          activeModal ===
          "recurring"
        }
        submitting={
          recurringSubmitting
        }
        form={
          recurringForm
        }
        onChange={
          setRecurringForm
        }
        onClose={
          closeRecurringModal
        }
        onSubmit={
          handleRecurringSubmit
        }
      />

      {/* ======================================================
          VAT
      ====================================================== */}

      <VatModal
        open={
          activeModal ===
          "vat"
        }
        submitting={
          vatSubmitting
        }
        amount={
          vatForm.amount
        }
        description={
          vatForm.description
        }
        estimatedAmount={
          metrics.vatOwed ??
          0
        }
        onAmountChange={(
          value
        ) =>
          setVatForm(
            (
              previous
            ) => ({
              ...previous,
              amount:
                value,
            })
          )
        }
        onDescriptionChange={(
          value
        ) =>
          setVatForm(
            (
              previous
            ) => ({
              ...previous,
              description:
                value,
            })
          )
        }
        onClose={
          closeVatModal
        }
        onSubmit={
          handleVatSubmit
        }
      />

      {/* ======================================================
          TAX
      ====================================================== */}

      <TaxModal
        open={
          activeModal ===
          "tax"
        }
        submitting={
          taxSubmitting
        }
        amount={
          taxForm.amount
        }
        description={
          taxForm.description
        }
        estimatedAmount={
          metrics.taxExposure ??
          0
        }
        onAmountChange={(
          value
        ) =>
          setTaxForm(
            (
              previous
            ) => ({
              ...previous,
              amount:
                value,
            })
          )
        }
        onDescriptionChange={(
          value
        ) =>
          setTaxForm(
            (
              previous
            ) => ({
              ...previous,
              description:
                value,
            })
          )
        }
        onClose={
          closeTaxModal
        }
        onSubmit={
          handleTaxSubmit
        }
      />
    </div>
  );
}