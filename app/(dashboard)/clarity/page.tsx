"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, MessageSquare, Layout, Send, 
  Bot, User, Layers, Zap, BrainCircuit, 
  Quote, ArrowLeft, MoreVertical, FolderPlus, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr"; // Changed this
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };
type Chat = { id: string; title: string; messages: Message[] };
type Project = { id: string; name: string; clarity_chats: Chat[] };

export default function ClarityAIPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_KEY || ""
  );

  // --- STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH PROJECTS & CHATS ---
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

  // --- 2. FETCH MESSAGES WHEN CHAT CHANGES ---
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

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 3. ACTIONS ---
  const handleCreateProject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: newP } = await supabase
      .from('clarity_projects')
      .insert([{ user_id: user?.id, name: 'New Initiative' }])
      .select().single();

    if (newP) {
      const { data: newC } = await supabase
        .from('clarity_chats')
        .insert([{ project_id: newP.id, user_id: user?.id, title: 'Initial Strategy' }])
        .select().single();
      
      setProjects([{ ...newP, clarity_chats: [newC] }, ...projects]);
      setActiveProjectId(newP.id);
      setActiveChatId(newC.id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return;
    setIsLoading(true);
    const userText = input;
    setInput("");

    const { data: { user } } = await supabase.auth.getUser();

    // A. Save User Message
    const { data: userMsg } = await supabase
      .from('clarity_messages')
      .insert([{ chat_id: activeChatId, user_id: user?.id, role: 'user', content: userText }])
      .select().single();

    if (userMsg) setMessages(prev => [...prev, userMsg]);

    try {
      // B. Call Gemini
      // Provide context of the conversation
      const chatHistory = messages.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(userText);
      const botResponse = result.response.text();

      // C. Save Bot Message
      const { data: botMsg } = await supabase
        .from('clarity_messages')
        .insert([{ chat_id: activeChatId, user_id: user?.id, role: 'assistant', content: botResponse }])
        .select().single();

      if (botMsg) setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Gemini Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fcfaf7] text-stone-900 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
            className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-stone-100 flex flex-col md:relative"
          >
            <div className="p-8 border-b border-stone-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-stone-900 rounded-xl text-white"><BrainCircuit size={18}/></div>
                 <h1 className="font-serif italic text-2xl tracking-tight">Clarity AI</h1>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Projects</span>
                <button onClick={handleCreateProject} className="p-1 hover:bg-stone-50 rounded-lg text-[#a9b897]"><FolderPlus size={18}/></button>
              </div>

              {projects.map(p => (
                <div key={p.id} className="space-y-1">
                  <button 
                    onClick={() => setActiveProjectId(p.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeProjectId === p.id ? 'bg-stone-900 text-white shadow-xl' : 'hover:bg-stone-50 text-stone-400'}`}
                  >
                    <span className="truncate">{p.name}</span>
                    <Layers size={14} className={activeProjectId === p.id ? "text-[#a9b897]" : "opacity-20"} />
                  </button>

                  {activeProjectId === p.id && (
                    <div className="pl-4 pr-2 py-2 space-y-1">
                      {p.clarity_chats?.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => setActiveChatId(chat.id)}
                          className={`w-full text-left p-3 rounded-xl text-xs transition-all ${activeChatId === chat.id ? 'bg-[#a9b897]/10 text-stone-900 font-bold' : 'text-stone-400 hover:text-stone-600'}`}
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

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fcfaf7]">
        <header className="h-20 border-b border-stone-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-stone-100 rounded-xl"><Layout size={20}/></button>}
            <h2 className="text-sm font-serif italic text-stone-500">
              {projects.find(p => p.id === activeProjectId)?.name} / {messages.length > 0 ? "Active Session" : "New Consultation"}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
            <Zap size={12} className="text-[#a9b897]" /> Gemini 1.5 Pro
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30">
               <Bot size={64} className="text-[#a9b897]"/>
               <p className="font-serif italic text-2xl">Seeking a point of clarity?</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-10 pb-10">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-6 ${m.role === 'assistant' ? 'bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${m.role === 'assistant' ? 'bg-stone-900 text-white' : 'bg-[#a9b897] text-white'}`}>
                    {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm leading-relaxed text-stone-700">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-6 animate-pulse">
                  <div className="w-10 h-10 rounded-2xl bg-stone-200" />
                  <div className="flex-1 h-20 bg-white rounded-[2.5rem]" />
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <div className="p-8 md:p-12">
          <div className="max-w-3xl mx-auto relative group">
            <div className="relative bg-white border border-stone-200 rounded-[2.5rem] p-2 flex items-end shadow-xl">
               <textarea 
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Describe your bottleneck..."
                  className="flex-1 bg-transparent border-none outline-none py-5 px-6 text-sm font-medium resize-none"
               />
               <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="p-5 bg-stone-900 text-white rounded-[2rem] hover:bg-[#a9b897] transition-all disabled:opacity-20"
               >
                 {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
               </button>
            </div>
            <p className="mt-4 text-center text-[8px] font-black uppercase tracking-[0.5em] opacity-20">Clarity Protocol Engaged</p>
          </div>
        </div>
      </main>
    </div>
  );
}