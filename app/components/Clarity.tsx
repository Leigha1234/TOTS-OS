"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Plus, MessageSquare, Trash2 } from "lucide-react";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
}

export default function Clarity() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [brief, setBrief] = useState<any>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedConversation = localStorage.getItem("clarity_conversation_id");

    if (savedConversation) {
      setConversationId(savedConversation);
      loadConversation(savedConversation);
    }
  }, []);

  useEffect(() => {
    loadBusinessContext();
  }, []);

  async function loadBrief() {
    try {
      setLoadingBrief(true);

      const response = await fetch("/api/clarity/brief");
      if (!response.ok) return;

      const data = await response.json();
      setBrief(data.brief);
    } catch (error) {
      console.error("Clarity brief error", error);
    } finally {
      setLoadingBrief(false);
    }
  }

  async function loadBusinessContext() {
    try {
      const response = await fetch("/api/clarity/context");
      if (!response.ok) return;

      const data = await response.json();
      setBusinessContext(data.context || data);
    } catch (error) {
      console.error("Clarity context loading error", error);
    }
  }

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/clarity/conversations");
      if (!res.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Clarity conversations error", error);
    }
  }

  async function loadConversation(id: string) {
    try {
      setConversationId(id);

      localStorage.setItem(
        "clarity_conversation_id",
        id
      );

      const res = await fetch(`/api/clarity/conversations/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await res.json();

      setMessages(data.messages || []);
    } catch (error) {
      console.error("Clarity conversation load error", error);
    }
  }

  async function newConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage("");

    localStorage.removeItem("clarity_conversation_id");
  }

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/clarity/conversations/${id}`, {
        method: "DELETE",
      });

      setConversations((current) =>
        current.filter((item) => item.id !== id)
      );

      if (conversationId === id) {
        newConversation();
      }
    } catch (error) {
      console.error("Clarity delete error", error);
    }
  }

  async function askClarity() {
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage("");

    const updatedMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];

    setMessages(updatedMessages);
    setLoading(true);
    setStreaming(true);

    try {
      const res = await fetch("/api/clarity/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          history: updatedMessages,
          context: businessContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Clarity request failed");
      }

      const data = await res.json();

      console.log("Clarity response:", data);

      if (!data.answer && !data.message) {
        throw new Error("Clarity returned no answer");
      }

      if (data.metadata?.conversationId) {
        setConversationId(data.metadata.conversationId);

        localStorage.setItem(
          "clarity_conversation_id",
          data.metadata.conversationId
        );
      }

      const answer = String(
        data.answer || data.message || "Clarity could not generate a response."
      );

      let current = "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

      for (const character of answer) {
        current += character;

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: current,
          };
          return copy;
        });

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setStreaming(false);
      await loadConversations();
      await loadBrief();
    } catch (error) {
      console.error("Clarity error", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to Clarity. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Clarity AI assistant"
        className="fixed top-6 right-6 z-50 h-12 w-12 rounded-full bg-stone-900 text-white shadow-xl flex items-center justify-center hover:scale-105 transition"
      >
        <Sparkles size={18} />
      </button>

      {open && (
        <div className="fixed top-20 right-6 z-50 w-[420px] max-h-[700px] rounded-2xl border bg-white shadow-2xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-black text-sm">Clarity</h2>
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                AI Business Intelligence
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              aria-label="Close Clarity"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={newConversation}
              className="flex-1 flex items-center justify-center gap-2 text-xs border rounded-xl p-2"
            >
              <Plus size={14} /> New Chat
            </button>

            <button
              onClick={loadBrief}
              className="flex-1 text-xs border rounded-xl p-2"
            >
              {loadingBrief ? "Loading Brief..." : "CEO Brief"}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto mb-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className="flex items-center gap-2 text-[10px] border rounded-xl px-2 py-1 whitespace-nowrap"
              >
                <MessageSquare size={10} />
                {conversation.title}
                <Trash2
                  size={10}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 rounded-xl bg-[#faf9f6] p-3 min-h-[250px]">
            {brief && (
              <div className="mb-3 rounded-xl border bg-white p-3 text-xs">
                <p className="font-bold mb-2">Daily CEO Brief</p>
                <p className="mb-2">{brief.summary}</p>

                {brief.priorities?.map((item: string, index: number) => (
                  <p key={index}>• {item}</p>
                ))}
              </div>
            )}
            {messages.length === 0 ? (
              <p className="text-xs text-stone-400">
                Ask Clarity about sales, projects, customers, finance, calendar, tasks or business performance. Clarity understands your TOTS-OS data.
              </p>
            ) : (
              messages.map((item, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-xl text-xs whitespace-pre-line ${
                    item.role === "user"
                      ? "bg-stone-900 text-white"
                      : "bg-white border"
                  }`}
                >
                  {item.content}
                  {streaming && index === messages.length - 1 && "▌"}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 mt-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  askClarity();
                }
              }}
              placeholder="Ask Clarity anything about your business..."
              className="flex-1 rounded-xl border px-3 py-2 text-xs"
            />

            <button
              onClick={askClarity}
              disabled={loading}
              className="rounded-xl bg-stone-900 text-white px-3"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}