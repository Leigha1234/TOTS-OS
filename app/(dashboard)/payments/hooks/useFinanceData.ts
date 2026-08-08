"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import type {
  Customer,
  LedgerEntry,
  SimpleRecord,
  Subscription,
  PayrollEmployee,
  Payslip,
} from "../types";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TimesheetRecord = {
  id: string;
  user_id?: string | null;
  mon?: number | null;
  tue?: number | null;
  wed?: number | null;
  thu?: number | null;
  fri?: number | null;
  sat?: number | null;
  sun?: number | null;
  hourly_rate?: number | null;
  organisation_id?: string | null;
  team_id?: string | null;
};

type FinanceContext = {
  orgId: string | null;
  teamId: string | null;
  userId: string | null;
};

type UseFinanceDataResult = FinanceContext & {
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  customers: Customer[];
  ledger: LedgerEntry[];
  expenses: SimpleRecord[];
  vatReturns: SimpleRecord[];
  selfAssessments: SimpleRecord[];
  subscriptions: Subscription[];
  payrollEmployees: PayrollEmployee[];
  payslips: Payslip[];
  timesheets: TimesheetRecord[];

  vatCollected: number;

  refresh: () => Promise<void>;
};

function normaliseAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function normaliseDate(value: unknown) {
  if (!value) return null;

  const stringValue = String(value);

  if (stringValue.includes("T")) {
    return stringValue.slice(0, 10);
  }

  return stringValue;
}

export function useFinanceData(): UseFinanceDataResult {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<SimpleRecord[]>([]);
  const [vatReturns, setVatReturns] = useState<SimpleRecord[]>([]);
  const [selfAssessments, setSelfAssessments] = useState<SimpleRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>(
    []
  );
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);

  const [vatCollected, setVatCollected] = useState(0);

  const resolveContext = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(authError.message);
    }

    if (!user) {
      throw new Error("You must be signed in to access finance.");
    }

    const [
      { data: profile, error: profileError },
      { data: membership, error: membershipError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("organisation_id")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("team_members")
        .select("team_id, organisation_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (profileError) {
      console.error("Finance profile lookup error:", profileError);
    }

    if (membershipError) {
      console.error("Finance membership lookup error:", membershipError);
    }

    const resolvedOrgId =
      profile?.organisation_id ??
      membership?.organisation_id ??
      null;

    const resolvedTeamId =
      membership?.team_id ??
      null;

    if (!resolvedOrgId) {
      throw new Error(
        "This account is not linked to an organisation."
      );
    }

    setUserId(user.id);
    setOrgId(resolvedOrgId);
    setTeamId(resolvedTeamId);

    return {
      userId: user.id,
      orgId: resolvedOrgId,
      teamId: resolvedTeamId,
    };
  }, []);

  const fetchFinanceData = useCallback(
    async (organisationId: string) => {
      const [
        quotesResult,
        invoicesResult,
        customersResult,
        expensesResult,
        vatResult,
        taxResult,
        subscriptionsResult,
        employeesResult,
        payslipsResult,
        timesheetsResult,
      ] = await Promise.all([
        supabase
          .from("quotes")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("invoices")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("customers")
          .select("id, name, email")
          .eq("organisation_id", organisationId)
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("expenses")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("date", {
            ascending: false,
          }),

        supabase
          .from("vat_returns")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("date", {
            ascending: false,
          }),

        supabase
          .from("self_assessment")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("date", {
            ascending: false,
          }),

        supabase
          .from("subscriptions")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("next_run", {
            ascending: true,
          }),

        supabase
          .from("payroll_employees")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("payslips")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("period_end", {
            ascending: false,
          })
          .limit(50),

        supabase
          .from("timesheets")
          .select("*")
          .eq("organisation_id", organisationId)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const queryErrors = [
        ["quotes", quotesResult.error],
        ["invoices", invoicesResult.error],
        ["customers", customersResult.error],
        ["expenses", expensesResult.error],
        ["vat_returns", vatResult.error],
        ["self_assessment", taxResult.error],
        ["subscriptions", subscriptionsResult.error],
        ["payroll_employees", employeesResult.error],
        ["payslips", payslipsResult.error],
        ["timesheets", timesheetsResult.error],
      ] as const;

      const failedQuery = queryErrors.find(
        ([, queryError]) => Boolean(queryError)
      );

      if (failedQuery) {
        const [table, queryError] = failedQuery;

        console.error(
          `Finance query failed for ${table}:`,
          queryError
        );

        throw new Error(
          queryError?.message ??
            `Failed to load ${table}`
        );
      }

      const customerRows: Customer[] =
        customersResult.data ?? [];

      setCustomers(customerRows);

      const customerMap = new Map(
        customerRows.map((customer) => [
          customer.id,
          customer.name,
        ])
      );

      const invoiceRows: LedgerEntry[] =
        (invoicesResult.data ?? []).map(
          (invoice: any) => ({
            id: invoice.id,
            type: "Invoice",
            client:
              customerMap.get(invoice.customer_id) ??
              invoice.client_name ??
              "Unknown Client",
            amount: normaliseAmount(invoice.amount),
            status:
              invoice.status ??
              "pending",
            date:
              normaliseDate(invoice.due_date) ??
              normaliseDate(invoice.created_at) ??
              "",
          })
        );

      const quoteRows: LedgerEntry[] =
        (quotesResult.data ?? []).map(
          (quote: any) => ({
            id: quote.id,
            type: "Quote",
            client:
              quote.client_name ??
              "Unnamed Client",
            amount: normaliseAmount(quote.amount),
            status:
              quote.status ??
              "draft",
            date:
              normaliseDate(quote.date) ??
              normaliseDate(quote.created_at) ??
              "",
          })
        );

      const combinedLedger = [
        ...invoiceRows,
        ...quoteRows,
      ].sort((a, b) => {
        const dateA = a.date
          ? new Date(a.date).getTime()
          : 0;

        const dateB = b.date
          ? new Date(b.date).getTime()
          : 0;

        return dateB - dateA;
      });

      setLedger(combinedLedger);

      const expenseRows: SimpleRecord[] =
        (expensesResult.data ?? []).map(
          (expense: any) => ({
            id: expense.id,
            amount: normaliseAmount(expense.amount),
            description:
              expense.description ??
              expense.vendor ??
              expense.client_name ??
              null,
            date:
              normaliseDate(expense.date) ??
              normaliseDate(expense.created_at),
            status:
              expense.status ??
              "pending",
          })
        );

      setExpenses(expenseRows);

      const vatRows: SimpleRecord[] =
        (vatResult.data ?? []).map(
          (record: any) => ({
            id: record.id,
            amount: normaliseAmount(record.amount),
            description:
              record.description ??
              null,
            date:
              normaliseDate(record.date) ??
              normaliseDate(record.created_at),
            status:
              record.status ??
              "draft",
          })
        );

      setVatReturns(vatRows);

      const assessmentRows: SimpleRecord[] =
        (taxResult.data ?? []).map(
          (record: any) => ({
            id: record.id,
            amount: normaliseAmount(record.amount),
            description:
              record.description ??
              null,
            date:
              normaliseDate(record.date) ??
              normaliseDate(record.created_at),
            status:
              record.status ??
              "draft",
          })
        );

      setSelfAssessments(assessmentRows);

      setSubscriptions(
        (subscriptionsResult.data ?? []).map(
          (subscription: any) => ({
            id: subscription.id,
            client_name:
              subscription.client_name ??
              null,
            amount:
              subscription.amount === null ||
              subscription.amount === undefined
                ? null
                : normaliseAmount(
                    subscription.amount
                  ),
            interval:
              subscription.interval ??
              null,
            next_run:
              normaliseDate(
                subscription.next_run
              ),
            active:
              subscription.active ??
              false,
          })
        )
      );

      setPayrollEmployees(
        (employeesResult.data ?? []).map(
          (employee: any) => ({
            id: employee.id,
            name:
              employee.name ??
              "Unnamed Employee",
            role:
              employee.role ??
              null,
            salary_gross:
              employee.salary_gross ===
                null ||
              employee.salary_gross ===
                undefined
                ? null
                : normaliseAmount(
                    employee.salary_gross
                  ),
          })
        )
      );

      setPayslips(
        (payslipsResult.data ?? []).map(
          (payslip: any) => ({
            id: payslip.id,
            employee_id:
              payslip.employee_id,
            gross:
              payslip.gross === null ||
              payslip.gross === undefined
                ? null
                : normaliseAmount(
                    payslip.gross
                  ),
            net:
              payslip.net === null ||
              payslip.net === undefined
                ? null
                : normaliseAmount(
                    payslip.net
                  ),
            tax:
              payslip.tax === null ||
              payslip.tax === undefined
                ? null
                : normaliseAmount(
                    payslip.tax
                  ),
            ni:
              payslip.ni === null ||
              payslip.ni === undefined
                ? null
                : normaliseAmount(
                    payslip.ni
                  ),
            period_start:
              normaliseDate(
                payslip.period_start
              ),
            period_end:
              normaliseDate(
                payslip.period_end
              ),
          })
        )
      );

      setTimesheets(
        (timesheetsResult.data ?? []).map(
          (row: any) => ({
            id: row.id,
            user_id:
              row.user_id ??
              null,
            mon: normaliseAmount(row.mon),
            tue: normaliseAmount(row.tue),
            wed: normaliseAmount(row.wed),
            thu: normaliseAmount(row.thu),
            fri: normaliseAmount(row.fri),
            sat: normaliseAmount(row.sat),
            sun: normaliseAmount(row.sun),
            hourly_rate:
              row.hourly_rate === null ||
              row.hourly_rate === undefined
                ? null
                : normaliseAmount(
                    row.hourly_rate
                  ),
            organisation_id:
              row.organisation_id ??
              null,
            team_id:
              row.team_id ??
              null,
          })
        )
      );

      const paidVat = (invoicesResult.data ?? [])
        .filter(
          (invoice: any) =>
            String(
              invoice.status ?? ""
            ).toLowerCase() === "paid"
        )
        .reduce(
          (total: number, invoice: any) =>
            total +
            normaliseAmount(invoice.tax),
          0
        );

      setVatCollected(paidVat);
    },
    []
  );

  const refresh = useCallback(async () => {
    if (!orgId) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      await fetchFinanceData(orgId);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to refresh finance data.";

      setError(message);

      console.error(
        "Finance refresh error:",
        err
      );
    } finally {
      setRefreshing(false);
    }
  }, [orgId, fetchFinanceData]);

  useEffect(() => {
    let active = true;

    async function initialise() {
      setLoading(true);
      setError(null);

      try {
        const context =
          await resolveContext();

        if (!active) {
          return;
        }

        await fetchFinanceData(
          context.orgId
        );
      } catch (err) {
        if (!active) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Failed to load finance data.";

        setError(message);

        console.error(
          "Finance initialisation error:",
          err
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialise();

    return () => {
      active = false;
    };
  }, [
    resolveContext,
    fetchFinanceData,
  ]);

  return {
    loading,
    refreshing,
    error,

    orgId,
    teamId,
    userId,

    customers,
    ledger,
    expenses,
    vatReturns,
    selfAssessments,
    subscriptions,
    payrollEmployees,
    payslips,
    timesheets,

    vatCollected,

    refresh,
  };
}

export default useFinanceData;