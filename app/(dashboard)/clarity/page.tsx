"use client";

import { useEffect, useState } from "react";
import { Send, Plus, Sparkles, Search, X } from "lucide-react";

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

  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showPrompts, setShowPrompts] = useState(true);
  const messagesEndRef = useState<HTMLDivElement | null>(null)[0];

  async function loadConversationMessages(id: string) {
    try {
      const response = await fetch(`/api/clarity/conversations/${id}`);
      if (!response.ok) return;

      const data = await response.json();
      setMessages(data.messages || [
        {
          role: "assistant",
          content: "Welcome to Clarity. Your TOTS-OS business intelligence assistant. Ask questions about your operations, sales, projects, or workflows.",
        },
      ]);
    } catch (error) {
      console.error("Failed to load conversation messages:", error);
    }
  }

  async function loadConversations(selectLatest = false) {
    try {
      const response = await fetch("/api/clarity/conversations");
      if (!response.ok) return;

      const data = await response.json();
      const loaded = data.conversations || [];

      setConversations(loaded);

      if (selectLatest && loaded.length) {
        const latest = loaded[0];
        setConversationId(latest.id);
        await loadConversationMessages(latest.id);
      }
    } catch (error) {
      console.error("Failed to load Clarity history:", error);
    }
  }

  useEffect(() => {
    loadConversations(true);
  }, []);

  async function startNewConversation() {
    setConversationId(null);
    setMessages([
      {
        role: "assistant",
        content:
          "Welcome to Clarity. Your TOTS-OS business intelligence assistant. Ask questions about your operations, sales, projects, or workflows.",
      },
    ]);
    setShowPrompts(true);
    await loadConversations(false);
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/clarity/conversations/${id}`, { method: "DELETE" });
    setConversations((current) => current.filter((item) => item.id !== id));
    if (conversationId === id) startNewConversation();
  }

  async function renameConversation(id: string) {
    await fetch(`/api/clarity/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue }),
    });
    setConversations((current) => current.map((item) => item.id === id ? { ...item, title: renameValue } : item));
    setRenamingId(null);
  }

  async function sendMessage(text = input) {
    if (!text.trim() || loading) return;

    const updated = [...messages.slice(-10), { role: "user", content: text }];
    setMessages(updated);
    setShowPrompts(false);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/clarity/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          history: updated.slice(-10),
          conversationId,
        }),
      });

      const data = await response.json();

      console.log("CLARITY RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || "Clarity request failed");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer || data.message || data.response || data.content || data.reply || data.error || "Clarity did not return any text. Check the API response.",
        },
      ]);

      const saveResponse = await fetch("/api/clarity/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...updated, {
            role: "assistant",
            content: data.answer || data.message || data.response || data.content || data.reply || data.error || "Clarity did not return any text. Check the API response.",
          }],
          title: text.length > 40 ? `${text.slice(0, 40)}...` : text,
          pinned: false,
        }),
      });

      if (saveResponse.ok) {
        const saved = await saveResponse.json();
        if (saved.id) {
          setConversationId(saved.id);
        }
        await loadConversations(false);
      }
    } catch (error) {
      console.error("Clarity error:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Unable to connect to Clarity right now.",
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
        className="fixed top-6 right-6 z-50 w-14 h-14 rounded-full bg-stone-900 text-white shadow-xl flex items-center justify-center group"
      >
        <Sparkles size={18} />
        <span className="absolute right-16 hidden group-hover:block bg-stone-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
          Ask Clarity
        </span>
      </button>

      {open && (
        <div className="fixed top-20 right-6 z-50 w-[95vw] sm:w-[520px] h-[80vh] sm:h-[650px] bg-[#fdfbf8] border border-stone-200 rounded-3xl shadow-2xl flex overflow-hidden">
          <div className="w-44 border-r border-stone-200 p-3 flex flex-col gap-3">
            <button
              onClick={startNewConversation}
              className="w-full rounded-2xl bg-stone-900 text-white px-3 py-2 text-xs flex items-center gap-2"
            >
              <Plus size={14} /> New Chat
            </button>

            <div className="text-[10px] uppercase tracking-widest text-stone-400">
              Previous Chats
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="rounded-xl border border-stone-200 px-3 py-2 text-xs bg-transparent"
            />

            <div className="space-y-2 overflow-y-auto">
              {[...conversations]
                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                .filter((conversation) => (conversation.title || "Conversation").toLowerCase().includes(search.toLowerCase()))
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setConversationId(conversation.id);
                      loadConversationMessages(conversation.id);
                    }}
                    className={`w-full cursor-pointer text-left rounded-xl p-2 text-xs border ${conversation.id === conversationId ? "border-stone-900" : "border-stone-200"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {renamingId === conversation.id ? (
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && renameConversation(conversation.id)}
                          className="w-full text-xs bg-transparent"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{conversation.title || "Conversation"}</span>
                      )}
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setRenamingId(conversation.id); setRenameValue(conversation.title || ""); }}>Edit</button>
                        <button
                          onClick={async (e)=>{
                            e.stopPropagation();

                            const updatedPinned = !conversation.pinned;

                            await fetch(`/api/clarity/conversations/${conversation.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ pinned: updatedPinned }),
                            });

                            setConversations(curr => curr.map(item =>
                              item.id === conversation.id
                                ? { ...item, pinned: updatedPinned }
                                : item
                            ));
                          }}
                          className="text-xs"
                        >
                          📌
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteConversation(conversation.id); }}>×</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-auto pt-3 border-t border-stone-200 text-[10px] text-stone-400">
              Clarity AI • TOTS-OS
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <header className="h-14 px-6 flex items-center justify-between border-b border-stone-200">
              <div>
                <h1 className="font-semibold">Clarity</h1>
                <p className="text-xs text-stone-500">AI Business Assistant</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-stone-500 hover:text-stone-900"
                aria-label="Close Clarity"
              >
                <X size={16} />
              </button>
            </header>

            <section className="flex-1 overflow-y-auto p-4">
              {showPrompts && (
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
              )}

              <div className="space-y-4 pb-4">
                {messages.map((message: { role: string; content: string }, index) => (
                  <div
                    key={index}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[85%] shadow-sm bg-stone-900 text-white rounded-3xl p-4"
                        : "max-w-[85%] shadow-sm bg-[#fdfbf8] border border-stone-200 rounded-3xl p-4"
                    }
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}

                {loading && (
                  <div className="max-w-[320px] bg-[#fdfbf8] border border-stone-200 rounded-3xl p-4 text-sm text-stone-500">
                    Clarity is thinking...
                  </div>
                )}
                <div ref={(element) => {
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }} />
              </div>
            </section>

            <footer className="p-4 border-t border-stone-200">
              <div className="flex gap-2 bg-[#fdfbf8] rounded-2xl p-2 shadow-inner">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask Clarity anything about your business..."
                  className="flex-1 bg-transparent outline-none px-4 text-sm"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={17} />
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}