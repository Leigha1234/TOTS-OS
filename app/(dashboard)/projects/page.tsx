"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "../../../lib/supabase";

import {
  AlertTriangle,
  AlignLeft,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Calendar,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  Database,
  Folder,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  toast,
} from "sonner";

// =========================================================
// TYPES
// =========================================================

type Project = {
  id: string;
  user_id: string;
  organisation_id: string;

  name: string;

  description?: string | null;
  objective_summary?: string | null;

  category?: string | null;
  status?: string | null;
  priority?: string | null;
  health?: string | null;

  budget?: number | string | null;

  start_date?: string | null;
  due_date?: string | null;

  members?: string[] | null;

  customer_id?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type Customer = {
  id: string;

  name?: string | null;
  email?: string | null;
  phone?: string | null;

  company?: string | null;

  organisation_id?: string | null;

  status?: string | null;
};

type ProjectWithCustomer =
  Project & {
    customer?: Customer | null;
  };

// =========================================================
// PAGE
// =========================================================

export default function ProjectDirectory() {
  const [
    projects,
    setProjects,
  ] =
    useState<
      ProjectWithCustomer[]
    >([]);

  const [
    customers,
    setCustomers,
  ] =
    useState<
      Customer[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    showModal,
    setShowModal,
  ] =
    useState(
      false
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    organisationId,
    setOrganisationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  const [
    form,
    setForm,
  ] = useState({
    name: "",

    customer_id:
      "",

    objective_summary:
      "",

    description:
      "",

    category:
      "Client Work",

    start_date:
      "",

    due_date:
      "",

    budget:
      "",
  });

  // =========================================================
  // LOAD ORGANISATION
  // =========================================================

  useEffect(() => {
    const loadOrganisation =
      async () => {
        try {
          const {
            data: {
              user,
            },

            error:
              authError,
          } =
            await supabase.auth.getUser();

          if (
            authError ||
            !user?.id
          ) {
            console.error(
              "Project directory auth error:",
              authError
            );

            toast.error(
              "Please log in again"
            );

            setLoading(
              false
            );

            return;
          }

          setCurrentUserId(
            user.id
          );

          const {
            data:
              profile,

            error:
              profileError,
          } =
            await supabase
              .from(
                "profiles"
              )
              .select(
                "organisation_id"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.error(
              "Organisation profile load error:",
              profileError
            );

            toast.error(
              "Unable to load your organisation"
            );

            setLoading(
              false
            );

            return;
          }

          if (
            !profile
              ?.organisation_id
          ) {
            toast.error(
              "No organisation is linked to this account"
            );

            setLoading(
              false
            );

            return;
          }

          setOrganisationId(
            profile.organisation_id
          );
        } catch (
          error
        ) {
          console.error(
            "Unexpected organisation load error:",
            error
          );

          toast.error(
            "Unable to load workspace"
          );

          setLoading(
            false
          );
        }
      };

    void loadOrganisation();
  }, []);

  // =========================================================
  // LOAD WORKSPACE
  // =========================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    void loadWorkspace();
  }, [
    organisationId,
  ]);

  // =========================================================
  // LOAD WORKSPACE DATA
  // =========================================================

  async function loadWorkspace() {
    if (
      !organisationId
    ) {
      return;
    }

    setLoading(
      true
    );

    try {
      const [
        projectsResult,
        customersResult,
      ] =
        await Promise.all([
          supabase
            .from(
              "projects"
            )
            .select("*")
            .eq(
              "organisation_id",
              organisationId
            )
            .is(
              "deleted_at",
              null
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            ),

          supabase
            .from(
              "customers"
            )
            .select(
              `
                id,
                name,
                email,
                phone,
                company,
                organisation_id,
                status
              `
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "name",
              {
                ascending:
                  true,
              }
            ),
        ]);

      if (
        projectsResult.error
      ) {
        console.error(
          "Load projects error:",
          projectsResult.error
        );

        throw projectsResult.error;
      }

      if (
        customersResult.error
      ) {
        console.warn(
          "Load customers error:",
          customersResult.error
        );
      }

      const projectRows =
        (
          projectsResult.data as
            Project[]
        ) ||
        [];

      const customerRows =
        (
          customersResult.data as
            Customer[]
        ) ||
        [];

      setCustomers(
        customerRows
      );

      const customerMap =
        new Map(
          customerRows.map(
            (
              customer
            ) => [
              customer.id,
              customer,
            ]
          )
        );

      const enrichedProjects:
        ProjectWithCustomer[] =
        projectRows.map(
          (
            project
          ) => ({
            ...project,

            customer:
              project.customer_id
                ? customerMap.get(
                    project.customer_id
                  ) ||
                  null
                : null,
          })
        );

      setProjects(
        enrichedProjects
      );
    } catch (
      error
    ) {
      console.error(
        "Project workspace load error:",
        error
      );

      toast.error(
        "Failed to load clients and projects"
      );

      setProjects(
        []
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // =========================================================
  // CREATE PROJECT
  // =========================================================

  async function establishProject(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    if (
      !organisationId ||
      !currentUserId
    ) {
      toast.error(
        "Workspace is not ready"
      );

      return;
    }

    if (
      !form.name.trim()
    ) {
      toast.error(
        "Project name required"
      );

      return;
    }

    setSaving(
      true
    );

    try {
      const payload = {
        name:
          form.name.trim(),

        objective_summary:
          form.objective_summary.trim() ||
          null,

        description:
          form.description.trim() ||
          null,

        category:
          form.category,

        status:
          "live",

        priority:
          "Medium",

        health:
          "good",

        members:
          [],

        start_date:
          form.start_date ||
          null,

        due_date:
          form.due_date ||
          null,

        budget:
          form.budget !==
            "" &&
          !Number.isNaN(
            Number(
              form.budget
            )
          )
            ? Number(
                form.budget
              )
            : 0,

        customer_id:
          form.customer_id ||
          null,

        organisation_id:
          organisationId,

        user_id:
          currentUserId,
      };

      const {
        data:
          inserted,

        error:
          insertError,
      } =
        await supabase
          .from(
            "projects"
          )
          .insert(
            payload
          )
          .select("*")
          .single();

      if (
        insertError
      ) {
        console.error(
          "Project insert error:",
          insertError
        );

        throw insertError;
      }

      const selectedCustomer =
        customers.find(
          (
            customer
          ) =>
            customer.id ===
            inserted.customer_id
        ) ||
        null;

      const project:
        ProjectWithCustomer =
        {
          ...inserted,

          customer:
            selectedCustomer,
        };

      setProjects(
        (
          previous
        ) => [
          project,
          ...previous,
        ]
      );

      setForm({
        name:
          "",

        customer_id:
          "",

        objective_summary:
          "",

        description:
          "",

        category:
          "Client Work",

        start_date:
          "",

        due_date:
          "",

        budget:
          "",
      });

      setShowModal(
        false
      );

      toast.success(
        "Project created"
      );
    } catch (
      error: any
    ) {
      console.error(
        "Unexpected project create error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to create project"
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function formatCurrency(
    amount:
      | number
      | string
      | null
      | undefined
  ) {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style:
          "currency",

        currency:
          "GBP",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        amount || 0
      )
    );
  }

  function formatDate(
    value?:
      | string
      | null
  ) {
    if (
      !value
    ) {
      return "No deadline";
    }

    const date =
      new Date(
        `${value}T12:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day:
          "numeric",

        month:
          "short",
      }
    ).format(
      date
    );
  }

  function daysUntil(
    value?:
      | string
      | null
  ) {
    if (
      !value
    ) {
      return null;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const target =
      new Date(
        `${value}T00:00:00`
      );

    if (
      Number.isNaN(
        target.getTime()
      )
    ) {
      return null;
    }

    return Math.ceil(
      (
        target.getTime() -
        today.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    );
  }

  function getCustomerName(
    customer?:
      | Customer
      | null
  ) {
    if (
      !customer
    ) {
      return "Internal project";
    }

    return (
      customer.company ||
      customer.name ||
      customer.email ||
      "Unnamed client"
    );
  }

  // =========================================================
  // CLIENT PROJECTS ONLY
  // =========================================================

  const clientProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            Boolean(
              project.customer_id
            )
        ),
      [
        projects,
      ]
    );

  const internalProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) =>
            !project.customer_id
        ),
      [
        projects,
      ]
    );

  // =========================================================
  // FILTERED PROJECTS
  // =========================================================

  const filtered =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (
        !value
      ) {
        return projects;
      }

      return projects.filter(
        (
          project
        ) => {
          const customerName =
            getCustomerName(
              project.customer
            ).toLowerCase();

          return (
            (
              project.name ||
              ""
            )
              .toLowerCase()
              .includes(
                value
              ) ||
            (
              project.category ||
              ""
            )
              .toLowerCase()
              .includes(
                value
              ) ||
            (
              project.objective_summary ||
              ""
            )
              .toLowerCase()
              .includes(
                value
              ) ||
            customerName.includes(
              value
            )
          );
        }
      );
    }, [
      projects,
      search,
    ]);

  // =========================================================
  // DASHBOARD METRICS
  // =========================================================

  const activeProjects =
    useMemo(
      () =>
        projects.filter(
          (
            project
          ) => {
            const status =
              String(
                project.status ||
                  ""
              )
                .trim()
                .toLowerCase();

            return ![
              "completed",
              "done",
              "archived",
            ].includes(
              status
            );
          }
        ),
      [
        projects,
      ]
    );

  const projectsDueSoon =
    useMemo(() => {
      return activeProjects.filter(
        (
          project
        ) => {
          const remaining =
            daysUntil(
              project.due_date
            );

          return (
            remaining !==
              null &&
            remaining >=
              0 &&
            remaining <=
              7
          );
        }
      );
    }, [
      activeProjects,
    ]);

  const overdueProjects =
    useMemo(() => {
      return activeProjects.filter(
        (
          project
        ) => {
          const remaining =
            daysUntil(
              project.due_date
            );

          return (
            remaining !==
              null &&
            remaining <
              0
          );
        }
      );
    }, [
      activeProjects,
    ]);

  const totalBudget =
    useMemo(
      () =>
        activeProjects.reduce(
          (
            total,
            project
          ) =>
            total +
            Number(
              project.budget ||
                0
            ),
          0
        ),
      [
        activeProjects,
      ]
    );

  const activeClients =
    useMemo(() => {
      const ids =
        activeProjects
          .map(
            (
              project
            ) =>
              project.customer_id
          )
          .filter(
            Boolean
          );

      return new Set(
        ids
      ).size;
    }, [
      activeProjects,
    ]);

  // =========================================================
  // ATTENTION PROJECTS
  // =========================================================

  const attentionProjects =
    useMemo(() => {
      return activeProjects
        .filter(
          (
            project
          ) => {
            const remaining =
              daysUntil(
                project.due_date
              );

            const health =
              String(
                project.health ||
                  ""
              )
                .trim()
                .toLowerCase();

            return (
              [
                "bad",
                "warning",
                "at-risk",
                "atrisk",
              ].includes(
                health
              ) ||
              (
                remaining !==
                  null &&
                remaining <=
                  7
              )
            );
          }
        )
        .sort(
          (
            first,
            second
          ) => {
            const firstDays =
              daysUntil(
                first.due_date
              ) ??
              999999;

            const secondDays =
              daysUntil(
                second.due_date
              ) ??
              999999;

            return (
              firstDays -
              secondDays
            );
          }
        )
        .slice(
          0,
          5
        );
    }, [
      activeProjects,
    ]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const workspaceSummary =
    useMemo(() => {
      if (
        activeProjects.length ===
        0
      ) {
        return "Your commercial workspace is ready. Add a client project or internal project to begin tracking delivery.";
      }

      let summary =
        `You currently have ${activeProjects.length} ${
          activeProjects.length ===
          1
            ? "active project"
            : "active projects"
        }`;

      if (
        activeClients >
        0
      ) {
        summary +=
          ` across ${activeClients} ${
            activeClients ===
            1
              ? "client"
              : "clients"
          }`;
      }

      if (
        projectsDueSoon.length >
        0
      ) {
        summary +=
          `, with ${projectsDueSoon.length} due in the next 7 days`;
      }

      if (
        overdueProjects.length >
        0
      ) {
        summary +=
          `. ${overdueProjects.length} ${
            overdueProjects.length ===
            1
              ? "project is"
              : "projects are"
          } overdue`;
      }

      if (
        totalBudget >
        0
      ) {
        summary +=
          `. Active project value is ${formatCurrency(
            totalBudget
          )}`;
      }

      summary +=
        ".";

      return summary;
    }, [
      activeProjects.length,
      activeClients,
      projectsDueSoon.length,
      overdueProjects.length,
      totalBudget,
    ]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-stone-50 p-4 pb-32 selection:bg-[#a9b897] selection:text-white md:p-10 lg:p-12">
      <div className="mx-auto max-w-6xl">
        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#a9b897]">
              <Briefcase
                size={
                  13
                }
              />

              Commercial Workspace
            </div>

            <h1 className="font-serif text-5xl italic tracking-tight text-stone-800 md:text-7xl">
              Clients & Projects
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-500">
              Manage the people you work
              with and everything you are
              delivering for them.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/crm"
              className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-stone-600 transition hover:border-[#a9b897] hover:text-stone-900"
            >
              <ContactRound
                size={
                  16
                }
              />

              Clients
            </Link>

            <button
              type="button"
              onClick={() =>
                setShowModal(
                  true
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#a9b897] active:scale-[0.98]"
            >
              <Plus
                size={
                  16
                }
              />

              New Project
            </button>
          </div>
        </header>

        {/* ===================================================
            TOTS SUMMARY
        =================================================== */}

        {!loading && (
          <section className="mb-8 rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#7f9270]">
                <Sparkles
                  size={
                    19
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.26em] text-[#829473]">
                  TOTS Summary
                </p>

                <p className="max-w-4xl text-lg leading-7 text-stone-700">
                  {
                    workspaceSummary
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================
            METRICS
        =================================================== */}

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <WorkspaceMetric
            icon={
              Folder
            }
            value={String(
              activeProjects.length
            )}
            label="Active Projects"
          />

          <WorkspaceMetric
            icon={
              Users
            }
            value={String(
              activeClients
            )}
            label="Active Clients"
          />

          <WorkspaceMetric
            icon={
              AlertTriangle
            }
            value={String(
              overdueProjects.length
            )}
            label="Overdue"
          />

          <WorkspaceMetric
            icon={
              CircleDollarSign
            }
            value={formatCurrency(
              totalBudget
            )}
            label="Project Value"
          />
        </section>

        {/* ===================================================
            WORKSPACE ENTRY POINTS
        =================================================== */}

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/crm"
            className="group rounded-[2rem] border border-stone-200 bg-white p-6 transition hover:border-[#a9b897] hover:shadow-xl hover:shadow-stone-200/40"
          >
            <div className="mb-8 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-stone-600 transition group-hover:bg-[#a9b897] group-hover:text-white">
                <Users
                  size={
                    20
                  }
                />
              </div>

              <ArrowUpRight
                size={
                  18
                }
                className="text-stone-300 transition group-hover:text-[#a9b897]"
              />
            </div>

            <h2 className="font-serif text-2xl italic text-stone-800">
              Clients
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Open a client workspace to
              see their projects, money,
              tasks, emails and history.
            </p>

            <div className="mt-6 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#829473]">
              Open Clients

              <ChevronRight
                size={
                  13
                }
              />
            </div>
          </Link>

          <div className="rounded-[2rem] border border-[#a9b897]/50 bg-[#a9b897]/5 p-6">
            <div className="mb-8 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a9b897] text-white">
                <Briefcase
                  size={
                    20
                  }
                />
              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] text-[#829473]">
                You are here
              </span>
            </div>

            <h2 className="font-serif text-2xl italic text-stone-800">
              Projects
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
              Track delivery, tasks,
              deadlines, team members,
              budgets and commercial
              activity.
            </p>

            <div className="mt-6 text-[9px] font-black uppercase tracking-[0.18em] text-[#829473]">
              {
                activeProjects.length
              }{" "}
              Active
            </div>
          </div>
        </section>

        {/* ===================================================
            NEEDS ATTENTION
        =================================================== */}

        {attentionProjects.length >
          0 && (
          <section className="mb-10">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#829473]">
                Needs Attention
              </p>

              <h2 className="mt-1 font-serif text-2xl italic text-stone-800">
                What needs you next
              </h2>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
              {attentionProjects.map(
                (
                  project,
                  index
                ) => {
                  const remaining =
                    daysUntil(
                      project.due_date
                    );

                  return (
                    <Link
                      href={`/projects/${project.id}`}
                      key={
                        project.id
                      }
                      className={`group flex items-center justify-between gap-4 p-5 transition hover:bg-stone-50 ${
                        index !==
                        attentionProjects.length -
                          1
                          ? "border-b border-stone-100"
                          : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <AlertTriangle
                            size={
                              16
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-800">
                            {
                              project.name
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-stone-400">
                            {project.customer
                              ? `${getCustomerName(
                                  project.customer
                                )} · `
                              : ""}

                            {remaining ===
                            null
                              ? "No deadline set"
                              : remaining <
                                  0
                                ? `${Math.abs(
                                    remaining
                                  )} ${
                                    Math.abs(
                                      remaining
                                    ) ===
                                    1
                                      ? "day"
                                      : "days"
                                  } overdue`
                                : remaining ===
                                    0
                                  ? "Due today"
                                  : `Due in ${remaining} ${
                                      remaining ===
                                      1
                                        ? "day"
                                        : "days"
                                    }`}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={
                          17
                        }
                        className="shrink-0 text-stone-300 transition group-hover:translate-x-1 group-hover:text-[#a9b897]"
                      />
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            PROJECT DIRECTORY
        =================================================== */}

        <section>
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#829473]">
                Your Work
              </p>

              <h2 className="mt-1 font-serif text-3xl italic text-stone-800">
                Projects
              </h2>

              {!loading && (
                <p className="mt-2 text-xs text-stone-400">
                  {
                    clientProjects.length
                  }{" "}
                  client{" "}
                  {clientProjects.length ===
                  1
                    ? "project"
                    : "projects"}
                  {" · "}
                  {
                    internalProjects.length
                  }{" "}
                  internal
                </p>
              )}
            </div>

            <div className="relative">
              <Search
                size={
                  14
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                placeholder="Search project or client..."
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-stone-200 bg-white py-3.5 pl-10 pr-4 text-xs outline-none transition focus:border-[#a9b897] focus:ring-2 focus:ring-[#a9b897]/10 md:w-80"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-stone-100 bg-white p-20">
                <Loader2 className="animate-spin text-[#a9b897]" />

                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-300">
                  Loading Workspace
                </p>
              </div>
            ) : filtered.length >
              0 ? (
              filtered.map(
                (
                  project
                ) => {
                  const remaining =
                    daysUntil(
                      project.due_date
                    );

                  return (
                    <Link
                      href={`/projects/${project.id}`}
                      key={
                        project.id
                      }
                      className="group relative rounded-[1.8rem] border border-stone-200 bg-white p-5 transition-all duration-300 hover:border-[#a9b897] hover:shadow-xl hover:shadow-stone-200/40 md:p-6"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4 md:gap-6">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50 text-stone-400 transition group-hover:bg-stone-900 group-hover:text-[#a9b897]">
                            <Folder
                              size={
                                21
                              }
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-serif text-xl italic text-stone-800 md:text-2xl">
                                {
                                  project.name
                                }
                              </h3>

                              {project.category && (
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-stone-500">
                                  {
                                    project.category
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                              <UserRound
                                size={
                                  11
                                }
                                className="text-[#829473]"
                              />

                              <span className="truncate text-[10px] font-semibold text-[#829473]">
                                {getCustomerName(
                                  project.customer
                                )}
                              </span>
                            </div>

                            {project.objective_summary && (
                              <p className="mb-2 line-clamp-1 text-xs text-stone-400">
                                {
                                  project.objective_summary
                                }
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">
                              <span className="flex items-center gap-1.5">
                                <Calendar
                                  size={
                                    11
                                  }
                                />

                                {formatDate(
                                  project.due_date
                                )}
                              </span>

                              {Number(
                                project.budget
                              ) >
                                0 && (
                                <span className="flex items-center gap-1.5">
                                  <Banknote
                                    size={
                                      11
                                    }
                                  />

                                  {formatCurrency(
                                    project.budget
                                  )}
                                </span>
                              )}

                              {remaining !==
                                null &&
                                remaining <
                                  0 && (
                                  <span className="text-amber-600">
                                    Overdue
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-300 transition group-hover:bg-[#a9b897] group-hover:text-white">
                          <ArrowUpRight
                            size={
                              17
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  );
                }
              )
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-stone-200 bg-white py-20 text-center">
                <Database
                  size={
                    30
                  }
                  className="mx-auto mb-4 text-stone-200"
                />

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">
                  {search
                    ? "No Matching Projects"
                    : "No Projects Yet"}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(
                        true
                      )
                    }
                    className="mt-5 text-xs font-semibold text-[#829473]"
                  >
                    Create your first project →
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          NEW PROJECT MODAL
      ===================================================== */}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden p-4 md:p-6">
            <motion.div
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              exit={{
                opacity:
                  0,
              }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
              onClick={() =>
                !saving &&
                setShowModal(
                  false
                )
              }
            />

            <motion.div
              initial={{
                scale:
                  0.95,

                opacity:
                  0,

                y:
                  15,
              }}
              animate={{
                scale:
                  1,

                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                scale:
                  0.95,

                opacity:
                  0,

                y:
                  15,
              }}
              className="no-scrollbar relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2.5rem] border border-stone-100 bg-white p-7 shadow-2xl md:p-10"
            >
              <div className="mb-9 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-[8px] font-black uppercase tracking-[0.25em] text-[#829473]">
                    Clients & Projects
                  </p>

                  <h2 className="font-serif text-4xl italic text-stone-800">
                    New Project
                  </h2>

                  <p className="mt-2 max-w-lg text-xs leading-5 text-stone-400">
                    Link the project to a
                    client now so TOTS can
                    automatically connect
                    their work, finances and
                    project history.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-full p-3 transition-colors hover:bg-stone-50 disabled:opacity-50"
                >
                  <X
                    size={
                      20
                    }
                  />
                </button>
              </div>

              <form
                onSubmit={
                  establishProject
                }
                className="space-y-6"
              >
                {/* PROJECT NAME */}

                <div className="space-y-1">
                  <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                    Project Name
                  </label>

                  <input
                    required
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        {
                          ...form,

                          name:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 font-serif text-base italic outline-none focus:border-[#a9b897]"
                    placeholder="Website Redesign"
                  />
                </div>

                {/* CLIENT */}

                <div className="space-y-1">
                  <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                    Client
                  </label>

                  <div className="relative">
                    <UserRound
                      size={
                        14
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                    />

                    <select
                      value={
                        form.customer_id
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,

                            customer_id:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-xs outline-none focus:border-[#a9b897]"
                    >
                      <option value="">
                        Internal project / no client
                      </option>

                      {customers.map(
                        (
                          customer
                        ) => (
                          <option
                            key={
                              customer.id
                            }
                            value={
                              customer.id
                            }
                          >
                            {getCustomerName(
                              customer
                            )}
                            {customer.email
                              ? ` — ${customer.email}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {customers.length ===
                    0 && (
                    <p className="ml-1 mt-2 text-[10px] text-stone-400">
                      No finance clients exist yet. You can still create an internal project.
                    </p>
                  )}
                </div>

                {/* CATEGORY / BUDGET */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Category
                    </label>

                    <select
                      value={
                        form.category
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,

                            category:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-stone-100 bg-stone-50 p-4 text-[10px] font-bold uppercase tracking-widest outline-none"
                    >
                      <option value="Client Work">
                        Client Work
                      </option>

                      <option value="Website">
                        Website
                      </option>

                      <option value="Branding">
                        Branding
                      </option>

                      <option value="Marketing">
                        Marketing
                      </option>

                      <option value="Strategy">
                        Strategy
                      </option>

                      <option value="Operational">
                        Operational
                      </option>

                      <option value="Internal">
                        Internal
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Project Budget
                    </label>

                    <div className="relative">
                      <Banknote
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      />

                      <input
                        inputMode="decimal"
                        value={
                          form.budget
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            {
                              ...form,

                              budget:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-xs outline-none focus:border-[#a9b897]"
                        placeholder="6000"
                      />
                    </div>
                  </div>
                </div>

                {/* DATES */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Start Date
                    </label>

                    <div className="relative">
                      <Calendar
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      />

                      <input
                        type="date"
                        value={
                          form.start_date
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            {
                              ...form,

                              start_date:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-[10px] font-bold outline-none focus:border-[#a9b897]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                      Deadline
                    </label>

                    <div className="relative">
                      <Calendar
                        size={
                          14
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      />

                      <input
                        type="date"
                        value={
                          form.due_date
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            {
                              ...form,

                              due_date:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-[10px] font-bold outline-none focus:border-[#a9b897]"
                      />
                    </div>
                  </div>
                </div>

                {/* OBJECTIVE */}

                <div className="space-y-1">
                  <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                    Project Objective
                  </label>

                  <input
                    value={
                      form.objective_summary
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        {
                          ...form,

                          objective_summary:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 font-serif text-sm italic outline-none focus:border-[#a9b897]"
                    placeholder="What does success look like?"
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="space-y-1">
                  <label className="ml-1 text-[8px] font-black uppercase tracking-widest text-stone-400">
                    Description
                  </label>

                  <div className="relative">
                    <AlignLeft
                      size={
                        14
                      }
                      className="absolute left-4 top-5 text-stone-300"
                    />

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,

                            description:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="h-28 w-full resize-none rounded-xl border border-stone-100 bg-stone-50 p-4 pl-11 text-xs leading-relaxed outline-none focus:border-[#a9b897]"
                      placeholder="Scope, deliverables, requirements or useful project context..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-[1.6rem] bg-stone-900 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-white shadow-xl transition hover:bg-[#a9b897] disabled:opacity-40"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={
                          16
                        }
                        className="animate-spin"
                      />

                      Creating
                    </>
                  ) : (
                    <>
                      <Plus
                        size={
                          15
                        }
                      />

                      Create Project
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&display=swap');

            .font-serif {
              font-family: 'Instrument Serif', serif;
            }

            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }

            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `,
        }}
      />
    </div>
  );
}

// =========================================================
// SMALL COMPONENTS
// =========================================================

function WorkspaceMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-50 text-stone-500">
        <Icon
          size={
            16
          }
        />
      </div>

      <p className="font-serif text-2xl italic text-stone-800 md:text-3xl">
        {
          value
        }
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
        {
          label
        }
      </p>
    </div>
  );
}