"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Loader2,
  Plus,
  PoundSterling,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import SectionShell from "./SectionShell";
import MiniStat from "./MiniStat";
import StatusPill from "./StatusPill";

type TimesheetRow = {
  id: string;
  user_id?: string | null;
  employee_name?: string | null;
  name?: string | null;
  week_start?: string | null;
  week_end?: string | null;
  mon?: number | string | null;
  tue?: number | string | null;
  wed?: number | string | null;
  thu?: number | string | null;
  fri?: number | string | null;
  sat?: number | string | null;
  sun?: number | string | null;
  hourly_rate?: number | string | null;
  status?: string | null;
};

type FinanceTimesheetsProps = {
  timesheets?: TimesheetRow[];

  organisationId?: string | null;
  orgId?: string | null;
  teamId?: string | null;
  userId?: string | null;

  refresh?: () => void | Promise<void>;

  notify?: (
    message: string,
    type?: "success" | "error"
  ) => void;
};

type TimesheetForm = {
  employee_name: string;
  week_start: string;
  hourly_rate: string;

  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;

  status: string;
};

const getHours = (row: TimesheetRow) =>
  Number(row.mon || 0) +
  Number(row.tue || 0) +
  Number(row.wed || 0) +
  Number(row.thu || 0) +
  Number(row.fri || 0) +
  Number(row.sat || 0) +
  Number(row.sun || 0);

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

const getWeekEnd = (weekStart: string) => {
  if (!weekStart) {
    return null;
  }

  const date = new Date(`${weekStart}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(date.getDate() + 6);

  return date.toISOString().slice(0, 10);
};

const emptyForm = (): TimesheetForm => ({
  employee_name: "",
  week_start: new Date().toISOString().slice(0, 10),
  hourly_rate: "",

  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
  sat: "",
  sun: "",

  status: "submitted",
});

export default function FinanceTimesheets({
  timesheets = [],

  organisationId,
  orgId,
  teamId,
  userId,

  refresh,
  notify,
}: FinanceTimesheetsProps) {
  const safeTimesheets = Array.isArray(timesheets)
    ? timesheets
    : [];

  const resolvedOrganisationId =
    organisationId ?? orgId ?? null;

  const [showForm, setShowForm] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TimesheetForm>(
    emptyForm()
  );

  const metrics = useMemo(() => {
    const totalHours = safeTimesheets.reduce(
      (total, row) => total + getHours(row),
      0
    );

    const labourCost = safeTimesheets.reduce(
      (total, row) => {
        const hours = getHours(row);

        const hourlyRate = Number(
          row.hourly_rate || 0
        );

        return total + hours * hourlyRate;
      },
      0
    );

    const uniquePeople = new Set(
      safeTimesheets
        .map(
          (row) =>
            row.user_id ||
            row.employee_name ||
            row.name
        )
        .filter(Boolean)
    ).size;

    const averageHours =
      safeTimesheets.length > 0
        ? totalHours / safeTimesheets.length
        : 0;

    return {
      totalHours,
      labourCost,
      uniquePeople,
      averageHours,
    };
  }, [safeTimesheets]);

  const newTimesheetHours = useMemo(() => {
    return (
      Number(form.mon || 0) +
      Number(form.tue || 0) +
      Number(form.wed || 0) +
      Number(form.thu || 0) +
      Number(form.fri || 0) +
      Number(form.sat || 0) +
      Number(form.sun || 0)
    );
  }, [form]);

  const newTimesheetCost =
    newTimesheetHours *
    Number(form.hourly_rate || 0);

  const updateForm = (
    field: keyof TimesheetForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
  };

  const handleAddTimesheet = async () => {
    if (!resolvedOrganisationId) {
      notify?.(
        "No organisation found.",
        "error"
      );

      return;
    }

    if (!form.employee_name.trim()) {
      notify?.(
        "Enter a team member name.",
        "error"
      );

      return;
    }

    if (!form.week_start) {
      notify?.(
        "Select the week start date.",
        "error"
      );

      return;
    }

    if (newTimesheetHours <= 0) {
      notify?.(
        "Enter at least one logged hour.",
        "error"
      );

      return;
    }

    setSubmitting(true);

    try {
      const weekEnd = getWeekEnd(
        form.week_start
      );

      const { error } = await supabase
        .from("timesheets")
        .insert({
          employee_name:
            form.employee_name.trim(),

          user_id:
            userId || null,

          week_start:
            form.week_start,

          week_end:
            weekEnd,

          mon:
            Number(form.mon || 0),

          tue:
            Number(form.tue || 0),

          wed:
            Number(form.wed || 0),

          thu:
            Number(form.thu || 0),

          fri:
            Number(form.fri || 0),

          sat:
            Number(form.sat || 0),

          sun:
            Number(form.sun || 0),

          hourly_rate:
            Number(
              form.hourly_rate || 0
            ),

          status:
            form.status,

          organisation_id:
            resolvedOrganisationId,

          team_id:
            teamId || null,
        });

      if (error) {
        throw error;
      }

      notify?.(
        "Timesheet added.",
        "success"
      );

      resetForm();

      setShowForm(false);

      await refresh?.();
    } catch (error: any) {
      console.error(
        "Timesheet insert error:",
        error
      );

      notify?.(
        error?.message ||
          "Unable to add timesheet.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================
          METRICS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Total Hours"
          value={metrics.totalHours.toFixed(1)}
          sub="Logged across timesheets"
          icon={<Clock3 size={16} />}
        />

        <MiniStat
          label="Labour Cost"
          value={`£${formatMoney(
            metrics.labourCost
          )}`}
          sub="Based on hourly rates"
          icon={<PoundSterling size={16} />}
        />

        <MiniStat
          label="People"
          value={metrics.uniquePeople}
          sub="Contributing time"
          icon={<Users size={16} />}
        />

        <MiniStat
          label="Average Hours"
          value={metrics.averageHours.toFixed(1)}
          sub="Per timesheet entry"
          icon={<Activity size={16} />}
        />
      </div>

      {/* ==================================================
          TIMESHEETS
      ================================================== */}

      <SectionShell
        title="Timesheets"
        subtitle="Track workforce utilisation, submitted hours and labour cost across the business."
        action={
          <button
            type="button"
            onClick={() => {
              setShowForm(
                (current) => !current
              );
            }}
            className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
          >
            {showForm ? (
              <X size={14} />
            ) : (
              <Plus size={14} />
            )}

            {showForm
              ? "Close"
              : "Add Timesheet"}
          </button>
        }
      >
        {/* ==================================================
            ADD TIMESHEET FORM
        ================================================== */}

        {showForm && (
          <div className="mb-8 rounded-[2rem] border border-stone-100 bg-[#faf9f6] p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-lg font-bold text-stone-900">
                New Timesheet
              </p>

              <p className="mt-1 text-xs text-stone-400">
                Record weekly hours and calculate labour
                cost automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Team Member
                </label>

                <input
                  type="text"
                  value={
                    form.employee_name
                  }
                  onChange={(event) =>
                    updateForm(
                      "employee_name",
                      event.target.value
                    )
                  }
                  placeholder="Full name"
                  className="mt-2 w-full rounded-xl border border-stone-100 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Week Starting
                </label>

                <input
                  type="date"
                  value={
                    form.week_start
                  }
                  onChange={(event) =>
                    updateForm(
                      "week_start",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-stone-100 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-stone-900"
                />
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Hourly Rate
                </label>

                <div className="relative mt-2">
                  <PoundSterling
                    size={13}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.hourly_rate
                    }
                    onChange={(event) =>
                      updateForm(
                        "hourly_rate",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-stone-100 bg-white py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* DAYS */}

            <div className="mt-6">
              <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                Hours
              </label>

              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                {[
                  ["mon", "Mon"],
                  ["tue", "Tue"],
                  ["wed", "Wed"],
                  ["thu", "Thu"],
                  ["fri", "Fri"],
                  ["sat", "Sat"],
                  ["sun", "Sun"],
                ].map(([field, label]) => (
                  <div
                    key={field}
                    className="rounded-xl border border-stone-100 bg-white p-3"
                  >
                    <p className="mb-2 text-center text-[8px] font-black uppercase tracking-widest text-stone-400">
                      {label}
                    </p>

                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={
                        form[
                          field as keyof TimesheetForm
                        ]
                      }
                      onChange={(event) =>
                        updateForm(
                          field as keyof TimesheetForm,
                          event.target.value
                        )
                      }
                      placeholder="0"
                      className="w-full bg-transparent text-center font-mono text-sm font-bold outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY */}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Total Hours
                </p>

                <p className="mt-2 font-mono text-xl font-bold">
                  {newTimesheetHours.toFixed(
                    1
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Labour Cost
                </p>

                <p className="mt-2 font-mono text-xl font-bold">
                  £
                  {formatMoney(
                    newTimesheetCost
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <label className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value
                    )
                  }
                  className="mt-2 w-full bg-transparent text-sm font-semibold outline-none"
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="submitted">
                    Submitted
                  </option>

                  <option value="approved">
                    Approved
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={
                  handleAddTimesheet
                }
                className="flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={14} />
                )}

                Add Timesheet
              </button>
            </div>
          </div>
        )}

        {/* ==================================================
            TIMESHEET TABLE
        ================================================== */}

        {safeTimesheets.length === 0 ? (
          <div className="py-14 text-center">
            <Clock3
              size={28}
              className="mx-auto mb-4 text-stone-200"
            />

            <p className="text-sm font-semibold text-stone-600">
              No timesheet entries yet.
            </p>

            <p className="mt-1 text-xs text-stone-400">
              Add your first timesheet to start tracking
              labour hours and costs.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowForm(true)
              }
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a9b897] hover:text-stone-900"
            >
              <Plus size={13} />
              Add Timesheet
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="py-4 pr-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Team Member
                  </th>

                  <th className="px-4 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Period
                  </th>

                  <th className="px-4 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Hours
                  </th>

                  <th className="px-4 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Rate
                  </th>

                  <th className="px-4 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Labour Cost
                  </th>

                  <th className="py-4 pl-4 text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-50">
                {safeTimesheets.map(
                  (row) => {
                    const hours =
                      getHours(
                        row
                      );

                    const hourlyRate =
                      Number(
                        row.hourly_rate ||
                          0
                      );

                    const labourCost =
                      hours *
                      hourlyRate;

                    const person =
                      row.employee_name ||
                      row.name ||
                      row.user_id ||
                      "Unknown team member";

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-[#faf9f6]/70"
                      >
                        <td className="py-5 pr-4">
                          <p className="text-sm font-bold text-stone-900">
                            {
                              person
                            }
                          </p>

                          {row.user_id && (
                            <p className="mt-1 font-mono text-[8px] text-stone-300">
                              {row.user_id.slice(
                                0,
                                12
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-xs text-stone-600">
                            {formatDate(
                              row.week_start
                            )}

                            {row.week_end
                              ? ` → ${formatDate(
                                  row.week_end
                                )}`
                              : ""}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="font-mono font-bold text-stone-900">
                            {hours.toFixed(
                              1
                            )}{" "}
                            hrs
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="font-mono text-sm text-stone-600">
                            £
                            {formatMoney(
                              hourlyRate
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="font-mono font-bold text-stone-900">
                            £
                            {formatMoney(
                              labourCost
                            )}
                          </p>
                        </td>

                        <td className="py-5 pl-4">
                          <StatusPill
                            status={
                              row.status ||
                              "draft"
                            }
                          />
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      {/* ==================================================
          DAILY HOURS
      ================================================== */}

      {safeTimesheets.length > 0 && (
        <SectionShell
          title="Daily Hours"
          subtitle="A quick breakdown of logged hours across each day of the week."
        >
          <div className="space-y-3">
            {safeTimesheets.map(
              (row) => {
                const person =
                  row.employee_name ||
                  row.name ||
                  row.user_id ||
                  "Unknown team member";

                const days = [
                  [
                    "Mon",
                    Number(
                      row.mon ||
                        0
                    ),
                  ],
                  [
                    "Tue",
                    Number(
                      row.tue ||
                        0
                    ),
                  ],
                  [
                    "Wed",
                    Number(
                      row.wed ||
                        0
                    ),
                  ],
                  [
                    "Thu",
                    Number(
                      row.thu ||
                        0
                    ),
                  ],
                  [
                    "Fri",
                    Number(
                      row.fri ||
                        0
                    ),
                  ],
                  [
                    "Sat",
                    Number(
                      row.sat ||
                        0
                    ),
                  ],
                  [
                    "Sun",
                    Number(
                      row.sun ||
                        0
                    ),
                  ],
                ];

                return (
                  <div
                    key={`${row.id}-days`}
                    className="rounded-2xl bg-[#faf9f6] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-stone-900">
                        {
                          person
                        }
                      </p>

                      <span className="font-mono text-[9px] text-stone-400">
                        {getHours(
                          row
                        ).toFixed(
                          1
                        )}{" "}
                        hrs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                      {days.map(
                        ([
                          day,
                          value,
                        ]) => (
                          <div
                            key={String(
                              day
                            )}
                            className="rounded-xl border border-stone-100 bg-white p-3 text-center"
                          >
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                              {
                                day
                              }
                            </p>

                            <p className="mt-1 font-mono text-sm font-bold text-stone-900">
                              {Number(
                                value
                              ).toFixed(
                                1
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </SectionShell>
      )}
    </div>
  );
}