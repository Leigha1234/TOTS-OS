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

interface RunClarityChatProps {
  query: string;
  history: ClarityChatHistoryItem[];
  context: string;
  data: any;
}

export async function runClarityChat({
  query,
  history,
  context,
  data,
}: RunClarityChatProps) {
  const businessContext = buildClarityContext(data);

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
If the user asks a general question unrelated to TOTS-OS, answer normally.
`,
    input: [
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: query,
      },
    ],
  });

  return {
    answer: response.output_text,
  };
}