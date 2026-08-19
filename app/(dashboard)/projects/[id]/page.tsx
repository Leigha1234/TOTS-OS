"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Cloud,
  Download,
  FileCheck2,
  FileText,
  Folder,
  Hash,
  LayoutDashboard,
  ListTodo,
  Loader2,
  MessageSquareText,
  Paperclip,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  toast,
} from "sonner";

/*
 * IMPORTANT
 *
 * These are absolute imports.
 *
 * Your previous "../../payments/..." path was wrong because
 * Next was resolving it from app/(dashboard)/projects.
 */
import InvoiceQuoteModal, {
  type FinanceLineItem,
  type FinanceProject,
  type InvoiceQuoteDocType,
  type InvoiceQuoteFormData,
} from "@/app/(dashboard)/payments/components/modals/InvoiceQuoteModal";

import ExpenseModal, {
  type ExpenseForm,
} from "@/app/(dashboard)/payments/components/modals/ExpenseModal";

// ============================================================
// TYPES
// ============================================================

type ProjectTab =
  | "Overview"
  | "Tasks"
  | "Timeline"
  | "Money"
  | "Files"
  | "Notes"
  | "Settings";

type Customer = {
  id: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
};

type TeamMember = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  organisation_id?: string | null;
  membership_id?: string | null;
  role?: string | null;
};

type TeamMembershipRow = {
  id: string;
  user_id: string;
  organisation_id: string;
  role?: string | null;
};

type ProjectFinanceRecord = {
  id: string;

  amount?:
    | number
    | string
    | null;

  status?:
    | string
    | null;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;

  date?:
    | string
    | null;

  due_date?:
    | string
    | null;

  customer_id?:
    | string
    | null;

  project_id?:
    | string
    | null;

  client_name?:
    | string
    | null;

  description?:
    | string
    | null;
};

type ProjectNote = {
  id: string;
  title?: string | null;
  content: string;
  type?: string | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
};

type ProjectFile = {
  id: string;
  name: string;
  path: string;
  publicUrl?: string | null;
  created_at?: string | null;
  size?: number | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  date: string;
};

type AddProjectMemberResult = {
  success?: boolean;
  already_member?: boolean;
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
};

type InvitationApiResult = {
  success?: boolean;
  message?: string;
  error?: string;

  user_id?: string;
  userId?: string;

  full_name?: string | null;
  fullName?: string | null;

  email?: string | null;

  already_member?: boolean;
  alreadyMember?: boolean;

  invitation_pending?: boolean;
  pending?: boolean;
};

type MemberInviteFeedback = {
  type:
    | "success"
    | "error"
    | "info";

  title: string;
  message?: string;
};

// ============================================================
// INITIAL FINANCE STATE
// ============================================================

const INITIAL_INVOICE_FORM: InvoiceQuoteFormData = {
  customerId: "",
  projectId: "",
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

const INITIAL_EXPENSE_FORM: ExpenseForm = {
  description: "",
  amount: "",
  date: "",
  status: "pending",
  customerId: "",
  projectId: "",
};

// ============================================================
// HELPERS
// ============================================================

function isTaskComplete(
  status?: string | null
) {
  return [
    "done",
    "completed",
    "complete",
  ].includes(
    String(
      status || ""
    )
      .trim()
      .toLowerCase()
  );
}

function normaliseMemberArray(
  value: unknown
): string[] {
  if (
    Array.isArray(
      value
    )
  ) {
    return [
      ...new Set(
        value
          .map(
            (
              item
            ) =>
              String(
                item ?? ""
              )
                .trim()
                .replace(
                  /^["']|["']$/g,
                  ""
                )
          )
          .filter(
            Boolean
          )
      ),
    ];
  }

  if (
    typeof value !==
    "string"
  ) {
    return [];
  }

  const trimmed =
    value.trim();

  if (
    !trimmed
  ) {
    return [];
  }

  if (
    trimmed.startsWith(
      "["
    )
  ) {
    try {
      const parsed =
        JSON.parse(
          trimmed
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return normaliseMemberArray(
          parsed
        );
      }
    } catch {
      //
    }
  }

  if (
    trimmed.startsWith(
      "{"
    ) &&
    trimmed.endsWith(
      "}"
    )
  ) {
    const inner =
      trimmed.slice(
        1,
        -1
      );

    if (
      !inner.trim()
    ) {
      return [];
    }

    return [
      ...new Set(
        inner
          .split(",")
          .map(
            (
              item
            ) =>
              item
                .trim()
                .replace(
                  /^["']|["']$/g,
                  ""
                )
          )
          .filter(
            Boolean
          )
      ),
    ];
  }

  if (
    trimmed.includes(
      ","
    )
  ) {
    return [
      ...new Set(
        trimmed
          .split(",")
          .map(
            (
              item
            ) =>
              item
                .trim()
                .replace(
                  /^["']|["']$/g,
                  ""
                )
          )
          .filter(
            Boolean
          )
      ),
    ];
  }

  return [
    trimmed.replace(
      /^["']|["']$/g,
      ""
    ),
  ];
}

function getMemberDisplayName(
  member?: TeamMember | null
) {
  if (
    !member
  ) {
    return "Unnamed user";
  }

  return (
    member.full_name?.trim() ||
    member.email?.trim() ||
    "Unnamed user"
  );
}

function getInviteErrorMessage(
  message?: string | null
): MemberInviteFeedback {
  const raw =
    String(
      message || ""
    ).trim();

  const lower =
    raw.toLowerCase();

  if (
    lower.includes(
      "permission"
    ) ||
    lower.includes(
      "row-level security"
    ) ||
    lower.includes(
      "42501"
    )
  ) {
    return {
      type:
        "error",

      title:
        "Permission denied",

      message:
        "TOTS-OS could not update the organisation or project because your account does not currently have permission.",
    };
  }

  if (
    lower.includes(
      "already"
    )
  ) {
    return {
      type:
        "info",

      title:
        "Already added",

      message:
        raw ||
        "This person has already been added.",
    };
  }

  return {
    type:
      "error",

    title:
      "Unable to add member",

    message:
      raw ||
      "Something went wrong while adding this person.",
  };
}

// ============================================================
// PAGE
// ============================================================

export default function ProjectEngine() {
  const params =
    useParams();

  const router =
    useRouter();

  const projectId =
    typeof params?.id ===
    "string"
      ? params.id
      : Array.isArray(
            params?.id
          )
        ? params.id[0]
        : null;

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const supabase =
    useMemo(
      () =>
        createBrowserClient(
          process.env
            .NEXT_PUBLIC_SUPABASE_URL!,

          process.env
            .NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ),
      []
    );

  // ==========================================================
  // CORE STATE
  // ==========================================================

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
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
    activeTab,
    setActiveTab,
  ] =
    useState<ProjectTab>(
      "Overview"
    );

  const [
    project,
    setProject,
  ] =
    useState<any>(
      null
    );

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  const [
    customer,
    setCustomer,
  ] =
    useState<Customer | null>(
      null
    );

  const [
    customers,
    setCustomers,
  ] =
    useState<
      Customer[]
    >([]);

  // ==========================================================
  // TASKS
  // ==========================================================

  const [
    tasks,
    setTasks,
  ] =
    useState<any[]>(
      []
    );

  const [
    comments,
    setComments,
  ] =
    useState<any[]>(
      []
    );

  const [
    taskInput,
    setTaskInput,
  ] =
    useState("");

  const [
    taskAssignee,
    setTaskAssignee,
  ] =
    useState("");

  const [
    assigneeInitialised,
    setAssigneeInitialised,
  ] =
    useState(
      false
    );

  const [
    expandedTaskId,
    setExpandedTaskId,
  ] =
    useState<
      string | null
    >(null);

  const [
    commentInput,
    setCommentInput,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  // ==========================================================
  // MEMBERS
  // ==========================================================

  const [
    teamMembers,
    setTeamMembers,
  ] =
    useState<
      TeamMember[]
    >([]);

  const [
    inviteEmail,
    setInviteEmail,
  ] =
    useState("");

  const [
    isInvitingMember,
    setIsInvitingMember,
  ] =
    useState(
      false
    );

  const [
    memberInviteFeedback,
    setMemberInviteFeedback,
  ] =
    useState<
      MemberInviteFeedback | null
    >(null);

  // ==========================================================
  // SUB PROJECTS
  // ==========================================================

  const [
    subProjects,
    setSubProjects,
  ] =
    useState<any[]>(
      []
    );

  const [
    subProjectName,
    setSubProjectName,
  ] =
    useState("");

  const [
    subProjectSummary,
    setSubProjectSummary,
  ] =
    useState("");

  const [
    subProjectDueDate,
    setSubProjectDueDate,
  ] =
    useState("");

  // ==========================================================
  // FINANCE
  // ==========================================================

  const [
    projectQuotes,
    setProjectQuotes,
  ] =
    useState<
      ProjectFinanceRecord[]
    >([]);

  const [
    projectInvoices,
    setProjectInvoices,
  ] =
    useState<
      ProjectFinanceRecord[]
    >([]);

  const [
    projectExpenses,
    setProjectExpenses,
  ] =
    useState<
      ProjectFinanceRecord[]
    >([]);

  const [
    showInvoiceModal,
    setShowInvoiceModal,
  ] =
    useState(
      false
    );

  const [
    showExpenseModal,
    setShowExpenseModal,
  ] =
    useState(
      false
    );

  const [
    invoiceSubmitting,
    setInvoiceSubmitting,
  ] =
    useState(
      false
    );

  const [
    invoiceDocType,
    setInvoiceDocType,
  ] =
    useState<InvoiceQuoteDocType>(
      "Invoice"
    );

  const [
    invoiceForm,
    setInvoiceForm,
  ] =
    useState<InvoiceQuoteFormData>(
      INITIAL_INVOICE_FORM
    );

  const [
    invoiceLineItems,
    setInvoiceLineItems,
  ] =
    useState<
      FinanceLineItem[]
    >(
      INITIAL_LINE_ITEMS
    );

  const [
    expenseSubmitting,
    setExpenseSubmitting,
  ] =
    useState(
      false
    );

  const [
    expenseForm,
    setExpenseForm,
  ] =
    useState<ExpenseForm>(
      INITIAL_EXPENSE_FORM
    );

  // ==========================================================
  // NOTES
  // ==========================================================

  const [
    projectNotes,
    setProjectNotes,
  ] =
    useState<
      ProjectNote[]
    >([]);

  const [
    noteTitle,
    setNoteTitle,
  ] =
    useState("");

  const [
    noteContent,
    setNoteContent,
  ] =
    useState("");

  const [
    noteSaving,
    setNoteSaving,
  ] =
    useState(
      false
    );

  // ==========================================================
  // FILES
  // ==========================================================

  const [
    projectFiles,
    setProjectFiles,
  ] =
    useState<
      ProjectFile[]
    >([]);

  const [
    fileUploading,
    setFileUploading,
  ] =
    useState(
      false
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatCurrency =
    (
      value?:
        | number
        | string
        | null
    ) => {
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
          value || 0
        )
      );
    };

  const formatDate =
    (
      value?:
        | string
        | null
    ) => {
      if (
        !value
      ) {
        return "Not set";
      }

      const safe =
        value.includes(
          "T"
        )
          ? value
          : `${value}T12:00:00`;

      const date =
        new Date(
          safe
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

          year:
            "numeric",
        }
      ).format(
        date
      );
    };

  const formatShortDate =
    (
      value?:
        | string
        | null
    ) => {
      if (
        !value
      ) {
        return "Not set";
      }

      const safe =
        value.includes(
          "T"
        )
          ? value
          : `${value}T12:00:00`;

      const date =
        new Date(
          safe
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
    };

  const daysUntil =
    (
      value?:
        | string
        | null
    ) => {
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
    };

  const getCustomerDisplayName =
    (
      selected?:
        | Customer
        | null
    ) => {
      if (
        !selected
      ) {
        return "No client linked";
      }

      return (
        selected.company ||
        selected.name ||
        selected.email ||
        "Unnamed client"
      );
    };

  // ==========================================================
  // ORGANISATION MEMBERS
  // ==========================================================

  const loadOrganisationMembers =
    useCallback(
      async (
        orgId: string
      ) => {
        const {
          data:
            membershipRows,
          error:
            membershipError,
        } =
          await supabase
            .from(
              "team_members"
            )
            .select(
              "id, user_id, organisation_id, role"
            )
            .eq(
              "organisation_id",
              orgId
            );

        if (
          membershipError
        ) {
          console.error(
            "Member load error:",
            membershipError
          );

          setTeamMembers(
            []
          );

          return [];
        }

        const memberships =
          (
            membershipRows as
              TeamMembershipRow[]
          ) || [];

        const userIds =
          [
            ...new Set(
              memberships
                .map(
                  (
                    membership
                  ) =>
                    membership.user_id
                )
                .filter(
                  Boolean
                )
            ),
          ];

        if (
          !userIds.length
        ) {
          setTeamMembers(
            []
          );

          return [];
        }

        const {
          data:
            profiles,
          error:
            profilesError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id, email, full_name, organisation_id"
            )
            .in(
              "id",
              userIds
            );

        if (
          profilesError
        ) {
          console.warn(
            "Profile decoration error:",
            profilesError
          );
        }

        const profileRows =
          profiles || [];

        const resolved =
          memberships.map(
            (
              membership
            ): TeamMember => {
              const profile =
                profileRows.find(
                  (
                    row: any
                  ) =>
                    row.id ===
                    membership.user_id
                );

              return {
                id:
                  membership.user_id,

                email:
                  profile?.email ||
                  null,

                full_name:
                  profile?.full_name ||
                  null,

                organisation_id:
                  membership.organisation_id,

                membership_id:
                  membership.id,

                role:
                  membership.role ||
                  null,
              };
            }
          );

        resolved.sort(
          (
            a,
            b
          ) =>
            getMemberDisplayName(
              a
            ).localeCompare(
              getMemberDisplayName(
                b
              )
            )
        );

        setTeamMembers(
          resolved
        );

        return resolved;
      },
      [
        supabase,
      ]
    );

  // ==========================================================
  // PROJECT MEMBERS
  // ==========================================================

  const membersList =
    useMemo(
      () =>
        normaliseMemberArray(
          project?.members
        ),
      [
        project?.members,
      ]
    );

  const projectMemberProfiles =
    useMemo(
      () =>
        membersList.map(
          (
            memberValue
          ) => {
            const lower =
              memberValue.toLowerCase();

            const profile =
              teamMembers.find(
                (
                  member
                ) =>
                  member.id ===
                    memberValue ||
                  member.membership_id ===
                    memberValue ||
                  String(
                    member.email ||
                      ""
                  ).toLowerCase() ===
                    lower
              );

            return {
              rawValue:
                memberValue,

              profile:
                profile ||
                null,
            };
          }
        ),
      [
        membersList,
        teamMembers,
      ]
    );

  // ==========================================================
  // PROJECT METRICS
  // ==========================================================

  const completedCount =
    useMemo(
      () =>
        tasks.filter(
          (
            task
          ) =>
            isTaskComplete(
              task.status
            )
        ).length,
      [
        tasks,
      ]
    );

  const incompleteTasks =
    useMemo(
      () =>
        tasks.filter(
          (
            task
          ) =>
            !isTaskComplete(
              task.status
            )
        ),
      [
        tasks,
      ]
    );

  const progress =
    useMemo(
      () => {
        if (
          !tasks.length
        ) {
          return 0;
        }

        return Math.round(
          (
            completedCount /
            tasks.length
          ) * 100
        );
      },
      [
        completedCount,
        tasks.length,
      ]
    );

  const unassignedCount =
    useMemo(
      () =>
        tasks.filter(
          (
            task
          ) =>
            !task.assigned_to
        ).length,
      [
        tasks,
      ]
    );

  const workloadByUser =
    useMemo(
      () => {
        const map:
          Record<
            string,
            number
          > = {};

        tasks.forEach(
          (
            task
          ) => {
            if (
              !task.assigned_to
            ) {
              return;
            }

            map[
              task.assigned_to
            ] =
              (
                map[
                  task.assigned_to
                ] || 0
              ) + 1;
          }
        );

        return map;
      },
      [
        tasks,
      ]
    );

  const leastBusyUser =
    useMemo(
      () => {
        if (
          !teamMembers.length
        ) {
          return null;
        }

        return teamMembers.reduce(
          (
            best,
            member
          ) => {
            if (
              !best
            ) {
              return member;
            }

            const bestLoad =
              workloadByUser[
                best.id
              ] || 0;

            const currentLoad =
              workloadByUser[
                member.id
              ] || 0;

            return currentLoad <
              bestLoad
              ? member
              : best;
          },
          null as
            | TeamMember
            | null
        );
      },
      [
        teamMembers,
        workloadByUser,
      ]
    );

  const remainingDays =
    useMemo(
      () =>
        daysUntil(
          project?.due_date
        ),
      [
        project?.due_date,
      ]
    );

  const projectHealthy =
    useMemo(
      () =>
        [
          "good",
          "stable",
          "healthy",
        ].includes(
          String(
            project?.health ||
              ""
          ).toLowerCase()
        ),
      [
        project?.health,
      ]
    );

  const statusLabel =
    useMemo(
      () => {
        const status =
          String(
            project?.status ||
              "live"
          ).toLowerCase();

        if (
          [
            "completed",
            "done",
          ].includes(
            status
          )
        ) {
          return "Completed";
        }

        if (
          status ===
          "paused"
        ) {
          return "Paused";
        }

        if (
          status ===
          "archived"
        ) {
          return "Archived";
        }

        return "In Progress";
      },
      [
        project?.status,
      ]
    );

  // ==========================================================
  // FINANCIAL METRICS
  // ==========================================================

  const quotedTotal =
    useMemo(
      () =>
        projectQuotes.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
                0
            ),
          0
        ),
      [
        projectQuotes,
      ]
    );

  const invoicedTotal =
    useMemo(
      () =>
        projectInvoices.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
                0
            ),
          0
        ),
      [
        projectInvoices,
      ]
    );

  const paidTotal =
    useMemo(
      () =>
        projectInvoices
          .filter(
            (
              invoice
            ) =>
              String(
                invoice.status ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              "paid"
          )
          .reduce(
            (
              total,
              invoice
            ) =>
              total +
              Number(
                invoice.amount ||
                  0
              ),
            0
          ),
      [
        projectInvoices,
      ]
    );

  const expensesTotal =
    useMemo(
      () =>
        projectExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            Number(
              expense.amount ||
                0
            ),
          0
        ),
      [
        projectExpenses,
      ]
    );

  const outstandingTotal =
    Math.max(
      invoicedTotal -
        paidTotal,
      0
    );

  const commercialValue =
    quotedTotal >
    0
      ? quotedTotal
      : Number(
          project?.budget ||
            0
        );

  const projectedProfit =
    commercialValue -
    expensesTotal;

  const budgetRemaining =
    Number(
      project?.budget ||
        0
    ) -
    expensesTotal;

  // ==========================================================
  // INVOICE TOTALS
  // ==========================================================

  const invoiceNetTotal =
    useMemo(
      () =>
        invoiceLineItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.qty ||
                0
            ) *
              Number(
                item.price ||
                  0
              ),
          0
        ),
      [
        invoiceLineItems,
      ]
    );

  const invoiceVatTotal =
    invoiceNetTotal *
    0.2;

  const invoiceGrandTotal =
    invoiceNetTotal +
    invoiceVatTotal;

  // ==========================================================
  // LOAD PROJECT DATA
  // ==========================================================

  const loadProjectData =
    useCallback(
      async () => {
        if (
          !projectId
        ) {
          return;
        }

        setLoading(
          true
        );

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
            toast.error(
              "Unable to authenticate"
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
            profileError ||
            !profile?.organisation_id
          ) {
            console.error(
              "Profile error:",
              profileError
            );

            toast.error(
              "No organisation linked to account"
            );

            return;
          }

          const orgId =
            profile.organisation_id;

          setOrganisationId(
            orgId
          );

          // PROJECT

          const {
            data:
              projectData,
            error:
              projectError,
          } =
            await supabase
              .from(
                "projects"
              )
              .select("*")
              .eq(
                "id",
                projectId
              )
              .eq(
                "organisation_id",
                orgId
              )
              .maybeSingle();

          if (
            projectError
          ) {
            console.error(
              "Project error:",
              projectError
            );

            toast.error(
              "Failed to load project"
            );

            return;
          }

          if (
            !projectData
          ) {
            setProject(
              null
            );

            return;
          }

          setProject(
            projectData
          );

          // CUSTOMERS

          const {
            data:
              customerRows,
          } =
            await supabase
              .from(
                "customers"
              )
              .select(
                "id, name, company, email"
              )
              .eq(
                "organisation_id",
                orgId
              )
              .order(
                "name",
                {
                  ascending:
                    true,
                }
              );

          const safeCustomers =
            (
              customerRows ||
              []
            ) as Customer[];

          setCustomers(
            safeCustomers
          );

          setCustomer(
            safeCustomers.find(
              (
                item
              ) =>
                item.id ===
                projectData.customer_id
            ) ||
              null
          );

          // MEMBERS

          await loadOrganisationMembers(
            orgId
          );

          // PROJECT RELATED TABLES

          const [
            tasksResult,
            quotesResult,
            invoicesResult,
            expensesResult,
            notesResult,
            subProjectsResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "tasks"
                )
                .select("*")
                .eq(
                  "project_id",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
                )
                .is(
                  "deleted_at",
                  null
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      true,
                  }
                ),

              supabase
                .from(
                  "quotes"
                )
                .select("*")
                .eq(
                  "project_id",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
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
                  "invoices"
                )
                .select("*")
                .eq(
                  "project_id",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
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
                  "expenses"
                )
                .select("*")
                .eq(
                  "project_id",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),

              /*
               * Your notes table uses a TEXT "project" column,
               * not project_id.
               */
              supabase
                .from(
                  "notes"
                )
                .select("*")
                .eq(
                  "project",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),

              /*
               * You now have parent_project_id, so use the
               * proper relationship instead of the old marker.
               */
              supabase
                .from(
                  "projects"
                )
                .select("*")
                .eq(
                  "parent_project_id",
                  projectId
                )
                .eq(
                  "organisation_id",
                  orgId
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
            ]);

          setTasks(
            tasksResult.data ||
              []
          );

          setProjectQuotes(
            quotesResult.data ||
              []
          );

          setProjectInvoices(
            invoicesResult.data ||
              []
          );

          setProjectExpenses(
            expensesResult.data ||
              []
          );

          setProjectNotes(
            notesResult.data ||
              []
          );

          setSubProjects(
            subProjectsResult.data ||
              []
          );

          // COMMENTS

          const taskIds =
            (
              tasksResult.data ||
              []
            ).map(
              (
                task: any
              ) =>
                task.id
            );

          if (
            taskIds.length
          ) {
            const {
              data:
                commentRows,
            } =
              await supabase
                .from(
                  "task_comments"
                )
                .select("*")
                .in(
                  "task_id",
                  taskIds
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      true,
                  }
                );

            setComments(
              commentRows ||
                []
            );
          } else {
            setComments(
              []
            );
          }

          // FILES

          try {
            const {
              data:
                storageRows,
              error:
                storageError,
            } =
              await supabase.storage
                .from(
                  "project-files"
                )
                .list(
                  `${orgId}/${projectId}`,
                  {
                    sortBy: {
                      column:
                        "created_at",

                      order:
                        "desc",
                    },
                  }
                );

            if (
              storageError
            ) {
              console.warn(
                "Project files unavailable:",
                storageError.message
              );

              setProjectFiles(
                []
              );
            } else {
              const mapped =
                (
                  storageRows ||
                  []
                )
                  .filter(
                    (
                      item
                    ) =>
                      item.name !==
                      ".emptyFolderPlaceholder"
                  )
                  .map(
                    (
                      item
                    ) => {
                      const path =
                        `${orgId}/${projectId}/${item.name}`;

                      const {
                        data:
                          urlData,
                      } =
                        supabase.storage
                          .from(
                            "project-files"
                          )
                          .getPublicUrl(
                            path
                          );

                      return {
                        id:
                          item.id ||
                          path,

                        name:
                          item.name,

                        path,

                        publicUrl:
                          urlData.publicUrl,

                        created_at:
                          item.created_at ||
                          null,

                        size:
                          item.metadata
                            ?.size ||
                          null,
                      };
                    }
                  );

              setProjectFiles(
                mapped
              );
            }
          } catch (
            storageError
          ) {
            console.warn(
              "Project storage load failed:",
              storageError
            );

            setProjectFiles(
              []
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Project load failed:",
            error
          );

          toast.error(
            "Unable to load project"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        projectId,
        supabase,
        loadOrganisationMembers,
      ]
    );

  useEffect(() => {
    void loadProjectData();
  }, [
    loadProjectData,
  ]);

  // ==========================================================
  // SMART ASSIGNEE
  // ==========================================================

  useEffect(() => {
    if (
      assigneeInitialised
    ) {
      return;
    }

    if (
      leastBusyUser?.id
    ) {
      setTaskAssignee(
        leastBusyUser.id
      );

      setAssigneeInitialised(
        true
      );
    }
  }, [
    leastBusyUser,
    assigneeInitialised,
  ]);

  // ==========================================================
  // TIMELINE
  //
  // IMPORTANT FIX:
  // project can be NULL during the initial render.
  // ==========================================================

  const timelineEvents =
    useMemo<
      TimelineEvent[]
    >(
      () => {
        /*
         * Hooks execute before the loading/not-found return
         * further down the component.
         *
         * This guard fixes:
         *
         * Cannot read properties of null (reading 'created_at')
         */
        if (
          !project
        ) {
          return [];
        }

        const items:
          TimelineEvent[] =
          [];

        if (
          project.created_at
        ) {
          items.push({
            id:
              "project-created",

            type:
              "Project",

            title:
              "Project created",

            description:
              project.name ||
              "Project created",

            date:
              project.created_at,
          });
        }

        tasks.forEach(
          (
            task
          ) => {
            const date =
              task.updated_at ||
              task.created_at;

            if (
              !date
            ) {
              return;
            }

            items.push({
              id:
                `task-${task.id}`,

              type:
                "Task",

              title:
                task.title ||
                "Task",

              description:
                isTaskComplete(
                  task.status
                )
                  ? "Task completed"
                  : task.description ||
                    "Task added",

              date,
            });
          }
        );

        projectNotes.forEach(
          (
            note
          ) => {
            const date =
              note.updated_at ||
              note.created_at;

            if (
              !date
            ) {
              return;
            }

            items.push({
              id:
                `note-${note.id}`,

              type:
                "Note",

              title:
                note.title ||
                "Project note",

              description:
                note.content,

              date,
            });
          }
        );

        projectInvoices.forEach(
          (
            invoice
          ) => {
            const date =
              invoice.updated_at ||
              invoice.created_at;

            if (
              !date
            ) {
              return;
            }

            items.push({
              id:
                `invoice-${invoice.id}`,

              type:
                "Invoice",

              title:
                `${formatCurrency(
                  invoice.amount
                )} invoice`,

              description:
                invoice.status ||
                "Invoice created",

              date,
            });
          }
        );

        projectQuotes.forEach(
          (
            quote
          ) => {
            if (
              !quote.created_at
            ) {
              return;
            }

            items.push({
              id:
                `quote-${quote.id}`,

              type:
                "Quote",

              title:
                `${formatCurrency(
                  quote.amount
                )} quote`,

              description:
                quote.status ||
                "Quote created",

              date:
                quote.created_at,
            });
          }
        );

        projectExpenses.forEach(
          (
            expense
          ) => {
            const date =
              expense.created_at ||
              expense.date;

            if (
              !date
            ) {
              return;
            }

            items.push({
              id:
                `expense-${expense.id}`,

              type:
                "Expense",

              title:
                expense.description ||
                "Project expense",

              description:
                formatCurrency(
                  expense.amount
                ),

              date,
            });
          }
        );

        projectFiles.forEach(
          (
            file
          ) => {
            if (
              !file.created_at
            ) {
              return;
            }

            items.push({
              id:
                `file-${file.id}`,

              type:
                "File",

              title:
                file.name.replace(
                  /^\d+-/,
                  ""
                ),

              description:
                "Uploaded to project",

              date:
                file.created_at,
            });
          }
        );

        return items.sort(
          (
            first,
            second
          ) =>
            new Date(
              second.date
            ).getTime() -
            new Date(
              first.date
            ).getTime()
        );
      },
      [
        project,
        tasks,
        projectNotes,
        projectInvoices,
        projectQuotes,
        projectExpenses,
        projectFiles,
      ]
    );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summaryText =
    useMemo(
      () => {
        if (
          !project
        ) {
          return "";
        }

        let text =
          "";

        if (
          tasks.length ===
          0
        ) {
          text =
            "No tasks have been added yet.";

          if (
            remainingDays !==
              null &&
            remainingDays <
              0
          ) {
            text =
              `This project is ${Math.abs(
                remainingDays
              )} ${
                Math.abs(
                  remainingDays
                ) ===
                1
                  ? "day"
                  : "days"
              } overdue. No tasks have been added yet.`;
          } else if (
            remainingDays ===
            0
          ) {
            text =
              "This project is due today. No tasks have been added yet.";
          } else if (
            remainingDays !==
            null
          ) {
            text =
              `This project has ${remainingDays} ${
                remainingDays ===
                1
                  ? "day"
                  : "days"
              } remaining. Add tasks to start tracking progress automatically.`;
          }
        } else {
          text =
            `This project is ${progress}% complete with ${incompleteTasks.length} ${
              incompleteTasks.length ===
              1
                ? "task"
                : "tasks"
            } remaining.`;

          if (
            remainingDays !==
            null
          ) {
            if (
              remainingDays <
              0
            ) {
              text +=
                ` The deadline passed ${Math.abs(
                  remainingDays
                )} ${
                  Math.abs(
                    remainingDays
                  ) ===
                  1
                    ? "day"
                    : "days"
                } ago.`;
            } else if (
              remainingDays ===
              0
            ) {
              text +=
                " The project is due today.";
            } else {
              text +=
                ` The deadline is ${remainingDays} ${
                  remainingDays ===
                  1
                    ? "day"
                    : "days"
                } away.`;
            }
          }

          if (
            unassignedCount >
            0
          ) {
            text +=
              ` ${unassignedCount} ${
                unassignedCount ===
                1
                  ? "task is"
                  : "tasks are"
              } currently unassigned.`;
          }
        }

        if (
          outstandingTotal >
          0
        ) {
          text +=
            ` ${formatCurrency(
              outstandingTotal
            )} is currently outstanding.`;
        }

        return text;
      },
      [
        project,
        tasks.length,
        progress,
        incompleteTasks.length,
        remainingDays,
        unassignedCount,
        outstandingTotal,
      ]
    );

  // ==========================================================
  // TASK ACTIONS
  // ==========================================================

  const addTask =
    async () => {
      if (
        !taskInput.trim() ||
        !projectId ||
        !organisationId ||
        !currentUserId
      ) {
        return;
      }

      const validAssignee =
        taskAssignee &&
        teamMembers.some(
          (
            member
          ) =>
            member.id ===
            taskAssignee
        )
          ? taskAssignee
          : null;

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .insert({
            project_id:
              projectId,

            title:
              taskInput.trim(),

            status:
              "todo",

            organisation_id:
              organisationId,

            user_id:
              currentUserId,

            assigned_to:
              validAssignee,

            customer_id:
              project?.customer_id ||
              null,
          })
          .select("*")
          .single();

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setTasks(
        (
          previous
        ) => [
          ...previous,
          data,
        ]
      );

      setTaskInput(
        ""
      );

      toast.success(
        "Task created"
      );
    };

  const toggleTaskComplete =
    async (
      task: any
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      const status =
        isTaskComplete(
          task.status
        )
          ? "todo"
          : "done";

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .update({
            status,
          })
          .eq(
            "id",
            task.id
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setTasks(
        (
          previous
        ) =>
          previous.map(
            (
              item
            ) =>
              item.id ===
              task.id
                ? {
                    ...item,

                    status,

                    updated_at:
                      new Date().toISOString(),
                  }
                : item
          )
      );
    };

  const deleteTask =
    async (
      taskId: string
    ) => {
      if (
        !organisationId
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .delete()
          .eq(
            "id",
            taskId
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setTasks(
        (
          previous
        ) =>
          previous.filter(
            (
              task
            ) =>
              task.id !==
              taskId
          )
      );

      setComments(
        (
          previous
        ) =>
          previous.filter(
            (
              comment
            ) =>
              comment.task_id !==
              taskId
          )
      );

      toast.success(
        "Task removed"
      );
    };

  const addComment =
    async (
      taskId: string
    ) => {
      const text =
        commentInput[
          taskId
        ]?.trim();

      if (
        !text ||
        !currentUserId ||
        !organisationId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "task_comments"
          )
          .insert({
            task_id:
              taskId,

            organisation_id:
              organisationId,

            user_id:
              currentUserId,

            content:
              text,
          })
          .select("*")
          .single();

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setComments(
        (
          previous
        ) => [
          ...previous,
          data,
        ]
      );

      setCommentInput(
        (
          previous
        ) => ({
          ...previous,

          [taskId]:
            "",
        })
      );

      toast.success(
        "Comment added"
      );
    };

  // ==========================================================
  // NOTES
  // ==========================================================

  const addProjectNote =
    async () => {
      if (
        !noteContent.trim() ||
        !organisationId ||
        !currentUserId ||
        !projectId
      ) {
        return;
      }

      setNoteSaving(
        true
      );

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notes"
            )
            .insert({
              user_id:
                currentUserId,

              organisation_id:
                organisationId,

              project:
                projectId,

              title:
                noteTitle.trim() ||
                "Project note",

              content:
                noteContent.trim(),

              type:
                "project",

              category:
                "Project",

              status:
                "active",

              completed:
                false,
            })
            .select("*")
            .single();

        if (
          error
        ) {
          throw error;
        }

        setProjectNotes(
          (
            previous
          ) => [
            data,
            ...previous,
          ]
        );

        setNoteTitle(
          ""
        );

        setNoteContent(
          ""
        );

        toast.success(
          "Note added"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Unable to save note"
        );
      } finally {
        setNoteSaving(
          false
        );
      }
    };

  const deleteProjectNote =
    async (
      noteId: string
    ) => {
      const {
        error,
      } =
        await supabase
          .from(
            "notes"
          )
          .delete()
          .eq(
            "id",
            noteId
          );

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setProjectNotes(
        (
          previous
        ) =>
          previous.filter(
            (
              note
            ) =>
              note.id !==
              noteId
          )
      );

      toast.success(
        "Note removed"
      );
    };

  // ==========================================================
  // FILES
  // ==========================================================

  const uploadProjectFile =
    async (
      file: File
    ) => {
      if (
        !organisationId ||
        !projectId
      ) {
        return;
      }

      setFileUploading(
        true
      );

      try {
        const safeName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        const fileName =
          `${Date.now()}-${safeName}`;

        const path =
          `${organisationId}/${projectId}/${fileName}`;

        const {
          error,
        } =
          await supabase.storage
            .from(
              "project-files"
            )
            .upload(
              path,
              file,
              {
                upsert:
                  false,
              }
            );

        if (
          error
        ) {
          throw error;
        }

        const {
          data:
            publicData,
        } =
          supabase.storage
            .from(
              "project-files"
            )
            .getPublicUrl(
              path
            );

        setProjectFiles(
          (
            previous
          ) => [
            {
              id:
                path,

              name:
                fileName,

              path,

              publicUrl:
                publicData.publicUrl,

              created_at:
                new Date().toISOString(),

              size:
                file.size,
            },
            ...previous,
          ]
        );

        toast.success(
          "File uploaded"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Unable to upload file"
        );
      } finally {
        setFileUploading(
          false
        );
      }
    };

  const deleteProjectFile =
    async (
      file: ProjectFile
    ) => {
      const {
        error,
      } =
        await supabase.storage
          .from(
            "project-files"
          )
          .remove([
            file.path,
          ]);

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setProjectFiles(
        (
          previous
        ) =>
          previous.filter(
            (
              item
            ) =>
              item.path !==
              file.path
          )
      );

      toast.success(
        "File deleted"
      );
    };

  // ==========================================================
  // FINANCE REFRESH
  // ==========================================================

  const refreshFinance =
    async () => {
      if (
        !projectId ||
        !organisationId
      ) {
        return;
      }

      const [
        quotes,
        invoices,
        expenses,
      ] =
        await Promise.all([
          supabase
            .from(
              "quotes"
            )
            .select("*")
            .eq(
              "project_id",
              projectId
            )
            .eq(
              "organisation_id",
              organisationId
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
              "invoices"
            )
            .select("*")
            .eq(
              "project_id",
              projectId
            )
            .eq(
              "organisation_id",
              organisationId
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
              "expenses"
            )
            .select("*")
            .eq(
              "project_id",
              projectId
            )
            .eq(
              "organisation_id",
              organisationId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            ),
        ]);

      setProjectQuotes(
        quotes.data ||
          []
      );

      setProjectInvoices(
        invoices.data ||
          []
      );

      setProjectExpenses(
        expenses.data ||
          []
      );
    };

  const openInvoiceModal =
    (
      type:
        InvoiceQuoteDocType
    ) => {
      setInvoiceDocType(
        type
      );

      setInvoiceForm({
        customerId:
          project?.customer_id ||
          "",

        projectId:
          projectId ||
          "",

        newClientName:
          "",

        dueDate:
          "",
      });

      setInvoiceLineItems([
        {
          id:
            Date.now(),

          desc:
            project?.name ||
            "",

          qty:
            1,

          price:
            0,
        },
      ]);

      setShowInvoiceModal(
        true
      );
    };

  const submitInvoiceQuote =
    async () => {
      if (
        invoiceSubmitting ||
        !organisationId ||
        !projectId
      ) {
        return;
      }

      let customerId =
        invoiceForm.customerId ||
        project?.customer_id ||
        null;

      if (
        !customerId
      ) {
        toast.error(
          "Link a client to this project first"
        );

        return;
      }

      if (
        invoiceDocType ===
          "Invoice" &&
        !invoiceForm.dueDate
      ) {
        toast.error(
          "Choose an invoice due date"
        );

        return;
      }

      if (
        invoiceLineItems.some(
          (
            item
          ) =>
            !item.desc.trim() ||
            item.qty <=
              0 ||
            item.price <
              0
        )
      ) {
        toast.error(
          "Complete all invoice items"
        );

        return;
      }

      setInvoiceSubmitting(
        true
      );

      try {
        const selectedCustomer =
          customers.find(
            (
              item
            ) =>
              item.id ===
              customerId
          );

        const clientName =
          getCustomerDisplayName(
            selectedCustomer ||
              customer
          );

        const items =
          invoiceLineItems.map(
            (
              item
            ) => ({
              description:
                item.desc.trim(),

              qty:
                Number(
                  item.qty
                ),

              price:
                Number(
                  item.price
                ),

              total:
                Number(
                  item.qty
                ) *
                Number(
                  item.price
                ),
            })
          );

        if (
          invoiceDocType ===
          "Invoice"
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                "invoices"
              )
              .insert({
                customer_id:
                  customerId,

                project_id:
                  projectId,

                organisation_id:
                  organisationId,

                amount:
                  invoiceGrandTotal,

                tax:
                  invoiceVatTotal,

                status:
                  "pending",

                type:
                  "invoice",

                doc_type:
                  "Invoice",

                items,

                due_date:
                  invoiceForm.dueDate,

                recurring:
                  false,

                data: {
                  client_name:
                    clientName,

                  net_total:
                    invoiceNetTotal,

                  vat_total:
                    invoiceVatTotal,

                  grand_total:
                    invoiceGrandTotal,

                  project_id:
                    projectId,
                },
              });

          if (
            error
          ) {
            throw error;
          }

          toast.success(
            "Invoice created"
          );
        } else {
          const {
            error,
          } =
            await supabase
              .from(
                "quotes"
              )
              .insert({
                customer_id:
                  customerId,

                project_id:
                  projectId,

                organisation_id:
                  organisationId,

                client_name:
                  clientName,

                description:
                  items
                    .map(
                      (
                        item
                      ) =>
                        `${item.description} × ${item.qty}`
                    )
                    .join(
                      ", "
                    ),

                amount:
                  invoiceGrandTotal,

                date:
                  new Date()
                    .toISOString()
                    .slice(
                      0,
                      10
                    ),

                status:
                  "draft",
              });

          if (
            error
          ) {
            throw error;
          }

          toast.success(
            "Quote created"
          );
        }

        await refreshFinance();

        setShowInvoiceModal(
          false
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            `Unable to create ${invoiceDocType.toLowerCase()}`
        );
      } finally {
        setInvoiceSubmitting(
          false
        );
      }
    };

  const openExpenseModal =
    () => {
      setExpenseForm({
        description:
          "",

        amount:
          "",

        date:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            ),

        status:
          "pending",

        customerId:
          project?.customer_id ||
          "",

        projectId:
          projectId ||
          "",
      });

      setShowExpenseModal(
        true
      );
    };

  const submitExpense =
    async () => {
      if (
        expenseSubmitting ||
        !organisationId ||
        !projectId
      ) {
        return;
      }

      if (
        !expenseForm.description.trim() ||
        Number(
          expenseForm.amount
        ) <=
          0 ||
        !expenseForm.date
      ) {
        toast.error(
          "Complete the expense details"
        );

        return;
      }

      setExpenseSubmitting(
        true
      );

      try {
        const selected =
          customers.find(
            (
              item
            ) =>
              item.id ===
              expenseForm.customerId
          );

        const {
          error,
        } =
          await supabase
            .from(
              "expenses"
            )
            .insert({
              organisation_id:
                organisationId,

              customer_id:
                expenseForm.customerId ||
                project?.customer_id ||
                null,

              project_id:
                projectId,

              client_name:
                getCustomerDisplayName(
                  selected ||
                    customer
                ),

              description:
                expenseForm.description.trim(),

              amount:
                Number(
                  expenseForm.amount
                ),

              date:
                expenseForm.date,

              status:
                expenseForm.status ||
                "pending",
            });

        if (
          error
        ) {
          throw error;
        }

        await refreshFinance();

        setShowExpenseModal(
          false
        );

        toast.success(
          "Expense logged"
        );
      } catch (
        error: any
      ) {
        toast.error(
          error?.message ||
            "Unable to log expense"
        );
      } finally {
        setExpenseSubmitting(
          false
        );
      }
    };

  // ==========================================================
  // MEMBER ACTIONS
  // ==========================================================

  const refreshProject =
    async () => {
      if (
        !projectId ||
        !organisationId
      ) {
        return;
      }

      const {
        data,
      } =
        await supabase
          .from(
            "projects"
          )
          .select("*")
          .eq(
            "id",
            projectId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .maybeSingle();

      if (
        data
      ) {
        setProject(
          data
        );
      }
    };

  const addExistingOrganisationMemberToProject =
    async (
      email: string
    ) => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "add_project_member_by_email",
          {
            p_project_id:
              projectId,

            p_email:
              email,
          }
        );

      if (
        error
      ) {
        throw error;
      }

      return data as
        AddProjectMemberResult;
    };

  const inviteProjectMember =
    async () => {
      const email =
        inviteEmail
          .trim()
          .toLowerCase();

      if (
        !email ||
        !organisationId ||
        !projectId
      ) {
        return;
      }

      setIsInvitingMember(
        true
      );

      setMemberInviteFeedback(
        null
      );

      try {
        const existing =
          teamMembers.find(
            (
              member
            ) =>
              String(
                member.email ||
                  ""
              )
                .toLowerCase()
                .trim() ===
              email
          );

        if (
          existing
        ) {
          const result =
            await addExistingOrganisationMemberToProject(
              email
            );

          await refreshProject();

          setMemberInviteFeedback({
            type:
              result?.already_member
                ? "info"
                : "success",

            title:
              result?.already_member
                ? "Already added"
                : "Member added",

            message:
              result?.already_member
                ? "This person is already on this project."
                : "The organisation member has been added to this project.",
          });

          setInviteEmail(
            ""
          );

          return;
        }

        const response =
          await fetch(
            "/api/invitations/send",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email,
                  organisationId,
                  projectId,
                  type:
                    "invite_to_organisation",
                }),
            }
          );

        const result =
          (
            await response
              .json()
              .catch(
                () => null
              )
          ) as
            | InvitationApiResult
            | null;

        if (
          !response.ok
        ) {
          throw new Error(
            result?.message ||
              result?.error ||
              "Invitation failed"
          );
        }

        await loadOrganisationMembers(
          organisationId
        );

        setMemberInviteFeedback({
          type:
            "success",

          title:
            "Invitation sent",

          message:
            `An invitation has been sent to ${email}.`,
        });

        toast.success(
          "Invitation sent"
        );
      } catch (
        error: any
      ) {
        const feedback =
          getInviteErrorMessage(
            error?.message
          );

        setMemberInviteFeedback(
          feedback
        );

        toast.error(
          feedback.title
        );
      } finally {
        setIsInvitingMember(
          false
        );
      }
    };

  const removeProjectMember =
    async (
      memberValue: string
    ) => {
      if (
        !projectId ||
        !organisationId
      ) {
        return;
      }

      const next =
        membersList.filter(
          (
            member
          ) =>
            member !==
            memberValue
        );

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .update({
            members:
              next,
          })
          .eq(
            "id",
            projectId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select("*")
          .single();

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setProject(
        data
      );

      toast.success(
        "Project member removed"
      );
    };

  // ==========================================================
  // SUB PROJECT
  // ==========================================================

  const addSubProject =
    async () => {
      if (
        !subProjectName.trim() ||
        !organisationId ||
        !currentUserId ||
        !projectId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .insert({
            name:
              subProjectName.trim(),

            description:
              subProjectSummary.trim() ||
              null,

            objective_summary:
              subProjectSummary.trim() ||
              null,

            category:
              "Sub-project",

            status:
              "live",

            priority:
              "Medium",

            health:
              "good",

            members:
              [],

            budget:
              0,

            start_date:
              new Date()
                .toISOString()
                .slice(
                  0,
                  10
                ),

            due_date:
              subProjectDueDate ||
              null,

            parent_project_id:
              projectId,

            customer_id:
              project?.customer_id ||
              null,

            organisation_id:
              organisationId,

            user_id:
              currentUserId,
          })
          .select("*")
          .single();

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setSubProjects(
        (
          previous
        ) => [
          data,
          ...previous,
        ]
      );

      setSubProjectName(
        ""
      );

      setSubProjectSummary(
        ""
      );

      setSubProjectDueDate(
        ""
      );

      toast.success(
        "Sub-project created"
      );
    };

  // ==========================================================
  // UPDATE PROJECT
  // ==========================================================

  const updateProject =
    async (
      updates: Record<
        string,
        any
      >
    ) => {
      if (
        !projectId ||
        !organisationId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .update(
            updates
          )
          .eq(
            "id",
            projectId
          )
          .eq(
            "organisation_id",
            organisationId
          )
          .select("*")
          .single();

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      setProject(
        data
      );

      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          "customer_id"
        )
      ) {
        setCustomer(
          customers.find(
            (
              item
            ) =>
              item.id ===
              updates.customer_id
          ) ||
            null
        );
      }

      toast.success(
        "Project updated"
      );
    };

  const deleteProject =
    async () => {
      if (
        !window.confirm(
          "Delete this project permanently? This cannot be undone."
        ) ||
        !organisationId ||
        !projectId
      ) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from(
            "projects"
          )
          .delete()
          .eq(
            "id",
            projectId
          )
          .eq(
            "organisation_id",
            organisationId
          );

      if (
        error
      ) {
        toast.error(
          error.message
        );

        return;
      }

      router.push(
        "/projects"
      );
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-[#a9b897]" />

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
            Loading Project
          </p>
        </div>
      </div>
    );
  }

  if (
    !project
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto text-stone-300" />

          <h1 className="mt-4 font-serif text-3xl italic">
            Project not found
          </h1>

          <Link
            href="/projects"
            className="mt-6 inline-flex rounded-xl bg-stone-900 px-5 py-3 text-xs text-white"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // TABS
  // ==========================================================

  const tabs: {
    label:
      ProjectTab;

    icon:
      any;
  }[] = [
    {
      label:
        "Overview",

      icon:
        LayoutDashboard,
    },

    {
      label:
        "Tasks",

      icon:
        ListTodo,
    },

    {
      label:
        "Timeline",

      icon:
        Clock,
    },

    {
      label:
        "Money",

      icon:
        CircleDollarSign,
    },

    {
      label:
        "Files",

      icon:
        Folder,
    },

    {
      label:
        "Notes",

      icon:
        MessageSquareText,
    },

    {
      label:
        "Settings",

      icon:
        Settings,
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 pb-24 selection:bg-[#a9b897] selection:text-white">
      {/* ======================================================
          TOP NAV
      ====================================================== */}

      <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/projects"
            className="flex items-center gap-3 text-stone-500"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
              <ChevronLeft
                size={
                  15
                }
              />
            </div>

            <span className="hidden text-[9px] font-black uppercase tracking-[0.18em] sm:block">
              Clients & Projects
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                projectHealthy
                  ? "bg-[#a9b897]"
                  : "bg-amber-400"
              }`}
            />

            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-stone-400">
              {
                statusLabel
              }
            </span>
          </div>
        </div>
      </nav>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="mx-auto max-w-[1400px] px-4 pb-7 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              {customer && (
                <>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
                    <UserRound
                      size={
                        12
                      }
                    />

                    {getCustomerDisplayName(
                      customer
                    )}
                  </div>

                  <span className="text-stone-300">
                    •
                  </span>
                </>
              )}

              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
                <Hash
                  size={
                    12
                  }
                />

                {project.category ||
                  "Project"}
              </div>
            </div>

            <h1 className="max-w-4xl break-words font-serif text-5xl italic leading-none tracking-tight text-stone-800 sm:text-6xl lg:text-8xl">
              {
                project.name
              }
            </h1>

            {project.objective_summary && (
              <p className="mt-5 max-w-2xl text-sm leading-6 text-stone-500">
                {
                  project.objective_summary
                }
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {project.due_date && (
              <HeaderStat
                label="Deadline"
                value={formatDate(
                  project.due_date
                )}
              />
            )}

            <HeaderStat
              label="Progress"
              value={`${progress}%`}
            />
          </div>
        </div>
      </header>

      {/* ======================================================
          TAB NAV
      ====================================================== */}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex min-w-max gap-1 rounded-2xl border border-stone-200 bg-white p-1.5">
            {tabs.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                return (
                  <button
                    key={
                      tab.label
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.label
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] ${
                      activeTab ===
                      tab.label
                        ? "bg-stone-900 text-white"
                        : "text-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <Icon
                      size={
                        14
                      }
                    />

                    {
                      tab.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence
          mode="wait"
        >
          {/* ==================================================
              OVERVIEW
          ================================================== */}

          {activeTab ===
            "Overview" && (
            <motion.section
              key="overview"
              initial={{
                opacity:
                  0,

                y:
                  8,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,

                y:
                  -8,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#a9b897]/10 text-[#829473]">
                    <Sparkles
                      size={
                        18
                      }
                    />
                  </div>

                  <div>
                    <SectionEyebrow>
                      TOTS Project Summary
                    </SectionEyebrow>

                    <p className="mt-2 max-w-4xl text-lg leading-8 text-stone-700">
                      {
                        summaryText
                      }
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <SectionEyebrow>
                      Project Progress
                    </SectionEyebrow>

                    <p className="mt-2 font-serif text-4xl italic">
                      {
                        progress
                      }
                      %
                    </p>
                  </div>

                  <p className="text-xs text-stone-400">
                    {
                      completedCount
                    }{" "}
                    of{" "}
                    {
                      tasks.length
                    }{" "}
                    tasks complete
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[#a9b897]"
                    style={{
                      width:
                        `${progress}%`,
                    }}
                  />
                </div>
              </Panel>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard
                  icon={
                    ListTodo
                  }
                  value={String(
                    incompleteTasks.length
                  )}
                  label="Tasks Remaining"
                />

                <StatCard
                  icon={
                    Users
                  }
                  value={String(
                    projectMemberProfiles.length
                  )}
                  label="Project Team"
                />

                <StatCard
                  icon={
                    Calendar
                  }
                  value={formatShortDate(
                    project.due_date
                  )}
                  label="Deadline"
                />

                <StatCard
                  icon={
                    Banknote
                  }
                  value={formatCurrency(
                    project.budget
                  )}
                  label="Budget"
                />
              </div>

              <Panel>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <SectionEyebrow>
                      Quick Actions
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-2xl italic">
                      Run the project
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <QuickAction
                    icon={
                      Receipt
                    }
                    label="Create Invoice"
                    onClick={() =>
                      openInvoiceModal(
                        "Invoice"
                      )
                    }
                  />

                  <QuickAction
                    icon={
                      FileCheck2
                    }
                    label="Create Quote"
                    onClick={() =>
                      openInvoiceModal(
                        "Quote"
                      )
                    }
                  />

                  <QuickAction
                    icon={
                      CircleDollarSign
                    }
                    label="Log Expense"
                    onClick={
                      openExpenseModal
                    }
                  />

                  <QuickAction
                    icon={
                      MessageSquareText
                    }
                    label="Add Note"
                    onClick={() =>
                      setActiveTab(
                        "Notes"
                      )
                    }
                  />
                </div>
              </Panel>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Panel className="lg:col-span-7">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Up Next
                      </SectionEyebrow>

                      <h2 className="mt-1 font-serif text-2xl italic">
                        Current Tasks
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setActiveTab(
                          "Tasks"
                        )
                      }
                      className="text-xs font-semibold text-[#829473]"
                    >
                      View all
                    </button>
                  </div>

                  {!incompleteTasks.length ? (
                    <EmptyMessage>
                      Nothing outstanding.
                    </EmptyMessage>
                  ) : (
                    <div className="space-y-2">
                      {incompleteTasks
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            task
                          ) => {
                            const assigned =
                              teamMembers.find(
                                (
                                  member
                                ) =>
                                  member.id ===
                                  task.assigned_to
                              );

                            return (
                              <button
                                key={
                                  task.id
                                }
                                onClick={() =>
                                  setActiveTab(
                                    "Tasks"
                                  )
                                }
                                className="flex w-full items-center justify-between rounded-2xl bg-stone-50 p-4 text-left"
                              >
                                <div>
                                  <p className="text-sm font-semibold">
                                    {
                                      task.title
                                    }
                                  </p>

                                  <p className="mt-1 text-[10px] text-stone-400">
                                    {assigned
                                      ? getMemberDisplayName(
                                          assigned
                                        )
                                      : "Unassigned"}
                                  </p>
                                </div>

                                <ChevronRight
                                  size={
                                    15
                                  }
                                  className="text-stone-300"
                                />
                              </button>
                            );
                          }
                        )}
                    </div>
                  )}
                </Panel>

                <Panel className="lg:col-span-5">
                  <SectionEyebrow>
                    Project Details
                  </SectionEyebrow>

                  <div className="mt-6 space-y-4">
                    <DetailRow
                      label="Client"
                      value={getCustomerDisplayName(
                        customer
                      )}
                    />

                    <DetailRow
                      label="Status"
                      value={
                        statusLabel
                      }
                    />

                    <DetailRow
                      label="Start Date"
                      value={formatDate(
                        project.start_date
                      )}
                    />

                    <DetailRow
                      label="Deadline"
                      value={formatDate(
                        project.due_date
                      )}
                    />

                    <DetailRow
                      label="Budget"
                      value={formatCurrency(
                        project.budget
                      )}
                    />
                  </div>
                </Panel>
              </div>

              <Panel>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <SectionEyebrow>
                      Related Work
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-2xl italic">
                      Sub-projects
                    </h2>
                  </div>

                  <span className="text-xs text-stone-400">
                    {
                      subProjects.length
                    }
                  </span>
                </div>

                {!subProjects.length ? (
                  <EmptyMessage>
                    No sub-projects yet.
                  </EmptyMessage>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {subProjects.map(
                      (
                        sub
                      ) => (
                        <Link
                          key={
                            sub.id
                          }
                          href={`/projects/${sub.id}`}
                          className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                        >
                          <div>
                            <p className="font-semibold">
                              {
                                sub.name
                              }
                            </p>

                            <p className="mt-1 text-[10px] text-stone-400">
                              {sub.due_date
                                ? `Due ${formatDate(
                                    sub.due_date
                                  )}`
                                : "No deadline"}
                            </p>
                          </div>

                          <ArrowUpRight
                            size={
                              15
                            }
                          />
                        </Link>
                      )
                    )}
                  </div>
                )}
              </Panel>
            </motion.section>
          )}

          {/* ==================================================
              TASKS
          ================================================== */}

          {activeTab ===
            "Tasks" && (
            <motion.section
              key="tasks"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <SectionEyebrow>
                  Project Tasks
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  What needs done
                </h2>

                <div className="mt-8 flex flex-col gap-3 lg:flex-row">
                  <input
                    value={
                      taskInput
                    }
                    onChange={(
                      event
                    ) =>
                      setTaskInput(
                        event.target.value
                      )
                    }
                    placeholder="Add a task..."
                    className="flex-1 rounded-2xl border border-stone-100 bg-stone-50 p-4 text-sm outline-none"
                  />

                  <select
                    value={
                      taskAssignee
                    }
                    onChange={(
                      event
                    ) => {
                      setTaskAssignee(
                        event.target.value
                      );

                      setAssigneeInitialised(
                        true
                      );
                    }}
                    className="rounded-2xl border border-stone-100 bg-stone-50 p-4 text-xs"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {teamMembers.map(
                      (
                        member
                      ) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {getMemberDisplayName(
                            member
                          )}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    onClick={() =>
                      void addTask()
                    }
                    className="rounded-2xl bg-stone-900 px-6 py-4 text-[9px] font-black uppercase tracking-wider text-white"
                  >
                    Add Task
                  </button>
                </div>

                {leastBusyUser && (
                  <div className="mt-5 rounded-2xl bg-[#a9b897]/10 p-4 text-xs text-stone-600">
                    <strong>
                      TOTS suggestion:
                    </strong>{" "}
                    {getMemberDisplayName(
                      leastBusyUser
                    )}{" "}
                    currently has the lightest workload.
                  </div>
                )}

                <div className="mt-8 space-y-3">
                  {!tasks.length ? (
                    <EmptyMessage>
                      No tasks yet.
                    </EmptyMessage>
                  ) : (
                    tasks.map(
                      (
                        task
                      ) => {
                        const done =
                          isTaskComplete(
                            task.status
                          );

                        const assigned =
                          teamMembers.find(
                            (
                              member
                            ) =>
                              member.id ===
                              task.assigned_to
                          );

                        const taskComments =
                          comments.filter(
                            (
                              comment
                            ) =>
                              comment.task_id ===
                              task.id
                          );

                        const expanded =
                          expandedTaskId ===
                          task.id;

                        return (
                          <div
                            key={
                              task.id
                            }
                            className="overflow-hidden rounded-2xl border border-stone-100 bg-stone-50"
                          >
                            <div className="flex items-center justify-between gap-4 p-5">
                              <div className="flex items-start gap-4">
                                <button
                                  onClick={() =>
                                    void toggleTaskComplete(
                                      task
                                    )
                                  }
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 ${
                                    done
                                      ? "border-[#a9b897] bg-[#a9b897] text-white"
                                      : "border-stone-200 bg-white text-transparent"
                                  }`}
                                >
                                  <Check
                                    size={
                                      13
                                    }
                                  />
                                </button>

                                <div>
                                  <p
                                    className={`font-semibold ${
                                      done
                                        ? "text-stone-400 line-through"
                                        : "text-stone-700"
                                    }`}
                                  >
                                    {
                                      task.title
                                    }
                                  </p>

                                  <p className="mt-1 text-[10px] text-stone-400">
                                    {assigned
                                      ? `Assigned to ${getMemberDisplayName(
                                          assigned
                                        )}`
                                      : "Unassigned"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    setExpandedTaskId(
                                      expanded
                                        ? null
                                        : task.id
                                    )
                                  }
                                  className="rounded-xl border bg-white px-3 py-2 text-[8px] font-black uppercase"
                                >
                                  {expanded
                                    ? "Close"
                                    : "Details"}
                                </button>

                                <button
                                  onClick={() =>
                                    void deleteTask(
                                      task.id
                                    )
                                  }
                                  className="p-2 text-red-300"
                                >
                                  <Trash2
                                    size={
                                      14
                                    }
                                  />
                                </button>
                              </div>
                            </div>

                            {expanded && (
                              <div className="border-t bg-white p-5">
                                {task.description && (
                                  <p className="mb-5 text-sm leading-6 text-stone-600">
                                    {
                                      task.description
                                    }
                                  </p>
                                )}

                                <p className="mb-3 text-[8px] font-black uppercase tracking-wider text-stone-400">
                                  Comments
                                </p>

                                <div className="space-y-2">
                                  {taskComments.map(
                                    (
                                      comment
                                    ) => (
                                      <div
                                        key={
                                          comment.id
                                        }
                                        className="rounded-xl bg-stone-50 p-3 text-xs"
                                      >
                                        {
                                          comment.content
                                        }
                                      </div>
                                    )
                                  )}
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <input
                                    value={
                                      commentInput[
                                        task.id
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setCommentInput(
                                        (
                                          previous
                                        ) => ({
                                          ...previous,

                                          [task.id]:
                                            event.target.value,
                                        })
                                      )
                                    }
                                    placeholder="Add comment..."
                                    className="flex-1 rounded-xl border bg-stone-50 p-3 text-xs"
                                  />

                                  <button
                                    onClick={() =>
                                      void addComment(
                                        task.id
                                      )
                                    }
                                    className="rounded-xl bg-[#a9b897] px-4 text-xs text-white"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </Panel>
            </motion.section>
          )}

          {/* ==================================================
              TIMELINE
          ================================================== */}

          {activeTab ===
            "Timeline" && (
            <motion.section
              key="timeline"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <SectionEyebrow>
                  Timeline
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  Project journey
                </h2>

                <div className="mt-8 space-y-3">
                  {!timelineEvents.length ? (
                    <EmptyMessage>
                      No timeline activity yet.
                    </EmptyMessage>
                  ) : (
                    timelineEvents.map(
                      (
                        event
                      ) => (
                        <div
                          key={
                            event.id
                          }
                          className="rounded-2xl border border-stone-100 bg-stone-50 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-[#829473]">
                                {
                                  event.type
                                }
                              </p>

                              <p className="mt-2 font-semibold">
                                {
                                  event.title
                                }
                              </p>

                              {event.description && (
                                <p className="mt-2 text-xs leading-5 text-stone-500">
                                  {
                                    event.description
                                  }
                                </p>
                              )}
                            </div>

                            <span className="text-[10px] text-stone-400">
                              {formatDate(
                                event.date
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              </Panel>
            </motion.section>
          )}

          {/* ==================================================
              MONEY
          ================================================== */}

          {activeTab ===
            "Money" && (
            <motion.section
              key="money"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SectionEyebrow>
                      Project Money
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Financial overview
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <FinanceButton
                      label="Invoice"
                      onClick={() =>
                        openInvoiceModal(
                          "Invoice"
                        )
                      }
                    />

                    <FinanceButton
                      label="Quote"
                      onClick={() =>
                        openInvoiceModal(
                          "Quote"
                        )
                      }
                    />

                    <FinanceButton
                      label="Expense"
                      onClick={
                        openExpenseModal
                      }
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MoneyCard
                    label="Budget"
                    value={formatCurrency(
                      project.budget
                    )}
                  />

                  <MoneyCard
                    label="Quoted"
                    value={formatCurrency(
                      quotedTotal
                    )}
                  />

                  <MoneyCard
                    label="Invoiced"
                    value={formatCurrency(
                      invoicedTotal
                    )}
                  />

                  <MoneyCard
                    label="Paid"
                    value={formatCurrency(
                      paidTotal
                    )}
                  />

                  <MoneyCard
                    label="Outstanding"
                    value={formatCurrency(
                      outstandingTotal
                    )}
                  />

                  <MoneyCard
                    label="Expenses"
                    value={formatCurrency(
                      expensesTotal
                    )}
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.7rem] bg-stone-900 p-6 text-white">
                    <p className="text-[8px] font-black uppercase text-stone-400">
                      Projected Profit
                    </p>

                    <p className="mt-3 font-serif text-4xl italic">
                      {formatCurrency(
                        projectedProfit
                      )}
                    </p>
                  </div>

                  <div className="rounded-[1.7rem] bg-stone-100 p-6">
                    <p className="text-[8px] font-black uppercase text-stone-400">
                      Budget Remaining
                    </p>

                    <p className="mt-3 font-serif text-4xl italic">
                      {formatCurrency(
                        budgetRemaining
                      )}
                    </p>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-6 lg:grid-cols-3">
                <FinanceList
                  title="Invoices"
                  records={
                    projectInvoices
                  }
                  formatCurrency={
                    formatCurrency
                  }
                  formatDate={
                    formatDate
                  }
                />

                <FinanceList
                  title="Quotes"
                  records={
                    projectQuotes
                  }
                  formatCurrency={
                    formatCurrency
                  }
                  formatDate={
                    formatDate
                  }
                />

                <FinanceList
                  title="Expenses"
                  records={
                    projectExpenses
                  }
                  formatCurrency={
                    formatCurrency
                  }
                  formatDate={
                    formatDate
                  }
                />
              </div>
            </motion.section>
          )}

          {/* ==================================================
              FILES
          ================================================== */}

          {activeTab ===
            "Files" && (
            <motion.section
              key="files"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
            >
              <Panel>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionEyebrow>
                      Project Files
                    </SectionEyebrow>

                    <h2 className="mt-1 font-serif text-3xl italic">
                      Files & documents
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      fileUploading
                    }
                    className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase text-white"
                  >
                    {fileUploading ? (
                      <Loader2
                        size={
                          13
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <Upload
                        size={
                          13
                        }
                      />
                    )}

                    Upload
                  </button>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    hidden
                    onChange={(
                      event
                    ) => {
                      const file =
                        event.target.files?.[
                          0
                        ];

                      if (
                        file
                      ) {
                        void uploadProjectFile(
                          file
                        );
                      }

                      event.target.value =
                        "";
                    }}
                  />
                </div>

                <div className="mt-8">
                  {!projectFiles.length ? (
                    <div className="rounded-[2rem] border-2 border-dashed border-stone-200 bg-stone-50 p-14 text-center">
                      <Cloud className="mx-auto text-stone-200" />

                      <p className="mt-4 text-sm font-semibold">
                        No project files yet
                      </p>

                      <p className="mt-2 text-xs text-stone-400">
                        Upload documents, PDFs, briefs or client assets here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectFiles.map(
                        (
                          file
                        ) => (
                          <div
                            key={
                              file.id
                            }
                            className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                <Paperclip
                                  size={
                                    15
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {file.name.replace(
                                    /^\d+-/,
                                    ""
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] text-stone-400">
                                  {file.created_at
                                    ? formatDate(
                                        file.created_at
                                      )
                                    : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {file.publicUrl && (
                                <a
                                  href={
                                    file.publicUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"
                                >
                                  <Download
                                    size={
                                      14
                                    }
                                  />
                                </a>
                              )}

                              <button
                                onClick={() =>
                                  void deleteProjectFile(
                                    file
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-red-400"
                              >
                                <Trash2
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </Panel>
            </motion.section>
          )}

          {/* ==================================================
              NOTES
          ================================================== */}

          {activeTab ===
            "Notes" && (
            <motion.section
              key="notes"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <SectionEyebrow>
                  Project Notes
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  Notes & context
                </h2>

                <div className="mt-8 space-y-3">
                  <input
                    value={
                      noteTitle
                    }
                    onChange={(
                      event
                    ) =>
                      setNoteTitle(
                        event.target.value
                      )
                    }
                    placeholder="Note title"
                    className="w-full rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm"
                  />

                  <textarea
                    value={
                      noteContent
                    }
                    onChange={(
                      event
                    ) =>
                      setNoteContent(
                        event.target.value
                      )
                    }
                    placeholder="Write a project note..."
                    className="min-h-[130px] w-full rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm"
                  />

                  <button
                    onClick={() =>
                      void addProjectNote()
                    }
                    disabled={
                      noteSaving ||
                      !noteContent.trim()
                    }
                    className="rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-wider text-white disabled:opacity-40"
                  >
                    {noteSaving
                      ? "Saving..."
                      : "Add Note"}
                  </button>
                </div>
              </Panel>

              <Panel>
                {!projectNotes.length ? (
                  <EmptyMessage>
                    No project notes yet.
                  </EmptyMessage>
                ) : (
                  <div className="space-y-3">
                    {projectNotes.map(
                      (
                        note
                      ) => (
                        <div
                          key={
                            note.id
                          }
                          className="rounded-2xl bg-stone-50 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold">
                                {note.title ||
                                  "Project Note"}
                              </p>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                                {
                                  note.content
                                }
                              </p>

                              <p className="mt-3 text-[10px] text-stone-400">
                                {note.created_at
                                  ? formatDate(
                                      note.created_at
                                    )
                                  : ""}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                void deleteProjectNote(
                                  note.id
                                )
                              }
                              className="text-red-300"
                            >
                              <Trash2
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </Panel>
            </motion.section>
          )}

          {/* ==================================================
              SETTINGS
          ================================================== */}

          {activeTab ===
            "Settings" && (
            <motion.section
              key="settings"
              initial={{
                opacity:
                  0,
              }}
              animate={{
                opacity:
                  1,
              }}
              className="space-y-6"
            >
              <Panel>
                <SectionEyebrow>
                  Project Settings
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-3xl italic">
                  Project details
                </h2>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <Field
                    label="Client"
                  >
                    <select
                      value={
                        project.customer_id ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        void updateProject({
                          customer_id:
                            event.target.value ||
                            null,
                        })
                      }
                      className="input"
                    >
                      <option value="">
                        No client
                      </option>

                      {customers.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {getCustomerDisplayName(
                              item
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field
                    label="Project Name"
                  >
                    <input
                      defaultValue={
                        project.name
                      }
                      onBlur={(
                        event
                      ) => {
                        const value =
                          event.target.value.trim();

                        if (
                          value &&
                          value !==
                            project.name
                        ) {
                          void updateProject({
                            name:
                              value,
                          });
                        }
                      }}
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Category"
                  >
                    <input
                      defaultValue={
                        project.category ||
                        ""
                      }
                      onBlur={(
                        event
                      ) => {
                        if (
                          event.target.value !==
                          project.category
                        ) {
                          void updateProject({
                            category:
                              event.target.value,
                          });
                        }
                      }}
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Status"
                  >
                    <select
                      value={
                        project.status ||
                        "live"
                      }
                      onChange={(
                        event
                      ) =>
                        void updateProject({
                          status:
                            event.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="live">
                        In Progress
                      </option>

                      <option value="paused">
                        Paused
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                      <option value="archived">
                        Archived
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Start Date"
                  >
                    <input
                      type="date"
                      value={
                        project.start_date ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        void updateProject({
                          start_date:
                            event.target.value ||
                            null,
                        })
                      }
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Deadline"
                  >
                    <input
                      type="date"
                      value={
                        project.due_date ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        void updateProject({
                          due_date:
                            event.target.value ||
                            null,
                        })
                      }
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Budget"
                  >
                    <input
                      type="number"
                      defaultValue={
                        project.budget ||
                        0
                      }
                      onBlur={(
                        event
                      ) =>
                        void updateProject({
                          budget:
                            Number(
                              event.target.value ||
                                0
                            ),
                        })
                      }
                      className="input"
                    />
                  </Field>
                </div>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  Team
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Project members
                </h2>

                <div className="mt-6 space-y-2">
                  {projectMemberProfiles.map(
                    ({
                      profile,
                      rawValue,
                    }) => (
                      <div
                        key={
                          rawValue
                        }
                        className="flex items-center justify-between rounded-xl bg-stone-50 p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold">
                            {profile
                              ? getMemberDisplayName(
                                  profile
                                )
                              : "Unknown member"}
                          </p>

                          {profile?.email && (
                            <p className="mt-1 text-[10px] text-stone-400">
                              {
                                profile.email
                              }
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            void removeProjectMember(
                              rawValue
                            )
                          }
                          className="text-red-300"
                        >
                          <X
                            size={
                              14
                            }
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-stone-50 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={
                        inviteEmail
                      }
                      onChange={(
                        event
                      ) =>
                        setInviteEmail(
                          event.target.value
                        )
                      }
                      placeholder="Email address..."
                      className="flex-1 rounded-xl border bg-white p-3 text-xs"
                    />

                    <button
                      onClick={() =>
                        void inviteProjectMember()
                      }
                      disabled={
                        isInvitingMember ||
                        !inviteEmail.trim()
                      }
                      className="rounded-xl bg-stone-900 px-5 py-3 text-[8px] font-black uppercase text-white disabled:opacity-40"
                    >
                      {isInvitingMember
                        ? "Adding..."
                        : "Add Member"}
                    </button>
                  </div>

                  {memberInviteFeedback && (
                    <div className="mt-4 rounded-xl bg-white p-4 text-xs">
                      <strong>
                        {
                          memberInviteFeedback.title
                        }
                      </strong>

                      {memberInviteFeedback.message && (
                        <p className="mt-1 text-stone-500">
                          {
                            memberInviteFeedback.message
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Panel>

              <Panel>
                <SectionEyebrow>
                  Sub-projects
                </SectionEyebrow>

                <h2 className="mt-1 font-serif text-2xl italic">
                  Add related work
                </h2>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <input
                    value={
                      subProjectName
                    }
                    onChange={(
                      event
                    ) =>
                      setSubProjectName(
                        event.target.value
                      )
                    }
                    placeholder="Sub-project name"
                    className="input"
                  />

                  <input
                    type="date"
                    value={
                      subProjectDueDate
                    }
                    onChange={(
                      event
                    ) =>
                      setSubProjectDueDate(
                        event.target.value
                      )
                    }
                    className="input"
                  />

                  <button
                    onClick={() =>
                      void addSubProject()
                    }
                    className="rounded-xl bg-stone-900 text-[8px] font-black uppercase text-white"
                  >
                    Add Sub-project
                  </button>
                </div>

                <textarea
                  value={
                    subProjectSummary
                  }
                  onChange={(
                    event
                  ) =>
                    setSubProjectSummary(
                      event.target.value
                    )
                  }
                  placeholder="Optional scope..."
                  className="input mt-3 min-h-[100px]"
                />
              </Panel>

              <div className="rounded-[2rem] border border-red-100 bg-white p-6">
                <p className="text-[9px] font-black uppercase text-red-400">
                  Danger Zone
                </p>

                <button
                  onClick={() =>
                    void deleteProject()
                  }
                  className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[8px] font-black uppercase text-red-500"
                >
                  <Trash2
                    size={
                      14
                    }
                  />

                  Delete Project
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ======================================================
          INVOICE / QUOTE MODAL
      ====================================================== */}

      <InvoiceQuoteModal
        open={
          showInvoiceModal
        }
        submitting={
          invoiceSubmitting
        }
        docType={
          invoiceDocType
        }
        customers={
          customers.map(
            (
              item
            ) => ({
              id:
                item.id,

              name:
                getCustomerDisplayName(
                  item
                ),

              email:
                item.email ||
                null,
            })
          )
        }
        projects={
          [
            {
              id:
                project.id,

              name:
                project.name,

              customer_id:
                project.customer_id ||
                null,

              status:
                project.status ||
                null,
            },
          ] as FinanceProject[]
        }
        formData={
          invoiceForm
        }
        lineItems={
          invoiceLineItems
        }
        netTotal={
          invoiceNetTotal
        }
        vatTotal={
          invoiceVatTotal
        }
        grandTotal={
          invoiceGrandTotal
        }
        onDocTypeChange={
          setInvoiceDocType
        }
        onFormChange={
          setInvoiceForm
        }
        onLineItemsChange={
          setInvoiceLineItems
        }
        onClose={() => {
          if (
            !invoiceSubmitting
          ) {
            setShowInvoiceModal(
              false
            );
          }
        }}
        onSubmit={
          submitInvoiceQuote
        }
      />

      {/* ======================================================
          EXPENSE MODAL
      ====================================================== */}

      <ExpenseModal
        open={
          showExpenseModal
        }
        submitting={
          expenseSubmitting
        }
        expense={
          expenseForm
        }
        customers={
          customers.map(
            (
              item
            ) => ({
              id:
                item.id,

              name:
                getCustomerDisplayName(
                  item
                ),

              email:
                item.email ||
                null,
            })
          )
        }
        projects={
          [
            {
              id:
                project.id,

              name:
                project.name,

              customer_id:
                project.customer_id ||
                null,

              status:
                project.status ||
                null,
            },
          ] as FinanceProject[]
        }
        onChange={
          setExpenseForm
        }
        onClose={() => {
          if (
            !expenseSubmitting
          ) {
            setShowExpenseModal(
              false
            );
          }
        }}
        onSubmit={
          submitExpense
        }
      />

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

            .input {
              width: 100%;
              border: 1px solid rgb(245 245 244);
              background: rgb(250 250 249);
              border-radius: 0.75rem;
              padding: 1rem;
              font-size: 0.875rem;
              outline: none;
            }

            .input:focus {
              border-color: #a9b897;
            }
          `,
        }}
      />
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function Panel({
  children,
  className = "",
}: {
  children:
    React.ReactNode;

  className?:
    string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-stone-200 bg-white p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#829473]">
      {children}
    </p>
  );
}

function HeaderStat({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-5 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4 last:border-0">
      <span className="text-xs text-stone-400">
        {label}
      </span>

      <span className="text-right text-xs font-semibold">
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon:
    Icon,
  value,
  label,
}: {
  icon:
    any;

  value:
    string;

  label:
    string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-stone-200 bg-white p-5">
      <Icon
        size={
          18
        }
        className="mb-6 text-stone-300"
      />

      <p className="font-serif text-2xl italic sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-stone-400">
        {label}
      </p>
    </div>
  );
}

function MoneyCard({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-100 bg-stone-50 p-5">
      <p className="text-[8px] font-black uppercase tracking-wider text-stone-400">
        {label}
      </p>

      <p className="mt-3 font-serif text-3xl italic">
        {value}
      </p>
    </div>
  );
}

function FinanceButton({
  label,
  onClick,
}: {
  label:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className="rounded-xl bg-stone-900 px-4 py-3 text-[8px] font-black uppercase tracking-wider text-white hover:bg-[#a9b897]"
    >
      {label}
    </button>
  );
}

function QuickAction({
  icon:
    Icon,
  label,
  onClick,
}: {
  icon:
    any;

  label:
    string;

  onClick:
    () => void;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className="flex flex-col items-start rounded-2xl bg-stone-50 p-5 text-left transition hover:bg-stone-100"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
        <Icon
          size={
            15
          }
        />
      </div>

      <p className="mt-4 text-xs font-semibold">
        {label}
      </p>
    </button>
  );
}

function EmptyMessage({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-400">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[8px] font-black uppercase tracking-wider text-stone-400">
        {label}
      </label>

      {children}
    </div>
  );
}

function FinanceList({
  title,
  records,
  formatCurrency,
  formatDate,
}: {
  title:
    string;

  records:
    ProjectFinanceRecord[];

  formatCurrency:
    (
      value?:
        | number
        | string
        | null
    ) => string;

  formatDate:
    (
      value?:
        | string
        | null
    ) => string;
}) {
  return (
    <Panel>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-serif text-2xl italic">
          {title}
        </h3>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs">
          {
            records.length
          }
        </span>
      </div>

      {!records.length ? (
        <p className="text-sm text-stone-400">
          No{" "}
          {title.toLowerCase()}{" "}
          yet.
        </p>
      ) : (
        <div className="space-y-2">
          {records.map(
            (
              record
            ) => {
              const date =
                record.due_date ||
                record.date ||
                record.created_at ||
                null;

              return (
                <div
                  key={
                    record.id
                  }
                  className="rounded-xl bg-stone-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {formatCurrency(
                        record.amount
                      )}
                    </p>

                    {record.status && (
                      <span className="text-[8px] font-black uppercase text-stone-400">
                        {
                          record.status
                        }
                      </span>
                    )}
                  </div>

                  {record.description && (
                    <p className="mt-2 text-xs text-stone-500">
                      {
                        record.description
                      }
                    </p>
                  )}

                  {date && (
                    <p className="mt-2 text-[9px] text-stone-400">
                      {formatDate(
                        date
                      )}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </Panel>
  );
}