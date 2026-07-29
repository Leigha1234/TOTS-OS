"use client";

import { useEffect, useState } from "react";
import { Bot, Send, Plus, MessageSquare, Sparkles, Search } from "lucide-react";

const quickPrompts = [
  "Show my sales performance",
  "Help me organise my workflow",
  "Analyse my business growth",
];

export default function ClarityPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Clarity. Your TOTS-OS business intelligence assistant. Ask questions about your operations, sales, projects, or workflows.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/clarity/conversations");
        if (!response.ok) return;

        const data = await response.json();
        setConversations(data.conversations || []);

        if (data.conversations?.length) {
          const latest = data.conversations[0];
          setConversationId(latest.id);
          setMessages(latest.messages || messages);
        }
      } catch (error) {
        console.error("Failed to load Clarity history:", error);
      }
    }

    loadConversations();
  }, []);

  async function sendMessage(text = input) {
    if (!text.trim() || loading) return;

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/clarity/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: updated,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Clarity request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message || data.response || data.error || "Clarity returned no response.",
        },
      ]);

      const saveResponse = await fetch("/api/clarity/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...updated, {
            role: "assistant",
            content: data.message || data.response || data.error || "Clarity returned no response.",
          }],
        }),
      });

      if (saveResponse.ok) {
        const saved = await saveResponse.json();
        if (saved.id) setConversationId(saved.id);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Unable to connect to Clarity right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-stone-900 text-white shadow-xl flex items-center justify-center"
      >
        <Sparkles size={18} />
      </button>

      {open && (
        <div className="fixed top-20 right-6 z-50 w-[380px] h-[600px] bg-[#fdfbf8] border border-stone-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <header className="h-14 px-6 flex items-center justify-between border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <h1 className="font-serif italic text-lg">Clarity</h1>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-stone-500 hover:text-stone-900"
              aria-label="Close Clarity"
            >
              ✕
            </button>
          </header>

          <section className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left bg-[#fdfbf8] border border-stone-200 rounded-2xl p-3 text-sm hover:border-stone-400 flex items-center gap-2"
                  >
                    <Search size={14} />
                    {prompt}
                  </button>
                ))}
              </div>

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[320px] bg-stone-900 text-white rounded-3xl p-4"
                      : "max-w-[320px] bg-[#fdfbf8] border border-stone-200 rounded-3xl p-4"
                  }
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {loading && (
                <div className="max-w-[320px] bg-[#fdfbf8] border border-stone-200 rounded-3xl p-4 text-sm text-stone-500">
                  Clarity is analysing...
                </div>
              )}
            </div>
          </section>

          <footer className="p-4 border-t border-stone-200">
            <div className="flex gap-2 bg-[#fdfbf8] rounded-2xl p-2 shadow-inner">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask Clarity about your business..."
                className="flex-1 bg-transparent outline-none px-4 text-sm"
              />
              <button
                onClick={() => sendMessage()}
                className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center"
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}