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