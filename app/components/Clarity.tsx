"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Compass,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useClarityTour,
} from "@/app/(dashboard)/claritytour/ClarityTourProvider";

// ============================================================
// TYPES
// ============================================================

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  pinned?: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const THINKING_MESSAGES = [
  "Looking through your workspace",
  "Connecting the dots",
  "Analysing your business",
  "Preparing your answer",
];

// ============================================================
// COMPONENT
// ============================================================

export default function Clarity() {
  // ==========================================================
  // TOUR
  // ==========================================================

  const {
    startTour,
    continueTour,
    currentStepId,
  } = useClarityTour();

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messages,
    setMessages,
  ] = useState<Message[]>([]);

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    conversationId,
    setConversationId,
  ] = useState<
    string | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    streaming,
    setStreaming,
  ] = useState(false);

  const [
    businessContext,
    setBusinessContext,
  ] = useState<any>(null);

  const [
    brief,
    setBrief,
  ] = useState<any>(null);

  const [
    loadingBrief,
    setLoadingBrief,
  ] = useState(false);

  const [
    thinkingIndex,
    setThinkingIndex,
  ] = useState(0);

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null
    );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const savedConversation =
      localStorage.getItem(
        "clarity_conversation_id"
      );

    if (savedConversation) {
      void loadConversation(
        savedConversation
      );
    }

    void loadConversations();
  }, []);

  useEffect(() => {
    void loadBusinessContext();
  }, []);

  // ==========================================================
  // OPEN STATE
  // ==========================================================

  useEffect(() => {
    if (open) {
      void loadConversations();
    }
  }, [open]);

  // ==========================================================
  // SCROLL
  // ==========================================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages,
    loading,
    streaming,
  ]);

  // ==========================================================
  // THINKING ANIMATION
  // ==========================================================

  useEffect(() => {
    if (
      !loading ||
      streaming
    ) {
      setThinkingIndex(0);

      return;
    }

    const interval =
      window.setInterval(
        () => {
          setThinkingIndex(
            (current) =>
              (current + 1) %
              THINKING_MESSAGES.length
          );
        },
        1400
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    loading,
    streaming,
  ]);

  // ==========================================================
  // LOAD CEO BRIEF
  // ==========================================================

  async function loadBrief() {
    try {
      setLoadingBrief(
        true
      );

      const response =
        await fetch(
          "/api/clarity/brief"
        );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      setBrief(
        data.brief
      );
    } catch (error) {
      console.error(
        "Clarity brief error",
        error
      );
    } finally {
      setLoadingBrief(
        false
      );
    }
  }

  // ==========================================================
  // LOAD BUSINESS CONTEXT
  // ==========================================================

  async function loadBusinessContext() {
    try {
      const response =
        await fetch(
          "/api/clarity/context"
        );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      setBusinessContext(
        data.context ||
          data
      );
    } catch (error) {
      console.error(
        "Clarity context loading error",
        error
      );
    }
  }

  // ==========================================================
  // LOAD CONVERSATIONS
  // ==========================================================

  async function loadConversations() {
    try {
      const res =
        await fetch(
          "/api/clarity/conversations",
          {
            cache:
              "no-store",
          }
        );

      if (!res.ok) {
        throw new Error(
          "Failed to load conversations"
        );
      }

      const data =
        await res.json();

      setConversations(
        Array.isArray(
          data.conversations
        )
          ? data.conversations
          : []
      );
    } catch (error) {
      console.error(
        "Clarity conversations error",
        error
      );
    }
  }

  // ==========================================================
  // LOAD ONE CONVERSATION
  // ==========================================================

  async function loadConversation(
    id: string
  ) {
    try {
      setConversationId(
        id
      );

      localStorage.setItem(
        "clarity_conversation_id",
        id
      );

      const res =
        await fetch(
          `/api/clarity/conversations/${id}`,
          {
            cache:
              "no-store",
          }
        );

      if (!res.ok) {
        localStorage.removeItem(
          "clarity_conversation_id"
        );

        setConversationId(
          null
        );

        setMessages([]);

        throw new Error(
          "Failed to load conversation"
        );
      }

      const data =
        await res.json();

      setMessages(
        Array.isArray(
          data.messages
        )
          ? data.messages
          : []
      );
    } catch (error) {
      console.error(
        "Clarity conversation load error",
        error
      );
    }
  }

  // ==========================================================
  // NEW CONVERSATION
  // ==========================================================

  function newConversation() {
    setConversationId(
      null
    );

    setMessages([]);

    setMessage("");

    setBrief(null);

    localStorage.removeItem(
      "clarity_conversation_id"
    );
  }

  // ==========================================================
  // DELETE CONVERSATION
  // ==========================================================

  async function deleteConversation(
    id: string
  ) {
    try {
      const response =
        await fetch(
          `/api/clarity/conversations/${id}`,
          {
            method:
              "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to delete conversation"
        );
      }

      setConversations(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      if (
        conversationId ===
        id
      ) {
        newConversation();
      }
    } catch (error) {
      console.error(
        "Clarity delete error",
        error
      );
    }
  }

  // ==========================================================
  // TOUR
  // ==========================================================

  function launchTour() {
    setOpen(false);

    window.setTimeout(
      () => {
        if (
          currentStepId
        ) {
          continueTour();
        } else {
          startTour();
        }
      },
      250
    );
  }

  // ==========================================================
  // ASK CLARITY
  // ==========================================================

  async function askClarity() {
    const cleaned =
      message.trim();

    if (
      !cleaned ||
      loading
    ) {
      return;
    }

    const userMessage =
      cleaned;

    setMessage("");

    const updatedMessages:
      Message[] =
      [
        ...messages,

        {
          role:
            "user",

          content:
            userMessage,
        },
      ];

    setMessages(
      updatedMessages
    );

    setLoading(
      true
    );

    setStreaming(
      false
    );

    try {
      const res =
        await fetch(
          "/api/clarity/chat",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                message:
                  userMessage,

                conversationId,

                history:
                  updatedMessages,

                context:
                  businessContext,
              }),
          }
        );

      if (!res.ok) {
        let errorMessage =
          "Clarity request failed";

        try {
          const errorData =
            await res.json();

          errorMessage =
            errorData.error ||
            errorData.message ||
            errorMessage;
        } catch {
          // Ignore JSON parsing failure.
        }

        throw new Error(
          errorMessage
        );
      }

      const data =
        await res.json();

      console.log(
        "Clarity response:",
        data
      );

      if (
        !data.answer &&
        !data.message &&
        !data.response &&
        !data.content &&
        !data.reply
      ) {
        throw new Error(
          "Clarity returned no answer"
        );
      }

      // ======================================================
      // CONVERSATION ID
      // ======================================================

      const returnedConversationId =
        data.metadata
          ?.conversationId ||
        data.conversationId;

      if (
        returnedConversationId
      ) {
        setConversationId(
          returnedConversationId
        );

        localStorage.setItem(
          "clarity_conversation_id",
          returnedConversationId
        );
      }

      // ======================================================
      // ANSWER
      // ======================================================

      const answer =
        String(
          data.answer ||
            data.message ||
            data.response ||
            data.content ||
            data.reply ||
            "Clarity could not generate a response."
        );

      setStreaming(
        true
      );

      let current =
        "";

      let index =
        0;

      setMessages(
        (previous) => [
          ...previous,

          {
            role:
              "assistant",

            content:
              "",
          },
        ]
      );

      // ======================================================
      // TYPEWRITER RESPONSE
      // ======================================================

      await new Promise<void>(
        (resolve) => {
          let lastTime =
            performance.now();

          const typeNext =
            (
              now:
                number
            ) => {
              if (
                now -
                  lastTime <
                12
              ) {
                requestAnimationFrame(
                  typeNext
                );

                return;
              }

              lastTime =
                now;

              const chunkSize =
                Math.max(
                  1,

                  Math.min(
                    4,

                    Math.ceil(
                      answer.length /
                        500
                    )
                  )
                );

              const chunk =
                answer.slice(
                  index,
                  index +
                    chunkSize
                );

              current +=
                chunk;

              index +=
                chunkSize;

              setMessages(
                (
                  previous
                ) => {
                  const copy =
                    [
                      ...previous,
                    ];

                  copy[
                    copy.length -
                      1
                  ] = {
                    role:
                      "assistant",

                    content:
                      current,
                  };

                  return copy;
                }
              );

              if (
                index <
                answer.length
              ) {
                requestAnimationFrame(
                  typeNext
                );
              } else {
                resolve();
              }
            };

          requestAnimationFrame(
            typeNext
          );
        }
      );

      setStreaming(
        false
      );

      await loadConversations();

      await loadBrief();
    } catch (error) {
      console.error(
        "Clarity error",
        error
      );

      setMessages(
        (previous) => [
          ...previous,

          {
            role:
              "assistant",

            content:
              error instanceof
              Error
                ? error.message
                : "Unable to connect to Clarity. Please try again.",
          },
        ]
      );
    } finally {
      setLoading(
        false
      );

      setStreaming(
        false
      );
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          CLARITY BUTTON

          IMPORTANT:
          This is now RELATIVE rather than FIXED.

          DashboardLayout controls where this button sits.
      ====================================================== */}

      <motion.button
        type="button"
        whileHover={{
          scale:
            1.06,
        }}
        whileTap={{
          scale:
            0.94,
        }}
        onClick={() =>
          setOpen(
            true
          )
        }
        aria-label="Open Clarity AI assistant"
        className="
          group
          relative
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-2xl
          border
          border-stone-800
          bg-stone-900
          text-white
          shadow-[0_12px_35px_rgba(28,25,23,0.25)]
          transition
          hover:bg-stone-800
        "
      >
        <motion.div
          animate={{
            rotate: [
              0,
              5,
              -5,
              0,
            ],
          }}
          transition={{
            duration:
              5,

            repeat:
              Infinity,

            ease:
              "easeInOut",
          }}
        >
          <Sparkles
            size={
              17
            }
            strokeWidth={
              1.8
            }
          />
        </motion.div>

        {/* TOOLTIP */}

        <span
          className="
            pointer-events-none
            absolute
            right-0
            top-14
            hidden
            whitespace-nowrap
            rounded-xl
            bg-stone-900
            px-3
            py-2
            text-[10px]
            font-semibold
            text-white
            shadow-xl
            group-hover:block
          "
        >
          Ask Clarity
        </span>
      </motion.button>

      {/* ======================================================
          CLARITY PANEL
      ====================================================== */}

      <AnimatePresence>
        {open && (
          <>
            {/* ==================================================
                MOBILE BACKDROP
            ================================================== */}

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
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="
                fixed
                inset-0
                z-[699]
                bg-stone-950/20
                backdrop-blur-sm
                sm:hidden
              "
            />

            {/* ==================================================
                PANEL
            ================================================== */}

            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.96,

                y:
                  -8,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,

                y:
                  0,
              }}
              exit={{
                opacity:
                  0,

                scale:
                  0.97,

                y:
                  -8,
              }}
              transition={{
                duration:
                  0.22,

                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              className="
                fixed
                inset-x-3
                bottom-20
                top-20
                z-[700]

                flex
                flex-col
                overflow-hidden

                rounded-[2rem]

                border
                border-stone-200

                bg-white

                shadow-[0_30px_100px_rgba(28,25,23,0.22)]

                sm:inset-auto
                sm:right-8
                sm:top-[88px]
                sm:h-[min(720px,calc(100vh-112px))]
                sm:w-[470px]
              "
            >
              {/* ==================================================
                  HEADER
              ================================================== */}

              <div className="border-b border-stone-100 bg-gradient-to-b from-[#fdfbf8] to-white px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-[#a9b897] shadow-sm">
                      <Sparkles
                        size={
                          16
                        }
                      />

                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#a9b897]" />
                    </div>

                    <div>
                      <h2 className="text-sm font-black text-stone-900">
                        Clarity
                      </h2>

                      <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-stone-400">
                        {loading &&
                        !streaming
                          ? THINKING_MESSAGES[
                              thinkingIndex
                            ]
                          : streaming
                            ? "Responding"
                            : "AI Business Intelligence"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(
                        false
                      )
                    }
                    aria-label="Close Clarity"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                  >
                    <X
                      size={
                        16
                      }
                    />
                  </button>
                </div>

                {/* ==============================================
                    ACTIONS
                ============================================== */}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={
                      newConversation
                    }
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 text-[9px] font-bold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
                  >
                    <Plus
                      size={
                        13
                      }
                    />

                    New Chat
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void loadBrief()
                    }
                    disabled={
                      loadingBrief
                    }
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 text-[9px] font-bold text-stone-600 transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
                  >
                    <Sparkles
                      size={
                        13
                      }
                    />

                    {loadingBrief
                      ? "Loading..."
                      : "CEO Brief"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      launchTour
                    }
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-[#a9b897]/40 bg-[#a9b897]/10 px-2 text-[9px] font-black text-stone-700 transition hover:bg-[#a9b897]/20"
                  >
                    <Compass
                      size={
                        13
                      }
                    />

                    {currentStepId
                      ? "Continue Tour"
                      : "Tour TOTS-OS"}
                  </button>
                </div>
              </div>

              {/* ==================================================
                  CONVERSATIONS
              ================================================== */}

              {conversations.length >
                0 && (
                <div className="border-b border-stone-100 bg-[#faf9f6]/70 px-4 py-3">
                  <p className="mb-2 text-[7px] font-black uppercase tracking-[0.2em] text-stone-300">
                    Recent Conversations
                  </p>

                  <div className="no-scrollbar flex gap-2 overflow-x-auto">
                    {conversations.map(
                      (
                        conversation
                      ) => (
                        <button
                          type="button"
                          key={
                            conversation.id
                          }
                          onClick={() =>
                            void loadConversation(
                              conversation.id
                            )
                          }
                          className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[9px] transition ${
                            conversationId ===
                            conversation.id
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                          }`}
                        >
                          <MessageSquare
                            size={
                              10
                            }
                          />

                          <span className="max-w-[100px] truncate">
                            {conversation.title ||
                              "Conversation"}
                          </span>

                          <Trash2
                            size={
                              10
                            }
                            className={
                              conversationId ===
                              conversation.id
                                ? "text-white/50 hover:text-red-300"
                                : "text-stone-300 hover:text-red-500"
                            }
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              void deleteConversation(
                                conversation.id
                              );
                            }}
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ==================================================
                  CHAT
              ================================================== */}

              <div className="flex-1 overflow-y-auto bg-[#faf9f6] p-4">
                {/* ==================================================
                    CEO BRIEF
                ================================================== */}

                <AnimatePresence>
                  {brief && (
                    <motion.div
                      initial={{
                        opacity:
                          0,

                        y:
                          -8,
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
                      }}
                      className="mb-4 rounded-[1.5rem] border border-[#a9b897]/30 bg-[#a9b897]/10 p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                          <Sparkles
                            size={
                              11
                            }
                          />
                        </div>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-stone-700">
                            Daily CEO Brief
                          </p>

                          <p className="text-[8px] text-stone-400">
                            Clarity&apos;s
                            overview of your
                            business
                          </p>
                        </div>
                      </div>

                      {brief.summary && (
                        <p className="text-[11px] leading-relaxed text-stone-600">
                          {
                            brief.summary
                          }
                        </p>
                      )}

                      {Array.isArray(
                        brief.priorities
                      ) &&
                        brief
                          .priorities
                          .length >
                          0 && (
                          <div className="mt-3 space-y-2 border-t border-[#a9b897]/25 pt-3">
                            {brief.priorities.map(
                              (
                                item:
                                  string,

                                index:
                                  number
                              ) => (
                                <div
                                  key={
                                    index
                                  }
                                  className="flex items-start gap-2 text-[10px] text-stone-600"
                                >
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fa07d]" />

                                  <span>
                                    {
                                      item
                                    }
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {messages.length ===
                  0 && (
                  <motion.div
                    initial={{
                      opacity:
                        0,

                      y:
                        10,
                    }}
                    animate={{
                      opacity:
                        1,

                      y:
                        0,
                    }}
                    className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-stone-200 bg-white text-stone-900 shadow-sm">
                      <Sparkles
                        size={
                          19
                        }
                      />
                    </div>

                    <h3 className="mt-5 font-serif text-2xl italic text-stone-800">
                      What can I help with?
                    </h3>

                    <p className="mt-3 max-w-[300px] text-[11px] leading-relaxed text-stone-400">
                      Ask me about sales,
                      customers, projects,
                      finance, calendar,
                      tasks or your wider
                      business performance.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[
                        "What should I focus on today?",
                        "How are my sales looking?",
                        "Which projects need attention?",
                      ].map(
                        (
                          prompt
                        ) => (
                          <button
                            type="button"
                            key={
                              prompt
                            }
                            onClick={() => {
                              setMessage(
                                prompt
                              );
                            }}
                            className="rounded-full border border-stone-200 bg-white px-3 py-2 text-[9px] font-medium text-stone-500 transition hover:border-[#a9b897] hover:text-stone-800"
                          >
                            {
                              prompt
                            }
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ==================================================
                    MESSAGES
                ================================================== */}

                <div className="space-y-4">
                  {messages.map(
                    (
                      item,
                      index
                    ) => {
                      const isUser =
                        item.role ===
                        "user";

                      const isLast =
                        index ===
                        messages.length -
                          1;

                      return (
                        <motion.div
                          key={
                            item.id ||
                            `${item.role}-${index}`
                          }
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
                          className={
                            isUser
                              ? "ml-auto max-w-[86%]"
                              : "max-w-[90%]"
                          }
                        >
                          {isUser ? (
                            <div className="rounded-[1.4rem] rounded-tr-md bg-stone-900 px-4 py-3.5 text-white shadow-sm">
                              <p className="whitespace-pre-line text-[11px] leading-[1.7]">
                                {
                                  item.content
                                }
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2.5">
                              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                                <Sparkles
                                  size={
                                    11
                                  }
                                />
                              </div>

                              <div className="rounded-[1.4rem] rounded-tl-md border border-stone-200 bg-white px-4 py-3.5 shadow-sm">
                                <p className="whitespace-pre-line text-[11px] leading-[1.75] text-stone-600">
                                  {
                                    item.content
                                  }

                                  {streaming &&
                                    isLast && (
                                      <span className="ml-1 inline-block h-3.5 w-[2px] animate-pulse bg-[#8fa07d] align-middle" />
                                    )}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    }
                  )}

                  {/* ==================================================
                      THINKING STATE
                  ================================================== */}

                  <AnimatePresence>
                    {loading &&
                      !streaming && (
                        <motion.div
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
                              -4,
                          }}
                          className="flex max-w-[90%] items-start gap-2.5"
                        >
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-[#a9b897]">
                            <motion.div
                              animate={{
                                rotate: [
                                  0,
                                  7,
                                  -7,
                                  0,
                                ],
                              }}
                              transition={{
                                duration:
                                  1.7,

                                repeat:
                                  Infinity,

                                ease:
                                  "easeInOut",
                              }}
                            >
                              <Sparkles
                                size={
                                  11
                                }
                              />
                            </motion.div>
                          </div>

                          <div className="rounded-[1.4rem] rounded-tl-md border border-stone-200 bg-white px-4 py-3.5 shadow-sm">
                            <motion.p
                              key={
                                thinkingIndex
                              }
                              initial={{
                                opacity:
                                  0,

                                y:
                                  3,
                              }}
                              animate={{
                                opacity:
                                  1,

                                y:
                                  0,
                              }}
                              className="text-[9px] font-medium text-stone-400"
                            >
                              {
                                THINKING_MESSAGES[
                                  thinkingIndex
                                ]
                              }
                              ...
                            </motion.p>

                            <div className="mt-2.5 flex items-center gap-1.5">
                              {[
                                0,
                                1,
                                2,
                              ].map(
                                (
                                  dot
                                ) => (
                                  <motion.span
                                    key={
                                      dot
                                    }
                                    animate={{
                                      y: [
                                        0,
                                        -4,
                                        0,
                                      ],

                                      opacity: [
                                        0.25,
                                        1,
                                        0.25,
                                      ],
                                    }}
                                    transition={{
                                      duration:
                                        0.8,

                                      repeat:
                                        Infinity,

                                      delay:
                                        dot *
                                        0.14,
                                    }}
                                    className="h-1.5 w-1.5 rounded-full bg-[#8fa07d]"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <div
                    ref={
                      bottomRef
                    }
                    className="h-px"
                  />
                </div>
              </div>

              {/* ==================================================
                  INPUT
              ================================================== */}

              <div className="border-t border-stone-100 bg-white p-3">
                <div className="flex items-end gap-2 rounded-2xl border border-stone-200 bg-[#faf9f6] p-2 transition focus-within:border-stone-300 focus-within:bg-white">
                  <textarea
                    value={
                      message
                    }
                    onChange={(
                      event
                    ) =>
                      setMessage(
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

                        void askClarity();
                      }
                    }}
                    rows={
                      1
                    }
                    placeholder="Ask Clarity anything about your business..."
                    className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-[11px] text-stone-700 outline-none placeholder:text-stone-300"
                  />

                  <motion.button
                    type="button"
                    whileTap={{
                      scale:
                        0.92,
                    }}
                    onClick={() =>
                      void askClarity()
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-[#a9b897] hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Send message"
                  >
                    <Send
                      size={
                        14
                      }
                    />
                  </motion.button>
                </div>

                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#a9b897]" />

                  <p className="text-center text-[7px] font-medium uppercase tracking-[0.14em] text-stone-300">
                    Clarity uses information
                    available in your TOTS-OS
                    workspace
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================================
          GLOBAL HELPERS
      ====================================================== */}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}