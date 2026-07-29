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

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message || data.response || "I could not process that request.",
        },
      ]);

      const saveResponse = await fetch("/api/clarity/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [...updated, {
            role: "assistant",
            content: data.message || data.response || "I could not process that request.",
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
    <div className="min-h-screen bg-[#ece5de] text-stone-900 flex">
      <aside className="hidden lg:flex w-80 flex-col border-r border-stone-200 bg-[#f8f4ef]/90 backdrop-blur-xl p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="font-serif italic text-2xl">Clarity</h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400">AI Business OS</p>
          </div>
        </div>

        <button className="flex items-center gap-3 rounded-2xl bg-stone-900 text-white px-5 py-4 font-bold text-sm">
          <Plus size={16} /> New Conversation
        </button>

        <div className="mt-10">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-4">Previous Chats</p>
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setConversationId(conversation.id);
                setMessages(conversation.messages || []);
              }}
              className="w-full text-left rounded-2xl bg-white/70 border border-stone-200 p-4 flex gap-3 items-center"
            >
              <MessageSquare size={15} />
              <span className="text-sm truncate">
                {conversation.title || "Previous conversation"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 px-8 flex items-center justify-between border-b border-stone-200 bg-[#fdfbf8]/80 backdrop-blur-xl">
          <div>
            <h2 className="font-serif italic text-3xl">Business Intelligence</h2>
            <p className="text-xs text-stone-500">Ask Clarity anything about your organisation</p>
          </div>
          <Bot className="text-stone-500" />
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)} className="text-left bg-[#fdfbf8] border border-stone-200 rounded-2xl p-4 text-sm hover:border-stone-400">
                  <Search size={14} className="mb-3" />
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "ml-auto max-w-3xl bg-stone-900 text-white rounded-3xl p-6" : "max-w-3xl bg-[#fdfbf8] border border-stone-200 rounded-3xl p-6"}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            ))}

            {loading && <div className="max-w-3xl bg-[#fdfbf8] border border-stone-200 rounded-3xl p-6 text-sm text-stone-500">Clarity is analysing...</div>}
          </div>
        </section>

        <footer className="p-8">
          <div className="max-w-4xl mx-auto flex gap-3 bg-[#fdfbf8] border border-stone-200 rounded-[2rem] p-3 shadow-xl">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask Clarity about your business..." className="flex-1 bg-transparent outline-none px-5 text-sm" />
            <button onClick={() => sendMessage()} className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center"><Send size={17} /></button>
          </div>
        </footer>
      </main>
    </div>
  );
}