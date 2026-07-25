import { GoogleGenerativeAI } from "@google/generative-ai";

// 🧠 CLARITY AI - NEURAL ENGINE
export async function runClarity({ invoices, tasks, teamId, context = "dashboard" }: any) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback to hardcoded logic if AI isn't configured
    if (!apiKey) {
      console.warn("Neural Link Offline: Falling back to heuristic logic.");
      return generateHeuristicInsights(invoices, tasks, context);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare data for the AI brain
    const systemPrompt = `
      You are 'Clarity', a high-end personal assistant for a creative studio called 'The Organised Types'.
      Your tone is sophisticated, editorial, encouraging, and slightly witty. 
      Analyze the following business data and provide a concise 'Neural Insight'.
      
      Context: ${context}
      Data: ${JSON.stringify({ invoices, tasks })}
      
      Return JSON format: 
      { 
        "headline": "One catchy summary sentence", 
        "insights": ["3 specific bullet points"], 
        "actions": ["2 recommended actions"]
      }
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return JSON.parse(response.text());

  } catch (err) {
    console.error("Clarity Neural Error:", err);
    return generateHeuristicInsights(invoices, tasks, context);
  }
}

// 🧮 HEURISTIC FALLBACK (Your original logic)
export function generateHeuristicInsights(invoices: any[], tasks: any[], context: string) {
  const messages: string[] = [];
  const actions: string[] = [];
  const now = new Date();

  // (Your existing IF/ELSE logic goes here as a safety net)
  const unpaid = invoices.filter(i => i.status !== "paid");
  if (unpaid.length > 0) {
    messages.push("System synchronised. Payments are currently pending.");
    actions.push("Review ledger");
  }

  return {
    headline: messages[0] || "System operational.",
    insights: messages,
    actions: actions,
    persona: "Helpful PA"
  };
}

// ---------- 💬 CLARITY CHAT — conversational, free-text Q&A ----------
// Distinct from runClarity() above: that one returns a fixed
// headline/insights/actions JSON shape for the dashboard card. This one
// takes a user query + conversation history and returns a free-text answer
// grounded in the team's account data. Kept separate so nothing that
// depends on runClarity()'s JSON contract (e.g. /api/clarity/run) breaks.

export interface ClarityChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ClarityChatData {
  invoices: any[];
  tasks: any[];
  timesheets?: any[];
  posts?: any[];
  emails?: any[];
  members?: any[];
}

export async function runClarityChat({
  query,
  history = [],
  data,
  context = "chat",
}: {
  query: string;
  history?: ClarityChatHistoryItem[];
  data: ClarityChatData;
  context?: string;
}): Promise<{ answer: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("Neural Link Offline: Falling back to heuristic chat reply.");
      return { answer: generateHeuristicChatReply(query, data) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const systemPrompt = `
      You are 'Clarity', a high-end personal assistant for a creative studio called 'The Organised Types'.
      Your tone is sophisticated, editorial, encouraging, and slightly witty.
      Answer the user's question using the account data snapshot below. Reference specific
      numbers where relevant. If something isn't present in the data, say so plainly rather
      than guessing or inventing figures.

      Context: ${context}
      Account data snapshot: ${JSON.stringify(data)}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: history.slice(-10).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
    });

    const result = await chat.sendMessage(query);
    const response = await result.response;
    const answer = response.text();

    return { answer: answer || generateHeuristicChatReply(query, data) };
  } catch (err) {
    console.error("Clarity Chat Neural Error:", err);
    return { answer: generateHeuristicChatReply(query, data) };
  }
}

// 🧮 HEURISTIC CHAT FALLBACK — used if GEMINI_API_KEY is missing or the
// API call fails. Deliberately simple: a safety net, not a replacement.
export function generateHeuristicChatReply(query: string, data: ClarityChatData): string {
  const invoices = data.invoices || [];
  const tasks = data.tasks || [];

  const unpaid = invoices.filter((i) => i.status !== "paid");
  const outstanding = unpaid.reduce((s, i) => s + Number(i.amount || 0), 0);
  const openTasks = tasks.filter((t) => t.status !== "done");

  return (
    `I'm running on the heuristic fallback right now (the neural link is offline), so this is a ` +
    `basic snapshot rather than a direct answer to "${query}": ` +
    `${unpaid.length} unpaid invoice(s) totalling ${outstanding.toLocaleString()}, and ` +
    `${openTasks.length} open task(s). Once GEMINI_API_KEY is configured I can answer more precisely.`
  );
}