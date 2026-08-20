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
  type FinanceLineItem,
  type FinanceProject,
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

const INITIAL_INVOICE_QUOTE_FORM: InvoiceQuoteFormData = {
  customerId: "",
  projectId: "",
  newClientName: "",
  dueDate: "",
};

const INITIAL_LINE_ITEMS: FinanceLineItem[] = [
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

const INITIAL_EMPLOYEE_FORM: EmployeeForm = {
  name: "",
  role: "",
  salary_gross: "",
};

const INITIAL_RECURRING_FORM: RecurringInvoiceForm = {
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
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ==========================================================
  // MAIN STATE
  // ==========================================================

  const [activeTab, setActiveTab] =
    useState<FinanceTab>("overview");

  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const [projects, setProjects] =
    useState<FinanceProject[]>([]);

  const [projectsLoading, setProjectsLoading] =
    useState(false);

  const [notification, setNotification] =
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
  ] = useState(false);

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
      INITIAL_INVOICE_QUOTE_FORM
    );

  const [
    invoiceQuoteLineItems,
    setInvoiceQuoteLineItems,
  ] = useState<FinanceLineItem[]>(
    INITIAL_LINE_ITEMS
  );

  // ==========================================================
  // EXPENSE
  // ==========================================================

  const [
    expenseSubmitting,
    setExpenseSubmitting,
  ] = useState(false);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
  ] = useState(false);

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
  ] = useState(false);

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
  ] = useState(false);

  const [vatForm, setVatForm] =
    useState<VatForm>(
      INITIAL_VAT_FORM
    );

  // ==========================================================
  // TAX
  // ==========================================================

  const [
    taxSubmitting,
    setTaxSubmitting,
  ] = useState(false);

  const [taxForm, setTaxForm] =
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
  } = useFinanceContext();

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
  // LOAD PROJECTS
  // ==========================================================

  useEffect(() => {
    if (!organisationId) {
      setProjects([]);
      return;
    }

    let active = true;

    async function loadProjects() {
      setProjectsLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("projects")
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
              ascending: true,
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
          (data || []).map(
            (project: any) => ({
              id: project.id,

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
      } catch (error) {
        console.error(
          "Unexpected project load error:",
          error
        );
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    }

    loadProjects();

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

  const invoices = useMemo(
    () =>
      (
        finance.ledger ?? []
      ).filter(
        (entry) =>
          String(
            entry.type ?? ""
          )
            .trim()
            .toLowerCase() ===
          "invoice"
      ),
    [finance.ledger]
  );

  const quotes = useMemo(
    () =>
      (
        finance.ledger ?? []
      ).filter(
        (entry) =>
          String(
            entry.type ?? ""
          )
            .trim()
            .toLowerCase() ===
          "quote"
      ),
    [finance.ledger]
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

  const invoiceQuoteVatTotal =
    invoiceQuoteNetTotal *
    0.2;

  const invoiceQuoteGrandTotal =
    invoiceQuoteNetTotal +
    invoiceQuoteVatTotal;

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const notify = (
    message: string,
    type:
      | "success"
      | "error" = "success"
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
  // INVOICE / QUOTE RESET
  // ==========================================================

  const resetInvoiceQuote =
    () => {
      setInvoiceQuoteDocType(
        "Invoice"
      );

      setInvoiceQuoteForm({
        customerId: "",
        projectId: "",
        newClientName: "",
        dueDate: "",
      });

      setInvoiceQuoteLineItems(
        [
          {
            id: Date.now(),
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

      setActiveModal(null);

      resetInvoiceQuote();
    };

  // ==========================================================
  // CREATE CUSTOMER FOR NEW QUOTE
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
      } = await supabase
        .from("customers")
        .insert({
          name,

          organisation_id:
            organisationId,

          user_id:
            userId,

          team_id:
            teamId || null,

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
        console.error(
          "New quote customer create error:",
          error
        );

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
    async () => {
      if (
        invoiceQuoteSubmitting
      ) {
        return;
      }

      if (!organisationId) {
        notify(
          "Organisation context is unavailable.",
          "error"
        );

        return;
      }

      const hasCustomer =
        invoiceQuoteForm.customerId
          .trim()
          .length > 0;

      const hasNewQuoteCustomer =
        invoiceQuoteDocType ===
          "Quote" &&
        invoiceQuoteForm.newClientName
          .trim()
          .length > 0;

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
            item.qty <= 0 ||
            item.price < 0
        )
      ) {
        notify(
          "Please complete all line items.",
          "error"
        );

        return;
      }

      setInvoiceQuoteSubmitting(
        true
      );

      try {
        // ------------------------------------------------------
        // RESOLVE CUSTOMER
        // ------------------------------------------------------

        let customerId =
          invoiceQuoteForm.customerId ||
          null;

        let clientName =
          "";

        if (customerId) {
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
            customer?.name ||
            "Client";
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
        }

        if (!customerId) {
          throw new Error(
            "A client could not be resolved."
          );
        }

        // ------------------------------------------------------
        // NORMALISE ITEMS
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // INVOICE
        // ------------------------------------------------------

        if (
          invoiceQuoteDocType ===
          "Invoice"
        ) {
          const {
            error,
          } = await supabase
            .from("invoices")
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
                "pending",

              type:
                "invoice",

              doc_type:
                "Invoice",

              items,

              due_date:
                invoiceQuoteForm.dueDate,

              recurring:
                false,

              data: {
                client_name:
                  clientName,

                net_total:
                  invoiceQuoteNetTotal,

                vat_total:
                  invoiceQuoteVatTotal,

                grand_total:
                  invoiceQuoteGrandTotal,

                project_id:
                  invoiceQuoteForm.projectId ||
                  null,
              },
            });

          if (error) {
            console.error(
              "Invoice insert error:",
              error
            );

            throw new Error(
              error.message ||
                "Unable to create invoice."
            );
          }
        }

        // ------------------------------------------------------
        // QUOTE
        // ------------------------------------------------------

        if (
          invoiceQuoteDocType ===
          "Quote"
        ) {
          const quoteDescription =
            items
              .map(
                (item) =>
                  `${item.description} × ${item.qty}`
              )
              .join(", ");

          const {
            error,
          } = await supabase
            .from("quotes")
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
                quoteDescription ||
                null,

              amount:
                invoiceQuoteGrandTotal,

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

          if (error) {
            console.error(
              "Quote insert error:",
              error
            );

            throw new Error(
              error.message ||
                "Unable to create quote."
            );
          }
        }

        await finance.refresh();

        notify(
          `${invoiceQuoteDocType} created successfully.`,
          "success"
        );

        setActiveModal(null);

        resetInvoiceQuote();
      } catch (
        submitError
      ) {
        console.error(
          "Invoice / quote submission failed:",
          submitError
        );

        const message =
          submitError instanceof
          Error
            ? submitError.message
            : `Unable to create ${invoiceQuoteDocType.toLowerCase()}.`;

        notify(
          message,
          "error"
        );
      } finally {
        setInvoiceQuoteSubmitting(
          false
        );
      }
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
        status: "pending",

        customerId: "",
        projectId: "",
        receiptName: "",
        receiptUrl: "",
      });
      setReceiptFile(null);
    };

  const handleExpenseReceiptChange = (file: File | null) => {
    setReceiptFile(file);
    setExpenseForm((previous) => ({
      ...previous,
      receiptName: file?.name ?? "",
      receiptUrl: file ? URL.createObjectURL(file) : "",
    }));
  };

  const closeExpenseModal =
    () => {
      if (
        expenseSubmitting
      ) {
        return;
      }

      setActiveModal(null);

      resetExpenseForm();
    };

  const handleExpenseSubmit =
    async () => {
      if (
        expenseSubmitting
      ) {
        return;
      }

      if (!organisationId) {
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

        let receiptUrl: string | null = null;
        if (receiptFile) {
          setUploadingReceipt(true);

          const reader = new FileReader();
          receiptUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error("Unable to read receipt file."));
            reader.readAsDataURL(receiptFile);
          });
        }

        const {
          error,
        } = await supabase
          .from("expenses")
          .insert({
            organisation_id:
              organisationId,

            team_id:
              teamId || null,

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

        if (error) {
          console.error(
            "Expense insert error:",
            error
          );

          throw new Error(
            error.message ||
              "Unable to log expense."
          );
        }

        await finance.refresh();

        notify(
          "Expense logged successfully.",
          "success"
        );

        setActiveModal(null);

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
        setUploadingReceipt(false);
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
        salary_gross: "",
      });
    };

  const closeEmployeeModal =
    () => {
      if (
        employeeSubmitting
      ) {
        return;
      }

      setActiveModal(null);

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
        if (!organisationId) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } = await supabase
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

        if (error) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Employee added successfully.",
          "success"
        );

        setActiveModal(null);

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

      setActiveModal(null);

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
        if (!organisationId) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } = await supabase
          .from("subscriptions")
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

        if (error) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Recurring invoice scheduled successfully.",
          "success"
        );

        setActiveModal(null);

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
        description: "",
      });
    };

  const closeVatModal =
    () => {
      if (
        vatSubmitting
      ) {
        return;
      }

      setActiveModal(null);

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

      setVatSubmitting(true);

      try {
        if (!organisationId) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } = await supabase
          .from("vat_returns")
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

        if (error) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "VAT return saved successfully.",
          "success"
        );

        setActiveModal(null);

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
        description: "",
      });
    };

  const closeTaxModal =
    () => {
      if (
        taxSubmitting
      ) {
        return;
      }

      setActiveModal(null);

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

      setTaxSubmitting(true);

      try {
        if (!organisationId) {
          throw new Error(
            "Organisation context is unavailable."
          );
        }

        const {
          error,
        } = await supabase
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

        if (error) {
          throw new Error(
            error.message
          );
        }

        await finance.refresh();

        notify(
          "Tax record saved successfully.",
          "success"
        );

        setActiveModal(null);

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
          loading={loading}
          onRefresh={finance.refresh}
          onCreateInvoice={() => setActiveModal("invoiceQuote")}
          onCreateQuote={() => {
            setInvoiceQuoteDocType("Quote");
            setActiveModal("invoiceQuote");
          }}
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
            {(["tax", "payroll", "timesheets"] as FinanceTab[]).includes(activeTab) && (
              <div className="rounded-[1.5rem] border border-dashed border-stone-200 bg-white/80 p-6 text-center shadow-sm">
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-[#829473]">
                  Coming Soon
                </p>
                <h2 className="mt-2 font-serif text-3xl italic text-stone-900">
                  {activeTab === "tax" ? "Tax & VAT" : activeTab === "payroll" ? "Payroll" : "Timesheets"}
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  This area is in active build and will open with the next finance release.
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
                  setActiveModal(
                    "invoiceQuote"
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
        onDocTypeChange={
          setInvoiceQuoteDocType
        }
        onFormChange={
          setInvoiceQuoteForm
        }
        onLineItemsChange={
          setInvoiceQuoteLineItems
        }
        onClose={
          closeInvoiceQuoteModal
        }
        onSubmit={
          handleInvoiceQuoteSubmit
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
            (previous) => ({
              ...previous,
              amount: value,
            })
          )
        }
        onDescriptionChange={(
          value
        ) =>
          setVatForm(
            (previous) => ({
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
            (previous) => ({
              ...previous,
              amount: value,
            })
          )
        }
        onDescriptionChange={(
          value
        ) =>
          setTaxForm(
            (previous) => ({
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