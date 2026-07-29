import OpenAI from "openai";
import { claritySystem } from "./prompts";
import { buildClarityContext } from "./context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClarityChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface RunClarityChatProps {
  query?: string;
  history?: ClarityChatHistoryItem[];
  context?: string;
  data?: any;
  prompt?: string;
  teamId?: string;
}

export interface RunClarityProps {
  invoices?: any[];
  tasks?: any[];
  teamId?: string;
  query?: string;
  prompt?: string;
}

export async function runClarityChat({
  query = "",
  history = [],
  context = "",
  data = {},
  prompt,
  teamId,
}: RunClarityChatProps) {
  const businessContext = buildClarityContext({ ...data, teamId });

  const finalQuery = query || prompt || "Analyse this business data and provide useful insights.";

  const compactHistory = history.slice(-8);

  const response = await openai.responses.create({
    model: "gpt-5",
    reasoning: {
      effort: "low",
    },
    max_output_tokens: 1200,
    instructions: `
${claritySystem}

Current context:
${context}

Business intelligence:
${businessContext}

Use the business intelligence above when answering TOTS-OS questions.
Never invent information.
If data is unavailable, explicitly say so.
Use Markdown headings, bullet points and tables where appropriate.
Keep answers concise.
Where useful, finish with a short **Next actions** section.
`,
    input: [
      ...compactHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: finalQuery,
      },
    ],
  });

  const answer = response.output_text?.trim() || "I couldn't generate a response.";

  return {
    answer,
    usage: response.usage,
    id: response.id,
  };
}

export async function runClarity({
  invoices = [],
  tasks = [],
  teamId = "system",
  query,
  prompt,
}: RunClarityProps) {
  return runClarityChat({
    query: query || prompt || "Analyse this business data and provide useful insights.",
    history: [],
    context: `Team ID: ${teamId}`,
    teamId,
    data: {
      invoices,
      tasks,
      teamId,
    },
  });
}