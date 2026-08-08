"use client";

import React, { useMemo } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Landmark,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import SectionShell from "./SectionShell";
import MiniStat from "./MiniStat";
import StatusPill from "./StatusPill";

type TaxRecord = {
  id: string;
  amount: number;
  description?: string | null;
  date?: string | null;
  status?: string | null;
};

type FinanceTaxProps = {
  vatReturns?: TaxRecord[];
  selfAssessments?: TaxRecord[];

  // aliases supported from page.tsx
  taxReturns?: TaxRecord[];

  vatOwed?: number;
  taxDue?: number;

  metrics?: any;

  onFileVat?: () => void;
  onFileTax?: () => void;

  // aliases supported from page.tsx
  onVat?: () => void;
  onTax?: () => void;
  onAddVatReturn?: () => void;
  onAddTaxReturn?: () => void;
  onRecordVat?: () => void;
  onRecordTax?: () => void;

  onDeleteVat?: (id: string) => void | Promise<void>;
  onDeleteTax?: (id: string) => void | Promise<void>;

  refresh?: () => void | Promise<void>;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

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

export default function FinanceTax({
  vatReturns = [],
  selfAssessments = [],
  taxReturns = [],
  vatOwed,
  taxDue,
  metrics = {},
  onFileVat,
  onFileTax,
  onVat,
  onTax,
  onAddVatReturn,
  onAddTaxReturn,
  onRecordVat,
  onRecordTax,
  onDeleteVat,
  onDeleteTax,
}: FinanceTaxProps) {
  // ==================================================
  // SAFE DATA
  // ==================================================

  const safeVatReturns = Array.isArray(vatReturns)
    ? vatReturns
    : [];

  const safeSelfAssessments = Array.isArray(selfAssessments)
    ? selfAssessments
    : [];

  const safeTaxReturns = Array.isArray(taxReturns)
    ? taxReturns
    : [];

  const resolvedTaxReturns =
    safeSelfAssessments.length > 0
      ? safeSelfAssessments
      : safeTaxReturns;

  // ==================================================
  // RESOLVED VALUES
  // ==================================================

  const resolvedVatOwed = Number(
    vatOwed ??
      metrics?.vatOwed ??
      metrics?.vatPool ??
      0
  );

  const resolvedTaxDue = Number(
    taxDue ??
      metrics?.taxDue ??
      metrics?.taxExposure ??
      0
  );

  const handleVat =
    onFileVat ??
    onVat ??
    onAddVatReturn ??
    onRecordVat;

  const handleTax =
    onFileTax ??
    onTax ??
    onAddTaxReturn ??
    onRecordTax;

  // ==================================================
  // METRICS
  // ==================================================

  const derived = useMemo(() => {
    const completedStatuses = [
      "submitted",
      "filed",
      "paid",
      "recorded",
      "approved",
    ];

    const vatFiled = safeVatReturns
      .filter((record) =>
        completedStatuses.includes(
          String(record?.status ?? "").toLowerCase()
        )
      )
      .reduce(
        (total, record) =>
          total + Number(record?.amount ?? 0),
        0
      );

    const taxFiled = resolvedTaxReturns
      .filter((record) =>
        completedStatuses.includes(
          String(record?.status ?? "").toLowerCase()
        )
      )
      .reduce(
        (total, record) =>
          total + Number(record?.amount ?? 0),
        0
      );

    const latestVat =
      [...safeVatReturns]
        .filter((record) => Boolean(record?.date))
        .sort((a, b) => {
          const aTime = a?.date
            ? new Date(a.date).getTime()
            : 0;

          const bTime = b?.date
            ? new Date(b.date).getTime()
            : 0;

          return bTime - aTime;
        })[0] ?? null;

    const latestTax =
      [...resolvedTaxReturns]
        .filter((record) => Boolean(record?.date))
        .sort((a, b) => {
          const aTime = a?.date
            ? new Date(a.date).getTime()
            : 0;

          const bTime = b?.date
            ? new Date(b.date).getTime()
            : 0;

          return bTime - aTime;
        })[0] ?? null;

    return {
      vatFiled,
      taxFiled,
      latestVat,
      latestTax,
    };
  }, [safeVatReturns, resolvedTaxReturns]);

  const hasVatRisk = resolvedVatOwed > 0;
  const hasTaxRisk = resolvedTaxDue > 0;

  return (
    <div className="space-y-6">
      {/* ==================================================
          TOP STATS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="VAT Owed"
          value={`£${formatMoney(resolvedVatOwed)}`}
          sub="Current estimated liability"
          icon={<Landmark size={16} />}
        />

        <MiniStat
          label="VAT Filed"
          value={`£${formatMoney(derived.vatFiled)}`}
          sub="Recorded submitted returns"
          icon={<ShieldCheck size={16} />}
        />

        <MiniStat
          label="Tax Exposure"
          value={`£${formatMoney(resolvedTaxDue)}`}
          sub="Current estimated provision"
          icon={<Receipt size={16} />}
        />

        <MiniStat
          label="Tax Filed"
          value={`£${formatMoney(derived.taxFiled)}`}
          sub="Recorded filed returns"
          icon={<ClipboardCheck size={16} />}
        />
      </div>

      {/* ==================================================
          ACTION REQUIRED
      ================================================== */}

      {(hasVatRisk || hasTaxRisk) && (
        <SectionShell
          title="Action Required"
          subtitle="Tax and VAT items that may need attention."
        >
          <div className="space-y-3">
            {hasVatRisk && (
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-white p-2 text-amber-600">
                    <AlertCircle size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-stone-900">
                      VAT liability outstanding
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      Estimated VAT currently owed is £
                      {formatMoney(resolvedVatOwed)}.
                    </p>
                  </div>
                </div>

                {handleVat && (
                  <button
                    type="button"
                    onClick={handleVat}
                    className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
                  >
                    File VAT
                  </button>
                )}
              </div>
            )}

            {hasTaxRisk && (
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-white p-2 text-red-500">
                    <AlertCircle size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-stone-900">
                      Tax provision required
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      Estimated tax exposure is £
                      {formatMoney(resolvedTaxDue)}.
                    </p>
                  </div>
                </div>

                {handleTax && (
                  <button
                    type="button"
                    onClick={handleTax}
                    className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
                  >
                    File Return
                  </button>
                )}
              </div>
            )}
          </div>
        </SectionShell>
      )}

      {/* ==================================================
          VAT RETURNS
      ================================================== */}

      <SectionShell
        title="VAT Returns"
        subtitle="Track VAT liabilities, submitted returns and filing history."
        action={
          handleVat ? (
            <button
              type="button"
              onClick={handleVat}
              className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
            >
              <ShieldCheck size={14} />
              File VAT Return
            </button>
          ) : null
        }
      >
        {safeVatReturns.length === 0 ? (
          <div className="py-14 text-center">
            <Landmark
              size={28}
              className="mx-auto mb-4 text-stone-200"
            />

            <p className="text-sm font-semibold text-stone-600">
              No VAT returns recorded.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Filed VAT returns will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeVatReturns.map((record) => (
              <div
                key={record.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-[#faf9f6] p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-stone-900">
                    {record?.description || "VAT Return"}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-stone-400">
                    <CalendarDays size={11} />

                    <span className="font-mono text-[9px] uppercase tracking-widest">
                      {formatDate(record?.date)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill
                    status={record?.status || "draft"}
                  />

                  <span className="font-mono font-bold text-stone-900">
                    £{formatMoney(Number(record?.amount ?? 0))}
                  </span>

                  {onDeleteVat && (
                    <button
                      type="button"
                      onClick={() => onDeleteVat(record.id)}
                      className="rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      {/* ==================================================
          TAX RETURNS
      ================================================== */}

      <SectionShell
        title="Self Assessment & Tax"
        subtitle="Track tax provisions and filed return history."
        action={
          handleTax ? (
            <button
              type="button"
              onClick={handleTax}
              className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
            >
              <ClipboardCheck size={14} />
              File Return
            </button>
          ) : null
        }
      >
        {resolvedTaxReturns.length === 0 ? (
          <div className="py-14 text-center">
            <Receipt
              size={28}
              className="mx-auto mb-4 text-stone-200"
            />

            <p className="text-sm font-semibold text-stone-600">
              No tax returns recorded.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Filed tax returns will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedTaxReturns.map((record) => (
              <div
                key={record.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-[#faf9f6] p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-stone-900">
                    {record?.description || "Tax Return"}
                  </p>

                  <div className="mt-1 flex items-center gap-2 text-stone-400">
                    <CalendarDays size={11} />

                    <span className="font-mono text-[9px] uppercase tracking-widest">
                      {formatDate(record?.date)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill
                    status={record?.status || "draft"}
                  />

                  <span className="font-mono font-bold text-stone-900">
                    £{formatMoney(Number(record?.amount ?? 0))}
                  </span>

                  {onDeleteTax && (
                    <button
                      type="button"
                      onClick={() => onDeleteTax(record.id)}
                      className="rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-[#a9b897]"
            />

            <p className="text-[10px] leading-relaxed text-stone-500">
              The figures shown here should be treated as internal planning
              estimates unless they come directly from your accountant,
              bookkeeping records or HMRC filing data.
            </p>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}