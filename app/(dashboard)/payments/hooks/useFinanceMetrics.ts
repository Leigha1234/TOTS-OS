"use client";

import { useMemo } from "react";

type FinanceMetricsInput = {
  invoices?: any[];
  quotes?: any[];
  expenses?: any[];
  vatReturns?: any[];
  taxReturns?: any[];
  payrollEmployees?: any[];
  payslips?: any[];
  timesheets?: any[];
  subscriptions?: any[];
  bankTransactions?: any[];
};

function safeArray<T = any>(
  value: T[] | null | undefined
): T[] {
  return Array.isArray(value)
    ? value
    : [];
}

function safeNumber(
  value: unknown
): number {
  const num =
    Number(value);

  return Number.isFinite(num)
    ? num
    : 0;
}

function normaliseStatus(
  value: unknown
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
}

export function useFinanceMetrics(
  input: FinanceMetricsInput = {}
) {
  const invoices =
    safeArray(
      input.invoices
    );

  const quotes =
    safeArray(
      input.quotes
    );

  const expenses =
    safeArray(
      input.expenses
    );

  const vatReturns =
    safeArray(
      input.vatReturns
    );

  const taxReturns =
    safeArray(
      input.taxReturns
    );

  const payrollEmployees =
    safeArray(
      input.payrollEmployees
    );

  const payslips =
    safeArray(
      input.payslips
    );

  const timesheets =
    safeArray(
      input.timesheets
    );

  const subscriptions =
    safeArray(
      input.subscriptions
    );

  const bankTransactions =
    safeArray(
      input.bankTransactions
    );

  return useMemo(() => {
    // ==================================================
    // SALES
    // ==================================================

    const paidInvoices =
      invoices.filter(
        (invoice) =>
          normaliseStatus(
            invoice?.status
          ) === "paid"
      );

    const pendingInvoices =
      invoices.filter(
        (invoice) => {
          const status =
            normaliseStatus(
              invoice?.status
            );

          return [
            "pending",
            "sent",
            "issued",
            "unpaid",
            "draft",
          ].includes(
            status
          );
        }
      );

    const overdueInvoices =
      invoices.filter(
        (invoice) =>
          normaliseStatus(
            invoice?.status
          ) ===
          "overdue"
      );

    const paidRevenue =
      paidInvoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          safeNumber(
            invoice?.amount
          ),
        0
      );

    const outstandingRevenue =
      pendingInvoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          safeNumber(
            invoice?.amount
          ),
        0
      );

    const overdueRevenue =
      overdueInvoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          safeNumber(
            invoice?.amount
          ),
        0
      );

    const totalInvoiced =
      invoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          safeNumber(
            invoice?.amount
          ),
        0
      );

    // ==================================================
    // QUOTES
    // ==================================================

    const acceptedQuotes =
      quotes.filter(
        (quote) => {
          const status =
            normaliseStatus(
              quote?.status
            );

          return [
            "accepted",
            "converted",
          ].includes(
            status
          );
        }
      );

    const openQuotes =
      quotes.filter(
        (quote) => {
          const status =
            normaliseStatus(
              quote?.status
            );

          return [
            "draft",
            "sent",
            "pending",
          ].includes(
            status
          );
        }
      );

    const totalQuoted =
      quotes.reduce(
        (
          total,
          quote
        ) =>
          total +
          safeNumber(
            quote?.amount
          ),
        0
      );

    const acceptedQuoteValue =
      acceptedQuotes.reduce(
        (
          total,
          quote
        ) =>
          total +
          safeNumber(
            quote?.amount
          ),
        0
      );

    // ==================================================
    // EXPENSES
    // ==================================================

    const totalExpenses =
      expenses.reduce(
        (
          total,
          expense
        ) =>
          total +
          safeNumber(
            expense?.amount
          ),
        0
      );

    const approvedExpenses =
      expenses
        .filter(
          (expense) =>
            [
              "approved",
              "paid",
            ].includes(
              normaliseStatus(
                expense?.status
              )
            )
        )
        .reduce(
          (
            total,
            expense
          ) =>
            total +
            safeNumber(
              expense?.amount
            ),
          0
        );

    const pendingExpenses =
      expenses
        .filter(
          (expense) =>
            normaliseStatus(
              expense?.status
            ) ===
            "pending"
        )
        .reduce(
          (
            total,
            expense
          ) =>
            total +
            safeNumber(
              expense?.amount
            ),
          0
        );

    // ==================================================
    // PROFIT
    // ==================================================

    const grossProfit =
      paidRevenue -
      totalExpenses;

    const netPosition =
      paidRevenue -
      totalExpenses;

    // ==================================================
    // VAT
    // ==================================================

    const vatCollected =
      paidInvoices.reduce(
        (
          total,
          invoice
        ) => {
          if (
            invoice?.tax !=
            null
          ) {
            return (
              total +
              safeNumber(
                invoice.tax
              )
            );
          }

          return (
            total +
            safeNumber(
              invoice?.amount
            ) *
              0.2
          );
        },
        0
      );

    const vatFiled =
      vatReturns
        .filter(
          (record) => {
            const status =
              normaliseStatus(
                record?.status
              );

            return [
              "submitted",
              "filed",
              "paid",
              "complete",
              "completed",
            ].includes(
              status
            );
          }
        )
        .reduce(
          (
            total,
            record
          ) =>
            total +
            safeNumber(
              record?.amount
            ),
          0
        );

    const vatOwed =
      Math.max(
        0,
        vatCollected -
          vatFiled
      );

    // Backwards compatibility
    const vatPool =
      vatOwed;

    // ==================================================
    // TAX
    //
    // This is only a dashboard provision,
    // not an HMRC calculation.
    // ==================================================

    const taxableProfit =
      Math.max(
        0,
        grossProfit
      );

    const taxExposure =
      taxableProfit *
      0.19;

    const taxRecorded =
      taxReturns.reduce(
        (
          total,
          record
        ) =>
          total +
          safeNumber(
            record?.amount
          ),
        0
      );

    const remainingTaxProvision =
      Math.max(
        0,
        taxExposure -
          taxRecorded
      );

    // Backwards compatibility
    const taxDue =
      remainingTaxProvision;

    // ==================================================
    // PAYROLL
    // ==================================================

    const annualPayroll =
      payrollEmployees.reduce(
        (
          total,
          employee
        ) =>
          total +
          safeNumber(
            employee?.salary_gross
          ),
        0
      );

    const monthlyPayroll =
      annualPayroll /
      12;

    const payslipGross =
      payslips.reduce(
        (
          total,
          payslip
        ) =>
          total +
          safeNumber(
            payslip?.gross
          ),
        0
      );

    const payslipNet =
      payslips.reduce(
        (
          total,
          payslip
        ) =>
          total +
          safeNumber(
            payslip?.net
          ),
        0
      );

    const payrollTax =
      payslips.reduce(
        (
          total,
          payslip
        ) =>
          total +
          safeNumber(
            payslip?.tax
          ) +
          safeNumber(
            payslip?.ni
          ),
        0
      );

    // ==================================================
    // TIMESHEETS
    // ==================================================

    const totalHours =
      timesheets.reduce(
        (
          total,
          row
        ) => {
          const rowHours =
            safeNumber(
              row?.mon
            ) +
            safeNumber(
              row?.tue
            ) +
            safeNumber(
              row?.wed
            ) +
            safeNumber(
              row?.thu
            ) +
            safeNumber(
              row?.fri
            ) +
            safeNumber(
              row?.sat
            ) +
            safeNumber(
              row?.sun
            );

          return (
            total +
            rowHours
          );
        },
        0
      );

    const timesheetLabourCost =
      timesheets.reduce(
        (
          total,
          row
        ) => {
          const hours =
            safeNumber(
              row?.mon
            ) +
            safeNumber(
              row?.tue
            ) +
            safeNumber(
              row?.wed
            ) +
            safeNumber(
              row?.thu
            ) +
            safeNumber(
              row?.fri
            ) +
            safeNumber(
              row?.sat
            ) +
            safeNumber(
              row?.sun
            );

          const hourlyRate =
            safeNumber(
              row?.hourly_rate
            );

          return (
            total +
            hours *
              hourlyRate
          );
        },
        0
      );

    const revenuePerHour =
      totalHours >
      0
        ? paidRevenue /
          totalHours
        : 0;

    // ==================================================
    // RECURRING REVENUE
    // ==================================================

    const activeSubscriptions =
      subscriptions.filter(
        (
          subscription
        ) =>
          subscription?.active !==
          false
      );

    const monthlyRecurringRevenue =
      activeSubscriptions.reduce(
        (
          total,
          subscription
        ) => {
          const amount =
            safeNumber(
              subscription?.amount
            );

          const interval =
            String(
              subscription?.interval ??
                "monthly"
            ).toLowerCase();

          if (
            interval ===
            "weekly"
          ) {
            return (
              total +
              amount *
                52 /
                12
            );
          }

          if (
            interval ===
            "yearly" ||
            interval ===
            "annual"
          ) {
            return (
              total +
              amount /
                12
            );
          }

          if (
            interval ===
            "quarterly"
          ) {
            return (
              total +
              amount /
                3
            );
          }

          return (
            total +
            amount
          );
        },
        0
      );

    const annualRecurringRevenue =
      monthlyRecurringRevenue *
      12;

    // ==================================================
    // BANKING
    // ==================================================

    const bankIncome =
      bankTransactions
        .filter(
          (
            transaction
          ) => {
            const type =
              String(
                transaction?.type ??
                  transaction?.transaction_type ??
                  ""
              ).toLowerCase();

            return [
              "income",
              "credit",
              "in",
            ].includes(
              type
            );
          }
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            Math.abs(
              safeNumber(
                transaction?.amount
              )
            ),
          0
        );

    const bankOutgoings =
      bankTransactions
        .filter(
          (
            transaction
          ) => {
            const type =
              String(
                transaction?.type ??
                  transaction?.transaction_type ??
                  ""
              ).toLowerCase();

            return [
              "expense",
              "debit",
              "out",
            ].includes(
              type
            );
          }
        )
        .reduce(
          (
            total,
            transaction
          ) =>
            total +
            Math.abs(
              safeNumber(
                transaction?.amount
              )
            ),
          0
        );

    const bankBalance =
      bankIncome -
      bankOutgoings;

    // ==================================================
    // BURN
    // ==================================================

    const monthlyBurn =
      totalExpenses /
      12 +
      monthlyPayroll;

    // ==================================================
    // FORECAST
    // ==================================================

    const projectedRevenue =
      paidRevenue *
      1.15;

    const projectedCosts =
      totalExpenses *
      1.08 +
      annualPayroll;

    const projectedProfit =
      projectedRevenue -
      projectedCosts;

    // ==================================================
    // CONVERSION
    // ==================================================

    const quoteConversionRate =
      quotes.length >
      0
        ? (acceptedQuotes.length /
            quotes.length) *
          100
        : 0;

    const invoiceCollectionRate =
      invoices.length >
      0
        ? (paidInvoices.length /
            invoices.length) *
          100
        : 0;

    // ==================================================
    // RISK SIGNALS
    // ==================================================

    const riskSignals: string[] =
      [];

    if (
      overdueInvoices.length >
      0
    ) {
      riskSignals.push(
        `${overdueInvoices.length} overdue invoice${
          overdueInvoices.length ===
          1
            ? ""
            : "s"
        }`
      );
    }

    if (
      outstandingRevenue >
      paidRevenue &&
      outstandingRevenue >
        0
    ) {
      riskSignals.push(
        "Outstanding revenue exceeds collected revenue"
      );
    }

    if (
      totalExpenses >
      paidRevenue &&
      totalExpenses >
        0
    ) {
      riskSignals.push(
        "Expenses exceed paid revenue"
      );
    }

    if (
      vatOwed > 0
    ) {
      riskSignals.push(
        "VAT provision outstanding"
      );
    }

    if (
      monthlyPayroll >
        0 &&
      paidRevenue ===
        0
    ) {
      riskSignals.push(
        "Payroll commitments with no paid invoice revenue"
      );
    }

    if (
      payrollEmployees.length >
        0 &&
      timesheets.length ===
        0
    ) {
      riskSignals.push(
        "No workforce timesheet data available"
      );
    }

    // ==================================================
    // HEALTH SCORE
    // ==================================================

    let healthScore =
      100;

    healthScore -=
      overdueInvoices.length *
      8;

    if (
      totalExpenses >
      paidRevenue &&
      totalExpenses >
        0
    ) {
      healthScore -=
        20;
    }

    if (
      outstandingRevenue >
      paidRevenue &&
      outstandingRevenue >
        0
    ) {
      healthScore -=
        10;
    }

    if (
      vatOwed > 0
    ) {
      healthScore -=
        5;
    }

    healthScore =
      Math.max(
        0,
        Math.min(
          100,
          healthScore
        )
      );

    const healthStatus =
      healthScore >=
      80
        ? "strong"
        : healthScore >=
            55
          ? "stable"
          : healthScore >=
              30
            ? "attention"
            : "critical";

    // ==================================================
    // RETURN
    // ==================================================

    return {
      // Data counts
      invoiceCount:
        invoices.length,

      quoteCount:
        quotes.length,

      expenseCount:
        expenses.length,

      employeeCount:
        payrollEmployees.length,

      timesheetCount:
        timesheets.length,

      subscriptionCount:
        subscriptions.length,

      // Revenue
      paidRevenue,
      revenue:
        paidRevenue,
      revYtd:
        paidRevenue,
      grossIntake:
        paidRevenue,
      totalInvoiced,
      outstandingRevenue,
      overdueRevenue,

      // Sales
      totalQuoted,
      acceptedQuoteValue,
      quoteConversionRate,
      invoiceCollectionRate,
      paidInvoiceCount:
        paidInvoices.length,
      outstandingInvoiceCount:
        pendingInvoices.length,
      overdueInvoiceCount:
        overdueInvoices.length,

      // Costs
      totalExpenses,
      operatingCosts:
        totalExpenses,
      approvedExpenses,
      pendingExpenses,

      // Profit
      grossProfit,
      profit:
        grossProfit,
      netPosition,

      // VAT
      vatCollected,
      vatFiled,
      vatOwed,
      vatPool,

      // Tax
      taxableProfit,
      taxExposure,
      taxRecorded,
      remainingTaxProvision,
      taxDue,

      // Payroll
      annualPayroll,
      monthlyPayroll,
      totalPayrollMonthly:
        monthlyPayroll,
      payslipGross,
      payslipNet,
      payrollTax,

      // Time
      totalHours,
      labourCost:
        timesheetLabourCost,
      timesheetLabourCost,
      revenuePerHour,

      // Recurring
      monthlyRecurringRevenue,
      mrr:
        monthlyRecurringRevenue,
      annualRecurringRevenue,
      arr:
        annualRecurringRevenue,
      activeSubscriptionCount:
        activeSubscriptions.length,

      // Banking
      bankIncome,
      bankOutgoings,
      bankBalance,

      // Burn
      monthlyBurn,

      // Forecast
      projectedRevenue,
      projectedCosts,
      projectedProfit,

      // Health
      riskSignals,
      healthScore,
      healthStatus,
      status:
        healthStatus,
    };
  }, [
    invoices,
    quotes,
    expenses,
    vatReturns,
    taxReturns,
    payrollEmployees,
    payslips,
    timesheets,
    subscriptions,
    bankTransactions,
  ]);
}

export default useFinanceMetrics;