"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, MessageSquare, Layout, Send, 
  Bot, User, Layers, Zap, BrainCircuit, 
  Quote, ArrowLeft, MoreVertical, FolderPlus, Loader2, Menu, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };
type Chat = { id: string; title: string; messages: Message[] };
type Project = { id: string; name: string; clarity_chats: Chat[] };

export default function ClarityAIPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: pData } = await supabase
        .from('clarity_projects')
        .select('*, clarity_chats(*)')
        .order('created_at', { ascending: false });

      if (pData) {
        setProjects(pData);
        if (pData.length > 0) {
          setActiveProjectId(pData[0].id);
          if (pData[0].clarity_chats?.length > 0) {
            setActiveChatId(pData[0].clarity_chats[0].id);
          }
        }
      }
    };
    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!activeChatId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('clarity_messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
  }, [activeChatId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return;
    
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      alert("System Error: Gemini API Key is missing.");
      return;
    }

    const userText = input;
    setInput("");
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userMsg, error: userError } = await supabase
      .from('clarity_messages')
      .insert([{ chat_id: activeChatId, user_id: user.id, role: 'user', content: userText }])
      .select().single();

    if (userError) {
      setIsLoading(false);
      return;
    }

    setMessages(prev => [...prev, userMsg]);

    try {
      const history = messages
        .filter(m => m.content && (m.role === "user" || m.role === "assistant"))
        .map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

      const chatSession = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 1000 },
      });

      const result = await chatSession.sendMessage(userText);
      const response = await result.response;
      const botResponse = response.text();

      const { data: botMsg } = await supabase
        .from('clarity_messages')
        .insert([{ chat_id: activeChatId, user_id: user.id, role: 'assistant', content: botResponse }])
        .select().single();

      if (botMsg) setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Clarity AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfaf7] text-stone-900 overflow-hidden font-sans">
      
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -320 }} 
            animate={{ x: 0 }} 
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-stone-100 flex flex-col md:relative md:w-80"
          >
            <div className="p-6 md:p-8 border-b border-stone-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-stone-900 rounded-xl text-white"><BrainCircuit size={18}/></div>
                 <h1 className="font-serif italic text-xl md:text-2xl tracking-tight">Clarity AI</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-stone-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Projects</span>
                <button className="p-1 hover:bg-stone-50 rounded-lg text-[var(--brand-primary)]"><FolderPlus size={18}/></button>
              </div>

              {projects.map(p => (
                <div key={p.id} className="space-y-1">
                  <button 
                    onClick={() => setActiveProjectId(p.id)}
                    className={`w-full flex items-center justify-between p-3 md:p-4 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeProjectId === p.id ? 'bg-stone-900 text-white shadow-xl' : 'hover:bg-stone-50 text-stone-400'}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <Layers size={14} className={activeProjectId === p.id ? "text-[var(--brand-primary)]" : "opacity-20"} />
                  </button>

                  {activeProjectId === p.id && (
                    <div className="pl-4 pr-2 py-2 space-y-1">
                      {p.clarity_chats?.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => { setActiveChatId(chat.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                          className={`w-full text-left p-3 rounded-xl text-xs transition-all ${activeChatId === chat.id ? 'bg-[var(--brand-primary)]/10 text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare size={12} className="flex-shrink-0" />
                            <span className="truncate">{chat.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fcfaf7]">
        <header className="h-16 md:h-20 border-b border-stone-100 flex items-center justify-between px-4 md:px-8 bg-white/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-stone-100 rounded-xl">
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-xs md:text-sm font-serif italic text-stone-500 truncate">
              {projects.find(p => p.id === activeProjectId)?.name || "Clarity"}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-900 text-white rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest flex-shrink-0">
            <Zap size={10} className="text-[var(--brand-primary)] md:w-3 md:h-3" /> <span className="hidden xs:inline">Gemini 1.5</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-8 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 px-6 text-center">
               <Bot size={48} className="text-[var(--brand-primary)] md:w-16 md:h-16"/>
               <p className="font-serif italic text-xl md:text-2xl">Seeking a point of clarity?</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-10 pb-10">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 md:gap-6 ${m.role === 'assistant' ? 'bg-white p-4 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-stone-100 shadow-sm' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${m.role === 'assistant' ? 'bg-stone-900 text-white' : 'bg-[var(--brand-primary)] text-white'}`}>
                    {m.role === 'assistant' ? <Bot size={14} className="md:w-[18px]" /> : <User size={14} className="md:w-[18px]" />}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-xs md:text-sm leading-relaxed text-stone-700 whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 md:gap-6 animate-pulse">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-stone-200" />
                  <div className="flex-1 h-16 md:h-20 bg-white rounded-3xl" />
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <div className="p-4 md:p-12 border-t md:border-t-0 border-stone-100 bg-white md:bg-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className="relative bg-white border border-stone-200 rounded-[1.5rem] md:rounded-[2.5rem] p-1.5 md:p-2 flex items-end shadow-lg md:shadow-xl focus-within:border-[var(--brand-primary)] transition-colors">
               <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Describe bottleneck..."
                  className="flex-1 bg-transparent border-none outline-none py-3 md:py-5 px-4 md:px-6 text-xs md:text-sm font-medium resize-none max-h-32"
               />
               <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-3 md:p-5 bg-stone-900 text-white rounded-2xl md:rounded-[2rem] hover:bg-[var(--brand-primary)] transition-all disabled:opacity-20"
               >
                 {isLoading ? <Loader2 size={16} className="animate-spin md:w-5" /> : <Send size={16} className="md:w-5" />}
               </button>
            </div>
            <p className="mt-3 text-center text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] opacity-20">Clarity Protocol Engaged</p>
          </div>
        </div>
      </main>
    </div>
  );
}