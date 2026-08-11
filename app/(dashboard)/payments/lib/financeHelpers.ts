/**
 * TOTS-OS Finance helpers
 *
 * Pure calculation / formatting helpers shared across the finance section.
 * Keep Supabase calls and React state out of this file so the helpers can be
 * reused by pages, components, API routes and future reporting/export code.
 */

export const VAT_RATE = 0.2;
export const PERSONAL_ALLOWANCE = 12_570;
export const BASIC_TAX_RATE = 0.19;

export type FinanceLineItemLike = {
  qty?: number | null;
  quantity?: number | null;
  price?: number | null;
  unit_price?: number | null;
};

export type FinanceLedgerEntryLike = {
  id?: string;
  type?: string | null;
  client?: string | null;
  amount?: number | string | null;
  status?: string | null;
  date?: string | null;
};

export type FinanceRecordLike = {
  amount?: number | string | null;
  status?: string | null;
};

export type FinanceTimesheetLike = {
  mon?: number | string | null;
  tue?: number | string | null;
  wed?: number | string | null;
  thu?: number | string | null;
  fri?: number | string | null;
  sat?: number | string | null;
  sun?: number | string | null;
  hourly_rate?: number | string | null;
};

export type FinanceEmployeeLike = {
  salary_gross?: number | string | null;
};

export type FinancialMetrics = {
  revenue: number;
  operatingCosts: number;
  netPosition: number;
  monthlyBurn: number;
  vatCollected: number;
  vatFiled: number;
  vatOwed: number;
  taxableProfit: number;
  taxExposure: number;
};

export type FinanceForecast = {
  projectedRevenue: number;
  projectedCosts: number;
  projectedProfit: number;
  riskLevel: "low" | "medium" | "high";
};

export type WorkforceMetrics = {
  totalHours: number;
  labourCost: number;
  revenuePerHour: number;
  labourCostRatio: number;
};

export type FinanceHealth = {
  riskSignals: string[];
  healthScore: number;
  status: "strong" | "stable" | "critical";
};

export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(
      value.replace(/,/g, "").trim()
    );

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function roundMoney(value: number): number {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

export function formatCurrency(
  value: unknown,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    currency = "GBP",
    locale = "en-GB",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options ?? {};

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(toNumber(value));
}

export function formatCompactCurrency(
  value: unknown
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

export function formatDate(
  value: string | Date | null | undefined,
  fallback = "—"
): string {
  if (!value) return fallback;

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function normaliseStatus(
  status: unknown
): string {
  return String(status ?? "draft")
    .trim()
    .toLowerCase();
}

export function isPositiveStatus(
  status: unknown
): boolean {
  return [
    "paid",
    "accepted",
    "converted",
    "submitted",
    "filed",
    "approved",
    "complete",
    "completed",
  ].includes(normaliseStatus(status));
}

export function isNegativeStatus(
  status: unknown
): boolean {
  return [
    "overdue",
    "rejected",
    "failed",
    "cancelled",
    "canceled",
  ].includes(normaliseStatus(status));
}

export function getStatusClasses(
  status: unknown
): string {
  const normalised = normaliseStatus(status);

  if (isPositiveStatus(normalised)) {
    return "bg-green-50 text-green-600 border-green-100";
  }

  if (isNegativeStatus(normalised)) {
    return "bg-red-50 text-red-500 border-red-100";
  }

  if (
    ["pending", "sent", "processing"].includes(
      normalised
    )
  ) {
    return "bg-amber-50 text-amber-600 border-amber-100";
  }

  return "bg-stone-50 text-stone-400 border-stone-100";
}

export function calculateLineItemNet(
  item: FinanceLineItemLike
): number {
  const quantity = toNumber(
    item.qty ?? item.quantity ?? 0
  );

  const price = toNumber(
    item.price ?? item.unit_price ?? 0
  );

  return roundMoney(quantity * price);
}

export function calculateInvoiceTotals(
  items: FinanceLineItemLike[],
  vatRate = VAT_RATE
) {
  const net = roundMoney(
    items.reduce<number>(
      (total, item) =>
        total + calculateLineItemNet(item),
      0
    )
  );

  const vat = roundMoney(
    net * Math.max(0, vatRate)
  );

  const gross = roundMoney(net + vat);

  return {
    net,
    vat,
    gross,
  };
}

export function calculatePaidRevenue(
  ledger: FinanceLedgerEntryLike[]
): number {
  return roundMoney(
    ledger.reduce<number>((total, entry) => {
      const type = String(
        entry.type ?? ""
      ).toLowerCase();

      const status = normaliseStatus(
        entry.status
      );

      if (
        type === "invoice" &&
        status === "paid"
      ) {
        return total + toNumber(entry.amount);
      }

      return total;
    }, 0)
  );
}

export function calculateExpenseTotal(
  expenses: FinanceRecordLike[]
): number {
  return roundMoney(
    expenses.reduce<number>(
      (total, expense) =>
        total + toNumber(expense.amount),
      0
    )
  );
}

export function calculateFiledVat(
  vatReturns: FinanceRecordLike[]
): number {
  return roundMoney(
    vatReturns.reduce<number>(
      (total, vatReturn) => {
        const status = normaliseStatus(
          vatReturn.status
        );

        if (
          ["submitted", "filed", "paid"].includes(
            status
          )
        ) {
          return (
            total +
            toNumber(vatReturn.amount)
          );
        }

        return total;
      },
      0
    )
  );
}

export function estimateVatOwed({
  revenue,
  vatCollected,
  vatFiled,
  vatRate = VAT_RATE,
}: {
  revenue: number;
  vatCollected?: number;
  vatFiled?: number;
  vatRate?: number;
}): number {
  const collected =
    vatCollected !== undefined
      ? toNumber(vatCollected)
      : roundMoney(
          toNumber(revenue) *
            Math.max(0, vatRate)
        );

  return roundMoney(
    Math.max(
      0,
      collected - toNumber(vatFiled)
    )
  );
}

export function estimateTaxExposure({
  revenue,
  costs,
  personalAllowance = PERSONAL_ALLOWANCE,
  taxRate = BASIC_TAX_RATE,
}: {
  revenue: number;
  costs: number;
  personalAllowance?: number;
  taxRate?: number;
}): {
  taxableProfit: number;
  taxExposure: number;
} {
  const profitBeforeAllowance = Math.max(
    0,
    toNumber(revenue) - toNumber(costs)
  );

  const taxableProfit = roundMoney(
    Math.max(
      0,
      profitBeforeAllowance -
        Math.max(0, personalAllowance)
    )
  );

  return {
    taxableProfit,
    taxExposure: roundMoney(
      taxableProfit *
        Math.max(0, taxRate)
    ),
  };
}

export function calculateFinancialMetrics({
  revenue,
  operatingCosts,
  vatCollected = 0,
  vatFiled = 0,
}: {
  revenue: number;
  operatingCosts: number;
  vatCollected?: number;
  vatFiled?: number;
}): FinancialMetrics {
  const safeRevenue = roundMoney(
    toNumber(revenue)
  );

  const safeCosts = roundMoney(
    toNumber(operatingCosts)
  );

  const vatOwed = estimateVatOwed({
    revenue: safeRevenue,
    vatCollected:
      vatCollected > 0
        ? vatCollected
        : undefined,
    vatFiled,
  });

  const tax = estimateTaxExposure({
    revenue: safeRevenue,
    costs: safeCosts,
  });

  return {
    revenue: safeRevenue,
    operatingCosts: safeCosts,
    netPosition: roundMoney(
      safeRevenue - safeCosts
    ),
    monthlyBurn: roundMoney(
      safeCosts / 12
    ),
    vatCollected: roundMoney(
      toNumber(vatCollected)
    ),
    vatFiled: roundMoney(
      toNumber(vatFiled)
    ),
    vatOwed,
    taxableProfit: tax.taxableProfit,
    taxExposure: tax.taxExposure,
  };
}

export function getLedgerRisk(
  entry: FinanceLedgerEntryLike
): "low" | "medium" | "high" {
  const status = normaliseStatus(
    entry.status
  );

  if (
    ["overdue", "failed", "rejected"].includes(
      status
    )
  ) {
    return "high";
  }

  if (
    [
      "pending",
      "draft",
      "sent",
      "processing",
    ].includes(status)
  ) {
    return "medium";
  }

  return "low";
}

export function filterLedger<
  T extends FinanceLedgerEntryLike,
>(
  ledger: T[],
  searchQuery: string
): Array<
  T & {
    clarityRisk:
      | "low"
      | "medium"
      | "high";
  }
> {
  const query = searchQuery
    .trim()
    .toLowerCase();

  return ledger
    .filter((entry) => {
      if (!query) return true;

      return [
        entry.id,
        entry.client,
        entry.type,
        entry.status,
        entry.date,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    })
    .map((entry) => ({
      ...entry,
      clarityRisk: getLedgerRisk(entry),
    }));
}

export function calculateTimesheetHours(
  row: FinanceTimesheetLike
): number {
  const totalHours = [
    row.mon,
    row.tue,
    row.wed,
    row.thu,
    row.fri,
    row.sat,
    row.sun,
  ].reduce<number>(
    (total, value) =>
      total + toNumber(value),
    0
  );

  return roundMoney(totalHours);
}

export function calculateWorkforceMetrics({
  timesheets,
  revenue,
  defaultHourlyRate = 25,
}: {
  timesheets: FinanceTimesheetLike[];
  revenue: number;
  defaultHourlyRate?: number;
}): WorkforceMetrics {
  const totalHours = roundMoney(
    timesheets.reduce<number>(
      (total, row) =>
        total +
        calculateTimesheetHours(row),
      0
    )
  );

  const labourCost = roundMoney(
    timesheets.reduce<number>(
      (total, row) => {
        const hours =
          calculateTimesheetHours(row);

        const hourlyRate =
          row.hourly_rate !== null &&
          row.hourly_rate !== undefined &&
          row.hourly_rate !== ""
            ? toNumber(row.hourly_rate)
            : defaultHourlyRate;

        return (
          total + hours * hourlyRate
        );
      },
      0
    )
  );

  const safeRevenue =
    toNumber(revenue);

  return {
    totalHours,
    labourCost,
    revenuePerHour: roundMoney(
      safeRevenue /
        Math.max(totalHours, 1)
    ),
    labourCostRatio: roundMoney(
      labourCost /
        Math.max(safeRevenue, 1)
    ),
  };
}

export function calculateMonthlyPayroll(
  employees: FinanceEmployeeLike[]
): number {
  return roundMoney(
    employees.reduce<number>(
      (total, employee) =>
        total +
        toNumber(
          employee.salary_gross
        ) /
          12,
      0
    )
  );
}

export function calculateFinanceForecast({
  revenue,
  costs,
  revenueGrowth = 0.15,
  costGrowth = 0.08,
}: {
  revenue: number;
  costs: number;
  revenueGrowth?: number;
  costGrowth?: number;
}): FinanceForecast {
  const projectedRevenue = roundMoney(
    toNumber(revenue) *
      (1 + revenueGrowth)
  );

  const projectedCosts = roundMoney(
    toNumber(costs) *
      (1 + costGrowth)
  );

  const projectedProfit = roundMoney(
    projectedRevenue -
      projectedCosts
  );

  return {
    projectedRevenue,
    projectedCosts,
    projectedProfit,
    riskLevel:
      projectedProfit > 20_000
        ? "low"
        : projectedProfit > 0
          ? "medium"
          : "high",
  };
}

export function calculateFinanceHealth({
  metrics,
  workforce,
  hasTimesheets,
}: {
  metrics: Pick<
    FinancialMetrics,
    | "revenue"
    | "operatingCosts"
    | "vatOwed"
  >;
  workforce: WorkforceMetrics;
  hasTimesheets: boolean;
}): FinanceHealth {
  const riskSignals: string[] = [];

  if (
    workforce.labourCostRatio > 0.6 &&
    workforce.labourCost > 0
  ) {
    riskSignals.push(
      "High labour cost vs revenue"
    );
  }

  if (
    workforce.revenuePerHour < 50 &&
    workforce.totalHours > 0
  ) {
    riskSignals.push(
      "Low revenue per hour output"
    );
  }

  if (
    metrics.vatOwed >
      metrics.revenue * 0.3 &&
    metrics.vatOwed > 0
  ) {
    riskSignals.push(
      "VAT exposure is high relative to revenue"
    );
  }

  if (
    metrics.revenue <
    metrics.operatingCosts
  ) {
    riskSignals.push(
      "Negative operating margin"
    );
  }

  if (!hasTimesheets) {
    riskSignals.push(
      "No workforce data available"
    );
  }

  const bonus =
    workforce.revenuePerHour > 100
      ? 15
      : 0;

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        riskSignals.length * 18 +
        bonus
    )
  );

  return {
    riskSignals,
    healthScore,
    status:
      healthScore > 70
        ? "strong"
        : healthScore > 40
          ? "stable"
          : "critical",
  };
}

export function getFinancialActionItems({
  metrics,
  health,
  hasTimesheets,
}: {
  metrics: Pick<
    FinancialMetrics,
    | "revenue"
    | "operatingCosts"
    | "vatOwed"
    | "taxExposure"
  >;
  health: FinanceHealth;
  hasTimesheets: boolean;
}): string[] {
  const actions = new Set<string>();

  if (metrics.taxExposure > 0) {
    actions.add(
      "Prepare tax provision"
    );
  }

  if (
    metrics.vatOwed >
      metrics.revenue * 0.2 &&
    metrics.vatOwed > 0
  ) {
    actions.add(
      "Review VAT position"
    );
  }

  if (
    metrics.revenue <
    metrics.operatingCosts
  ) {
    actions.add(
      "Operating loss detected"
    );
  }

  if (!hasTimesheets) {
    actions.add(
      "No workforce data available"
    );
  }

  health.riskSignals.forEach(
    (signal) => actions.add(signal)
  );

  return Array.from(actions);
}

export function getDocumentReference(
  type: string,
  id: string | null | undefined
): string {
  const prefix =
    String(type).toLowerCase() ===
    "invoice"
      ? "INV"
      : "QT";

  const suffix = String(id ?? "")
    .slice(0, 6)
    .toUpperCase();

  return suffix
    ? `${prefix}-${suffix}`
    : prefix;
}

export function getNextRecurringDate(
  currentDate: string | Date,
  interval: string
): string {
  const date = new Date(
    currentDate
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const normalisedInterval =
    interval.trim().toLowerCase();

  if (
    normalisedInterval === "weekly"
  ) {
    date.setDate(
      date.getDate() + 7
    );
  } else if (
    normalisedInterval === "yearly" ||
    normalisedInterval === "annual"
  ) {
    date.setFullYear(
      date.getFullYear() + 1
    );
  } else {
    date.setMonth(
      date.getMonth() + 1
    );
  }

  return date
    .toISOString()
    .slice(0, 10);
}