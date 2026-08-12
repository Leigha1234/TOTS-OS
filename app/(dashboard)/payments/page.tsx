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

import InvoiceQuoteModal from "./components/modals/InvoiceQuoteModal";
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

export default function PaymentsPage() {
  const [activeTab, setActiveTab] =
    useState<FinanceTab>("overview");

  const [activeModal, setActiveModal] =
    useState<ModalType>(null);

  const [notification, setNotification] =
    useState<{
      visible: boolean;
      message: string;
      type: "success" | "error";
    }>({
      visible: false,
      message: "",
      type: "success",
    });

  const {
    orgId: contextOrgId,
    teamId: contextTeamId,
    userId: contextUserId,
    loading: contextLoading,
    error: contextError,
  } = useFinanceContext();

  const finance = useFinanceData();

  const organisationId =
    contextOrgId ?? finance.orgId;

  const teamId =
    contextTeamId ?? finance.teamId;

  const userId =
    contextUserId ?? finance.userId;

  const invoices = useMemo(
    () =>
      finance.ledger.filter(
        (entry) =>
          String(entry.type ?? "")
            .trim()
            .toLowerCase() === "invoice"
      ),
    [finance.ledger]
  );

  const quotes = useMemo(
    () =>
      finance.ledger.filter(
        (entry) =>
          String(entry.type ?? "")
            .trim()
            .toLowerCase() === "quote"
      ),
    [finance.ledger]
  );

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

  const notify = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({
      visible: true,
      message,
      type,
    });

    setTimeout(() => {
      setNotification((previous) => ({
        ...previous,
        visible: false,
      }));
    }, 3000);
  };

  const loading =
    contextLoading || finance.loading;

  const error =
    contextError || finance.error;

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f6] p-8">
        <p className="text-red-500">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900">
      <FinanceNotification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
      />

      <main className="mx-auto max-w-[1400px] space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        <FinanceHeader
          loading={loading}
          onRefresh={finance.refresh}
        />

        <FinanceNav
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-[#a9b897]" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <FinanceOverview
                metrics={metrics}
                invoices={invoices}
                quotes={quotes}
                expenses={finance.expenses}
                subscriptions={
                  finance.subscriptions
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

            {activeTab === "sales" && (
              <FinanceSales
                invoices={invoices}
                quotes={quotes}
                customers={finance.customers}
                subscriptions={
                  finance.subscriptions
                }
                metrics={metrics}
                refresh={finance.refresh}
                onRecurring={() =>
                  setActiveModal("recurring")
                }
              />
            )}

           {activeTab === "expenses" && (
  <FinanceExpenses />
)}
              

            {activeTab === "tax" && (
              <FinanceTax
                vatReturns={
                  finance.vatReturns
                }
                taxReturns={
                  finance.selfAssessments
                }
                metrics={metrics}
                refresh={finance.refresh}
                notify={notify}
                onVat={() =>
                  setActiveModal("vat")
                }
                onTax={() =>
                  setActiveModal("tax")
                }
              />
            )}

            {activeTab === "payroll" && (
              <FinancePayroll
                employees={
                  finance.payrollEmployees
                }
                payslips={
                  finance.payslips
                }
                metrics={metrics}
                refresh={finance.refresh}
                notify={notify}
                onCreate={() =>
                  setActiveModal("employee")
                }
              />
            )}

            {activeTab === "timesheets" && (
              <FinanceTimesheets
                timesheets={
                  finance.timesheets
                }
                employees={
                  finance.payrollEmployees
                }
                organisationId={
                  organisationId
                }
                teamId={teamId}
                userId={userId}
                metrics={metrics}
                refresh={finance.refresh}
                notify={notify}
              />
            )}
          </>
        )}
      </main>

      <InvoiceQuoteModal
        open={
          activeModal === "invoiceQuote"
        }
        organisationId={
          organisationId
        }
        teamId={teamId}
        userId={userId}
        customers={finance.customers}
        onClose={() =>
          setActiveModal(null)
        }
        onSuccess={finance.refresh}
        notify={notify}
      />

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
        onSuccess={finance.refresh}
        notify={notify}
      />

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
        onSuccess={finance.refresh}
        notify={notify}
      />

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
        onSuccess={finance.refresh}
        notify={notify}
      />

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
        onSuccess={finance.refresh}
        notify={notify}
      />

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
        onSuccess={finance.refresh}
        notify={notify}
      />
    </div>
  );
}