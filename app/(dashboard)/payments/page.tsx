"use client";

import { useMemo, useState } from "react";

import FinanceHeader from "./components/FinanceHeader";
import FinanceNav from "./components/FinanceNav";
import FinanceNotification from "./components/FinanceNotification";

import FinanceOverview from "./components/FinanceOverview";
import FinanceSales from "./components/FinanceSales";
import FinanceExpenses from "./components/FinanceExpenses";
import FinanceTax from "./components/FinanceTax";
import FinancePayroll from "./components/FinancePayroll";
import FinanceTimesheets from "./components/FinanceTimesheets";

import InvoiceQuoteModal, {
  type FinanceLineItem,
  type InvoiceQuoteDocType,
  type InvoiceQuoteFormData,
} from "./components/modals/InvoiceQuoteModal";

import ExpenseModal from "./components/modals/ExpenseModal";
import EmployeeModal from "./components/modals/EmployeeModal";
import RecurringInvoiceModal from "./components/modals/RecurringInvoiceModal";
import VatModal from "./components/modals/VatModal";
import TaxModal from "./components/modals/TaxModal";

import { useFinanceContext } from "./hooks/useFinanceContext";
import { useFinanceData } from "./hooks/useFinanceData";
import { useFinanceMetrics } from "./hooks/useFinanceMetrics";

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

const INITIAL_INVOICE_QUOTE_FORM: InvoiceQuoteFormData = {
  customerId: "",
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

export default function PaymentsPage() {
  const [activeTab, setActiveTab] =
    useState<FinanceTab>("overview");

  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const [notification, setNotification] =
    useState<NotificationType>({
      visible: false,
      message: "",
      type: "success",
    });

  /*
   * Invoice / Quote modal state
   */
  const [invoiceQuoteSubmitting, setInvoiceQuoteSubmitting] =
    useState(false);

  const [invoiceQuoteDocType, setInvoiceQuoteDocType] =
    useState<InvoiceQuoteDocType>("Invoice");

  const [invoiceQuoteForm, setInvoiceQuoteForm] =
    useState<InvoiceQuoteFormData>(
      INITIAL_INVOICE_QUOTE_FORM
    );

  const [invoiceQuoteLineItems, setInvoiceQuoteLineItems] =
    useState<FinanceLineItem[]>(INITIAL_LINE_ITEMS);

  /*
   * Finance context
   */
  const {
    orgId: contextOrgId,
    teamId: contextTeamId,
    userId: contextUserId,
    loading: contextLoading,
    error: contextError,
  } = useFinanceContext();

  /*
   * Finance data
   */
  const finance = useFinanceData();

  /*
   * Prefer finance-context IDs but fall back
   * to the values returned by useFinanceData.
   */
  const organisationId =
    contextOrgId ?? finance.orgId;

  const teamId =
    contextTeamId ?? finance.teamId;

  const userId =
    contextUserId ?? finance.userId;

  /*
   * Split ledger into invoices and quotes.
   */
  const invoices = useMemo(
    () =>
      (finance.ledger ?? []).filter(
        (entry) =>
          String(entry.type ?? "")
            .trim()
            .toLowerCase() === "invoice"
      ),
    [finance.ledger]
  );

  const quotes = useMemo(
    () =>
      (finance.ledger ?? []).filter(
        (entry) =>
          String(entry.type ?? "")
            .trim()
            .toLowerCase() === "quote"
      ),
    [finance.ledger]
  );

  /*
   * Finance metrics
   */
  const metrics = useFinanceMetrics({
    invoices,
    quotes,
    expenses: finance.expenses ?? [],
    vatReturns: finance.vatReturns ?? [],
    taxReturns: finance.selfAssessments ?? [],
    payrollEmployees:
      finance.payrollEmployees ?? [],
    payslips: finance.payslips ?? [],
    timesheets: finance.timesheets ?? [],
    subscriptions:
      finance.subscriptions ?? [],
    bankTransactions: [],
  });

  /*
   * Invoice / quote totals
   */
  const invoiceQuoteNetTotal = useMemo(
    () =>
      invoiceQuoteLineItems.reduce(
        (total, item) =>
          total +
          Number(item.qty || 0) *
            Number(item.price || 0),
        0
      ),
    [invoiceQuoteLineItems]
  );

  /*
   * Current modal assumes VAT at 20%.
   */
  const invoiceQuoteVatTotal =
    invoiceQuoteNetTotal * 0.2;

  const invoiceQuoteGrandTotal =
    invoiceQuoteNetTotal +
    invoiceQuoteVatTotal;

  /*
   * Notifications
   */
  const notify = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({
      visible: true,
      message,
      type,
    });

    window.setTimeout(() => {
      setNotification((previous) => ({
        ...previous,
        visible: false,
      }));
    }, 3000);
  };

  /*
   * Reset invoice / quote form
   */
  const resetInvoiceQuote = () => {
    setInvoiceQuoteDocType("Invoice");

    setInvoiceQuoteForm({
      customerId: "",
      newClientName: "",
      dueDate: "",
    });

    setInvoiceQuoteLineItems([
      {
        id: 1,
        desc: "",
        qty: 1,
        price: 0,
      },
    ]);
  };

  /*
   * Close invoice / quote modal
   */
  const closeInvoiceQuoteModal = () => {
    if (invoiceQuoteSubmitting) {
      return;
    }

    setActiveModal(null);
    resetInvoiceQuote();
  };

  /*
   * Invoice / Quote submit
   *
   * This currently handles the modal lifecycle.
   * The actual Supabase/API insert should be added
   * here once the finance create function is known.
   */
  const handleInvoiceQuoteSubmit = async () => {
    if (invoiceQuoteSubmitting) {
      return;
    }

    const hasCustomer =
      invoiceQuoteForm.customerId.trim().length > 0;

    const hasNewQuoteCustomer =
      invoiceQuoteDocType === "Quote" &&
      invoiceQuoteForm.newClientName.trim().length > 0;

    if (!hasCustomer && !hasNewQuoteCustomer) {
      notify(
        "Please select or enter a client.",
        "error"
      );
      return;
    }

    if (
      invoiceQuoteDocType === "Invoice" &&
      !invoiceQuoteForm.dueDate
    ) {
      notify(
        "Please choose an invoice due date.",
        "error"
      );
      return;
    }

    if (
      invoiceQuoteLineItems.length === 0 ||
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

    setInvoiceQuoteSubmitting(true);

    try {
      /*
       * Add the real database/API create call here.
       *
       * The modal UI is now completely wired and typed.
       */

      notify(
        `${invoiceQuoteDocType} prepared successfully.`,
        "success"
      );

      setActiveModal(null);
      resetInvoiceQuote();

      await finance.refresh();
    } catch (submitError) {
      console.error(
        "Invoice / quote submission failed:",
        submitError
      );

      notify(
        `Unable to create ${invoiceQuoteDocType.toLowerCase()}.`,
        "error"
      );
    } finally {
      setInvoiceQuoteSubmitting(false);
    }
  };

  const loading =
    contextLoading || finance.loading;

  const error =
    contextError || finance.error;

  /*
   * Error state
   */
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

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      {/* GLOBAL NOTIFICATION */}
      <FinanceNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
      />

      <main className="mx-auto max-w-[1400px] space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <FinanceHeader
          loading={loading}
          onRefresh={finance.refresh}
        />

        {/* NAVIGATION */}
        <FinanceNav
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* CONTENT */}
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#a9b897]" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <FinanceOverview
                metrics={metrics}
                invoices={invoices}
                quotes={quotes}
                expenses={
                  finance.expenses ?? []
                }
                subscriptions={
                  finance.subscriptions ?? []
                }
                onCreateInvoice={() =>
                  setActiveModal(
                    "invoiceQuote"
                  )
                }
                onLogExpense={() =>
                  setActiveModal("expense")
                }
                onAddEmployee={() =>
                  setActiveModal("employee")
                }
                onRecurring={() =>
                  setActiveModal("recurring")
                }
                onVat={() =>
                  setActiveModal("vat")
                }
                onTax={() =>
                  setActiveModal("tax")
                }
              />
            )}

            {/* SALES */}
            {activeTab === "sales" && (
              <FinanceSales
                invoices={invoices}
                quotes={quotes}
                customers={
                  finance.customers ?? []
                }
                subscriptions={
                  finance.subscriptions ?? []
                }
                metrics={metrics}
                refresh={finance.refresh}
                onRecurring={() =>
                  setActiveModal("recurring")
                }
              />
            )}

            {/* EXPENSES */}
            {activeTab === "expenses" && (
              <FinanceExpenses
                expenses={
                  finance.expenses ?? []
                }
              />
            )}

            {/* TAX */}
            {activeTab === "tax" && (
              <FinanceTax
                vatReturns={
                  finance.vatReturns ?? []
                }
                taxReturns={
                  finance.selfAssessments ?? []
                }
                metrics={metrics}
                refresh={finance.refresh}
                onVat={() =>
                  setActiveModal("vat")
                }
                onTax={() =>
                  setActiveModal("tax")
                }
              />
            )}

            {/* PAYROLL */}
            {activeTab === "payroll" && (
              <FinancePayroll
                employees={
                  finance.payrollEmployees ?? []
                }
                payslips={
                  finance.payslips ?? []
                }
              />
            )}

            {/* TIMESHEETS */}
            {activeTab === "timesheets" && (
              <FinanceTimesheets
                timesheets={
                  finance.timesheets ?? []
                }
                organisationId={
                  organisationId
                }
                teamId={teamId}
                userId={userId}
              />
            )}
          </>
        )}
      </main>

      {/* INVOICE / QUOTE */}
      <InvoiceQuoteModal
        open={
          activeModal === "invoiceQuote"
        }
        submitting={
          invoiceQuoteSubmitting
        }
        docType={
          invoiceQuoteDocType
        }
        customers={
          finance.customers ?? []
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

      {/* LOG EXPENSE */}
      <ExpenseModal
        open={
          activeModal === "expense"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={
          finance.refresh
        }
        notify={notify}
      />

      {/* ADD EMPLOYEE */}
      <EmployeeModal
        open={
          activeModal === "employee"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={
          finance.refresh
        }
        notify={notify}
      />

      {/* RECURRING INVOICE */}
      <RecurringInvoiceModal
        open={
          activeModal === "recurring"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={
          finance.refresh
        }
        notify={notify}
      />

      {/* VAT RETURN */}
      <VatModal
        open={
          activeModal === "vat"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        estimatedAmount={
          metrics.vatOwed ?? 0
        }
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={
          finance.refresh
        }
        notify={notify}
      />

      {/* TAX RETURN */}
      <TaxModal
        open={
          activeModal === "tax"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        estimatedAmount={
          metrics.taxExposure ?? 0
        }
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={
          finance.refresh
        }
        notify={notify}
      />
    </div>
  );
}