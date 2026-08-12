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
  // GENERAL STATE
  // ==================================================

  const [
    userName,
    setUserName,
  ] =
    useState("");

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
    useState(true);

  // ==================================================
  // BUSINESS DATA
  // ==================================================

  const [
    stats,
    setStats,
  ] =
    useState({
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
    useState(false);

  const [
    showBriefModal,
    setShowBriefModal,
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

  const openTasks =
    todos.filter(
      (task) =>
        !task.completed
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
      [
        supabase,
      ]
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
                    20
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
                    12
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
                    30
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
          // NORMALISE DATA
          // ------------------------------------------

          const invoiceData =
            (invoicesRes.data as any[]) ||
            [];

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
          // FINANCE
          // ------------------------------------------

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

          // ------------------------------------------
          // TASKS
          // ------------------------------------------

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

          // ------------------------------------------
          // SET STATE
          // ------------------------------------------

          setStats({
            activeProjects:
              projectData.length,

            invoicesDue:
              pendingInvoices,

            socialsPending:
              0,

            emailsScheduled:
              0,

            currentProfit:
              totalProfit,
          });

          setTeamMembers(
            (membersRes.data as TeamMember[]) ||
              []
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
            eventData.length;

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
              "Activity is elevated. Focus on the work most likely to affect delivery and cash flow."
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

          const priorities:
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
            eventLoad > 0
          ) {
            priorities.push(
              "Align today's schedule with priorities"
            );
          }

          if (
            emailLoad > 0
          ) {
            priorities.push(
              "Clear important inbox items"
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
            taskLoad > 5
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
            emailLoad > 8
          ) {
            notifications.push(
              "Inbox activity is elevated."
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
  // TASK PRIORITY
  // ==================================================

  const getTaskScore =
    (
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
        : "NORMAL";
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

        await loadDashboardData();
      }
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
          });

      if (!error) {
        setTaskInput(
          ""
        );

        await loadDashboardData();
      }
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
      }

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
                    openTasks,

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

        const newMessages:
          ClarityMessage[] =
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

        setClarityResponse(
          answer
        );

        if (
          activeChatId
        ) {
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
        }

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
          "Clarity error:",
          clarityError
        );

        setClarityResponse(
          `Open tasks: ${
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
      const brief =
        `CLARITY DAILY BRIEF\n\n` +
        `${aiSummary}\n\n` +
        `Open Tasks: ${openTasks.length}\n` +
        `Active Projects: ${projects.length}\n` +
        `Events: ${events.length}\n` +
        `Invoices Due: ${stats.invoicesDue}\n` +
        `Revenue: £${formatCurrency(
          stats.currentProfit
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
  // ERROR
  // ==================================================

  if (authError) {
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

  if (loading) {
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
  // DASHBOARD DERIVED DATA
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
    [...events]
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
            a.startAt?.getTime() ??
            Infinity
          ) -
          (
            b.startAt?.getTime() ??
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
            ).toLowerCase()
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
            ).toLowerCase()
          )
      )
      .slice(
        0,
        4
      );

  const priorityTasks =
    [...openTasks]
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

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] bg-[#faf9f6] p-4 font-sans text-stone-900 sm:p-6 lg:p-8">

      {/* ==================================================
          CLARITY BUTTON
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

      {/* ==================================================
          CLARITY WIDGET
      ================================================== */}

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
                          className="w-full truncate rounded-xl bg-[#faf9f6] p-2.5 text-left text-[9px] font-bold text-stone-600"
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

            <div className="mt-4 rounded-2xl bg-[#faf9f6] p-2">

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
                  {[0, 1, 2].map(
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

      {/* ==================================================
          BRIEF MODAL
      ================================================== */}

      {showBriefModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">

          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-7 shadow-2xl">

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

            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#A3B18A]">
              Clarity
            </p>

            <h2 className="mt-2 font-serif text-3xl italic">
              Today's brief
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

      <header className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>
          <div className="flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />

            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-stone-400">
              {
                formatDashboardDate(
                  currentTime
                )
              }
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
            Here's everything happening across your business.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">

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
        </div>
      </header>

      {/* ==================================================
          METRICS
      ================================================== */}

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">

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
                stats.currentProfit
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
              className="rounded-2xl border border-stone-200 bg-white p-4"
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

      {/* ==================================================
          MAIN OVERVIEW
      ================================================== */}

      <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* PRIORITIES */}

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A3B18A]">
                Focus
              </p>

              <h2 className="mt-1 font-serif text-2xl italic">
                Today's priorities
              </h2>
            </div>

            <span className="rounded-full bg-[#A3B18A]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-[#7f9069]">
              {riskLevel} risk
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
                      key={
                        index
                      }
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

        {/* SCHEDULE */}

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5 lg:col-span-4">

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
              className="text-[7px] font-black uppercase tracking-widest text-stone-400"
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
                  <div
                    key={
                      event.id ||
                      `${event.title}-${event.startAt?.toISOString()}`
                    }
                    className="flex items-center gap-3 rounded-xl bg-[#faf9f6] p-3"
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
                  </div>
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

        {/* SNAPSHOT */}

        <div className="rounded-[2rem] bg-stone-900 p-5 text-white lg:col-span-3">

          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[#A3B18A]">
            Snapshot
          </p>

          <h2 className="mt-1 font-serif text-2xl italic">
            Business now
          </h2>

          <div className="mt-5 space-y-4">

            <div>
              <p className="text-[7px] font-black uppercase tracking-widest text-stone-500">
                Revenue
              </p>

              <p className="mt-1 font-serif text-2xl italic">
                £
                {formatCurrency(
                  stats.currentProfit
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
                    projects.length
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

      {/* ==================================================
          PRIORITY TASKS
      ================================================== */}

      <section className="mb-5 rounded-[2rem] border border-stone-200 bg-white p-5">

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
                  event.target.value
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
              className="w-full rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2.5 text-[10px] outline-none sm:w-52"
            />

            <button
              type="button"
              onClick={() =>
                void addTask()
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white"
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
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-stone-300"
                  />

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
                You're all caught up.
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
            className="mt-4 text-[8px] font-black uppercase tracking-widest text-stone-400"
          >
            View all{" "}
            {
              openTasks.length
            }{" "}
            tasks →
          </button>
        )}
      </section>

      {/* ==================================================
          BOTTOM OVERVIEW
      ================================================== */}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* PROJECTS */}

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5">

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
              className="text-[7px] font-black uppercase tracking-widest text-stone-400"
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
                    className="flex w-full items-center justify-between rounded-xl bg-[#faf9f6] p-3 text-left"
                  >
                    <div className="min-w-0">

                      <p className="truncate text-[10px] font-bold text-stone-700">
                        {project.name ||
                          project.title ||
                          "Project"}
                      </p>

                      <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-stone-400">
                        {project.status ||
                          "Active"}
                      </p>
                    </div>

                    <span className="h-2 w-2 rounded-full bg-[#A3B18A]" />
                  </button>
                )
              )
            ) : (
              <p className="rounded-xl bg-[#faf9f6] p-5 text-center text-[10px] text-stone-400">
                No active projects.
              </p>
            )}
          </div>
        </div>

        {/* NOTES */}

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
              className="text-[7px] font-black uppercase tracking-widest text-stone-400"
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
                  event.target.value
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
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-[#faf9f6] px-3 py-2.5 text-[10px] outline-none"
            />

            <button
              type="button"
              onClick={() =>
                void addNote()
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white"
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
                        `/notes/${note.id}`
                      )
                    }
                    className="w-full truncate rounded-xl bg-[#faf9f6] p-3 text-left text-[10px] font-medium text-stone-600"
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

        {/* EMAILS */}

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
                    <div
                      key={
                        email.id ||
                        index
                      }
                      className="rounded-xl bg-[#faf9f6] p-3"
                    >
                      <p className="truncate text-[10px] font-bold text-stone-700">
                        {email.subject ||
                          "New Email"}
                      </p>

                      <p className="mt-1 truncate text-[8px] text-stone-400">
                        {email.from ||
                          email.sender ||
                          "Unknown sender"}
                      </p>
                    </div>
                  )
                )
            ) : (
              <div className="rounded-xl bg-[#faf9f6] p-5 text-center">
                <p className="text-[10px] text-stone-400">
                  Inbox clear.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER STATUS
      ================================================== */}

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