/**
 * TOTS-OS Finance actions
 *
 * Centralises Supabase mutations for the Finance section.
 * Keep UI state, modals, notifications and rendering inside page/components.
 */

import { supabase } from "@/lib/supabase";

import type {
  Customer,
  DocType,
  LineItem,
  LedgerEntry,
  PayrollEmployee,
  Subscription,
} from "../types";

import {
  calculateInvoiceTotals,
  getNextRecurringDate,
  toNumber,
} from "./financeHelpers";

// ==================================================
// SHARED TYPES
// ==================================================

export type FinanceContext = {
  organisationId: string;
  teamId?: string | null;
  userId?: string | null;
};

export type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CreateDocumentInput = {
  docType: DocType;
  customerId?: string;
  newClientName?: string;
  dueDate?: string;
  lineItems: LineItem[];
  customers: Customer[];
  context: FinanceContext;
};

export type CreateExpenseInput = {
  description: string;
  amount: number | string;
  date: string;
  status?: string;
  category?: string | null;
  supplier?: string | null;
  reference?: string | null;
  context: FinanceContext;
};

export type CreateRecurringInvoiceInput = {
  clientName: string;
  amount: number | string;
  interval: string;
  nextRun: string;
  context: FinanceContext;
};

export type CreateEmployeeInput = {
  name: string;
  role?: string;
  salaryGross: number | string;
  context: FinanceContext;
};

export type CreateVatReturnInput = {
  amount: number | string;
  description?: string;
  date?: string;
  status?: string;
  context: FinanceContext;
};

export type CreateTaxReturnInput = {
  amount: number | string;
  description?: string;
  date?: string;
  status?: string;
  context: FinanceContext;
};

export type CreatePayslipInput = {
  employeeId: string;
  gross: number | string;
  net: number | string;
  tax?: number | string;
  ni?: number | string;
  periodStart: string;
  periodEnd: string;
  context: FinanceContext;
};

export type CreateTimesheetInput = {
  userId: string;
  mon?: number;
  tue?: number;
  wed?: number;
  thu?: number;
  fri?: number;
  sat?: number;
  sun?: number;
  hourlyRate?: number;
  weekStart?: string | null;
  context: FinanceContext;
};

// ==================================================
// INTERNAL HELPERS
// ==================================================

function getContextFields(context: FinanceContext) {
  return {
    organisation_id: context.organisationId,
    team_id: context.teamId ?? null,
  };
}

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function actionError(error: unknown): ActionResult {
  console.error("Finance action error:", error);

  return {
    success: false,
    error:
      error instanceof Error
        ? error.message
        : String(error || "Unknown finance error"),
  };
}

// ==================================================
// CUSTOMERS
// ==================================================

export async function createCustomer({
  name,
  email,
  context,
}: {
  name: string;
  email?: string | null;
  context: FinanceContext;
}): Promise<ActionResult<Customer>> {
  try {
    const cleanedName = cleanString(name);

    if (!cleanedName) {
      throw new Error("Customer name is required");
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: cleanedName,
        email: email?.trim() || null,
        ...getContextFields(context),
      })
      .select("id, name, email")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCustomer(
  customerId: string
): Promise<ActionResult> {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// INVOICES + QUOTES
// ==================================================

export async function createFinanceDocument({
  docType,
  customerId,
  newClientName,
  dueDate,
  lineItems,
  customers,
  context,
}: CreateDocumentInput): Promise<ActionResult<any>> {
  try {
    if (!context.organisationId) {
      throw new Error("Organisation context is missing");
    }

    if (!lineItems.length) {
      throw new Error("At least one line item is required");
    }

    const invalidLine = lineItems.some(
      (item) =>
        !cleanString(item.desc) ||
        toNumber(item.qty) <= 0 ||
        toNumber(item.price) < 0
    );

    if (invalidLine) {
      throw new Error("Please complete all line items");
    }

    const totals = calculateInvoiceTotals(lineItems);

    if (docType === "Invoice") {
      if (!customerId) {
        throw new Error("Select a customer before creating an invoice");
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          customer_id: customerId,

          amount: totals.gross,
          tax: totals.vat,

          items: lineItems.map((item) => ({
            description: cleanString(item.desc),
            quantity: toNumber(item.qty),
            unit_price: toNumber(item.price),
          })),

          status: "pending",
          type: "invoice",
          doc_type: "invoice",
          due_date: dueDate || null,

          ...getContextFields(context),
        })
        .select("*")
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    }

    let resolvedClientName = cleanString(newClientName);

    if (customerId) {
      const customer = customers.find(
        (item) => item.id === customerId
      );

      if (customer?.name) {
        resolvedClientName = customer.name;
      }
    }

    if (!resolvedClientName) {
      throw new Error("Client name is required");
    }

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        client_name: resolvedClientName,

        description: lineItems
          .map((item) => cleanString(item.desc))
          .filter(Boolean)
          .join(", "),

        amount: totals.gross,
        status: "draft",

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLedgerStatus(
  entry: LedgerEntry,
  status?: string
): Promise<ActionResult> {
  try {
    const table =
      entry.type === "Invoice"
        ? "invoices"
        : "quotes";

    const nextStatus =
      status ||
      (entry.type === "Invoice"
        ? "paid"
        : "accepted");

    const payload: Record<string, unknown> = {
      status: nextStatus,
    };

    if (
      entry.type === "Invoice" &&
      nextStatus === "paid"
    ) {
      payload.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", entry.id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteLedgerEntry(
  entry: LedgerEntry
): Promise<ActionResult> {
  try {
    const table =
      entry.type === "Invoice"
        ? "invoices"
        : "quotes";

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", entry.id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function convertQuoteToInvoice({
  entry,
  customers,
  context,
}: {
  entry: LedgerEntry;
  customers: Customer[];
  context: FinanceContext;
}): Promise<ActionResult<any>> {
  try {
    if (entry.type !== "Quote") {
      throw new Error("Only quotes can be converted");
    }

    const { data: quote, error: quoteError } =
      await supabase
        .from("quotes")
        .select("*")
        .eq("id", entry.id)
        .single();

    if (quoteError) throw quoteError;

    if (!quote) {
      throw new Error("Quote could not be found");
    }

    const quoteClientName =
      cleanString(quote.client_name);

    if (!quoteClientName) {
      throw new Error(
        "The quote does not have a client name"
      );
    }

    let customerId = customers.find(
      (customer) =>
        customer.name
          .trim()
          .toLowerCase() ===
        quoteClientName.toLowerCase()
    )?.id;

    if (!customerId) {
      const customerResult =
        await createCustomer({
          name: quoteClientName,
          context,
        });

      if (
        !customerResult.success ||
        !customerResult.data
      ) {
        throw new Error(
          customerResult.error ||
            "Unable to create customer"
        );
      }

      customerId = customerResult.data.id;
    }

    const gross = toNumber(quote.amount);

    const net =
      gross > 0
        ? gross / 1.2
        : 0;

    const vat =
      gross - net;

    const { data: invoice, error: invoiceError } =
      await supabase
        .from("invoices")
        .insert({
          customer_id: customerId,
          amount: gross,
          tax: vat,

          items: [
            {
              description:
                quote.description ||
                "Converted from quote",

              quantity: 1,
              unit_price: net,
            },
          ],

          status: "pending",
          type: "invoice",
          doc_type: "invoice",

          ...getContextFields(context),
        })
        .select("*")
        .single();

    if (invoiceError) throw invoiceError;

    const { error: updateQuoteError } =
      await supabase
        .from("quotes")
        .update({
          status: "converted",
        })
        .eq("id", entry.id);

    if (updateQuoteError) {
      throw updateQuoteError;
    }

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// EXPENSES
// ==================================================

export async function createExpense({
  description,
  amount,
  date,
  status = "pending",
  category,
  supplier,
  reference,
  context,
}: CreateExpenseInput): Promise<ActionResult<any>> {
  try {
    const cleanedDescription =
      cleanString(description);

    if (!cleanedDescription) {
      throw new Error(
        "Expense description is required"
      );
    }

    if (toNumber(amount) <= 0) {
      throw new Error(
        "Expense amount must be greater than zero"
      );
    }

    const payload: Record<string, unknown> = {
      description: cleanedDescription,
      amount: toNumber(amount),
      date: date || today(),
      status,
      ...getContextFields(context),
    };

    if (category) {
      payload.category = category;
    }

    if (supplier) {
      payload.supplier = supplier;
    }

    if (reference) {
      payload.reference = reference;
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateExpenseStatus(
  expenseId: string,
  status: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("expenses")
      .update({
        status,
      })
      .eq("id", expenseId);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteExpense(
  expenseId: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// VAT RETURNS
// ==================================================

export async function createVatReturn({
  amount,
  description,
  date = today(),
  status = "submitted",
  context,
}: CreateVatReturnInput): Promise<ActionResult<any>> {
  try {
    if (toNumber(amount) < 0) {
      throw new Error(
        "VAT amount cannot be negative"
      );
    }

    const { data, error } = await supabase
      .from("vat_returns")
      .insert({
        amount: toNumber(amount),

        description:
          cleanString(description) ||
          `VAT return — ${new Date().toLocaleString(
            "en-GB",
            {
              month: "long",
              year: "numeric",
            }
          )}`,

        date,
        status,

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateVatReturnStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("vat_returns")
      .update({
        status,
      })
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// TAX / SELF ASSESSMENT
// ==================================================

export async function createTaxReturn({
  amount,
  description,
  date = today(),
  status = "filed",
  context,
}: CreateTaxReturnInput): Promise<ActionResult<any>> {
  try {
    if (toNumber(amount) < 0) {
      throw new Error(
        "Tax amount cannot be negative"
      );
    }

    const { data, error } = await supabase
      .from("self_assessment")
      .insert({
        amount: toNumber(amount),

        description:
          cleanString(description) ||
          `Tax return — FY ${new Date().getFullYear()}`,

        date,
        status,

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTaxReturnStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("self_assessment")
      .update({
        status,
      })
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// RECURRING INVOICES
// ==================================================

export async function createRecurringInvoice({
  clientName,
  amount,
  interval,
  nextRun,
  context,
}: CreateRecurringInvoiceInput): Promise<
  ActionResult<Subscription>
> {
  try {
    const cleanedClientName =
      cleanString(clientName);

    if (!cleanedClientName) {
      throw new Error("Client name is required");
    }

    if (toNumber(amount) <= 0) {
      throw new Error(
        "Recurring amount must be greater than zero"
      );
    }

    if (!nextRun) {
      throw new Error("Next run date is required");
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        client_name: cleanedClientName,
        amount: toNumber(amount),
        interval:
          cleanString(interval) || "monthly",
        next_run: nextRun,
        active: true,

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleRecurringInvoice(
  subscription: Subscription
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        active: !subscription.active,
      })
      .eq("id", subscription.id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function advanceRecurringInvoice(
  subscription: Subscription
): Promise<ActionResult> {
  try {
    if (!subscription.next_run) {
      throw new Error(
        "Subscription does not have a next run date"
      );
    }

    const nextDate =
      getNextRecurringDate(
        subscription.next_run,
        subscription.interval || "monthly"
      );

    if (!nextDate) {
      throw new Error(
        "Could not calculate the next recurring date"
      );
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        next_run: nextDate,
      })
      .eq("id", subscription.id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteRecurringInvoice(
  id: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// PAYROLL EMPLOYEES
// ==================================================

export async function createPayrollEmployee({
  name,
  role,
  salaryGross,
  context,
}: CreateEmployeeInput): Promise<
  ActionResult<PayrollEmployee>
> {
  try {
    const cleanedName = cleanString(name);

    if (!cleanedName) {
      throw new Error("Employee name is required");
    }

    if (toNumber(salaryGross) <= 0) {
      throw new Error(
        "Gross annual salary must be greater than zero"
      );
    }

    const { data, error } = await supabase
      .from("payroll_employees")
      .insert({
        name: cleanedName,
        role: cleanString(role) || null,
        salary_gross: toNumber(salaryGross),

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePayrollEmployee({
  id,
  name,
  role,
  salaryGross,
}: {
  id: string;
  name?: string;
  role?: string | null;
  salaryGross?: number | string;
}): Promise<ActionResult> {
  try {
    const update: Record<string, unknown> = {};

    if (name !== undefined) {
      update.name = cleanString(name);
    }

    if (role !== undefined) {
      update.role = cleanString(role) || null;
    }

    if (salaryGross !== undefined) {
      update.salary_gross =
        toNumber(salaryGross);
    }

    const { error } = await supabase
      .from("payroll_employees")
      .update(update)
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePayrollEmployee(
  id: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("payroll_employees")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// PAYSLIPS
// ==================================================

export async function createPayslip({
  employeeId,
  gross,
  net,
  tax = 0,
  ni = 0,
  periodStart,
  periodEnd,
  context,
}: CreatePayslipInput): Promise<ActionResult<any>> {
  try {
    if (!employeeId) {
      throw new Error("Employee is required");
    }

    if (!periodStart || !periodEnd) {
      throw new Error(
        "Payslip period is required"
      );
    }

    const { data, error } = await supabase
      .from("payslips")
      .insert({
        employee_id: employeeId,
        gross: toNumber(gross),
        net: toNumber(net),
        tax: toNumber(tax),
        ni: toNumber(ni),
        period_start: periodStart,
        period_end: periodEnd,

        ...getContextFields(context),
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePayslip(
  id: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("payslips")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

// ==================================================
// TIMESHEETS
// ==================================================

export async function createTimesheet({
  userId,
  mon = 0,
  tue = 0,
  wed = 0,
  thu = 0,
  fri = 0,
  sat = 0,
  sun = 0,
  hourlyRate = 25,
  weekStart,
  context,
}: CreateTimesheetInput): Promise<ActionResult<any>> {
  try {
    if (!userId) {
      throw new Error(
        "Timesheet user is required"
      );
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      mon,
      tue,
      wed,
      thu,
      fri,
      sat,
      sun,
      hourly_rate: hourlyRate,

      ...getContextFields(context),
    };

    if (weekStart) {
      payload.week_start = weekStart;
    }

    const { data, error } = await supabase
      .from("timesheets")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTimesheet({
  id,
  values,
}: {
  id: string;
  values: Partial<{
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
    hourly_rate: number;
    status: string;
  }>;
}): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("timesheets")
      .update(values)
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTimesheet(
  id: string
): Promise<ActionResult> {
  try {
    const { error } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    return actionError(error);
  }
}