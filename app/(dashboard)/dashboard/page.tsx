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

import { createBrowserClient } from "@supabase/ssr";

import { useSettings } from "@/app/context/SettingsContext";

import {
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  Loader2,
  Mail,
  Plus,
  PoundSterling,
  Sparkles,
  TrendingUp,
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
};

type TeamMember = {
  full_name: string;
  role: string;
};

type ClarityMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

type NormalisedEvent = {
  id?: string;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
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
    cleanName(value);

  if (!cleaned) {
    return "";
  }

  return (
    cleaned.split(/\s+/)[0] ??
    ""
  );
}

function formatDashboardDate(
  date: Date
) {
  return date.toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  );
}

function getHealthScore(
  riskLevel: RiskLevel
) {
  if (
    riskLevel === "high"
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
        String(value)
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
      event?.payload?.new?.id,

    title:
      event?.title ||
      event?.payload?.new
        ?.title ||
      "Event",

    startAt:
      parseDate(rawStart),

    endAt:
      parseDate(rawEnd),
  };
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
    organisationId,
  } = useSettings();

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
  // USER / GENERAL STATE
  // ==================================================

  const [
    userName,
    setUserName,
  ] =
    useState<string>("");

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState<Date>(
      new Date()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    isScanActive,
    setIsScanActive,
  ] =
    useState(false);

  const [
    showScanModal,
    setShowScanModal,
  ] =
    useState(false);

  const [
    insight,
    setInsight,
  ] =
    useState<
      string | null
    >(null);

  // ==================================================
  // DASHBOARD DATA
  // ==================================================

  const [
    stats,
    setStats,
  ] = useState({
    activeProjects: 0,
    invoicesDue: 0,
    socialsPending: 0,
    emailsScheduled: 0,
    currentProfit: 0,
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
    useState<any[]>([]);

  const [
    projects,
    setProjects,
  ] =
    useState<any[]>([]);

  const [
    notes,
    setNotes,
  ] =
    useState<any[]>([]);

  // ==================================================
  // CLARITY INTELLIGENCE
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
    useState(false);

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
    useState<any[]>([]);

  const [
    clarityMemory,
    setClarityMemory,
  ] =
    useState<any[]>([]);

  const [
    showClarityWidget,
    setShowClarityWidget,
  ] =
    useState(false);

  const [
    showBriefModal,
    setShowBriefModal,
  ] =
    useState(false);

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

  const [
    eventStream,
    setEventStream,
  ] =
    useState<any[]>([]);

  const [
    clarityNotifications,
    setClarityNotifications,
  ] =
    useState<
      string[]
    >([]);

  // ==================================================
  // DERIVED UI VALUES
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

  const openTasks =
    todos.filter(
      (task) =>
        !task.completed
    );

  const completedTasks =
    todos.filter(
      (task) =>
        task.completed
    );

  const healthScore =
    getHealthScore(
      riskLevel
    );

  // ==================================================
  // CLOCK
  // ==================================================

  useEffect(() => {
    const timer =
      window.setInterval(
        () =>
          setCurrentTime(
            new Date()
          ),
        60000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, []);

  // ==================================================
  // CLARITY LOADERS
  // ==================================================

  const loadClarityChats =
    useCallback(
      async () => {
        if (
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
              "clarity_chats"
            )
            .select(
              "id, title, created_at"
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
            );

        if (!error) {
          setClarityChats(
            data || []
          );
        }
      },
      [
        organisationId,
        supabase,
      ]
    );

  const loadClarityMessages =
    useCallback(
      async (
        chatId: string
      ) => {
        if (!chatId) {
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

        if (!error) {
          setClarityMessages(
            (data as ClarityMessage[]) ||
              []
          );
        }
      },
      [supabase]
    );

  const loadClarityMemory =
    useCallback(
      async () => {
        if (
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
              "clarity_memory"
            )
            .select(
              "id, memory, created_at"
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
            .limit(20);

        if (!error) {
          setClarityMemory(
            data || []
          );
        }
      },
      [
        organisationId,
        supabase,
      ]
    );

  const startNewClarityChat =
    useCallback(
      async () => {
        if (
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
              "clarity_chats"
            )
            .insert({
              organisation_id:
                organisationId,
              title:
                "New Clarity Conversation",
            })
            .select()
            .single();

        if (
          !error &&
          data
        ) {
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
        }
      },
      [
        organisationId,
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
        if (authError) {
          setLoading(
            false
          );
          return;
        }

        try {
          setLoading(
            true
          );

          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          if (!user) {
            router.replace(
              "/login"
            );
            return;
          }

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
                "full_name, name, organisation_id"
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

          /*
           * Resolve the user's real display name.
           *
           * Priority:
           * 1. profiles.full_name
           * 2. profiles.name
           * 3. auth user_metadata.full_name
           * 4. auth user_metadata.name
           * 5. auth user_metadata.display_name
           *
           * If none exist, leave it blank.
           */
          const resolvedName =
            cleanName(
              profile?.full_name
            ) ||
            cleanName(
              profile?.name
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

          const activeOrganisationId =
            organisationId ||
            profile?.organisation_id;

          if (
            !activeOrganisationId ||
            activeOrganisationId ===
              "undefined"
          ) {
            console.warn(
              "Dashboard: no organisation ID available."
            );

            return;
          }

          // ------------------------------------------
          // LOAD BUSINESS DATA
          // ------------------------------------------

          const [
            projectsRes,
            invoicesRes,
            membersRes,
            notesRes,
            eventsRes,
            emailsRes,
          ] =
            await Promise.all(
              [
                supabase
                  .from(
                    "projects"
                  )
                  .select(
                    "id, name, status"
                  )
                  .eq(
                    "organisation_id",
                    activeOrganisationId
                  )
                  .limit(
                    10
                  ),

                supabase
                  .from(
                    "invoices"
                  )
                  .select(
                    "amount, status"
                  )
                  .eq(
                    "organisation_id",
                    activeOrganisationId
                  ),

                supabase
                  .from(
                    "profiles"
                  )
                  .select(
                    "full_name, role"
                  )
                  .eq(
                    "organisation_id",
                    activeOrganisationId
                  )
                  .limit(
                    8
                  ),

                supabase
                  .from(
                    "notes"
                  )
                  .select(
                    "id, title, content, completed, status, type, created_at"
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
                  ),

                supabase
                  .from(
                    "emails"
                  )
                  .select(
                    "*"
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
                    10
                  ),
              ]
            );

          // ------------------------------------------
          // FINANCE
          // ------------------------------------------

          const invoiceData =
            (invoicesRes.data as any[]) ||
            [];

          const totalProfit =
            invoiceData.reduce(
              (
                total,
                invoice
              ) => {
                return String(
                  invoice.status ||
                    ""
                ).toLowerCase() ===
                  "paid"
                  ? total +
                      Number(
                        invoice.amount ||
                          0
                      )
                  : total;
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
                ].includes(
                  String(
                    invoice.status ||
                      ""
                  ).toLowerCase()
                )
            ).length;

          const projectData =
            (projectsRes.data as any[]) ||
            [];

          const noteData =
            (notesRes.data as any[]) ||
            [];

          const eventData =
            (
              (eventsRes.data as any[]) ||
              []
            ).map(
              normaliseEvent
            );

          const emailData =
            (emailsRes.data as any[]) ||
            [];

          // ------------------------------------------
          // STATE
          // ------------------------------------------

          setStats({
            activeProjects:
              projectData.length,

            currentProfit:
              totalProfit,

            invoicesDue:
              pendingInvoices,

            socialsPending:
              0,

            emailsScheduled:
              0,
          });

          setTeamMembers(
            (membersRes.data as TeamMember[]) ||
              []
          );

          setNotes(
            noteData
          );

          const normaliseStatus =
            (
              note: any
            ) => {
              if (
                note.completed
              ) {
                return "done";
              }

              const status =
                String(
                  note.status ||
                    ""
                )
                  .toLowerCase()
                  .trim();

              if (
                [
                  "todo",
                  "in_progress",
                  "blocked",
                  "done",
                ].includes(
                  status
                )
              ) {
                return status;
              }

              return "todo";
            };

          const loadedTodos =
            noteData
              .filter(
                (
                  note
                ) => {
                  const type =
                    String(
                      note.type ||
                        ""
                    ).toLowerCase();

                  return (
                    type ===
                      "task" ||
                    type ===
                      "todo"
                  );
                }
              )
              .map(
                (
                  note
                ) => ({
                  id:
                    note.id,

                  text:
                    note.content ||
                    note.title ||
                    "Untitled Task",

                  completed:
                    Boolean(
                      note.completed
                    ),

                  status:
                    normaliseStatus(
                      note
                    ),
                })
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

          // ------------------------------------------
          // BUSINESS PRESSURE
          // ------------------------------------------

          const emailLoad =
            emailData.length;

          const eventLoad =
            eventData.length;

          const taskLoad =
            loadedTodos.filter(
              (
                todo
              ) =>
                !todo.completed
            ).length;

          let nextRisk:
            RiskLevel =
            "low";

          if (
            taskLoad >
              8 ||
            emailLoad >
              10
          ) {
            nextRisk =
              "high";
          } else if (
            taskLoad >
              4 ||
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
              "Activity is elevated. Clarity recommends narrowing your focus to the work most likely to affect delivery or cash flow."
            );
          } else if (
            nextRisk ===
            "medium"
          ) {
            setAiSummary(
              "Your workload is manageable, but a few areas would benefit from deliberate prioritisation today."
            );
          } else {
            setAiSummary(
              "Operations look stable. You have room to focus on higher-value work, planning and growth."
            );
          }

          // ------------------------------------------
          // EXECUTIVE PRIORITIES
          // ------------------------------------------

          const priorities:
            string[] =
            [];

          const insights:
            string[] =
            [];

          if (
            taskLoad > 0
          ) {
            priorities.push(
              "Focus on highest-impact tasks"
            );
          }

          if (
            pendingInvoices >
            0
          ) {
            priorities.push(
              "Review outstanding revenue"
            );
          }

          if (
            emailLoad > 0
          ) {
            priorities.push(
              "Clear critical inbox items"
            );
          }

          if (
            eventLoad > 0
          ) {
            priorities.push(
              "Align today's schedule with priorities"
            );
          }

          const topPriorities =
            priorities.slice(
              0,
              3
            );

          const workloadScore =
            taskLoad +
            emailLoad +
            eventLoad;

          const pressureLevel =
            workloadScore >
            18
              ? "high"
              : workloadScore >
                  10
                ? "medium"
                : "low";

          if (
            pressureLevel ===
            "high"
          ) {
            insights.push(
              "Operational pressure is elevated"
            );
          }

          if (
            pressureLevel ===
            "low"
          ) {
            insights.push(
              "Capacity available for strategic work"
            );
          }

          setAiActions([
            ...topPriorities,
            ...insights,
          ]);

          // ------------------------------------------
          // NOTIFICATIONS
          // ------------------------------------------

          const notifications:
            string[] =
            [];

          if (
            taskLoad > 5
          ) {
            notifications.push(
              "Your task backlog is growing and may benefit from reprioritisation."
            );
          }

          if (
            emailLoad > 8
          ) {
            notifications.push(
              "Inbox activity is elevated."
            );
          }

          if (
            eventLoad > 5
          ) {
            notifications.push(
              "Your calendar is relatively busy."
            );
          }

          if (
            nextRisk ===
            "low"
          ) {
            notifications.push(
              "Operations are stable — a good time for strategic planning."
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
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        authError,
        organisationId,
        router,
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
      !organisationId
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
    organisationId,
    loadClarityChats,
    loadClarityMessages,
    loadClarityMemory,
  ]);

  // ==================================================
  // REALTIME
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    const channel =
      supabase.channel(
        `dashboard_runtime_${organisationId}`
      );

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "notes",
          filter:
            `organisation_id=eq.${organisationId}`,
        },
        (payload) => {
          setEventStream(
            (
              previous
            ) => [
              {
                type:
                  "note_event",
                payload,
                created_at:
                  Date.now(),
              },
              ...previous,
            ].slice(
              0,
              50
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "events",
          filter:
            `organisation_id=eq.${organisationId}`,
        },
        (payload) => {
          setEventStream(
            (
              previous
            ) => [
              {
                type:
                  "calendar_event",
                payload,
                created_at:
                  Date.now(),
              },
              ...previous,
            ].slice(
              0,
              50
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema:
            "public",
          table:
            "emails",
          filter:
            `organisation_id=eq.${organisationId}`,
        },
        (payload) => {
          setEventStream(
            (
              previous
            ) => [
              {
                type:
                  "email_event",
                payload,
                created_at:
                  Date.now(),
              },
              ...previous,
            ].slice(
              0,
              50
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [
    organisationId,
    supabase,
  ]);

  // ==================================================
  // TASK PRIORITY
  // ==================================================

  const getTaskScore = (
    task: DashboardTodo
  ) => {
    const text =
      String(
        task.text ||
          ""
      ).toLowerCase();

    let score = 0;

    if (
      !task.completed
    ) {
      score += 3;
    } else {
      score -= 5;
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
      score += 4;
    }

    if (
      text.includes(
        "!!!"
      )
    ) {
      score += 2;
    }

    if (
      text.length > 40
    ) {
      score += 1;
    }

    return score;
  };

  const getTaskPriorityLabel =
    (
      task: DashboardTodo
    ) => {
      return getTaskScore(
        task
      ) >= 6
        ? "HIGH"
        : "LOW";
    };

  // ==================================================
  // TASK ACTIONS
  // ==================================================

  const toggleTodo =
    async (
      id: string,
      currentStatus: boolean
    ) => {
      const newStatus =
        !currentStatus;

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
                      newStatus,
                    status:
                      newStatus
                        ? "done"
                        : "todo",
                  }
                : task
          )
      );

      const {
        error,
      } =
        await supabase
          .from(
            "notes"
          )
          .update({
            completed:
              newStatus,

            status:
              newStatus
                ? "done"
                : "todo",
          })
          .eq(
            "id",
            id
          );

      if (error) {
        console.error(
          "Task update failed:",
          error
        );

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
                        currentStatus,
                      status:
                        currentStatus
                          ? "done"
                          : "todo",
                    }
                  : task
            )
        );

        return;
      }

      await loadDashboardData();
    };

  const addTask =
    async () => {
      const cleaned =
        taskInput.trim();

      if (
        !cleaned ||
        !organisationId
      ) {
        return;
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

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

            completed:
              false,

            status:
              "todo",

            type:
              "task",

            organisation_id:
              organisationId,

            user_id:
              user?.id ||
              null,
          })
          .select()
          .single();

      if (
        !error &&
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
                data.content,

              completed:
                false,

              status:
                "todo",
            },
            ...previous,
          ]
        );

        setTaskInput(
          ""
        );
      }

      await loadDashboardData();
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
        !organisationId
      ) {
        return;
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      const {
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

            completed:
              false,

            type:
              "note",

            organisation_id:
              organisationId,

            user_id:
              user?.id ||
              null,
          });

      if (!error) {
        setNoteInput(
          ""
        );

        await loadDashboardData();
      }
    };

  // ==================================================
  // CLARITY CHAT
  // ==================================================

  const handleAskClarity =
    async () => {
      const query =
        clarityCommand.trim();

      if (!query) {
        return;
      }

      let activeChatId =
        clarityChatId;

      if (
        !activeChatId
      ) {
        if (
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
              "clarity_chats"
            )
            .insert({
              organisation_id:
                organisationId,

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
            "Unable to create Clarity chat",
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
      }

      setClarityResponse(
        "Clarity is analysing your workspace..."
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

                context: {
                  tasks:
                    todos.filter(
                      (
                        task
                      ) =>
                        !task.completed
                    ),

                  projects,

                  events,

                  emails,

                  notes,

                  finance:
                    stats.currentProfit,

                  risk:
                    riskLevel,

                  aiActions,

                  memory:
                    clarityMemory,
                },
              },
            }
          );

        if (error) {
          throw error;
        }

        const answer =
          String(
            data?.answer ||
              data?.message ||
              ""
          ).trim();

        if (!answer) {
          throw new Error(
            "Clarity returned no response"
          );
        }

        setClarityResponse(
          ""
        );

        let current =
          "";

        for (
          let index = 0;
          index <
          answer.length;
          index += 4
        ) {
          current +=
            answer.slice(
              index,
              index + 4
            );

          setClarityResponse(
            current
          );

          await new Promise(
            (
              resolve
            ) =>
              window.setTimeout(
                resolve,
                10
              )
          );
        }

        const newMessages: ClarityMessage[] =
          [
            ...clarityMessages,

            {
              role:
                "user",

              content:
                query,
            },

            {
              role:
                "assistant",

              content:
                answer,
            },
          ];

        setClarityMessages(
          newMessages
        );

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
          organisationId
        ) {
          await supabase
            .from(
              "clarity_memory"
            )
            .insert({
              organisation_id:
                organisationId,

              memory:
                `User asked: ${query}. Clarity answered: ${answer}`,
            });
        }

        await Promise.all([
          loadClarityMemory(),
          loadClarityChats(),
        ]);
      } catch (
        clarityError
      ) {
        console.error(
          "Clarity AI error:",
          clarityError
        );

        setClarityResponse(
          `Current business snapshot:\n\nOpen tasks: ${
            openTasks.length
          }\nActive projects: ${
            projects.length
          }\nUpcoming events: ${
            events.length
          }\nTracked revenue: £${formatCurrency(
            stats.currentProfit
          )}`
        );
      } finally {
        setClarityCommand(
          ""
        );

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
      const now =
        new Date();

      const dateStr =
        now.toLocaleString(
          "en-GB",
          {
            dateStyle:
              "full",

            timeStyle:
              "short",
          }
        );

      const incompleteTaskList =
        openTasks
          .slice(
            0,
            5
          )
          .map(
            (
              task
            ) =>
              `  - ${task.text}`
          )
          .join(
            "\n"
          );

      const todayEvents =
        events
          .filter(
            (
              event
            ) =>
              event.startAt &&
              event.startAt.toDateString() ===
                now.toDateString()
          )
          .map(
            (
              event
            ) => {
              const time =
                event.startAt
                  ? ` @ ${event.startAt.toLocaleTimeString(
                      "en-GB",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit",
                      }
                    )}`
                  : "";

              return `  - ${event.title}${time}`;
            }
          )
          .join(
            "\n"
          );

      const activeProjectList =
        projects
          .slice(
            0,
            10
          )
          .map(
            (
              project
            ) =>
              `  - ${
                project.name ||
                project.title ||
                "Project"
              }`
          )
          .join(
            "\n"
          );

      const priorityActions =
        aiActions.length
          ? aiActions
              .slice(
                0,
                5
              )
              .map(
                (
                  action
                ) =>
                  `  - ${action}`
              )
              .join(
                "\n"
              )
          : "  - None";

      const generatedBrief =
        `CLARITY DAILY EXECUTIVE BRIEF\n\n` +
        `Date: ${dateStr}\n\n` +
        `Risk Level: ${riskLevel.toUpperCase()}\n` +
        `Summary: ${aiSummary}\n\n` +
        `Open Tasks: ${openTasks.length}\n` +
        (incompleteTaskList
          ? `Priority Tasks:\n${incompleteTaskList}\n\n`
          : "") +
        `Today's Events:\n${todayEvents || "  - None"}\n\n` +
        `Recent Emails: ${emails.length}\n\n` +
        `Active Projects:\n${activeProjectList || "  - None"}\n\n` +
        `Tracked Revenue: £${formatCurrency(
          stats.currentProfit
        )}\n\n` +
        `Priority Actions:\n${priorityActions}`;

      setClarityResponse(
        generatedBrief
      );

      setShowBriefModal(
        true
      );
    };

  // ==================================================
  // CLARITY SCAN
  // ==================================================

  const runClarityScan =
    useCallback(
      async () => {
        if (
          !organisationId ||
          isScanActive
        ) {
          return;
        }

        setIsScanActive(
          true
        );

        try {
          const {
            data,
            error,
          } =
            await supabase.functions.invoke(
              "clarity-scan",
              {
                body: {
                  organisation_id:
                    organisationId,

                  context: {
                    stats,
                    currentTasks:
                      todos,
                  },
                },
              }
            );

          if (error) {
            throw error;
          }

          if (
            data?.insight
          ) {
            setInsight(
              data.insight
            );
          }
        } catch (
          scanError
        ) {
          console.warn(
            "Clarity scan failed:",
            scanError
          );
        } finally {
          setIsScanActive(
            false
          );
        }
      },
      [
        organisationId,
        isScanActive,
        supabase,
        stats,
        todos,
      ]
    );

  // ==================================================
  // PERIODIC SCAN
  // ==================================================

  useEffect(() => {
    if (
      !organisationId
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          void runClarityScan();
        },
        5 *
          60 *
          1000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    organisationId,
    runClarityScan,
  ]);

  // ==================================================
  // AUTH ERROR
  // ==================================================

  if (authError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] p-6 text-center">
        <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-black uppercase tracking-[0.18em] text-stone-900">
            Authentication
            Required
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-stone-500">
            The verification
            link has expired or
            is no longer valid.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                "/login"
              )
            }
            className="mt-6 w-full rounded-xl bg-stone-900 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#faf9f6] p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm">
          <Loader2
            className="animate-spin text-[#A3B18A]"
            size={22}
          />
        </div>

        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-stone-400">
            Preparing your
            workspace
          </p>

          <p className="mt-2 text-xs text-stone-300">
            Syncing business
            intelligence
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // EVENT GROUPS
  // ==================================================

  const now =
    new Date();

  const startOfToday =
    new Date(now);

  startOfToday.setHours(
    0,
    0,
    0,
    0
  );

  const endOfToday =
    new Date(now);

  endOfToday.setHours(
    23,
    59,
    59,
    999
  );

  const tomorrowStart =
    new Date(
      startOfToday
    );

  tomorrowStart.setDate(
    tomorrowStart.getDate() +
      1
  );

  const tomorrowEnd =
    new Date(
      tomorrowStart
    );

  tomorrowEnd.setHours(
    23,
    59,
    59,
    999
  );

  const weekEnd =
    new Date(
      endOfToday
    );

  weekEnd.setDate(
    weekEnd.getDate() +
      7
  );

  const sortedEvents =
    [...events].sort(
      (
        a,
        b
      ) => {
        const aTime =
          a.startAt?.getTime() ??
          Infinity;

        const bTime =
          b.startAt?.getTime() ??
          Infinity;

        return (
          aTime -
          bTime
        );
      }
    );

  const todayEvents =
    sortedEvents.filter(
      (
        event
      ) =>
        event.startAt &&
        event.startAt >=
          startOfToday &&
        event.startAt <=
          endOfToday
    );

  const tomorrowEvents =
    sortedEvents.filter(
      (
        event
      ) =>
        event.startAt &&
        event.startAt >=
          tomorrowStart &&
        event.startAt <=
          tomorrowEnd
    );

  const upcomingEvents =
    sortedEvents.filter(
      (
        event
      ) =>
        event.startAt &&
        event.startAt >
          tomorrowEnd &&
        event.startAt <=
          weekEnd
    );

  const unscheduledEvents =
    sortedEvents.filter(
      (
        event
      ) =>
        !event.startAt
    );

  const renderEvent = (
    event: NormalisedEvent
  ) => (
    <div
      key={
        event.id ||
        `${event.title}-${event.startAt?.toISOString()}`
      }
      className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-3 transition hover:border-stone-300"
    >
      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-stone-800">
        {event.title}
      </p>

      <p className="mt-1 text-[10px] text-stone-400">
        {event.startAt
          ? event.startAt.toLocaleString(
              "en-GB",
              {
                day:
                  "numeric",
                month:
                  "short",
                hour:
                  "2-digit",
                minute:
                  "2-digit",
              }
            )
          : "No date set"}
      </p>
    </div>
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-8 overflow-x-hidden bg-[#faf9f6] p-3 font-sans text-stone-900 sm:p-6 lg:space-y-12 lg:p-12">

      {/* ==================================================
          CLARITY FLOATING BUTTON
      ================================================== */}

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
        className="fixed right-6 top-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl transition hover:scale-105"
        aria-label="Open Clarity"
      >
        <Sparkles
          size={18}
        />

        {clarityNotifications.length >
          0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#faf9f6] bg-[#A3B18A] px-1 text-[7px] font-black text-white">
            {
              clarityNotifications.length
            }
          </span>
        )}
      </button>

      {/* ==================================================
          CLARITY WIDGET
      ================================================== */}

      {showClarityWidget && (
        <div className="fixed right-4 top-20 z-50 flex max-h-[calc(100vh-100px)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-2xl sm:right-6">
          <div className="border-b border-stone-100 bg-[#faf9f6] p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-[#A3B18A]">
                  <Sparkles
                    size={14}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-black">
                    Clarity
                  </h3>

                  <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                    Business
                    Intelligence
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
                className="rounded-full p-2 text-stone-400 transition hover:bg-white hover:text-stone-900"
              >
                <X
                  size={16}
                />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  void startNewClarityChat()
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider"
              >
                <Plus
                  size={12}
                />
                New Chat
              </button>

              <button
                type="button"
                onClick={
                  handleClarityBrief
                }
                className="rounded-xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider"
              >
                Daily Brief
              </button>
            </div>

            {clarityChats.length >
              0 && (
              <div className="mt-4">
                <p className="mb-2 text-[8px] font-black uppercase tracking-widest text-stone-300">
                  Recent chats
                </p>

                <div className="space-y-1.5">
                  {clarityChats
                    .slice(
                      0,
                      4
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
                          className="w-full truncate rounded-xl bg-[#faf9f6] p-2.5 text-left text-[9px] font-bold text-stone-600 transition hover:bg-stone-100"
                        >
                          {
                            chat.title
                          }
                        </button>
                      )
                    )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-stone-200 bg-[#faf9f6] p-2">
              <textarea
                value={
                  clarityCommand
                }
                onChange={(
                  event
                ) =>
                  setClarityCommand(
                    event
                      .target
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
                rows={2}
                placeholder="Ask Clarity anything about your business..."
                className="w-full resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-stone-300"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-40"
              >
                <Sparkles
                  size={11}
                />

                {clarityStreaming
                  ? "Analysing..."
                  : "Ask Clarity"}
              </button>
            </div>

            {clarityMessages.length >
              0 && (
              <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
                {clarityMessages.map(
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
                          : "max-w-[92%] rounded-2xl border border-stone-200 bg-white p-3 text-[10px] leading-relaxed text-stone-600"
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

            {clarityStreaming && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(
                    (
                      dot
                    ) => (
                      <span
                        key={
                          dot
                        }
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#A3B18A]"
                        style={{
                          animationDelay:
                            `${dot * 120}ms`,
                        }}
                      />
                    )
                  )}
                </div>

                <span className="text-[9px] text-stone-400">
                  Clarity is
                  thinking
                </span>
              </div>
            )}

            {clarityNotifications.length >
              0 && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                  Signals
                </p>

                <div className="mt-2 space-y-2">
                  {clarityNotifications
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        notification,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="rounded-xl bg-[#faf9f6] p-3 text-[9px] leading-relaxed text-stone-500"
                        >
                          {
                            notification
                          }
                        </div>
                      )
                    )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/clarity"
                )
              }
              className="mt-4 w-full rounded-xl bg-[#A3B18A] px-3 py-3 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-[#8d9c76]"
            >
              Open Full
              Clarity
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          CLARITY BRIEF MODAL
      ================================================== */}

      {showBriefModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() =>
                setShowBriefModal(
                  false
                )
              }
              className="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100"
            >
              <X
                size={18}
              />
            </button>

            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#A3B18A]">
              Clarity
            </p>

            <h2 className="mt-2 font-serif text-3xl italic">
              Today's
              Executive Brief
            </h2>

            <div className="mt-6 whitespace-pre-wrap rounded-2xl bg-[#faf9f6] p-5 text-[11px] leading-relaxed text-stone-700">
              {
                clarityResponse
              }
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white px-5 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.025)] sm:px-8 lg:rounded-[3rem] lg:px-12 lg:py-12">

        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-[#A3B18A]/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />

                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400">
                  {
                    formatDashboardDate(
                      currentTime
                    )
                  }
                </p>
              </div>

              <h1 className="mt-5 break-words font-serif text-5xl italic tracking-tighter text-stone-900 sm:text-6xl lg:text-[5.5rem] lg:leading-[0.95]">
                {greetingText}
                <span className="text-[#A3B18A]">
                  .
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-400">
                Here's what needs
                your attention
                across the business
                today.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-[#faf9f6] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-[#A3B18A]">
                <Sparkles
                  size={14}
                />
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Clarity
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-stone-700">
                  {riskLevel ===
                  "low"
                    ? "Everything looks steady"
                    : riskLevel ===
                        "medium"
                      ? "A few areas need attention"
                      : "Priority attention recommended"}
                </p>
              </div>
            </div>
          </div>

          {/* HEADER METRICS */}

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-200 bg-[#faf9f6] p-5">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                  Business Health
                </p>

                <span
                  className={`h-2 w-2 rounded-full ${
                    riskLevel ===
                    "high"
                      ? "bg-red-400"
                      : riskLevel ===
                          "medium"
                        ? "bg-amber-400"
                        : "bg-[#A3B18A]"
                  }`}
                />
              </div>

              <p className="mt-3 font-serif text-3xl italic">
                {healthScore}%
              </p>

              <p className="mt-2 text-[9px] uppercase tracking-wider text-stone-400">
                {riskLevel} operational
                risk
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                Open Tasks
              </p>

              <p className="mt-3 font-serif text-3xl italic">
                {
                  openTasks.length
                }
              </p>

              <p className="mt-2 text-[9px] uppercase tracking-wider text-stone-400">
                requiring attention
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                Tracked Revenue
              </p>

              <p className="mt-3 font-serif text-3xl italic">
                £
                {formatCurrency(
                  stats.currentProfit
                )}
              </p>

              <p className="mt-2 text-[9px] uppercase tracking-wider text-stone-400">
                paid invoices
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================
          CLARITY DAILY BRIEF
      ================================================== */}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:rounded-[3rem] lg:p-10">
        <div className="flex flex-col gap-6">

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#A3B18A]">
                Clarity Daily
                Brief
              </p>

              <h2 className="mt-2 font-serif text-3xl italic">
                Today's Business
                Overview
              </h2>
            </div>

            <button
              type="button"
              onClick={
                handleClarityBrief
              }
              className="rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-widest text-white transition hover:bg-[#A3B18A]"
            >
              Open Full Brief
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                AI Summary
              </p>

              <p className="mt-3 text-sm font-medium leading-relaxed text-stone-700">
                {aiSummary ||
                  "Clarity is analysing your business activity."}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                Priority Actions
              </p>

              <div className="mt-3 space-y-2">
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
                          key={
                            index
                          }
                          className="flex items-start gap-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[7px] font-black text-white">
                            {index +
                              1}
                          </span>

                          <p className="pt-0.5 text-xs font-medium text-stone-600">
                            {
                              action
                            }
                          </p>
                        </div>
                      )
                    )
                ) : (
                  <p className="text-xs text-stone-400">
                    No urgent actions
                    detected.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                Today's Activity
              </p>

              <div className="mt-3 space-y-2 text-xs font-medium text-stone-600">
                <p>
                  {
                    todayEvents.length
                  }{" "}
                  events today
                </p>

                <p>
                  {
                    emails.length
                  }{" "}
                  recent emails
                </p>

                <p>
                  {
                    openTasks.length
                  }{" "}
                  open tasks
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 p-5">
            <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">
              Clarity
              Recommendation
            </p>

            <p className="mt-2 text-sm font-medium text-stone-700">
              {aiActions[0] ||
                "Your business operations are currently stable."}
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          BUSINESS HEALTH
      ================================================== */}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:rounded-[3rem] lg:p-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-400">
            Business Health
            Intelligence
          </p>

          <h2 className="mt-2 font-serif text-3xl italic">
            How your business
            is performing
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {[
            {
              label:
                "Operational Health",

              value:
                `${healthScore}%`,

              note:
                `${riskLevel} risk`,
            },
            {
              label:
                "Project Delivery",

              value:
                stats.activeProjects,

              note:
                "active projects",
            },
            {
              label:
                "Revenue Position",

              value:
                `£${formatCurrency(
                  stats.currentProfit
                )}`,

              note:
                "tracked paid revenue",
            },
            {
              label:
                "Team",

              value:
                teamMembers.length,

              note:
                "workspace members",
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  {
                    item.label
                  }
                </p>

                <p className="mt-3 font-serif text-3xl italic">
                  {
                    item.value
                  }
                </p>

                <p className="mt-2 text-[9px] uppercase tracking-wider text-stone-400">
                  {
                    item.note
                  }
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 p-5">
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">
            Clarity Health
            Insight
          </p>

          <p className="mt-2 text-sm font-medium leading-relaxed text-stone-700">
            {riskLevel ===
            "high"
              ? "Operational pressure is increasing. Review workload distribution and prioritise critical activities."
              : riskLevel ===
                  "medium"
                ? "Business activity is healthy, but clearer prioritisation will help maintain momentum."
                : "Operations are stable. This is a strong opportunity to focus on growth and strategic improvements."}
          </p>
        </div>
      </section>

      {/* ==================================================
          ACTION BOARD
      ================================================== */}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:rounded-[3rem] lg:p-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-400">
            Priority Action
            Board
          </p>

          <h2 className="mt-2 font-serif text-3xl italic">
            What needs your
            attention
          </h2>
        </div>

        <div className="mt-6 space-y-3">
          {aiActions.length >
          0 ? (
            aiActions
              .slice(
                0,
                5
              )
              .map(
                (
                  action,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-[#faf9f6] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[9px] font-black text-white">
                      {index +
                        1}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-700">
                        {
                          action
                        }
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-widest text-stone-400">
                        Suggested by
                        Clarity
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const lower =
                          action.toLowerCase();

                        if (
                          lower.includes(
                            "task"
                          )
                        ) {
                          router.push(
                            "/notes"
                          );
                        } else if (
                          lower.includes(
                            "email"
                          )
                        ) {
                          router.push(
                            "/campaigns"
                          );
                        } else if (
                          lower.includes(
                            "project"
                          )
                        ) {
                          router.push(
                            "/projects"
                          );
                        } else if (
                          lower.includes(
                            "revenue"
                          ) ||
                          lower.includes(
                            "invoice"
                          )
                        ) {
                          router.push(
                            "/payments"
                          );
                        }
                      }}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-[8px] font-black uppercase tracking-widest"
                    >
                      View
                    </button>
                  </div>
                )
              )
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5">
              <p className="text-xs text-stone-400">
                No priority
                actions detected.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              label:
                "Task Pressure",
              value:
                `${openTasks.length} open`,
            },
            {
              label:
                "Inbox Activity",
              value:
                `${emails.length} emails`,
            },
            {
              label:
                "Calendar Load",
              value:
                `${events.length} events`,
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-stone-200 p-4"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  {
                    item.label
                  }
                </p>

                <p className="mt-2 font-serif text-xl italic">
                  {
                    item.value
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ==================================================
          LIVE INSIGHTS
      ================================================== */}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:rounded-[3rem] lg:p-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-stone-400">
            Live Business
            Insights
          </p>

          <h2 className="mt-2 font-serif text-3xl italic">
            Real-time
            operational signals
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          {[
            {
              label:
                "Live Activity",

              value:
                eventStream.length,

              note:
                "recent system events",
            },
            {
              label:
                "Task Momentum",

              value:
                `${completedTasks.length}/${todos.length}`,

              note:
                "completed tasks",
            },
            {
              label:
                "Project Activity",

              value:
                projects.length,

              note:
                "active projects",
            },
            {
              label:
                "AI Status",

              value:
                riskLevel ===
                "high"
                  ? "Alert"
                  : riskLevel ===
                      "medium"
                    ? "Watch"
                    : "Stable",

              note:
                "Clarity monitoring",
            },
          ].map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-5"
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  {
                    item.label
                  }
                </p>

                <p className="mt-3 font-serif text-3xl italic">
                  {
                    item.value
                  }
                </p>

                <p className="mt-2 text-[9px] uppercase tracking-wider text-stone-400">
                  {
                    item.note
                  }
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[#A3B18A]/30 bg-[#A3B18A]/10 p-5">
          <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">
            Latest Clarity
            Signals
          </p>

          <div className="mt-3 space-y-2">
            {eventStream.length >
            0 ? (
              eventStream
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    event,
                    index
                  ) => (
                    <p
                      key={
                        index
                      }
                      className="text-xs font-medium capitalize text-stone-600"
                    >
                      {String(
                        event.type
                      ).replaceAll(
                        "_",
                        " "
                      )}{" "}
                      detected
                    </p>
                  )
                )
            ) : (
              <p className="text-xs font-medium text-stone-600">
                Clarity is
                monitoring your
                business activity.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          CORE WORKSPACE GRID
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">

        {/* TASKS */}

        <section className="rounded-[2rem] border border-stone-200 bg-white p-4 lg:col-span-5 lg:rounded-[3rem] lg:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A3B18A]">
                Work Queue
              </p>

              <h2 className="mt-1 flex items-center gap-2 font-serif text-2xl italic">
                <CheckSquare
                  size={17}
                />

                To Do List
              </h2>
            </div>

            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
              {
                openTasks.length
              }{" "}
              open
            </p>
          </div>

          <div className="mb-6 flex w-full flex-col gap-2 sm:flex-row">
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
              placeholder="What needs done?"
              className="flex-1 rounded-xl border border-stone-200 bg-[#faf9f6] p-3 text-xs outline-none focus:border-stone-400"
            />

            <button
              type="button"
              onClick={() =>
                void addTask()
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-widest text-white"
            >
              <Plus
                size={12}
              />
              Add Task
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                "todo",
                "in_progress",
                "blocked",
                "done",
              ] as const
            ).map(
              (
                status
              ) => {
                const statusTasks =
                  todos
                    .filter(
                      (
                        task
                      ) =>
                        task.status ===
                        status
                    )
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
                      6
                    );

                return (
                  <div
                    key={
                      status
                    }
                    className="rounded-2xl bg-[#faf9f6] p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                        {status.replace(
                          "_",
                          " "
                        )}
                      </p>

                      <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold text-stone-400">
                        {
                          statusTasks.length
                        }
                      </span>
                    </div>

                    <div className="space-y-2">
                      {statusTasks.length >
                      0 ? (
                        statusTasks.map(
                          (
                            todo
                          ) => (
                            <div
                              key={
                                todo.id
                              }
                              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-3"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleTodo(
                                    todo.id,
                                    todo.completed
                                  )
                                }
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[8px] ${
                                  todo.completed
                                    ? "border-[#A3B18A] bg-[#A3B18A] text-white"
                                    : "border-stone-300"
                                }`}
                              >
                                {todo.completed
                                  ? "✓"
                                  : ""}
                              </button>

                              <span
                                className={`min-w-0 flex-1 truncate text-[9px] font-bold ${
                                  todo.completed
                                    ? "text-stone-300 line-through"
                                    : "text-stone-700"
                                }`}
                              >
                                {
                                  todo.text
                                }
                              </span>

                              {!todo.completed && (
                                <span
                                  className={`rounded-full border px-2 py-1 text-[7px] font-black ${
                                    getTaskPriorityLabel(
                                      todo
                                    ) ===
                                    "HIGH"
                                      ? "border-red-200 bg-red-50 text-red-500"
                                      : "border-stone-200 bg-stone-50 text-stone-400"
                                  }`}
                                >
                                  {getTaskPriorityLabel(
                                    todo
                                  )}
                                </span>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="py-4 text-center text-[9px] text-stone-300">
                          Nothing here
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* PROJECTS */}

        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-3 lg:rounded-[3rem] lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-stone-400">
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
              className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {projects.length >
            0 ? (
              projects
                .slice(
                  0,
                  5
                )
                .map(
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
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-[#faf9f6] p-4 text-left transition hover:border-stone-300 hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-stone-700">
                          {project.name ||
                            project.title ||
                            "Project"}
                        </p>

                        <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-stone-400">
                          {project.status ||
                            "Active"}
                        </p>
                      </div>

                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#A3B18A]" />
                    </button>
                  )
                )
            ) : (
              <div className="rounded-2xl bg-[#faf9f6] p-8 text-center">
                <p className="text-xs text-stone-400">
                  No active
                  projects yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* EVENTS */}

        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-2 lg:rounded-[3rem] lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-stone-400">
              <Clock
                size={14}
                className="text-[#A3B18A]"
              />
              Schedule
            </h2>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/calendar"
                )
              }
              className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
            >
              Calendar
            </button>
          </div>

          <div className="space-y-5">
            {todayEvents.length >
              0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#A3B18A]">
                  Today
                </p>

                {todayEvents
                  .slice(
                    0,
                    3
                  )
                  .map(
                    renderEvent
                  )}
              </div>
            )}

            {tomorrowEvents.length >
              0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Tomorrow
                </p>

                {tomorrowEvents
                  .slice(
                    0,
                    2
                  )
                  .map(
                    renderEvent
                  )}
              </div>
            )}

            {upcomingEvents.length >
              0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Coming up
                </p>

                {upcomingEvents
                  .slice(
                    0,
                    2
                  )
                  .map(
                    renderEvent
                  )}
              </div>
            )}

            {unscheduledEvents.length >
              0 && (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">
                  Unscheduled
                </p>

                {unscheduledEvents
                  .slice(
                    0,
                    2
                  )
                  .map(
                    renderEvent
                  )}
              </div>
            )}

            {events.length ===
              0 && (
              <div className="rounded-2xl bg-[#faf9f6] p-8 text-center">
                <p className="text-xs text-stone-400">
                  Nothing scheduled
                  yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* EMAIL */}

        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-2 lg:rounded-[3rem] lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-stone-400">
              <Mail
                size={14}
                className="text-[#A3B18A]"
              />
              Emails
            </h2>
          </div>

          <div className="space-y-3">
            {emails.length >
            0 ? (
              emails
                .slice(
                  0,
                  5
                )
                .map(
                  (
                    email,
                    index
                  ) => (
                    <div
                      key={
                        email.id ||
                        index
                      }
                      className="rounded-2xl border border-stone-200 bg-[#faf9f6] p-4"
                    >
                      <p className="truncate text-[10px] font-bold text-stone-700">
                        {email.subject ||
                          "New Email"}
                      </p>

                      <p className="mt-1 truncate text-[9px] text-stone-400">
                        {email.from ||
                          email.sender ||
                          "Unknown sender"}
                      </p>
                    </div>
                  )
                )
            ) : (
              <div className="rounded-2xl bg-[#faf9f6] p-8 text-center">
                <p className="text-xs text-stone-400">
                  Inbox clear.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* NOTES */}

        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-3 lg:rounded-[3rem] lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-stone-400">
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
              className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900"
            >
              All notes
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
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
              placeholder="Capture a thought..."
              className="flex-1 rounded-xl border border-stone-200 bg-[#faf9f6] p-3 text-xs outline-none focus:border-stone-400"
            />

            <button
              type="button"
              onClick={() =>
                void addNote()
              }
              className="rounded-xl bg-stone-900 px-5 py-3 text-[9px] font-black uppercase tracking-widest text-white"
            >
              Add
            </button>
          </div>

          <div className="grid max-h-[310px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {notes
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
                    ).toLowerCase()
                  )
              )
              .slice(
                0,
                12
              )
              .map(
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
                        `/notes/${note.id}`
                      )
                    }
                    className="min-w-0 rounded-2xl border border-stone-200 bg-[#faf9f6] p-4 text-left transition hover:border-stone-300 hover:bg-white"
                  >
                    <p className="line-clamp-2 text-[10px] font-bold leading-relaxed text-stone-700">
                      {note.content ||
                        note.title ||
                        "Untitled Note"}
                    </p>

                    <p className="mt-3 text-[7px] font-black uppercase tracking-widest text-stone-300">
                      Note
                    </p>
                  </button>
                )
              )}

            {notes.filter(
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
                  ).toLowerCase()
                )
            ).length ===
              0 && (
              <div className="col-span-full rounded-2xl bg-[#faf9f6] p-8 text-center">
                <p className="text-xs text-stone-400">
                  No notes yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ==================================================
          BOTTOM METRICS
      ================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label:
              "Projects",

            value:
              stats.activeProjects,

            icon:
              Briefcase,
          },
          {
            label:
              "Invoices Due",

            value:
              stats.invoicesDue,

            icon:
              FileText,
          },
          {
            label:
              "Revenue",

            value:
              `£${formatCurrency(
                stats.currentProfit
              )}`,

            icon:
              PoundSterling,
          },
          {
            label:
              "Health",

            value:
              `${healthScore}%`,

            icon:
              TrendingUp,
          },
        ].map(
          (
            item
          ) => {
            const Icon =
              item.icon;

            return (
              <div
                key={
                  item.label
                }
                className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A3B18A]/10 text-[#8b9c74]">
                  <Icon
                    size={18}
                  />
                </div>

                <p className="mt-5 text-[8px] font-black uppercase tracking-widest text-stone-400">
                  {
                    item.label
                  }
                </p>

                <p className="mt-2 font-serif text-3xl italic">
                  {
                    item.value
                  }
                </p>
              </div>
            );
          }
        )}
      </section>
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