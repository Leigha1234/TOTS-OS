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

  const response = await openai.responses.create({
    model: "gpt-5",
    instructions: `
${claritySystem}

Current context:
${context}

Business intelligence:
${businessContext}

Use the business intelligence above when answering TOTS-OS questions.
Do not invent information that is not provided.
`,
    input: [
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: finalQuery,
      },
    ],
  });

  return {
    answer: response.output_text,
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