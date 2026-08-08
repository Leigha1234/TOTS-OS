"use client";

import React, { useMemo } from "react";
import {
  UserPlus,
  Users,
  WalletCards,
  Banknote,
  CalendarDays,
  BadgePoundSterling,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import SectionShell from "./SectionShell";
import MetricCard from "./MetricCard";
import StatusPill from "./StatusPill";

type PayrollEmployee = {
  id: string;
  name: string;
  role: string | null;
  salary_gross: number | null;
};

type Payslip = {
  id: string;
  employee_id: string;
  gross: number | null;
  net: number | null;
  tax: number | null;
  ni: number | null;
  period_start: string | null;
  period_end: string | null;
  status?: string | null;
};

type FinancePayrollProps = {
  employees: PayrollEmployee[];
  payslips: Payslip[];

  onAddEmployee?: () => void;
  onRunPayroll?: () => void;
  onViewEmployee?: (employee: PayrollEmployee) => void;
  onViewPayslip?: (payslip: Payslip) => void;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function FinancePayroll({
  employees,
  payslips,
  onAddEmployee,
  onRunPayroll,
  onViewEmployee,
  onViewPayslip,
}: FinancePayrollProps) {
  const metrics = useMemo(() => {
    const annualPayroll = employees.reduce(
      (total, employee) =>
        total + Number(employee.salary_gross || 0),
      0
    );

    const monthlyPayroll = annualPayroll / 12;

    const latestPayslips = payslips.slice(0, 50);

    const grossPaid = latestPayslips.reduce(
      (total, payslip) =>
        total + Number(payslip.gross || 0),
      0
    );

    const netPaid = latestPayslips.reduce(
      (total, payslip) =>
        total + Number(payslip.net || 0),
      0
    );

    const taxPaid = latestPayslips.reduce(
      (total, payslip) =>
        total +
        Number(payslip.tax || 0) +
        Number(payslip.ni || 0),
      0
    );

    return {
      annualPayroll,
      monthlyPayroll,
      grossPaid,
      netPaid,
      taxPaid,
    };
  }, [employees, payslips]);

  const latestPayslipByEmployee = useMemo(() => {
    const map = new Map<string, Payslip>();

    const sorted = [...payslips].sort((a, b) => {
      const aDate = a.period_end
        ? new Date(a.period_end).getTime()
        : 0;

      const bDate = b.period_end
        ? new Date(b.period_end).getTime()
        : 0;

      return bDate - aDate;
    });

    sorted.forEach((payslip) => {
      if (!map.has(payslip.employee_id)) {
        map.set(payslip.employee_id, payslip);
      }
    });

    return map;
  }, [payslips]);

  const payrollSignals = useMemo(() => {
    const employeesWithoutPayslips = employees.filter(
      (employee) =>
        !latestPayslipByEmployee.has(employee.id)
    ).length;

    const averageSalary =
      employees.length > 0
        ? metrics.annualPayroll / employees.length
        : 0;

    return {
      employeesWithoutPayslips,
      averageSalary,
    };
  }, [
    employees,
    latestPayslipByEmployee,
    metrics.annualPayroll,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Employees"
          value={employees.length}
          sub="Active payroll records"
          icon={<Users />}
          isDark
        />

        <MetricCard
          label="Monthly Payroll"
          value={metrics.monthlyPayroll}
          sub="Estimated gross commitment"
          icon={<WalletCards />}
        />

        <MetricCard
          label="Annual Payroll"
          value={metrics.annualPayroll}
          sub="Gross annual salary cost"
          icon={<Banknote />}
        />

        <MetricCard
          label="PAYE + NI"
          value={metrics.taxPaid}
          sub="Recorded deductions"
          icon={<BadgePoundSterling />}
        />
      </div>

      <SectionShell
        title="Payroll Control"
        subtitle="Manage employees, salary commitments and payroll records."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {onRunPayroll && (
              <button
                onClick={onRunPayroll}
                className="bg-[#a9b897] text-stone-900 px-5 py-2.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all"
              >
                <WalletCards size={14} />
                Run Payroll
              </button>
            )}

            {onAddEmployee && (
              <button
                onClick={onAddEmployee}
                className="bg-stone-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest hover:bg-[#a9b897] hover:text-stone-900 transition-all"
              >
                <UserPlus size={14} />
                Add Employee
              </button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[#faf9f6] rounded-2xl">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Average Salary
            </p>

            <p className="text-2xl font-mono font-bold mt-3">
              £{formatMoney(payrollSignals.averageSalary)}
            </p>

            <p className="text-xs text-stone-400 mt-2">
              Average gross annual salary across payroll.
            </p>
          </div>

          <div className="p-5 bg-[#faf9f6] rounded-2xl">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Gross Recorded
            </p>

            <p className="text-2xl font-mono font-bold mt-3">
              £{formatMoney(metrics.grossPaid)}
            </p>

            <p className="text-xs text-stone-400 mt-2">
              Gross value across stored payslips.
            </p>
          </div>

          <div className="p-5 bg-stone-900 text-white rounded-2xl">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              Net Recorded
            </p>

            <p className="text-2xl font-mono font-bold mt-3 text-[#a9b897]">
              £{formatMoney(metrics.netPaid)}
            </p>

            <p className="text-xs text-stone-400 mt-2">
              Net pay across stored payslips.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Employees"
        subtitle="Your payroll workforce and salary commitments."
      >
        {employees.length === 0 ? (
          <div className="py-12 text-center">
            <Users
              size={28}
              className="mx-auto text-stone-200 mb-4"
            />

            <p className="text-sm font-semibold text-stone-600">
              No employees added yet.
            </p>

            <p className="text-xs text-stone-400 mt-1">
              Add an employee to begin managing payroll.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map((employee) => {
              const latestPayslip =
                latestPayslipByEmployee.get(employee.id);

              return (
                <button
                  type="button"
                  key={employee.id}
                  onClick={() =>
                    onViewEmployee?.(employee)
                  }
                  className={`w-full text-left flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#faf9f6] rounded-2xl transition-all ${
                    onViewEmployee
                      ? "hover:bg-stone-100 cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-stone-900 text-[#a9b897] flex items-center justify-center shrink-0">
                      <Users size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate">
                        {employee.name}
                      </p>

                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mt-1">
                        {employee.role || "No role set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 md:justify-end">
                    <div>
                      <p className="text-[8px] uppercase tracking-widest text-stone-400">
                        Annual
                      </p>

                      <p className="font-mono font-bold text-stone-900 mt-1">
                        £
                        {formatMoney(
                          Number(employee.salary_gross || 0)
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-widest text-stone-400">
                        Monthly
                      </p>

                      <p className="font-mono font-bold text-stone-900 mt-1">
                        £
                        {formatMoney(
                          Number(employee.salary_gross || 0) /
                            12
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-widest text-stone-400">
                        Latest Payroll
                      </p>

                      <div className="mt-1">
                        {latestPayslip ? (
                          <StatusPill
                            status={
                              latestPayslip.status || "issued"
                            }
                          />
                        ) : (
                          <span className="text-[9px] text-stone-400">
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionShell>

      <SectionShell
        title="Payslip History"
        subtitle="Gross pay, deductions and net pay across recorded payroll periods."
      >
        {payslips.length === 0 ? (
          <div className="py-12 text-center">
            <FileText
              size={28}
              className="mx-auto text-stone-200 mb-4"
            />

            <p className="text-sm font-semibold text-stone-600">
              No payslips recorded.
            </p>

            <p className="text-xs text-stone-400 mt-1">
              Payslip history will appear here once payroll
              has been processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="bg-[#faf9f6]">
                  {[
                    "Employee",
                    "Period",
                    "Gross",
                    "Tax",
                    "NI",
                    "Net",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-50">
                {payslips.map((payslip) => {
                  const employee = employees.find(
                    (item) =>
                      item.id === payslip.employee_id
                  );

                  return (
                    <tr
                      key={payslip.id}
                      onClick={() =>
                        onViewPayslip?.(payslip)
                      }
                      className={`transition-colors ${
                        onViewPayslip
                          ? "hover:bg-[#faf9f6] cursor-pointer"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-5">
                        <p className="font-bold text-stone-900">
                          {employee?.name ||
                            "Unknown employee"}
                        </p>

                        <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1">
                          {employee?.role ||
                            payslip.employee_id.slice(
                              0,
                              8
                            )}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <CalendarDays size={13} />

                          <span>
                            {formatDate(
                              payslip.period_start
                            )}{" "}
                            →{" "}
                            {formatDate(
                              payslip.period_end
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-5 font-mono font-bold">
                        £
                        {formatMoney(
                          Number(payslip.gross || 0)
                        )}
                      </td>

                      <td className="px-5 py-5 font-mono text-stone-500">
                        £
                        {formatMoney(
                          Number(payslip.tax || 0)
                        )}
                      </td>

                      <td className="px-5 py-5 font-mono text-stone-500">
                        £
                        {formatMoney(
                          Number(payslip.ni || 0)
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <span className="font-mono font-bold text-[#7d8f6f]">
                          £
                          {formatMoney(
                            Number(payslip.net || 0)
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <StatusPill
                          status={
                            payslip.status || "issued"
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      {payrollSignals.employeesWithoutPayslips > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertCircle
            size={17}
            className="text-amber-500 mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold text-amber-700">
              Payroll records incomplete
            </p>

            <p className="text-xs text-amber-600 mt-1">
              {payrollSignals.employeesWithoutPayslips}{" "}
              employee
              {payrollSignals.employeesWithoutPayslips === 1
                ? ""
                : "s"}{" "}
              currently have no payslip history.
            </p>
          </div>
        </div>
      )}

      {employees.length > 0 &&
        payrollSignals.employeesWithoutPayslips === 0 && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <CheckCircle2
              size={17}
              className="text-green-600 mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold text-green-700">
                Payroll records up to date
              </p>

              <p className="text-xs text-green-600 mt-1">
                Every employee currently has recorded
                payslip history.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}