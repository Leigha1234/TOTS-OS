"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  createBrowserClient,
} from "@supabase/ssr";

import {
  useSettings,
} from "@/app/context/SettingsContext";

import {
  Briefcase,
  Check,
  Clock,
  FileText,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

// ==================================================
// TYPES
// ==================================================

type RiskLevel =
  | "low"
  | "medium"
  | "high";

type DashboardTodo = {
  id: string;
  text: string;
  completed: boolean;
  status?: string;
  projectId?: string | null;
  assignedTo?: string | null;
  createdAt?: string | null;
};

type TeamMember = {
  id?: string;
  full_name?: string | null;
  role?: string | null;
};

type ClarityMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type ClarityMemory = {
  id: string;
  user_id: string;
  organisation_id?: string | null;
  memory_key: string;
  memory_value: string;
  category?: string | null;
  importance?: number | null;
  confidence?: number | null;
  source?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type NormalisedEvent = {
  id?: string;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
};

type DashboardStats = {
  activeProjects: number;
  invoicesDue: number;
  currentRevenue: number;
};

type DashboardProject = {
  id: string;
  name?: string | null;
  status?: string | null;
  customer_id?: string | null;
  due_date?: string | null;
  health?: string | null;
  budget?: number | null;
};

type DashboardNote = {
  id: string;
  title?: string | null;
  content?: string | null;
  type?: string | null;
  category?: string | null;
  created_at?: string | null;
};

type DashboardEmail = {
  id?: string;
  subject?: string | null;
  body?: string | null;
  direction?: string | null;
  status?: string | null;
  created_at?: string | null;
};

// ==================================================
// HELPERS
// ==================================================

function getGreeting(
  date: Date
) {
  const hour =
    date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getDailyAffirmation(
  date: Date
) {
  const hour =
    date.getHours();

  const affirmations =
    hour < 12
      ? [
          "Hope you slept well. Keep the pace calm and steady.",
          "A clear morning creates a focused day.",
          "You do not need to rush the important work.",
        ]
      : hour < 18
        ? [
            "Keep momentum on what moves the business forward.",
            "You are already doing the work that matters.",
            "Let clarity lead your next best action.",
          ]
        : [
            "You have already done enough for today.",
            "Close the day with intention and a little ease.",
            "Rest is part of the operation, not a detour from it.",
          ];

  return affirmations[
    Math.abs(
      date.getMinutes() +
        date.getHours()
    ) % affirmations.length
  ];
}

function cleanName(
  value:
    | string
    | null
    | undefined
) {
  const cleaned =
    String(
      value ?? ""
    ).trim();

  if (
    !cleaned ||
    cleaned.toLowerCase() ===
      "user"
  ) {
    return "";
  }

  return cleaned;
}

function getFirstName(
  value: string
) {
  const cleaned =
    cleanName(
      value
    );

  if (!cleaned) {
    return "";
  }

  return (
    cleaned.split(
      /\s+/
    )[0] ?? ""
  );
}

function formatDashboardDate(
  date: Date
) {
  return date.toLocaleDateString(
    "en-GB",
    {
      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  );
}

function formatCurrency(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "en-GB",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        0,
    }
  );
}

function formatBriefDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "No date";
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "No date";
  }

  return parsed.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

function formatBriefDateTime(
  value: Date | null
) {
  if (!value) {
    return "No date";
  }

  return value.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getHealthScore(
  riskLevel: RiskLevel
) {
  if (
    riskLevel ===
    "high"
  ) {
    return 51;
  }

  if (
    riskLevel ===
    "medium"
  ) {
    return 74;
  }

  return 92;
}

function isCompletedTaskStatus(
  status:
    | string
    | null
    | undefined
) {
  const value =
    String(
      status ?? ""
    )
      .trim()
      .toLowerCase();

  return [
    "done",
    "completed",
    "complete",
  ].includes(
    value
  );
}

function normaliseEvent(
  event: any
): NormalisedEvent {
  const rawStart =
    event?.start_at ||
    event?.start_date ||
    event?.start_time ||
    event?.start ||
    event?.date ||
    event?.created_at ||
    event?.payload?.new
      ?.start_at ||
    event?.payload?.new
      ?.start_date;

  const rawEnd =
    event?.end_at ||
    event?.end_date ||
    event?.end_time ||
    event?.payload?.new
      ?.end_at;

  const parseDate = (
    value: unknown
  ) => {
    if (!value) {
      return null;
    }

    const parsed =
      new Date(
        String(
          value
        )
      );

    return Number.isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;
  };

  return {
    id:
      event?.id ||
      event?.payload?.new
        ?.id,

    title:
      event?.title ||
      event?.payload?.new
        ?.title ||
      "Event",

    startAt:
      parseDate(
        rawStart
      ),

    endAt:
      parseDate(
        rawEnd
      ),
  };
}

function createMemoryKey() {
  return `dashboard_clarity_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ==================================================
// DASHBOARD CONTENT
// ==================================================

function DashboardContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    organisationId:
      settingsOrganisationId,
  } =
    useSettings();

  const authError =
    searchParams.get(
      "error"
    );

  // ==================================================
  // SUPABASE
  // ==================================================

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

  // ==================================================
  // GENERAL STATE
  // ==================================================

  const [
    userName,
    setUserName,
  ] =
    useState("");

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState<
      string | null
    >(null);

  const [
    resolvedOrganisationId,
    setResolvedOrganisationId,
  ] =
    useState<
      string | null
    >(
      settingsOrganisationId ||
        null
    );

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(
      new Date()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    dashboardError,
    setDashboardError,
  ] =
    useState<
      string | null
    >(null);

  // ==================================================
  // BUSINESS DATA
  // ==================================================

  const [
    stats,
    setStats,
  ] =
    useState<DashboardStats>({
      activeProjects:
        0,

      invoicesDue:
        0,

      currentRevenue:
        0,
    });

  const [
    teamMembers,
    setTeamMembers,
  ] =
    useState<
      TeamMember[]
    >([]);

  const [
    todos,
    setTodos,
  ] =
    useState<
      DashboardTodo[]
    >([]);

  const [
    events,
    setEvents,
  ] =
    useState<
      NormalisedEvent[]
    >([]);

  const [
    emails,
    setEmails,
  ] =
    useState<
      DashboardEmail[]
    >([]);

  const [
    projects,
    setProjects,
  ] =
    useState<
      DashboardProject[]
    >([]);

  const [
    notes,
    setNotes,
  ] =
    useState<
      DashboardNote[]
    >([]);

  // ==================================================
  // CLARITY
  // ==================================================

  const [
    aiSummary,
    setAiSummary,
  ] =
    useState("");

  const [
    riskLevel,
    setRiskLevel,
  ] =
    useState<RiskLevel>(
      "low"
    );

  const [
    aiActions,
    setAiActions,
  ] =
    useState<
      string[]
    >([]);

  const [
    clarityCommand,
    setClarityCommand,
  ] =
    useState("");

  const [
    clarityResponse,
    setClarityResponse,
  ] =
    useState<
      string | null
    >(null);

  const [
    clarityStreaming,
    setClarityStreaming,
  ] =
    useState(
      false
    );

  const [
    clarityChatId,
    setClarityChatId,
  ] =
    useState<
      string | null
    >(null);

  const [
    clarityMessages,
    setClarityMessages,
  ] =
    useState<
      ClarityMessage[]
    >([]);

  const [
    clarityChats,
    setClarityChats,
  ] =
    useState<
      any[]
    >([]);

  const [
    clarityMemory,
    setClarityMemory,
  ] =
    useState<
      ClarityMemory[]
    >([]);

  const [
    clarityNotifications,
    setClarityNotifications,
  ] =
    useState<
      string[]
    >([]);

  const [
    showClarityWidget,
    setShowClarityWidget,
  ] =
    useState(
      false
    );

  const [
    showBriefModal,
    setShowBriefModal,
  ] =
    useState(
      false
    );

  const [
    dailyBriefShown,
    setDailyBriefShown,
  ] =
    useState(
      false
    );

  const [
    shouldShowBriefOnRefresh,
    setShouldShowBriefOnRefresh,
  ] =
    useState(false);

  // ==================================================
  // INPUTS
  // ==================================================

  const [
    taskInput,
    setTaskInput,
  ] =
    useState("");

  const [
    noteInput,
    setNoteInput,
  ] =
    useState("");

  // ==================================================
  // ACTIVE ORGANISATION
  // ==================================================

  const activeOrganisationId =
    settingsOrganisationId ||
    resolvedOrganisationId;

  // ==================================================
  // DERIVED VALUES
  // ==================================================

  const greeting =
    getGreeting(
      currentTime
    );

  const firstName =
    getFirstName(
      userName
    );

  const greetingText =
    firstName
      ? `${greeting}, ${firstName}`
      : greeting;

  const dailyAffirmation =
    getDailyAffirmation(
      currentTime
    );

  const openTasks =
    todos.filter(
      (
        task
      ) =>
        !task.completed
    );

  const healthScore =
    getHealthScore(
      riskLevel
    );

  const clarityMemoryContext =
    useMemo(
      () =>
        clarityMemory.map(
          (
            memory
          ) => ({
            key:
              memory.memory_key,

            value:
              memory.memory_value,

            category:
              memory.category,

            importance:
              memory.importance,

            confidence:
              memory.confidence,

            source:
              memory.source,
          })
        ),
      [
        clarityMemory,
      ]
    );

  // ==================================================
  // CLOCK
  // ==================================================

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setCurrentTime(
            new Date()
          );
        },
        60000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  useEffect(() => {
    const navigationEntries =
      performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];

    const navigationType =
      navigationEntries[0]?.type;

    const legacyNavigationType =
      (performance as any)
        ?.navigation
        ?.type;

    const isRefreshLoad =
      navigationType ===
        "reload" ||
      legacyNavigationType ===
        1;

    setShouldShowBriefOnRefresh(
      isRefreshLoad
    );
  }, []);

  useEffect(() => {
    if (
      shouldShowBriefOnRefresh &&
      !loading &&
      !dailyBriefShown &&
      aiSummary
    ) {
      const timer =
        window.setTimeout(
          () => {
            handleClarityBrief();
            setDailyBriefShown(
              true
            );
          },
          450
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    }
  }, [
    aiSummary,
    dailyBriefShown,
    loading,
    shouldShowBriefOnRefresh,
  ]);

  // ==================================================
  // KEEP SETTINGS ORG IN SYNC
  // ==================================================

  useEffect(() => {
    if (
      settingsOrganisationId
    ) {
      setResolvedOrganisationId(
        settingsOrganisationId
      );
    }
  }, [
    settingsOrganisationId,
  ]);

  // ==================================================
  // CLARITY LOADERS
  // ==================================================

  const loadClarityChats =
    useCallback(
      async () => {
        if (
          !activeOrganisationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "clarity_chats"
            )
            .select(
              "id, title, created_at"
            )
            .eq(
              "organisation_id",
              activeOrganisationId
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(
              20
            );

        if (
          error
        ) {
          console.warn(
            "Clarity chats load error:",
            {
              code:
                error.code,

              message:
                error.message,

              details:
                error.details,

              hint:
                error.hint,
            }
          );

          return;
        }

        setClarityChats(
          data || []
        );
      },
      [
        activeOrganisationId,
        supabase,
      ]
    );

  const loadClarityMessages =
    useCallback(
      async (
        chatId: string
      ) => {
        if (
          !chatId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "clarity_messages"
            )
            .select(
              "id, role, content, created_at"
            )
            .eq(
              "chat_id",
              chatId
            )
            .order(
              "created_at",
              {
                ascending:
                  true,
              }
            );

        if (
          error
        ) {
          console.warn(
            "Clarity messages load error:",
            {
              code:
                error.code,

              message:
                error.message,

              details:
                error.details,

              hint:
                error.hint,
            }
          );

          return;
        }

        setClarityMessages(
          (
            data as
              ClarityMessage[]
          ) || []
        );
      },
      [
        supabase,
      ]
    );

  // ==================================================
  // CLARITY MEMORY
  // ==================================================

  const loadClarityMemory =
    useCallback(
      async () => {
        if (
          !activeOrganisationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "clarity_memory"
            )
            .select(
              `
                id,
                user_id,
                organisation_id,
                memory_key,
                memory_value,
                category,
                importance,
                confidence,
                source,
                is_active,
                created_at,
                updated_at
              `
            )
            .eq(
              "organisation_id",
              activeOrganisationId
            )
            .eq(
              "is_active",
              true
            )
            .order(
              "importance",
              {
                ascending:
                  false,

                nullsFirst:
                  false,
              }
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(
              20
            );

        if (
          error
        ) {
          console.warn(
            "Clarity memory load error:",
            {
              code:
                error.code,

              message:
                error.message,

              details:
                error.details,

              hint:
                error.hint,
            }
          );

          return;
        }

        setClarityMemory(
          (
            data as
              ClarityMemory[]
          ) || []
        );
      },
      [
        activeOrganisationId,
        supabase,
      ]
    );

  const startNewClarityChat =
    useCallback(
      async () => {
        if (
          !activeOrganisationId
        ) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "clarity_chats"
            )
            .insert({
              organisation_id:
                activeOrganisationId,

              title:
                "New Clarity Conversation",
            })
            .select()
            .single();

        if (
          error ||
          !data
        ) {
          console.error(
            "New Clarity chat error:",
            error
          );

          return;
        }

        setClarityChatId(
          data.id
        );

        localStorage.setItem(
          "clarity_active_chat",
          data.id
        );

        setClarityMessages(
          []
        );

        setClarityResponse(
          null
        );

        await loadClarityChats();
      },
      [
        activeOrganisationId,
        supabase,
        loadClarityChats,
      ]
    );

  // ==================================================
  // DASHBOARD LOAD
  // ==================================================

  const loadDashboardData =
    useCallback(
      async () => {
        if (
          authError
        ) {
          setLoading(
            false
          );

          return;
        }

        setLoading(
          true
        );

        setDashboardError(
          null
        );

        try {
          const {
            data: {
              user,
            },
            error:
              authLookupError,
          } =
            await supabase.auth.getUser();

          if (
            authLookupError
          ) {
            throw authLookupError;
          }

          if (
            !user
          ) {
            router.replace(
              "/login"
            );

            return;
          }

          setCurrentUserId(
            user.id
          );

          // ------------------------------------------
          // PROFILE
          // ------------------------------------------

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
                "full_name, organisation_id"
              )
              .eq(
                "id",
                user.id
              )
              .maybeSingle();

          if (
            profileError
          ) {
            console.warn(
              "Dashboard profile lookup:",
              profileError
            );
          }

          const resolvedName =
            cleanName(
              profile?.full_name
            ) ||
            cleanName(
              user.user_metadata
                ?.full_name
            ) ||
            cleanName(
              user.user_metadata
                ?.name
            ) ||
            cleanName(
              user.user_metadata
                ?.display_name
            );

          setUserName(
            resolvedName
          );

          const organisationId =
            settingsOrganisationId ||
            profile?.organisation_id ||
            null;

          if (
            !organisationId ||
            organisationId ===
              "undefined"
          ) {
            setDashboardError(
              "This account is not linked to an organisation."
            );

            return;
          }

          setResolvedOrganisationId(
            organisationId
          );

          // ------------------------------------------
          // LOAD ALL DASHBOARD DATA
          // ------------------------------------------

          const [
            projectsRes,
            invoicesRes,
            membersRes,
            tasksRes,
            notesRes,
            eventsRes,
            emailsRes,
          ] =
            await Promise.all([
              supabase
                .from(
                  "projects"
                )
                .select(
                  "id, name, status, customer_id, due_date, health, budget, deleted_at"
                )
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
                )
                .limit(
                  30
                ),

              supabase
                .from(
                  "invoices"
                )
                .select(
                  "id, amount, status, customer_id, project_id, due_date, created_at"
                )
                .eq(
                  "organisation_id",
                  organisationId
                ),

              supabase
                .from(
                  "profiles"
                )
                .select(
                  "id, full_name, role"
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .limit(
                  50
                ),

              supabase
                .from(
                  "tasks"
                )
                .select(
                  "id, title, description, status, project_id, assigned_to, user_id, created_at"
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
                )
                .limit(
                  100
                ),

              supabase
                .from(
                  "notes"
                )
                .select(
                  "*"
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
                )
                .limit(
                  30
                ),

              supabase
                .from(
                  "events"
                )
                .select(
                  "*"
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
                )
                .limit(
                  50
                ),

              supabase
                .from(
                  "email_messages"
                )
                .select(
                  "id, subject, body, direction, status, created_at"
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
                )
                .limit(
                  10
                ),
            ]);

          // ------------------------------------------
          // LOG NON-FATAL QUERY ERRORS
          // ------------------------------------------

          if (
            projectsRes.error
          ) {
            console.warn(
              "Dashboard projects error:",
              projectsRes.error
            );
          }

          if (
            invoicesRes.error
          ) {
            console.warn(
              "Dashboard invoices error:",
              invoicesRes.error
            );
          }

          if (
            membersRes.error
          ) {
            console.warn(
              "Dashboard members error:",
              membersRes.error
            );
          }

          if (
            tasksRes.error
          ) {
            console.warn(
              "Dashboard tasks error:",
              tasksRes.error
            );
          }

          if (
            notesRes.error
          ) {
            console.warn(
              "Dashboard notes error:",
              notesRes.error
            );
          }

          if (
            eventsRes.error
          ) {
            console.warn(
              "Dashboard events error:",
              eventsRes.error
            );
          }

          if (
            emailsRes.error
          ) {
            console.warn(
              "Dashboard email messages error:",
              emailsRes.error
            );
          }

          // ------------------------------------------
          // NORMALISE DATA
          // ------------------------------------------

          const invoiceData =
            (
              invoicesRes.data as
                any[]
            ) || [];

          const projectData =
            (
              projectsRes.data as
                DashboardProject[]
            ) || [];

          const taskData =
            (
              tasksRes.data as
                any[]
            ) || [];

          const noteData =
            (
              notesRes.data as
                DashboardNote[]
            ) || [];

          const eventData =
            (
              (
                eventsRes.data as
                  any[]
              ) || []
            ).map(
              normaliseEvent
            );

          const emailData =
            (
              emailsRes.data as
                DashboardEmail[]
            ) || [];

          const memberData =
            (
              membersRes.data as
                TeamMember[]
            ) || [];

          // ------------------------------------------
          // ACTIVE PROJECTS
          // ------------------------------------------

          const liveProjects =
            projectData.filter(
              (
                project
              ) =>
                ![
                  "completed",
                  "done",
                  "archived",
                ].includes(
                  String(
                    project.status ||
                      ""
                  )
                    .trim()
                    .toLowerCase()
                )
            );

          // ------------------------------------------
          // FINANCE
          // ------------------------------------------

          const currentRevenue =
            invoiceData.reduce(
              (
                total,
                invoice
              ) => {
                const status =
                  String(
                    invoice.status ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                if (
                  status !==
                  "paid"
                ) {
                  return total;
                }

                return (
                  total +
                  Number(
                    invoice.amount ||
                      0
                  )
                );
              },
              0
            );

          const pendingInvoices =
            invoiceData.filter(
              (
                invoice
              ) =>
                [
                  "pending",
                  "due",
                  "overdue",
                  "sent",
                  "unpaid",
                ].includes(
                  String(
                    invoice.status ||
                      ""
                  )
                    .trim()
                    .toLowerCase()
                )
            ).length;

          // ------------------------------------------
          // TASKS
          // ------------------------------------------

          const loadedTodos:
            DashboardTodo[] =
            taskData.map(
              (
                task
              ) => {
                const completed =
                  isCompletedTaskStatus(
                    task.status
                  );

                return {
                  id:
                    task.id,

                  text:
                    task.title ||
                    task.description ||
                    "Untitled Task",

                  completed,

                  status:
                    task.status ||
                    "todo",

                  projectId:
                    task.project_id ||
                    null,

                  assignedTo:
                    task.assigned_to ||
                    null,

                  createdAt:
                    task.created_at ||
                    null,
                };
              }
            );

          // ------------------------------------------
          // SET STATE
          // ------------------------------------------

          setStats({
            activeProjects:
              liveProjects.length,

            invoicesDue:
              pendingInvoices,

            currentRevenue,
          });

          setTeamMembers(
            memberData
          );

          setTodos(
            loadedTodos
          );

          setEvents(
            eventData
          );

          setEmails(
            emailData
          );

          setProjects(
            projectData
          );

          setNotes(
            noteData
          );

          // ------------------------------------------
          // CLARITY SUMMARY
          // ------------------------------------------

          const taskLoad =
            loadedTodos.filter(
              (
                task
              ) =>
                !task.completed
            ).length;

          const emailLoad =
            emailData.length;

          const eventLoad =
            eventData.filter(
              (
                event
              ) =>
                event.startAt &&
                event.startAt >=
                  new Date()
            ).length;

          let nextRisk:
            RiskLevel =
            "low";

          if (
            taskLoad >
              10 ||
            pendingInvoices >
              5 ||
            emailLoad >
              10
          ) {
            nextRisk =
              "high";
          } else if (
            taskLoad >
              5 ||
            pendingInvoices >
              2 ||
            emailLoad >
              5
          ) {
            nextRisk =
              "medium";
          }

          setRiskLevel(
            nextRisk
          );

          if (
            nextRisk ===
            "high"
          ) {
            setAiSummary(
              "Activity is elevated. Focus on delivery, overdue work and anything affecting cash flow first."
            );
          } else if (
            nextRisk ===
            "medium"
          ) {
            setAiSummary(
              "Your workload is manageable, but a few areas need deliberate prioritisation today."
            );
          } else {
            setAiSummary(
              "Operations look stable. You have room to focus on higher-value work, planning and growth."
            );
          }

          const priorities:
            string[] =
            [];

          if (
            taskLoad >
            0
          ) {
            priorities.push(
              "Focus on the highest-impact open tasks"
            );
          }

          if (
            pendingInvoices >
            0
          ) {
            priorities.push(
              "Review outstanding invoices and cash flow"
            );
          }

          if (
            eventLoad >
            0
          ) {
            priorities.push(
              "Check upcoming meetings and deadlines"
            );
          }

          if (
            liveProjects.length >
            0
          ) {
            priorities.push(
              "Review active project delivery"
            );
          }

          if (
            emailLoad >
            0
          ) {
            priorities.push(
              "Clear important client communications"
            );
          }

          setAiActions(
            priorities.slice(
              0,
              4
            )
          );

          const notifications:
            string[] =
            [];

          if (
            taskLoad >
            5
          ) {
            notifications.push(
              "Your task backlog is growing."
            );
          }

          if (
            pendingInvoices >
            0
          ) {
            notifications.push(
              `${pendingInvoices} invoice${
                pendingInvoices ===
                1
                  ? ""
                  : "s"
              } require attention.`
            );
          }

          if (
            emailLoad >
            8
          ) {
            notifications.push(
              "Client communication activity is elevated."
            );
          }

          setClarityNotifications(
            notifications
          );
        } catch (
          loadError
        ) {
          console.error(
            "Dashboard sync error:",
            loadError
          );

          setDashboardError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load the dashboard."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        authError,
        router,
        settingsOrganisationId,
        supabase,
      ]
    );

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    void loadDashboardData();
  }, [
    loadDashboardData,
  ]);

  // ==================================================
  // CLARITY HISTORY
  // ==================================================

  useEffect(() => {
    if (
      !activeOrganisationId
    ) {
      return;
    }

    void loadClarityChats();

    void loadClarityMemory();

    const savedChatId =
      localStorage.getItem(
        "clarity_active_chat"
      );

    if (
      savedChatId
    ) {
      setClarityChatId(
        savedChatId
      );

      void loadClarityMessages(
        savedChatId
      );
    }
  }, [
    activeOrganisationId,
    loadClarityChats,
    loadClarityMessages,
    loadClarityMemory,
  ]);

  // ==================================================
  // TASK PRIORITY
  // ==================================================

  const getTaskScore =
    (
      task:
        DashboardTodo
    ) => {
      const text =
        String(
          task.text ||
            ""
        ).toLowerCase();

      let score =
        0;

      if (
        !task.completed
      ) {
        score +=
          3;
      } else {
        score -=
          5;
      }

      if (
        text.includes(
          "urgent"
        ) ||
        text.includes(
          "asap"
        ) ||
        text.includes(
          "today"
        ) ||
        text.includes(
          "important"
        ) ||
        text.includes(
          "now"
        )
      ) {
        score +=
          4;
      }

      if (
        text.includes(
          "!!!"
        )
      ) {
        score +=
          2;
      }

      if (
        task.status ===
          "blocked"
      ) {
        score +=
          3;
      }

      return score;
    };

  const getTaskPriorityLabel =
    (
      task:
        DashboardTodo
    ) =>
      getTaskScore(
        task
      ) >= 6
        ? "HIGH"
        : "NORMAL";

  // ==================================================
  // TASK ACTIONS
  // ==================================================

  const toggleTodo =
    async (
      id: string,
      currentStatus: boolean
    ) => {
      const newCompleted =
        !currentStatus;

      /*
       * IMPORTANT:
       * TOTS-OS uses "done" as its completed task state.
       */
      const nextStatus =
        newCompleted
          ? "done"
          : "todo";

      const previousTodos =
        todos;

      // ------------------------------------------
      // OPTIMISTIC UPDATE
      // ------------------------------------------

      setTodos(
        (
          previous
        ) =>
          previous.map(
            (
              task
            ) =>
              task.id ===
              id
                ? {
                    ...task,

                    completed:
                      newCompleted,

                    status:
                      nextStatus,
                  }
                : task
          )
      );

      try {
        let query =
          supabase
            .from(
              "tasks"
            )
            .update({
              status:
                nextStatus,
            })
            .eq(
              "id",
              id
            );

        if (
          activeOrganisationId
        ) {
          query =
            query.eq(
              "organisation_id",
              activeOrganisationId
            );
        }

        const {
          data,
          error,
        } =
          await query
            .select(
              "id, status, organisation_id"
            )
            .maybeSingle();

        if (
          error
        ) {
          console.error(
            "Task update failed:",
            {
              code:
                error.code,

              message:
                error.message,

              details:
                error.details,

              hint:
                error.hint,

              taskId:
                id,

              statusAttempted:
                nextStatus,

              organisationId:
                activeOrganisationId,
            }
          );

          setTodos(
            previousTodos
          );

          return;
        }

        if (
          !data
        ) {
          console.error(
            "Task update returned no row. Possible RLS or organisation mismatch:",
            {
              taskId:
                id,

              statusAttempted:
                nextStatus,

              organisationId:
                activeOrganisationId,
            }
          );

          setTodos(
            previousTodos
          );

          return;
        }

        // ------------------------------------------
        // SYNC UI WITH DATABASE RESULT
        // ------------------------------------------

        setTodos(
          (
            previous
          ) =>
            previous.map(
              (
                task
              ) =>
                task.id ===
                id
                  ? {
                      ...task,

                      completed:
                        isCompletedTaskStatus(
                          data.status
                        ),

                      status:
                        data.status ||
                        nextStatus,
                    }
                  : task
            )
        );
      } catch (
        updateError
      ) {
        console.error(
          "Unexpected task update error:",
          updateError
        );

        setTodos(
          previousTodos
        );
      }
    };

  const addTask =
    async () => {
      const cleaned =
        taskInput.trim();

      if (
        !cleaned ||
        !activeOrganisationId
      ) {
        return;
      }

      let userId =
        currentUserId;

      if (
        !userId
      ) {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        userId =
          user?.id ||
          null;
      }

      if (
        !userId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "tasks"
          )
          .insert({
            title:
              cleaned,

            description:
              "",

            status:
              "todo",

            organisation_id:
              activeOrganisationId,

            user_id:
              userId,

            assigned_to:
              userId,
          })
          .select(
            "id, title, status, project_id, assigned_to, created_at"
          )
          .single();

      if (
        error
      ) {
        console.error(
          "Quick task create failed:",
          {
            code:
              error.code,

            message:
              error.message,

            details:
              error.details,

            hint:
              error.hint,
          }
        );

        return;
      }

      if (
        data
      ) {
        setTodos(
          (
            previous
          ) => [
            {
              id:
                data.id,

              text:
                data.title ||
                cleaned,

              completed:
                isCompletedTaskStatus(
                  data.status
                ),

              status:
                data.status ||
                "todo",

              projectId:
                data.project_id ||
                null,

              assignedTo:
                data.assigned_to ||
                null,

              createdAt:
                data.created_at ||
                null,
            },

            ...previous,
          ]
        );
      }

      setTaskInput(
        ""
      );
    };

  // ==================================================
  // NOTE ACTIONS
  // ==================================================

  const addNote =
    async () => {
      const cleaned =
        noteInput.trim();

      if (
        !cleaned ||
        !activeOrganisationId
      ) {
        return;
      }

      let userId =
        currentUserId;

      if (
        !userId
      ) {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        userId =
          user?.id ||
          null;
      }

      if (
        !userId
      ) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "notes"
          )
          .insert({
            title:
              cleaned,

            content:
              cleaned,

            type:
              "note",

            organisation_id:
              activeOrganisationId,

            user_id:
              userId,
          })
          .select()
          .single();

      if (
        error
      ) {
        console.error(
          "Quick note create failed:",
          {
            code:
              error.code,

            message:
              error.message,

            details:
              error.details,

            hint:
              error.hint,
          }
        );

        return;
      }

      if (
        data
      ) {
        setNotes(
          (
            previous
          ) => [
            data,
            ...previous,
          ]
        );
      }

      setNoteInput(
        ""
      );
    };

  // ==================================================
  // CLARITY CHAT
  // ==================================================

  const handleAskClarity =
    async () => {
      const query =
        clarityCommand.trim();

      if (
        !query ||
        clarityStreaming
      ) {
        return;
      }

      if (
        !activeOrganisationId
      ) {
        return;
      }

      let userId =
        currentUserId;

      if (
        !userId
      ) {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        userId =
          user?.id ||
          null;

        if (
          userId
        ) {
          setCurrentUserId(
            userId
          );
        }
      }

      if (
        !userId
      ) {
        console.error(
          "Clarity cannot run without an authenticated user."
        );

        return;
      }

      let activeChatId =
        clarityChatId;

      if (
        !activeChatId
      ) {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "clarity_chats"
            )
            .insert({
              organisation_id:
                activeOrganisationId,

              title:
                query.length >
                40
                  ? `${query.slice(
                      0,
                      40
                    )}...`
                  : query,
            })
            .select()
            .single();

        if (
          error ||
          !data
        ) {
          console.error(
            "Unable to create Clarity chat:",
            error
          );

          return;
        }

        activeChatId =
          data.id;

        setClarityChatId(
          data.id
        );

        localStorage.setItem(
          "clarity_active_chat",
          data.id
        );

        await loadClarityChats();
      }

      const userMessage:
        ClarityMessage = {
        role:
          "user",

        content:
          query,
      };

      setClarityMessages(
        (
          previous
        ) => [
          ...previous,
          userMessage,
        ]
      );

      setClarityCommand(
        ""
      );

      setClarityStreaming(
        true
      );

      try {
        const {
          data,
          error,
        } =
          await supabase.functions.invoke(
            "clarity-chat",
            {
              body: {
                message:
                  query,

                organisationId:
                  activeOrganisationId,

                chatId:
                  activeChatId,

                context: {
                  tasks:
                    openTasks,

                  projects,

                  events:
                    events.map(
                      (
                        event
                      ) => ({
                        id:
                          event.id,

                        title:
                          event.title,

                        startAt:
                          event.startAt
                            ?.toISOString() ||
                          null,

                        endAt:
                          event.endAt
                            ?.toISOString() ||
                          null,
                      })
                    ),

                  emails,

                  notes,

                  finance: {
                    revenue:
                      stats.currentRevenue,

                    invoicesDue:
                      stats.invoicesDue,
                  },

                  risk:
                    riskLevel,

                  aiActions,

                  memory:
                    clarityMemoryContext,
                },
              },
            }
          );

        if (
          error
        ) {
          throw error;
        }

        const answer =
          String(
            data?.answer ||
              data?.message ||
              ""
          ).trim();

        if (
          !answer
        ) {
          throw new Error(
            "Clarity returned no response"
          );
        }

        const assistantMessage:
          ClarityMessage = {
          role:
            "assistant",

          content:
            answer,
        };

        setClarityMessages(
          (
            previous
          ) => [
            ...previous,
            assistantMessage,
          ]
        );

        setClarityResponse(
          answer
        );

        // ------------------------------------------
        // SAVE CHAT MESSAGES
        // ------------------------------------------

        if (
          activeChatId
        ) {
          const {
            error:
              messagesError,
          } =
            await supabase
              .from(
                "clarity_messages"
              )
              .insert([
                {
                  chat_id:
                    activeChatId,

                  role:
                    "user",

                  content:
                    query,
                },

                {
                  chat_id:
                    activeChatId,

                  role:
                    "assistant",

                  content:
                    answer,
                },
              ]);

          if (
            messagesError
          ) {
            console.warn(
              "Clarity message persistence error:",
              messagesError
            );
          }
        }

        // ------------------------------------------
        // SAVE CLARITY MEMORY
        // ------------------------------------------

        const memoryValue =
          `User asked: ${query}\n\nClarity answered: ${answer}`;

        const {
          error:
            memoryError,
        } =
          await supabase
            .from(
              "clarity_memory"
            )
            .insert({
              user_id:
                userId,

              organisation_id:
                activeOrganisationId,

              memory_key:
                createMemoryKey(),

              memory_value:
                memoryValue,

              category:
                "conversation",

              importance:
                5,

              confidence:
                1,

              source:
                "dashboard_clarity",

              is_active:
                true,
            });

        if (
          memoryError
        ) {
          console.warn(
            "Clarity memory persistence error:",
            memoryError
          );
        }

        await Promise.all([
          loadClarityMemory(),
          loadClarityChats(),
        ]);
      } catch (
        clarityError
      ) {
        console.error(
          "Clarity error:",
          clarityError
        );

        const fallback =
          `Open tasks: ${openTasks.length}\n` +
          `Active projects: ${stats.activeProjects}\n` +
          `Upcoming events: ${events.length}\n` +
          `Invoices due: ${stats.invoicesDue}\n` +
          `Paid revenue: £${formatCurrency(
            stats.currentRevenue
          )}`;

        setClarityResponse(
          fallback
        );

        setClarityMessages(
          (
            previous
          ) => [
            ...previous,

            {
              role:
                "assistant",

              content:
                fallback,
            },
          ]
        );
      } finally {
        setClarityStreaming(
          false
        );
      }
    };

  // ==================================================
  // CLARITY BRIEF
  // ==================================================

  const handleClarityBrief =
    () => {
      const brief =
        `CLARITY DAILY BRIEF\n\n` +
        `Good morning — hope you slept well. ${dailyAffirmation}\n\n` +
        `${aiSummary}\n\n` +
        `Open Tasks: ${openTasks.length}\n` +
        `Active Projects: ${stats.activeProjects}\n` +
        `Upcoming Events: ${events.length}\n` +
        `Invoices Due: ${stats.invoicesDue}\n` +
        `Paid Revenue: £${formatCurrency(
          stats.currentRevenue
        )}\n\n` +
        `Priorities:\n${
          aiActions.length
            ? aiActions
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    action,
                    index
                  ) =>
                    `${
                      index +
                      1
                    }. ${action}`
                )
                .join(
                  "\n"
                )
            : "No urgent priorities detected."
        }`;

      setClarityResponse(
        brief
      );

      setShowBriefModal(
        true
      );
    };

  // ==================================================
  // AUTH ERROR
  // ==================================================

  if (
    authError
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] p-6">
        <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 text-center">
          <h1 className="font-serif text-3xl italic">
            Authentication required
          </h1>

          <p className="mt-3 text-xs text-stone-400">
            Your verification link has expired or is no longer valid.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                "/login"
              )
            }
            className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-white"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <Loader2
          size={24}
          className="animate-spin text-[#A3B18A]"
        />
      </div>
    );
  }

  // ==================================================
  // DASHBOARD ERROR
  // ==================================================

  if (
    dashboardError
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6] p-6">
        <div className="w-full max-w-lg rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">
            Dashboard Error
          </p>

          <h1 className="mt-2 font-serif text-3xl italic text-stone-800">
            We couldn&apos;t load your business overview
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            {
              dashboardError
            }
          </p>

          <button
            type="button"
            onClick={() =>
              void loadDashboardData()
            }
            className="mt-6 rounded-xl bg-stone-900 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // DASHBOARD DERIVED DATA
  // ==================================================

  const now =
    new Date();

  const startOfToday =
    new Date(
      now
    );

  startOfToday.setHours(
    0,
    0,
    0,
    0
  );

  const endOfToday =
    new Date(
      now
    );

  endOfToday.setHours(
    23,
    59,
    59,
    999
  );

  const todayEvents =
    events.filter(
      (
        event
      ) =>
        event.startAt &&
        event.startAt >=
          startOfToday &&
        event.startAt <=
          endOfToday
    );

  const upcomingEvents =
    [
      ...events,
    ]
      .filter(
        (
          event
        ) =>
          event.startAt &&
          event.startAt >=
            now
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            a.startAt
              ?.getTime() ??
            Infinity
          ) -
          (
            b.startAt
              ?.getTime() ??
            Infinity
          )
      )
      .slice(
        0,
        5
      );

  const activeProjects =
    projects
      .filter(
        (
          project
        ) =>
          ![
            "completed",
            "done",
            "archived",
          ].includes(
            String(
              project.status ||
                ""
            )
              .trim()
              .toLowerCase()
          )
      )
      .slice(
        0,
        4
      );

  const recentNotes =
    notes
      .filter(
        (
          note
        ) =>
          ![
            "task",
            "todo",
          ].includes(
            String(
              note.type ||
                ""
            )
              .trim()
              .toLowerCase()
          )
      )
      .slice(
        0,
        4
      );

  const priorityTasks =
    [
      ...openTasks,
    ]
      .sort(
        (
          a,
          b
        ) =>
          getTaskScore(
            b
          ) -
          getTaskScore(
            a
          )
      )
      .slice(
        0,
        5
      );

  const upcomingProjects =
    [
      ...projects,
    ]
      .filter(
        (
          project
        ) =>
          ![
            "completed",
            "done",
            "archived",
          ].includes(
            String(
              project.status ||
                ""
            )
              .trim()
              .toLowerCase()
          )
      )
      .sort(
        (
          a,
          b
        ) => {
          const aDue =
            a.due_date
              ? new Date(
                  a.due_date
                ).getTime()
              : Infinity;

          const bDue =
            b.due_date
              ? new Date(
                  b.due_date
                ).getTime()
              : Infinity;

          return (
            aDue - bDue
          );
        }
      )
      .slice(
        0,
        4
      );

  const clarityBriefText =
    useMemo(() => {
      const priorityBlock =
        aiActions.length >
        0
          ? aiActions
              .slice(
                0,
                4
              )
              .map(
                (
                  action,
                  index
                ) =>
                  `${
                    index +
                    1
                  }. ${action}`
              )
              .join(
                "\n"
              )
          : "No urgent priorities detected.";

      const taskBlock =
        priorityTasks.length >
        0
          ? priorityTasks
              .slice(
                0,
                5
              )
              .map(
                (
                  task,
                  index
                ) =>
                  `${
                    index +
                    1
                  }. ${task.text}${
                    task.status
                      ? ` [${task.status}]`
                      : ""
                  }`
              )
              .join(
                "\n"
              )
          : "No open tasks.";

      const noteBlock =
        recentNotes.length >
        0
          ? recentNotes
              .slice(
                0,
                4
              )
              .map(
                (
                  note,
                  index
                ) => {
                  const title =
                    note.title ||
                    note.content ||
                    "Untitled note";

                  return `${
                    index +
                    1
                  }. ${title} (${formatBriefDate(
                    note.created_at
                  )})`;
                }
              )
              .join(
                "\n"
              )
          : "No notes.";

      const projectBlock =
        upcomingProjects.length >
        0
          ? upcomingProjects
              .map(
                (
                  project,
                  index
                ) =>
                  `${
                    index +
                    1
                  }. ${
                    project.name ||
                    "Untitled project"
                  }${
                    project.due_date
                      ? ` (due ${formatBriefDate(
                          project.due_date
                        )})`
                      : ""
                  }`
              )
              .join(
                "\n"
              )
          : "No active projects.";

      const eventBlock =
        upcomingEvents.length >
        0
          ? upcomingEvents
              .slice(
                0,
                5
              )
              .map(
                (
                  event,
                  index
                ) =>
                  `${
                    index +
                    1
                  }. ${event.title} (${formatBriefDateTime(
                    event.startAt
                  )})`
              )
              .join(
                "\n"
              )
          : "No upcoming events.";

      return (
        `CLARITY DAILY BRIEF\n\n` +
        `${greeting} - ${dailyAffirmation}\n\n` +
        `${aiSummary}\n\n` +
        `Open Tasks: ${openTasks.length}\n` +
        `Active Projects: ${stats.activeProjects}\n` +
        `Upcoming Events: ${upcomingEvents.length}\n` +
        `Invoices Due: ${stats.invoicesDue}\n` +
        `Paid Revenue: GBP ${formatCurrency(
          stats.currentRevenue
        )}\n\n` +
        `Priorities:\n${priorityBlock}\n\n` +
        `Upcoming Tasks:\n${taskBlock}\n\n` +
        `Upcoming Notes:\n${noteBlock}\n\n` +
        `Upcoming Projects:\n${projectBlock}\n\n` +
        `Calendar Events:\n${eventBlock}`
      );
    }, [
      aiActions,
      aiSummary,
      dailyAffirmation,
      greeting,
      openTasks.length,
      priorityTasks,
      recentNotes,
      stats.activeProjects,
      stats.currentRevenue,
      stats.invoicesDue,
      upcomingEvents,
      upcomingProjects,
    ]);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] bg-[#faf9f6] p-4 font-sans text-stone-900 sm:p-6 lg:p-8">

      <button
        type="button"
        onClick={() =>
          setShowClarityWidget(
            (
              current
            ) =>
              !current
          )
        }
        className="fixed right-6 top-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl transition hover:scale-105"
        aria-label="Open Clarity"
      >
        <Sparkles
          size={16}
        />

        {clarityNotifications.length >
          0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#A3B18A] px-1 text-[7px] font-black text-white">
            {
              clarityNotifications.length
            }
          </span>
        )}
      </button>

      {showClarityWidget && (
        <div className="fixed right-4 top-20 z-50 flex max-h-[calc(100vh-100px)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl sm:right-6">

          <div className="flex items-center justify-between border-b border-stone-100 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-[#A3B18A]">
                <Sparkles
                  size={14}
                />
              </div>

              <div>
                <p className="text-sm font-black">
                  Clarity
                </p>

                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Business Intelligence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowClarityWidget(
                  false
                )
              }
              className="rounded-full p-2 text-stone-400 hover:bg-stone-100"
              aria-label="Close Clarity"
            >
              <X
                size={16}
              />
            </button>
          </div>

          <div className="overflow-y-auto p-4">

            <div className="grid grid-cols-2 gap-2">

              <button
                type="button"
                onClick={() =>
                  void startNewClarityChat()
                }
                className="rounded-xl border border-stone-200 px-3 py-2.5 text-[8px] font-black uppercase tracking-widest"
              >
                New Chat
              </button>

              <button
                type="button"
                onClick={
                  handleClarityBrief
                }
                className="rounded-xl bg-[#A3B18A]/10 px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-stone-700"
              >
                Daily Brief
              </button>
            </div>

            {clarityChats.length >
              0 && (
              <div className="mt-4">

                <p className="mb-2 text-[7px] font-black uppercase tracking-widest text-stone-300">
                  Recent chats
                </p>

                <div className="space-y-1">

                  {clarityChats
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        chat
                      ) => (
                        <button
                          type="button"
                          key={
                            chat.id
                          }
                          onClick={() => {
                            setClarityChatId(
                              chat.id
                            );

                            localStorage.setItem(
                              "clarity_active_chat",
                              chat.id
                            );

                            void loadClarityMessages(
                              chat.id
                            );
                          }}
                          className={`w-full truncate rounded-xl p-2.5 text-left text-[9px] font-bold ${
                            clarityChatId ===
                            chat.id
                              ? "bg-[#A3B18A]/10 text-stone-800"
                              : "bg-[#faf9f6] text-stone-600"
                          }`}
                        >
                          {chat.title ||
                            "Clarity conversation"}
                        </button>
                      )
                    )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-[#faf9f6] p-2">

              <textarea
                value={
                  clarityCommand
                }
                onChange={(
                  event
                ) =>
                  setClarityCommand(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    void handleAskClarity();
                  }
                }}
                rows={3}
                placeholder="Ask Clarity about your business..."
                className="w-full resize-none bg-transparent p-2 text-xs outline-none placeholder:text-stone-300"
              />

              <button
                type="button"
                onClick={() =>
                  void handleAskClarity()
                }
                disabled={
                  clarityStreaming ||
                  !clarityCommand.trim()
                }
                className="w-full rounded-xl bg-stone-900 py-2.5 text-[8px] font-black uppercase tracking-widest text-white disabled:opacity-40"
              >
                {clarityStreaming
                  ? "Analysing..."
                  : "Ask Clarity"}
              </button>
            </div>

            {clarityStreaming && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#faf9f6] p-3">

                <div className="flex gap-1">

                  {[
                    0,
                    1,
                    2,
                  ].map(
                    (
                      item
                    ) => (
                      <span
                        key={
                          item
                        }
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A3B18A]"
                        style={{
                          animationDelay:
                            `${
                              item *
                              120
                            }ms`,
                        }}
                      />
                    )
                  )}
                </div>

                <span className="text-[9px] text-stone-400">
                  Clarity is thinking
                </span>
              </div>
            )}

            {clarityMessages.length >
              0 && (
              <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">

                {clarityMessages
                  .slice(
                    -8
                  )
                  .map(
                    (
                      message,
                      index
                    ) => (
                      <div
                        key={
                          message.id ||
                          index
                        }
                        className={
                          message.role ===
                          "user"
                            ? "ml-auto max-w-[88%] rounded-2xl bg-stone-900 p-3 text-[10px] leading-relaxed text-white"
                            : "max-w-[92%] rounded-2xl border border-stone-200 p-3 text-[10px] leading-relaxed text-stone-600"
                        }
                      >
                        {
                          message.content
                        }
                      </div>
                    )
                  )}
              </div>
            )}

            {!clarityStreaming &&
              clarityMessages.length ===
                0 &&
              clarityResponse && (
                <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-stone-200 p-3 text-[10px] leading-relaxed text-stone-600">
                  {
                    clarityResponse
                  }
                </div>
              )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/clarity"
                )
              }
              className="mt-4 w-full rounded-xl bg-[#A3B18A] py-3 text-[8px] font-black uppercase tracking-widest text-white"
            >
              Open Full Clarity
            </button>
          </div>
        </div>
      )}

      {showBriefModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">

          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-6">

            <button
              type="button"
              onClick={() =>
                setShowBriefModal(
                  false
                )
              }
              className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100"
              aria-label="Close daily brief"
            >
              <X
                size={18}
              />
            </button>

            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#A3B18A]">
              Clarity
            </p>

            <h2 className="mt-2 font-serif text-3xl italic">
              Today&apos;s brief
            </h2>

            <div className="mt-4 rounded-2xl border border-[#A3B18A]/20 bg-[#f7f8f3] p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">
                Daily affirmation
              </p>
              <p className="mt-2 font-serif text-xl italic leading-snug text-stone-900">
                “{dailyAffirmation}”
              </p>
            </div>

            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#faf9f6] p-4 text-[11px] leading-relaxed text-stone-700">
              {clarityResponse ||
                "No brief is available yet."}
            </div>
          </div>
        </div>
      )}

      <header className="mb-4 flex flex-col justify-between gap-4 lg:mb-5 lg:flex-row lg:items-end lg:gap-5">

        <div>

          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />

            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              {formatDashboardDate(
                currentTime
              )}
            </p>
          </div>

          <h1 className="mt-3 font-serif text-4xl italic tracking-tight sm:text-5xl">
            {
              greetingText
            }

            <span className="text-[#A3B18A]">
              .
            </span>
          </h1>

          <p className="mt-2 text-xs text-stone-400">
            Here&apos;s everything happening across your business.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowClarityWidget(
              true
            )
          }
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-[#A3B18A]"
        >

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#A3B18A]/10 text-[#8b9c74]">
            <Sparkles
              size={14}
            />
          </div>

          <div>

            <p className="text-[7px] font-black uppercase tracking-widest text-stone-400">
              Clarity says
            </p>

            <p className="mt-0.5 text-[10px] font-bold text-stone-700">
              {riskLevel ===
              "low"
                ? "Everything looks steady"
                : riskLevel ===
                    "medium"
                  ? "A few areas need attention"
                  : "Your workload needs attention"}
            </p>
          </div>
        </button>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-3 lg:mb-5 lg:grid-cols-6">

        {[
          {
            label:
              "Health",

            value:
              `${healthScore}%`,
          },

          {
            label:
              "Open Tasks",

            value:
              openTasks.length,
          },

          {
            label:
              "Projects",

            value:
              stats.activeProjects,
          },

          {
            label:
              "Today",

            value:
              todayEvents.length,
          },

          {
            label:
              "Invoices Due",

            value:
              stats.invoicesDue,
          },

          {
            label:
              "Revenue",

            value:
              `£${formatCurrency(
                stats.currentRevenue
              )}`,
          },
        ].map(
          (
            item
          ) => (
            <div
              key={
                item.label
              }
              className="rounded-2xl border border-stone-200 bg-white p-3.5"
            >

              <p className="text-[7px] font-black uppercase tracking-widest text-stone-400">
                {
                  item.label
                }
              </p>

              <p className="mt-2 font-serif text-2xl italic text-stone-900">
                {
                  item.value
                }
              </p>
            </div>
          )
        )}
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 lg:mb-5 lg:grid-cols-12 lg:gap-4">

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-4 lg:col-span-5 lg:p-5">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A3B18A]">
                Focus
              </p>

              <h2 className="mt-1 font-serif text-2xl italic">
                Today&apos;s priorities
              </h2>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-widest ${
                riskLevel ===
                "high"
                  ? "bg-red-50 text-red-500"
                  : riskLevel ===
                      "medium"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-[#A3B18A]/10 text-[#7f9069]"
              }`}
            >
              {
                riskLevel
              }{" "}
              risk
            </span>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
            {
              aiSummary
            }
          </p>

          <div className="mt-5 space-y-2">

            {aiActions.length >
            0 ? (
              aiActions
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    action,
                    index
                  ) => (
                    <div
                      key={`${action}-${index}`}
                      className="flex items-center gap-3 rounded-xl bg-[#faf9f6] p-3"
                    >

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[8px] font-black text-white">
                        {index +
                          1}
                      </span>

                      <p className="text-[10px] font-semibold text-stone-700">
                        {
                          action
                        }
                      </p>
                    </div>
                  )
                )
            ) : (
              <p className="rounded-xl bg-[#faf9f6] p-4 text-[10px] text-stone-400">
                No urgent priorities detected.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={
              handleClarityBrief
            }
            className="mt-4 text-[8px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900"
          >
            View Clarity Brief →
          </button>
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-4 lg:col-span-4 lg:p-5">

          <div className="flex items-center justify-between">

            <h2 className="flex items-center gap-2 font-serif text-2xl italic">

              <Clock
                size={15}
                className="text-[#A3B18A]"
              />

              Coming up
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/calendar"
                )
              }
              className="text-[7px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900"
            >
              Calendar
            </button>
          </div>

          <div className="mt-4 space-y-2">

            {upcomingEvents.length >
            0 ? (
              upcomingEvents.map(
                (
                  event
                ) => (
                  <button
                    type="button"
                    key={
                      event.id ||
                      `${event.title}-${event.startAt?.toISOString()}`
                    }
                    onClick={() =>
                      router.push(
                        "/calendar"
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-xl bg-[#faf9f6] p-3 text-left transition hover:bg-stone-100"
                  >

                    <div className="min-w-[42px] text-center">

                      <p className="text-[8px] font-black uppercase text-[#8b9c74]">
                        {event.startAt?.toLocaleDateString(
                          "en-GB",
                          {
                            weekday:
                              "short",
                          }
                        )}
                      </p>

                      <p className="mt-0.5 text-[9px] font-bold text-stone-500">
                        {event.startAt?.toLocaleTimeString(
                          "en-GB",
                          {
                            hour:
                              "2-digit",

                            minute:
                              "2-digit",
                          }
                        )}
                      </p>
                    </div>

                    <div className="h-7 w-px bg-stone-200" />

                    <p className="min-w-0 truncate text-[10px] font-bold text-stone-700">
                      {
                        event.title
                      }
                    </p>
                  </button>
                )
              )
            ) : (
              <div className="rounded-xl bg-[#faf9f6] p-6 text-center">

                <p className="text-[10px] text-stone-400">
                  Nothing coming up.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.6rem] bg-stone-900 p-4 text-white lg:col-span-3 lg:p-5">

          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A3B18A]">
            Snapshot
          </p>

          <h2 className="mt-1 font-serif text-2xl italic">
            Business now
          </h2>

          <div className="mt-5 space-y-4">

            <div>

              <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                Paid Revenue
              </p>

              <p className="mt-1 font-serif text-2xl italic">
                £
                {formatCurrency(
                  stats.currentRevenue
                )}
              </p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-4">

              <div>

                <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                  Team
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    teamMembers.length
                  }
                </p>
              </div>

              <div>

                <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                  Emails
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    emails.length
                  }
                </p>
              </div>

              <div>

                <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                  Projects
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    stats.activeProjects
                  }
                </p>
              </div>

              <div>

                <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                  Events
                </p>

                <p className="mt-1 text-xl font-bold">
                  {
                    events.length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-[1.6rem] border border-stone-200 bg-white p-4 lg:mb-5 lg:p-5">

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

          <div>

            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A3B18A]">
              Work Queue
            </p>

            <h2 className="mt-1 font-serif text-2xl italic">
              Priority tasks
            </h2>
          </div>

          <div className="flex gap-2">

            <input
              value={
                taskInput
              }
              onChange={(
                event
              ) =>
                setTaskInput(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void addTask();
                }
              }}
              placeholder="Add task..."
              className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2.5 text-[10px] outline-none transition focus:border-[#A3B18A] sm:w-52"
            />

            <button
              type="button"
              onClick={() =>
                void addTask()
              }
              disabled={
                !taskInput.trim()
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-[#A3B18A] disabled:opacity-40"
              aria-label="Add task"
            >
              <Plus
                size={13}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">

          {priorityTasks.length >
          0 ? (
            priorityTasks.map(
              (
                todo
              ) => (
                <div
                  key={
                    todo.id
                  }
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 bg-[#faf9f6] p-3"
                >

                  <button
                    type="button"
                    onClick={() =>
                      void toggleTodo(
                        todo.id,
                        todo.completed
                      )
                    }
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-stone-300 bg-white transition hover:border-[#A3B18A]"
                    aria-label={`Complete ${todo.text}`}
                  >
                    {todo.completed && (
                      <Check
                        size={11}
                      />
                    )}
                  </button>

                  <p className="min-w-0 flex-1 truncate text-[10px] font-bold text-stone-700">
                    {
                      todo.text
                    }
                  </p>

                  {getTaskPriorityLabel(
                    todo
                  ) ===
                    "HIGH" && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-[6px] font-black text-red-500">
                      HIGH
                    </span>
                  )}
                </div>
              )
            )
          ) : (
            <div className="col-span-full rounded-xl bg-[#faf9f6] p-5 text-center">

              <p className="text-[10px] text-stone-400">
                You&apos;re all caught up.
              </p>
            </div>
          )}
        </div>

        {openTasks.length >
          5 && (
          <button
            type="button"
            onClick={() =>
              router.push(
                "/notes"
              )
            }
            className="mt-4 text-[8px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900"
          >
            View all{" "}
            {
              openTasks.length
            }{" "}
            tasks →
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-4 lg:p-5">

          <div className="flex items-center justify-between">

            <h2 className="flex items-center gap-2 font-serif text-xl italic">

              <Briefcase
                size={14}
                className="text-[#A3B18A]"
              />

              Projects
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/projects"
                )
              }
              className="text-[7px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900"
            >
              View all
            </button>
          </div>

          <div className="mt-4 space-y-2">

            {activeProjects.length >
            0 ? (
              activeProjects.map(
                (
                  project
                ) => (
                  <button
                    type="button"
                    key={
                      project.id
                    }
                    onClick={() =>
                      router.push(
                        `/projects/${project.id}`
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl bg-[#faf9f6] p-3 text-left transition hover:bg-stone-100"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-[10px] font-bold text-stone-700">
                        {project.name ||
                          "Project"}
                      </p>

                      <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-stone-400">
                        {project.status ||
                          "Active"}
                      </p>
                    </div>

                    <span
                      className={`h-2 w-2 rounded-full ${
                        String(
                          project.health ||
                            ""
                        ).toLowerCase() ===
                          "good" ||
                        String(
                          project.health ||
                            ""
                        ).toLowerCase() ===
                          "stable"
                          ? "bg-[#A3B18A]"
                          : "bg-stone-300"
                      }`}
                    />
                  </button>
                )
              )
            ) : (
              <p className="rounded-xl bg-[#faf9f6] p-5 text-center text-[10px] text-stone-400">
                No active projects.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/projects"
              )
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 py-3 text-[8px] font-black uppercase tracking-widest text-stone-400 transition hover:border-[#A3B18A] hover:text-stone-700"
          >
            <Plus
              size={11}
            />

            New Project
          </button>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <h2 className="flex items-center gap-2 font-serif text-xl italic">

              <FileText
                size={14}
                className="text-[#A3B18A]"
              />

              Notes
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/notes"
                )
              }
              className="text-[7px] font-black uppercase tracking-widest text-stone-400 transition hover:text-stone-900"
            >
              View all
            </button>
          </div>

          <div className="mt-4 flex gap-2">

            <input
              value={
                noteInput
              }
              onChange={(
                event
              ) =>
                setNoteInput(
                  event.target
                    .value
                )
              }
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void addNote();
                }
              }}
              placeholder="Quick note..."
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2.5 text-[10px] outline-none transition focus:border-[#A3B18A]"
            />

            <button
              type="button"
              onClick={() =>
                void addNote()
              }
              disabled={
                !noteInput.trim()
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-[#A3B18A] disabled:opacity-40"
              aria-label="Add note"
            >
              <Plus
                size={12}
              />
            </button>
          </div>

          <div className="mt-3 space-y-2">

            {recentNotes.length >
            0 ? (
              recentNotes.map(
                (
                  note
                ) => (
                  <button
                    type="button"
                    key={
                      note.id
                    }
                    onClick={() =>
                      router.push(
                        "/notes"
                      )
                    }
                    className="w-full truncate rounded-xl bg-[#faf9f6] p-3 text-left text-[10px] font-medium text-stone-600 transition hover:bg-stone-100"
                  >
                    {note.content ||
                      note.title ||
                      "Untitled note"}
                  </button>
                )
              )
            ) : (
              <p className="rounded-xl bg-[#faf9f6] p-5 text-center text-[10px] text-stone-400">
                No notes yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <h2 className="flex items-center gap-2 font-serif text-xl italic">

              <Mail
                size={14}
                className="text-[#A3B18A]"
              />

              Recent emails
            </h2>

            <span className="text-[8px] font-black text-stone-400">
              {
                emails.length
              }
            </span>
          </div>

          <div className="mt-4 space-y-2">

            {emails.length >
            0 ? (
              emails
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    email,
                    index
                  ) => (
                    <button
                      type="button"
                      key={
                        email.id ||
                        index
                      }
                      onClick={() =>
                        router.push(
                          "/crm"
                        )
                      }
                      className="w-full rounded-xl bg-[#faf9f6] p-3 text-left transition hover:bg-stone-100"
                    >

                      <div className="flex items-center justify-between gap-2">

                        <p className="min-w-0 truncate text-[10px] font-bold text-stone-700">
                          {email.subject ||
                            "Email"}
                        </p>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[6px] font-black uppercase ${
                            email.direction ===
                            "outbound"
                              ? "bg-[#A3B18A]/10 text-[#7f9069]"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {email.direction ===
                          "outbound"
                            ? "Sent"
                            : "Received"}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[8px] text-stone-400">
                        {email.created_at
                          ? new Date(
                              email.created_at
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                day:
                                  "numeric",

                                month:
                                  "short",
                              }
                            )
                          : "Recent activity"}
                      </p>
                    </button>
                  )
                )
            ) : (
              <div className="rounded-xl bg-[#faf9f6] p-5 text-center">

                <p className="text-[10px] text-stone-400">
                  No recent email activity.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2 pb-4">

        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-300">
          TOTS-OS Business Overview
        </p>

        <div className="flex items-center gap-2">

          <span className="h-1.5 w-1.5 rounded-full bg-[#A3B18A]" />

          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-300">
            Clarity monitoring active
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// PAGE
// ==================================================

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#faf9f6]">
          <Loader2
            className="animate-spin text-[#A3B18A]"
            size={28}
          />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}